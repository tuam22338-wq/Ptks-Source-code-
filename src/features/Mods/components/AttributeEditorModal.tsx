import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import type { AttributeDefinition, AttributeGroupDefinition } from '../../../types';
import { UI_ICONS } from '../../../constants';

interface AttributeEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (attribute: AttributeDefinition) => void;
    attribute: AttributeDefinition | null; // null if creating a new one
    group: AttributeGroupDefinition;
}

const ATTRIBUTE_TYPES: AttributeDefinition['type'][] = ['PRIMARY', 'SECONDARY', 'VITAL', 'INFORMATIONAL'];
const sortedIconNames = Object.keys(UI_ICONS).sort();

const AttributeEditorModal: React.FC<AttributeEditorModalProps> = ({ isOpen, onClose, onSave, attribute, group }) => {
    const [formData, setFormData] = useState<AttributeDefinition>({
        id: '', name: '', description: '', iconName: 'GiPerspectiveDiceSixFacesRandom',
        type: 'PRIMARY', baseValue: 10, formula: '', group: group.id
    });
     const [originalId, setOriginalId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const initialData = {
                id: attribute?.id || '',
                name: attribute?.name || '',
                description: attribute?.description || '',
                iconName: attribute?.iconName || 'GiPerspectiveDiceSixFacesRandom',
                type: attribute?.type || 'PRIMARY',
                baseValue: attribute?.baseValue === undefined ? 10 : attribute.baseValue,
                formula: attribute?.formula || '',
                group: group.id
            };
            setFormData(initialData);
            setOriginalId(attribute?.id || null);
        }
    }, [attribute, group, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Auto-generate ID for new attributes, but allow user to override
        if (name === 'name' && !originalId) {
            const newId = value.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, '');
            setFormData(prev => ({ ...prev, id: newId }));
        }
    };

    const handleSave = () => {
        if (!formData.name.trim() || !formData.id.trim()) {
            alert("Tên và ID không được để trống.");
            return;
        }
        onSave(formData);
    };

    if (!isOpen) return null;

    const IconComponent = UI_ICONS[formData.iconName] || (() => <span />);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }} onClick={onClose}>
            <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl m-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold p-4 border-b border-gray-700 text-amber-300">{originalId ? 'Chỉnh Sửa Thuộc Tính' : 'Thêm Thuộc Tính Mới'}</h3>
                <div className="p-4 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Tên Thuộc Tính</label>
                            <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" placeholder="Vd: Lực Lượng"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">ID (Mã định danh)</label>
                            <input name="id" value={formData.id} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" placeholder="vd: luc_luong"/>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Mô Tả</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 resize-y" placeholder="Vd: Sức mạnh vật lý, ảnh hưởng đến sát thương..."/>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-gray-400 mb-1">Loại Thuộc Tính</label>
                             <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 pr-8 appearance-none">
                                {ATTRIBUTE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Icon</label>
                            <div className="flex items-center">
                                <span className="p-2 bg-black/30 border border-gray-600 rounded-l-lg"><IconComponent className="text-xl text-cyan-300"/></span>
                                <select name="iconName" value={formData.iconName} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-r-lg px-4 py-2 text-gray-200 pr-8 appearance-none border-l-0">
                                    {sortedIconNames.map(iconName => <option key={iconName} value={iconName}>{iconName}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    {formData.type === 'SECONDARY' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Công Thức</label>
                            <input name="formula" value={formData.formula} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 font-mono" placeholder="Vd: (luc_luong * 2) + (than_phap * 0.5)"/>
                        </div>
                    )}
                    {(formData.type === 'PRIMARY' || formData.type === 'VITAL') && (
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Giá Trị Cơ Bản (Base Value)</label>
                            <input name="baseValue" type="number" value={formData.baseValue} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" />
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 flex items-center gap-2"><FaTimes /> Hủy</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500 flex items-center gap-2"><FaSave /> Lưu</button>
                </div>
            </div>
        </div>
    );
};

export default AttributeEditorModal;