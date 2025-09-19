import { Type } from "@google/genai";
import type { AiGeneratedModData, ModContentObject, CommunityMod, Element } from '../../types';
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