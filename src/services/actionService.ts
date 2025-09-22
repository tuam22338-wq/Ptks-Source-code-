
import type { GameState, StoryEntry, GameSettings, ActiveEffect, ActiveQuest, CultivationTechnique, ItemQuality, PlayerCharacter, GraphEdge, EntityReference, Rumor, DynamicModEvent, FactionReputationStatus, StatBonus, CharacterAttributes, PhapBaoRank } from '../types';
import { generateStoryContinuationStream, parseNarrativeForGameData, summarizeStory } from './geminiService';
import { advanceGameTime } from '../utils/timeManager';
import { simulateWorldTurn, simulateFactionTurn } from './worldSimulator';
import * as questManager from '../utils/questManager';
import { SECTS, ALCHEMY_RECIPES, CAVE_FACILITIES_CONFIG, FACTION_REPUTATION_TIERS, DEFAULT_ATTRIBUTE_DEFINITIONS, RANK_ORDER, QUALITY_ORDER, REALM_RANK_CAPS } from '../constants';
import { addEntryToMemory, retrieveAndSynthesizeMemory } from './memoryService';
import { calculateDerivedStats } from '../utils/statCalculator';

const nameToIdMap = new Map<string, string>();
DEFAULT_ATTRIBUTE_DEFINITIONS.forEach(def => {
    nameToIdMap.set(def.name, def.id);
});

const applyBonusesToAttributes = (
    currentAttributes: CharacterAttributes, 
    bonuses: StatBonus[]
): CharacterAttributes => {
    const newAttributes = JSON.parse(JSON.stringify(currentAttributes));
    
    bonuses.forEach(bonus => {
        const attributeId = nameToIdMap.get(bonus.attribute);
        if (attributeId && newAttributes[attributeId]) {
            newAttributes[attributeId].value += bonus.value;
            if (newAttributes[attributeId].maxValue !== undefined) {
                const newMaxValue = newAttributes[attributeId].maxValue + bonus.value;
                newAttributes[attributeId].maxValue = newMaxValue;
                 if (['sinh_menh', 'linh_luc'].includes(attributeId)) {
                    newAttributes[attributeId].value = newMaxValue;
                }
            }
        }
    });
    return newAttributes;
};


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
// FIX: Property 'id' does not exist on type 'Omit<DynamicModEvent, "id">'. A new ID is now generated without accessing the non-existent property.
            allModEvents.push(...mod.content.dynamicEvents.map((e, i) => ({
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
                        // ... implementation
                        break;
                    }
                    case 'CHANGE_STAT': {
                        const { attribute, change } = outcome.details;
                        const attributeId = nameToIdMap.get(attribute);
                        if(attributeId && pc.attributes[attributeId]) {
                             pc.attributes[attributeId].value += change;
                        }
                        break;
                    }
                    case 'ADD_RUMOR': {
                       // ... implementation
                        break;
                    }
                    case 'UPDATE_REPUTATION': {
                       // ... implementation
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


/**
 * Pillar 3: The Mechanical Filter
 * Post-processes data from the AI parser to ensure game balance.
 * It caps item/technique ranks and stat gains based on the player's current realm.
 * This acts as a "Heavenly Dao" that prevents the player from becoming overpowered too quickly.
 */
const validateAndCapParsedData = (
    parsedData: any, // Use `any` for the parsed result for flexibility
    gameState: GameState
): { cappedData: any, notifications: string[] } => {
    const cappedData = JSON.parse(JSON.stringify(parsedData));
    const notifications: string[] = [];
    const { playerCharacter, realmSystem } = gameState;
    const playerRealmId = playerCharacter.cultivation.currentRealmId;

    const caps = REALM_RANK_CAPS[playerRealmId];
    if (caps) {
        const maxRankIndex = RANK_ORDER.indexOf(caps.maxRank);
        const maxQualityIndex = QUALITY_ORDER.indexOf(caps.maxQuality);

        if (cappedData.newItems) {
            cappedData.newItems.forEach((item: any) => {
                const currentQualityIndex = QUALITY_ORDER.indexOf(item.quality);
                if (currentQualityIndex > maxQualityIndex) {
                    const originalQuality = item.quality;
                    item.quality = caps.maxQuality;
                    notifications.push(`[Thiên Cơ]: Vật phẩm "${item.name}" (${originalQuality}) ẩn chứa sức mạnh kinh người, nhưng với cảnh giới hiện tại, bạn chỉ có thể cảm nhận được uy lực ở mức ${caps.maxQuality}.`);
                }
            });
        }

        if (cappedData.newTechniques) {
            cappedData.newTechniques.forEach((tech: any) => {
                const currentRankIndex = RANK_ORDER.indexOf(tech.rank);
                if (currentRankIndex > maxRankIndex) {
                    const originalRank = tech.rank;
                    tech.rank = caps.maxRank;
                    notifications.push(`[Thiên Cơ]: Công pháp "${tech.name}" (${originalRank}) quá cao thâm. Bạn cố gắng lĩnh ngộ nhưng chỉ có thể nắm được những huyền ảo ở tầng thứ ${caps.maxRank}.`);
                }
            });
        }
    }

    if (cappedData.statChanges) {
        const realm = realmSystem.find(r => r.id === playerRealmId);
        const currentStageIndex = realm?.stages.findIndex(s => s.id === playerCharacter.cultivation.currentStageId);
        
        // Define a reasonable cap for spiritualQi gain, e.g., 30% of the Qi needed for the next level-up
        let qiCap = 5000; // Default cap
        if (realm && currentStageIndex !== undefined && currentStageIndex < realm.stages.length - 1) {
            const currentStage = realm.stages[currentStageIndex];
            const nextStage = realm.stages[currentStageIndex + 1];
            const qiToNext = nextStage.qiRequired - currentStage.qiRequired;
            qiCap = Math.max(5000, Math.floor(qiToNext * 0.3));
        }

        cappedData.statChanges.forEach((change: any) => {
            const attrDef = DEFAULT_ATTRIBUTE_DEFINITIONS.find(def => def.id === change.attribute);
            if (change.attribute === 'spiritualQi' && change.change > qiCap) {
                const originalChange = change.change;
                change.change = qiCap;
                notifications.push(`[Thiên Cơ]: Luồng linh khí thu được (${originalChange.toLocaleString()}) quá hùng hậu. Kinh mạch của bạn chỉ có thể chịu được ${change.change.toLocaleString()} điểm, phần còn lại đã tiêu tán.`);
            } else if (attrDef && attrDef.type === 'PRIMARY' && change.change > 3) {
                 const originalChange = change.change;
                change.change = 3;
                notifications.push(`[Thiên Cơ]: Cơ thể bạn được một luồng năng lượng kỳ lạ gột rửa, ${attrDef.name} tăng lên. Tuy nhiên, do căn cơ chưa vững, bạn chỉ hấp thụ được ${change.change} điểm (nguyên gốc ${originalChange}).`);
            }
        });
    }

    return { cappedData, notifications };
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
    let baseLogEntries: Omit<StoryEntry, 'id'>[] = [];
    
    if (newDay) {
        baseLogEntries.push({ type: 'system', content: `Một ngày mới đã bắt đầu: ${stateAfterSim.gameDate.season}, ngày ${stateAfterSim.gameDate.day}` });
        showNotification("Một ngày mới bắt đầu...");
        
        try {
            console.log("[ActionService] Simulating world turn for new day...");
            const simResult = await simulateWorldTurn(stateAfterSim);
            stateAfterSim = simResult.newState;
            rumors = simResult.rumors;
            if (rumors.length > 0) {
                 baseLogEntries.push({ type: 'system-notification', content: `[Thế Giới Vận Chuyển] ${rumors.map(r => r.text).join(' ')}` });
            }
        } catch(e) {
            console.error("World simulation failed:", e);
        }
    }
    
    const instantMemoryReport = await retrieveAndSynthesizeMemory(text, stateAfterSim, currentSlotId);

    const stream = generateStoryContinuationStream(stateAfterSim, text, type, instantMemoryReport, settings);
    let fullResponse = '';
    for await (const chunk of stream) {
        if (abortSignal.aborted) throw new Error("Hành động đã bị hủy.");
        fullResponse += chunk;
    }

    const rawParsedData = await parseNarrativeForGameData(fullResponse, stateAfterSim);
    const { cappedData: parsedData, notifications: cappingNotifications } = validateAndCapParsedData(rawParsedData, stateAfterSim);
    cappingNotifications.forEach(showNotification);
    
    let finalState = { ...stateAfterSim };
    let pc = { ...finalState.playerCharacter };

    if (parsedData.newLocation && finalState.discoveredLocations.some(l => l.id === parsedData.newLocation!.locationId)) {
        pc.currentLocationId = parsedData.newLocation.locationId;
        showNotification(`Đã đến: ${finalState.discoveredLocations.find(l => l.id === pc.currentLocationId)?.name || pc.currentLocationId}`);
    }

    if (parsedData.newItems && parsedData.newItems.length > 0) {
        // ... item logic
    }

    if (parsedData.newTechniques && parsedData.newTechniques.length > 0) {
        let updatedTechniques = [...pc.techniques];
        parsedData.newTechniques.forEach(tech => {
            if (!updatedTechniques.some(t => t.name === tech.name)) {
                updatedTechniques.push(tech);
                showNotification(`Lĩnh ngộ: ${tech.name}`);
                if (tech.bonuses && tech.bonuses.length > 0 && (tech.type === 'Tâm Pháp' || tech.type === 'Luyện Thể')) {
                    pc.attributes = applyBonusesToAttributes(pc.attributes, tech.bonuses);
                    showNotification(`Thuộc tính được tăng cường vĩnh viễn từ ${tech.name}!`);
                }
            }
        });
        pc.techniques = updatedTechniques;
    }
    
    if (parsedData.statChanges && parsedData.statChanges.length > 0) {
        const changesMap: Record<string, number> = parsedData.statChanges.reduce((acc, sc) => ({ ...acc, [sc.attribute]: (acc[sc.attribute] || 0) + sc.change }), {});
        const newAttributes = { ...pc.attributes };

        Object.entries(changesMap).forEach(([attrId, change]) => {
            const attrDef = finalState.attributeSystem.definitions.find(def => def.id === attrId);
            if (newAttributes[attrId]) {
                const attr = newAttributes[attrId];
                const newValue = attr.value + change;

                showNotification(`${attrDef?.name || attrId}: ${change > 0 ? '+' : ''}${change}`);
                
                if (attr.maxValue !== undefined) {
                    if (['sinh_menh', 'linh_luc'].includes(attrId)) {
                        if (change > 0 && newValue > attr.maxValue) {
                            attr.value = newValue;
                            attr.maxValue = newValue;
                        } else {
                            attr.value = Math.max(0, Math.min(attr.maxValue, newValue));
                        }
                    } else {
                         attr.value = newValue;
                         attr.maxValue += change;
                    }
                } else {
                    attr.value = newValue;
                }
            } else if (attrId === 'spiritualQi') {
                 pc.cultivation.spiritualQi = Math.max(0, pc.cultivation.spiritualQi + change);
                 showNotification(`Linh Khí: ${change > 0 ? '+' : ''}${change}`);
            } else if (attrId === 'hunger') {
                pc.vitals.hunger = Math.max(0, Math.min(pc.vitals.maxHunger, pc.vitals.hunger + change));
                showNotification(`No Bụng: ${change > 0 ? '+' : ''}${change}`);
            } else if (attrId === 'thirst') {
                pc.vitals.thirst = Math.max(0, Math.min(pc.vitals.maxThirst, pc.vitals.thirst + change));
                showNotification(`Nước Uống: ${change > 0 ? '+' : ''}${change}`);
            }
        });
        pc.attributes = newAttributes;
    }
    
    // Recalculate derived stats after all primary stats have been changed.
    pc.attributes = calculateDerivedStats(pc.attributes, finalState.attributeSystem.definitions);

    // ... [rest of the function] ...
    
    finalState.playerCharacter = pc;
    finalState.encounteredNpcIds = [...new Set([...finalState.encounteredNpcIds, ...parsedData.newNpcEncounterIds])];
    
    const { stateAfterEvents, eventNarratives } = checkAndTriggerDynamicEvents(finalState, originalLocationId);
    finalState = stateAfterEvents;

    const storyFlowEntries: Omit<StoryEntry, 'id'>[] = [
        { type: type === 'say' ? 'player-dialogue' : 'player-action', content: text },
        { type: 'narrative', content: fullResponse }
    ];

    const allNewEntries = [...baseLogEntries, ...storyFlowEntries];
    
    const lastId = gameState.storyLog.length > 0 ? gameState.storyLog[gameState.storyLog.length - 1].id : 0;
    const finalNewLogEntries: StoryEntry[] = allNewEntries.map((entry, index) => ({ ...entry, id: lastId + index + 1 }));
    finalState.storyLog = [...gameState.storyLog, ...finalNewLogEntries];

    // --- NEW: Post-narrative memory processing ---
    for (const entry of finalNewLogEntries) {
        await addEntryToMemory(entry, finalState, currentSlotId);
        // In a more complex system, we'd also generate and save graph edges here.
    }
    // --- End memory processing ---

    const finalQuestCheck = questManager.processQuestUpdates(finalState);
    finalQuestCheck.notifications.forEach(showNotification);

    let finalStateForSummary = finalQuestCheck.newState;

    if (finalStateForSummary.storyLog.length > 0 && finalStateForSummary.storyLog.length % settings.autoSummaryFrequency === 0) {
        // ... summary logic ...
    }
    
    return finalStateForSummary;
};
