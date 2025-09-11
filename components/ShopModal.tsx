import React, { useState } from 'react';
import type { GameState, InventoryItem, Shop, ShopItem } from '../types';
// FIX: Added SHOPS to imports, which will be added to constants.ts to resolve module export error.
import { SHOPS } from '../constants';
import { ITEM_QUALITY_STYLES } from '../constants';
import { FaTimes, FaCoins, FaGem } from 'react-icons/fa';

interface ShopModalProps {
    shopId: string;
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    showNotification: (message: string) => void;
    onClose: () => void;
}

const ShopModal: React.FC<ShopModalProps> = ({ shopId, gameState, setGameState, showNotification, onClose }) => {
    const shopData = SHOPS.find(s => s.id === shopId);
    const { playerCharacter } = gameState;

    const handleBuyItem = (item: ShopItem) => {
        const { currency, amount } = item.price;
        const playerCurrency = playerCharacter.currencies[currency] || 0;

        if (playerCurrency < amount) {
            showNotification(`Không đủ ${currency}!`);
            return;
        }
        
        // Check weight
        const currentWeight = playerCharacter.inventory.items.reduce((total, i) => total + (i.weight * i.quantity), 0);
        if (currentWeight + item.weight > playerCharacter.inventory.weightCapacity) {
             showNotification(`Túi đồ đã đầy, không thể mang thêm!`);
            return;
        }

        setGameState(prev => {
            if (!prev) return null;

            const { playerCharacter } = prev;

            // Subtract currency
            const newCurrencies = {
                ...playerCharacter.currencies,
                [currency]: playerCurrency - amount
            };

            // Add item
            const existingItem = playerCharacter.inventory.items.find(i => i.name === item.name);
            let newItems: InventoryItem[];

            if (existingItem) {
                newItems = playerCharacter.inventory.items.map(i => 
                    i.name === item.name ? { ...i, quantity: i.quantity + 1 } : i
                );
            } else {
                const newItem: InventoryItem = {
                    id: `item-${Date.now()}-${Math.random()}`,
                    name: item.name,
                    description: item.description,
                    quantity: 1,
                    type: item.type,
                    rank: item.rank,
                    icon: item.icon,
                    bonuses: item.bonuses,
                    weight: item.weight,
                    quality: item.quality,
                    value: item.value,
                    slot: item.slot,
                };
                newItems = [...playerCharacter.inventory.items, newItem];
            }
            
            return {
                ...prev,
                playerCharacter: {
                    ...playerCharacter,
                    currencies: newCurrencies,
                    inventory: {
                        ...playerCharacter.inventory,
                        items: newItems
                    }
                }
            };
        });
        
        showNotification(`Đã mua [${item.name}]!`);
    };

    if (!shopData) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
                <div className="bg-gray-900 p-4 rounded-lg">Không tìm thấy cửa hàng!</div>
            </div>
        );
    }
    
    const CurrencyIcon: React.FC<{ currency: string }> = ({ currency }) => {
        if (currency === 'Bạc') return <FaCoins className="w-4 h-4 text-yellow-400" />;
        if (currency.includes('Linh thạch')) return <FaGem className="w-4 h-4 text-green-400" />;
        return null;
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }} onClick={onClose}>
            <div className="themed-modal rounded-lg shadow-2xl shadow-black/50 w-full max-w-2xl m-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl text-[var(--primary-accent-color)] font-bold font-title">{shopData.name}</h3>
                        <p className="text-sm text-gray-400">{shopData.description}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>
                
                <div className="p-4 space-y-3 overflow-y-auto">
                    {shopData.inventory.map((item, index) => {
                        const qualityStyle = ITEM_QUALITY_STYLES[item.quality];
                        return (
                             <div key={index} className="bg-black/20 p-3 rounded-lg border border-gray-700/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{item.icon}</span>
                                        <div>
                                            <h4 className={`font-bold font-title ${qualityStyle.color}`}>{item.name}</h4>
                                            <p className="text-xs text-gray-400">{item.description}</p>
                                        </div>
                                    </div>
                                    {item.bonuses && (
                                        <div className="mt-2 text-xs text-teal-300">
                                            {item.bonuses.map(b => `${b.attribute} ${b.value > 0 ? `+${b.value}`: b.value}`).join(', ')}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-shrink-0 w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between gap-2">
                                    <div className="flex items-center gap-2 font-semibold">
                                        <CurrencyIcon currency={item.price.currency} />
                                        <span>{item.price.amount.toLocaleString()}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleBuyItem(item)}
                                        className="px-4 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 transition-colors"
                                    >
                                        Mua
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default ShopModal;
