
import { Type } from "@google/genai";
import type { GameState, RagSourceType } from '../types';
import { generateWithRetry } from './gemini/gemini.core';
import * as db from './dbService';
import { queryRAG } from './ragService';

interface OrchestratorResult {
    queryType: 'LORE' | 'MECHANICS' | 'CHARACTER' | 'GENERAL';
    entities: string[];
}

export const orchestrateRagQuery = async (
    playerInput: string,
    inputType: 'say' | 'act',
    gameState: GameState
): Promise<string> => {
    
    // Simple heuristic: 'ask' tab always triggers RAG, 'act' and 'say' only if they contain question marks.
    if (!playerInput.includes('?')) {
        // For non-questions, we might still want to fetch memory about mentioned entities.
        // This is a simpler path that bypasses the orchestrator AI call.
        const settings = await db.getSettings();
        const topK = settings?.ragTopK || 3;
        // Search character graph and lore for mentioned entities.
        return await queryRAG(playerInput, ['CORE_LORE', 'PLAYER_JOURNAL', 'MOD'], topK);
    }

    const schema = {
        type: Type.OBJECT,
        properties: {
            queryType: {
                type: Type.STRING,
                enum: ['LORE', 'MECHANICS', 'CHARACTER', 'GENERAL'],
                description: "Phân loại câu hỏi: LORE (lịch sử, địa danh), MECHANICS (luật chơi), CHARACTER (về NPC), GENERAL (khác)."
            },
            entities: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Danh sách các danh từ riêng (tên nhân vật, địa điểm) trong câu hỏi."
            }
        },
        required: ['queryType']
    };

    const prompt = `Phân tích câu hỏi của người chơi để điều phối truy vấn tri thức.
    Câu hỏi: "${playerInput}"
    
    Phân loại và trích xuất thực thể.`;
    
    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.ragOrchestratorModel;

    try {
        const response = await generateWithRetry({
            model: settings?.ragOrchestratorModel || 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        }, specificApiKey);
        
        const result = JSON.parse(response.text) as OrchestratorResult;
        
        let sourcesToSearch: RagSourceType[] = [];
        switch (result.queryType) {
            case 'LORE':
                sourcesToSearch = ['CORE_LORE', 'MOD', 'PLAYER_JOURNAL'];
                break;
            case 'MECHANICS':
                sourcesToSearch = ['CORE_MECHANICS'];
                break;
            case 'CHARACTER':
                // For characters, we check session memory (the graph) and general lore
                sourcesToSearch = ['SESSION_MEMORY', 'CORE_LORE', 'MOD', 'PLAYER_JOURNAL'];
                break;
            case 'GENERAL':
            default:
                sourcesToSearch = ['CORE_LORE', 'CORE_MECHANICS', 'MOD', 'PLAYER_JOURNAL', 'SESSION_MEMORY'];
                break;
        }

        const topK = settings?.ragTopK || 5;
        const ragContext = await queryRAG(playerInput, sourcesToSearch, topK);
        
        if (ragContext) {
            return `### Bối Cảnh Tri Thức (Từ Thiên Cơ Các) ###\n${ragContext}\n#############################\n`;
        }
        return "";

    } catch (error) {
        console.error("Lỗi điều phối RAG:", error);
        // Fallback to a general query if orchestrator fails
        const topK = settings?.ragTopK || 3;
        return await queryRAG(playerInput, ['CORE_LORE', 'MOD', 'PLAYER_JOURNAL'], topK);
    }
};
