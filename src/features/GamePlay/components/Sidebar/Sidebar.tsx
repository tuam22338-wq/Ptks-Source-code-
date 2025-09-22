import React, { useState, memo } from 'react';
import type { GameState } from '../../../../../types';
import { FaTimes, FaUser, FaMapMarkedAlt, FaBook, FaBrain, FaQuestionCircle } from 'react-icons/fa';

// Import panel components
import CharacterPanel from './panels/CharacterPanel';
import MapView from './panels/MapView';
import QuestPanel from './panels/QuestPanel';
import AiMemoryPanel from './panels/AiMemoryPanel';
import GuidePanel from './panels/GuidePanel';

type PanelId = 'character' | 'map' | 'quests' | 'memory' | 'guide';

interface SidebarPanel {
    id: PanelId;
    label: string;
    icon: React.ElementType;
    component: React.FC<any>;
}

const PANELS: SidebarPanel[] = [
    { id: 'character', label: 'Nhân Vật', icon: FaUser, component: CharacterPanel },
    { id: 'map', label: 'Bản Đồ', icon: FaMapMarkedAlt, component: MapView },
    { id: 'quests', label: 'Nhiệm Vụ', icon: FaBook, component: QuestPanel },
    { id: 'memory', label: 'Ký Ức AI', icon: FaBrain, component: AiMemoryPanel },
    { id: 'guide', label: 'Hướng Dẫn', icon: FaQuestionCircle, component: GuidePanel },
];


interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    gameState: GameState;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, gameState }) => {
    const [activePanelId, setActivePanelId] = useState<PanelId>('character');

    const ActivePanel = PANELS.find(p => p.id === activePanelId)?.component;
    
    const panelProps = {
        character: { playerCharacter: gameState.playerCharacter },
        map: { discoveredLocations: gameState.discoveredLocations, currentLocationId: gameState.playerCharacter.currentLocationId },
        quests: { activeQuests: gameState.playerCharacter.activeQuests, completedQuestIds: gameState.playerCharacter.completedQuestIds },
        memory: { gameState },
        guide: {},
    };

    return (
        <>
            <div className={`sidebar-container ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-tabs">
                    {PANELS.map(panel => (
                        <button
                            key={panel.id}
                            title={panel.label}
                            className={`sidebar-tab-button ${activePanelId === panel.id ? 'active' : ''}`}
                            onClick={() => setActivePanelId(panel.id)}
                        >
                            <panel.icon className="w-6 h-6" />
                        </button>
                    ))}
                </div>
                <div className="sidebar-content">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
                        <h2 className="text-2xl font-bold font-title text-amber-300">
                            {PANELS.find(p => p.id === activePanelId)?.label}
                        </h2>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                    </div>
                    <div className="overflow-y-auto h-[calc(100%-4rem)] pr-2">
                        {ActivePanel && React.createElement(ActivePanel, (panelProps as any)[activePanelId])}
                    </div>
                </div>
            </div>
            {isOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onClose}></div>}
        </>
    );
};

export default memo(Sidebar);
