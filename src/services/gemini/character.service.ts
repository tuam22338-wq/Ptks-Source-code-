

import { Type } from "@google/genai";
import type { ElementType } from 'react';
import type { InnateTalent, CharacterIdentity, GameState, Gender, NPC, PlayerNpcRelationship, ModTalent, ModTalentRank, TalentSystemConfig, Element, Currency, CharacterAttributes, StatBonus, SpiritualRoot, CharacterCreationChoice } from '../../types';
import { TALENT_RANK_NAMES, ALL_ATTRIBUTES, NARRATIVE_STYLES, SPIRITUAL_ROOT_CONFIG } from "../../constants";
import { generateWithRetry, generateImagesWithRetry } from './gemini.core';
import * as db from '../dbService';

export const generatePowerSource = async (context: { raceName: string, backgroundName: string, playerInput?: string }): Promise<SpiritualRoot> => {
    const powerSourceSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "Một cái tên độc đáo và thi vị cho nguồn gốc sức mạnh này. Ví dụ: 'Huyết Mạch Cổ Long', 'Dị Bảo Thôn Phệ', 'Trái Tim Máy Móc'." },
            description: { type: Type.STRING, description: "Mô tả chi tiết về nguồn gốc sức mạnh, giải thích nó hoạt động như thế nào và ảnh hưởng đến nhân vật ra sao." },
            bonuses: {
                type: Type.ARRAY,
                description: "Một danh sách từ 2-4 bonus thuộc tính phù hợp với bản chất của nguồn sức mạnh.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        attribute: { type: Type.STRING, enum: ALL_ATTRIBUTES },
                        value: { type: Type.NUMBER, description: "Giá trị bonus, có thể dương hoặc âm." }
                    },
                    required: ['attribute', 'value']
                }
            }
        },
        required: ['name', 'description', 'bonuses']
    };

    const prompt = `Bạn là một Game Master AI. Hãy tạo ra một "Nguồn Gốc Sức Mạnh" (Power Source) cho nhân vật dựa trên các thông tin sau.

    **Bối cảnh nhân vật:**
    - **Chủng tộc:** ${context.raceName}
    - **Xuất thân:** ${context.backgroundName}
    ${context.playerInput ? `- **Mô tả của người chơi:** "${context.playerInput}"` : ''}

    **Nhiệm vụ:**
    1.  **Phân tích:** Dựa vào các thông tin trên, hãy hình dung ra một nguồn sức mạnh độc đáo.
        -   Nếu có mô tả của người chơi, hãy dựa vào đó làm ý tưởng chính.
        -   Nếu không có, hãy tự do sáng tạo dựa trên chủng tộc và xuất thân.
    2.  **Sáng tạo:** Tạo ra Tên, Mô tả, và các Bonus thuộc tính phù hợp.
        -   Bonus phải phản ánh đúng bản chất của sức mạnh. Ví dụ: Huyết Mạch Rồng thì tăng Lực Lượng, Căn Cốt. Trái tim máy móc có thể tăng Bền Bỉ nhưng giảm Đạo Tâm.

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;
    
    const settings = await db.getSettings();
    const model = settings?.gameMasterModel || 'gemini-2.5-flash';
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;

    const response = await generateWithRetry({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: powerSourceSchema
        }
    }, specificApiKey);
    
    const result = JSON.parse(response.text);

    // Make it compatible with SpiritualRoot type
    return {
        ...result,
        elements: [], // Can be enhanced later to derive elements
        quality: 'Thánh Căn', // Custom power sources are always unique
    } as SpiritualRoot;
};

export const generateCharacterDetails = async (
    context: {
        race: CharacterCreationChoice;
        background: CharacterCreationChoice;
        powerSource: SpiritualRoot;
        draftIdentity: Omit<CharacterIdentity, 'origin' | 'age'>;
    }
): Promise<CharacterIdentity> => {
    const identitySchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: `Tên Hán Việt, phù hợp bối cảnh. Có thể giữ nguyên hoặc cải tiến từ tên người chơi nhập: '${context.draftIdentity.name}'.` },
            familyName: { type: Type.STRING, description: `Họ của nhân vật. Có thể giữ nguyên hoặc cải tiến từ họ người chơi nhập: '${context.draftIdentity.familyName}'.` },
            appearance: { type: Type.STRING, description: `Mô tả ngoại hình chi tiết hơn, kết hợp ý tưởng của người chơi ('${context.draftIdentity.appearance}') với các yếu tố từ chủng tộc, xuất thân và sức mạnh.` },
            origin: { type: Type.STRING, description: 'VIẾT MỘT CÂU TRUYỆN NỀN (backstory) HOÀN CHỈNH, có chiều sâu, kết nối tất cả các yếu tố (chủng tộc, xuất thân, sức mạnh) thành một câu chuyện logic, mạch lạc và hấp dẫn.' },
        },
        required: ['name', 'familyName', 'appearance', 'origin'],
    };

    const prompt = `Bạn là một nhà văn AI, chuyên tạo ra những nhân vật có chiều sâu cho game tu tiên. Dựa trên các lựa chọn của người chơi, hãy hoàn thiện chi tiết và viết nên một câu chuyện nền hấp dẫn cho nhân vật của họ.

    **Các Lựa Chọn Của Người Chơi:**
    - **Thông tin cơ bản (Bản nháp):**
        - Tên: ${context.draftIdentity.name || '(chưa có)'}, Họ: ${context.draftIdentity.familyName || '(chưa có)'}
        - Giới tính: ${context.draftIdentity.gender}
        - Ngoại hình (ý tưởng): "${context.draftIdentity.appearance || '(không có mô tả)'}"
        - Tính cách: ${context.draftIdentity.personality}
    - **Chủng tộc:** ${context.race.name} (${context.race.description})
    - **Xuất thân:** ${context.background.name} (${context.background.description})
    - **Nguồn gốc sức mạnh:** ${context.powerSource.name} (${context.powerSource.description})

    **Nhiệm vụ:**
    1.  **Tổng hợp:** Kết hợp tất cả các yếu tố trên một cách sáng tạo.
    2.  **Hoàn thiện Tên & Ngoại hình:** Dựa trên bản nháp của người chơi, hãy đề xuất một phiên bản hoàn thiện hơn nếu cần. Tên phải Hán Việt. Ngoại hình nên phản ánh cả chủng tộc và sức mạnh.
    3.  **Viết nên "Xuất Thân" (origin):** Đây là phần quan trọng nhất. Hãy viết một đoạn văn (khoảng 4-6 câu) kể về câu chuyện nền của nhân vật, giải thích cách các yếu tố trên kết nối với nhau. Ví dụ: một Tiên Tộc (chủng tộc) vì sao lại có xuất thân Nô Lệ? Nguồn sức mạnh của họ đã thức tỉnh như thế nào trong hoàn cảnh đó?

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
    return {
        ...context.draftIdentity, // Keep gender and personality from player's choice
        ...json,
        age: 18, // Default starting age
    } as CharacterIdentity;
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
