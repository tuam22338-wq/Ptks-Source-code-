import { Type } from "@google/genai";
import type { AiGeneratedModData, ModContentObject, CommunityMod } from '../../types';
import { ALL_ATTRIBUTES, TALENT_RANK_NAMES, WORLD_MAP, PHAP_BAO_RANKS, COMMUNITY_MODS_URL } from "../../constants";
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
    
    const modItemSchema = {
        type: Type.OBJECT,
        properties: {
            contentType: { type: Type.STRING, enum: ['item'] },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['Vũ Khí', 'Phòng Cụ', 'Đan Dược', 'Pháp Bảo', 'Tạp Vật', 'Đan Lô', 'Linh Dược', 'Đan Phương', 'Nguyên Liệu'] },
            quality: { type: Type.STRING, enum: ['Phàm Phẩm', 'Linh Phẩm', 'Pháp Phẩm', 'Bảo Phẩm', 'Tiên Phẩm', 'Tuyệt Phẩm'] },
            weight: { type: Type.NUMBER },
            value: { type: Type.NUMBER, description: "Giá trị cơ bản của vật phẩm bằng Bạc. Hữu ích cho việc bán." },
            slot: { type: Type.STRING, enum: ['Vũ Khí', 'Thượng Y', 'Hạ Y', 'Giày', 'Phụ Kiện 1', 'Phụ Kiện 2'], description: "Vị trí trang bị nếu vật phẩm là Vũ Khí hoặc Phòng Cụ." },
            bonuses: { type: Type.ARRAY, items: statBonusSchema },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            icon: { type: Type.STRING, description: "Một emoji phù hợp với vật phẩm, ví dụ '⚔️' cho kiếm, '💊' cho đan dược."}
        },
        required: ['contentType', 'name', 'description', 'type', 'quality', 'weight']
    };

    const modTalentSchema = {
        type: Type.OBJECT,
        properties: {
            contentType: { type: Type.STRING, enum: ['talent'] },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            rank: { type: Type.STRING, enum: TALENT_RANK_NAMES },
            bonuses: { type: Type.ARRAY, items: statBonusSchema },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['contentType', 'name', 'description', 'rank']
    };

    const modCharacterSchema = {
        type: Type.OBJECT,
        properties: {
            contentType: { type: Type.STRING, enum: ['character'] },
            name: { type: Type.STRING },
            gender: { type: Type.STRING, enum: ['Nam', 'Nữ'] },
            origin: { type: Type.STRING },
            appearance: { type: Type.STRING },
            personality: { type: Type.STRING },
            bonuses: { type: Type.ARRAY, items: statBonusSchema },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['contentType', 'name', 'gender', 'origin', 'appearance', 'personality']
    };
    
    const modSectSchema = {
        type: Type.OBJECT,
        properties: {
            contentType: { type: Type.STRING, enum: ['sect'] },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            location: { type: Type.STRING },
            members: { type: Type.ARRAY, items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    rank: { type: Type.STRING, enum: ['Tông Chủ', 'Trưởng Lão', 'Đệ Tử Chân Truyền', 'Đệ Tử Nội Môn', 'Đệ Tử Ngoại Môn'] },
                },
                required: ['name', 'rank']
            }},
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['contentType', 'name', 'description', 'location']
    };
    
    const modWorldBuildingSchema = {
        type: Type.OBJECT,
        properties: {
            contentType: { type: Type.STRING, enum: ['worldBuilding'] },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            data: { type: Type.STRING, description: "Một chuỗi JSON chứa dữ liệu tùy chỉnh. Ví dụ: '{\"population\": 1000, \"ruler\": \"Lord Smith\"}'" },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['contentType', 'title', 'data']
    };
    
    const modNpcSchema = {
        type: Type.OBJECT,
        properties: {
            contentType: { type: Type.STRING, enum: ['npc'] },
            name: { type: Type.STRING },
            status: { type: Type.STRING },
            description: { type: Type.STRING, description: "Mô tả ngoại hình" },
            origin: { type: Type.STRING },
            personality: { type: Type.STRING },
            locationId: { type: Type.STRING, enum: WORLD_MAP.map(l => l.id) },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['contentType', 'name', 'status', 'description', 'origin', 'personality', 'locationId']
    };
    
    const modTechniqueSchema = {
        type: Type.OBJECT,
        properties: {
            contentType: { type: Type.STRING, enum: ['technique'] },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['Linh Kỹ', 'Thần Thông', 'Độn Thuật', 'Tuyệt Kỹ'] },
            cost: { type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['Linh Lực', 'Sinh Mệnh', 'Nguyên Thần'] }, value: { type: Type.NUMBER } }, required: ['type', 'value'] },
            cooldown: { type: Type.NUMBER },
            rank: { type: Type.STRING, enum: Object.keys(PHAP_BAO_RANKS) as any },
            icon: { type: Type.STRING, description: "Một emoji biểu tượng" },
            effects: { type: Type.ARRAY, items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['DAMAGE', 'HEAL', 'BUFF', 'DEBUFF'] },
                    details: { type: Type.STRING, description: "Một chuỗi JSON chứa chi tiết hiệu ứng. Ví dụ: '{\"element\": \"fire\", \"base\": 10}'" }
                },
                required: ['type', 'details']
            }},
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['contentType', 'name', 'description', 'type', 'cost', 'cooldown', 'rank', 'icon']
    };
    
    const modRecipeSchema = {
        type: Type.OBJECT,
        properties: {
            contentType: { type: Type.STRING, enum: ['recipe'] },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            ingredients: { type: Type.ARRAY, items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    quantity: { type: Type.NUMBER }
                },
                required: ['name', 'quantity']
            }},
            result: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, quantity: { type: Type.NUMBER } }, required: ['name', 'quantity'] },
            requiredAttribute: { type: Type.OBJECT, properties: { name: { type: Type.STRING, enum: ['Ngự Khí Thuật'] }, value: { type: Type.NUMBER } }, required: ['name', 'value'] },
            icon: { type: Type.STRING, description: "Một emoji biểu tượng" },
        },
        required: ['contentType', 'name', 'ingredients', 'result', 'requiredAttribute']
    };
    
    const modEventSchema = {
         type: Type.OBJECT,
        properties: {
            contentType: { type: Type.STRING, enum: ['event'] },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            choices: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING },
                    },
                    required: ['text']
                }
            },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['contentType', 'name', 'description', 'choices']
    };
    
    const modCustomPanelSchema = {
        type: Type.OBJECT,
        properties: {
            contentType: { type: Type.STRING, enum: ['customPanel'] },
            title: { type: Type.STRING },
            iconName: { type: Type.STRING, enum: ['FaBook', 'FaGlobe', 'FaScroll', 'FaSun', 'FaGopuram'] },
            content: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách các tiêu đề của mục WorldBuilding" },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['contentType', 'title', 'iconName', 'content']
    };

    const allSchemas = [
        modItemSchema, modTalentSchema, modCharacterSchema, modSectSchema, modWorldBuildingSchema,
        modNpcSchema, modTechniqueSchema, modEventSchema, modRecipeSchema, modCustomPanelSchema
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
            realmConfigs: {
                type: Type.ARRAY,
                description: "Một hệ thống cảnh giới tu luyện hoàn chỉnh.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        stages: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    qiRequired: { type: Type.NUMBER },
                                    bonuses: { type: Type.ARRAY, items: statBonusSchema }
                                },
                                required: ['name', 'qiRequired']
                            }
                        }
                    },
                    required: ['name', 'stages']
                }
            },
            talentSystemConfig: {
                type: Type.OBJECT,
                properties: {
                    systemName: { type: Type.STRING },
                    choicesPerRoll: { type: Type.NUMBER },
                    maxSelectable: { type: Type.NUMBER },
                    allowAIGeneratedTalents: { type: Type.BOOLEAN },
                }
            }
        }
    };

    const fullPrompt = `Bạn là một Game Master AI cho game tu tiên "Tam Thiên Thế Giới".
Nhiệm vụ của bạn là tạo ra nội dung mới cho một bản mod dựa trên yêu cầu của người dùng.

**Bối cảnh mod hiện tại (nếu có):**
${JSON.stringify(modContext, null, 2)}

**Hướng dẫn và Ví dụ:**
- **Tạo Vật Phẩm (item):** 'Tạo một thanh phi kiếm tên Lưu Tinh, phẩm chất Tiên Phẩm, tăng 20 Thân Pháp.'
  - Các tham số chính: name, description, type, quality, weight, bonuses (thuộc tính & giá trị), tags, slot (nếu là trang bị), value (giá trị), icon (emoji).
  - **Hãy sáng tạo icon và mô tả thật chi tiết, độc đáo!**
- **Tạo Tiên Tư (talent):** 'Tạo một tiên tư Thánh Giai tên Bất Diệt Thánh Thể, tăng 500 Căn Cốt và 1000 Sinh Mệnh.'
  - Các tham số chính: name, description, rank, bonuses, tags.
- **Tạo NPC:** 'Tạo một NPC là trưởng lão tà phái tên Hắc Ma Lão Tổ, ở địa điểm Hắc Long Đàm, trạng thái đang luyện công.'
  - Các tham số chính: name, status, description (ngoại hình), origin, personality, locationId, tags.
- **Tạo Công Pháp Phụ (auxiliaryTechnique):** 'Tạo một thần thông tên là Hỏa Long Thuật, cấp Địa Giai, tiêu hao 100 linh lực, gây sát thương hỏa.'
  - Các tham số chính: name, description, type, cost, cooldown, rank, icon, requirements, effects, tags.
- **Tạo Tông Môn (sect):** 'Tạo một tông môn tên là Thanh Vân Môn, ở Thanh Loan Sơn, là chính phái chuyên tu luyện kiếm đạo.'
  - Các tham số chính: name, description, location, members, tags.
- **Tạo nhiều đối tượng:** 'Tạo 5 loại linh dược khác nhau phẩm chất Linh Phẩm.'

**Yêu cầu của người dùng:**
"${prompt}"

Dựa vào yêu cầu, hãy tạo ra các đối tượng nội dung game phù hợp và trả về dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.
**QUAN TRỌNG**: Ưu tiên tạo nội dung trong mảng 'content'. Chỉ tạo 'realmConfigs' hoặc 'talentSystemConfig' nếu người dùng yêu cầu rõ ràng.
Hãy sáng tạo và đảm bảo nội dung phù hợp với bối cảnh tiên hiệp.
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

        // Post-process stringified JSON from AI
        if (json.content) {
            json.content.forEach((c: any) => {
                if (c.contentType === 'worldBuilding' && typeof c.data === 'string') {
                    try { c.data = JSON.parse(c.data); } catch (e) { 
                        console.warn('Failed to parse worldBuilding data string from AI:', c.data); 
                        c.data = {}; 
                    }
                }
                if (c.contentType === 'technique' && c.effects) {
                    c.effects.forEach((effect: any) => {
                        if (typeof effect.details === 'string') {
                            try { effect.details = JSON.parse(effect.details); } catch (e) { 
                                console.warn('Failed to parse technique details string from AI:', effect.details); 
                                effect.details = {}; 
                            }
                        }
                    });
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