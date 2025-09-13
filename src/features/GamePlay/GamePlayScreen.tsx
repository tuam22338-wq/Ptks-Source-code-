import React, { useState, useMemo, useEffect, memo } from 'react';
// FIX: Add GameSettings to the import from '../../types' to resolve the props type error.
import type { GameState, GameSettings, StoryEntry, GameDate, Season, Weather, Location, NPC, PlayerCharacter, GameEvent, EventChoice, InventoryItem, EquipmentSlot, StatBonus, Rumor, WorldState, CultivationTechnique, PlayerNpcRelationship, AttributeGroup, CultivationPath, CombatState, Attribute, RealmConfig } from '../../types';
import StoryLog from './components/StoryLog';
import ActionBar from './components/ActionBar';
import Sidebar from './components/Sidebar/Sidebar';
import Timeline from '../../components/Timeline';
import EventPanel from './EventPanel';
import ShopModal from './components/ShopModal';
import CultivationPathModal from './components/CultivationPathModal';
import CustomStoryPlayer from './components/CustomStoryPlayer';
import LoadingScreen from '../../components/LoadingScreen';
import LoadingSpinner from '../../components/LoadingSpinner';
import CombatScreen from './components/CombatScreen';
import DialoguePanel from './components/DialoguePanel';
import NotificationArea from '../../components/NotificationArea';
import { FaBars, FaTimes, FaExclamationTriangle, FaCog, FaSave } from 'react-icons/fa';
import { generateStoryContinuationStream, generateGameEvent, generateDynamicLocation, analyzeActionForTechnique, generateBreakthroughNarrative, generateWorldEvent, generateCombatNarrative, generateEventIllustration } from '../../services/geminiService';
import { SHICHEN_LIST, REALM_SYSTEM, TIMEOFDAY_DETAILS, NPC_LIST, INNATE_TALENT_RANKS, CULTIVATION_PATHS, CHARACTER_STATUS_CONFIG } from '../../constants';


interface GamePlayScreenProps {
    // FIX: Add the 'settings' prop to align with its usage in App.tsx.
    settings: GameSettings;
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    onSaveGame: (currentState: GameState, showNotification: (message: string) => void) => void;
    onBack: () => void;
}

const NpcInfoModal: React.FC<{ npc: NPC; allNpcs: NPC[]; onClose: () => void }> = memo(({ npc, allNpcs, onClose }) => {
  const statusInfo = CHARACTER_STATUS_CONFIG[npc.healthStatus];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }} onClick={onClose}>
        <div className="themed-modal rounded-lg shadow-2xl shadow-black/50 w-full max-w-md m-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-xl text-[var(--primary-accent-color)] font-bold font-title">{npc.identity.name}</h3>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
                <div>
                    <p className="text-sm text-gray-400 font-semibold">Trạng thái</p>
                    <p className="text-gray-300 italic">"{npc.status}"</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400 font-semibold">Tình trạng</p>
                    <p className={`font-semibold ${statusInfo.color}`}>{statusInfo.label}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400 font-semibold">Ngoại hình</p>
                    <p className="text-gray-300">{npc.identity.appearance}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-400 font-semibold">Xuất thân</p>
                    <p className="text-gray-300">{npc.identity.origin}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-400 font-semibold">Tính cách</p>
                    <p className="text-gray-300">{npc.identity.personality}</p>
                </div>
                 {npc.relationships && npc.relationships.length > 0 && (
                    <div>
                        <p className="text-sm text-gray-400 font-semibold">Quan Hệ</p>
                        <div className="space-y-2 mt-1">
                            {npc.relationships.map((rel, index) => {
                                const targetNpc = allNpcs.find(n => n.id === rel.targetNpcId);
                                if (!targetNpc) return null;
                                return (
                                    <div key={index} className="text-gray-300 bg-black/20 px-3 py-2 rounded-md border border-gray-700/60">
                                        <p className="font-semibold text-purple-300">
                                            {rel.type} với <span className="text-amber-300">{targetNpc.identity.name}</span>
                                        </p>
                                        <p className="text-xs italic text-gray-400">{rel.description}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
                <div>
                    <h4 className="text-md text-gray-300 font-title font-semibold mb-2">Tiên Tư</h4>
                    <div className="space-y-3">
                        {npc.talents.length > 0 ? npc.talents.map(talent => {
                            const rankStyle = INNATE_TALENT_RANKS[talent.rank] || INNATE_TALENT_RANKS['Phàm Giai'];
                            return (
                                <div key={talent.name} className="bg-black/20 p-3 rounded-lg border border-gray-700/60" title={talent.effect}>
                                    <h5 className={`font-bold font-title ${rankStyle.color}`}>{talent.name} <span className="text-xs">[{talent.rank}]</span></h5>
                                    <p className="text-xs text-gray-400">{talent.description}</p>
                                </div>
                            )
                        }) : <p className="text-sm text-gray-500">Không có tiên tư đặc biệt.</p>}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
});

const GameMenuModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    onExit: () => void;
}> = memo(({ isOpen, onClose, onSave, onExit }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }} onClick={onClose}>
            <div className="themed-modal rounded-lg shadow-2xl shadow-black/50 w-full max-w-xs m-4 p-4 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl text-center text-gray-200 font-bold font-title mb-2">Tùy Chọn</h3>
                <button onClick={onSave} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 transition-colors">
                    <FaSave /> Lưu Game
                </button>
                <button onClick={onExit} className="w-full px-4 py-3 bg-red-800/80 text-white font-bold rounded-lg hover:bg-red-700/80 transition-colors">
                    Về Menu Chính
                </button>
                <button onClick={onClose} className="w-full px-4 py-3 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80 transition-colors">
                    Tiếp Tục
                </button>
            </div>
        </div>
    );
});


const TRAVEL_SPEED = 3;

const getNewWeather = (season: Season): Weather => {
    const rand = Math.random();
    switch (season) {
        case 'Hạ': if (rand < 0.5) return 'SUNNY'; if (rand < 0.8) return 'RAIN'; return 'STORM';
        case 'Thu': if (rand < 0.5) return 'SUNNY'; if (rand < 0.9) return 'CLOUDY'; return 'RAIN';
        case 'Đông': if (rand < 0.5) return 'CLOUDY'; if (rand < 0.8) return 'SNOW'; return 'SUNNY';
        case 'Xuân': default: if (rand < 0.6) return 'SUNNY'; if (rand < 0.8) return 'CLOUDY'; return 'RAIN';
    }
};

const pureAdvanceTime = (currentDate: GameDate, shichenToAdvance: number = 1): { newDate: GameDate, yearPassed: boolean, monthPassed: boolean } => {
    let newDate = { ...currentDate };
    let yearPassed = false;
    let monthPassed = false;
    
    let currentShichenIndex = SHICHEN_LIST.findIndex(s => s.name === newDate.shichen);
    
    const totalShichenAdvanced = currentShichenIndex + shichenToAdvance;
    const daysToAdd = Math.floor(totalShichenAdvanced / SHICHEN_LIST.length);
    const finalShichenIndex = totalShichenAdvanced % SHICHEN_LIST.length;

    newDate.shichen = SHICHEN_LIST[finalShichenIndex].name;
    newDate.timeOfDay = TIMEOFDAY_DETAILS[newDate.shichen].name;
    
    if (daysToAdd > 0) {
        newDate.day += daysToAdd;
        newDate.weather = getNewWeather(newDate.season);
        while (newDate.day > 30) {
            newDate.day -= 30;
            monthPassed = true;
            const seasons: Season[] = ['Xuân', 'Hạ', 'Thu', 'Đông'];
            const seasonIndex = seasons.findIndex(s => s === newDate.season);
            const nextSeasonIndex = (seasonIndex + 1) % seasons.length;
            newDate.season = seasons[nextSeasonIndex];
            if (nextSeasonIndex === 0) {
                newDate.year++;
                yearPassed = true;
            }
        }
    }
    
    newDate.actionPoints = newDate.maxActionPoints;
    return { newDate, yearPassed, monthPassed };
};


const simulateNpcMovement = (currentNpcs: NPC[], discoveredLocations: Location[], shichenPassed: number): NPC[] => {
    return currentNpcs.map(npc => {
        if (NPC_LIST.some(canonNpc => canonNpc.id === npc.id)) return npc;
        
        let newNpc = { ...npc };
        for (let i = 0; i < shichenPassed; i++) {
            if (Math.random() < 0.05) {
                const currentLocation = discoveredLocations.find(loc => loc.id === newNpc.locationId);
                if (currentLocation && currentLocation.neighbors.length > 0) {
                    const knownNeighbors = currentLocation.neighbors.filter(nId => discoveredLocations.some(l => l.id === nId));
                    if(knownNeighbors.length > 0) {
                        const newLocationId = knownNeighbors[Math.floor(Math.random() * knownNeighbors.length)];
                        newNpc.locationId = newLocationId;
                    }
                }
            }
        }
        return newNpc;
    });
};

const deepCopyAttributes = (attributeGroups: AttributeGroup[]): AttributeGroup[] => {
    return attributeGroups.map(group => ({
        ...group,
        attributes: group.attributes.map(attr => ({ ...attr })),
    }));
};

const applyBonuses = (pc: PlayerCharacter, bonuses: StatBonus[], operation: 'add' | 'subtract'): PlayerCharacter => {
    const newAttributes = deepCopyAttributes(pc.attributes);
    const multiplier = operation === 'add' ? 1 : -1;

    bonuses.forEach(bonus => {
        for (const group of newAttributes) {
            const attr = group.attributes.find(a => a.name === bonus.attribute);
            if (attr && typeof attr.value === 'number') {
                const newValue = (attr.value as number) + (bonus.value * multiplier);
                attr.value = newValue;
                if (attr.maxValue !== undefined) {
                    const newMaxValue = (attr.maxValue as number) + (bonus.value * multiplier);
                    attr.maxValue = newMaxValue;
                    if (operation === 'subtract' && attr.value > newMaxValue) {
                        attr.value = newMaxValue;
                    }
                }
                break;
            }
        }
    });
    return { ...pc, attributes: newAttributes };
};


const GamePlayScreen: React.FC<GamePlayScreenProps> = ({ settings, gameState, setGameState, onSaveGame, onBack }) => {
    if (!gameState || !gameState.playerCharacter || !Array.isArray(gameState.discoveredLocations) || gameState.discoveredLocations.length === 0 || !gameState.gameDate) {
        console.error("Invalid gameState provided to GamePlayScreen, returning to menu.", gameState);
        useEffect(() => {
            onBack();
            alert("Dữ liệu game bị lỗi, đã quay về menu chính.");
        }, [onBack]);
        return <LoadingScreen message="Dữ liệu game bị lỗi..." />;
    }

    const [isAILoading, setIsAILoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [viewingNpc, setViewingNpc] = useState<NPC | null>(null);
    const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState<{ id: number, message: string }[]>([]);
    const [activeShopId, setActiveShopId] = useState<string | null>(null);
    const [pendingPathChoice, setPendingPathChoice] = useState<CultivationPath[] | null>(null);
    const [isGeneratingIllustration, setIsGeneratingIllustration] = useState(false);
    const [illustrationToDisplay, setIllustrationToDisplay] = useState<{ imageUrl: string; narrative: string } | null>(null);
    
    const { playerCharacter, activeNpcs, gameDate, discoveredLocations, worldState, storyLog, encounteredNpcIds, realmSystem, activeMods, activeStory, combatState, dialogueWithNpcId } = gameState;
    
    const currentRealmData = realmSystem.find(r => r.id === playerCharacter.cultivation.currentRealmId);
    const currentStageData = currentRealmData?.stages.find(s => s.id === playerCharacter.cultivation.currentStageId);

    const showNotification = (message: string) => {
        const newNotification = { id: Date.now(), message };
        setNotifications(prev => [...prev, newNotification]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
        }, 4000);
    };

    useEffect(() => {
        const handleResize = () => {
            const isDesktop = window.innerWidth > 1024;
            const isForcingMobile = document.body.classList.contains('force-mobile');
            const isForcingDesktop = document.body.classList.contains('force-desktop');

            if (isForcingDesktop) {
                 setIsSidebarOpen(true);
            } else if (isForcingMobile) {
            } else {
                 setIsSidebarOpen(isDesktop);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const addStoryEntry = (newEntryData: Omit<StoryEntry, 'id'> & { id?: number }) => {
        setGameState(gs => {
            if (!gs) return null;
            const newEntry: StoryEntry = { ...newEntryData, id: newEntryData.id || Date.now() + Math.random() };
            return {
                ...gs,
                storyLog: [...gs.storyLog, newEntry]
            };
        });
    };

    const { currentLocation, npcsAtLocation, neighbors } = useMemo(() => {
        const loc = discoveredLocations.find(l => l.id === playerCharacter.currentLocationId) || discoveredLocations[0];
        const npcs = activeNpcs.filter(n => n.locationId === loc.id);
        const neighborLocations = discoveredLocations.filter(l => loc.neighbors.includes(l.id));
        return { currentLocation: loc, npcsAtLocation: npcs, neighbors: neighborLocations };
    }, [playerCharacter.currentLocationId, activeNpcs, discoveredLocations]);
    
    useEffect(() => {
        if (!npcsAtLocation || npcsAtLocation.length === 0) return;
        
        const currentNpcIdsOnScreen = npcsAtLocation.map(npc => npc.id);
        const newNpcIdsToLog = currentNpcIdsOnScreen.filter(id => !encounteredNpcIds.includes(id));

        if (newNpcIdsToLog.length > 0) {
            setGameState(gs => {
                if (!gs) return null;
                return {
                    ...gs,
                    encounteredNpcIds: [...gs.encounteredNpcIds, ...newNpcIdsToLog]
                };
            });
        }
    }, [npcsAtLocation, encounteredNpcIds, setGameState]);

    useEffect(() => {
        const tuoiThoAttr = playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === 'Tuổi Thọ');
        const currentAge = playerCharacter.identity.age;
        if (tuoiThoAttr && currentAge > (tuoiThoAttr.value as number)) {
            addStoryEntry({ type: 'system', content: `Thọ nguyên đã hết, bạn không thể chống lại quy luật của đất trời. Hành trình tu tiên kết thúc.` });
            setIsGameOver(true);
        }
    }, [playerCharacter.identity.age, playerCharacter.attributes]);


     const consumeAP = async (cost: number) => {
        const newAP = gameDate.actionPoints - cost;
        if (newAP < 0) {
            const shichenToAdvance = Math.ceil(Math.abs(newAP) / gameDate.maxActionPoints);
            await handleAdvanceTime(shichenToAdvance);
        } else {
             setGameState(gs => gs ? ({...gs, gameDate: {...gs.gameDate, actionPoints: newAP }}) : null);
        }
    };

    const handleAdvanceTime = async (shichenToAdvance: number = 1) => {
        const { monthPassed: willMonthPass } = pureAdvanceTime(gameDate, shichenToAdvance);

        if (willMonthPass) {
            try {
                const newRumor = await generateWorldEvent(gameState);
                setGameState(gs => {
                    if (!gs) return null;
                    const updatedRumors = [...gs.worldState.rumors, newRumor];
                    return { ...gs, worldState: { ...gs.worldState, rumors: updatedRumors } };
                });
                showNotification(`Có tin tức mới trong thiên hạ...`);
            } catch (e) {
                console.error("Could not generate world event", e);
            }
        }
        
        setGameState(prev => {
            if (!prev) return null;
            const { newDate, yearPassed } = pureAdvanceTime(prev.gameDate, shichenToAdvance);
            
            let updatedPc = prev.playerCharacter;
            if (yearPassed) {
                updatedPc = {
                    ...updatedPc,
                    identity: { ...updatedPc.identity, age: updatedPc.identity.age + 1 }
                };
            }
            
            return {
                ...prev,
                playerCharacter: updatedPc,
                gameDate: newDate,
                activeNpcs: simulateNpcMovement(prev.activeNpcs, prev.discoveredLocations, shichenToAdvance),
            };
        });
    };
    
    const setPlayerCharacter = (updater: (pc: PlayerCharacter) => PlayerCharacter) => {
        setGameState(prev => {
            if (!prev) return null;
            return { ...prev, playerCharacter: updater(prev.playerCharacter) };
        });
    };
    
    const handleTravel = async (destinationId: string) => {
        const destination = discoveredLocations.find(l => l.id === destinationId);
        const origin = currentLocation;

        if (destination && origin && origin.coordinates && destination.coordinates) {
            const dx = origin.coordinates.x - destination.coordinates.x;
            const dy = origin.coordinates.y - destination.coordinates.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            const shichenToTravel = Math.max(1, Math.round(distance / TRAVEL_SPEED));
            const apCost = shichenToTravel * 2;
            await consumeAP(apCost);
            
            setPlayerCharacter(pc => ({ ...pc, currentLocationId: destinationId }));
            addStoryEntry({ type: 'narrative', content: `Sau ${shichenToTravel} canh giờ, bạn đã đến được ${destination.name}.` });
        }
    };
    
    const handleExplore = async () => {
        if (isAILoading) return;
        setIsAILoading(true);
        await consumeAP(3);

        try {
            const { name, description } = await generateDynamicLocation(currentLocation);
            addStoryEntry({ type: 'narrative', content: `Bạn dành thời gian khám phá xung quanh và phát hiện ra một nơi đặc biệt: **${name}**. ${description}` });
        } catch (error: any) {
            addStoryEntry({ type: 'system', content: `Lỗi khi khám phá: ${error.message}` });
        } finally {
            setIsAILoading(false);
        }
    };
    
    const handleEnterCombat = (enemyNames: string[]) => {
        const enemiesToFight = activeNpcs.filter(npc => enemyNames.includes(npc.identity.name));
        if (enemiesToFight.length === 0) {
            addStoryEntry({type: 'system', content: 'Lỗi: Không tìm thấy kẻ địch để bắt đầu chiến đấu.'});
            return;
        }

        const participants = [playerCharacter, ...enemiesToFight];
        const turnOrder = participants
            .map(p => 'id' in p ? p.id : 'player') // Get IDs
            .sort(() => Math.random() - 0.5); // Shuffle for initiative
        
        const initialState: CombatState = {
            enemies: JSON.parse(JSON.stringify(enemiesToFight)), // Deep copy enemies for combat instance
            turnOrder,
            currentTurnIndex: 0,
            combatLog: [{ turn: 1, message: "Trận chiến bắt đầu!" }],
        };
        setGameState(gs => gs ? { ...gs, combatState: initialState } : null);
        addStoryEntry({ type: 'system', content: `Bạn đã bước vào trận chiến với ${enemyNames.join(', ')}!` });
    };

    const handleEventChoice = (choice: EventChoice) => {};

    const handleBreakthrough = async () => {
        if (!currentRealmData || !currentStageData || !playerCharacter.cultivation) return;
    
        const currentStageIndex = currentRealmData.stages.findIndex(s => s.id === playerCharacter.cultivation.currentStageId);
        const isLastStage = currentStageIndex === currentRealmData.stages.length - 1;
    
        // --- Create the new player state ---
        const oldRealmName = currentRealmData.name;
        let newRealmData = currentRealmData;
        let newStageData;
    
        const newCultivation = { ...playerCharacter.cultivation, spiritualQi: 0 };
        if (isLastStage) {
            const currentRealmIndex = realmSystem.findIndex(r => r.id === currentRealmData.id);
            const nextRealm = realmSystem[currentRealmIndex + 1];
            if (nextRealm) {
                newRealmData = nextRealm;
                newStageData = nextRealm.stages[0];
                newCultivation.currentRealmId = newRealmData.id;
                newCultivation.currentStageId = newStageData.id;
                
                const availablePaths = CULTIVATION_PATHS.filter(p => p.requiredRealmId === newRealmData.id && !playerCharacter.chosenPathIds.includes(p.id));
                if (availablePaths.length > 0) {
                    setPendingPathChoice(availablePaths);
                }
            } else {
                addStoryEntry({ type: 'system', content: "Bạn đã đạt đến đỉnh cao của thế giới này!" });
                return;
            }
        } else {
            newStageData = currentRealmData.stages[currentStageIndex + 1];
            newCultivation.currentStageId = newStageData.id;
        }
    
        let pcWithNewCultivation = { ...playerCharacter, cultivation: newCultivation };
        pcWithNewCultivation = applyBonuses(pcWithNewCultivation, newStageData.bonuses, 'add');
    
        setGameState(gs => gs ? { ...gs, playerCharacter: pcWithNewCultivation } : null);
    
        // --- Generate narrative and illustration ---
        const eventId = `breakthrough_${newRealmData.id}`;
        const existingIllustration = gameState.eventIllustrations?.find(ill => ill.eventId === eventId);
    
        if (existingIllustration) {
            setIllustrationToDisplay(existingIllustration);
        } else {
            setIsGeneratingIllustration(true);
            try {
                const narrative = await generateBreakthroughNarrative(pcWithNewCultivation, oldRealmName, newRealmData, newStageData);
                const prompt = `Một tu sĩ tên là ${pcWithNewCultivation.identity.name}, với ngoại hình ${pcWithNewCultivation.identity.appearance}, đang trải qua một cuộc đột phá cảnh giới kinh thiên động địa. Năng lượng linh khí cuồn cuộn, ánh sáng rực rỡ, bộc phát sức mạnh to lớn khi họ thành công bước vào cảnh giới ${newRealmData.name}.`;
                const imageUrl = await generateEventIllustration(prompt);
    
                const newIllustration = { eventId, imageUrl, narrative };
    
                setGameState(gs => {
                    if (!gs) return null;
                    const updatedIllustrations = [...(gs.eventIllustrations || []), newIllustration];
                    return { ...gs, eventIllustrations: updatedIllustrations };
                });
    
                setIllustrationToDisplay(newIllustration);
            } catch (error) {
                console.error("Failed to generate breakthrough illustration:", error);
                showNotification(`Lỗi tạo tranh thiên cơ: ${(error as Error).message}`);
                // Fallback to text
                const narrative = await generateBreakthroughNarrative(pcWithNewCultivation, oldRealmName, newRealmData, newStageData);
                addStoryEntry({ type: 'narrative', content: narrative });
            } finally {
                setIsGeneratingIllustration(false);
            }
        }
    };

    const handleSelectPath = (path: CultivationPath) => {
        setPlayerCharacter(pc => {
            const newPc = applyBonuses(pc, path.bonuses, 'add');
            return {
                ...newPc,
                chosenPathIds: [...newPc.chosenPathIds, path.id]
            }
        });
        setPendingPathChoice(null);
        showNotification(`Bạn đã bước đi trên con đường: ${path.name}!`);
    };
    
    const handleSaveAndNotify = () => {
        onSaveGame(gameState, showNotification);
        setIsGameMenuOpen(false);
    };

    const handleExit = () => {
        if(window.confirm("Bạn có chắc muốn thoát về menu chính? Mọi tiến trình chưa lưu sẽ bị mất.")) {
            onBack();
        }
    };
    
    const processTags = (text: string, storyEntryId: number) => {
        setGameState(gs => {
            if (!gs) return null;
            let newGameState = { ...gs };
            const tagRegex = /\[([A-Z_]+):({.*?})\]/g;
            let match;
    
            while ((match = tagRegex.exec(text)) !== null) {
                const tagName = match[1];
                try {
                    const jsonData = JSON.parse(match[2]);
                    console.log(`Processing tag: ${tagName}`, jsonData);
    
                    switch (tagName) {
                        case 'UPDATE_CULTIVATION':
                            if (jsonData.addQi) {
                                const qiGained = Number(jsonData.addQi);
                                const pc = newGameState.playerCharacter;
                                const newQi = pc.cultivation.spiritualQi + qiGained;
                                
                                newGameState.playerCharacter = {
                                    ...pc,
                                    cultivation: { ...pc.cultivation, spiritualQi: newQi }
                                };
                                showNotification(`Bạn hấp thụ được ${qiGained.toLocaleString()} điểm linh khí.`);
                            }
                            break;
                        case 'START_COMBAT':
                            if (jsonData.enemyNames && Array.isArray(jsonData.enemyNames)) {
                                handleEnterCombat(jsonData.enemyNames);
                            }
                            break;
                        case 'START_DIALOGUE':
                            if (jsonData.npcName) {
                                const targetNpc = newGameState.activeNpcs.find(n => n.identity.name === jsonData.npcName);
                                if (targetNpc) {
                                    newGameState.dialogueWithNpcId = targetNpc.id;
                                } else {
                                    addStoryEntry({ type: 'system', content: `Lỗi: không tìm thấy NPC tên "${jsonData.npcName}" để đối thoại.`})
                                }
                            }
                            break;
                        case 'CREATE_NPC':
                             if (jsonData.name) {
                                if (newGameState.activeNpcs.some(n => n.identity.name === jsonData.name)) {
                                    console.warn(`Attempted to create a duplicate NPC: ${jsonData.name}`);
                                    break;
                                }

                                const newNpc: NPC = {
                                    id: `dynamic-npc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                                    identity: {
                                        name: jsonData.name,
                                        gender: Math.random() > 0.5 ? 'Nam' : 'Nữ',
                                        appearance: jsonData.description || 'Ngoại hình chưa rõ.',
                                        origin: jsonData.origin || 'Xuất thân bí ẩn.',
                                        personality: jsonData.personality || 'Trung Lập',
                                    },
                                    status: 'Vừa xuất hiện tại đây.',
                                    attributes: [],
                                    talents: [],
                                    locationId: newGameState.playerCharacter.currentLocationId,
                                    cultivation: { currentRealmId: 'pham_nhan', currentStageId: 'pn_1', spiritualQi: 0, hasConqueredInnerDemon: false },
                                    techniques: [],
                                    inventory: { items: [], weightCapacity: 15 },
                                    currencies: { 'Bạc': Math.floor(Math.random() * 50) },
                                    equipment: {},
                                    healthStatus: 'HEALTHY',
                                    activeEffects: [],
                                };

                                newGameState.activeNpcs = [...newGameState.activeNpcs, newNpc];
                                showNotification(`Nhân vật mới đã xuất hiện: ${jsonData.name}`);
                            }
                            break;
                        // TODO: Implement other tags like ADD_ITEM, ADD_CURRENCY etc.
                    }
                } catch (e) {
                    console.error(`Error parsing or processing tag: ${match[0]}`, e);
                }
            }
            
            // Finalize story log entry by removing tags for clean display
            const cleanedText = text.replace(tagRegex, '').trim();
            newGameState.storyLog = newGameState.storyLog.map(entry => 
                entry.id === storyEntryId ? { ...entry, content: cleanedText || " " } : entry
            );
    
            return newGameState;
        });
    };
    
    const handleActionSubmit = async (inputText: string, mode: 'say' | 'act') => {
        if (isAILoading || isGameOver || combatState || dialogueWithNpcId) return;

        if (mode === 'act' && inputText.trim().toLowerCase().includes('tu luyện')) {
            setIsAILoading(true);
            const camNgoAttr = playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === 'Cảm Ngộ');
            const camNgoValue = (camNgoAttr?.value as number) || 10;
            const baseQi = 10;
            const locationQi = currentLocation.qiConcentration || 5;
            const camNgoBonus = Math.floor(camNgoValue / 2);
            const qiGain = baseQi + locationQi + camNgoBonus;
    
            addStoryEntry({
                type: 'system',
                content: `Tại ${currentLocation.name}, bạn tĩnh tâm tu luyện, hấp thụ được ${qiGain.toLocaleString()} điểm linh khí.`
            });
            
            setGameState(gs => {
                if (!gs) return null;
                const pc = gs.playerCharacter;
                return {
                    ...gs,
                    playerCharacter: {
                        ...pc,
                        cultivation: {
                            ...pc.cultivation,
                            spiritualQi: pc.cultivation.spiritualQi + qiGain,
                        }
                    }
                };
            });
    
            await consumeAP(2);
            setIsAILoading(false);
            return;
        }

        setIsAILoading(true);
    
        const playerInputEntry: StoryEntry = {
            id: Date.now(),
            type: mode === 'say' ? 'player-dialogue' : 'player-action',
            content: inputText,
        };
    
        setGameState(gs => gs ? { ...gs, storyLog: [...gs.storyLog, playerInputEntry] } : null);
    
        try {
            const currentGameState = await new Promise<GameState>(resolve => {
                setGameState(gs => {
                    if (gs) resolve(gs);
                    return gs;
                });
            });
    
            const { playerCharacter: pc, realmSystem: rs } = currentGameState;
            const currentRealm = rs.find(r => r.id === pc.cultivation.currentRealmId);
            const currentStage = currentRealm?.stages.find(s => s.id === pc.cultivation.currentStageId);
            
            const systemReports = `
- Tu Luyện: Linh khí hiện tại ${pc.cultivation.spiritualQi}/${currentStage?.qiRequired || '??'}. Cần ${Math.max(0, (currentStage?.qiRequired || 0) - pc.cultivation.spiritualQi)} nữa để đột phá.
            `.trim();
    
            const aiResponseEntryId = Date.now() + Math.random();
            setGameState(gs => gs ? { ...gs, storyLog: [...gs.storyLog, { id: aiResponseEntryId, type: 'narrative', content: '' }] } : null);
    
            let fullResponseText = '';
            const stream = generateStoryContinuationStream(
                currentGameState.storyLog,
                playerInputEntry,
                currentGameState,
                systemReports
            );
    
            const updateFrequency = 100; // Update UI roughly 10 times per second
            let lastUpdateTime = 0;

            for await (const chunk of stream) {
                fullResponseText += chunk;
                const now = performance.now();
                if (now - lastUpdateTime > updateFrequency) {
                    setGameState(gs => {
                        if (!gs) return null;
                        const newStoryLog = gs.storyLog.map(entry => 
                            entry.id === aiResponseEntryId ? { ...entry, content: fullResponseText } : entry
                        );
                        return { ...gs, storyLog: newStoryLog };
                    });
                    lastUpdateTime = now;
                }
            }

            // Final update to ensure the last chunks are rendered
            setGameState(gs => {
                if (!gs) return null;
                const newStoryLog = gs.storyLog.map(entry => 
                    entry.id === aiResponseEntryId ? { ...entry, content: fullResponseText } : entry
                );
                return { ...gs, storyLog: newStoryLog };
            });
    
            processTags(fullResponseText, aiResponseEntryId);
    
        } catch (error: any) {
            console.error("Lỗi khi xử lý hành động:", error);
            addStoryEntry({ type: 'system', content: `Lỗi hệ thống: ${error.message}` });
        } finally {
            setIsAILoading(false);
        }
    };
    
     const renderBottomPanel = () => {
        if (combatState) {
            return <CombatScreen gameState={gameState} setGameState={setGameState} showNotification={showNotification} addStoryEntry={(data) => addStoryEntry(data)} />;
        }
        if (dialogueWithNpcId) {
            const npc = activeNpcs.find(n => n.id === dialogueWithNpcId);
            if (npc) {
                return <DialoguePanel npc={npc} onClose={() => setGameState(gs => gs ? { ...gs, dialogueWithNpcId: null } : null)} />;
            }
        }
        if (currentEvent) {
            return <EventPanel event={currentEvent} onChoice={handleEventChoice} playerAttributes={playerCharacter.attributes.flatMap(g => g.attributes)} />;
        }
        if (activeStory) {
            return <CustomStoryPlayer gameState={gameState} setGameState={setGameState} />;
        }
        return <ActionBar onActionSubmit={handleActionSubmit} disabled={isAILoading || isGameOver} currentLocation={currentLocation} />;
    };
    
    return (
        <div className="w-full h-screen flex flex-col bg-black">
            <NotificationArea notifications={notifications} onDismiss={id => setNotifications(n => n.filter(notif => notif.id !== id))} />
             {isGameOver && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="text-center p-8">
                        <FaExclamationTriangle className="text-7xl text-red-500 mx-auto mb-4" />
                        <h2 className="text-4xl font-bold text-red-400 font-title">Hành Trình Kết Thúc</h2>
                        <button onClick={onBack} className="mt-8 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg">Về Menu Chính</button>
                    </div>
                </div>
            )}
            {isGeneratingIllustration && (
                <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-stone-900/95 backdrop-blur-sm animate-fade-in">
                    <LoadingSpinner message="Thiên Cơ đang hiển hiện..." size="lg" />
                    <p className="text-amber-200 mt-4 text-center max-w-sm">Một bức tranh về định mệnh của bạn sắp được vẽ ra, xin hãy kiên nhẫn.</p>
                </div>
            )}
            {illustrationToDisplay && (
                <div 
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-lg animate-fade-in"
                    onClick={() => {
                        addStoryEntry({ type: 'narrative', content: illustrationToDisplay.narrative });
                        setIllustrationToDisplay(null);
                    }}
                >
                    <div className="relative w-full max-w-4xl p-4" onClick={e => e.stopPropagation()}>
                        <img src={illustrationToDisplay.imageUrl} alt="Tranh Thiên Cơ" className="w-full h-auto object-contain rounded-lg shadow-2xl shadow-black/70 border-2 border-amber-400/50" />
                        <div className="absolute bottom-4 left-4 right-4 bg-black/70 p-4 rounded-b-lg">
                            <p className="text-amber-100 text-center italic text-lg">{illustrationToDisplay.narrative}</p>
                        </div>
                        <button 
                            onClick={() => {
                                addStoryEntry({ type: 'narrative', content: illustrationToDisplay.narrative });
                                setIllustrationToDisplay(null);
                            }}
                            className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/80"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>
            )}
            <div className="flex-shrink-0 p-2 sm:p-4 bg-black/40 backdrop-blur-sm border-b border-gray-700/50 z-20">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsGameMenuOpen(true)} className="p-3 bg-gray-800/60 rounded-full text-gray-300 hover:bg-gray-700/60" title="Menu">
                            <FaCog />
                        </button>
                    </div>
                    <div className="flex-grow">
                        <Timeline gameDate={gameDate} />
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-gray-800/60 rounded-full text-gray-300 hover:bg-gray-700/60 top-bar-sidebar-toggle" title="Bảng điều khiển">
                           {isSidebarOpen ? <FaTimes /> : <FaBars />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="gameplay-main-content">
                {isSidebarOpen && <div className="gameplay-sidebar-backdrop md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

                <div className="gameplay-story-panel h-full flex flex-col bg-stone-900/50">
                    <StoryLog story={storyLog} inventoryItems={playerCharacter.inventory.items} techniques={playerCharacter.techniques} />
                    {renderBottomPanel()}
                </div>
                
                <div className={`gameplay-sidebar-wrapper ${isSidebarOpen ? 'is-open' : ''}`}>
                    <div className="h-full bg-stone-900/80 backdrop-blur-md border-l border-gray-700/50 shadow-2xl">
                        <Sidebar
                            playerCharacter={playerCharacter}
                            setPlayerCharacter={setPlayerCharacter}
                            onBreakthrough={handleBreakthrough}
                            currentLocation={currentLocation}
                            npcsAtLocation={npcsAtLocation}
                            neighbors={neighbors}
                            rumors={worldState.rumors}
                            storyLog={storyLog}
                            onTravel={handleTravel}
                            // FIX: Pass the correct handler function `handleExplore` to the `onExplore` prop.
                            onExplore={handleExplore}
                            onNpcSelect={setViewingNpc}
                            allNpcs={activeNpcs}
                            encounteredNpcIds={encounteredNpcIds}
                            discoveredLocations={discoveredLocations}
                            realmSystem={realmSystem}
                            showNotification={showNotification}
                            activeMods={activeMods}
                        />
                    </div>
                </div>
            </div>
            {viewingNpc && <NpcInfoModal npc={viewingNpc} allNpcs={activeNpcs} onClose={() => setViewingNpc(null)} />}
            <GameMenuModal isOpen={isGameMenuOpen} onClose={() => setIsGameMenuOpen(false)} onSave={handleSaveAndNotify} onExit={handleExit} />
            {activeShopId && <ShopModal shopId={activeShopId} gameState={gameState} setGameState={setGameState} showNotification={showNotification} onClose={() => setActiveShopId(null)} />}
             <CultivationPathModal 
                isOpen={!!pendingPathChoice}
                paths={pendingPathChoice || []}
                onSelectPath={handleSelectPath}
            />
        </div>
    );
};

export default memo(GamePlayScreen);