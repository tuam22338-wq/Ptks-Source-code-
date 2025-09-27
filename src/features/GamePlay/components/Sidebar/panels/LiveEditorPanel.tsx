import React, { memo, useState, useEffect } from 'react';
import type { GameState, CharacterAttributes, Currency, NPC } from '../../../../../types';
import { useAppContext } from '../../../../../contexts/AppContext';
import { useGameUIContext } from '../../../../../contexts/GameUIContext';
import { FaExclamationTriangle, FaSave } from 'react-icons/fa';

interface LiveEditorPanelProps {
    gameState: GameState;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
        <h4 className="font-bold text-amber-300 font-title mb-3">{title}</h4>
        <div className="space-y-3">{children}</div>
    </div>
);

const LiveEditorPanel: React.FC<LiveEditorPanelProps> = ({ gameState }) => {
    const { dispatch } = useAppContext();
    const { showNotification } = useGameUIContext();
    
    // Local state for forms
    const [playerAttrs, setPlayerAttrs] = useState<CharacterAttributes>(gameState.playerCharacter.attributes);
    const [playerCult, setPlayerCult] = useState({ spiritualQi: gameState.playerCharacter.cultivation.spiritualQi });
    const [playerCurr, setPlayerCurr] = useState<Currency>(gameState.playerCharacter.currencies);

    const [selectedNpcId, setSelectedNpcId] = useState<string>('');
    const [npcAttrs, setNpcAttrs] = useState<CharacterAttributes | null>(null);

    const npcsInLocation = gameState.activeNpcs.filter(n => n.locationId === gameState.playerCharacter.currentLocationId);

    // Sync local state when game state changes
    useEffect(() => {
        setPlayerAttrs(gameState.playerCharacter.attributes);
        setPlayerCult({ spiritualQi: gameState.playerCharacter.cultivation.spiritualQi });
        setPlayerCurr(gameState.playerCharacter.currencies);

        const selectedNpc = gameState.activeNpcs.find(n => n.id === selectedNpcId);
        setNpcAttrs(selectedNpc ? selectedNpc.attributes : null);
    }, [gameState, selectedNpcId]);
    
    const handleApplyPlayerChanges = () => {
        dispatch({ type: 'UPDATE_GAME_STATE', payload: gs => {
            if (!gs) return null;
            return {
                ...gs,
                playerCharacter: {
                    ...gs.playerCharacter,
                    attributes: JSON.parse(JSON.stringify(playerAttrs)),
                    cultivation: {
                        ...gs.playerCharacter.cultivation,
                        spiritualQi: Number(playerCult.spiritualQi) || 0,
                    },
                    currencies: JSON.parse(JSON.stringify(playerCurr)),
                }
            };
        }});
        showNotification("Đã cập nhật chỉ số nhân vật!");
    };

    const handleApplyNpcChanges = () => {
        if (!selectedNpcId || !npcAttrs) return;
        dispatch({ type: 'UPDATE_GAME_STATE', payload: gs => {
            if (!gs) return null;
            return {
                ...gs,
                activeNpcs: gs.activeNpcs.map(npc => 
                    npc.id === selectedNpcId ? { ...npc, attributes: JSON.parse(JSON.stringify(npcAttrs)) } : npc
                )
            };
        }});
        showNotification(`Đã cập nhật chỉ số cho ${npcsInLocation.find(n => n.id === selectedNpcId)?.identity.name}!`);
    };

    const handleTeleport = (locationId: string) => {
        dispatch({ type: 'UPDATE_GAME_STATE', payload: gs => {
            if (!gs) return null;
            return { ...gs, playerCharacter: { ...gs.playerCharacter, currentLocationId: locationId }};
        }});
        showNotification(`Đã dịch chuyển!`);
    };

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div className="p-3 text-center bg-yellow-900/20 border border-yellow-600/50 rounded-lg text-yellow-300 text-sm">
                <FaExclamationTriangle className="inline-block mr-2" />
                Chế độ thử nghiệm đang bật. Các thay đổi sẽ được lưu vào save file hiện tại.
            </div>
            
            <Section title="Nhân Vật Chính">
                 {Object.entries(playerAttrs).map(([id, attr]) => (
                    <div key={id}>
                        <label className="text-xs text-gray-400">{gameState.attributeSystem.definitions.find(d => d.id === id)?.name || id}</label>
                        <div className="flex gap-2">
                            {/* FIX: Explicitly typing the updater function's parameter 'p' to resolve the 'unknown' type error. */}
                             <input type="number" value={attr.value} onChange={e => setPlayerAttrs((p: CharacterAttributes) => ({...p, [id]: { ...p[id], value: parseInt(e.target.value, 10) || 0 }}))} className="w-full bg-black/30 border border-gray-600 rounded-lg px-2 py-1 text-sm text-gray-200" />
                             {attr.maxValue !== undefined && (
                                // FIX: Explicitly typing the updater function's parameter 'p' to resolve the 'unknown' type error.
                                <input type="number" value={attr.maxValue} onChange={e => setPlayerAttrs((p: CharacterAttributes) => ({...p, [id]: { ...p[id], maxValue: parseInt(e.target.value, 10) || 0 }}))} className="w-full bg-black/30 border border-gray-600 rounded-lg px-2 py-1 text-sm text-gray-200" />
                             )}
                        </div>
                    </div>
                ))}
                 <div>
                    <label className="text-xs text-gray-400">Linh Khí</label>
                    <input type="number" value={playerCult.spiritualQi} onChange={e => setPlayerCult({ spiritualQi: parseInt(e.target.value, 10) || 0 })} className="w-full bg-black/30 border border-gray-600 rounded-lg px-2 py-1 text-sm text-gray-200" />
                </div>
                 {Object.keys(playerCurr).map(key => (
                     <div key={key}>
                        <label className="text-xs text-gray-400">{key}</label>
                        <input type="number" value={playerCurr[key as keyof Currency] || 0} onChange={e => setPlayerCurr(p => ({...p, [key]: parseInt(e.target.value, 10) || 0}))} className="w-full bg-black/30 border border-gray-600 rounded-lg px-2 py-1 text-sm text-gray-200" />
                    </div>
                 ))}
                <button onClick={handleApplyPlayerChanges} className="w-full mt-2 px-4 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 text-sm flex items-center justify-center gap-2"><FaSave /> Áp Dụng Thay Đổi</button>
            </Section>

             <Section title="Thế Giới">
                <div>
                    <label className="text-xs text-gray-400">Dịch Chuyển</label>
                    <select onChange={e => handleTeleport(e.target.value)} value={gameState.playerCharacter.currentLocationId} className="w-full bg-black/30 border border-gray-600 rounded-lg px-2 py-1 text-sm text-gray-200">
                        {gameState.discoveredLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                    </select>
                </div>
            </Section>
            
            <Section title="NPC Tại Đây">
                <select onChange={e => setSelectedNpcId(e.target.value)} value={selectedNpcId} className="w-full bg-black/30 border border-gray-600 rounded-lg px-2 py-1 text-sm text-gray-200">
                    <option value="">-- Chọn NPC --</option>
                    {npcsInLocation.map(npc => <option key={npc.id} value={npc.id}>{npc.identity.name}</option>)}
                </select>
                {selectedNpcId && npcAttrs && (
                    <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                        {Object.entries(npcAttrs).map(([id, attr]) => (
                            <div key={id}>
                                <label className="text-xs text-gray-400">{gameState.attributeSystem.definitions.find(d => d.id === id)?.name || id}</label>
                                {/* FIX: Explicitly typing the updater function's parameter 'p' to resolve the 'unknown' type error. */}
                                <input type="number" value={attr.value} onChange={e => setNpcAttrs((p: CharacterAttributes | null) => p ? ({...p, [id]: { ...p[id], value: parseInt(e.target.value, 10) || 0 }}) : null)} className="w-full bg-black/30 border border-gray-600 rounded-lg px-2 py-1 text-sm text-gray-200" />
                            </div>
                        ))}
                        <button onClick={handleApplyNpcChanges} className="w-full mt-2 px-4 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 text-sm flex items-center justify-center gap-2"><FaSave /> Áp Dụng</button>
                    </div>
                )}
            </Section>

        </div>
    );
};

export default memo(LiveEditorPanel);