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

    **MỆNH LỆNH TỐI THƯỢỢNG:** Phải bám sát 100% vào "Huyết Mạch / Chủng Tộc" và "Xuất Thân / Trưởng Thành" do người chơi cung cấp. Tôn trọng tuyệt đối câu chuyện người chơi đã tạo ra. KHÔNG được bịa ra một thân phận hay bối cảnh mới.

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
): Promise<{ npcs: NPC[], relationships: PlayerNpcRelationship[], openingNarrative: string }> => {
    
    const { playerCharacter, discoveredLocations, activeNpcs, activeWorldId, realmSystem, gameplaySettings } = gameState;
    const isStoryMode = gameplaySettings.enableStorySystem;
    const currentLocation = discoveredLocations.find(loc => loc.id === playerCharacter.currentLocationId);
    const dlcs = gameState.creationData?.dlcs;
    const userOpeningStory = gameState.storyLog[0]?.content;
    const hasUserOpening = userOpeningStory && !userOpeningStory.includes('Thế giới xung quanh đang dần được kiến tạo...');


    const dlcContext = (dlcs && dlcs.length > 0)
        ? `\n\n### BỐI CẢNH MỞ RỘNG TỪ DLC (ƯU TIÊN CAO) ###\n${dlcs.map(dlc => `--- DLC: ${dlc.title} ---\n${dlc.content}`).join('\n\n')}\n### KẾT THÚC DLC ###`
        : '';

    const npcDensity = gameState.creationData!.npcDensity; // Should exist here
    const count = NPC_DENSITY_LEVELS.find(d => d.id === npcDensity)?.count ?? 15;

    // Schemas from the original functions
    const familyMemberSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: `Tên của thành viên gia đình, nên có họ là '${playerCharacter.identity.familyName || ''}'.` },
            gender: { type: Type.STRING, enum: ['Nam', 'Nữ'] },
            age: { type: Type.NUMBER, description: 'Tuổi của nhân vật, phải hợp lý so với người chơi (18 tuổi).' },
            relationship_type: { type: Type.STRING, description: 'Mối quan hệ với người chơi (ví dụ: Phụ thân, Mẫu thân, Huynh đệ, Thanh mai trúc mã).' },
            status: { type: Type.STRING, description: 'Mô tả ngắn gọn về tình trạng hoặc nghề nghiệp hiện tại (ví dụ: "Là một thợ rèn trong trấn", "Nội trợ trong gia đình", "Đang học tại trường làng").' },
            description: { type: Type.STRING, description: 'Mô tả ngắn gọn ngoại hình.' },
            personality: { type: Type.STRING, enum: ['Trung Lập', 'Chính Trực', 'Hỗn Loạn', 'Tà Ác'] },
        },
        required: ['name', 'gender', 'age', 'relationship_type', 'status', 'description', 'personality'],
    };

    const availableLocations = discoveredLocations.map(l => l.id);
    const availableRealms = realmSystem.map(r => r.name);
    const elements: Element[] = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ', 'Vô'];

    const dynamicNpcSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            gender: { type: Type.STRING, enum: ['Nam', 'Nữ'] },
            status: { type: Type.STRING, description: 'Mô tả trạng thái hiện tại của NPC (ví dụ: "Đang ngồi thiền trong hang động", "Đang mua bán ở chợ").' },
            description: { type: Type.STRING, description: 'Mô tả ngoại hình của NPC.' },
            origin: { type: Type.STRING, description: 'Mô tả xuất thân, nguồn gốc của NPC.' },
            personality: { type: Type.STRING, description: 'Tính cách của NPC (ví dụ: Trung Lập, Tà Ác, Hỗn Loạn, Chính Trực).' },
            motivation: { type: Type.STRING, description: "Động lực cốt lõi, sâu xa nhất của NPC. Ví dụ: 'Chứng tỏ bản thân', 'Tìm kiếm sự thật', 'Báo thù cho gia tộc'." },
            goals: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách 1-3 mục tiêu dài hạn mà NPC đang theo đuổi. Ví dụ: ['Trở thành đệ nhất luyện đan sư', 'Tìm ra kẻ đã hãm hại sư phụ']." },
            realmName: { type: Type.STRING, enum: availableRealms.length > 0 ? availableRealms : ['Phàm Nhân'], description: 'Cảnh giới tu luyện của NPC, dựa trên sức mạnh của họ. "Phàm Nhân" cho người thường.' },
            element: { type: Type.STRING, enum: elements, description: 'Thuộc tính ngũ hành của NPC.' },
            initialEmotions: {
                type: Type.OBJECT,
                description: "Trạng thái cảm xúc ban đầu của NPC. Dựa vào tính cách để quyết định.",
                properties: {
                    trust: { type: Type.NUMBER, description: "Độ tin tưởng ban đầu (0-100)." },
                    fear: { type: Type.NUMBER, description: "Mức độ sợ hãi/nhút nhát (0-100)." },
                    anger: { type: Type.NUMBER, description: "Mức độ nóng giận/thù địch (0-100)." }
                },
                required: ['trust', 'fear', 'anger']
            },
            ChinhDao: { type: Type.NUMBER, description: 'Điểm Chính Đạo (0-100).' },
            MaDao: { type: Type.NUMBER, description: 'Điểm Ma Đạo (0-100).' },
            LucLuong: { type: Type.NUMBER, description: 'Chỉ số Lực Lượng (sát thương vật lý).' },
            LinhLucSatThuong: { type: Type.NUMBER, description: 'Chỉ số Linh Lực Sát Thương (sát thương phép).' },
            CanCot: { type: Type.NUMBER, description: 'Chỉ số Căn Cốt (phòng ngự vật lý).' },
            NguyenThanKhang: { type: Type.NUMBER, description: 'Chỉ số Nguyên Thần Kháng (phòng ngự phép).' },
            SinhMenh: { type: Type.NUMBER, description: 'Chỉ số Sinh Mệnh chiến đấu.' },
            currency: {
                type: Type.OBJECT,
                description: 'Số tiền NPC sở hữu. Có thể để trống nếu là người thường.',
                properties: {
                    linhThachHaPham: { type: Type.NUMBER, description: 'Số Linh thạch hạ phẩm.' },
                    bac: { type: Type.NUMBER, description: 'Số Bạc.' },
                }
            },
            talents: {
                type: Type.ARRAY,
                description: "Một danh sách từ 0 đến 3 tiên tư độc đáo.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        rank: { type: Type.STRING, enum: TALENT_RANK_NAMES },
                        effect: { type: Type.STRING },
                         bonuses: {
                            type: Type.ARRAY,
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
                    required: ['name', 'description', 'rank', 'effect'],
                },
            },
            locationId: { type: Type.STRING, enum: availableLocations },
        },
        required: ['name', 'gender', 'status', 'description', 'origin', 'personality', 'motivation', 'goals', 'realmName', 'element', 'talents', 'locationId', 'ChinhDao', 'MaDao', 'LucLuong', 'LinhLucSatThuong', 'CanCot', 'NguyenThanKhang', 'SinhMenh', 'currency', 'initialEmotions'],
    };

    const masterSchema = {
        type: Type.OBJECT,
        properties: {
            family_members: {
                type: Type.ARRAY,
                description: 'Danh sách 2-4 thành viên gia đình hoặc bạn bè thân thiết. Họ đều là PHÀM NHÂN.',
                items: familyMemberSchema,
            },
            opening_narrative: {
                type: Type.STRING,
                description: 'Đoạn văn tường thuật mở đầu câu chuyện.'
            },
            dynamic_npcs: {
                type: Type.ARRAY,
                description: `Danh sách ${count} NPC ngẫu nhiên để làm thế giới sống động.`,
                items: dynamicNpcSchema,
            }
        },
        required: ['family_members', 'opening_narrative', 'dynamic_npcs']
    };

    let familyModeInstruction = '';
    let openingModeInstruction = '';
    let npcModeInstruction = '';

    switch(generationMode) {
        case 'deep':
            familyModeInstruction = 'Tạo ra các nhân vật có thêm một chút chiều sâu, có thể có một chi tiết nhỏ về quá khứ hoặc mối quan hệ của họ.';
            openingModeInstruction = 'Đoạn văn nên dài khoảng 4-5 câu, tạo ra một không khí có chiều sâu và gợi mở.';
            npcModeInstruction = `**"Linh Hồn" NPC:** Dựa trên tính cách và xuất thân, hãy gán cho họ một trạng thái cảm xúc, động lực (motivation), và các mục tiêu (goals) hợp lý và có chiều sâu hơn. Hãy cho họ quá khứ và mối quan hệ phức tạp hơn một chút.`;
            break;
        case 'super_deep':
            familyModeInstruction = 'Tạo ra các nhân vật có câu chuyện nền phức tạp hơn. Mối quan hệ giữa họ và người chơi có thể có những mâu thuẫn hoặc bí mật ngầm. Họ nên có tính cách rõ ràng và độc đáo hơn.';
            openingModeInstruction = 'Đoạn văn nên dài khoảng 5-7 câu. Hãy lồng ghép các chi tiết tinh tế, những điềm báo hoặc những yếu tố foreshadowing cho các sự kiện trong tương lai. Làm cho nó thật ấn tượng.';
            npcModeInstruction = `**"Linh Hồn" NPC:** Dựa trên tính cách và xuất thân, hãy gán cho họ một trạng thái cảm xúc, động lực (motivation), và các mục tiêu (goals) hợp lý và có chiều sâu TỐI ĐA. Hãy tạo cho họ những câu chuyện nền phức tạp, có thể có các mối quan hệ chằng chịt với nhau hoặc liên quan đến các sự kiện lớn của thế giới.`;
            break;
        case 'fast':
        default:
            familyModeInstruction = 'Tạo ra các nhân vật một cách nhanh chóng và đơn giản, tập trung vào vai trò của họ.';
            openingModeInstruction = 'Đoạn văn phải ngắn gọn, khoảng 2-3 câu, đi thẳng vào vấn đề.';
            npcModeInstruction = `**"Linh Hồn" NPC:** Dựa trên tính cách và xuất thân, hãy gán cho họ một trạng thái cảm xúc, động lực (motivation), và các mục tiêu (goals) hợp lý. Tập trung vào việc tạo ra các NPC đa dạng một cách nhanh chóng, không cần quá phức tạp về quá khứ.`;
            break;
    }
    
    let storyModeInstruction = '';
    if (isStoryMode) {
        storyModeInstruction = `
        **NHIỆM VỤ CHẾ ĐỘ CỐT TRUYỆN (ƯU TIÊN CAO):**
        1.  **TẠO CỐT TRUYỆN CHÍNH:** Dựa trên xuất thân của nhân vật, hãy tạo ra một dàn bài cho một tuyến nhiệm vụ chính đầu tiên. Nó nên có một mục tiêu rõ ràng và một phản diện hoặc trở ngại ban đầu.
        2.  **TẠO NPC ĐỊNH MỆNH:** Trong danh sách NPC, hãy tạo ít nhất 1-2 "NPC Định Mệnh" (Key NPC) có vai trò quan trọng trong cốt truyện chính (ví dụ: một người thầy, một đối thủ, một người đưa tin). Hãy ghi chú vai trò của họ trong phần "origin".
        3.  **VIẾT MỞ ĐẦU HƯỚNG TRUYỆN:** Đoạn văn mở đầu phải giới thiệu xung đột hoặc mục tiêu đầu tiên của cốt truyện chính, lôi kéo người chơi vào hành trình.`;
    } else {
        storyModeInstruction = `
        **NHIỆM VỤ CHẾ ĐỘ SANDBOX (ƯU TIÊN CAO):**
        1.  **KHÔNG TẠO CỐT TRUYỆN CHÍNH:** Tuyệt đối không tạo ra một tuyến nhiệm vụ chính nào.
        2.  **TẠO THẾ GIỚI MỞ:** Thay vào đó, hãy tập trung tạo ra một thế giới có nhiều "điểm bắt đầu" tiềm năng. Tạo ra các NPC có mục tiêu và kế hoạch riêng thú vị, các tin đồn về những địa điểm bí ẩn, và các xung đột nhỏ giữa các phe phái.
        3.  **VIẾT MỞ ĐẦU TỰ DO:** Đoạn văn mở đầu chỉ nên mô tả trạng thái hiện tại của nhân vật trong một thế giới đang tự vận hành, để người chơi tự quyết định phải làm gì.`;
    }

    const narrativeStyle = NARRATIVE_STYLES.find(s => s.value === gameState.gameplaySettings.narrativeStyle)?.label || 'Cổ điển Tiên hiệp';

    let openingTaskInstruction = '';
    if (hasUserOpening) {
        openingTaskInstruction = `
**NHIỆM VỤ 2: VIẾT TIẾP CỐT TRUYỆN MỞ ĐẦU**
Người chơi đã cung cấp một đoạn mở đầu. Nhiệm vụ của bạn là **VIẾT TIẾP** đoạn văn đó, lồng ghép các nhân vật gia đình/bạn bè (từ Nhiệm vụ 1) vào câu chuyện một cách tự nhiên và liền mạch. Đoạn văn viết tiếp phải tuân theo văn phong và không khí của đoạn mở đầu.
- **ĐOẠN MỞ ĐẦU CỦA NGƯỜI CHƠI (Bối cảnh để viết tiếp):** "${userOpeningStory}"
- **Yêu cầu độ dài:** ${openingModeInstruction}`;
    } else {
        openingTaskInstruction = `
**NHIỆM VỤ 2: VIẾT CỐT TRUYỆN MỞ ĐẦU**
Viết một đoạn văn mở đầu thật hấp dẫn cho người chơi.
- **MỆNH LỆNH TỐI THƯỢỢNG:** Phải bám sát 100% vào "Xuất thân & Câu chuyện nền" được cung cấp. Tôn trọng tuyệt đối câu chuyện người chơi đã tạo ra.
- **Giọng văn:** ${narrativeStyle}.
- **Nội dung:** Thiết lập bối cảnh nhân vật đang ở đâu, làm gì, cảm xúc của họ, và phải lồng ghép cả những người thân vừa được tạo ra ở Nhiệm vụ 1. Phải tuân thủ theo **HƯỚNG DẪN CHẾ ĐỘ CHƠI**.
- **Yêu cầu độ dài:** ${openingModeInstruction}`;
    }

    const prompt = `Bạn là một AI Sáng Thế, có khả năng kiến tạo thế giới game tu tiên "Tam Thiên Thế Giới". Dựa trên thông tin về nhân vật chính, hãy thực hiện đồng thời 3 nhiệm vụ sau và trả về kết quả trong một đối tượng JSON duy nhất.

    **Thông tin Nhân Vật Chính:**
    - Tên: ${playerCharacter.identity.name} (${playerCharacter.identity.gender}, ${playerCharacter.identity.age} tuổi)
    - Họ: ${playerCharacter.identity.familyName || '(Không có)'}
    - Xuất thân & Câu chuyện nền: ${playerCharacter.identity.origin}
    - Tính cách: ${playerCharacter.identity.personality}
    - Nguồn Gốc Sức Mạnh: ${playerCharacter.spiritualRoot?.name || 'Chưa xác định'}. (${playerCharacter.spiritualRoot?.description || 'Là một phàm nhân bình thường.'})
    - Địa điểm hiện tại: ${currentLocation?.name}. (${currentLocation?.description})
    ${dlcContext}
    ---
    **HƯỚNG DẪN CHẾ ĐỘ CHƠI:**
    ${storyModeInstruction}
    ---
    **NHIỆM VỤ 1: TẠO GIA ĐÌNH & BẠN BÈ**
    Tạo ra 2 đến 4 NPC là người thân hoặc bạn bè gần gũi của nhân vật chính. Họ đều là **PHÀM NHÂN**, không phải tu sĩ, và sống cùng địa điểm với người chơi.
    - **Yêu cầu theo chế độ sáng thế:** ${familyModeInstruction}

    ---
    ${openingTaskInstruction}
    ---
    **NHIỆM VỤ 3: TẠO DÂN CƯ CHO THẾ GIỚI (DYNAMIC NPCS)**
    Tạo ra **${count}** NPC độc đáo để làm thế giới sống động. Họ có thể là tu sĩ, yêu ma, dân thường...
    - **QUAN TRỌNG:** KHÔNG tạo ra các NPC có tên trùng với nhân vật chính hoặc những người thân vừa tạo ở Nhiệm vụ 1. Phải tuân thủ theo **HƯỚNG DẪN CHẾ ĐỘ CHƠI**.
    - **Yêu cầu chi tiết:**
        1. **Chỉ số:** Gán cho họ các chỉ số Thiên Hướng, chiến đấu, cảnh giới, ngũ hành, và tài sản phù hợp.
        2. ${npcModeInstruction}
    ---

    Hãy thực hiện cả 3 nhiệm vụ và trả về kết quả trong một đối tượng JSON duy nhất theo schema đã cung cấp.`;

    const settings = await db.getSettings();
    const model = settings?.gameMasterModel || 'gemini-2.5-flash';
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;

    const generationConfig: any = {
        responseMimeType: "application/json",
        responseSchema: masterSchema,
        temperature: settings?.temperature,
        topK: settings?.topK,
        topP: settings?.topP,
    };
    
    if (model === 'gemini-2.5-flash') {
        if (generationMode === 'fast') {
            generationConfig.thinkingConfig = { thinkingBudget: 0 };
        } else {
             generationConfig.thinkingConfig = {
                thinkingBudget: settings?.enableThinking ? settings.thinkingBudget : 0,
            };
        }
    }

    const response = await generateWithRetry({
        model,
        contents: prompt,
        config: generationConfig
    }, specificApiKey);
    
    if (!response.text || response.text.trim() === '') {
        console.warn("AI response for world hydration was empty.");
        return { npcs: [], relationships: [], openingNarrative: "(Thiên cơ hỗn loạn, không thể viết nên chương mở đầu.)" };
    }

    let data;
    try {
        data = JSON.parse(response.text);
    } catch (e) {
        console.error("Lỗi phân tích JSON khi khởi tạo thế giới:", response.text, e);
        throw new Error("AI đã trả về dữ liệu không hợp lệ. Vui lòng thử lại.");
    }
    
    const allNewNpcs: NPC[] = [];
    const generatedRelationships: PlayerNpcRelationship[] = [];

    if (data.family_members) {
        data.family_members.forEach((member: any) => {
            const npcId = `family-npc-${Math.random().toString(36).substring(2, 9)}`;
            const npc: NPC = {
                id: npcId,
                identity: { name: member.name, gender: member.gender, appearance: member.description, origin: `Người thân của ${playerCharacter.identity.name}.`, personality: member.personality, age: member.age, familyName: playerCharacter.identity.familyName, },
                status: member.status, attributes: {}, emotions: { trust: 70, fear: 10, anger: 5 }, memory: { shortTerm: [], longTerm: [] }, motivation: `Bảo vệ và chăm sóc cho gia đình.`, goals: [`Mong ${playerCharacter.identity.name} có một cuộc sống bình an.`], currentPlan: null, talents: [], locationId: playerCharacter.currentLocationId, cultivation: { currentRealmId: 'pham_nhan', currentStageId: 'pn_1', spiritualQi: 0, hasConqueredInnerDemon: true }, techniques: [], inventory: { items: [], weightCapacity: 10 }, currencies: { 'Bạc': 10 + Math.floor(Math.random() * 50) }, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [], tuoiTho: 80,
            };
            allNewNpcs.push(npc);

            const relationship: PlayerNpcRelationship = {
                npcId: npcId, type: member.relationship_type, value: 80 + Math.floor(Math.random() * 20), status: 'Tri kỷ',
            };
            generatedRelationships.push(relationship);
        });
    }

    if(data.dynamic_npcs) {
        const dynamicNpcs = data.dynamic_npcs.map((npcData: any): NPC => {
            const { name, gender, description, origin, personality, talents, realmName, currency, element, initialEmotions, motivation, goals, ...stats } = npcData;
            const targetRealm = realmSystem.find(r => r.name === realmName) || realmSystem[0];
            const targetStage = targetRealm?.stages[Math.floor(Math.random() * (targetRealm?.stages.length || 1))] || {id: 'pn_1', qiRequired: 0};
            const cultivation: NPC['cultivation'] = { currentRealmId: targetRealm?.id || 'pham_nhan', currentStageId: targetStage.id, spiritualQi: Math.floor(Math.random() * targetStage.qiRequired), hasConqueredInnerDemon: false, };
            const baseAttributes: CharacterAttributes = {};
            DEFAULT_ATTRIBUTE_DEFINITIONS.forEach(attrDef => {
                if(attrDef.baseValue !== undefined) { baseAttributes[attrDef.id] = { value: attrDef.baseValue, ...(attrDef.type === 'VITAL' && { maxValue: attrDef.baseValue }) }; }
            });
            const updateAttr = (id: string, value: number) => {
                 if (baseAttributes[id]) {
                    baseAttributes[id].value = value;
                    if(baseAttributes[id].maxValue !== undefined) { baseAttributes[id].maxValue = value; }
                }
            };
            updateAttr('luc_luong', stats.LucLuong || 10);
            updateAttr('linh_luc_sat_thuong', stats.LinhLucSatThuong || 10);
            updateAttr('can_cot', stats.CanCot || 10);
            updateAttr('nguyen_than_khang', stats.NguyenThanKhang || 10);
            updateAttr('sinh_menh', stats.SinhMenh || 100);
            updateAttr('chinh_dao', stats.ChinhDao || 0);
            updateAttr('ma_dao', stats.MaDao || 0);
            const npcCurrencies: Partial<Currency> = {};
            if (currency?.linhThachHaPham > 0) { npcCurrencies['Linh thạch hạ phẩm'] = currency.linhThachHaPham; } else if (targetRealm?.id !== 'pham_nhan') { npcCurrencies['Linh thạch hạ phẩm'] = Math.floor(Math.random() * 20); }
            if (currency?.bac > 0) { npcCurrencies['Bạc'] = currency.bac; } else { npcCurrencies['Bạc'] = 10 + Math.floor(Math.random() * 100); }
            return {
                ...stats, id: `dynamic-npc-${Math.random().toString(36).substring(2, 9)}`, identity: { name, gender, appearance: description, origin, personality, age: 20 + Math.floor(Math.random() * 200) }, element: element || 'Vô', talents: talents || [], attributes: baseAttributes, emotions: initialEmotions || { trust: 50, fear: 10, anger: 10 }, memory: { shortTerm: [], longTerm: [] }, motivation: motivation || "Sống một cuộc sống bình yên.", goals: goals || [], currentPlan: null, cultivation, techniques: [], currencies: npcCurrencies, inventory: { items: [], weightCapacity: 15 }, equipment: {}, healthStatus: 'HEALTHY' as const, activeEffects: [], tuoiTho: 100 + Math.floor(Math.random() * 500)
            };
        });
        allNewNpcs.push(...dynamicNpcs);
    }
    
    const aiGeneratedContinuation = data.opening_narrative || '';
    const finalOpeningNarrative = hasUserOpening
      ? `${userOpeningStory}\n\n${aiGeneratedContinuation}`
      : aiGeneratedContinuation;
    
    return { npcs: allNewNpcs, relationships: generatedRelationships, openingNarrative: finalOpeningNarrative };
};