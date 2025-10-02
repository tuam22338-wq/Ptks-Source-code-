import type { GameState, StoryEntry, GameSettings, MechanicalIntent, AIResponsePayload, ArbiterDecision } from '../types';
import { decideAction, generateActionResponseStream } from './geminiService';
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

    // --- GIAI ĐOẠN 1: TRỌNG TÀI AI PHÂN LOẠI HÀNH ĐỘNG ---
    let arbiterHint = '';
    let actionTextForNarrator = text;
    let actionTypeForNarrator = type;
    let functionCalls;

    try {
        functionCalls = await decideAction(text, stateAfterSim);
        if (functionCalls && functionCalls.length > 0) {
            const primaryCall = functionCalls[0];

            switch (primaryCall.name) {
                case 'handle_dialogue':
                    {
                        arbiterHint = `[Gợi ý từ Trọng Tài AI: Đây là một hành động GIAO TIẾP. Hãy tập trung vào cuộc hội thoại giữa người chơi và ${primaryCall.args.target_npc_name}.]`;
                        actionTextForNarrator = primaryCall.args.dialogue_content;
                        actionTypeForNarrator = 'say';

                        const targetNpc = stateAfterSim.activeNpcs.find(n => n.identity.name === primaryCall.args.target_npc_name);
                        if (targetNpc) {
                            if (stateAfterSim.dialogueWithNpcId !== targetNpc.id) {
                                // Start of a new conversation
                                stateAfterSim.dialogueWithNpcId = targetNpc.id;
                                stateAfterSim.dialogueHistory = [];
                            }
                            // Add player's line to history
                            stateAfterSim.dialogueHistory?.push({ speaker: 'player', content: actionTextForNarrator });
                        }
                    }
                    break;
                case 'handle_system_action':
                    arbiterHint = `[Gợi ý từ Trọng Tài AI: Đây là một hành động HỆ THỐNG (${primaryCall.args.action_type}). Hãy xử lý logic cơ chế của nó (ví dụ: kiểm tra công thức, nguyên liệu) và tường thuật lại kết quả.]`;
                    actionTextForNarrator = `Thực hiện hành động hệ thống: ${primaryCall.args.details}`;
                    break;
                case 'handle_combat_action':
                    arbiterHint = `[Gợi ý từ Trọng Tài AI: Đây là một hành động CHIẾN ĐẤU. Hãy mô tả hành động một cách kịch tính trong bối cảnh trận chiến hiện tại.]`;
                    actionTextForNarrator = primaryCall.args.combat_move;
                    break;
                case 'handle_narration':
                default:
                    arbiterHint = `[Gợi ý từ Trọng Tài AI: Đây là một hành động TƯỜNG THUẬT. Hãy tập trung mô tả môi trường, sự di chuyển, và kết quả khám phá.]`;
                    actionTextForNarrator = primaryCall.args.action_description;
                    break;
            }
        }
    } catch (e) {
        console.error("Arbiter AI failed:", e);
        // If arbiter fails, just proceed without a hint.
    }

    // --- GIAI ĐOẠN 1.5: GỌI AI HỢP NHẤT (VỚI GỢI Ý) ---
    const stream = generateActionResponseStream(
        stateAfterSim, 
        actionTextForNarrator, 
        actionTypeForNarrator, 
        rawMemoryContext, 
        settings,
        arbiterHint
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
    
    // If it was a dialogue action, add AI's response to history
    if (stateAfterSim.dialogueWithNpcId && functionCalls && functionCalls[0].name === 'handle_dialogue') {
        stateAfterSim.dialogueHistory?.push({ speaker: stateAfterSim.dialogueWithNpcId, content: aiPayload.narrative });
    }
    
    const { validatedIntent, validationNotifications } = validateMechanicalChanges(aiPayload.mechanicalIntent, stateAfterSim);
    validationNotifications.forEach(showNotification);

    let finalState = applyMechanicalChanges(stateAfterSim, validatedIntent, showNotification);
    
    const finalNarrative = aiPayload.narrative;

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
    
    // End conversation if the action was not a dialogue action
    const primaryCallName = functionCalls && functionCalls[0] ? functionCalls[0].name : 'handle_narration';
    if (finalState.dialogueWithNpcId && primaryCallName !== 'handle_dialogue') {
        finalState.dialogueWithNpcId = null;
        finalState.dialogueHistory = [];
        showNotification("Kết thúc cuộc trò chuyện.");
    }

    const finalQuestCheck = questManager.processQuestUpdates(finalState);
    finalQuestCheck.notifications.forEach(showNotification);
    let finalStateForReturn = finalQuestCheck.newState;

    if (settings.enableHeuristicFixerAI) {
        try {
            const fixResult = await runHeuristicFixer(finalStateForReturn, currentSlotId);
            finalStateForReturn = fixResult.newState;
            fixResult.notifications.forEach(showNotification);
        } catch (error) {
            console.error("[Heuristic Fixer] Failed to run AI validation:", error);
            showNotification("[Hệ Thống] Thiên Đạo Trật Tự Giám gặp lỗi.");
        }
    }
    
    return finalStateForReturn;
};