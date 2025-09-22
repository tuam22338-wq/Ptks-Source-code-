import { Type } from "@google/genai";
import type { GameState, MajorEvent, NPC, ActiveQuest, PlayerNpcRelationship } from '../../types';
import { generateWithRetry } from './gemini.core';
import * as db from '../dbService';

const questObjectiveSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['TRAVEL', 'GATHER', 'TALK', 'DEFEAT'] },
        description: { type: Type.STRING, description: "Mô tả mục tiêu cho người chơi. Ví dụ: 'Đi đến Sông Vị Thủy', 'Thu thập 3 Linh Tâm Thảo'." },
        target: { type: Type.STRING, description: "ID hoặc Tên của mục tiêu. Ví dụ: 'song_vi_thuy', 'Linh Tâm Thảo', 'npc_khuong_tu_nha'." },
        required: { type: Type.NUMBER, description: "Số lượng cần thiết." },
    },
    required: ['type', 'description', 'target', 'required']
};

const questRewardSchema = {
    type: Type.OBJECT,
    properties: {
        spiritualQi: { type: Type.NUMBER, description: "Lượng linh khí thưởng." },
        danhVong: { type: Type.NUMBER, description: "Lượng danh vọng thưởng." },
        items: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: { name: { type: Type.STRING }, quantity: { type: Type.NUMBER } },
                required: ['name', 'quantity']
            }
        },
        currencies: {
            type: Type.OBJECT,
            properties: {
                "Điểm Nguồn": { type: Type.NUMBER, description: "Lượng Điểm Nguồn thưởng." }
            }
        }
    }
};

const questSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        objectives: { type: Type.ARRAY, items: questObjectiveSchema },
        rewards: questRewardSchema,
    },
    required: ['title', 'description', 'objectives', 'rewards']
};

export const generateMainQuestFromEvent = async (event: MajorEvent, gameState: GameState): Promise<Partial<ActiveQuest>> => {
    const prompt = `Bạn là một Game Master. Dựa trên một sự kiện trọng đại trong thế giới game, hãy tạo ra một nhiệm vụ chính tuyến (MAIN) cho người chơi.

    **Sự kiện trọng đại:**
    - **Tiêu đề:** ${event.title} (Năm ${event.year})
    - **Tóm tắt:** ${event.summary}
    - **Hệ quả:** ${event.consequences}

    **Bối cảnh người chơi:**
    - **Tên:** ${gameState.playerCharacter.identity.name}
    - **Cảnh giới:** ${gameState.playerCharacter.cultivation.currentRealmId}
    - **Vị trí hiện tại:** ${gameState.playerCharacter.currentLocationId}

    **Nhiệm vụ:**
    1.  **Tạo một nhiệm vụ hấp dẫn:** Nhiệm vụ phải liên quan trực tiếp đến sự kiện và là bước đầu tiên để người chơi tham gia vào dòng sự kiện đó.
    2.  **Mục tiêu rõ ràng:** Mục tiêu phải cụ thể, ví dụ như đi đến một địa điểm, tìm một NPC, hoặc thu thập một vật phẩm.
    3.  **Phần thưởng hợp lý:** Phần thưởng phải tương xứng với độ khó và tầm quan trọng của nhiệm vụ.

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;
    const response = await generateWithRetry({
        model: settings?.gameMasterModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: questSchema,
        }
    }, specificApiKey);

    return JSON.parse(response.text);
};


export const generateSideQuestFromNpc = async (npc: NPC, relationship: PlayerNpcRelationship, gameState: GameState): Promise<Partial<ActiveQuest>> => {
     const prompt = `Bạn là một Game Master. Dựa trên thông tin về một NPC và mối quan hệ của họ với người chơi, hãy tạo ra một nhiệm vụ phụ (SIDE).

    **Thông tin NPC:**
    - **Tên:** ${npc.identity.name}
    - **Tính cách:** ${npc.identity.personality}
    - **Trạng thái:** "${npc.status}"
    - **Xuất thân:** ${npc.identity.origin}

    **Mối quan hệ với người chơi:**
    - **Loại:** ${relationship.type}
    - **Trạng thái:** ${relationship.status} (Giá trị: ${relationship.value})

    **Nhiệm vụ:**
    1.  **Tạo một nhiệm vụ cá nhân:** Nhiệm vụ phải phù hợp với tính cách, trạng thái và hoàn cảnh hiện tại của NPC. Ví dụ: một thợ rèn có thể nhờ tìm khoáng thạch, một trưởng lão có thể nhờ điều tra một bí mật.
    2.  **Mục tiêu hợp lý:** Mục tiêu không nên quá khó hoặc quá dễ.
    3.  **Phần thưởng có ý nghĩa:** Phần thưởng có thể là vật phẩm, tiền tệ, hoặc một ít danh vọng.

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;
    const response = await generateWithRetry({
        model: settings?.gameMasterModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: questSchema,
        }
    }, specificApiKey);

    return JSON.parse(response.text);
};

export const generateSystemQuest = async (gameState: GameState): Promise<Partial<ActiveQuest>> => {
    const { playerCharacter } = gameState;
    const prompt = `Bạn là AI "Hệ Thống" trong game. Dựa trên trạng thái hiện tại của Ký Chủ (người chơi), hãy tạo một nhiệm vụ phụ phù hợp để giúp họ mạnh hơn hoặc khám phá thế giới.

    **Thông tin Ký Chủ:**
    - **Tên:** ${playerCharacter.identity.name}
    - **Cảnh giới:** ${playerCharacter.cultivation.currentRealmId}
    - **Vị trí:** ${playerCharacter.currentLocationId}
    - **Nhiệm vụ đang làm:** ${playerCharacter.activeQuests.map(q => q.title).join(', ') || 'Không có'}

    **Nhiệm vụ:**
    1.  **Phân tích tình hình:** Dựa vào cảnh giới và vị trí của người chơi, tạo một nhiệm vụ có độ khó phù hợp.
    2.  **Mục tiêu đa dạng:** Có thể là săn một loại yêu thú cụ thể, thu thập tài nguyên, hoặc khám phá một địa điểm chưa tới.
    3.  **Phần thưởng:** Phần thưởng chính nên là "Điểm Nguồn", cùng với một ít linh khí hoặc vật phẩm phụ.

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;
    const response = await generateWithRetry({
        model: settings?.gameMasterModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: questSchema,
        }
    }, specificApiKey);

    return JSON.parse(response.text);
};
