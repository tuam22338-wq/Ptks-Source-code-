import type { EntityReference, GameState, MemoryFragment, StoryEntry, GraphEdge } from '../types';
import * as db from './dbService';
import * as gameplayService from './gemini/gameplay.service';


/**
 * Extracts relevant entities from a piece of narrative content.
 */
export const extractEntities = (content: string, gameState: GameState): EntityReference[] => {
    const entities = new Map<string, EntityReference>();

    // Always add player
    entities.set('player', { id: 'player', type: 'player', name: gameState.playerCharacter.identity.name });
    
    // Always add current location
    const currentLocation = gameState.discoveredLocations.find(l => l.id === gameState.playerCharacter.currentLocationId);
    if(currentLocation) {
        entities.set(currentLocation.id, {
            id: currentLocation.id,
            type: 'location',
            name: currentLocation.name
        });
    }

    // Match items/techniques in brackets: [Item Name]
    const bracketMatches = content.match(/\[(.*?)\]/g);
    if (bracketMatches) {
        bracketMatches.forEach(match => {
            const name = match.substring(1, match.length - 1);
            const item = gameState.playerCharacter.inventory.items.find(i => i.name === name);
            if (item && !entities.has(item.id)) {
                entities.set(item.id, { id: item.id, type: 'item', name: item.name });
                return;
            }
            const tech = gameState.playerCharacter.techniques.find(t => t.name === name);
            if (tech && !entities.has(tech.id)) {
                entities.set(tech.id, { id: tech.id, type: 'technique', name: tech.name });
            }
        });
    }

    // Match NPCs by name
    gameState.activeNpcs.forEach(npc => {
        if (content.includes(npc.identity.name) && !entities.has(npc.id)) {
            entities.set(npc.id, { id: npc.id, type: 'npc', name: npc.identity.name });
        }
    });
    
    // Match active quests by title
    gameState.playerCharacter.activeQuests.forEach(quest => {
        if (content.includes(quest.title) && !entities.has(quest.id)) {
            entities.set(quest.id, { id: quest.id, type: 'quest', name: quest.title });
        }
    });

    return Array.from(entities.values());
};


/**
 * Creates a MemoryFragment from a StoryEntry and saves it to the database.
 * @returns The ID of the newly created memory fragment.
 */
export const addEntryToMemory = async (entry: StoryEntry, gameState: GameState, slotId: number): Promise<number> => {
    if (!entry.content) {
        throw new Error("Cannot save an empty memory fragment.");
    }

    const entities = extractEntities(entry.content, gameState);

    const fragment: MemoryFragment = {
        slotId,
        gameDate: { ...gameState.gameDate }, // Create a copy
        type: entry.type,
        content: entry.content,
        entities,
    };

    try {
        const fragmentId = await db.saveMemoryFragment(fragment);
        return fragmentId;
    } catch (error) {
        console.error("Failed to save memory fragment:", error, fragment);
        throw error;
    }
};

/**
 * Saves a batch of graph edges to the database.
 */
export const saveGraphEdges = async (edges: GraphEdge[]): Promise<void> => {
    if (edges.length === 0) return;
    try {
        await db.db.graphEdges.bulkAdd(edges);
    } catch (error) {
        console.error("Failed to save graph edges:", error, edges);
    }
};

// --- PHASE 3: WORKING MEMORY ---

/**
 * A simplified entity extractor for raw player input text.
 */
export const extractEntitiesFromText = (text: string, gameState: GameState): EntityReference[] => {
    const entities = new Map<string, EntityReference>();
    
    // Check for NPCs, locations, items, etc., by name
    const allKnownEntities = [
        ...gameState.activeNpcs.map(e => ({ id: e.id, name: e.identity.name, type: 'npc' as const })),
        ...gameState.discoveredLocations.map(e => ({ id: e.id, name: e.name, type: 'location' as const })),
        ...gameState.playerCharacter.inventory.items.map(e => ({ id: e.id, name: e.name, type: 'item' as const })),
        ...gameState.playerCharacter.techniques.map(e => ({ id: e.id, name: e.name, type: 'technique' as const })),
    ];
    
    for (const entity of allKnownEntities) {
        if (text.includes(entity.name) && !entities.has(entity.id)) {
            entities.set(entity.id, { id: entity.id, type: entity.type, name: entity.name });
        }
    }

    return Array.from(entities.values());
};


/**
 * Orchestrates the retrieval and synthesis of relevant memories for the AI narrator.
 * @returns A concise string report of relevant memories, or an empty string if none are found.
 */
export const retrieveAndSynthesizeMemory = async (
    playerAction: string,
    gameState: GameState,
    slotId: number
): Promise<string> => {
    // 1. Extract entities from the player's intended action
    const entities = extractEntitiesFromText(playerAction, gameState);
    const entityIds = entities.map(e => e.id);

    if (entityIds.length === 0) {
        return ''; // No relevant entities, no need to query memory
    }
    
    // 2. Retrieve relevant memory fragments from the database
    const memories = await db.getRelevantMemories(slotId, entityIds);

    if (memories.length === 0) {
        return ''; // No memories found for these entities
    }

    // 3. Use an AI to synthesize these memories into a concise report for the main narrator
    try {
        const memoryReport = await gameplayService.synthesizeMemoriesForPrompt(
            memories,
            playerAction,
            gameState.playerCharacter.identity.name
        );
        return memoryReport;
    } catch (error) {
        console.error("Failed to synthesize memories:", error);
        // Fallback: return a simple list of the latest memory content
        return `Ký ức gần nhất: ${memories[0].content}`;
    }
};
