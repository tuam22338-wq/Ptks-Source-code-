import type { GameState, Rumor, NPC, DynamicWorldEvent, Currency, Relationship } from '../types';
import { generateFactionEvent } from './gemini/gameplay.service';
import { generateRelationshipUpdate } from './gemini/npc.service';

export const simulateWorldTurn = async (
    gameState: GameState
): Promise<{ newState: GameState; rumors: Rumor[] }> => {
    let currentTurnState = { ...gameState };
    const { activeNpcs } = currentTurnState;
    const newRumors: Rumor[] = [];

    // --- Social Relationship Simulation ---
    // Pick one NPC that has relationships defined
    const npcsWithRelationships = activeNpcs.filter(n => n.relationships && n.relationships.length > 0);
    if (npcsWithRelationships.length >= 2 && Math.random() < 0.25) { // 25% chance per day
        const npc1 = npcsWithRelationships[Math.floor(Math.random() * npcsWithRelationships.length)];
        const relToUpdate = npc1.relationships![Math.floor(Math.random() * npc1.relationships!.length)];
        const npc2 = activeNpcs.find(n => n.id === relToUpdate.targetNpcId);

        if (npc2) {
            try {
                const update = await generateRelationshipUpdate(npc1, npc2, relToUpdate, currentTurnState);

                currentTurnState.activeNpcs = currentTurnState.activeNpcs.map(npc => {
                    if (npc.id === npc1.id) {
                        const newRels = (npc.relationships || []).map(r => 
                            r.targetNpcId === npc2.id ? { ...r, description: update.newRelationshipDescription } : r
                        );
                        return { ...npc, relationships: newRels };
                    }
                    return npc;
                });

                if (update.rumorText) {
                    const rumor: Rumor = {
                        id: `rumor-${Date.now()}-${Math.random()}`,
                        locationId: Math.random() < 0.5 ? npc1.locationId : npc2.locationId,
                        text: update.rumorText,
                    };
                    newRumors.push(rumor);
                }
            } catch (error) {
                console.error(`Failed to simulate relationship between ${npc1.identity.name} and ${npc2.identity.name}:`, error);
            }
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