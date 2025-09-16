import React, { useState, useMemo } from 'react';
import type { GameState, ShopItem, InventoryItem } from '../../../types';
import { SHOPS, ITEM_QUALITY_STYLES } from '../../../constants';
import { FaTimes, FaCoins, FaGem } from 'react-icons/fa';
import { useAppContext } from '../../../contexts/AppContext';
import { useGameUIContext } from '../../../contexts/GameUIContext';

interface ShopModalProps {
    isOpen: boolean;
    shopId: string;
}

const BUY_PRICE_INCREASE = 1.05;
const SELL_PRICE_DECREASE = 0.95;
const MAX_MULTIPLIER = 3.0;
const MIN_MULTIPLIER = 0.2;

const ShopModal: React.FC<ShopModalProps> = ({ isOpen, shopId }) => {
    const { gameState, setGameState } = useAppContext();
    const { showNotification, closeShopModal } = useGameUIContext();
    const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
    
    const shop = useMemo(() => SHOPS.find(s => s.id === shopId), [shopId]);

    if (!isOpen || !shop || !gameState) return null;
    
    const { playerCharacter, shopStates } = gameState;
    const currentShopState = shopStates?.[shopId]?.itemPriceMultipliers || {};

    const handleBuyItem = (item: ShopItem) => {
        const { price, name } = item;
        const playerCurrency = playerCharacter.currencies[price.currencyName] || 0;
        const multiplier = currentShopState[name] || 1.0;
        const finalPrice = Math.ceil(price.amount * multiplier);

        if (playerCurrency < finalPrice) {
            showNotification(`Không đủ ${price.currencyName}!`);
            return;
        }

        setGameState(prev => {
            if (!prev) return null;
            const pc = { ...prev.playerCharacter };
            const newCurrencies = { ...pc.currencies, [price.currencyName]: playerCurrency - finalPrice };
            const newInventoryItems = [...pc.inventory.items];
            const existingItem = newInventoryItems.find(i => i.name === name);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                const { price: itemPrice, stock, ...baseItem } = item;
                const newItem: InventoryItem = { ...baseItem, id: `item-${Date.now()}-${Math.random()}`, quantity: 1, isEquipped: false };
                newInventoryItems.push(newItem);
            }

            // Update price multiplier
            const newShopStates = JSON.parse(JSON.stringify(prev.shopStates || {}));
            if (!newShopStates[shopId]) newShopStates[shopId] = { itemPriceMultipliers: {} };
            const newMultiplier = Math.min(MAX_MULTIPLIER, multiplier * BUY_PRICE_INCREASE);
            newShopStates[shopId].itemPriceMultipliers[name] = newMultiplier;
            
            return { ...prev, playerCharacter: { ...pc, currencies: newCurrencies, inventory: { ...pc.inventory, items: newInventoryItems } }, shopStates: newShopStates };
        });

        showNotification(`Đã mua [${name}]`);
    };
    
    const handleSellItem = (item: InventoryItem) => {
        const multiplier = currentShopState[item.name] || 1.0;
        const sellPrice = Math.floor(((item.value || 10) / 2) * multiplier);
        const currencyName = 'Bạc';

        setGameState(prev => {
            if (!prev) return null;
            const pc = { ...prev.playerCharacter };
            const newCurrencies = { ...pc.currencies, [currencyName]: (pc.currencies[currencyName] || 0) + sellPrice };
            let newInventoryItems = [...pc.inventory.items];
            const itemInInventory = newInventoryItems.find(i => i.id === item.id);
            if (itemInInventory && itemInInventory.quantity > 1) {
                newInventoryItems = newInventoryItems.map(i => i.id === item.id ? { ...i, quantity: i.quantity - 1 } : i);
            } else {
                newInventoryItems = newInventoryItems.filter(i => i.id !== item.id);
            }

            // Update price multiplier
            const newShopStates = JSON.parse(JSON.stringify(prev.shopStates || {}));
            if (!newShopStates[shopId]) newShopStates[shopId] = { itemPriceMultipliers: {} };
            const newMultiplier = Math.max(MIN_MULTIPLIER, multiplier * SELL_PRICE_DECREASE);
            newShopStates[shopId].itemPriceMultipliers[item.name] = newMultiplier;

            return { ...prev, playerCharacter: { ...pc, currencies: newCurrencies, inventory: { ...pc.inventory, items: newInventoryItems } }, shopStates: newShopStates };
        });

        showNotification(`Đã bán [${item.name}] với giá ${sellPrice} ${currencyName}`);
    };

    const sellableItems = playerCharacter.inventory.items.filter(i => !i.isEquipped && i.value);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in" style={{ animationDuration: '300ms' }} onClick={closeShopModal}>
            <div className="themed-modal rounded-lg shadow-2xl shadow-black/50 w-full max-w-4xl m-4 h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold font-title text-amber-300">{shop.name}</h2>
                        <p className="text-sm text-gray-400">{shop.description}</p>
                    </div>
                    <button onClick={closeShopModal} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>

                <div className="p-2 flex-shrink-0 border-b border-gray-700/60">
                     <div className="flex justify-between items-center mb-2 px-2">
                        <h3 className="text-lg font-semibold text-gray-300">Giao Dịch</h3>
                        <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-yellow-400" title="Bạc">
                                <FaCoins />
                                <span>{playerCharacter.currencies['Bạc']?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center gap-2 text-green-400" title="Linh thạch hạ phẩm">
                                <FaGem />
                                <span>{playerCharacter.currencies['Linh thạch hạ phẩm']?.toLocaleString() || 0}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-1 p-1 bg-black/20 rounded-lg border border-gray-700/60">
                        <button onClick={() => setActiveTab('buy')} className={`w-1/2 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'buy' ? 'bg-gray-700/80 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}>Mua Vật Phẩm</button>
                        <button onClick={() => setActiveTab('sell')} className={`w-1/2 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'sell' ? 'bg-gray-700/80 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}>Bán Vật Phẩm</button>
                    </div>
                </div>
                
                <div className="flex-grow p-4 overflow-y-auto">
                    {activeTab === 'buy' && (
                        <div className="space-y-3">
                            {shop.inventory.map((item, index) => {
                                const multiplier = currentShopState[item.name] || 1.0;
                                const finalPrice = Math.ceil(item.price.amount * multiplier);
                                return (
                                <div key={index} className="bg-black/20 p-3 rounded-lg border border-gray-700/60 flex justify-between items-center">
                                    <div>
                                        <h4 className={`font-bold font-title ${ITEM_QUALITY_STYLES[item.quality].color}`}>{item.name}</h4>
                                        <p className="text-xs text-gray-400">{item.description}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <p className={`font-semibold text-amber-300 ${multiplier > 1.05 ? 'text-red-400' : multiplier < 0.95 ? 'text-green-400' : ''}`}>
                                            {finalPrice.toLocaleString()} {item.price.currencyName}
                                        </p>
                                        <button onClick={() => handleBuyItem(item)} className="mt-1 px-4 py-1 bg-teal-700/80 text-white text-sm font-bold rounded-lg hover:bg-teal-600/80">Mua</button>
                                    </div>
                                </div>
                                )
                            })}
                        </div>
                    )}
                    {activeTab === 'sell' && (
                         <div className="space-y-3">
                            {sellableItems.length > 0 ? sellableItems.map((item) => {
                                const multiplier = currentShopState[item.name] || 1.0;
                                const sellPrice = Math.floor(((item.value || 10) / 2) * multiplier);
                                return (
                                <div key={item.id} className="bg-black/20 p-3 rounded-lg border border-gray-700/60 flex justify-between items-center">
                                    <div>
                                        <h4 className={`font-bold font-title ${ITEM_QUALITY_STYLES[item.quality].color}`}>{item.name} <span className="text-xs text-gray-500">x{item.quantity}</span></h4>
                                        <p className="text-xs text-gray-400">{item.description}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0 ml-4">
                                        <p className={`font-semibold text-yellow-300 ${multiplier > 1.05 ? 'text-red-400' : multiplier < 0.95 ? 'text-green-400' : ''}`}>Giá: {sellPrice.toLocaleString()} Bạc</p>
                                        <button onClick={() => handleSellItem(item)} className="mt-1 px-4 py-1 bg-yellow-700/80 text-white text-sm font-bold rounded-lg hover:bg-yellow-600/80">Bán</button>
                                    </div>
                                </div>
                                )
                            }) : <p className="text-center text-gray-500">Không có vật phẩm nào để bán.</p>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShopModal;