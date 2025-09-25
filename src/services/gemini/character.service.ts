

import { Type } from "@google/genai";
import type { ElementType } from 'react';
import type { InnateTalent, CharacterIdentity, GameState, Gender, NPC, PlayerNpcRelationship, ModTalent, ModTalentRank, TalentSystemConfig, Element, Currency, CharacterAttributes, StatBonus, SpiritualRoot, ItemType, ItemQuality } from '../../types';
import { TALENT_RANK_NAMES, ALL_ATTRIBUTES, NARRATIVE_STYLES, SPIRITUAL_ROOT_CONFIG } from "../../constants";
import { generateWithRetry, generateImagesWithRetry } from './gemini.core';
import * as db from '../dbService';

export const generateCharacterFromPrompts = async (
    context: {
        draftIdentity: Omit<CharacterIdentity, 'origin' | 'age'>;
        raceInput: string;
        backgroundInput: string;
    }
): Promise<{ identity: CharacterIdentity; spiritualRoot: SpiritualRoot; initialBonuses: StatBonus[], initialItems: any[], initialCurrency: Currency }> => {

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
                        attribute: { type: Type.STRING, enum: ALL_ATTRIBUTES },
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

    const prompt = `Bạn là một nhà văn AI, chuyên tạo ra những nhân vật có chiều sâu cho game tu tiên. Dựa trên các ý tưởng của người chơi, hãy diễn giải và kiến tạo nên một nhân vật hoàn chỉnh.

    **Ý Tưởng Cốt Lõi Của Người Chơi:**
    - **Thông tin cơ bản:**
        - Tên: ${context.draftIdentity.name || '(chưa có)'}, Họ: ${context.draftIdentity.familyName || '(chưa có)'}
        - Giới tính: ${context.draftIdentity.gender}
        - Ngoại hình (ý tưởng): "${context.draftIdentity.appearance || '(không có mô tả)'}"
        - Thiên hướng tính cách: ${context.draftIdentity.personality}
    - **Huyết Mạch / Chủng Tộc (ý tưởng):** "${context.raceInput}"
    - **Xuất Thân / Trưởng Thành (ý tưởng):** "${context.backgroundInput}"

    **Nhiệm vụ:**
    1.  **Tổng hợp & Sáng tạo:** Kết hợp tất cả các ý tưởng trên một cách sáng tạo để tạo ra một nhân vật độc đáo.
    2.  **Viết nên "origin_story":** Đây là phần quan trọng nhất. Hãy viết một đoạn văn kể về câu chuyện nền của nhân vật, giải thích cách các yếu tố trên kết nối với nhau.
    3.  **Hoàn thiện "refined_appearance":** Dựa trên ý tưởng của người chơi, hãy viết một mô tả ngoại hình hoàn chỉnh hơn.
    4.  **Tạo "power_source":** Dựa vào câu chuyện, hãy tạo ra một nguồn gốc sức mạnh độc đáo.
    5.  **Gán "bonuses", "starting_items", và "starting_currency":** Dựa trên toàn bộ câu chuyện, hãy chọn ra các chỉ số thưởng, vật phẩm và tiền tệ khởi đầu hợp lý. Một thiếu niên nghèo khó thì không có tiền, một công tử nhà giàu thì có nhiều Bạc.

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;
    
    const settings = await db.getSettings();
    const model = settings?.gameMasterModel || 'gemini-2.5-flash';
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;
    
    const generationConfig: any = {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 1.1, // Higher temperature for more creative character generation
        topK: settings?.topK,
        topP: settings?.topP,
    };
    
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

export const generateFamilyAndFriends = async (identity: CharacterIdentity, locationId: string): Promise<{ npcs: NPC[], relationships: PlayerNpcRelationship[] }> => {
    const familySchema = {
        type: Type.OBJECT,
        properties: {
            family_members: {
                type: Type.ARRAY,
                description: 'Một danh sách gồm 2 đến 4 thành viên gia đình hoặc bạn bè thân thiết (ví dụ: cha, mẹ, anh/chị/em, bạn thân).',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: `Tên của thành viên gia đình, nên có họ là '${identity.familyName || ''}'.` },
                        gender: { type: Type.STRING, enum: ['Nam', 'Nữ'] },
                        age: { type: Type.NUMBER, description: 'Tuổi của nhân vật, phải hợp lý so với người chơi (18 tuổi).' },
                        relationship_type: { type: Type.STRING, description: 'Mối quan hệ với người chơi (ví dụ: Phụ thân, Mẫu thân, Huynh đệ, Thanh mai trúc mã).' },
                        status: { type: Type.STRING, description: 'Mô tả ngắn gọn về tình trạng hoặc nghề nghiệp hiện tại (ví dụ: "Là một thợ rèn trong trấn", "Nội trợ trong gia đình", "Đang học tại trường làng").' },
                        description: { type: Type.STRING, description: 'Mô tả ngắn gọn ngoại hình.' },
                        personality: { type: Type.STRING, enum: ['Trung Lập', 'Chính Trực', 'Hỗn Loạn', 'Tà Ác'] },
                    },
                    required: ['name', 'gender', 'age', 'relationship_type', 'status', 'description', 'personality'],
                },
            }
        },
        required: ['family_members'],
    };

    const prompt = `Dựa trên thông tin về nhân vật chính, hãy tạo ra các thành viên gia đình và bạn bè thân thiết cho họ.
    - **Bối cảnh:** Game tu tiên Tam Thiên Thế Giới, một thế giới huyền huyễn.
    - **Nhân vật chính:**
        - Tên: ${identity.name} (${identity.gender}, 18 tuổi)
        - Họ: ${identity.familyName || '(Không có)'}
        - Xuất thân: ${identity.origin}
        - Tính cách: ${identity.personality}
    
    Nhiệm vụ: Tạo ra 2 đến 4 NPC là người thân hoặc bạn bè gần gũi của nhân vật chính. Họ đều là PHÀM NHÂN, không phải tu sĩ. Họ nên sống cùng một địa điểm với người chơi.
    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.
    `;
    
    const settings = await db.getSettings();
    const model = settings?.npcSimulationModel || 'gemini-2.5-flash';
    const specificApiKey = settings?.modelApiKeyAssignments?.npcSimulationModel;

    const generationConfig: any = {
        responseMimeType: "application/json",
        responseSchema: familySchema,
        temperature: settings?.temperature,
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

    const data = JSON.parse(response.text);
    const generatedNpcs: NPC[] = [];
    const generatedRelationships: PlayerNpcRelationship[] = [];

    data.family_members.forEach((member: any) => {
        const npcId = `family-npc-${Math.random().toString(36).substring(2, 9)}`;
        const npc: NPC = {
            id: npcId,
            identity: {
                name: member.name,
                gender: member.gender,
                appearance: member.description,
                origin: `Người thân của ${identity.name} tại ${locationId}.`,
                personality: member.personality,
                age: member.age,
                familyName: identity.familyName,
            },
            status: member.status,
            attributes: {}, // They are mortals, few attributes needed
            emotions: { trust: 70, fear: 10, anger: 5 }, // Family starts with high trust
            memory: { shortTerm: [], longTerm: [] },
            motivation: `Bảo vệ và chăm sóc cho gia đình.`,
            goals: [`Mong ${identity.name} có một cuộc sống bình an.`],
            currentPlan: null,
            talents: [],
            locationId: locationId,
            cultivation: { currentRealmId: 'pham_nhan', currentStageId: 'pn_1', spiritualQi: 0, hasConqueredInnerDemon: true },
            techniques: [],
            inventory: { items: [], weightCapacity: 10 },
            currencies: { 'Bạc': 10 + Math.floor(Math.random() * 50) },
            equipment: {},
            healthStatus: 'HEALTHY',
            activeEffects: [],
            tuoiTho: 80, // Mortal lifespan
        };
        generatedNpcs.push(npc);

        const relationship: PlayerNpcRelationship = {
            npcId: npcId,
            type: member.relationship_type,
            value: 80 + Math.floor(Math.random() * 20), // Start with high affinity
            status: 'Tri kỷ',
        };
        generatedRelationships.push(relationship);
    });

    return { npcs: generatedNpcs, relationships: generatedRelationships };
};

export const generateOpeningScene = async (gameState: GameState, worldId: string): Promise<string> => {
    const { playerCharacter, discoveredLocations, activeNpcs } = gameState;
    const currentLocation = discoveredLocations.find(loc => loc.id === playerCharacter.currentLocationId);
    
    const familyInfo = playerCharacter.relationships
        .map(rel => {
            const npc = activeNpcs.find(n => n.id === rel.npcId);
            return npc ? `- ${rel.type}: ${npc.identity.name} (${npc.status})` : null;
        })
        .filter(Boolean)
        .join('\n');
    
    const settings = await db.getSettings();
    const narrativeStyle = NARRATIVE_STYLES.find(s => s.value === settings?.narrativeStyle)?.label || 'Cổ điển Tiên hiệp';
    
    const prompt = `Bạn là người kể chuyện cho game tu tiên "Tam Thiên Thế Giới". Hãy viết một đoạn văn mở đầu thật hấp dẫn cho người chơi.

    ### MỆNH LỆNH TỐI THƯỢỢNG (PHẢI TUÂN THEO 100%) ###
    Bạn BẮT BUỘC phải viết đoạn mở đầu bám sát 100% vào "Xuất thân & Câu chuyện nền" được cung cấp. TUYỆT ĐỐI KHÔNG được bịa ra một kịch bản "thiếu niên nghèo khó" chung chung nếu nó không khớp với câu chuyện. Hãy tôn trọng tuyệt đối câu chuyện người chơi đã tạo ra.

    - **Giọng văn:** ${narrativeStyle}. Mô tả chi tiết, hấp dẫn và phù hợp với bối cảnh.
    - **Nhân vật chính:**
        - Tên: ${playerCharacter.identity.name}, ${playerCharacter.identity.age} tuổi.
        - Xuất thân & Câu chuyện nền: ${playerCharacter.identity.origin}.
        - **Nguồn Gốc Sức Mạnh:** ${playerCharacter.spiritualRoot?.name || 'Chưa xác định'}. Mô tả: ${playerCharacter.spiritualRoot?.description || 'Là một phàm nhân bình thường.'}
    - **Địa điểm hiện tại:** ${currentLocation?.name}. Mô tả: ${currentLocation?.description}.
    - **Gia đình & Người thân:**
    ${familyInfo || 'Không có ai thân thích.'}

    Nhiệm vụ: Dựa vào thông tin trên, hãy viết một đoạn văn mở đầu khoảng 3-4 câu. Đoạn văn phải thiết lập bối cảnh nhân vật đang ở đâu, làm gì, và cảm xúc của họ. Nó phải phản ánh đúng xuất thân và nguồn gốc sức mạnh của họ.
    
    Ví dụ:
    "Lý Thanh Vân đứng lặng trước tảng đá trắc linh đã nguội lạnh, trong lòng vẫn còn dư chấn từ kết quả 'Hỏa Thiên Linh Căn' ngoài sức tưởng tượng. Ánh mắt của vị trưởng lão, của những người trong gia tộc, có ngưỡng mộ, có ghen tị, tất cả đều đổ dồn về phía hắn, một thiếu niên từ chi thứ vốn không được ai chú ý."
    
    Hãy viết một đoạn văn độc đáo và phù hợp với nhân vật. Chỉ trả về đoạn văn tường thuật, không thêm bất kỳ lời dẫn hay bình luận nào khác.`;

    const model = settings?.mainTaskModel || 'gemini-2.5-flash';
    const specificApiKey = settings?.modelApiKeyAssignments?.mainTaskModel;
    
    const generationConfig: any = {
        temperature: settings?.temperature,
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

    return response.text.trim();
};
