
import React, { useState, useEffect } from 'react';
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
import type { PlayerCharacter, Inventory, Currency, CultivationState, GameState, NpcDensity, GameDate, SaveSlot, Location, WorldState, StoryEntry, GameSettings, FullMod, ModInfo } from './types';
// FIX: Added NPC_DENSITY_LEVELS and INITIAL_TECHNIQUES to imports as they will be added to constants.ts to resolve module export errors.
import { REALM_SYSTEM, NPC_DENSITY_LEVELS, INITIAL_TECHNIQUES, WORLD_MAP, DEFAULT_SETTINGS, THEME_OPTIONS, CURRENT_GAME_VERSION } from './constants';
import { generateDynamicNpcs, reloadApiKeys } from './services/geminiService';

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
    if (savedGame.version === CURRENT_GAME_VERSION) {
        return savedGame as GameState;
    }

    let migratedData = { ...savedGame };
    let version = savedGame.version || "1.0.0";

    if (version === "1.0.0") {
        console.log("Migrating save from v1.0.0 to v1.1.0...");
        
        migratedData.activeMods = migratedData.activeMods ?? [];
        migratedData.realmSystem = migratedData.realmSystem ?? REALM_SYSTEM;
        migratedData.encounteredNpcIds = migratedData.encounteredNpcIds ?? [];

        if (migratedData.playerCharacter) {
            migratedData.playerCharacter.relationships = migratedData.playerCharacter.relationships ?? [];
            migratedData.playerCharacter.chosenPathIds = migratedData.playerCharacter.chosenPathIds ?? [];
            migratedData.playerCharacter.knownRecipeIds = migratedData.playerCharacter.knownRecipeIds ?? [];
        }
        
        migratedData.version = "1.1.0";
        version = "1.1.0";
    }

    if (version !== CURRENT_GAME_VERSION) {
        throw new Error(`Migration failed. Could not migrate from ${savedGame.version || 'unversioned'} to ${CURRENT_GAME_VERSION}.`);
    }
    
    return migratedData as GameState;
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

  useEffect(() => {
    loadSaveSlots();
  }, []);

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
        alert('Cài đặt đã được lưu!');
    } catch (error) {
        console.error("Failed to save settings to localStorage", error);
        alert('Lỗi: Không thể lưu cài đặt.');
    }
  };


  const loadSaveSlots = () => {
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
  };
  
  const handleSlotSelection = (slotId: number) => {
    const selectedSlot = saveSlots.find(s => s.id === slotId);

    if (selectedSlot && selectedSlot.data && selectedSlot.data.playerCharacter) {
        setLoadingMessage('Đang tải hành trình...');
        setIsLoading(true);
        setTimeout(() => {
            // The data in `selectedSlot` is now migrated and up-to-date.
            // We immediately re-save it to persist the migration.
            localStorage.setItem(`phongthan-gs-slot-${slotId}`, JSON.stringify(selectedSlot.data));

            setGameState(selectedSlot.data);
            setCurrentSlotId(slotId);
            setView('gamePlay');
            setIsLoading(false);
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


  const handleNavigate = (targetView: View) => {
    setView(targetView);
  };

  const handleGameStart = async (gameStartData: {
      characterData: Omit<PlayerCharacter, 'inventory' | 'currencies' | 'cultivation' | 'currentLocationId' | 'equipment' | 'techniques' | 'relationships' | 'chosenPathIds' | 'knownRecipeIds'>,
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
        };
        
        // Initial save
        localStorage.setItem(`phongthan-gs-slot-${currentSlotId}`, JSON.stringify(newGameState));
        loadSaveSlots();

        setGameState(newGameState);

        setIsLoading(false);
        setView('gamePlay');

    } catch (error) {
        console.error("Failed to start new game:", error);
        alert("Lỗi nghiêm trọng khi tạo thế giới. Vui lòng thử lại.");
        setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingScreen message={loadingMessage} />;
    }

    switch (view) {
      case 'mainMenu':
        return <MainMenu onNavigate={handleNavigate} />;
      case 'saveSlots':
        return <SaveSlotScreen slots={saveSlots} onSelectSlot={handleSlotSelection} onBack={() => handleNavigate('mainMenu')} />;
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
        return <MainMenu onNavigate={handleNavigate} />;
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
