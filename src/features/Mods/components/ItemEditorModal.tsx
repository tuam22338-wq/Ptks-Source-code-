import React, { useState, useEffect } from 'react';
import { FaSave, FaPlus, FaTrash } from 'react-icons/fa';
import type { ModItem, ItemType, ItemQuality, EquipmentSlot } from '../../../types';
import StatBonusEditor from './StatBonusEditor';
import TagEditor from '../../../components/TagEditor';
import { ITEM_QUALITY_STYLES } from '../../../constants';

interface ItemEditorProps {
    onSave: (item: ModItem) => void;
    itemToEdit: ModItem;
    allAttributes: string[];
    suggestions?: string[];
}

const ITEM_TYPE_OPTIONS: ItemType[] = ['Vũ Khí', 'Phòng Cụ', 'Đan Dược', 'Pháp Bảo', 'Tạp Vật', 'Đan Lô', 'Linh Dược', 'Đan Phương', 'Nguyên Liệu'];
const ITEM_QUALITY_OPTIONS = Object.keys(ITEM_QUALITY_STYLES) as ItemQuality[];
const EQUIPMENT_SLOT_OPTIONS: EquipmentSlot[] = ['Vũ Khí', 'Thượng Y', 'Hạ Y', 'Giày', 'Phụ Kiện 1', 'Phụ Kiện 2'];

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);

const ItemEditor: React.FC<ItemEditorProps> = ({ onSave, itemToEdit, allAttributes, suggestions }) => {
    const [item, setItem] = useState<ModItem>(itemToEdit);

    useEffect(() => {
        setItem(itemToEdit);
    }, [itemToEdit]);

    const handleChange = (field: keyof ModItem, value: any) => {
        setItem({ ...item, [field]: value });
    };

    const handleVitalEffectChange = (index: number, field: 'vital' | 'value', value: any) => {
        const newEffects = [...(item.vitalEffects || [])];
        newEffects[index] = { ...newEffects[index], [field]: value };
        handleChange('vitalEffects', newEffects);
    };

    const addVitalEffect = () => {
        const newEffect = { vital: 'hunger' as const, value: 10 };
        handleChange('vitalEffects', [...(item.vitalEffects || []), newEffect]);
    };

    const removeVitalEffect = (index: number) => {
        handleChange('vitalEffects', (item.vitalEffects || []).filter((_, i) => i !== index));
    };

    const handleSaveChanges = () => {
        if (!item.name.trim()) {
            alert("Tên Vật Phẩm không được để trống.");
            return;
        }
        onSave(item);
    };

    return (
        <div className="flex flex-col h-full">
             <h3 className="text-xl text-sky-400 font-bold font-title mb-4 flex-shrink-0">
                Chỉnh sửa Vật phẩm: <span className="text-white">{item.name || '(Chưa có tên)'}</span>
             </h3>

            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldWrapper label="Tên Vật Phẩm">
                        <input type="text" value={item.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: Tru Tiên Kiếm" className="themed-input" />
                    </FieldWrapper>
                     <FieldWrapper label="Biểu tượng (Emoji)">
                        <input type="text" value={item.icon || ''} onChange={e => handleChange('icon', e.target.value)} className="themed-input" />
                    </FieldWrapper>
                </div>
                <FieldWrapper label="Mô Tả">
                    <textarea value={item.description} onChange={e => handleChange('description', e.target.value)} rows={3} placeholder="Mô tả vật phẩm..." className="themed-textarea" />
                </FieldWrapper>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FieldWrapper label="Loại Vật Phẩm">
                        <select value={item.type} onChange={e => handleChange('type', e.target.value as ItemType)} className="themed-select">
                           {ITEM_TYPE_OPTIONS.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </FieldWrapper>
                     <FieldWrapper label="Phẩm Chất">
                        <select value={item.quality} onChange={e => handleChange('quality', e.target.value as ItemQuality)} className="themed-select">
                           {ITEM_QUALITY_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                        </select>
                    </FieldWrapper>
                </div>
                {(item.type === 'Vũ Khí' || item.type === 'Phòng Cụ' || item.type === 'Pháp Bảo') && (
                     <FieldWrapper label="Vị trí trang bị">
                        <select value={item.slot || ''} onChange={e => handleChange('slot', e.target.value as EquipmentSlot)} className="themed-select">
                           <option value="">Không có</option>
                           {EQUIPMENT_SLOT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </FieldWrapper>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldWrapper label="Trọng Lượng">
                        <input type="number" value={item.weight} onChange={e => handleChange('weight', parseFloat(e.target.value) || 0)} className="themed-input" />
                    </FieldWrapper>
                    <FieldWrapper label="Giá Trị (Bạc)">
                        <input type="number" value={item.value || 0} onChange={e => handleChange('value', parseInt(e.target.value) || 0)} className="themed-input" />
                    </FieldWrapper>
                </div>
                <FieldWrapper label="Tags (Thẻ)">
                    <TagEditor tags={item.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} />
                </FieldWrapper>
                <FieldWrapper label="Hiệu ứng Sinh Tồn">
                    <div className="space-y-2">
                        {(item.vitalEffects || []).map((effect, index) => (
                             <div key={index} className="flex items-center gap-2 p-2 bg-black/20 rounded-md border border-gray-700/60">
                                <select value={effect.vital} onChange={e => handleVitalEffectChange(index, 'vital', e.target.value)} className="w-1/2 bg-gray-800/70 border border-gray-600 rounded px-2 py-1.5 text-sm">
                                    <option value="hunger">No Bụng</option>
                                    <option value="thirst">Nước Uống</option>
                                </select>
                                <input type="number" value={effect.value} onChange={e => handleVitalEffectChange(index, 'value', parseInt(e.target.value) || 0)} className="w-1/2 bg-gray-800/70 border border-gray-600 rounded px-2 py-1.5 text-sm" />
                                <button onClick={() => removeVitalEffect(index)} className="p-2 text-gray-500 hover:text-red-400"><FaTrash /></button>
                            </div>
                        ))}
                        <button onClick={addVitalEffect} className="flex items-center gap-2 w-full justify-center px-3 py-2 bg-gray-700/80 text-white text-sm font-bold rounded-lg hover:bg-gray-600/80"><FaPlus /> Thêm Hiệu ứng</button>
                    </div>
                </FieldWrapper>
                <FieldWrapper label="Chỉ số thưởng">
                     <StatBonusEditor bonuses={item.bonuses} onChange={bonuses => handleChange('bonuses', bonuses)} allAttributes={allAttributes} />
                </FieldWrapper>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                <button onClick={handleSaveChanges} className="px-6 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80">
                    <FaSave className="inline mr-2" /> Cập Nhật Vật Phẩm
                </button>
            </div>
        </div>
    );
};

export default ItemEditor;