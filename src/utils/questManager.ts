import type { GameState, NPC, ActiveQuest, QuestObjective, InventoryItem, EventOutcome, PlayerNpcRelationship } from '../types';
import { generateMainQuestFromEvent, generateSideQuestFromNpc } from '../services/geminiService';

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


const updateQuestProgress = (currentState: GameState): QuestUpdateResult => {
    let newState = { ...currentState };
    const notifications: string[] = [];
    const { playerCharacter } = newState;

    const updatedQuests = playerCharacter.activeQuests.map(quest => {
        let questObjectivesCompleted = true;
        const updatedObjectives = quest.objectives.map(obj => {
            if (obj.isCompleted) return obj;

            let progressMade = false;
            switch (obj.type) {
                case 'TRAVEL':
                    if (playerCharacter.currentLocationId === obj.target) {
                        obj.current = 1;
                    }
                    break;
                case 'GATHER':
                    const item = playerCharacter.inventory.items.find(i => i.name === obj.target);
                    obj.current = item ? item.quantity : 0;
                    break;
                case 'TALK': // This needs to be triggered explicitly
                    break;
                case 'DEFEAT': // This would be updated after combat
                    break;
            }
            
            if (obj.current >= obj.required) {
                obj.isCompleted = true;
                progressMade = true;
            }
            
            if (progressMade) {
                 notifications.push(`Nhiệm vụ cập nhật: ${obj.description} (${obj.current}/${obj.required})`);
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
            if (rewards.spiritualQi) pc.cultivation.spiritualQi += rewards.spiritualQi;
            if (rewards.danhVong) pc.danhVong.value += rewards.danhVong;
            if (rewards.items) {
                let newItems = [...pc.inventory.items];
                rewards.items.forEach(rewardItem => {
                    const existingItem = newItems.find(i => i.name === rewardItem.name);
                    if (existingItem) {
                        existingItem.quantity += rewardItem.quantity;
                    } else {
                        // Create a placeholder item since we don't have a full item database here.
                        newItems.push({
                            id: `reward-${rewardItem.name.replace(/\s+/g, '_')}-${Date.now()}`,
                            name: rewardItem.name,
                            quantity: rewardItem.quantity,
                            description: 'Vật phẩm nhận được từ nhiệm vụ.',
                            type: 'Tạp Vật',
                            quality: 'Phàm Phẩm',
                            weight: 0.1,
                            icon: '🎁',
                        } as InventoryItem);
                    }
                    notifications.push(`Bạn nhận được [${rewardItem.name} x${rewardItem.quantity}]`);
                });
                pc.inventory = { ...pc.inventory, items: newItems };
            }
        });
        
        pc.activeQuests = remainingQuests;
        pc.completedQuestIds = [...pc.completedQuestIds, ...completedQuests.map(q => q.id)];
        
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
                completedQuestIds: [...newState.playerCharacter.completedQuestIds, ...failedQuests.map(q => q.id)] // Also add to completed to prevent re-triggering
            }
        };
    }
    
    return { newState, notifications };
};

export const processQuestUpdates = async (currentState: GameState, isNewDay: boolean): Promise<QuestUpdateResult> => {
    let state1 = { ...currentState };
    let notifications1: string[] = [];

    if (isNewDay) {
        // Decrement timers on quests
        const timedQuests = state1.playerCharacter.activeQuests.map(q => 
            q.timeLimit ? { ...q, timeLimit: q.timeLimit - 1 } : q
        );
        state1 = { ...state1, playerCharacter: { ...state1.playerCharacter, activeQuests: timedQuests }};
        
        // Check for failed quests
        const failResult = checkFailedQuests(state1);
        state1 = failResult.newState;
        notifications1 = failResult.notifications;
    }

    // 1. Check for new main quests based on game state (e.g., time)
    const { newState: stateAfterMainQuests, notifications: mainQuestNotifications } = await checkForNewMainQuests(state1);
    
    // 2. Update progress on existing quests
    const { newState: stateAfterProgress, notifications: progressNotifications } = updateQuestProgress(stateAfterMainQuests);

    // 3. Check for and process completed quests
    const { newState: stateAfterCompletion, notifications: completionNotifications } = processCompletedQuests(stateAfterProgress);

    return {
        newState: stateAfterCompletion,
        notifications: [...notifications1, ...mainQuestNotifications, ...progressNotifications, ...completionNotifications],
    };
};
