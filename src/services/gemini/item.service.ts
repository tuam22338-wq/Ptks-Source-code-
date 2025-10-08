import { Type } from "@google/genai";
import type { GameState, InventoryItem, StatBonus } from '../../types';
import { ALL_ATTRIBUTES } from "../../constants";
import { generateWithRetry } from './gemini.core';
import * as db from '../dbService';

export const analyzeItemWithAI = async (item: InventoryItem, gameState: GameState): Promise<Partial<InventoryItem>> => {
    const { playerCharacter, progressionSystem } = gameState;
    const currentRealm = progressionSystem.find(r => r.id === playerCharacter.progression.currentTierId);

    const itemEffectSchema = {
        type: Type.OBJECT,
        properties: {
            type: { type: Type.STRING, enum: ['APPLY_STATUS', 'DEAL_DAMAGE', 'HEAL', 'MODIFY_STAT'] },
            description: { type: Type.STRING },
        },
        required: ['type', 'description']
    };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            bonuses: {
                type: Type.ARRAY,
                description: "Một danh sách từ 2-4 chỉ số cộng thêm phù hợp với bản chất của vật phẩm. Chỉ số phải logic với tên, mô tả và phẩm chất của vật phẩm.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        attribute: { type: Type.STRING, description: `Tên của thuộc tính. PHẢI là một trong các giá trị sau: ${ALL_ATTRIBUTES.join(', ')}` },
                        value: { type: Type.NUMBER, description: "Giá trị cộng thêm." }
                    },
                    required: ['attribute', 'value']
                }
            },
            passiveEffects: { type: Type.ARRAY, items: itemEffectSchema, description: "Hiệu ứng nội tại luôn kích hoạt khi trang bị." },
            conditionalEffects: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        trigger: { type: Type.STRING, enum: ['ON_HIT_DEALT', 'ON_HIT_TAKEN', 'ON_KILL', 'ON_CRIT_DEALT', 'ON_DODGE'] },
                        chance: { type: Type.NUMBER },
                        effect: itemEffectSchema
                    },
                    required: ['trigger', 'chance', 'effect']
                },
                description: "Hiệu ứng kích hoạt theo điều kiện."
            },
            curseDescription: { type: Type.STRING, description: "Nếu vật phẩm bị nguyền rủa, hãy mô tả lời nguyền ở đây." },
            curseEffect: { ...itemEffectSchema, description: "Hiệu ứng bất lợi của lời nguyền." }
        }
    };

    const prompt = `Bạn là một "Bảo vật Giám định sư" AI trong game tu tiên. Nhiệm vụ của bạn là phân tích một vật phẩm chưa được giám định và hé lộ sức mạnh tiềm ẩn của nó (bao gồm chỉ số, hiệu ứng, và cả lời nguyền) một cách logic và sáng tạo.

    **Thông tin Vật phẩm:**
    - **Tên:** ${item.name}
    - **Mô tả:** ${item.description}
    - **Phẩm chất:** ${item.quality}

    **Bối cảnh Người chơi:**
    - **Cảnh giới:** ${currentRealm?.name || 'Không rõ'}

    **Nhiệm vụ:**
    1.  **Phân tích & Sáng tạo:** Dựa vào tên, mô tả và phẩm chất, hãy suy luận ra bản chất của vật phẩm này. Nó ẩn chứa loại sức mạnh gì? Có bí mật nào không?
    2.  **Tạo Thuộc tính:** Tạo ra một bộ thuộc tính hoàn chỉnh cho vật phẩm:
        -   **bonuses:** Các chỉ số cộng thêm cơ bản.
        -   **passiveEffects:** Các hiệu ứng nội tại luôn hoạt động.
        -   **conditionalEffects:** Các hiệu ứng kích hoạt theo điều kiện (khi tấn công, bị thương, v.v.). Đây là cơ hội để sáng tạo nhất.
        -   **curseEffect:** Nếu phẩm chất cao hoặc mô tả có vẻ hắc ám, hãy cân nhắc thêm vào một lời nguyền với hiệu ứng bất lợi đi kèm để tạo sự cân bằng.
    3.  **Cân bằng:** Giá trị của các chỉ số và hiệu ứng phải phù hợp với phẩm chất của vật phẩm và cảnh giới hiện tại của người chơi. Đừng tạo ra các vật phẩm quá mạnh.
    4.  **Trả về kết quả:** Trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;
    
    const settings = await db.getSettings();
    const model = settings?.itemAnalysisModel || 'gemini-2.5-flash';
    const specificApiKey = settings?.modelApiKeyAssignments?.itemAnalysisModel;
    
    const response = await generateWithRetry({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    }, specificApiKey);

    try {
        const json = JSON.parse(response.text);
        return {
            bonuses: json.bonuses || [],
            passiveEffects: json.passiveEffects,
            conditionalEffects: json.conditionalEffects,
            curseDescription: json.curseDescription,
            curseEffect: json.curseEffect,
        } as Partial<InventoryItem>;
    } catch (e: any) {
        console.error("Lỗi phân tích JSON khi giám định vật phẩm:", response.text, e);
        // Fallback to empty bonuses to prevent crash
        return { bonuses: [] };
    }
};