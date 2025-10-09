import type { GameState, MechanicalIntent, PlayerCharacter, InventoryItem, CultivationTechnique, ActiveEffect, ActiveQuest, NPC } from '../types';
import { calculateDerivedStats } from '../utils/statCalculator';

/**
 * Applies the validated mechanical changes to the game state.
 * This is a pure function that takes the current state and an intent object,
 * and returns the new state, following immutable update patterns.
 */
export const applyMechanicalChanges = (
    currentState: GameState,
    intent: MechanicalIntent,
    showNotification: (message: string) => void
): GameState => {
    
    // --- TRANSACTIONAL CHECK (for costs) ---
    // First, verify if all costs can be paid before applying any changes.
    let canAfford = true;
    if (intent.currencyChanges) {
        for (const change of intent.currencyChanges) {
            if (change.change < 0) {
                const currentAmount = currentState.playerCharacter.currencies[change.currencyName] || 0;
                if (currentAmount < Math.abs(change.change)) {
                    canAfford = false;
                    showNotification(`Giao dịch thất bại! Không đủ ${change.currencyName}.`);
                    break;
                }
            }
        }
    }
    if (canAfford && intent.itemsLost) {
        for (const itemLost of intent.itemsLost) {
            const itemInInventory = currentState.playerCharacter.inventory.items.find((i: InventoryItem) => i.name === itemLost.name);
            // FIX: Cast quantity to number for comparison
            if (!itemInInventory || (Number(itemInInventory.quantity) || 0) < (Number(itemLost.quantity) || 0)) {
                canAfford = false;
                showNotification(`Hành động thất bại! Không đủ ${itemLost.name}.`);
                break;
            }
        }
    }

    if (!canAfford) {
        // If any cost cannot be met, we reject the entire mechanical intent.
        showNotification("Hành động không thành công do không đủ tài nguyên.");
        return {
            ...currentState,
            // Clear dialogue choices even on failure to prevent getting stuck
            dialogueChoices: null,
        };
    }

    // If affordable, proceed with creating the new state.
    let nextState = JSON.parse(JSON.stringify(currentState));
    let pc: PlayerCharacter = nextState.playerCharacter;

    // --- APPLY CHANGES ---

    // IMPORTANT: Clear previous interaction states first.
    nextState.dialogueChoices = null;

    if (intent.dialogueChoices && intent.dialogueChoices.length > 0) {
        nextState.dialogueChoices = intent.dialogueChoices;
        return nextState; // Stop further processing if choices are presented.
    }
    
    if (intent.locationChange && nextState.discoveredLocations.some((l: any) => l.id === intent.locationChange)) {
        pc.currentLocationId = intent.locationChange;
        showNotification(`Đã đến: ${nextState.discoveredLocations.find((l:any) => l.id === pc.currentLocationId)?.name || pc.currentLocationId}`);
    }

    if (intent.currencyChanges) {
        intent.currencyChanges.forEach(change => {
            const currentAmount = Number(pc.currencies[change.currencyName]) || 0;
            pc.currencies[change.currencyName] = currentAmount + Number(change.change);
            if (change.change !== 0) showNotification(`${change.currencyName}: ${change.change > 0 ? '+' : ''}${change.change.toLocaleString()}`);
        });
    }

    if (intent.itemsLost) {
        intent.itemsLost.forEach(itemLost => {
            const itemIndex = pc.inventory.items.findIndex((i: InventoryItem) => i.name === itemLost.name);
            if (itemIndex > -1) {
                // FIX: Ensure quantity is treated as a number during arithmetic operations.
                pc.inventory.items[itemIndex].quantity = (Number(pc.inventory.items[itemIndex].quantity) || 0) - itemLost.quantity;
                if (pc.inventory.items[itemIndex].quantity <= 0) {
                    pc.inventory.items.splice(itemIndex, 1);
                }
                showNotification(`Mất: [${itemLost.name} x${itemLost.quantity}]`);
            }
        });
    }

    if (intent.itemsGained) {
        intent.itemsGained.forEach(itemData => {
            const gainedQuantity = itemData.quantity || 1;
            const existingItem = pc.inventory.items.find((i: InventoryItem) => i.name === itemData.name);
            if (existingItem) {
                // FIX: Ensure quantity is treated as a number during arithmetic operations.
                existingItem.quantity = (Number(existingItem.quantity) || 0) + gainedQuantity;
            } else {
                pc.inventory.items.push({
                    ...itemData, id: `item-${Date.now()}-${Math.random()}`, quantity: gainedQuantity, isEquipped: false,
                } as InventoryItem);
            }
            showNotification(`Nhận được: [${itemData.name} x${gainedQuantity}]`);

            pc.activeQuests.forEach(quest => {
                quest.objectives.forEach(obj => {
                    if (obj.type === 'GATHER' && !obj.isCompleted && obj.target === itemData.name) {
                        const newCurrent = obj.current + gainedQuantity;
                        showNotification(`Nhiệm vụ cập nhật: ${obj.description} (${Math.min(newCurrent, obj.required)}/${obj.required})`);
                        obj.current = newCurrent;
                    }
                });
            });
        });
    }
    
    if (intent.newTechniques) {
        intent.newTechniques.forEach(techData => {
            // FIX: Access techniques from player character
            if (!pc.techniques.some((t: CultivationTechnique) => t.name === techData.name)) {
                showNotification(`Lĩnh ngộ: [${techData.name}]`);
                // FIX: Access techniques from player character
                pc.techniques.push({
                    ...techData, id: `tech-${Date.now()}-${Math.random()}`, level: 1, maxLevel: 10,
                } as CultivationTechnique);
            }
        });
    }

    if (intent.newEffects) {
        intent.newEffects.forEach(effectData => {
            showNotification(`Nhận hiệu ứng: [${effectData.name}]`);
            pc.activeEffects.push({ ...effectData, id: `effect-${Date.now()}-${Math.random()}` } as ActiveEffect);
        });
    }

    if (intent.newQuests) {
        intent.newQuests.forEach(questData => {
            const newQuestId = `quest-${Date.now()}-${Math.random()}`;
            showNotification(`Nhiệm vụ mới: ${questData.title}`);
            pc.activeQuests.push({
                ...questData, id: newQuestId, source: questData.source || newQuestId, type: 'SIDE', objectives: (questData.objectives || []).map(obj => ({ ...obj, current: 0, isCompleted: false })),
            } as ActiveQuest);
        });
    }
    
    if(intent.emotionChanges) {
        intent.emotionChanges.forEach(emoChange => {
            const npc = nextState.activeNpcs.find((n: NPC) => n.identity.name === emoChange.npcName);
            if (npc) {
                npc.emotions[emoChange.emotion] = Math.max(0, Math.min(100, (Number(npc.emotions[emoChange.emotion]) || 50) + Number(emoChange.change)));
                npc.memory.shortTerm = [...npc.memory.shortTerm, emoChange.reason].slice(-5);
            }
        });
    }

    // --- UNIFIED ATTRIBUTE & CULTIVATION UPDATE ---
    const allStatChanges: Record<string, { change: number; changeMax: number }> = {};
    const addChange = (attrId: string, change: number, changeMax: number = 0) => {
        if (!allStatChanges[attrId]) allStatChanges[attrId] = { change: 0, changeMax: 0 };
        allStatChanges[attrId].change += Number(change) || 0;
        allStatChanges[attrId].changeMax += Number(changeMax) || 0;
    };

    (intent.statChanges || []).forEach(sc => {
        if (sc.attribute) addChange(sc.attribute, sc.change || 0, sc.changeMax || 0);
    });

    if (intent.realmChange && intent.stageChange) {
        // FIX: Access realmSystem from GameState
        const newRealm = currentState.realmSystem.find(r => r.id === intent.realmChange);
        const newStage = newRealm?.stages.find(s => s.id === intent.stageChange);
        if (newRealm && newStage) {
            // FIX: Access cultivation property
            pc.cultivation.currentRealmId = intent.realmChange;
            pc.cultivation.currentStageId = intent.stageChange;
            showNotification(`Đột phá thành công! Cảnh giới mới: ${newRealm.name} - ${newStage.name}`);
            (newStage.bonuses || []).forEach(bonus => {
                const attrDef = currentState.attributeSystem.definitions.find(def => def.name === bonus.attribute);
                if (attrDef) {
                    addChange(attrDef.id, bonus.value, bonus.value);
                    showNotification(`Thuộc tính tăng: ${bonus.attribute} +${bonus.value}`);
                }
            });
        }
    }

    Object.entries(allStatChanges).forEach(([attrId, changes]) => {
        const attrDef = nextState.attributeSystem.definitions.find((def: any) => def.id === attrId);
        if (pc.attributes[attrId]) {
            const attr = pc.attributes[attrId];
            const originalMaxValue = Number(attr.maxValue);
    
            if (changes.changeMax) {
                attr.maxValue = Math.max(1, (attr.maxValue !== undefined ? Number(attr.maxValue) : Number(attr.value)) + changes.changeMax);
                if(changes.changeMax !== 0) showNotification(`Giới hạn ${attrDef?.name || attrId} thay đổi: ${changes.changeMax > 0 ? '+' : ''}${changes.changeMax}`);
    
                // FIX: If a vital's maxValue increases, the current value should also increase to match the new max, effectively 'refilling' it.
                const isVitalThatRefills = ['sinh_menh', 'linh_luc', 'hunger', 'thirst'].includes(attrId);
                if (isVitalThatRefills && attr.maxValue > (originalMaxValue || 0)) {
                    attr.value = attr.maxValue;
                }
            }
    
            if (changes.change) {
                attr.value = Number(attr.value) + changes.change;
                if (changes.change !== 0) showNotification(`${attrDef?.name || attrId}: ${changes.change > 0 ? '+' : ''}${changes.change}`);
            }
    
            // Clamp the value to be within [0, new maxValue] after all changes.
            if (attr.maxValue !== undefined) {
                attr.value = Math.min(Number(attr.value), Number(attr.maxValue));
            }
            attr.value = Math.max(0, Number(attr.value));
            
        } else if (attrId === 'spiritualQi' && changes.change) {
             // FIX: Access cultivation property
             pc.cultivation.spiritualQi = Math.max(0, Number(pc.cultivation.spiritualQi) + changes.change);
             if (changes.change !== 0) showNotification(`Linh Khí: ${changes.change > 0 ? '+' : ''}${changes.change.toLocaleString()}`);
        }
    });
    
    pc.attributes = calculateDerivedStats(pc.attributes, nextState.attributeSystem.definitions);
    
    nextState.playerCharacter = pc;
    return nextState;
};