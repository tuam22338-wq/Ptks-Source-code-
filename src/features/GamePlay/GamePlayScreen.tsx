import React, { useState, useMemo, memo, useCallback, useRef, useEffect } from 'react';
import type { GameState, StoryEntry, NPC, CultivationTechnique, SkillTreeNode, InnerDemonTrial, RealmConfig, ActiveStoryState, StoryNode, StoryChoice, ActiveEffect } from '../../types';
import StoryLog from './components/StoryLog';
import ActionBar from './components/ActionBar';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar/Sidebar';
import LoadingScreen from '../../components/LoadingScreen';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotificationArea from '../../components/NotificationArea';
import EventPanel from './EventPanel';
import CombatScreen from './components/CombatScreen';
import CultivationPathModal from './components/CultivationPathModal';
import ShopModal from './components/ShopModal';
import InnerDemonTrialModal from './components/InnerDemonTrialModal';
import { generateStoryContinuationStream, summarizeStory, generateInnerDemonTrial, generateWeeklyRumor, generateRandomTechnique, parseNarrativeForGameData } from '../../services/geminiService';
import { REALM_SYSTEM, CULTIVATION_PATHS } from '../../constants';
import InventoryModal from './components/InventoryModal';
import { useAppContext } from '../../contexts/AppContext';
import { GameUIProvider, useGameUIContext } from '../../contexts/GameUIContext';
import { advanceGameTime } from '../../utils/timeManager';
import { simulateWorldTurn, simulateFactionTurn } from '../../services/worldSimulator';
import * as questManager from '../../utils/questManager';
import { FaDiceD20 } from 'react-icons/fa';

interface CustomStoryPlayerProps {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
}

const CustomStoryPlayer: React.FC<CustomStoryPlayerProps> = ({ gameState, setGameState }) => {
    const { activeStory, activeMods, playerCharacter } = gameState;
    const [animationState, setAnimationState] = useState<'idle' | 'rolling' | 'result'>('idle');
    const [rollResult, setRollResult] = useState<{ roll: number; modifier: number; total: number; dc: number; success: boolean } | null>(null);

    const { storySystem, currentNode } = useMemo(() => {
        if (!activeStory) return { storySystem: null, currentNode: null };

        for (const mod of activeMods) {
            const system = mod.content.storySystems?.find(s => s.name === activeStory.systemId);
            if (system) {
                const node = system.nodes[activeStory.currentNodeId];
                if (node) {
                    return { storySystem: system, currentNode: { ...node, id: activeStory.currentNodeId } };
                }
            }
        }
        return { storySystem: null, currentNode: null };
    }, [activeStory, activeMods]);

    if (!activeStory || !storySystem || !currentNode) {
        if (activeStory) {
            setGameState(gs => gs ? { ...gs, activeStory: null } : null);
        }
        return <div className="flex-shrink-0 p-4 bg-black/40 text-red-400 text-center">Lỗi: Không tìm thấy dữ liệu cốt truyện.</div>;
    }
    
    const applyOutcomes = (outcomes: any[]) => {
        if (!outcomes || outcomes.length === 0) return;

        outcomes.forEach(outcome => {
             if (outcome.type === 'CHANGE_STAT') {
                 setGameState(gs => {
                    if (!gs) return null;
                    const { playerCharacter } = gs;
                    const newAttributes = playerCharacter.attributes.map(group => ({
                        ...group,
                        attributes: group.attributes.map(attr => {
                            if (attr.name === outcome.details.attribute && typeof attr.value === 'number') {
                                return { ...attr, value: attr.value + outcome.details.change };
                            }
                            return attr;
                        })
                    }));
                    return { ...gs, playerCharacter: { ...playerCharacter, attributes: newAttributes } };
                });
             }
        });
    };

    const handleChoice = (choice: StoryChoice) => {
        applyOutcomes(choice.outcomes || []);
        setGameState(gs => gs ? { ...gs, activeStory: { ...activeStory, currentNodeId: choice.nextNodeId } } : null);
    };

    const handleContinue = (nextNodeId: string) => {
        setGameState(gs => gs ? { ...gs, activeStory: { ...activeStory, currentNodeId: nextNodeId } } : null);
    };

    const handleFinish = () => {
        setGameState(gs => gs ? { ...gs, activeStory: null } : null);
    };
    
    const handleCheck = () => {
        if (!currentNode.check) return;
        
        setAnimationState('rolling');
        
        const attribute = playerCharacter.attributes
            .flatMap(g => g.attributes)
            .find(a => a.name === currentNode.check!.attribute);
        const attributeValue = (attribute?.value as number) || 10;
        const modifier = Math.floor((attributeValue - 10) / 2);
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + modifier;
        const dc = currentNode.check.difficulty;
        const success = total >= dc;

        setTimeout(() => {
            setRollResult({ roll, modifier, total, dc, success });
            setAnimationState('result');
            const nextNodeId = success ? currentNode.successNodeId : currentNode.failureNodeId;
            setTimeout(() => {
                setAnimationState('idle');
                if (nextNodeId) handleContinue(nextNodeId);
                else handleFinish();
            }, 2500);
        }, 1500);
    };
    
    const renderContent = () => {
        if (animationState !== 'idle' && rollResult) {
             return (
                <div className="text-center animate-fade-in">
                    <p className={`text-4xl font-bold font-title ${rollResult.success ? 'text-green-400' : 'text-red-400'}`}>
                        {rollResult.success ? 'THÀNH CÔNG' : 'THẤT BẠI'}
                    </p>
                    <p className="text-lg text-gray-300">
                        {rollResult.total}
                        <span className="text-sm text-gray-400"> ({rollResult.roll}{rollResult.modifier >= 0 ? `+${rollResult.modifier}`: rollResult.modifier}) vs DC {rollResult.dc}</span>
                    </p>
                </div>
            );
        }
        
        if (animationState === 'rolling') {
             return (
                <div className="flex flex-col items-center animate-fade-in">
                    <FaDiceD20 className="text-6xl text-amber-300 animate-roll" />
                    <p className="mt-4 text-amber-200">Đang kiểm tra {currentNode.check?.attribute}...</p>
                </div>
            );
        }

        return (
             <div className="bg-black/20 border-2 border-amber-500/50 p-4 rounded-lg shadow-lg w-full max-w-3xl mx-auto">
                <p className="text-amber-200 text-lg italic mb-4 text-center">{currentNode.content}</p>
                <div className="space-y-2">
                   {currentNode.type === 'choice' && currentNode.choices?.map((choice, index) => (
                       <button
                           key={index}
                           onClick={() => handleChoice(choice)}
                           className="w-full text-left p-3 bg-gray-800/60 hover:bg-gray-700/50 border border-gray-700 rounded-md transition-colors"
                       >
                           <p className="font-semibold text-gray-200">{choice.text}</p>
                       </button>
                   ))}
                   {currentNode.type === 'narrative' && currentNode.nextNodeId && (
                        <button onClick={() => handleContinue(currentNode.nextNodeId!)} className="w-full p-3 bg-gray-800/60 hover:bg-gray-700/50 border border-gray-700 rounded-md transition-colors font-semibold text-gray-200">
                            Tiếp tục...
                        </button>
                   )}
                   {currentNode.type === 'check' && (
                        <button onClick={handleCheck} className="w-full p-3 bg-gray-800/60 hover:bg-gray-700/50 border border-gray-700 rounded-md transition-colors font-semibold text-gray-200">
                            Thử thách
                        </button>
                   )}
                   {currentNode.type === 'end' && (
                       <button onClick={handleFinish} className="w-full p-3 bg-gray-800/60 hover:bg-gray-700/50 border border-gray-700 rounded-md transition-colors font-semibold text-gray-200">
                           Kết thúc
                       </button>
                   )}
                </div>
            </div>
        )
    }

    return (
        <div className="flex-shrink-0 p-4 bg-black/40 backdrop-blur-sm border-t border-gray-700/50 flex flex-col items-center justify-center min-h-[150px]">
            {renderContent()}
        </div>
    );
};

const GamePlayScreenContent: React.FC = memo(() => {
    const { gameState, setGameState, handleSaveGame, quitGame, settings, speak, cancelSpeech } = useAppContext();
    const { 
        isSidebarOpen, toggleSidebar, notifications, dismissNotification, availablePaths,
        openCultivationPathModal, closeCultivationPathModal, showNotification,
        activeShopId, openShopModal, closeShopModal, isInventoryOpen, openInventoryModal, closeInventoryModal,
        activeEvent, setActiveEvent,
        activeInnerDemonTrial, openInnerDemonTrial, closeInnerDemonTrial
    } = useGameUIContext();

    const [isAiResponding, setIsAiResponding] = useState(false);
    const [activeActionTab, setActiveActionTab] = useState<'say' | 'act'>('act');
    
    const abortControllerRef = useRef<AbortController | null>(null);
    const prevIsAiResponding = useRef(isAiResponding);

    useEffect(() => {
        prevIsAiResponding.current = isAiResponding;
    }, [isAiResponding]);

    useEffect(() => {
        if (prevIsAiResponding.current && !isAiResponding && settings.enableTTS && gameState) {
            const lastEntry = gameState.storyLog[gameState.storyLog.length - 1];
            if (lastEntry && ['narrative', 'dialogue', 'action-result', 'system-notification', 'combat'].includes(lastEntry.type)) {
                const cleanText = lastEntry.content.replace(/\[.*?\]/g, ''); 
                speak(cleanText);
            }
        }
    }, [isAiResponding, settings.enableTTS, gameState, speak]);

    const saveGame = useCallback(async () => {
        if (!gameState) return;
        try {
            await handleSaveGame(gameState);
            showNotification('Đã lưu game thành công!');
        } catch (error) {
            console.error("Failed to save game", error);
            showNotification('Lỗi: Không thể lưu game.');
        }
    }, [gameState, handleSaveGame, showNotification]);

    const addStoryEntry = useCallback((newEntryData: Omit<StoryEntry, 'id'>) => {
        setGameState(prev => {
            if (!prev) return null;
            const newId = (prev.storyLog[prev.storyLog.length - 1]?.id || 0) + 1;
            const newEntry = { ...newEntryData, id: newId };
            return { ...prev, storyLog: [...prev.storyLog, newEntry] };
        });
    }, [setGameState]);
    
    const handleActionSubmit = useCallback(async (text: string, type: 'say' | 'act' = 'act', apCost: number = 1) => {
        if (isAiResponding || !gameState) return;
        
        cancelSpeech();
    
        if (text.trim().toLowerCase() === 'mở túi đồ') {
            openInventoryModal();
            return;
        }

        if (type === 'act' && text.toLowerCase().includes('tham ngộ đại đạo')) {
            setIsAiResponding(true);
            addStoryEntry({ type: 'player-action', content: 'Ta quyết định tĩnh tâm, thử tham ngộ đại đạo trong trời đất...' });
            
            (async () => {
                try {
                    const technique = await generateRandomTechnique(gameState);
                    setGameState(prev => {
                        if (!prev) return null;
                        const pc = { ...prev.playerCharacter };
                        pc.auxiliaryTechniques = [...pc.auxiliaryTechniques, technique];
                        return { ...prev, playerCharacter: pc };
                    });
                    const narrative = `Giữa lúc tĩnh tọa, trong đầu ngươi bỗng lóe lên một tia sáng. Một bộ công pháp huyền ảo mang tên [${technique.name}] tựa như được khắc sâu vào trong ký ức của ngươi!`;
                    addStoryEntry({ type: 'narrative', content: narrative });
                    showNotification(`Lĩnh ngộ được công pháp mới: ${technique.name}!`);
                } catch (error) {
                    console.error("Failed to generate technique:", error);
                    addStoryEntry({ type: 'system', content: `Linh khí hỗn loạn, tham ngộ thất bại.` });
                    showNotification('Tham ngộ thất bại!');
                } finally {
                    setIsAiResponding(false);
                }
            })();
            return;
        }

        const cultivationKeywords = ['tu luyện', 'tĩnh tọa', 'hấp thụ linh khí', 'đả tọa'];
        if (type === 'act' && cultivationKeywords.some(kw => text.toLowerCase().includes(kw))) {
            const hasCultivationTechnique = 
                !!gameState.playerCharacter.mainCultivationTechnique || 
                gameState.playerCharacter.auxiliaryTechniques.some(t => t.type === 'Tâm Pháp');

            if (!hasCultivationTechnique) {
                addStoryEntry({ type: 'system', content: 'Bạn chưa học được bất kỳ công pháp nào, không thể tu luyện. Có lẽ nên tìm một tông môn để gia nhập, hoặc tìm kiếm kỳ duyên khác.' });
                return;
            }

            const currentLocation = gameState.discoveredLocations.find(l => l.id === gameState.playerCharacter.currentLocationId);
            const qiGain = Math.floor(10 * (currentLocation?.qiConcentration || 10) / 10 * (1 + Math.random() * 0.2));
            
            setGameState(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    playerCharacter: {
                        ...prev.playerCharacter,
                        cultivation: {
                            ...prev.playerCharacter.cultivation,
                            spiritualQi: prev.playerCharacter.cultivation.spiritualQi + qiGain,
                        }
                    }
                }
            });
            text = `Ta ngồi xuống tu luyện, hấp thụ được ${qiGain} điểm linh khí.`;
        }
    
        setIsAiResponding(true);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
    
        addStoryEntry({ type: type === 'say' ? 'player-dialogue' : 'player-action', content: text });
    
        let tempState = gameState;
        
        const { newState: stateAfterTime, newDay } = advanceGameTime(tempState, apCost);
        
        // Process Damage Over Time effects from vitals
        let stateAfterDOT = { ...stateAfterTime };
        const dotEffects = stateAfterDOT.playerCharacter.activeEffects.filter(e => e.dot);
        if (dotEffects.length > 0) {
            let pc = { ...stateAfterDOT.playerCharacter };
            let totalDamage = 0;
            dotEffects.forEach(effect => {
                if (effect.dot?.type === 'Sinh Mệnh') {
                    totalDamage += effect.dot.damage;
                }
            });

            if (totalDamage > 0) {
                const attributesCopy = pc.attributes.map(g => ({ ...g, attributes: g.attributes.map(a => ({...a})) }));
                const sinhMenhAttr = attributesCopy.flatMap(g => g.attributes).find(a => a.name === 'Sinh Mệnh');
                if (sinhMenhAttr && typeof sinhMenhAttr.value === 'number') {
                    sinhMenhAttr.value = Math.max(0, sinhMenhAttr.value - totalDamage);
                    pc = { ...pc, attributes: attributesCopy };
                    addStoryEntry({ type: 'system-notification', content: `[${dotEffects.map(e=>e.name).join(', ')}]: Bạn mất ${totalDamage} Sinh Mệnh.` });
                }
            }
            stateAfterDOT = { ...stateAfterDOT, playerCharacter: pc };
        }
        tempState = stateAfterDOT;


        if (newDay) {
            addStoryEntry({ type: 'system', content: `Một ngày mới đã bắt đầu: ${tempState.gameDate.season}, ngày ${tempState.gameDate.day}` });
            
            // Faction simulation (once a week)
            if (tempState.gameDate.day % 7 === 1) {
                const { newEvent, narrative } = await simulateFactionTurn(tempState);
                if (newEvent && narrative) {
                    addStoryEntry({ type: 'system-notification', content: narrative });
                    tempState = {
                        ...tempState,
                        worldState: {
                            ...tempState.worldState,
                            dynamicEvents: [...(tempState.worldState.dynamicEvents || []), newEvent]
                        }
                    };
                }
            }
            
            const { newState: stateAfterSim, rumors } = await simulateWorldTurn(tempState);
            tempState = stateAfterSim;
            if (rumors.length > 0) {
                const rumorText = rumors.map(r => `Có tin đồn rằng: ${r.text}`).join('\n');
                addStoryEntry({ type: 'narrative', content: rumorText });
            }

            if (tempState.gameDate.day % 7 === 1) {
                try {
                    const weeklyNews = await generateWeeklyRumor(tempState);
                    addStoryEntry({ type: 'system', content: `[Thiên Hạ Sự] ${weeklyNews}` });
                } catch (e) {
                    console.error("Failed to generate weekly rumor:", e);
                }
            }
        }

        // Process quests
        const { newState: stateAfterQuests, notifications: questNotifications } = await questManager.processQuestUpdates(tempState, newDay);
        tempState = stateAfterQuests;
        questNotifications.forEach(showNotification);
        setGameState(tempState);
    
        addStoryEntry({ type: 'narrative', content: '...' });
    
        try {
            const stream = generateStoryContinuationStream(tempState, text, type);
            let fullResponse = '';
            for await (const chunk of stream) {
                if (abortControllerRef.current.signal.aborted) {
                  console.log("Stream aborted by user.");
                  break;
                }
                fullResponse += chunk;
                setGameState(prev => {
                    if (!prev) return null;
                    const newLog = [...prev.storyLog];
                    const lastEntry = newLog[newLog.length - 1];
                    if (lastEntry && lastEntry.type === 'narrative') {
                        lastEntry.content = fullResponse;
                    }
                    return { ...prev, storyLog: newLog };
                });
            }

            if (fullResponse && !abortControllerRef.current.signal.aborted) {
                (async () => {
                    let stateForParsing: GameState | null = null;
                    setGameState(gs => {
                        stateForParsing = gs;
                        return gs;
                    });
                    await new Promise(resolve => setTimeout(resolve, 0));

                    if (stateForParsing) {
                        try {
                            const { newItems, newTechniques, newNpcEncounterIds, statChanges, newEffects } = await parseNarrativeForGameData(fullResponse, stateForParsing);

                            if (newItems.length > 0 || newTechniques.length > 0 || newNpcEncounterIds.length > 0 || (statChanges && statChanges.length > 0) || (newEffects && newEffects.length > 0)) {
                                setGameState(prevState => {
                                    if (!prevState) return null;
                                    let pc = { ...prevState.playerCharacter };
                                    
                                    const updatedItems = [...pc.inventory.items];
                                    newItems.forEach(newItem => {
                                        const existing = updatedItems.find(i => i.name === newItem.name);
                                        if (existing) {
                                            existing.quantity += newItem.quantity;
                                        } else {
                                            updatedItems.push(newItem);
                                        }
                                        showNotification(`Nhận được: ${newItem.name} x${newItem.quantity}`);
                                    });
                                    pc.inventory = { ...pc.inventory, items: updatedItems };

                                    let updatedTechniques = [...pc.auxiliaryTechniques];
                                    let effectsFromTechniques: ActiveEffect[] = [];
                                    newTechniques.forEach(tech => {
                                        if (!updatedTechniques.some(t => t.name === tech.name)) {
                                            updatedTechniques.push(tech);
                                            showNotification(`Lĩnh ngộ: ${tech.name}`);
                                            if (tech.bonuses && tech.bonuses.length > 0) {
                                                effectsFromTechniques.push({
                                                    id: `tech-passive-${tech.id}`,
                                                    name: `${tech.name} (Bị Động)`,
                                                    source: `technique:${tech.id}`,
                                                    description: `Hiệu quả bị động từ công pháp ${tech.name}.`,
                                                    bonuses: tech.bonuses,
                                                    duration: -1,
                                                    isBuff: true,
                                                });
                                            }
                                        }
                                    });
                                    pc.auxiliaryTechniques = updatedTechniques;

                                    const updatedEncounters = [...new Set([...prevState.encounteredNpcIds, ...newNpcEncounterIds])];
                                    
                                    if (statChanges && statChanges.length > 0) {
                                        const newAttributes = pc.attributes.map(group => ({
                                            ...group,
                                            attributes: group.attributes.map(attr => {
                                                const changeInfo = statChanges.find(sc => sc.attribute === attr.name);
                                                if (changeInfo && typeof attr.value === 'number') {
                                                    let newValue = attr.value + changeInfo.change;
                                                    if (attr.maxValue) {
                                                        newValue = Math.max(0, Math.min(newValue, attr.maxValue));
                                                    } else {
                                                        newValue = Math.max(0, newValue);
                                                    }
                                                    showNotification(`${attr.name}: ${changeInfo.change > 0 ? '+' : ''}${changeInfo.change}`);
                                                    return { ...attr, value: newValue };
                                                }
                                                return attr;
                                            })
                                        }));
                                        pc.attributes = newAttributes;
                                    }
                                    
                                    const allNewEffects = [
                                        ...(newEffects || []).map(effect => ({ ...effect, id: `effect-${Date.now()}-${Math.random()}` })),
                                        ...effectsFromTechniques
                                    ];

                                    if (allNewEffects.length > 0) {
                                        pc.activeEffects = [...pc.activeEffects, ...allNewEffects];
                                        allNewEffects.forEach(eff => showNotification(`Bạn nhận được hiệu ứng: ${eff.name}`));
                                    }
                                    
                                    return { ...prevState, playerCharacter: pc, encounteredNpcIds: updatedEncounters };
                                });
                            }
                        } catch (parseError) {
                            console.error("Lỗi khi phân tích phản hồi của AI:", parseError);
                        }
                    }
                })();
            }
        } catch (error: any) {
            console.error("AI story generation failed:", error);
            const errorMessage = `[Hệ Thống] Lỗi kết nối với Thiên Đạo: ${error.message}`;
            setGameState(prev => {
                if (!prev) return null;
                const filteredLog = prev.storyLog.filter(entry => entry.content !== '...');
                return { ...prev, storyLog: [...filteredLog, { id: Date.now(), type: 'system', content: errorMessage }] };
            });
        } finally {
            setIsAiResponding(false);
            if (gameState.storyLog.length > 0 && gameState.storyLog.length % settings.autoSummaryFrequency === 0) {
                try {
                    const summary = await summarizeStory(gameState.storyLog);
                    setGameState(prev => prev ? { ...prev, storySummary: summary } : null);
                    console.log("Story summarized and saved to AI memory.");
                } catch (summaryError) {
                    console.error("Failed to summarize story:", summaryError);
                }
            }
        }
    }, [isAiResponding, addStoryEntry, gameState, setGameState, settings.autoSummaryFrequency, openInventoryModal, showNotification, cancelSpeech]);

    const handleContextualAction = useCallback((actionId: string, actionLabel: string) => {
        handleActionSubmit(`Thực hiện hành động đặc biệt: ${actionLabel}`, 'act');
    }, [handleActionSubmit]);

    const handleTravel = useCallback(async (destinationId: string) => {
        if (!gameState || isAiResponding) return;
        const destination = gameState.discoveredLocations.find(l => l.id === destinationId);
        if (!destination) return;
        
        if(isSidebarOpen) toggleSidebar();
    
        setGameState(prev => prev ? { ...prev, playerCharacter: { ...prev.playerCharacter, currentLocationId: destinationId } } : null);
        await handleActionSubmit(`Ta quyết định đi đến ${destination.name}.`, 'act', 1);
    
    }, [gameState, isAiResponding, isSidebarOpen, toggleSidebar, handleActionSubmit, setGameState]);

    const handleBreakthrough = useCallback(async () => {
         if (!gameState) return;
         const { realmSystem } = gameState;
         const { cultivation } = gameState.playerCharacter;
         const currentRealm = realmSystem.find(r => r.id === cultivation.currentRealmId);
         if (!currentRealm) return;

         const currentStageIndex = currentRealm.stages.findIndex(s => s.id === cultivation.currentStageId);
         const nextStage = currentRealm.stages[currentStageIndex + 1];
         
         const isRealmUpgrade = !nextStage;
         const nextRealm = isRealmUpgrade ? realmSystem[realmSystem.findIndex(r => r.id === currentRealm.id) + 1] : null;

         if (!nextStage && !nextRealm) {
             showNotification("Đã đạt cảnh giới cao nhất!");
             return;
         }

         setIsAiResponding(true);
         addStoryEntry({ type: 'system', content: `Bắt đầu đột phá...` });

         try {
            const targetRealmForTrial = nextRealm || currentRealm;
            const targetStageName = nextRealm ? nextRealm.stages[0].name : nextStage.name;
            const trial = await generateInnerDemonTrial(gameState, targetRealmForTrial, targetStageName);
            openInnerDemonTrial(trial);
         } catch(error) {
             console.error("Failed to generate inner demon trial:", error);
             showNotification("Đột phá thất bại! Thiên cơ hỗn loạn.");
         } finally {
            setIsAiResponding(false);
         }
    }, [gameState, addStoryEntry, showNotification, openInnerDemonTrial]);

    const handleInnerDemonChoice = useCallback((choice: { text: string; isCorrect: boolean; }) => {
        closeInnerDemonTrial();
        addStoryEntry({ type: 'player-dialogue', content: choice.text });

        if (choice.isCorrect) {
            showNotification("Đạo tâm kiên định, đột phá thành công!");
            setGameState(prev => {
                if (!prev) return null;
                const { playerCharacter, realmSystem } = prev;
                const { cultivation } = playerCharacter;
                const currentRealm = realmSystem.find(r => r.id === cultivation.currentRealmId)!;
                const currentStageIndex = currentRealm.stages.findIndex(s => s.id === cultivation.currentStageId);
                const nextStage = currentRealm.stages[currentStageIndex + 1];
                const nextRealm = !nextStage ? realmSystem[realmSystem.findIndex(r => r.id === currentRealm.id) + 1] : null;
                
                let newRealmId = cultivation.currentRealmId;
                let newStageId = cultivation.currentStageId;
                
                if (nextStage) newStageId = nextStage.id;
                else if (nextRealm) {
                    newRealmId = nextRealm.id;
                    newStageId = nextRealm.stages[0].id;
                }

                const newRealm = realmSystem.find(r => r.id === newRealmId)!;
                const newStage = newRealm.stages.find(s => s.id === newStageId)!;
                const qiBonus = Math.floor(newStage.qiRequired * 0.1);

                addStoryEntry({ type: 'system', content: `Vượt qua tâm ma, bạn đã đột phá thành công! Cảnh giới vững chắc, nhận được ${qiBonus} điểm linh khí.` });

                const pathsToShow = CULTIVATION_PATHS.filter(p => p.requiredRealmId === newRealmId);
                if (pathsToShow.length > 0) openCultivationPathModal(pathsToShow);
                
                return {
                    ...prev,
                    playerCharacter: {
                        ...playerCharacter,
                        cultivation: { ...cultivation, currentRealmId: newRealmId, currentStageId: newStageId, spiritualQi: qiBonus },
                        techniquePoints: playerCharacter.techniquePoints + 1,
                    }
                };
            });
        } else {
            showNotification("Đột phá thất bại, tâm ma quấy nhiễu!");
            addStoryEntry({ type: 'system', content: 'Bạn đã thất bại trong việc chống lại tâm ma. Tu vi bị tổn hại.' });
            // Optionally add a debuff effect here
        }

    }, [closeInnerDemonTrial, addStoryEntry, showNotification, setGameState, openCultivationPathModal]);

    const handleNpcDialogue = useCallback(async (npc: NPC) => {
        if (isAiResponding || !gameState) return;
        
        await handleActionSubmit(`Chủ động bắt chuyện với ${npc.identity.name}.`, 'act');

        setGameState((prevState) => {
            if (!prevState) return null;
            
            (async () => {
                const { newState, notifications } = await questManager.checkForNewSideQuest(prevState, npc);
                notifications.forEach(showNotification);
                setGameState(newState);
            })();

            return prevState;
        });
    }, [isAiResponding, gameState, handleActionSubmit, setGameState, showNotification]);
    
    const allPlayerTechniques = useMemo(() => {
        if (!gameState) return [];
        const activeSkills = Object.values(gameState.playerCharacter.mainCultivationTechnique?.skillTreeNodes || {})
            .filter((node: SkillTreeNode) => node.isUnlocked && node.type === 'active_skill' && node.activeSkill)
            .map((node: SkillTreeNode) => ({ ...node.activeSkill!, id: node.id, level: 1, maxLevel: 10 } as CultivationTechnique));
        return [...activeSkills, ...gameState.playerCharacter.auxiliaryTechniques];
    }, [gameState]);

    if (!gameState) return <LoadingScreen message="Đang khởi tạo thế giới..." />;

    const { playerCharacter, combatState, activeStory, discoveredLocations } = gameState;
    const currentLocation = useMemo(() => discoveredLocations.find(l => l.id === playerCharacter.currentLocationId)!, [discoveredLocations, playerCharacter.currentLocationId]);

    return (
        <div className="h-[calc(var(--vh,1vh)*100)] w-full flex flex-col">
            <NotificationArea notifications={notifications} onDismiss={dismissNotification} />
            <CultivationPathModal isOpen={availablePaths.length > 0} paths={availablePaths} onSelectPath={() => { closeCultivationPathModal(); }} />
            <ShopModal isOpen={!!activeShopId} shopId={activeShopId || ''} />
            <InventoryModal isOpen={isInventoryOpen} />
            <InnerDemonTrialModal isOpen={!!activeInnerDemonTrial} trial={activeInnerDemonTrial} onChoice={handleInnerDemonChoice} />
            
            <TopBar onBack={quitGame} onSave={saveGame} gameDate={gameState.gameDate} majorEvents={gameState.majorEvents} />
            
            <div className="gameplay-main-content">
                {isSidebarOpen && window.innerWidth < 1024 && <div className="gameplay-sidebar-backdrop bg-[var(--bg-color)]/60" onClick={toggleSidebar}></div>}

                <main className="gameplay-story-panel w-full flex flex-col bg-transparent min-h-0">
                    <StoryLog story={gameState.storyLog} inventoryItems={playerCharacter.inventory.items} techniques={allPlayerTechniques} onSpeak={speak} />
                    {isAiResponding && (
                        <div className="flex-shrink-0 p-2 flex items-center justify-center gap-2">
                           <LoadingSpinner size="sm" />
                           <p className="text-sm text-[var(--text-muted-color)] italic">Thiên Đạo đang suy diễn...</p>
                        </div>
                    )}
                    
                    <CombatScreen />
                    {activeEvent && <EventPanel event={activeEvent} onChoice={() => {}} playerAttributes={gameState.playerCharacter.attributes.flatMap(g => g.attributes)} />}
                    {activeStory && <CustomStoryPlayer gameState={gameState} setGameState={setGameState} />}

                    {!combatState && !activeEvent && !activeStory && (
                        <ActionBar 
                            onActionSubmit={handleActionSubmit} 
                            onContextualAction={handleContextualAction}
                            disabled={isAiResponding}
                            currentLocation={currentLocation}
                            activeTab={activeActionTab}
                            setActiveTab={setActiveActionTab}
                            gameState={gameState}
                        />
                    )}
                </main>

                <div className={`gameplay-sidebar-wrapper ${isSidebarOpen ? 'is-open' : ''}`}>
                    <div className="w-full h-full bg-[var(--bg-subtle)] backdrop-blur-md border-l border-[var(--border-subtle)]">
                        <Sidebar
                           gameState={gameState}
                           setGameState={setGameState}
                           onBreakthrough={handleBreakthrough}
                           onTravel={handleTravel}
                           onExplore={() => { /* TODO */ }}
                           onNpcDialogue={handleNpcDialogue}
                           showNotification={showNotification}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});

export const GamePlayScreen: React.FC = () => {
  return (
    <GameUIProvider>
      <GamePlayScreenContent />
    </GameUIProvider>
  );
};