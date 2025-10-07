import { Type } from "@google/genai";
import type { GameState, InventoryItem, StatBonus } from '../../types';
import { ALL_ATTRIBUTES } from "../../constants";
import { generateWithRetry } from './gemini.core';
import * as db from '../dbService';

export const analyzeItemWithAI = async (item: InventoryItem, gameState: GameState): Promise<StatBonus[]> => {
    const { playerCharacter, realmSystem } = gameState;
    const currentRealm = realmSystem.find(r => r.id === playerCharacter.cultivation.currentRealmId);

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
            }
        },
        required: ['bonuses']
    };

    const prompt = `Bạn là một "Bảo vật Giám định sư" AI trong game tu tiên. Nhiệm vụ của bạn là phân tích một vật phẩm chưa được giám định và tạo ra các chỉ số cộng thêm (bonus) một cách logic và cân bằng.

    **Thông tin Vật phẩm:**
    - **Tên:** ${item.name}
    - **Mô tả:** ${item.description}
    - **Phẩm chất:** ${item.quality}

    **Bối cảnh Người chơi:**
    - **Cảnh giới:** ${currentRealm?.name || 'Không rõ'}

    **Nhiệm vụ:**
    1.  **Phân tích:** Dựa vào tên, mô tả và phẩm chất, hãy suy luận ra bản chất của vật phẩm này. (Ví dụ: "Hỏa Vân Kiếm" có thể liên quan đến lửa và sát thương).
    2.  **Tạo chỉ số:** Tạo ra một danh sách từ 2 đến 4 chỉ số cộng thêm phù hợp.
        -   Chỉ số phải logic. Một thanh kiếm nên cộng Lực Lượng hoặc Linh Lực Sát Thương, không nên cộng Ngự Khí Thuật.
        -   Giá trị của chỉ số phải cân bằng, phù hợp với phẩm chất của vật phẩm và cảnh giới hiện tại của người chơi. Đừng tạo ra các chỉ số quá mạnh.
    3.  **Trả về kết quả:** Trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;
    
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
        return (json.bonuses || []) as StatBonus[];
    } catch (e) {
        console.error("Lỗi phân tích JSON khi giám định vật phẩm:", response.text, e);
        // Fallback to empty bonuses to prevent crash
        return [];
    }
};