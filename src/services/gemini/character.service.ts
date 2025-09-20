import { Type } from "@google/genai";
import type { ElementType } from 'react';
import type { InnateTalent, CharacterIdentity, GameState, Gender, NPC, PlayerNpcRelationship, ModTalent, ModTalentRank, TalentSystemConfig, Element, Currency } from '../../types';
import { TALENT_RANK_NAMES, ALL_ATTRIBUTES, NARRATIVE_STYLES, SPIRITUAL_ROOT_CONFIG } from "../../constants";
import { generateWithRetry, generateImagesWithRetry } from './gemini.core';
import * as db from '../dbService';

export const generateCharacterIdentity = async (concept: string, gender: Gender): Promise<Omit<CharacterIdentity, 'gender' | 'age'>> => {
    const identitySchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: 'Tên Hán Việt, phù hợp bối cảnh tiên hiệp. Ví dụ: "Lý Thanh Vân", "Hàn Lập".' },
            familyName: { type: Type.STRING, description: 'Họ của nhân vật, ví dụ: "Lý", "Trần".' },
            origin: { type: Type.STRING, description: 'Xuất thân, nguồn gốc của nhân vật, chi tiết và lôi cuốn.' },
            appearance: { type: Type.STRING, description: 'Mô tả ngoại hình chi tiết, độc đáo.' },
            personality: { type: Type.STRING, enum: ['Trung Lập', 'Chính Trực', 'Hỗn Loạn', 'Tà Ác'], description: 'Một trong các tính cách được liệt kê.' },
            suggestedElement: { type: Type.STRING, enum: Object.keys(SPIRITUAL_ROOT_CONFIG).filter(k => k !== 'Vô' && k !== 'Dị' && k !== 'Hỗn Độn'), description: 'Gợi ý một nguyên tố Linh Căn phù hợp nhất với ý tưởng nhân vật.' },
        },
        required: ['name', 'origin', 'appearance', 'personality', 'familyName', 'suggestedElement'],
    };

    const prompt = `Dựa trên ý tưởng và bối cảnh game tu tiên Tam Thiên Thế Giới, hãy tạo ra Thân Phận (Identity) cho một nhân vật.
    - **Bối cảnh:** Tam Thiên Thế Giới, thế giới huyền huyễn, tiên hiệp.
    - **Giới tính nhân vật:** ${gender}
    - **Ý tưởng gốc từ người chơi:** "${concept}"
    
    Nhiệm vụ: Sáng tạo ra một cái tên, họ, xuất thân, ngoại hình, và tính cách độc đáo, sâu sắc và phù hợp với bối cảnh. Đồng thời, gợi ý một thuộc tính Linh Căn (Kim, Mộc, Thủy, Hỏa, Thổ) phù hợp nhất với bản chất nhân vật.
    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.
    `;
    
    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;
    const response = await generateWithRetry({
        model: settings?.gameMasterModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: identitySchema,
        }
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
    const specificApiKey = settings?.modelApiKeyAssignments?.npcSimulationModel;
    const response = await generateWithRetry({
        model: settings?.npcSimulationModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: familySchema,
        }
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
            attributes: [], // They are mortals, few attributes needed
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

    const isTransmigrator = worldId === 'xuyen_viet_gia_phong_than';
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

    const prompt = `Bạn là người kể chuyện cho game tu tiên "Tam Thiên Thế Giới". Hãy viết một đoạn văn mở đầu thật hấp dẫn cho người chơi, lồng ghép vào đó là cảnh kiểm tra linh căn của họ.
    - **Giọng văn:** ${narrativeStyle}. Mô tả chi tiết, hấp dẫn và phù hợp với bối cảnh.
    - **Nhân vật chính:**
        - Tên: ${playerCharacter.identity.name}, ${playerCharacter.identity.age} tuổi.
        - Xuất thân: ${playerCharacter.identity.origin}.
        - **Linh Căn:** ${playerCharacter.spiritualRoot?.name || 'Không có'}. Mô tả: ${playerCharacter.spiritualRoot?.description || 'Là một phàm nhân bình thường.'}
    - **Địa điểm hiện tại:** ${currentLocation?.name}. Mô tả: ${currentLocation?.description}.
    - **Gia đình & Người thân:**
    ${familyInfo || 'Không có ai thân thích.'}
    ${transmigratorInstructions}

    Nhiệm vụ: Dựa vào thông tin trên, hãy viết một đoạn văn mở đầu khoảng 3-4 câu. Đoạn văn phải thiết lập bối cảnh: người chơi đang ở đâu, và mô tả lại khoảnh khắc họ vừa biết được kết quả linh căn của mình. Cảm xúc của họ (vui mừng, thất vọng, hay bình thản) nên phản ánh phẩm chất linh căn của họ.
    
    Ví dụ cho chế độ thường:
    "Tảng đá trắc linh trước mặt Lý Thanh Vân nguội dần, ánh sáng màu đỏ rực rỡ cũng từ từ lụi tắt. Vị trưởng lão vuốt râu gật gù, 'Hỏa Thiên Linh Căn, phẩm chất tuyệt hảo, là hạt giống tốt để tu luyện Hỏa hệ công pháp!'. Tin tức này khiến cả gia tộc chấn động, còn ngươi thì vẫn đang ngây người trước kết quả ngoài sức tưởng tượng này."
    
    Hãy viết một đoạn văn độc đáo và phù hợp với nhân vật. Chỉ trả về đoạn văn tường thuật, không thêm bất kỳ lời dẫn hay bình luận nào khác.`;

    const specificApiKey = settings?.modelApiKeyAssignments?.mainTaskModel;
    const response = await generateWithRetry({
        model: settings?.mainTaskModel || 'gemini-2.5-flash',
        contents: prompt,
    }, specificApiKey);

    return response.text.trim();
};