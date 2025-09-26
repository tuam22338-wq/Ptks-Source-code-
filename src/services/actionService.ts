import type { GameState, StoryEntry, GameSettings, MechanicalIntent, AIResponsePayload, ArbiterDecision } from '../types';
import { generateDualResponseStream, harmonizeNarrative, summarizeStory, generateNpcThoughtBubble, decideActionOutcome } from './geminiService';
import { advanceGameTime } from '../utils/timeManager';
import { simulateWorldTurn } from './worldSimulator';
import * as questManager from '../utils/questManager';
import { addEntryToMemory, retrieveAndSynthesizeMemory } from './memoryService';
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

    // --- GIAI ĐOẠN 0.5: TƯ DUY NPC & TRUY XUẤT KÝ ỨC ---
    let thoughtBubble: string | undefined = undefined;
    const npcsHere = stateAfterSim.activeNpcs.filter(npc => npc.locationId === stateAfterSim.playerCharacter.currentLocationId);
    const targetNpc = npcsHere.find(npc => text.includes(npc.identity.name));

    if (targetNpc) {
        thoughtBubble = await generateNpcThoughtBubble(targetNpc, stateAfterSim, text);
    }
    
    // NEW STEP 1: Retrieve personalized memories (RAG) for the current save slot
    const memoryContext = await retrieveAndSynthesizeMemory(text, stateAfterSim, currentSlotId);

    // NEW STEP 2: Get Arbiter's logical decision
    const arbiterDecision = await decideActionOutcome(stateAfterSim, text);

    const playerActionEntry: Omit<StoryEntry, 'id'> = { type: type === 'say' ? 'player-dialogue' : 'player-action', content: text };
    
    // --- GIAI ĐOẠN 1: "Ý-HÌNH SONG SINH" ---
    // NEW STEP 3: Pass new context (arbiter's decision & memories) to the narrator
    const stream = generateDualResponseStream(stateAfterSim, text, type, memoryContext, settings, arbiterDecision, thoughtBubble);

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
    
    // --- GIAI ĐOẠN 1.5: ĐIỀU CHỈNH CỦA HỆ THỐNG ---
    // If the action was a breakthrough, override AI's realm/stage change to ensure correctness.
    if (text.includes("đột phá")) {
        const { playerCharacter, realmSystem } = stateAfterSim;
        const currentRealm = realmSystem.find(r => r.id === playerCharacter.cultivation.currentRealmId);
        
        if (currentRealm) {
            const currentStageIndex = currentRealm.stages.findIndex(s => s.id === playerCharacter.cultivation.currentStageId);

            if (currentStageIndex !== -1) {
                let nextRealmId: string | undefined;
                let nextStageId: string | undefined;

                if (currentStageIndex < currentRealm.stages.length - 1) {
                    // Breakthrough to the next stage within the same realm
                    const nextStage = currentRealm.stages[currentStageIndex + 1];
                    nextRealmId = currentRealm.id;
                    nextStageId = nextStage.id;
                } else {
                    // Breakthrough to the next realm
                    const currentRealmIndex = realmSystem.findIndex(r => r.id === currentRealm.id);
                    if (currentRealmIndex < realmSystem.length - 1) {
                        const nextRealm = realmSystem[currentRealmIndex + 1];
                        if (nextRealm && nextRealm.stages.length > 0) {
                            nextRealmId = nextRealm.id;
                            nextStageId = nextRealm.stages[0].id;
                        }
                    }
                }
                
                if (nextRealmId && nextStageId) {
                    if (!aiPayload.mechanicalIntent) {
                        aiPayload.mechanicalIntent = {};
                    }
                    // Override whatever the AI decided.
                    aiPayload.mechanicalIntent.realmChange = nextRealmId;
                    aiPayload.mechanicalIntent.stageChange = nextStageId;
                }
            }
        }
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

    const narrativeEntry: Omit<StoryEntry, 'id'> = { type: 'narrative', content: finalNarrative };

    const allNewEntries = [...baseLogEntries, playerActionEntry, narrativeEntry];
    const lastId = finalState.storyLog.length > 0 ? finalState.storyLog[finalState.storyLog.length - 1].id : 0;
    const finalNewLogEntries: StoryEntry[] = allNewEntries.map((entry, index) => ({ ...entry, id: lastId + index + 1 }));
    finalState.storyLog = [...finalState.storyLog, ...finalNewLogEntries];

    for (const entry of finalNewLogEntries) {
        await addEntryToMemory(entry, finalState, currentSlotId);
    }

    const finalQuestCheck = questManager.processQuestUpdates(finalState);
    finalQuestCheck.notifications.forEach(showNotification);
    let finalStateForSummary = finalQuestCheck.newState;

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