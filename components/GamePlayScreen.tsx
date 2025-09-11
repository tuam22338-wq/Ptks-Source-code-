import React, { useState, useMemo, useEffect } from 'react';
import type { GameState, StoryEntry, GameDate, Season, Weather, Location, NPC, PlayerCharacter, GameEvent, EventChoice, InventoryItem, EquipmentSlot, StatBonus, Rumor, WorldState, CultivationTechnique } from '../types';
import StoryLog from './StoryLog';
import PlayerInput from './PlayerInput';
import Sidebar from './Sidebar';
import Timeline from './Timeline';
import EventPanel from './EventPanel';
import { FaArrowLeft, FaBars, FaTimes, FaExclamationTriangle, FaCog, FaSave } from 'react-icons/fa';
import { generateStoryContinuation, generateGameEvent, generateDynamicLocation, analyzeActionForTechnique, generateBreakthroughNarrative } from '../services/geminiService';
import { SHICHEN_LIST, REALM_SYSTEM, TIMEOFDAY_DETAILS, NPC_LIST, INNATE_TALENT_RANKS } from '../constants';


interface GamePlayScreenProps {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    onSaveGame: (showNotification: (message: string) => void) => void;
    onBack: () => void;
}

const NpcInfoModal: React.FC<{ npc: NPC; allNpcs: NPC[]; onClose: () => void }> = ({ npc, allNpcs, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }} onClick={onClose}>
        <div className="bg-gray-900/95 border border-amber-500/50 rounded-lg shadow-2xl shadow-black/50 w-full max-w-md m-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-xl text-amber-300 font-bold font-title">{npc.name}</h3>
                <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
                <div>
                    <p className="text-sm text-gray-400 font-semibold">Trạng thái</p>
                    <p className="text-gray-300 italic">"{npc.status}"</p>
                </div>
                <div>
                    <p className="text-sm text-gray-400 font-semibold">Ngoại hình</p>
                    <p className="text-gray-300">{npc.description}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-400 font-semibold">Xuất thân</p>
                    <p className="text-gray-300">{npc.origin}</p>
                </div>
                 <div>
                    <p className="text-sm text-gray-400 font-semibold">Tính cách</p>
                    <p className="text-gray-300">{npc.personality}</p>
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
                                            {rel.type} với <span className="text-amber-300">{targetNpc.name}</span>
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
                            const rankStyle = INNATE_TALENT_RANKS[talent.rank] || INNATE_TALENT_RANKS['Phàm Tư'];
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
};

const GameMenuModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    onExit: () => void;
}> = ({ isOpen, onClose, onSave, onExit }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }} onClick={onClose}>
            <div className="bg-gray-900/95 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 w-full max-w-xs m-4 p-4 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
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
};


const initialStory: StoryEntry[] = [
    { id: 1, type: 'narrative', content: 'Màn sương mỏng dần, để lộ ra một con đường mòn phủ đầy lá rụng trong khu rừng tĩnh mịch. Không khí se lạnh mang theo mùi đất ẩm và cây cỏ. Xa xa, tiếng chim hót lảnh lót phá vỡ sự yên tĩnh. Đây là nơi câu chuyện của bạn bắt đầu.' },
    { id: 2, type: 'system', content: 'Bạn có thể dùng ô "Nói" để giao tiếp, "Hành Động" để tương tác, hoặc nhập "tu luyện" để tĩnh tọa hấp thụ linh khí.' },
];

const CULTIVATION_COMMANDS = ['tu luyện', 'đả tọa', 'hấp thụ linh khí', 'ngồi thiền', 'tĩnh tọa'];
const TRAVEL_SPEED = 3; // Coordinate units per shichen.

const getNewWeather = (season: Season): Weather => {
    const rand = Math.random();
    switch (season) {
        case 'Hạ': if (rand < 0.5) return 'SUNNY'; if (rand < 0.8) return 'RAIN'; return 'STORM';
        case 'Thu': if (rand < 0.5) return 'SUNNY'; if (rand < 0.9) return 'CLOUDY'; return 'RAIN';
        case 'Đông': if (rand < 0.5) return 'CLOUDY'; if (rand < 0.8) return 'SNOW'; return 'SUNNY';
        case 'Xuân': default: if (rand < 0.6) return 'SUNNY'; if (rand < 0.8) return 'CLOUDY'; return 'RAIN';
    }
};

const pureAdvanceTime = (currentDate: GameDate, shichenToAdvance: number = 1): GameDate => {
    let newDate = { ...currentDate };
    newDate.actionPoints = newDate.maxActionPoints; // Reset action points

    for(let i=0; i<shichenToAdvance; i++){
        const shichenIndex = SHICHEN_LIST.findIndex(s => s.name === newDate.shichen);
        const nextShichenIndex = (shichenIndex + 1) % SHICHEN_LIST.length;
        newDate.shichen = SHICHEN_LIST[nextShichenIndex].name;
        newDate.timeOfDay = TIMEOFDAY_DETAILS[newDate.shichen].name;

        if (nextShichenIndex === 0) {
            newDate.day++;
            newDate.weather = getNewWeather(newDate.season);
            if (newDate.day > 30) {
                newDate.day = 1;
                const seasons: Season[] = ['Xuân', 'Hạ', 'Thu', 'Đông'];
                const seasonIndex = seasons.findIndex(s => s === newDate.season);
                const nextSeasonIndex = (seasonIndex + 1) % seasons.length;
                newDate.season = seasons[nextSeasonIndex];
                if (nextSeasonIndex === 0) newDate.year++;
            }
        }
    }
    return newDate;
};

const simulateNpcMovement = (currentNpcs: NPC[], discoveredLocations: Location[], shichenPassed: number): NPC[] => {
    return currentNpcs.map(npc => {
        // Canon NPCs don't move randomly
        if (NPC_LIST.some(canonNpc => canonNpc.id === npc.id)) return npc;
        
        let newNpc = { ...npc };
        for (let i = 0; i < shichenPassed; i++) {
            if (Math.random() < 0.05) { // 5% chance to move per time step
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


const GamePlayScreen: React.FC<GamePlayScreenProps> = ({ gameState, setGameState, onSaveGame, onBack }) => {
    const [story, setStory] = useState<StoryEntry[]>(initialStory);
    const [isAILoading, setIsAILoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [locationMultiplier, setLocationMultiplier] = useState(1);
    const [viewingNpc, setViewingNpc] = useState<NPC | null>(null);
    const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
    const [actionCounter, setActionCounter] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    
    const { playerCharacter, activeNpcs, gameDate, discoveredLocations, worldState, encounteredNpcIds } = gameState;
    
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        const handleResize = () => setIsSidebarOpen(window.innerWidth > 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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


    const handleAdvanceTime = (shichenToAdvance: number = 1) => {
        setGameState(prev => {
            if (!prev) return null;
            return {
                ...prev,
                gameDate: pureAdvanceTime(prev.gameDate, shichenToAdvance),
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

    const currentRealmData = REALM_SYSTEM.find(r => r.id === playerCharacter.cultivation.currentRealmId);
    const currentStageData = currentRealmData?.stages.find(s => s.id === playerCharacter.cultivation.currentStageId);
    const currentRealmState = `${currentRealmData?.name || 'Vô danh'} - ${currentStageData?.name || 'Sơ kỳ'}`;

    const handleCultivate = () => {
        if (!currentStageData) return;
        
        handleAdvanceTime();
        setPlayerCharacter(prev => {
            const camNgo = prev.attributes.flatMap(g => g.attributes).find(a => a.name === 'Cảm Ngộ')?.value as number || 0;
            const qiGained = (1 + Math.floor(camNgo / 10)) * locationMultiplier;
            const newQi = Math.min(prev.cultivation.spiritualQi + qiGained, currentStageData.qiRequired);
             const systemMessage: StoryEntry = { id: Date.now(), type: 'system', content: `Bạn hấp thụ được ${qiGained.toLocaleString()} điểm linh khí. (Hệ số: x${locationMultiplier})` };
            setStory(s => [...s, systemMessage]);
            return { ...prev, cultivation: { ...prev.cultivation, spiritualQi: newQi } };
        });
    };
    
    const handleTravel = (destinationId: string) => {
        const destination = discoveredLocations.find(l => l.id === destinationId);
        const origin = currentLocation;

        if (destination && origin && origin.coordinates && destination.coordinates) {
            const dx = origin.coordinates.x - destination.coordinates.x;
            const dy = origin.coordinates.y - destination.coordinates.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            const travelTime = Math.max(1, Math.round(distance / TRAVEL_SPEED));

            handleAdvanceTime(travelTime);
            setPlayerCharacter(pc => ({ ...pc, currentLocationId: destinationId }));
            const travelMessage: StoryEntry = { id: Date.now(), type: 'narrative', content: `Sau ${travelTime} canh giờ, bạn đã đến được ${destination.name}.` };
            setStory(s => [...s, travelMessage]);
        }
    };
    
    const handleExplore = async () => {
        if (isAILoading) return;
        setIsAILoading(true);
        handleAdvanceTime();

        try {
            const { name, description } = await generateDynamicLocation(currentLocation);
            const exploreMessage: StoryEntry = { id: Date.now(), type: 'narrative', content: `Bạn dành thời gian khám phá xung quanh và phát hiện ra một nơi đặc biệt: **${name}**. ${description}` };
            setStory(s => [...s, exploreMessage]);
        } catch (error: any) {
            const errorResponse: StoryEntry = { id: Date.now() + 1, type: 'system', content: `Lỗi khi khám phá: ${error.message}` };
            setStory(prev => [...prev, errorResponse]);
        } finally {
            setIsAILoading(false);
        }
    };

    const processAIResponse = (responseText: string) => {
        let cleanedText = responseText;
        
        const tagRegex = /\[(ADD_ITEM|REMOVE_ITEM|ADD_CURRENCY|CREATE_NPC|DISCOVER_LOCATION|ADD_RUMOR):({.*})\]/gs;
        let match;
        while ((match = tagRegex.exec(responseText)) !== null) {
            const [fullMatch, tagName, jsonString] = match;
            try {
                const data = JSON.parse(jsonString);
                switch(tagName) {
                    case 'ADD_ITEM': {
                        const newItem: InventoryItem = { id: `item-${Date.now()}-${Math.random()}`, ...data };
                        setPlayerCharacter(pc => {
                            const existingItem = pc.inventory.items.find(i => i.name === newItem.name);
                            let newItems = existingItem 
                                ? pc.inventory.items.map(i => i.name === newItem.name ? {...i, quantity: i.quantity + newItem.quantity} : i)
                                : [...pc.inventory.items, newItem];
                            return {...pc, inventory: {...pc.inventory, items: newItems}};
                        });
                        setStory(prev => [...prev, {id: Date.now() + Math.random(), type: 'system', content: `Bạn nhận được [${newItem.name} x${newItem.quantity}]`}]);
                        break;
                    }
                     case 'REMOVE_ITEM': {
                        const { name, quantity } = data;
                        setPlayerCharacter(pc => {
                            const newItems = pc.inventory.items.map(item => {
                                if (item.name === name) {
                                    return { ...item, quantity: Math.max(0, item.quantity - (quantity || 1)) };
                                }
                                return item;
                            }).filter(item => item.quantity > 0);
                            return { ...pc, inventory: { ...pc.inventory, items: newItems } };
                        });
                        setStory(prev => [...prev, {id: Date.now() + Math.random(), type: 'system', content: `Bạn đã mất [${name} x${quantity || 1}]`}]);
                        break;
                    }
                    case 'ADD_CURRENCY': {
                        setPlayerCharacter(pc => ({ ...pc, currencies: { ...pc.currencies, [data.name]: (pc.currencies[data.name] || 0) + data.amount } }));
                        setStory(prev => [...prev, {id: Date.now() + Math.random(), type: 'system', content: `Bạn nhận được ${data.amount.toLocaleString()} ${data.name}`}]);
                        break;
                    }
                    case 'CREATE_NPC': {
                        const newNpc: NPC = { id: `dynamic-npc-${Date.now()}`, talents: [], ...data };
                        setGameState(gs => gs ? ({ ...gs, activeNpcs: [...gs.activeNpcs, newNpc] }) : null);
                        setStory(prev => [...prev, {id: Date.now() + Math.random(), type: 'system', content: `Bạn đã gặp [${newNpc.name}].`}]);
                        break;
                    }
                     case 'DISCOVER_LOCATION': {
                        const newLocation: Location = { ...data };
                        setGameState(gs => {
                            if (!gs || gs.discoveredLocations.some(l => l.id === newLocation.id)) return gs;
                            // Ensure neighbors are connected both ways
                            const updatedOrigin = gs.discoveredLocations.find(l => l.id === currentLocation.id);
                            if (updatedOrigin && !updatedOrigin.neighbors.includes(newLocation.id)) {
                                updatedOrigin.neighbors.push(newLocation.id);
                            }
                            return { 
                                ...gs, 
                                discoveredLocations: [
                                    ...gs.discoveredLocations.filter(l => l.id !== currentLocation.id),
                                    ...(updatedOrigin ? [updatedOrigin] : []),
                                    newLocation
                                ] 
                            };
                        });
                         setStory(prev => [...prev, {id: Date.now() + Math.random(), type: 'system', content: `Bạn đã khám phá ra [${newLocation.name}].`}]);
                        break;
                    }
                    case 'ADD_RUMOR': {
                        const newRumor: Rumor = { id: `rumor-${Date.now()}`, ...data };
                        setGameState(gs => gs ? ({ ...gs, worldState: { ...gs.worldState, rumors: [...gs.worldState.rumors, newRumor] } }) : null);
                        setStory(prev => [...prev, {id: Date.now() + Math.random(), type: 'system', content: `Bạn nghe được một tin đồn mới.`}]);
                        break;
                    }
                }
            } catch (e) { console.error(`Failed to parse ${tagName} tag`, e, jsonString); }
        }
        cleanedText = cleanedText.replace(tagRegex, '').trim();

        if (cleanedText) {
            const aiResponse: StoryEntry = { id: Date.now() + 1, type: 'narrative', content: cleanedText };
            setStory(prev => [...prev, aiResponse]);
        }
    };

    const handlePlayerAction = async (type: 'speak' | 'action' | 'continue', text: string) => {
        if (isAILoading || currentEvent) return;
        
        const lowercasedText = text.toLowerCase().trim();
        if (CULTIVATION_COMMANDS.includes(lowercasedText)) {
            handleCultivate();
            return;
        }

        let shichenAdvanced = false;
        if (type !== 'continue') {
            const newActionPoints = gameDate.actionPoints - 1;
            if (newActionPoints <= 0) {
                handleAdvanceTime();
                shichenAdvanced = true;
            } else {
                setGameState(gs => gs ? ({ ...gs, gameDate: { ...gs.gameDate, actionPoints: newActionPoints } }) : null);
            }
        } else {
            handleAdvanceTime();
            shichenAdvanced = true;
        }

        const playerEntryType = type === 'speak' ? 'player-dialogue' : 'player-action';
        const playerEntry: StoryEntry = { id: Date.now(), type: playerEntryType, content: text };
        let newHistory = [...story];
        if (type !== 'continue') {
            newHistory.push(playerEntry);
            setStory(newHistory);
        }
        setIsAILoading(true);

        try {
            const techniqueUsed = await analyzeActionForTechnique(text, playerCharacter.techniques);
            let techniqueFeedback = null;

            if (techniqueUsed) {
                const linhLucAttr = playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === techniqueUsed.cost.type);
                if (linhLucAttr && (linhLucAttr.value as number) >= techniqueUsed.cost.value) {
                    setPlayerCharacter(pc => {
                         const newAttributes = pc.attributes.map(group => ({
                            ...group,
                            attributes: group.attributes.map(attr => {
                                if (attr.name === techniqueUsed.cost.type) {
                                    return { ...attr, value: (attr.value as number) - techniqueUsed.cost.value };
                                }
                                return attr;
                            })
                        }));
                        return {...pc, attributes: newAttributes};
                    });
                    const techMessage: StoryEntry = { id: Date.now() + 0.5, type: 'system', content: `Bạn sử dụng [${techniqueUsed.name}], tiêu hao ${techniqueUsed.cost.value} ${techniqueUsed.cost.type}.` };
                    newHistory.push(techMessage);
                    setStory(s => [...s, techMessage]);
                    techniqueFeedback = techniqueUsed;
                } else {
                    const failMessage: StoryEntry = { id: Date.now() + 0.5, type: 'system', content: `${techniqueUsed.cost.type} không đủ để thi triển [${techniqueUsed.name}]!` };
                    setStory(s => [...s, failMessage]);
                    setIsAILoading(false);
                    return;
                }
            }
            
            // This is a complex operation, so we need to get the latest game state
            setGameState(latestGameState => {
                if (!latestGameState) {
                    setIsAILoading(false);
                    return null;
                }
                generateStoryContinuation(newHistory, playerEntry, latestGameState, undefined, techniqueFeedback)
                    .then(aiResponseText => {
                        processAIResponse(aiResponseText);
                        const newActionCount = actionCounter + 1;
                        setActionCounter(newActionCount);
                        if (newActionCount % 5 === 0 && Math.random() < 0.6) {
                            generateGameEvent(playerCharacter, gameDate, currentLocation, npcsAtLocation).then(setCurrentEvent);
                        }
                    })
                    .catch(error => {
                        const errorResponse: StoryEntry = { id: Date.now() + 1, type: 'system', content: `Lỗi hệ thống: ${error.message}` };
                        setStory(prev => [...prev, errorResponse]);
                    })
                    .finally(() => setIsAILoading(false));
                
                return latestGameState; // Return current state, async operations will update it later
            });

        } catch (error: any) {
            const errorResponse: StoryEntry = { id: Date.now() + 1, type: 'system', content: `Lỗi hệ thống: ${error.message}` };
            setStory(prev => [...prev, errorResponse]);
            setIsAILoading(false);
        }
    };
    
    const handleEventChoice = async (choice: EventChoice) => {
        if (isAILoading) return;

        setIsAILoading(true);
        const isDemonEvent = currentEvent?.id === 'inner_demon_event';
        setCurrentEvent(null);

        let result: 'success' | 'failure' | 'no_check' = 'no_check';
        let outcomeText = `Bạn chọn: "${choice.text}".`;

        if (choice.check) {
            const attribute = playerCharacter.attributes
                .flatMap(g => g.attributes)
                .find(a => a.name === choice.check!.attribute);
            const attributeValue = (attribute?.value as number) || 10;
            const modifier = Math.floor((attributeValue - 10) / 2);
            const roll = Math.floor(Math.random() * 20) + 1;
            const total = roll + modifier;
            const success = total >= choice.check.difficulty;
            result = success ? 'success' : 'failure';

            outcomeText += `\n(Kiểm tra ${choice.check.attribute}: ${total} [${roll > 0 ? roll : `(${roll})`}${modifier >= 0 ? `+${modifier}`: modifier}] vs DC ${choice.check.difficulty} -> ${success ? 'Thành Công' : 'Thất Bại'})`;
        }

        const systemMessage: StoryEntry = { id: Date.now(), type: 'system', content: outcomeText };
        const playerActionEntry: StoryEntry = { id: Date.now() + 0.1, type: 'player-action', content: choice.text };

        const newHistory = [...story, systemMessage, playerActionEntry];
        setStory(newHistory);

        if (isDemonEvent) {
            if (result === 'success') {
                setPlayerCharacter(pc => {
                    const newAttributes = pc.attributes.map(group => {
                        if (group.title === 'Thông Tin Tu Luyện') {
                            return {
                                ...group,
                                attributes: group.attributes.map(attr => {
                                    if (attr.name === 'Đạo Tâm') {
                                        return { ...attr, value: (attr.value as number) + 5 }; // Thưởng vĩnh viễn
                                    }
                                    return attr;
                                })
                            };
                        }
                        return group;
                    });
                    return {
                        ...pc,
                        attributes: newAttributes,
                        cultivation: { ...pc.cultivation, hasConqueredInnerDemon: true, spiritualQi: 0 } // Reset Linh khí sau trận chiến
                    };
                });
                const successMessage: StoryEntry = { id: Date.now() + 1, type: 'system', content: 'Bạn gầm lên một tiếng, dùng ý chí sắc như kiếm chém tan bóng đen! Tâm ma đã bị trảm, đạo tâm của bạn trở nên kiên định và không gì có thể lay chuyển. Dù lần này đột phá không thành, nền tảng của bạn đã vững chắc hơn bao giờ hết.' };
                setStory(s => [...s, successMessage]);
                setIsAILoading(false);
            } else { // Thất bại
                setIsGameOver(true);
                setIsAILoading(false);
            }
        } else {
            // This is a complex operation, so we need to get the latest game state
             setGameState(latestGameState => {
                if (!latestGameState) {
                    setIsAILoading(false);
                    return null;
                }
                generateStoryContinuation(
                    newHistory,
                    playerActionEntry,
                    latestGameState,
                    { choiceText: choice.text, result }
                ).then(processAIResponse)
                 .catch(error => {
                    const errorResponse: StoryEntry = { id: Date.now() + 1, type: 'system', content: `Lỗi hệ thống: ${error.message}` };
                    setStory(prev => [...prev, errorResponse]);
                })
                .finally(() => setIsAILoading(false));
                
                return latestGameState;
             });
        }
    };
    
    const handleBreakthrough = async () => {
        if (!currentRealmData || !currentStageData || playerCharacter.cultivation.spiritualQi < currentStageData.qiRequired) return;
        
        const isTribulationRealm = currentRealmData.hasTribulation || (REALM_SYSTEM[REALM_SYSTEM.findIndex(r => r.id === currentRealmData.id) + 1]?.hasTribulation);

        const canCo = playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === 'Nhục Thân')?.value as number || 10;
        const coDuyen = playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === 'Cơ Duyên')?.value as number || 10;
        const daoTam = playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === 'Đạo Tâm')?.value as number || 10;
        const baseChance = 0.7; // 70%
        const successChance = Math.min(0.95, baseChance + ((canCo - 10) * 0.015) + ((coDuyen - 10) * 0.005) + ((daoTam - 10) * 0.01));
        const successRoll = Math.random() < successChance;

        if (successRoll) {
            const currentStageIndex = currentRealmData.stages.findIndex(s => s.id === playerCharacter.cultivation.currentStageId);
            let nextStageData = currentRealmData.stages[currentStageIndex + 1];
            let nextRealmData = currentRealmData;
            if (!nextStageData) {
                const currentRealmIndex = REALM_SYSTEM.findIndex(r => r.id === currentRealmData.id);
                const nextRealm = REALM_SYSTEM[currentRealmIndex + 1];
                if (nextRealm) {
                    nextRealmData = nextRealm;
                    nextStageData = nextRealm.stages[0];
                } else {
                    setStory(prev => [...prev, { id: Date.now(), type: 'system', content: "Bạn đã đạt đến đỉnh cao của thế giới này, không thể đột phá thêm."}]);
                    return;
                }
            }
            const bonuses = nextStageData.bonuses;
            setPlayerCharacter(prev => {
                const newAttributes = prev.attributes.map(group => ({
                    ...group,
                    attributes: group.attributes.map(attr => {
                        const bonus = bonuses.find(b => b.attribute === attr.name);
                        if (bonus) {
                            const newValue = (attr.value as number) + bonus.value;
                            const newMaxValue = attr.maxValue ? attr.maxValue + bonus.value : undefined;
                            return { ...attr, value: newValue, maxValue: newMaxValue };
                        }
                        return attr;
                    })
                }));
                return { ...prev, attributes: newAttributes, cultivation: { ...prev.cultivation, currentRealmId: nextRealmData.id, currentStageId: nextStageData.id, spiritualQi: 0 }};
            });
            const oldRealmName = currentRealmData.name;
            const breakthroughNarrative = await generateBreakthroughNarrative(playerCharacter, oldRealmName, nextRealmData, nextStageData);
            setStory(prev => [...prev, { id: Date.now(), type: 'narrative', content: breakthroughNarrative}]);

        } else {
            if (isTribulationRealm && !playerCharacter.cultivation.hasConqueredInnerDemon) {
                const demonEvent: GameEvent = {
                    id: 'inner_demon_event',
                    description: 'Đột phá thất bại, linh khí hỗn loạn dẫn động tâm ma từ sâu trong thức hải! Một bóng đen mang hình hài của chính bạn với đôi mắt đỏ ngầu xuất hiện, nó gào thét muốn chiếm đoạt thân thể này.',
                    choices: [{
                        id: 'confront_demon', text: 'Đối mặt và trảm nó!',
                        check: { attribute: 'Đạo Tâm', difficulty: 15 + Math.floor(daoTam / 2) }
                    }]
                };
                setCurrentEvent(demonEvent);
                const systemMessage: StoryEntry = { id: Date.now(), type: 'system', content: 'Thiên kiếp chưa tới, tâm ma đã đến trước! Đây là kiếp nạn của bạn!' };
                setStory(s => [...s, systemMessage]);
            } else {
                setPlayerCharacter(pc => ({
                    ...pc, cultivation: { ...pc.cultivation, spiritualQi: pc.cultivation.spiritualQi / 2 }
                }));
                const failureMessage: StoryEntry = { id: Date.now(), type: 'system', content: `Đột phá thất bại! Linh khí trong cơ thể hỗn loạn, bạn bị phản phệ, tu vi tổn hại.` };
                setStory(s => [...s, failureMessage]);
            }
        }
    };

    return (
        <div className="w-full h-screen bg-transparent flex flex-col animate-fade-in">
             {notification && (
                <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-green-600/90 text-white px-6 py-2 rounded-full shadow-lg animate-fade-in">
                    {notification}
                </div>
            )}
            <GameMenuModal 
                isOpen={isGameMenuOpen}
                onClose={() => setIsGameMenuOpen(false)}
                onSave={() => { onSaveGame(setNotification); setIsGameMenuOpen(false); }}
                onExit={onBack}
            />
            {viewingNpc && <NpcInfoModal npc={viewingNpc} allNpcs={activeNpcs} onClose={() => setViewingNpc(null)} />}
             {isGameOver && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }}>
                    <div className="bg-gray-900/95 border border-red-500/50 rounded-lg shadow-2xl shadow-black/50 w-full max-w-md m-4 p-8 text-center">
                        <div className="flex justify-center mb-4">
                            <FaExclamationTriangle className="text-red-500 text-5xl" />
                        </div>
                        <h3 className="text-2xl text-red-400 font-bold font-title">Tẩu Hỏa Nhập Ma</h3>
                        <p className="text-gray-300 mt-4">Lý trí của bạn đã bị tâm ma nuốt chửng. Hành trình tu tiên đã kết thúc trong bi kịch.</p>
                        <button onClick={onBack} className="mt-8 px-8 py-3 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80 transition-colors">
                           Kết Thúc
                        </button>
                    </div>
                </div>
            )}
            <header className="w-full bg-black/30 backdrop-blur-sm p-3 border-b border-gray-700/50 z-20 flex-shrink-0 space-y-3">
                <div className="flex justify-between items-center">
                    <button onClick={() => setIsGameMenuOpen(true)} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors" title="Tùy chọn">
                        <FaCog className="w-5 h-5" />
                    </button>
                    <div className="text-center">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-200 font-title" style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>
                            {playerCharacter.identity.name}
                        </h1>
                        <p className="text-xs text-amber-300 font-semibold">{currentRealmState}</p>
                    </div>
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors lg:hidden" title="Thông tin nhân vật">
                        {isSidebarOpen ? <FaTimes /> : <FaBars />}
                    </button>
                </div>
                <Timeline gameDate={gameDate} />
            </header>
            <div className="w-full flex-grow grid grid-cols-1 lg:grid-cols-4 overflow-hidden relative">
                <div className="lg:col-span-3 flex flex-col h-full overflow-hidden">
                    <StoryLog story={story} inventoryItems={playerCharacter.inventory.items} />
                    {currentEvent ? (
                        <EventPanel 
                            key={currentEvent.id} 
                            event={currentEvent} 
                            onChoice={handleEventChoice} 
                            playerAttributes={playerCharacter.attributes.flatMap(g => g.attributes)}
                        />
                    ) : (
                        <PlayerInput onAction={handlePlayerAction} disabled={isAILoading} />
                    )}
                </div>
                {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setIsSidebarOpen(false)} />}
                <aside className={`fixed top-0 right-0 h-full w-full max-w-sm bg-black/60 backdrop-blur-lg border-l border-gray-700/50 overflow-y-auto z-30 transform transition-transform duration-300 ease-in-out lg:static lg:transform-none lg:col-span-1 lg:max-w-none lg:bg-black/30 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <Sidebar 
                        playerCharacter={playerCharacter}
                        setPlayerCharacter={setPlayerCharacter}
                        onBreakthrough={handleBreakthrough}
                        currentLocation={currentLocation}
                        npcsAtLocation={npcsAtLocation}
                        neighbors={neighbors}
                        rumors={worldState.rumors}
                        onTravel={handleTravel}
                        onExplore={handleExplore}
                        onNpcSelect={setViewingNpc}
                        allNpcs={activeNpcs}
                        encounteredNpcIds={encounteredNpcIds}
                        discoveredLocations={discoveredLocations}
                    />
                </aside>
            </div>
        </div>
    );
};

export default GamePlayScreen;