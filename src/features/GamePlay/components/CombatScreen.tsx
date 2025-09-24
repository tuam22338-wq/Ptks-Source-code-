


import React, { useState, useEffect, useCallback } from 'react';
import type { GameState, NPC, PlayerCharacter, CultivationTechnique, ActiveEffect, StoryEntry, CharacterAttributes } from '../../../types';
import { decideNpcCombatAction } from '../../../services/geminiService';
import * as combatManager from '../../../utils/combatManager';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { FaTimes } from 'react-icons/fa';
// FIX: Import DEFAULT_ATTRIBUTE_DEFINITIONS to look up attribute data.
import { PHAP_BAO_RANKS, DEFAULT_ATTRIBUTE_DEFINITIONS } from '../../../constants';
import { useGameUIContext } from '../../../contexts/GameUIContext';
import { useAppContext } from '../../../contexts/AppContext';

// FIX: Rewrote getBaseAttributeValue to work with the new CharacterAttributes record.
const getBaseAttributeValue = (character: PlayerCharacter | NPC, attributeId: string): number => {
    return character.attributes[attributeId]?.value || 0;
};

// FIX: Rewrote getFinalAttributeValue to use the new attribute system.
const getFinalAttributeValue = (character: PlayerCharacter | NPC, attributeId: string): number => {
    const baseValue = getBaseAttributeValue(character, attributeId);
    const attrDef = DEFAULT_ATTRIBUTE_DEFINITIONS.find(def => def.id === attributeId);
    if (!attrDef) return baseValue;

    const bonus = (character.activeEffects || [])
        .flatMap(e => e.bonuses)
        .filter(b => b.attribute === attrDef.name) // bonuses use names
        .reduce((sum, b) => sum + b.value, 0);
    return baseValue + bonus;
};

const HealthBar: React.FC<{ current: number; max: number }> = ({ current, max }) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    return (
        <div className="w-full bg-black/30 rounded-full h-2.5 border border-gray-700">
            <div className="bg-red-600 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const TechniqueSelectionModal: React.FC<{
    techniques: CultivationTechnique[];
    player: PlayerCharacter;
    onSelect: (technique: CultivationTechnique) => void;
    onClose: () => void;
}> = ({ techniques, player, onSelect, onClose }) => {
    const playerLinhLuc = getFinalAttributeValue(player, 'linh_luc');
    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-stone-900/80 backdrop-blur-lg border border-[var(--panel-border-color)] rounded-xl shadow-2xl shadow-black/50 w-full max-w-2xl m-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl text-[var(--primary-accent-color)] font-bold font-title">Chọn Công Pháp</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>
                <div className="p-4 space-y-3 overflow-y-auto">
                    {techniques.map(tech => {
                        const cooldown = player.techniqueCooldowns[tech.id] || 0;
                        const canAfford = playerLinhLuc >= tech.cost.value;
                        const isDisabled = cooldown > 0 || !canAfford;
                        const rankStyle = PHAP_BAO_RANKS[tech.rank] || PHAP_BAO_RANKS['Phàm Giai'];
                        return (
                            <button key={tech.id} onClick={() => onSelect(tech)} disabled={isDisabled}
                                className="w-full text-left bg-black/20 p-3 rounded-lg border border-gray-700/60 hover:bg-gray-800/50 hover:border-cyan-400/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black/20">
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-bold font-title ${rankStyle.color}`}>{tech.icon} {tech.name}</h4>
                                    <div className="text-right">
                                        <p className={`text-sm font-semibold ${canAfford ? 'text-amber-300' : 'text-red-400'}`}>{tech.cost.value} {tech.cost.type}</p>
                                        {cooldown > 0 && <p className="text-xs text-cyan-300">Hồi: {cooldown} lượt</p>}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{tech.description}</p>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};


const CombatScreen: React.FC = () => {
    const { state, dispatch } = useAppContext();
    const { gameState } = state;
    const { showNotification } = useGameUIContext();

    // Early return if there's no game state or combat state. This prevents crashes.
    if (!gameState || !gameState.combatState) {
        return null;
    }

    const { combatState } = gameState;

    const addStoryEntry = useCallback((newEntryData: Omit<StoryEntry, 'id'>) => {
        dispatch({
            type: 'UPDATE_GAME_STATE',
            payload: (prev) => {
                if (!prev) return null;
                const newId = (prev.storyLog[prev.storyLog.length - 1]?.id || 0) + 1;
                const newEntry = { ...newEntryData, id: newId };
                return { ...prev, storyLog: [...prev.storyLog, newEntry] };
            }
        });
    }, [dispatch]);

    const allPlayerTechniques = React.useMemo(() => {
        if (!gameState) return [];
        return gameState.playerCharacter.techniques || [];
    }, [gameState]);

    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [isProcessingTurn, setIsProcessingTurn] = useState(false);
    const [showTechniqueModal, setShowTechniqueModal] = useState(false);

    const currentActorId = combatState?.turnOrder[combatState.currentTurnIndex];
    const isPlayerTurn = currentActorId === 'player';

    useEffect(() => {
        if (combatState && combatState.enemies.length > 0) {
            setSelectedTargetId(combatState.enemies.find(e => getFinalAttributeValue(e, 'sinh_menh') > 0)?.id || null);
        }
    }, [combatState]);

    const advanceTurn = useCallback((currentState: GameState): GameState => {
        if (!currentState.combatState) return currentState;
        const { combatState } = currentState;
        const newTurnOrder = combatState.turnOrder.filter(id => id === 'player' || combatState.enemies.some(e => e.id === id && getBaseAttributeValue(e, 'sinh_menh') > 0));
        if (newTurnOrder.length === 0) {
             return { ...currentState, combatState: null };
        }
        const newIndex = (combatState.currentTurnIndex + 1) % newTurnOrder.length;
        const nextActorId = newTurnOrder[newIndex];
        let { playerCharacter } = currentState;
        if (nextActorId === 'player') {
            const newCooldowns = { ...playerCharacter.techniqueCooldowns };
            Object.keys(newCooldowns).forEach(key => { newCooldowns[key] = Math.max(0, newCooldowns[key] - 1); });
            playerCharacter = { ...playerCharacter, techniqueCooldowns: newCooldowns };
        }
        return { ...currentState, playerCharacter, combatState: { ...combatState, turnOrder: newTurnOrder, currentTurnIndex: newIndex, } };
    }, []);

    useEffect(() => {
        const processEnemyTurn = async () => {
            if (!isPlayerTurn && combatState && !isProcessingTurn && gameState) {
                setIsProcessingTurn(true);
                await new Promise(res => setTimeout(res, 1000));
                const enemy = combatState.enemies.find(e => e.id === currentActorId);
                
                if (enemy) {
                    const action = await decideNpcCombatAction(gameState, enemy);
                    addStoryEntry({ type: 'combat', content: action.narrative });
                    
                    let damage = 0;
                    if (action.action === 'BASIC_ATTACK') {
                        damage = combatManager.calculateDamage(enemy, gameState.playerCharacter, false).damage;
                    } else if (action.action === 'USE_TECHNIQUE' && action.techniqueId) {
                        const tech = enemy.techniques.find(t => t.id === action.techniqueId);
                        if (tech) {
                           damage = combatManager.calculateDamage(enemy, gameState.playerCharacter, true, tech.element).damage;
                        }
                    }

                    dispatch({ type: 'UPDATE_GAME_STATE', payload: gs => {
                        if (!gs) return null;
                        let newPlayer = { ...gs.playerCharacter };
                        const sinhMenhAttr = newPlayer.attributes['sinh_menh'];
                        if (sinhMenhAttr) {
                            const newSinhMenh = sinhMenhAttr.value - damage;
                            const newAttributes: CharacterAttributes = { ...newPlayer.attributes, 'sinh_menh': { ...sinhMenhAttr, value: newSinhMenh }};
                            newPlayer = { ...newPlayer, attributes: newAttributes };
                        }
                        const nextState = advanceTurn({ ...gs, playerCharacter: newPlayer });
                        if (getBaseAttributeValue(newPlayer, 'sinh_menh') <= 0) {
                            addStoryEntry({ type: 'combat', content: 'Bạn đã bị đánh bại!' });
                            showNotification("Thất bại!");
                            return { ...nextState, combatState: null };
                        }
                        return nextState;
                    }});
                }
                setIsProcessingTurn(false);
            }
        };
        processEnemyTurn();
    }, [currentActorId, isPlayerTurn, combatState, gameState, dispatch, addStoryEntry, isProcessingTurn, showNotification, advanceTurn]);

    const handleBasicAttack = async () => {
        if (!isPlayerTurn || !selectedTargetId || isProcessingTurn || !gameState) return;
        setIsProcessingTurn(true);
        const target = combatState?.enemies.find(e => e.id === selectedTargetId);
        if (!target) {
            setIsProcessingTurn(false);
            return;
        }
        
        const { damage, narrative } = combatManager.calculateDamage(gameState.playerCharacter, target, false);
        addStoryEntry({ type: 'combat', content: `Bạn dùng đòn đánh thường lên ${target.identity.name}. ${narrative}` });

        dispatch({ type: 'UPDATE_GAME_STATE', payload: gs => {
            if (!gs || !gs.combatState) return null;
            let newEnemies = gs.combatState.enemies.map(e => {
                if (e.id === selectedTargetId) {
                    const sinhMenhAttr = e.attributes['sinh_menh'];
                    const newSinhMenh = sinhMenhAttr.value - damage;
                    const newAttributes: CharacterAttributes = { ...e.attributes, 'sinh_menh': { ...sinhMenhAttr, value: newSinhMenh }};
                    return { ...e, attributes: newAttributes };
                }
                return e;
            });
            const defeatedEnemy = newEnemies.find(e => e.id === selectedTargetId && getBaseAttributeValue(e, 'sinh_menh') <= 0);
            if(defeatedEnemy) {
                addStoryEntry({ type: 'combat', content: `${defeatedEnemy.identity.name} đã bị đánh bại!` });
                newEnemies = newEnemies.filter(e => e.id !== defeatedEnemy.id);
            }
            const postActionState = advanceTurn({ ...gs, combatState: { ...gs.combatState, enemies: newEnemies }});
            if (newEnemies.length === 0) {
                showNotification("Chiến thắng!");
                return { ...postActionState, combatState: null };
            }
            return postActionState;
        }});
        setIsProcessingTurn(false);
    };
    
    const handleUseTechnique = async (technique: CultivationTechnique) => {
        if (!isPlayerTurn || !selectedTargetId || isProcessingTurn || !gameState) return;
        setIsProcessingTurn(true);
        setShowTechniqueModal(false);
        const target = combatState?.enemies.find(e => e.id === selectedTargetId);
        if (!target) {
            setIsProcessingTurn(false);
            return;
        }
        
        const { damage, narrative } = combatManager.calculateDamage(gameState.playerCharacter, target, true, technique.element);
        addStoryEntry({ type: 'combat', content: `Bạn thi triển [${technique.name}] lên ${target.identity.name}. ${narrative}` });

        dispatch({ type: 'UPDATE_GAME_STATE', payload: gs => {
            if (!gs || !gs.combatState) return null;
            let newEnemies = gs.combatState.enemies.map(e => {
                if (e.id === selectedTargetId) {
                    const sinhMenhAttr = e.attributes['sinh_menh'];
                    const newSinhMenh = sinhMenhAttr.value - damage;
                    const newAttributes: CharacterAttributes = { ...e.attributes, 'sinh_menh': { ...sinhMenhAttr, value: newSinhMenh }};
                    return { ...e, attributes: newAttributes };
                }
                return e;
            });
            let newPlayer = { ...gs.playerCharacter };
            const linhLucAttr = newPlayer.attributes['linh_luc'];
            if (linhLucAttr) {
                const newLinhLuc = linhLucAttr.value - technique.cost.value;
                const newAttributes: CharacterAttributes = { ...newPlayer.attributes, 'linh_luc': { ...linhLucAttr, value: newLinhLuc }};
                newPlayer = { ...newPlayer, attributes: newAttributes };
            }
            const newCooldowns = { ...newPlayer.techniqueCooldowns, [technique.id]: technique.cooldown };
            newPlayer = { ...newPlayer, techniqueCooldowns: newCooldowns };
            
            const defeatedEnemy = newEnemies.find(e => e.id === selectedTargetId && getBaseAttributeValue(e, 'sinh_menh') <= 0);
            if(defeatedEnemy) {
                addStoryEntry({ type: 'combat', content: `${defeatedEnemy.identity.name} đã bị đánh bại!` });
                newEnemies = newEnemies.filter(e => e.id !== defeatedEnemy.id);
            }
            const postActionState = advanceTurn({ ...gs, playerCharacter: newPlayer, combatState: { ...gs.combatState, enemies: newEnemies } });
            if (newEnemies.length === 0) {
                showNotification("Chiến thắng!");
                return { ...postActionState, combatState: null };
            }
            return postActionState;
        }});
        setIsProcessingTurn(false);
    };

    const playerSinhMenh = gameState.playerCharacter.attributes['sinh_menh'];
    
    return (
        <div className="flex-shrink-0 p-4 bg-red-900/20 backdrop-blur-sm border-t-2 border-red-500/50 relative">
            {showTechniqueModal && (
                <TechniqueSelectionModal
                    techniques={allPlayerTechniques}
                    player={gameState.playerCharacter}
                    onSelect={handleUseTechnique}
                    onClose={() => setShowTechniqueModal(false)}
                />
            )}
            <div className="flex justify-between items-start mb-4">
                <div className="w-1/3 text-center p-2 bg-black/20 rounded-lg">
                    <p className="font-semibold text-gray-200">{gameState.playerCharacter.identity.name}</p>
                     {playerSinhMenh && playerSinhMenh.maxValue !== undefined && <HealthBar current={getFinalAttributeValue(gameState.playerCharacter, 'sinh_menh')} max={playerSinhMenh.maxValue} />}
                    {isPlayerTurn && !isProcessingTurn && <p className="text-xs text-amber-300 animate-pulse">Lượt của bạn</p>}
                </div>
                 <div className="w-2/3 grid grid-cols-2 gap-2 pl-4">
                    {combatState.enemies.map(enemy => {
                         const enemySinhMenh = enemy.attributes['sinh_menh'];
                         const isCurrentTurn = currentActorId === enemy.id;
                         return (
                            <div key={enemy.id} onClick={() => setSelectedTargetId(enemy.id)}
                                className={`p-2 bg-black/20 rounded-lg cursor-pointer transition-all duration-200 ${selectedTargetId === enemy.id ? 'border-2 border-amber-400' : 'border-2 border-transparent'}`}>
                                <p className="font-semibold text-gray-200 text-sm truncate">{enemy.identity.name}</p>
                                {enemySinhMenh && enemySinhMenh.maxValue !== undefined && <HealthBar current={getFinalAttributeValue(enemy, 'sinh_menh')} max={enemySinhMenh.maxValue} />}
                                {isCurrentTurn && <p className="text-xs text-red-400">Lượt của địch</p>}
                            </div>
                         )
                    })}
                </div>
            </div>
            {isProcessingTurn && <div className="text-center"><LoadingSpinner message="Đang xử lý..." size="sm"/></div>}
            <div className="grid grid-cols-2 gap-2">
                <button onClick={handleBasicAttack} disabled={!isPlayerTurn || isProcessingTurn || !selectedTargetId} className="p-3 bg-red-700 text-white font-bold rounded-lg hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed">Tấn Công</button>
                <button onClick={() => setShowTechniqueModal(true)} disabled={!isPlayerTurn || isProcessingTurn || !selectedTargetId} className="p-3 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed">Công Pháp</button>
                <button disabled={!isPlayerTurn || isProcessingTurn} className="p-3 bg-green-700 text-white font-bold rounded-lg hover:bg-green-600 disabled:bg-gray-600">Vật Phẩm</button>
                <button disabled={!isPlayerTurn || isProcessingTurn} className="p-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 disabled:bg-gray-500">Bỏ Chạy</button>
            </div>
        </div>
    );
};

export default CombatScreen;