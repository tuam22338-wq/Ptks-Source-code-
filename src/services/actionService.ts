import type { GameState, StoryEntry, GameSettings, ActiveEffect, ActiveQuest } from '../types';
import { generateStoryContinuationStream, parseNarrativeForGameData, summarizeStory } from './geminiService';
import { advanceGameTime } from '../utils/timeManager';
import { simulateWorldTurn, simulateFactionTurn } from './worldSimulator';
import * as questManager from '../utils/questManager';

export const processPlayerAction = async (
    gameState: GameState,
    text: string,
    type: 'say' | 'act',
    apCost: number,
    settings: GameSettings,
    showNotification: (message: string) => void,
    abortSignal: AbortController['signal']
): Promise<GameState> => {
    // This is essentially the logic from the old handleActionSubmit
    const { newState: stateAfterTime, newDay, notifications: timeNotifications } = advanceGameTime(gameState, apCost);
    timeNotifications.forEach(showNotification);
    
    let stateAfterSim = stateAfterTime;
    let rumors: { text: string }[] = [];
    if (newDay) {
        if (stateAfterSim.gameDate.day % 7 === 1) {
            const { newEvent } = await simulateFactionTurn(stateAfterSim);
            if (newEvent) {
                stateAfterSim = { ...stateAfterSim, worldState: { ...stateAfterSim.worldState, dynamicEvents: [...(stateAfterSim.worldState.dynamicEvents || []), newEvent] } };
            }
        }
        const simResult = await simulateWorldTurn(stateAfterSim);
        stateAfterSim = simResult.newState;
        rumors = simResult.rumors;
    }
    
    const stream = generateStoryContinuationStream(stateAfterSim, text, type);
    let fullResponse = '';
    for await (const chunk of stream) {
        if (abortSignal.aborted) {
             throw new Error("Hành động đã bị hủy.");
        };
        fullResponse += chunk;
    }

    const parsedData = await parseNarrativeForGameData(fullResponse, stateAfterSim);
    
    let finalState = { ...stateAfterSim };
    let pc = { ...finalState.playerCharacter };

    // Apply parsed items
    if (parsedData.newItems && parsedData.newItems.length > 0) {
        const updatedItems = [...pc.inventory.items];
        parsedData.newItems.forEach(newItem => {
            const existing = updatedItems.find(i => i.name === newItem.name);
            if (existing) existing.quantity += newItem.quantity; else updatedItems.push(newItem);
            showNotification(`Nhận được: ${newItem.name} x${newItem.quantity}`);
        });
        pc.inventory = { ...pc.inventory, items: updatedItems };
    }

    // Apply parsed techniques
    if (parsedData.newTechniques && parsedData.newTechniques.length > 0) {
        let updatedTechniques = [...pc.auxiliaryTechniques];
        let effectsFromTechniques: ActiveEffect[] = [];
        parsedData.newTechniques.forEach(tech => {
            if (!updatedTechniques.some(t => t.name === tech.name)) {
                updatedTechniques.push(tech);
                showNotification(`Lĩnh ngộ: ${tech.name}`);
                if (tech.bonuses) effectsFromTechniques.push({ id: `tech-passive-${tech.id}`, name: `${tech.name} (Bị Động)`, source: `technique:${tech.id}`, description: `Hiệu quả bị động từ công pháp ${tech.name}.`, bonuses: tech.bonuses, duration: -1, isBuff: true });
            }
        });
        pc.auxiliaryTechniques = updatedTechniques;
            if (effectsFromTechniques.length > 0) {
            pc.activeEffects = [...pc.activeEffects, ...effectsFromTechniques];
        }
    }
    
    // Apply parsed stat changes
    if (parsedData.statChanges && parsedData.statChanges.length > 0) {
        const changesMap = parsedData.statChanges.reduce((acc, sc) => ({ ...acc, [sc.attribute]: sc.change }), {} as Record<string, number>);
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

    // Apply parsed effects
    if (parsedData.newEffects && parsedData.newEffects.length > 0) {
        const allNewEffects = parsedData.newEffects.map(effect => ({ ...effect, id: `effect-${Date.now()}-${Math.random()}` }));
        pc.activeEffects = [...pc.activeEffects, ...allNewEffects];
        allNewEffects.forEach(eff => showNotification(`Bạn nhận được hiệu ứng: ${eff.name}`));
    }

    // Apply parsed quests
    if (parsedData.newQuests && parsedData.newQuests.length > 0) {
        pc.activeQuests = [...pc.activeQuests, ...parsedData.newQuests.map(questData => ({
            id: `quest_${questData.source || 'narrative'}_${Date.now()}`,
            // FIX: Use 'as const' to ensure TypeScript infers the literal type, not a generic string.
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
    
    const playerActionEntry: StoryEntry = { id: 0, type: type === 'say' ? 'player-dialogue' : 'player-action', content: text };
    const newLogEntries: StoryEntry[] = [playerActionEntry];

    if (newDay) newLogEntries.push({ id: 0, type: 'system', content: `Một ngày mới đã bắt đầu: ${finalState.gameDate.season}, ngày ${finalState.gameDate.day}` });
    rumors.forEach(r => newLogEntries.push({ id: 0, type: 'narrative', content: `Có tin đồn rằng: ${r.text}` }));
    newLogEntries.push({ id: 0, type: 'narrative', content: fullResponse });
    
    const lastId = gameState.storyLog.length > 0 ? gameState.storyLog[gameState.storyLog.length - 1].id : 0;
    finalState.storyLog = [...gameState.storyLog, ...newLogEntries.map((entry, index) => ({ ...entry, id: lastId + index + 1 }))];

    const finalQuestCheck = await questManager.processQuestUpdates(finalState, newDay);
    finalQuestCheck.notifications.forEach(showNotification);

    let finalStateForSummary = finalQuestCheck.newState;

    // Auto-summary logic
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