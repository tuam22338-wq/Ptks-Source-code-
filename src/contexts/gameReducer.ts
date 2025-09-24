import type { GameState, SaveSlot, GameSettings, BackgroundState } from '../types';
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
    backgrounds: BackgroundState;
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
  | { type: 'UPDATE_GAME_STATE'; payload: GameState | null | ((prevState: GameState | null) => GameState | null) }
  | { type: 'LOAD_BACKGROUND_START'; payload: { themeId: string } }
  | { type: 'LOAD_BACKGROUND_SUCCESS'; payload: { themeId: string; urls: any } }
  | { type: 'LOAD_BACKGROUND_ERROR'; payload: { themeId: string } }
  | { type: 'SET_ALL_CACHED_BACKGROUNDS'; payload: Record<string, any> };


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
        
        case 'LOAD_BACKGROUND_START':
            return { ...state, backgrounds: { ...state.backgrounds, status: { ...state.backgrounds.status, [action.payload.themeId]: 'loading' } } };

        case 'LOAD_BACKGROUND_SUCCESS':
            return { ...state, backgrounds: { 
                status: { ...state.backgrounds.status, [action.payload.themeId]: 'loaded' },
                urls: { ...state.backgrounds.urls, [`bg_theme_${action.payload.themeId}`]: action.payload.urls }
            }};

        case 'LOAD_BACKGROUND_ERROR':
            return { ...state, backgrounds: { ...state.backgrounds, status: { ...state.backgrounds.status, [action.payload.themeId]: 'error' } } };
            
        case 'SET_ALL_CACHED_BACKGROUNDS':
            const newStatus: Record<string, 'loaded'> = {};
            Object.keys(action.payload).forEach(key => {
                const themeId = key.replace('bg_theme_', '');
                newStatus[themeId] = 'loaded';
            });
            return { ...state, backgrounds: { urls: action.payload, status: { ...state.backgrounds.status, ...newStatus } } };

        default:
            return state;
    }
};
