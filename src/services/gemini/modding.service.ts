import { Type } from "@google/genai";
import type { CommunityMod, FullMod, ModInfo, StatBonus, EventTriggerType, EventOutcomeType, ModAttributeSystem, RealmConfig, QuickActionBarConfig, NamedRealmSystem, Faction, ModLocation, ModNpc, ModForeshadowedEvent, MajorEvent, ModTagDefinition } from '../../types';
import { ALL_ATTRIBUTES, COMMUNITY_MODS_URL, UI_ICONS, DEFAULT_ATTRIBUTE_DEFINITIONS, DEFAULT_ATTRIBUTE_GROUPS } from "../../constants";
import { generateWithRetry, generateWithRetryStream } from './gemini.core';
import * as db from '../dbService';

export const fetchCommunityMods = async (): Promise<CommunityMod[]> => {
    try {
        const response = await fetch(COMMUNITY_MODS_URL);
        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }
        const data: CommunityMod[] = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch community mods:", error);
        return [{
            modInfo: {
                id: 'fallback-mod-example',
                name: 'Thần Binh Lợi Khí (Ví dụ)',
                author: 'Game Master',
                description: 'Không thể tải danh sách mod cộng đồng. Đây là một ví dụ mẫu có sẵn.',
                version: '1.0.0',
            },
            downloadUrl: 'https://gist.githubusercontent.com/world-class-dev/2c1b2c6e6152a5a5d852c0021c32c4e2/raw/phongthan-thanbinh-loikhi.json'
        }];
    }
};

export async function* chatWithGameMaster(
    history: { role: 'user' | 'model', content: string }[]
): AsyncIterable<string> {
    const settings = await db.getSettings();
    if (!settings) throw new Error("Settings not found");

    const systemPrompt = `You are GameMasterAI, a helpful and creative assistant for building fantasy worlds for a TTRPG/video game. Your goal is to talk with the user, understand their vision, ask clarifying questions, and help them flesh out their ideas into a rich, detailed lore document through conversation. Be encouraging and imaginative. Consolidate their descriptions and your suggestions into your responses. Structure your responses clearly. Use markdown for formatting.

**RESPONSE LENGTH RULE:** Your response should be approximately ${settings.gameMasterWordCount || 3000} words long.`;
    
    const contents = history.map(h => ({
        role: h.role,
        parts: [{ text: h.content }]
    }));

    const model = settings?.gameMasterModel || 'gemini-2.5-flash';
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;
    
    const config: any = {
        systemInstruction: systemPrompt,
        temperature: 1.0, 
        topK: settings.topK,
        topP: settings.topP,
    };

    if (settings.enableGoogleGrounding) {
        config.tools = [{googleSearch: {}}];
    }
    
    const stream = await generateWithRetryStream({
        model,
        contents,
        config: config,
    }, specificApiKey);
    
    for await (const chunk of stream) {
        yield chunk.text;
    }
}


const realmConfigSchema = {
    type: Type.ARRAY,
    description: "Hệ thống cảnh giới tu luyện của thế giới. Nếu người dùng mô tả một hệ thống sức mạnh độc đáo, hãy suy luận và tạo ra cấu trúc này.",
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "Tên của đại cảnh giới, ví dụ: 'Luyện Khí Kỳ', 'Hồn Sư'." },
            description: { type: Type.STRING, description: "Mô tả về đại cảnh giới này." },
            stages: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: "Tên của tiểu cảnh giới, ví dụ: 'Tầng 1', 'Sơ Kỳ'." },
                        qiRequired: { type: Type.NUMBER, description: "Lượng tu vi (linh khí) cần để đột phá lên tiểu cảnh giới này. Phải tăng dần một cách hợp lý." },
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
                    required: ['name', 'qiRequired', 'bonuses']
                }
            }
        },
        required: ['name', 'stages']
    }
};

const aiHooksSchema = {
    type: Type.OBJECT,
    description: "Các quy tắc AI tùy chỉnh. Suy luận các quy luật độc đáo của thế giới và điền vào đây.",
    properties: {
        on_world_build: {
            type: Type.ARRAY,
            description: "Các quy tắc vĩnh cửu, không thay đổi của thế giới.",
            items: { type: Type.STRING }
        },
        on_action_evaluate: {
            type: Type.ARRAY,
            description: "Các quy tắc động, được xem xét mỗi khi người chơi hành động.",
            items: { type: Type.STRING }
        }
    }
};

const dynamicEventSchema = {
    type: Type.ARRAY,
    description: "Các sự kiện động, tự động kích hoạt trong game. Ví dụ: thưởng vật phẩm khi người chơi bước vào một hang động.",
    items: {
        type: Type.OBJECT,
        properties: {
            id: { type: Type.STRING, description: "ID duy nhất cho sự kiện, vd: 'hidden_chest_in_cave'."},
            trigger: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['ON_ENTER_LOCATION', 'ON_TALK_TO_NPC', 'ON_GAME_DATE'] as EventTriggerType[] },
                    details: { 
                        type: Type.OBJECT, 
                        description: "Chi tiết tác nhân. Vd: { locationId: 'id_cua_hang_dong' } hoặc { year: 1, day: 10 }.",
                        properties: {
                            locationId: { type: Type.STRING, description: "ID của địa điểm (chỉ dùng cho trigger ON_ENTER_LOCATION)." },
                            npcId: { type: Type.STRING, description: "ID của NPC (chỉ dùng cho trigger ON_TALK_TO_NPC)." },
                            year: { type: Type.NUMBER, description: "Năm diễn ra sự kiện (chỉ dùng cho trigger ON_GAME_DATE)." },
                            day: { type: Type.NUMBER, description: "Ngày diễn ra sự kiện (chỉ dùng cho trigger ON_GAME_DATE)." },
                        }
                    }
                },
                required: ['type', 'details']
            },
            outcomes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        type: { type: Type.STRING, enum: ['GIVE_ITEM', 'REMOVE_ITEM', 'CHANGE_STAT', 'ADD_RUMOR', 'START_EVENT', 'START_STORY', 'UPDATE_REPUTATION'] as EventOutcomeType[] },
                        details: { 
                            type: Type.OBJECT, 
                            description: "Chi tiết kết quả. Vd: { itemName: 'Chìa Khóa Cũ', quantity: 1 } hoặc { attribute: 'Cơ Duyên', change: 5 }.",
                            properties: {
                                itemName: { type: Type.STRING, description: "Tên vật phẩm (cho outcome GIVE_ITEM/REMOVE_ITEM)." },
                                quantity: { type: Type.NUMBER, description: "Số lượng vật phẩm (cho outcome GIVE_ITEM/REMOVE_ITEM)." },
                                attribute: { type: Type.STRING, description: "Tên thuộc tính (cho outcome CHANGE_STAT)." },
                                change: { type: Type.NUMBER, description: "Lượng thay đổi thuộc tính (cho outcome CHANGE_STAT)." },
                                text: { type: Type.STRING, description: "Nội dung tin đồn (cho outcome ADD_RUMOR)." },
                                factionName: { type: Type.STRING, description: "Tên phe phái (cho outcome UPDATE_REPUTATION)." },
                                eventId: { type: Type.STRING, description: "ID của sự kiện khác để bắt đầu (cho outcome START_EVENT)." },
                                storyId: { type: Type.STRING, description: "ID của hệ thống cốt truyện để bắt đầu (cho outcome START_STORY)." },
                            }
                        }
                    },
                    required: ['type', 'details']
                }
            },
            narrative: { type: Type.STRING, description: "Đoạn văn tường thuật sẽ hiển thị cho người chơi khi sự kiện xảy ra." },
            cooldownDays: { type: Type.NUMBER, description: "Số ngày hồi chiêu. Để trống hoặc 0 nếu chỉ xảy ra một lần." }
        },
        required: ['id', 'trigger', 'outcomes', 'narrative']
    }
};

const availableIconNames = Object.keys(UI_ICONS);
const attributeSystemSchema = {
    type: Type.OBJECT,
    description: "Hệ thống thuộc tính tùy chỉnh cho thế giới mod. Phải phù hợp với bối cảnh của câu chuyện.",
    properties: {
        definitions: {
            type: Type.ARRAY,
            description: "Danh sách tất cả các định nghĩa thuộc tính.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "ID duy nhất, không dấu, không khoảng trắng, vd: 'suc_ben_may_moc'." },
                    name: { type: Type.STRING, description: "Tên hiển thị, vd: 'Sức Bền Máy Móc'." },
                    description: { type: Type.STRING },
                    iconName: { type: Type.STRING, enum: availableIconNames, description: "Tên icon từ danh sách có sẵn." },
                    type: { type: Type.STRING, enum: ['PRIMARY', 'SECONDARY', 'VITAL', 'INFORMATIONAL'], description: "Loại thuộc tính." },
                    baseValue: { type: Type.NUMBER, description: "Giá trị khởi điểm cho PRIMARY và VITAL." },
                    formula: { type: Type.STRING, description: "Công thức tính cho SECONDARY, vd: '(suc_manh * 2)'." },
                    group: { type: Type.STRING, description: "ID của nhóm mà thuộc tính này thuộc về." }
                },
                required: ['id', 'name', 'description', 'iconName', 'type', 'group']
            }
        },
        groups: {
            type: Type.ARRAY,
            description: "Các nhóm để tổ chức thuộc tính trong UI.",
            items: {
                type: Type.OBJECT,
                properties: {
                    id: { type: Type.STRING, description: "ID duy nhất cho nhóm, vd: 'cybernetics'." },
                    name: { type: Type.STRING, description: "Tên hiển thị của nhóm, vd: 'Chỉ Số Cybernetic'." },
                    order: { type: Type.NUMBER, description: "Thứ tự hiển thị." }
                },
                required: ['id', 'name', 'order']
            }
        }
    },
    required: ['definitions', 'groups']
};


const worldSchema = {
    type: Type.OBJECT,
    properties: {
        modInfo: {
            type: Type.OBJECT,
            properties: {
                id: { type: Type.STRING, description: "Một ID duy nhất, viết liền, không dấu, không khoảng trắng, ví dụ: 'hac_am_the_gioi'." },
                name: { type: Type.STRING, description: "Tên của thế giới hoặc bản mod." },
                author: { type: Type.STRING, description: "Tên tác giả (để trống nếu không có)." },
                description: { type: Type.STRING, description: "Một mô tả ngắn gọn về bản mod." },
                version: { type: Type.STRING, description: "Phiên bản, mặc định là '1.0.0'." },
                tags: { type: Type.ARRAY, description: "Một danh sách tối đa 3 thể loại phù hợp với thế giới. Vd: ['Huyền Huyễn', 'Hắc Ám', 'Sinh Tồn']", items: { type: Type.STRING } },
            },
            required: ['id', 'name']
        },
        content: {
            type: Type.OBJECT,
            properties: {
                worldData: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING, description: "Tên của kịch bản thế giới, phải giống với modInfo.name." },
                            description: { type: Type.STRING, description: "Mô tả tổng quan về thế giới, lịch sử, các quy luật đặc biệt." },
                            startingYear: { type: Type.NUMBER, description: "Năm bắt đầu của kịch bản." },
                            eraName: { type: Type.STRING, description: "Tên của kỷ nguyên, ví dụ: 'Kỷ Nguyên Hắc Ám'." },
                            majorEvents: {
                                type: Type.ARRAY,
                                description: "Các sự kiện lịch sử trọng đại của thế giới.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        year: { type: Type.NUMBER },
                                        title: { type: Type.STRING },
                                        location: { type: Type.STRING },
                                        involvedParties: { type: Type.STRING },
                                        summary: { type: Type.STRING },
                                        consequences: { type: Type.STRING }
                                    },
                                    required: ['year', 'title', 'location', 'involvedParties', 'summary', 'consequences']
                                }
                            },
                            factions: {
                                type: Type.ARRAY,
                                description: "Các phe phái chính trong thế giới.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, imageUrl: { type: Type.STRING, description: "Để trống." } },
                                    required: ['name', 'description']
                                }
                            },
                            initialLocations: {
                                type: Type.ARRAY,
                                description: "Các địa điểm khởi đầu trong thế giới.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        description: { type: Type.STRING },
                                        type: { type: Type.STRING, enum: ['Thành Thị', 'Thôn Làng', 'Hoang Dã', 'Sơn Mạch', 'Thánh Địa', 'Bí Cảnh', 'Quan Ải'] },
                                        neighbors: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Tên các địa điểm lân cận." },
                                        coordinates: { type: Type.OBJECT, properties: { x: { type: Type.NUMBER }, y: { type: Type.NUMBER } }, required: ['x', 'y'] },
                                        qiConcentration: { type: Type.NUMBER, description: "Nồng độ linh khí, từ 1 (thấp) đến 100 (cao)." }
                                    },
                                    required: ['name', 'description', 'type', 'neighbors', 'coordinates', 'qiConcentration']
                                }
                            },
                            initialNpcs: {
                                type: Type.ARRAY,
                                description: "Các NPC khởi đầu trong thế giới.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        status: { type: Type.STRING },
                                        description: { type: Type.STRING, description: "Mô tả ngoại hình." },
                                        origin: { type: Type.STRING },
                                        personality: { type: Type.STRING },
                                        locationId: { type: Type.STRING, description: "Tên của địa điểm NPC đang ở." }
                                    },
                                    required: ['name', 'status', 'description', 'origin', 'personality', 'locationId']
                                }
                            }
                        },
                        required: ['name', 'description', 'startingYear', 'eraName', 'majorEvents', 'factions', 'initialLocations', 'initialNpcs']
                    }
                },
                items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING } } } },
                realmConfigs: realmConfigSchema,
                aiHooks: aiHooksSchema,
                dynamicEvents: dynamicEventSchema,
                tagDefinitions: {
                    type: Type.ARRAY,
                    description: "Nếu thế giới có một thể loại rất độc đáo, hãy tạo ra một định nghĩa cho nó ở đây. Nếu không, để trống.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING, description: "ID của thể loại, vd: 'vingroup_dystopia'." },
                            name: { type: Type.STRING, description: "Tên thể loại, vd: 'Vingroup Dystopia'." },
                            description: { type: Type.STRING, description: "Mô tả ý nghĩa của thể loại này." }
                        },
                        required: ['id', 'name', 'description']
                    }
                },
                attributeSystem: attributeSystemSchema,
            },
            required: ['worldData']
        }
    },
    required: ['modInfo', 'content']
};

const MAX_CHUNK_CHARS = 1000000;

const summarizeChunk = async (chunk: string, settings: any, specificApiKey: any): Promise<string> => {
    const prompt = `Summarize the following text, which is part of a larger world-building document. Extract all key entities (characters, locations, factions, events, rules).

    Text:
    ---
    ${chunk}
    ---

    Key Points Summary:`;
    
    const response = await generateWithRetry({
        model: settings?.ragSummaryModel || 'gemini-2.5-flash',
        contents: prompt,
    }, specificApiKey);

    return response.text.trim();
};

export const summarizeLargeTextForWorldGen = async (text: string): Promise<string> => {
    if (text.length <= MAX_CHUNK_CHARS) {
        return text;
    }

    console.log(`Text is too large (${text.length} chars). Starting map-reduce summarization...`);
    
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += MAX_CHUNK_CHARS) {
        chunks.push(text.substring(i, i + MAX_CHUNK_CHARS));
    }

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.ragSummaryModel;

    const chunkSummaries = await Promise.all(
        chunks.map(chunk => summarizeChunk(chunk, settings, specificApiKey))
    );

    const combinedSummaries = chunkSummaries.join('\n\n---\n\n');
    
    const finalSummaryPrompt = `You are a master summarizer AI. You have been given several summaries of a large world-building document. Your task is to combine them into a single, cohesive, and comprehensive summary that retains all the critical details for game world generation.

    The final summary should include:
    - Main characters and their roles.
    - Key locations and brief descriptions.
    - Factions and their relationships.
    - The timeline of major historical events.
    - Special rules or power systems of the world.

    Combined Summaries:
    ---
    ${combinedSummaries}
    ---

    Final Cohesive Summary:`;
    
    const finalResponse = await generateWithRetry({
        model: settings?.ragSummaryModel || 'gemini-2.5-flash',
        contents: finalSummaryPrompt,
    }, specificApiKey);

    console.log("Map-reduce summarization complete.");
    return finalResponse.text.trim();
};

export const generateWorldFromText = async (text: string, mode: 'fast' | 'deep' | 'super_deep'): Promise<FullMod> => {
    
    let modeInstructions = '';
    switch (mode) {
        case 'deep':
            modeInstructions = `
**CHẾ ĐỘ PHÂN TÍCH: CHUYÊN SÂU**
Bên cạnh việc trích xuất thông tin bề mặt, bạn PHẢI:
1.  **Suy luận Quan hệ & Động cơ:** Đọc kỹ các tương tác giữa nhân vật để suy ra mối quan hệ (bạn, thù, đồng minh), động cơ ẩn, và mục tiêu cá nhân của họ.
2.  **Chi tiết hóa Mô tả:** Làm cho các mô tả về địa điểm và nhân vật trở nên chi tiết và sống động hơn một chút dựa trên văn bản gốc.`;
            break;
        case 'super_deep':
            modeInstructions = `
**CHẾ ĐỘ PHÂN TÍCH: SIÊU CHUYÊN SÂU (CHẤT LƯỢNG > TỐC ĐỘ)**
Bạn không chỉ là một cỗ máy trích xuất, mà là một ĐỒNG SÁNG TẠO. Nhiệm vụ của bạn là:
1.  **Đào sâu Tối đa:** Phân tích từng chi tiết nhỏ nhất trong văn bản để xây dựng một thế giới cực kỳ nhất quán và có chiều sâu. Suy luận mọi mối quan hệ, mọi âm mưu, mọi quy luật.
2.  **Sáng tạo Mở rộng:** Dựa trên nền tảng của văn bản, hãy mạnh dạn SÁNG TẠO thêm các chi tiết nhỏ để làm thế giới thêm phong phú. Ví dụ: tạo thêm một vài NPC phụ có liên quan hoặc một vài tin đồn gián tiếp liên quan đến cốt truyện chính.
3.  **Chất lượng là Tuyệt đối:** Hãy dành nhiều thời gian hơn để đảm bảo mọi thứ liên kết với nhau một cách logic. Độ chi tiết và chiều sâu quan trọng hơn tốc độ.`;
            break;
        default: // 'fast' mode
            modeInstructions = `**CHẾ ĐỘ PHÂN TÍCH: NHANH**
Tập trung vào việc trích xuất nhanh và chính xác các thực thể chính (nhân vật, địa điểm, phe phái, sự kiện) được đề cập rõ ràng trong văn bản.`;
            break;
    }

    const generationSchema = JSON.parse(JSON.stringify(worldSchema));
    delete generationSchema.properties.content.properties.dynamicEvents;
    delete generationSchema.properties.content.properties.aiHooks;

    const prompt = `Bạn là một AI Sáng Thế, một thực thể có khả năng biến những dòng văn bản tự do thành một thế giới game có cấu trúc hoàn chỉnh.
    Nhiệm vụ của bạn là đọc và phân tích sâu văn bản do người dùng cung cấp, sau đó trích xuất và suy luận ra toàn bộ dữ liệu cần thiết để tạo thành một bản mod game theo schema JSON đã cho.

    **Văn bản Sáng Thế từ người dùng:**
    ---
    ${text}
    ---

    ${modeInstructions}

    **Quy trình Phân Tích & Suy Luận:**
    1.  **Đọc Tổng Thể:** Đọc toàn bộ văn bản để nắm bắt tông màu, chủ đề chính, và các khái niệm cốt lõi của thế giới.
    2.  **\`modInfo\`:** Suy ra \`id\` và \`name\` phù hợp từ văn bản. \`id\` phải là chuỗi không dấu, không khoảng trắng. Suy ra tối đa 3 \`tags\` (thể loại) phù hợp nhất với bối cảnh.
    3.  **\`worldData\`:** Đây là phần quan trọng nhất.
        -   **\`name\`, \`description\`, \`eraName\`, \`startingYear\`:** Trích xuất trực tiếp từ các mô tả tổng quan.
        -   **\`majorEvents\`:** Tìm các đoạn văn mô tả các sự kiện lịch sử, chiến tranh, hoặc các biến cố lớn và điền vào.
        -   **\`factions\`:** Nhận diện các vương quốc, tổ chức, phe phái và trích xuất mô tả của chúng.
        -   **\`initialLocations\`:** Nhận diện tất cả các địa danh được mô tả, suy luận ra \`type\`, \`qiConcentration\`, và mối quan hệ \`neighbors\`. Tự động tạo \`coordinates\` (x, y) một cách logic để tạo thành một bản đồ hợp lý.
        -   **\`initialNpcs\`:** Nhận diện tất cả các nhân vật được mô tả, trích xuất ngoại hình, tính cách, xuất thân. Quan trọng nhất, suy luận \`locationId\` (tên địa điểm) mà họ có khả năng xuất hiện nhất.
    4.  **\`items\` (Tùy chọn):** Nếu văn bản mô tả các vật phẩm đặc biệt (thần binh, bảo vật), hãy trích xuất chúng.
    5.  **\`realmConfigs\` (Hệ Thống Tu Luyện):** Phân tích kỹ lưỡng các đoạn văn mô tả hệ thống sức mạnh, cấp bậc, hoặc con đường tu luyện. Nếu có, hãy suy luận và tạo ra một cấu trúc \`realmConfigs\` hoàn chỉnh. Đảm bảo \`qiRequired\` tăng dần một cách logic và \`bonuses\` phù hợp với mô tả của từng cấp bậc.
    6.  **\`attributeSystem\` (HỆ THỐNG THUỘC TÍNH - QUAN TRỌNG):**
        **QUY TẮC SÁNG TẠO TỪ ĐẦU:** Bạn phải thiết kế và tạo ra một hệ thống thuộc tính **HOÀN TOÀN MỚI** từ con số không, dựa trên bối cảnh và lore được cung cấp.
        - **KHÔNG GIẢ ĐỊNH:** Không có bất kỳ thuộc tính mặc định nào tồn tại. Bạn phải tự định nghĩa tất cả, bao gồm cả các thuộc tính cơ bản như sinh mệnh, năng lượng, v.v.
        - **TẠO CẢ HAI PHẦN:** Bạn phải tạo cả hai mảng: \`definitions\` (danh sách tất cả thuộc tính) và \`groups\` (các nhóm để tổ chức chúng).
        - **LOGIC THEO BỐI CẢNH:** Hệ thống phải nhất quán với thế giới. Nếu là thế giới tu tiên, hãy tạo các thuộc tính như 'Linh Lực', 'Căn Cốt'. Nếu là khoa huyễn, hãy tạo 'Năng Lượng Lõi', 'Độ Bền Vỏ Giáp'. Nếu là sinh tồn, hãy có 'Độ No', 'Độ Khát'.
        - **ĐẦY ĐỦ THÔNG TIN:** Mỗi thuộc tính trong \`definitions\` phải có đủ các trường thông tin theo schema (id, name, description, iconName, type, group). Mỗi nhóm trong \`groups\` phải có id, name, và order.
    7.  **Tính Nhất Quán:** Đảm bảo tất cả các tham chiếu (như \`neighbors\`, \`locationId\` của NPC) đều trỏ đến các thực thể đã được tạo ra trong cùng một file JSON.
    8.  **\`tagDefinitions\` (Tùy chọn):** Nếu bạn tạo ra một tag rất độc đáo và mới lạ (ví dụ 'Vin-Corp Dystopia' cho thế giới Vingroup cai trị), hãy tạo một định nghĩa cho nó. Đối với các tag phổ biến như 'Huyền Huyễn', 'Hắc Ám', không cần tạo định nghĩa.

    **QUY TẮC JSON TỐI QUAN TRỌNG:** Toàn bộ phản hồi phải là một đối tượng JSON hợp lệ. Khi tạo các giá trị chuỗi (string) như mô tả, tóm tắt, v.v., hãy đảm bảo rằng bất kỳ dấu ngoặc kép (") nào bên trong chuỗi đều được thoát đúng cách bằng một dấu gạch chéo ngược (\\"). Ví dụ: "description": "Nhân vật này được biết đến với biệt danh \\"Kẻ Vô Danh\\"."

    Hãy thực hiện nhiệm vụ và trả về một đối tượng JSON duy nhất theo đúng schema.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;
    const model = settings?.gameMasterModel || 'gemini-2.5-flash';
    
    const generationConfig: any = {
        responseMimeType: "application/json",
        responseSchema: generationSchema,
        temperature: 1.0,
        topK: settings?.topK,
        topP: settings?.topP,
    };

    if (mode === 'fast' && model === 'gemini-2.5-flash') {
        generationConfig.thinkingConfig = { thinkingBudget: 0 };
    }
    
    const response = await generateWithRetry({
        model,
        contents: prompt,
        config: generationConfig,
    }, specificApiKey);
    
    try {
        let cleanedString = response.text.trim();
        if (cleanedString.startsWith("```json")) {
            cleanedString = cleanedString.substring(7);
            if (cleanedString.endsWith("```")) {
                cleanedString = cleanedString.slice(0, -3);
            }
        }
        const json = JSON.parse(cleanedString);
        
        // Fallback in case AI forgets to generate an attribute system
        if (json.content && (!json.content.attributeSystem || !json.content.attributeSystem.definitions || json.content.attributeSystem.definitions.length === 0)) {
            console.warn("AI failed to generate a custom attribute system. Falling back to default.");
            json.content.attributeSystem = {
                definitions: DEFAULT_ATTRIBUTE_DEFINITIONS,
                groups: DEFAULT_ATTRIBUTE_GROUPS
            };
        }


        if (json.content?.worldData?.[0]) {
            const world = json.content.worldData[0];
            const locationNameIdMap = new Map<string, string>();
            
            world.initialLocations = world.initialLocations.map((loc: any) => {
                const id = loc.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, '');
                locationNameIdMap.set(loc.name, id);
                return { ...loc, id: id };
            });
            
            world.initialLocations.forEach((loc: any) => {
                loc.neighbors = (loc.neighbors || []).map((name: string) => locationNameIdMap.get(name) || name);
            });
            
            world.initialNpcs.forEach((npc: any) => {
                npc.locationId = locationNameIdMap.get(npc.locationId) || npc.locationId;
            });
        }
        return json as FullMod;
    } catch (e) {
        console.error("Failed to parse AI response for world generation:", e);
        console.error("Raw AI response:", response.text);
        throw new Error("AI đã trả về dữ liệu JSON không hợp lệ.");
    }
};

interface WorldGenPrompts {
    modInfo: Omit<ModInfo, 'description' | 'version'>;
    prompts: {
        setting: string;
        mainGoal?: string;
        openingStory?: string;
    };
    aiHooks?: {
        on_world_build?: string;
        on_action_evaluate?: string;
    };
    attributeSystem?: ModAttributeSystem;
    namedRealmSystems?: NamedRealmSystem[];
    quickActionBars?: QuickActionBarConfig[];
    factions?: Faction[];
    locations?: ModLocation[];
    npcs?: ModNpc[];
    majorEvents?: MajorEvent[];
    foreshadowedEvents?: ModForeshadowedEvent[];
    tagDefinitions?: ModTagDefinition[];
}

export const generateWorldFromPrompts = async (prompts: WorldGenPrompts): Promise<FullMod> => {
    const { modInfo, prompts: userPrompts, aiHooks, attributeSystem, namedRealmSystems, quickActionBars, factions, locations, npcs, majorEvents, foreshadowedEvents, tagDefinitions } = prompts;

    const aiHooksText = (aiHooks?.on_world_build || '') + '\n' + (aiHooks?.on_action_evaluate || '');
    
    const attributeContext = attributeSystem
        ? `### HỆ THỐNG THUỘC TÍNH (ĐÃ ĐỊNH NGHĨA SẴN) ###\nĐây là các thuộc tính của thế giới này. Hãy sử dụng chúng khi tạo NPC và các yếu tố khác.\n${attributeSystem.definitions.map(d => `- ${d.name}: ${d.description}`).join('\n')}\n### KẾT THÚC HỆ THỐNG THUỘC TÍNH ###`
        : '';
        
    const realmContext = namedRealmSystems && namedRealmSystems.length > 0
        ? `### HỆ THỐNG CẢNH GIỚI (ĐÃ ĐỊNH NGHĨA SẴN) ###\nThế giới này có ${namedRealmSystems.length} hệ thống tu luyện khác nhau. Hệ thống chính là "${namedRealmSystems[0].name}". AI không cần tạo thêm hệ thống tu luyện.\n### KẾT THÚC HỆ THỐNG CẢNH GIỚI ###`
        : "### HỆ THỐNG CẢNH GIỚI ###\nAI tự do sáng tạo hệ thống tu luyện.";
    
    const factionContext = factions && factions.length > 0 ? `### PHE PHÁI (ĐÃ ĐỊNH NGHĨA SẴN) ###\nNgười dùng đã định nghĩa các phe phái sau. Hãy xây dựng thế giới xoay quanh chúng:\n${factions.map(f => `- ${f.name}: ${f.description}`).join('\n')}\n` : '';
    const locationContext = locations && locations.length > 0 ? `### ĐỊA ĐIỂM (ĐÃ ĐỊNH NGHĨA SẴN) ###\nNgười dùng đã định nghĩa các địa điểm sau. Đây là các địa điểm chính của thế giới. Hãy tạo ra các sự kiện và NPC phù hợp với những nơi này:\n${locations.map(l => `- ${l.name}: ${l.description}`).join('\n')}\n` : '';
    const npcContext = npcs && npcs.length > 0 ? `### NHÂN VẬT (ĐÃ ĐỊNH NGHĨA SẴN) ###\nNgười dùng đã định nghĩa các nhân vật sau. Hãy đặt họ vào thế giới và tạo ra các sự kiện liên quan đến họ:\n${npcs.map(n => `- ${n.name}: ${n.description}`).join('\n')}\n` : '';


    // Clone the base schema to modify it
    const dynamicWorldSchema = JSON.parse(JSON.stringify(worldSchema));
    
    // If systems are provided by the user, the AI should not generate them.
    if (attributeSystem) {
        delete dynamicWorldSchema.properties.content.properties.attributeSystem;
    }
    if (namedRealmSystems && namedRealmSystems.length > 0) {
        delete dynamicWorldSchema.properties.content.properties.realmConfigs;
    }
    // If user provides these, AI should not generate them from scratch
    if (factions && factions.length > 0) delete dynamicWorldSchema.properties.content.properties.worldData.items.properties.factions;
    if (locations && locations.length > 0) delete dynamicWorldSchema.properties.content.properties.worldData.items.properties.initialLocations;
    if (npcs && npcs.length > 0) delete dynamicWorldSchema.properties.content.properties.worldData.items.properties.initialNpcs;
    if (majorEvents && majorEvents.length > 0) delete dynamicWorldSchema.properties.content.properties.worldData.items.properties.majorEvents;
    if (tagDefinitions && tagDefinitions.length > 0) delete dynamicWorldSchema.properties.content.properties.tagDefinitions;


    const masterPrompt = `Bạn là một AI Sáng Thế, một thực thể có khả năng biến những ý tưởng cốt lõi thành một thế giới game có cấu trúc hoàn chỉnh.
    Nhiệm vụ của bạn là đọc và phân tích các ý tưởng do người dùng cung cấp, sau đó mở rộng, chi tiết hóa và suy luận ra toàn bộ dữ liệu cần thiết để tạo thành một bản mod game theo schema JSON đã cho.

    **Ý Tưởng Cốt Lõi từ Người Dùng:**
    ---
    - **Tên Mod:** ${modInfo.name}
    - **Thể Loại:** ${modInfo.tags.join(', ')}
    - **Bối Cảnh (Setting):** ${userPrompts.setting}
    - **Mục Tiêu Chính (Nếu có):** ${userPrompts.mainGoal || "AI tự do sáng tạo."}
    - **Quy Luật Thế Giới (AI Hooks):** ${aiHooksText.trim() || "Không có quy luật đặc biệt, AI tự do sáng tạo."}
    - **Cốt Truyện Khởi Đầu (Nếu có):** ${userPrompts.openingStory || "AI tự tạo một phần mở đầu hấp dẫn."}
    ---
    
    ${attributeContext}
    ${realmContext}
    ${factionContext}
    ${locationContext}
    ${npcContext}

    **Quy trình Sáng Tạo & Suy Luận:**
    1.  **\`modInfo\`:** Sử dụng thông tin \`name\`, \`id\`, và \`tags\` được cung cấp. Tạo một mô tả ngắn gọn dựa trên bối cảnh.
    2.  **\`worldData\`:** Đây là phần quan trọng nhất. Dựa trên Bối Cảnh, Mục Tiêu và Quy Luật:
        -   Nếu người dùng chưa cung cấp, hãy sáng tạo Lịch sử & Sự kiện (\`majorEvents\`), Phe phái (\`factions\`), Bản đồ (\`initialLocations\`), và Nhân vật (\`initialNpcs\`). Nếu người dùng ĐÃ cung cấp, hãy xây dựng thế giới dựa trên chúng.
    3.  **\`items\` (Tùy chọn):** Tạo ra 1-2 vật phẩm khởi đầu hoặc vật phẩm quan trọng liên quan đến cốt truyện.
    4.  **Hệ Thống (QUAN TRỌNG):** Dựa vào các hệ thống đã được định nghĩa sẵn (nếu có) và ý tưởng của người dùng, hãy sáng tạo và điền vào các phần còn lại của thế giới. TUYỆT ĐỐI KHÔNG được tạo lại hệ thống tu luyện, thuộc tính, phe phái, địa điểm, sự kiện hoặc NPC nếu chúng đã được cung cấp.
    5.  **Tính Nhất Quán:** Đảm bảo tất cả các tham chiếu bằng TÊN (như \`neighbors\`, \`locationId\` của NPC) đều trỏ đến các thực thể đã được tạo ra trong cùng một file JSON.

    **QUY TẮC JSON TỐI QUAN TRỌNG:** Toàn bộ phản hồi phải là một đối tượng JSON hợp lệ. Khi tạo các giá trị chuỗi (string) như mô tả, tóm tắt, v.v., hãy đảm bảo rằng bất kỳ dấu ngoặc kép (") nào bên trong chuỗi đều được thoát đúng cách bằng một dấu gạch chéo ngược (\\"). Ví dụ: "description": "Nhân vật này được biết đến với biệt danh \\"Kẻ Vô Danh\\"."

    Hãy thực hiện nhiệm vụ và trả về một đối tượng JSON duy nhất theo đúng schema.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;
    const response = await generateWithRetry({
        model: settings?.gameMasterModel || 'gemini-2.5-flash',
        contents: masterPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: dynamicWorldSchema,
            temperature: 1.0,
            topK: settings?.topK,
            topP: settings?.topP,
        }
    }, specificApiKey);
    
    try {
        let cleanedString = response.text.trim();
        if (cleanedString.startsWith("```json")) {
            cleanedString = cleanedString.substring(7);
            if (cleanedString.endsWith("```")) {
                cleanedString = cleanedString.slice(0, -3);
            }
        }
        const generatedJson = JSON.parse(cleanedString);
        
        // Start building the final mod object
        const finalMod: FullMod = {
            modInfo: {
                ...modInfo,
                description: generatedJson.modInfo.description || `Một thế giới được tạo bởi AI dựa trên bối cảnh: ${userPrompts.setting}`,
                version: '1.0.0',
                author: modInfo.author || generatedJson.modInfo.author
            },
            content: {
                ...generatedJson.content
            }
        };

        // Add back user-defined systems if they were provided
        if (attributeSystem) {
            finalMod.content.attributeSystem = attributeSystem;
        }
        if (namedRealmSystems) {
            finalMod.content.namedRealmSystems = namedRealmSystems;
        }
        if (quickActionBars && quickActionBars.length > 0) {
            finalMod.content.quickActionBars = quickActionBars;
        }
        if (tagDefinitions && tagDefinitions.length > 0) {
            finalMod.content.tagDefinitions = tagDefinitions;
        }
        // Ensure user-provided AI Hooks take precedence
        if (aiHooks) {
            finalMod.content.aiHooks = {
                on_world_build: aiHooks.on_world_build ? aiHooks.on_world_build.split('\n').filter(Boolean) : finalMod.content.aiHooks?.on_world_build,
                on_action_evaluate: aiHooks.on_action_evaluate ? aiHooks.on_action_evaluate.split('\n').filter(Boolean) : finalMod.content.aiHooks?.on_action_evaluate,
            };
        }
        
        // Ensure worldData structure exists
        if (!finalMod.content.worldData || finalMod.content.worldData.length === 0) {
            finalMod.content.worldData = [{
                name: finalMod.modInfo.name,
                description: generatedJson.content?.worldData?.[0]?.description || finalMod.modInfo.description || '',
                startingYear: generatedJson.content?.worldData?.[0]?.startingYear || 1,
                eraName: generatedJson.content?.worldData?.[0]?.eraName || 'Kỷ Nguyên Mới',
                majorEvents: [],
                factions: [],
                initialLocations: [],
                initialNpcs: [],
            }];
        }
        
        // Overwrite with user-defined data
        if (factions && factions.length > 0) finalMod.content.worldData[0].factions = factions;
        if (locations && locations.length > 0) finalMod.content.worldData[0].initialLocations = locations;
        if (npcs && npcs.length > 0) finalMod.content.worldData[0].initialNpcs = npcs;
        if (majorEvents && majorEvents.length > 0) finalMod.content.worldData[0].majorEvents = majorEvents;
        if (foreshadowedEvents && foreshadowedEvents.length > 0) finalMod.content.worldData[0].foreshadowedEvents = foreshadowedEvents;


        // Post-processing to add IDs where names are used as references
        if (finalMod.content?.worldData?.[0]) {
            const world = finalMod.content.worldData[0];
            const locationNameIdMap = new Map<string, string>();
            
            if (world.initialLocations) {
                world.initialLocations = world.initialLocations.map((loc: any) => {
                    const id = loc.id || loc.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, '');
                    locationNameIdMap.set(loc.name, id);
                    return { ...loc, id: id };
                });
                
                world.initialLocations.forEach((loc: any) => {
                    loc.neighbors = (loc.neighbors || []).map((name: string) => locationNameIdMap.get(name) || name);
                });
            }
            
            if (world.initialNpcs) {
                world.initialNpcs.forEach((npc: any) => {
                    npc.locationId = locationNameIdMap.get(npc.locationId) || npc.locationId;
                });
            }
            
            if (finalMod.content.dynamicEvents) {
                finalMod.content.dynamicEvents.forEach((event: any) => {
                    if (event.trigger.type === 'ON_ENTER_LOCATION' && event.trigger.details.locationId) {
                        event.trigger.details.locationId = locationNameIdMap.get(event.trigger.details.locationId) || event.trigger.details.locationId;
                    }
                });
            }
        }
        return finalMod;
    } catch (e) {
        console.error("Failed to parse AI response for world generation:", e);
        console.error("Raw AI response:", response.text);
        throw new Error("AI đã trả về dữ liệu JSON không hợp lệ.");
    }
};
