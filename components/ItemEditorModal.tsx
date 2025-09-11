import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import type { ModItem, ItemType } from '../types';
import StatBonusEditor from './StatBonusEditor';
import TagEditor from './TagEditor';

interface ItemEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: ModItem) => void;
    itemToEdit: ModItem | null;
    allAttributes: string[];
    suggestions?: string[];
}

const ITEM_TYPE_OPTIONS: ItemType[] = ['Vũ Khí', 'Phòng Cụ', 'Đan Dược', 'Pháp Bảo', 'Tạp Vật', 'Đan Lô', 'Linh Dược', 'Đan Phương'];

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);

const ItemEditorModal: React.FC<ItemEditorModalProps> = ({ isOpen, onClose, onSave, itemToEdit, allAttributes, suggestions }) => {
    const [item, setItem] = useState<ModItem | null>(null);

    useEffect(() => {
        if (isOpen) {
            const initialItem = itemToEdit 
                ? JSON.parse(JSON.stringify(itemToEdit)) // Deep copy
                : { id: Date.now().toString(), name: '', description: '', type: 'Tạp Vật' as ItemType, bonuses: [], tags: [] };
            setItem(initialItem);
        }
    }, [isOpen, itemToEdit]);

    if (!isOpen || !item) return null;

    const handleChange = (field: keyof ModItem, value: any) => {
        setItem({ ...item, [field]: value });
    };

    const handleSaveChanges = () => {
        if (!item.name.trim()) {
            alert("Tên Vật Phẩm không được để trống.");
            return;
        }
        onSave(item);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }}>
            <div className="bg-gray-900/95 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl text-gray-200 font-bold font-title">{itemToEdit ? 'Chỉnh Sửa Vật Phẩm' : 'Tạo Vật Phẩm Mới'}</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FieldWrapper label="Tên Vật Phẩm">
                            <input type="text" value={item.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: Tru Tiên Kiếm" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" />
                        </FieldWrapper>
                         <FieldWrapper label="Loại Vật Phẩm">
                            <select value={item.type} onChange={e => handleChange('type', e.target.value as ItemType)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50">
                               {ITEM_TYPE_OPTIONS.map(type => (
                                    <option key={type} value={type}>{type}</option>
                               ))}
                            </select>
                        </FieldWrapper>
                    </div>
                    <FieldWrapper label="Mô Tả">
                        <textarea value={item.description} onChange={e => handleChange('description', e.target.value)} rows={3} placeholder="Mô tả vật phẩm..." className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" />
                    </FieldWrapper>
                    <FieldWrapper label="Tags (Thẻ)">
                        <TagEditor tags={item.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} />
                    </FieldWrapper>
                    <FieldWrapper label="Chỉ số thưởng">
                         <StatBonusEditor bonuses={item.bonuses} onChange={bonuses => handleChange('bonuses', bonuses)} allAttributes={allAttributes} />
                    </FieldWrapper>
                </div>

                <div className="p-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80">Hủy</button>
                    <button onClick={handleSaveChanges} className="px-5 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80">
                        <FaSave className="inline mr-2" /> Lưu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ItemEditorModal;