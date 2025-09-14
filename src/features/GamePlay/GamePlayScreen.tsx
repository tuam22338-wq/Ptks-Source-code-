

import React, { useState, useMemo, useEffect, memo, useCallback, useRef } from 'react';
import type { GameState, GameSettings, StoryEntry, GameDate, Season, Weather, Location, NPC, PlayerCharacter, GameEvent, EventChoice, InventoryItem, EquipmentSlot, StatBonus, Rumor, WorldState, CultivationTechnique, PlayerNpcRelationship, AttributeGroup, CultivationPath, CombatState, Attribute, RealmConfig } from '../../types';
import StoryLog from './components/StoryLog';
import ActionBar from './components/ActionBar';
import Sidebar from './components/Sidebar/Sidebar';
import Timeline from '../../components/Timeline';
import EventPanel from './EventPanel';
import ShopModal from './components/ShopModal';
import InventoryModal from './components/InventoryModal';
import CultivationPathModal from './components/CultivationPathModal';
import CustomStoryPlayer from './components/CustomStoryPlayer';
import LoadingScreen from '../../components/LoadingScreen';
import LoadingSpinner from '../../components/LoadingSpinner';
import CombatScreen from './components/CombatScreen';
import DialoguePanel from './components/DialoguePanel';
import NotificationArea from '../../components/NotificationArea';
import { FaBars, FaTimes, FaExclamationTriangle, FaCog, FaSave } from 'react-icons/fa';
import { generateStoryContinuationStream, generateGameEvent, generateDynamicLocation, generateBreakthroughNarrative, generateWorldEvent, generateCombatNarrative, generateEventIllustration } from '../../services/geminiService';
import { SHICHEN_LIST, REALM_SYSTEM, TIMEOFDAY_DETAILS, NPC_LIST, INNATE_TALENT_RANKS, CULTIVATION_PATHS, CHARACTER_STATUS_CONFIG, SECTS, INVENTORY_ACTION_LOG_PREFIX } from '../../constants';


interface GamePlayScreenProps {
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
                                </div>
                            )
                        }) : <p className="text-sm text-gray-500 text-center">Không có</p>}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
});

export const GamePlayScreen: React.FC<GamePlayScreenProps> = ({ settings, gameState, setGameState, onSaveGame, onBack }) => {
    const [isSidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);
    const [isAiResponding, setAiResponding] = useState(false);
    const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
    const [showShop, setShowShop] = useState<string | null>(null);
    const [isInventoryOpen, setInventoryOpen] = useState(false);
    const [showCultivationPathModal, setShowCultivationPathModal] = useState(false);
    const [offeredPaths, setOfferedPaths] = useState<CultivationPath[]>([]);
    const [selectedNpc, setSelectedNpc] = useState<NPC | null>(null);
    const [notifications, setNotifications] = useState<{ id: number; message: string }[]>([]);

    const lastProcessedYear = useRef(gameState.gameDate.year);

    const showNotification = useCallback((message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    }, []);

    const addStoryEntry = useCallback((newEntryData: Omit<StoryEntry, 'id'>) => {
        setGameState(gs => {
            if (!gs) return null;
            const newEntry: StoryEntry = {
                ...newEntryData,
                id: (gs.storyLog[gs.storyLog.length - 1]?.id || 0) + 1,
            };
            return {
                ...gs,
                storyLog: [...gs.storyLog, newEntry],
            };
        });
    }, [setGameState]);
    
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true);
            } else {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const { playerCharacter, activeNpcs, discoveredLocations, worldState, gameDate, storyLog, realmSystem, activeMods } = gameState;

    useEffect(() => {
        if (gameDate.year > lastProcessedYear.current) {
            const currentYear = gameDate.year;
            const yearsPassed = currentYear - lastProcessedYear.current;
            console.log(`Advancing time by ${yearsPassed} year(s).`);

            setGameState(gs => {
                if (!gs) return null;
                
                const deceasedNpcMessages: string[] = [];
                const updatedNpcs = gs.activeNpcs.map(npc => {
                    const newAge = npc.identity.age + yearsPassed;
                    if (newAge >= npc.tuoiTho) {
                        deceasedNpcMessages.push(`${npc.identity.name} đã hết tuổi thọ, quy về với đất trời.`);
                        return null; // Mark for removal
                    }
                    return { ...npc, identity: { ...npc.identity, age: newAge } };
                }).filter((npc): npc is NPC => npc !== null);

                if (deceasedNpcMessages.length > 0) {
                     setTimeout(() => {
                        deceasedNpcMessages.forEach(msg => {
                            addStoryEntry({ type: 'system', content: msg });
                        });
                    }, 500);
                }

                return {
                    ...gs,
                    activeNpcs: updatedNpcs,
                };
            });

            lastProcessedYear.current = currentYear;
        }
    }, [gameDate.year, setGameState, addStoryEntry]);


    const allPlayerTechniques = useMemo(() => {
        const mainSkills = Object.values(playerCharacter.mainCultivationTechnique?.skillTreeNodes || {})
            .filter(node => node.isUnlocked && node.type === 'active_skill' && node.activeSkill)
            .map((node, index) => ({
                id: `main_skill_${node.id}_${index}`,
                ...node.activeSkill
            } as CultivationTechnique));

        return [...mainSkills, ...playerCharacter.auxiliaryTechniques];
    }, [playerCharacter.mainCultivationTechnique, playerCharacter.auxiliaryTechniques]);

    const currentLocation = useMemo(() => {
        return discoveredLocations.find(loc => loc.id === playerCharacter.currentLocationId) || discoveredLocations[0];
    }, [playerCharacter.currentLocationId, discoveredLocations]);

    const npcsAtLocation = useMemo(() => {
        return activeNpcs.filter(npc => npc.locationId === currentLocation.id);
    }, [activeNpcs, currentLocation.id]);
    
    const neighbors = useMemo(() => {
        return discoveredLocations.filter(loc => currentLocation.neighbors.includes(loc.id));
    }, [discoveredLocations, currentLocation.neighbors]);


    const handleActionSubmit = useCallback(async (text: string, type: 'say' | 'act') => {
        if (isAiResponding || !text.trim()) return;

        setAiResponding(true);

        const entryType = type === 'say' ? 'player-dialogue' : 'player-action';
        addStoryEntry({ type: entryType, content: text });
        
        let inventoryActionText = "";
        if (gameState.playerCharacter.inventoryActionLog.length > 0) {
            inventoryActionText = INVENTORY_ACTION_LOG_PREFIX + gameState.playerCharacter.inventoryActionLog.join('\n') + "\n]";
            setGameState(gs => gs ? { ...gs, playerCharacter: { ...gs.playerCharacter, inventoryActionLog: [] } } : null);
        }

        const fullPrompt = inventoryActionText ? `${inventoryActionText}\n\n${text}` : text;

        try {
            const stream = generateStoryContinuationStream(gameState, fullPrompt, type);

            let accumulatedContent = '';
            addStoryEntry({ type: 'narrative', content: '' });

            for await (const chunk of stream) {
                accumulatedContent += chunk;

                setGameState(gs => {
                    if (!gs) return null;
                    const lastEntry = gs.storyLog[gs.storyLog.length - 1];
                    if (lastEntry) {
                        const updatedLog = [...gs.storyLog.slice(0, -1), { ...lastEntry, content: accumulatedContent }];
                        return { ...gs, storyLog: updatedLog };
                    }
                    return gs;
                });
            }

            // Process game state changes from tags in the final content
            const tagRegex = /\[(.*?)]/g;
            const matches = accumulatedContent.match(tagRegex);
            let finalContent = accumulatedContent;
            
            if (matches) {
                finalContent = accumulatedContent.replace(tagRegex, '').trim();
                setGameState(gs => {
                    if (!gs) return null;
                    const lastEntry = gs.storyLog[gs.storyLog.length - 1];
                    const updatedLog = [...gs.storyLog.slice(0, -1), { ...lastEntry, content: finalContent }];
                    return { ...gs, storyLog: updatedLog };
                });
                
                // Process tags
                matches.forEach(match => {
                    const [tag, ...params] = match.slice(1, -1).split(':');
                    
                    if (tag === 'TIME_PASS') {
                         const hours = parseInt(params[0], 10) || 1;
                         setGameState(gs => {
                            if (!gs) return null;
                            let newDate = { ...gs.gameDate };
                            for (let i = 0; i < hours; i++) {
                                let currentShichenIndex = SHICHEN_LIST.findIndex(s => s.name === newDate.shichen);
                                let nextShichenIndex = (currentShichenIndex + 1) % SHICHEN_LIST.length;
                                newDate.shichen = SHICHEN_LIST[nextShichenIndex].name;
                                if (nextShichenIndex === 0) {
                                    newDate.day += 1;
                                    if (newDate.day > 30) {
                                        newDate.day = 1;
                                        const seasonOrder: Season[] = ['Xuân', 'Hạ', 'Thu', 'Đông'];
                                        let currentSeasonIndex = seasonOrder.findIndex(s => s === newDate.season);
                                        let nextSeasonIndex = (currentSeasonIndex + 1) % 4;
                                        newDate.season = seasonOrder[nextSeasonIndex];
                                        if (nextSeasonIndex === 0) {
                                            newDate.year += 1;
                                        }
                                    }
                                }
                            }
                            newDate.timeOfDay = TIMEOFDAY_DETAILS[newDate.shichen].name;
                            return { ...gs, gameDate: newDate };
                         });
                    } else if (tag === 'OPEN_INVENTORY') {
                         setInventoryOpen(true);
                    }
                });
            }

        } catch (error: any) {
            console.error("Lỗi khi tạo truyện:", error);
            addStoryEntry({ type: 'system', content: `Lỗi hệ thống: ${error.message}` });
        } finally {
            setAiResponding(false);
        }

    }, [isAiResponding, addStoryEntry, setGameState, gameState]);

    const setPlayerCharacter = useCallback((updater: (pc: PlayerCharacter) => PlayerCharacter) => {
        setGameState(gs => gs ? { ...gs, playerCharacter: updater(gs.playerCharacter) } : null);
    }, [setGameState]);

    const handleTravel = (destinationId: string) => {
        addStoryEntry({ type: 'player-action', content: `Đi đến ${discoveredLocations.find(l => l.id === destinationId)?.name}` });
        setGameState(gs => {
            if (!gs) return null;
            return {
                ...gs,
                playerCharacter: {
                    ...gs.playerCharacter,
                    currentLocationId: destinationId
                }
            };
        });
        
        // This is a simple state change and doesn't require an AI call,
        // but we can add one if we want the AI to narrate the journey.
        addStoryEntry({ type: 'narrative', content: `Bạn đã đến ${discoveredLocations.find(l => l.id === destinationId)?.name}.` });
    };

    const handleExplore = async () => {
        setAiResponding(true);
        try {
            const event = await generateGameEvent(gameState);
            if(event.type === 'location') {
                const newLocation = await generateDynamicLocation(gameState);
                addStoryEntry({ type: 'narrative', content: event.narrative });
                setGameState(gs => {
                    if (!gs || gs.discoveredLocations.some(l => l.id === newLocation.id)) return gs;
                    const newDiscovered = [...gs.discoveredLocations, newLocation];
                    gs.discoveredLocations.map(loc => 
                        loc.id === gs.playerCharacter.currentLocationId
                        ? {...loc, neighbors: [...new Set([...loc.neighbors, newLocation.id])]}
                        : loc
                    );
                    return {...gs, discoveredLocations: newDiscovered};
                });
            } else if (event.type === 'npc') {
                 addStoryEntry({ type: 'narrative', content: event.narrative });
                 // Logic to handle NPC encounter
            } else if (event.type === 'item') {
                 addStoryEntry({ type: 'narrative', content: event.narrative });
                 // Logic to add item
            } else {
                 addStoryEntry({ type: 'narrative', content: event.narrative });
            }
        } catch (e) {
            addStoryEntry({ type: 'system', content: 'Không có gì đặc biệt xảy ra.' });
        } finally {
            setAiResponding(false);
        }
    }
    
    if (!gameState) {
        return <LoadingScreen message="Đang tải dữ liệu trò chơi..." />;
    }

    return (
        <div className="h-screen w-screen flex flex-col bg-stone-900/80">
            {selectedNpc && <NpcInfoModal npc={selectedNpc} allNpcs={gameState.activeNpcs} onClose={() => setSelectedNpc(null)} />}
            {showShop && <ShopModal shopId={showShop} gameState={gameState} setGameState={setGameState} showNotification={showNotification} onClose={() => setShowShop(null)} />}
            <InventoryModal isOpen={isInventoryOpen} gameState={gameState} setGameState={setGameState} showNotification={showNotification} onClose={() => setInventoryOpen(false)} />
            
            <NotificationArea notifications={notifications} onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />

            <div className="flex-shrink-0 p-2 border-b border-gray-700/50 bg-black/30 flex items-center justify-between z-20">
                <Timeline gameDate={gameDate} />
                <div className="flex items-center gap-2">
                     <button onClick={() => onSaveGame(gameState, showNotification)} title="Lưu game" className="p-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors">
                        <FaSave />
                    </button>
                    <button onClick={onBack} title="Về Menu Chính" className="p-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors">
                        <FaExclamationTriangle />
                    </button>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} title="Mở/Đóng Bảng Điều Khiển" className="p-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-full transition-colors top-bar-sidebar-toggle">
                        {isSidebarOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>
            </div>

            <main className="gameplay-main-content">
                <div className="gameplay-story-panel flex flex-col h-full bg-no-repeat bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.8)), url('${settings.backgroundImage}')`}}>
                    <StoryLog story={storyLog} inventoryItems={playerCharacter.inventory.items} techniques={allPlayerTechniques} />
                    {isAiResponding && <div className="flex-shrink-0 p-4 text-center"><LoadingSpinner message="AI đang tự sự..." /></div>}
                    
                    {/* Conditional Panels */}
                    {gameState.combatState && <CombatScreen gameState={gameState} setGameState={setGameState} showNotification={showNotification} addStoryEntry={addStoryEntry} />}
                    {gameState.activeStory && <CustomStoryPlayer gameState={gameState} setGameState={setGameState} />}
                    {gameState.dialogueWithNpcId && (
                        <DialoguePanel 
                            npc={activeNpcs.find(n => n.id === gameState.dialogueWithNpcId)!}
                            onClose={() => setGameState(gs => gs ? {...gs, dialogueWithNpcId: null} : null)}
                        />
                    )}
                    {activeEvent && <EventPanel event={activeEvent} onChoice={() => {}} playerAttributes={playerCharacter.attributes.flatMap(g => g.attributes)} />}
                    
                    <ActionBar onActionSubmit={handleActionSubmit} disabled={isAiResponding || !!activeEvent || !!gameState.combatState || !!gameState.activeStory} currentLocation={currentLocation} />
                </div>
                
                 {isSidebarOpen && window.innerWidth < 1024 && <div className="gameplay-sidebar-backdrop" onClick={() => setSidebarOpen(false)}></div>}
                <div className={`gameplay-sidebar-wrapper bg-black/50 backdrop-blur-lg border-l border-gray-700/50 ${isSidebarOpen ? 'is-open' : ''}`}>
                   <Sidebar 
                        playerCharacter={playerCharacter}
                        setPlayerCharacter={setPlayerCharacter}
                        onBreakthrough={() => {}}
                        currentLocation={currentLocation}
                        npcsAtLocation={npcsAtLocation}
                        neighbors={neighbors}
                        rumors={worldState.rumors}
                        onTravel={handleTravel}
                        onExplore={handleExplore}
                        onNpcSelect={setSelectedNpc}
                        allNpcs={gameState.activeNpcs}
                        encounteredNpcIds={gameState.encounteredNpcIds}
                        discoveredLocations={gameState.discoveredLocations}
                        realmSystem={realmSystem}
                        showNotification={showNotification}
                        activeMods={activeMods}
                        storyLog={storyLog}
                    />
                </div>
            </main>
        </div>
    );
};
