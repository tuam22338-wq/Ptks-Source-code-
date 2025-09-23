import type { GameState, SaveSlot, GameSettings } from '../types';
import type { View } from './AppContext';

// Define the shape of our global state
export interface AppState {
    view: View;
    isLoading: boolean;
    loadingMessage: string;
    isMigratingData: boolean;
    migrationMessage: string;
    gameState: GameState | null;
    saveSlots: SaveSlot[];
    currentSlotId: number | null;
    settings: GameSettings;
    storageUsage: { usageString: string; percentage: number };
    activeWorldId: string;
}

// Define action types
export type Action =
  | { type: 'NAVIGATE'; payload: View }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean; message?: string } }
  | { type: 'SET_MIGRATION_STATE'; payload: { isMigrating: boolean; message?: string } }
  | { type: 'SET_SAVE_SLOTS'; payload: SaveSlot[] }
  | { type: 'SET_SETTINGS'; payload: GameSettings }
  | { type: 'UPDATE_SETTING'; payload: { key: keyof GameSettings; value: any } }
  | { type: 'SET_STORAGE_USAGE'; payload: { usageString: string; percentage: number } }
  | { type: 'SET_ACTIVE_WORLD_ID'; payload: string }
  | { type: 'LOAD_GAME'; payload: { gameState: GameState; slotId: number } }
  | { type: 'START_CHARACTER_CREATION'; payload: number }
  | { type: 'QUIT_GAME' }
  | { type: 'UPDATE_GAME_STATE'; payload: GameState | null | ((prevState: GameState | null) => GameState | null) };


// The reducer function
export const gameReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'NAVIGATE':
            return { ...state, view: action.payload };

        case 'SET_LOADING':
            return { 
                ...state, 
                isLoading: action.payload.isLoading, 
                loadingMessage: action.payload.message || (action.payload.isLoading ? state.loadingMessage : '') 
            };

        case 'SET_MIGRATION_STATE':
            return { 
                ...state, 
                isMigratingData: action.payload.isMigrating, 
                migrationMessage: action.payload.message || state.migrationMessage 
            };

        case 'SET_SAVE_SLOTS':
            return { ...state, saveSlots: action.payload };

        case 'SET_SETTINGS':
            return { ...state, settings: action.payload };

        case 'UPDATE_SETTING':
            return { ...state, settings: { ...state.settings, [action.payload.key]: action.payload.value } };

        case 'SET_STORAGE_USAGE':
            return { ...state, storageUsage: action.payload };

        case 'SET_ACTIVE_WORLD_ID':
            return { ...state, activeWorldId: action.payload };
        
        case 'START_CHARACTER_CREATION':
            return { ...state, currentSlotId: action.payload, view: 'characterCreation' };

        case 'LOAD_GAME':
            return { 
                ...state, 
                gameState: action.payload.gameState, 
                currentSlotId: action.payload.slotId, 
                view: 'gamePlay', 
                isLoading: false 
            };

        case 'QUIT_GAME':
            return { ...state, gameState: null, currentSlotId: null, view: 'mainMenu' };
        
        case 'UPDATE_GAME_STATE':
             const newGameState = typeof action.payload === 'function'
                ? (action.payload as (prevState: GameState | null) => GameState | null)(state.gameState)
                : action.payload;
             // Prevent updates if no game is active, except when loading a new game.
             if (!state.gameState && !newGameState) return state;
             return { ...state, gameState: newGameState };

        default:
            return state;
    }
};