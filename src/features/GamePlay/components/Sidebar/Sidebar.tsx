import React, { useState, useMemo, useCallback } from 'react';
import type { PlayerCharacter, Location, NPC, Rumor, RealmConfig, FullMod, StoryEntry, GameState } from '../../../../types';
import CharacterPanel from './panels/CharacterPanel';
import GuidePanel from './panels/GuidePanel';
import WorldPanel from './panels/WorldPanel';
import TechniquesPanel from './panels/TechniquesPanel';
import WikiPanel from './panels/WikiPanel';
import RealmPanel from './panels/RealmPanel';
import LorePanel from './panels/LorePanel';
import CustomContentPanel from './panels/CustomContentPanel';
import MapView from './panels/MapView';
import StoryGraphPanel from './panels/StoryGraphPanel';
import AiMemoryPanel from './panels/AiMemoryPanel';
import GenealogyPanel from './panels/GenealogyPanel';
import SectPanel from './panels/SectPanel';
import AlchemyPanel from './panels/AlchemyPanel';
import CaveAbodePanel from './panels/CaveAbodePanel';
import QuestPanel from './panels/QuestPanel';
import { FaUser, FaGlobe, FaBook, FaScroll, FaSun, FaGopuram, FaQuestionCircle, FaMapMarkedAlt, FaProjectDiagram, FaBrain, FaSitemap, FaUsers, FaMountain, FaFlask, FaTasks } from 'react-icons/fa';
import { useGameUIContext } from '../../../../contexts/GameUIContext';
import { SHOPS } from '../../../../constants';

interface SidebarProps {
    playerCharacter: PlayerCharacter;
    setPlayerCharacter: (updater: (pc: PlayerCharacter) => PlayerCharacter) => void;
    onBreakthrough: () => void;
    currentLocation: Location;
    npcsAtLocation: NPC[];
    neighbors: Location[];
    rumors: Rumor[];
    storyLog: StoryEntry[];
    onTravel: (destinationId: string) => void;
    onExplore: () => void;
    onNpcDialogue: (npc: NPC) => void;
    allNpcs: NPC[];
    encounteredNpcIds: string[];
    discoveredLocations: Location[];
    realmSystem: RealmConfig[];
    showNotification: (message: string) => void;
    activeMods: FullMod[];
    gameState: GameState;
}
type SidebarTab = 'guide' | 'character' | 'world' | 'techniques' | 'wiki' | 'realms' | 'lore' | 'map' | 'storyGraph' | 'aiMemory' | 'genealogy' | 'sect' | 'caveAbode' | 'alchemy' | 'quests' | string;

const ICON_MAP: { [key: string]: React.ElementType } = {
    FaUser, FaGlobe, FaBook, FaScroll, FaSun, FaGopuram
};

const Sidebar: React.FC<SidebarProps> = (props) => {
    const { playerCharacter, setPlayerCharacter, onBreakthrough, currentLocation, npcsAtLocation, neighbors, rumors, onTravel, onExplore, onNpcDialogue, allNpcs, encounteredNpcIds, discoveredLocations, realmSystem, showNotification, activeMods, storyLog, gameState } = props;
    const [activeTab, setActiveTab] = useState<SidebarTab>('character');
    const { openShopModal } = useGameUIContext();
    
    const handleNpcInteraction = useCallback((npc: NPC) => {
        if (npc.shopId && SHOPS.some(s => s.id === npc.shopId)) {
            openShopModal(npc.shopId);
        } else {
            onNpcDialogue(npc);
        }
    }, [openShopModal, onNpcDialogue]);

    const baseTabs: {id: SidebarTab, label: string, icon: React.ElementType}[] = [
        {id: 'character', label: 'Nhân Vật', icon: FaUser },
        {id: 'quests', label: 'Nhiệm Vụ', icon: FaTasks },
        {id: 'techniques', label: 'Công Pháp', icon: FaScroll },
        {id: 'alchemy', label: 'Luyện Đan', icon: FaFlask },
        {id: 'genealogy', label: 'Gia Phả', icon: FaSitemap },
        {id: 'sect', label: 'Tông Môn', icon: FaUsers },
        {id: 'caveAbode', label: 'Động Phủ', icon: FaMountain },
        {id: 'world', label: 'Thế Giới', icon: FaGlobe },
        {id: 'map', label: 'Bản Đồ', icon: FaMapMarkedAlt },
        {id: 'storyGraph', label: 'Tuyến Truyện', icon: FaProjectDiagram },
        {id: 'aiMemory', label: 'AI Ký Ức', icon: FaBrain },
        {id: 'wiki', label: 'Bách Khoa', icon: FaBook },
        {id: 'realms', label: 'Cảnh Giới', icon: FaGopuram },
        {id: 'lore', label: 'Thiên Mệnh', icon: FaSun },
        {id: 'guide', label: 'Hướng Dẫn', icon: FaQuestionCircle },
    ];

    const moddedTabs = useMemo(() => {
        if (!activeMods) return [];
        return activeMods.flatMap(mod => 
            mod.content.customPanels?.map((panel, index) => ({
                id: `modpanel-${mod.modInfo.id}-${index}`,
                label: panel.title,
                icon: ICON_MAP[panel.iconName] || FaQuestionCircle,
                panelConfig: { ...panel, id: `modpanel-${mod.modInfo.id}-${index}` }
            })) || []
        );
    }, [activeMods]);

    const allTabs = [...baseTabs, ...moddedTabs];
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
                {activeTab === 'quests' && <QuestPanel quests={playerCharacter.activeQuests} />}
                {activeTab === 'techniques' && <TechniquesPanel character={playerCharacter} setPlayerCharacter={setPlayerCharacter} showNotification={showNotification} />}
                {activeTab === 'alchemy' && <AlchemyPanel playerCharacter={playerCharacter} setPlayerCharacter={setPlayerCharacter} showNotification={showNotification} />}
                {activeTab === 'genealogy' && <GenealogyPanel playerCharacter={playerCharacter} allNpcs={allNpcs} onNpcSelect={handleNpcInteraction} />}
                {activeTab === 'sect' && <SectPanel playerCharacter={playerCharacter} setPlayerCharacter={setPlayerCharacter} showNotification={showNotification} />}
                {activeTab === 'caveAbode' && <CaveAbodePanel playerCharacter={playerCharacter} setPlayerCharacter={setPlayerCharacter} showNotification={showNotification} currentLocation={currentLocation} />}
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