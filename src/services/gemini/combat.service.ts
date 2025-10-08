import { Type } from "@google/genai";
import type { GameState, NPC, CultivationTechnique } from '../../types';
import { generateWithRetry } from './gemini.core';
import * as db from '../dbService';

interface CombatActionDecision {
    action: 'BASIC_ATTACK' | 'USE_TECHNIQUE' | 'DEFEND';
    techniqueId?: string;
    narrative: string;
}

export const decideNpcCombatAction = async (gameState: GameState, npc: NPC): Promise<CombatActionDecision> => {
    const { combatState, playerCharacter } = gameState;
    if (!combatState) throw new Error("Không ở trong trạng thái chiến đấu.");

    const availableTechniques = (npc.techniques || []).filter(tech => {
        const cooldown = 0; // NPCs don't have cooldowns for simplicity yet
        const canAfford = true; // NPCs have infinite resources for now
        return cooldown <= 0 && canAfford;
    });

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            action: { type: Type.STRING, enum: ['BASIC_ATTACK', 'USE_TECHNIQUE', 'DEFEND'] },
            techn