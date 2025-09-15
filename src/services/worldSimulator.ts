import type { GameState, NPC, Rumor } from '../types';
import { simulateNpcAction } from './geminiService';

export const simulateWorldTurn = async (
    gameState: GameState
): Promise<{ newState: GameState; rumors: Rumor[] }> => {
    const { activeNpcs, playerCharacter } = gameState;
    const newRumors: Rumor[] = [];

    // Select a subset of NPCs to simulate to save on API calls and time
    // We only simulate NPCs who are not in the same location as the player
    const npcsToSimulate = activeNpcs
        .filter(npc => npc.locationId !== playerCharacter.currentLocationId)
        .sort(() => 0.5 - Math.random()) // Shuffle
        .slice(0, Math.ceil(activeNpcs.length * 0.1)); // Simulate 10% of NPCs

    if (npcsToSimulate.length === 0) {
        return { newState: gameState, rumors: [] };
    }

    console.log(`Simulating turn for ${npcsToSimulate.length} NPCs...`);

    const simulationPromises = npcsToSimulate.map(npc => 
        simulateNpcAction(npc, gameState)
            .catch(err => {
                console.error(`Failed to simulate action for NPC ${npc.identity.name}:`, err);
                return { updatedNpc: npc, rumor: null }; // Return original NPC on error
            })
    );

    const results = await Promise.all(simulationPromises);

    const updatedNpcsMap = new Map<string, NPC>(activeNpcs.map(n => [n.id, n]));
    
    results.forEach(({ updatedNpc, rumor }) => {
        if (updatedNpc) {
            updatedNpcsMap.set(updatedNpc.id, updatedNpc);
        }
        if (rumor) {
            newRumors.push(rumor);
        }
    });

    const finalNpcs = Array.from(updatedNpcsMap.values());
    
    // Add new rumors to world state, maybe prune old ones later
    const newWorldState = {
        ...gameState.worldState,
        rumors: [...gameState.worldState.rumors, ...newRumors],
    };

    return {
        newState: {
            ...gameState,
            activeNpcs: finalNpcs,
            worldState: newWorldState,
        },
        rumors: newRumors,
    };
};