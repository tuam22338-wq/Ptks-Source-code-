




import React, { useState, useEffect, useCallback, memo } from 'react';
import Header from './components/Header';
import LoadingScreen from './components/LoadingScreen';
import SettingsPanel from './features/Settings/SettingsPanel';
import { CharacterCreationScreen } from './features/CharacterCreation/CharacterCreationScreen';
import SaveSlotScreen from './features/MainMenu/SaveSlotScreen';
import MainMenu from './features/MainMenu/MainMenu';
import ModsScreen from './features/Mods/ModsScreen';
import CreateModScreen from './features/Mods/CreateModScreen';
import { GamePlayScreen } from './features/GamePlay/GamePlayScreen';
import ThoiTheScreen from './features/Lore/LoreScreen';
import InfoScreen from './features/Info/InfoScreen';
import DeveloperConsole from './components/DeveloperConsole';

import * as db from './services/dbService';
import type { GameState, SaveSlot, GameSettings, FullMod, PlayerCharacter, NpcDensity, AIModel } from './types';
import { DEFAULT_SETTINGS, THEME_OPTIONS, CURRENT_GAME_VERSION, NPC_DENSITY_LEVELS } from './constants';
import { reloadSettings } from './services/geminiService';
import { migrateGameState, createNewGameState } from './utils/gameStateManager';

export type View = 'mainMenu' | 'saveSlots' | 'characterCreation' | 'settings' | 'mods' | 'createMod' | 'gamePlay' | 'thoiThe' | 'info';

interface ModInLibrary {
    modInfo: { id: string };
    isEnabled: boolean;
}

const formatBytes = (bytes: number): string => {
    if (bytes < 1024) {
        return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
};

const App: React.FC = () => {
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
                  // Sanitize AI model settings to prevent errors from deprecated models in old saves
                  const validAiModel: AIModel = 'gemini-2.5-flash';
                  const modelKeys = [
                      'mainTaskModel', 'quickSupportModel', 'itemAnalysisModel',
                      'itemCraftingModel', 'soundSystemModel', 'actionAnalysisModel',
                      'gameMasterModel', 'npcSimulationModel', 'ragSummaryModel', 'ragSourceIdModel'
                  ] as const;
                  
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
                const gameStateToSave: GameState = { 
                    ...gameState, 
                    version: CURRENT_GAME_VERSION,
                    lastSaved: new Date().toISOString() 
                };
                await db.saveGameState(currentSlotId, gameStateToSave);
                
                setSaveSlots(prevSlots => prevSlots.map(slot => 
                    slot.id === currentSlotId ? { ...slot, data: gameStateToSave } : slot
                ));
                
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

    THEME_OPTIONS.forEach(themeOption => {
        document.body.classList.remove(themeOption.value);
    });
    if (settings.theme && settings.theme !== 'theme-amber') {
        document.body.classList.add(settings.theme);
    }
    
    if (settings.backgroundImage) {
        document.body.style.backgroundImage = `url("${settings.backgroundImage}")`;
    } else {
        document.body.style.backgroundImage = 'none';
    }

    document.body.classList.remove('force-desktop', 'force-mobile');
    if (settings.layoutMode === 'desktop') {
      document.body.classList.add('force-desktop');
    } else if (settings.layoutMode === 'mobile') {
      document.body.classList.add('force-mobile');
    }

    if (settings.enablePerformanceMode) {
        document.body.classList.add('performance-mode');
    } else {
        document.body.classList.remove('performance-mode');
    }
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

    if (selectedSlot && selectedSlot.data && selectedSlot.data.playerCharacter) {
        setLoadingMessage('Đang tải hành trình...');
        setIsLoading(true);
        setTimeout(() => {
            try {
                const loadedData = selectedSlot.data;

                if (!loadedData) {
                    throw new Error("Dữ liệu save không hợp lệ.");
                }

                setGameState(loadedData);
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

  const handleSaveGame = useCallback(async (currentState: GameState, showNotification: (message: string) => void) => {
    if (currentState && currentSlotId !== null) {
        try {
            const gameStateToSave: GameState = { 
                ...currentState, 
                version: CURRENT_GAME_VERSION,
                lastSaved: new Date().toISOString() 
            };
            await db.saveGameState(currentSlotId, gameStateToSave);
            setGameState(gameStateToSave);
            await loadSaveSlots();
            showNotification('Đã lưu game thành công!');
        } catch (error) {
            console.error("Failed to save game", error);
            showNotification('Lỗi: Không thể lưu game.');
        }
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

        if (!slotToVerify || !slotToVerify.data) {
            throw new Error("Không có dữ liệu để kiểm tra.");
        }
        
        const migratedGame = migrateGameState(slotToVerify.data);

        const gameStateToSave: GameState = {
            ...migratedGame,
            version: CURRENT_GAME_VERSION,
        };
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

  const handleGameStart = useCallback(async (gameStartData: {
      characterData: Omit<PlayerCharacter, 'inventory' | 'currencies' | 'cultivation' | 'currentLocationId' | 'equipment' | 'mainCultivationTechnique' | 'auxiliaryTechniques' | 'techniquePoints' | 'relationships' | 'chosenPathIds' | 'knownRecipeIds' | 'danhVong' | 'reputation' | 'sect' | 'caveAbode' | 'techniqueCooldowns' | 'activeMissions' | 'inventoryActionLog'>,
      npcDensity: NpcDensity
  }) => {
    if (currentSlotId === null) {
        alert("Lỗi: Không có ô lưu nào được chọn.");
        return;
    }
    
    setIsLoading(true);

    const npcCount = NPC_DENSITY_LEVELS.find(d => d.id === gameStartData.npcDensity)?.count ?? 20;
    let estimatedTime = Math.ceil(npcCount * 0.4) + 5; // ~0.4s per NPC + 5s base time
    let remainingTime = estimatedTime;

    const messages = [
        'Đang nạp các mod đã kích hoạt...',
        'Thỉnh mời các vị thần...',
        'Vẽ nên sông núi, cây cỏ...',
        'Tạo ra chúng sinh vạn vật...',
        'An bài số mệnh, định ra nhân quả...'
    ];
    let messageIndex = 0;

    const updateLoadingMessage = () => {
        const message = messages[messageIndex];
        const timeString = remainingTime > 0 ? ` (Ước tính còn: ${remainingTime}s)` : ' (Sắp xong...)';
        setLoadingMessage(message + timeString);
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
        const activeMods: FullMod[] = [];
        const modLibrary: db.DbModInLibrary[] = await db.getModLibrary();
        const enabledModsInfo = modLibrary.filter(m => m.isEnabled);

        for (const modInfo of enabledModsInfo) {
            const modContent = await db.getModContent(modInfo.modInfo.id);
            if (modContent) activeMods.push(modContent);
        }
        
        const newGameState = await createNewGameState(gameStartData, activeMods);
        
        await db.saveGameState(currentSlotId, newGameState);
        await loadSaveSlots();
        
        // Rehydrate the new game state for rendering before setting it
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
  }, [currentSlotId, loadSaveSlots]);

  const renderContent = () => {
    if (isMigratingData) {
      return <LoadingScreen message={migrationMessage} />;
    }
    if (isLoading) {
      return <LoadingScreen message={loadingMessage} />;
    }

    switch (view) {
      case 'mainMenu':
        return <MainMenu onNavigate={handleNavigate} storageUsage={storageUsage} />;
      case 'saveSlots':
        return <SaveSlotScreen slots={saveSlots} onSelectSlot={handleSlotSelection} onBack={() => handleNavigate('mainMenu')} onDeleteSlot={handleDeleteGame} onVerifySlot={handleVerifyAndRepairSlot} />;
      case 'characterCreation':
        return <CharacterCreationScreen onBack={() => handleNavigate('saveSlots')} onGameStart={handleGameStart} />;
      case 'settings':
        return <SettingsPanel onBack={() => handleNavigate('mainMenu')} onSave={handleSettingsSave} settings={settings} onChange={handleSettingChange} />;
      case 'mods':
        return <ModsScreen onBack={() => handleNavigate('mainMenu')} onNavigate={handleNavigate} />;
      case 'createMod':
        return <CreateModScreen onBack={() => handleNavigate('mods')} />;
      case 'thoiThe':
        return <ThoiTheScreen onBack={() => handleNavigate('mainMenu')} />;
      case 'info':
        return <InfoScreen onBack={() => handleNavigate('mainMenu')} />;
      case 'gamePlay':
        if (!gameState) {
            return <LoadingScreen message="Đang tải dữ liệu..." />;
        }
        return <GamePlayScreen 
            settings={settings}
            gameState={gameState} 
            setGameState={setGameState} 
            onSaveGame={handleSaveGame}
            onBack={() => { setGameState(null); setCurrentSlotId(null); handleNavigate('mainMenu'); }} 
        />;
      default:
        return <MainMenu onNavigate={handleNavigate} storageUsage={storageUsage} />;
    }
  };
  
  const showHeader = view !== 'mainMenu' && view !== 'gamePlay' && !isLoading && !isMigratingData;

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center relative transition-all duration-500 ${view === 'gamePlay' ? '' : 'p-4 sm:p-6 lg:p-8'}`}>
      <div className={`w-full max-w-7xl transition-opacity duration-700 ${!showHeader ? 'opacity-0 h-0 invisible' : 'opacity-100'}`}>
        {showHeader && <Header />}
      </div>

      <main className={`w-full ${view === 'gamePlay' ? 'h-screen max-w-full' : 'max-w-7xl'}`}>
        {renderContent()}
      </main>
      
      {settings.enableDeveloperConsole && <DeveloperConsole />}
    </div>
  );
};

export default App;
