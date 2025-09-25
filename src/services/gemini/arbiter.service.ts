import { Type } from "@google/genai";
import type { GameState, ArbiterDecision } from '../../types';
import { generateWithRetry } from './gemini.core';
import * as db from '../dbService';

/**
 * Acts as a neutral "Arbiter" AI to determine the logical outcome of a player's action
 * before the narrative is generated. This ensures mechanical consistency.
 * @param gameState The current state of the game.
 * @param userInput The player's intended action.
 * @returns An ArbiterDecision object with a structured outcome.
 */
export const decideActionOutcome = async (gameState: GameState, userInput: string): Promise<ArbiterDecision> => {

    const arbiterSchema = {
        type: Type.OBJECT,
        properties: {
            success: { type: Type.BOOLEAN, description: "Hành động có thành công hay không." },
            reason: { type: Type.STRING, description: "Giải thích ngắn gọn, dựa trên chỉ số, tại sao hành động thành công hoặc thất bại. Ví dụ: 'Lực Lượng của người chơi (15) đủ để phá cửa (độ khó 10)'." },
            consequence: { type: Type.STRING, description: "Mô tả hậu quả cơ học ngắn gọn. Ví dụ: 'Cánh cửa vỡ tan', 'Ổ khóa không hề suy suyển'." }
        },
        required: ['success', 'reason', 'consequence']
    };

    // Create a very condensed context for the arbiter
    const { playerCharacter } = gameState;
    const keyAttributes = `
    - Lực Lượng: ${playerCharacter.attributes.luc_luong?.value || 10}
    - Thân Pháp: ${playerCharacter.attributes.than_phap?.value || 10}
    - Ngộ Tính: ${playerCharacter.attributes.ngo_tinh?.value || 10}
    - Mị Lực: ${playerCharacter.attributes.mi_luc?.value || 10}
    - Căn Cốt: ${playerCharacter.attributes.can_cot?.value || 10}
    - Cơ Duyên: ${playerCharacter.attributes.co_duyen?.value || 10}
    `;
    
    const conditionalRules = playerCharacter.playerAiHooks?.on_conditional_rules;
    const conditionalRulesContext = conditionalRules 
        ? `\n**Luật Lệ Tùy Biến (Do người chơi định nghĩa - ƯU TIÊN CAO):**\n${conditionalRules}`
        : '';

    const prompt = `Bạn là một AI "Trọng Tài" logic và công bằng trong game. Nhiệm vụ của bạn là quyết định kết quả của một hành động dựa trên chỉ số của người chơi và các quy luật của thế giới.
    
    **Chỉ số của người chơi:**
    ${keyAttributes}

    **Bối cảnh:**
    - Vị trí: ${gameState.discoveredLocations.find(l => l.id === playerCharacter.currentLocationId)?.name || 'Không rõ'}
    - Thời gian: ${gameState.gameDate.season}, ${gameState.gameDate.timeOfDay}
    - Tóm tắt gần đây: ${gameState.storySummary || "Chưa có"}
    ${conditionalRulesContext}

    **Hành động của người chơi:** "${userInput}"

    **Nhiệm vụ:**
    Dựa vào các chỉ số, bối cảnh, và các quy luật tùy biến (nếu có), hãy quyết định một cách logic xem hành động này thành công hay thất bại. Đưa ra một lý do ngắn gọn. Trả về kết quả dưới dạng JSON.`;
    
    const settings = await db.getSettings();
    // Use a fast model for this logical check
    const model = settings?.actionAnalysisModel || 'gemini-2.5-flash';
    const specificApiKey = settings?.modelApiKeyAssignments?.actionAnalysisModel;

    try {
        const response = await generateWithRetry({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: arbiterSchema,
            }
        }, specificApiKey);
        
        return JSON.parse(response.text) as ArbiterDecision;

    } catch (error) {
        console.error("Arbiter AI failed to make a decision:", error);
        // Fallback to a neutral decision to avoid breaking the game loop
        return {
            success: true, // Default to success to avoid frustrating the player on system error
            reason: "Trọng tài AI gặp lỗi, tạm thời cho phép hành động thành công.",
            consequence: "Hành động được thực hiện."
        };
    }
};