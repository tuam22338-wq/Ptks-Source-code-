import React, { useState } from 'react';
import type { PlayerCharacter, Location, NPC, Rumor, RealmConfig } from '../types';
import CharacterPanel from './CharacterPanel';
import InventoryPanel from './InventoryPanel';
import WorldPanel from './WorldPanel';
import TechniquesPanel from './TechniquesPanel';
import WikiPanel from './WikiPanel';
import RealmPanel from './RealmPanel';
import LorePanel from './LorePanel';
import { FaUser, FaBoxOpen, FaGlobe, FaBook, FaScroll, FaSun, FaGopuram } from 'react-icons/fa';

interface SidebarProps {
    playerCharacter: PlayerCharacter;
    setPlayerCharacter: (updater: (pc: PlayerCharacter) => PlayerCharacter) => void;
    onBreakthrough: () => void;
    currentLocation: Location;
    npcsAtLocation: NPC[];
    neighbors: Location[];
    rumors: Rumor[];
    onTravel: (destinationId: string) => void;
    onExplore: () => void;
    onNpcSelect: (npc: NPC) => void;
    allNpcs: NPC[];
    encounteredNpcIds: string[];
    discoveredLocations: Location[];
    realmSystem: RealmConfig[];
}
type SidebarTab = 'character' | 'inventory' | 'world' | 'techniques' | 'wiki' | 'realms' | 'lore';

const Sidebar: React.FC<SidebarProps> = (props) => {
    const { playerCharacter, setPlayerCharacter, onBreakthrough, currentLocation, npcsAtLocation, neighbors, rumors, onTravel, onExplore, onNpcSelect, allNpcs, encounteredNpcIds, discoveredLocations, realmSystem } = props;
    const [activeTab, setActiveTab] = useState<SidebarTab>('character');
    
    const tabs: {id: SidebarTab, label: string, icon: React.ElementType}[] = [
        {id: 'character', label: 'Nhân Vật', icon: FaUser },
        {id: 'techniques', label: 'Công Pháp', icon: FaScroll },
        {id: 'inventory', label: 'Hành Trang', icon: FaBoxOpen },
        {id: 'world', label: 'Thế Giới', icon: FaGlobe },
        {id: 'wiki', label: 'Wiki', icon: FaBook },
        {id: 'realms', label: 'Cảnh Giới', icon: FaGopuram },
        {id: 'lore', label: 'Thiên Mệnh', icon: FaSun },
    ];

    return (
        <div className="w-full h-full flex flex-col p-4">
            <div className="flex-shrink-0 mb-4">
                <div className="grid grid-cols-4 gap-1 p-1 bg-black/30 rounded-lg border border-gray-700/60">
                    {tabs.map(tab => (
                         <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs font-bold rounded-md transition-colors ${activeTab === tab.id ? 'bg-gray-700/80 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}
                            title={tab.label}
                        >
                            <tab.icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-grow overflow-y-auto pr-2">
                {activeTab === 'character' && (
                    <CharacterPanel 
                        character={playerCharacter}
                        onBreakthrough={onBreakthrough}
                        realmSystem={realmSystem}
                    />
                )}
                {activeTab === 'techniques' && (
                    <TechniquesPanel 
                        character={playerCharacter}
                    />
                )}
                {activeTab === 'inventory' && (
                    <InventoryPanel 
                        playerCharacter={playerCharacter} 
                        setPlayerCharacter={setPlayerCharacter}
                    />
                )}
                 {activeTab === 'world' && (
                    <WorldPanel 
                        currentLocation={currentLocation}
                        npcsAtLocation={npcsAtLocation}
                        neighbors={neighbors}
                        rumors={rumors}
                        onTravel={onTravel}
                        onExplore={onExplore}
                        onNpcSelect={onNpcSelect}
                    />
                )}
                {activeTab === 'wiki' && (
                    <WikiPanel
                        playerCharacter={playerCharacter}
                        allNpcs={allNpcs}
                        encounteredNpcIds={encounteredNpcIds}
                        discoveredLocations={discoveredLocations}
                    />
                )}
                 {activeTab === 'realms' && (
                    <RealmPanel
                        playerCharacter={playerCharacter}
                        realmSystem={realmSystem}
                    />
                )}
                {activeTab === 'lore' && (
                    <LorePanel />
                )}
            </div>
        </div>
    );
};

export default Sidebar;
