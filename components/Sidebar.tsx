import React, { useState, useMemo } from 'react';
import type { PlayerCharacter, Location, NPC, Rumor, RealmConfig, FullMod, ModCustomPanel, StoryEntry } from '../types';
import CharacterPanel from './CharacterPanel';
import InventoryPanel from './InventoryPanel';
import WorldPanel from './WorldPanel';
import TechniquesPanel from './TechniquesPanel';
import WikiPanel from './WikiPanel';
import RealmPanel from './RealmPanel';
import LorePanel from './LorePanel';
import AlchemyPanel from './AlchemyPanel';
import CustomContentPanel from './CustomContentPanel';
import MapView from './MapView';
import StoryGraphPanel from './StoryGraphPanel';
import SectPanel from './SectPanel';
import { FaUser, FaBoxOpen, FaGlobe, FaBook, FaScroll, FaSun, FaGopuram, FaQuestionCircle, FaMapMarkedAlt, FaSitemap } from 'react-icons/fa';
import { GiCauldron, GiDoubleDragon } from 'react-icons/gi';

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
type SidebarTab = 'character' | 'inventory' | 'world' | 'techniques' | 'wiki' | 'realms' | 'lore' | 'alchemy' | 'map' | 'storyGraph' | 'sect' | string;

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
        {id: 'world', label: 'Thế Giới', icon: FaGlobe },
        {id: 'map', label: 'Bản Đồ', icon: FaMapMarkedAlt },
        {id: 'storyGraph', label: 'Tuyến Truyện', icon: FaSitemap },
        {id: 'sect', label: 'Tông Môn', icon: GiDoubleDragon },
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
                {activeTab === 'world' && <WorldPanel currentLocation={currentLocation} npcsAtLocation={npcsAtLocation} neighbors={neighbors} rumors={rumors} onTravel={onTravel} onExplore={onExplore} onNpcSelect={onNpcSelect} />}
                {activeTab === 'map' && <MapView discoveredLocations={discoveredLocations} playerCharacter={playerCharacter} onTravel={onTravel} />}
                {activeTab === 'storyGraph' && <StoryGraphPanel storyLog={storyLog} />}
                {activeTab === 'sect' && <SectPanel />}
                {activeTab === 'wiki' && <WikiPanel playerCharacter={playerCharacter} allNpcs={allNpcs} encounteredNpcIds={encounteredNpcIds} discoveredLocations={discoveredLocations} />}
                {activeTab === 'realms' && <RealmPanel playerCharacter={playerCharacter} realmSystem={realmSystem} />}
                {activeTab === 'lore' && <LorePanel />}
                {activeModPanelConfig && <CustomContentPanel panelConfig={activeModPanelConfig} activeMods={activeMods} />}
            </div>
        </div>
    );
};

export default Sidebar;
