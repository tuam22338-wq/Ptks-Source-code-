import type { GameState, StoryEntry, GameSettings, MechanicalIntent, AIResponsePayload } from '../types';
import { generateDualResponseStream, harmonizeNarrative, summarizeStory } from './geminiService';
import { advanceGameTime } from '../utils/timeManager';
import { simulateWorldTurn } from './worldSimulator';
import * as questManager from '../utils/questManager';
import { addEntryToMemory } from './memoryService';
import { orchestrateRagQuery } from './ragOrchestrator';
import { validateMechanicalChanges } from './validationService';
import { applyMechanicalChanges } from './stateUpdateService';

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
    
    const instantMemoryReport = await orchestrateRagQuery(text, type, stateAfterSim);
    const playerActionEntry: Omit<StoryEntry, 'id'> = { type: type === 'say' ? 'player-dialogue' : 'player-action', content: text };
    
    // --- GIAI ĐOẠN 1: "Ý-HÌNH SONG SINH" ---
    const stream = generateDualResponseStream(stateAfterSim, text, type, instantMemoryReport, settings);
    let fullResponseJsonString = '';
    for await (const chunk of stream) {
        if (abortSignal.aborted) throw new Error("Hành động đã bị hủy.");
        fullResponseJsonString += chunk;
    }

    let aiPayload: AIResponsePayload;
    try {
        aiPayload = JSON.parse(fullResponseJsonString);
    } catch (e) {
        console.error("Lỗi phân tích JSON từ AI:", e, "\nNội dung JSON:", fullResponseJsonString);
        throw new Error("AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.");
    }
    
    // --- GIAI ĐOẠN 2: "THIÊN ĐẠO GIÁM SÁT" ---
    // The AI's proposed mechanical changes are now validated.
    const { validatedIntent, validationNotifications } = validateMechanicalChanges(aiPayload.mechanicalIntent, stateAfterSim);
    validationNotifications.forEach(showNotification);

    // --- GIAI ĐOẠN 3: "NGÔN-THỰC HỢP NHẤT" ---
    // The validated mechanical changes are applied to the state.
    let finalState = applyMechanicalChanges(stateAfterSim, validatedIntent, showNotification);
    
    let finalNarrative = aiPayload.narrative;
    if (validationNotifications.length > 0) { // If there were changes, harmonize the narrative
        finalNarrative = await harmonizeNarrative(aiPayload.narrative, validatedIntent, validationNotifications);
    }

    const narrativeEntry: Omit<StoryEntry, 'id'> = { type: 'narrative', content: finalNarrative };

    // --- CẬP NHẬT TRẠNG THÁI CUỐI CÙNG ---
    const allNewEntries = [...baseLogEntries, playerActionEntry, narrativeEntry];
    const lastId = gameState.storyLog.length > 0 ? gameState.storyLog[gameState.storyLog.length - 1].id : 0;
    const finalNewLogEntries: StoryEntry[] = allNewEntries.map((entry, index) => ({ ...entry, id: lastId + index + 1 }));
    finalState.storyLog = [...gameState.storyLog, ...finalNewLogEntries];

    for (const entry of finalNewLogEntries) {
        await addEntryToMemory(entry, finalState, currentSlotId);
    }

    const finalQuestCheck = questManager.processQuestUpdates(finalState);
    finalQuestCheck.notifications.forEach(showNotification);
    let finalStateForSummary = finalQuestCheck.newState;

    // Tự động tóm tắt nếu cần
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
