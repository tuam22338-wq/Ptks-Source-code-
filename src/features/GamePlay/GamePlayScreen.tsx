import React, { useState, useMemo, memo, useCallback, useRef, useEffect } from 'react';
import type { GameState, StoryEntry, NPC, CultivationTechnique, InnerDemonTrial, RealmConfig, ActiveStoryState, StoryNode, StoryChoice, ActiveEffect, ActiveQuest, PlayerVitals, PlayerCharacter } from '../../types';
import StoryLog from './components/StoryLog';
import ActionBar from './components/ActionBar';
import TopBar from './components/TopBar';
import LoadingScreen from '../../components/LoadingScreen';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotificationArea from '../../components/NotificationArea';
import EventPanel from './components/EventPanel';
import CombatScreen from './components/CombatScreen';
import CultivationPathModal from './components/CultivationPathModal';
import ShopModal from './components/ShopModal';
import InnerDemonTrialModal from './components/InnerDemonTrialModal';
import { generateInnerDemonTrial, askAiAssistant } from '../../services/geminiService';
import { CULTIVATION_PATHS } from '../../constants';
import InventoryModal from './components/InventoryModal';
import { useAppContext } from '../../contexts/AppContext';
import { GameUIProvider, useGameUIContext } from '../../contexts/GameUIContext';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import SummaryPanel from './components/SummaryPanel';
import Sidebar from './components/Sidebar/Sidebar';
import InteractionOverlay from './components/InteractionOverlay';

interface CustomStoryPlayerProps {
    gameState: GameState;
    onUpdateGameState: (updater: (gs: GameState | null) => GameState | null) => void;
}

const CustomStoryPlayer: React.FC<CustomStoryPlayerProps> = ({ gameState, onUpdateGameState }) => {
    const { activeStory, activeMods, playerCharacter } = gameState;
    const [animationState, setAnimationState] = useState<'idle' | 'rolling' | 'result'>('idle');
    const [rollResult, setRollResult] = useState<{ roll: number; modifier: number; total: number; dc: number; success: boolean } | null>(null);

    const { storySystem, currentNode } = useMemo(() => {
        if (!activeStory) return { storySystem: null, currentNode: null };
        for (const mod of activeMods) {
            const system = mod.content.storySystems?.find(s => s.name === activeStory.systemId);
            if (system) {
                const node = system.nodes[activeStory.currentNodeId];
                if (node) return { storySystem: system, currentNode: { ...node, id: activeStory.currentNodeId } };
            }
        }
        return { storySystem: null, currentNode: null };
    }, [activeStory, activeMods]);

    if (!activeStory || !storySystem || !currentNode) {
        if (activeStory) {
            onUpdateGameState(gs => gs ? { ...gs, activeStory: null } : null);
        }
        return <div className="flex-shrink-0 p-4 bg-black/40 text-red-400 text-center">Lỗi: Không tìm thấy dữ liệu cốt truyện.</div>;
    }
    
    // Simplified outcome application logic for story player
    const applyOutcomes = (outcomes: any[]) => {
      // In a full implementation, this would dispatch actions or call handlers.
    };

    const handleChoice = (choice: StoryChoice) => {
        applyOutcomes(choice.outcomes || []);
        onUpdateGameState(gs => gs ? { ...gs, activeStory: { ...gs.activeStory!, currentNodeId: choice.nextNodeId } } : gs);
    };
    // Other handlers would similarly call onUpdateGameState
    
    // Render logic remains similar but doesn't call setGameState directly
    return <div className="flex-shrink-0 p-4 bg-black/40 backdrop-blur-sm border-t border-gray-700/50 flex flex-col items-center justify-center min-h-[150px]">...</div>;
};

const GamePlayScreenContent: React.FC = memo(() => {
    const { state, handleSaveGame, quitGame, speak, cancelSpeech, handlePlayerAction, handleUpdatePlayerCharacter, dispatch, handleDialogueChoice } = useAppContext();
    const { gameState, settings } = state;
    const { 
        notifications, dismissNotification, availablePaths,
        openCultivationPathModal, closeCultivationPathModal, showNotification,
        activeShopId, isInventoryOpen, openInventoryModal,
        activeEvent, setActiveEvent,
        activeInnerDemonTrial, openInnerDemonTrial, closeInnerDemonTrial
    } = useGameUIContext();
    
    const [activeActionTab, setActiveActionTab] = useState<'act' | 'say' | 'ask'>('act');
    const isAiResponding = state.isLoading && state.view === 'gamePlay';
    const [responseTimer, setResponseTimer] = useState(0);
    const [isSummaryPanelVisible, setIsSummaryPanelVisible] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);


    // --- PAGINATION LOGIC ---
    const [currentPage, setCurrentPage] = useState(0);

    const storyPages = useMemo(() => {
        if (!gameState?.storyLog) return [];
        const pages: StoryEntry[][] = [];
        let currentPage: StoryEntry[] = [];

        for (const entry of gameState.storyLog) {
            if (entry.type === 'player-action' || entry.type === 'player-dialogue') {
                if (currentPage.length > 0) {
                    pages.push(currentPage);
                }
                currentPage = [entry];
            } else {
                if (currentPage.length === 0 && pages.length === 0) {
                     // Handle initial narrative before any player action
                     currentPage.push(entry);
                } else {
                    currentPage.push(entry);
                }
            }
        }
        if (currentPage.length > 0) {
            pages.push(currentPage);
        }
        return pages;
    }, [gameState?.storyLog]);
    
    useEffect(() => {
        // Auto-navigate to the last page when new content is added
        setCurrentPage(storyPages.length > 0 ? storyPages.length - 1 : 0);
    }, [storyPages.length]);
    // --- END PAGINATION LOGIC ---


    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isAiResponding) {
            setResponseTimer(0);
            interval = setInterval(() => {
                setResponseTimer(t => t + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isAiResponding]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const addStoryEntry = useCallback((newEntryData: Omit<StoryEntry, 'id'>) => {
        dispatch({
            type: 'UPDATE_GAME_STATE',
            payload: (prev => {
                if (!prev) return null;
                const newId = (prev.storyLog[prev.storyLog.length - 1]?.id || 0) + 1;
                const newEntry = { ...newEntryData, id: newId };
                return { ...prev, storyLog: [...prev.storyLog, newEntry] };
            })
        });
    }, [dispatch]);
    
    const handleAskAssistant = useCallback(async (query: string) => {
        if (!gameState || isAiResponding) return;
        
        addStoryEntry({ type: 'player-dialogue', content: `[Hỏi Thiên Cơ]: ${query}` });
        dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Thiên Cơ đang tra cứu...' }});

        try {
            const answer = await askAiAssistant(query, gameState);
            addStoryEntry({ type: 'system-notification', content: `[Thiên Cơ]: ${answer}` });
        } catch (error: any) {
            addStoryEntry({ type: 'system', content: `[Lỗi Thiên Cơ]: ${error.message}` });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { isLoading: false }});
        }
    }, [gameState, isAiResponding, addStoryEntry, dispatch]);

    const handleInputSubmit = useCallback(async (text: string) => {
        if (text.trim().toLowerCase() === 'mở túi đồ') {
            openInventoryModal();
            return;
        }

        if (activeActionTab === 'ask') {
            await handleAskAssistant(text);
        } else {
            await handlePlayerAction(text, activeActionTab, 1, showNotification);
        }
    }, [activeActionTab, handleAskAssistant, handlePlayerAction, openInventoryModal, showNotification]);

    const handleContextualAction = useCallback((actionId: string, actionLabel: string) => {
        handlePlayerAction(actionLabel, 'act', 1, showNotification);
    }, [handlePlayerAction, showNotification]);

    const handleTravel = useCallback(async (destinationId: string) => {
        if (!gameState || isAiResponding) return;
        const destination = gameState.discoveredLocations.find(l => l.id === destinationId);
        if (!destination) return;
        await handlePlayerAction(`Ta quyết định đi đến ${destination.name}.`, 'act', 1, showNotification);
    }, [gameState, isAiResponding, handlePlayerAction, showNotification]);

    const handleBreakthrough = useCallback(async () => {
        if (!gameState) return;
        const { playerCharacter, realmSystem } = gameState;
        const { cultivation } = playerCharacter;

        const currentRealmData = realmSystem.find(r => r.id === cultivation.currentRealmId);
        if (!currentRealmData) {
            showNotification("Lỗi: Không tìm thấy dữ liệu cảnh giới hiện tại.");
            return;
        }

        const currentStageIndex = currentRealmData.stages.findIndex(s => s.id === cultivation.currentStageId);
        const isLastStage = currentStageIndex === currentRealmData.stages.length - 1;
        
        let targetRealm = currentRealmData;
        let targetStageName = "Unknown Stage";

        if (isLastStage) {
            const currentRealmIndex = realmSystem.findIndex(r => r.id === currentRealmData.id);
            const nextRealmData = realmSystem[currentRealmIndex + 1];
            if (nextRealmData) {
                targetRealm = nextRealmData;
                targetStageName = nextRealmData.stages[0]?.name || "Sơ Kỳ";
            } else {
                showNotification("Bạn đã đạt đến cảnh giới cao nhất!");
                return;
            }
        } else {
            const nextStageData = currentRealmData.stages[currentStageIndex + 1];
            if(nextStageData) {
                targetStageName = nextStageData.name;
            }
        }
        
        addStoryEntry({ type: 'system', content: `Bắt đầu đột phá...` });
        
        const isDefaultFrameworkWorld = state.activeWorldId === 'phong_than_dien_nghia' || state.activeWorldId === 'tay_du_ky';
        
        if (isDefaultFrameworkWorld && targetRealm.hasTribulation && isLastStage) {
            try {
                const trial = await generateInnerDemonTrial(gameState, targetRealm, targetStageName);
                openInnerDemonTrial(trial);
            } catch(error) {
                showNotification("Đột phá thất bại! Thiên cơ hỗn loạn.");
                addStoryEntry({ type: 'system', content: 'Thiên cơ hỗn loạn, không thể dẫn động tâm ma kiếp.' });
            }
        } else {
            // Handle normal breakthrough via AI narration
            handlePlayerAction("Ta bắt đầu vận công, nỗ lực đột phá cảnh giới tiếp theo.", 'act', 1, showNotification);
        }
    }, [gameState, state.activeWorldId, addStoryEntry, showNotification, openInnerDemonTrial, handlePlayerAction]);

    const handleInnerDemonChoice = useCallback((choice: { text: string; isCorrect: boolean; }) => {
        closeInnerDemonTrial();
        addStoryEntry({ type: 'player-dialogue', content: choice.text });
        if (choice.isCorrect) {
            showNotification("Đạo tâm kiên định, đột phá thành công!");
            // The actual state change will be handled by the narrative parser
            handlePlayerAction("Ta đã chiến thắng tâm ma, chính thức đột phá!", 'act', 0, showNotification); 
            handleUpdatePlayerCharacter(pc => {
                const pathsToShow = CULTIVATION_PATHS.filter(p => p.requiredRealmId === pc.cultivation.currentRealmId);
                if (pathsToShow.length > 0) openCultivationPathModal(pathsToShow);
                return pc;
            });
        } else {
            showNotification("Đột phá thất bại, tâm ma quấy nhiễu!");
            addStoryEntry({ type: 'system', content: 'Bạn đã thất bại trong việc chống lại tâm ma.' });
            handlePlayerAction("Ta không thể chống lại tâm ma, đột phá đã thất bại và ta bị thương nặng.", 'act', 0, showNotification);
        }
    }, [closeInnerDemonTrial, addStoryEntry, showNotification, handleUpdatePlayerCharacter, openCultivationPathModal, handlePlayerAction]);

    const handleNpcDialogue = useCallback(async (npc: NPC) => {
        await handlePlayerAction(`Chủ động bắt chuyện với ${npc.identity.name}.`, 'act', 1, showNotification);
    }, [handlePlayerAction, showNotification]);
    
    const allPlayerTechniques = useMemo(() => {
        if (!gameState) return [];
        return gameState.playerCharacter.techniques || [];
    }, [gameState]);

    if (!gameState) return <LoadingScreen message="Đang khởi tạo thế giới..." />;

    const { playerCharacter, combatState, activeStory, discoveredLocations, worldState, dialogueChoices } = gameState;
    const currentLocation = useMemo(() => {
        if (!discoveredLocations || discoveredLocations.length === 0) return null;
        return discoveredLocations.find(l => l.id === playerCharacter.currentLocationId) || discoveredLocations[0];
    }, [discoveredLocations, playerCharacter.currentLocationId]);
    
    const isSpecialPanelActive = !!(combatState || activeEvent || activeStory || dialogueChoices);
    const isOnLastPage = currentPage === storyPages.length - 1;

    if (!currentLocation) {
        return <LoadingScreen message="Lỗi: Không tìm thấy vị trí hiện tại..." />;
    }

    return (
        <div className="h-[calc(var(--vh,1vh)*100)] w-full flex flex-col">
            <NotificationArea notifications={notifications} onDismiss={dismissNotification} />
            <CultivationPathModal isOpen={availablePaths.length > 0} paths={availablePaths} onSelectPath={() => { closeCultivationPathModal(); }} />
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} gameState={gameState} />
            <ShopModal isOpen={!!activeShopId} shopId={activeShopId || ''} />
            <InventoryModal isOpen={isInventoryOpen} />
            <InnerDemonTrialModal isOpen={!!activeInnerDemonTrial} trial={activeInnerDemonTrial} onChoice={handleInnerDemonChoice} />
            
            <TopBar 
                onBack={quitGame} 
                onSave={handleSaveGame} 
                gameDate={gameState.gameDate} 
                majorEvents={gameState.majorEvents}
                dynamicEvents={worldState.dynamicEvents}
                foreshadowedEvents={worldState.foreshadowedEvents}
                isSummaryPanelVisible={isSummaryPanelVisible}
                isSidebarOpen={isSidebarOpen}
                onToggleSummaryPanel={() => setIsSummaryPanelVisible(v => !v)}
                onToggleSidebar={() => setIsSidebarOpen(v => !v)}
             />
            
            <div className={`gameplay-main-content relative ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                <main className="gameplay-story-panel w-full flex flex-col bg-transparent min-h-0 overflow-hidden">
                    <StoryLog 
                        pageEntries={storyPages[currentPage] || []} 
                        inventoryItems={playerCharacter.inventory.items} 
                        techniques={allPlayerTechniques} 
                        onSpeak={speak} 
                    />
                    
                    {/* Pagination Controls & Loading */}
                    <div className="flex-shrink-0 p-2 border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)] flex items-center justify-between">
                        <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0 || isAiResponding} className="p-2 disabled:opacity-50"><FaArrowLeft /></button>
                         {isAiResponding && isOnLastPage ? (
                            <div className="flex items-center justify-center gap-2">
                                <LoadingSpinner size="sm" message={state.loadingMessage} />
                                <span className="font-mono text-amber-300">{formatTime(responseTimer)}</span>
                            </div>
                        ) : (
                            <span className="text-sm font-semibold text-[var(--text-muted-color)]">Trang {currentPage + 1} / {storyPages.length}</span>
                        )}
                        <button onClick={() => setCurrentPage(p => Math.min(storyPages.length - 1, p + 1))} disabled={currentPage >= storyPages.length - 1 || isAiResponding} className="p-2 disabled:opacity-50"><FaArrowRight /></button>
                    </div>

                    {isSpecialPanelActive ? (
                        <>
                            {combatState && <CombatScreen />}
                            {activeEvent && <EventPanel event={activeEvent} onChoice={() => {}} playerAttributes={gameState.playerCharacter.attributes} />}
                            {activeStory && <CustomStoryPlayer gameState={gameState} onUpdateGameState={(updater) => dispatch({type: 'UPDATE_GAME_STATE', payload: updater})} />}
                            {dialogueChoices && (
                                <InteractionOverlay 
                                    choices={dialogueChoices}
                                    playerAttributes={playerCharacter.attributes}
                                    onChoiceSelect={handleDialogueChoice}
                                />
                            )}
                        </>
                    ) : (
                        <ActionBar 
                            onInputSubmit={handleInputSubmit} 
                            onContextualAction={handleContextualAction}
                            disabled={isAiResponding}
                            currentLocation={currentLocation}
                            activeTab={activeActionTab}
                            setActiveTab={setActiveActionTab}
                            gameState={gameState}
                        />
                    )}
                </main>

                {isSummaryPanelVisible && <SummaryPanel gameState={gameState} />}
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