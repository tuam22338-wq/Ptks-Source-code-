
import { Type } from "@google/genai";
import type { GameState, DynamicWorldEvent } from '../../types';
import { generateWithRetry } from './gemini.core';
import * as db from '../dbService';
import { createFullGameStateContext } from './promptContextBuilder';

/**
 * Acts as a "Strategist AI" to determine if a major world event should occur.
 * @param gameState The current state of the game.
 * @returns A new DynamicWorldEvent object, or null if no event is generated.
 */
export const generateDynamicWorldEventFromAI = async (gameState: GameState): Promise<Omit<DynamicWorldEvent, 'id' | 'turnStart'> | null> => {
    const { worldState, gameDate, activeMods, activeWorldId, playerCharacter, discoveredLocations } = gameState;

    // Use factions and locations from the active game state
    const factions = playerCharacter.reputation.map(r => r.factionName);
    const locationIds = discoveredLocations.map(l => l.id);

    const schema = {
        type: Type.OBJECT,
        properties: {
            shouldCreateEvent: { type: Type.BOOLEAN, description: "Quyết định có nên tạo một sự kiện mới hay không." },
            title: { type: Type.STRING, description: "Tiêu đề ngắn gọn, hấp dẫn cho sự kiện." },
            description: { type: Type.STRING, description: "Mô tả chi tiết về sự kiện, điều gì đang xảy ra." },
            duration: { type: Type.NUMBER, description: "Thời gian sự kiện kéo dài (tính bằng ngày trong game), ví dụ: 30." },
            affectedFactions: { type: Type.ARRAY, items: { type: Type.STRING, enum: factions.length > 0 ? factions : undefined }, description: "Các phe phái chính bị ảnh hưởng bởi sự kiện này." },
            affectedLocationIds: { type: Type.ARRAY, items: { type: Type.STRING, enum: locationIds.length > 0 ? locationIds : undefined }, description: "Các địa điểm chính nơi sự kiện diễn ra hoặc bị ảnh hưởng." },
        },
        required: ['shouldCreateEvent']
    };
    
    const settings = await db.getSettings();
    if (!settings) throw new Error("Settings not loaded");

    const context = createFullGameStateContext(gameState, settings);

    const prompt = `Bạn là AI "Chiến Lược Gia", chuyên mô phỏng các sự kiện vĩ mô trong thế giới game.
    Dựa trên toàn bộ bối cảnh game, hãy quyết định xem có nên tạo ra một sự kiện thế giới động mới hay không.

    ${context}

    **Nhiệm vụ:**
    1.  **Phân tích Tình hình:** Xem xét năm hiện tại, các sự kiện lịch sử sắp tới, căng thẳng giữa các phe phái, và các sự kiện động đang diễn ra.
    2.  **Quyết định:** Dựa trên phân tích, hãy quyết định xem việc tạo ra một sự kiện mới có làm cho thế giới trở nên thú vị và hợp lý hơn không.
    3.  **Sáng tạo (Nếu cần):** Nếu quyết định tạo sự kiện, hãy nghĩ ra một biến cố có ý nghĩa. Ví dụ: một phe phái tấn công phe khác, một bảo vật xuất thế, một thiên tai, một nhân vật quan trọng làm điều gì đó bất ngờ...
    4.  **Điền thông tin:** Điền đầy đủ thông tin cho sự kiện vào schema JSON. Nếu không tạo sự kiện, chỉ cần đặt 'shouldCreateEvent' thành 'false'.

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất.`;

    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;
    const response = await generateWithRetry({
        model: settings?.gameMasterModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
        }
    }, specificApiKey);

    if (!response.text || response.text.trim() === '') {
        console.warn("AI response for world event generation was empty.");
        return null;
    }

    try {
        const result = JSON.parse(response.text);
        if (result.shouldCreateEvent && result.title && result.description && result.duration) {
            const { shouldCreateEvent, ...eventData } = result;
            return eventData;
        }
    } catch (e) {
        console.error("Lỗi phân tích JSON khi tạo sự kiện thế giới:", response.text, e);
    }
    
    return null;
};