import type { GameState, StoryEntry, GameSettings, MechanicalIntent, AIResponsePayload, ArbiterDecision } from '../types';
import { generateActionResponseStream, harmonizeNarrative, summarizeStory } from './geminiService';
import { advanceGameTime } from '../utils/timeManager';
import { simulateWorldTurn } from './worldSimulator';
import * as questManager from '../utils/questManager';
import { addEntryToMemory, retrieveMemoryContext } from './memoryService';
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
    
    // --- GIAI ĐOẠN 0: CHUẨN BỊ, MÔ PHỎNG THẾ GIỚI & KÝ ỨC ---
    const { newState: stateAfterTime, newDay, notifications: timeNotifications } = advanceGameTime(gameState, apCost);
    timeNotifications.forEach(showNotification);
    
    let stateAfterSim = stateAfterTime;
    
    if (newDay) {
        showNotification("Một ngày mới bắt đầu...");
        const simResult = await simulateWorldTurn(stateAfterSim);
        stateAfterSim = simResult.newState;
        if (simResult.rumors.length > 0) {
             const rumorText = `[Thế Giới Vận Chuyển] ${simResult.rumors.map(r => r.text).join(' ')}`;
             // This needs to be added to the log later, as we don't have the final log yet.
             // For now, we'll just show a notification.
             showNotification(rumorText);
        }
    }

    const rawMemoryContext = await retrieveMemoryContext(text, stateAfterSim, currentSlotId);

    // --- GIAI ĐOẠN 1: GỌI AI HỢP NHẤT ---
    const stream = generateActionResponseStream(
        stateAfterSim, 
        text, 
        type, 
        rawMemoryContext, 
        settings
    );

    let fullResponseJsonString = '';
    for await (const chunk of stream) {
        if (abortSignal.aborted) throw new Error("Hành động đã bị hủy.");
        fullResponseJsonString += chunk;
        
        // Live streaming of the 'narrative' field
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
            
            // Basic unescaping for display
            const unescapedContent = content
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/\\\\/g, '\\');
            
            onStreamUpdate(unescapedContent);
        }
    }

    // --- GIAI ĐOẠN 2: PHÂN TÍCH & ÁP DỤNG KẾT QUẢ ---
    let aiPayload: AIResponsePayload;
    try {
        aiPayload = JSON.parse(fullResponseJsonString);
    } catch (e) {
        console.error("Lỗi phân tích JSON từ AI:", e, "\nNội dung JSON:", fullResponseJsonString);
        throw new Error("AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.");
    }
    
    const { validatedIntent, validationNotifications } = validateMechanicalChanges(aiPayload.mechanicalIntent, stateAfterSim);
    validationNotifications.forEach(showNotification);

    let finalState = applyMechanicalChanges(stateAfterSim, validatedIntent, showNotification);
    
    let finalNarrative = aiPayload.narrative;
    if (validationNotifications.length > 0) {
        finalNarrative = await harmonizeNarrative(aiPayload.narrative, validatedIntent, validationNotifications);
    }

    // Rebuild story log with final, non-pending entries
    finalState.storyLog = finalState.storyLog.filter(entry => !entry.isPending && !(entry.type === 'narrative' && entry.content === ''));
    
    const lastId = finalState.storyLog.length > 0 ? finalState.storyLog[finalState.storyLog.length - 1].id : 0;
    const playerActionEntry: StoryEntry = { id: lastId + 1, type: type === 'say' ? 'player-dialogue' : 'player-action', content: text };
    const narrativeEntryWithId: StoryEntry = { id: lastId + 2, type: 'narrative', content: finalNarrative, effects: validatedIntent };
    finalState.storyLog.push(playerActionEntry, narrativeEntryWithId);

    // Add new memory fragments for the events that just transpired
    await addEntryToMemory(playerActionEntry, finalState, currentSlotId);
    await addEntryToMemory(narrativeEntryWithId, finalState, currentSlotId);

    // --- GIAI ĐOẠN 3: XỬ LÝ HẬU KỲ & DỌN DẸP ---
    const finalQuestCheck = questManager.processQuestUpdates(finalState);
    finalQuestCheck.notifications.forEach(showNotification);
    let finalStateForSummary = finalQuestCheck.newState;

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