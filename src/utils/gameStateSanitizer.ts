import type { GameState, PlayerCharacter, NPC, InventoryItem, CharacterAttributes } from '../types';

// Ensures numeric properties of an item are numbers.
const sanitizeInventoryItem = (item: InventoryItem): InventoryItem => {
    if (item) {
        item.quantity = Number(item.quantity) || 0;
        item.weight = Number(item.weight) || 0;
        item.value = Number(item.value) || 0;
        if (item.bonuses) {
            item.bonuses.forEach(bonus => {
                bonus.value = Number(bonus.value) || 0;
            });
        }
    }
    return item;
};

// Ensures numeric properties of attributes are numbers.
const sanitizeCharacterAttributes = (attributes: CharacterAttributes): CharacterAttributes => {
    if (attributes) {
        for (const key in attributes) {
            const attr = attributes[key];
            attr.value = Number(attr.value) || 0;
            if (attr.maxValue !== undefined) {
                attr.maxValue = Number(attr.maxValue) || 0;
            }
        }
    }
    return attributes;
};

// Sanitizes a full PlayerCharacter object.
const sanitizePlayerCharacter = (pc: PlayerCharacter): PlayerCharacter => {
    if (!pc) return pc;

    pc.attributes = sanitizeCharacterAttributes(pc.attributes);
    if (pc.inventory) {
        pc.inventory.weightCapacity = Number(pc.inventory.weightCapacity) || 0;
        if (pc.inventory.items) {
            pc.inventory.items.forEach(sanitizeInventoryItem);
        }
    }
    if (pc.equipment) {
        for (const slot in pc.equipment) {
            const item = pc.equipment[slot as keyof typeof pc.equipment];
            if (item) {
                sanitizeInventoryItem(item);
            }
        }
    }
    if (pc.currencies) {
        for (const key in pc.currencies) {
            pc.currencies[key as keyof typeof pc.currencies] = Number(pc.currencies[key as keyof typeof pc.currencies]) || 0;
        }
    }
    if (pc.progression) {
        pc.progression.progressionResource = Number(pc.progression.progressionResource) || 0;
    }

    return pc;
};

// Sanitizes a full NPC object.
const sanitizeNpc = (npc: NPC): NPC => {
    if (!npc) return npc;
    
    npc.attributes = sanitizeCharacterAttributes(npc.attributes);
    if (npc.inventory) {
        npc.inventory.weightCapacity = Number(npc.inventory.weightCapacity) || 0;
        if (npc.inventory.items) {
            npc.inventory.items.forEach(sanitizeInventoryItem);
        }
    }
    if (npc.equipment) {
        for (const slot in npc.equipment) {
            const item = npc.equipment[slot as keyof typeof npc.equipment];
            if (item) {
                sanitizeInventoryItem(item);
            }
        }
    }
    if (npc.currencies) {
        for (const key in npc.currencies) {
            npc.currencies[key as keyof typeof npc.currencies] = Number(npc.currencies[key as keyof typeof npc.currencies]) || 0;
        }
    }
     if (npc.progression) {
        npc.progression.progressionResource = Number(npc.progression.progressionResource) || 0;
    }

    return npc;
}


/**
 * The main sanitizer function. It takes a GameState object and ensures all
 * critical numeric fields are correctly typed as numbers. This prevents
 * runtime errors from data type corruption (e.g., from JSON serialization).
 * This acts as a "Heavenly Dao Filter" to maintain data integrity.
 * @param gameState The game state object to sanitize.
 * @returns The sanitized game state object.
 */
export const sanitizeGameState = (gameState: GameState): GameState => {
    if (!gameState) {
        return gameState;
    }

    // Sanitize Player Character
    if (gameState.playerCharacter) {
        gameState.playerCharacter = sanitizePlayerCharacter(gameState.playerCharacter);
    }
    
    // Sanitize all active NPCs
    if (gameState.activeNpcs) {
        gameState.activeNpcs.forEach(sanitizeNpc);
    }

    // Add any other top-level state sanitization here if needed.

    return gameState;
};
