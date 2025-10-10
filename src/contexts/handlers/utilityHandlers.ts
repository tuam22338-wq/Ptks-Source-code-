import type { Dispatch, RefObject } from 'react';
import type { GameSettings, SaveSlot, FullMod, ModInLibrary } from '../../types';
import type { Action, AppState } from '../gameReducer';
import * as db from '../../services/dbService';
import { apiKeyManager } from '../../services/gemini/gemini.core';
import { migrateGameState } from '../../utils/gameStateManager';
import { generateAndCacheBackgroundSet } from '../../services/gemini/asset.service';
import { DEFAULT_SETTINGS } from '../../constants';

// --- TTS Handlers ---
export function speak(
    text: string,
    settings: GameSettings,
    voices: SpeechSynthesisVoice[],
    ttsAudioRef: RefObject<HTMLAudioElement | null>,
    force = false
) {
    if (!text || (!settings.enableTTS && !force)) return;

    window.speechSynthesis.cancel();
    if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.src = '';
    }

    if (settings.ttsProvider === 'elevenlabs') {
        const { elevenLabsApiKey, elevenLabsVoiceId, ttsVolume } = settings;
        if (!elevenLabsApiKey || !elevenLabsVoiceId) {
            console.warn("ElevenLabs TTS is enabled, but API key or Voice ID is missing.");
            return;
        }

        fetch(`https://api.elevenlabs.io/v1/text-to-speech/${elevenLabsVoiceId}`, {
            method: 'POST',
            headers: { 'Accept': 'audio/mpeg', 'Content-Type': 'application/json', 'xi-api-key': elevenLabsApiKey },
            body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } })
        }).then(response => {
            if (!response.ok) throw new Error(`ElevenLabs API error: ${response.statusText}`);
            return response.blob();
        }).then(blob => {
            const url = URL.createObjectURL(blob);
            if (!ttsAudioRef.current) ttsAudioRef.current = new Audio();
            ttsAudioRef.current.src = url;
            ttsAudioRef.current.volume = ttsVolume;
            ttsAudioRef.current.play();
        }).catch(error => console.error("Failed to play audio from ElevenLabs:", error));
    } else {
        const utterance = new SpeechSynthesisUtterance(text);
        const selectedVoice = voices.find(v => v.voiceURI === settings.ttsVoiceURI) || voices.find(v => v.lang === 'vi-VN');
        if (selectedVoice) utterance.voice = selectedVoice;
        utterance.rate = settings.ttsRate;
        utterance.pitch = settings.ttsPitch;
        utterance.volume = settings.ttsVolume;
        window.speechSynthesis.speak(utterance);
    }
}

export function cancelSpeech(ttsAudioRef: RefObject<HTMLAudioElement | null>) {
    window.speechSynthesis.cancel();
    if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.src = '';
    }
}

// --- Data & Storage Handlers ---
const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export async function updateStorageUsage(dispatch: Dispatch<Action>) {
    if (navigator.storage?.estimate) {
        try {
            const estimate = await navigator.storage.estimate();
            dispatch({ type: 'SET_STORAGE_USAGE', payload: {
                usageString: `${formatBytes(estimate.usage || 0)} / ${formatBytes(estimate.quota || 1)}`,
                percentage: Math.min(100, ((estimate.usage || 0) / (estimate.quota || 1)) * 100)
            }});
        } catch (error) {
            console.error("Không thể ước tính dung lượng lưu trữ:", error);
            dispatch({ type: 'SET_STORAGE_USAGE', payload: { usageString: 'Không rõ', percentage: 0 }});
        }
    }
}

export async function loadSaveSlots(dispatch: Dispatch<Action>, updateStorage: () => Promise<void>) {
    try {
        const loadedSlots: SaveSlot[] = await db.getAllSaveSlots();
        const processedSlots = await Promise.all(loadedSlots.map(async (slot) => {
            if (slot.data) {
                try { return { ...slot, data: await migrateGameState(slot.data) }; }
                catch (error) {
                    console.error(`Slot ${slot.id} is corrupted. Error:`, error);
                    db.deleteGameState(slot.id);
                    return { ...slot, data: null };
                }
            }
            return slot;
        }));
        dispatch({ type: 'SET_SAVE_SLOTS', payload: processedSlots });
        await updateStorage();
    } catch (error) {
        console.error("Failed to load save slots:", error);
    }
}


export async function loadInitialData(dispatch: Dispatch<Action>, loadSlots: () => Promise<void>) {
    try {
        const [savedSettings, worldId, cachedAssets, modLibrary] = await Promise.all([
            db.getSettings(), db.getActiveWorldId(), db.getAllAssets(), db.getModLibrary()
        ]);
        let finalSettings = { ...DEFAULT_SETTINGS, ...savedSettings };
        const oldPlaylist = ['https://files.catbox.moe/f86nal.mp3', 'https://files.catbox.moe/uckxqm.mp3'];
        const newPlaylist = ['https://archive.org/download/Chinese-instrumental-music/Chinese-instrumental-music.mp3', 'https://archive.org/download/ChineseTraditionalMusic/Chinese-Traditional-Music-Guqin-Meditation.mp3'];
        if (!finalSettings.backgroundMusicUrl || oldPlaylist.includes(finalSettings.backgroundMusicUrl)) {
            finalSettings.backgroundMusicUrl = newPlaylist[Math.floor(Math.random() * newPlaylist.length)];
            finalSettings.backgroundMusicName = 'Nhạc Nền Mặc Định';
        }
        dispatch({ type: 'SET_SETTINGS', payload: finalSettings });
        dispatch({ type: 'SET_ALL_CACHED_BACKGROUNDS', payload: cachedAssets });
        dispatch({ type: 'SET_INSTALLED_MODS', payload: modLibrary });
        apiKeyManager.updateKeys(finalSettings.apiKeys || []);
        apiKeyManager.updateModelRotationSetting(finalSettings.enableAutomaticModelRotation);
        dispatch({ type: 'SET_ACTIVE_WORLD_ID', payload: worldId });
        await loadSlots();
    } catch (error) {
        console.error("Failed to load initial data from DB", error);
    }
}


// --- Mod Handlers ---
export async function installMod(newModData: FullMod, state: AppState, dispatch: Dispatch<Action>): Promise<boolean> {
    if (!newModData.modInfo?.id || !newModData.modInfo?.name) {
        alert("Tệp mod không hợp lệ. Thiếu thông tin 'modInfo' hoặc ID/tên.");
        return false;
    }
    const existingModIndex = state.installedMods.findIndex(m => m.modInfo.id === newModData.modInfo.id);
    if (existingModIndex > -1) {
        if (!window.confirm(`Mod "${newModData.modInfo.name}" đã tồn tại. Bạn có muốn ghi đè?`)) return false;
        try {
            const updatedModInLibrary = { ...state.installedMods[existingModIndex], modInfo: newModData.modInfo };
            await db.saveModToLibrary(updatedModInLibrary);
            await db.saveModContent(newModData.modInfo.id, newModData);
            const updatedMods = [...state.installedMods];
            updatedMods[existingModIndex] = updatedModInLibrary;
            dispatch({ type: 'UPDATE_INSTALLED_MODS', payload: updatedMods });
            alert(`Mod "${newModData.modInfo.name}" đã được cập nhật!`);
            return true;
        } catch (error) {
            alert("Lỗi khi cập nhật mod."); return false;
        }
    } else {
        try {
            const newMod: ModInLibrary = { modInfo: newModData.modInfo, isEnabled: true };
            await db.saveModToLibrary(newMod);
            await db.saveModContent(newModData.modInfo.id, newModData);
            dispatch({ type: 'ADD_INSTALLED_MOD', payload: newMod });
            return true;
        } catch (error) {
            alert("Lỗi khi cài đặt mod."); return false;
        }
    }
}

export async function toggleMod(modId: string, state: AppState, dispatch: Dispatch<Action>) {
    const updatedMods = state.installedMods.map(mod => mod.modInfo.id === modId ? { ...mod, isEnabled: !mod.isEnabled } : mod);
    dispatch({ type: 'UPDATE_INSTALLED_MODS', payload: updatedMods });
    try {
        await db.saveModLibrary(updatedMods);
    } catch (error) {
        alert("Không thể lưu thay đổi trạng thái mod.");
        dispatch({ type: 'SET_INSTALLED_MODS', payload: state.installedMods });
    }
}

export async function deleteModFromLibrary(modId: string, state: AppState, dispatch: Dispatch<Action>) {
    const modToDelete = state.installedMods.find(m => m.modInfo.id === modId);
    if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn mod "${modToDelete?.modInfo.name}"?`)) {
        try {
            await db.deleteModFromLibrary(modId);
            await db.deleteModContent(modId);
            dispatch({ type: 'REMOVE_INSTALLED_MOD', payload: modId });
        } catch (error) {
            alert("Không thể xóa mod.");
        }
    }
}

export async function setActiveWorldId(worldId: string, dispatch: Dispatch<Action>) {
    await db.setActiveWorldId(worldId);
    dispatch({ type: 'SET_ACTIVE_WORLD_ID', payload: worldId });
}

// --- Other Handlers ---
export async function changeDynamicBackground(themeId: string, dispatch: Dispatch<Action>) {
    if (themeId === 'none') return;
    dispatch({ type: 'UPDATE_SETTING', payload: { key: 'dynamicBackground', value: themeId } });
    dispatch({ type: 'LOAD_BACKGROUND_START', payload: { themeId } });
    try {
        const urls = await generateAndCacheBackgroundSet(themeId);
        dispatch({ type: 'LOAD_BACKGROUND_SUCCESS', payload: { themeId, urls } });
    } catch (error) {
        console.error(`Failed to generate background for ${themeId}:`, error);
        dispatch({ type: 'LOAD_BACKGROUND_ERROR', payload: { themeId } });
    }
}