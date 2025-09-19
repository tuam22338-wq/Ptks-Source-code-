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
import { FaUser, FaGlobe, FaBook, FaScroll, FaSun, FaGopuram, FaQuestionCircle, FaMapMarkedAlt, FaProjectDiagram, FaBrain, FaSitemap, FaUsers, FaMountain, FaFlask, FaTasks, FaDesktop } from 'react-icons/fa';
import { GiCastle } from 'react-icons/gi';
import { useGameUIContext } from '../../../../contexts/GameUIContext';
import { SHOPS, REALM_SYSTEM } from '../../../../constants';

interface SidebarProps {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
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
    const { gameState, setGameState, onBreakthrough, onTravel, onExplore, onNpcDialogue, showNotification } = props;
    const [activeTab, setActiveTab] = useState<SidebarTab>('character');
    const { openShopModal } = useGameUIContext();
    
    // Derive all necessary data from the single gameState prop to ensure synchronization
    const { 
        playerCharacter, 
        discoveredLocations, 
        activeNpcs, 
        worldState, 
        storyLog,
        encounteredNpcIds,
        realmSystem: realmSystemFromState,
        activeMods
    } = gameState;
    
    const allNpcs = activeNpcs;
    const realmSystem = realmSystemFromState || REALM_SYSTEM;
    const rumors = worldState.rumors;

    const currentLocation = useMemo(() => 
        discoveredLocations.find(l => l.id === playerCharacter.currentLocationId)!, 
        [discoveredLocations, playerCharacter.currentLocationId]
    );
    
    const npcsAtLocation = useMemo(() => 
        allNpcs.filter(n => n.locationId === playerCharacter.currentLocationId), 
        [allNpcs, playerCharacter.currentLocationId]
    );

    const neighbors = useMemo(() => 
        discoveredLocations.filter(l => currentLocation.neighbors.includes(l.id)), 
        [discoveredLocations, currentLocation]
    );

    const setPlayerCharacter = useCallback((updater: (pc: PlayerCharacter) => PlayerCharacter) => {
        setGameState(gs => gs ? { ...gs, playerCharacter: updater(gs.playerCharacter) } : null);
    }, [setGameState]);
    
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
                {activeTab === 'system' && <SystemPanel gameState={gameState} setGameState={setGameState} showNotification={showNotification} />}
                {activeTab === 'quests' && <QuestPanel quests={playerCharacter.activeQuests} />}
                {activeTab === 'techniques' && <TechniquesPanel character={playerCharacter} setPlayerCharacter={setPlayerCharacter} showNotification={showNotification} />}
                {activeTab === 'playerSect' && <PlayerSectPanel gameState={gameState} setGameState={setGameState} showNotification={showNotification} />}
                {activeTab === 'genealogy' && <GenealogyPanel playerCharacter={playerCharacter} allNpcs={allNpcs} onNpcSelect={handleNpcInteraction} />}
                {activeTab === 'world' && <WorldPanel currentLocation={currentLocation} npcsAtLocation={npcsAtLocation} neighbors={neighbors} rumors={rumors} onTravel={onTravel} onExplore={onExplore} onNpcSelect={handleNpcInteraction} />}
                {activeTab === 'map' && <MapView discoveredLocations={discoveredLocations} playerCharacter={playerCharacter} onTravel={onTravel} allNpcs={allNpcs} />}
                {activeTab === 'storyGraph' && <StoryGraphPanel storyLog={storyLog} />}
                {activeTab === 'aiMemory' && <AiMemoryPanel gameState={gameState} />}
                {activeTab === 'wiki' && <WikiPanel playerCharacter={playerCharacter} allNpcs={allNpcs} encounteredNpcIds={encounteredNpcIds} discoveredLocations={discoveredLocations} />}
                {activeTab === 'realms' && <RealmPanel playerCharacter={playerCharacter} realmSystem={realmSystem} />}
                {activeTab === 'lore' && <LorePanel />}
                {activeModPanelConfig && <CustomContentPanel panelConfig={activeModPanelConfig} activeMods={activeMods} />}
            </div>
        </div>
    );
};

export default Sidebar;