import type { GameState, StoryEntry, GameSettings, MechanicalIntent, AIResponsePayload } from '../types';
import { generateActionResponseStream } from './geminiService';
import { advanceGameTime } from '../utils/timeManager';
import { simulateWorldTurn } from './worldSimulator';
import * as questManager from '../utils/questManager';
import { addEntryToMemory, retrieveMemoryContext } from './memoryService';
import { validateMechanicalChanges } from './validationService';
import { applyMechanicalChanges } from './stateUpdateService';
import { runHeuristicFixer } from './heuristicFixerService';
import { orchestrateRagQuery } from './ragOrchestrator';
import { analyzeItemWithAI } from './gemini/item.service';

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
): Promise<{ finalState: GameState, narrativeEntryPayload: Omit<StoryEntry, 'id'> }> => {
    
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
             showNotification(rumorText);
        }
    }

    let arbiterHint: string | undefined = undefined;

    if (type === 'act' && text.toLowerCase().includes('giám định')) {
        const itemNameMatch = text.match(/giám định (.*)/i);
        const itemName = itemNameMatch ? itemNameMatch[1].trim() : null;

        if (itemName) {
            const item = stateAfterSim.playerCharacter.inventory.items.find(i => i.name === itemName && !i.isIdentified);
            if (item) {
                try {
                    // @google-genai-fix: Renamed `newBonuses` to `analysisResult` and checked `analysisResult.bonuses` property.
                    const analysisResult = await analyzeItemWithAI(item, stateAfterSim);
                    if (analysisResult.bonuses && analysisResult.bonuses.length > 0) {
                        const itemIdentifiedIntent = {
                            itemIdentified: {
                                itemId: item.id,
                                newBonuses: analysisResult.bonuses,
                                passiveEffects: analysisResult.passiveEffects,
                                conditionalEffects: analysisResult.conditionalEffects,
                                curseEffect: analysisResult.curseEffect
                            }
                        };
                        arbiterHint = `[GỢI Ý TỪ HỆ THỐNG]: Người chơi đã giám định thành công vật phẩm '${item.name}'. Hãy tường thuật lại quá trình này (ví dụ: người chơi nhỏ máu, truyền linh lực, v.v. và thấy các dòng chữ/hào quang hiện ra) và BẮT BUỘC phải bao gồm 'mechanicalIntent' sau trong phản hồi JSON của bạn: ${JSON.stringify(itemIdentifiedIntent)}`;
                    } else {
                        arbiterHint = `[GỢI Ý TỪ HỆ THỐNG]: Người chơi đã cố gắng giám định vật phẩm '${item.name}' nhưng thất bại, không phát hiện được gì đặc biệt. Hãy tường thuật lại sự thất bại này.`;
                    }
                } catch (e: any) {
                    console.error("Item identification AI call failed:", e);
                    arbiterHint = `[GỢI Ý TỪ HỆ THỐNG]: Người chơi đã cố gắng giám định vật phẩm '${item.name}' nhưng thất bại do thiên cơ hỗn loạn. Hãy tường thuật lại sự thất bại này.`;
                }
            }
        }
    }

    const rawMemoryContext = await retrieveMemoryContext(text, stateAfterSim, currentSlotId);
    const ragContext = await orchestrateRagQuery(text, type, stateAfterSim);
    const fullMemoryContext = [rawMemoryContext, ragContext].filter(Boolean).join('\n\n');

    // --- GIAI ĐOẠN 1: GỌI AI HỢP NHẤT ---
    const stream = generateActionResponseStream(stateAfterSim, text, type, fullMemoryContext, settings, arbiterHint);

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
            if (intentIndex !== -1) content = content.substring(0, intentIndex);
            
            const unescapedContent = content.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
            onStreamUpdate(unescapedContent);
        }
    }

    // --- GIAI ĐOẠN 2: PHÂN TÍCH & ÁP DỤNG KẾT QUẢ ---
    let aiPayload: AIResponsePayload;
    try {
        aiPayload = JSON.parse(fullResponseJsonString);
    } catch (e: any) {
        console.error("Lỗi phân tích JSON từ AI:", e, "\nNội dung JSON:", fullResponseJsonString);
        throw new Error("AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.");
    }
    
    const { validatedIntent, validationNotifications } = validateMechanicalChanges(aiPayload.mechanicalIntent, stateAfterSim);
    validationNotifications.forEach(showNotification);

    let finalState = applyMechanicalChanges(stateAfterSim, validatedIntent, showNotification);
    
    const finalNarrative = aiPayload.narrative;
    
    // --- GIAI ĐOẠN 3: XỬ LÝ HẬU KỲ & DỌN DẸP ---
    const finalQuestCheck = questManager.processQuestUpdates(finalState);
    finalQuestCheck.notifications.forEach(showNotification);
    let finalStateForReturn = finalQuestCheck.newState;

    if (settings.enableHeuristicFixerAI) {
        try {
            const fixResult = await runHeuristicFixer(finalStateForReturn, currentSlotId);
            finalStateForReturn = fixResult.newState;
            fixResult.notifications.forEach(showNotification);
        } catch (error: any) {
            console.error("[Heuristic Fixer] Failed to run AI validation:", error);
            showNotification("[Hệ Thống] Thiên Đạo Trật Tự Giám gặp lỗi.");
        }
    }
    
    const narrativeEntryPayload: Omit<StoryEntry, 'id'> = {
        type: 'narrative',
        content: finalNarrative,
        effects: validatedIntent,
    };
    
    // TODO: Add memory saving logic here, which can now be done safely
    // as it is the final step before returning.

    return { finalState: finalStateForReturn, narrativeEntryPayload };
};
