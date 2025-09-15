import React, { useState, useMemo, memo } from 'react';
import type { PlayerCharacter, AlchemyRecipe, InventoryItem, ItemQuality, StatBonus } from '../../../../../types';
import { ALCHEMY_RECIPES, ITEM_QUALITY_STYLES } from '../../../../../constants';
import { FaFire } from 'react-icons/fa';
import { GiCauldron } from 'react-icons/gi';

interface AlchemyPanelProps {
    playerCharacter: PlayerCharacter;
    setPlayerCharacter: (updater: (pc: PlayerCharacter) => PlayerCharacter) => void;
    showNotification: (message: string) => void;
}

const AlchemyPanel: React.FC<AlchemyPanelProps> = ({ playerCharacter, setPlayerCharacter, showNotification }) => {
    const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
    const [isCrafting, setIsCrafting] = useState(false);

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

    const handleCraft = () => {
        if (!selectedRecipe || isCrafting) return;

        // 1. Check Cauldron
        if (availableCauldrons.length === 0) {
            showNotification("Cần có Đan Lô để luyện đan!");
            return;
        }

        // 2. Check Ingredients
        const missingIngredients = selectedRecipe.ingredients.filter(ing => {
            const playerItem = playerCharacter.inventory.items.find(i => i.name === ing.name);
            return !playerItem || playerItem.quantity < ing.quantity;
        });

        if (missingIngredients.length > 0) {
            showNotification(`Thiếu nguyên liệu: ${missingIngredients.map(i => i.name).join(', ')}`);
            return;
        }

        // 3. Check Skill
        if (alchemySkillValue < selectedRecipe.requiredAttribute.value) {
            showNotification(`Ngự Khí Thuật không đủ! Yêu cầu: ${selectedRecipe.requiredAttribute.value}`);
            return;
        }
        
        setIsCrafting(true);

        setTimeout(() => {
            // 4. Calculate Success & Quality
            const skillDifference = alchemySkillValue - selectedRecipe.requiredAttribute.value;
            const successChance = Math.min(0.98, 0.6 + skillDifference * 0.02); // 60% base, +2% per skill point over req
            const didSucceed = Math.random() < successChance;

            if (didSucceed) {
                let quality: ItemQuality = 'Phàm Phẩm';
                const qualityRoll = Math.random() * (alchemySkillValue + 20); // Roll influenced by skill
                for (const curve of selectedRecipe.qualityCurve) {
                    if (qualityRoll >= curve.threshold) {
                        quality = curve.quality;
                        break;
                    }
                }

                setPlayerCharacter(pc => {
                    // Consume ingredients
                    let newItems = [...pc.inventory.items];
                    selectedRecipe.ingredients.forEach(ing => {
                        newItems = newItems.map(i => i.name === ing.name ? { ...i, quantity: i.quantity - ing.quantity } : i);
                    });
                    newItems = newItems.filter(i => i.quantity > 0);

                    // Add result
                    const resultItem = pc.inventory.items.find(i => i.name === selectedRecipe.result.name);
                    if (resultItem) {
                        newItems = newItems.map(i => i.name === selectedRecipe.result.name ? {...i, quantity: i.quantity + selectedRecipe.result.quantity} : i);
                    } else {
                        // This part needs the item's full definition. For simplicity, we assume it's findable or pre-defined elsewhere.
                        // A more robust system would fetch item templates. For now, we create a basic version.
                        const newItem: InventoryItem = {
                            id: `item-${Date.now()}`,
                            name: selectedRecipe.result.name,
                            description: `Một viên ${selectedRecipe.result.name}.`,
                            quantity: selectedRecipe.result.quantity,
                            type: 'Đan Dược',
                            icon: selectedRecipe.icon,
                            quality: quality,
                            weight: 0.1, // default weight
                        }
                        newItems.push(newItem);
                    }
                    
                    return { ...pc, inventory: { ...pc.inventory, items: newItems } };
                });
                showNotification(`Luyện chế thành công [${selectedRecipe.result.name} - ${quality}]!`);

            } else {
                // Failure - consume ingredients
                setPlayerCharacter(pc => {
                    let newItems = [...pc.inventory.items];
                    selectedRecipe.ingredients.forEach(ing => {
                        newItems = newItems.map(i => i.name === ing.name ? { ...i, quantity: i.quantity - ing.quantity } : i);
                    });
                    newItems = newItems.filter(i => i.quantity > 0);
                    return { ...pc, inventory: { ...pc.inventory, items: newItems } };
                });
                showNotification("Luyện chế thất bại, nguyên liệu đã bị hủy!");
            }
            setIsCrafting(false);

        }, 2000); // Crafting animation time
    };


    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div>
                <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                    <GiCauldron className="text-amber-300" /> Luyện Đan
                </h3>
                 <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60 mb-4">
                    <p className="text-center text-sm">Ngự Khí Thuật: <span className="font-bold text-amber-300">{alchemySkillValue}</span></p>
                    <p className="text-center text-xs text-gray-400">Đan Lô đang dùng: {availableCauldrons.length > 0 ? availableCauldrons[0].name : 'Không có'}</p>
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
                                <button onClick={handleCraft} disabled={isCrafting} className="w-full flex items-center justify-center gap-2 font-bold py-2 px-4 rounded transition-colors bg-red-800 hover:bg-red-700 text-white disabled:bg-gray-600">
                                    {isCrafting ? 'Đang Luyện...' : <><FaFire /> Luyện Chế</>}
                                </button>
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