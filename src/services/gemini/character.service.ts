import { Type } from "@google/genai";
import type { ElementType } from 'react';
import type { InnateTalent, CharacterIdentity, GameState, Gender, NPC, PlayerNpcRelationship, ModTalent, ModTalentRank, TalentSystemConfig, Element, Currency, CharacterAttributes, StatBonus, SpiritualRoot, ItemType, ItemQuality, ModAttributeSystem, GenerationMode } from '../../types';
import { TALENT_RANK_NAMES, ALL_ATTRIBUTES, NARRATIVE_STYLES, SPIRITUAL_ROOT_CONFIG, NPC_DENSITY_LEVELS, DEFAULT_ATTRIBUTE_DEFINITIONS } from "../../constants";
import { generateWithRetry, generateImagesWithRetry } from './gemini.core';
import * as db from '../dbService';

export const generateCharacterFromPrompts = async (
    context: {
        draftIdentity: Omit<CharacterIdentity, 'origin' | 'age'>;
        raceInput: string;
        backgroundInput: string;
    },
    attributeSystem: ModAttributeSystem
): Promise<{ identity: CharacterIdentity; spiritualRoot: SpiritualRoot; initialBonuses: StatBonus[], initialItems: any[], initialCurrency: Currency }> => {

    const availableAttributes = attributeSystem.definitions
        .filter(def => def.type === 'PRIMARY')
        .map(def => def.name);

    const attributeContext = `
**Hệ Thống Thuộc Tính Của Thế Giới Này (Chỉ số gốc):**
${attributeSystem.definitions
    .filter(def => def.type === 'PRIMARY')
    .map(def => `- ${def.name}: ${def.description}`)
    .join('\n')}
Khi gán "bonuses", bạn CHỈ ĐƯỢC PHÉP sử dụng tên thuộc tính từ danh sách này.`;


    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            refined_appearance: { type: Type.STRING, description: `Một mô tả ngoại hình chi tiết hơn (2-3 câu), kết hợp ý tưởng của người chơi ('${context.draftIdentity.appearance}') với huyết mạch và xuất thân.` },
            origin_story: { type: Type.STRING, description: 'VIẾT MỘT CÂU TRUYỆN NỀN (backstory) HOÀN CHỈNH, có chiều sâu (khoảng 4-6 câu), kết nối tất cả các yếu tố (huyết mạch, xuất thân, tính cách) thành một câu chuyện logic và hấp dẫn.' },
            power_source: {
                type: Type.OBJECT,
                description: "Một 'Nguồn Gốc Sức Mạnh' độc đáo dựa trên toàn bộ thông tin.",
                properties: {
                    name: { type: Type.STRING, description: "Tên gọi độc đáo, thi vị cho nguồn sức mạnh. Ví dụ: 'Huyết Mạch Cổ Long', 'Dị Bảo Thôn Phệ', 'Trái Tim Máy Móc'." },
                    description: { type: Type.STRING, description: "Mô tả chi tiết về nguồn gốc sức mạnh, giải thích nó hoạt động như thế nào." },
                },
                required: ['name', 'description']
            },
            bonuses: {
                type: Type.ARRAY,
                description: "Một danh sách từ 2-4 bonus thuộc tính phù hợp với bản chất của câu chuyện và nguồn sức mạnh.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        attribute: { type: Type.STRING, description: `Tên của thuộc tính. PHẢI là một trong các giá trị sau: ${availableAttributes.join(', ')}` },
                        value: { type: Type.NUMBER, description: "Giá trị bonus, có thể dương hoặc âm." }
                    },
                    required: ['attribute', 'value']
                }
            },
            starting_items: {
                type: Type.ARRAY,
                description: "Danh sách 0-2 vật phẩm khởi đầu phù hợp với xuất thân.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        quantity: { type: Type.NUMBER },
                        description: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['Vũ Khí', 'Phòng Cụ', 'Đan Dược', 'Pháp Bảo', 'Tạp Vật'] as ItemType[] },
                        quality: { type: Type.STRING, enum: ['Phàm Phẩm', 'Linh Phẩm', 'Pháp Phẩm', 'Bảo Phẩm'] as ItemQuality[] },
                        icon: { type: Type.STRING, description: "Một emoji phù hợp."}
                    },
                    required: ['name', 'quantity', 'description', 'type', 'quality', 'icon']
                }
            },
            starting_currency: {
                type: Type.OBJECT,
                description: "Một đối tượng chứa tiền tệ khởi đầu, phù hợp với xuất thân. Ví dụ: một thương nhân giàu có có thể có nhiều 'Bạc'.",
                properties: {
                    "Bạc": { type: Type.NUMBER },
                    "Linh thạch hạ phẩm": { type: Type.NUMBER }
                }
            }
        },
        required: ['refined_appearance', 'origin_story', 'power_source', 'bonuses'],
    };

    const prompt = `Bạn là một nhà văn AI, chuyên tạo ra những nhân vật có chiều sâu cho game nhập vai giả tưởng. Dựa trên các ý tưởng của người chơi và hệ thống thuộc tính của thế giới, hãy diễn giải và kiến tạo nên một nhân vật hoàn chỉnh.

    **MỆNH LỆNH TỐI THƯỢNG:** Phải bám sát 100% vào "Huyết Mạch / Chủng Tộc" và "Xuất Thân / Trưởng Thành" do người chơi cung cấp. Tôn trọng tuyệt đối câu chuyện người chơi đã tạo ra. KHÔNG được bịa ra một thân phận hay bối cảnh mới.

    **Ý Tưởng Cốt Lõi Của Người Chơi:**
    - **Thông tin cơ bản:**
        - Tên: ${context.draftIdentity.name || '(chưa có)'}, Họ: ${context.draftIdentity.familyName || '(chưa có)'}
        - Giới tính: ${context.draftIdentity.gender}
        - Ngoại hình (ý tưởng): "${context.draftIdentity.appearance || '(không có mô tả)'}"
        - Thiên hướng tính cách: ${context.draftIdentity.personality}
    - **Huyết Mạch / Chủng Tộc (ý tưởng):** "${context.raceInput}"
    - **Xuất Thân / Trưởng Thành (ý tưởng):** "${context.backgroundInput}"

    ${attributeContext}

    **Nhiệm vụ:**
    1.  **Tổng hợp & Sáng tạo:** Kết hợp tất cả các ý tưởng trên một cách sáng tạo để tạo ra một nhân vật độc đáo.
    2.  **Viết nên "origin_story":** Đây là phần quan trọng nhất. Hãy viết một đoạn văn kể về câu chuyện nền của nhân vật, giải thích cách các yếu tố trên kết nối với nhau.
    3.  **Hoàn thiện "refined_appearance":** Dựa trên ý tưởng của người chơi, hãy viết một mô tả ngoại hình hoàn chỉnh hơn.
    4.  **Tạo "power_source":** Dựa vào câu chuyện, hãy tạo ra một nguồn gốc sức mạnh độc đáo.
    5.  **Gán "bonuses", "starting_items", và "starting_currency":** Dựa trên toàn bộ câu chuyện, hãy chọn ra các chỉ số thưởng (từ danh sách được cung cấp), vật phẩm và tiền tệ khởi đầu hợp lý. Một thiếu niên nghèo khó thì không có tiền, một công tử nhà giàu thì có nhiều Bạc.

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;
    
    const settings = await db.getSettings();
    const model = settings?.gameMasterModel || 'gemini-2.5-flash';
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;
    
    const generationConfig: any = {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 1.0, // Lowered temperature for better stability and speed
        topK: settings?.topK,
        topP: settings?.topP,
    };
    
    if (model === 'gemini-2.5-flash') {
        generationConfig.thinkingConfig = {
            thinkingBudget: settings?.enableThinking ? settings.thinkingBudget : 0,
        };
    }

    const response = await generateWithRetry({
        model,
        contents: prompt,
        config: generationConfig
    }, specificApiKey);

    const json = JSON.parse(response.text);

    const finalIdentity: CharacterIdentity = {
        ...context.draftIdentity,
        name: context.draftIdentity.name, // Keep player's name
        familyName: context.draftIdentity.familyName,
        appearance: json.refined_appearance,
        origin: json.origin_story,
        age: 18,
    };

    const spiritualRoot: SpiritualRoot = {
        ...json.power_source,
        elements: [],
        quality: 'Thánh Căn', // Custom power sources are always unique
        bonuses: json.bonuses || [],
    };
    
    return {
        identity: finalIdentity,
        spiritualRoot: spiritualRoot,
        initialBonuses: json.bonuses || [],
        initialItems: json.starting_items || [],
        initialCurrency: json.starting_currency || {},
    };
};

export const generateInitialWorldDetails = async (
    gameState: GameState,
    generationMode: GenerationMode
): Promise<{ openingNarrative: string }> => {
    
    const { playerCharacter, discoveredLocations, activeNpcs, gameplaySettings } = gameState;
    const currentLocation = discoveredLocations.find(loc => loc.id === playerCharacter.currentLocationId);
    const dlcs = gameState.creationData?.dlcs;
    const userOpeningStory = gameState.storyLog[0]?.content;
    const hasUserOpening = userOpeningStory && !userOpeningStory.includes('Thế giới xung quanh đang dần được kiến tạo...');

    // If the user provides a custom opening story, we respect it and don't call the AI.
    if (hasUserOpening) {
        return { openingNarrative: userOpeningStory };
    }

    const dlcContext = (dlcs && dlcs.length > 0)
        ? `\n\n### BỐI CẢNH MỞ RỘNG TỪ DLC (ƯU TIÊN CAO) ###\n${dlcs.map(dlc => `--- DLC: ${dlc.title} ---\n${dlc.content}`).join('\n\n')}\n### KẾT THÚC DLC ###`
        : '';

    const existingNpcsContext = activeNpcs.length > 0
        ? `\n\n### CÁC NHÂN VẬT ĐÃ TỒN TẠI TRONG THẾ GIỚI ###\n${activeNpcs.map(npc => `- ${npc.identity.name} (${npc.status}, tại ${discoveredLocations.find(l => l.id === npc.locationId)?.name || 'không rõ'})`).join('\n')}`
        : '';

    const narrativeStyle = NARRATIVE_STYLES.find(s => s.value === gameState.gameplaySettings.narrativeStyle)?.label || 'Cổ điển Tiên hiệp';

    const schema = {
        type: Type.OBJECT,
        properties: {
            opening_narrative: {
                type: Type.STRING,
                description: 'Đoạn văn tường thuật mở đầu câu chuyện, khoảng 4-6 câu, hấp dẫn và phù hợp với bối cảnh.'
            }
        },
        required: ['opening_narrative']
    };

    const prompt = `Bạn là một AI Sáng Thế, có khả năng viết nên chương mở đầu cho một thế giới game tu tiên.
    
    **MỆNH LỆNH TỐI THƯỢNG:** Dựa vào bối cảnh thế giới và thông tin nhân vật đã được tạo sẵn, hãy viết một chương mở đầu thật hấp dẫn.
    - **TUYỆT ĐỐI KHÔNG** tự ý tạo ra các nhân vật mới như "cha", "mẹ", "thanh mai trúc mã" hay bạn bè.
    - **CHỈ SỬ DỤNG** các nhân vật và địa điểm đã có trong bối cảnh cung cấp. Bạn có thể cho nhân vật chính tương tác với một vài NPC đã tồn tại nếu nó làm câu chuyện hay hơn.

    **Thông tin Bối cảnh:**
    - **Nhân Vật Chính:**
        - Tên: ${playerCharacter.identity.name} (${playerCharacter.identity.gender}, ${playerCharacter.identity.age} tuổi)
        - Xuất thân & Câu chuyện nền: ${playerCharacter.identity.origin}
        - Tính cách: ${playerCharacter.identity.personality}
    - **Thế Giới:**
        - Địa điểm bắt đầu: ${currentLocation?.name}. (${currentLocation?.description})
        - Giọng văn tường thuật: ${narrativeStyle}
    ${dlcContext}
    ${existingNpcsContext}

    **Nhiệm vụ:**
    Viết một đoạn văn mở đầu (khoảng 4-6 câu) giới thiệu nhân vật chính trong bối cảnh thế giới đã cho. Làm cho nó thật lôi cuốn và phù hợp.

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;

    const settings = await db.getSettings();
    const model = settings?.gameMasterModel || 'gemini-2.5-flash';
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;

    const generationConfig: any = {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: settings?.temperature,
        topK: settings?.topK,
        topP: settings?.topP,
    };
    
    const response = await generateWithRetry({
        model,
        contents: prompt,
        config: generationConfig
    }, specificApiKey);
    
    if (!response.text || response.text.trim() === '') {
        console.warn("AI response for opening narrative was empty.");
        return { openingNarrative: "(Thiên cơ hỗn loạn, không thể viết nên chương mở đầu.)" };
    }

    // FIX: Explicitly type the caught error as 'any' to resolve the 'unknown' type error.
    try {
        const data = JSON.parse(response.text);
        return { openingNarrative: data.opening_narrative || "(AI không thể tạo chương mở đầu.)" };
    } catch (e: any) {
        console.error("Lỗi phân tích JSON khi khởi tạo thế giới:", response.text, e);
        throw new Error("AI đã trả về dữ liệu không hợp lệ. Vui lòng thử lại.");
    }
};