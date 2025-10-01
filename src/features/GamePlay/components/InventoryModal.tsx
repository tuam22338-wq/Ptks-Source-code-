

import React, { useState, useMemo, useCallback } from 'react';
import type { GameState, InventoryItem, EquipmentSlot, StatBonus, PlayerCharacter, PlayerVitals, CharacterAttributes } from '../../../types';
// FIX: Added 'EQUIPMENT_SLOT_ICONS' to the import list to resolve the "does not exist" error.
import { ITEM_QUALITY_STYLES, EQUIPMENT_SLOTS, EQUIPMENT_SLOT_ICONS, DEFAULT_ATTRIBUTE_DEFINITIONS, UI_ICONS } from '../../../constants';
import { GiWeight, GiPerson } from "react-icons/gi";
import { FaTimes, FaArrowLeft, FaArrowRight, FaSearch } from 'react-icons/fa';
import { useAppContext } from '../../../contexts/AppContext';
import { useGameUIContext } from '../../../contexts/GameUIContext';
import { calculateDerivedStats } from '../../../utils/statCalculator';

interface InventoryModalProps {
    isOpen: boolean;
}

type ItemFilter = 'all' | InventoryItem['type'];
type SortOrder = 'name_asc' | 'name_desc' | 'quality_desc' | 'weight_desc';

const ITEMS_PER_PAGE = 28; // 4 rows * 7 columns

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
            className={`equipment-slot-wrapper slot-${slot.toLowerCase().replace(/[\s\d]+/g, '-')}`}
            onMouseEnter={() => onSelect(item)}
            onMouseLeave={() => onSelect(null)}
        >
            <button 
                onClick={() => item && onUnequip(slot)}
                title={slotInfo.label} 
                className={`relative w-12 h-12 bg-black/30 border-2 rounded-lg flex items-center justify-center text-3xl transition-all duration-200
                    ${item ? 'border-amber-500/50' : 'border-gray-600/80'}
                    ${item ? 'cursor-pointer hover:border-amber-400 hover:bg-black/50' : 'cursor-default'}
                `}
            >
                {item ? (
                    <span className="text-2xl" role="img" aria-label={item.name}>{item.icon}</span>
                ) : (
                    <Icon className="text-3xl text-gray-700" />
                )}
                 {item && <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-900 ${ITEM_QUALITY_STYLES[item.quality].color.replace('text', 'bg')}`}></div>}
            </button>
        </div>
    );
};

const ItemComparison: React.FC<{ item: InventoryItem; equipped: InventoryItem | null }> = ({ item, equipped }) => {
    const itemBonuses = new Map((item.bonuses || []).map(b => [b.attribute, b.value]));
    const equippedBonuses = new Map((equipped?.bonuses || []).map(b => [b.attribute, b.value]));
    const allAttributes = new Set([...itemBonuses.keys(), ...equippedBonuses.keys()]);

    if (allAttributes.size === 0) return null;

    return (
        <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]/50">
            {Array.from(allAttributes).map(attr => {
                // FIX: Cast bonus values to Number to prevent arithmetic errors with string types from deserialized save data.
                const itemValue = Number(itemBonuses.get(attr)) || 0;
                const equippedValue = Number(equippedBonuses.get(attr)) || 0;
                const diff = itemValue - equippedValue;
                let diffColor = 'text-[var(--text-muted-color)]';
                if (diff > 0) diffColor = 'text-green-400';
                if (diff < 0) diffColor = 'text-red-400';

                return (
                    <div key={attr} className="flex justify-between items-center text-xs">
                        <span style={{color: 'var(--text-color)'}}>{attr}</span>
                        <div className="flex items-center gap-2">
                            <span className="font-mono w-8 text-right">{itemValue}</span>
                            <span className={`font-mono font-bold w-10 text-center ${diffColor}`}>
                                ({diff > 0 ? '+' : ''}{diff})
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen }) => {
    const { state, dispatch } = useAppContext();
    const { gameState } = state;
    const { showNotification, closeInventoryModal } = useGameUIContext();
    
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [filter, setFilter] = useState<ItemFilter>('all');
    const [sort, setSort] = useState<SortOrder>('quality_desc');
    const [currentPage, setCurrentPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const handleClose = useCallback(() => {
        setSelectedItem(null);
        setCurrentPage(0);
        setSearchTerm('');
        closeInventoryModal();
    }, [closeInventoryModal]);

    const playerCharacter = gameState?.playerCharacter;

    const handleEquip = useCallback((itemToEquip: InventoryItem) => {
        if (!playerCharacter) return;
        const slot = itemToEquip.slot;
        if (!slot) return;
    
        dispatch({
            type: 'UPDATE_GAME_STATE', payload: (gs) => {
                if (!gs) return null;
                const nextGs = JSON.parse(JSON.stringify(gs));
                let pc: PlayerCharacter = nextGs.playerCharacter;
    
                const applyBonusesToPc = (bonuses: StatBonus[], operation: 'add' | 'subtract') => {
                    const multiplier = operation === 'add' ? 1 : -1;
                    bonuses.forEach(bonus => {
                        const attrDef = DEFAULT_ATTRIBUTE_DEFINITIONS.find(def => def.name === bonus.attribute);
                        if (attrDef && pc.attributes[attrDef.id]) {
                            const attr = pc.attributes[attrDef.id];
                            attr.value = Number(attr.value) + (Number(bonus.value) * multiplier);
                            if (attr.maxValue !== undefined) {
                                const newMaxValue = Number(attr.maxValue) + (Number(bonus.value) * multiplier);
                                attr.maxValue = newMaxValue;
                                if (operation === 'subtract' && attr.value > newMaxValue) {
                                    attr.value = newMaxValue;
                                }
                            }
                        }
                    });
                };
    
                const currentItemInSlot = pc.equipment[slot];
                if (currentItemInSlot) {
                    if (currentItemInSlot.bonuses) {
                        applyBonusesToPc(currentItemInSlot.bonuses, 'subtract');
                    }
                    const existingStack = pc.inventory.items.find((i: InventoryItem) => i.name === currentItemInSlot.name && !i.isEquipped);
                    if (existingStack) {
                        existingStack.quantity = (Number(existingStack.quantity) || 0) + 1;
                    } else {
                        pc.inventory.items.push({ ...currentItemInSlot, isEquipped: false, quantity: 1 });
                    }
                }
    
                const itemIndex = pc.inventory.items.findIndex((i: InventoryItem) => i.id === itemToEquip.id);
                if (itemIndex > -1) {
                    if (Number(pc.inventory.items[itemIndex].quantity) > 1) {
                        pc.inventory.items[itemIndex].quantity = Number(pc.inventory.items[itemIndex].quantity) - 1;
                    } else {
                        pc.inventory.items.splice(itemIndex, 1);
                    }
                }
    
                pc.equipment[slot] = { ...itemToEquip, quantity: 1, isEquipped: true };
                if (itemToEquip.bonuses) {
                    applyBonusesToPc(itemToEquip.bonuses, 'add');
                }
                
                pc.attributes = calculateDerivedStats(pc.attributes, nextGs.attributeSystem.definitions);
                
                return nextGs;
            }
        });
        showNotification(`Đã trang bị [${itemToEquip.name}]`);
        setSelectedItem(null);
    }, [playerCharacter, dispatch, showNotification]);
    
    const handleUnequip = useCallback((slot: EquipmentSlot) => {
        if (!playerCharacter) return;
        
        dispatch({
            type: 'UPDATE_GAME_STATE', payload: (gs) => {
                if (!gs) return null;
                const nextGs = JSON.parse(JSON.stringify(gs));
                let pc: PlayerCharacter = nextGs.playerCharacter;
                const itemToUnequip = pc.equipment[slot];
                if (!itemToUnequip) return nextGs;
    
                if (itemToUnequip.bonuses) {
                    const multiplier = -1;
                    itemToUnequip.bonuses.forEach(bonus => {
                        const attrDef = DEFAULT_ATTRIBUTE_DEFINITIONS.find(def => def.name === bonus.attribute);
                        if (attrDef && pc.attributes[attrDef.id]) {
                            const attr = pc.attributes[attrDef.id];
                            attr.value = Number(attr.value) + (Number(bonus.value) * multiplier);
                            if (attr.maxValue !== undefined) {
                                const newMaxValue = Number(attr.maxValue) + (Number(bonus.value) * multiplier);
                                attr.maxValue = newMaxValue;
                                if (attr.value > newMaxValue) {
                                    attr.value = newMaxValue;
                                }
                            }
                        }
                    });
                }
    
                const existingStack = pc.inventory.items.find((i: InventoryItem) => i.name === itemToUnequip.name && !i.isEquipped);
                if (existingStack) {
                    existingStack.quantity = Number(existingStack.quantity) + 1;
                } else {
                    pc.inventory.items.push({ ...itemToUnequip, isEquipped: false, quantity: 1 });
                }
                
                pc.equipment[slot] = null;
                pc.attributes = calculateDerivedStats(pc.attributes, nextGs.attributeSystem.definitions);
    
                return nextGs;
            }
        });
        showNotification(`Đã tháo [${playerCharacter.equipment[slot]?.name}]`);
        setSelectedItem(null);
    }, [playerCharacter, dispatch, showNotification]);
    
    const handleDrop = useCallback((itemToDrop: InventoryItem) => {
        if (!window.confirm(`Bạn có chắc muốn vứt bỏ ${itemToDrop.name}?`)) return;
        dispatch({
            type: 'UPDATE_GAME_STATE', payload: (gs) => {
                if (!gs) return null;
                const newItems = gs.playerCharacter.inventory.items.filter((i: InventoryItem) => i.id !== itemToDrop.id);
                return { ...gs, playerCharacter: { ...gs.playerCharacter, inventory: { ...gs.playerCharacter.inventory, items: newItems } } };
            }
        });
        showNotification(`Đã vứt bỏ [${itemToDrop.name}]`);
        setSelectedItem(null);
    }, [dispatch, showNotification]);
    
    const handleUse = useCallback((itemToUse: InventoryItem) => {
        let actionMessage = `Đã sử dụng [${itemToUse.name}].`;
        
        dispatch({
            type: 'UPDATE_GAME_STATE', payload: (gs) => {
                if (!gs) return null;
                const nextGs = JSON.parse(JSON.stringify(gs));
                let pc: PlayerCharacter = nextGs.playerCharacter;
                
                if (itemToUse.vitalEffects) {
                    itemToUse.vitalEffects.forEach(effect => {
                        const attr = pc.attributes[effect.vital];
                        if (attr && attr.maxValue !== undefined) {
                            attr.value = Math.max(0, Math.min(Number(attr.maxValue), Number(attr.value) + Number(effect.value)));
                        }
                    });
                }

                if (itemToUse.type === 'Đan Phương' && itemToUse.recipeId) {
                    if (pc.knownRecipeIds.includes(itemToUse.recipeId)) {
                        showNotification("Bạn đã học đan phương này rồi.");
                        return gs;
                    }
                    actionMessage = `Đã học được [${itemToUse.name}]!`;
                    pc.knownRecipeIds.push(itemToUse.recipeId);
                }
                
                const itemIndex = pc.inventory.items.findIndex((i: InventoryItem) => i.id === itemToUse.id);
                if (itemIndex > -1) {
                    if (Number(pc.inventory.items[itemIndex].quantity) > 1) {
                        pc.inventory.items[itemIndex].quantity = Number(pc.inventory.items[itemIndex].quantity) - 1;
                    } else {
                        pc.inventory.items.splice(itemIndex, 1);
                    }
                }
                
                return nextGs;
            }
        });
        
        showNotification(actionMessage);
        setSelectedItem(null);
    }, [dispatch, showNotification]);

    const sortedAndFilteredItems = useMemo(() => {
        if (!playerCharacter) return [];
        const qualityOrder = ['Tuyệt Phẩm', 'Tiên Phẩm', 'Bảo Phẩm', 'Pháp Phẩm', 'Linh Phẩm', 'Phàm Phẩm'];
        
        const filtered = playerCharacter.inventory.items
            .filter(item => {
                const matchesFilter = filter === 'all' || item.type === filter;
                if (!searchTerm.trim()) return matchesFilter;
                const lowerSearch = searchTerm.toLowerCase();
                const matchesSearch = item.name.toLowerCase().includes(lowerSearch) || item.description.toLowerCase().includes(lowerSearch);
                return matchesFilter && matchesSearch;
            });

        return filtered.sort((a, b) => {
            switch (sort) {
                case 'name_asc': return a.name.localeCompare(b.name);
                case 'name_desc': return b.name.localeCompare(a.name);
                case 'weight_desc': return (Number(b.weight) || 0) - (Number(a.weight) || 0);
                case 'quality_desc':
                default:
                    return qualityOrder.indexOf(a.quality) - qualityOrder.indexOf(b.quality);
            }
        });
    }, [playerCharacter, filter, sort, searchTerm]);

    const totalPages = Math.ceil(sortedAndFilteredItems.length / ITEMS_PER_PAGE);
    const paginatedItems = useMemo(() => {
        const start = currentPage * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return sortedAndFilteredItems.slice(start, end);
    }, [sortedAndFilteredItems, currentPage]);

    if (!isOpen || !playerCharacter) return null;
    
    const currentWeight = playerCharacter.inventory.items.reduce((total, item) => total + ((Number(item.weight) || 0) * (Number(item.quantity) || 0)), 0);
    const weightPercentage = (currentWeight / Number(playerCharacter.inventory.weightCapacity)) * 100;

    const equippedItemForComparison = selectedItem?.slot ? playerCharacter.equipment[selectedItem.slot] : null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 animate-fade-in" style={{ animationDuration: '200ms' }} onClick={handleClose}>
            <div className="bg-stone-900/80 backdrop-blur-lg border border-[var(--panel-border-color)] rounded-xl shadow-2xl shadow-black/50 w-full max-w-4xl m-4 h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-2xl text-[var(--primary-accent-color)] font-bold font-title">Túi Càn Khôn</h3>
                    <button onClick={handleClose} className="p-2 text-[var(--text-muted-color)] hover:text-[var(--text-color)]"><FaTimes /></button>
                </div>
                
                <div className="flex-grow p-4 flex flex-col lg:flex-row gap-4 min-h-0">
                    {/* LEFT/TOP: Equipment Doll & Details */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-4 flex-shrink-0">
                        <div className="p-3 rounded-lg border border-[var(--border-subtle)]">
                            <h4 className="text-lg font-bold font-title text-center mb-2">{playerCharacter.identity.name} - Trang Bị</h4>
                            <div className="relative h-64 w-full flex items-center justify-center">
                                <GiPerson className="text-8xl text-gray-800" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-5 grid-rows-4 w-60 h-64">
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
                        </div>
                         <div className="flex-grow p-3 rounded-lg border border-[var(--border-subtle)] min-h-[14rem]">
                            {selectedItem ? (
                                <div className="h-full flex flex-col justify-between animate-fade-in" style={{animationDuration: '200ms'}}>
                                    <div>
                                        <h4 className={`font-bold font-title text-lg ${ITEM_QUALITY_STYLES[selectedItem.quality].color}`}>{selectedItem.name}</h4>
                                        <p className="text-xs text-[var(--text-muted-color)] italic truncate">{selectedItem.description}</p>
                                        {selectedItem.vitalEffects && selectedItem.vitalEffects.length > 0 && <div className="mt-1 text-xs text-yellow-300">{selectedItem.vitalEffects.map(b => `${b.vital === 'hunger' ? 'No bụng' : 'Nước uống'} ${b.value > 0 ? '+' : ''}${b.value}`).join(', ')}</div>}
                                        
                                        {selectedItem.slot && !selectedItem.isEquipped && <ItemComparison item={selectedItem} equipped={equippedItemForComparison} />}

                                    </div>
                                    <div className="flex justify-end items-center gap-2 mt-2">
                                        {selectedItem.isEquipped && selectedItem.slot && <button onClick={() => handleUnequip(selectedItem.slot!)} className="px-6 py-2 bg-[var(--button-primary-bg)] text-[var(--primary-accent-text-color)] border border-[var(--button-primary-border)] rounded-md font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--button-primary-hover-bg)] hover:-translate-y-0.5 shadow-md shadow-black/30 text-sm font-bold px-3 py-1 rounded">Tháo Ra</button>}
                                        {selectedItem.slot && !selectedItem.isEquipped && <button onClick={() => handleEquip(selectedItem)} className="bg-green-700/80 hover:bg-green-600/80 text-white text-sm font-bold px-3 py-1 rounded">Trang Bị</button>}
                                        {(selectedItem.type === 'Đan Dược' || selectedItem.type === 'Đan Phương') && <button onClick={() => handleUse(selectedItem)} className="bg-blue-700/80 hover:bg-blue-600/80 text-white text-sm font-bold px-3 py-1 rounded">{selectedItem.type === 'Đan Phương' ? 'Học' : 'Sử Dụng'}</button>}
                                        <button onClick={() => handleDrop(selectedItem)} className="bg-red-800/80 hover:bg-red-700 text-white text-sm font-bold px-3 py-1 rounded">Vứt Bỏ</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-[var(--text-muted-color)]">Di chuột qua vật phẩm để xem chi tiết.</div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT/BOTTOM: Inventory Grid */}
                    <div className="flex-grow flex flex-col p-3 rounded-lg border border-[var(--border-subtle)] min-h-0">
                         <div className="w-full bg-[var(--bg-interactive)] p-2 rounded-lg border border-[var(--border-subtle)] space-y-1 mb-3 flex-shrink-0">
                             <div className="flex justify-between items-baseline text-xs">
                                 <div className="flex items-center gap-1" style={{color: 'var(--text-color)'}}><GiWeight /> <span>Tải trọng</span></div>
                                 <span className="font-mono">{currentWeight.toFixed(1)} / {playerCharacter.inventory.weightCapacity.toFixed(1)}</span>
                             </div>
                             <div className="w-full bg-black/40 rounded-full h-1.5 border border-gray-800">
                                 <div className={`h-1 rounded-full transition-all duration-300 ${weightPercentage > 90 ? 'bg-red-500' : 'bg-[var(--primary-accent-color)]'}`} style={{ width: `${weightPercentage}%` }}></div>
                             </div>
                             <div className="relative pt-2">
                                <FaSearch className="absolute left-3 top-1/2 text-gray-500" />
                                <input type="text" placeholder="Tìm vật phẩm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 w-full !py-1.5 pl-9" />
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
                                    {Number(item.quantity) > 1 && <span className="absolute bottom-0 right-0 text-xs font-bold bg-gray-900/80 text-white px-1 rounded-sm">{item.quantity}</span>}
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
                </div>
            </div>
        </div>
    );
};