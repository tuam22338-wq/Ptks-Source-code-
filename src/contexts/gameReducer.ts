import type { GameState, SaveSlot, GameSettings, BackgroundState, ModInLibrary, FullMod, StoryEntry, Novel } from '../types';
import type { View } from './AppContext';
import { sanitizeGameState } from '../utils/gameStateSanitizer';

// Define the shape of our global state
export interface AppState {
    view: View;
    isLoading: boolean;
    loadingMessage: string;
    loadingNarratives: string[] | null;
    isMigratingData: boolean;
    migrationMessage: string;
    gameState: GameState | null;
    saveSlots: SaveSlot[];
    currentSlotId: number | null;
    settings: GameSettings;
    storageUsage: { usageString: string; percentage: number };
    activeWorldId: string;
    backgrounds: BackgroundState;
    installedMods: ModInLibrary[];
    modBeingEdited: FullMod | null;
    pdfTextForGenesis: string | null;
    // State for Novelist AI feature
    novels: Novel[];
    activeNovelId: number | null;
    settingsSavingStatus: 'idle' | 'saving' | 'saved';
}

// Define action types
export type Action =
  | { type: 'NAVIGATE'; payload: View }
  | { type: 'SET_LOADING'; payload: { isLoading: boolean; message?: string } }
  | { type: 'SET_LOADING_NARRATIVES'; payload: string[] | null }
  | { type: 'SET_MIGRATION_STATE'; payload: { isMigrating: boolean; message?: string } }
  | { type: 'SET_SAVE_SLOTS'; payload: SaveSlot[] }
  | { type: 'SET_SETTINGS'; payload: GameSettings }
  | { type: 'UPDATE_SETTING'; payload: { key: keyof GameSettings; value: any } }
  | { type: 'SET_STORAGE_USAGE'; payload: { usageString: string; percentage: number } }
  | { type: 'SET_ACTIVE_WORLD_ID'; payload: string }
  | { type: 'LOAD_GAME'; payload: { gameState: GameState; slotId: number } }
  | { type: 'QUIT_GAME' }
  | { type: 'UPDATE_GAME_STATE'; payload: GameState | null | ((prevState: GameState | null) => GameState | null) }
  | { type: 'LOAD_BACKGROUND_START'; payload: { themeId: string } }
  | { type: 'LOAD_BACKGROUND_SUCCESS'; payload: { themeId: string; urls: any } }
  | { type: 'LOAD_BACKGROUND_ERROR'; payload: { themeId: string } }
  | { type: 'SET_ALL_CACHED_BACKGROUNDS'; payload: Record<string, any> }
  | { type: 'SET_INSTALLED_MODS'; payload: ModInLibrary[] }
  | { type: 'ADD_INSTALLED_MOD'; payload: ModInLibrary }
  | { type: 'UPDATE_INSTALLED_MODS'; payload: ModInLibrary[] }
  | { type: 'REMOVE_INSTALLED_MOD'; payload: string } // payload is modId
  | { type: 'SET_MOD_FOR_EDITING'; payload: FullMod | null }
  | { type: 'PLAYER_ACTION_PENDING'; payload: { text: string; type: 'say' | 'act' } }
  | { type: 'STREAMING_NARRATIVE_UPDATE'; payload: string }
  | { type: 'PLAYER_ACTION_RESOLVED'; payload: GameState }
  | { type: 'SET_PDF_TEXT_FOR_GENESIS'; payload: string | null }
  // Actions for Novelist AI
  | { type: 'SET_NOVELS'; payload: Novel[] }
  | { type: 'SET_ACTIVE_NOVEL_ID'; payload: number | null }
  | { type: 'UPDATE_NOVEL'; payload: Novel }
  // FIX: Add action to set current slot ID
  | { type: 'SET_CURRENT_SLOT_ID'; payload: number | null }
  | { type: 'SET_SETTINGS_SAVING_STATUS'; payload: 'idle' | 'saving' | 'saved' };


// The reducer function
export const gameReducer = (state: AppState, action: Action): AppState => {
    switch (action.type) {
        case 'NAVIGATE':
            return { ...state, view: action.payload };

        case 'SET_LOADING':
            if (!action.payload.isLoading) {
                return {
                    ...state,
                    isLoading: false,
                    loadingMessage: '',
                    loadingNarratives: null,
                };
            }
            return { 
                ...state, 
                isLoading: action.payload.isLoading, 
                loadingMessage: action.payload.message || (action.payload.isLoading ? state.loadingMessage : '') 
            };

        case 'SET_LOADING_NARRATIVES':
            return { ...state, loadingNarratives: action.payload };

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
        
        case 'LOAD_GAME':
            const loadedGameState = sanitizeGameState(action.payload.gameState);
            return { 
                ...state, 
                gameState: loadedGameState, 
                currentSlotId: action.payload.slotId, 
                view: 'gamePlay', 
                isLoading: false 
            };

        case 'QUIT_GAME':
            return { ...state, gameState: null, currentSlotId: null, view: 'mainMenu' };
        
        case 'UPDATE_GAME_STATE':
             let newGameState = typeof action.payload === 'function'
                ? (action.payload as (prevState: GameState | null) => GameState | null)(state.gameState)
                : action.payload;
             
             if (!state.gameState && !newGameState) return state;

             if (newGameState) {
                 newGameState = sanitizeGameState(newGameState);
             }

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
        
        case 'SET_INSTALLED_MODS':
            return { ...state, installedMods: action.payload };

        case 'ADD_INSTALLED_MOD':
            return { ...state, installedMods: [...state.installedMods, action.payload] };

        case 'UPDATE_INSTALLED_MODS':
            return { ...state, installedMods: action.payload };

        case 'REMOVE_INSTALLED_MOD':
            return { ...state, installedMods: state.installedMods.filter(mod => mod.modInfo.id !== action.payload) };

        case 'SET_MOD_FOR_EDITING':
            return { ...state, modBeingEdited: action.payload };

        case 'PLAYER_ACTION_PENDING':
            if (!state.gameState) return state;
            const lastId = state.gameState.storyLog.length > 0 ? state.gameState.storyLog[state.gameState.storyLog.length - 1].id : 0;
            const playerActionEntry: StoryEntry = {
                id: lastId + 1,
                type: action.payload.type === 'say' ? 'player-dialogue' : 'player-action',
                content: action.payload.text,
                isPending: true,
            };
            const aiNarrativePlaceholder: StoryEntry = {
                id: lastId + 2,
                type: 'narrative',
                content: '', // Start empty for streaming
            };
            return {
                ...state,
                gameState: {
                    ...state.gameState,
                    storyLog: [...state.gameState.storyLog, playerActionEntry, aiNarrativePlaceholder],
                },
            };

        case 'STREAMING_NARRATIVE_UPDATE':
            if (!state.gameState) return state;
            const newStoryLog = [...state.gameState.storyLog];
            const lastEntry = newStoryLog[newStoryLog.length - 1];
            if (lastEntry) {
                // Update the placeholder with streamed content
                lastEntry.content = action.payload;
            }
            return {
                ...state,
                gameState: {
                    ...state.gameState,
                    storyLog: newStoryLog,
                },
            };
        
        case 'PLAYER_ACTION_RESOLVED':
            return {
                ...state,
                gameState: action.payload,
            };
        
        case 'SET_PDF_TEXT_FOR_GENESIS':
            return { ...state, pdfTextForGenesis: action.payload };

        case 'SET_NOVELS':
            return { ...state, novels: action.payload };

        case 'SET_ACTIVE_NOVEL_ID':
            return { ...state, activeNovelId: action.payload };

        case 'UPDATE_NOVEL':
            const index = state.novels.findIndex(n => n.id === action.payload.id);
            if (index > -1) {
                const newNovels = [...state.novels];
                newNovels[index] = action.payload;
                return { ...state, novels: newNovels };
            }
            return { ...state, novels: [...state.novels, action.payload] };
        
        case 'SET_CURRENT_SLOT_ID':
            return { ...state, currentSlotId: action.payload };

        case 'SET_SETTINGS_SAVING_STATUS':
            return { ...state, settingsSavingStatus: action.payload };

        default:
            return state;
    }
};