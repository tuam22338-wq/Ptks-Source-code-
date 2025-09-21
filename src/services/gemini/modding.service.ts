

import { Type } from "@google/genai";
import type { AiGeneratedModData, ModContentObject, CommunityMod, Element, FullMod, ModInfo } from '../../types';
// FIX: Aliasing PT_WORLD_MAP to WORLD_MAP as constants.ts does not export a generic WORLD_MAP.
import { ALL_ATTRIBUTES, TALENT_RANK_NAMES, PT_WORLD_MAP as WORLD_MAP, PHAP_BAO_RANKS, COMMUNITY_MODS_URL } from "../../constants";
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

export const generateModContentFromPrompt = async (prompt: string, modContext: any): Promise<AiGeneratedModData> => {
    const statBonusSchema = { type: Type.OBJECT, properties: { attribute: { type: Type.STRING, enum: ALL_ATTRIBUTES }, value: { type: Type.NUMBER } }, required: ['attribute', 'value'] };
    
    // Base schemas without contentType for nesting in data packs
    const modItemSchemaForPack = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING }, description: { type: Type.STRING }, type: { type: Type.STRING, enum: ['Vũ Khí', 'Phòng Cụ', 'Đan Dược', 'Pháp Bảo', 'Tạp Vật', 'Đan Lô', 'Linh Dược', 'Đan Phương', 'Nguyên Liệu'] }, quality: { type: Type.STRING, enum: ['Phàm Phẩm', 'Linh Phẩm', 'Pháp Phẩm', 'Bảo Phẩm', 'Tiên Phẩm', 'Tuyệt Phẩm'] }, weight: { type: Type.NUMBER }, value: { type: Type.NUMBER }, slot: { type: Type.STRING, enum: ['Vũ Khí', 'Thượng Y', 'Hạ Y', 'Giày', 'Phụ Kiện 1', 'Phụ Kiện 2'] }, bonuses: { type: Type.ARRAY, items: statBonusSchema }, vitalEffects: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { vital: { type: Type.STRING, enum: ['hunger', 'thirst'] }, value: { type: Type.NUMBER } }, required: ['vital', 'value'] } }, tags: { type: Type.ARRAY, items: { type: Type.STRING } }, icon: { type: Type.STRING }
        },
        required: ['name', 'description', 'type', 'quality', 'weight']
    };

    const modNpcSchemaForPack = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING }, status: { type: Type.STRING }, description: { type: Type.STRING }, origin: { type: Type.STRING }, personality: { type: Type.STRING }, locationId: { type: Type.STRING, enum: WORLD_MAP.map(l => l.id) }, tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['name', 'status', 'description', 'origin', 'personality', 'locationId']
    };

    const modItemSchema = { ...modItemSchemaForPack, properties: { ...modItemSchemaForPack.properties, contentType: { type: Type.STRING, enum: ['item'] } }, required: [...modItemSchemaForPack.required, 'contentType']};
    const modNpcSchema = { ...modNpcSchemaForPack, properties: { ...modNpcSchemaForPack.properties, contentType: { type: Type.STRING, enum: ['npc'] } }, required: [...modNpcSchemaForPack.required, 'contentType'] };

    const modCharacterSchema = { type: Type.OBJECT, properties: { contentType: { type: Type.STRING, enum: ['character'] }, name: { type: Type.STRING }, gender: { type: Type.STRING, enum: ['Nam', 'Nữ'] }, origin: { type: Type.STRING }, appearance: { type: Type.STRING }, personality: { type: Type.STRING }, bonuses: { type: Type.ARRAY, items: statBonusSchema }, tags: { type: Type.ARRAY, items: { type: Type.STRING } }, }, required: ['contentType', 'name', 'gender', 'origin', 'appearance', 'personality'] };
    const modSectSchema = { type: Type.OBJECT, properties: { contentType: { type: Type.STRING, enum: ['sect'] }, name: { type: Type.STRING }, description: { type: Type.STRING }, location: { type: Type.STRING }, members: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, rank: { type: Type.STRING, enum: ['Tông Chủ', 'Trưởng Lão', 'Đệ Tử Chân Truyền', 'Đệ Tử Nội Môn', 'Đệ Tử Ngoại Môn'] }, }, required: ['name', 'rank'] } }, tags: { type: Type.ARRAY, items: { type: Type.STRING } }, }, required: ['contentType', 'name', 'description', 'location'] };
    const modAuxiliaryTechniqueSchema = { type: Type.OBJECT, properties: { contentType: { type: Type.STRING, enum: ['auxiliaryTechnique'] }, name: { type: Type.STRING }, description: { type: Type.STRING }, type: { type: Type.STRING, enum: ['Linh Kỹ', 'Thần Thông', 'Độn Thuật', 'Tuyệt Kỹ', 'Tâm Pháp', 'Luyện Thể', 'Kiếm Quyết'] }, cost: { type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['Linh Lực', 'Sinh Mệnh', 'Nguyên Thần'] }, value: { type: Type.NUMBER } }, required: ['type', 'value'] }, cooldown: { type: Type.NUMBER }, rank: { type: Type.STRING, enum: Object.keys(PHAP_BAO_RANKS) as any }, icon: { type: Type.STRING, description: "Một emoji biểu tượng" }, element: { type: Type.STRING, enum: ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ', 'Vô'] as Element[] }, level: { type: Type.NUMBER, description: "Cấp độ ban đầu của công pháp." }, maxLevel: { type: Type.NUMBER, description: "Cấp độ tối đa của công pháp." }, effects: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['DAMAGE', 'HEAL', 'BUFF', 'DEBUFF'] }, details: { type: Type.STRING, description: "Một chuỗi JSON chứa chi tiết hiệu ứng. Ví dụ: '{\"element\": \"fire\", \"base\": 10}'" } }, required: ['type', 'details'] } }, tags: { type: Type.ARRAY, items: { type: Type.STRING } }, }, required: ['contentType', 'name', 'description', 'type', 'cost', 'cooldown', 'rank', 'icon'] };
    const modRecipeSchema = { type: Type.OBJECT, properties: { contentType: { type: Type.STRING, enum: ['recipe'] }, name: { type: Type.STRING }, description: { type: Type.STRING }, ingredients: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, quantity: { type: Type.NUMBER } }, required: ['name', 'quantity'] } }, result: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, quantity: { type: Type.NUMBER } }, required: ['name', 'quantity'] }, requiredAttribute: { type: Type.OBJECT, properties: { name: { type: Type.STRING, enum: ['Ngự Khí Thuật'] }, value: { type: Type.NUMBER } }, required: ['name', 'value'] }, icon: { type: Type.STRING, description: "Một emoji biểu tượng" }, }, required: ['contentType', 'name', 'ingredients', 'result', 'requiredAttribute'] };
    const modEventSchema = { type: Type.OBJECT, properties: { contentType: { type: Type.STRING, enum: ['event'] }, name: { type: Type.STRING }, description: { type: Type.STRING }, choices: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { text: { type: Type.STRING }, }, required: ['text'] } }, tags: { type: Type.ARRAY, items: { type: Type.STRING } }, }, required: ['contentType', 'name', 'description', 'choices'] };
    
    const modCustomDataPackSchema = {
        type: Type.OBJECT,
        properties: {
            contentType: { type: Type.STRING, enum: ['customDataPack'] },
            name: { type: Type.STRING, description: "Tên của gói dữ liệu, ví dụ: 'Gói trang bị Hắc Thủy Trại'." },
            data: {
                type: Type.OBJECT,
                description: "Một đối tượng JSON chứa nhiều loại nội dung khác nhau, được nhóm theo loại của chúng.",
                properties: {
                    items: { type: Type.ARRAY, items: modItemSchemaForPack },
                    npcs: { type: Type.ARRAY, items: modNpcSchemaForPack },
                },
            },
        },
        required: ['contentType', 'name', 'data']
    };

    const allSchemas = [
        modItemSchema, modCharacterSchema, modSectSchema,
        modNpcSchema, modAuxiliaryTechniqueSchema, modEventSchema, modRecipeSchema,
        modCustomDataPackSchema
    ];

    const finalSchema = {
        type: Type.OBJECT,
        properties: {
            content: {
                type: Type.ARRAY,
                description: "Danh sách các nội dung game được tạo ra (vật phẩm, tiên tư, etc.)",
                items: {
                    oneOf: allSchemas
                }
            },
        }
    };

    const fullPrompt = `Bạn là một Game Master AI cho game tu tiên "Tam Thiên Thế Giới".
Nhiệm vụ của bạn là tạo ra nội dung mới cho một bản mod dựa trên yêu cầu của người dùng.

**Bối cảnh mod hiện tại (nếu có):**
${JSON.stringify(modContext, null, 2)}

**Hướng dẫn và Ví dụ:**
- **Tạo Vật Phẩm (item):** 'Tạo một thanh phi kiếm tên Lưu Tinh, phẩm chất Tiên Phẩm, tăng 20 Thân Pháp.'
- **Tạo NPC:** 'Tạo một NPC là trưởng lão tà phái tên Hắc Ma Lão Tổ, ở địa điểm Hắc Long Đàm, trạng thái đang luyện công.'
- **Tạo Gói Dữ Liệu (customDataPack):** Khi người dùng muốn tạo nhiều loại nội dung liên quan đến nhau, hãy gộp chúng vào một "Gói Dữ Liệu". Ví dụ: 'Tạo một gói dữ liệu về "Hắc Thủy Trại", bao gồm 1 NPC trại chủ và 2 vật phẩm độc đáo (một đao và một áo giáp).' AI sẽ trả về một đối tượng customDataPack duy nhất, với trường 'data' chứa các mảng 'items' và 'npcs'.

**Yêu cầu của người dùng:**
"${prompt}"

Dựa vào yêu cầu, hãy tạo ra các đối tượng nội dung game phù hợp và trả về dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.
**QUAN TRỌNG**: Nếu yêu cầu có vẻ phức tạp và liên quan đến nhiều loại đối tượng, hãy ưu tiên sử dụng 'customDataPack' để nhóm chúng lại.
`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;
    const response = await generateWithRetry({
        model: settings?.gameMasterModel || 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: finalSchema,
        }
    }, specificApiKey);

    try {
        const json = JSON.parse(response.text.trim());

        if (json.content) {
            json.content.forEach((c: any) => {
                if (c.contentType === 'customDataPack' && typeof c.data === 'object') {
                    c.data = JSON.stringify(c.data, null, 2); // Stringify the data object for the editor
                }
            });
        }

        return json as AiGeneratedModData;
    } catch (e) {
        console.error("Failed to parse AI response for mod content:", e);
        console.error("Raw AI response:", response.text);
        throw new Error("AI đã trả về dữ liệu JSON không hợp lệ.");
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
    5.  **Tính Nhất Quán:** Đảm bảo tất cả các tham chiếu (như \`neighbors\`, \`locationId\` của NPC) đều trỏ đến các thực thể đã được tạo ra trong cùng một file JSON.

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
    worldRules?: string;
}

export const generateWorldFromPrompts = async (prompts: WorldGenPrompts): Promise<FullMod> => {
    const masterPrompt = `Bạn là một AI Sáng Thế, một thực thể có khả năng biến những ý tưởng cốt lõi thành một thế giới game có cấu trúc hoàn chỉnh.
    Nhiệm vụ của bạn là đọc và phân tích các ý tưởng do người dùng cung cấp, sau đó mở rộng, chi tiết hóa và suy luận ra toàn bộ dữ liệu cần thiết để tạo thành một bản mod game theo schema JSON đã cho.

    **Ý Tưởng Cốt Lõi từ Người Dùng:**
    ---
    - **Tên Mod:** ${prompts.modInfo.name}
    - **Bối Cảnh (Setting):** ${prompts.setting}
    - **Mục Tiêu Chính (Nếu có):** ${prompts.mainGoal || "AI tự do sáng tạo."}
    - **Quy Luật Thế Giới (Nếu có):** ${prompts.worldRules || "Không có quy luật đặc biệt."}
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
    4.  **Tính Nhất Quán:** Đảm bảo tất cả các tham chiếu bằng TÊN (như \`neighbors\`, \`locationId\` của NPC) đều trỏ đến các thực thể đã được tạo ra trong cùng một file JSON.

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
        }
        return json as FullMod;
    } catch (e) {
        console.error("Failed to parse AI response for world generation:", e);
        console.error("Raw AI response:", response.text);
        throw new Error("AI đã trả về dữ liệu JSON không hợp lệ.");
    }
};
