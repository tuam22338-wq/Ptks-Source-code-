import { Type } from "@google/genai";
import type { CommunityMod, FullMod, ModInfo, StatBonus, EventTriggerType, EventOutcomeType } from '../../types';
import { ALL_ATTRIBUTES, COMMUNITY_MODS_URL } from "../../constants";
import { generateWithRetry } from './gemini.core';
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
                    type: { type: Type.STRING, enum: ['ON_ENTER_LOCATION', 'ON_GAME_DATE'] as EventTriggerType[] },
                    details: { 
                        type: Type.OBJECT, 
                        description: "Chi tiết tác nhân. Vd: { locationId: 'id_cua_hang_dong' } hoặc { year: 1, day: 10 }.",
                        properties: {
                            locationId: { type: Type.STRING, description: "ID của địa điểm (chỉ dùng cho trigger ON_ENTER_LOCATION)." },
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
                        type: { type: Type.STRING, enum: ['GIVE_ITEM', 'CHANGE_STAT', 'ADD_RUMOR', 'UPDATE_REPUTATION'] as EventOutcomeType[] },
                        details: { 
                            type: Type.OBJECT, 
                            description: "Chi tiết kết quả. Vd: { itemName: 'Chìa Khóa Cũ', quantity: 1 } hoặc { attribute: 'Cơ Duyên', change: 5 }.",
                            properties: {
                                itemName: { type: Type.STRING, description: "Tên vật phẩm (cho outcome GIVE_ITEM)." },
                                quantity: { type: Type.NUMBER, description: "Số lượng vật phẩm (cho outcome GIVE_ITEM)." },
                                attribute: { type: Type.STRING, description: "Tên thuộc tính (cho outcome CHANGE_STAT)." },
                                change: { type: Type.NUMBER, description: "Lượng thay đổi thuộc tính (cho outcome CHANGE_STAT)." },
                                text: { type: Type.STRING, description: "Nội dung tin đồn (cho outcome ADD_RUMOR)." },
                                factionName: { type: Type.STRING, description: "Tên phe phái (cho outcome UPDATE_REPUTATION)." },
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
            },
            required: ['worldData']
        }
    },
    required: ['modInfo', 'content']
};

export const generateWorldFromText = async (text: string): Promise<FullMod> => {
    const prompt = `Bạn là một AI Sáng Thế, một thực thể có khả năng biến những dòng văn bản tự do thành một thế giới game có cấu trúc hoàn chỉnh.
    Nhiệm vụ của bạn là đọc và phân tích sâu văn bản do người dùng cung cấp, sau đó trích xuất và suy luận ra toàn bộ dữ liệu cần thiết để tạo thành một bản mod game theo schema JSON đã cho.

    **Văn bản Sáng Thế từ người dùng:**
    ---
    ${text}
    ---

    **Quy trình Phân Tích & Suy Luận:**
    1.  **Đọc Tổng Thể:** Đọc toàn bộ văn bản để nắm bắt tông màu, chủ đề chính, và các khái niệm cốt lõi của thế giới.
    2.  **\`modInfo\`:** Suy ra \`id\` và \`name\` phù hợp từ văn bản. \`id\` phải là chuỗi không dấu, không khoảng trắng.
    3.  **\`worldData\`:** Đây là phần quan trọng nhất.
        -   **\`name\`, \`description\`, \`eraName\`, \`startingYear\`:** Trích xuất trực tiếp từ các mô tả tổng quan.
        -   **\`majorEvents\`:** Tìm các đoạn văn mô tả các sự kiện lịch sử, chiến tranh, hoặc các biến cố lớn và điền vào.
        -   **\`factions\`:** Nhận diện các vương quốc, tổ chức, phe phái và trích xuất mô tả của chúng.
        -   **\`initialLocations\`:** Nhận diện tất cả các địa danh được mô tả, suy luận ra \`type\`, \`qiConcentration\`, và mối quan hệ \`neighbors\`. Tự động tạo \`coordinates\` (x, y) một cách logic để tạo thành một bản đồ hợp lý.
        -   **\`initialNpcs\`:** Nhận diện tất cả các nhân vật được mô tả, trích xuất ngoại hình, tính cách, xuất thân. Quan trọng nhất, suy luận \`locationId\` (tên địa điểm) mà họ có khả năng xuất hiện nhất.
    4.  **\`items\` (Tùy chọn):** Nếu văn bản mô tả các vật phẩm đặc biệt (thần binh, bảo vật), hãy trích xuất chúng.
    5.  **\`realmConfigs\` (Hệ Thống Tu Luyện):** Phân tích kỹ lưỡng các đoạn văn mô tả hệ thống sức mạnh, cấp bậc, hoặc con đường tu luyện. Nếu có, hãy suy luận và tạo ra một cấu trúc \`realmConfigs\` hoàn chỉnh. Đảm bảo \`qiRequired\` tăng dần một cách logic và \`bonuses\` phù hợp với mô tả của từng cấp bậc.
    6.  **\`aiHooks\` (Quy Luật Thế Giới - Cực Kỳ Quan Trọng):** Đọc kỹ văn bản để tìm ra các quy luật vật lý, ma thuật, hoặc xã hội độc nhất. Ví dụ, nếu thế giới có "ma thuật máu", một quy luật trong \`on_action_evaluate\` có thể là "Sử dụng ma thuật máu sẽ tiêu hao Sinh Mệnh thay vì Linh Lực". Nếu là một thế giới steampunk, một luật \`on_world_build\` có thể là "Tu luyện trong thế giới này thực chất là việc nâng cấp và tối ưu hóa các bộ phận máy móc trên cơ thể." Hãy sáng tạo và suy luận ra ít nhất 1-3 quy luật độc đáo.
    7. **\`dynamicEvents\` (Sự kiện động):** Dựa trên lore và các địa điểm, hãy tạo ra 1-3 sự kiện động đơn giản để làm thế giới thêm sống động. Ví dụ, tạo một sự kiện thưởng cho người chơi một vật phẩm bí mật khi họ lần đầu bước vào một hang động cổ xưa, hoặc một sự kiện lễ hội diễn ra vào một ngày cụ thể.
    8.  **Tính Nhất Quán:** Đảm bảo tất cả các tham chiếu (như \`neighbors\`, \`locationId\` của NPC) đều trỏ đến các thực thể đã được tạo ra trong cùng một file JSON.

    Hãy thực hiện nhiệm vụ và trả về một đối tượng JSON duy nhất theo đúng schema.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;
    const response = await generateWithRetry({
        model: settings?.gameMasterModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: worldSchema,
        }
    }, specificApiKey);
    
    try {
        const json = JSON.parse(response.text.trim());
        // Post-processing to add IDs where names are used as references
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

            if (json.content.dynamicEvents) {
                json.content.dynamicEvents.forEach((event: any) => {
                    if (event.trigger.type === 'ON_ENTER_LOCATION' && event.trigger.details.locationId) {
                        event.trigger.details.locationId = locationNameIdMap.get(event.trigger.details.locationId) || event.trigger.details.locationId;
                    }
                });
            }
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
    setting: string;
    mainGoal?: string;
    openingStory?: string;
    aiHooks?: {
        on_world_build?: string;
        on_action_evaluate?: string;
    };
}

export const generateWorldFromPrompts = async (prompts: WorldGenPrompts): Promise<FullMod> => {
    const aiHooksText = (prompts.aiHooks?.on_world_build || '') + '\n' + (prompts.aiHooks?.on_action_evaluate || '');
    
    const masterPrompt = `Bạn là một AI Sáng Thế, một thực thể có khả năng biến những ý tưởng cốt lõi thành một thế giới game có cấu trúc hoàn chỉnh.
    Nhiệm vụ của bạn là đọc và phân tích các ý tưởng do người dùng cung cấp, sau đó mở rộng, chi tiết hóa và suy luận ra toàn bộ dữ liệu cần thiết để tạo thành một bản mod game theo schema JSON đã cho.

    **Ý Tưởng Cốt Lõi từ Người Dùng:**
    ---
    - **Tên Mod:** ${prompts.modInfo.name}
    - **Bối Cảnh (Setting):** ${prompts.setting}
    - **Mục Tiêu Chính (Nếu có):** ${prompts.mainGoal || "AI tự do sáng tạo."}
    - **Quy Luật Thế Giới (AI Hooks):** ${aiHooksText.trim() || "Không có quy luật đặc biệt, AI tự do sáng tạo."}
    - **Cốt Truyện Khởi Đầu (Nếu có):** ${prompts.openingStory || "AI tự tạo một phần mở đầu hấp dẫn."}
    ---

    **Quy trình Sáng Tạo & Suy Luận:**
    1.  **\`modInfo\`:** Sử dụng thông tin \`name\` và \`id\` được cung cấp. Tạo một mô tả ngắn gọn dựa trên bối cảnh.
    2.  **\`worldData\`:** Đây là phần quan trọng nhất. Dựa trên Bối Cảnh, Mục Tiêu và Quy Luật:
        -   **Sáng tạo Lịch sử & Sự kiện (\`majorEvents\`):** Tạo ra ít nhất 5 sự kiện lịch sử quan trọng dẫn đến tình hình hiện tại của thế giới.
        -   **Sáng tạo Phe phái (\`factions\`):** Dựa trên bối cảnh, tạo ra 2-4 phe phái chính có mục tiêu và mâu thuẫn với nhau.
        -   **Thiết kế Bản đồ (\`initialLocations\`):** Tạo ra một danh sách các địa điểm khởi đầu (khoảng 5-10 địa điểm) bao gồm thành thị, hoang dã, và các nơi đặc biệt. Các địa điểm phải liên kết với nhau một cách logic qua \`neighbors\`. Tự động tạo tọa độ \`coordinates\` (x, y) hợp lý.
        -   **Tạo Nhân vật (\`initialNpcs\`):** Tạo ra 3-5 NPC quan trọng, có vai trò trong cốt truyện hoặc các phe phái. Đặt họ vào các địa điểm (\`locationId\`) phù hợp bằng cách sử dụng TÊN của địa điểm đã tạo.
    3.  **\`items\` (Tùy chọn):** Tạo ra 1-2 vật phẩm khởi đầu hoặc vật phẩm quan trọng liên quan đến cốt truyện.
    4.  **\`realmConfigs\` (Hệ Thống Tu Luyện):** Dựa vào "Quy Luật Thế Giới", nếu người dùng mô tả một hệ thống tu luyện, hãy tạo ra cấu trúc \`realmConfigs\` tương ứng. Nếu không, có thể tạo một hệ thống cơ bản hoặc để trống.
    5.  **\`aiHooks\`:** **QUAN TRỌNG:** Dựa vào các quy luật người dùng cung cấp và suy luận thêm từ bối cảnh, hãy tạo ra 1-3 quy luật độc đáo cho thế giới. Phân loại chúng vào \`on_world_build\` (vĩnh cửu) hoặc \`on_action_evaluate\` (tình huống).
    6. **\`dynamicEvents\` (Sự kiện động):** Dựa trên lore và các địa điểm, hãy tạo ra 1-3 sự kiện động đơn giản để làm thế giới thêm sống động.
    7.  **Tính Nhất Quán:** Đảm bảo tất cả các tham chiếu bằng TÊN (như \`neighbors\`, \`locationId\` của NPC) đều trỏ đến các thực thể đã được tạo ra trong cùng một file JSON.

    Hãy thực hiện nhiệm vụ và trả về một đối tượng JSON duy nhất theo đúng schema.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;
    const response = await generateWithRetry({
        model: settings?.gameMasterModel || 'gemini-2.5-flash',
        contents: masterPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: worldSchema,
        }
    }, specificApiKey);
    
    try {
        const json = JSON.parse(response.text.trim());
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
            
            if (json.content.dynamicEvents) {
                json.content.dynamicEvents.forEach((event: any) => {
                    if (event.trigger.type === 'ON_ENTER_LOCATION' && event.trigger.details.locationId) {
                        event.trigger.details.locationId = locationNameIdMap.get(event.trigger.details.locationId) || event.trigger.details.locationId;
                    }
                });
            }
        }
        return json as FullMod;
    } catch (e) {
        console.error("Failed to parse AI response for world generation:", e);
        console.error("Raw AI response:", response.text);
        throw new Error("AI đã trả về dữ liệu JSON không hợp lệ.");
    }
};
