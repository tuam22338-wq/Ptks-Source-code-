import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';
import type { StoryEntry, NPC, InnerDemonTrial, EventChoice } from '../../types';
import StoryLog from './components/StoryLog';
import ActionBar from './components/ActionBar';
import TopBar from './components/TopBar';
import LoadingScreen from '../../components/LoadingScreen';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotificationArea from '../../components/NotificationArea';
import EventPanel from './EventPanel';
import CombatScreen from './components/CombatScreen';
import ProgressionPathModal from './ProgressionPathModal';
import ShopModal from './components/ShopModal';
import InnerDemonTrialModal from './components/InnerDemonTrialModal';
import { PROGRESSION_PATHS } from '../../constants';
import { InventoryModal } from './components/InventoryModal';
import { useAppContext } from '../../contexts/AppContext';
import { useGameContext } from '../../contexts/GameContext'; 
import { GameUIProvider, useGameUIContext } from '../../contexts/GameUIContext';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import Sidebar from './components/Sidebar/Sidebar';

const GamePlayScreenContent: React.FC = memo(() => {
    const { state: appState, quitGame, speak } = useAppContext();
    const { gameState, isAiResponding, aiLoadingMessage, handlePlayerAction, handleUpdatePlayerCharacter, handleSaveGame } = useGameContext();
    const { settings } = appState;
    const { 
        notifications, dismissNotification, availablePaths, openCultivationPathModal, closeCultivationPathModal, 
        showNotification, activeShopId, isInventoryOpen, openInventoryModal, activeEvent, setActiveEvent,
        activeInnerDemonTrial, openInnerDemonTrial, closeInnerDemonTrial
    } = useGameUIContext();
    
    const [activeActionTab, setActiveActionTab] = useState<'act' | 'say' | 'ask'>('act');
    const [responseTimer, setResponseTimer] = useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const [currentPage, setCurrentPage] = useState(0);

    const storyPages = useMemo(() => {
        if (!gameState.storyLog) return [];
        const pages: StoryEntry[][] = [];
        let currentPage: StoryEntry[] = [];
        for (const entry of gameState.storyLog) {
            if (entry.type === 'player-action' || entry.type === 'player-dialogue') {
                if (currentPage.length > 0) pages.push(currentPage);
                currentPage = [entry];
            } else {
                if (currentPage.length === 0 && pages.length === 0) currentPage.push(entry);
                else currentPage.push(entry);
            }
        }
        if (currentPage.length > 0) pages.push(currentPage);
        return pages;
    }, [gameState.storyLog]);
    
    useEffect(() => {
        setCurrentPage(storyPages.length > 0 ? storyPages.length - 1 : 0);
    }, [storyPages.length]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isAiResponding) {
            setResponseTimer(0);
            interval = setInterval(() => setResponseTimer(t => t + 1), 1000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isAiResponding]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };
    
    const handleEventChoice = useCallback((choice: EventChoice) => {
        setActiveEvent(null);
        handlePlayerAction(choice.text, 'act', 0, showNotification);
    }, [setActiveEvent, handlePlayerAction, showNotification]);

    const handleInputSubmit = useCallback(async (text: string) => {
        if (text.trim().toLowerCase() === 'mở túi đồ') {
            openInventoryModal();
            return;
        }
        await handlePlayerAction(text, activeActionTab, 1, showNotification);
    }, [activeActionTab, handlePlayerAction, openInventoryModal, showNotification]);

    const handleContextualAction = useCallback((actionId: string, actionLabel: string) => {
        handlePlayerAction(actionLabel, 'act', 1, showNotification);
    }, [handlePlayerAction, showNotification]);

    const handleInnerDemonChoice = useCallback((choice: { text: string; isCorrect: boolean; }) => {
        closeInnerDemonTrial();
        if (choice.isCorrect) {
            showNotification("Đạo tâm kiên định, đột phá thành công!");
            handlePlayerAction("Ta đã chiến thắng tâm ma, chính thức đột phá!", 'act', 0, showNotification); 
            handleUpdatePlayerCharacter(pc => {
                const pathsToShow = PROGRESSION_PATHS.filter(p => p.requiredTierId === pc.progression.currentTierId);
                if (pathsToShow.length > 0) openCultivationPathModal(pathsToShow);
                return pc;
            });
        } else {
            showNotification("Đột phá thất bại, tâm ma quấy nhiễu!");
            handlePlayerAction("Ta không thể chống lại tâm ma, đột phá đã thất bại và ta bị thương nặng.", 'act', 0, showNotification);
        }
    }, [closeInnerDemonTrial, showNotification, handlePlayerAction, handleUpdatePlayerCharacter, openCultivationPathModal]);

    const { playerCharacter, combatState, activeStory, discoveredLocations, worldState } = gameState;
    const currentLocation = useMemo(() => {
        return discoveredLocations.find(l => l.id === playerCharacter.currentLocationId) || discoveredLocations[0];
    }, [discoveredLocations, playerCharacter.currentLocationId]);
    
    const isSpecialPanelActive = !!(combatState || activeEvent || activeStory);
    const isOnLastPage = currentPage === storyPages.length - 1;

    if (!currentLocation) {
        return <LoadingScreen message="Lỗi: Không tìm thấy vị trí hiện tại..." />;
    }

    return (
        <div className="flex-grow w-full flex flex-col">
            <NotificationArea notifications={notifications} onDismiss={dismissNotification} />
            <ProgressionPathModal isOpen={availablePaths.length > 0} paths={availablePaths} onSelectPath={() => { closeCultivationPathModal(); }} />
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} gameState={gameState} settings={settings} />
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
                currentLocationName={currentLocation?.name || 'Vô Định'}
             />
            
            <div className={`flex-grow w-full flex min-h-0 relative`}>
                <div className={`flex-grow w-full flex flex-col bg-transparent min-h-0 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'md:mr-96' : ''}`}>
                    <StoryLog 
                        pageEntries={storyPages[currentPage] || []} 
                        gameState={gameState}
                        onSpeak={speak} 
                    />
                    
                    <div className="flex-shrink-0 p-2 border-t border-[var(--shadow-light)] bg-[var(--bg-color)] flex items-center justify-between">
                        <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0 || isAiResponding} className="btn btn-neumorphic !p-3 disabled:opacity-50"><FaArrowLeft /></button>
                         {isAiResponding && isOnLastPage ? (
                            <div className="flex items-center justify-center gap-2">
                                <LoadingSpinner size="sm" message={aiLoadingMessage} />
                                <span className="font-mono text-[var(--primary-accent-color)]">{formatTime(responseTimer)}</span>
                            </div>
                        ) : (
                            <span className="text-sm font-semibold text-[var(--text-muted-color)]">Trang {currentPage + 1} / {storyPages.length}</span>
                        )}
                        <button onClick={() => setCurrentPage(p => Math.min(storyPages.length - 1, p + 1))} disabled={currentPage >= storyPages.length - 1 || isAiResponding} className="btn btn-neumorphic !p-3 disabled:opacity-50"><FaArrowRight /></button>
                    </div>

                    {(isSpecialPanelActive && isOnLastPage) ? (
                        <>
                            {combatState && <CombatScreen />}
                            {activeEvent && <EventPanel event={activeEvent} onChoice={handleEventChoice} playerAttributes={gameState.playerCharacter.attributes} />}
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
                            onToggleSidebar={() => setIsSidebarOpen(v => !v)}
                        />
                    )}
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