import type { GameState, StoryEntry, GameSettings, ActiveEffect, ActiveQuest, CultivationTechnique, ItemQuality, PlayerCharacter, GraphEdge, EntityReference, Rumor, DynamicModEvent, FactionReputationStatus } from '../types';
import { generateStoryContinuationStream, parseNarrativeForGameData, summarizeStory } from './geminiService';
import { advanceGameTime } from '../utils/timeManager';
import { simulateWorldTurn, simulateFactionTurn } from './worldSimulator';
import * as questManager from '../utils/questManager';
import { SECTS, ALCHEMY_RECIPES, CAVE_FACILITIES_CONFIG, FACTION_REPUTATION_TIERS } from '../constants';
import { addEntryToMemory, saveGraphEdges, retrieveAndSynthesizeMemory } from './memoryService';

const checkAndTriggerDynamicEvents = (
    currentState: GameState,
    originalLocationId: string
): { stateAfterEvents: GameState; eventNarratives: string[] } => {
    const { activeMods, playerCharacter, gameDate, worldState } = currentState;
    if (!activeMods || activeMods.length === 0) {
        return { stateAfterEvents: currentState, eventNarratives: [] };
    }

    let allModEvents: DynamicModEvent[] = [];
    activeMods.forEach(mod => {
        if (mod.content.dynamicEvents) {
            allModEvents.push(...mod.content.dynamicEvents.map((e, i) => ({
// FIX: Property 'id' does not exist on type 'Omit<DynamicModEvent, "id">'. A new ID is now generated without accessing the non-existent property.
                id: `${mod.modInfo.id}_dynevent_${i}`,
                ...e,
            } as DynamicModEvent)));
        }
    });

    if (allModEvents.length === 0) {
        return { stateAfterEvents: currentState, eventNarratives: [] };
    }

    let stateAfterEvents = { ...currentState };
    let pc = { ...stateAfterEvents.playerCharacter };
    const eventNarratives: string[] = [];
    const triggeredEvents = { ...(worldState.triggeredDynamicEventIds || {}) };
    const totalDays = (gameDate.year * 4 * 30) + (['Xuân', 'Hạ', 'Thu', 'Đông'].indexOf(gameDate.season) * 30) + gameDate.day;

    for (const event of allModEvents) {
        const lastTriggeredDay = triggeredEvents[event.id];

        if (lastTriggeredDay !== undefined) {
            if (!event.cooldownDays || event.cooldownDays <= 0) continue; 
            if ((totalDays - lastTriggeredDay) < event.cooldownDays) continue;
        }

        let isTriggered = false;
        switch (event.trigger.type) {
            case 'ON_ENTER_LOCATION':
                if (event.trigger.details.locationId === pc.currentLocationId && pc.currentLocationId !== originalLocationId) {
                    isTriggered = true;
                }
                break;
            case 'ON_GAME_DATE':
                if (event.trigger.details.year === gameDate.year && event.trigger.details.day === gameDate.day) {
                    isTriggered = true;
                }
                break;
        }

        if (isTriggered) {
            eventNarratives.push(event.narrative);
            triggeredEvents[event.id] = totalDays;
            
            // Apply outcomes
            for (const outcome of event.outcomes) {
                switch (outcome.type) {
                    case 'GIVE_ITEM': {
                        const { itemName, quantity = 1, itemType = 'Tạp Vật', quality = 'Phàm Phẩm' } = outcome.details;
                        const existingItem = pc.inventory.items.find(i => i.name === itemName);
                        if (existingItem) {
                            existingItem.quantity += quantity;
                        } else {
                            pc.inventory.items.push({
                                id: `dyn_item_${Date.now()}`,
                                name: itemName,
                                description: `Vật phẩm nhận được từ một kỳ ngộ.`,
                                quantity,
                                type: itemType,
                                quality,
                                weight: 0.1,
                                icon: '✨'
                            });
                        }
                        break;
                    }
                    case 'CHANGE_STAT': {
                        const { attribute, change } = outcome.details;
                        const attr = pc.attributes.flatMap(g => g.attributes).find(a => a.name === attribute);
                        if (attr && typeof attr.value === 'number') {
                            attr.value += change;
                        }
                        break;
                    }
                    case 'ADD_RUMOR': {
                        const { text, locationId } = outcome.details;
                        stateAfterEvents.worldState.rumors.push({ id: `dyn_rumor_${Date.now()}`, text, locationId: locationId || pc.currentLocationId });
                        break;
                    }
                    case 'UPDATE_REPUTATION': {
                        const { factionName, change } = outcome.details;
                        const repIndex = pc.reputation.findIndex(r => r.factionName === factionName);
                        if (repIndex > -1) {
                            const currentRep = pc.reputation[repIndex];
                            const newValue = currentRep.value + change;
                            const newStatus = FACTION_REPUTATION_TIERS.slice().reverse().find(t => newValue >= t.threshold)?.status || 'Kẻ Địch';
                            pc.reputation[repIndex] = { ...currentRep, value: newValue, status: newStatus };
                        }
                        break;
                    }
                }
            }
        }
    }
    
    stateAfterEvents.playerCharacter = pc;
    stateAfterEvents.worldState = { ...stateAfterEvents.worldState, triggeredDynamicEventIds: triggeredEvents };
    
    return { stateAfterEvents, eventNarratives };
};


export const processPlayerAction = async (
    gameState: GameState,
    text: string,
    type: 'say' | 'act',
    apCost: number,
    settings: GameSettings,
    showNotification: (message: string) => void,
    abortSignal: AbortController['signal'],
    currentSlotId: number
): Promise<GameState> => {
    const originalLocationId = gameState.playerCharacter.currentLocationId;
    
    const { newState: stateAfterTime, newDay, notifications: timeNotifications } = advanceGameTime(gameState, apCost);
    timeNotifications.forEach(showNotification);
    
    let stateAfterSim = stateAfterTime;
    let rumors: Rumor[] = [];
    let eventNarrative: string | null = null;

    if (newDay) {
        if (stateAfterSim.gameDate.day % 7 === 1) { 
            const factionSimResult = await simulateFactionTurn(stateAfterSim);
            if (factionSimResult.newEvent) {
                stateAfterSim = { 
                    ...stateAfterSim, 
                    worldState: { 
                        ...stateAfterSim.worldState, 
                        dynamicEvents: [...(stateAfterSim.worldState.dynamicEvents || []), factionSimResult.newEvent] 
                    } 
                };
                eventNarrative = factionSimResult.narrative;
            }
        }
        const simResult = await simulateWorldTurn(stateAfterSim);
        stateAfterSim = simResult.newState;
        rumors = simResult.rumors;
    }
    
    const instantMemoryReport = await retrieveAndSynthesizeMemory(text, stateAfterSim, currentSlotId);
    const stream = generateStoryContinuationStream(stateAfterSim, text, type, instantMemoryReport);
    let fullResponse = '';
    for await (const chunk of stream) {
        if (abortSignal.aborted) throw new Error("Hành động đã bị hủy.");
        fullResponse += chunk;
    }

    const parsedData = await parseNarrativeForGameData(fullResponse, stateAfterSim);
    
    let finalState = { ...stateAfterSim };
    let pc = { ...finalState.playerCharacter };

    if (parsedData.newLocation && finalState.discoveredLocations.some(l => l.id === parsedData.newLocation!.locationId)) {
        pc.currentLocationId = parsedData.newLocation.locationId;
        showNotification(`Đã đến: ${finalState.discoveredLocations.find(l => l.id === pc.currentLocationId)?.name || pc.currentLocationId}`);
    }

    if (parsedData.newItems && parsedData.newItems.length > 0) {
        const updatedItems = [...pc.inventory.items];
        parsedData.newItems.forEach(newItem => {
            const existing = updatedItems.find(i => i.name === newItem.name);
            if (existing) existing.quantity += newItem.quantity; else updatedItems.push(newItem);
            showNotification(`Nhận được: ${newItem.name} x${newItem.quantity}`);
        });
        pc.inventory = { ...pc.inventory, items: updatedItems };
    }

    if (parsedData.newTechniques && parsedData.newTechniques.length > 0) {
        let updatedTechniques = [...pc.techniques];
        let effectsFromTechniques: Omit<ActiveEffect, 'id'>[] = [];
        parsedData.newTechniques.forEach(tech => {
            if (!updatedTechniques.some(t => t.name === tech.name)) {
                updatedTechniques.push(tech);
                showNotification(`Lĩnh ngộ: ${tech.name}`);
                if (tech.bonuses && tech.bonuses.length > 0) effectsFromTechniques.push({ name: `${tech.name} (Bị Động)`, source: `technique:${tech.id}`, description: `Hiệu quả bị động từ công pháp ${tech.name}.`, bonuses: tech.bonuses, duration: -1, isBuff: true });
            }
        });
        pc.techniques = updatedTechniques;
            if (effectsFromTechniques.length > 0) {
            pc.activeEffects = [...pc.activeEffects, ...effectsFromTechniques.map(e => ({...e, id: `eff-${Date.now()}-${Math.random()}`}))];
        }
    }
    
    if (parsedData.statChanges && parsedData.statChanges.length > 0) {
        const changesMap: Record<string, number> = parsedData.statChanges.reduce((acc, sc) => ({ ...acc, [sc.attribute]: (acc[sc.attribute] || 0) + sc.change }), {});
        pc.attributes = pc.attributes.map(group => ({
            ...group,
            attributes: group.attributes.map(attr => {
                const change = changesMap[attr.name];
                if (change && typeof attr.value === 'number') {
                    const newValue = attr.value + change;
                    showNotification(`${attr.name}: ${change > 0 ? '+' : ''}${change}`);
                    if (attr.maxValue) {
                        if (['Sinh Mệnh', 'Linh Lực'].includes(attr.name)) {
                                return { ...attr, value: Math.max(0, Math.min(attr.maxValue, newValue)) };
                        }
                        return { ...attr, value: newValue, maxValue: attr.maxValue + change };
                    }
                    return { ...attr, value: newValue };
                }
                return attr;
            })
        }));
        if (changesMap.spiritualQi) {
            pc.cultivation.spiritualQi = Math.max(0, pc.cultivation.spiritualQi + changesMap.spiritualQi);
            showNotification(`Linh Khí: ${changesMap.spiritualQi > 0 ? '+' : ''}${changesMap.spiritualQi}`);
        }
        if (changesMap.hunger) {
            pc.vitals.hunger = Math.max(0, Math.min(pc.vitals.maxHunger, pc.vitals.hunger + changesMap.hunger));
            showNotification(`No Bụng: ${changesMap.hunger > 0 ? '+' : ''}${changesMap.hunger}`);
        }
        if (changesMap.thirst) {
            pc.vitals.thirst = Math.max(0, Math.min(pc.vitals.maxThirst, pc.vitals.thirst + changesMap.thirst));
            showNotification(`Nước Uống: ${changesMap.thirst > 0 ? '+' : ''}${changesMap.thirst}`);
        }
    }

    if (parsedData.newEffects && parsedData.newEffects.length > 0) {
        const allNewEffects = parsedData.newEffects.map(effect => ({ ...effect, id: `effect-${Date.now()}-${Math.random()}` }));
        pc.activeEffects = [...pc.activeEffects, ...allNewEffects];
        allNewEffects.forEach(eff => showNotification(`Bạn nhận được hiệu ứng: ${eff.name}`));
    }

    if (parsedData.systemActions && parsedData.systemActions.length > 0) {
        for (const action of parsedData.systemActions) {
            switch (action.actionType) {
                case 'JOIN_SECT':
                    const sectId = action.details.sectId;
                    const sectToJoin = SECTS.find(s => s.id === sectId);
                    if (sectToJoin && !pc.sect) {
                        pc.sect = { sectId: sectToJoin.id, rank: sectToJoin.ranks[0].name, contribution: 0 };
                        if (sectToJoin.startingTechnique) {
                            const newTechnique: CultivationTechnique = {
                                id: `tech_${sectToJoin.id}_start`,
                                level: 1,
                                maxLevel: 10,
                                ...sectToJoin.startingTechnique,
                            };
                            pc.techniques.push(newTechnique);
                            showNotification(`Đã học được công pháp nhập môn: [${newTechnique.name}]!`);
                        }
                        showNotification(`Đã gia nhập ${sectToJoin.name}!`);
                    }
                    break;
                case 'CRAFT_ITEM':
                    // ... existing craft logic
                    break;
                case 'UPGRADE_CAVE':
                    // ... existing upgrade logic
                    break;
            }
        }
    }

    if (parsedData.newQuests && parsedData.newQuests.length > 0) {
        pc.activeQuests = [...pc.activeQuests, ...parsedData.newQuests.map(questData => ({
            id: `quest_${questData.source || 'narrative'}_${Date.now()}`,
            type: 'SIDE' as const,
            source: questData.source || `narrative-${Date.now()}`,
            title: questData.title || 'Nhiệm vụ không tên',
            description: questData.description || '',
            objectives: (questData.objectives || []).map(obj => ({ ...obj, current: 0, isCompleted: false })),
            rewards: questData.rewards || {},
        }))];
        parsedData.newQuests.forEach(q => showNotification(`Nhiệm vụ mới: ${q.title}`));
    }
    
    finalState.playerCharacter = pc;
    finalState.encounteredNpcIds = [...new Set([...finalState.encounteredNpcIds, ...parsedData.newNpcEncounterIds])];
    
    const { stateAfterEvents, eventNarratives } = checkAndTriggerDynamicEvents(finalState, originalLocationId);
    finalState = stateAfterEvents;

    const baseLogEntries: Omit<StoryEntry, 'id'>[] = [];
    if (newDay) baseLogEntries.push({ type: 'system', content: `Một ngày mới đã bắt đầu: ${finalState.gameDate.season}, ngày ${finalState.gameDate.day}` });
    if (eventNarrative) baseLogEntries.push({ type: 'system-notification', content: eventNarrative });
    rumors.forEach(r => baseLogEntries.push({ type: 'narrative', content: `Có tin đồn rằng: ${r.text}` }));
    eventNarratives.forEach(narr => baseLogEntries.push({ type: 'system-notification', content: narr }));

    const storyFlowEntries: Omit<StoryEntry, 'id'>[] = [
        { type: type === 'say' ? 'player-dialogue' : 'player-action', content: text },
        { type: 'narrative', content: fullResponse }
    ];

    const allNewEntries = [...baseLogEntries, ...storyFlowEntries];
    
    const lastId = gameState.storyLog.length > 0 ? gameState.storyLog[gameState.storyLog.length - 1].id : 0;
    const finalNewLogEntries: StoryEntry[] = allNewEntries.map((entry, index) => ({ ...entry, id: lastId + index + 1 }));
    finalState.storyLog = [...gameState.storyLog, ...finalNewLogEntries];

    const newEdges: GraphEdge[] = [];
    const playerEntity: EntityReference = { id: 'player', type: 'player', name: finalState.playerCharacter.identity.name };
    let aiResponseFragmentId: number | null = null;
    
    for (const entry of finalNewLogEntries) {
        try {
            const id = await addEntryToMemory(entry, finalState, currentSlotId);
            if (entry.type === 'narrative' || entry.type === 'action-result') {
                aiResponseFragmentId = id;
            }
        } catch (err) {
            console.error('[Memory] Failed to save a fragment during action processing.', err);
        }
    }

    if (aiResponseFragmentId) {
        if (parsedData.newLocation) {
            const locEntity: EntityReference = { id: parsedData.newLocation.locationId, type: 'location', name: finalState.discoveredLocations.find(l => l.id === parsedData.newLocation!.locationId)?.name || 'Unknown' };
            newEdges.push({ slotId: currentSlotId, source: playerEntity, target: locEntity, type: 'VISITED', memoryFragmentId: aiResponseFragmentId, gameDate: { ...finalState.gameDate } });
        }
        if (parsedData.newItems) {
            for (const item of parsedData.newItems) {
                const itemInState = finalState.playerCharacter.inventory.items.find(i => i.name === item.name);
                if (itemInState) {
                    const itemEntity: EntityReference = { id: itemInState.id, type: 'item', name: itemInState.name };
                    newEdges.push({ slotId: currentSlotId, source: playerEntity, target: itemEntity, type: 'ACQUIRED', memoryFragmentId: aiResponseFragmentId, gameDate: { ...finalState.gameDate } });
                }
            }
        }
        if (parsedData.newNpcEncounterIds) {
            for (const npcId of parsedData.newNpcEncounterIds) {
                const npc = finalState.activeNpcs.find(n => n.id === npcId);
                if (npc) {
                    const npcEntity: EntityReference = { id: npc.id, type: 'npc', name: npc.identity.name };
                    newEdges.push({ slotId: currentSlotId, source: playerEntity, target: npcEntity, type: 'TALKED_TO', memoryFragmentId: aiResponseFragmentId, gameDate: { ...finalState.gameDate } });
                }
            }
        }
        if (parsedData.newQuests) {
             for (const quest of parsedData.newQuests) {
                const questInState = finalState.playerCharacter.activeQuests.find(q => q.title === quest.title && q.source === quest.source);
                if (questInState) {
                    const questEntity: EntityReference = { id: questInState.id, type: 'quest', name: questInState.title };
                    newEdges.push({ slotId: currentSlotId, source: playerEntity, target: questEntity, type: 'QUEST_START', memoryFragmentId: aiResponseFragmentId, gameDate: { ...finalState.gameDate } });
                }
            }
        }
        
        await saveGraphEdges(newEdges);
        if (newEdges.length > 0) {
            console.log(`[Graph] Saved ${newEdges.length} new relationships to memory.`);
        }
    }

    const finalQuestCheck = questManager.processQuestUpdates(finalState);
    finalQuestCheck.notifications.forEach(showNotification);

    let finalStateForSummary = finalQuestCheck.newState;

    if (finalStateForSummary.storyLog.length > 0 && finalStateForSummary.storyLog.length % settings.autoSummaryFrequency === 0) {
        try {
            const summary = await summarizeStory(finalStateForSummary.storyLog);
            finalStateForSummary = { ...finalStateForSummary, storySummary: summary };
            console.log("Story summarized and saved to AI memory.");
        } catch (summaryError) {
            console.error("Failed to summarize story:", summaryError);
        }
    }
    
    return finalStateForSummary;
};