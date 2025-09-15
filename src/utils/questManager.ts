import type { GameState, NPC, ActiveQuest, QuestObjective } from '../types';
import { generateMainQuestFromEvent, generateSideQuestFromNpc } from '../services/geminiService';

interface QuestUpdateResult {
    newState: GameState;
    notifications: string[];
}

const addQuest = (currentState: GameState, questData: Partial<ActiveQuest>, type: 'MAIN' | 'SIDE', source: string): GameState => {
    const newQuest: ActiveQuest = {
        id: `quest_${source}_${Date.now()}`,
        title: questData.title || 'Nhiệm vụ không tên',
        description: questData.description || '',
        type: type,
        source: source,
        objectives: (questData.objectives || []).map(obj => ({ ...obj, current: 0, isCompleted: false })),
        rewards: questData.rewards || {},
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
        const hasQuest = playerCharacter.activeQuests.some(q => q.source === questSourceId) || playerCharacter.completedQuestIds.includes(questSourceId);
        
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
            if (rewards.currencies) {
                for (const [currency, amount] of Object.entries(rewards.currencies)) {
                    pc.currencies[currency] = (pc.currencies[currency] || 0) + amount;
                }
            }
            // TODO: Add items to inventory
        });
        
        pc.activeQuests = remainingQuests;
        pc.completedQuestIds = [...pc.completedQuestIds, ...completedQuests.map(q => q.id)];
        
        newState = { ...newState, playerCharacter: pc };
    }

    return { newState, notifications };
};

export const processQuestUpdates = async (currentState: GameState): Promise<QuestUpdateResult> => {
    // 1. Check for new main quests based on game state (e.g., time)
    const { newState: stateAfterMainQuests, notifications: mainQuestNotifications } = await checkForNewMainQuests(currentState);
    
    // 2. Update progress on existing quests
    const { newState: stateAfterProgress, notifications: progressNotifications } = updateQuestProgress(stateAfterMainQuests);

    // 3. Check for and process completed quests
    const { newState: stateAfterCompletion, notifications: completionNotifications } = processCompletedQuests(stateAfterProgress);

    return {
        newState: stateAfterCompletion,
        notifications: [...mainQuestNotifications, ...progressNotifications, ...completionNotifications],
    };
};