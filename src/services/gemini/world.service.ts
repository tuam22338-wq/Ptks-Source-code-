import { Type } from "@google/genai";
import type { Faction, ModLocation, ModNpc } from '../../types';
import { generateWithRetry } from './gemini.core';
import * as db from '../dbService';

interface WorldEntityGenerationResult {
    factions?: Faction[];
    locations?: ModLocation[];
    npcs?: ModNpc[];
}

export const generateWorldEntities = async (
    genre: string,
    setting: string,
    generateNpcs: boolean,
    generateLocations: boolean,
    generateFactions: boolean
): Promise<WorldEntityGenerationResult> => {
    
    const properties: Record<string, any> = {};

    if (generateFactions) {
        properties.factions = {
            type: Type.ARRAY,
            description: "Danh sách 2-3 phe phái độc đáo, phù hợp với bối cảnh.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ['name', 'description']
            }
        };
    }

    if (generateLocations) {
        properties.locations = {
            type: Type.ARRAY,
            description: "Danh sách 3-5 địa điểm thú vị, đa dạng (thành thị, hoang dã, bí cảnh...). TUYỆT ĐỐI KHÔNG dùng tên 'Làng Khởi Nguyên' hay 'Rừng Thanh Âm'.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['Thành Thị', 'Thôn Làng', 'Hoang Dã', 'Sơn Mạch', 'Thánh Địa', 'Bí Cảnh', 'Quan Ải'] },
                    qiConcentration: { type: Type.NUMBER, description: "Nồng độ linh khí, từ 1 (thấp) đến 100 (cao)." }
                },
                required: ['name', 'description', 'type', 'qiConcentration']
            }
        };
    }

    if (generateNpcs) {
        properties.npcs = {
            type: Type.ARRAY,
            description: "Danh sách 5-8 NPC thú vị, có vai trò và xuất thân đa dạng. TUYỆT ĐỐI KHÔNG dùng tên 'A Mộc' hay 'Linh'.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    status: { type: Type.STRING, description: "Trạng thái hoặc câu trích dẫn ngắn." },
                    description: { type: Type.STRING, description: "Mô tả ngoại hình." },
                    origin: { type: Type.STRING, description: "Xuất thân, lai lịch." },
                    personality: { type: Type.STRING, enum: ['Trung Lập', 'Chính Trực', 'Hỗn Loạn', 'Tà Ác'] }
                },
                required: ['name', 'status', 'description', 'origin', 'personality']
            }
        };
    }
    
    if (Object.keys(properties).length === 0) {
        return {}; // Nothing to generate
    }

    const schema = {
        type: Type.OBJECT,
        properties: properties
    };

    const prompt = `Bạn là một AI Sáng Thế, có khả năng tạo ra các thành phần cho một thế giới game.
    
    **MỆNH LỆNH TỐI THƯỢNG:** Hãy sáng tạo ra những thực thể HOÀN TOÀN MỚI dựa trên bối cảnh được cung cấp. TUYỆT ĐỐI KHÔNG được sử dụng lại các tên gọi hoặc khái niệm mẫu như "Làng Khởi Nguyên", "Rừng Thanh Âm", "Trưởng Lão A Mộc", "Linh". Phải tạo ra các tên gọi độc đáo và phù hợp.

    **Bối cảnh Thế giới:**
    - **Thể Loại:** ${genre}
    - **Bối cảnh/Mô tả:** ${setting}

    **Nhiệm vụ:**
    Dựa vào bối cảnh, hãy tạo ra các danh sách sau đây theo yêu cầu. Đảm bảo chúng logic, thú vị và phù hợp với chủ đề.
    ${generateFactions ? "- Một danh sách các phe phái." : ""}
    ${generateLocations ? "- Một danh sách các địa điểm." : ""}
    ${generateNpcs ? "- Một danh sách các nhân vật (NPC)." : ""}

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;

    const settings = await db.getSettings();
    const model = settings?.gameMasterModel || 'gemini-2.5-flash';
    const specificApiKey = settings?.modelApiKeyAssignments?.gameMasterModel;

    const response = await generateWithRetry({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 1.0,
        }
    }, specificApiKey);
    
    try {
        const data = JSON.parse(response.text);
        // Post-process to ensure locations/npcs have IDs for internal use
        if (data.locations) {
            data.locations = data.locations.map((loc: any) => ({
                ...loc,
                id: loc.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, ''),
            }));
        }
        if (data.npcs) {
            data.npcs = data.npcs.map((npc: any) => ({
                ...npc,
                id: `ai-gen-npc-${Math.random().toString(36).substring(2, 9)}`,
            }));
        }
        return data;
    } catch (e: any) {
        console.error("Lỗi phân tích JSON khi tạo thực thể thế giới:", response.text, e);
        throw new Error("AI đã trả về dữ liệu không hợp lệ khi kiến tạo thế giới.");
    }
};
