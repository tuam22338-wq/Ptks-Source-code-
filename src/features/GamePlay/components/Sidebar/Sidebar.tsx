import React, { useState, useMemo } from 'react';
import type { PlayerCharacter, Location, NPC, Rumor, RealmConfig, FullMod, StoryEntry } from '../../../../types';
import CharacterPanel from './panels/CharacterPanel';
import InventoryPanel from './panels/InventoryPanel';
import WorldPanel from './panels/WorldPanel';
import TechniquesPanel from './panels/TechniquesPanel';
import WikiPanel from './panels/WikiPanel';
import RealmPanel from './panels/RealmPanel';
import LorePanel from './panels/LorePanel';
import AlchemyPanel from './panels/AlchemyPanel';
import CustomContentPanel from './panels/CustomContentPanel';
import MapView from './panels/MapView';
import StoryGraphPanel from './panels/StoryGraphPanel';
import SectPanel from './panels/SectPanel';
import CaveAbodePanel from './panels/CaveAbodePanel';
import { FaUser, FaBoxOpen, FaGlobe, FaBook, FaScroll, FaSun, FaGopuram, FaQuestionCircle, FaMapMarkedAlt, FaSitemap } from 'react-icons/fa';
import { GiCauldron, GiDoubleDragon, GiMountainCave } from 'react-icons/gi';

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
    onNpcSelect: (npc: NPC) => void;
    allNpcs: NPC[];
    encounteredNpcIds: string[];
    discoveredLocations: Location[];
    realmSystem: RealmConfig[];
    showNotification: (message: string) => void;
    activeMods: FullMod[];
}
type SidebarTab = 'character' | 'inventory' | 'world' | 'techniques' | 'wiki' | 'realms' | 'lore' | 'alchemy' | 'map' | 'storyGraph' | 'sect' | 'caveAbode' | string;

const ICON_MAP: { [key: string]: React.ElementType } = {
    FaUser, FaBoxOpen, FaGlobe, FaBook, FaScroll, FaSun, FaGopuram, GiCauldron
};

const Sidebar: React.FC<SidebarProps> = (props) => {
    const { playerCharacter, setPlayerCharacter, onBreakthrough, currentLocation, npcsAtLocation, neighbors, rumors, onTravel, onExplore, onNpcSelect, allNpcs, encounteredNpcIds, discoveredLocations, realmSystem, showNotification, activeMods, storyLog } = props;
    const [activeTab, setActiveTab] = useState<SidebarTab>('character');
    
    const baseTabs: {id: SidebarTab, label: string, icon: React.ElementType}[] = [
        {id: 'character', label: 'Nhân Vật', icon: FaUser },
        {id: 'techniques', label: 'Công Pháp', icon: FaScroll },
        {id: 'inventory', label: 'Hành Trang', icon: FaBoxOpen },
        {id: 'alchemy', label: 'Luyện Đan', icon: GiCauldron },
        {id: 'sect', label: 'Tông Môn', icon: GiDoubleDragon },
        {id: 'caveAbode', label: 'Động Phủ', icon: GiMountainCave },
        {id: 'world', label: 'Thế Giới', icon: FaGlobe },
        {id: 'map', label: 'Bản Đồ', icon: FaMapMarkedAlt },
        {id: 'storyGraph', label: 'Tuyến Truyện', icon: FaSitemap },
        {id: 'wiki', label: 'Wiki', icon: FaBook },
        {id: 'realms', label: 'Cảnh Giới', icon: FaGopuram },
        {id: 'lore', label: 'Thiên Mệnh', icon: FaSun },
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
                {activeTab === 'character' && <CharacterPanel character={playerCharacter} onBreakthrough={onBreakthrough} realmSystem={realmSystem} />}
                {activeTab === 'techniques' && <TechniquesPanel character={playerCharacter} />}
                {activeTab === 'inventory' && <InventoryPanel playerCharacter={playerCharacter} setPlayerCharacter={setPlayerCharacter} showNotification={showNotification} />}
                {activeTab === 'alchemy' && <AlchemyPanel playerCharacter={playerCharacter} setPlayerCharacter={setPlayerCharacter} showNotification={showNotification} />}
                {activeTab === 'sect' && <SectPanel playerCharacter={playerCharacter} setPlayerCharacter={setPlayerCharacter} showNotification={showNotification} />}
                {activeTab === 'caveAbode' && <CaveAbodePanel playerCharacter={playerCharacter} setPlayerCharacter={setPlayerCharacter} showNotification={showNotification} currentLocation={currentLocation} />}
                {activeTab === 'world' && <WorldPanel currentLocation={currentLocation} npcsAtLocation={npcsAtLocation} neighbors={neighbors} rumors={rumors} onTravel={onTravel} onExplore={onExplore} onNpcSelect={onNpcSelect} />}
                {activeTab === 'map' && <MapView discoveredLocations={discoveredLocations} playerCharacter={playerCharacter} onTravel={onTravel} />}
                {activeTab === 'storyGraph' && <StoryGraphPanel storyLog={storyLog} />}
                {activeTab === 'wiki' && <WikiPanel playerCharacter={playerCharacter} allNpcs={allNpcs} encounteredNpcIds={encounteredNpcIds} discoveredLocations={discoveredLocations} />}
                {activeTab === 'realms' && <RealmPanel playerCharacter={playerCharacter} realmSystem={realmSystem} />}
                {activeTab === 'lore' && <LorePanel />}
                {activeModPanelConfig && <CustomContentPanel panelConfig={activeModPanelConfig} activeMods={activeMods} />}
            </div>
        </div>
    );
};

export default Sidebar;
