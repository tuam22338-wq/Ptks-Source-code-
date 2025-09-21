import React, { useState, useMemo, memo, useCallback, useRef, useEffect } from 'react';
import type { GameState, StoryEntry, NPC, CultivationTechnique, SkillTreeNode, InnerDemonTrial, RealmConfig, ActiveStoryState, StoryNode, StoryChoice, ActiveEffect, ActiveQuest, PlayerVitals, PlayerCharacter } from '../../types';
import StoryLog from './components/StoryLog';
import ActionBar from './components/ActionBar';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar/Sidebar';
import LoadingScreen from '../../components/LoadingScreen';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotificationArea from '../../components/NotificationArea';
import EventPanel from './components/EventPanel';
import CombatScreen from './components/CombatScreen';
import CultivationPathModal from './components/CultivationPathModal';
import ShopModal from './components/ShopModal';
import InnerDemonTrialModal from './components/InnerDemonTrialModal';
import { generateInnerDemonTrial } from '../../services/geminiService';
import { CULTIVATION_PATHS } from '../../constants';
import InventoryModal from './components/InventoryModal';
import { useAppContext } from '../../contexts/AppContext';
import { GameUIProvider, useGameUIContext } from '../../contexts/GameUIContext';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';

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
    const { state, handleSaveGame, quitGame, speak, cancelSpeech, handlePlayerAction, handleUpdatePlayerCharacter, dispatch } = useAppContext();
    const { gameState, settings } = state;
    const { 
        isSidebarOpen, toggleSidebar, notifications, dismissNotification, availablePaths,
        openCultivationPathModal, closeCultivationPathModal, showNotification,
        activeShopId, isInventoryOpen, openInventoryModal,
        activeEvent, setActiveEvent,
        activeInnerDemonTrial, openInnerDemonTrial, closeInnerDemonTrial
    } = useGameUIContext();
    
    const [activeActionTab, setActiveActionTab] = useState<'say' | 'act'>('act');
    const isAiResponding = state.isLoading && state.view === 'gamePlay';
    const [responseTimer, setResponseTimer] = useState(0);

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
    
    const handleActionSubmit = useCallback(async (text: string, type: 'say' | 'act' = 'act', apCost: number = 1) => {
        if (text.trim().toLowerCase() === 'mở túi đồ') {
            openInventoryModal();
            return;
        }
        await handlePlayerAction(text, type, apCost, showNotification);
    }, [handlePlayerAction, openInventoryModal, showNotification]);

    const handleContextualAction = useCallback((actionId: string, actionLabel: string) => {
        handleActionSubmit(`Thực hiện hành động đặc biệt: ${actionLabel}`, 'act');
    }, [handleActionSubmit]);

    const handleTravel = useCallback(async (destinationId: string) => {
        if (!gameState || isAiResponding) return;
        const destination = gameState.discoveredLocations.find(l => l.id === destinationId);
        if (!destination) return;
        if(isSidebarOpen) toggleSidebar();
        await handleActionSubmit(`Ta quyết định đi đến ${destination.name}.`, 'act', 1);
    }, [gameState, isAiResponding, isSidebarOpen, toggleSidebar, handleActionSubmit]);

    const handleBreakthrough = useCallback(async () => {
         if (!gameState) return;
         // ... breakthrough logic ...
         addStoryEntry({ type: 'system', content: `Bắt đầu đột phá...` });
         try {
            const trial = await generateInnerDemonTrial(gameState, {} as RealmConfig, ''); // Simplified
            openInnerDemonTrial(trial);
         } catch(error) {
             showNotification("Đột phá thất bại! Thiên cơ hỗn loạn.");
         }
    }, [gameState, addStoryEntry, showNotification, openInnerDemonTrial]);

    const handleInnerDemonChoice = useCallback((choice: { text: string; isCorrect: boolean; }) => {
        closeInnerDemonTrial();
        addStoryEntry({ type: 'player-dialogue', content: choice.text });
        if (choice.isCorrect) {
            showNotification("Đạo tâm kiên định, đột phá thành công!");
            handleUpdatePlayerCharacter(pc => {
                // ... logic to update player character on success
                const pathsToShow = CULTIVATION_PATHS.filter(p => p.requiredRealmId === pc.cultivation.currentRealmId);
                if (pathsToShow.length > 0) openCultivationPathModal(pathsToShow);
                return pc;
            });
        } else {
            showNotification("Đột phá thất bại, tâm ma quấy nhiễu!");
            addStoryEntry({ type: 'system', content: 'Bạn đã thất bại trong việc chống lại tâm ma.' });
        }
    }, [closeInnerDemonTrial, addStoryEntry, showNotification, handleUpdatePlayerCharacter, openCultivationPathModal]);

    const handleNpcDialogue = useCallback(async (npc: NPC) => {
        await handleActionSubmit(`Chủ động bắt chuyện với ${npc.identity.name}.`, 'act');
    }, [handleActionSubmit]);
    
    const allPlayerTechniques = useMemo(() => {
        if (!gameState) return [];
        const activeSkills = Object.values(gameState.playerCharacter.mainCultivationTechnique?.skillTreeNodes || {})
            .filter((node: SkillTreeNode) => node.isUnlocked && node.type === 'active_skill' && node.activeSkill)
            .map((node: SkillTreeNode) => ({ ...node.activeSkill!, id: node.id, level: 1, maxLevel: 10 } as CultivationTechnique));
        return [...activeSkills, ...gameState.playerCharacter.auxiliaryTechniques];
    }, [gameState]);

    if (!gameState) return <LoadingScreen message="Đang khởi tạo thế giới..." />;

    const { playerCharacter, combatState, activeStory, discoveredLocations } = gameState;
    const currentLocation = useMemo(() => {
        if (!discoveredLocations || discoveredLocations.length === 0) return null;
        return discoveredLocations.find(l => l.id === playerCharacter.currentLocationId) || discoveredLocations[0];
    }, [discoveredLocations, playerCharacter.currentLocationId]);
    
    const isSpecialPanelActive = !!(combatState || activeEvent || activeStory);
    const isOnLastPage = currentPage === storyPages.length - 1;

    if (!currentLocation) {
        return <LoadingScreen message="Lỗi: Không tìm thấy vị trí hiện tại..." />;
    }

    return (
        <div className="h-[calc(var(--vh,1vh)*100)] w-full flex flex-col">
            <NotificationArea notifications={notifications} onDismiss={dismissNotification} />
            <CultivationPathModal isOpen={availablePaths.length > 0} paths={availablePaths} onSelectPath={() => { closeCultivationPathModal(); }} />
            <ShopModal isOpen={!!activeShopId} shopId={activeShopId || ''} />
            <InventoryModal isOpen={isInventoryOpen} />
            <InnerDemonTrialModal isOpen={!!activeInnerDemonTrial} trial={activeInnerDemonTrial} onChoice={handleInnerDemonChoice} />
            
            <TopBar onBack={quitGame} onSave={handleSaveGame} gameDate={gameState.gameDate} majorEvents={gameState.majorEvents} />
            
            <div className="gameplay-main-content">
                {isSidebarOpen && window.innerWidth < 1024 && <div className="gameplay-sidebar-backdrop bg-[var(--bg-color)]/60" onClick={toggleSidebar}></div>}

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
                            <CombatScreen />
                            {activeEvent && <EventPanel event={activeEvent} onChoice={() => {}} playerAttributes={gameState.playerCharacter.attributes.flatMap(g => g.attributes)} />}
                            {activeStory && <CustomStoryPlayer gameState={gameState} onUpdateGameState={(updater) => dispatch({type: 'UPDATE_GAME_STATE', payload: updater})} />}
                        </>
                    ) : (
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
