import { Type } from "@google/genai";
import type { GameState, InventoryItem, CultivationTechnique } from '../../types';
import { generateWithRetry } from './gemini.core';
import * as db from '../dbService';

const extractionSchema = {
    type: Type.OBJECT,
    properties: {
        items: {
            type: Type.ARRAY,
            description: "A list of physical items the player explicitly obtains, receives, or finds in the narrative text. Do NOT include items they already have unless they get more of them.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    quantity: { type: Type.NUMBER, default: 1 },
                    type: { type: Type.STRING, enum: ['Vũ Khí', 'Phòng Cụ', 'Đan Dược', 'Pháp Bảo', 'Tạp Vật', 'Đan Lô', 'Linh Dược', 'Đan Phương', 'Nguyên Liệu'] },
                    quality: { type: Type.STRING, enum: ['Phàm Phẩm', 'Linh Phẩm', 'Pháp Phẩm', 'Bảo Phẩm', 'Tiên Phẩm', 'Tuyệt Phẩm'], default: 'Phàm Phẩm' },
                    weight: { type: Type.NUMBER, default: 0.1 },
                    icon: { type: Type.STRING, description: "An emoji icon for the item.", default: '📜'},
                },
                required: ['name', 'description', 'type']
            }
        },
        techniques: {
            type: Type.ARRAY,
            description: "A list of cultivation techniques the player explicitly learns or obtains in the narrative text. Do NOT include techniques they already know.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['Linh Kỹ', 'Thần Thông', 'Độn Thuật', 'Tuyệt Kỹ', 'Tâm Pháp', 'Luyện Thể', 'Kiếm Quyết'] },
                    rank: { type: Type.STRING, enum: ['Phàm Giai', 'Tiểu Giai', 'Trung Giai', 'Cao Giai', 'Siêu Giai', 'Địa Giai', 'Thiên Giai', 'Thánh Giai'], default: 'Phàm Giai' },
                    cost: { type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['Linh Lực', 'Sinh Mệnh', 'Nguyên Thần'], default: 'Linh Lực' }, value: { type: Type.NUMBER, default: 10 } } },
                    cooldown: { type: Type.NUMBER, default: 0 },
                    icon: { type: Type.STRING, default: '📜' },
                },
                required: ['name', 'description', 'type']
            }
        },
        npcEncounters: {
            type: Type.ARRAY,
            description: "A list of NPC names from the context list that the player encountered for the first time in the narrative text.",
            items: { type: Type.STRING }
        }
    }
};

export const parseNarrativeForGameData = async (narrative: string, gameState: GameState): Promise<{ newItems: InventoryItem[], newTechniques: CultivationTechnique[], newNpcEncounterIds: string[] }> => {
    const existingItemNames = gameState.playerCharacter.inventory.items.map(i => i.name);
    const existingTechniqueNames = [
        ...(gameState.playerCharacter.mainCultivationTechnique ? [gameState.playerCharacter.mainCultivationTechnique.name] : []),
        ...gameState.playerCharacter.auxiliaryTechniques.map(t => t.name)
    ];
    const unencounteredNpcs = gameState.activeNpcs.filter(npc => !gameState.encounteredNpcIds.includes(npc.id));
    const unencounteredNpcNames = unencounteredNpcs.map(n => n.identity.name);

    const prompt = `You are a data extraction tool for a game. Analyze the following narrative text and extract specific game data.

    **Narrative Text to Analyze:**
    """
    ${narrative}
    """

    **Context:**
    - Player's existing items: ${existingItemNames.join(', ') || 'None'}
    - Player's existing techniques: ${existingTechniqueNames.join(', ') || 'None'}
    - NPCs in the world the player has NOT met yet: ${unencounteredNpcNames.join(', ') || 'None'}

    **Instructions:**
    1.  **Extract NEW Items:** Identify any physical items (swords, pills, herbs, etc.) the player explicitly OBTAINS, RECEIVES, or FINDS in the narrative. Do NOT list items they already have.
    2.  **Extract NEW Techniques:** Identify any cultivation techniques or skills the player explicitly LEARNS or OBTAINS. Do NOT list techniques they already know.
    3.  **Identify NEW NPC Encounters:** Look for names of NPCs from the "NOT met yet" list who are mentioned as interacting with or being seen by the player for the first time.

    Return a JSON object with three keys: "items", "techniques", and "npcEncounters". If nothing new is found for a category, return an empty array for it. Be very strict about what counts as "obtaining" or "learning". Only extract items if the text clearly states the player now possesses them.`;
    
    const settings = await db.getSettings();
    const response = await generateWithRetry({
        model: settings?.dataParsingModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: extractionSchema
        }
    });

    const result = JSON.parse(response.text);

    const newItems: InventoryItem[] = (result.items || []).map((item: any) => ({
        ...item,
        id: `item-${Date.now()}-${Math.random()}`,
        quantity: item.quantity || 1,
        quality: item.quality || 'Phàm Phẩm',
        weight: item.weight || 0.1,
        icon: item.icon || '📜'
    }));

    const newTechniques: CultivationTechnique[] = (result.techniques || []).map((tech: any) => ({
        ...tech,
        id: `tech-${Date.now()}-${Math.random()}`,
        level: 1,
        maxLevel: 10,
        effects: tech.effects || [],
        cost: tech.cost || { type: 'Linh Lực', value: 10 },
        cooldown: tech.cooldown || 0,
        rank: tech.rank || 'Phàm Giai',
        icon: tech.icon || '📜'
    }));

    const newNpcEncounterIds: string[] = (result.npcEncounters || [])
        .map((name: string) => {
            const npc = unencounteredNpcs.find(n => n.identity.name === name);
            return npc ? npc.id : null;
        })
        .filter((id: string | null): id is string => id !== null);

    return { newItems, newTechniques, newNpcEncounterIds };
};