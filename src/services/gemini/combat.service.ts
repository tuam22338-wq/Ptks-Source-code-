import { Type } from "@google/genai";
import type { GameState, NPC } from '../../types';
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

    const availableTechniques = npc.techniques.filter(tech => {
        const cooldown = 0; // NPCs don't have cooldowns for simplicity yet
        const canAfford = true; // NPCs have infinite resources for now
        return cooldown <= 0 && canAfford;
    });

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            action: { type: Type.STRING, enum: ['BASIC_ATTACK', 'USE_TECHNIQUE', 'DEFEND'] },
            techniqueId: { type: Type.STRING, description: "ID của công pháp để sử dụng. Chỉ trả về nếu hành động là 'USE_TECHNIQUE'." },
            narrative: { type: Type.STRING, description: "Một đoạn văn tường thuật sống động về hành động của NPC." },
        },
        required: ['action', 'narrative']
    };

    const prompt = `Bạn là AI điều khiển hành vi của NPC trong một trận chiến theo lượt. Hãy đưa ra quyết định hợp lý nhất.

    **Bối cảnh trận đấu:**
    - **NPC:** ${npc.identity.name} (Ngũ hành: ${npc.element || 'Vô'})
    - **Sinh Mệnh NPC:** ${npc.attributes.flatMap(g=>g.attributes).find(a=>a.name === 'Sinh Mệnh')?.value}
    - **Công pháp có thể dùng:** ${availableTechniques.map(t => `${t.name} (ID: ${t.id}, Ngũ hành: ${t.element || 'Vô'})`).join(', ') || 'Không có'}
    - **Đối thủ:** ${playerCharacter.identity.name} (Ngũ hành: ${playerCharacter.element || 'Vô'})
    - **Sinh Mệnh đối thủ:** ${playerCharacter.attributes.flatMap(g=>g.attributes).find(a=>a.name === 'Sinh Mệnh')?.value}
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

    return JSON.parse(response.text) as CombatActionDecision;
};