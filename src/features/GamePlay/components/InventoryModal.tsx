

import React, { useState, useMemo, useCallback } from 'react';
import type { GameState, InventoryItem, EquipmentSlot, StatBonus, PlayerCharacter } from '../../../types';
import { ITEM_QUALITY_STYLES, EQUIPMENT_SLOTS } from '../../../constants';
import { GiWeight, GiSwapBag, GiPerson, GiBroadsword, GiChestArmor, GiLegArmor, GiBoots, GiRing, GiNecklace } from "react-icons/gi";
import { FaTimes } from 'react-icons/fa';

interface InventoryModalProps {
    isOpen: boolean;
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    showNotification: (message: string) => void;
    onClose: () => void;
}

const EQUIPMENT_SLOT_ICONS: Record<EquipmentSlot, React.ElementType> = {
    'Vũ Khí': GiBroadsword,
    'Thượng Y': GiChestArmor,
    'Hạ Y': GiLegArmor,
    'Giày': GiBoots,
    'Phụ Kiện 1': GiRing,
    'Phụ Kiện 2': GiNecklace,
};

const deepCopyAttributes = (attributeGroups: PlayerCharacter['attributes']): PlayerCharacter['attributes'] => {
    return attributeGroups.map(group => ({
        ...group,
        attributes: group.attributes.map(attr => ({ ...attr })),
    }));
};

const applyBonuses = (pc: PlayerCharacter, bonuses: StatBonus[], operation: 'add' | 'subtract'): PlayerCharacter['attributes'] => {
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
                    if (operation === 'subtract' && attr.value > newMaxValue) {
                        attr.value = newMaxValue;
                    }
                }
                break;
            }
        }
    });
    return newAttributes;
};

const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, gameState, setGameState, showNotification, onClose }) => {
    const { playerCharacter } = gameState;
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

    const currentWeight = useMemo(() => {
        return playerCharacter.inventory.items.reduce((total, item) => total + (item.weight * item.quantity), 0);
    }, [playerCharacter.inventory.items]);

    const handleEquip = useCallback((itemToEquip: InventoryItem) => {
        setGameState(pcState => {
            if (!pcState) return null;
            let { playerCharacter: pc } = pcState;
            const slot = itemToEquip.slot;
            if (!slot) return pcState;

            let newInventoryItems = [...pc.inventory.items];
            let newEquipment = { ...pc.equipment };

            const currentItemInSlot = newEquipment[slot];
            if (currentItemInSlot) {
                newInventoryItems.push({ ...currentItemInSlot, isEquipped: false });
                if (currentItemInSlot.bonuses) {
                    pc = { ...pc, attributes: applyBonuses(pc, currentItemInSlot.bonuses, 'subtract') };
                }
            }
            
            newInventoryItems = newInventoryItems.filter(i => i.id !== itemToEquip.id);
            
            newEquipment[slot] = { ...itemToEquip, quantity: 1, isEquipped: true };
            if (itemToEquip.bonuses) {
                pc = { ...pc, attributes: applyBonuses(pc, itemToEquip.bonuses, 'add') };
            }
            
            if (itemToEquip.quantity > 1) {
                newInventoryItems.push({ ...itemToEquip, quantity: itemToEquip.quantity - 1, isEquipped: false });
            }

            const logMessage = `- Trang bị [${itemToEquip.name}].`;
            
            return {
                ...pcState,
                playerCharacter: {
                    ...pc,
                    inventory: { ...pc.inventory, items: newInventoryItems },
                    equipment: newEquipment,
                    inventoryActionLog: [...pc.inventoryActionLog, logMessage],
                }
            };
        });
        showNotification(`Đã trang bị [${itemToEquip.name}]`);
        setSelectedItem(null);
    }, [setGameState, showNotification]);
    
    const handleUnequip = useCallback((slot: EquipmentSlot) => {
        setGameState(pcState => {
            if (!pcState) return null;
            let { playerCharacter: pc } = pcState;
            const itemToUnequip = pc.equipment[slot];
            if (!itemToUnequip) return pcState;
    
            if (itemToUnequip.bonuses) {
                 pc = { ...pc, attributes: applyBonuses(pc, itemToUnequip.bonuses, 'subtract') };
            }
    
            const existingStack = pc.inventory.items.find(i => i.name === itemToUnequip.name && !i.isEquipped);
            let newInventoryItems;
            if (existingStack) {
                newInventoryItems = pc.inventory.items.map(i => i.id === existingStack.id ? {...i, quantity: i.quantity + 1} : i);
            } else {
                newInventoryItems = [...pc.inventory.items, { ...itemToUnequip, isEquipped: false, quantity: 1 }];
            }
            
            const newEquipment = { ...pc.equipment };
            newEquipment[slot] = null;
            
            const logMessage = `- Tháo [${itemToUnequip.name}].`;

            return {
                ...pcState,
                playerCharacter: {
                    ...pc,
                    inventory: { ...pc.inventory, items: newInventoryItems },
                    equipment: newEquipment,
                    inventoryActionLog: [...pc.inventoryActionLog, logMessage],
                }
            };
        });
         showNotification(`Đã tháo [${playerCharacter.equipment[slot]?.name}]`);
         setSelectedItem(null);
    }, [playerCharacter.equipment, setGameState, showNotification]);

    const handleDrop = useCallback((itemToDrop: InventoryItem) => {
        if (!window.confirm(`Bạn có chắc muốn vứt bỏ ${itemToDrop.name}?`)) return;
        
        setGameState(pcState => {
             if (!pcState) return null;
             let { playerCharacter: pc } = pcState;
             const logMessage = `- Vứt bỏ [${itemToDrop.name}].`;

             return {
                ...pcState,
                playerCharacter: {
                    ...pc,
                    inventory: {
                        ...pc.inventory,
                        items: pc.inventory.items.filter(i => i.id !== itemToDrop.id)
                    },
                    inventoryActionLog: [...pc.inventoryActionLog, logMessage],
                }
             };
        });
        showNotification(`Đã vứt bỏ [${itemToDrop.name}]`);
        setSelectedItem(null);
    }, [setGameState, showNotification]);
    
    const handleUse = useCallback((itemToUse: InventoryItem) => {
        let actionMessage = '';
        if (itemToUse.type === 'Đan Phương') {
            if (itemToUse.recipeId && !playerCharacter.knownRecipeIds.includes(itemToUse.recipeId)) {
                actionMessage = `Đã học được [${itemToUse.name}]!`;
            } else {
                showNotification("Bạn đã học đan phương này rồi.");
                return;
            }
        } else if (itemToUse.type === 'Đan Dược') {
            actionMessage = `Đã sử dụng [${itemToUse.name}].`;
            // Add actual effect logic here in the future
        }

        setGameState(pcState => {
            if (!pcState) return null;
            let { playerCharacter: pc } = pcState;
            let newItems = pc.inventory.items;
            let newKnownRecipes = pc.knownRecipeIds;

            if (itemToUse.type === 'Đan Phương' && itemToUse.recipeId) {
                newKnownRecipes = [...pc.knownRecipeIds, itemToUse.recipeId];
            }
            
            const itemInInventory = newItems.find(i => i.id === itemToUse.id);
            if(itemInInventory && itemInInventory.quantity > 1) {
                newItems = newItems.map(i => i.id === itemToUse.id ? { ...i, quantity: i.quantity - 1 } : i);
            } else {
                newItems = newItems.filter(i => i.id !== itemToUse.id);
            }
            
            const logMessage = `- Sử dụng [${itemToUse.name}].`;

            return {
                ...pcState,
                playerCharacter: {
                    ...pc,
                    knownRecipeIds: newKnownRecipes,
                    inventory: {...pc.inventory, items: newItems},
                    inventoryActionLog: [...pc.inventoryActionLog, logMessage],
                }
            };
        });

        showNotification(actionMessage);
        setSelectedItem(null);
    }, [playerCharacter.knownRecipeIds, setGameState, showNotification]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }} onClick={() => { setSelectedItem(null); onClose(); }}>
            <div className="themed-modal rounded-lg shadow-2xl shadow-black/50 w-full max-w-4xl m-4 h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-2xl text-[var(--primary-accent-color)] font-bold font-title">Túi Càn Khôn</h3>
                    <button onClick={() => { setSelectedItem(null); onClose(); }} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>
                
                <div className="flex-grow flex p-4 gap-4 min-h-0">
                    {/* Equipment Panel */}
                    <div className="w-1/3 flex-shrink-0 flex flex-col gap-3">
                         {Object.keys(EQUIPMENT_SLOTS).map((slotKey) => {
                            const slot = slotKey as EquipmentSlot;
                            const slotInfo = EQUIPMENT_SLOTS[slot];
                            const item = playerCharacter.equipment[slot];
                            const Icon = EQUIPMENT_SLOT_ICONS[slot];
                            return (
                                <div key={slot} onClick={() => item && handleUnequip(slot)} title={item ? 'Nhấn để tháo' : ''} className="flex items-center gap-3 bg-black/20 p-2 rounded-lg border border-gray-700/60 h-1/6 cursor-pointer hover:border-amber-400/50">
                                    <div className="w-14 h-full bg-black/30 border border-gray-600 rounded-md flex items-center justify-center text-3xl flex-shrink-0">
                                        {item ? <span className="text-4xl">{item.icon}</span> : <Icon className="text-gray-600" />}
                                    </div>
                                    <div className="flex-grow truncate">
                                        <p className="text-sm text-gray-500">{slotInfo.label}</p>
                                        {item ? (
                                            <p className={`font-bold font-title truncate ${ITEM_QUALITY_STYLES[item.quality].color}`}>{item.name}</p>
                                        ) : (
                                            <p className="text-gray-400 italic">-- Trống --</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Inventory Panel */}
                    <div className="w-2/3 flex flex-col bg-black/20 p-3 rounded-lg border border-gray-700/60">
                        <div className="grid grid-cols-8 gap-2 flex-grow overflow-y-auto pr-2">
                            {playerCharacter.inventory.items.map(item => (
                                <div key={item.id} onClick={() => setSelectedItem(item)} className={`relative aspect-square border-2 rounded-md flex items-center justify-center p-1 cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'bg-amber-500/30 border-amber-400' : 'bg-black/30 border-gray-600 hover:border-amber-400/70'}`}>
                                    <span className="text-4xl select-none" role="img">{item.icon || '📜'}</span>
                                    {item.quantity > 1 && <span className="absolute bottom-0 right-0 text-xs font-bold bg-gray-900/80 text-white px-1 rounded-sm">{item.quantity}</span>}
                                </div>
                            ))}
                        </div>
                         <div className="flex-shrink-0 mt-3">
                             {selectedItem ? (
                                 <div className="bg-black/30 p-3 rounded-md border border-gray-600 h-32 flex flex-col justify-between animate-fade-in" style={{animationDuration: '200ms'}}>
                                     <div>
                                        <h4 className={`font-bold font-title text-lg ${ITEM_QUALITY_STYLES[selectedItem.quality].color}`}>{selectedItem.name}</h4>
                                        <p className="text-xs text-gray-400 italic truncate">{selectedItem.description}</p>
                                     </div>
                                      <div className="flex justify-end items-center gap-2">
                                        {selectedItem.slot && !selectedItem.isEquipped && <button onClick={() => handleEquip(selectedItem)} className="themed-button-primary text-sm font-bold px-3 py-1 rounded">Trang Bị</button>}
                                        {(selectedItem.type === 'Đan Dược' || selectedItem.type === 'Đan Phương') && <button onClick={() => handleUse(selectedItem)} className="themed-button-primary text-sm font-bold px-3 py-1 rounded">{selectedItem.type === 'Đan Phương' ? 'Học' : 'Sử Dụng'}</button>}
                                        <button onClick={() => handleDrop(selectedItem)} className="bg-red-800/80 hover:bg-red-700 text-white text-sm font-bold px-3 py-1 rounded">Vứt Bỏ</button>
                                     </div>
                                 </div>
                             ) : (
                                 <div className="h-32 flex items-center justify-center text-gray-500">Chọn một vật phẩm để xem chi tiết.</div>
                             )}
                         </div>
                    </div>
                </div>
                 <div className="p-2 border-t border-gray-700/60">
                     <div className="w-full bg-black/30 p-2 rounded-lg border border-gray-700/60 space-y-1">
                         <div className="flex justify-between items-baseline text-xs">
                             <div className="flex items-center gap-1 text-gray-300"><GiWeight /> <span>Tải trọng</span></div>
                             <span className="font-mono">{currentWeight.toFixed(1)} / {playerCharacter.inventory.weightCapacity.toFixed(1)}</span>
                         </div>
                         <div className="w-full bg-black/40 rounded-full h-1.5 border border-gray-800">
                             <div className={`h-1 rounded-full transition-all duration-300 ${currentWeight / playerCharacter.inventory.weightCapacity > 0.9 ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${(currentWeight / playerCharacter.inventory.weightCapacity) * 100}%` }}></div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryModal;
