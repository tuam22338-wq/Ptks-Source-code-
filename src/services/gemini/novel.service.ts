import type { GameSettings, NovelContentEntry } from '../../types';
import { generateWithRetryStream, generateWithRetry } from './gemini.core';
import { NARRATIVE_STYLES } from '../../constants';
import * as db from '../dbService';

export async function* generateNovelChapter(
    prompt: string,
    history: NovelContentEntry[],
    synopsis: string,
    lorebook: string,
    fanficMode: boolean,
    settings: GameSettings
): AsyncIterable<string> {
    
    const contextHistory = history
        .map(entry => entry.type === 'prompt' ? `[USER]: ${entry.content}` : `[AI]: ${entry.content.slice(0, 1000)}...`)
        .slice(-20)
        .join('\n\n');

    const narrativeStyleLabel = NARRATIVE_STYLES.find(s => s.value === settings.novelistNarrativeStyle)?.label || 'Tiên hiệp cổ điển';

    let specialNarrativeInstruction = '';
    if (settings.novelistNarrativeStyle === 'visual_novel') {
        specialNarrativeInstruction = `\n  - **LUẬT VĂN PHONG 'TRỰC QUAN' (ƯU TIÊN CAO):**\n    1. **Bố Cục Rõ Ràng:** Sử dụng các đoạn văn ngắn và xuống dòng thường xuyên.\n    2. **Sử Dụng Emote:** Lồng ghép các biểu tượng cảm xúc (emote) một cách tự nhiên.`;
    } else if (settings.novelistNarrativeStyle === 'dialogue_focused') {
        specialNarrativeInstruction = `\n  - **LUẬT VĂN PHONG 'ĐỐI THOẠI TỰ NHIÊN' (ƯU TIÊN CAO):**\n    1. **Ưu Tiên Hội Thoại:** Tập trung tối đa vào các đoạn hội thoại.\n    2. **Lược Bỏ Mô Tả:** Giảm thiểu các đoạn văn mô tả không cần thiết.`;
    }

    const fanficInstruction = fanficMode ? `**CHẾ ĐỘ ĐỒNG NHÂN (ƯU TIÊN TUYỆT ĐỐI):** Bạn PHẢI tuân thủ nghiêm ngặt các thông tin trong LOREBOOK và bối cảnh. KHÔNG được sáng tạo thêm các chi tiết mâu thuẫn với nguồn.` : '';

    const systemPrompt = `Bạn là một tiểu thuyết gia AI bậc thầy, một cộng sự sáng tạo.

**BỐI CẢNH CÂU CHUYỆN:**
- **Tóm tắt tổng thể:** ${synopsis}
- **Lorebook (Ground Truth):**\n${lorebook || 'Chưa có thông tin.'}
- **Lịch sử gần đây:**\n${contextHistory}

**YÊU CẦU TỪ NGƯỜI DÙNG:**
"${prompt}"

**NHIỆM VỤ CỦA BẠN:**
Bạn là một trợ lý sáng tác AI. Hãy phản hồi yêu cầu của người dùng một cách hữu ích và sáng tạo.
- Nếu người dùng yêu cầu viết tiếp, hãy viết chương tiếp theo của câu chuyện.
- Nếu người dùng hỏi về cốt truyện, nhân vật, hoặc đưa ra ý tưởng, hãy thảo luận và trả lời câu hỏi của họ dựa trên bối cảnh đã cung cấp.
- Nếu người dùng yêu cầu tóm tắt, hãy tóm tắt.

**QUY TẮC SÁNG TÁC (PHẢI TUÂN THEO):**
1.  **Văn Phong:** ${narrativeStyleLabel}.${specialNarrativeInstruction}
2.  **Logic & Nhất Quán:** TUYỆT ĐỐI không mâu thuẫn với tóm tắt, lorebook và lịch sử gần đây.
3.  **Chiều Sâu:** Phát triển nhân vật và cốt truyện một cách có chiều sâu.
4.  **Độ dài:** Nếu viết truyện, hãy viết một chương dài khoảng ${settings.novelistWordCount} từ.
5.  **Định dạng:** Chỉ trả về phần văn bản của câu trả lời. KHÔNG thêm lời chào, tóm tắt, hay bình luận bên ngoài.
6.  ${fanficInstruction}

Bắt đầu phản hồi.`;

    const model = settings?.novelistModel || 'gemini-2.5-flash';
    const specificApiKey = settings?.modelApiKeyAssignments?.novelistModel;
    
    const generationConfig: any = {
        temperature: settings.novelistTemperature,
        topK: settings.novelistTopK,
        topP: settings.novelistTopP,
    };
    
    if (model === 'gemini-2.5-flash' && settings.novelistEnableThinking) {
        const thinkingBudget = settings.novelistThinkingBudget || 500;
        generationConfig.thinkingConfig = { thinkingBudget: Math.min(thinkingBudget, 8000) };
    }
    
    const stream = await generateWithRetryStream({
        model,
        contents: systemPrompt,
    }, specificApiKey);
    
    for await (const chunk of stream) {
        yield chunk.text;
    }
}


export const extractLoreFromText = async (text: string, settings: GameSettings): Promise<string> => {
    const prompt = `Bạn là một AI phân tích văn bản. Hãy đọc kỹ đoạn văn bản sau và trích xuất các thông tin quan trọng để tạo thành một "lorebook" (sổ tay kiến thức).
    
    Định dạng đầu ra phải rõ ràng, sử dụng markdown với các tiêu đề cho từng mục. Các mục cần trích xuất bao gồm:
    - **Nhân vật chính:** Tên và mô tả ngắn gọn.
    - **Nhân vật phụ:** Danh sách các nhân vật khác và vai trò của họ.
    - **Tóm tắt Cốt truyện:** Tóm tắt các sự kiện chính đã xảy ra.
    - **Địa điểm:** Các địa điểm quan trọng được đề cập.
    - **Vật phẩm/Khái niệm đặc biệt:** Bất kỳ vật phẩm, phép thuật, hoặc khái niệm độc đáo nào.

    Văn bản cần phân tích:
    ---
    ${text.slice(0, 50000)}
    ---
    
    Bắt đầu tạo Lorebook:
    `;
    
    const model = settings?.novelistModel || 'gemini-2.5-flash';
    const specificApiKey = settings?.modelApiKeyAssignments?.novelistModel;
    
    const response = await generateWithRetry({
        model,
        contents: prompt
    }, specificApiKey);

    return response.text.trim();
};