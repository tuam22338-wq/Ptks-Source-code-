import React, { useState, useMemo, useCallback, useEffect } from 'react';
import type { GameState, InventoryItem, EquipmentSlot, StatBonus, PlayerCharacter, PlayerVitals, CharacterAttributes, ItemFilter, SortOrder } from '../../../types';
import { ITEM_QUALITY_STYLES, EQUIPMENT_SLOTS, EQUIPMENT_SLOT_ICONS, DEFAULT_ATTRIBUTE_DEFINITIONS, UI_ICONS } from '../../../constants';
import { GiWeight, GiPerson } from "react-icons/gi";
import { FaTimes, FaArrowLeft, FaArrowRight, FaSearch, FaFilter, FaSort, FaCheckSquare, FaSquare } from 'react-icons/fa';
// FIX: useAppContext is in its own file
import { useAppContext } from '../../../contexts/useAppContext';
import { useGameUIContext } from '../../../contexts/GameUIContext';
import { calculateDerivedStats } from '../../../utils/statCalculator';

interface InventoryModalProps {
    isOpen: boolean;
}

const ITEMS_PER_PAGE = 28;
const ITEM_FILTERS: { id: ItemFilter; label: string; }[] = [
    { id: 'all', label: 'Tất Cả' },
    { id: 'Vũ Khí', label: 'Vũ Khí' },
    { id: 'Phòng Cụ', label: 'Phòng Cụ' },
    { id: 'Đan Dược', label: 'Đan Dược' },
    { id: 'Pháp Bảo', label: 'Pháp Bảo' },
    { id: 'Nguyên Liệu', label: 'Nguyên Liệu' },
    { id: 'Tạp Vật', label: 'Tạp Vật' },
];

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
                    ${item ? `border-[var(--primary-accent-color)]/50` : 'border-[var(--shadow-light)]'}
                    ${item ? 'cursor-pointer hover:border-[var(--primary-accent-color)] hover:bg-black/50' : 'cursor-default'}
                `}
            >
                {item ? (
                    <span className="text-2xl" role="img" aria-label={item.name}>{item.icon}</span>
                ) : (
                    <Icon className="text-3xl text-gray-700" />
                )}
                 {item && <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[var(--bg-color)] ${ITEM_QUALITY_STYLES[item.quality].color.replace('text', 'bg')}`}></div>}
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
        <div className="mt-2 pt-2 border-t border-[var(--shadow-light)]/50">
            {Array.from(allAttributes).map(attr => {
                const itemValue = Number(itemBonuses.get(attr)) || 0;
                const equippedValue = Number(equippedBonuses.get(attr)) || 0;
                const diff = itemValue - equippedValue;
                let diffColor = 'text-[var(--text-muted-color)]';
                if (diff > 0) diffColor = 'text-[var(--success-color)]';
                if (diff < 0) diffColor = 'text-[var(--error-color)]';

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
    const { state, handlePlayerAction } = useAppContext();
    const { gameState } = state;
    const { showNotification, closeInventoryModal } = useGameUIContext();
    
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<ItemFilter>('all');
    const [sort, setSort] = useState<SortOrder>('quality_desc');
    const [currentPage, setCurrentPage] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const handleClose = useCallback(() => {
        setSelectedItem(null);
        setSelectedItems(new Set());
        setCurrentPage(0);
        setSearchTerm('');
        closeInventoryModal();
    }, [closeInventoryModal]);

    const playerCharacter = gameState?.playerCharacter;

    const createAndDispatchAction = useCallback((actionText: string, closeModal: boolean = true) => {
        handlePlayerAction(actionText, 'act', 0, showNotification);
        if (closeModal) {
            handleClose();
        }
    }, [handlePlayerAction, showNotification, handleClose]);

    const handleEquip = useCallback((itemToEquip: InventoryItem) => {
        if (!itemToEquip.slot) return;
        createAndDispatchAction(`Trang bị ${itemToEquip.name}`);
    }, [createAndDispatchAction]);
    
    const handleUnequip = useCallback((slot: EquipmentSlot) => {
        const item = playerCharacter?.equipment[slot];
        if (!item) return;
        createAndDispatchAction(`Tháo ${item.name}`);
    }, [playerCharacter, createAndDispatchAction]);

    const handleDrop = useCallback((itemToDrop: InventoryItem, quantity: number) => {
        if (!window.confirm(`Bạn có chắc muốn vứt bỏ ${quantity} ${itemToDrop.name}?`)) return;
        createAndDispatchAction(`Vứt bỏ ${quantity} ${itemToDrop.name}`, false);
        setSelectedItem(null);
        setSelectedItems(new Set());
    }, [createAndDispatchAction]);

    const handleUse = useCallback((itemToUse: InventoryItem) => {
        const actionText = itemToUse.type === 'Đan Phương' ? `Học ${itemToUse.name}` : `Sử dụng ${itemToUse.name}`;
        createAndDispatchAction(actionText);
    }, [createAndDispatchAction]);
    
    const handleToggleSelectItem = useCallback((itemId: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) newSet.delete(itemId);
            else newSet.add(itemId);
            return newSet;
        });
    }, []);

    const handleUseSelected = useCallback(() => {
        if (selectedItems.size === 0 || !playerCharacter) return;
        const itemsToUse = playerCharacter.inventory.items.filter(i => selectedItems.has(i.id));
        const consumableItems = itemsToUse.filter(i => i.type === 'Đan Dược' || i.type === 'Linh Dược');
        if (consumableItems.length !== itemsToUse.length) {
            showNotification("Chỉ có thể sử dụng nhiều Đan Dược hoặc Linh Dược cùng lúc.");
            return;
        }

        const itemCounts = consumableItems.reduce((acc, item) => {
            acc[item.name] = (acc[item.name] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const summary = Object.entries(itemCounts).map(([name, count]) => `${count > 1 ? `${count} ` : ''}${name}`).join(', ');
        createAndDispatchAction(`Sử dụng ${summary}`);
    }, [selectedItems, playerCharacter, showNotification, createAndDispatchAction]);

    const handleDropSelected = useCallback(() => {
        if (selectedItems.size === 0 || !playerCharacter) return;
        const itemsToDrop = playerCharacter.inventory.items.filter(i => selectedItems.has(i.id));
        
        const summary = itemsToDrop.map(i => i.name).join(', ');
        if (!window.confirm(`Bạn có chắc muốn vứt bỏ ${itemsToDrop.length} vật phẩm: ${summary}?`)) return;

        createAndDispatchAction(`Vứt bỏ ${summary}`, false);
        setSelectedItem(null);
        setSelectedItems(new Set());
    }, [selectedItems, playerCharacter, createAndDispatchAction]);

    const sortedAndFilteredItems = useMemo(() => {
        if (!playerCharacter) return [];
        const qualityOrder = ['Tuyệt Phẩm', 'Tiên Phẩm', 'Bảo Phẩm', 'Pháp Phẩm', 'Linh Phẩm', 'Phàm Phẩm'];
        
        const filtered = playerCharacter.inventory.items.filter(item => {
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
                case 'quality_desc': default: return qualityOrder.indexOf(a.quality) - qualityOrder.indexOf(b.quality);
            }
        });
    }, [playerCharacter, filter, sort, searchTerm]);

    useEffect(() => {
        setCurrentPage(0);
    }, [filter, sort, searchTerm]);

    const totalPages = Math.ceil(sortedAndFilteredItems.length / ITEMS_PER_PAGE);
    const paginatedItems = useMemo(() => {
        const start = currentPage * ITEMS_PER_PAGE;
        return sortedAndFilteredItems.slice(start, start + ITEMS_PER_PAGE);
    }, [sortedAndFilteredItems, currentPage]);

    if (!isOpen || !playerCharacter) return null;
    
    const currentWeight = playerCharacter.inventory.items.reduce((total, item) => total + ((Number(item.weight) || 0) * (Number(item.quantity) || 0)), 0);
    const weightPercentage = (currentWeight / Number(playerCharacter.inventory.weightCapacity)) * 100;
    const equippedItemForComparison = selectedItem?.slot ? playerCharacter.equipment[selectedItem.slot] : null;
    const isMultiSelectActive = selectedItems.size > 0;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 animate-fade-in" style={{ animationDuration: '200ms' }} onClick={handleClose}>
            <div className="bg-[var(--bg-color)]/80 backdrop-blur-lg border border-[var(--panel-border-color)] rounded-xl shadow-2xl shadow-black/50 w-full max-w-4xl m-4 h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-[var(--shadow-light)] flex justify-between items-center flex-shrink-0">
                    <h3 className="text-2xl text-[var(--primary-accent-color)] font-bold font-title">Túi Càn Khôn</h3>
                    <button onClick={handleClose} className="p-2 text-[var(--text-muted-color)] hover:text-[var(--text-color)]"><FaTimes /></button>
                </div>
                
                <div className="flex-grow p-4 flex flex-col lg:flex-row gap-4 min-h-0">
                    <div className="w-full lg:w-1/3 flex flex-col gap-4 flex-shrink-0">
                        <div className="p-3 rounded-lg border border-[var(--shadow-light)]">
                            <h4 className="text-lg font-bold font-title text-center mb-2">{playerCharacter.identity.name} - Trang Bị</h4>
                            <div className="relative h-64 w-full flex items-center justify-center">
                                <GiPerson className="text-8xl text-gray-800" />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 grid grid-cols-5 grid-rows-4 w-60 h-64">
                                    {(Object.keys(EQUIPMENT_SLOTS) as EquipmentSlot[]).map(slot => (
                                        <EquipmentSlotComponent key={slot} slot={slot} item={playerCharacter.equipment[slot] || null} onUnequip={handleUnequip} onSelect={setSelectedItem} />
                                    ))}
                                </div>
                            </div>
                        </div>
                         <div className="flex-grow p-3 rounded-lg border border-[var(--shadow-light)] min-h-[14rem] flex flex-col justify-between">
                            {selectedItem ? (
                                <div className="animate-fade-in" style={{animationDuration: '200ms'}}>
                                    <h4 className={`font-bold font-title text-lg ${ITEM_QUALITY_STYLES[selectedItem.quality].color}`}>{selectedItem.name}</h4>
                                    <p className="text-xs text-[var(--text-muted-color)] italic truncate">{selectedItem.description}</p>
                                    {selectedItem.vitalEffects && selectedItem.vitalEffects.length > 0 && <div className="mt-1 text-xs text-yellow-300">{selectedItem.vitalEffects.map(b => `${b.vital === 'hunger' ? 'No bụng' : 'Nước uống'} ${b.value > 0 ? '+' : ''}${b.value}`).join(', ')}</div>}
                                    {selectedItem.slot && !selectedItem.isEquipped && <ItemComparison item={selectedItem} equipped={equippedItemForComparison} />}
                                </div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-[var(--text-muted-color)]">Di chuột qua vật phẩm để xem chi tiết.</div>
                            )}
                            <div className="flex justify-end items-center gap-2 mt-2">
                                {selectedItem && selectedItem.isEquipped && selectedItem.slot && <button onClick={() => handleUnequip(selectedItem.slot!)} className="btn btn-neumorphic !text-sm !px-4 !py-1">Tháo Ra</button>}
                                {selectedItem && selectedItem.slot && !selectedItem.isEquipped && <button onClick={() => handleEquip(selectedItem)} className="btn btn-primary !bg-green-700/80 !text-sm !px-4 !py-1">Trang Bị</button>}
                                {selectedItem && (selectedItem.type === 'Đan Dược' || selectedItem.type === 'Đan Phương' || selectedItem.type === 'Linh Dược') && <button onClick={() => handleUse(selectedItem)} className="btn btn-primary !bg-blue-700/80 !text-sm !px-4 !py-1">{selectedItem.type === 'Đan Phương' ? 'Học' : 'Sử Dụng'}</button>}
                                {selectedItem && <button onClick={() => handleDrop(selectedItem, 1)} className="btn btn-primary !bg-red-800/80 !text-sm !px-4 !py-1">Vứt Bỏ</button>}
                            </div>
                        </div>
                    </div>

                    <div className="flex-grow flex flex-col p-3 rounded-lg border border-[var(--shadow-light)] min-h-0">
                         <div className="w-full bg-[var(--bg-color)] p-2 rounded-lg border border-[var(--shadow-light)] space-y-2 mb-3 flex-shrink-0">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted-color)]" />
                                    <input type="text" placeholder="Tìm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-neumorphic !py-1.5 !pl-9 w-full"/>
                                </div>
                                <select onChange={e => setSort(e.target.value as SortOrder)} value={sort} className="input-neumorphic !py-1.5 w-full">
                                    <option value="quality_desc">Sắp xếp: Phẩm chất</option>
                                    <option value="name_asc">Sắp xếp: Tên A-Z</option>
                                    <option value="name_desc">Sắp xếp: Tên Z-A</option>
                                    <option value="weight_desc">Sắp xếp: Trọng lượng</option>
                                </select>
                            </div>
                             <div className="flex justify-between items-center text-xs">
                                 <div className="flex items-center gap-1"><GiWeight /> <span>Tải trọng</span></div>
                                 <span className="font-mono">{currentWeight.toFixed(1)} / {playerCharacter.inventory.weightCapacity.toFixed(1)}</span>
                             </div>
                             <div className="w-full bg-black/40 rounded-full h-1.5" style={{boxShadow: 'var(--shadow-pressed)'}}>
                                 <div className={`h-1 rounded-full transition-all duration-300 ${weightPercentage > 90 ? 'bg-[var(--error-color)]' : 'bg-[var(--primary-accent-color)]'}`} style={{ width: `${Math.min(100, weightPercentage)}%` }}></div>
                             </div>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-2 overflow-x-auto pb-2 mb-2 -mx-1 px-1">
                            {ITEM_FILTERS.map(f => (
                                <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1 text-xs font-semibold rounded-full whitespace-nowrap transition-colors ${filter === f.id ? 'bg-[var(--primary-accent-color)] text-[var(--primary-accent-text-color)]' : 'bg-[var(--bg-color)] text-[var(--text-muted-color)] hover:bg-[var(--shadow-light)]'}`} style={{boxShadow: 'var(--shadow-raised-interactive)'}}>{f.label}</button>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-2 flex-grow overflow-y-auto pr-2 content-start">
                            {paginatedItems.map(item => (
                                <button 
                                    key={item.id} 
                                    onMouseEnter={() => !isMultiSelectActive && setSelectedItem(item)}
                                    onMouseLeave={() => !isMultiSelectActive && setSelectedItem(null)}
                                    onClick={() => handleToggleSelectItem(item.id)}
                                    className={`relative aspect-square border-2 rounded-md flex items-center justify-center p-1 cursor-pointer transition-colors bg-[var(--bg-color)]
                                        ${selectedItems.has(item.id) ? 'border-[var(--secondary-accent-color)]' : 'border-[var(--shadow-light)] hover:border-[var(--primary-accent-color)]/70'}`}
                                >
                                    {selectedItems.has(item.id) ? <FaCheckSquare className="absolute top-1 left-1 text-[var(--secondary-accent-color)]" /> : <FaSquare className="absolute top-1 left-1 text-transparent group-hover:text-gray-500" />}
                                    <span className="text-4xl select-none" role="img" aria-label={item.name}>{item.icon || '📜'}</span>
{/* FIX: Explicitly cast item.quantity to any then Number to resolve 'unknown' type error. */}
                                    {Number(item.quantity as any) > 1 && <span className="absolute bottom-0 right-0 text-xs font-bold bg-[var(--bg-color)]/80 px-1 rounded-sm">{item.quantity}</span>}
                                    <div className={`absolute -top-1 -left-1 w-3 h-3 rounded-full border-2 border-[var(--bg-color)] ${ITEM_QUALITY_STYLES[item.quality].color.replace('text', 'bg')}`}></div>
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between items-center gap-4 mt-3 flex-shrink-0">
                            {totalPages > 1 ? (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="btn btn-neumorphic !p-2 disabled:opacity-50"><FaArrowLeft /></button>
                                    <span className="text-sm font-mono text-[var(--text-muted-color)]">Trang {currentPage + 1}/{totalPages}</span>
                                    <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages - 1} className="btn btn-neumorphic !p-2 disabled:opacity-50"><FaArrowRight /></button>
                                </div>
                            ) : <div></div>}
                            <div className="flex items-center gap-2">
                                {isMultiSelectActive && (
                                    <>
                                        <button onClick={handleUseSelected} className="btn btn-primary !bg-blue-600/80 !text-sm !px-3 !py-1">Sử dụng ({selectedItems.size})</button>
                                        <button onClick={handleDropSelected} className="btn btn-primary !bg-red-700/80 !text-sm !px-3 !py-1">Vứt bỏ ({selectedItems.size})</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};