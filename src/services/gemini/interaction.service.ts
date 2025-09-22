

import { Type } from "@google/genai";
import type { GameState, NPC } from '../../types';
import { generateWithRetry } from './gemini.core';
import * as db from '../dbService';

/**
 * Generates an internal thought bubble for an NPC before they speak.
 * This is the first step in the two-stage interaction process.
 * @param npc The NPC who is thinking.
 * @param gameState The current state of the world.
 * @param playerInput The specific action/dialogue from the player that triggered the thought.
 * @returns A string containing the NPC's internal thought.
 */
export const generateNpcThoughtBubble = async (
    npc: NPC,
    gameState: GameState,
    playerInput: string
): Promise<string> => {
    const thoughtSchema = {
        type: Type.OBJECT,
        properties: {
            thought: {
                type: Type.STRING,
                description: "Một dòng suy nghĩ ngắn gọn, nội tâm của NPC. KHÔNG phải là lời thoại. Phản ánh cảm xúc, ký ức và mục tiêu của họ. Ví dụ: 'Người này lại đến, có vẻ thân thiện, có lẽ mình nên hỏi thăm về chuyện lần trước.' hoặc 'Kẻ thù của ta, hắn muốn gì đây? Phải cẩn thận.'"
            }
        },
        required: ['thought']
    };

    const prompt = `Bạn là AI mô phỏng nội tâm của một nhân vật (NPC) trong game tu tiên.
    Dựa trên toàn bộ thông tin về NPC và bối cảnh, hãy tạo ra một dòng **suy nghĩ nội tâm** DUY NHẤT cho họ ngay trước khi họ phản ứng với người chơi.

    **Thông Tin NPC:**
    - **Tên:** ${npc.identity.name}
    - **Tính cách:** ${npc.identity.personality}
    - **Trạng thái cảm xúc:** Tin tưởng(${npc.emotions.trust}), Sợ hãi(${npc.emotions.fear}), Tức giận(${npc.emotions.anger})
    - **Ký ức gần đây:** ${npc.memory.shortTerm.join('; ') || 'Không có'}
    - **Động lực:** "${npc.motivation}"
    - **Mục tiêu:** ${npc.goals.join(', ') || 'Không có'}
    - **Kế hoạch hiện tại:** ${npc.currentPlan ? npc.currentPlan[0] : 'Chưa có'}

    **Bối cảnh tương tác:**
    - **Người chơi (${gameState.playerCharacter.identity.name}) vừa nói/làm:** "${playerInput}"

    **Nhiệm vụ:**
    Tạo ra một "bong bóng suy nghĩ" ngắn gọn, chân thực cho ${npc.identity.name}. **Đây là suy nghĩ, KHÔNG phải lời thoại.**
    Nó phải phản ánh đúng tâm trạng, ký ức, và mục tiêu của NPC khi đối mặt với hành động của người chơi.

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.quickSupportModel; // Use a quick model for this
    try {
        const response = await generateWithRetry({
            model: settings?.quickSupportModel || 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: thoughtSchema,
            }
        }, specificApiKey);
        
        const result = JSON.parse(response.text);
        return result.thought || '';

    } catch (error) {
        console.error(`Failed to generate thought bubble for NPC ${npc.identity.name}:`, error);
        return ''; // Return empty string on failure to not break the flow
    }
};
