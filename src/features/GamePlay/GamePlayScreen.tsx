


import React, { useState, useMemo, useEffect, memo, useCallback, useRef } from 'react';
import type { GameState, GameSettings, StoryEntry, Location, NPC, GameEvent, CultivationPath, CultivationTechnique } from '../../types';
import StoryLog from './components/StoryLog';
import ActionBar from './components/ActionBar';
import TopBar from './TopBar';
import Sidebar from './components/Sidebar/Sidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import NotificationArea from '../../components/NotificationArea';
import EventPanel from './EventPanel';
import CombatScreen from './components/CombatScreen';
import CultivationPathModal from './components/CultivationPathModal';
import CustomStoryPlayer from './components/CustomStoryPlayer';
import DialoguePanel from './components/DialoguePanel';
import ShopModal from './components/ShopModal';
import { generateStoryContinuationStream, summarizeStory, generateBreakthroughNarrative } from '../../services/geminiService';
import { REALM_SYSTEM, CULTIVATION_PATHS } from '../../constants';
import InventoryModal from './components/InventoryModal';

interface GamePlayScreenProps {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    onSaveGame: (currentState: GameState, showNotification: (message: string) => void) => Promise<void>;
    onBack: () => void;
    settings: GameSettings;
}

export const GamePlayScreen: React.FC<GamePlayScreenProps> = memo(({ gameState, setGameState, onSaveGame, onBack, settings }) => {
    const [isAiResponding, setIsAiResponding] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
    const [activeActionTab, setActiveActionTab] = useState<'say' | 'act'>('act');
    const [notifications, setNotifications] = useState<{ id: number, message: string }[]>([]);
    const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
    const [availablePaths, setAvailablePaths] = useState<CultivationPath[]>([]);
    const [dialogueTarget, setDialogueTarget] = useState<NPC | null>(null);
    const [activeShopId, setActiveShopId] = useState<string | null>(null);
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    
    const storyContainerRef = useRef<HTMLDivElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const showNotification = useCallback((message: string) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    }, []);

    const addStoryEntry = useCallback((newEntryData: Omit<StoryEntry, 'id'>) => {
        setGameState(prev => {
            if (!prev) return null;
            const newId = (prev.storyLog[prev.storyLog.length - 1]?.id || 0) + 1;
            const newEntry = { ...newEntryData, id: newId };
            return { ...prev, storyLog: [...prev.storyLog, newEntry] };
        });
    }, [setGameState]);

    const handleActionSubmit = useCallback(async (text: string, type: 'say' | 'act') => {
        if (isAiResponding) return;

        // Intercept special commands before sending to AI
        if (text.trim().toLowerCase() === 'mở túi đồ') {
            setIsInventoryOpen(true);
            return;
        }

        setIsAiResponding(true);
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        const playerActionEntry: StoryEntry = {
            id: -1, // Temporary ID
            type: type === 'say' ? 'player-dialogue' : 'player-action',
            content: text,
        };
        addStoryEntry(playerActionEntry);
        
        // Add a placeholder for AI response
        const placeholderId = Date.now();
        addStoryEntry({ type: 'narrative', content: '...' });

        try {
            const stream = generateStoryContinuationStream(gameState, text, type);
            let fullResponse = '';
            for await (const chunk of stream) {
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
            addStoryEntry({ type: 'system', content: errorMessage });
             setGameState(prev => {
                if (!prev) return null;
                return { ...prev, storyLog: prev.storyLog.filter(entry => entry.content !== '...') };
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

    }, [isAiResponding, addStoryEntry, gameState, setGameState, settings.autoSummaryFrequency]);

    const handleTravel = useCallback(async (destinationId: string) => {
        const destination = gameState.discoveredLocations.find(l => l.id === destinationId);
        if (!destination || isAiResponding) return;
        
        setIsSidebarOpen(false);
        setIsAiResponding(true);

        const travelActionText = `Ta quyết định đi đến ${destination.name}.`;
        addStoryEntry({ type: 'player-action', content: travelActionText });

        const aiPrompt = `Hành trình đến ${destination.name}.`;
        addStoryEntry({ type: 'narrative', content: '...' });

        try {
            const stream = generateStoryContinuationStream(gameState, aiPrompt, 'act');
            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setGameState(prev => {
                    if (!prev) return null;
                    const newLog = [...prev.storyLog];
                    const lastEntry = newLog[newLog.length - 1];
                    if (lastEntry) lastEntry.content = fullResponse;
                    return { ...prev, storyLog: newLog };
                });
            }
            
            // After narration completes, update game state
            setGameState(prev => {
                if (!prev) return null;
                const newGameDate = { ...prev.gameDate };
                // Simple time advance for now
                newGameDate.day += 1; 

                return {
                    ...prev,
                    playerCharacter: {
                        ...prev.playerCharacter,
                        currentLocationId: destinationId
                    },
                    gameDate: newGameDate
                };
            });

        } catch (error: any) {
            console.error("AI travel narration failed:", error);
            addStoryEntry({ type: 'system', content: `[Lỗi] Hành trình đã bị gián đoạn: ${error.message}` });
        } finally {
            setIsAiResponding(false);
        }

    }, [isAiResponding, gameState, addStoryEntry, setGameState]);

    const handleBreakthrough = useCallback(async () => {
         const { playerCharacter, realmSystem } = gameState;
         const { cultivation } = playerCharacter;
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
         const targetRealmName = nextRealm ? nextRealm.name : currentRealm.name;
         const targetStageName = nextRealm ? nextRealm.stages[0].name : nextStage.name;
         addStoryEntry({ type: 'system', content: `Bắt đầu đột phá ${targetRealmName} - ${targetStageName}...` });
         await new Promise(r => setTimeout(r, 1000));

         const isSuccess = Math.random() > 0.1; // 90% success for now
         const narrative = await generateBreakthroughNarrative(gameState, nextRealm || currentRealm, nextRealm ? nextRealm.stages[0] : nextStage, isSuccess);
         addStoryEntry({ type: 'narrative', content: narrative });

         if (isSuccess) {
            setGameState(prev => {
                if (!prev) return null;
                const pc = { ...prev.playerCharacter };
                let newRealmId = cultivation.currentRealmId;
                let newStageId = cultivation.currentStageId;
                
                if (nextStage) {
                    newStageId = nextStage.id;
                } else if (nextRealm) {
                    newRealmId = nextRealm.id;
                    newStageId = nextRealm.stages[0].id;
                }

                const pathsToShow = CULTIVATION_PATHS.filter(p => p.requiredRealmId === newRealmId);
                if (pathsToShow.length > 0) {
                    setAvailablePaths(pathsToShow);
                }
                
                return {
                    ...prev,
                    playerCharacter: {
                        ...pc,
                        cultivation: {
                            ...pc.cultivation,
                            currentRealmId: newRealmId,
                            currentStageId: newStageId,
                            spiritualQi: 0,
                        },
                         techniquePoints: pc.techniquePoints + 1,
                    }
                };
            });
            showNotification("Đột phá thành công!");
         } else {
            showNotification("Đột phá thất bại!");
         }
         setIsAiResponding(false);

    }, [gameState, addStoryEntry, setGameState, showNotification]);
    
    const allPlayerTechniques = useMemo(() => {
        const activeSkills = Object.values(gameState.playerCharacter.mainCultivationTechnique?.skillTreeNodes || {})
            .filter(node => node.isUnlocked && node.type === 'active_skill' && node.activeSkill)
// FIX: Added missing level and maxLevel properties to conform to the CultivationTechnique type.
            .map(node => ({ ...node.activeSkill!, id: node.id, level: 1, maxLevel: 10 }));

        return [...activeSkills, ...gameState.playerCharacter.auxiliaryTechniques];
    }, [gameState.playerCharacter.mainCultivationTechnique, gameState.playerCharacter.auxiliaryTechniques]);


    const { playerCharacter, discoveredLocations, activeNpcs, worldState, combatState, activeStory } = gameState;
    const currentLocation = useMemo(() => discoveredLocations.find(l => l.id === playerCharacter.currentLocationId)!, [discoveredLocations, playerCharacter.currentLocationId]);
    const npcsAtLocation = useMemo(() => activeNpcs.filter(n => n.locationId === playerCharacter.currentLocationId), [activeNpcs, playerCharacter.currentLocationId]);
    const neighbors = useMemo(() => discoveredLocations.filter(l => currentLocation.neighbors.includes(l.id)), [discoveredLocations, currentLocation]);

    return (
        <div className="h-screen w-full flex flex-col bg-black/30">
            <NotificationArea notifications={notifications} onDismiss={(id) => setNotifications(p => p.filter(n => n.id !== id))} />
            <CultivationPathModal isOpen={availablePaths.length > 0} paths={availablePaths} onSelectPath={() => {}} />
            <ShopModal isOpen={!!activeShopId} shopId={activeShopId || ''} gameState={gameState} setGameState={setGameState} showNotification={showNotification} onClose={() => setActiveShopId(null)} />
            <InventoryModal isOpen={isInventoryOpen} gameState={gameState} setGameState={setGameState} showNotification={showNotification} onClose={() => setIsInventoryOpen(false)} />
            
            <TopBar onBack={onBack} onSave={() => onSaveGame(gameState, showNotification)} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} gameDate={gameState.gameDate} />
            
            <div className="gameplay-main-content">
                {isSidebarOpen && window.innerWidth < 1024 && <div className="gameplay-sidebar-backdrop" onClick={() => setIsSidebarOpen(false)}></div>}

                <main className="gameplay-story-panel w-full flex flex-col bg-black/40 min-h-0">
                    <StoryLog story={gameState.storyLog} inventoryItems={playerCharacter.inventory.items} techniques={allPlayerTechniques} />
                    {isAiResponding && (
                        <div className="flex-shrink-0 p-2 flex items-center justify-center gap-2">
                           <LoadingSpinner size="sm" />
                           <p className="text-sm text-gray-400 italic">Thiên Đạo đang suy diễn...</p>
                        </div>
                    )}
                    
                    {combatState && <CombatScreen gameState={gameState} setGameState={setGameState} showNotification={showNotification} addStoryEntry={addStoryEntry} allPlayerTechniques={allPlayerTechniques}/>}
                    {activeEvent && <EventPanel event={activeEvent} onChoice={() => {}} playerAttributes={playerCharacter.attributes.flatMap(g => g.attributes)} />}
                    {activeStory && <CustomStoryPlayer gameState={gameState} setGameState={setGameState} />}
                    {dialogueTarget && <DialoguePanel npc={dialogueTarget} onClose={() => setDialogueTarget(null)}/>}

                    {!combatState && !activeEvent && !activeStory && !dialogueTarget && (
                        <ActionBar 
                            onActionSubmit={handleActionSubmit} 
                            disabled={isAiResponding}
                            currentLocation={currentLocation}
                            activeTab={activeActionTab}
                            setActiveTab={setActiveActionTab}
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
                           onNpcSelect={(npc) => setDialogueTarget(npc)}
                           allNpcs={activeNpcs}
                           encounteredNpcIds={gameState.encounteredNpcIds}
                           discoveredLocations={discoveredLocations}
                           realmSystem={gameState.realmSystem || REALM_SYSTEM}
                           showNotification={showNotification}
                           activeMods={gameState.activeMods}
                           storyLog={gameState.storyLog}
                           gameState={gameState}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
});
