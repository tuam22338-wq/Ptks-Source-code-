import React, { useState } from 'react';
import type { GameState } from '../types';

interface CombatScreenProps {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    showNotification: (message: string) => void;
}

const CombatScreen: React.FC<CombatScreenProps> = ({ gameState, setGameState, showNotification }) => {
    const { combatState, playerCharacter } = gameState;
    if (!combatState) return null;
    
    const handleAttack = () => {
        // Dummy combat logic for now
        showNotification(`${playerCharacter.identity.name} attacks!`);
        // In a real implementation, this would update combatState and advance the turn
    };

    return (
        <div className="flex-shrink-0 p-4 bg-red-900/20 backdrop-blur-sm border-t-2 border-red-500/50">
            <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-red-400 font-title">CHIẾN ĐẤU!</h2>
                <div className="flex justify-around mt-2">
                    {combatState.enemies.map(enemy => (
                        <div key={enemy.id} className="text-center">
                            <p className="font-semibold text-gray-200">{enemy.identity.name}</p>
                            <p className="text-sm text-red-400">HP: ???/???</p>
                        </div>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={handleAttack} className="p-3 bg-red-700 text-white font-bold rounded-lg hover:bg-red-600">Tấn Công</button>
                <button className="p-3 bg-blue-700 text-white font-bold rounded-lg hover:bg-blue-600">Công Pháp</button>
                <button className="p-3 bg-green-700 text-white font-bold rounded-lg hover:bg-green-600">Vật Phẩm</button>
                <button className="p-3 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500">Bỏ Chạy</button>
            </div>
        </div>
    );
};

export default CombatScreen;
