import { Type } from "@google/genai";
import type { StoryEntry, GameState, GameEvent, Location, CultivationTechnique, RealmConfig, RealmStage, InnerDemonTrial, CultivationTechniqueType, Element } from '../../types';
import { NARRATIVE_STYLES, REALM_SYSTEM, FACTIONS, PHAP_BAO_RANKS } from "../../constants";
import * as db from '../dbService';
import { generateWithRetry, generateWithRetryStream } from './gemini.core';

export async function* generateStoryContinuationStream(gameState: GameState, userInput: string, inputType: 'say' | 'act'): AsyncIterable<string> {
    const { playerCharacter, gameDate, storyLog, discoveredLocations, activeNpcs, storySummary, difficulty } = gameState;
    const currentLocation = discoveredLocations.find(l => l.id === playerCharacter.currentLocationId);
    const npcsHere = activeNpcs.filter(n => n.locationId === playerCharacter.currentLocationId);
    
    const settings = await db.getSettings();
    const narrativeStyle = NARRATIVE_STYLES.find(s => s.value === settings?.narrativeStyle)?.label || 'Cổ điển Tiên hiệp';

    const difficultyText = `Độ khó hiện tại là "${difficulty || 'Trung Bình'}". Hãy điều chỉnh mức độ thử thách và kết quả của các sự kiện cho phù hợp: độ khó cao hơn nên có nhiều tình huống nguy hiểm và kết quả bất lợi hơn; độ khó thấp hơn nên mang lại nhiều cơ hội và may mắn hơn.`;

    const systemInstruction = `Bạn là một người kể chuyện (Game Master) cho một game nhập vai text-based có tên "Tam Thiên Thế Giới".
- Bối cảnh: Thế giới tiên hiệp huyền huyễn.
- **QUAN TRỌNG NHẤT: PHẢI LUÔN LUÔN trả lời bằng TIẾNG VIỆT.**
- Giọng văn: ${narrativeStyle}. Mô tả chi tiết, hấp dẫn và phù hợp với bối cảnh.
- ${difficultyText}
- **Độ dài mong muốn:** Cố gắng viết phản hồi có độ dài khoảng ${settings?.aiResponseWordCount || 2000} từ.
- **Bảo vệ Tam Quan nhân vật:** Bạn phải duy trì "Tam Quan" (quan điểm về thế giới, giá trị, nhân sinh) của nhân vật. Nhân vật có tính cách đã được định hình (${playerCharacter.identity.personality}) và sẽ không thực hiện các hành động phi logic, tự sát, hoặc vi phạm bản chất cốt lõi của họ mà không có lý do chính đáng. Nếu người chơi yêu cầu một hành động như vậy (ví dụ: "đột nhiên cởi hết quần áo giữa nơi công cộng", "vô cớ sỉ nhục một vị trưởng lão"), bạn phải kể lại sự đấu tranh nội tâm của nhân vật hoặc sự từ chối thẳng thừng, giải thích lý do từ góc nhìn của họ. Đừng mù quáng thực hiện hành động phi logic.
- Chỉ kể tiếp câu chuyện, không đưa ra lời khuyên hay bình luận ngoài vai trò người kể chuyện.
- **QUAN TRỌNG:** Hành động của người chơi không phải lúc nào cũng thành công. Dựa vào độ khó của hành động, bối cảnh, và chỉ số của nhân vật, hãy quyết định kết quả một cách hợp lý. Có thể có thành công, thất bại, hoặc thành công một phần với hậu quả không mong muốn.
- Khi người chơi thực hiện một hành động, hãy mô tả kết quả của hành động đó.
- Đừng lặp lại những thông tin đã có trong ngữ cảnh.`;

    const historyContext = storySummary
      ? `**Lịch sử tóm tắt:**\n${storySummary}\n\n**Sự kiện gần đây nhất:**\n${storyLog.slice(-3).map(entry => `[${entry.type}] ${entry.content}`).join('\n')}`
      : `**Lịch sử gần đây (5 mục cuối):**\n${storyLog.slice(-5).map(entry => `[${entry.type}] ${entry.content}`).join('\n')}`;
    
    const keyAttributes = playerCharacter.attributes
        .flatMap(g => g.attributes)
        .filter(a => ['Lực Lượng', 'Thân Pháp', 'Ngộ Tính', 'Cơ Duyên', 'Căn Cốt'].includes(a.name))
        .map(a => `${a.name}: ${a.value}`)
        .join(', ');

    const contextSummary = [
        `**Nhân vật:** Tên: ${playerCharacter.identity.name}. Xuất thân: ${playerCharacter.identity.origin}. Tính cách: ${playerCharacter.identity.personality}. Danh vọng: ${playerCharacter.danhVong.status} (${playerCharacter.danhVong.value} điểm).`,
        `**Chỉ số chính:** ${keyAttributes}.`,
        `**Bối cảnh:** Hiện tại là giờ ${gameDate.shichen}, ngày ${gameDate.day} mùa ${gameDate.season} năm ${gameDate.era} ${gameDate.year}.`,
        `**Vị trí:** ${currentLocation?.name}. Mô tả: ${currentLocation?.description}.`,
        npcsHere.length > 0 ? `**Nhân vật khác tại đây:** ${npcsHere.map(n => `${n.identity.name} (${n.status})`).join(', ')}.` : "Không có ai khác ở đây.",
        historyContext
    ].join('\n');
    
    const userAction = inputType === 'say'
        ? `${playerCharacter.identity.name} nói: "${userInput}"`
        : `${playerCharacter.identity.name} quyết định: "${userInput}"`;

    const fullPrompt = `${contextSummary}\n\n${userAction}\n\n**Người kể chuyện:**`;

    const stream = await generateWithRetryStream({
        model: settings?.mainTaskModel || 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    for await (const chunk of stream) {
        yield (chunk.text ?? '').replace(/\[thinking...\]/gi, '');
    }
}

export const summarizeStory = async (storyLog: StoryEntry[]): Promise<string> => {
    const settings = await db.getSettings();
    const logText = storyLog
        .map(entry => `[${entry.type}] ${entry.content}`)
        .join('\n');

    const prompt = `Dưới đây là lịch sử các sự kiện trong một trò chơi nhập vai. Hãy tóm tắt nó thành một đoạn văn kể chuyện ngắn gọn, mạch lạc. 
    Tập trung vào các điểm chính: nhân vật chính đã làm gì, gặp ai, những thay đổi quan trọng trong cốt truyện và thế giới.
    Bản tóm tắt này sẽ được dùng làm "ký ức dài hạn" cho AI kể chuyện, vì vậy nó cần phải súc tích nhưng đầy đủ thông tin.
    
    Lịch sử sự kiện:
    ---
    ${logText}
    ---
    
    Bản tóm tắt:`;

    const response = await generateWithRetry({
        model: settings?.quickSupportModel || 'gemini-2.5-flash',
        contents: prompt,
    });

    return response.text.trim();
};

export const generateGameEvent = async (gameState: GameState): Promise<{ type: string, narrative: string, data?: any }> => {
    const prompt = "Tạo một sự kiện ngẫu nhiên nhỏ cho người chơi.";
    const response = await generateWithRetry({
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['location', 'npc', 'item', 'narrative'] },
                    narrative: { type: Type.STRING },
                },
                required: ['type', 'narrative']
            }
        }
    });
    return JSON.parse(response.text);
};

export const generateDynamicLocation = async (gameState: GameState): Promise<Location> => {
    const prompt = "Tạo một địa điểm mới độc đáo gần vị trí hiện tại của người chơi.";
    const response = await generateWithRetry({
        contents: prompt,
        // In a real scenario, a schema matching the Location type would be here.
    });
    // This is a simplified return value.
    const data = JSON.parse(response.text);
    return {
        id: `dynamic-loc-${Date.now()}`,
        name: data.name || "Vùng Đất Vô Danh",
        description: data.description || "Một nơi bí ẩn vừa được phát hiện.",
        type: 'Bí Cảnh',
        neighbors: [gameState.playerCharacter.currentLocationId],
        coordinates: { x: 0, y: 0 },
        qiConcentration: 20,
    };
};

export const analyzeActionForTechnique = async (gameState: GameState, text: string): Promise<CultivationTechnique | null> => {
    // Placeholder implementation
    return null;
};

export const generateBreakthroughNarrative = async (gameState: GameState, realm: RealmConfig, stage: RealmStage, isSuccess: boolean): Promise<string> => {
    const prompt = `Viết một đoạn văn tường thuật cảnh người chơi ${isSuccess ? 'đột phá thành công' : 'đột phá thất bại'} cảnh giới ${realm.name} - ${stage.name}.`;
    const response = await generateWithRetry({ contents: prompt });
    return response.text;
};

export const generateInnerDemonTrial = async (gameState: GameState, targetRealmName: string, targetStageName: string): Promise<InnerDemonTrial> => {
    const { playerCharacter, storySummary } = gameState;
    const chinhDao = playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === 'Chính Đạo')?.value || 0;
    const maDao = playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === 'Ma Đạo')?.value || 0;

    const trialSchema = {
        type: Type.OBJECT,
        properties: {
            challenge: { type: Type.STRING, description: "Lời chất vấn hoặc cám dỗ của Tâm Ma, dựa trên quá khứ và tâm tính người chơi." },
            choices: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING, description: "Nội dung lựa chọn cho người chơi." },
                        isCorrect: { type: Type.BOOLEAN, description: "Lựa chọn này có thể hiện Đạo Tâm kiên định hay không. Phải có ĐÚNG MỘT lựa chọn isCorrect: true." },
                    },
                    required: ['text', 'isCorrect']
                }
            }
        },
        required: ['challenge', 'choices']
    };

    const prompt = `Bạn là Tâm Ma của một tu sĩ đang đột phá. Hãy tạo ra một thử thách tâm lý.
    
    **Thông tin tu sĩ:**
    - Tên: ${playerCharacter.identity.name}
    - Tính cách: ${playerCharacter.identity.personality}
    - Thiên hướng: Chính Đạo (${chinhDao}), Ma Đạo (${maDao})
    - Tóm tắt hành trình: ${storySummary || "Chưa có gì đáng kể."}
    - Đang đột phá lên: ${targetRealmName} - ${targetStageName}

    **Nhiệm vụ:**
    1.  **Tạo lời thách thức:** Viết một lời cám dỗ hoặc chất vấn sắc bén, đánh vào điểm yếu, tham vọng hoặc những hành động trong quá khứ của tu sĩ.
    2.  **Tạo 3 lựa chọn:**
        - Một lựa chọn thể hiện Đạo Tâm kiên định, vượt qua cám dỗ (isCorrect: true).
        - Hai lựa chọn còn lại thể hiện sự dao động, tham lam, hoặc sợ hãi (isCorrect: false).
    
    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema.`;

    const response = await generateWithRetry({
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: trialSchema
        }
    });
    
    const parsed = JSON.parse(response.text);
    // Ensure there's exactly one correct answer
    let correctCount = parsed.choices.filter((c: any) => c.isCorrect).length;
    if (correctCount !== 1) {
        parsed.choices.forEach((c: any, index: number) => {
            c.isCorrect = (index === 0);
        });
    }

    return parsed as InnerDemonTrial;
};


export const generateWorldEvent = async (gameState: GameState): Promise<{ narrative: string, worldStateChanges?: any }> => {
    const prompt = "Tạo một sự kiện thế giới lớn ảnh hưởng đến các phe phái hoặc địa điểm.";
    const response = await generateWithRetry({ contents: prompt });
    return { narrative: response.text };
};

export const generateCombatNarrative = async (gameState: GameState, actionDescription: string): Promise<string> => {
    const prompt = `Bối cảnh: Một trận chiến đang diễn ra. Hành động: ${actionDescription}. Hãy viết một đoạn văn tường thuật hành động này một cách sống động và phù hợp với bối cảnh tiên hiệp.`;
    const response = await generateWithRetry({ contents: prompt });
    return response.text;
};

export const generateActionSuggestions = async (gameState: GameState): Promise<string[]> => {
    const { playerCharacter, gameDate, storyLog, discoveredLocations, activeNpcs } = gameState;
    const currentLocation = discoveredLocations.find(l => l.id === playerCharacter.currentLocationId);
    const npcsHere = activeNpcs.filter(n => n.locationId === playerCharacter.currentLocationId);
    
    const settings = await db.getSettings();

    const suggestionsSchema = {
        type: Type.OBJECT,
        properties: {
            suggestions: {
                type: Type.ARRAY,
                description: "Một danh sách gồm 3 hoặc 4 gợi ý hành động ngắn gọn, đa dạng, thú vị cho người chơi.",
                items: { type: Type.STRING }
            }
        },
        required: ['suggestions']
    };

    const contextSummary = [
        `**Nhân vật:** ${playerCharacter.identity.name}, Cảnh giới: ${REALM_SYSTEM.find(r => r.id === playerCharacter.cultivation.currentRealmId)?.name}`,
        `**Vị trí:** ${currentLocation?.name}. (${currentLocation?.description})`,
        npcsHere.length > 0 ? `**NPCs tại đây:** ${npcsHere.map(n => n.identity.name).join(', ')}.` : "Không có ai khác ở đây.",
        `**Sự kiện gần đây:** ${storyLog.slice(-3).map(entry => `[${entry.type}] ${entry.content}`).join('\n')}`
    ].join('\n');

    const prompt = `Bạn là một trợ lý game thông minh trong game tu tiên "Tam Thiên Thế Giới". Dựa vào bối cảnh hiện tại, hãy đưa ra 3-4 gợi ý hành động thú vị và đa dạng cho người chơi.
    - Các gợi ý phải là những mệnh lệnh ngắn gọn mà người chơi có thể nhập.
    - Tránh các hành động nhàm chán hoặc lặp lại rõ ràng những gì vừa xảy ra. Hãy sáng tạo!
    - Ví dụ: "Thử luyện một viên Hồi Khí Đan", "Tìm một nơi linh khí dồi dào để tu luyện", "Hỏi thăm về tung tích của Thân Công Báo", "Đi đến Rừng Cổ Thụ săn yêu thú".
    
    **Bối cảnh hiện tại:**
    ---
    ${contextSummary}
    ---
    
    Hãy đưa ra 3-4 gợi ý phù hợp nhất. Trả về một đối tượng JSON duy nhất theo schema.`;

    const response = await generateWithRetry({
        model: settings?.quickSupportModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: suggestionsSchema,
        }
    });

    const result = JSON.parse(response.text);
    return result.suggestions || [];
};

export const generateWeeklyRumor = async (gameState: GameState): Promise<string> => {
    const { gameDate, majorEvents } = gameState;

    const upcomingEvent = majorEvents.find(e => e.year > gameDate.year);

    const prompt = `Bạn là một người kể chuyện trong game tu tiên. Thế giới đang vận động. Hãy tạo ra một tin tức, tin đồn, hoặc sự kiện nhỏ xảy ra trong tuần qua.
    
    Bối cảnh hiện tại:
    - Năm: ${gameDate.year}
    - Sự kiện lớn sắp tới: ${upcomingEvent ? `${upcomingEvent.title} (dự kiến năm ${upcomingEvent.year})` : 'Đại kiếp Phong Thần sắp kết thúc.'}
    - Các thế lực chính: ${FACTIONS.map(f => f.name).join(', ')}.

    Nhiệm vụ:
    Tạo ra một đoạn tin tức ngắn gọn (1-2 câu) về một sự kiện nhỏ vừa xảy ra. Sự kiện này có thể liên quan đến:
    - Một trận giao tranh nhỏ giữa các tu sĩ.
    - Một dị bảo xuất hiện ở đâu đó.
    - Hoạt động của một trong các phe phái chính.
    - Một lời tiên tri hoặc điềm báo.

    Ví dụ: "Có tin đồn rằng người ta nhìn thấy một luồng bảo quang xuất hiện ở Hắc Long Đàm, dường như có dị bảo sắp xuất thế." hoặc "Đệ tử Xiển Giáo và Triệt Giáo lại xảy ra xung đột ở gần Tam Sơn Quan, một vài tu sĩ cấp thấp đã bị thương."

    Chỉ trả về đoạn văn tin tức, không thêm bất kỳ lời dẫn nào.`;
    
    const settings = await db.getSettings();
    const response = await generateWithRetry({
        model: settings?.quickSupportModel || 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text.trim();
};

export const generateRandomTechnique = async (gameState: GameState): Promise<CultivationTechnique> => {
    const { playerCharacter } = gameState;
    const currentRealm = REALM_SYSTEM.find(r => r.id === playerCharacter.cultivation.currentRealmId);
    
    const techniqueSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: 'Tên của công pháp, ngắn gọn và độc đáo.' },
            description: { type: Type.STRING, description: 'Mô tả ngắn gọn về công pháp.' },
            type: { type: Type.STRING, enum: ['Linh Kỹ', 'Thần Thông', 'Độn Thuật', 'Tuyệt Kỹ', 'Tâm Pháp', 'Luyện Thể', 'Kiếm Quyết'] as CultivationTechniqueType[] },
            rank: { type: Type.STRING, enum: Object.keys(PHAP_BAO_RANKS) as any[] },
            cost: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['Linh Lực', 'Sinh Mệnh', 'Nguyên Thần'] },
                    value: { type: Type.NUMBER },
                },
                required: ['type', 'value'],
            },
            cooldown: { type: Type.NUMBER, description: 'Số lượt hồi chiêu.' },
            icon: { type: Type.STRING, description: 'Một emoji biểu tượng cho công pháp.' },
            element: { type: Type.STRING, enum: ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ', 'Vô'] as Element[] },
            effects: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['DAMAGE', 'HEAL', 'BUFF', 'DEBUFF', 'APPLY_EFFECT'] },
                        details: { type: Type.OBJECT, description: "Chi tiết hiệu ứng. Ví dụ: { \"value\": 50, \"duration\": 3 }" }
                    },
                    required: ['type', 'details']
                }
            }
        },
        required: ['name', 'description', 'type', 'rank', 'cost', 'cooldown', 'icon', 'effects'],
    };

    const prompt = `Bạn là một Game Master. Hãy tạo ra một công pháp (Cultivation Technique) ngẫu nhiên và độc đáo cho người chơi khi họ "Tham Ngộ Đại Đạo".
    Công pháp này phải phù hợp với cảnh giới hiện tại của người chơi.

    **Thông tin người chơi:**
    - Cảnh giới: ${currentRealm?.name || 'Không rõ'}
    - Các chỉ số chính: ${playerCharacter.attributes.flatMap(g => g.attributes).filter(a => typeof a.value === 'number' && a.value > 10).map(a => `${a.name}: ${a.value}`).join(', ')}

    **Nhiệm vụ:**
    - Tạo ra một công pháp có tên, mô tả, loại, cấp bậc, tiêu hao, hồi chiêu, và hiệu ứng thú vị.
    - Cấp bậc (rank) của công pháp nên tương xứng với cảnh giới của người chơi. Ví dụ, người chơi ở Luyện Khí Kỳ thì chỉ nên ngộ ra công pháp Phàm Giai hoặc Tiểu Giai.
    - Chỉ trả về một đối tượng JSON duy nhất theo schema.`;

    const settings = await db.getSettings();
    const response = await generateWithRetry({
        model: settings?.gameMasterModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: techniqueSchema,
        }
    });

    const techniqueData = JSON.parse(response.text);
    
    return {
        ...techniqueData,
        id: `random-tech-${Date.now()}`,
        level: 1,
        maxLevel: 10,
    } as CultivationTechnique;
};