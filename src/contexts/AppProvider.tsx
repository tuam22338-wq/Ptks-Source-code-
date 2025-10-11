import React, { useEffect, useCallback, FC, PropsWithChildren, useRef, useReducer, useState } from 'react';
import { AppContext } from './AppContext';
import { gameReducer, initialState } from './gameReducer';
import * as db from '../../services/dbService';
import { apiKeyManager } from '../../services/gemini/gemini.core';
import { DEFAULT_SETTINGS, THEME_OPTIONS } from '../../constants';
// FIX: Add missing type imports
import type { GameSettings, FullMod } from '../types';

// Import handlers
import { createAndStartGame, quickCreateAndStartGame, playerAction, updatePlayerCharacter } from './handlers/actionHandlers';
import { saveGame, loadGame, deleteGame, verifyAndRepairSlot, quitGame } from './handlers/stateHandlers';
import { speak, cancelSpeech, updateStorageUsage, loadSaveSlots, installMod, toggleMod, deleteModFromLibrary, setActiveWorldId, changeDynamicBackground, loadInitialData } from './handlers/utilityHandlers';

export type View = 'mainMenu' | 'saveSlots' | 'settings' | 'gamePlay' | 'info' | 'novelist' | 'loadGame' | 'aiTraining' | 'scripts' | 'createScript';

export const AppProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const abortControllerRef = useRef<AbortController | null>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasLoadedInitialSettings = useRef(false);

    // --- EFFECT HOOKS FOR INITIALIZATION & SETTINGS ---

    useEffect(() => {
        const handleVoicesChanged = () => window.speechSynthesis && setVoices(window.speechSynthesis.getVoices());
        window.speechSynthesis?.addEventListener('voiceschanged', handleVoicesChanged);
        handleVoicesChanged();
        return () => window.speechSynthesis?.removeEventListener('voiceschanged', handleVoicesChanged);
    }, []);

    useEffect(() => {
        const setViewportHeight = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        return () => window.removeEventListener('resize', setViewportHeight);
    }, []);

    useEffect(() => {
        db.getMigrationStatus().then(isMigrated => {
            if (isMigrated || localStorage.length === 0) {
                db.setMigrationStatus(true).finally(() => dispatch({ type: 'SET_MIGRATION_STATE', payload: { isMigrating: false } }));
            } else {
                dispatch({ type: 'SET_MIGRATION_STATE', payload: { isMigrating: true, message: 'Nâng cấp hệ thống lưu trữ...' } });
                db.setMigrationStatus(true)
                    .then(() => dispatch({ type: 'SET_MIGRATION_STATE', payload: { isMigrating: true, message: 'Nâng cấp thành công!' } }))
                    .catch(() => dispatch({ type: 'SET_MIGRATION_STATE', payload: { isMigrating: true, message: 'Lỗi nâng cấp.' } }))
                    .finally(() => setTimeout(() => dispatch({ type: 'SET_MIGRATION_STATE', payload: { isMigrating: false } }), 1500));
            }
        });
    }, []);
    
    const memoizedLoadSaveSlots = useCallback(() => loadSaveSlots(dispatch, () => updateStorageUsage(dispatch)), [dispatch]);

    useEffect(() => {
        if (!state.isMigratingData) {
            loadInitialData(dispatch, memoizedLoadSaveSlots);
        }
    }, [state.isMigratingData, memoizedLoadSaveSlots]);

    useEffect(() => {
        const { backgroundMusicUrl, backgroundMusicVolume, fontFamily, zoomLevel, theme, customThemeColors, layoutMode, enablePerformanceMode } = state.settings;
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
        
        THEME_OPTIONS.forEach(t => document.body.classList.remove(t.value));
        if (theme) document.body.classList.add(theme);

        if (theme === 'theme-custom' && customThemeColors) {
            // FIX: The value from customThemeColors might not be a string if data is malformed from storage. Add a type check.
            Object.entries(customThemeColors).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    document.documentElement.style.setProperty(key, value);
                }
            });
        } else {
            Object.keys(DEFAULT_SETTINGS.customThemeColors).forEach(key => document.documentElement.style.removeProperty(key));
        }
        
        document.body.classList.toggle('force-desktop', layoutMode === 'desktop');
        document.body.classList.toggle('force-mobile', layoutMode === 'mobile');
        document.body.classList.toggle('performance-mode', enablePerformanceMode);
    }, [state.settings]);

    const performSaveSettings = useCallback(async () => {
        dispatch({ type: 'SET_SETTINGS_SAVING_STATUS', payload: 'saving' });
        try {
            await db.saveSettings(state.settings);
            apiKeyManager.updateKeys(state.settings.apiKeys || []);
            apiKeyManager.updateModelRotationSetting(state.settings.enableAutomaticModelRotation);
            dispatch({ type: 'SET_SETTINGS_SAVING_STATUS', payload: 'saved' });
            setTimeout(() => dispatch({ type: 'SET_SETTINGS_SAVING_STATUS', payload: 'idle' }), 2000);
        } catch (error) {
            console.error("Failed to auto-save settings", error);
            dispatch({ type: 'SET_SETTINGS_SAVING_STATUS', payload: 'idle' });
        }
    }, [state.settings]);
    
    useEffect(() => {
        if (state.isMigratingData || !hasLoadedInitialSettings.current) {
            hasLoadedInitialSettings.current = !state.isMigratingData;
            return;
        }
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(performSaveSettings, 1000);
        return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current) };
    }, [state.settings, state.isMigratingData, performSaveSettings]);

    // --- HANDLER CALLBACKS ---

    const handleNavigate = useCallback((targetView: View) => dispatch({ type: 'NAVIGATE', payload: targetView }), []);
    const handleSettingChange = useCallback((key: keyof GameSettings, value: any) => dispatch({ type: 'UPDATE_SETTING', payload: { key, value } }), []);
    const handleSettingsSave = useCallback(async () => console.log("Manual save called, but auto-save is active."), []);
    
    const handleDynamicBackgroundChange = useCallback(async (themeId: string) => {
        if (themeId !== 'none' && !state.backgrounds.urls[`bg_theme_${themeId}`]) {
            await changeDynamicBackground(themeId, dispatch);
        }
        handleSettingChange('dynamicBackground', themeId);
    }, [state.backgrounds.urls, handleSettingChange]);
    
    const handleCreateAndStartGame = useCallback(async (data: any, slotId: any) => {
        try {
            await createAndStartGame(data, slotId, dispatch, state.settings, memoizedLoadSaveSlots);
        } catch (err) {
            console.error("Lỗi tạo thế giới:", err);
            dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
            const message = err instanceof Error ? err.message : String(err);
            throw new Error(message);
        }
    }, [state.settings, memoizedLoadSaveSlots]);

    const handleQuickCreateAndStartGame = useCallback(async (desc: any, name: any, slotId: any) => {
        try {
            await quickCreateAndStartGame(desc, name, slotId, dispatch, state.settings, memoizedLoadSaveSlots);
        } catch (err) {
            console.error("Lỗi tạo nhanh thế giới:", err);
            dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
            const message = err instanceof Error ? err.message : String(err);
            throw new Error(message);
        }
    }, [state.settings, memoizedLoadSaveSlots]);

    const memoizedCancelSpeech = useCallback(() => cancelSpeech(ttsAudioRef), []);

    const handlePlayerAction = useCallback((text: any, type: any, apCost: any, showNotification: any) => {
        return playerAction(text, type, apCost, showNotification, state, dispatch, memoizedCancelSpeech, abortControllerRef);
    }, [state, memoizedCancelSpeech]);

    const handleUpdatePlayerCharacter = useCallback((updater: any) => updatePlayerCharacter(updater, dispatch), []);

    const handleSlotSelection = useCallback((slotId: number) => loadGame(slotId, state.saveSlots, dispatch), [state.saveSlots]);
    const handleSaveGame = useCallback(() => saveGame(state.gameState, state.currentSlotId, dispatch, memoizedLoadSaveSlots), [state.gameState, state.currentSlotId, memoizedLoadSaveSlots]);
    const handleDeleteGame = useCallback((slotId: number) => deleteGame(slotId, memoizedLoadSaveSlots), [memoizedLoadSaveSlots]);
    const handleVerifyAndRepairSlot = useCallback((slotId: number) => verifyAndRepairSlot(slotId, dispatch, memoizedLoadSaveSlots), [memoizedLoadSaveSlots]);
    const quitGameHandler = useCallback(() => quitGame(dispatch, memoizedCancelSpeech), [memoizedCancelSpeech]);

    const speakHandler = useCallback((text: any, force: any) => speak(text, state.settings, voices, ttsAudioRef, force), [state.settings, voices]);

    const handleInstallMod = useCallback((modData: FullMod) => installMod(modData, state, dispatch), [state]);
    const handleToggleMod = useCallback((modId: string) => toggleMod(modId, state, dispatch), [state]);
    const handleDeleteModFromLibrary = useCallback((modId: string) => deleteModFromLibrary(modId, state, dispatch), [state]);
    const handleSetActiveWorldId = useCallback((worldId: string) => setActiveWorldId(worldId, dispatch), []);
    const handleEditWorld = useCallback(async (worldId: string) => console.log("Placeholder for edit world", worldId), []);

    const handleSaveHotmark = useCallback(async () => {
        if (state.gameState) {
            await db.saveHotmark(state.gameState);
            console.log('%c[Hotmark] Game state snapshot saved.', 'color: #4ade80');
        } else {
            console.error('[Hotmark] No active game state to save.');
            throw new Error("Không có trạng thái game đang hoạt động.");
        }
    }, [state.gameState]);

    const handleLoadHotmark = useCallback(async () => {
        const loadedState = await db.loadHotmark();
        if (loadedState) {
            dispatch({ type: 'UPDATE_GAME_STATE', payload: loadedState });
            console.log('%c[Hotmark] Game state snapshot loaded.', 'color: #22d3ee');
        } else {
            console.error('[Hotmark] No hotmark found to load.');
            throw new Error("Không tìm thấy hotmark.");
        }
    }, [dispatch]);


    // --- CONTEXT VALUE & RENDER ---

    const contextValue = {
        state, dispatch, handleNavigate, handleSettingChange, handleSettingsSave,
        handleDynamicBackgroundChange, handleCreateAndStartGame, handleQuickCreateAndStartGame,
        handlePlayerAction, handleUpdatePlayerCharacter, handleSlotSelection, handleSaveGame,
        handleDeleteGame, handleVerifyAndRepairSlot, quitGame: quitGameHandler,
        speak: speakHandler, cancelSpeech: memoizedCancelSpeech, handleInstallMod, handleToggleMod,
        handleDeleteModFromLibrary, handleSetActiveWorldId, handleEditWorld,
        handleSaveHotmark, handleLoadHotmark
    };

    return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};
