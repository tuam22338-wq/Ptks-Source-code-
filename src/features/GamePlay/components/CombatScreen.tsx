

import React, { useState, useEffect, useCallback } from 'react';
import type { GameState, NPC, PlayerCharacter, CultivationTechnique, ActiveEffect, StoryEntry, SkillTreeNode } from '../../../types';
import { decideNpcCombatAction } from '../../../services/geminiService';
import * as combatManager from '../../../utils/combatManager';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { FaTimes } from 'react-icons/fa';
import { PHAP_BAO_RANKS } from '../../../constants';
import { useGameUIContext } from '../../../contexts/GameUIContext';
import { useAppContext } from '../../../contexts/AppContext';

const getBaseAttributeValue = (character: PlayerCharacter | NPC, name: string): number => {
    if ('attributes' in character && character.attributes) {
        return (character.attributes.flatMap(g => g.attributes).find(a => a.name === name)?.value as number) || 10;
    }
    return 10;
};

const getFinalAttributeValue = (character: PlayerCharacter | NPC, name: string): number => {
    const baseValue = getBaseAttributeValue(character, name);
    const bonus = (character.activeEffects || [])
        .flatMap(e => e.bonuses)
        .filter(b => b.attribute === name)
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
    const playerLinhLuc = getFinalAttributeValue(player, 'Linh Lực');
    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="themed-modal rounded-lg shadow-2xl shadow-black/50 w-full max-w-2xl m-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
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
    const { gameState, setGameState } = useAppContext();
    const { showNotification } = useGameUIContext();
    const { combatState } = gameState!;

    const addStoryEntry = useCallback((newEntryData: Omit<StoryEntry, 'id'>) => {
        setGameState(prev => {
            if (!prev) return null;
            const newId = (prev.storyLog[prev.storyLog.length - 1]?.id || 0) + 1;
            const newEntry = { ...newEntryData, id: newId };
            return { ...prev, storyLog: [...prev.storyLog, newEntry] };
        });
    }, [setGameState]);

    const allPlayerTechniques = React.useMemo(() => {
        if (!gameState) return [];
        const activeSkills = Object.values(gameState.playerCharacter.mainCultivationTechnique?.skillTreeNodes || {})
            .filter((node: SkillTreeNode) => node.isUnlocked && node.type === 'active_skill' && node.activeSkill)
            .map((node: SkillTreeNode) => ({ ...node.activeSkill!, id: node.id, level: 1, maxLevel: 10 } as CultivationTechnique));
        return [...activeSkills, ...gameState.playerCharacter.auxiliaryTechniques];
    }, [gameState]);

    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [isProcessingTurn, setIsProcessingTurn] = useState(false);
    const [showTechniqueModal, setShowTechniqueModal] = useState(false);

    const currentActorId = combatState?.turnOrder[combatState.currentTurnIndex];
    const isPlayerTurn = currentActorId === 'player';

    useEffect(() => {
        if (combatState && combatState.enemies.length > 0) {
            setSelectedTargetId(combatState.enemies.find(e => getFinalAttributeValue(e, 'Sinh Mệnh') > 0)?.id || null);
        }
    }, [combatState]);

    const advanceTurn = useCallback((currentState: GameState): GameState => {
        if (!currentState.combatState) return currentState;
        const { combatState } = currentState;
        const newTurnOrder = combatState.turnOrder.filter(id => id === 'player' || combatState.enemies.some(e => e.id === id && getBaseAttributeValue(e, 'Sinh Mệnh') > 0));
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

                    setGameState(gs => {
                        if (!gs) return null;
                        let newPlayer = { ...gs.playerCharacter };
                        const sinhMenhAttr = newPlayer.attributes.flatMap(g => g.attributes).find(a => a.name === 'Sinh Mệnh');
                        if (sinhMenhAttr) {
                            const newSinhMenh = (sinhMenhAttr.value as number) - damage;
                            const updatedAttributes = newPlayer.attributes.map(g => ({ ...g, attributes: g.attributes.map(a => a.name === 'Sinh Mệnh' ? { ...a, value: newSinhMenh } : a) }));
                            newPlayer = { ...newPlayer, attributes: updatedAttributes };
                        }
                        const nextState = advanceTurn({ ...gs, playerCharacter: newPlayer });
                        if ((getBaseAttributeValue(newPlayer, 'Sinh Mệnh')) <= 0) {
                            addStoryEntry({ type: 'combat', content: 'Bạn đã bị đánh bại!' });
                            showNotification("Thất bại!");
                            return { ...nextState, combatState: null };
                        }
                        return nextState;
                    });
                }
                setIsProcessingTurn(false);
            }
        };
        processEnemyTurn();
    }, [currentActorId, isPlayerTurn, combatState, gameState, setGameState, addStoryEntry, isProcessingTurn, showNotification, advanceTurn]);

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

        setGameState(gs => {
            if (!gs || !gs.combatState) return null;
            let newEnemies = gs.combatState.enemies.map(e => {
                if (e.id === selectedTargetId) {
                    const sinhMenhAttr = e.attributes.flatMap(g => g.attributes).find(a => a.name === 'Sinh Mệnh');
                    const newSinhMenh = (sinhMenhAttr?.value as number) - damage;
                    const updatedAttributes = e.attributes.map(g => ({ ...g, attributes: g.attributes.map(a => a.name === 'Sinh Mệnh' ? {...a, value: newSinhMenh} : a) }));
                    return { ...e, attributes: updatedAttributes };
                }
                return e;
            });
            const defeatedEnemy = newEnemies.find(e => e.id === selectedTargetId && getBaseAttributeValue(e, 'Sinh Mệnh') <= 0);
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
        });
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

        setGameState(gs => {
            if (!gs || !gs.combatState) return null;
            let newEnemies = gs.combatState.enemies.map(e => {
                if (e.id === selectedTargetId) {
                    const sinhMenhAttr = e.attributes.flatMap(g => g.attributes).find(a => a.name === 'Sinh Mệnh');
                    const newSinhMenh = (sinhMenhAttr?.value as number) - damage;
                    const updatedAttributes = e.attributes.map(g => ({ ...g, attributes: g.attributes.map(a => a.name === 'Sinh Mệnh' ? {...a, value: newSinhMenh} : a) }));
                    return { ...e, attributes: updatedAttributes };
                }
                return e;
            });
            let newPlayer = { ...gs.playerCharacter };
            const linhLucAttr = newPlayer.attributes.flatMap(g => g.attributes).find(a => a.name === 'Linh Lực');
            if (linhLucAttr) {
                const newLinhLuc = (linhLucAttr.value as number) - technique.cost.value;
                const updatedAttributes = newPlayer.attributes.map(g => ({...g, attributes: g.attributes.map(a => a.name === 'Linh Lực' ? { ...a, value: newLinhLuc } : a) }));
                newPlayer = { ...newPlayer, attributes: updatedAttributes };
            }
            const newCooldowns = { ...newPlayer.techniqueCooldowns, [technique.id]: technique.cooldown };
            newPlayer = { ...newPlayer, techniqueCooldowns: newCooldowns };
            
            const defeatedEnemy = newEnemies.find(e => e.id === selectedTargetId && getBaseAttributeValue(e, 'Sinh Mệnh') <= 0);
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
        });
        setIsProcessingTurn(false);
    };

    if (!combatState || !gameState) return null;

    const playerSinhMenh = gameState.playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === 'Sinh Mệnh');
    
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
                     {playerSinhMenh && <HealthBar current={getFinalAttributeValue(gameState.playerCharacter, 'Sinh Mệnh')} max={playerSinhMenh.maxValue as number} />}
                    {isPlayerTurn && !isProcessingTurn && <p className="text-xs text-amber-300 animate-pulse">Lượt của bạn</p>}
                </div>
                 <div className="w-2/3 grid grid-cols-2 gap-2 pl-4">
                    {combatState.enemies.map(enemy => {
                         const enemySinhMenh = enemy.attributes.flatMap(g => g.attributes).find(a => a.name === 'Sinh Mệnh');
                         const isCurrentTurn = currentActorId === enemy.id;
                         return (
                            <div key={enemy.id} onClick={() => setSelectedTargetId(enemy.id)}
                                className={`p-2 bg-black/20 rounded-lg cursor-pointer transition-all duration-200 ${selectedTargetId === enemy.id ? 'border-2 border-amber-400' : 'border-2 border-transparent'}`}>
                                <p className="font-semibold text-gray-200 text-sm truncate">{enemy.identity.name}</p>
                                {enemySinhMenh && <HealthBar current={getFinalAttributeValue(enemy, 'Sinh Mệnh')} max={enemySinhMenh.maxValue as number} />}
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
