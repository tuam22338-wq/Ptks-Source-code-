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
    let nextState = { ...currentState };
    let pc = { ...currentState.playerCharacter };

    // --- APPLY CHANGES ---

    // IMPORTANT: Clear previous interaction states first.
    nextState.dialogueChoices = null;

    if (intent.dialogueChoices && intent.dialogueChoices.length > 0) {
        nextState.dialogueChoices = intent.dialogueChoices;
        return nextState; // Stop further processing if choices are presented.
    }
    
    // Handle Realm/Stage change from breakthrough
    if (intent.realmChange && intent.stageChange) {
        const newCultivation = {
            ...pc.cultivation,
            currentRealmId: intent.realmChange,
            currentStageId: intent.stageChange,
        };
        const newRealm = currentState.realmSystem.find(r => r.id === intent.realmChange);
        const newStage = newRealm?.stages.find(s => s.id === intent.stageChange);

        if (newRealm && newStage) {
            pc = { ...pc, cultivation: newCultivation };
            showNotification(`Đột phá thành công! Cảnh giới mới: ${newRealm.name} - ${newStage.name}`);
            
            // Apply stat bonuses from the new stage
            if (newStage.bonuses && newStage.bonuses.length > 0) {
                let newAttributes = { ...pc.attributes };
                newStage.bonuses.forEach(bonus => {
                    const attrDef = currentState.attributeSystem.definitions.find(def => def.name === bonus.attribute);
                    if (attrDef && newAttributes[attrDef.id]) {
                        const attr = newAttributes[attrDef.id];
                        attr.value += bonus.value;
                        if (attr.maxValue !== undefined) {
                            attr.maxValue += bonus.value;
                        }
                        showNotification(`Thuộc tính tăng: ${bonus.attribute} +${bonus.value}`);
                    }
                });
                pc = { ...pc, attributes: newAttributes }; // Assign updated attributes
            }
        }
    }

    if (intent.locationChange && nextState.discoveredLocations.some((l: any) => l.id === intent.locationChange)) {
        pc = { ...pc, currentLocationId: intent.locationChange };
        showNotification(`Đã đến: ${nextState.discoveredLocations.find((l:any) => l.id === pc.currentLocationId)?.name || pc.currentLocationId}`);
    }

    if (intent.currencyChanges) {
        const newCurrencies = { ...pc.currencies };
        intent.currencyChanges.forEach(change => {
            const currentAmount = newCurrencies[change.currencyName] || 0;
            newCurrencies[change.currencyName] = currentAmount + change.change;
            if (change.change !== 0) showNotification(`${change.currencyName}: ${change.change > 0 ? '+' : ''}${change.change.toLocaleString()}`);
        });
        pc = { ...pc, currencies: newCurrencies };
    }

    if (intent.itemsLost) {
        let newItems = [...pc.inventory.items];
        intent.itemsLost.forEach(itemLost => {
            const itemIndex = newItems.findIndex((i: InventoryItem) => i.name === itemLost.name);
            if (itemIndex > -1) {
                // FIX: Cast quantity to number for arithmetic
                const updatedItem = { ...newItems[itemIndex], quantity: (Number(newItems[itemIndex].quantity) || 0) - (Number(itemLost.quantity) || 0) };
                if (updatedItem.quantity > 0) {
                    newItems[itemIndex] = updatedItem;
                } else {
                    newItems.splice(itemIndex, 1);
                }
                showNotification(`Mất: [${itemLost.name} x${itemLost.quantity}]`);
            }
        });
        pc = { ...pc, inventory: { ...pc.inventory, items: newItems }};
    }

    if (intent.itemsGained) {
        let newQuests = [...pc.activeQuests];
        let newItems = [...pc.inventory.items];
        intent.itemsGained.forEach(itemData => {
            const gainedQuantity = Number(itemData.quantity || 1);
            const existingItemIndex = newItems.findIndex((i: InventoryItem) => i.name === itemData.name);
            if (existingItemIndex > -1) {
                newItems[existingItemIndex] = {
                    ...newItems[existingItemIndex],
                    // FIX: Cast quantity to number to prevent arithmetic errors
                    quantity: (Number(newItems[existingItemIndex].quantity) || 0) + gainedQuantity
                };
            } else {
                newItems.push({
                    ...itemData,
                    id: `item-${Date.now()}-${Math.random()}`,
                    quantity: gainedQuantity,
                    isEquipped: false,
                } as InventoryItem);
            }
            showNotification(`Nhận được: [${itemData.name} x${gainedQuantity}]`);

            // Update GATHER quest progress cumulatively
            newQuests = newQuests.map(quest => {
                const updatedObjectives = quest.objectives.map(obj => {
                    if (obj.type === 'GATHER' && !obj.isCompleted && obj.target === itemData.name) {
                        const newCurrent = obj.current + gainedQuantity;
                        showNotification(`Nhiệm vụ cập nhật: ${obj.description} (${Math.min(newCurrent, obj.required)}/${obj.required})`);
                        return { ...obj, current: newCurrent };
                    }
                    return obj;
                });
                return { ...quest, objectives: updatedObjectives };
            });
        });
        pc = { ...pc, inventory: { ...pc.inventory, items: newItems }, activeQuests: newQuests};
    }
    
    if (intent.newTechniques) {
        const newlyLearned = intent.newTechniques.filter(techData => !pc.techniques.some((t: CultivationTechnique) => t.name === techData.name));
        if (newlyLearned.length > 0) {
            const newTechniques = newlyLearned.map(techData => {
                 showNotification(`Lĩnh ngộ: [${techData.name}]`);
                 return {
                    ...techData,
                    id: `tech-${Date.now()}-${Math.random()}`,
                    level: 1,
                    maxLevel: 10,
                } as CultivationTechnique;
            });
            pc = { ...pc, techniques: [...pc.techniques, ...newTechniques]};
        }
    }

    if (intent.newEffects) {
        const newEffects = intent.newEffects.map(effectData => {
            showNotification(`Nhận hiệu ứng: [${effectData.name}]`);
            return {
                ...effectData,
                id: `effect-${Date.now()}-${Math.random()}`
            } as ActiveEffect;
        });
        pc = { ...pc, activeEffects: [...pc.activeEffects, ...newEffects]};
    }

    if (intent.newQuests) {
        const newQuests = intent.newQuests.map(questData => {
            const newQuestId = `quest-${Date.now()}-${Math.random()}`;
            showNotification(`Nhiệm vụ mới: ${questData.title}`);
            return {
                ...questData,
                id: newQuestId,
                source: questData.source || newQuestId,
                type: 'SIDE', // Default type for AI-generated quests
                objectives: (questData.objectives || []).map(obj => ({ ...obj, current: 0, isCompleted: false })),
            } as ActiveQuest;
        });
         pc = { ...pc, activeQuests: [...pc.activeQuests, ...newQuests] };
    }
    
    if (intent.npcEncounters) {
        const newEncounters = intent.npcEncounters.filter(npcName => {
            const npc = nextState.activeNpcs.find((n: NPC) => n.identity.name === npcName);
            return npc && !nextState.encounteredNpcIds.includes(npc.id);
        });
        if(newEncounters.length > 0) {
            const newIds = newEncounters.map(npcName => nextState.activeNpcs.find((n: NPC) => n.identity.name === npcName)!.id);
            nextState = { ...nextState, encounteredNpcIds: [...nextState.encounteredNpcIds, ...newIds] };
        }
    }
    
    if(intent.emotionChanges) {
        const newActiveNpcs = nextState.activeNpcs.map((npc: NPC) => {
            const emoChange = intent.emotionChanges!.find(ec => ec.npcName === npc.identity.name);
            if (emoChange) {
                const newEmotions = {
                    ...npc.emotions,
                    [emoChange.emotion]: Math.max(0, Math.min(100, (npc.emotions[emoChange.emotion] || 50) + emoChange.change))
                };
                const newMemory = {
                    ...npc.memory,
                    shortTerm: [...npc.memory.shortTerm, emoChange.reason].slice(-5)
                };
                return { ...npc, emotions: newEmotions, memory: newMemory };
            }
            return npc;
        });
        nextState = { ...nextState, activeNpcs: newActiveNpcs };
    }

    if (intent.systemActions) {
        // Placeholder for future system actions
    }

    if (intent.statChanges) {
        let newAttributes = { ...pc.attributes };
        let newCultivation = { ...pc.cultivation };

        const changesMap: Record<string, { change?: number; changeMax?: number }> = (intent.statChanges || []).reduce((acc, sc) => {
            acc[sc.attribute] = {
                change: (acc[sc.attribute]?.change || 0) + (sc.change || 0),
                changeMax: (acc[sc.attribute]?.changeMax || 0) + (sc.changeMax || 0),
            };
            return acc;
        }, {} as Record<string, { change?: number; changeMax?: number }>);
        
        Object.entries(changesMap).forEach(([attrId, changes]) => {
            const attrDef = nextState.attributeSystem.definitions.find((def: any) => def.id === attrId);
            if (newAttributes[attrId]) {
                const attr = { ...newAttributes[attrId] };
                
                if (changes.changeMax) {
                    attr.maxValue = Math.max(1, (attr.maxValue !== undefined ? attr.maxValue : attr.value) + changes.changeMax);
                    showNotification(`Giới hạn ${attrDef?.name || attrId} thay đổi: ${changes.changeMax > 0 ? '+' : ''}${changes.changeMax}`);
                }
                
                if (changes.change) {
                    attr.value = (attr.value || 0) + changes.change;
                    if (changes.change !== 0) showNotification(`${attrDef?.name || attrId}: ${changes.change > 0 ? '+' : ''}${changes.change}`);
                }

                if (attr.maxValue !== undefined) {
                    attr.value = Math.min(attr.value, attr.maxValue);
                }
                attr.value = Math.max(0, attr.value);

                newAttributes[attrId] = attr;

            } else if (attrId === 'spiritualQi' && changes.change) {
                 newCultivation.spiritualQi = Math.max(0, newCultivation.spiritualQi + changes.change);
                 if (changes.change !== 0) showNotification(`Linh Khí: ${changes.change > 0 ? '+' : ''}${changes.change.toLocaleString()}`);
            }
        });

        const calculatedAttributes = calculateDerivedStats(newAttributes, nextState.attributeSystem.definitions);
        pc = { ...pc, attributes: calculatedAttributes, cultivation: newCultivation };
    }
    
    // Final assignment to the new state object
    nextState.playerCharacter = pc;

    return nextState;
};