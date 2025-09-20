import { Type } from "@google/genai";
import type { GameState, InventoryItem, CultivationTechnique, ActiveQuest } from '../../types';
import { generateWithRetry } from './gemini.core';
import * as db from '../dbService';
import { ALL_ATTRIBUTES } from "../../constants";

// --- Schemas for Specialized AI Neurons ---

const itemSchema = {
    type: Type.OBJECT,
    properties: {
        items: {
            type: Type.ARRAY,
            description: "List of physical items the player explicitly obtains, receives, or finds. Do NOT include items they already have unless they get more.",
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
        }
    }
};

const techniqueSchema = {
    type: Type.OBJECT,
    properties: {
        techniques: {
            type: Type.ARRAY,
            description: "List of cultivation techniques the player explicitly learns or obtains. Do NOT include techniques they already know.",
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
                        description: "List of passive stat bonuses. Only for passive types like 'Tâm Pháp'. Active skills should have an empty array.",
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
        }
    }
};

const encounterSchema = {
    type: Type.OBJECT,
    properties: {
        npcEncounters: {
            type: Type.ARRAY,
            description: "List of NPC names from the context list that the player encountered for the first time.",
            items: { type: Type.STRING }
        }
    }
};

const statChangeSchema = {
    type: Type.OBJECT,
    properties: {
        statChanges: {
            type: Type.ARRAY,
            description: "List of direct changes to the player's core stats (like Sinh Mệnh, Linh Lực). Use negative numbers for damage/loss.",
            items: {
                type: Type.OBJECT,
                properties: {
                    attribute: { type: Type.STRING, enum: ALL_ATTRIBUTES },
                    change: { type: Type.NUMBER }
                },
                required: ['attribute', 'change']
            }
        }
    }
};

const effectSchema = {
    type: Type.OBJECT,
    properties: {
        newEffects: {
            type: Type.ARRAY,
            description: "List of new status effects (buffs or debuffs) applied to the player, e.g., 'Trúng Độc'.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    duration: { type: Type.NUMBER, description: "Duration in turns/actions. -1 for permanent." },
                    isBuff: { type: Type.BOOLEAN },
                    bonuses: {
                        type: Type.ARRAY,
                        description: "The stat changes this effect causes. E.g., a broken arm -> [{'attribute': 'Lực Lượng', 'value': -5}]",
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

const fullQuestObjectiveSchema = {
    type: Type.OBJECT,
    properties: {
        type: { type: Type.STRING, enum: ['TRAVEL', 'GATHER', 'TALK', 'DEFEAT'] },
        description: { type: Type.STRING, description: "Mô tả mục tiêu cho người chơi. Ví dụ: 'Đi đến Sông Vị Thủy', 'Thu thập 3 Linh Tâm Thảo'." },
        target: { type: Type.STRING, description: "ID hoặc Tên của mục tiêu. Ví dụ: 'song_vi_thuy', 'Linh Tâm Thảo', 'npc_khuong_tu_nha'." },
        required: { type: Type.NUMBER, description: "Số lượng cần thiết." },
    },
    required: ['type', 'description', 'target', 'required']
};

const fullQuestRewardSchema = {
    type: Type.OBJECT,
    properties: {
        spiritualQi: { type: Type.NUMBER, description: "Lượng linh khí thưởng." },
        danhVong: { type: Type.NUMBER, description: "Lượng danh vọng thưởng." },
        items: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, quantity: { type: Type.NUMBER } }, required: ['name', 'quantity'] } },
    }
};

const fullQuestSchemaForParsing = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        source: { type: Type.STRING, description: "ID của nguồn gốc nhiệm vụ, ví dụ: 'npc_khuong_tu_nha'." },
        objectives: { type: Type.ARRAY, items: fullQuestObjectiveSchema },
        rewards: fullQuestRewardSchema,
    },
    required: ['title', 'description', 'source', 'objectives']
};

const finalQuestSchema = {
    type: Type.OBJECT,
    properties: {
        newQuests: {
            type: Type.ARRAY,
            description: "A list of new quests given to the player in the narrative.",
            items: fullQuestSchemaForParsing
        }
    }
};

const timeChangeSchema = {
    type: Type.OBJECT,
    properties: {
        timeJump: {
            type: Type.OBJECT,
            description: "An object representing a significant jump in time mentioned in the narrative. Extract only if the jump is more than a few days.",
            properties: {
                years: { type: Type.NUMBER, description: "Number of years passed. Default to 0." },
                seasons: { type: Type.NUMBER, description: "Number of seasons (quarters) passed. Default to 0." },
                days: { type: Type.NUMBER, description: "Number of days passed. Default to 0." },
            }
        }
    }
};

// --- Specialized AI Neuron Functions ---

const buildContext = (narrative: string, gameState: GameState) => {
    const existingItemNames = gameState.playerCharacter.inventory.items.map(i => i.name);
    const existingTechniqueNames = [
        ...(gameState.playerCharacter.mainCultivationTechnique ? [gameState.playerCharacter.mainCultivationTechnique.name] : []),
        ...gameState.playerCharacter.auxiliaryTechniques.map(t => t.name)
    ];
    const unencounteredNpcs = gameState.activeNpcs.filter(npc => !gameState.encounteredNpcIds.includes(npc.id));
    const unencounteredNpcNames = unencounteredNpcs.map(n => n.identity.name);
    
    return `
        **Narrative Text to Analyze:** """${narrative}"""
        
        **Context:**
        - Player's existing items: ${existingItemNames.join(', ') || 'None'}
        - Player's existing techniques: ${existingTechniqueNames.join(', ') || 'None'}
        - NPCs in the world the player has NOT met yet: ${unencounteredNpcNames.join(', ') || 'None'}
    `;
};

async function extractItems(context: string): Promise<InventoryItem[]> {
    const prompt = `You are a data extraction AI. Analyze the narrative and extract ONLY NEW items the player obtains.
    ${context}
    Return a JSON object based on the schema. If no new items, return an empty array.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.dataParsingModel;
    try {
        const response = await generateWithRetry({ model: settings?.dataParsingModel || 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: itemSchema } }, specificApiKey);
        const result = JSON.parse(response.text);
        return (result.items || []).map((item: any) => ({ ...item, id: `item-${Date.now()}-${Math.random()}`, quantity: item.quantity || 1, quality: item.quality || 'Phàm Phẩm', weight: item.weight || 0.1, icon: item.icon || '📜' }));
    } catch (e) {
        console.error("Item extraction neuron failed:", e);
        return [];
    }
}

async function extractTechniques(context: string): Promise<CultivationTechnique[]> {
    const prompt = `You are a data extraction AI. Analyze the narrative and extract ONLY NEW cultivation techniques the player learns.
    ${context}
    Return a JSON object based on the schema. If no new techniques, return an empty array.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.dataParsingModel;
    try {
        const response = await generateWithRetry({ model: settings?.dataParsingModel || 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: techniqueSchema } }, specificApiKey);
        const result = JSON.parse(response.text);
        return (result.techniques || []).map((tech: any) => ({ ...tech, id: `tech-${Date.now()}-${Math.random()}`, level: 1, maxLevel: 10, effects: tech.effects || [], cost: tech.cost || { type: 'Linh Lực', value: 10 }, cooldown: tech.cooldown || 0, rank: tech.rank || 'Phàm Giai', icon: tech.icon || '📜', bonuses: tech.bonuses || [] }));
    } catch (e) {
        console.error("Technique extraction neuron failed:", e);
        return [];
    }
}

async function extractNpcEncounters(context: string, gameState: GameState): Promise<string[]> {
    const prompt = `You are a data extraction AI. Analyze the narrative and identify first-time encounters with NPCs from the provided "NOT met yet" list.
    ${context}
    Return a JSON object based on the schema. If no new encounters, return an empty array.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.dataParsingModel;
    try {
        const response = await generateWithRetry({ model: settings?.dataParsingModel || 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: encounterSchema } }, specificApiKey);
        const result = JSON.parse(response.text);
        const unencounteredNpcs = gameState.activeNpcs.filter(npc => !gameState.encounteredNpcIds.includes(npc.id));
        return (result.npcEncounters || []).map((name: string) => {
            const npc = unencounteredNpcs.find(n => n.identity.name === name);
            return npc ? npc.id : null;
        }).filter((id: string | null): id is string => id !== null);
    } catch (e) {
        console.error("Encounter extraction neuron failed:", e);
        return [];
    }
}

async function extractStatChanges(context: string): Promise<any[]> {
    const prompt = `You are a data extraction AI. Analyze the narrative for explicit stat changes like damage or healing. IMPORTANT: If the player gets hurt or loses health, you MUST create a 'statChanges' entry for 'Sinh Mệnh' with a negative value.
    ${context}
    Return a JSON object based on the schema. If no stat changes, return an empty array.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.dataParsingModel;
    try {
        const response = await generateWithRetry({ model: settings?.dataParsingModel || 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: statChangeSchema } }, specificApiKey);
        const result = JSON.parse(response.text);
        return result.statChanges || [];
    } catch (e) {
        console.error("Stat change extraction neuron failed:", e);
        return [];
    }
}

async function extractEffects(context: string): Promise<any[]> {
    const prompt = `You are a data extraction AI. Analyze the narrative for new, lasting status effects applied to the player (e.g., poisoned, broken arm).
    ${context}
    Return a JSON object based on the schema. If no new effects, return an empty array.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.dataParsingModel;
    try {
        const response = await generateWithRetry({ model: settings?.dataParsingModel || 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: effectSchema } }, specificApiKey);
        const result = JSON.parse(response.text);
        return result.newEffects || [];
    } catch (e) {
        console.error("Effect extraction neuron failed:", e);
        return [];
    }
}

async function extractQuests(context: string): Promise<Partial<ActiveQuest>[]> {
    const prompt = `You are a data extraction AI. Analyze the narrative to see if an NPC gives the player a new quest with clear objectives.
    ${context}
    Return a JSON object based on the schema. If no new quests, return an empty array.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.dataParsingModel;
    try {
        const response = await generateWithRetry({ model: settings?.dataParsingModel || 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: finalQuestSchema } }, specificApiKey);
        const result = JSON.parse(response.text);
        return result.newQuests || [];
    } catch (e) {
        console.error("Quest extraction neuron failed:", e);
        return [];
    }
}

async function extractTimeChange(context: string): Promise<{ years?: number; seasons?: number; days?: number } | null> {
    const prompt = `You are a data extraction AI. Analyze the narrative for any explicit mentions of a large time jump (e.g., "7 years later", "after three months", "một tháng sau"). Convert months to days (1 month = 30 days).
    ${context}
    Return a JSON object based on the schema. If no significant time jump (less than a few days), return an empty object or null.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.dataParsingModel;
    try {
        const response = await generateWithRetry({ model: settings?.dataParsingModel || 'gemini-2.5-flash', contents: prompt, config: { responseMimeType: "application/json", responseSchema: timeChangeSchema } }, specificApiKey);
        const result = JSON.parse(response.text);
        return result.timeJump || null;
    } catch (e) {
        console.error("Time change extraction neuron failed:", e);
        return null;
    }
}

// --- Main Cognitive System Orchestrator ---

export const parseNarrativeForGameData = async (narrative: string, gameState: GameState): Promise<{ newItems: InventoryItem[], newTechniques: CultivationTechnique[], newNpcEncounterIds: string[], statChanges: {attribute: string, change: number}[], newEffects: any[], newQuests: Partial<ActiveQuest>[], timeJump: { years?: number; seasons?: number; days?: number } | null }> => {
    console.log("Activating Cognitive Nervous System to parse narrative...");
    const context = buildContext(narrative, gameState);

    try {
        // Fire all specialized AI "neurons" concurrently
        const [
            itemsResult,
            techniquesResult,
            encountersResult,
            statsResult,
            effectsResult,
            questsResult,
            timeResult
        ] = await Promise.all([
            extractItems(context),
            extractTechniques(context),
            extractNpcEncounters(context, gameState),
            extractStatChanges(context),
            extractEffects(context),
            extractQuests(context),
            extractTimeChange(context)
        ]);
        
        console.log("Cognitive System processing complete. Aggregating results.");

        // Aggregate results
        return {
            newItems: itemsResult,
            newTechniques: techniquesResult,
            newNpcEncounterIds: encountersResult,
            statChanges: statsResult,
            newEffects: effectsResult,
            newQuests: questsResult,
            timeJump: timeResult,
        };
    } catch (error) {
        console.error("A critical error occurred in the Cognitive Nervous System:", error);
        // Return an empty structure to prevent crashes
        return {
            newItems: [],
            newTechniques: [],
            newNpcEncounterIds: [],
            statChanges: [],
            newEffects: [],
            newQuests: [],
            timeJump: null,
        };
    }
};