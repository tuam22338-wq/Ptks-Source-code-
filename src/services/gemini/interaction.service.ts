
import { Type } from "@google/genai";
import type { GameState, NPC } from '../../types';
import { generateWithRetry } from './gemini.core';
import * as db from '../dbService';

/**
 * This function is deprecated. The thought generation logic has been merged into the main
 * gameplay service's unified prompt to reduce sequential AI calls and improve performance.
 * @deprecated
 */
export const generateNpcThoughtBubble = async (
    npc: NPC,
    gameState: GameState,
    playerInput: string
): Promise<string> => {
    console.warn("generateNpcThoughtBubble is deprecated and should not be called.");
    return ''; 
};