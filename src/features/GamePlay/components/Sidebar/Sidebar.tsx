import React, { useState, useMemo, useCallback, memo } from 'react';
import type { PlayerCharacter, Location, NPC, Rumor, RealmConfig, FullMod, StoryEntry, GameState } from '../../../../types';
import { useAppContext } from '../../../../contexts/AppContext';
import { useGameUIContext } from '../../../../contexts/GameUIContext';
import CharacterPanel from './panels/CharacterPanel';
import WorldPanel from './panels/WorldPanel';
import QuestPanel from './panels/QuestPanel';
import InventoryPanel from './panels/InventoryPanel';
import TechniquesPanel from './panels/TechniquesPanel';
import MapView from './panels/MapView';
import RealmPanel from './panels/RealmPanel';
import SectPanel from './panels/SectPanel';
import GenealogyPanel from './panels/GenealogyPanel';
import DeathPanel from './panels/DeathPanel';
import SystemPanel from './panels/SystemPanel';
import CaveAbodePanel from './panels/CaveAbodePanel';
import AlchemyPanel from './panels/AlchemyPanel';
import PlayerSectPanel from './panels/PlayerSectPanel';
import AiMemoryPanel from './panels/AiMemoryPanel';
import AiAssistantPanel from './panels/AiAssistantPanel';
import { FaUser, FaGlobe, FaMap, FaTasks, FaFistRaised, FaUsers, FaDna, FaLandmark, FaSkullCrossbones, FaFlask, FaMountain, FaCrown, FaBrain } from 'react-icons/fa';
import { FiCpu } from 'react-icons/fi';
import { GiGears, GiFamilyTree, GiCastle } from 'react-icons/gi';

type PanelId = 'character' | 'world' | 'map' | 'quests' | 'inventory' | 'techniques' | 'realms' | 'sect' | 'genealogy' | 'alchemy' | 'cave' | 'player_sect' | 'ai_memory' | 'ai_assistant' | 'system';

const Sidebar: React.FC<{
    onBreakthrough: () => void;
    onTravel: (destinationId: string) => void;
    onExplore: () => void;
    onNpcDialogue: (npc: NPC) => void;
}> = ({ onBreakthrough, onTravel, onExplore, onNpcDialogue }) => {
    const { state, dispatch, handleUpdatePlayerCharacter } = useAppContext();
    const { showNotification } = useGameUIContext();
    const { gameState } = state;
    const [activePanel, setActivePanel] = useState<PanelId>('character');

    const handleSetPlayerCharacter = useCallback((updater: (pc: PlayerCharacter) => PlayerCharacter) => {
        handleUpdatePlayerCharacter(updater);
    }, [handleUpdatePlayerCharacter]);

    const setGameState = useCallback((updater: (gs: GameState | null) => GameState | null) => {
        dispatch({ type: 'UPDATE_GAME_STATE', payload: updater });
    }, [dispatch]);

    const PANELS = useMemo(() => [
        { id: 'character', label: 'Nhân Vật', icon: FaUser, component: CharacterPanel, props: { playerCharacter: gameState!.playerCharacter, onBreakthrough, realmSystem: gameState!.realmSystem } },
        { id: 'inventory', label: 'Hành Trang', icon: GiGears, component: InventoryPanel, props: { playerCharacter: gameState!.playerCharacter } },
        { id: 'techniques', label: 'Công Pháp', icon: FaFistRaised, component: TechniquesPanel, props: { playerCharacter: gameState!.playerCharacter, setPlayerCharacter: handleSetPlayerCharacter, showNotification } },
        { id: 'world', label: 'Thế Giới', icon: FaGlobe, component: WorldPanel, props: { currentLocation: gameState!.discoveredLocations.find(l => l.id === gameState!.playerCharacter.currentLocationId)!, rumors: gameState!.worldState.rumors, dynamicEvents: gameState!.worldState.dynamicEvents } },
        { id: 'map', label: 'Bản Đồ', icon: FaMap, component: MapView, props: { discoveredLocations: gameState!.discoveredLocations, playerCharacter: gameState!.playerCharacter, onTravel, allNpcs: gameState!.activeNpcs } },
        { id: 'quests', label: 'Nhiệm Vụ', icon: FaTasks, component: QuestPanel, props: { quests: gameState!.playerCharacter.activeQuests } },
        { id: 'genealogy', label: 'Thân Hữu', icon: GiFamilyTree, component: GenealogyPanel, props: { playerCharacter: gameState!.playerCharacter, allNpcs: gameState!.activeNpcs, onNpcSelect: onNpcDialogue } },
        ...(gameState!.playerCharacter.systemInfo ? [{ id: 'system', label: 'Hệ Thống', icon: FiCpu, component: SystemPanel, props: { gameState: gameState!, setGameState, showNotification } }] : []),
        { id: 'sect', label: 'Tông Môn', icon: FaLandmark, component: SectPanel, props: { playerCharacter: gameState!.playerCharacter } },
        { id: 'alchemy', label: 'Luyện Đan', icon: FaFlask, component: AlchemyPanel, props: { playerCharacter: gameState!.playerCharacter } },
        { id: 'cave', label: 'Động Phủ', icon: FaMountain, component: CaveAbodePanel, props: { playerCharacter: gameState!.playerCharacter, currentLocation: gameState!.discoveredLocations.find(l => l.id === gameState!.playerCharacter.currentLocationId)! } },
        ...(gameState!.playerSect ? [{ id: 'player_sect', label: 'Tự Lập Môn Hộ', icon: GiCastle, component: PlayerSectPanel, props: { gameState: gameState!, setGameState, showNotification } }] : []),
        { id: 'realms', label: 'Cảnh Giới', icon: FaDna, component: RealmPanel, props: { playerCharacter: gameState!.playerCharacter, realmSystem: gameState!.realmSystem } },
        { id: 'ai_memory', label: 'Ký Ức AI', icon: FaBrain, component: AiMemoryPanel, props: { gameState: gameState! } },
        { id: 'ai_assistant', label: 'Trợ Lý AI', icon: FaUsers, component: AiAssistantPanel, props: { gameState: gameState! } },
    ], [gameState, onBreakthrough, onTravel, onNpcDialogue, handleSetPlayerCharacter, showNotification, setGameState]);

    if (!gameState) return null;

    const isPlayerDead = gameState.playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === 'Sinh Mệnh')?.value as number <= 0;
    if (isPlayerDead) {
        return <DeathPanel />;
    }

    const activePanelData = PANELS.find(p => p.id === activePanel);

    return (
        <div className="flex h-full">
            <nav className="w-16 bg-black/20 flex flex-col items-center py-4 space-y-2 border-r border-gray-700/60 overflow-y-auto">
                {PANELS.map(panel => (
                    <button
                        key={panel.id}
                        onClick={() => setActivePanel(panel.id as PanelId)}
                        title={panel.label}
                        className={`w-12 h-12 flex items-center justify-center rounded-lg transition-colors duration-200 ${activePanel === panel.id ? 'bg-amber-500/80 text-white' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'}`}
                    >
                        <panel.icon size={22} />
                    </button>
                ))}
            </nav>
            <div className="flex-grow p-4 overflow-y-auto">
                {/* FIX: Cast the component to `any` to resolve a TypeScript error where it cannot handle a union of different component types in React.createElement. The props are guaranteed to be correct by the PANELS array structure. */}
                {activePanelData && React.createElement(activePanelData.component as any, activePanelData.props)}
            </div>
        </div>
    );
};

export default memo(Sidebar);