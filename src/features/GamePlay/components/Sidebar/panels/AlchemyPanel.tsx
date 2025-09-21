import React, { useState, useMemo, memo } from 'react';
import type { PlayerCharacter, AlchemyRecipe, InventoryItem, ItemQuality, StatBonus } from '../../../../../types';
import { ALCHEMY_RECIPES, ITEM_QUALITY_STYLES } from '../../../../../constants';
import { FaFire } from 'react-icons/fa';
import { GiCauldron } from 'react-icons/gi';

interface AlchemyPanelProps {
    playerCharacter: PlayerCharacter;
}

const AlchemyPanel: React.FC<AlchemyPanelProps> = ({ playerCharacter }) => {
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

    const knownRecipes = useMemo(() => {
        return ALCHEMY_RECIPES.filter(recipe => playerCharacter.knownRecipeIds.includes(recipe.id));
    }, [playerCharacter.knownRecipeIds]);

    const selectedRecipe = useMemo(() => {
        return ALCHEMY_RECIPES.find(r => r.id === selectedRecipeId);
    }, [selectedRecipeId]);
    
    const alchemySkillAttr = playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === 'Ngự Khí Thuật');
    const alchemySkillValue = (alchemySkillAttr?.value as number) || 0;

    const availableCauldrons = useMemo(() => {
        return playerCharacter.inventory.items.filter(i => i.type === 'Đan Lô');
    }, [playerCharacter.inventory.items]);

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div>
                <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                    <GiCauldron className="text-amber-300" /> Sổ Tay Đan Phương
                </h3>
                 <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60 mb-4">
                    <p className="text-center text-sm">Ngự Khí Thuật: <span className="font-bold text-amber-300">{alchemySkillValue}</span></p>
                    <p className="text-center text-xs text-gray-400">Đan Lô đang dùng: {availableCauldrons.length > 0 ? availableCauldrons[0].name : 'Không có'}</p>
                </div>
                 <div className="p-3 text-center bg-blue-900/20 border border-blue-600/50 rounded-lg text-blue-200 text-sm mb-4">
                    Dùng lệnh "luyện chế [tên đan dược]" để bắt đầu.
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Recipe List */}
                    <div className="bg-black/20 p-2 rounded-lg border border-gray-700/60">
                        <h4 className="text-md text-gray-400 font-title mb-2 text-center">Đan Phương</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {knownRecipes.length > 0 ? knownRecipes.map(recipe => (
                                <button key={recipe.id} onClick={() => setSelectedRecipeId(recipe.id)}
                                    className={`w-full text-left p-2 rounded-md transition-colors ${selectedRecipeId === recipe.id ? 'bg-amber-500/20 border border-amber-500/50' : 'bg-gray-800/50 hover:bg-gray-700/50'}`}
                                >
                                    <p className="font-semibold text-gray-200">{recipe.icon} {recipe.name}</p>
                                </button>
                            )) : <p className="text-center text-sm text-gray-500 py-4">Chưa học được đan phương nào.</p>}
                        </div>
                    </div>

                    {/* Crafting Details */}
                    <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                        {selectedRecipe ? (
                            <div className="space-y-3">
                                <h4 className="font-bold text-amber-300 text-center">{selectedRecipe.name}</h4>
                                <p className="text-xs text-gray-400 italic text-center">{selectedRecipe.description}</p>
                                <div>
                                    <p className="text-sm text-gray-400">Nguyên liệu cần:</p>
                                    <ul className="list-disc list-inside text-sm text-gray-300">
                                        {selectedRecipe.ingredients.map(ing => {
                                            const playerItem = playerCharacter.inventory.items.find(i => i.name === ing.name);
                                            const hasEnough = playerItem && playerItem.quantity >= ing.quantity;
                                            return <li key={ing.name} className={`${hasEnough ? 'text-green-400' : 'text-red-400'}`}>
                                                {ing.name} ({playerItem?.quantity || 0}/{ing.quantity})
                                            </li>
                                        })}
                                    </ul>
                                </div>
                                <div>
                                     <p className="text-sm text-gray-400">Yêu cầu:</p>
                                     <p className={`text-sm ${alchemySkillValue >= selectedRecipe.requiredAttribute.value ? 'text-green-400' : 'text-red-400'}`}>
                                        - {`${selectedRecipe.requiredAttribute.name} >= ${selectedRecipe.requiredAttribute.value}`}
                                     </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full text-center text-gray-500">
                                <p>Chọn một Đan Phương để xem chi tiết.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(AlchemyPanel);