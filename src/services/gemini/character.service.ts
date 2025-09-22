
import { Type } from "@google/genai";
import type { ElementType } from 'react';
import type { InnateTalent, CharacterIdentity, GameState, Gender, NPC, PlayerNpcRelationship, ModTalent, ModTalentRank, TalentSystemConfig, Element, Currency, CharacterAttributes, WorldlyBackground, TransmigratorLegacy, StatBonus, FormativeEvent, SpiritualRoot } from '../../types';
import { TALENT_RANK_NAMES, ALL_ATTRIBUTES, NARRATIVE_STYLES, SPIRITUAL_ROOT_CONFIG } from "../../constants";
import { generateWithRetry, generateImagesWithRetry } from './gemini.core';
import * as db from '../dbService';

export const generateFormativeEvent = async (origin: { name: string, description: string }): Promise<FormativeEvent> => {
    const eventSchema = {
        type: Type.OBJECT,
        properties: {
            scenario: { type: Type.STRING, description: 'Một kịch bản ngắn gọn, khoảng 2-3 câu, mô tả một sự kiện quan trọng trong quá khứ của nhân vật dựa trên lai lịch của họ.' },
            choices: {
                type: Type.ARRAY,
                description: '3 lựa chọn cho người chơi, mỗi lựa chọn dẫn đến một kết quả và bonus thuộc tính khác nhau.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING, description: 'Nội dung lựa chọn.' },
                        narrative: { type: Type.STRING, description: 'Mô tả ngắn gọn kết quả của lựa chọn này.' },
                        outcome: {
                            type: Type.OBJECT,
                            properties: {
                                attribute: { type: Type.STRING, enum: ['Đạo Tâm', 'Bền Bỉ', 'Ma Đạo', 'Ngộ Tính', 'Cơ Duyên', 'Mị Lực'] },
                                value: { type: Type.NUMBER, description: 'Giá trị bonus, có thể là số dương hoặc âm.' }
                            },
                            required: ['attribute', 'value']
                        }
                    },
                    required: ['text', 'narrative', 'outcome']
                }
            }
        },
        required: ['scenario', 'choices']
    };

    const prompt = `Bạn là một Game Master AI. Hãy tạo một "Sự Kiện Trưởng Thành" (Formative Event) cho nhân vật dựa trên lai lịch của họ.

    **Lai Lịch Nhân Vật:**
    - **Tên Lai Lịch:** ${origin.name}
    - **Mô tả:** ${origin.description}

    **Nhiệm vụ:**
    1.  Tạo ra một kịch bản (scenario) ngắn gọn, phù hợp với lai lịch.
    2.  Tạo ra 3 lựa chọn (choices) có ý nghĩa. Mỗi lựa chọn phải:
        -   Có nội dung rõ ràng.
        -   Có một kết quả tường thuật (narrative) hợp lý.
        -   Gắn liền với một bonus thuộc tính (outcome) phản ánh bản chất của lựa chọn đó. Ví dụ: lựa chọn nhân từ tăng Đạo Tâm, lựa chọn ích kỷ tăng Ma Đạo, lựa chọn thông minh tăng Ngộ Tính.

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;

    const settings = await db.getSettings();
    const model = settings?.gameMasterModel || 'gemini-2.5-flash';
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;

    const response = await generateWithRetry({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: eventSchema
        }
    }, specificApiKey);

    return JSON.parse(response.text) as FormativeEvent;
};


export const generateCharacterIdentity = async (
    context: {
        origin: { name: string; description: string };
        formativeEventResult: { narrative: string; outcome: StatBonus };
        spiritualRoot: SpiritualRoot;
        gender: Gender;
    }
): Promise<Omit<CharacterIdentity, 'gender' | 'age'>> => {
    const identitySchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: 'Tên Hán Việt, phù hợp bối cảnh tiên hiệp. Ví dụ: "Lý Thanh Vân", "Hàn Lập".' },
            familyName: { type: Type.STRING, description: 'Họ của nhân vật, ví dụ: "Lý", "Trần".' },
            origin: { type: Type.STRING, description: 'Xuất thân, nguồn gốc của nhân vật. Phải kết hợp thông tin từ Lai Lịch, Sự Kiện Trưởng Thành và Linh Căn để tạo ra một câu chuyện nền độc đáo và logic.' },
            appearance: { type: Type.STRING, description: 'Mô tả ngoại hình chi tiết, độc đáo, có thể phản ánh Linh Căn hoặc quá khứ của nhân vật.' },
            personality: { type: Type.STRING, enum: ['Trung Lập', 'Chính Trực', 'Hỗn Loạn', 'Tà Ác'], description: 'Một trong các tính cách được liệt kê, phải phù hợp với lựa chọn trong Sự Kiện Trưởng Thành.' },
        },
        required: ['name', 'origin', 'appearance', 'personality', 'familyName'],
    };

    const prompt = `Dựa trên các lựa chọn định mệnh của người chơi trong quá trình tạo nhân vật, hãy tạo ra một Thân Phận (Identity) hoàn chỉnh và sâu sắc.

    **Bối cảnh:** Game tu tiên Tam Thiên Thế Giới.
    **Giới tính:** ${context.gender}

    **Các Lựa Chọn Định Mệnh:**
    1.  **Lai Lịch Khởi Nguyên:**
        - **Tên:** ${context.origin.name}
        - **Mô tả:** ${context.origin.description}
    2.  **Sự Kiện Trưởng Thành:**
        - **Kết quả:** "${context.formativeEventResult.narrative}"
        - **Ảnh hưởng tính cách:** ${context.formativeEventResult.outcome.attribute} +${context.formativeEventResult.outcome.value}
    3.  **Linh Căn Thức Tỉnh:**
        - **Tên:** ${context.spiritualRoot.name}
        - **Mô tả:** ${context.spiritualRoot.description}

    **Nhiệm vụ:**
    Tổng hợp tất cả các thông tin trên để tạo ra một nhân vật nhất quán:
    -   **Xuất thân (origin):** Viết lại một cách chi tiết, kết nối cả 3 yếu tố trên thành một câu chuyện nền mạch lạc.
    -   **Ngoại hình (appearance):** Có thể phản ánh linh căn (ví dụ: người có Hỏa Linh Căn có tóc hơi hung đỏ).
    -   **Tính cách (personality):** Phải phù hợp với lựa chọn trong Sự Kiện Trưởng Thành (ví dụ: lựa chọn nhân từ nên có tính cách Chính Trực hoặc Trung Lập).
    -   **Tên (name) và Họ (familyName):** Sáng tạo một cái tên phù hợp với toàn bộ bối cảnh đã hình thành.

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;
    
    const settings = await db.getSettings();
    const model = settings?.gameMasterModel || 'gemini-2.5-flash';
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;
    
    const generationConfig: any = {
        responseMimeType: "application/json",
        responseSchema: identitySchema,
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

    const json = JSON.parse(response.text);
    return json as Omit<CharacterIdentity, 'gender' | 'age'>;
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

    const isTransmigrator = gameState.gameMode === 'transmigrator';
    const isDefaultFrameworkWorld = worldId === 'phong_than_dien_nghia' || worldId === 'tay_du_ky';
    
    // The DYNAMIC GENESIS RULE is now handled by the character creation flow, no longer needed here.
    const transmigratorInstructions = isTransmigrator
    ? `
**LƯU Ý CỰC KỲ QUAN TRỌNG:** Đây là chế độ "Xuyên Việt Giả". Người chơi là người từ thế giới hiện đại xuyên không tới.
1. Bắt đầu bằng việc mô tả sự bàng hoàng, lạ lẫm của nhân vật khi nhận ra mình đã xuyên không.
2. Ngay sau đó, hãy mô tả sự xuất hiện của "Hệ Thống". Mô tả nó như một giao diện holographic (toàn息投影) màu xanh lam hiện ra trước mắt người chơi, với âm thanh máy móc, vô cảm.
3. Hệ Thống phải thông báo: "Kích hoạt Hệ Thống Xuyên Việt Giả. Chào mừng Ký Chủ."
4. Hệ Thống sau đó phải giao nhiệm vụ đầu tiên: "[Nhiệm vụ Tân Thủ]: Làm quen với thế giới. Mục tiêu: Trò chuyện với một người thân để tìm hiểu bối cảnh."
5. Sử dụng định dạng [HỆ THỐNG]: cho các thông báo của Hệ Thống. Ví dụ: "[HỆ THỐNG]: Nhiệm vụ đã được ban hành."
`
    : '';
    
    const finalInstructions = transmigratorInstructions;

    const prompt = `Bạn là người kể chuyện cho game tu tiên "Tam Thiên Thế Giới". Hãy viết một đoạn văn mở đầu thật hấp dẫn cho người chơi.
    - **Giọng văn:** ${narrativeStyle}. Mô tả chi tiết, hấp dẫn và phù hợp với bối cảnh.
    - **Nhân vật chính:**
        - Tên: ${playerCharacter.identity.name}, ${playerCharacter.identity.age} tuổi.
        - Xuất thân: ${playerCharacter.identity.origin}.
        - **Linh Căn:** ${playerCharacter.spiritualRoot?.name || 'Chưa xác định'}. Mô tả: ${playerCharacter.spiritualRoot?.description || 'Là một phàm nhân bình thường.'}
    - **Địa điểm hiện tại:** ${currentLocation?.name}. Mô tả: ${currentLocation?.description}.
    - **Gia đình & Người thân:**
    ${familyInfo || 'Không có ai thân thích.'}
    ${finalInstructions}

    Nhiệm vụ: Dựa vào thông tin trên, hãy viết một đoạn văn mở đầu khoảng 3-4 câu. Đoạn văn phải thiết lập bối cảnh nhân vật đang ở đâu, làm gì, và cảm xúc của họ. Nó phải phản ánh đúng xuất thân và linh căn vừa được xác định của họ.
    
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
