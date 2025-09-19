import { Type } from "@google/genai";
import type { GameState, InventoryItem, CultivationTechnique } from '../../types';
import { generateWithRetry } from './gemini.core';
import * as db from '../dbService';
import { ALL_ATTRIBUTES } from "../../constants";

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
                    bonuses: {
                        type: Type.ARRAY,
                        description: "A list of passive stat bonuses this technique provides. Only for passive types like 'Tâm Pháp'.",
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
                required: ['name', 'description', 'type']
            }
        },
        npcEncounters: {
            type: Type.ARRAY,
            description: "A list of NPC names from the context list that the player encountered for the first time in the narrative text.",
            items: { type: Type.STRING }
        },
        statChanges: {
            type: Type.ARRAY,
            description: "A list of direct changes to the player's core stats (like Sinh Mệnh, Linh Lực) that occurred in the narrative. Use negative numbers for damage/loss. Example: player takes 20 damage -> [{'attribute': 'Sinh Mệnh', 'change': -20}]",
            items: {
                type: Type.OBJECT,
                properties: {
                    attribute: { type: Type.STRING, enum: ALL_ATTRIBUTES },
                    change: { type: Type.NUMBER }
                },
                required: ['attribute', 'change']
            }
        },
        newEffects: {
            type: Type.ARRAY,
            description: "A list of new status effects (buffs or debuffs) applied to the player in the narrative, e.g., 'Trúng Độc', 'Gãy Tay'.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    duration: { type: Type.NUMBER, description: "Duration in turns/actions. Use -1 for permanent or until cured." },
                    isBuff: { type: Type.BOOLEAN },
                    bonuses: {
                        type: Type.ARRAY,
                        description: "The actual stat changes this effect causes. Example: a broken arm might give [{'attribute': 'Lực Lượng', 'value': -5}]",
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
                required: ['name', 'description', 'duration', 'isBuff', 'bonuses']
            }
        }
    }
};

export const parseNarrativeForGameData = async (narrative: string, gameState: GameState): Promise<{ newItems: InventoryItem[], newTechniques: CultivationTechnique[], newNpcEncounterIds: string[], statChanges: {attribute: string, change: number}[], newEffects: any[] }> => {
    const existingItemNames = gameState.playerCharacter.inventory.items.map(i => i.name);
    const existingTechniqueNames = [
        ...(gameState.playerCharacter.mainCultivationTechnique ? [gameState.playerCharacter.mainCultivationTechnique.name] : []),
        ...gameState.playerCharacter.auxiliaryTechniques.map(t => t.name)
    ];
    const unencounteredNpcs = gameState.activeNpcs.filter(npc => !gameState.encounteredNpcIds.includes(npc.id));
    const unencounteredNpcNames = unencounteredNpcs.map(n => n.identity.name);

    const prompt = `You are a data extraction AI for a game. Analyze the following narrative text and strictly extract game data based on the provided schema.

    **Narrative Text to Analyze:**
    """
    ${narrative}
    """

    **Context:**
    - Player's existing items: ${existingItemNames.join(', ') || 'None'}
    - Player's existing techniques: ${existingTechniqueNames.join(', ') || 'None'}
    - NPCs in the world the player has NOT met yet: ${unencounteredNpcNames.join(', ') || 'None'}

    **Instructions:**
    1.  **Extract NEW Items:** Identify physical items (swords, pills, herbs, etc.) the player EXPLICITLY obtains, receives, or finds. Do NOT list items they already have or just see.
    2.  **Extract NEW Techniques:** Identify cultivation techniques or skills the player EXPLICITLY learns or obtains. If it's a passive technique like 'Tâm Pháp', include its passive stat bonuses.
    3.  **Identify NEW NPC Encounters:** List names of NPCs from the "NOT met yet" list who the player interacts with or sees for the first time.
    4.  **Extract Stat Changes:** Identify DIRECT changes to player stats. QUAN TRỌNG: Nếu người chơi bị thương, trúng độc, hoặc mất máu, BẮT BUỘC phải có một mục 'statChanges' cho 'Sinh Mệnh' với giá trị 'change' là số âm. Ví dụ: 'ngươi bị một chưởng đánh bay, hộc máu' -> [{'attribute': 'Sinh Mệnh', 'change': -25}]. Tương tự với việc hồi phục (giá trị dương).
    5.  **Extract NEW Effects:** If the player suffers a lasting condition (e.g., gets poisoned, breaks a bone, is cursed, or receives a blessing), create a 'newEffects' entry. This should include a name, description, duration, whether it's a buff, and the specific stat bonuses/penalties. A broken arm ('Gãy Tay') should result in a debuff with a penalty to 'Lực Lượng'.

    Return a JSON object with keys: "items", "techniques", "npcEncounters", "statChanges", "newEffects". If a category has no new data, return an empty array for it. Be extremely literal and only extract data that is explicitly stated as changing or being acquired in the narrative.`;
    
    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.dataParsingModel;
    const response = await generateWithRetry({
        model: settings?.dataParsingModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: extractionSchema
        }
    }, specificApiKey);

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
        icon: tech.icon || '📜',
        bonuses: tech.bonuses || []
    }));

    const newNpcEncounterIds: string[] = (result.npcEncounters || [])
        .map((name: string) => {
            const npc = unencounteredNpcs.find(n => n.identity.name === name);
            return npc ? npc.id : null;
        })
        .filter((id: string | null): id is string => id !== null);

    return { 
        newItems, 
        newTechniques, 
        newNpcEncounterIds,
        statChanges: result.statChanges || [],
        newEffects: result.newEffects || []
    };
};
