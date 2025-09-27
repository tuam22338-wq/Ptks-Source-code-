import React, { useState, memo, useMemo } from 'react';
import type { GameState, GameSettings } from '../../../../types';
import { FaTimes, FaUser, FaMapMarkedAlt, FaBook, FaBrain, FaQuestionCircle, FaVial } from 'react-icons/fa';
import { GiGears } from 'react-icons/gi';

// Import panel components
import StatusPanel from './panels/StatusPanel';
import MapView from './panels/MapView';
import QuestPanel from './panels/QuestPanel';
import AiMemoryPanel from './panels/AiMemoryPanel';
import GuidePanel from './panels/GuidePanel';
import AiRulesPanel from './panels/AiRulesPanel';
import LiveEditorPanel from './panels/LiveEditorPanel';

type PanelId = 'status' | 'map' | 'quests' | 'memory' | 'rules' | 'guide' | 'liveEditor';

interface SidebarPanel {
    id: PanelId;
    label: string;
    icon: React.ElementType;
    component: React.FC<any>;
}

const BASE_PANELS: SidebarPanel[] = [
    { id: 'status', label: 'Trạng Thái', icon: FaUser, component: StatusPanel },
    { id: 'map', label: 'Bản Đồ', icon: FaMapMarkedAlt, component: MapView },
    { id: 'quests', label: 'Nhiệm Vụ', icon: FaBook, component: QuestPanel },
    { id: 'memory', label: 'Ký Ức AI', icon: FaBrain, component: AiMemoryPanel },
    { id: 'rules', label: 'Quy Luật', icon: GiGears, component: AiRulesPanel },
    { id: 'guide', label: 'Hướng Dẫn', icon: FaQuestionCircle, component: GuidePanel },
];


interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    gameState: GameState;
    settings: GameSettings;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, gameState, settings }) => {
    const [activePanelId, setActivePanelId] = useState<PanelId>('status');

    const availablePanels = useMemo(() => {
        const panels = [...BASE_PANELS];
        if (settings.enableTestingMode) {
            panels.push({ id: 'liveEditor', label: 'Thử Nghiệm', icon: FaVial, component: LiveEditorPanel });
        }
        return panels;
    }, [settings.enableTestingMode]);

    const ActivePanel = availablePanels.find(p => p.id === activePanelId)?.component;
    
    const panelProps = {
        status: { gameState: gameState },
        map: { discoveredLocations: gameState.discoveredLocations, currentLocationId: gameState.playerCharacter.currentLocationId },
        quests: { activeQuests: gameState.playerCharacter.activeQuests, completedQuestIds: gameState.playerCharacter.completedQuestIds },
        memory: { gameState },
        rules: { gameState: gameState },
        guide: {},
        liveEditor: { gameState: gameState },
    };

    return (
        <>
            <div className={`fixed top-0 right-0 h-full z-40 w-96 max-w-[90vw] bg-stone-900/90 backdrop-blur-md border-l border-gray-700 transform transition-transform duration-300 ease-in-out flex flex-row-reverse ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="w-16 flex-shrink-0 bg-black/30 flex flex-col items-center p-2 gap-2">
                    {availablePanels.map(panel => (
                        <button
                            key={panel.id}
                            title={panel.label}
                            className={`w-12 h-12 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-700/50 hover:text-white transition-colors ${activePanelId === panel.id ? 'bg-amber-600/50 text-white' : ''}`}
                            onClick={() => setActivePanelId(panel.id)}
                        >
                            <panel.icon className="w-6 h-6" />
                        </button>
                    ))}
                </div>
                <div className="flex-grow p-4 min-w-0">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-700">
                        <h2 className="text-2xl font-bold font-title text-amber-300">
                            {availablePanels.find(p => p.id === activePanelId)?.label}
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