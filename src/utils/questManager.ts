import type { GameState, NPC, ActiveQuest, QuestObjective, InventoryItem, EventOutcome, PlayerNpcRelationship } from '../types';
import { generateMainQuestFromEvent, generateSideQuestFromNpc, generateSystemQuest } from '../services/geminiService';
import { FACTION_REPUTATION_TIERS } from '../constants';

interface QuestUpdateResult {
    newState: GameState;
    notifications: string[];
}

const applyOutcomes = (currentState: GameState, outcomes: EventOutcome[]): GameState => {
    let newState = { ...currentState };
    // This is a simplified outcome application logic. A full implementation would be more robust.
    outcomes.forEach(outcome => {
        if (outcome.type === 'CHANGE_STAT') {
            // Placeholder logic
            console.log("Applying failure outcome:", outcome.details);
        }
    });
    return newState;
};

const addQuest = (currentState: GameState, questData: Partial<ActiveQuest>, type: 'MAIN' | 'SIDE' | 'SYSTEM', source: string): GameState => {
    const newQuest: ActiveQuest = {
        id: `quest_${source}_${Date.now()}`,
        title: questData.title || 'Nhiệm vụ không tên',
        description: questData.description || '',
        type: type,
        source: source,
        objectives: (questData.objectives || []).map(obj => ({ ...obj, current: 0, isCompleted: false })),
        rewards: questData.rewards || {},
        timeLimit: questData.timeLimit, // Can be undefined
        onFailure: questData.onFailure, // Can be undefined
    };
    return {
        ...currentState,
        playerCharacter: {
            ...currentState.playerCharacter,
            activeQuests: [...currentState.playerCharacter.activeQuests, newQuest],
        },
    };
};

export const checkForNewMainQuests = async (currentState: GameState): Promise<QuestUpdateResult> => {
    let newState = { ...currentState };
    const notifications: string[] = [];
    const { gameDate, majorEvents, playerCharacter } = newState;

    for (const event of majorEvents) {
        const questSourceId = `event:${event.title.toLowerCase().replace(/\s+/g, '_')}`;
        const hasQuest = playerCharacter.activeQuests.some(q => q.source === questSourceId) || playerCharacter.completedQuestIds.includes(questSourceId);

        if (gameDate.year >= event.year && !hasQuest) {
            try {
                const questData = await generateMainQuestFromEvent(event, newState);
                newState = addQuest(newState, questData, 'MAIN', questSourceId);
                notifications.push(`Nhiệm vụ mới: ${questData.title}`);
            } catch (error) {
                console.error(`Failed to generate main quest for event "${event.title}":`, error);
            }
        }
    }

    return { newState, notifications };
};

export const checkForNewSideQuest = async (currentState: GameState, npc: NPC): Promise<QuestUpdateResult> => {
    let newState = { ...currentState };
    const notifications: string[] = [];
    const { playerCharacter } = newState;

    const relationship = playerCharacter.relationships.find(r => r.npcId === npc.id);
    if (relationship && relationship.value > 50 && Math.random() < 0.25) { // 25% chance for friendly NPCs
        const questSourceId = `npc:${npc.id}`;
        const hasQuest = playerCharacter.activeQuests.some(q => q.source === questSourceId);
        
        if (!hasQuest) {
            try {
                const questData = await generateSideQuestFromNpc(npc, relationship, newState);
                newState = addQuest(newState, questData, 'SIDE', questSourceId);
                notifications.push(`Nhiệm vụ mới từ ${npc.identity.name}: ${questData.title}`);
            } catch (error) {
                console.error(`Failed to generate side quest for NPC "${npc.identity.name}":`, error);
            }
        }
    }
    
    return { newState, notifications };
};

export const checkForNewSystemQuest = async (currentState: GameState): Promise<QuestUpdateResult> => {
    let newState = { ...currentState };
    const notifications: string[] = [];
    // Only generate a new system quest if there are no other active system quests
    if (newState.playerCharacter.activeQuests.some(q => q.type === 'SYSTEM')) {
        return { newState, notifications };
    }

    try {
        const questData = await generateSystemQuest(newState);
        newState = addQuest(newState, questData, 'SYSTEM', 'system');
        notifications.push(`[Hệ Thống] Nhiệm vụ mới: ${questData.title}`);
    } catch (error) {
        console.error(`Failed to generate system quest:`, error);
    }
    
    return { newState, notifications };
};


const updateQuestProgress = (currentState: GameState): QuestUpdateResult => {
    let newState = { ...currentState };
    const notifications: string[] = [];
    const { playerCharacter } = newState;

    const updatedQuests = playerCharacter.activeQuests.map(quest => {
        let questObjectivesCompleted = true;
        const updatedObjectives = quest.objectives.map(obj => {
            if (obj.isCompleted) return obj;

            switch (obj.type) {
                case 'TRAVEL':
                    if (playerCharacter.currentLocationId === obj.target) {
                        obj.current = obj.required;
                    }
                    break;
                case 'GATHER':
                    // Progress for GATHER quests is now updated cumulatively in stateUpdateService.
                    // This section now only handles the completion check.
                    break;
                case 'TALK': // This needs to be triggered explicitly
                    break;
                case 'DEFEAT': // This would be updated after combat
                    break;
            }

            if (obj.current >= obj.required && !obj.isCompleted) {
                obj.isCompleted = true;
                notifications.push(`Nhiệm vụ hoàn thành mục tiêu: ${obj.description}`);
            }

            if (!obj.isCompleted) {
                questObjectivesCompleted = false;
            }

            return obj;
        });
        
        return { ...quest, objectives: updatedObjectives };
    });
    
    newState = { ...newState, playerCharacter: { ...playerCharacter, activeQuests: updatedQuests } };

    return { newState, notifications };
};

const processCompletedQuests = (currentState: GameState): QuestUpdateResult => {
    let newState = { ...currentState };
    const notifications: string[] = [];
    const { playerCharacter } = newState;
    
    const activeQuests = [...playerCharacter.activeQuests];
    const completedQuests: ActiveQuest[] = [];
    const remainingQuests: ActiveQuest[] = [];

    activeQuests.forEach(quest => {
        if (quest.objectives.every(obj => obj.isCompleted)) {
            completedQuests.push(quest);
        } else {
            remainingQuests.push(quest);
        }
    });

    if (completedQuests.length > 0) {
        let pc = { ...playerCharacter };
        
        completedQuests.forEach(quest => {
            notifications.push(`Nhiệm vụ hoàn thành: ${quest.title}`);
            const { rewards } = quest;

            if (rewards.spiritualQi) {
                const qiAmount = Number(rewards.spiritualQi) || 0;
                if (qiAmount > 0) {
                    pc.cultivation.spiritualQi += qiAmount;
                    notifications.push(`Bạn nhận được [${qiAmount.toLocaleString()} Linh khí]`);
                }
            }
            if (rewards.danhVong) {
                pc.danhVong.value += rewards.danhVong;
                notifications.push(`Bạn nhận được [${rewards.danhVong} Danh vọng]`);
            }
            
            let newCurrencies = { ...pc.currencies };
            if (rewards.currencies) {
                for (const [currency, amount] of Object.entries(rewards.currencies)) {
                    const rewardAmount = Number(amount) || 0;
                    if (rewardAmount) {
                        newCurrencies[currency] = (newCurrencies[currency] || 0) + rewardAmount;
                        notifications.push(`Bạn nhận được [${rewardAmount.toLocaleString()} ${currency}]`);
                    }
                }
            }
            pc.currencies = newCurrencies;

            if (rewards.reputation) {
                let newReputation = [...pc.reputation];
                rewards.reputation.forEach(repChange => {
                    const repIndex = newReputation.findIndex(r => r.factionName === repChange.factionName);
                    if (repIndex !== -1) {
                        const currentRep = newReputation[repIndex];
                        const newValue = currentRep.value + repChange.change;
                        const newStatus = FACTION_REPUTATION_TIERS.slice().reverse().find(t => newValue >= t.threshold)?.status || 'Kẻ Địch';
                        newReputation[repIndex] = { ...currentRep, value: newValue, status: newStatus };
                        notifications.push(`Danh vọng với ${repChange.factionName} ${repChange.change > 0 ? 'tăng' : 'giảm'} ${Math.abs(repChange.change)}.`);
                    }
                });
                pc.reputation = newReputation;
            }

            if (rewards.items) {
                let newItems = [...pc.inventory.items];
                rewards.items.forEach(rewardItem => {
                    const existingItem = newItems.find(i => i.name === rewardItem.name);
                    if (existingItem) {
                        existingItem.quantity = (Number(existingItem.quantity) || 0) + rewardItem.quantity;
                    } else {
                        newItems.push({
                            id: `reward-${rewardItem.name.replace(/\s+/g, '_')}-${Date.now()}`,
                            name: rewardItem.name, quantity: rewardItem.quantity,
                            description: 'Vật phẩm nhận được từ nhiệm vụ.', type: 'Tạp Vật',
                            quality: 'Phàm Phẩm', weight: 0.1, icon: '🎁',
                        } as InventoryItem);
                    }
                    notifications.push(`Bạn nhận được [${rewardItem.name} x${rewardItem.quantity}]`);
                });
                pc.inventory = { ...pc.inventory, items: newItems };
            }

            let itemsToConsume = [...pc.inventory.items];
            quest.objectives.forEach(obj => {
                if (obj.type === 'GATHER' && obj.isCompleted) {
                    const itemIndex = itemsToConsume.findIndex(i => i.name === obj.target);
                    if (itemIndex !== -1) {
                        const newQuantity = (Number(itemsToConsume[itemIndex].quantity) || 0) - obj.required;
                        if (newQuantity > 0) {
                            itemsToConsume[itemIndex] = { ...itemsToConsume[itemIndex], quantity: newQuantity };
                        } else {
                            itemsToConsume.splice(itemIndex, 1);
                        }
                    }
                }
            });
            pc.inventory = { ...pc.inventory, items: itemsToConsume };
        });
        
        pc.activeQuests = remainingQuests;
        pc.completedQuestIds = [...pc.completedQuestIds, ...completedQuests.map(q => q.source)];
        
        newState = { ...newState, playerCharacter: pc };
    }

    return { newState, notifications };
};

export const checkFailedQuests = (currentState: GameState): QuestUpdateResult => {
    let newState = { ...currentState };
    const notifications: string[] = [];
    
    const remainingQuests: ActiveQuest[] = [];
    const failedQuests: ActiveQuest[] = [];

    newState.playerCharacter.activeQuests.forEach(quest => {
        if (quest.timeLimit && quest.timeLimit <= 0) {
            failedQuests.push(quest);
        } else {
            remainingQuests.push(quest);
        }
    });

    if (failedQuests.length > 0) {
        failedQuests.forEach(quest => {
            notifications.push(`Nhiệm vụ thất bại: ${quest.title}`);
            if (quest.onFailure) {
                newState = applyOutcomes(newState, quest.onFailure);
            }
        });

        newState = {
            ...newState,
            playerCharacter: {
                ...newState.playerCharacter,
                activeQuests: remainingQuests,
                completedQuestIds: [...newState.playerCharacter.completedQuestIds, ...failedQuests.map(q => q.source)]
            }
        };
    }
    
    return { newState, notifications };
};

export const processQuestUpdates = (currentState: GameState): QuestUpdateResult => {
    const { newState: stateAfterProgress, notifications: progressNotifications } = updateQuestProgress(currentState);
    const { newState: stateAfterCompletion, notifications: completionNotifications } = processCompletedQuests(stateAfterProgress);

    return {
        newState: stateAfterCompletion,
        notifications: [...progressNotifications, ...completionNotifications],
    };
};