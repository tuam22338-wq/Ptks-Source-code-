import React, { createContext, useContext, useReducer, useCallback, FC, PropsWithChildren, useRef, useEffect, useState } from 'react';
import type { GameState, StoryEntry, PlayerCharacter } from '../types';
import { processPlayerAction } from '../services/gameService';
import * as db from '../services/dbService';
import { useAppContext } from './AppContext'; // Import useAppContext để truy cập settings

// --- State and Actions for Game Reducer ---
interface GameStateShape {
    gameState: GameState;
    isAiResponding: boolean;
    aiLoadingMessage: string;
}

type GameAction =
  | { type: 'UPDATE_GAME_STATE'; payload: GameState | ((prevState: GameState) => GameState) }
  | { type: 'PLAYER_ACTION_PENDING'; payload: { text: string; type: 'say' | 'act' } }
  | { type: 'STREAMING_NARRATIVE_UPDATE'; payload: string }
  | { type: 'PLAYER_ACTION_RESOLVED'; payload: { finalState: GameState; narrativeEntryPayload: Omit<StoryEntry, 'id'> } }
  | { type: 'SET_AI_LOADING'; payload: { isLoading: boolean; message?: string } };

// --- Game Reducer ---
const gameReducer = (state: GameStateShape, action: GameAction): GameStateShape => {
    switch (action.type) {
        case 'SET_AI_LOADING':
            return {
                ...state,
                isAiResponding: action.payload.isLoading,
                aiLoadingMessage: action.payload.message || (action.payload.isLoading ? state.aiLoadingMessage : ''),
            };

        case 'UPDATE_GAME_STATE':
            const newGameState = typeof action.payload === 'function'
                ? action.payload(state.gameState)
                : action.payload;
            return { ...state, gameState: newGameState };
        
        case 'PLAYER_ACTION_PENDING': {
            const lastId = state.gameState.storyLog.length > 0 ? state.gameState.storyLog[state.gameState.storyLog.length - 1].id : 0;
            const playerActionEntry: StoryEntry = {
                id: lastId + 1,
                type: action.payload.type === 'say' ? 'player-dialogue' : 'player-action',
                content: action.payload.text,
                isPending: true,
            };
            const aiNarrativePlaceholder: StoryEntry = { id: lastId + 2, type: 'narrative', content: '' };
            return {
                ...state,
                gameState: { ...state.gameState, storyLog: [...state.gameState.storyLog, playerActionEntry, aiNarrativePlaceholder] },
            };
        }
        case 'STREAMING_NARRATIVE_UPDATE': {
            const newStoryLog = [...state.gameState.storyLog];
            const lastEntry = newStoryLog[newStoryLog.length - 1];
            if (lastEntry) {
                lastEntry.content = action.payload;
            }
            return { ...state, gameState: { ...state.gameState, storyLog: newStoryLog } };
        }
        case 'PLAYER_ACTION_RESOLVED': {
            const { finalState, narrativeEntryPayload } = action.payload;
            const newStoryLog = [...state.gameState.storyLog];
            const playerActionIndex = newStoryLog.findIndex(e => e.isPending);
            if (playerActionIndex > -1) {
                newStoryLog[playerActionIndex] = { ...newStoryLog[playerActionIndex], isPending: false };
                const narrativeIndex = playerActionIndex + 1;
                if (narrativeIndex < newStoryLog.length) {
                    newStoryLog[narrativeIndex] = { ...newStoryLog[narrativeIndex], ...narrativeEntryPayload };
                }
            }
            return { ...state, gameState: { ...finalState, storyLog: newStoryLog } };
        }
        default:
            return state;
    }
};


// --- Context Definition ---
interface GameContextType {
    gameState: GameState;
    isAiResponding: boolean;
    aiLoadingMessage: string;
    handlePlayerAction: (text: string, type: 'say' | 'act', apCost: number, showNotification: (message: string) => void) => Promise<void>;
    handleUpdatePlayerCharacter: (updater: (pc: PlayerCharacter) => PlayerCharacter) => void;
    handleSaveGame: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameContext = (): GameContextType => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGameContext must be used within a GameProvider');
    }
    return context;
};

// --- Provider Component ---
interface GameProviderProps {
    initialGameState: GameState;
}

export const GameProvider: FC<PropsWithChildren<GameProviderProps>> = ({ children, initialGameState }) => {
    const { state: appState, dispatch: appDispatch } = useAppContext();
    const { settings, currentSlotId } = appState;

    const [state, dispatch] = useReducer(gameReducer, {
        gameState: initialGameState,
        isAiResponding: false,
        aiLoadingMessage: '',
    });

    const abortControllerRef = useRef<AbortController | null>(null);

    const handlePlayerAction = useCallback(async (text: string, type: 'say' | 'act', apCost: number, showNotification: (message: string) => void) => {
        if (state.isAiResponding || currentSlotId === null) return;

        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        dispatch({ type: 'PLAYER_ACTION_PENDING', payload: { text, type } });
        dispatch({ type: 'SET_AI_LOADING', payload: { isLoading: true, message: 'AI đang suy nghĩ...' } });

        try {
            const onStreamUpdate = (content: string) => dispatch({ type: 'STREAMING_NARRATIVE_UPDATE', payload: content });
            
            const { finalState, narrativeEntryPayload } = await processPlayerAction(
                state.gameState, text, type, apCost, settings, showNotification, abortControllerRef.current.signal, currentSlotId, onStreamUpdate
            );

            dispatch({ type: 'PLAYER_ACTION_RESOLVED', payload: { finalState, narrativeEntryPayload } });
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Error processing player action:", error);
                const errorEntry: StoryEntry = { id: Date.now(), type: 'system', content: `[Lỗi hệ thống: ${error.message}]` };
                dispatch({ type: 'UPDATE_GAME_STATE', payload: (gs) => ({ ...gs, storyLog: [...gs.storyLog.filter(e => !e.isPending), errorEntry] }) });
            }
        } finally {
            dispatch({ type: 'SET_AI_LOADING', payload: { isLoading: false } });
        }
    }, [state.gameState, state.isAiResponding, settings, currentSlotId]);

    const handleUpdatePlayerCharacter = useCallback((updater: (pc: PlayerCharacter) => PlayerCharacter) => {
        dispatch({ type: 'UPDATE_GAME_STATE', payload: (gs) => ({ ...gs, playerCharacter: updater(gs.playerCharacter) }) });
    }, []);

    const handleSaveGame = useCallback(async () => {
        if (!state.gameState || currentSlotId === null) return;
        try {
            const stateToSave = { ...state.gameState, lastSaved: new Date().toISOString() };
            await db.saveGameState(currentSlotId, stateToSave);
            dispatch({ type: 'UPDATE_GAME_STATE', payload: stateToSave });
            // Cập nhật lại danh sách save slots trong AppContext
            const allSlots = await db.getAllSaveSlots();
            appDispatch({ type: 'SET_SAVE_SLOTS', payload: allSlots });
        } catch (error) {
            console.error('Error saving game:', error);
        }
    }, [state.gameState, currentSlotId, appDispatch]);
    
    // Đồng bộ state từ GameContext ngược lại AppContext khi nó thay đổi
    useEffect(() => {
        appDispatch({ type: 'UPDATE_GAME_STATE', payload: state.gameState });
    }, [state.gameState, appDispatch]);

    const contextValue: GameContextType = {
        gameState: state.gameState,
        isAiResponding: state.isAiResponding,
        aiLoadingMessage: state.aiLoadingMessage,
        handlePlayerAction,
        handleUpdatePlayerCharacter,
        handleSaveGame,
    };

    return (
        <GameContext.Provider value={contextValue}>
            {children}
        </GameContext.Provider>
    );
};
