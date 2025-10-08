import type { GameState, HeuristicFixReport } from '../types';
import * as db from './dbService';
import { generateCorrectedGameState } from './gemini/heuristic.service';
import { sanitizeGameState } from '../utils/gameStateSanitizer';

/**
 * Scans the game state for logical inconsistencies.
 * @param gameState The current game state.
 * @returns An array of strings describing the detected problems.
 */
const detectInconsistencies = (gameState: GameState): string[] => {
    const problems: string[] = [];
    const { playerCharacter, activeNpcs } = gameState;

    if (playerCharacter) {
        const hp = playerCharacter.attributes.sinh_menh;
        if (hp && hp.value < 0) {
            problems.push(`Player HP is negative (${hp.value}). It should be >= 0.`);
        }
        if (hp && hp.maxValue !== undefined && hp.value > hp.maxValue) {
            problems.push(`Player HP (${hp.value}) is greater than max HP (${hp.maxValue}).`);
        }
        // @google-genai-fix: Check 'progression.progressionResource' instead of the obsolete 'cultivation.spiritualQi'.
        if (playerCharacter.progression && playerCharacter.progression.progressionResource < 0) {
            problems.push(`Player progressionResource is negative (${playerCharacter.progression.progressionResource}).`);
        }
        for (const currency in playerCharacter.currencies) {
            const amount = playerCharacter.currencies[currency as keyof typeof playerCharacter.currencies];
            if (amount && amount < 0) {
                problems.push(`Player has negative currency: ${currency} (${amount}).`);
            }
        }
        playerCharacter.inventory.items.forEach(item => {
            if (item.quantity < 0) {
                problems.push(`Player has negative quantity for item '${item.name}' (${item.quantity}).`);
            }
        });
    }

    activeNpcs.forEach(npc => {
        const npcHp = npc.attributes.sinh_menh;
        if (npcHp && npcHp.value < 0) {
            problems.push(`NPC ${npc.identity.name} HP is negative (${npcHp.value}). It should be >= 0.`);
        }
        // @google-genai-fix: Check 'progression.progressionResource' for NPCs.
        if (npc.progression && npc.progression.progressionResource < 0) {
            problems.push(`NPC ${npc.identity.name} progressionResource is negative (${npc.progression.progressionResource}).`);
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

    console.log(`[Heuristic Fixer] Detected ${problems.length} potential issue(s). Attempting AI correction.`, problems);
    const notifications: string[] = [];

    try {
        const problemDescription = `Phát hiện ${problems.length} vấn đề tiềm ẩn:\n- ${problems.join('\n- ')}`;
        
        const partialGameState = {
            playerCharacter: gameState.playerCharacter,
            activeNpcs: gameState.activeNpcs,
            activeQuests: gameState.playerCharacter.activeQuests,
        };

        const correctedData = await generateCorrectedGameState(partialGameState, problemDescription);

        const newState = { ...gameState };
        if (correctedData.playerCharacter) {
            newState.playerCharacter = correctedData.playerCharacter;
        }
        if (correctedData.activeNpcs) {
            newState.activeNpcs = correctedData.activeNpcs;
        }
        
        const solution = "Thiên Đạo đã can thiệp: Đã phân tích và điều chỉnh lại dữ liệu game không nhất quán bằng AI.";

        const logEntry: Omit<HeuristicFixReport, 'id'> = {
            timestamp: new Date().toISOString(),
            problem: problems.join('; '),
            solution: solution,
        };
        await db.addHeuristicFixLog(logEntry);
        notifications.push('[Thiên Đạo] Phát hiện nhân quả rối loạn, đã tự động điều chỉnh bằng AI.');

        return { newState: sanitizeGameState(newState), notifications };

    } catch (error: any) {
        console.error(`[Heuristic Fixer] AI-based fix failed:`, error);
        notifications.push('[Thiên Đạo] Can thiệp thất bại, thiên cơ hỗn loạn.');
        return { newState: gameState, notifications }; // Return original state on failure
    }
};