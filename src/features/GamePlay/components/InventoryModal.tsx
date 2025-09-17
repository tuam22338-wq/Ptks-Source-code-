import React, { useState, useMemo, useCallback } from 'react';
import type { GameState, InventoryItem, EquipmentSlot, StatBonus, PlayerCharacter, Attribute, AttributeGroup, PlayerVitals } from '../../../types';
import { ITEM_QUALITY_STYLES, EQUIPMENT_SLOTS, EQUIPMENT_SLOT_ICONS } from '../../../constants';
import { GiWeight, GiPerson } from "react-icons/gi";
import { FaTimes } from 'react-icons/fa';
import { useAppContext } from '../../../contexts/AppContext';
import { useGameUIContext } from '../../../contexts/GameUIContext';

interface InventoryModalProps {
    isOpen: boolean;
}

type ItemFilter = 'all' | InventoryItem['type'];
type SortOrder = 'name_asc' | 'name_desc' | 'quality_desc' | 'weight_desc';

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

const EquipmentSlotComponent: React.FC<{
    slot: EquipmentSlot;
    item: InventoryItem | null;
    onUnequip: (slot: EquipmentSlot) => void;
    onSelect: (item: InventoryItem | null) => void;
}> = ({ slot, item, onUnequip, onSelect }) => {
    const Icon = EQUIPMENT_SLOT_ICONS[slot];
    const slotInfo = EQUIPMENT_SLOTS[slot];
    
    return (
        <div 
            className={`absolute equipment-slot-wrapper slot-${slot.toLowerCase().replace(/[\s\d]+/g, '-')}`}
            onMouseEnter={() => onSelect(item)}
            onMouseLeave={() => onSelect(null)}
        >
            <button 
                onClick={() => item && onUnequip(slot)}
                title={slotInfo.label} 
                className={`relative w-16 h-16 bg-black/30 border-2 rounded-lg flex items-center justify-center text-5xl transition-all duration-200
                    ${item ? 'border-amber-500/50' : 'border-gray-600/80'}
                    ${item ? 'cursor-pointer hover:border-amber-400 hover:bg-black/50' : 'cursor-default'}
                `}
            >
                {item ? (
                    <span className="text-4xl" role="img" aria-label={item.name}>{item.icon}</span>
                ) : (
                    <Icon className="text-gray-700" />
                )}
                 {item && <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 ${ITEM_QUALITY_STYLES[item.quality].color.replace('text', 'bg')}`}></div>}
            </button>
        </div>
    );
};

const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen }) => {
    const { gameState, setGameState } = useAppContext();
    const { showNotification, closeInventoryModal } = useGameUIContext();
    
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [filter, setFilter] = useState<ItemFilter>('all');
    const [sort, setSort] = useState<SortOrder>('quality_desc');

    const handleClose = useCallback(() => {
        setSelectedItem(null);
        closeInventoryModal();
    }, [closeInventoryModal]);

    const playerCharacter = gameState?.playerCharacter;

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
            return { ...pcState, playerCharacter: { ...pc, inventory: { ...pc.inventory, items: newInventoryItems }, equipment: newEquipment } };
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
            return { ...pcState, playerCharacter: { ...pc, inventory: { ...pc.inventory, items: newInventoryItems }, equipment: newEquipment } };
        });
         showNotification(`Đã tháo [${playerCharacter?.equipment[slot]?.name}]`);
         setSelectedItem(null);
    }, [playerCharacter, setGameState, showNotification]);

    const handleDrop = useCallback((itemToDrop: InventoryItem) => {
        if (!window.confirm(`Bạn có chắc muốn vứt bỏ ${itemToDrop.name}?`)) return;
        setGameState(pcState => {
             if (!pcState) return null;
             return { ...pcState, playerCharacter: { ...pcState.playerCharacter, inventory: { ...pcState.playerCharacter.inventory, items: pcState.playerCharacter.inventory.items.filter(i => i.id !== itemToDrop.id) } } };
        });
        showNotification(`Đã vứt bỏ [${itemToDrop.name}]`);
        setSelectedItem(null);
    }, [setGameState, showNotification]);
    
    const handleUse = useCallback((itemToUse: InventoryItem) => {
        if (!playerCharacter) return;
        let actionMessage = `Đã sử dụng [${itemToUse.name}].`;
        
        setGameState(pcState => {
            if (!pcState) return null;
            let pc = { ...pcState.playerCharacter };
            
            if (itemToUse.vitalEffects) {
                let newVitals: PlayerVitals = { ...pc.vitals };
                itemToUse.vitalEffects.forEach(effect => {
                    const maxVitalKey = `max${effect.vital.charAt(0).toUpperCase() + effect.vital.slice(1)}` as keyof PlayerVitals;
                    const maxVitalValue = (newVitals[maxVitalKey] as number) || 100;
                    newVitals[effect.vital] = Math.min(maxVitalValue, newVitals[effect.vital] + effect.value);
                });
                pc = {...pc, vitals: newVitals};
            }

            if (itemToUse.type === 'Đan Phương' && itemToUse.recipeId) {
                if (pc.knownRecipeIds.includes(itemToUse.recipeId)) {
                    showNotification("Bạn đã học đan phương này rồi.");
                    return pcState;
                }
                actionMessage = `Đã học được [${itemToUse.name}]!`;
                pc = { ...pc, knownRecipeIds: [...pc.knownRecipeIds, itemToUse.recipeId] };
            }
            
            const newItems = pc.inventory.items.map(i => 
                i.id === itemToUse.id ? { ...i, quantity: i.quantity - 1 } : i
            ).filter(i => i.quantity > 0);
            
            pc = { ...pc, inventory: { ...pc.inventory, items: newItems } };

            return { ...pcState, playerCharacter: pc };
        });
        
        showNotification(actionMessage);
        setSelectedItem(null);
    }, [playerCharacter, setGameState, showNotification]);

    const displayedItems = useMemo(() => {
        if (!playerCharacter) return [];
        const qualityOrder = ['Tuyệt Phẩm', 'Tiên Phẩm', 'Bảo Phẩm', 'Pháp Phẩm', 'Linh Phẩm', 'Phàm Phẩm'];
        return playerCharacter.inventory.items
            .filter(item => filter === 'all' || item.type === filter)
            .sort((a, b) => {
                switch (sort) {
                    case 'name_asc': return a.name.localeCompare(b.name);
                    case 'name_desc': return b.name.localeCompare(a.name);
                    case 'weight_desc': return b.weight - a.weight;
                    case 'quality_desc':
                    default:
                        return qualityOrder.indexOf(a.quality) - qualityOrder.indexOf(b.quality);
                }
            });
    }, [playerCharacter, filter, sort]);

    if (!isOpen || !playerCharacter) return null;
    
    const currentWeight = displayedItems.reduce((total, item) => total + (item.weight * item.quantity), 0);
    const weightPercentage = (currentWeight / playerCharacter.inventory.weightCapacity) * 100;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }} onClick={handleClose}>
            <div className="themed-modal rounded-lg shadow-2xl shadow-black/50 w-full max-w-6xl m-4 h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-2xl text-[var(--primary-accent-color)] font-bold font-title">Túi Càn Khôn</h3>
                    <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>
                
                <div className="flex-grow grid grid-cols-12 p-4 gap-4 min-h-0">
                    {/* LEFT: Stats */}
                    <div className="col-span-3 bg-[var(--bg-subtle)] p-3 rounded-lg border border-[var(--border-subtle)] overflow-y-auto">
                        <h4 className="text-xl font-bold font-title text-center mb-2">{playerCharacter.identity.name}</h4>
                         {playerCharacter.attributes.filter(g => g.title !== 'Thông Tin Tu Luyện').map(group => (
                            <div key={group.title} className="mb-3">
                                <p className="font-semibold text-gray-400 text-sm border-b border-gray-700/50 pb-1 mb-2">{group.title}</p>
                                {group.attributes.map(attr => (
                                    <div key={attr.name} className="flex justify-between items-baseline text-xs">
                                        <span className="text-gray-400">{attr.name}</span>
                                        <span className="font-bold text-gray-200">{attr.maxValue ? `${attr.value}/${attr.maxValue}`: attr.value}</span>
                                    </div>
                                ))}
                            </div>
                         ))}
                    </div>
                    
                    {/* CENTER: Character Doll */}
                    <div className="col-span-4 bg-[var(--bg-subtle)] p-3 rounded-lg border border-[var(--border-subtle)] relative flex items-center justify-center">
                         <GiPerson className="text-9xl text-gray-800" />
                         {(Object.keys(EQUIPMENT_SLOTS) as EquipmentSlot[]).map(slot => (
                            <EquipmentSlotComponent 
                                key={slot}
                                slot={slot}
                                item={playerCharacter.equipment[slot] || null}
                                onUnequip={handleUnequip}
                                onSelect={setSelectedItem}
                            />
                         ))}
                    </div>

                    {/* RIGHT: Inventory + Details */}
                    <div className="col-span-5 flex flex-col gap-4">
                        <div className="flex-grow flex flex-col bg-[var(--bg-subtle)] p-3 rounded-lg border border-[var(--border-subtle)] min-h-0">
                             <div className="grid grid-cols-8 gap-2 flex-grow overflow-y-auto pr-2">
                                {displayedItems.map(item => (
                                    <button 
                                        key={item.id} 
                                        onMouseEnter={() => setSelectedItem(item)}
                                        onMouseLeave={() => setSelectedItem(null)}
                                        onClick={() => item.slot && !item.isEquipped ? handleEquip(item) : (item.type === 'Đan Dược' || item.type === 'Đan Phương') ? handleUse(item) : {}}
                                        className={`relative aspect-square border-2 rounded-md flex items-center justify-center p-1 cursor-pointer transition-colors bg-[var(--bg-interactive)] border-[var(--border-subtle)] hover:border-[color:var(--primary-accent-color)]/70`}
                                    >
                                        <span className="text-4xl select-none" role="img" aria-label={item.name}>{item.icon || '📜'}</span>
                                        {item.quantity > 1 && <span className="absolute bottom-0 right-0 text-xs font-bold bg-gray-900/80 text-white px-1 rounded-sm">{item.quantity}</span>}
                                        <div className={`absolute -top-1 -left-1 w-3 h-3 rounded-full border-2 border-gray-900 ${ITEM_QUALITY_STYLES[item.quality].color.replace('text', 'bg')}`}></div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-shrink-0 h-48 bg-[var(--bg-subtle)] p-3 rounded-lg border border-[var(--border-subtle)]">
                              {selectedItem ? (
                                 <div className="h-full flex flex-col justify-between animate-fade-in" style={{animationDuration: '200ms'}}>
                                     <div>
                                        <h4 className={`font-bold font-title text-lg ${ITEM_QUALITY_STYLES[selectedItem.quality].color}`}>{selectedItem.name}</h4>
                                        <p className="text-xs text-gray-400 italic">{selectedItem.description}</p>
                                        {selectedItem.bonuses && selectedItem.bonuses.length > 0 && <div className="mt-1 text-xs text-teal-300">{selectedItem.bonuses.map(b => `${b.attribute} ${b.value > 0 ? '+' : ''}${b.value}`).join(', ')}</div>}
                                        {selectedItem.vitalEffects && selectedItem.vitalEffects.length > 0 && <div className="mt-1 text-xs text-yellow-300">{selectedItem.vitalEffects.map(b => `${b.vital} ${b.value > 0 ? '+' : ''}${b.value}`).join(', ')}</div>}
                                     </div>
                                      <div className="flex justify-end items-center gap-2">
                                        {selectedItem.isEquipped && selectedItem.slot && <button onClick={() => handleUnequip(selectedItem.slot!)} className="themed-button-primary text-sm font-bold px-3 py-1 rounded">Tháo Ra</button>}
                                        {selectedItem.slot && !selectedItem.isEquipped && <button onClick={() => handleEquip(selectedItem)} className="bg-green-700/80 hover:bg-green-600/80 text-white text-sm font-bold px-3 py-1 rounded">Trang Bị</button>}
                                        {(selectedItem.type === 'Đan Dược' || selectedItem.type === 'Đan Phương') && <button onClick={() => handleUse(selectedItem)} className="bg-blue-700/80 hover:bg-blue-600/80 text-white text-sm font-bold px-3 py-1 rounded">{selectedItem.type === 'Đan Phương' ? 'Học' : 'Sử Dụng'}</button>}
                                        <button onClick={() => handleDrop(selectedItem)} className="bg-red-800/80 hover:bg-red-700 text-white text-sm font-bold px-3 py-1 rounded">Vứt Bỏ</button>
                                     </div>
                                 </div>
                             ) : (
                                 <div className="h-full flex items-center justify-center text-gray-500">Di chuột qua vật phẩm để xem chi tiết.</div>
                             )}
                        </div>
                    </div>
                </div>

                <div className="p-2 border-t border-gray-700/60">
                     <div className="w-full bg-[var(--bg-interactive)] p-2 rounded-lg border border-[var(--border-subtle)] space-y-1">
                         <div className="flex justify-between items-baseline text-xs">
                             <div className="flex items-center gap-1 text-gray-300"><GiWeight /> <span>Tải trọng</span></div>
                             <span className="font-mono">{currentWeight.toFixed(1)} / {playerCharacter.inventory.weightCapacity.toFixed(1)}</span>
                         </div>
                         <div className="w-full bg-black/40 rounded-full h-1.5 border border-gray-800">
                             <div className={`h-1 rounded-full transition-all duration-300 ${weightPercentage > 90 ? 'bg-red-500' : 'bg-[var(--primary-accent-color)]'}`} style={{ width: `${weightPercentage}%` }}></div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventoryModal;
