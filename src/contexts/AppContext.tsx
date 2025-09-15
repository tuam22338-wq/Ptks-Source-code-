import React, { useState, useEffect, useCallback, createContext, useContext, FC, PropsWithChildren } from 'react';
import type { GameState, SaveSlot, GameSettings, FullMod, PlayerCharacter, NpcDensity, AIModel, DanhVong } from '../types';
import { DEFAULT_SETTINGS, THEME_OPTIONS, CURRENT_GAME_VERSION, NPC_DENSITY_LEVELS } from '../constants';
import { reloadSettings } from '../services/geminiService';
import { migrateGameState, createNewGameState } from '../utils/gameStateManager';
import * as db from '../services/dbService';

export type View = 'mainMenu' | 'saveSlots' | 'characterCreation' | 'settings' | 'mods' | 'createMod' | 'gamePlay' | 'thoiThe' | 'info' | 'worldSelection';

interface ModInLibrary {
    modInfo: { id: string };
    isEnabled: boolean;
}

interface AppContextType {
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
    
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    
    // Handlers
    handleNavigate: (targetView: View) => void;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
    handleSettingsSave: () => Promise<void>;
    handleSlotSelection: (slotId: number) => void;
    handleSaveGame: (currentState: GameState) => Promise<void>;
    handleDeleteGame: (slotId: number) => Promise<void>;
    handleVerifyAndRepairSlot: (slotId: number) => Promise<void>;
    handleGameStart: (gameStartData: {
      characterData: Omit<PlayerCharacter, 'inventory' | 'currencies' | 'cultivation' | 'currentLocationId' | 'equipment' | 'mainCultivationTechnique' | 'auxiliaryTechniques' | 'techniquePoints' | 'relationships' | 'chosenPathIds' | 'knownRecipeIds' | 'reputation' | 'sect' | 'caveAbode' | 'techniqueCooldowns' | 'activeMissions' | 'inventoryActionLog' | 'danhVong'> & { danhVong: DanhVong },
      npcDensity: NpcDensity
    }) => Promise<void>;
    handleSetActiveWorldId: (worldId: string) => Promise<void>;
    quitGame: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const formatBytes = (bytes: number): string => {
    if (bytes < 1024) {
        return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
};

export const AppProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
    const [view, setView] = useState<View>('mainMenu');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [isMigratingData, setIsMigratingData] = useState(true);
    const [migrationMessage, setMigrationMessage] = useState('Kiểm tra hệ thống lưu trữ...');
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
    const [currentSlotId, setCurrentSlotId] = useState<number | null>(null);
    const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
    const [storageUsage, setStorageUsage] = useState({ usageString: '0 B / 0 B', percentage: 0 });
    const [activeWorldId, _setActiveWorldId] = useState<string>('phong_than_dien_nghia');

    const updateStorageUsage = useCallback(async () => {
        if (navigator.storage && navigator.storage.estimate) {
            try {
                const estimate = await navigator.storage.estimate();
                const usage = estimate.usage || 0;
                const quota = estimate.quota || 1;
                const usageString = `${formatBytes(usage)} / ${formatBytes(quota)}`;
                const percentage = Math.min(100, (usage / quota) * 100);
                setStorageUsage({ usageString, percentage });
            } catch (error) {
                console.error("Không thể ước tính dung lượng lưu trữ:", error);
                setStorageUsage({ usageString: 'Không rõ', percentage: 0 });
            }
        }
    }, []);

    const loadSaveSlots = useCallback(async () => {
        try {
            const loadedSlots: SaveSlot[] = await db.getAllSaveSlots();
            const processedSlots = loadedSlots.map(slot => {
                if (slot.data) {
                    try {
                        return { ...slot, data: migrateGameState(slot.data) };
                    } catch (error) {
                        console.error(`Slot ${slot.id} is corrupted or incompatible and will be cleared. Error:`, error);
                        db.deleteGameState(slot.id);
                        return { ...slot, data: null };
                    }
                }
                return slot;
            });
            setSaveSlots(processedSlots);
            await updateStorageUsage();
        } catch (error) {
            console.error("Failed to load save slots from DB:", error);
        }
    }, [updateStorageUsage]);

    useEffect(() => {
        const setViewportHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };
        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        return () => window.removeEventListener('resize', setViewportHeight);
    }, []);

    useEffect(() => {
        const migrateData = async () => {
            const isMigrated = await db.getMigrationStatus();
            if (isMigrated) {
                setIsMigratingData(false);
                return;
            }

            if (localStorage.length === 0) {
                await db.setMigrationStatus(true);
                setIsMigratingData(false);
                return;
            }

            setMigrationMessage('Phát hiện dữ liệu cũ, đang nâng cấp hệ thống lưu trữ...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                const settingsRaw = localStorage.getItem('game-settings');
                if (settingsRaw) {
                    await db.saveSettings(JSON.parse(settingsRaw));
                    localStorage.removeItem('game-settings');
                }

                for (let i = 1; i <= 9; i++) {
                    const key = `phongthan-gs-slot-${i}`;
                    const savedGameRaw = localStorage.getItem(key);
                    if (savedGameRaw) {
                        await db.saveGameState(i, JSON.parse(savedGameRaw));
                        localStorage.removeItem(key);
                    }
                }
                
                const modLibraryRaw = localStorage.getItem('mod-library');
                if (modLibraryRaw) {
                    const modLibrary: ModInLibrary[] = JSON.parse(modLibraryRaw);
                    const dbModLibrary: { modInfo: FullMod['modInfo'], isEnabled: boolean }[] = [];

                    for (const mod of modLibrary) {
                        const modContentKey = `mod-content-${mod.modInfo.id}`;
                        const modContentRaw = localStorage.getItem(modContentKey);
                        if(modContentRaw) {
                            const fullMod = JSON.parse(modContentRaw) as FullMod;
                            await db.saveModContent(mod.modInfo.id, fullMod);
                            localStorage.removeItem(modContentKey);
                            
                            if (fullMod.modInfo) {
                                dbModLibrary.push({
                                    modInfo: fullMod.modInfo,
                                    isEnabled: mod.isEnabled,
                                });
                            }
                        }
                    }
                    await db.saveModLibrary(dbModLibrary);
                    localStorage.removeItem('mod-library');
                }

                setMigrationMessage('Nâng cấp thành công!');
                await db.setMigrationStatus(true);
                await new Promise(resolve => setTimeout(resolve, 1500));
            } catch (error) {
                console.error("Migration failed:", error);
                setMigrationMessage('Lỗi nâng cấp hệ thống lưu trữ. Dữ liệu cũ có thể không được bảo toàn.');
                await new Promise(resolve => setTimeout(resolve, 5000));
            } finally {
                setIsMigratingData(false);
            }
        };
        migrateData();
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            if (isMigratingData) return;
            try {
                const savedSettings = await db.getSettings();
                if (savedSettings) {
                    const validAiModel: AIModel = 'gemini-2.5-flash';
                    const modelKeys = ['mainTaskModel', 'quickSupportModel', 'itemAnalysisModel', 'itemCraftingModel', 'soundSystemModel', 'actionAnalysisModel', 'gameMasterModel', 'npcSimulationModel', 'ragSummaryModel', 'ragSourceIdModel'] as const;
                    
                    let settingsUpdated = false;
                    for (const key of modelKeys) {
                        if (savedSettings[key] !== validAiModel) {
                            savedSettings[key] = validAiModel;
                            settingsUpdated = true;
                        }
                    }
                    
                    if (settingsUpdated) {
                        console.warn("Một số cài đặt model AI không hợp lệ đã được đặt lại về mặc định.");
                        await db.saveSettings(savedSettings);
                    }

                    setSettings({ ...DEFAULT_SETTINGS, ...savedSettings });
                }
                const worldId = await db.getActiveWorldId();
                _setActiveWorldId(worldId);
                await loadSaveSlots();
            } catch (error) {
                console.error("Failed to load initial data from DB", error);
            }
        };
        loadInitialData();
    }, [isMigratingData, loadSaveSlots]);

    useEffect(() => {
        if (view === 'gamePlay' && gameState && currentSlotId !== null) {
            const debounceSave = setTimeout(async () => {
                try {
                    const gameStateToSave: GameState = { ...gameState, version: CURRENT_GAME_VERSION, lastSaved: new Date().toISOString() };
                    await db.saveGameState(currentSlotId, gameStateToSave);
                    setSaveSlots(prevSlots => prevSlots.map(slot => slot.id === currentSlotId ? { ...slot, data: gameStateToSave } : slot));
                    console.log(`Đã tự động lưu vào ô ${currentSlotId} lúc ${new Date().toLocaleTimeString()}`);
                    await updateStorageUsage();
                } catch (error) {
                    console.error("Tự động lưu thất bại", error);
                }
            }, 1500);
            return () => clearTimeout(debounceSave);
        }
    }, [gameState, view, currentSlotId, updateStorageUsage]);

    useEffect(() => {
        document.body.style.fontFamily = settings.fontFamily;
        document.documentElement.style.fontSize = `${settings.zoomLevel}%`;
        document.documentElement.style.setProperty('--text-color', settings.textColor || '#d1d5db');
        THEME_OPTIONS.forEach(themeOption => document.body.classList.remove(themeOption.value));
        if (settings.theme && settings.theme !== 'theme-amber') {
            document.body.classList.add(settings.theme);
        }
        document.body.style.backgroundImage = settings.backgroundImage ? `url("${settings.backgroundImage}")` : 'none';
        document.body.classList.remove('force-desktop', 'force-mobile');
        if (settings.layoutMode === 'desktop') document.body.classList.add('force-desktop');
        else if (settings.layoutMode === 'mobile') document.body.classList.add('force-mobile');
        if (settings.enablePerformanceMode) document.body.classList.add('performance-mode');
        else document.body.classList.remove('performance-mode');
    }, [settings]);

    const handleSettingChange = useCallback((key: keyof GameSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleSettingsSave = useCallback(async () => {
        try {
            await db.saveSettings(settings);
            await reloadSettings();
            await updateStorageUsage();
            alert('Cài đặt đã được lưu!');
        } catch (error) {
            console.error("Failed to save settings to DB", error);
            alert('Lỗi: Không thể lưu cài đặt.');
        }
    }, [settings, updateStorageUsage]);

    const handleSlotSelection = useCallback((slotId: number) => {
        const selectedSlot = saveSlots.find(s => s.id === slotId);
        if (selectedSlot?.data?.playerCharacter) {
            setLoadingMessage('Đang tải hành trình...');
            setIsLoading(true);
            setTimeout(() => {
                try {
                    setGameState(selectedSlot.data);
                    setCurrentSlotId(slotId);
                    setView('gamePlay');
                } catch (error) {
                    console.error("Lỗi nghiêm trọng khi tải game:", error);
                    alert("Gặp lỗi không xác định khi tải game. Dữ liệu có thể bị hỏng.");
                    setGameState(null);
                    setCurrentSlotId(null);
                    setView('saveSlots');
                } finally {
                    setIsLoading(false);
                }
            }, 500);
        } else {
            setCurrentSlotId(slotId);
            setView('characterCreation');
        }
    }, [saveSlots]);

    const handleSaveGame = useCallback(async (currentState: GameState) => {
        if (currentState && currentSlotId !== null) {
            const gameStateToSave: GameState = { ...currentState, version: CURRENT_GAME_VERSION, lastSaved: new Date().toISOString() };
            await db.saveGameState(currentSlotId, gameStateToSave);
            setGameState(gameStateToSave);
            await loadSaveSlots();
        } else {
            throw new Error("Không có trạng thái game hoặc ô lưu hiện tại để lưu.");
        }
    }, [currentSlotId, loadSaveSlots]);

    const handleDeleteGame = useCallback(async (slotId: number) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn dữ liệu ở ô ${slotId}? Hành động này không thể hoàn tác.`)) {
            try {
                await db.deleteGameState(slotId);
                await loadSaveSlots();
                alert(`Đã xóa dữ liệu ở ô ${slotId}.`);
            } catch (error) {
                console.error("Failed to delete save slot", error);
                alert('Lỗi: Không thể xóa dữ liệu.');
            }
        }
    }, [loadSaveSlots]);

    const handleVerifyAndRepairSlot = useCallback(async (slotId: number) => {
        setLoadingMessage(`Đang kiểm tra ô ${slotId}...`);
        setIsLoading(true);
        try {
            const slots = await db.getAllSaveSlots();
            const slotToVerify = slots.find(s => s.id === slotId);
            if (!slotToVerify?.data) throw new Error("Không có dữ liệu để kiểm tra.");
            const migratedGame = migrateGameState(slotToVerify.data);
            const gameStateToSave: GameState = { ...migratedGame, version: CURRENT_GAME_VERSION };
            await db.saveGameState(slotId, gameStateToSave);
            await loadSaveSlots();
            alert(`Ô ${slotId} đã được kiểm tra và cập nhật thành công!`);
        } catch (error) {
            console.error(`Error verifying/repairing slot ${slotId}:`, error);
            alert(`Ô ${slotId} bị lỗi không thể sửa. Dữ liệu có thể đã bị hỏng nặng.`);
        } finally {
            setIsLoading(false);
        }
    }, [loadSaveSlots]);

    const handleNavigate = useCallback((targetView: View) => {
        setView(targetView);
    }, []);
    
    const quitGame = useCallback(() => {
        setGameState(null);
        setCurrentSlotId(null);
        setView('mainMenu');
    }, []);

    const handleGameStart = useCallback(async (gameStartData: {
      characterData: Omit<PlayerCharacter, 'inventory' | 'currencies' | 'cultivation' | 'currentLocationId' | 'equipment' | 'mainCultivationTechnique' | 'auxiliaryTechniques' | 'techniquePoints' | 'relationships' | 'chosenPathIds' | 'knownRecipeIds' | 'reputation' | 'sect' | 'caveAbode' | 'techniqueCooldowns' | 'activeMissions' | 'inventoryActionLog' | 'danhVong'> & { danhVong: DanhVong },
      npcDensity: NpcDensity
    }) => {
        if (currentSlotId === null) {
            alert("Lỗi: Không có ô lưu nào được chọn.");
            return;
        }
        setIsLoading(true);

        const npcCount = NPC_DENSITY_LEVELS.find(d => d.id === gameStartData.npcDensity)?.count ?? 20;
        let remainingTime = Math.ceil(npcCount * 0.4) + 5;
        const messages = ['Đang nạp các mod đã kích hoạt...', 'Thỉnh mời các vị thần...', 'Vẽ nên sông núi, cây cỏ...', 'Tạo ra chúng sinh vạn vật...', 'An bài số mệnh, định ra nhân quả...'];
        let messageIndex = 0;
        const updateLoadingMessage = () => {
            const timeString = remainingTime > 0 ? ` (Ước tính còn: ${remainingTime}s)` : ' (Sắp xong...)';
            setLoadingMessage(messages[messageIndex] + timeString);
        };
        updateLoadingMessage();
        const timerInterval = setInterval(() => {
            remainingTime = Math.max(0, remainingTime - 1);
            updateLoadingMessage();
        }, 1000);
        const messageInterval = setInterval(() => {
            messageIndex = (messageIndex + 1) % messages.length;
            updateLoadingMessage();
        }, 4000);
        
        try {
            const modLibrary: db.DbModInLibrary[] = await db.getModLibrary();
            const enabledModsInfo = modLibrary.filter(m => m.isEnabled);
            const activeMods: FullMod[] = [];
            for (const modInfo of enabledModsInfo) {
                const modContent = await db.getModContent(modInfo.modInfo.id);
                if (modContent) activeMods.push(modContent);
            }
            const newGameState = await createNewGameState(gameStartData, activeMods, activeWorldId);
            await db.saveGameState(currentSlotId, newGameState);
            await loadSaveSlots();
            const hydratedGameState = migrateGameState(newGameState);
            setGameState(hydratedGameState);
            setView('gamePlay');
        } catch (error) {
            console.error("Failed to start new game:", error);
            alert(`Lỗi nghiêm trọng khi tạo thế giới: ${(error as Error).message}. Vui lòng thử lại.`);
        } finally {
            clearInterval(timerInterval);
            clearInterval(messageInterval);
            setIsLoading(false);
        }
    }, [currentSlotId, loadSaveSlots, activeWorldId]);

    const handleSetActiveWorldId = async (worldId: string) => {
        await db.setActiveWorldId(worldId);
        _setActiveWorldId(worldId);
    };

    const contextValue: AppContextType = {
        view, isLoading, loadingMessage, isMigratingData, migrationMessage, gameState, saveSlots,
        currentSlotId, settings, storageUsage, activeWorldId, setGameState, handleNavigate,
        handleSettingChange, handleSettingsSave, handleSlotSelection, handleSaveGame,
        handleDeleteGame, handleVerifyAndRepairSlot, handleGameStart, handleSetActiveWorldId, quitGame,
    };

    return (
        <AppContext.Provider value={contextValue}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = (): AppContextType => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};