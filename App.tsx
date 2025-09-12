
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import SettingsPanel from './components/SettingsPanel';
import CharacterCreationScreen from './components/CharacterCreationScreen';
import SaveSlotScreen from './components/SaveSlotScreen';
import MainMenu from './components/MainMenu';
import ModsScreen from './components/ModsScreen';
import CreateModScreen from './components/CreateModScreen';
import GamePlayScreen from './components/GamePlayScreen';
import LoadingScreen from './components/LoadingScreen';
import LoreScreen from './components/LoreScreen';
import type { PlayerCharacter, Inventory, Currency, CultivationState, GameState, NpcDensity, GameDate, SaveSlot, Location, WorldState, StoryEntry, GameSettings, FullMod, ModInfo, AttributeGroup, Attribute } from './types';
// FIX: Added NPC_DENSITY_LEVELS and INITIAL_TECHNIQUES to imports as they will be added to constants.ts to resolve module export errors.
import { REALM_SYSTEM, NPC_DENSITY_LEVELS, INITIAL_TECHNIQUES, WORLD_MAP, DEFAULT_SETTINGS, THEME_OPTIONS, CURRENT_GAME_VERSION, FACTIONS, ATTRIBUTES_CONFIG } from './constants';
import { generateDynamicNpcs, reloadApiKeys } from './services/geminiService';
import { FaQuestionCircle } from 'react-icons/fa';

export type View = 'mainMenu' | 'saveSlots' | 'characterCreation' | 'settings' | 'mods' | 'createMod' | 'gamePlay' | 'lore';

interface ModInLibrary {
    modInfo: ModInfo;
    isEnabled: boolean;
}

const initialStory: StoryEntry[] = [
    { id: 1, type: 'narrative', content: 'Màn sương mỏng dần, để lộ ra một con đường mòn phủ đầy lá rụng trong khu rừng tĩnh mịch. Không khí se lạnh mang theo mùi đất ẩm và cây cỏ. Xa xa, tiếng chim hót lảnh lót phá vỡ sự yên tĩnh. Đây là nơi câu chuyện của bạn bắt đầu.' },
    { id: 2, type: 'system', content: 'Bạn có thể dùng ô "Nói" để giao tiếp, "Hành Động" để tương tác, hoặc nhập "tu luyện" để tĩnh tọa hấp thụ linh khí.' },
];

const migrateGameState = (savedGame: any): GameState => {
    let dataToProcess = { ...savedGame };

    // --- Version Migration ---
    if (dataToProcess.version !== CURRENT_GAME_VERSION) {
        let version = dataToProcess.version || "1.0.0";

        if (version === "1.0.0") {
            console.log("Migrating save from v1.0.0 to v1.1.0...");
            
            dataToProcess.activeMods = dataToProcess.activeMods ?? [];
            dataToProcess.realmSystem = dataToProcess.realmSystem ?? REALM_SYSTEM;
            dataToProcess.encounteredNpcIds = dataToProcess.encounteredNpcIds ?? [];
            dataToProcess.activeStory = dataToProcess.activeStory ?? null;

            if (dataToProcess.playerCharacter) {
                dataToProcess.playerCharacter.relationships = dataToProcess.playerCharacter.relationships ?? [];
                dataToProcess.playerCharacter.reputation = dataToProcess.playerCharacter.reputation ?? FACTIONS.map(f => ({ factionName: f.name, value: 0, status: 'Trung Lập' }));
                dataToProcess.playerCharacter.chosenPathIds = dataToProcess.playerCharacter.chosenPathIds ?? [];
                dataToProcess.playerCharacter.knownRecipeIds = dataToProcess.playerCharacter.knownRecipeIds ?? [];
            }
            
            dataToProcess.version = "1.1.0";
            version = "1.1.0";
        }
    
        if (version !== CURRENT_GAME_VERSION) {
            throw new Error(`Migration failed. Could not migrate from ${savedGame.version || 'unversioned'} to ${CURRENT_GAME_VERSION}.`);
        }
    }

    // --- Rehydration Logic (runs for all loaded games) ---
    const allAttributesConfig = new Map<string, any>();
    ATTRIBUTES_CONFIG.forEach(group => {
        group.attributes.forEach(attr => {
            allAttributesConfig.set(attr.name, attr);
        });
    });

    const rehydrateAttributes = (groups: AttributeGroup[]): AttributeGroup[] => {
        return groups.map((group: AttributeGroup) => ({
            ...group,
            attributes: group.attributes.map((attr: Attribute) => {
                const config = allAttributesConfig.get(attr.name);
                return {
                    ...attr,
                    icon: config ? config.icon : FaQuestionCircle,
                    description: config ? config.description : attr.description,
                };
            }),
        }));
    };

    if (dataToProcess.playerCharacter?.attributes) {
        dataToProcess.playerCharacter.attributes = rehydrateAttributes(dataToProcess.playerCharacter.attributes);
    }

    if (dataToProcess.activeNpcs) {
        dataToProcess.activeNpcs = dataToProcess.activeNpcs.map((npc: any) => {
             if (npc.attributes) {
                npc.attributes = rehydrateAttributes(npc.attributes);
             }
             return npc;
        });
    }

    return dataToProcess as GameState;
};

const MAX_LOCAL_STORAGE_BYTES = 5 * 1024 * 1024; // 5 MB

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
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
  const [currentSlotId, setCurrentSlotId] = useState<number | null>(null);
  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
        const savedSettings = localStorage.getItem('game-settings');
        return savedSettings ? { ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) } : DEFAULT_SETTINGS;
    } catch (error) {
        console.error("Failed to load settings from localStorage", error);
        return DEFAULT_SETTINGS;
    }
  });
  const [storageUsage, setStorageUsage] = useState({ usageString: `0 B / ${formatBytes(MAX_LOCAL_STORAGE_BYTES)}`, percentage: 0 });

  const calculateLocalStorageUsage = useCallback((): { usageString: string; percentage: number } => {
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            const value = localStorage.getItem(key);
            if (value) {
                totalBytes += (key.length + value.length) * 2; // Each char is 2 bytes (UTF-16)
            }
        }
    }
    
    const usageString = `${formatBytes(totalBytes)} / ${formatBytes(MAX_LOCAL_STORAGE_BYTES)}`;
    const percentage = Math.min(100, (totalBytes / MAX_LOCAL_STORAGE_BYTES) * 100);
    
    return { usageString, percentage };
  }, []);


  const updateStorageUsage = useCallback(() => {
    setStorageUsage(calculateLocalStorageUsage());
  }, [calculateLocalStorageUsage]);

  const loadSaveSlots = useCallback(() => {
    const loadedSlots: SaveSlot[] = [];
    for (let i = 1; i <= 9; i++) {
        try {
            const savedGameRaw = localStorage.getItem(`phongthan-gs-slot-${i}`);
            if (savedGameRaw) {
                const savedGame: any = JSON.parse(savedGameRaw);
                const migratedGame = migrateGameState(savedGame);
                loadedSlots.push({ id: i, data: migratedGame });
            } else {
                loadedSlots.push({ id: i, data: null });
            }
        } catch (error) {
            console.error(`Slot ${i} is corrupted or incompatible and will be cleared. Error:`, error);
            localStorage.removeItem(`phongthan-gs-slot-${i}`);
            loadedSlots.push({ id: i, data: null });
        }
    }
    setSaveSlots(loadedSlots);
    updateStorageUsage();
  }, [updateStorageUsage]);

  useEffect(() => {
    loadSaveSlots();
  }, [loadSaveSlots]);
  
  // Real-time auto-save
  useEffect(() => {
    if (view === 'gamePlay' && gameState && currentSlotId !== null) {
        const debounceSave = setTimeout(() => {
            try {
                const gameStateToSave: GameState = { 
                    ...gameState, 
                    version: CURRENT_GAME_VERSION,
                    lastSaved: new Date().toISOString() 
                };
                localStorage.setItem(`phongthan-gs-slot-${currentSlotId}`, JSON.stringify(gameStateToSave));
                
                setSaveSlots(prevSlots => prevSlots.map(slot => 
                    slot.id === currentSlotId ? { ...slot, data: gameStateToSave } : slot
                ));
                
                console.log(`Đã tự động lưu vào ô ${currentSlotId} lúc ${new Date().toLocaleTimeString()}`);
                updateStorageUsage();
            } catch (error) {
                console.error("Tự động lưu thất bại", error);
            }
        }, 1500); // Debounce for 1.5 seconds

        return () => clearTimeout(debounceSave);
    }
  }, [gameState, view, currentSlotId, updateStorageUsage]);


  useEffect(() => {
    // Apply font family directly
    document.body.style.fontFamily = settings.fontFamily;

    // Manage theme classes by removing all possible themes and adding the current one
    THEME_OPTIONS.forEach(themeOption => {
        document.body.classList.remove(themeOption.value);
    });
    if (settings.theme && settings.theme !== 'theme-amber') { // 'theme-amber' is the default via :root
        document.body.classList.add(settings.theme);
    }
    
    // Manage layout classes by removing all layout modes and adding the current one
    document.body.classList.remove('force-desktop', 'force-mobile');
    if (settings.layoutMode === 'desktop') {
      document.body.classList.add('force-desktop');
    } else if (settings.layoutMode === 'mobile') {
      document.body.classList.add('force-mobile');
    }

    // Manage performance mode class
    if (settings.enablePerformanceMode) {
        document.body.classList.add('performance-mode');
    } else {
        document.body.classList.remove('performance-mode');
    }
  }, [settings]); // Depend on the entire settings object for robustness

  const handleSettingChange = (key: keyof GameSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSettingsSave = () => {
    try {
        localStorage.setItem('game-settings', JSON.stringify(settings));
        reloadApiKeys();
        updateStorageUsage();
        alert('Cài đặt đã được lưu!');
    } catch (error) {
        console.error("Failed to save settings to localStorage", error);
        alert('Lỗi: Không thể lưu cài đặt.');
    }
  };


  const handleSlotSelection = (slotId: number) => {
    const selectedSlot = saveSlots.find(s => s.id === slotId);

    if (selectedSlot && selectedSlot.data && selectedSlot.data.playerCharacter) {
        setLoadingMessage('Đang tải hành trình...');
        setIsLoading(true);
        setTimeout(() => {
            try {
                const loadedData = selectedSlot.data;

                const isDataStructureValid = 
                    loadedData &&
                    typeof loadedData.playerCharacter === 'object' && loadedData.playerCharacter !== null &&
                    Array.isArray(loadedData.playerCharacter.attributes) &&
                    typeof loadedData.playerCharacter.inventory === 'object' && loadedData.playerCharacter.inventory !== null &&
                    Array.isArray(loadedData.playerCharacter.inventory.items) &&
                    typeof loadedData.playerCharacter.cultivation === 'object' && loadedData.playerCharacter.cultivation !== null &&
                    typeof loadedData.playerCharacter.currentLocationId === 'string' &&
                    Array.isArray(loadedData.activeNpcs) &&
                    Array.isArray(loadedData.discoveredLocations) && loadedData.discoveredLocations.length > 0 &&
                    typeof loadedData.worldState === 'object' && loadedData.worldState !== null &&
                    Array.isArray(loadedData.worldState.rumors) &&
                    typeof loadedData.gameDate === 'object' && loadedData.gameDate !== null &&
                    Array.isArray(loadedData.storyLog) &&
                    Array.isArray(loadedData.realmSystem) && loadedData.realmSystem.length > 0 &&
                    Array.isArray(loadedData.activeMods);

                if (!isDataStructureValid) {
                    console.error("Dữ liệu save không hợp lệ hoặc bị hỏng. Không thể tải.", loadedData);
                    alert("Không thể tải dữ liệu. Dữ liệu có thể đã bị hỏng. Vui lòng thử chức năng 'Kiểm tra và sửa lỗi' trên ô save này.");
                    setIsLoading(false);
                    return;
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
        // Start New Game for empty or invalid slots
        setCurrentSlotId(slotId);
        setView('characterCreation');
    }
  };

  const handleSaveGame = (currentState: GameState, showNotification: (message: string) => void) => {
    if (currentState && currentSlotId !== null) {
        try {
            const gameStateToSave: GameState = { 
                ...currentState, 
                version: CURRENT_GAME_VERSION,
                lastSaved: new Date().toISOString() 
            };
            localStorage.setItem(`phongthan-gs-slot-${currentSlotId}`, JSON.stringify(gameStateToSave));
            setGameState(gameStateToSave);
            loadSaveSlots();
            showNotification('Đã lưu game thành công!');
        } catch (error) {
            console.error("Failed to save game", error);
            showNotification('Lỗi: Không thể lưu game.');
        }
    }
  };

  const handleDeleteGame = (slotId: number) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn dữ liệu ở ô ${slotId}? Hành động này không thể hoàn tác.`)) {
      try {
        localStorage.removeItem(`phongthan-gs-slot-${slotId}`);
        loadSaveSlots();
        alert(`Đã xóa dữ liệu ở ô ${slotId}.`);
      } catch (error) {
        console.error("Failed to delete save slot", error);
        alert('Lỗi: Không thể xóa dữ liệu.');
      }
    }
  };

  const handleVerifyAndRepairSlot = (slotId: number) => {
    setLoadingMessage(`Đang kiểm tra ô ${slotId}...`);
    setIsLoading(true);
    setTimeout(() => {
        try {
            const savedGameRaw = localStorage.getItem(`phongthan-gs-slot-${slotId}`);
            if (!savedGameRaw) {
                throw new Error("Không có dữ liệu để kiểm tra.");
            }
            const savedGame: any = JSON.parse(savedGameRaw);
            const migratedGame = migrateGameState(savedGame);

            const gameStateToSave: GameState = {
                ...migratedGame,
                version: CURRENT_GAME_VERSION,
            };
            localStorage.setItem(`phongthan-gs-slot-${slotId}`, JSON.stringify(gameStateToSave));
            
            loadSaveSlots();
            alert(`Ô ${slotId} đã được kiểm tra và cập nhật thành công!`);
        } catch (error) {
            console.error(`Error verifying/repairing slot ${slotId}:`, error);
            alert(`Ô ${slotId} bị lỗi không thể sửa. Dữ liệu có thể đã bị hỏng nặng.`);
        } finally {
            setIsLoading(false);
        }
    }, 500);
  };


  const handleNavigate = (targetView: View) => {
    setView(targetView);
  };

  const handleGameStart = async (gameStartData: {
      characterData: Omit<PlayerCharacter, 'inventory' | 'currencies' | 'cultivation' | 'currentLocationId' | 'equipment' | 'techniques' | 'relationships' | 'chosenPathIds' | 'knownRecipeIds' | 'reputation'>,
      npcDensity: NpcDensity
  }) => {
    if (currentSlotId === null) {
        alert("Lỗi: Không có ô lưu nào được chọn.");
        return;
    }
    const { characterData, npcDensity } = gameStartData;
    setLoadingMessage('Đang kiến tạo thế giới, xin chờ...');
    setIsLoading(true);
    
    // Clear any previous save in the selected slot
    try {
        localStorage.removeItem(`phongthan-gs-slot-${currentSlotId}`);
    } catch (error) {
        console.error("Failed to remove old save", error);
    }


    try {
        setLoadingMessage('Đang nạp các mod đã kích hoạt...');
        const activeMods: FullMod[] = [];
        const modLibrary: ModInLibrary[] = JSON.parse(localStorage.getItem('mod-library') || '[]');
        const enabledModsInfo = modLibrary.filter(m => m.isEnabled);

        for (const modInfo of enabledModsInfo) {
            try {
                const modContentRaw = localStorage.getItem(`mod-content-${modInfo.modInfo.id}`);
                if (modContentRaw) {
                    activeMods.push(JSON.parse(modContentRaw));
                }
            } catch (e) {
                console.error(`Failed to load content for mod ${modInfo.modInfo.id}`, e);
            }
        }

        // Determine Realm System
        const modRealmSystem = activeMods.find(m => m.content.realmConfigs)?.content.realmConfigs;
        const realmSystemToUse = modRealmSystem && modRealmSystem.length > 0
            // FIX: The type for a mod's realm config omits the `id`. Generate a new ID from the name instead of trying to access a non-existent `id` property.
            ? modRealmSystem.map(realm => ({...realm, id: realm.name.toLowerCase().replace(/\s+/g, '_')}))
            : REALM_SYSTEM;


        setLoadingMessage('Đang tạo ra chúng sinh...');
        const densitySetting = NPC_DENSITY_LEVELS.find(d => d.id === npcDensity);
        const generatedNpcs = await generateDynamicNpcs(densitySetting?.count ?? 15);
        
        if (!generatedNpcs || generatedNpcs.length === 0) {
            throw new Error("AI không thể tạo ra chúng sinh cho thế giới này. Vui lòng kiểm tra API Key hoặc thử lại.");
        }
        
        const allNpcs = [...generatedNpcs];
        
        setLoadingMessage('Đang định hình Thiên Mệnh...');

        const nhucThanAttr = characterData.attributes.flatMap(g => g.attributes).find(a => a.name === 'Nhục Thân');
        const nhucThanValue = (nhucThanAttr?.value as number) || 10;
        const initialWeightCapacity = 15 + (nhucThanValue - 10) * 2; // Base 15kg, +2kg per point of Nhục Thân above 10

        const initialInventory: Inventory = {
            weightCapacity: initialWeightCapacity,
            items: [
                { id: 'item1', name: 'Bình Dược Liệu', description: 'Một bình sứ chứa thảo dược cơ bản để trị thương.', quantity: 5, type: 'Đan Dược', icon: '🏺', weight: 0.5, quality: 'Phàm Phẩm' },
                { id: 'item2', name: 'Trường Bào Đạo Sĩ', description: 'Một bộ y phục của người tu đạo, giúp tĩnh tâm凝神.', quantity: 1, type: 'Phòng Cụ', icon: '🥋', bonuses: [{ attribute: 'Nguyên Thần', value: 1 }], weight: 1.5, quality: 'Phàm Phẩm', slot: 'Thượng Y' },
                { id: 'item3', name: 'Đào Mộc Kiếm', description: 'Một thanh kiếm bằng gỗ đào, có khả năng khắc chế yêu ma tà mị.', quantity: 1, type: 'Vũ Khí', icon: '🗡️', bonuses: [{ attribute: 'Tiên Lực', value: 2 }], weight: 2.0, quality: 'Phàm Phẩm', slot: 'Vũ Khí' },
                { id: 'item4', name: 'Lệnh Bài Thân Phận', description: 'Một lệnh bài bằng gỗ đào, khắc tên và xuất thân của bạn.', quantity: 1, type: 'Tạp Vật', icon: '🪪', weight: 0.1, quality: 'Phàm Phẩm' },
                { id: 'item5', name: 'Phá Cấm Phù', description: 'Một lá bùa đơn giản có thể phá giải các cấm chế cấp thấp.', quantity: 3, type: 'Pháp Bảo', rank: 'Phàm Giai', icon: '📜', bonuses: [{ attribute: 'Nguyên Thần', value: 1 }], weight: 0.1, quality: 'Linh Phẩm' },
                { id: 'item6', name: 'Sơ Cấp Tu Luyện Tâm Pháp', description: 'Ghi lại những khẩu quyết cơ bản để dẫn khí nhập thể, giúp tăng tốc độ tu luyện ban đầu.', quantity: 1, type: 'Tạp Vật', icon: '📖', bonuses: [{ attribute: 'Cảm Ngộ', value: 2 }], weight: 0.5, quality: 'Phàm Phẩm' },
                { id: 'item7', name: 'Hồi Khí Đan - Đan Phương', description: 'Ghi lại phương pháp luyện chế Hồi Khí Đan Hạ Phẩm. Có thể học bằng cách sử dụng.', quantity: 1, type: 'Đan Phương', icon: '📜', weight: 0.1, quality: 'Phàm Phẩm', recipeId: 'recipe_hoi_khi_dan_ha_pham' },
            ]
        };
        const initialCurrencies: Currency = {
            'Linh thạch hạ phẩm': 20,
            'Bạc': 100,
        };

        const initialCultivation: CultivationState = {
            currentRealmId: realmSystemToUse[0].id,
            currentStageId: realmSystemToUse[0].stages[0].id,
            spiritualQi: 0,
            hasConqueredInnerDemon: false,
        };
        
        const updatedAttributes = characterData.attributes.map(group => {
            if (group.title === 'Chỉ số Sinh Tồn') {
                return {
                    ...group,
                    attributes: group.attributes.map(attr => {
                        if (attr.name === 'Sinh Mệnh' || attr.name === 'Linh Lực') {
                            return { ...attr, maxValue: attr.value as number };
                        }
                        return attr;
                    })
                };
            }
            return group;
        });
        
        // FIX: Fixed typo "Thôn L làng" to "Thôn Làng" to correctly filter for starting locations.
        const initialCoreLocations = WORLD_MAP.filter(l => l.type === 'Thành Thị' || l.type === 'Thôn Làng');
        const randomStartIndex = Math.floor(Math.random() * initialCoreLocations.length);
        const startingLocation = initialCoreLocations.length > 0 ? initialCoreLocations[randomStartIndex] : WORLD_MAP[0];

        const finalPlayerCharacter: PlayerCharacter = {
            identity: { ...characterData.identity, age: 18 },
            attributes: updatedAttributes,
            talents: characterData.talents,
            inventory: initialInventory,
            currencies: initialCurrencies,
            cultivation: initialCultivation,
            currentLocationId: startingLocation.id,
            equipment: {},
            techniques: INITIAL_TECHNIQUES,
            relationships: [],
            reputation: FACTIONS.map(f => ({ factionName: f.name, value: 0, status: 'Trung Lập' })),
            chosenPathIds: [],
            knownRecipeIds: [],
        };
        
        const initialGameDate: GameDate = {
            era: 'Tiên Phong Thần',
            year: 1,
            season: 'Xuân',
            day: 1,
            timeOfDay: 'Buổi Sáng',
            shichen: 'Tỵ',
            weather: 'SUNNY',
            actionPoints: 4,
            maxActionPoints: 4,
        };
        
        const initialWorldState: WorldState = {
            rumors: [],
        };

        const newGameState: GameState = {
            version: CURRENT_GAME_VERSION,
            playerCharacter: finalPlayerCharacter,
            activeNpcs: allNpcs,
            gameDate: initialGameDate,
            discoveredLocations: [startingLocation, ...WORLD_MAP.filter(l => l.neighbors.includes(startingLocation.id))],
            worldState: initialWorldState,
            storyLog: initialStory,
            encounteredNpcIds: [],
            activeMods: activeMods,
            realmSystem: realmSystemToUse,
            activeStory: null,
        };
        
        // Initial save
        localStorage.setItem(`phongthan-gs-slot-${currentSlotId}`, JSON.stringify(newGameState));
        loadSaveSlots();

        setGameState(newGameState);
        setView('gamePlay');

    } catch (error) {
        console.error("Failed to start new game:", error);
        alert(`Lỗi nghiêm trọng khi tạo thế giới: ${(error as Error).message}. Vui lòng thử lại.`);
    } finally {
        setIsLoading(false);
    }
  };

  const renderContent = () => {
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
      case 'lore':
        return <LoreScreen onBack={() => handleNavigate('mainMenu')} />;
      case 'gamePlay':
        if (!gameState) {
            // This case prevents the "black screen" by showing a loader if gameState is not ready
            return <LoadingScreen message="Đang tải dữ liệu..." />;
        }
        return <GamePlayScreen 
            gameState={gameState} 
            setGameState={setGameState} 
            onSaveGame={handleSaveGame}
            onBack={() => { setGameState(null); setCurrentSlotId(null); handleNavigate('mainMenu'); }} 
        />;
      default:
        return <MainMenu onNavigate={handleNavigate} storageUsage={storageUsage} />;
    }
  };
  
  const showHeader = view !== 'mainMenu' && view !== 'gamePlay' && !isLoading;

  return (
    <div className={`min-h-screen w-full flex flex-col items-center justify-center relative transition-all duration-500 ${view === 'gamePlay' ? '' : 'p-4 sm:p-6 lg:p-8'}`}>
      <div className={`w-full max-w-7xl transition-opacity duration-700 ${!showHeader ? 'opacity-0 h-0 invisible' : 'opacity-100'}`}>
        {showHeader && <Header />}
      </div>

      <main className={`w-full ${view === 'gamePlay' ? 'h-screen max-w-full' : 'max-w-7xl'}`}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
