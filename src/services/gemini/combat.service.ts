import { Type } from "@google/genai";
import type { GameState, NPC, CharacterAttributes, CultivationTechnique } from '../../types';
import { generateWithRetry } from './gemini.core';
import * as db from '../dbService';

interface CombatActionDecision {
    action: 'BASIC_ATTACK' | 'USE_TECHNIQUE' | 'DEFEND';
    techniqueId?: string;
    narrative: string;
}

export const decideNpcCombatAction = async (gameState: GameState, npc: NPC): Promise<CombatActionDecision> => {
    const { combatState, playerCharacter } = gameState;
    if (!combatState) throw new Error("Không ở trong trạng thái chiến đấu.");

    const availableTechniques = (npc.techniques || []).filter(tech => {
        const cooldown = 0; // NPCs don't have cooldowns for simplicity yet
        const canAfford = true; // NPCs have infinite resources for now
        return cooldown <= 0 && canAfford;
    });

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            action: { type: Type.STRING, enum: ['BASIC_ATTACK', 'USE_TECHNIQUE', 'DEFEND'] },
            techniqueId: { type: Type.STRING },
            narrative: { type: Type.STRING },
        },
        required: ['action', 'narrative']
    };

    const prompt = `Bạn là AI điều khiển hành vi của NPC trong một trận chiến theo lượt. Hãy đưa ra quyết định hợp lý nhất.

    **Bối cảnh trận đấu:**
    - **NPC:** ${npc.identity.name} (Ngũ hành: ${npc.element || 'Vô'})
    - **Sinh Mệnh NPC:** ${npc.attributes['sinh_menh']?.value}
    - **Công pháp có thể dùng:** ${availableTechniques.map(t => `${t.name} (ID: ${t.id}, Ngũ hành: ${t.element || 'Vô'})`).join(', ') || 'Không có'}
    - **Đối thủ:** ${playerCharacter.identity.name} (Ngũ hành: ${playerCharacter.element || 'Vô'})
    - **Sinh Mệnh đối thủ:** ${playerCharacter.attributes['sinh_menh']?.value}
    - **Tương khắc Ngũ Hành:** Kim > Mộc > Thổ > Thủy > Hỏa > Kim.

    **Nhiệm vụ:**
    Dựa vào tình hình, hãy chọn một hành động chiến thuật tốt nhất:
    1.  **USE_TECHNIQUE:** Nếu có công pháp khắc chế đối thủ hoặc có hiệu ứng đặc biệt hữu dụng.
    2.  **BASIC_ATTACK:** Nếu không có công pháp phù hợp hoặc để tiết kiệm sức.
    3.  **DEFEND:** Nếu đang bị thương nặng và cần phòng thủ.

    Hãy trả về một đối tượng JSON duy nhất theo schema đã cung cấp.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.actionAnalysisModel;
    const response = await generateWithRetry({
        model: settings?.actionAnalysisModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
        }
    }, specificApiKey);

    try {
        if (!response.text || response.text.trim() === '') {
            throw new Error('AI response is empty.');
        }
        const result = JSON.parse(response.text) as CombatActionDecision;
        // Add a check to ensure the result is valid
        if (result && result.action && result.narrative) {
            return result;
        }
        throw new Error("Invalid combat action structure from AI.");
    } catch (e) {
        console.error("Lỗi phân tích JSON khi quyết định hành động NPC:", response.text, e);
        // Fallback to a basic attack to prevent combat from stalling
        return {
            action: 'BASIC_ATTACK',
            narrative: `${npc.identity.name} do dự một lúc rồi quyết định tấn công thường.`
        };
    }
};