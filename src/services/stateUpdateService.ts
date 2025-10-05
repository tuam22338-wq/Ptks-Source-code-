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
            const changeAmount = Number(change.change) || 0;
            if (changeAmount < 0) {
                const currentAmount = currentState.playerCharacter.currencies[change.currencyName] || 0;
                if (currentAmount < Math.abs(changeAmount)) {
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
            if (!itemInInventory || (Number(itemInInventory.quantity) || 0) < (Number(itemLost.quantity) || 0)) {
                canAfford = false;
                showNotification(`Hành động thất bại! Không đủ ${itemLost.name}.`);
                break;
            }
        }
    }

    if (!canAfford) {
        showNotification("Hành động không thành công do không đủ tài nguyên.");
        return { ...currentState, dialogueChoices: null };
    }

    // --- APPLY CHANGES (Immutable Pattern) ---
    let nextState = JSON.parse(JSON.stringify(currentState));
    let pc: PlayerCharacter = nextState.playerCharacter;

    // Clear previous interaction states first.
    nextState.dialogueChoices = null;
    
    // Handle dialogue state changes first
    if (intent.dialogueState) {
        if (intent.dialogueState.status === 'START' && intent.dialogueState.npcName) {
            const targetNpc = nextState.activeNpcs.find((n: NPC) => n.identity.name === intent.dialogueState.npcName);
            if (targetNpc) {
                nextState.dialogueWithNpcId = targetNpc.id;
                nextState.dialogueHistory = []; // Start fresh history
                showNotification(`Bắt đầu trò chuyện với ${targetNpc.identity.name}.`);
            }
        } else if (intent.dialogueState.status === 'END') {
            if (nextState.dialogueWithNpcId) {
                nextState.dialogueWithNpcId = null;
                nextState.dialogueHistory = [];
                showNotification("Kết thúc cuộc trò chuyện.");
            }
        }
    }

    if (intent.locationChange && nextState.discoveredLocations.some((l: any) => l.id === intent.locationChange)) {
        pc.currentLocationId = intent.locationChange;
        showNotification(`Đã đến: ${nextState.discoveredLocations.find((l:any) => l.id === pc.currentLocationId)?.name || pc.currentLocationId}`);
    }

    if (intent.currencyChanges) {
        intent.currencyChanges.forEach(change => {
            const changeAmount = Number(change.change) || 0;
            if (changeAmount === 0) return;
            const currentAmount = Number(pc.currencies[change.currencyName]) || 0;
            pc.currencies[change.currencyName] = currentAmount + changeAmount;
            showNotification(`${change.currencyName}: ${changeAmount > 0 ? '+' : ''}${changeAmount.toLocaleString()}`);
        });
    }

    if (intent.itemsLost) {
        intent.itemsLost.forEach(itemLost => {
            const itemIndex = pc.inventory.items.findIndex((i: InventoryItem) => i.name === itemLost.name);
            if (itemIndex > -1) {
                // FIX: Make quantity math safer by ensuring both operands are numbers.
                pc.inventory.items[itemIndex].quantity = (Number(pc.inventory.items[itemIndex].quantity) || 0) - (Number(itemLost.quantity) || 0);
                if (pc.inventory.items[itemIndex].quantity <= 0) {
                    pc.inventory.items.splice(itemIndex, 1);
                }
                showNotification(`Mất: [${itemLost.name} x${itemLost.quantity}]`);
            }
        });
    }

    if (intent.itemsGained) {
        intent.itemsGained.forEach(itemData => {
            const gainedQuantity = Number(itemData.quantity) || 1;
            const existingItem = pc.inventory.items.find((i: InventoryItem) => i.name === itemData.name);
            if (existingItem) {
                // FIX: Make quantity math safer by ensuring both operands are numbers.
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

    if (intent.knownRecipeIdsGained) {
        intent.knownRecipeIdsGained.forEach(recipeId => {
            if (!pc.knownRecipeIds.includes(recipeId)) {
                pc.knownRecipeIds.push(recipeId);
                showNotification(`Đã học được công thức mới!`);
            }
        });
    }
    
    if (intent.newTechniques) {
        intent.newTechniques.forEach(techData => {
            if (!pc.techniques.some((t: CultivationTechnique) => t.name === techData.name)) {
                showNotification(`Lĩnh ngộ: [${techData.name}]`);
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

    if (intent.newNpcsCreated) {
        intent.newNpcsCreated.forEach(npcData => {
            if (!nextState.activeNpcs.some((n: NPC) => n.identity.name === npcData.identity.name)) {
                const newNpc: NPC = {
                    ...npcData,
                    id: `npc-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    locationId: pc.currentLocationId, // Assume they appear where the player is
                    emotions: { trust: 50, fear: 10, anger: 10 },
                    memory: { shortTerm: [], longTerm: [] },
                    motivation: "Thực hiện vai trò được định sẵn trong câu chuyện.",
                    goals: [],
                    currentPlan: null,
                    techniques: [],
                    inventory: { items: [], weightCapacity: 10 },
                    currencies: { 'Bạc': Math.floor(Math.random() * 50) },
                    equipment: {},
                    healthStatus: 'HEALTHY',
                    activeEffects: [],
                    tuoiTho: 100 + Math.floor(Math.random() * 200),
                };
                nextState.activeNpcs.push(newNpc);
                showNotification(`Nhân vật mới xuất hiện: ${newNpc.identity.name}`);
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
        const newRealm = currentState.realmSystem.find(r => r.id === intent.realmChange);
        const newStage = newRealm?.stages.find(s => s.id === intent.stageChange);
        if (newRealm && newStage) {
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
    
                const isVitalThatRefills = ['sinh_menh', 'linh_luc', 'hunger', 'thirst'].includes(attrId);
                if (isVitalThatRefills && attr.maxValue > (originalMaxValue || 0)) {
                    attr.value = attr.maxValue;
                }
            }
    
            if (changes.change) {
                attr.value = Number(attr.value) + changes.change;
                if (changes.change !== 0) showNotification(`${attrDef?.name || attrId}: ${changes.change > 0 ? '+' : ''}${changes.change}`);
            }
    
            if (attr.maxValue !== undefined) {
                attr.value = Math.min(Number(attr.value), Number(attr.maxValue));
            }
            attr.value = Math.max(0, Number(attr.value));
            
        } else if (attrId === 'spiritualQi' && changes.change) {
             pc.cultivation.spiritualQi = Math.max(0, Number(pc.cultivation.spiritualQi) + changes.change);
             if (changes.change !== 0) showNotification(`Linh Khí: ${changes.change > 0 ? '+' : ''}${changes.change.toLocaleString()}`);
        }
    });
    
    pc.attributes = calculateDerivedStats(pc.attributes, nextState.attributeSystem.definitions);
    
    nextState.playerCharacter = pc;
    return nextState;
};