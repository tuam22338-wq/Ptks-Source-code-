import React, { useState, useMemo, memo, useCallback, useRef } from 'react';
import type { GameState, StoryEntry, NPC, CultivationTechnique, SkillTreeNode, InnerDemonTrial } from '../../types';
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
import CustomStoryPlayer from './components/CustomStoryPlayer';
import ShopModal from './components/ShopModal';
import InnerDemonTrialModal from './components/InnerDemonTrialModal';
import { generateStoryContinuationStream, summarizeStory, generateInnerDemonTrial, generateWeeklyRumor, generateRandomTechnique } from '../../services/geminiService';
import { REALM_SYSTEM, CULTIVATION_PATHS } from '../../constants';
import InventoryModal from './components/InventoryModal';
import { useAppContext } from '../../contexts/AppContext';
import { GameUIProvider, useGameUIContext } from '../../contexts/GameUIContext';
import { advanceGameTime } from '../../utils/timeManager';
import { simulateWorldTurn, simulateFactionTurn } from '../../services/worldSimulator';
import * as questManager from '../../utils/questManager';

const GamePlayScreenContent: React.FC = memo(() => {
    const { gameState, setGameState, handleSaveGame, quitGame, settings } = useAppContext();
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
        tempState = stateAfterTime;

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
    }, [isAiResponding, addStoryEntry, gameState, setGameState, settings.autoSummaryFrequency, openInventoryModal, showNotification]);

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
            const targetRealmName = nextRealm ? nextRealm.name : currentRealm.name;
            const targetStageName = nextRealm ? nextRealm.stages[0].name : nextStage.name;
            const trial = await generateInnerDemonTrial(gameState, targetRealmName, targetStageName);
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
            addStoryEntry({ type: 'system', content: 'Vượt qua tâm ma, bạn đã đột phá thành công!' });
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

                const pathsToShow = CULTIVATION_PATHS.filter(p => p.requiredRealmId === newRealmId);
                if (pathsToShow.length > 0) openCultivationPathModal(pathsToShow);
                
                return {
                    ...prev,
                    playerCharacter: {
                        ...playerCharacter,
                        cultivation: { ...cultivation, currentRealmId: newRealmId, currentStageId: newStageId, spiritualQi: 0 },
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

    const { playerCharacter, discoveredLocations, activeNpcs, worldState, combatState, activeStory } = gameState;
    const currentLocation = useMemo(() => discoveredLocations.find(l => l.id === playerCharacter.currentLocationId)!, [discoveredLocations, playerCharacter.currentLocationId]);
    const npcsAtLocation = useMemo(() => activeNpcs.filter(n => n.locationId === playerCharacter.currentLocationId), [activeNpcs, playerCharacter.currentLocationId]);
    const neighbors = useMemo(() => discoveredLocations.filter(l => currentLocation.neighbors.includes(l.id)), [discoveredLocations, currentLocation]);

    return (
        <div className="h-[calc(var(--vh,1vh)*100)] w-full flex flex-col bg-black/30">
            <NotificationArea notifications={notifications} onDismiss={dismissNotification} />
            <CultivationPathModal isOpen={availablePaths.length > 0} paths={availablePaths} onSelectPath={() => { closeCultivationPathModal(); }} />
            <ShopModal isOpen={!!activeShopId} shopId={activeShopId || ''} />
            <InventoryModal isOpen={isInventoryOpen} />
            <InnerDemonTrialModal isOpen={!!activeInnerDemonTrial} trial={activeInnerDemonTrial} onChoice={handleInnerDemonChoice} />
            
            <TopBar onBack={quitGame} onSave={saveGame} gameDate={gameState.gameDate} majorEvents={gameState.majorEvents} />
            
            <div className="gameplay-main-content">
                {isSidebarOpen && window.innerWidth < 1024 && <div className="gameplay-sidebar-backdrop" onClick={toggleSidebar}></div>}

                <main className="gameplay-story-panel w-full flex flex-col bg-black/40 min-h-0">
                    <StoryLog story={gameState.storyLog} inventoryItems={playerCharacter.inventory.items} techniques={allPlayerTechniques} />
                    {isAiResponding && (
                        <div className="flex-shrink-0 p-2 flex items-center justify-center gap-2">
                           <LoadingSpinner size="sm" />
                           <p className="text-sm text-gray-400 italic">Thiên Đạo đang suy diễn...</p>
                        </div>
                    )}
                    
                    <CombatScreen />
                    {activeEvent && <EventPanel event={activeEvent} onChoice={() => {}} playerAttributes={playerCharacter.attributes.flatMap(g => g.attributes)} />}
                    {activeStory && <CustomStoryPlayer gameState={gameState} setGameState={setGameState} />}

                    {!combatState && !activeEvent && !activeStory && (
                        <ActionBar 
                            onActionSubmit={handleActionSubmit} 
                            disabled={isAiResponding}
                            currentLocation={currentLocation}
                            activeTab={activeActionTab}
                            setActiveTab={setActiveActionTab}
                            gameState={gameState}
                        />
                    )}
                </main>

                <div className={`gameplay-sidebar-wrapper ${isSidebarOpen ? 'is-open' : ''}`}>
                    <div className="w-full h-full bg-black/50 backdrop-blur-md border-l border-gray-700/60">
                        <Sidebar 
                           playerCharacter={playerCharacter}
                           setPlayerCharacter={(updater) => setGameState(gs => gs ? { ...gs, playerCharacter: updater(gs.playerCharacter) } : null)}
                           onBreakthrough={handleBreakthrough}
                           currentLocation={currentLocation}
                           npcsAtLocation={npcsAtLocation}
                           neighbors={neighbors}
                           rumors={worldState.rumors}
                           onTravel={handleTravel}
                           onExplore={() => { /* TODO */ }}
                           onNpcDialogue={handleNpcDialogue}
                           allNpcs={activeNpcs}
                           encounteredNpcIds={gameState.encounteredNpcIds}
                           discoveredLocations={discoveredLocations}
                           realmSystem={gameState.realmSystem || REALM_SYSTEM}
                           showNotification={showNotification}
                           activeMods={gameState.activeMods}
                           storyLog={gameState.storyLog}
                           gameState={gameState}
                           setGameState={setGameState}
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