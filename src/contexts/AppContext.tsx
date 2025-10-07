

import React, { useEffect, useCallback, createContext, useContext, FC, PropsWithChildren, useRef, useReducer, useState } from 'react';
import type { GameState, SaveSlot, GameSettings, FullMod, PlayerCharacter, NpcDensity, AIModel, DanhVong, DifficultyLevel, SpiritualRoot, PlayerVitals, StoryEntry, StatBonus, ItemType, ItemQuality, InventoryItem, EventChoice, EquipmentSlot, Currency, ModInLibrary, GenerationMode, WorldCreationData, ModAttributeSystem, NamedRealmSystem, GameplaySettings, DataGenerationMode, ModNpc, ModLocation, Faction } from '../types';
import { DEFAULT_SETTINGS, THEME_OPTIONS, CURRENT_GAME_VERSION, DEFAULT_ATTRIBUTE_DEFINITIONS, DEFAULT_ATTRIBUTE_GROUPS } from '../constants';
import { migrateGameState, createNewGameState, hydrateWorldData } from '../utils/gameStateManager';
import * as db from '../services/dbService';
import { apiKeyManager } from '../services/gemini/gemini.core';
import { gameReducer, AppState, Action } from './gameReducer';
import { processPlayerAction } from '../services/actionService';
import { generateAndCacheBackgroundSet } from '../services/gemini/asset.service';
import { generateCharacterFromPrompts, generateInitialWorldDetails } from '../services/gemini/character.service';
import { generateCompleteWorldFromText } from '../services/gemini/modding.service';

export type View = 'mainMenu' | 'saveSlots' | 'settings' | 'gamePlay' | 'info' | 'novelist' | 'loadGame' | 'aiTraining' | 'scripts' | 'createScript' | 'wikiScreen';

// FIX: Extend GameplaySettings to ensure all settings are passed during game creation.
export interface GameStartData extends GameplaySettings {
    identity: PlayerCharacter['identity'];
    npcDensity: NpcDensity;
    difficulty: DifficultyLevel;
    initialBonuses: StatBonus[];
    initialItems: { name: string; quantity: number; description: string; type: ItemType; quality: ItemQuality; icon: string; }[];
    spiritualRoot: SpiritualRoot;
    danhVong: DanhVong;
    initialCurrency?: Currency;
    generationMode: GenerationMode;
    attributeSystem?: ModAttributeSystem;
    namedRealmSystem?: NamedRealmSystem | null;
    genre: string;
    // New data generation controls
    npcGenerationMode: DataGenerationMode;
    locationGenerationMode: DataGenerationMode;
    factionGenerationMode: DataGenerationMode;
    customNpcs?: ModNpc[];
    customLocations?: ModLocation[];
    customFactions?: Faction[];
    // @FIX: Add missing 'dlcs' property to match its usage in `createNewGameState`.
    dlcs?: { title: string; content: string }[];
    // @FIX: Add missing 'openingStory' property to fix type error in createNewGameState.
    openingStory?: string;
}


interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<Action>;
    
    // Handlers
    handleNavigate: (targetView: View) => void;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
    handleDynamicBackgroundChange: (themeId: string) => Promise<void>;
    handleSettingsSave: () => Promise<void>;
    handleSlotSelection: (slotId: number) => void;
    handleSaveGame: () => Promise<void>;
    handleDeleteGame: (slotId: number) => Promise<void>;
    handleVerifyAndRepairSlot: (slotId: number) => Promise<void>;
    handleGameStart: (gameStartData: GameStartData) => Promise<void>;
    handleCreateAndStartGame: (worldCreationData: WorldCreationData, slotId: number) => Promise<void>;
    handleQuickCreateAndStartGame: (description: string, characterName: string, slotId: number) => Promise<void>;
    handlePlayerAction: (text: string, type: 'say' | 'act', apCost: number, showNotification: (message: string) => void) => Promise<void>;
    handleUpdatePlayerCharacter: (updater: (pc: PlayerCharacter) => PlayerCharacter) => void;
    handleSetActiveWorldId: (worldId: string) => Promise<void>;
    quitGame: () => void;
    speak: (text: string, force?: boolean) => void;
    cancelSpeech: () => void;
    // New Mod Handlers
    handleInstallMod: (modData: FullMod) => Promise<boolean>;
    handleToggleMod: (modId: string) => Promise<void>;
    handleDeleteModFromLibrary: (modId: string) => Promise<void>;
    handleEditWorld: (worldId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// FIX: Export useAppContext hook to resolve import errors in multiple components.
export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const initialState: AppState = {
    view: 'mainMenu',
    isLoading: false,
    loadingMessage: '',
    isMigratingData: true,
    migrationMessage: 'Kiểm tra hệ thống lưu trữ...',
    gameState: null,
    saveSlots: [],
    currentSlotId: null,
    settings: DEFAULT_SETTINGS,
    storageUsage: { usageString: '0 B / 0 B', percentage: 0 },
    activeWorldId: 'khoi_nguyen_gioi',
    backgrounds: { status: {}, urls: {} },
    installedMods: [],
    modBeingEdited: null,
    pdfTextForGenesis: null,
    // State for Novelist AI
    novels: [],
    activeNovelId: null,
    settingsSavingStatus: 'idle',
};

export const AppProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
    // --- PART 1: HOOKS (State, Refs) ---
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const abortControllerRef = useRef<AbortController | null>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasLoadedInitialSettings = useRef(false);

    // --- PART 2: CALLBACKS (Memoized Handlers) ---
    const speak = useCallback(async (text: string, force = false) => {
        if (!text || (!state.settings.enableTTS && !force)) return;

        window.speechSynthesis.cancel();
        if (ttsAudioRef.current) {
            ttsAudioRef.current.pause();
            ttsAudioRef.current.src = '';
        }

        if (state.settings.ttsProvider === 'elevenlabs') {
            const { elevenLabsApiKey, elevenLabsVoiceId, ttsVolume } = state.settings;
            if (!elevenLabsApiKey || !elevenLabsVoiceId) {
                console.warn("ElevenLabs TTS is enabled, but API key or Voice ID is missing.");
                return;
            }

            try {
                const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`, {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': elevenLabsApiKey,
                    },
                    body: JSON.stringify({
                        text: text,
                        model_id: 'eleven_multilingual_v2',
                        voice_settings: {
                            stability: 0.5,
                            similarity_boost: 0.75,
                        }
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`ElevenLabs API error: ${errorData.detail?.message || response.statusText}`);
                }

                const blob = await response.blob();
                if (ttsAudioRef.current) {
                    const url = URL.createObjectURL(blob);
                    ttsAudioRef.current.src = url;
                    ttsAudioRef.current.volume = ttsVolume;
                    ttsAudioRef.current.play();
                }
            } catch (error) {
                console.error("Error with ElevenLabs TTS:", error);
            }
        } else { // Browser TTS
            const utterance = new SpeechSynthesisUtterance(text);
            const selectedVoice = voices.find(v => v.voiceURI === state.settings.ttsVoiceURI);
            if (selectedVoice) utterance.voice = selectedVoice;
            utterance.rate = state.settings.ttsRate;
            utterance.pitch = state.settings.ttsPitch;
            utterance.volume = state.settings.ttsVolume;
            window.speechSynthesis.speak(utterance);
        }
    }, [state.settings, voices]);
    
    const cancelSpeech = useCallback(() => {
        window.speechSynthesis.cancel();
        if (ttsAudioRef.current) {
            ttsAudioRef.current.pause();
            ttsAudioRef.current.src = '';
        }
    }, []);

    const handleNavigate = useCallback((targetView: View) => {
        dispatch({ type: 'NAVIGATE', payload: targetView });
    }, []);

    const handleSettingChange = useCallback((key: keyof GameSettings, value: any) => {
        dispatch({ type: 'UPDATE_SETTING', payload: { key, value } });
    }, []);

    const handleSettingsSave = useCallback(async () => {
        dispatch({ type: 'SET_SETTINGS_SAVING_STATUS', payload: 'saving' });
        try {
            await db.saveSettings(state.settings);
            dispatch({ type: 'SET_SETTINGS_SAVING_STATUS', payload: 'saved' });
        } catch (error) {
            console.error("Failed to save settings:", error);
            dispatch({ type: 'SET_SETTINGS_SAVING_STATUS', payload: 'idle' });
        }
    }, [state.settings]);

    const handleDynamicBackgroundChange = useCallback(async (themeId: string) => {
        handleSettingChange('dynamicBackground', themeId);
        if (themeId === 'none' || state.backgrounds.status[themeId] === 'loaded') {
            return;
        }
        dispatch({ type: 'LOAD_BACKGROUND_START', payload: { themeId } });
        try {
            const urls = await generateAndCacheBackgroundSet(themeId);
            dispatch({ type: 'LOAD_BACKGROUND_SUCCESS', payload: { themeId, urls } });
        } catch (error) {
            console.error("Failed to generate background set:", error);
            dispatch({ type: 'LOAD_BACKGROUND_ERROR', payload: { themeId } });
        }
    }, [handleSettingChange, state.backgrounds.status]);

    const handleSlotSelection = useCallback(async (slotId: number) => {
        const selectedSlot = state.saveSlots.find(s => s.id === slotId);
        if (selectedSlot?.data) {
            dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Đang tải hành trình...' } });
            try {
                let migratedState = await migrateGameState(selectedSlot.data);
                
                // Hydrate world if needed
                if (!migratedState.isHydrated && migratedState.creationData) {
                    migratedState = await hydrateWorldData(migratedState, (msg) => dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: msg } }));
                    await db.saveGameState(slotId, migratedState); // Save hydrated state
                }
                
                dispatch({ type: 'LOAD_GAME', payload: { gameState: migratedState, slotId } });
            } catch (error: any) {
                console.error("Error loading or migrating game state:", error);
                alert(`Lỗi tải game: ${error.message}`);
                dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
            }
        } else {
             dispatch({ type: 'START_CHARACTER_CREATION', payload: slotId });
        }
    }, [state.saveSlots]);
    
    const handleSaveGame = useCallback(async () => {
        if (!state.gameState || state.currentSlotId === null) return;
        const saveIndicator = document.getElementById('save-indicator');
        if(saveIndicator) saveIndicator.classList.add('saving');
        try {
            const stateToSave = { ...state.gameState, lastSaved: new Date().toISOString() };
            await db.saveGameState(state.currentSlotId, stateToSave);
            dispatch({ type: 'UPDATE_GAME_STATE', payload: stateToSave });
            const allSlots = await db.getAllSaveSlots();
            dispatch({ type: 'SET_SAVE_SLOTS', payload: allSlots });
        } catch (error) {
            console.error('Error saving game:', error);
        } finally {
            setTimeout(() => {
                if(saveIndicator) saveIndicator.classList.remove('saving');
            }, 500);
        }
    }, [state.gameState, state.currentSlotId]);

    const handleDeleteGame = useCallback(async (slotId: number) => {
        if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn hành trình ở ô ${slotId}?`)) {
            await db.deleteGameState(slotId);
            await db.deleteMemoryForSlot(slotId); // Also delete associated memories
            const allSlots = await db.getAllSaveSlots();
            dispatch({ type: 'SET_SAVE_SLOTS', payload: allSlots });
        }
    }, []);

    const handleVerifyAndRepairSlot = useCallback(async (slotId: number) => {
        alert('Tính năng này sẽ được triển khai trong tương lai để kiểm tra và sửa lỗi file save.');
    }, []);

    const handleGameStart = useCallback(async (gameStartData: GameStartData) => {
        if (state.currentSlotId === null) return;
        handleNavigate('gamePlay');
    }, [state.currentSlotId]);

    const handleCreateAndStartGame = useCallback(async (worldCreationData: WorldCreationData, slotId: number) => {
        dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Đang tạo dữ liệu thế giới...' } });
        try {
            const installedMods = state.installedMods.filter(m => m.isEnabled);
            const activeMods = (await Promise.all(installedMods.map(m => db.getModContent(m.modInfo.id)))).filter((mod): mod is FullMod => !!mod);

            // @google-genai-fix: Construct a valid GameStartData object from WorldCreationData to match the expected type of createNewGameState.
            const gameStartData: GameStartData = {
                // Map GameplaySettings properties
                narrativeStyle: worldCreationData.narrativeStyle,
                aiResponseWordCount: worldCreationData.aiResponseWordCount,
                aiCreativityLevel: worldCreationData.aiCreativityLevel,
                narrativePacing: worldCreationData.narrativePacing,
                playerAgencyLevel: worldCreationData.playerAgencyLevel,
                aiMemoryDepth: worldCreationData.aiMemoryDepth,
                npcComplexity: worldCreationData.npcComplexity,
                worldEventFrequency: worldCreationData.worldEventFrequency,
                worldReactivity: worldCreationData.worldReactivity,
                cultivationRateMultiplier: worldCreationData.cultivationRateMultiplier,
                resourceRateMultiplier: worldCreationData.resourceRateMultiplier,
                damageDealtMultiplier: worldCreationData.damageDealtMultiplier,
                damageTakenMultiplier: worldCreationData.damageTakenMultiplier,
                enableSurvivalMechanics: worldCreationData.enableSurvivalMechanics,
                deathPenalty: worldCreationData.deathPenalty,
                validationServiceCap: worldCreationData.validationServiceCap,
                narrateSystemChanges: worldCreationData.narrateSystemChanges,
                worldInterruptionFrequency: worldCreationData.worldInterruptionFrequency,
                enableRealmSystem: worldCreationData.enableRealmSystem,
                enableStorySystem: worldCreationData.enableStorySystem,
            
                // Map and default properties specific to GameStartData
                identity: {
                    name: worldCreationData.character.name,
                    gender: worldCreationData.character.gender,
                    origin: worldCreationData.character.bio,
                    appearance: '', // To be filled by AI later
                    age: 18, // Default age
                    personality: 'Trung Lập', // Default personality
                },
                npcDensity: 'medium', // Default value as it's not in the new form
                difficulty: 'medium', // Default value as it's not in the new form
                initialBonuses: [], // Default value
                initialItems: [], // Default value
                spiritualRoot: { // Default value
                    elements: [],
                    quality: 'Phàm Căn',
                    name: 'Phàm Nhân',
                    description: 'Là một phàm nhân bình thường.',
                    bonuses: [],
                },
                danhVong: { value: 0, status: 'Vô danh tiểu tốt' }, // Default value
                initialCurrency: { 'Bạc': 50 }, // Default value
                generationMode: worldCreationData.generationMode,
                attributeSystem: worldCreationData.attributeSystem,
                namedRealmSystem: worldCreationData.namedRealmSystem,
                genre: worldCreationData.genre,
                npcGenerationMode: worldCreationData.npcGenerationMode,
                locationGenerationMode: worldCreationData.locationGenerationMode,
                factionGenerationMode: worldCreationData.factionGenerationMode,
                customNpcs: worldCreationData.customNpcs,
                customLocations: worldCreationData.customLocations,
                customFactions: worldCreationData.customFactions,
                dlcs: worldCreationData.dlcs,
                openingStory: worldCreationData.openingStory,
            };

            const newGameState = await createNewGameState(gameStartData, activeMods, state.activeWorldId, (msg) => dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: msg } }));
            
            // Hydration is now a separate step, happens after load or just after create
            const hydratedGameState = await hydrateWorldData(newGameState, (msg) => dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: msg } }));
            
            await db.saveGameState(slotId, hydratedGameState);
            const allSlots = await db.getAllSaveSlots();
            dispatch({ type: 'SET_SAVE_SLOTS', payload: allSlots });
            dispatch({ type: 'LOAD_GAME', payload: { gameState: hydratedGameState, slotId } });
        } catch (error: any) {
            console.error('Failed to create new game:', error);
            alert(`Lỗi tạo thế giới: ${error.message}`);
            dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
        }
    }, [state.installedMods, state.activeWorldId]);

    const handleQuickCreateAndStartGame = useCallback(async (description: string, characterName: string, slotId: number) => {
        dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Đấng Sáng Thế đang kiến tạo vũ trụ...' } });
        try {
            const { mod, characterData, openingNarrative, familyNpcs, dynamicNpcs, relationships } = await generateCompleteWorldFromText(description, characterName, 'fast');

            const gameStartData: GameStartData = {
                ...DEFAULT_SETTINGS, // Start with default gameplay settings
                identity: characterData.identity,
                npcDensity: 'medium',
                difficulty: 'medium',
                initialBonuses: characterData.initialBonuses,
                initialItems: characterData.initialItems,
                spiritualRoot: characterData.spiritualRoot,
                danhVong: { value: 0, status: 'Vô danh tiểu tốt' },
                initialCurrency: characterData.initialCurrency,
                generationMode: 'fast',
                attributeSystem: mod.content.attributeSystem,
                namedRealmSystem: mod.content.namedRealmSystems?.[0],
                genre: mod.modInfo.tags?.[0] || 'Huyền Huyễn',
                npcGenerationMode: 'CUSTOM',
                locationGenerationMode: 'CUSTOM',
                factionGenerationMode: 'CUSTOM',
                // @google-genai-fix: Ensure all elements in customNpcs array conform to the ModNpc type by adding missing 'id' and mapping NPC objects correctly.
                customNpcs: [
                    ...(mod.content.worldData?.[0]?.initialNpcs || []).map((n, i) => ({ ...n, id: n.id || `gen_npc_${i}` })),
                    ...dynamicNpcs.map((n): ModNpc => ({
                        id: n.id,
                        name: n.identity.name,
                        status: n.status,
                        description: n.identity.appearance,
                        origin: n.identity.origin,
                        personality: n.identity.personality,
                        locationId: n.locationId,
                        tags: [],
                    }))
                ],
                // @google-genai-fix: Ensure all elements in customLocations array conform to the ModLocation type by providing a fallback 'id'.
                customLocations: (mod.content.worldData?.[0]?.initialLocations || []).map(loc => ({
                    ...loc,
                    id: loc.id || loc.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, '')
                })),
                customFactions: mod.content.worldData?.[0]?.factions,
                openingStory: openingNarrative,
            };
            
            const newGameState = await createNewGameState(gameStartData, [mod], mod.modInfo.id, (msg) => dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: msg }}));
            
            const finalGameState: GameState = {
                ...newGameState,
                activeNpcs: [...newGameState.activeNpcs, ...familyNpcs],
                playerCharacter: {
                    ...newGameState.playerCharacter,
                    relationships: [...newGameState.playerCharacter.relationships, ...relationships]
                },
                storyLog: [{...(newGameState.storyLog[0] || {id: 1, type: 'narrative', content: ''}), content: openingNarrative}],
                isHydrated: true,
            };
            delete finalGameState.creationData;

            await db.saveGameState(slotId, finalGameState);
            const allSlots = await db.getAllSaveSlots();
            dispatch({ type: 'SET_SAVE_SLOTS', payload: allSlots });
            dispatch({ type: 'LOAD_GAME', payload: { gameState: finalGameState, slotId } });

        } catch(e: any) {
            console.error("Quick create failed:", e);
            alert(`Tạo nhanh thất bại: ${e.message}`);
            dispatch({ type: 'SET_LOADING', payload: { isLoading: false }});
        }
    }, []);

    const handlePlayerAction = useCallback(async (text: string, type: 'say' | 'act', apCost: number, showNotification: (message: string) => void) => {
        if (!state.gameState || state.isLoading || state.currentSlotId === null) return;

        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        dispatch({ type: 'PLAYER_ACTION_PENDING', payload: { text, type } });
        dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'AI đang suy nghĩ...' } });

        try {
            const onStreamUpdate = (content: string) => dispatch({ type: 'STREAMING_NARRATIVE_UPDATE', payload: content });
            
            const { finalState, narrativeEntryPayload } = await processPlayerAction(state.gameState, text, type, apCost, state.settings, showNotification, abortControllerRef.current.signal, state.currentSlotId, onStreamUpdate);

            dispatch({ type: 'PLAYER_ACTION_RESOLVED', payload: { finalState, narrativeEntryPayload } });
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Error processing player action:", error);
                const errorEntry: StoryEntry = { id: Date.now(), type: 'system', content: `[Lỗi hệ thống: ${error.message}]` };
                dispatch({ type: 'UPDATE_GAME_STATE', payload: (gs) => gs ? { ...gs, storyLog: [...gs.storyLog.filter(e => !e.isPending), errorEntry] } : null });
            }
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
        }
    }, [state.gameState, state.isLoading, state.settings, state.currentSlotId]);

    const handleUpdatePlayerCharacter = useCallback((updater: (pc: PlayerCharacter) => PlayerCharacter) => {
        dispatch({ type: 'UPDATE_GAME_STATE', payload: (gs) => gs ? { ...gs, playerCharacter: updater(gs.playerCharacter) } : null });
    }, []);

    const quitGame = useCallback(() => {
        if (window.confirm("Bạn có muốn lưu trước khi thoát không?")) {
            handleSaveGame().then(() => dispatch({ type: 'QUIT_GAME' }));
        } else {
            dispatch({ type: 'QUIT_GAME' });
        }
    }, [handleSaveGame]);

    const handleSetActiveWorldId = useCallback(async (worldId: string) => {
        await db.setActiveWorldId(worldId);
        dispatch({ type: 'SET_ACTIVE_WORLD_ID', payload: worldId });
    }, []);

    const handleInstallMod = useCallback(async (modData: FullMod): Promise<boolean> => {
        try {
            const libraryEntry: ModInLibrary = { modInfo: modData.modInfo, isEnabled: false };
            await db.saveModToLibrary(libraryEntry);
            await db.saveModContent(modData.modInfo.id, modData);
            dispatch({ type: 'ADD_INSTALLED_MOD', payload: libraryEntry });
            return true;
        } catch (error) {
            console.error("Failed to install mod:", error);
            return false;
        }
    }, []);

    const handleToggleMod = useCallback(async (modId: string) => {
        const updatedMods = state.installedMods.map(mod => mod.modInfo.id === modId ? { ...mod, isEnabled: !mod.isEnabled } : mod);
        await db.saveModLibrary(updatedMods);
        dispatch({ type: 'SET_INSTALLED_MODS', payload: updatedMods });
    }, [state.installedMods]);

    const handleDeleteModFromLibrary = useCallback(async (modId: string) => {
        if (!window.confirm("Bạn có chắc muốn xóa vĩnh viễn mod này khỏi thư viện?")) return;
        try {
            await db.deleteModFromLibrary(modId);
            await db.deleteModContent(modId);
            dispatch({ type: 'REMOVE_INSTALLED_MOD', payload: modId });
        } catch (error) {
            console.error("Failed to delete mod:", error);
        }
    }, []);
    
    // FIX: Explicitly typed 'worldId' as 'string' to resolve 'unknown' type error and removed suppressive @ts-ignore.
    const handleEditWorld = useCallback(async (worldId: string) => {
        // This is a placeholder for a more complex feature
        alert(`Chỉnh sửa thế giới '${worldId}' chưa được hỗ trợ.`);
    }, []);

    // --- PART 3: EFFECTS ---

    // Initial load
    useEffect(() => {
        const init = async () => {
            dispatch({ type: 'SET_MIGRATION_STATE', payload: { isMigrating: true, message: 'Đang khởi tạo cơ sở dữ liệu...' } });
            
            const [settings, saveSlots, activeWorldId, cachedBgs, installedMods] = await Promise.all([
                db.getSettings(),
                db.getAllSaveSlots(),
                db.getActiveWorldId(),
                db.getAllAssets(),
                db.getModLibrary()
            ]);
            
            dispatch({ type: 'SET_SETTINGS', payload: settings || DEFAULT_SETTINGS });
            dispatch({ type: 'SET_SAVE_SLOTS', payload: saveSlots });
            dispatch({ type: 'SET_ACTIVE_WORLD_ID', payload: activeWorldId });
            dispatch({ type: 'SET_ALL_CACHED_BACKGROUNDS', payload: cachedBgs });
            dispatch({ type: 'SET_INSTALLED_MODS', payload: installedMods });
            
            hasLoadedInitialSettings.current = true;
            dispatch({ type: 'SET_MIGRATION_STATE', payload: { isMigrating: false } });
        };
        init();
        
        // Setup audio context
        if (!ttsAudioRef.current) ttsAudioRef.current = new Audio();
        
    }, []);

    // Effect for background music
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.loop = true;
        }

        const audio = audioRef.current;
        const { backgroundMusicUrl, backgroundMusicVolume } = state.settings;

        if (backgroundMusicUrl && audio.src !== backgroundMusicUrl) {
            audio.src = backgroundMusicUrl;
            audio.load();
            audio.play().catch(error => console.warn("Lỗi tự động phát nhạc nền: Trình duyệt có thể đã chặn âm thanh tự động. Vui lòng tương tác với trang trước.", error));
        } else if (!backgroundMusicUrl && audio.src) {
            audio.pause();
            audio.src = '';
        }

        if (audio) {
            audio.volume = backgroundMusicVolume;
        }

    }, [state.settings.backgroundMusicUrl, state.settings.backgroundMusicVolume]);

    // Update API Key Manager when settings change
    useEffect(() => {
        apiKeyManager.updateKeys(state.settings.apiKeys);
        apiKeyManager.updateModelRotationSetting(state.settings.enableAutomaticModelRotation);
    }, [state.settings.apiKeys, state.settings.enableAutomaticModelRotation]);
    
    // Auto-save settings on change
    useEffect(() => {
        if (!hasLoadedInitialSettings.current) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        dispatch({ type: 'SET_SETTINGS_SAVING_STATUS', payload: 'saving' });
        saveTimeoutRef.current = setTimeout(() => {
            handleSettingsSave();
        }, 1500);
        return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current) };
    }, [state.settings, handleSettingsSave]);
    
    // Update Theme & CSS Variables
    useEffect(() => {
        document.documentElement.className = state.settings.theme;
        const root = document.documentElement;
        if (state.settings.theme === 'theme-custom') {
            for (const [key, value] of Object.entries(state.settings.customThemeColors)) {
                root.style.setProperty(key, value);
            }
        }
    }, [state.settings.theme, state.settings.customThemeColors]);

    // Apply global UI settings like zoom and text color
    useEffect(() => {
        const root = document.documentElement;
        root.style.fontSize = `${state.settings.zoomLevel}%`;
        root.style.setProperty('--text-color', state.settings.textColor);
    }, [state.settings.zoomLevel, state.settings.textColor]);
    
    // Calculate storage usage
    useEffect(() => {
        const calculateUsage = async () => {
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                const usage = estimate.usage || 0;
                const quota = estimate.quota || 1;
                dispatch({
                    type: 'SET_STORAGE_USAGE',
                    payload: {
                        usageString: `${formatBytes(usage)} / ${formatBytes(quota)}`,
                        percentage: (usage / quota) * 100
                    }
                });
            }
        };
        const interval = setInterval(calculateUsage, 10000);
        calculateUsage();
        return () => clearInterval(interval);
    }, []);


    // --- PART 4: CONTEXT VALUE & RENDER ---

    const contextValue: AppContextType = {
        state,
        dispatch,
        handleNavigate,
        handleSettingChange,
        handleDynamicBackgroundChange,
        handleSettingsSave,
        handleSlotSelection,
        handleSaveGame,
        handleDeleteGame,
        handleVerifyAndRepairSlot,
        handleGameStart,
        handleCreateAndStartGame,
        handleQuickCreateAndStartGame,
        handlePlayerAction,
        handleUpdatePlayerCharacter,
        handleSetActiveWorldId,
        quitGame,
        speak,
        cancelSpeech,
        handleInstallMod,
        handleToggleMod,
        handleDeleteModFromLibrary,
        handleEditWorld,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};