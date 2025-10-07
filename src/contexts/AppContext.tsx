import React, { useEffect, useCallback, createContext, useContext, FC, PropsWithChildren, useRef, useReducer, useState } from 'react';
// FIX: Import missing types GameStartData and ModNpc
import type { GameState, SaveSlot, GameSettings, FullMod, ModInLibrary, WorldCreationData, GameStartData, ModNpc } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { migrateGameState, createNewGameState, hydrateWorldData } from '../utils/gameStateManager';
import * as db from '../services/dbService';
import { apiKeyManager } from '../services/gemini/gemini.core';
import { gameReducer, AppState, Action } from './gameReducer';
import { generateAndCacheBackgroundSet } from '../services/gemini/asset.service';
import { generateCompleteWorldFromText } from '../services/gemini/modding.service';

export type View = 'mainMenu' | 'saveSlots' | 'settings' | 'gamePlay' | 'info' | 'novelist' | 'loadGame' | 'aiTraining' | 'scripts' | 'createScript' | 'wikiScreen';

interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<Action>;
    
    // Handlers
    handleNavigate: (targetView: View) => void;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
    handleDynamicBackgroundChange: (themeId: string) => Promise<void>;
    handleSettingsSave: () => Promise<void>;
    handleSlotSelection: (slotId: number) => void;
    handleDeleteGame: (slotId: number) => Promise<void>;
    handleVerifyAndRepairSlot: (slotId: number) => Promise<void>;
    handleCreateAndStartGame: (worldCreationData: WorldCreationData, slotId: number) => Promise<void>;
    handleQuickCreateAndStartGame: (description: string, characterName: string, slotId: number) => Promise<void>;
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
    novels: [],
    activeNovelId: null,
    settingsSavingStatus: 'idle',
};

export const AppProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasLoadedInitialSettings = useRef(false);

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
                    headers: { 'Accept': 'audio/mpeg', 'Content-Type': 'application/json', 'xi-api-key': elevenLabsApiKey },
                    body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
                });

                if (!response.ok) throw new Error(`ElevenLabs API error: ${response.statusText}`);

                const blob = await response.blob();
                if (ttsAudioRef.current) {
                    const url = URL.createObjectURL(blob);
                    ttsAudioRef.current.src = url;
                    ttsAudioRef.current.volume = ttsVolume;
                    ttsAudioRef.current.play();
                }
            } catch (error: any) {
                console.error("Error with ElevenLabs TTS:", error);
            }
        } else {
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
        } catch (error: any) {
            console.error("Failed to save settings:", error);
            dispatch({ type: 'SET_SETTINGS_SAVING_STATUS', payload: 'idle' });
        }
    }, [state.settings]);

    const handleDynamicBackgroundChange = useCallback(async (themeId: string) => {
        handleSettingChange('dynamicBackground', themeId);
        if (themeId === 'none' || state.backgrounds.status[themeId] === 'loaded') return;
        dispatch({ type: 'LOAD_BACKGROUND_START', payload: { themeId } });
        try {
            const urls = await generateAndCacheBackgroundSet(themeId);
            dispatch({ type: 'LOAD_BACKGROUND_SUCCESS', payload: { themeId, urls } });
        } catch (error: any) {
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
                
                if (!migratedState.isHydrated && migratedState.creationData) {
                    migratedState = await hydrateWorldData(migratedState, (msg) => dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: msg } }));
                    await db.saveGameState(slotId, migratedState);
                }
                
                dispatch({ type: 'LOAD_GAME', payload: { gameState: migratedState, slotId } });
            } catch (error: any) {
                const message = error instanceof Error ? error.message : String(error);
                console.error("Error loading or migrating game state:", error);
                alert(`Lỗi tải game: ${message}`);
                dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
            }
        } else {
             dispatch({ type: 'START_CHARACTER_CREATION', payload: slotId });
        }
    }, [state.saveSlots]);
    
    const handleDeleteGame = useCallback(async (slotId: number) => {
        if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn hành trình ở ô ${slotId}?`)) {
            await db.deleteGameState(slotId);
            await db.deleteMemoryForSlot(slotId);
            const allSlots = await db.getAllSaveSlots();
            dispatch({ type: 'SET_SAVE_SLOTS', payload: allSlots });
        }
    }, []);

    const handleVerifyAndRepairSlot = useCallback(async (slotId: number) => {
        alert('Tính năng này sẽ được triển khai trong tương lai để kiểm tra và sửa lỗi file save.');
    }, []);

    const handleCreateAndStartGame = useCallback(async (worldCreationData: WorldCreationData, slotId: number) => {
        dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Đang tạo dữ liệu thế giới...' } });
        try {
            const installedMods = state.installedMods.filter(m => m.isEnabled);
            let activeMods = (await Promise.all(installedMods.map(m => db.getModContent(m.modInfo.id)))).filter((mod): mod is FullMod => !!mod);

            if (worldCreationData.importedMod) {
                activeMods = activeMods.filter(m => m.modInfo.id !== worldCreationData.importedMod!.modInfo.id);
                activeMods.unshift(worldCreationData.importedMod);
            }

            const gameStartData: GameStartData = {
                ...worldCreationData,
                identity: { name: worldCreationData.character.name, gender: worldCreationData.character.gender, origin: worldCreationData.character.bio, appearance: '', age: 18, personality: 'Trung Lập' },
                npcDensity: 'medium', difficulty: 'medium', initialBonuses: [], initialItems: [],
                spiritualRoot: { elements: [], quality: 'Phàm Căn', name: 'Phàm Nhân', description: 'Là một phàm nhân bình thường.', bonuses: [] },
                danhVong: { value: 0, status: 'Vô danh tiểu tốt' }, initialCurrency: { 'Bạc': 50 },
            };

            const newGameState = await createNewGameState(gameStartData, activeMods, state.activeWorldId, (msg) => dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: msg } }));
            
            const hydratedGameState = await hydrateWorldData(newGameState, (msg) => dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: msg } }));
            
            await db.saveGameState(slotId, hydratedGameState);
            const allSlots = await db.getAllSaveSlots();
            dispatch({ type: 'SET_SAVE_SLOTS', payload: allSlots });
            dispatch({ type: 'LOAD_GAME', payload: { gameState: hydratedGameState, slotId } });
        } catch (error: any) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('Failed to create new game:', error);
            alert(`Lỗi tạo thế giới: ${message}`);
            dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
        }
    }, [state.installedMods, state.activeWorldId]);

    const handleQuickCreateAndStartGame = useCallback(async (description: string, characterName: string, slotId: number) => {
        dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Đấng Sáng Thế đang kiến tạo vũ trụ...' } });
        try {
            const { mod, characterData, openingNarrative, familyNpcs, dynamicNpcs, relationships } = await generateCompleteWorldFromText(description, characterName, 'fast');

// @google-genai-fix: Added missing properties to 'gameStartData' to satisfy the 'GameStartData' type, preventing a TypeScript error.
            const gameStartData: GameStartData = {
                ...DEFAULT_SETTINGS,
                // Properties from WorldCreationData
                setting: mod.modInfo.description || `Một thế giới được tạo bởi AI dựa trên: ${description}`,
                mainGoal: '', // Quick create is a sandbox experience
                importedMod: null, // The mod itself is passed as an activeMod, not imported via this prop
                fanficMode: false,
                hardcoreMode: false,
                character: {
                    name: characterName,
                    gender: characterData.identity.gender,
                    bio: characterData.identity.origin,
                },
                theme: DEFAULT_SETTINGS.theme,
                realmTemplateId: mod.content.namedRealmSystems?.[0]?.id || 'custom',
                dlcs: [],
                
                // Existing/Overwritten properties
                identity: characterData.identity,
                npcDensity: 'medium', difficulty: 'medium', initialBonuses: characterData.initialBonuses, initialItems: characterData.initialItems,
                spiritualRoot: characterData.spiritualRoot, danhVong: { value: 0, status: 'Vô danh tiểu tốt' }, initialCurrency: characterData.initialCurrency,
                generationMode: 'fast', attributeSystem: mod.content.attributeSystem, namedRealmSystem: mod.content.namedRealmSystems?.[0], genre: mod.modInfo.tags?.[0] || 'Huyền Huyễn',
                npcGenerationMode: 'CUSTOM', locationGenerationMode: 'CUSTOM', factionGenerationMode: 'CUSTOM',
                customNpcs: [...(mod.content.worldData?.[0]?.initialNpcs || []).map((n, i) => ({ ...n, id: n.id || `gen_npc_${i}` })), ...dynamicNpcs.map((n): ModNpc => ({ id: n.id, name: n.identity.name, status: n.status, description: n.identity.appearance, origin: n.identity.origin, personality: n.identity.personality, locationId: n.locationId, tags: [] }))],
                customLocations: (mod.content.worldData?.[0]?.initialLocations || []).map(loc => ({ ...loc, id: loc.id || loc.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, '') })),
                customFactions: mod.content.worldData?.[0]?.factions || [], 
                openingStory: openingNarrative,
            };
            
            const newGameState = await createNewGameState(gameStartData, [mod], mod.modInfo.id, (msg) => dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: msg }}));
            
            const finalGameState: GameState = {
                ...newGameState,
                activeNpcs: [...newGameState.activeNpcs, ...familyNpcs],
                playerCharacter: { ...newGameState.playerCharacter, relationships: [...newGameState.playerCharacter.relationships, ...relationships] },
                storyLog: [{...(newGameState.storyLog[0] || {id: 1, type: 'narrative', content: ''}), content: openingNarrative}], isHydrated: true,
            };
            delete finalGameState.creationData;

            await db.saveGameState(slotId, finalGameState);
            const allSlots = await db.getAllSaveSlots();
            dispatch({ type: 'SET_SAVE_SLOTS', payload: allSlots });
            dispatch({ type: 'LOAD_GAME', payload: { gameState: finalGameState, slotId } });

        } catch(e: any) {
            const message = e instanceof Error ? e.message : String(e);
            console.error("Quick create failed:", e);
            alert(`Tạo nhanh thất bại: ${message}`);
            dispatch({ type: 'SET_LOADING', payload: { isLoading: false }});
        }
    }, []);

    const quitGame = useCallback(() => {
        dispatch({ type: 'QUIT_GAME' });
    }, []);

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
        } catch (error: any) {
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
        } catch (error: any) {
            // FIX: Explicitly type the caught error as 'any' to resolve the 'unknown' type error when passing it to console.error.
            console.error("Failed to delete mod:", error);
        }
    }, [state.installedMods]);
    
    const handleEditWorld = useCallback(async (worldId: string) => {
        alert(`Chỉnh sửa thế giới '${worldId}' chưa được hỗ trợ.`);
    }, []);

    useEffect(() => {
        const init = async () => {
            dispatch({ type: 'SET_MIGRATION_STATE', payload: { isMigrating: true, message: 'Đang khởi tạo cơ sở dữ liệu...' } });
            
            const [settings, saveSlots, activeWorldId, cachedBgs, installedMods] = await Promise.all([
                db.getSettings(), db.getAllSaveSlots(), db.getActiveWorldId(), db.getAllAssets(), db.getModLibrary()
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
        
        if (!ttsAudioRef.current) ttsAudioRef.current = new Audio();
        
    }, []);

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.loop = true;
        }
        const { backgroundMusicUrl, backgroundMusicVolume } = state.settings;
        if (backgroundMusicUrl && audioRef.current.src !== backgroundMusicUrl) {
            audioRef.current.src = backgroundMusicUrl;
            audioRef.current.play().catch(e => console.warn("Lỗi tự động phát nhạc:", e));
        } else if (!backgroundMusicUrl && audioRef.current.src) {
            audioRef.current.pause();
            audioRef.current.src = '';
        }
        audioRef.current.volume = backgroundMusicVolume;
    }, [state.settings.backgroundMusicUrl, state.settings.backgroundMusicVolume]);

    useEffect(() => {
        apiKeyManager.updateKeys(state.settings.apiKeys);
        apiKeyManager.updateModelRotationSetting(state.settings.enableAutomaticModelRotation);
    }, [state.settings.apiKeys, state.settings.enableAutomaticModelRotation]);
    
    useEffect(() => {
        if (!hasLoadedInitialSettings.current) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        dispatch({ type: 'SET_SETTINGS_SAVING_STATUS', payload: 'saving' });
        saveTimeoutRef.current = setTimeout(() => {
            handleSettingsSave();
        }, 1500);
        return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current) };
    }, [state.settings, handleSettingsSave]);
    
    useEffect(() => {
        document.documentElement.className = state.settings.theme;
        const root = document.documentElement;
        if (state.settings.theme === 'theme-custom') {
            for (const [key, value] of Object.entries(state.settings.customThemeColors)) {
                root.style.setProperty(key, value);
            }
        }
    }, [state.settings.theme, state.settings.customThemeColors]);

    useEffect(() => {
        const root = document.documentElement;
        root.style.fontSize = `${state.settings.zoomLevel}%`;
        root.style.setProperty('--text-color', state.settings.textColor);
    }, [state.settings.zoomLevel, state.settings.textColor]);
    
    useEffect(() => {
        const calculateUsage = async () => {
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                const usage = estimate.usage || 0;
                const quota = estimate.quota || 1;
                dispatch({ type: 'SET_STORAGE_USAGE', payload: { usageString: `${formatBytes(usage)} / ${formatBytes(quota)}`, percentage: (usage / quota) * 100 } });
            }
        };
        const interval = setInterval(calculateUsage, 10000);
        calculateUsage();
        return () => clearInterval(interval);
    }, []);

    const contextValue: AppContextType = {
        state, dispatch, handleNavigate, handleSettingChange, handleDynamicBackgroundChange, handleSettingsSave,
        handleSlotSelection, handleDeleteGame, handleVerifyAndRepairSlot, handleCreateAndStartGame,
        handleQuickCreateAndStartGame, handleSetActiveWorldId, quitGame, speak, cancelSpeech,
        handleInstallMod, handleToggleMod, handleDeleteModFromLibrary, handleEditWorld,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};