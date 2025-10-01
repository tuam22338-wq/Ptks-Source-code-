
import type { GameState, Rumor, NPC, DynamicWorldEvent, Currency, Relationship, StatBonus, CharacterAttributes } from '../types';
import { generateRelationshipUpdate } from './gemini/npc.service';
import { generateNpcActionPlan } from './gemini/planning.service';
import { generateDynamicWorldEventFromAI } from './gemini/faction.service';
import { REALM_SYSTEM, DEFAULT_ATTRIBUTE_DEFINITIONS } from '../constants';
import * as db from './dbService';

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
    let currentTurnState = JSON.parse(JSON.stringify(gameState)); // Deep copy to avoid mutation issues
    let { activeNpcs, realmSystem } = currentTurnState;
    const newRumors: Rumor[] = [];

    // --- Pillar 2: NPC Goal & Planning Simulation ---
    const npcsToSimulatePlan = activeNpcs
        .filter((n: NPC) => (!n.currentPlan || n.currentPlan.length === 0) && n.goals.length > 0) // Only idle NPCs with goals
        .sort(() => 0.5 - Math.random())
        .slice(0, SIMULATED_NPCS_PER_TURN);

    for (const npc of npcsToSimulatePlan) {
        const npcIndex = currentTurnState.activeNpcs.findIndex((n: NPC) => n.id === npc.id);
        if (npcIndex === -1) continue;

        try {
            console.log(`[WorldSim] Generating plan for idle NPC: ${npc.identity.name}`);
            const newPlan = await generateNpcActionPlan(npc, currentTurnState);
            if (newPlan && newPlan.length > 0) {
                const npcToUpdate = currentTurnState.activeNpcs[npcIndex];
                npcToUpdate.currentPlan = newPlan;
                npcToUpdate.status = `Đang có ý định: ${newPlan[0]}`;
                
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

    // --- Pillar 3: Faction Ambition Simulation ---
    // FIX: Access worldEventFrequency from gameState's gameplaySettings, not global settings.
    const eventFrequency = gameState.gameplaySettings.worldEventFrequency || 'occasional';
    const eventChanceMap = {
        'rare': 0.10,
        'occasional': 0.25,
        'frequent': 0.50,
        'chaotic': 0.80
    };
    const chance = eventChanceMap[eventFrequency as keyof typeof eventChanceMap];

    if (Math.random() < chance) {
        console.log(`[WorldSim] Triggering faction event simulation (Chance: ${chance * 100}%)`);
        try {
            const eventData = await generateDynamicWorldEventFromAI(currentTurnState);
            if (eventData) {
                const totalDays = (currentTurnState.gameDate.year * 4 * 30) + (['Xuân', 'Hạ', 'Thu', 'Đông'].indexOf(currentTurnState.gameDate.season) * 30) + currentTurnState.gameDate.day;
                const newEvent: DynamicWorldEvent = {
                    ...eventData,
                    id: `world-event-${Date.now()}`,
                    turnStart: totalDays,
                };
                
                if (!currentTurnState.worldState.dynamicEvents) {
                    currentTurnState.worldState.dynamicEvents = [];
                }
                currentTurnState.worldState.dynamicEvents.push(newEvent);

                const rumor: Rumor = {
                    id: `rumor-event-${Date.now()}-${newEvent.id}`,
                    locationId: newEvent.affectedLocationIds[0] || currentTurnState.playerCharacter.currentLocationId,
                    text: `[Thiên Hạ Đại Sự] ${eventData.title}: ${eventData.description}`,
                };
                newRumors.push(rumor);
                console.log(`[WorldSim] New world event created: ${newEvent.title}`);
            }
        } catch (error) {
            console.error("[WorldSim] Failed to simulate faction turn:", error);
            // Don't crash the game, just log the error.
        }
    }
    
    const newWorldState = {
        ...currentTurnState.worldState,
        rumors: [...currentTurnState.worldState.rumors, ...newRumors.filter((nr: Rumor) => !currentTurnState.worldState.rumors.some((r: Rumor) => r.text === nr.text))],
        dynamicEvents: currentTurnState.worldState.dynamicEvents || [], // ensure it exists
        foreshadowedEvents: currentTurnState.worldState.foreshadowedEvents || [], // ensure it exists
    };

    return {
        newState: {
            ...currentTurnState,
            worldState: newWorldState,
        },
        rumors: newRumors,
    };
};
