
import type { GameState, Rumor, NPC, DynamicWorldEvent, Currency, Relationship, StatBonus, CharacterAttributes } from '../types';
import { generateFactionEvent } from './gemini/gameplay.service';
import { generateRelationshipUpdate } from './gemini/npc.service';
import { generateNpcActionPlan } from './gemini/planning.service';
import { REALM_SYSTEM, DEFAULT_ATTRIBUTE_DEFINITIONS } from '../constants';

const SIMULATED_NPCS_PER_TURN = 3; // Limit API calls

const applyBonuses = (attributes: CharacterAttributes, bonuses: StatBonus[]): CharacterAttributes => {
    const newAttributes = JSON.parse(JSON.stringify(attributes));
    const nameToIdMap = new Map<string, string>();
    DEFAULT_ATTRIBUTE_DEFINITIONS.forEach(def => nameToIdMap.set(def.name, def.id));
    
    bonuses.forEach(bonus => {
        const attributeId = nameToIdMap.get(bonus.attribute);
        if (attributeId && newAttributes[attributeId]) {
            newAttributes[attributeId].value += bonus.value;
            if (newAttributes[attributeId].maxValue !== undefined) {
                const newMaxValue = newAttributes[attributeId].maxValue + bonus.value;
                newAttributes[attributeId].maxValue = newMaxValue;
                 if (['sinh_menh', 'linh_luc'].includes(attributeId)) {
                    newAttributes[attributeId].value = newMaxValue;
                }
            }
        }
    });
    return newAttributes;
};

export const simulateWorldTurn = async (
    gameState: GameState
): Promise<{ newState: GameState; rumors: Rumor[] }> => {
    let currentTurnState = { ...gameState };
    let { activeNpcs, realmSystem } = currentTurnState;
    const newRumors: Rumor[] = [];

    // --- Pillar 2: NPC Goal & Planning Simulation ---
    const npcsToSimulatePlan = activeNpcs
        .filter(n => (!n.currentPlan || n.currentPlan.length === 0) && n.goals.length > 0) // Only idle NPCs with goals
        .sort(() => 0.5 - Math.random())
        .slice(0, SIMULATED_NPCS_PER_TURN);

    for (const npc of npcsToSimulatePlan) {
        const npcIndex = currentTurnState.activeNpcs.findIndex(n => n.id === npc.id);
        if (npcIndex === -1) continue;

        try {
            console.log(`[WorldSim] Generating plan for idle NPC: ${npc.identity.name}`);
            const newPlan = await generateNpcActionPlan(npc, currentTurnState);
            if (newPlan && newPlan.length > 0) {
                const npcToUpdate = { ...currentTurnState.activeNpcs[npcIndex] };
                npcToUpdate.currentPlan = newPlan;
                npcToUpdate.status = `Đang có ý định: ${newPlan[0]}`;
                currentTurnState.activeNpcs[npcIndex] = npcToUpdate;

                const rumor: Rumor = {
                    id: `rumor-plan-${Date.now()}-${npc.id}`,
                    locationId: npc.locationId,
                    text: `Nghe nói ${npc.identity.name} dạo này có vẻ đang bận rộn với kế hoạch nào đó.`,
                };
                newRumors.push(rumor);
            }
        } catch (error) {
            console.error(`[WorldSim] Failed to generate plan for ${npc.identity.name}:`, error);
        }
    }
    
    const newWorldState = {
        ...currentTurnState.worldState,
        rumors: [...currentTurnState.worldState.rumors, ...newRumors.filter(nr => !currentTurnState.worldState.rumors.some(r => r.text === nr.text))],
    };

    return {
        newState: {
            ...currentTurnState,
            worldState: newWorldState,
        },
        rumors: newRumors,
    };
};


export const simulateFactionTurn = async (
    gameState: GameState
): Promise<{ newEvent: DynamicWorldEvent | null, narrative: string | null }> => {
    try {
        const eventData = await generateFactionEvent(gameState);
        if (!eventData) {
            return { newEvent: null, narrative: null };
        }
        
        const totalDays = (gameState.gameDate.year * 4 * 30) + (['Xuân', 'Hạ', 'Thu', 'Đông'].indexOf(gameState.gameDate.season) * 30) + gameState.gameDate.day;

        const newEvent: DynamicWorldEvent = {
            ...eventData,
            id: `world-event-${Date.now()}`,
            turnStart: totalDays,
        };

        const narrative = `[Thiên Hạ Đại Sự] ${eventData.title}: ${eventData.description}`;
        return { newEvent, narrative };

    } catch (error) {
        console.error("Failed to simulate faction turn:", error);
        return { newEvent: null, narrative: "Thiên cơ hỗn loạn, không thể suy diễn được đại sự trong thiên hạ." };
    }
};