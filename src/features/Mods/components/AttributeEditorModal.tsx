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
            <div className="w-full max-w-2xl m-4 max-h-[90vh] flex flex-col rounded-xl" style={{backgroundColor: 'var(--bg-color)', boxShadow: 'var(--shadow-raised)'}} onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold p-4 border-b" style={{color: 'var(--primary-accent-color)', borderColor: 'var(--shadow-light)'}}>{originalId ? 'Chỉnh Sửa Thuộc Tính' : 'Thêm Thuộc Tính Mới'}</h3>
                <div className="p-4 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-muted-color)'}}>Tên Thuộc Tính</label>
                            <input name="name" value={formData.name} onChange={handleChange} className="input-neumorphic w-full" placeholder="Vd: Lực Lượng"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-muted-color)'}}>ID (Mã định danh)</label>
                            <input name="id" value={formData.id} onChange={handleChange} className="input-neumorphic w-full" placeholder="vd: luc_luong"/>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-muted-color)'}}>Mô Tả</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className="input-neumorphic w-full resize-y" placeholder="Vd: Sức mạnh vật lý, ảnh hưởng đến sát thương..."/>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-muted-color)'}}>Loại Thuộc Tính</label>
                             <select name="type" value={formData.type} onChange={handleChange} className="input-neumorphic w-full">
                                {ATTRIBUTE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-muted-color)'}}>Icon</label>
                            <div className="flex items-center" style={{boxShadow: 'var(--shadow-pressed)', borderRadius: '0.5rem'}}>
                                <span className="p-3 border-r" style={{borderColor: 'var(--shadow-light)'}}><IconComponent className="text-xl" style={{color: 'var(--secondary-accent-color)'}}/></span>
                                <select name="iconName" value={formData.iconName} onChange={handleChange} className="input-neumorphic w-full !shadow-none !border-0">
                                    {sortedIconNames.map(iconName => <option key={iconName} value={iconName}>{iconName}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                    {formData.type === 'SECONDARY' && (
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-muted-color)'}}>Công Thức</label>
                            <input name="formula" value={formData.formula} onChange={handleChange} className="input-neumorphic w-full font-mono" placeholder="Vd: (luc_luong * 2) + (than_phap * 0.5)"/>
                        </div>
                    )}
                    {(formData.type === 'PRIMARY' || formData.type === 'VITAL') && (
                        <div>
                            <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-muted-color)'}}>Giá Trị Cơ Bản (Base Value)</label>
                            <input name="baseValue" type="number" value={formData.baseValue} onChange={handleChange} className="input-neumorphic w-full" />
                        </div>
                    )}
                </div>
                <div className="p-4 border-t flex justify-end gap-3" style={{borderColor: 'var(--shadow-light)'}}>
                    <button onClick={onClose} className="btn btn-neumorphic flex items-center gap-2"><FaTimes /> Hủy</button>
                    <button onClick={handleSave} className="btn btn-primary flex items-center gap-2"><FaSave /> Lưu</button>
                </div>
            </div>
        </div>
    );
};

export default AttributeEditorModal;