import { Type } from "@google/genai";
import type { GameState, InventoryItem, CultivationTechnique, ActiveQuest, ActiveEffect, PlayerVitals } from '../../types';
import { generateWithRetry } from './gemini.core';
import * as db from '../dbService';
import { ALL_PARSABLE_STATS } from "../../constants";

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
                        description: "List of passive stat bonuses. Only for passive types like 'Tâm Pháp' or 'Luyện Thể'. Active skills should have an empty array.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                attribute: { type: Type.STRING, enum: ALL_PARSABLE_STATS },
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
            description: "List of direct changes to the player's core stats (like Sinh Mệnh, Linh Lực, Tuổi Thọ, spiritualQi, hunger, thirst, etc.). Use negative numbers for damage/loss.",
            items: {
                type: Type.OBJECT,
                properties: {
                    attribute: { type: Type.STRING, enum: ALL_PARSABLE_STATS },
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
                                attribute: { type: Type.STRING, enum: ALL_PARSABLE_STATS },
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

// --- Main Cognitive System Orchestrator ---

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

async function parseNarrativeWithSingleCall(context: string, gameState: GameState) {
    const masterParsingSchema = {
        type: Type.OBJECT,
        properties: {
            ...itemSchema.properties,
            ...techniqueSchema.properties,
            ...encounterSchema.properties,
            ...statChangeSchema.properties,
            ...effectSchema.properties,
            ...finalQuestSchema.properties,
            ...timeChangeSchema.properties
        }
    };

    const prompt = `You are a precision data extraction engine for a text-based RPG. Your sole function is to analyze a narrative passage and output a structured JSON object representing concrete, mechanical changes to the game state.

    **Core Directive: Present-Moment Actuality**
    Your primary directive is to distinguish between events occurring in the narrative's present moment versus non-actual events.
    - **VALID EXTRACTIONS (Present Moment):** Actions, acquisitions, and changes that are happening *now*.
      - Example: "He picks up the [Healing Potion]." -> EXTRACT Healing Potion.
      - Example: "The blow strikes him, and he feels a sharp pain." -> EXTRACT Sinh Mệnh change.
    - **INVALID EXTRACTIONS (Non-Actual Events):** You MUST IGNORE any entities mentioned in the context of:
      - **Memories / Flashbacks:** "He remembered the [Sword of Ancients] his father gave him." -> DO NOT EXTRACT.
      - **Dreams / Visions:** "In his dream, he saw a [Dragon Orb]." -> DO NOT EXTRACT.
      - **Stories / Legends:** "The old man told a story about the [Cursed Amulet]." -> DO NOT EXTRACT.
      - **Thoughts / Internal Monologues:** "He thought about the [map] he had lost." -> DO NOT EXTRACT.
      - **Hypotheticals:** "If only he had the [Sunstone], he could pass." -> DO NOT EXTRACT.

    **Processing Rules:**
    1.  Strictly analyze the provided narrative text in the context of the game state.
    2.  Extract ONLY new items, techniques, or quests. Do not re-extract entities the player already possesses.
    3.  **Translate narrative descriptions into concrete stat changes.** This is your most important task.
        - **Damage/Loss:** "bị thương nặng" -> \`{"attribute": "Sinh Mệnh", "change": -25}\`. "cảm thấy kiệt sức" -> \`{"attribute": "Linh Lực", "change": -20}\`.
        - **Healing/Recovery:** "vết thương lành lại" -> \`{"attribute": "Sinh Mệnh", "change": 20}\`. "linh lực hồi phục" -> \`{"attribute": "Linh Lực", "change": 15}\`.
        - **Vitals:** "ăn một chiếc bánh bao no bụng" -> \`{"attribute": "hunger", "change": 30}\`. "uống nước suối mát lạnh, cơn khát dịu đi" -> \`{"attribute": "thirst", "change": 40}\`. "cảm thấy đói cồn cào" -> \`{"attribute": "hunger", "change": -10}\`.
        - **Cultivation:** "hấp thụ một luồng linh khí thuần khiết" -> \`{"attribute": "spiritualQi", "change": 100}\`.
    4.  Strictly adhere to the provided JSON schema. If no valid changes occur in a category, provide an empty array or omit the key.

    ${context}

    Generate the JSON output.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.dataParsingModel;
    const response = await generateWithRetry({
        model: settings?.dataParsingModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: masterParsingSchema
        }
    }, specificApiKey);
    
    const result = JSON.parse(response.text);

    const newItems = (result.items || []).map((item: any) => ({ ...item, id: `item-${Date.now()}-${Math.random()}`, quantity: item.quantity || 1, quality: item.quality || 'Phàm Phẩm', weight: item.weight || 0.1, icon: item.icon || '📜' }));
    const newTechniques = (result.techniques || []).map((tech: any) => ({ ...tech, id: `tech-${Date.now()}-${Math.random()}`, level: 1, maxLevel: 10, effects: tech.effects || [], cost: tech.cost || { type: 'Linh Lực', value: 10 }, cooldown: tech.cooldown || 0, rank: tech.rank || 'Phàm Giai', icon: tech.icon || '📜', bonuses: tech.bonuses || [] }));
    
    const unencounteredNpcs = gameState.activeNpcs.filter(npc => !gameState.encounteredNpcIds.includes(npc.id));
    const newNpcEncounterIds = (result.npcEncounters || []).map((name: string) => {
        const npc = unencounteredNpcs.find(n => n.identity.name === name);
        return npc ? npc.id : null;
    }).filter((id: string | null): id is string => id !== null);

    const statChanges = result.statChanges || [];
    const newEffects = result.newEffects || [];
    const newQuests = result.newQuests || [];
    const timeJump = result.timeJump || null;

    return {
        newItems,
        newTechniques,
        newNpcEncounterIds,
        statChanges,
        newEffects,
        newQuests,
        timeJump
    };
}


export const parseNarrativeForGameData = async (narrative: string, gameState: GameState): Promise<{ newItems: InventoryItem[], newTechniques: CultivationTechnique[], newNpcEncounterIds: string[], statChanges: {attribute: string, change: number}[], newEffects: Omit<ActiveEffect, 'id'>[], newQuests: Partial<ActiveQuest>[], timeJump: { years?: number; seasons?: number; days?: number } | null }> => {
    console.log("Activating Cognitive Nervous System to parse narrative...");
    const context = buildContext(narrative, gameState);

    try {
        const results = await parseNarrativeWithSingleCall(context, gameState);
        console.log("Cognitive System processing complete. Aggregating results.");
        return results;
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