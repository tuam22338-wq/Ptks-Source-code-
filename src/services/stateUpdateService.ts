

import type { GameState, MechanicalIntent, PlayerCharacter, InventoryItem, CultivationTechnique, ActiveEffect, ActiveQuest } from '../types';
import { calculateDerivedStats } from '../utils/statCalculator';

/**
 * Applies the validated mechanical changes to the game state.
 * This is a pure function that takes the current state and an intent object,
 * and returns the new state.
 */
export const applyMechanicalChanges = (
    currentState: GameState,
    intent: MechanicalIntent,
    showNotification: (message: string) => void
): GameState => {
    let finalState = JSON.parse(JSON.stringify(currentState));
    let pc = finalState.playerCharacter;

    if (intent.locationChange && finalState.discoveredLocations.some(l => l.id === intent.locationChange)) {
        pc.currentLocationId = intent.locationChange;
        showNotification(`Đã đến: ${finalState.discoveredLocations.find(l => l.id === pc.currentLocationId)?.name || pc.currentLocationId}`);
    }

    if (intent.itemsGained) {
        intent.itemsGained.forEach(itemData => {
            // FIX: Cast itemData to any to resolve incorrect type inference.
            const existingItem = pc.inventory.items.find(i => i.name === (itemData as any).name);
            if (existingItem) {
                existingItem.quantity += (itemData.quantity || 1);
            } else {
                pc.inventory.items.push({
                    ...itemData,
                    id: `item-${Date.now()}-${Math.random()}`,
                    quantity: itemData.quantity || 1,
                    isEquipped: false,
                } as InventoryItem);
            }
            // FIX: Cast itemData to any to resolve incorrect type inference.
            showNotification(`Nhận được: [${(itemData as any).name} x${itemData.quantity || 1}]`);
        });
    }

    if (intent.statChanges) {
        const changesMap: Record<string, number> = intent.statChanges.reduce((acc, sc) => ({ ...acc, [sc.attribute]: (acc[sc.attribute] || 0) + sc.change }), {});
        
        Object.entries(changesMap).forEach(([attrId, change]) => {
            const attrDef = finalState.attributeSystem.definitions.find(def => def.id === attrId);
            if (pc.attributes[attrId]) {
                const attr = pc.attributes[attrId];
                attr.value = (attr.value || 0) + change;
                if (attr.maxValue !== undefined) {
                    attr.value = Math.min(attr.value, attr.maxValue);
                }
                showNotification(`${attrDef?.name || attrId}: ${change > 0 ? '+' : ''}${change}`);
            } else if (attrId === 'spiritualQi') {
                 pc.cultivation.spiritualQi = Math.max(0, pc.cultivation.spiritualQi + change);
                 showNotification(`Linh Khí: ${change > 0 ? '+' : ''}${change}`);
            } // ... handle other vitals like hunger, thirst
        });
    }

    // Recalculate derived stats after all primary stats have been changed.
    pc.attributes = calculateDerivedStats(pc.attributes, finalState.attributeSystem.definitions);
    
    finalState.playerCharacter = pc;
    // ... logic for other intents like new quests, effects, etc.

    return finalState;
};
