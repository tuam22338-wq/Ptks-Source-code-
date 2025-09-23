import type { GameState, MechanicalIntent, PlayerCharacter, InventoryItem, CultivationTechnique, ActiveEffect, ActiveQuest, NPC } from '../types';
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
    if (intent.itemsLost) {
        for (const itemLost of intent.itemsLost) {
            const itemInInventory = pc.inventory.items.find((i: InventoryItem) => i.name === itemLost.name);
            if (!itemInInventory || itemInInventory.quantity < itemLost.quantity) {
                canAfford = false;
                showNotification(`Hành động thất bại! Không đủ ${itemLost.name}.`);
                break;
            }
        }
    }

    if (!canAfford) {
        // If any cost cannot be met, we reject the entire mechanical intent.
        showNotification("Hành động không thành công do không đủ tài nguyên.");
        return finalState;
    }


    // --- APPLY CHANGES (if affordable) ---
    
    if (intent.dialogueChoices && intent.dialogueChoices.length > 0) {
        finalState.dialogueChoices = intent.dialogueChoices;
        return finalState;
    }
    
    if (intent.locationChange && finalState.discoveredLocations.some((l: any) => l.id === intent.locationChange)) {
        pc.currentLocationId = intent.locationChange;
        showNotification(`Đã đến: ${finalState.discoveredLocations.find((l:any) => l.id === pc.currentLocationId)?.name || pc.currentLocationId}`);
    }

    if (intent.currencyChanges) {
        intent.currencyChanges.forEach(change => {
            const currentAmount = pc.currencies[change.currencyName] || 0;
            pc.currencies[change.currencyName] = currentAmount + change.change;
            if (change.change !== 0) showNotification(`${change.currencyName}: ${change.change > 0 ? '+' : ''}${change.change.toLocaleString()}`);
        });
    }

    if (intent.itemsLost) {
        intent.itemsLost.forEach(itemLost => {
            const itemIndex = pc.inventory.items.findIndex((i: InventoryItem) => i.name === itemLost.name);
            if (itemIndex > -1) {
                const item = pc.inventory.items[itemIndex];
                item.quantity -= itemLost.quantity;
                if (item.quantity <= 0) {
                    pc.inventory.items.splice(itemIndex, 1);
                }
                showNotification(`Mất: [${itemLost.name} x${itemLost.quantity}]`);
            }
        });
    }

    if (intent.itemsGained) {
        intent.itemsGained.forEach(itemData => {
            const existingItem = pc.inventory.items.find((i: InventoryItem) => i.name === itemData.name);
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
            showNotification(`Nhận được: [${itemData.name} x${itemData.quantity || 1}]`);
        });
    }
    
    if (intent.newTechniques) {
        intent.newTechniques.forEach(techData => {
            if (!pc.techniques.some((t: CultivationTechnique) => t.name === techData.name)) {
                pc.techniques.push({
                    ...techData,
                    id: `tech-${Date.now()}-${Math.random()}`,
                    level: 1,
                    maxLevel: 10,
                } as CultivationTechnique);
                showNotification(`Lĩnh ngộ: [${techData.name}]`);
            }
        });
    }

    if (intent.newEffects) {
        intent.newEffects.forEach(effectData => {
            pc.activeEffects.push({
                ...effectData,
                id: `effect-${Date.now()}-${Math.random()}`
            } as ActiveEffect);
            showNotification(`Nhận hiệu ứng: [${effectData.name}]`);
        });
    }

    if (intent.newQuests) {
        intent.newQuests.forEach(questData => {
            const newQuestId = `quest-${Date.now()}-${Math.random()}`;
            pc.activeQuests.push({
                ...questData,
                id: newQuestId,
                source: questData.source || newQuestId,
                type: 'SIDE', // Default type for AI-generated quests
                objectives: (questData.objectives || []).map(obj => ({ ...obj, current: 0, isCompleted: false })),
            } as ActiveQuest);
             showNotification(`Nhiệm vụ mới: ${questData.title}`);
        });
    }
    
    if (intent.npcEncounters) {
        intent.npcEncounters.forEach(npcName => {
            const npc = finalState.activeNpcs.find((n: NPC) => n.identity.name === npcName);
            if (npc && !pc.encounteredNpcIds.includes(npc.id)) {
                pc.encounteredNpcIds.push(npc.id);
            }
        });
    }
    
    if(intent.emotionChanges) {
        intent.emotionChanges.forEach(emoChange => {
            const npc = finalState.activeNpcs.find((n: NPC) => n.identity.name === emoChange.npcName);
            if (npc) {
                npc.emotions[emoChange.emotion] = Math.max(0, Math.min(100, (npc.emotions[emoChange.emotion] || 50) + emoChange.change));
                npc.memory.shortTerm.push(emoChange.reason);
                if (npc.memory.shortTerm.length > 5) npc.memory.shortTerm.shift();
            }
        });
    }

    // This is more complex, might need more logic
    if (intent.systemActions) {
        // Placeholder for future system actions
    }

    if (intent.statChanges) {
        const changesMap: Record<string, number> = intent.statChanges.reduce((acc, sc) => ({ ...acc, [sc.attribute]: (acc[sc.attribute] || 0) + sc.change }), {});
        
        Object.entries(changesMap).forEach(([attrId, change]) => {
            const attrDef = finalState.attributeSystem.definitions.find((def: any) => def.id === attrId);
            if (pc.attributes[attrId]) {
                const attr = pc.attributes[attrId];
                attr.value = (attr.value || 0) + change;
                if (attr.maxValue !== undefined) {
                    attr.value = Math.min(attr.value, attr.maxValue);
                }
                if (change !== 0) showNotification(`${attrDef?.name || attrId}: ${change > 0 ? '+' : ''}${change}`);
            } else if (attrId === 'spiritualQi') {
                 pc.cultivation.spiritualQi = Math.max(0, pc.cultivation.spiritualQi + change);
                 if (change !== 0) showNotification(`Linh Khí: ${change > 0 ? '+' : ''}${change.toLocaleString()}`);
            }
        });
    }

    pc.attributes = calculateDerivedStats(pc.attributes, finalState.attributeSystem.definitions);
    
    finalState.playerCharacter = pc;

    return finalState;
};
