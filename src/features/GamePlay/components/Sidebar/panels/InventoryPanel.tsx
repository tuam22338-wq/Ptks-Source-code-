import React, { useState, useMemo, memo } from 'react';
import type { PlayerCharacter, InventoryItem, EquipmentSlot, StatBonus, AttributeGroup } from '../../../../../types';
import { ITEM_QUALITY_STYLES, EQUIPMENT_SLOTS } from '../../../../../constants';
import { GiWeight, GiSwapBag, GiPerson } from "react-icons/gi";
import { FaTimes } from 'react-icons/fa';

interface InventoryPanelProps {
    playerCharacter: PlayerCharacter;
    setPlayerCharacter: (updater: (pc: PlayerCharacter) => PlayerCharacter) => void;
    showNotification: (message: string) => void;
}

// Helper to deep copy attributes without losing non-serializable icon components
const deepCopyAttributes = (attributeGroups: AttributeGroup[]): AttributeGroup[] => {
    return attributeGroups.map(group => ({
        ...group,
        attributes: group.attributes.map(attr => ({ ...attr })),
    }));
};

const applyBonuses = (pc: PlayerCharacter, bonuses: StatBonus[], operation: 'add' | 'subtract'): PlayerCharacter => {
    const newAttributes = deepCopyAttributes(pc.attributes);
    const multiplier = operation === 'add' ? 1 : -1;

    bonuses.forEach(bonus => {
        for (const group of newAttributes) {
            const attr = group.attributes.find(a => a.name === bonus.attribute);
            if (attr && typeof attr.value === 'number') {
                const newValue = (attr.value as number) + (bonus.value * multiplier);
                attr.value = newValue;
                if (attr.maxValue !== undefined) {
                    const newMaxValue = (attr.maxValue as number) + (bonus.value * multiplier);
                    attr.maxValue = newMaxValue;
                    // Ensure current value doesn't exceed new max value on unequip
                    if (operation === 'subtract' && attr.value > newMaxValue) {
                        attr.value = newMaxValue;
                    }
                }
                break;
            }
        }
    });
    return { ...pc, attributes: newAttributes };
};

const ItemDetailModal: React.FC<{
    item: InventoryItem;
    onClose: () => void;
    onEquip: (item: InventoryItem) => void;
    onUnequip: (slot: EquipmentSlot) => void;
    onUse: (item: InventoryItem) => void;
    onDrop: (item: InventoryItem) => void;
}> = ({ item, onClose, onEquip, onUnequip, onUse, onDrop }) => {
    const qualityStyle = ITEM_QUALITY_STYLES[item.quality] || ITEM_QUALITY_STYLES['Phàm Phẩm'];
    const canUse = item.type === 'Đan Dược' || item.type === 'Đan Phương';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }} onClick={onClose}>
            <div className="bg-gray-900/95 border border-amber-500/50 rounded-lg shadow-2xl shadow-black/50 w-full max-w-sm m-4" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <div>
                         <h3 className={`text-xl font-bold font-title ${qualityStyle.color}`}>{item.name}</h3>
                         <p className="text-xs text-gray-400">{item.type} - {item.quality}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>
                <div className="p-4 space-y-3">
                    <p className="text-sm text-gray-300 italic">{item.description}</p>
                    <div className="text-xs flex justify-between text-gray-400">
                        <p>Số lượng: {item.quantity}</p>
                        <p>Trọng lượng: {item.weight.toFixed(1)}</p>
                    </div>
                    {item.bonuses && item.bonuses.length > 0 && (
                         <div className="border-t border-gray-700/50 pt-2 space-y-1">
                            <h4 className="text-sm font-semibold text-gray-300">Thuộc tính:</h4>
                            {item.bonuses.map((bonus, i) => (
                                <p key={i} className="text-sm text-teal-300">
                                    {bonus.attribute} <span className="font-semibold">{bonus.value > 0 ? `+${bonus.value}` : bonus.value}</span>
                                </p>
                            ))}
                        </div>
                    )}
                </div>
                <div className="p-3 bg-black/20 grid grid-cols-2 gap-2">
                    {item.slot && (
                        item.isEquipped
                        ? <button onClick={() => { onUnequip(item.slot!); onClose(); }} className="px-4 py-2 bg-yellow-700/80 text-white font-bold rounded-lg hover:bg-yellow-600/80">Tháo Ra</button>
                        : <button onClick={() => { onEquip(item); onClose(); }} className="px-4 py-2 bg-green-700/80 text-white font-bold rounded-lg hover:bg-green-600/80">Trang Bị</button>
                    )}
                    {canUse && <button onClick={() => { onUse(item); onClose(); }} className="px-4 py-2 bg-blue-700/80 text-white font-bold rounded-lg hover:bg-blue-600/80">{item.type === 'Đan Phương' ? 'Học' : 'Sử Dụng'}</button>}
                    <button onClick={() => { onDrop(item); onClose(); }} className="px-4 py-2 bg-red-800/80 text-white font-bold rounded-lg hover:bg-red-700/80 col-span-full">Vứt Bỏ</button>
                </div>
            </div>
        </div>
    );
};

const InventoryPanel: React.FC<InventoryPanelProps> = ({ playerCharacter, setPlayerCharacter, showNotification }) => {
    const [activeTab, setActiveTab] = useState<'inventory' | 'equipment'>('inventory');
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    const currentWeight = useMemo(() => {
        return playerCharacter.inventory.items.reduce((total, item) => total + (item.weight * item.quantity), 0);
    }, [playerCharacter.inventory.items]);

    const handleEquip = (itemToEquip: InventoryItem) => {
        setPlayerCharacter(pc => {
            let newPc = { ...pc };
            const slot = itemToEquip.slot;
            if (!slot) return pc;
    
            let newInventoryItems = [...newPc.inventory.items];
            let newEquipment = { ...newPc.equipment };
    
            const currentItemInSlot = newEquipment[slot];
            if (currentItemInSlot) {
                newInventoryItems.push({ ...currentItemInSlot, isEquipped: false });
                if (currentItemInSlot.bonuses) {
                    newPc = applyBonuses(newPc, currentItemInSlot.bonuses, 'subtract');
                }
            }
            
            newInventoryItems = newInventoryItems.filter(i => i.id !== itemToEquip.id);
            
            newEquipment[slot] = { ...itemToEquip, isEquipped: true };
            if (itemToEquip.bonuses) {
                newPc = applyBonuses(newPc, itemToEquip.bonuses, 'add');
            }
    
            newPc.inventory.items = newInventoryItems;
            newPc.equipment = newEquipment;
            return newPc;
        });
    };
    
    const handleUnequip = (slot: EquipmentSlot) => {
        setPlayerCharacter(pc => {
            let newPc = { ...pc };
            const itemToUnequip = newPc.equipment[slot];
            if (!itemToUnequip) return pc;
    
            if (itemToUnequip.bonuses) {
                newPc = applyBonuses(newPc, itemToUnequip.bonuses, 'subtract');
            }
    
            const newInventoryItems = [...newPc.inventory.items, { ...itemToUnequip, isEquipped: false }];
            
            const newEquipment = { ...newPc.equipment };
            newEquipment[slot] = null;
            
            newPc.inventory.items = newInventoryItems;
            newPc.equipment = newEquipment;
            return newPc;
        });
    };

    const handleDrop = (itemToDrop: InventoryItem) => {
        if (itemToDrop.isEquipped && itemToDrop.slot) {
            handleUnequip(itemToDrop.slot);
        }
        setPlayerCharacter(pc => ({
            ...pc,
            inventory: {
                ...pc.inventory,
                items: pc.inventory.items.filter(i => i.id !== itemToDrop.id)
            }
        }));
    };
    
    const handleUse = (itemToUse: InventoryItem) => {
        if (itemToUse.type === 'Đan Phương') {
            if (itemToUse.recipeId) {
                setPlayerCharacter(pc => {
                    if (pc.knownRecipeIds.includes(itemToUse.recipeId!)) {
                        showNotification("Bạn đã học đan phương này rồi.");
                        return pc;
                    }
                    showNotification(`Đã học được [${itemToUse.name}]!`);
                    // Consume item
                     const newItems = pc.inventory.items.map(i => 
                        i.id === itemToUse.id ? { ...i, quantity: i.quantity - 1 } : i
                    ).filter(i => i.quantity > 0);

                    return {
                        ...pc,
                        knownRecipeIds: [...pc.knownRecipeIds, itemToUse.recipeId!],
                        inventory: {...pc.inventory, items: newItems}
                    };
                });
            }
        } else if (itemToUse.type === 'Đan Dược') {
             // Implement item usage logic here, e.g., healing potions.
            console.log("Using item:", itemToUse.name);
            showNotification(`Đã sử dụng ${itemToUse.name}`);
            // For now, just remove one from stack
            setPlayerCharacter(pc => {
                const newItems = pc.inventory.items.map(i => 
                    i.id === itemToUse.id ? { ...i, quantity: i.quantity - 1 } : i
                ).filter(i => i.quantity > 0);
                return {...pc, inventory: {...pc.inventory, items: newItems}};
            });
        }
    };
    
    const weightPercentage = (currentWeight / playerCharacter.inventory.weightCapacity) * 100;

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            {selectedItem && (
                <ItemDetailModal 
                    item={selectedItem} 
                    onClose={() => setSelectedItem(null)} 
                    onEquip={handleEquip}
                    onUnequip={handleUnequip}
                    onUse={handleUse}
                    onDrop={handleDrop}
                />
            )}
             <div>
                 <h3 className="text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">Hành Trang</h3>
                <div className="flex items-center gap-1 p-1 bg-black/20 rounded-lg border border-gray-700/60 mb-4">
                     <button onClick={() => setActiveTab('inventory')} className={`w-1/2 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-bold rounded-md transition-colors ${activeTab === 'inventory' ? 'bg-gray-700/80 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}>
                        <GiSwapBag/> Túi Đồ
                    </button>
                    <button onClick={() => setActiveTab('equipment')} className={`w-1/2 flex items-center justify-center gap-2 py-2 text-xs sm:text-sm font-bold rounded-md transition-colors ${activeTab === 'equipment' ? 'bg-gray-700/80 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}>
                        <GiPerson/> Trang Bị
                    </button>
                </div>
                
                 <div className="w-full bg-black/30 p-2 rounded-lg border border-gray-700/60 space-y-1 mb-4">
                     <div className="flex justify-between items-baseline text-xs">
                         <div className="flex items-center gap-1 text-gray-300"><GiWeight /> <span>Trọng lượng</span></div>
                         <span className="font-mono">{currentWeight.toFixed(1)} / {playerCharacter.inventory.weightCapacity.toFixed(1)}</span>
                     </div>
                     <div className="w-full bg-black/40 rounded-full h-1.5 border border-gray-800">
                         <div className={`h-1 rounded-full transition-all duration-300 ${weightPercentage > 90 ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${weightPercentage}%` }}></div>
                     </div>
                </div>

                {activeTab === 'inventory' && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                        {playerCharacter.inventory.items.map(item => (
                            <div key={item.id} onClick={() => setSelectedItem(item)} className="relative aspect-square bg-black/30 border-2 border-gray-600 rounded-md flex items-center justify-center p-1 cursor-pointer hover:border-amber-400/70 transition-colors">
                                <span className="text-3xl select-none" role="img">{item.icon || '📜'}</span>
                                {item.quantity > 1 && <span className="absolute bottom-0 right-0 text-xs font-bold bg-gray-900/80 text-white px-1 rounded-sm">{item.quantity}</span>}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'equipment' && (
                    <div className="space-y-2">
                    {Object.keys(EQUIPMENT_SLOTS).map((slotKey) => {
                        const slot = slotKey as EquipmentSlot;
                        const slotInfo = EQUIPMENT_SLOTS[slot];
                        const item = playerCharacter.equipment[slot];
                        return (
                            <div key={slot} className="flex items-center gap-3 bg-black/20 p-2 rounded-lg border border-gray-700/60">
                                <div className="w-14 h-14 bg-black/30 border-2 border-gray-600 rounded-md flex items-center justify-center text-3xl flex-shrink-0">
                                    {item ? item.icon : <span className="text-gray-600 text-lg">{slotInfo.label.charAt(0)}</span>}
                                </div>
                                <div className="flex-grow">
                                    <p className="text-sm text-gray-500">{slotInfo.label}</p>
                                    {item ? (
                                        <button onClick={() => setSelectedItem(item)} className="font-bold text-lg font-title text-amber-300 hover:underline">{item.name}</button>
                                    ) : (
                                        <p className="text-gray-400 italic">-- Trống --</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    </div>
                )}
             </div>
        </div>
    );
};

export default memo(InventoryPanel);