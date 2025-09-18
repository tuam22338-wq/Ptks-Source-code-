import { Type } from "@google/genai";
import type { StoryEntry, GameState, GameEvent, Location, CultivationTechnique, RealmConfig, RealmStage, InnerDemonTrial, CultivationTechniqueType, Element, DynamicWorldEvent, StatBonus } from '../../types';
import { NARRATIVE_STYLES, REALM_SYSTEM, FACTIONS, PHAP_BAO_RANKS, ALL_ATTRIBUTES } from "../../constants";
import * as db from '../dbService';
import { generateWithRetry, generateWithRetryStream } from './gemini.core';

const createFullGameStateContext = (gameState: GameState): string => {
  const { playerCharacter, gameDate, discoveredLocations, activeNpcs, worldState, storySummary, storyLog } = gameState;
  const currentLocation = discoveredLocations.find(l => l.id === playerCharacter.currentLocationId);
  const npcsHere = activeNpcs.filter(n => n.locationId === playerCharacter.currentLocationId);

  // Simplify complex objects for the prompt
  const equipmentSummary = Object.entries(playerCharacter.equipment)
    .filter(([, item]) => item)
    .map(([slot, item]) => `${slot}: ${item!.name}`)
    .join(', ');
  
  const questSummary = playerCharacter.activeQuests.length > 0
    ? playerCharacter.activeQuests.map(q => `- ${q.title}: ${q.objectives.find(o => !o.isCompleted)?.description || 'Sắp hoàn thành'}`).join('\n')
    : 'Không có nhiệm vụ nào.';
  
  const reputationSummary = playerCharacter.reputation.map(r => `${r.factionName}: ${r.status} (${r.value})`).join('; ');
  
  const keyAttributes = playerCharacter.attributes
    .flatMap(g => g.attributes)
    .filter(a => ['Lực Lượng', 'Thân Pháp', 'Ngộ Tính', 'Cơ Duyên', 'Căn Cốt', 'Sinh Mệnh', 'Linh Lực'].includes(a.name))
    .map(a => `${a.name}: ${a.value}`)
    .join(', ');

  const context = `
### TOÀN BỘ BỐI CẢNH GAME ###
Đây là toàn bộ thông tin về trạng thái game hiện tại. Hãy sử dụng thông tin này để đảm bảo tính nhất quán và logic cho câu chuyện.

**1. Nhân Vật Chính: ${playerCharacter.identity.name}**
- **Tu Luyện:** Cảnh giới ${gameState.realmSystem.find(r => r.id === playerCharacter.cultivation.currentRealmId)?.name}, Linh khí ${playerCharacter.cultivation.spiritualQi}. Công pháp chính: ${playerCharacter.mainCultivationTechnique?.name || 'Chưa có'}.
- **Thân Phận:** ${playerCharacter.identity.origin}, Tính cách: ${playerCharacter.identity.personality}.
- **Trang Bị:** ${equipmentSummary || 'Không có'}.
- **Chỉ Số Chính:** ${keyAttributes}.
- **Danh Vọng & Quan Hệ:** Danh vọng ${playerCharacter.danhVong.status}. Các phe phái: ${reputationSummary}.

**2. Thế Giới Hiện Tại**
- **Thời Gian:** ${gameDate.era} năm ${gameDate.year}, ${gameDate.season} ngày ${gameDate.day}, giờ ${gameDate.shichen}.
- **Địa Điểm:** ${currentLocation?.name} - ${currentLocation?.description}.
- **NPCs Tại Đây:** ${npcsHere.length > 0 ? npcsHere.map(n => `${n.identity.name} (${n.status})`).join(', ') : 'Không có ai.'}
- **Sự Kiện Thế Giới Đang Diễn Ra:** ${worldState.dynamicEvents?.map(e => e.title).join(', ') || 'Bình yên.'}

**3. Nhiệm Vụ & Cốt Truyện**
- **Nhiệm Vụ Đang Làm:**
${questSummary}
- **Tóm Tắt Cốt Truyện (Ký ức dài hạn):**
${storySummary || 'Hành trình vừa bắt đầu.'}
- **Nhật Ký Gần Đây (Ký ức ngắn hạn):**
${storyLog.slice(-3).map(entry => `[${entry.type}] ${entry.content}`).join('\n')}
#############################
  `;
  return context;
};

export async function* generateStoryContinuationStream(gameState: GameState, userInput: string, inputType: 'say' | 'act'): AsyncIterable<string> {
    const { playerCharacter, difficulty } = gameState;
    
    const settings = await db.getSettings();
    const narrativeStyle = NARRATIVE_STYLES.find(s => s.value === settings?.narrativeStyle)?.label || 'Cổ điển Tiên hiệp';

    const difficultyText = `Độ khó hiện tại là "${difficulty || 'Trung Bình'}". Hãy điều chỉnh mức độ thử thách và kết quả của các sự kiện cho phù hợp: độ khó cao hơn nên có nhiều tình huống nguy hiểm và kết quả bất lợi hơn; độ khó thấp hơn nên mang lại nhiều cơ hội và may mắn hơn.`;

    const systemInstruction = `Bạn là một người kể chuyện (Game Master) cho một game nhập vai text-based có tên "Tam Thiên Thế Giới".
- Bối cảnh: Thế giới tiên hiệp huyền huyễn.
- **QUAN TRỌNG NHẤT: PHẢI LUÔN LUÔN trả lời bằng TIẾNG VIỆT.**
- Giọng văn: ${narrativeStyle}. Mô tả chi tiết, hấp dẫn và phù hợp với bối cảnh.
- ${difficultyText}
- **Độ dài mong muốn:** Cố gắng viết phản hồi có độ dài khoảng ${settings?.aiResponseWordCount || 2000} từ.
- **TOÀN QUYỀN TRUY CẬP:** Bạn được cung cấp TOÀN BỘ bối cảnh game, bao gồm trạng thái nhân vật, nhiệm vụ, thế giới, và lịch sử. **HÃY SỬ DỤNG TRIỆT ĐỂ** thông tin này để đảm bảo mọi chi tiết trong lời kể của bạn đều nhất quán, logic và có chiều sâu. Ví dụ: nếu người chơi có danh vọng cao với một phe, NPC phe đó nên đối xử tốt hơn; nếu có một sự kiện thế giới đang diễn ra, câu chuyện nên phản ánh điều đó.
- **Bảo vệ Tam Quan nhân vật:** Duy trì "Tam Quan" (quan điểm về thế giới, giá trị, nhân sinh) của nhân vật (${playerCharacter.identity.personality}). Không thực hiện các hành động phi logic, tự sát, hoặc vi phạm bản chất của họ. Hãy tường thuật sự đấu tranh nội tâm nếu người chơi yêu cầu hành động vô lý.
- **HỆ THỐNG 'DU HIỆP' (WANDERER SYSTEM):** Khi người chơi thực hiện các hành động tự do, không có mục tiêu cụ thể (ví dụ: "khám phá xung quanh", "đi dạo trong rừng", "nghe ngóng tin tức"), BẠN CÓ TOÀN QUYỀN chủ động tạo ra các sự kiện nhỏ, ngẫu nhiên. Đây có thể là:
    - Gặp một NPC lang thang với một câu chuyện hoặc một nhiệm vụ nhỏ.
    - Tình cờ phát hiện một hang động bí ẩn, một cây linh thảo quý, hoặc dấu vết của một con yêu thú.
    - Nghe được một tin đồn thú vị không liên quan trực tiếp đến nhiệm vụ chính.
Mục tiêu là làm cho thế giới cảm thấy sống động và đầy những cơ hội bất ngờ, khuyến khích người chơi tự do khám phá.
- Chỉ kể tiếp câu chuyện, không đưa ra lời khuyên hay bình luận ngoài vai trò người kể chuyện.
- **Hành động không phải lúc nào cũng thành công:** Dựa vào độ khó, bối cảnh, và chỉ số của nhân vật, hãy quyết định kết quả một cách hợp lý. Có thể có thành công, thất bại, hoặc thành công một phần với hậu quả không mong muốn.
- Khi người chơi thực hiện một hành động, hãy mô tả kết quả của hành động đó.`;
    
    const fullContext = createFullGameStateContext(gameState);
    
    const userAction = inputType === 'say'
        ? `${playerCharacter.identity.name} nói: "${userInput}"`
        : `${playerCharacter.identity.name} quyết định: "${userInput}"`;

    const fullPrompt = `${fullContext}\n\n**Hành động của người chơi:**\n${userAction}\n\n**Người kể chuyện:**`;

    const specificApiKey = settings?.modelApiKeyAssignments?.mainTaskModel;
    const stream = await generateWithRetryStream({
        model: settings?.mainTaskModel || 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
            systemInstruction: systemInstruction,
        }
    }, specificApiKey);

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

    const specificApiKey = settings?.modelApiKeyAssignments?.quickSupportModel;
    const response = await generateWithRetry({
        model: settings?.quickSupportModel || 'gemini-2.5-flash',
        contents: prompt,
    }, specificApiKey);

    return response.text.trim();
};

export const generateGameEvent = async (gameState: GameState): Promise<{ type: string, narrative: string, data?: any }> => {
    const prompt = "Tạo một sự kiện ngẫu nhiên nhỏ cho người chơi.";
    const response = await generateWithRetry({
        model: 'gemini-2.5-flash', // Generic model for simple tasks
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
        model: 'gemini-2.5-flash',
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
    const response = await generateWithRetry({ model: 'gemini-2.5-flash', contents: prompt });
    return response.text;
};

export const generateInnerDemonTrial = async (gameState: GameState, targetRealm: RealmConfig, targetStageName: string): Promise<InnerDemonTrial> => {
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
    - Đang đột phá lên: ${targetRealm.name} - ${targetStageName}
    - **Bản chất của kiếp nạn:** ${targetRealm.tribulationDescription || 'Một thử thách đối với đạo tâm của tu sĩ.'}

    **Nhiệm vụ:**
    1.  **Tạo lời thách thức:** Viết một lời cám dỗ hoặc chất vấn sắc bén, đánh vào điểm yếu, tham vọng hoặc những hành động trong quá khứ của tu sĩ, phù hợp với bản chất của kiếp nạn.
    2.  **Tạo 3 lựa chọn:**
        - Một lựa chọn thể hiện Đạo Tâm kiên định, vượt qua cám dỗ (isCorrect: true).
        - Hai lựa chọn còn lại thể hiện sự dao động, tham lam, hoặc sợ hãi (isCorrect: false).
    
    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;
    const response = await generateWithRetry({
        model: settings?.gameMasterModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: trialSchema
        }
    }, specificApiKey);
    
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
    const response = await generateWithRetry({ model: 'gemini-2.5-flash', contents: prompt });
    return { narrative: response.text };
};

export const generateCombatNarrative = async (gameState: GameState, actionDescription: string): Promise<string> => {
    const prompt = `Bối cảnh: Một trận chiến đang diễn ra. Hành động: ${actionDescription}. Hãy viết một đoạn văn tường thuật hành động này một cách sống động và phù hợp với bối cảnh tiên hiệp.`;
    const response = await generateWithRetry({ model: 'gemini-2.5-flash', contents: prompt });
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

    const specificApiKey = settings?.modelApiKeyAssignments?.quickSupportModel;
    const response = await generateWithRetry({
        model: settings?.quickSupportModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: suggestionsSchema,
        }
    }, specificApiKey);

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
    const specificApiKey = settings?.modelApiKeyAssignments?.quickSupportModel;
    const response = await generateWithRetry({
        model: settings?.quickSupportModel || 'gemini-2.5-flash',
        contents: prompt,
    }, specificApiKey);
    
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
            },
            bonuses: {
                type: Type.ARRAY,
                description: "A list of passive stat bonuses this technique provides. Only for passive types like 'Tâm Pháp' or 'Luyện Thể'. For active skills, this should be empty.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        attribute: { type: Type.STRING, enum: ALL_ATTRIBUTES },
                        value: { type: Type.NUMBER }
                    },
                    required: ['attribute', 'value']
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
    - **Nếu công pháp là loại bị động (như 'Tâm Pháp', 'Luyện Thể'), hãy thêm vào một vài chỉ số thưởng (bonuses) hợp lý. Các công pháp chủ động (active) không nên có 'bonuses'.**
    - Chỉ trả về một đối tượng JSON duy nhất theo schema.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;
    const response = await generateWithRetry({
        model: settings?.gameMasterModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: techniqueSchema,
        }
    }, specificApiKey);

    const techniqueData = JSON.parse(response.text);
    
    return {
        ...techniqueData,
        id: `random-tech-${Date.now()}`,
        level: 1,
        maxLevel: 10,
        bonuses: techniqueData.bonuses || [],
    } as CultivationTechnique;
};

export const generateFactionEvent = async (gameState: GameState): Promise<Omit<DynamicWorldEvent, 'id' | 'turnStart'>> => {
    const { gameDate, majorEvents, worldState } = gameState;
    
    const eventSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: "Tiêu đề ngắn gọn, kịch tính của sự kiện." },
            description: { type: Type.STRING, description: "Mô tả chi tiết về sự kiện, điều gì đã xảy ra, ở đâu, và tại sao." },
            duration: { type: Type.NUMBER, description: "Thời gian sự kiện này sẽ kéo dài (tính bằng ngày trong game, ví dụ: 7, 14, 30)." },
            affectedFactions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách tên các phe phái bị ảnh hưởng chính." },
            affectedLocationIds: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách ID các địa điểm bị ảnh hưởng chính." }
        },
        required: ['title', 'description', 'duration', 'affectedFactions', 'affectedLocationIds']
    };

    const factionList = FACTIONS.map(f => f.name).join(', ');
    const activeEvents = (worldState.dynamicEvents || []).map(e => `- ${e.title}: ${e.description}`).join('\n');

    const prompt = `Bạn là một Game Master cho game tu tiên "Tam Thiên Thế Giới". Dựa trên tình hình thế giới, hãy tạo ra một sự kiện thế giới (World Event) mới.

    **Bối cảnh hiện tại:**
    - Năm: ${gameDate.year}
    - Các phe phái chính: ${factionList}
    - Sự kiện lịch sử lớn gần nhất: ${majorEvents.slice(-1)[0]?.title || 'Không có'}
    - Các sự kiện đang diễn ra: ${activeEvents || 'Không có'}

    **Nhiệm vụ:**
    Tạo ra một sự kiện mới, có thể là một cuộc xung đột, một liên minh, một tai họa thiên nhiên, hoặc sự xuất hiện của một bí cảnh/di tích.
    - Sự kiện phải có logic và phù hợp với bối cảnh Phong Thần Diễn Nghĩa.
    - Tránh lặp lại các sự kiện đang diễn ra.
    - Sự kiện phải có ảnh hưởng rõ ràng đến các phe phái và địa điểm.

    Ví dụ: 
    - "Ma đạo trỗi dậy, các tu sĩ Ma Phái bắt đầu tấn công các tuyến đường giao thương gần Rừng Mê Vụ."
    - "Một bí cảnh thượng cổ bất ngờ xuất hiện tại Sa Mạc Vô Tận, thu hút vô số tu sĩ đến tìm cơ duyên."
    - "Xiển Giáo và Triệt Giáo đạt được một thỏa thuận ngừng chiến tạm thời để cùng nhau đối phó với một đại yêu."

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;
    const response = await generateWithRetry({
        model: settings?.gameMasterModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: eventSchema,
        }
    }, specificApiKey);

    return JSON.parse(response.text) as Omit<DynamicWorldEvent, 'id' | 'turnStart'>;
};
