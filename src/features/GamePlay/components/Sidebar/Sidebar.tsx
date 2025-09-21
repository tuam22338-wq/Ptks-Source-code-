import React, { useState, useMemo, useCallback } from 'react';
import type { PlayerCharacter, Location, NPC, Rumor, RealmConfig, FullMod, StoryEntry, GameState } from '../../../../types';
import CharacterPanel from './panels/CharacterPanel';
import GuidePanel from './panels/GuidePanel';
import WorldPanel from './panels/WorldPanel';
// FIX: Using named import for WikiPanel as it's re-exported as a named module.
import { WikiPanel } from './panels/WikiPanel';
import TechniquesPanel from './panels/TechniquesPanel';
import RealmPanel from './panels/RealmPanel';
import LorePanel from './panels/LorePanel';
import CustomContentPanel from './panels/CustomContentPanel';
import MapView from './panels/MapView';
import StoryGraphPanel from './panels/StoryGraphPanel';
import AiMemoryPanel from './panels/AiMemoryPanel';
import GenealogyPanel from './panels/GenealogyPanel';
import QuestPanel from './panels/QuestPanel';
import SystemPanel from './panels/SystemPanel';
import PlayerSectPanel from './panels/PlayerSectPanel';
import DeathPanel from './panels/DeathPanel';
import { FaUser, FaGlobe, FaBook, FaScroll, FaSun, FaGopuram, FaQuestionCircle, FaMapMarkedAlt, FaProjectDiagram, FaBrain, FaSitemap, FaUsers, FaMountain, FaFlask, FaTasks, FaDesktop } from 'react-icons/fa';
import { GiCastle } from 'react-icons/gi';
import { useAppContext } from '../../../../contexts/AppContext';
import { useGameUIContext } from '../../../../contexts/GameUIContext';
import { SHOPS, REALM_SYSTEM } from '../../../../constants';

interface SidebarProps {
    onBreakthrough: () => void;
    onTravel: (destinationId: string) => void;
    onExplore: () => void;
    onNpcDialogue: (npc: NPC) => void;
    showNotification: (message: string) => void;
}
type SidebarTab = 'guide' | 'character' | 'world' | 'techniques' | 'wiki' | 'realms' | 'lore' | 'map' | 'storyGraph' | 'aiMemory' | 'genealogy' | 'quests' | 'system' | 'playerSect' | string;

const ICON_MAP: { [key: string]: React.ElementType } = {
    FaUser, FaGlobe, FaBook, FaScroll, FaSun, FaGopuram
};

const Sidebar: React.FC<SidebarProps> = (props) => {
    const { onBreakthrough, onTravel, onExplore, onNpcDialogue, showNotification } = props;
    const { state, handleUpdatePlayerCharacter, dispatch } = useAppContext();
    const { gameState } = state;
    const [activeTab, setActiveTab] = useState<SidebarTab>('character');
    const { openShopModal } = useGameUIContext();
    
    if (!gameState) return null; // Should not happen if GamePlayScreen is rendered

    // FIX: Create a stable callback to update game state, handling both value and function updaters.
    const setGameStateCallback = useCallback((updater: (gs: GameState | null) => GameState | null) => {
        dispatch({
            type: 'UPDATE_GAME_STATE',
            payload: updater
        });
    }, [dispatch]);

    const { 
        playerCharacter, discoveredLocations, activeNpcs, worldState, storyLog,
        encounteredNpcIds, realmSystem: realmSystemFromState, activeMods,
        majorEvents, gameDate,
    } = gameState;

    const sinhMenhAttr = playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === 'Sinh Mệnh');
    const isPlayerDead = sinhMenhAttr ? (sinhMenhAttr.value as number) <= 0 : false;

    const currentLocation = useMemo(() => {
        if (!discoveredLocations || discoveredLocations.length === 0) return null;
        return discoveredLocations.find(l => l.id === playerCharacter.currentLocationId) || discoveredLocations[0];
    }, [discoveredLocations, playerCharacter.currentLocationId]);
    
    if (isPlayerDead) {
        return <DeathPanel />;
    }
    
    const realmSystem = realmSystemFromState || REALM_SYSTEM;
    const rumors = worldState.rumors;

    const npcsAtLocation = useMemo(() => 
        activeNpcs.filter(n => n.locationId === playerCharacter.currentLocationId), 
        [activeNpcs, playerCharacter.currentLocationId]
    );

    const neighbors = useMemo(() => {
        if (!currentLocation) return [];
        return discoveredLocations.filter(l => currentLocation.neighbors.includes(l.id));
    }, [discoveredLocations, currentLocation]);
    
    const handleNpcInteraction = useCallback((npc: NPC) => {
        if (npc.shopId && SHOPS.some(s => s.id === npc.shopId)) {
            openShopModal(npc.shopId);
        } else {
            onNpcDialogue(npc);
        }
    }, [openShopModal, onNpcDialogue]);

    const baseTabs: {id: SidebarTab, label: string, icon: React.ElementType, condition?: boolean}[] = [
        {id: 'character', label: 'Nhân Vật', icon: FaUser, condition: true },
        {id: 'system', label: 'Hệ Thống', icon: FaDesktop, condition: gameState.gameMode === 'transmigrator' },
        {id: 'quests', label: 'Nhiệm Vụ', icon: FaTasks, condition: true },
        {id: 'techniques', label: 'Công Pháp', icon: FaScroll, condition: true },
        {id: 'playerSect', label: 'Tông Môn', icon: GiCastle, condition: true },
        {id: 'genealogy', label: 'Thân Hữu', icon: FaSitemap, condition: true },
        {id: 'world', label: 'Thế Giới', icon: FaGlobe, condition: true },
        {id: 'map', label: 'Bản Đồ', icon: FaMapMarkedAlt, condition: true },
        {id: 'storyGraph', label: 'Tuyến Truyện', icon: FaProjectDiagram, condition: true },
        {id: 'aiMemory', label: 'AI Ký Ức', icon: FaBrain, condition: true },
        {id: 'wiki', label: 'Bách Khoa', icon: FaBook, condition: true },
        {id: 'realms', label: 'Cảnh Giới', icon: FaGopuram, condition: true },
        {id: 'lore', label: 'Thiên Mệnh', icon: FaSun, condition: true },
        {id: 'guide', label: 'Hướng Dẫn', icon: FaQuestionCircle, condition: true },
    ];

    const moddedTabs = useMemo(() => {
        if (!activeMods) return [];
        return activeMods.flatMap(mod => 
            mod.content.customPanels?.map((panel, index) => ({
                id: `modpanel-${mod.modInfo.id}-${index}`,
                label: panel.title,
                icon: ICON_MAP[panel.iconName] || FaQuestionCircle,
                panelConfig: { ...panel, id: `modpanel-${mod.modInfo.id}-${index}` },
                condition: true
            })) || []
        );
    }, [activeMods]);

    const allTabs = [...baseTabs, ...moddedTabs].filter(tab => tab.condition);
    const activeModPanelConfig = moddedTabs.find(tab => tab.id === activeTab)?.panelConfig;

    return (
        <div className="w-full h-full flex flex-col p-4">
            <div className="flex-shrink-0 mb-4">
                <div className="flex flex-wrap gap-1 p-1 bg-black/30 rounded-lg border border-gray-700/60">
                    {allTabs.map(tab => (
                         <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs font-bold rounded-md transition-colors min-w-[60px] ${
                                activeTab === tab.id 
                                ? 'bg-[color:var(--primary-accent-color)]/20 text-[color:var(--primary-accent-color)]' 
                                : 'text-[color:var(--text-muted-color)] hover:bg-black/20'
                            }`}
                            title={tab.label}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-grow overflow-y-auto pr-2">
                {activeTab === 'guide' && <GuidePanel />}
                {activeTab === 'character' && <CharacterPanel character={playerCharacter} onBreakthrough={onBreakthrough} realmSystem={realmSystem} />}
                {activeTab === 'system' && <SystemPanel gameState={gameState} setGameState={setGameStateCallback} showNotification={showNotification} />}
                {activeTab === 'quests' && <QuestPanel quests={playerCharacter.activeQuests} />}
                {activeTab === 'techniques' && <TechniquesPanel character={playerCharacter} setPlayerCharacter={handleUpdatePlayerCharacter} showNotification={showNotification} />}
                {activeTab === 'playerSect' && <PlayerSectPanel gameState={gameState} setGameState={setGameStateCallback} showNotification={showNotification} />}
                {activeTab === 'genealogy' && <GenealogyPanel playerCharacter={playerCharacter} allNpcs={activeNpcs} onNpcSelect={handleNpcInteraction} />}
                {activeTab === 'world' && currentLocation && <WorldPanel currentLocation={currentLocation} npcsAtLocation={npcsAtLocation} neighbors={neighbors} rumors={rumors} dynamicEvents={worldState.dynamicEvents} onTravel={onTravel} onExplore={onExplore} onNpcSelect={handleNpcInteraction} />}
                {activeTab === 'map' && <MapView discoveredLocations={discoveredLocations} playerCharacter={playerCharacter} onTravel={onTravel} allNpcs={activeNpcs} />}
                {activeTab === 'storyGraph' && <StoryGraphPanel storyLog={storyLog} />}
                {activeTab === 'aiMemory' && <AiMemoryPanel gameState={gameState} />}
                {activeTab === 'wiki' && <WikiPanel playerCharacter={playerCharacter} allNpcs={activeNpcs} encounteredNpcIds={encounteredNpcIds} discoveredLocations={discoveredLocations} />}
                {activeTab === 'realms' && <RealmPanel playerCharacter={playerCharacter} realmSystem={realmSystem} />}
                {activeTab === 'lore' && <LorePanel majorEvents={majorEvents} eraName={gameDate.era} />}
                {activeModPanelConfig && <CustomContentPanel panelConfig={activeModPanelConfig} activeMods={activeMods} />}
            </div>
        </div>
    );
};

export default Sidebar;
