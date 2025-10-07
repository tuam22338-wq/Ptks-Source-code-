




import { Type } from "@google/genai";
import type { GameState, NPC } from '../../types';
import { generateWithRetry } from './gemini.core';
import * as db from '../dbService';

/**
 * Generates a step-by-step action plan for an NPC to achieve one of their goals.
 * This acts as the "strategist" AI for each NPC.
 * @param npc The NPC who needs a plan.
 * @param gameState The current state of the world.
 * @returns An array of strings representing the steps of the plan, or null if no plan could be made.
 */
export const generateNpcActionPlan = async (npc: NPC, gameState: GameState): Promise<string[] | null> => {
    if (!npc.goals || npc.goals.length === 0) {
        return null; // NPC has no goals, no plan needed.
    }

    const planSchema = {
        type: Type.OBJECT,
        properties: {
            plan: {
                type: Type.ARRAY,
                description: "Một danh sách từ 2 đến 5 bước hành động cụ thể, hợp lý mà NPC có thể thực hiện để tiến gần hơn đến mục tiêu của mình. Các bước phải ngắn gọn và rõ ràng.",
                items: { type: Type.STRING }
            }
        },
        required: ['plan']
    };

    const prompt = `Bạn là AI "Quân Sư", chuyên vạch ra kế hoạch hành động cho các NPC trong game tu tiên "Tam Thiên Thế Giới".

    **Thông Tin NPC:**
    - **Tên:** ${npc.identity.name}
    - **Tính cách:** ${npc.identity.personality}
    - **Vị trí hiện tại:** ${gameState.discoveredLocations.find(l => l.id === npc.locationId)?.name || 'Không rõ'}
    - **Động lực chính:** "${npc.motivation}"
    - **Các mục tiêu:**
        ${npc.goals.map(g => `- ${g}`).join('\n')}

    **Bối cảnh thế giới:**
    - **Năm:** ${gameState.gameDate.year}, ${gameState.gameDate.season}
    - **Sự kiện lớn:** ${gameState.majorEvents.find(e => e.year >= gameState.gameDate.year)?.title || "Bình yên."}
    - **Tóm tắt cốt truyện gần đây:** ${gameState.storySummary || "Chưa có gì đáng chú ý."}

    **Nhiệm vụ:**
    Dựa vào thông tin trên, hãy chọn MỘT mục tiêu phù hợp nhất với tình hình hiện tại và tạo ra một **kế hoạch hành động chi tiết, từng bước một (từ 2-5 bước)** cho ${npc.identity.name}.
    Kế hoạch phải thể hiện sự thông minh và tính toán của NPC:
    - **Logic:** Các bước phải logic, phù hợp với tính cách của NPC và bối cảnh thế giới.
    - **Lường trước:** Kế hoạch nên lường trước một số trở ngại đơn giản. Ví dụ, nếu mục tiêu là "tìm thảo dược", kế hoạch có thể là "hỏi dược sư để biết vị trí" thay vì "đi vào rừng tìm bừa".

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;
    
    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.npcSimulationModel;
    try {
        const response = await generateWithRetry({
            model: settings?.npcSimulationModel || 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: planSchema,
            }
        }, specificApiKey);
        
        const result = JSON.parse(response.text);
        return result.plan && result.plan.length > 0 ? result.plan : null;

    } catch (error) {
        console.error(`Failed to generate plan for NPC ${npc.identity.name}:`, error);
        return null;
    }
};