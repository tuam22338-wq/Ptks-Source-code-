import type { GameState, StoryEntry, GameSettings, MechanicalIntent, AIResponsePayload, ArbiterDecision } from '../types';
import { generateDualResponseStream, harmonizeNarrative, summarizeStory, generateNpcThoughtBubble, decideActionOutcome } from './geminiService';
import { advanceGameTime } from '../utils/timeManager';
import { simulateWorldTurn } from './worldSimulator';
import * as questManager from '../utils/questManager';
import { addEntryToMemory, retrieveAndSynthesizeMemory } from './memoryService';
import { validateMechanicalChanges } from './validationService';
import { applyMechanicalChanges } from './stateUpdateService';
import { runHeuristicFixer } from './heuristicFixerService';

export const processPlayerAction = async (
    gameState: GameState,
    text: string,
    type: 'say' | 'act',
    apCost: number,
    settings: GameSettings,
    showNotification: (message: string) => void,
    abortSignal: AbortController['signal'],
    currentSlotId: number,
    onStreamUpdate: (content: string) => void
): Promise<GameState> => {
    
    // --- GIAI ĐOẠN 0: CHUẨN BỊ & MÔ PHỎNG THẾ GIỚI ---
    const { newState: stateAfterTime, newDay, notifications: timeNotifications } = advanceGameTime(gameState, apCost);
    timeNotifications.forEach(showNotification);
    
    let stateAfterSim = stateAfterTime;
    let baseLogEntries: Omit<StoryEntry, 'id'>[] = [];
    
    if (newDay) {
        baseLogEntries.push({ type: 'system', content: `Một ngày mới đã bắt đầu: ${stateAfterSim.gameDate.season}, ngày ${stateAfterSim.gameDate.day}` });
        showNotification("Một ngày mới bắt đầu...");
        const simResult = await simulateWorldTurn(stateAfterSim);
        stateAfterSim = simResult.newState;
        if (simResult.rumors.length > 0) {
            baseLogEntries.push({ type: 'system-notification', content: `[Thế Giới Vận Chuyển] ${simResult.rumors.map(r => r.text).join(' ')}` });
        }
    }

    // --- GIAI ĐOẠN 0.2: KIỂM TRA GIÁN ĐOẠN NGẪU NHIÊN ---
    const WORLD_INTERRUPTION_CHANCE_MAP: Record<string, number> = {
        'none': 0,
        'rare': 0.10,
        'occasional': 0.25,
        'frequent': 0.50,
        'chaotic': 0.75
    };
    // FIX: Access worldInterruptionFrequency from gameState.gameplaySettings, not global settings.
    const chance = WORLD_INTERRUPTION_CHANCE_MAP[gameState.gameplaySettings.worldInterruptionFrequency] || 0.25;
    const isInterruption = Math.random() < chance;

    if (isInterruption) {
        showNotification("Thế giới biến động...");
    }

    // --- GIAI ĐOẠN 0.5: TƯ DUY NPC & TRUY XUẤT KÝ ỨC ---
    let thoughtBubble: string | undefined = undefined;
    const npcsHere = stateAfterSim.activeNpcs.filter(npc => npc.locationId === stateAfterSim.playerCharacter.currentLocationId);
    const targetNpc = npcsHere.find(npc => text.includes(npc.identity.name));

    if (targetNpc) {
        thoughtBubble = await generateNpcThoughtBubble(targetNpc, stateAfterSim, text);
    }
    
    const memoryContext = await retrieveAndSynthesizeMemory(text, stateAfterSim, currentSlotId);

    const arbiterDecision = await decideActionOutcome(stateAfterSim, text);

    // --- GIAI ĐOẠN 1: "Ý-HÌNH SONG SINH" ---
    const stream = generateDualResponseStream(
        stateAfterSim, 
        text, 
        type, 
        memoryContext, 
        settings, 
        arbiterDecision, 
        isInterruption,
        thoughtBubble
    );

    let fullResponseJsonString = '';
    for await (const chunk of stream) {
        if (abortSignal.aborted) throw new Error("Hành động đã bị hủy.");
        fullResponseJsonString += chunk;
        
        const narrativeKey = '"narrative": "';
        const startIndex = fullResponseJsonString.indexOf(narrativeKey);
        
        if (startIndex !== -1) {
            const contentStartIndex = startIndex + narrativeKey.length;
            let content = fullResponseJsonString.substring(contentStartIndex);
            
            const intentKey = '","mechanicalIntent":';
            const intentIndex = content.lastIndexOf(intentKey);
            if (intentIndex !== -1) {
                content = content.substring(0, intentIndex);
            }
            
            const unescapedContent = content
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
            
            onStreamUpdate(unescapedContent);
        }
    }

    let aiPayload: AIResponsePayload;
    try {
        aiPayload = JSON.parse(fullResponseJsonString);
    } catch (e) {
        console.error("Lỗi phân tích JSON từ AI:", e, "\nNội dung JSON:", fullResponseJsonString);
        throw new Error("AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.");
    }
    
    // --- GIAI ĐOẠN 2: "THIÊN ĐẠO GIÁM SÁT" ---
    const { validatedIntent, validationNotifications } = validateMechanicalChanges(aiPayload.mechanicalIntent, stateAfterSim);
    validationNotifications.forEach(showNotification);

    // --- GIAI ĐOẠN 3: "NGÔN-THỰC HỢP NHẤT" ---
    let finalState = applyMechanicalChanges(stateAfterSim, validatedIntent, showNotification);
    
    let finalNarrative = aiPayload.narrative;
    if (validationNotifications.length > 0) {
        finalNarrative = await harmonizeNarrative(aiPayload.narrative, validatedIntent, validationNotifications);
    }

    finalState.storyLog = finalState.storyLog.filter(entry => {
        // Remove the pending player action and the streaming placeholder
        return !entry.isPending && !(entry.type === 'narrative' && entry.content === '');
    });

    const finalNarrativeEntry: Omit<StoryEntry, 'id'> = { type: 'narrative', content: finalNarrative };
    
    const lastId = finalState.storyLog.length > 0 ? finalState.storyLog[finalState.storyLog.length - 1].id : 0;
    
    // Add back the resolved player action and the final AI narrative
    const playerActionEntry: StoryEntry = { id: lastId + 1, type: type === 'say' ? 'player-dialogue' : 'player-action', content: text };
    const narrativeEntryWithId: StoryEntry = { ...finalNarrativeEntry, id: lastId + 2 } as StoryEntry;

    finalState.storyLog.push(playerActionEntry, narrativeEntryWithId);

    // Add new memory fragments for the events that just transpired
    await addEntryToMemory(playerActionEntry, finalState, currentSlotId);
    await addEntryToMemory(narrativeEntryWithId, finalState, currentSlotId);

    // Post-processing
    const finalQuestCheck = questManager.processQuestUpdates(finalState);
    finalQuestCheck.notifications.forEach(showNotification);
    let finalStateForSummary = finalQuestCheck.newState;

    // --- GIAI ĐOẠN 4: THIÊN ĐẠO TRẬT TỰ GIÁM ---
    if (settings.enableHeuristicFixerAI) {
        try {
            const fixResult = await runHeuristicFixer(finalStateForSummary, currentSlotId);
            finalStateForSummary = fixResult.newState;
            fixResult.notifications.forEach(showNotification);
        } catch (error) {
            console.error("[Heuristic Fixer] Failed to run AI validation:", error);
            showNotification("[Hệ Thống] Thiên Đạo Trật Tự Giám gặp lỗi.");
        }
    }

    if (finalStateForSummary.storyLog.length > 0 && finalStateForSummary.storyLog.length % settings.autoSummaryFrequency === 0) {
        try {
            const summary = await summarizeStory(finalStateForSummary.storyLog, finalStateForSummary.playerCharacter);
            finalStateForSummary = { ...finalStateForSummary, storySummary: summary };
            showNotification("AI đã ghi nhớ lại các sự kiện gần đây.");
        } catch (error) {
            console.error("Tóm tắt cốt truyện thất bại:", error);
        }
    }
    
    return finalStateForSummary;
};