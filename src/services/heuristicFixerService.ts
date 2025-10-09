import type { GameState, HeuristicFixReport } from '../types';
import * as db from './dbService';
import { generateCorrectedGameState } from './gemini/heuristic.service';

/**
 * Scans the game state for logical inconsistencies.
 * @param gameState The current game state.
 * @returns An array of strings describing the detected problems.
 */
const detectInconsistencies = (gameState: GameState): string[] => {
    const problems: string[] = [];
    const { playerCharacter, activeNpcs, discoveredLocations } = gameState;
    const allLocationIds = new Set(discoveredLocations.map(l => l.id));

    // Player checks
    if (playerCharacter) {
        const hp = playerCharacter.attributes.sinh_menh;
        if (hp && hp.value < 0) {
            problems.push(`Player HP is negative (${hp.value}). It should be >= 0.`);
        }
        if (hp && hp.maxValue !== undefined && hp.value > hp.maxValue) {
            problems.push(`Player HP (${hp.value}) is greater than max HP (${hp.maxValue}).`);
        }
        // Check player's current location
        if (!allLocationIds.has(playerCharacter.currentLocationId)) {
            problems.push(`Player's currentLocationId '${playerCharacter.currentLocationId}' is invalid.`);
        }
        // Check player's active quests
        playerCharacter.activeQuests.forEach(quest => {
            quest.objectives.forEach(obj => {
                switch (obj.type) {
                    case 'TRAVEL':
                        if (!allLocationIds.has(obj.target)) {
                            problems.push(`Quest '${quest.title}' has an invalid TRAVEL target location ID: '${obj.target}'.`);
                        }
                        break;
                    case 'TALK':
                        const npcExists = activeNpcs.some(npc => npc.id === obj.target || npc.identity.name === obj.target);
                        if (!npcExists) {
                            problems.push(`Quest '${quest.title}' has an invalid TALK target NPC: '${obj.target}'.`);
                        }
                        break;
                    // GATHER and DEFEAT are harder to validate without master lists, so we omit them for now.
                    case 'GATHER':
                    case 'DEFEAT':
                        break;
                }
            });
        });
    }

    // NPC checks
    activeNpcs.forEach(npc => {
        const npcHp = npc.attributes.sinh_menh;
        if (npcHp && npcHp.value < 0) {
            problems.push(`NPC ${npc.identity.name} HP is negative (${npcHp.value}). It should be >= 0.`);
        }
    });

    return problems;
};

/**
 * Runs the heuristic fixer AI to detect and correct inconsistencies in the game state.
 * @param gameState The game state to check and fix.
 * @returns An object containing the potentially modified new state and notifications.
 */
export const runHeuristicFixer = async (
    gameState: GameState,
    slotId: number
): Promise<{ newState: GameState; notifications: string[] }> => {
    const problems = detectInconsistencies(gameState);
    if (problems.length === 0) {
        return { newState: gameState, notifications: [] };
    }

    console.log(`[Heuristic Fixer] Detected ${problems.length} potential issue(s).`, problems);

    let currentState = { ...gameState };
    const notifications: string[] = [];

    for (const problem of problems) {
        try {
            let solution = '';

            if (problem.startsWith('Player HP is negative')) {
                currentState.playerCharacter.attributes.sinh_menh.value = 0;
                solution = 'Thiên Đạo đã can thiệp: Sinh Mệnh người chơi được điều chỉnh về 0.';
            } else if (problem.startsWith('Player HP is greater than max HP')) {
                currentState.playerCharacter.attributes.sinh_menh.value = currentState.playerCharacter.attributes.sinh_menh.maxValue!;
                solution = 'Thiên Đạo đã can thiệp: Sinh Mệnh người chơi được điều chỉnh về mức tối đa.';
            } else if (problem.startsWith("Player's currentLocationId")) {
                const fallbackLocationId = currentState.discoveredLocations[0]?.id;
                if (fallbackLocationId) {
                    currentState.playerCharacter.currentLocationId = fallbackLocationId;
                    solution = `Thiên Đạo đã can thiệp: Vị trí của người chơi không hợp lệ, đã được đưa về ${currentState.discoveredLocations[0].name}.`;
                }
            } else if (problem.startsWith("Quest '") && problem.includes("' has an invalid")) {
                const questTitleMatch = problem.match(/Quest '(.*?)'/);
                if (questTitleMatch) {
                    const questTitle = questTitleMatch[1];
                    const originalQuestCount = currentState.playerCharacter.activeQuests.length;
                    currentState.playerCharacter.activeQuests = currentState.playerCharacter.activeQuests.filter(q => q.title !== questTitle);
                    if (currentState.playerCharacter.activeQuests.length < originalQuestCount) {
                        solution = `Thiên Đạo đã can thiệp: Nhiệm vụ "${questTitle}" có mục tiêu không hợp lệ đã bị xóa bỏ.`;
                    }
                }
            } else {
                 // For other problems, log but don't take action yet.
                continue;
            }
            
            // Log the fix
            const logEntry: Omit<HeuristicFixReport, 'id'> = {
                timestamp: new Date().toISOString(),
                problem: problem,
                solution: solution,
            };
            await db.addHeuristicFixLog(logEntry);
            notifications.push('[Thiên Đạo] Phát hiện nhân quả rối loạn, đã tự động điều chỉnh.');

        } catch (error) {
            console.error(`[Heuristic Fixer] Failed to fix problem: "${problem}"`, error);
        }
    }

    return { newState: currentState, notifications };
};