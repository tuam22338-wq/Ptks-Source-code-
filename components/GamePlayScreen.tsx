import React, { useState, useMemo, useEffect } from 'react';
import type { GameState, StoryEntry, GameDate, Season, Weather, Location, NPC, PlayerCharacter, GameEvent, EventChoice, InventoryItem, EquipmentSlot, StatBonus, Rumor, WorldState, CultivationTechnique, PlayerNpcRelationship, AttributeGroup, CultivationPath } from '../types';
import StoryLog from './StoryLog';
import PlayerInput from './PlayerInput';
import Sidebar from './Sidebar';
import Timeline from './Timeline';
import EventPanel from './EventPanel';
import ShopModal from './ShopModal';
import CultivationPathModal from './CultivationPathModal';
import CustomStoryPlayer from './CustomStoryPlayer';
import { FaArrowLeft, FaBars, FaTimes, FaExclamationTriangle, FaCog, FaSave } from 'react-icons/fa';
import { generateStoryContinuationStream, generateGameEvent, generateDynamicLocation, analyzeActionForTechnique, generateBreakthroughNarrative, generateWorldEvent } from '../services/geminiService';
import { SHICHEN_LIST, REALM_SYSTEM, TIMEOFDAY_DETAILS, NPC_LIST, INNATE_TALENT_RANKS, CULTIVATION_PATHS } from '../constants';


interface GamePlayScreenProps {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    onSaveGame: (currentState: GameState, showNotification: (message: string) => void) => void;
    onBack: () => void;
}

const NpcInfoModal: React.FC<{ npc: NPC; allNpcs: NPC[]; onClose: () => void }> = ({ npc, allNpcs, onClose }) => {
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
};


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

const pureAdvanceTime = (currentDate: GameDate, shichenToAdvance: number = 1): { newDate: GameDate, yearPassed: boolean, monthPassed: boolean } => {
    let newDate = { ...currentDate };
    let yearPassed = false;
    let monthPassed = false;
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
    }
    return { newDate, yearPassed, monthPassed };
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
                    // Ensure current value doesn't exceed new max value on unequip
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


const GamePlayScreen: React.FC<GamePlayScreenProps> = ({ gameState, setGameState, onSaveGame, onBack }) => {
    const [isAILoading, setIsAILoading] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [locationMultiplier, setLocationMultiplier] = useState(1);
    const [viewingNpc, setViewingNpc] = useState<NPC | null>(null);
    const [currentEvent, setCurrentEvent] = useState<GameEvent | null>(null);
    const [actionCounter, setActionCounter] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
    const [notification, setNotification] = useState<string | null>(null);
    const [activeShopId, setActiveShopId] = useState<string | null>(null);
    const [pendingPathChoice, setPendingPathChoice] = useState<CultivationPath[] | null>(null);
    
    const { playerCharacter, activeNpcs, gameDate, discoveredLocations, worldState, storyLog, encounteredNpcIds, realmSystem, activeMods, activeStory } = gameState;
    
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
                addStoryEntry({ type: 'system', content: `Có tin tức mới trong thiên hạ... (Kiểm tra mục Thế Giới hoặc Wiki)`});
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

    const currentRealmData = realmSystem.find(r => r.id === playerCharacter.cultivation.currentRealmId);
    const currentStageData = currentRealmData?.stages.find(s => s.id === playerCharacter.cultivation.currentStageId);
    const currentRealmState = `${currentRealmData?.name || 'Vô danh'} - ${currentStageData?.name || 'Sơ kỳ'}`;

    const handleCultivate = async () => {
        if (!currentStageData) return;
        
        await handleAdvanceTime();
        setPlayerCharacter(prev => {
            const camNgo = prev.attributes.flatMap(g => g.attributes).find(a => a.name === 'Cảm Ngộ')?.value as number || 0;
            const qiGained = (1 + Math.floor(camNgo / 10)) * locationMultiplier;
            const newQi = Math.min(prev.cultivation.spiritualQi + qiGained, currentStageData.qiRequired);
             addStoryEntry({ type: 'system', content: `Bạn hấp thụ được ${qiGained.toLocaleString()} điểm linh khí. (Hệ số: x${locationMultiplier})` });
            return { ...prev, cultivation: { ...prev.cultivation, spiritualQi: newQi } };
        });
    };
    
    const handleTravel = async (destinationId: string) => {
        const destination = discoveredLocations.find(l => l.id === destinationId);
        const origin = currentLocation;

        if (destination && origin && origin.coordinates && destination.coordinates) {
            const dx = origin.coordinates.x - destination.coordinates.x;
            const dy = origin.coordinates.y - destination.coordinates.y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            const travelTime = Math.max(1, Math.round(distance / TRAVEL_SPEED));

            await handleAdvanceTime(travelTime);
            setPlayerCharacter(pc => ({ ...pc, currentLocationId: destinationId }));
            addStoryEntry({ type: 'narrative', content: `Sau ${travelTime} canh giờ, bạn đã đến được ${destination.name}.` });
        }
    };
    
    const handleExplore = async () => {
        if (isAILoading) return;
        setIsAILoading(true);
        await handleAdvanceTime();

        try {
            const { name, description } = await generateDynamicLocation(currentLocation);
            addStoryEntry({ type: 'narrative', content: `Bạn dành thời gian khám phá xung quanh và phát hiện ra một nơi đặc biệt: **${name}**. ${description}` });
        } catch (error: any) {
            addStoryEntry({ type: 'system', content: `Lỗi khi khám phá: ${error.message}` });
        } finally {
            setIsAILoading(false);
        }
    };

    const processAIResponse = (responseText: string) => {
        const tagRegex = /\[(ADD_ITEM|REMOVE_ITEM|ADD_CURRENCY|CREATE_NPC|DISCOVER_LOCATION|ADD_RUMOR|SHOW_SHOP|UPDATE_RELATIONSHIP|DEATH|ADD_TECHNIQUE|UPDATE_ATTRIBUTE|ADD_RECIPE):({.*?})\]/gs;

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
                        addStoryEntry({ type: 'system', content: `Bạn nhận được [${newItem.name} x${newItem.quantity}]`});
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
                        addStoryEntry({ type: 'system', content: `Bạn đã mất [${name} x${quantity || 1}]`});
                        break;
                    }
                    case 'ADD_CURRENCY': {
                        setPlayerCharacter(pc => ({ ...pc, currencies: { ...pc.currencies, [data.name]: (pc.currencies[data.name] || 0) + data.amount } }));
                        addStoryEntry({ type: 'system', content: `Bạn nhận được ${data.amount.toLocaleString()} ${data.name}`});
                        break;
                    }
                    case 'CREATE_NPC': {
                        const newNpc: NPC = { id: `dynamic-npc-${Date.now()}`, talents: [], ...data };
                        setGameState(gs => gs ? ({ ...gs, activeNpcs: [...gs.activeNpcs, newNpc] }) : null);
                        addStoryEntry({ type: 'system', content: `Bạn đã gặp [${newNpc.identity.name}].`});
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
                         addStoryEntry({ type: 'system', content: `Bạn đã khám phá ra [${newLocation.name}].`});
                        break;
                    }
                    case 'ADD_RUMOR': {
                        const newRumor: Rumor = { id: `rumor-${Date.now()}`, ...data };
                        setGameState(gs => gs ? ({ ...gs, worldState: { ...gs.worldState, rumors: [...gs.worldState.rumors, newRumor] } }) : null);
                        addStoryEntry({ type: 'system', content: `Bạn nghe được một tin đồn mới.`});
                        break;
                    }
                    case 'SHOW_SHOP': {
                        setActiveShopId(data.shopId);
                        break;
                    }
                    case 'UPDATE_RELATIONSHIP': {
                        const { npcName, change } = data;
                        const targetNpc = activeNpcs.find(n => n.identity.name === npcName);
                        if (targetNpc) {
                            setPlayerCharacter(pc => {
                                const existingRel = pc.relationships.find(r => r.npcId === targetNpc.id);
                                let newRelationships: PlayerNpcRelationship[];
                                if (existingRel) {
                                    newRelationships = pc.relationships.map(r => r.npcId === targetNpc.id ? { ...r, value: Math.max(-100, Math.min(100, r.value + change)) } : r);
                                } else {
                                    newRelationships = [...pc.relationships, { npcId: targetNpc.id, value: Math.max(-100, Math.min(100, change)), status: 'Trung lập' }];
                                }
                                
                                newRelationships = newRelationships.map(r => {
                                    let newStatus: PlayerNpcRelationship['status'] = 'Trung lập';
                                    if (r.value <= -50) newStatus = 'Thù địch';
                                    else if (r.value < 0) newStatus = 'Lạnh nhạt';
                                    else if (r.value >= 50) newStatus = 'Tri kỷ';
                                    else if (r.value > 0) newStatus = 'Thân thiện';
                                    return { ...r, status: newStatus };
                                });

                                return { ...pc, relationships: newRelationships };
                            });
                            addStoryEntry({type: 'system', content: `Mối quan hệ của bạn với ${npcName} đã thay đổi.`});
                        }
                        break;
                    }
                    case 'DEATH': {
                        addStoryEntry({ type: 'system', content: data.reason });
                        setIsGameOver(true);
                        break;
                    }
                    case 'ADD_TECHNIQUE': {
                        const newTechnique: CultivationTechnique = { id: `tech-${Date.now()}-${Math.random()}`, ...data };
                        setPlayerCharacter(pc => {
                            if (pc.techniques.some(t => t.name === newTechnique.name)) {
                                return pc;
                            }
                            return { ...pc, techniques: [...pc.techniques, newTechnique] };
                        });
                        addStoryEntry({ type: 'system', content: `Bạn đã học được công pháp mới: [${newTechnique.name}]`});
                        break;
                    }
                    case 'UPDATE_ATTRIBUTE': {
                        const { name, change } = data;
                        setPlayerCharacter(pc => {
                            const newAttributes = deepCopyAttributes(pc.attributes);
                            let updated = false;
                            for (const group of newAttributes) {
                                const attr = group.attributes.find(a => a.name === name);
                                if (attr && typeof attr.value === 'number') {
                                    attr.value = (attr.value as number) + change;
                                    updated = true;
                                    break;
                                }
                            }
                            if (updated) {
                                addStoryEntry({ type: 'system', content: `[${name} ${change > 0 ? `+${change}` : change}]` });
                                return { ...pc, attributes: newAttributes };
                            }
                            return pc;
                        });
                        break;
                    }
                    case 'ADD_RECIPE': {
                        const { id } = data;
                        setPlayerCharacter(pc => {
                            if (pc.knownRecipeIds.includes(id)) return pc;
                            return { ...pc, knownRecipeIds: [...pc.knownRecipeIds, id] };
                        });
                        addStoryEntry({ type: 'system', content: `Bạn đã học được một đan phương mới!` });
                        break;
                    }
                }
            } catch (e) { console.error(`Failed to parse ${tagName} tag`, e, jsonString); }
        }
    };

    const handleStreamedAIResponse = async (
        playerActionEntry: StoryEntry,
        eventOutcome?: { choiceText: string; result: 'success' | 'failure' | 'no_check' },
        techniqueUsed?: CultivationTechnique
    ) => {
        setIsAILoading(true);
    
        const streamingEntryId = Date.now() + Math.random();
        addStoryEntry({ id: streamingEntryId, type: 'narrative', content: '...' });
    
        let fullResponse = '';
        try {
            const stream = generateStoryContinuationStream(
                gameState.storyLog,
                playerActionEntry,
                gameState,
                eventOutcome,
                techniqueUsed
            );
    
            for await (const chunk of stream) {
                fullResponse += chunk;
                setGameState(gs => {
                    if (!gs) return null;
                    const newLog = gs.storyLog.map(entry => 
                        entry.id === streamingEntryId ? { ...entry, content: fullResponse } : entry
                    );
                    return { ...gs, storyLog: newLog };
                });
            }
    
            processAIResponse(fullResponse);
            
            const tagRegex = /\[(ADD_ITEM|REMOVE_ITEM|ADD_CURRENCY|CREATE_NPC|DISCOVER_LOCATION|ADD_RUMOR|SHOW_SHOP|UPDATE_RELATIONSHIP|DEATH|ADD_TECHNIQUE|UPDATE_ATTRIBUTE|ADD_RECIPE):({.*?})\]/gs;
            const cleanedText = fullResponse.replace(tagRegex, '').trim();
    
            setGameState(gs => {
                if (!gs) return null;
                if (cleanedText) {
                    const newLog = gs.storyLog.map(entry =>
                        entry.id === streamingEntryId ? { ...entry, content: cleanedText } : entry
                    );
                    return { ...gs, storyLog: newLog };
                } else {
                    return { ...gs, storyLog: gs.storyLog.filter(e => e.id !== streamingEntryId) };
                }
            });
    
            const newActionCount = actionCounter + 1;
            setActionCounter(newActionCount);
            if (newActionCount % 5 === 0 && Math.random() < 0.6) {
                setGameState(gs => {
                    if(!gs) return null;
                    const latestLocation = gs.discoveredLocations.find(l => l.id === gs.playerCharacter.currentLocationId)!;
                    const latestNpcs = gs.activeNpcs.filter(n => n.locationId === latestLocation.id);
                    generateGameEvent(gs.playerCharacter, gs.gameDate, latestLocation, latestNpcs).then(setCurrentEvent);
                    return gs;
                });
            }
        } catch (error) {
            addStoryEntry({ type: 'system', content: `Lỗi hệ thống: ${(error as Error).message}` });
            setGameState(gs => gs ? { ...gs, storyLog: gs.storyLog.filter(e => e.id !== streamingEntryId) } : null);
        } finally {
            setIsAILoading(false);
        }
    };

    const handlePlayerAction = async (type: 'speak' | 'action' | 'continue', text: string) => {
        if (isAILoading || currentEvent) return;
        
        const lowercasedText = text.toLowerCase().trim();
        if (CULTIVATION_COMMANDS.includes(lowercasedText)) {
            await handleCultivate();
            return;
        }

        if (type !== 'continue') {
            const newActionPoints = gameDate.actionPoints - 1;
            if (newActionPoints <= 0) {
                await handleAdvanceTime();
            } else {
                setGameState(gs => gs ? ({ ...gs, gameDate: { ...gs.gameDate, actionPoints: newActionPoints } }) : null);
            }
        } else {
            await handleAdvanceTime();
        }

        const playerEntryType = type === 'speak' ? 'player-dialogue' : 'player-action';
        const playerEntry: StoryEntry = { id: Date.now(), type: playerEntryType, content: text };
        if (type !== 'continue') {
            addStoryEntry(playerEntry);
        }
        
        const techniqueUsed = await analyzeActionForTechnique(text, playerCharacter.techniques);
        if(techniqueUsed) {
            const cost = techniqueUsed.cost;
            const hasEnough = (playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === cost.type)?.value as number) >= cost.value;
            if (hasEnough) {
                 setPlayerCharacter(pc => {
                    const newAttributes = deepCopyAttributes(pc.attributes);
                    const attr = newAttributes.flatMap(g => g.attributes).find(a => a.name === cost.type);
                    if (attr && typeof attr.value === 'number') {
                        (attr.value as number) -= cost.value;
                    }
                    return { ...pc, attributes: newAttributes };
                });
                addStoryEntry({type: 'system', content: `Bạn đã sử dụng [${techniqueUsed.name}], tiêu hao ${cost.value} ${cost.type}.`});
                await handleStreamedAIResponse(playerEntry, undefined, techniqueUsed);
            } else {
                addStoryEntry({type: 'system', content: `Không đủ ${cost.type} để sử dụng ${techniqueUsed.name}!`});
            }

        } else {
            await handleStreamedAIResponse(playerEntry);
        }
    };
    
    const handleEventChoice = (choice: EventChoice) => {
        let result: 'success' | 'failure' | 'no_check' = 'no_check';
        if (choice.check) {
            const attribute = playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === choice.check!.attribute);
            const attributeValue = (attribute?.value as number) || 10;
            const modifier = Math.floor((attributeValue - 10) / 2);
            const roll = Math.floor(Math.random() * 20) + 1;
            const total = roll + modifier;
            result = total >= choice.check.difficulty ? 'success' : 'failure';
        }

        const playerActionEntry: StoryEntry = { id: Date.now(), type: 'player-action', content: choice.text };
        addStoryEntry(playerActionEntry);
        
        setCurrentEvent(null);
        handleStreamedAIResponse(playerActionEntry, { choiceText: choice.text, result });
    };

    const handleBreakthrough = async () => {
        if (!currentRealmData || !currentStageData || !playerCharacter.cultivation) return;
        
        const currentStageIndex = currentRealmData.stages.findIndex(s => s.id === playerCharacter.cultivation.currentStageId);
        const isLastStage = currentStageIndex === currentRealmData.stages.length - 1;
        
        const newCultivation = { ...playerCharacter.cultivation, spiritualQi: 0 };
        const oldRealmName = currentRealmData.name;
        
        if (isLastStage) {
            const currentRealmIndex = realmSystem.findIndex(r => r.id === currentRealmData.id);
            const newRealm = realmSystem[currentRealmIndex + 1];
            if (newRealm) {
                newCultivation.currentRealmId = newRealm.id;
                newCultivation.currentStageId = newRealm.stages[0].id;

                 // Check for new destiny paths
                const availablePaths = CULTIVATION_PATHS.filter(p => p.requiredRealmId === newRealm.id && !playerCharacter.chosenPathIds.includes(p.id));
                if (availablePaths.length > 0) {
                    setPendingPathChoice(availablePaths);
                }

            } else {
                addStoryEntry({ type: 'system', content: "Bạn đã đạt đến đỉnh cao của thế giới này!" });
                return;
            }
        } else {
            newCultivation.currentStageId = currentRealmData.stages[currentStageIndex + 1].id;
        }

        setGameState(gs => {
            if (!gs) return null;
            let newPc = { ...gs.playerCharacter, cultivation: newCultivation };
            const newRealmData = realmSystem.find(r => r.id === newCultivation.currentRealmId)!;
            const newStageData = newRealmData.stages.find(s => s.id === newCultivation.currentStageId)!;
            
            // Apply all bonuses up to and including the new stage
            newPc = applyBonuses(newPc, newStageData.bonuses, 'add');
            
            generateBreakthroughNarrative(newPc, oldRealmName, newRealmData, newStageData).then(narrative => addStoryEntry({ type: 'narrative', content: narrative }));
            
            return { ...gs, playerCharacter: newPc };
        });
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

    const showNotification = (message: string) => {
        setNotification(message);
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
    
    return (
        <div className="w-full h-screen flex flex-col bg-black">
            {notification && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-teal-600/90 text-white px-6 py-2 rounded-full shadow-lg animate-fade-in">
                    {notification}
                </div>
            )}
             {isGameOver && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="text-center p-8">
                        <FaExclamationTriangle className="text-7xl text-red-500 mx-auto mb-4" />
                        <h2 className="text-4xl font-bold text-red-400 font-title">Hành Trình Kết Thúc</h2>
                        <button onClick={onBack} className="mt-8 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg">Về Menu Chính</button>
                    </div>
                </div>
            )}
            <div className="flex-shrink-0 p-2 sm:p-4 bg-black/40 backdrop-blur-sm border-b border-gray-700/50">
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
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-gray-800/60 rounded-full text-gray-300 hover:bg-gray-700/60" title="Bảng điều khiển">
                           {isSidebarOpen ? <FaTimes /> : <FaBars />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-grow flex min-h-0">
                {/* Main content panel */}
                <div className={`transition-all duration-500 ${isSidebarOpen ? 'w-full md:w-2/3 lg:w-3/4' : 'w-full'}`}>
                    <div className="h-full flex flex-col bg-stone-900/50">
                        <StoryLog story={storyLog} inventoryItems={playerCharacter.inventory.items} techniques={playerCharacter.techniques} />
                        {currentEvent ? (
                            <EventPanel event={currentEvent} onChoice={handleEventChoice} playerAttributes={playerCharacter.attributes.flatMap(g => g.attributes)} />
                        ) : activeStory ? (
                            <CustomStoryPlayer gameState={gameState} setGameState={setGameState} />
                        ) : (
                            <PlayerInput onAction={handlePlayerAction} disabled={isAILoading || isGameOver} />
                        )}
                    </div>
                </div>
                {/* Sidebar */}
                <div className={`fixed top-0 right-0 h-full bg-stone-900/80 backdrop-blur-md border-l border-gray-700/50 shadow-2xl transition-transform duration-500 z-30 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} w-full md:w-1/3 lg:w-1/4`}>
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
                        realmSystem={realmSystem}
                        showNotification={showNotification}
                        activeMods={activeMods}
                    />
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

export default GamePlayScreen;
