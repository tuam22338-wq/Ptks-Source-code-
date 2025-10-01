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
    const { playerCharacter, activeNpcs } = gameState;

    // Player checks
    if (playerCharacter) {
        const hp = playerCharacter.attributes.sinh_menh;
        if (hp && hp.value < 0) {
            problems.push(`Player HP is negative (${hp.value}). It should be >= 0.`);
        }
        if (hp && hp.maxValue !== undefined && hp.value > hp.maxValue) {
            problems.push(`Player HP (${hp.value}) is greater than max HP (${hp.maxValue}).`);
        }
    }

    // NPC checks
    activeNpcs.forEach(npc => {
        const npcHp = npc.attributes.sinh_menh;
        if (npcHp && npcHp.value < 0) {
            problems.push(`NPC ${npc.identity.name} HP is negative (${npcHp.value}). It should be >= 0.`);
        }
    });

    // Add more checks here...
    // - Quest state vs. completed objectives
    // - Player location validity
    // - Inventory item validity

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
            // For now, we'll try a simple programmatic fix first.
            let fixed = false;
            if (problem.startsWith('Player HP is negative')) {
                currentState.playerCharacter.attributes.sinh_menh.value = 0;
                fixed = true;
            } else if (problem.startsWith('Player HP is greater than max HP')) {
                currentState.playerCharacter.attributes.sinh_menh.value = currentState.playerCharacter.attributes.sinh_menh.maxValue!;
                fixed = true;
            }
            
            const solution = `Thiên Đạo đã can thiệp: ${fixed ? 'Tự động điều chỉnh giá trị về mức hợp lệ.' : 'Yêu cầu AI phân tích và sửa lỗi logic.'}`;
            
            // Log the fix
            const logEntry: Omit<HeuristicFixReport, 'id'> = {
                timestamp: new Date().toISOString(),
                problem: problem,
                solution: solution,
            };
            await db.addHeuristicFixLog(logEntry);
            notifications.push('[Thiên Đạo] Phát hiện nhân quả rối loạn, đã tự động điều chỉnh.');

            // If not fixed by simple logic, we could call the AI (future improvement)
            // if (!fixed) {
            //   const correctedState = await generateCorrectedGameState(currentState, problem);
            //   currentState = { ...currentState, ...correctedState };
            // }

        } catch (error) {
            console.error(`[Heuristic Fixer] Failed to fix problem: "${problem}"`, error);
        }
    }

    return { newState: currentState, notifications };
};
