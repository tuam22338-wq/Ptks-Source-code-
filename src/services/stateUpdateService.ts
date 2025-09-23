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

    // Always clear previous interaction states before applying new ones.
    finalState.dialogueChoices = null;

    // --- TRANSACTIONAL CHECK (for costs) ---
    // First, verify if all costs can be paid before applying any changes.
    let canAfford = true;
    if (intent.currencyChanges) {
        for (const change of intent.currencyChanges) {
            if (change.change < 0) {
                const currentAmount = pc.currencies[change.currencyName] || 0;
                if (currentAmount < Math.abs(change.change)) {
                    canAfford = false;
                    showNotification(`Giao dịch thất bại! Không đủ ${change.currencyName}.`);
                    break;
                }
            }
        }
    }
    // More checks for itemsLost etc. can be added here.

    if (!canAfford) {
        // If any cost cannot be met, we reject the entire mechanical intent.
        // The narrative will still proceed, but the player gets no items/stats.
        showNotification("Hành động không thành công do không đủ tài nguyên.");
        // Return the state but with the choices cleared to avoid getting stuck.
        return finalState;
    }


    // --- APPLY CHANGES (if affordable) ---
    
    // Handle interaction states first, as they are mutually exclusive
    if (intent.dialogueChoices && intent.dialogueChoices.length > 0) {
        finalState.dialogueChoices = intent.dialogueChoices;
        return finalState; // Halt further processing until choice is made
    }
    
    if (intent.locationChange && finalState.discoveredLocations.some(l => l.id === intent.locationChange)) {
        pc.currentLocationId = intent.locationChange;
        showNotification(`Đã đến: ${finalState.discoveredLocations.find(l => l.id === pc.currentLocationId)?.name || pc.currentLocationId}`);
    }

    if (intent.currencyChanges) {
        intent.currencyChanges.forEach(change => {
            const currentAmount = pc.currencies[change.currencyName] || 0;
            pc.currencies[change.currencyName] = currentAmount + change.change;
            showNotification(`${change.currencyName}: ${change.change > 0 ? '+' : ''}${change.change.toLocaleString()}`);
        });
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
                 showNotification(`Linh Khí: ${change > 0 ? '+' : ''}${change.toLocaleString()}`);
            } // ... handle other vitals like hunger, thirst
        });
    }

    // Recalculate derived stats after all primary stats have been changed.
    pc.attributes = calculateDerivedStats(pc.attributes, finalState.attributeSystem.definitions);
    
    finalState.playerCharacter = pc;
    // ... logic for other intents like new quests, effects, etc.

    return finalState;
};
