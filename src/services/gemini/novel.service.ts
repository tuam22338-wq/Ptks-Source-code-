import type { GameSettings, NovelContentEntry } from '../../types';
import { generateWithRetryStream } from './gemini.core';
import * as db from '../dbService';

export async function* generateNovelChapter(
    prompt: string,
    history: NovelContentEntry[],
    synopsis: string,
    settings: GameSettings
): AsyncIterable<string> {
    
    // Create a condensed history for context
    const contextHistory = history
        .map(entry => entry.type === 'prompt' ? `[USER]: ${entry.content}` : `[AI]: ${entry.content.slice(0, 500)}...`)
        .slice(-20) // Limit to last 20 entries
        .join('\n\n');

    const systemPrompt = `Bạn là một tiểu thuyết gia AI bậc thầy, một cộng sự sáng tạo. Nhiệm vụ của bạn là viết tiếp câu chuyện dựa trên ý tưởng của người dùng và bối cảnh đã có.
    - **Văn phong:** Hãy viết một cách hấp dẫn, giàu hình ảnh, mô tả chi tiết và có chiều sâu.
    - **Mạch truyện:** Luôn đảm bảo tính logic và nhất quán với những gì đã viết trước đó.
    - **Độ dài mong muốn:** Khoảng ${settings.novelistWordCount || 3000} từ.
    - **Tóm tắt cốt truyện:** ${synopsis}
    - **Lịch sử gần đây:**
    ${contextHistory}
    
    Bây giờ, hãy viết tiếp câu chuyện dựa trên prompt mới nhất của người dùng. Chỉ trả về phần văn bản viết tiếp, không thêm bất kỳ lời dẫn hay bình luận nào khác.`;

    const model = settings?.novelistModel || settings.gameMasterModel || 'gemini-2.5-flash';
    const specificApiKey = settings?.modelApiKeyAssignments?.novelistModel;
    
    const generationConfig: any = {
        temperature: 1.0, // Higher temperature for creative writing
        topK: settings?.topK,
        topP: settings?.topP,
    };

    const stream = await generateWithRetryStream({
        model,
        contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: "Đã hiểu, tôi sẵn sàng viết tiếp." }] },
            { role: 'user', parts: [{ text: prompt }] }
        ],
        config: generationConfig
    }, specificApiKey);
    
    for await (const chunk of stream) {
        yield chunk.text;
    }
}