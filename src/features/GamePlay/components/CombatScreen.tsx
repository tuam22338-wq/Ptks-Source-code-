


import React, { useState, useEffect } from 'react';
import type { GameState, NPC, PlayerCharacter } from '../../../types';
import { generateCombatNarrative } from '../../../services/geminiService';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface CombatScreenProps {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    showNotification: (message: string) => void;
    addStoryEntry: (newEntryData: { type: 'combat', content: string }) => void;
}

const getAttributeValue = (character: PlayerCharacter | NPC, name: string): number => {
    if ('attributes' in character && character.attributes) {
        return (character.attributes.flatMap(g => g.attributes).find(a => a.name === name)?.value as number) || 10;
    }
    return 10; // Default value if not found
};

const HealthBar: React.FC<{ current: number; max: number }> = ({ current, max }) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    return (
        <div className="w-full bg-black/30 rounded-full h-2.5 border border-gray-700">
            <div className="bg-red-600 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const CombatScreen: React.FC<CombatScreenProps> = ({ gameState, setGameState, showNotification, addStoryEntry }) => {
    const { combatState } = gameState;
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const [isProcessingTurn, setIsProcessingTurn] = useState(false);

    const currentActorId = combatState?.turnOrder[combatState.currentTurnIndex];
    const isPlayerTurn = currentActorId === 'player';

    useEffect(() => {
        if (combatState && combatState.enemies.length > 0) {
            setSelectedTargetId(combatState.enemies[0].id);
        }
    }, []);

    useEffect(() => {
        const processEnemyTurn = async () => {
            if (!isPlayerTurn && combatState && !isProcessingTurn) {
                setIsProcessingTurn(true);
                const enemy = combatState.enemies.find(e => e.id === currentActorId);
                
                if (enemy) {
                    // Simple AI: always attack player
                    const enemyDamage = getAttributeValue(enemy, 'Linh Lực Sát Thương') + getAttributeValue(enemy, 'Lực Lượng');
                    const playerDefense = getAttributeValue(gameState.playerCharacter, 'Bền Bỉ');
                    const damage = Math.max(1, enemyDamage - playerDefense);

                    const narrative = await generateCombatNarrative(gameState, `${enemy.identity.name} tấn công ${gameState.playerCharacter.identity.name}, gây ra ${damage} sát thương.`);
                    addStoryEntry({ type: 'combat', content: narrative });
                    
                    setGameState(gs => {
                        if (!gs) return null;
                        const playerSinhMenhAttr = gs.playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === 'Sinh Mệnh');
                        if (!playerSinhMenhAttr) return gs;
                        
                        const newSinhMenh = (playerSinhMenhAttr.value as number) - damage;

                        const updatedAttributes = gs.playerCharacter.attributes.map(g => ({
                            ...g,
                            attributes: g.attributes.map(a => a.name === 'Sinh Mệnh' ? { ...a, value: newSinhMenh } : a)
                        }));

                        // Advance turn
                        const newIndex = ((gs.combatState?.currentTurnIndex || 0) + 1) % (gs.combatState?.turnOrder.length || 1);
                        
                        return { 
                            ...gs, 
                            playerCharacter: { ...gs.playerCharacter, attributes: updatedAttributes },
                            combatState: gs.combatState ? { ...gs.combatState, currentTurnIndex: newIndex } : null,
                        };
                    });

                }
                setTimeout(() => setIsProcessingTurn(false), 1000); // Cooldown before next turn can process
            }
        };
        processEnemyTurn();
    }, [currentActorId, isPlayerTurn, combatState, gameState, setGameState, addStoryEntry, isProcessingTurn]);


    const handleAttack = async () => {
        if (!isPlayerTurn || !selectedTargetId || isProcessingTurn) return;
        setIsProcessingTurn(true);

        const target = combatState?.enemies.find(e => e.id === selectedTargetId);
        if (!target) {
            setIsProcessingTurn(false);
            return;
        }

        const playerDamage = getAttributeValue(gameState.playerCharacter, 'Linh Lực Sát Thương') + getAttributeValue(gameState.playerCharacter, 'Lực Lượng');
        const targetDefense = getAttributeValue(target, 'Bền Bỉ');
        const damage = Math.max(1, playerDamage - targetDefense);
        
        const narrative = await generateCombatNarrative(gameState, `${gameState.playerCharacter.identity.name} tấn công ${target.identity.name}, gây ra ${damage} sát thương.`);
        addStoryEntry({ type: 'combat', content: narrative });

        setGameState(gs => {
            if (!gs || !gs.combatState) return null;

            let newEnemies = gs.combatState.enemies.map(e => {
                if (e.id === selectedTargetId) {
                    const sinhMenhAttr = e.attributes.flatMap(g => g.attributes).find(a => a.name === 'Sinh Mệnh');
                    const newSinhMenh = (sinhMenhAttr?.value as number) - damage;
                    const updatedAttributes = e.attributes.map(g => ({
                        ...g,
                        attributes: g.attributes.map(a => a.name === 'Sinh Mệnh' ? {...a, value: newSinhMenh} : a)
                    }));
                    return { ...e, attributes: updatedAttributes };
                }
                return e;
            });

            const defeatedEnemy = newEnemies.find(e => e.id === selectedTargetId && (e.attributes.flatMap(g => g.attributes).find(a => a.name === 'Sinh Mệnh')?.value as number) <= 0);

            if (defeatedEnemy) {
                addStoryEntry({ type: 'combat', content: `${defeatedEnemy.identity.name} đã bị đánh bại!` });
                newEnemies = newEnemies.filter(e => e.id !== defeatedEnemy.id);
            }

            if (newEnemies.length === 0) {
                showNotification("Chiến thắng!");
                return { ...gs, combatState: null };
            }
            
            const newTurnOrder = gs.combatState.turnOrder.filter(id => id === 'player' || newEnemies.some(e => e.id === id));
            const newIndex = (gs.combatState.currentTurnIndex + 1) % newTurnOrder.length;

            return {
                ...gs,
                combatState: {
                    ...gs.combatState,
                    enemies: newEnemies,
                    turnOrder: newTurnOrder,
                    currentTurnIndex: newIndex
                }
            };
        });

        setIsProcessingTurn(false);
        if (combatState && combatState.enemies.length > 1 && combatState.enemies.some(e => e.id !== selectedTargetId)) {
            setSelectedTargetId(combatState.enemies.find(e => e.id !== selectedTargetId)?.id || null);
        } else {
            setSelectedTargetId(null);
        }
    };
    
    if (!combatState) return null;

    const playerSinhMenh = gameState.playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === 'Sinh Mệnh');
    
    return (
        <div className="flex-shrink-0 p-4 bg-red-900/20 backdrop-blur-sm border-t-2 border-red-500/50">
            <div className="flex justify-between items-start mb-4">
                {/* Player Info */}
                <div className="w-1/3 text-center p-2 bg-black/20 rounded-lg">
                    <p className="font-semibold text-gray-200">{gameState.playerCharacter.identity.name}</p>
                     {playerSinhMenh && <HealthBar current={playerSinhMenh.value as number} max={playerSinhMenh.maxValue as number} />}
                    {isPlayerTurn && !isProcessingTurn && <p className="text-xs text-amber-300 animate-pulse">Lượt của bạn</p>}
                </div>
                 {/* Enemy Info */}
                 <div className="w-2/3 grid grid-cols-2 gap-2 pl-4">
                    {combatState.enemies.map(enemy => {
                         const enemySinhMenh = enemy.attributes.flatMap(g => g.attributes).find(a => a.name === 'Sinh Mệnh');
                         const isCurrentTurn = currentActorId === enemy.id;
                         return (
                            <div key={enemy.id} onClick={() => setSelectedTargetId(enemy.id)}
                                className={`p-2 bg-black/20 rounded-lg cursor-pointer transition-all duration-200 ${selectedTargetId === enemy.id ? 'border-2 border-amber-400' : 'border-2 border-transparent'}`}>
                                <p className="font-semibold text-gray-200 text-sm truncate">{enemy.identity.name}</p>
                                {enemySinhMenh && <HealthBar current={enemySinhMenh.value as number} max={enemySinhMenh.maxValue as number} />}
                                {isCurrentTurn && <p className="text-xs text-red-400">Lượt của địch</p>}
                            </div>
                         )
                    })}
                </div>
            </div>
            {isProcessingTurn && <div className="text-center"><LoadingSpinner message="Đang xử lý..." size="sm"/></div>}
            <div className="grid grid-cols-2 gap-2">
                <button onClick={handleAttack} disabled={!isPlayerTurn || isProcessingTurn} className="p-3 bg-red-700 text-white font-bold rounded-lg hover:bg-red-600 disabled:bg-gray-600">Tấn Công</button>
                <button disabled={!isPlayerTurn || isProcessingTurn} className="p-3 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-600 disabled:bg-gray-600">Công Pháp</button>
                <button disabled={!isPlayerTurn || isProcessingTurn} className="p-3 bg-green-700 text-white font-bold rounded-lg hover:bg-green-600 disabled:bg-gray-600">Vật Phẩm</button>
                <button disabled={!isPlayerTurn || isProcessingTurn} className="p-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 disabled:bg-gray-500">Bỏ Chạy</button>
            </div>
        </div>
    );
};

export default CombatScreen;
