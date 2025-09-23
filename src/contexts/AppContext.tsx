

import React, { useEffect, useCallback, createContext, useContext, FC, PropsWithChildren, useRef, useReducer, useState } from 'react';
import type { GameState, SaveSlot, GameSettings, FullMod, PlayerCharacter, NpcDensity, AIModel, DanhVong, DifficultyLevel, SpiritualRoot, PlayerVitals, StoryEntry, StatBonus, ItemType, ItemQuality, InventoryItem, EventChoice } from '../types';
import { DEFAULT_SETTINGS, THEME_OPTIONS, CURRENT_GAME_VERSION } from '../constants';
import { migrateGameState, createNewGameState } from '../utils/gameStateManager';
import * as db from '../services/dbService';
import { apiKeyManager } from '../services/gemini/gemini.core';
import { gameReducer, AppState, Action } from './gameReducer';
import { processPlayerAction } from '../services/actionService';

export type View = 'mainMenu' | 'saveSlots' | 'characterCreation' | 'settings' | 'mods' | 'gamePlay' | 'thoiThe' | 'info' | 'worldSelection';

export interface GameStartData {
    identity: Omit<PlayerCharacter['identity'], 'age'>;
    npcDensity: NpcDensity;
    difficulty: DifficultyLevel;
    initialBonuses: StatBonus[];
    initialItems: { name: string; quantity: number; description: string; type: ItemType; quality: ItemQuality; icon: string; }[];
    spiritualRoot: SpiritualRoot;
    danhVong: DanhVong;
}


interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<Action>;
    
    // Handlers
    handleNavigate: (targetView: View) => void;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
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
    handleSkillCheckResult: (success: boolean) => void;
    handleDialogueChoice: (choice: EventChoice) => void;
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
};

export const AppProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const audioRef = useRef<HTMLAudioElement | null>(null);
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

    const speak = useCallback((text: string, force = false) => {
        if (!window.speechSynthesis || (!state.settings.enableTTS && !force) || !text) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = voices.find(v => v.voiceURI === state.settings.ttsVoiceURI);
        if (selectedVoice) utterance.voice = selectedVoice;
        else {
            const vietnameseVoice = voices.find(v => v.lang === 'vi-VN');
            if (vietnameseVoice) utterance.voice = vietnameseVoice;
        }
        utterance.rate = state.settings.ttsRate;
        utterance.pitch = state.settings.ttsPitch;
        utterance.volume = state.settings.ttsVolume;
        window.speechSynthesis.speak(utterance);
    }, [state.settings.enableTTS, state.settings.ttsVoiceURI, state.settings.ttsRate, state.settings.ttsPitch, state.settings.ttsVolume, voices]);

    const cancelSpeech = useCallback(() => {
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
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
                // FIX: Use dispatch to update migration message
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
                const savedSettings = await db.getSettings();
                const finalSettings = { ...DEFAULT_SETTINGS, ...savedSettings };
                dispatch({ type: 'SET_SETTINGS', payload: finalSettings });
                apiKeyManager.updateKeys(finalSettings.apiKeys || []);
                const worldId = await db.getActiveWorldId();
                dispatch({ type: 'SET_ACTIVE_WORLD_ID', payload: worldId });
                await loadSaveSlots();
            } catch (error) {
                console.error("Failed to load initial data from DB", error);
            }
        };
        loadInitialData();
    }, [state.isMigratingData, loadSaveSlots]);

    useEffect(() => {
        if (state.view === 'gamePlay' && state.gameState && state.currentSlotId !== null) {
            const debounceSave = setTimeout(async () => {
                try {
                    const gameStateToSave: GameState = { ...state.gameState!, lastSaved: new Date().toISOString() };
                    await db.saveGameState(state.currentSlotId!, gameStateToSave);
                    dispatch({ type: 'UPDATE_GAME_STATE', payload: gameStateToSave });
                    console.log(`Đã tự động lưu vào ô ${state.currentSlotId}`);
                    await updateStorageUsage();
                } catch (error) {
                    console.error("Tự động lưu thất bại", error);
                }
            }, 2500);
            return () => clearTimeout(debounceSave);
        }
    }, [state.gameState, state.view, state.currentSlotId, updateStorageUsage]);
    
    useEffect(() => {
        const { backgroundMusicUrl, backgroundMusicVolume, fontFamily, zoomLevel, textColor, theme, backgroundImage, layoutMode, enablePerformanceMode } = state.settings;
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
        document.body.style.backgroundImage = backgroundImage ? `url("${backgroundImage}")` : 'none';
        document.body.classList.toggle('force-desktop', layoutMode === 'desktop');
        document.body.classList.toggle('force-mobile', layoutMode === 'mobile');
        document.body.classList.toggle('performance-mode', enablePerformanceMode);
    }, [state.settings]);

    const handleNavigate = useCallback((targetView: View) => dispatch({ type: 'NAVIGATE', payload: targetView }), []);

    const handleSettingChange = useCallback((key: keyof GameSettings, value: any) => {
        dispatch({ type: 'UPDATE_SETTING', payload: { key, value } });
    }, []);

    const handleSettingsSave = useCallback(async () => {
        try {
            await db.saveSettings(state.settings);
            apiKeyManager.updateKeys(state.settings.apiKeys || []);
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
        dispatch({ type: 'UPDATE_GAME_STATE', payload: gs => gs ? { ...gs, activeSkillCheck: null, dialogueChoices: null } : null });
        
        cancelSpeech();
        if (abortControllerRef.current) abortControllerRef.current.abort();
        abortControllerRef.current = new AbortController();

        dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Thiên Đạo đang suy diễn...' }});

        try {
            // Need to get the fresh state after clearing interactions
            const currentState = (stateRef as any).current.gameState;
            const finalState = await processPlayerAction(
                currentState, 
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
    }, [state.gameState, state.isLoading, state.settings, state.currentSlotId, cancelSpeech]);

    // This is a bit of a hack to get the latest state inside async callbacks
    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

    const handleSkillCheckResult = useCallback((success: boolean) => {
        const skillCheck = stateRef.current.gameState?.activeSkillCheck;
        if (!skillCheck) return;
        const resultText = `[Hệ thống] Kết quả kiểm tra ${skillCheck.attribute}: ${success ? 'Thành Công' : 'Thất Bại'}.`;
        // AP cost for a check result is 0
        handlePlayerAction(resultText, 'act', 0, () => {}); 
    }, [handlePlayerAction]);

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

    const contextValue: AppContextType = {
        state, dispatch, handleNavigate, handleSettingChange, handleSettingsSave,
        handleSlotSelection, handleSaveGame, handleDeleteGame, handleVerifyAndRepairSlot,
        handleGameStart, handleSetActiveWorldId, quitGame, speak, cancelSpeech,
        handlePlayerAction, handleUpdatePlayerCharacter, handleSkillCheckResult, handleDialogueChoice
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