import type { GameSettings, NovelContentEntry } from '../../types';
import { generateWithRetryStream } from './gemini.core';
import { NARRATIVE_STYLES } from '../../constants';

export async function* generateNovelChapter(
    prompt: string,
    history: NovelContentEntry[],
    synopsis: string,
    settings: GameSettings
): AsyncIterable<string> {
    
    // Create a condensed history for context
    const contextHistory = history
        .map(entry => entry.type === 'prompt' ? `[USER]: ${entry.content}` : `[AI]: ${entry.content.slice(0, 1000)}...`) // Increase context length
        .slice(-20) // Limit to last 20 entries
        .join('\n\n');

    const narrativeStyleLabel = NARRATIVE_STYLES.find(s => s.value === settings.novelistNarrativeStyle)?.label || 'Tiên hiệp cổ điển';

    let specialNarrativeInstruction = '';
    if (settings.novelistNarrativeStyle === 'visual_novel') {
        specialNarrativeInstruction = `
  - **LUẬT VĂN PHONG 'TRỰC QUAN' (ƯU TIÊN CAO):**
    1. **Bố Cục Rõ Ràng:** Sử dụng các đoạn văn ngắn và xuống dòng thường xuyên để tạo bố cục thoáng, dễ đọc.
    2. **Sử Dụng Emote:** Lồng ghép các biểu tượng cảm xúc (emote) một cách tự nhiên vào lời thoại và mô tả để thể hiện cảm xúc nhân vật và không khí. Ví dụ: "(¬_¬)", "ㄟ( ▔, ▔ )ㄏ", "🔥", "❄️".
    3. **Tập Trung Trực Quan:** Ưu tiên mô tả những gì nhân vật nhìn thấy và cảm nhận trực tiếp.`;
    } else if (settings.novelistNarrativeStyle === 'dialogue_focused') {
        specialNarrativeInstruction = `
  - **LUẬT VĂN PHONG 'ĐỐI THOẠI TỰ NHIÊN' (ƯU TIÊN CAO):**
    1. **Ưu Tiên Hội Thoại:** Tập trung tối đa vào các đoạn hội thoại. Lời thoại phải tự nhiên, trôi chảy như đời thật.
    2. **Lược Bỏ Mô Tả:** Giảm thiểu tối đa các đoạn văn mô tả môi trường, hành động không cần thiết. Chỉ mô tả những hành động quan trọng hoặc biểu cảm tinh tế để bổ trợ cho hội thoại.
    3. **Nhịp Độ Nhanh:** Giữ cho câu chuyện tiến triển nhanh chóng thông qua các cuộc đối thoại.`;
    }

    const systemPrompt = `Bạn là một tiểu thuyết gia AI bậc thầy, một cộng sự sáng tạo có khả năng viết lách đa thể loại với văn phong lôi cuốn, logic chặt chẽ.

**BỐI CẢNH CÂU CHUYỆN:**
- **Tóm tắt tổng thể:** ${synopsis}
- **Lịch sử gần đây (quan trọng nhất):**
${contextHistory}

**YÊU CẦU TỪ NGƯỜI DÙNG:**
"${prompt}"

**NHIỆM VỤ CỦA BẠN:**
Viết chương tiếp theo của câu chuyện.

**QUY TẮC SÁNG TÁC (PHẢI TUÂN THEO):**
1.  **Văn Phong (Phong cách viết):** ${narrativeStyleLabel}. Hãy thể hiện đúng tinh thần của thể loại này. Sử dụng ngôn ngữ giàu hình ảnh, biểu cảm và phù hợp.
${specialNarrativeInstruction}
2.  **Logic & Nhất Quán:** TUYỆT ĐỐI không mâu thuẫn với tóm tắt và lịch sử gần đây. Mọi tình tiết phải hợp lý. Duy trì sự nhất quán trong tính cách và động cơ của nhân vật.
3.  **Chiều Sâu Nhân Vật:** Phát triển nhân vật dựa trên hành động và suy nghĩ của họ. Cho họ động cơ rõ ràng, mâu thuẫn nội tâm, và để họ phát triển qua các sự kiện.
4.  **Nhịp Độ:** Giữ nhịp độ truyện hấp dẫn. Kết hợp giữa mô tả (môi trường, cảm xúc), hành động, và hội thoại một cách cân bằng.
5.  **Cấu Trúc:** Bắt đầu bằng việc thiết lập bối cảnh cho chương truyện, sau đó đẩy cao trào, và kết thúc bằng một tình tiết gợi mở (cliffhanger) hoặc một khoảnh khắc lắng đọng có ý nghĩa.
6.  **Độ dài:** Viết một chương truyện dài khoảng ${settings.novelistWordCount} từ.
7.  **Định dạng:** Chỉ trả về phần văn bản của chương truyện. KHÔNG thêm lời chào, tóm tắt, hay bình luận bên ngoài câu chuyện.

Bắt đầu viết.`;

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
        contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: "Đã hiểu, tôi sẵn sàng viết tiếp." }] }
        ],
        config: generationConfig
    }, specificApiKey);
    
    for await (const chunk of stream) {
        yield chunk.text;
    }
}