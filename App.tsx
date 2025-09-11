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
import type { PlayerCharacter, Inventory, Currency, CultivationState, GameState, NpcDensity, GameDate, SaveSlot, Location, WorldState } from './types';
import { REALM_SYSTEM, NPC_LIST, NPC_DENSITY_LEVELS, INITIAL_TECHNIQUES, WORLD_MAP } from './constants';
import { generateDynamicNpcs } from './services/geminiService';

export type View = 'mainMenu' | 'saveSlots' | 'characterCreation' | 'settings' | 'mods' | 'createMod' | 'gamePlay' | 'lore';


const App: React.FC = () => {
  const [view, setView] = useState<View>('mainMenu');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [saveSlots, setSaveSlots] = useState<SaveSlot[]>([]);
  const [currentSlotId, setCurrentSlotId] = useState<number | null>(null);

  useEffect(() => {
    loadSaveSlots();
  }, []);

  const loadSaveSlots = () => {
    const loadedSlots: SaveSlot[] = [];
    for (let i = 1; i <= 9; i++) {
        try {
            const savedGameRaw = localStorage.getItem(`phongthan-gs-slot-${i}`);
            if (savedGameRaw) {
                const savedGame: GameState = JSON.parse(savedGameRaw);
                loadedSlots.push({ id: i, data: savedGame });
            } else {
                loadedSlots.push({ id: i, data: null });
            }
        } catch (error) {
            console.error(`Failed to load slot ${i}`, error);
            localStorage.removeItem(`phongthan-gs-slot-${i}`); // Clear corrupted data
            loadedSlots.push({ id: i, data: null });
        }
    }
    setSaveSlots(loadedSlots);
  };
  
  const handleSlotSelection = (slotId: number) => {
    const selectedSlot = saveSlots.find(s => s.id === slotId);
    if (selectedSlot && selectedSlot.data) {
        // Load Game
        setGameState(selectedSlot.data);
        setCurrentSlotId(slotId);
        setView('gamePlay');
    } else {
        // Start New Game
        setCurrentSlotId(slotId);
        setView('characterCreation');
    }
  };

  const handleSaveGame = (showNotification: (message: string) => void) => {
    if (gameState && currentSlotId !== null) {
        try {
            const gameStateWithTimestamp: GameState = { ...gameState, lastSaved: new Date().toISOString() };
            localStorage.setItem(`phongthan-gs-slot-${currentSlotId}`, JSON.stringify(gameStateWithTimestamp));
            setGameState(gameStateWithTimestamp); // Update state with timestamp
            loadSaveSlots(); // Refresh slot data
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
      characterData: Omit<PlayerCharacter, 'inventory' | 'currencies' | 'cultivation' | 'currentLocationId' | 'equipment' | 'techniques'>,
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
        setLoadingMessage('Đang tạo ra chúng sinh...');
        const densitySetting = NPC_DENSITY_LEVELS.find(d => d.id === npcDensity);
        const generatedNpcs = await generateDynamicNpcs(densitySetting?.count ?? 15);
        const allNpcs = [...NPC_LIST, ...generatedNpcs];
        
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
            ]
        };
        const initialCurrencies: Currency = {
            'Linh thạch hạ phẩm': 20,
            'Bạc': 100,
        };

        const initialCultivation: CultivationState = {
            currentRealmId: REALM_SYSTEM[0].id,
            currentStageId: REALM_SYSTEM[0].stages[0].id,
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

        const finalPlayerCharacter: PlayerCharacter = {
            identity: characterData.identity,
            attributes: updatedAttributes,
            talents: characterData.talents, // Explicitly assign talents to fix bug
            inventory: initialInventory,
            currencies: initialCurrencies,
            cultivation: initialCultivation,
            currentLocationId: 'thanh_ha_tran',
            equipment: {},
            techniques: INITIAL_TECHNIQUES,
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
        
        const initialDiscoveredLocations: Location[] = [
            WORLD_MAP.find(l => l.id === 'thanh_ha_tran')!
        ];
        
        const initialWorldState: WorldState = {
            rumors: [],
        };

        const newGameState: GameState = {
            playerCharacter: finalPlayerCharacter,
            activeNpcs: allNpcs,
            gameDate: initialGameDate,
            discoveredLocations: initialDiscoveredLocations,
            worldState: initialWorldState,
            encounteredNpcIds: [],
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
        return <SettingsPanel onBack={() => handleNavigate('mainMenu')} />;
      case 'mods':
        return <ModsScreen onBack={() => handleNavigate('mainMenu')} onNavigate={handleNavigate} />;
      case 'createMod':
        return <CreateModScreen onBack={() => handleNavigate('mods')} />;
      case 'lore':
        return <LoreScreen onBack={() => handleNavigate('mainMenu')} />;
      case 'gamePlay':
        return <GamePlayScreen 
            gameState={gameState!} 
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
    <div className={`min-h-screen w-full flex flex-col items-center justify-center font-serif relative transition-all duration-500 ${view === 'gamePlay' ? '' : 'p-4 sm:p-6 lg:p-8'}`}>
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