
import { Type } from "@google/genai";
import type { ElementType } from 'react';
import type { InnateTalent, CharacterIdentity, GameState, Gender, NPC, PlayerNpcRelationship, ModTalent, ModTalentRank, TalentSystemConfig, Element, Currency, Relationship, NpcDensity, CharacterAttributes, GenerationMode, WorldTurnEntry } from '../../types';
// FIX: Removed unused import.
import { TALENT_RANK_NAMES, ALL_ATTRIBUTES, NARRATIVE_STYLES, SPIRITUAL_ROOT_CONFIG, REALM_SYSTEM, NPC_DENSITY_LEVELS, DEFAULT_ATTRIBUTE_DEFINITIONS } from "../../constants";
import { generateWithRetry, generateImagesWithRetry } from './gemini.core';
import * as db from '../dbService';

interface NpcActionOutcome {
    narrative: string;
    outcome: {
        success: boolean;
        newStatus: string;
        locationChange?: string; // ID of the new location
    };
    rumorText: string | null;
}


export const executeNpcAction = async (npc: NPC, action: string, gameState: GameState): Promise<NpcActionOutcome | null> => {
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            narrative: { type: Type.STRING, description: "Một đoạn văn ngắn (2-3 câu) tường thuật lại hành động của NPC một cách chi tiết và sống động." },
            outcome: {
                type: Type.OBJECT,
                description: "Kết quả cơ chế của hành động.",
                properties: {
                    success: { type: Type.BOOLEAN, description: "Hành động có thành công hay không." },
                    newStatus: { type: Type.STRING, description: "Trạng thái mới của NPC sau khi thực hiện hành động. Ví dụ: 'Đang trên đường đến Rừng Thanh Âm', 'Vừa đến nơi và đang tìm kiếm thảo dược'." },
                    locationChange: { type: Type.STRING, description: "ID của địa điểm mới nếu hành động là di chuyển thành công." },
                },
                required: ['success', 'newStatus']
            },
            rumorText: { type: Type.STRING, description: "Một tin đồn có thể được tạo ra từ hành động này. Để trống nếu không có gì đáng chú ý." },
        },
        required: ['narrative', 'outcome'],
    };

    const availableLocations = gameState.discoveredLocations.map(l => `* ${l.name} (ID: ${l.id})`).join('\n');

    // FIX: Updated prompt to match the response schema exactly, telling the AI to populate nested objects like `outcome.newStatus` and `outcome.locationChange`. This prevents schema validation errors and aligns the instructions with the expected JSON structure.
    const prompt = `Bạn là AI mô phỏng hành động của NPC trong game.
    NPC "${npc.identity.name}" đang cố gắng thực hiện mục tiêu "${npc.goals[0] || 'không rõ'}" và đang thực hiện bước kế hoạch sau: "${action}".

    **Bối cảnh:**
    - Vị trí hiện tại của NPC: ${gameState.discoveredLocations.find(l => l.id === npc.locationId)?.name}
    - Các địa điểm đã biết trong thế giới:
    ${availableLocations}

    **Nhiệm vụ:**
    1.  **Tường thuật:** Viết một đoạn văn mô tả NPC thực hiện hành động này.
    2.  **Quyết định Kết quả & Tạo Kết quả Cơ chế:**
        -   Trong đối tượng \`outcome\`, hãy điền các trường sau:
            - \`success\`: Hành động có thành công hay không.
            - \`newStatus\`: Trạng thái mới của NPC sau khi thực hiện hành động. Ví dụ: 'Đang trên đường đến Rừng Thanh Âm', 'Vừa đến nơi và đang tìm kiếm thảo dược'.
            - \`locationChange\` (Nếu hành động là di chuyển): ID của địa điểm mới.
        -   Tùy chọn: Tạo ra một \`rumorText\` (tin đồn) ở cấp cao nhất nếu hành động này đáng chú ý.

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.npcSimulationModel;
    try {
        const response = await generateWithRetry({
            model: settings?.npcSimulationModel || 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        }, specificApiKey);

        const result = JSON.parse(response.text);
        return result as NpcActionOutcome;

    } catch (error) {
        console.error(`Failed to execute action for NPC ${npc.identity.name}:`, error);
        return null;
    }
};

export const generateRelationshipUpdate = async (
    npc1: NPC,
    npc2: NPC,
    currentRelationship: Relationship,
    gameState: GameState
): Promise<{ newRelationshipDescription: string; rumorText: string | null }> => {
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            newRelationshipDescription: { type: Type.STRING, description: `Một mô tả mới cho mối quan hệ giữa ${npc1.identity.name} và ${npc2.identity.name}. Mô tả này nên phản ánh sự thay đổi (hoặc không thay đổi) trong mối quan hệ của họ.` },
            rumorText: { type: Type.STRING, description: "Một tin đồn có thể được tạo ra từ sự tương tác này. Tin đồn phải ngắn gọn và thú vị. Nếu không có tin đồn, trả về một chuỗi rỗng." },
        },
        required: ['newRelationshipDescription', 'rumorText'],
    };

    const prompt = `Bạn là AI mô phỏng sự phát triển mối quan hệ giữa các NPC trong game tu tiên.
    Dựa trên thông tin được cung cấp, hãy quyết định xem mối quan hệ giữa hai NPC sau có thay đổi hay không và tạo ra một tin đồn liên quan (nếu có).

    **NPC 1:**
    - Tên: ${npc1.identity.name}
    - Tính cách: ${npc1.identity.personality}
    - Mục tiêu: ${npc1.goals.join('; ') || 'Không có'}

    **NPC 2:**
    - Tên: ${npc2.identity.name}
    - Tính cách: ${npc2.identity.personality}
    - Mục tiêu: ${npc2.goals.join('; ') || 'Không có'}

    **Mối quan hệ hiện tại (${npc1.identity.name} -> ${npc2.identity.name}):**
    - Loại: ${currentRelationship.type}
    - Mô tả: ${currentRelationship.description}

    **Bối cảnh thế giới:**
    - Năm: ${gameState.gameDate.year}.
    - Sự kiện lớn đang/sắp diễn ra: ${gameState.majorEvents.find(e => e.year >= gameState.gameDate.year)?.title || "Bình yên."}
    - Tóm tắt câu chuyện gần đây: ${gameState.storySummary || "Chưa có gì đáng chú ý."}
    - Danh tiếng của người chơi: ${gameState.playerCharacter.danhVong.status}

    **Nhiệm vụ:**
    1.  **Phân tích:** Dựa trên tính cách, mục tiêu của hai NPC và bối cảnh thế giới, hãy suy nghĩ xem mối quan hệ của họ sẽ phát triển như thế nào. Ví dụ: hai người cùng phe có thể trở nên thân thiết hơn sau một chiến thắng, hai kẻ đối địch có thể mâu thuẫn sâu sắc hơn.
    2.  **Cập nhật mô tả:** Viết lại mô tả cho mối quan hệ của họ để phản ánh sự phát triển này. Kể cả khi không có thay đổi lớn, hãy làm mới câu chữ một chút.
    3.  **Tạo tin đồn (Tùy chọn):** Nếu tương tác của họ đủ đáng chú ý, hãy tạo ra một câu tin đồn mà người chơi có thể nghe được. Ví dụ: "Nghe nói hai vị trưởng lão của hai phe lại tranh cãi kịch liệt về tài nguyên khoáng mạch."

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.npcSimulationModel;
    // FIX: Corrected model name from 'gemini-2.flash' to 'gemini-2.5-flash' to match supported models.
    const response = await generateWithRetry({
        model: settings?.npcSimulationModel || 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema },
    }, specificApiKey);

    const result = JSON.parse(response.text);
    return {
        ...result,
        rumorText: result.rumorText || null,
    };
};
