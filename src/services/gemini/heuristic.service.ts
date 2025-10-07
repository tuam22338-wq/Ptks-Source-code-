import { Type } from "@google/genai";
import type { GameState } from '../../types';
import { generateWithRetry } from './gemini.core';
import * as db from '../dbService';

/**
 * Sends a corrupted game state to the AI and asks for a corrected version.
 * @param gameState The potentially corrupted game state.
 * @param problemDescription A description of the detected inconsistency.
 * @returns A corrected GameState object.
 */
export const generateCorrectedGameState = async (
    gameState: Partial<GameState>,
    problemDescription: string
): Promise<Partial<GameState>> => {

    // Define a schema that represents the GameState. This is a simplified version.
    // A full implementation would require a much more detailed schema.
    const gameStateSchema = {
        type: Type.OBJECT,
        properties: {
            playerCharacter: {
                type: Type.OBJECT,
                properties: {
                    attributes: { type: Type.OBJECT }
                }
            },
            activeNpcs: { type: Type.ARRAY, items: { type: Type.OBJECT } },
            storyLog: { type: Type.ARRAY, items: { type: Type.OBJECT } },
        },
        // We only require the parts we are trying to fix for efficiency
        required: ['playerCharacter'] 
    };

    const prompt = `Bạn là một AI chuyên sửa lỗi dữ liệu game. Dữ liệu GameState sau đây bị hỏng hoặc không nhất quán.
    
**Vấn đề được phát hiện:**
${problemDescription}

**Dữ liệu GameState bị lỗi (JSON):**
\`\`\`json
${JSON.stringify(gameState, null, 2)}
\`\`\`

**Nhiệm vụ:**
Phân tích vấn đề và dữ liệu. Sau đó, trả về một đối tượng JSON chứa phiên bản đã được sửa lỗi của GameState.
Chỉ sửa những gì cần thiết để giải quyết vấn đề. Giữ nguyên các phần khác của dữ liệu.`;

    const settings = await db.getSettings();
    if (!settings) {
        throw new Error("Không thể tải cài đặt để thực hiện sửa lỗi.");
    }

    const model = settings.heuristicFixerModel || 'gemini-2.5-flash';
    const specificApiKey = settings.modelApiKeyAssignments?.heuristicFixerModel;

    try {
        const response = await generateWithRetry({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: gameStateSchema,
            }
        }, specificApiKey);
        
        const correctedData = JSON.parse(response.text);
        return correctedData;

    } catch (error) {
        console.error("Heuristic Fixer AI failed to generate a correction:", error);
        throw error;
    }
};