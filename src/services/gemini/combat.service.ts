import { Type } from "@google/genai";
import type { GameState, NPC, CultivationTechnique } from '../../types';
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
            techniqueId: { type: Type.STRING, description: "ID của công pháp để sử dụng. Chỉ trả về nếu hành động là 'USE_TECHNIQUE'." },
            narrative: { type: Type.STRING, description: "Một đoạn văn tường thuật sống động về hành động của NPC." },
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

    **Nhiệm vụ:**
    Dựa trên tình hình (sinh mệnh của cả hai, công pháp có sẵn), hãy chọn hành động tốt nhất cho NPC:
    - **BASIC_ATTACK:** Tấn công thường khi không có lựa chọn tốt hơn.
    - **USE_TECHNIQUE:** Sử dụng công pháp nếu nó mang lại lợi thế (khắc hệ, sát thương cao).
    - **DEFEND:** Phòng thủ nếu sinh mệnh thấp và cần câu giờ.

    Hãy trả về một đối tượng JSON duy nhất theo schema đã cung cấp.`;

    // @google-genai-fix: Added logic to call the Gemini API and return the result.
    const settings = await db.getSettings();
    const model = settings?.actionAnalysisModel || 'gemini-2.5-flash';
    const specificApiKey = settings?.modelApiKeyAssignments?.actionAnalysisModel;

    const response = await generateWithRetry({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    }, specificApiKey);

    const result = JSON.parse(response.text);
    return result as CombatActionDecision;
};