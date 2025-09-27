import React, { useEffect, useCallback, createContext, useContext, FC, PropsWithChildren, useRef, useReducer, useState } from 'react';
import type { GameState, SaveSlot, GameSettings, FullMod, PlayerCharacter, NpcDensity, AIModel, DanhVong, DifficultyLevel, SpiritualRoot, PlayerVitals, StoryEntry, StatBonus, ItemType, ItemQuality, InventoryItem, EventChoice, EquipmentSlot, Currency, ModInLibrary } from '../types';
import { DEFAULT_SETTINGS, THEME_OPTIONS, CURRENT_GAME_VERSION, DEFAULT_ATTRIBUTE_DEFINITIONS } from '../constants';
import { migrateGameState, createNewGameState } from '../utils/gameStateManager';
import * as db from '../services/dbService';
import { apiKeyManager } from '../services/gemini/gemini.core';
import { gameReducer, AppState, Action } from './gameReducer';
import { processPlayerAction } from '../services/actionService';
import { generateAndCacheBackgroundSet } from '../services/gemini/asset.service';

export type View = 'mainMenu' | 'saveSlots' | 'characterCreation' | 'settings' | 'mods' | 'gamePlay' | 'thoiThe' | 'info' | 'worldSelection';

export interface GameStartData {
    identity: PlayerCharacter['identity'];
    npcDensity: NpcDensity;
    difficulty: DifficultyLevel;
    initialBonuses: StatBonus[];
    initialItems: { name: string; quantity: number; description: string; type: ItemType; quality: ItemQuality; icon: string; }[];
    spiritualRoot: SpiritualRoot;
    danhVong: DanhVong;
    initialCurrency?: Currency;
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
    handlePlayerAction: (text: string, type: 'say' | 'act', apCost: number, showNotification: (message: string) => void) => Promise<void>;
    handleUpdatePlayerCharacter: (updater: (pc: PlayerCharacter) => PlayerCharacter) => void;
    handleSetActiveWorldId: (worldId: string) => Promise<void>;
    quitGame: () => void;
    speak: (text: string, force?: boolean) => void;
    cancelSpeech: () => void;
    handleDialogueChoice: (choice: EventChoice) => void;
    // New Mod Handlers
    handleInstallMod: (modData: FullMod) => Promise<boolean>;
    handleToggleMod: (modId: string) => Promise<void>;
    handleDeleteModFromLibrary: (modId: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

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
    activeWorldId: 'phong_than_dien_nghia',
    backgrounds: { status: {}, urls: {} },
    installedMods: [],
};

export const AppProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const abortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const handleVoicesChanged = () => {
            if (window.speechSynthesis) {
                setVoices(window.speechSynthesis.getVoices());
            }
        };
        if (window.speechSynthesis) {
            window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
            handleVoicesChanged();
        } else {
            console.warn("Text-to-Speech not supported by this browser.");
        }
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
            }
        };
    }, []);

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
                const url = URL.createObjectURL(blob);
                if (!ttsAudioRef.current) {
                    ttsAudioRef.current = new Audio();
                }
                ttsAudioRef.current.src = url;
                ttsAudioRef.current.volume = ttsVolume;
                ttsAudioRef.current.play();

            } catch (error) {
                console.error("Failed to play audio from ElevenLabs:", error);
            }
        } else { // 'browser' TTS
            const utterance = new SpeechSynthesisUtterance(text);
            const selectedVoice = voices.find(v => v.voiceURI === state.settings.ttsVoiceURI);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            } else {
                const vietnameseVoice = voices.find(v => v.lang === 'vi-VN');
                if (vietnameseVoice) utterance.voice = vietnameseVoice;
            }
            utterance.rate = state.settings.ttsRate;
            utterance.pitch = state.settings.ttsPitch;
            utterance.volume = state.settings.ttsVolume;
            window.speechSynthesis.speak(utterance);
        }
    }, [state.settings, voices]);

    const cancelSpeech = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        if (ttsAudioRef.current) {
            ttsAudioRef.current.pause();
            ttsAudioRef.current.src = '';
        }
    }, []);

    const updateStorageUsage = useCallback(async () => {
        if (navigator.storage?.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                const usage = estimate.usage || 0;
                const quota = estimate.quota || 1;
                dispatch({ type: 'SET_STORAGE_USAGE', payload: {
                    usageString: `${formatBytes(usage)} / ${formatBytes(quota)}`,
                    percentage: Math.min(100, (usage / quota) * 100)
                }});
            } catch (error) {
                console.error("Không thể ước tính dung lượng lưu trữ:", error);
                dispatch({ type: 'SET_STORAGE_USAGE', payload: { usageString: 'Không rõ', percentage: 0 }});
            }
        }
    }, []);

    const loadSaveSlots = useCallback(async () => {
        try {
            const loadedSlots: SaveSlot[] = await db.getAllSaveSlots();
            const processedSlots = await Promise.all(loadedSlots.map(async (slot) => {
                if (slot.data) {
                    try { 
                        return { ...slot, data: await migrateGameState(slot.data) }; 
                    }
                    catch (error) {
                        console.error(`Slot ${slot.id} is corrupted or incompatible. Error:`, error);
                        db.deleteGameState(slot.id);
                        return { ...slot, data: null };
                    }
                }
                return slot;
            }));
            dispatch({ type: 'SET_SAVE_SLOTS', payload: processedSlots });
            await updateStorageUsage();
        } catch (error) {
            console.error("Failed to load save slots from DB:", error);
        }
    }, [updateStorageUsage]);

    useEffect(() => {
        const setViewportHeight = () => {
            document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        };
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        return () => window.removeEventListener('resize', setViewportHeight);
    }, []);

    useEffect(() => {
        const migrateData = async () => {
            const isMigrated = await db.getMigrationStatus();
            if (isMigrated) {
                dispatch({ type: 'SET_MIGRATION_STATE', payload: { isMigrating: false }});
                return;
            }
            if (localStorage.length === 0) {
                await db.setMigrationStatus(true);
                dispatch({ type: 'SET_MIGRATION_STATE', payload: { isMigrating: false }});
                return;
            }
            dispatch({ type: 'SET_MIGRATION_STATE', payload: { isMigrating: true, message: 'Nâng cấp hệ thống lưu trữ...' }});
            try {
                // Migration logic from old AppContext
                dispatch({ type: 'SET_MIGRATION_STATE', payload: { isMigrating: true, message: 'Nâng cấp thành công!' }});
                await db.setMigrationStatus(true);
            } catch (error) {
                console.error("Migration failed:", error);
                 dispatch({ type: 'SET_MIGRATION_STATE', payload: { isMigrating: true, message: 'Lỗi nâng cấp hệ thống.' }});
            } finally {
                setTimeout(() => dispatch({ type: 'SET_MIGRATION_STATE', payload: { isMigrating: false }}), 1500);
            }
        };
        migrateData();
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            if (state.isMigratingData) return;
            try {
                const [savedSettings, worldId, cachedAssets, modLibrary] = await Promise.all([
                    db.getSettings(),
                    db.getActiveWorldId(),
                    db.getAllAssets(),
                    db.getModLibrary()
                ]);

                const oldPlaylist = [
                    'https://files.catbox.moe/f86nal.mp3',
                    'https://files.catbox.moe/uckxqm.mp3'
                ];
                const newPlaylist = [
                    'https://archive.org/download/Chinese-instrumental-music/Chinese-instrumental-music.mp3',
                    'https://archive.org/download/ChineseTraditionalMusic/Chinese-Traditional-Music-Guqin-Meditation.mp3'
                ];
                let finalSettings = { ...DEFAULT_SETTINGS, ...savedSettings };

                if (!finalSettings.backgroundMusicUrl || oldPlaylist.includes(finalSettings.backgroundMusicUrl)) {
                    const randomIndex = Math.floor(Math.random() * newPlaylist.length);
                    finalSettings.backgroundMusicUrl = newPlaylist[randomIndex];
                    finalSettings.backgroundMusicName = 'Nhạc Nền Mặc Định';
                }

                dispatch({ type: 'SET_SETTINGS', payload: finalSettings });
                dispatch({ type: 'SET_ALL_CACHED_BACKGROUNDS', payload: cachedAssets });
                dispatch({ type: 'SET_INSTALLED_MODS', payload: modLibrary });

                apiKeyManager.updateKeys(finalSettings.apiKeys || []);
                apiKeyManager.updateModelRotationSetting(finalSettings.enableAutomaticModelRotation);
                dispatch({ type: 'SET_ACTIVE_WORLD_ID', payload: worldId });

                await loadSaveSlots();
            } catch (error) {
                console.error("Failed to load initial data from DB", error);
            }
        };
        loadInitialData();
    }, [state.isMigratingData, loadSaveSlots]);

    useEffect(() => {
        const { backgroundMusicUrl, backgroundMusicVolume, fontFamily, zoomLevel, textColor, theme, layoutMode, enablePerformanceMode } = state.settings;
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.loop = true;
        }
        const audio = audioRef.current;
        audio.volume = backgroundMusicVolume;
        if (backgroundMusicUrl && audio.src !== backgroundMusicUrl) audio.src = backgroundMusicUrl;
        if (backgroundMusicUrl && audio.paused) audio.play().catch(e => console.warn("Autoplay was prevented.", e));
        else if (!backgroundMusicUrl && !audio.paused) { audio.pause(); audio.src = ''; }
        
        document.body.style.fontFamily = fontFamily;
        document.documentElement.style.fontSize = `${zoomLevel}%`;
        document.documentElement.style.setProperty('--text-color', textColor || '#d1d5db');
        THEME_OPTIONS.forEach(t => document.body.classList.remove(t.value));
        if (theme) document.body.classList.add(theme);
        document.body.classList.toggle('force-desktop', layoutMode === 'desktop');
        document.body.classList.toggle('force-mobile', layoutMode === 'mobile');
        document.body.classList.toggle('performance-mode', enablePerformanceMode);
    }, [state.settings]);

    const handleNavigate = useCallback((targetView: View) => dispatch({ type: 'NAVIGATE', payload: targetView }), []);

    const handleSettingChange = useCallback((key: keyof GameSettings, value: any) => {
        dispatch({ type: 'UPDATE_SETTING', payload: { key, value } });
    }, []);

    const handleDynamicBackgroundChange = async (themeId: string) => {
        handleSettingChange('dynamicBackground', themeId);
        if (themeId === 'none') return;

        const cacheId = `bg_theme_${themeId}`;
        if (state.backgrounds.urls[cacheId]) {
            return; // Already loaded
        }

        dispatch({ type: 'LOAD_BACKGROUND_START', payload: { themeId } });
        try {
            const urls = await generateAndCacheBackgroundSet(themeId);
            dispatch({ type: 'LOAD_BACKGROUND_SUCCESS', payload: { themeId, urls } });
        } catch (error) {
            console.error(`Failed to generate background for ${themeId}:`, error);
            dispatch({ type: 'LOAD_BACKGROUND_ERROR', payload: { themeId } });
        }
    };

    const handleSettingsSave = useCallback(async () => {
        try {
            await db.saveSettings(state.settings);
            apiKeyManager.updateKeys(state.settings.apiKeys || []);
            apiKeyManager.updateModelRotationSetting(state.settings.enableAutomaticModelRotation);
            await updateStorageUsage();
            alert('Cài đặt đã được lưu!');
        } catch (error) {
            console.error("Failed to save settings to DB", error);
            alert('Lỗi: Không thể lưu cài đặt.');
        }
    }, [state.settings, updateStorageUsage]);

    const handleSlotSelection = useCallback((slotId: number) => {
        const selectedSlot = state.saveSlots.find(s => s.id === slotId);
        if (selectedSlot?.data?.playerCharacter) {
            dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Đang tải hành trình...' } });
            setTimeout(() => {
                dispatch({ type: 'LOAD_GAME', payload: { gameState: selectedSlot.data!, slotId } });
            }, 500);
        } else {
            dispatch({ type: 'START_CHARACTER_CREATION', payload: slotId });
        }
    }, [state.saveSlots]);

    const handleSaveGame = useCallback(async () => {
        if (state.gameState && state.currentSlotId !== null) {
            const gameStateToSave: GameState = { ...state.gameState, version: CURRENT_GAME_VERSION, lastSaved: new Date().toISOString() };
            await db.saveGameState(state.currentSlotId, gameStateToSave);
            dispatch({ type: 'UPDATE_GAME_STATE', payload: gameStateToSave });
            await loadSaveSlots();
        } else {
            throw new Error("Không có trạng thái game hoặc ô lưu hiện tại để lưu.");
        }
    }, [state.gameState, state.currentSlotId, loadSaveSlots]);

    const handleDeleteGame = useCallback(async (slotId: number) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn dữ liệu ở ô ${slotId}?`)) {
            await db.deleteGameState(slotId);
            await db.deleteMemoryForSlot(slotId); // Also delete associated memory
            await loadSaveSlots();
        }
    }, [loadSaveSlots]);
    
    const handleVerifyAndRepairSlot = useCallback(async (slotId: number) => {
        dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: `Đang kiểm tra ô ${slotId}...` } });
        try {
            const slots = await db.getAllSaveSlots();
            const slotToVerify = slots.find(s => s.id === slotId);
            if (!slotToVerify?.data) throw new Error("Không có dữ liệu để kiểm tra.");
            const migratedGame = await migrateGameState(slotToVerify.data);
            await db.saveGameState(slotId, { ...migratedGame, version: CURRENT_GAME_VERSION });
            await loadSaveSlots();
            alert(`Ô ${slotId} đã được kiểm tra và cập nhật thành công!`);
        } catch (error) {
            alert(`Ô ${slotId} bị lỗi không thể sửa. Dữ liệu có thể đã bị hỏng nặng.`);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
        }
    }, [loadSaveSlots]);

    const quitGame = useCallback(() => {
        cancelSpeech();
        dispatch({ type: 'QUIT_GAME' });
    }, [cancelSpeech]);

    const handleGameStart = useCallback(async (gameStartData: GameStartData) => {
        if (state.currentSlotId === null) return;
        dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Đang khởi tạo thế giới mới...' } });
        try {
            const modLibrary = await db.getModLibrary();
            const enabledModsInfo = modLibrary.filter(m => m.isEnabled);
            const activeMods: FullMod[] = (await Promise.all(
                enabledModsInfo.map(modInfo => db.getModContent(modInfo.modInfo.id))
            )).filter((mod): mod is FullMod => mod !== undefined);
            
            const newGameState = await createNewGameState(gameStartData, activeMods, state.activeWorldId, (msg) => dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: msg } }));
            await db.saveGameState(state.currentSlotId, newGameState);
            await loadSaveSlots();
            const hydratedGameState = await migrateGameState(newGameState);
            dispatch({ type: 'UPDATE_GAME_STATE', payload: hydratedGameState });
        } catch (error) {
            alert(`Lỗi tạo thế giới: ${(error as Error).message}.`);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
        }
    }, [state.currentSlotId, state.activeWorldId, loadSaveSlots]);

    const handleSetActiveWorldId = async (worldId: string) => {
        await db.setActiveWorldId(worldId);
        dispatch({ type: 'SET_ACTIVE_WORLD_ID', payload: worldId });
    };

    const handlePlayerAction = useCallback(async (text: string, type: 'say' | 'act', apCost: number, showNotification: (message: string) => void) => {
        if (state.isLoading || !state.gameState || state.currentSlotId === null) return;
        
        // Clear any pending interactions before proceeding
        dispatch({ type: 'UPDATE_GAME_STATE', payload: gs => gs ? { ...gs, dialogueChoices: null } : null });
        
        cancelSpeech();
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Thiên Đạo đang suy diễn...' }});

        try {
            const finalState = await processPlayerAction(
                state.gameState, 
                text, 
                type, 
                apCost, 
                state.settings, 
                showNotification, 
                abortControllerRef.current.signal,
                state.currentSlotId
            );
            dispatch({ type: 'UPDATE_GAME_STATE', payload: finalState });
        } catch (error: any) {
            console.error("AI story generation failed:", error);
            const errorMessage = `[Hệ Thống] Lỗi kết nối với Thiên Đạo: ${error.message}`;
            dispatch({
                type: 'UPDATE_GAME_STATE',
                payload: (currentState) => {
                    if (!currentState) return null;
                    const lastId = currentState.storyLog.length > 0 ? currentState.storyLog[currentState.storyLog.length - 1].id : 0;
                    const playerActionEntry: StoryEntry = { id: lastId + 1, type: type === 'say' ? 'player-dialogue' : 'player-action', content: text };
                    const errorEntry: StoryEntry = { id: lastId + 2, type: 'system', content: errorMessage };
                    return { ...currentState, storyLog: [...currentState.storyLog, playerActionEntry, errorEntry] };
                }
            });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { isLoading: false }});
        }
    }, [state.isLoading, state.settings, state.currentSlotId, cancelSpeech, state.gameState]);

    const handleDialogueChoice = useCallback((choice: EventChoice) => {
        // AP cost for a dialogue choice is 0
        handlePlayerAction(choice.text, 'act', 0, () => {});
    }, [handlePlayerAction]);

    const handleUpdatePlayerCharacter = useCallback((updater: (pc: PlayerCharacter) => PlayerCharacter) => {
        dispatch({
            type: 'UPDATE_GAME_STATE',
            payload: (gs) => {
                if (!gs) return null;
                return { ...gs, playerCharacter: updater(gs.playerCharacter) };
            }
        });
    }, []);

    // --- New Mod Management Handlers ---
    const handleInstallMod = useCallback(async (newModData: FullMod): Promise<boolean> => {
        if (!newModData.modInfo?.id || !newModData.modInfo?.name) {
            alert("Tệp mod không hợp lệ. Thiếu thông tin 'modInfo' hoặc ID/tên.");
            return false;
        }
        if (state.installedMods.some(m => m.modInfo.id === newModData.modInfo.id)) {
            alert(`Mod có ID "${newModData.modInfo.id}" đã được cài đặt.`);
            return false;
        }

        try {
            const newMod: ModInLibrary = {
                modInfo: newModData.modInfo,
                isEnabled: true,
            };
            await db.saveModToLibrary(newMod);
            await db.saveModContent(newModData.modInfo.id, newModData);
            dispatch({ type: 'ADD_INSTALLED_MOD', payload: newMod });
            return true;
        } catch (error) {
            console.error("Lỗi khi cài đặt mod:", error);
            alert("Lỗi khi cài đặt mod.");
            return false;
        }
    }, [state.installedMods]);

    const handleToggleMod = useCallback(async (modId: string) => {
        const updatedMods = state.installedMods.map(mod => 
            mod.modInfo.id === modId ? { ...mod, isEnabled: !mod.isEnabled } : mod
        );
        dispatch({ type: 'UPDATE_INSTALLED_MODS', payload: updatedMods });
        try {
            await db.saveModLibrary(updatedMods);
        } catch (error) {
            console.error("Không thể lưu thay đổi trạng thái mod:", error);
            alert("Không thể lưu thay đổi trạng thái mod.");
            // Revert UI state on failure
            dispatch({ type: 'SET_INSTALLED_MODS', payload: state.installedMods });
        }
    }, [state.installedMods]);

    const handleDeleteModFromLibrary = useCallback(async (modId: string) => {
        const modToDelete = state.installedMods.find(m => m.modInfo.id === modId);
        if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn mod "${modToDelete?.modInfo.name}"?`)) {
            try {
                await db.deleteModFromLibrary(modId);
                await db.deleteModContent(modId);
                dispatch({ type: 'REMOVE_INSTALLED_MOD', payload: modId });
            } catch (error) {
                console.error("Không thể xóa mod:", error);
                alert("Không thể xóa mod.");
            }
        }
    }, [state.installedMods]);

    const contextValue: AppContextType = {
        state, dispatch, handleNavigate, handleSettingChange, handleDynamicBackgroundChange, handleSettingsSave,
        handleSlotSelection, handleSaveGame, handleDeleteGame, handleVerifyAndRepairSlot,
        handleGameStart, handleSetActiveWorldId, quitGame, speak, cancelSpeech,
        handlePlayerAction, handleUpdatePlayerCharacter, handleDialogueChoice,
        handleInstallMod, handleToggleMod, handleDeleteModFromLibrary
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within an AppProvider');
    return context;
};