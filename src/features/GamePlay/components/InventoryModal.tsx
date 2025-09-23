

import React, { useState, useMemo, useCallback } from 'react';
import type { GameState, InventoryItem, EquipmentSlot, StatBonus, PlayerCharacter, PlayerVitals, CharacterAttributes } from '../../../types';
import { ITEM_QUALITY_STYLES, EQUIPMENT_SLOTS, EQUIPMENT_SLOT_ICONS, DEFAULT_ATTRIBUTE_DEFINITIONS, UI_ICONS } from '../../../constants';
import { GiWeight, GiPerson } from "react-icons/gi";
import { FaTimes, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { useAppContext } from '../../../contexts/AppContext';
import { useGameUIContext } from '../../../contexts/GameUIContext';

interface InventoryModalProps {
    isOpen: boolean;
}

type ItemFilter = 'all' | InventoryItem['type'];
type SortOrder = 'name_asc' | 'name_desc' | 'quality_desc' | 'weight_desc';

const ITEMS_PER_PAGE = 28; // 4 rows * 7 columns

const deepCopyAttributes = (attributes: CharacterAttributes): CharacterAttributes => {
    return JSON.parse(JSON.stringify(attributes));
};

const applyBonuses = (pc: PlayerCharacter, bonuses: StatBonus[], operation: 'add' | 'subtract'): CharacterAttributes => {
    const newAttributes = deepCopyAttributes(pc.attributes);
    const multiplier = operation === 'add' ? 1 : -1;

    bonuses.forEach(bonus => {
        const attrDef = DEFAULT_ATTRIBUTE_DEFINITIONS.find(def => def.name === bonus.attribute);
        if (attrDef && newAttributes[attrDef.id]) {
            const attr = newAttributes[attrDef.id];
            attr.value += (bonus.value * multiplier);

            if (attr.maxValue !== undefined) {
                const newMaxValue = attr.maxValue + (bonus.value * multiplier);
                attr.maxValue = newMaxValue;
                if (operation === 'subtract' && attr.value > newMaxValue) {
                    attr.value = newMaxValue;
                }
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
    const iconName = EQUIPMENT_SLOT_ICONS[slot];
    const Icon = UI_ICONS[iconName] || (() => <span />);
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
                className={`relative w-14 h-14 bg-black/30 border-2 rounded-lg flex items-center justify-center text-4xl transition-all duration-200
                    ${item ? 'border-amber-500/50' : 'border-gray-600/80'}
                    ${item ? 'cursor-pointer hover:border-amber-400 hover:bg-black/50' : 'cursor-default'}
                `}
            >
                {item ? (
                    <span className="text-3xl" role="img" aria-label={item.name}>{item.icon}</span>
                ) : (
                    <Icon className="text-gray-700" />
                )}
                 {item && <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 ${ITEM_QUALITY_STYLES[item.quality].color.replace('text', 'bg')}`}></div>}
            </button>
        </div>
    );
};

const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen }) => {
    const { state, dispatch } = useAppContext();
    const { gameState } = state;
    const { showNotification, closeInventoryModal } = useGameUIContext();
    
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [filter, setFilter] = useState<ItemFilter>('all');
    const [sort, setSort] = useState<SortOrder>('quality_desc');
    const [currentPage, setCurrentPage] = useState(0);

    const handleClose = useCallback(() => {
        setSelectedItem(null);
        setCurrentPage(0);
        closeInventoryModal();
    }, [closeInventoryModal]);

    const playerCharacter = gameState?.playerCharacter;

    const handleEquip = useCallback((itemToEquip: InventoryItem) => {
        dispatch({ type: 'UPDATE_GAME_STATE', payload: (pcState => {
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
        }) });
        showNotification(`Đã trang bị [${itemToEquip.name}]`);
        setSelectedItem(null);
    }, [dispatch, showNotification]);
    
    const handleUnequip = useCallback((slot: EquipmentSlot) => {
        dispatch({ type: 'UPDATE_GAME_STATE', payload: (pcState => {
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
        }) });
         showNotification(`Đã tháo [${playerCharacter?.equipment[slot]?.name}]`);
         setSelectedItem(null);
    }, [playerCharacter, dispatch, showNotification]);

    const handleDrop = useCallback((itemToDrop: InventoryItem) => {
        if (!window.confirm(`Bạn có chắc muốn vứt bỏ ${itemToDrop.name}?`)) return;
        dispatch({ type: 'UPDATE_GAME_STATE', payload: (pcState => {
             if (!pcState) return null;
             return { ...pcState, playerCharacter: { ...pcState.playerCharacter, inventory: { ...pcState.playerCharacter.inventory, items: pcState.playerCharacter.inventory.items.filter(i => i.id !== itemToDrop.id) } } };
        }) });
        showNotification(`Đã vứt bỏ [${itemToDrop.name}]`);
        setSelectedItem(null);
    }, [dispatch, showNotification]);
    
    const handleUse = useCallback((itemToUse: InventoryItem) => {
        if (!playerCharacter) return;
        let actionMessage = `Đã sử dụng [${itemToUse.name}].`;
        
        dispatch({ type: 'UPDATE_GAME_STATE', payload: (pcState => {
            if (!pcState) return null;
            let pc = { ...pcState.playerCharacter };
            
            if (itemToUse.vitalEffects) {
                itemToUse.vitalEffects.forEach(effect => {
                    const attr = pc.attributes[effect.vital]; // effect.vital is an attribute ID like 'hunger'
                    if (attr && attr.maxValue !== undefined) {
                        attr.value = Math.min(attr.maxValue, (attr.value || 0) + effect.value);
                    }
                });
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
        }) });
        
        showNotification(actionMessage);
        setSelectedItem(null);
    }, [playerCharacter, dispatch, showNotification]);

    const sortedItems = useMemo(() => {
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

    const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE);
    const paginatedItems = useMemo(() => {
        const start = currentPage * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return sortedItems.slice(start, end);
    }, [sortedItems, currentPage]);

    if (!isOpen || !playerCharacter) return null;
    
    const currentWeight = playerCharacter.inventory.items.reduce((total, item) => total + (item.weight * item.quantity), 0);
    const weightPercentage = (currentWeight / playerCharacter.inventory.weightCapacity) * 100;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 animate-fade-in" style={{ animationDuration: '200ms' }} onClick={handleClose}>
            <div className="themed-modal w-full max-w-4xl m-4 h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-2xl text-[var(--primary-accent-color)] font-bold font-title">Túi Càn Khôn</h3>
                    <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>
                
                <div className="flex-grow p-4 flex flex-col gap-4 min-h-0">
                    {/* TOP: Equipment Doll */}
                    <div className="flex-shrink-0 p-3 rounded-lg border border-[var(--border-subtle)]">
                        <h4 className="text-lg font-bold font-title text-center mb-2">{playerCharacter.identity.name} - Trang Bị</h4>
                        <div className="relative h-48 w-full flex items-center justify-center">
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
                    </div>

                    {/* BOTTOM: Inventory Grid & Details */}
                    <div className="flex-grow flex flex-col p-3 rounded-lg border border-[var(--border-subtle)] min-h-0">
                         <div className="w-full bg-[var(--bg-interactive)] p-2 rounded-lg border border-[var(--border-subtle)] space-y-1 mb-3 flex-shrink-0">
                             <div className="flex justify-between items-baseline text-xs">
                                 <div className="flex items-center gap-1 text-gray-300"><GiWeight /> <span>Tải trọng</span></div>
                                 <span className="font-mono">{currentWeight.toFixed(1)} / {playerCharacter.inventory.weightCapacity.toFixed(1)}</span>
                             </div>
                             <div className="w-full bg-black/40 rounded-full h-1.5 border border-gray-800">
                                 <div className={`h-1 rounded-full transition-all duration-300 ${weightPercentage > 90 ? 'bg-red-500' : 'bg-[var(--primary-accent-color)]'}`} style={{ width: `${weightPercentage}%` }}></div>
                             </div>
                        </div>

                        <div className="grid grid-cols-7 gap-2 flex-grow overflow-y-auto pr-2 content-start">
                            {paginatedItems.map(item => (
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

                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 mt-3 flex-shrink-0">
                                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="p-2 disabled:opacity-50"><FaArrowLeft /></button>
                                <span className="text-sm font-mono">Trang {currentPage + 1} / {totalPages}</span>
                                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1} className="p-2 disabled:opacity-50"><FaArrowRight /></button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-shrink-0 h-36 p-3 rounded-lg border border-[var(--border-subtle)]">
                        {selectedItem ? (
                             <div className="h-full flex flex-col justify-between animate-fade-in" style={{animationDuration: '200ms'}}>
                                 <div>
                                    <h4 className={`font-bold font-title text-lg ${ITEM_QUALITY_STYLES[selectedItem.quality].color}`}>{selectedItem.name}</h4>
                                    <p className="text-xs text-gray-400 italic truncate">{selectedItem.description}</p>
                                    {selectedItem.bonuses && selectedItem.bonuses.length > 0 && <div className="mt-1 text-xs text-teal-300">{selectedItem.bonuses.map(b => `${b.attribute} ${b.value > 0 ? '+' : ''}${b.value}`).join(', ')}</div>}
                                    {selectedItem.vitalEffects && selectedItem.vitalEffects.length > 0 && <div className="mt-1 text-xs text-yellow-300">{selectedItem.vitalEffects.map(b => `${b.vital === 'hunger' ? 'No bụng' : 'Nước uống'} ${b.value > 0 ? '+' : ''}${b.value}`).join(', ')}</div>}
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
        </div>
    );
};

export default InventoryModal;
