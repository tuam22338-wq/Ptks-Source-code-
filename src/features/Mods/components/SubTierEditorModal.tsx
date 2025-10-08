import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import type { ProgressionSubTier, StatBonus, AttributeDefinition } from '../../../types';

interface SubTierEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (subTier: ProgressionSubTier) => void;
    subTier: ProgressionSubTier | null;
    attributeDefinitions: AttributeDefinition[];
    resourceName: string;
    resourceUnit: string;
}

const SubTierEditorModal: React.FC<SubTierEditorModalProps> = ({ isOpen, onClose, onSave, subTier, attributeDefinitions, resourceName, resourceUnit }) => {
    const [formData, setFormData] = useState<ProgressionSubTier>({ id: '', name: '', resourceRequired: 0, bonuses: [], breakthroughRequirements: '' });
    const [newBonus, setNewBonus] = useState<{ attribute: string; value: number }>({ attribute: '', value: 0 });

    useEffect(() => {
        if (isOpen) {
            const isInfinite = subTier?.resourceRequired === null || subTier?.resourceRequired === Infinity;
            const initialResource = isInfinite ? Infinity : (subTier?.resourceRequired || 0);

            setFormData(subTier ? { ...subTier, resourceRequired: initialResource } : { id: `stage_${Date.now()}`, name: '', resourceRequired: 0, bonuses: [], breakthroughRequirements: '' });
            
            if (attributeDefinitions.length > 0) {
                const defaultAttr = attributeDefinitions[0]?.name || '';
                setNewBonus({ attribute: defaultAttr, value: 0 });
            }
        }
    }, [subTier, isOpen, attributeDefinitions]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'resourceRequired') {
            if (value.trim().toLowerCase() === 'infinity' || value.trim().toLowerCase() === 'vô hạn') {
                setFormData(prev => ({ ...prev, resourceRequired: Infinity }));
            } else {
                setFormData(prev => ({ ...prev, resourceRequired: parseInt(value, 10) || 0 }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleBonusChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewBonus(prev => ({ ...prev, [name]: name === 'value' ? parseInt(value) || 0 : value }));
    };

    const handleAddBonus = () => {
        if (newBonus.attribute && newBonus.value !== 0) {
            setFormData(prev => ({ ...prev, bonuses: [...prev.bonuses, { ...newBonus }] }));
        }
    };

    const handleRemoveBonus = (index: number) => {
        setFormData(prev => ({ ...prev, bonuses: prev.bonuses.filter((_, i) => i !== index) }));
    };
    
    const handleSave = () => {
        if (!formData.name.trim()) {
            alert("Tên cấp bậc phụ không được để trống.");
            return;
        }
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-xl m-4 max-h-[90vh] flex flex-col rounded-xl" style={{backgroundColor: 'var(--bg-color)', boxShadow: 'var(--shadow-raised)'}} onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold p-4 border-b" style={{color: 'var(--primary-accent-color)', borderColor: 'var(--shadow-light)'}}>{subTier ? 'Chỉnh Sửa Cấp Bậc Phụ' : 'Thêm Cấp Bậc Phụ'}</h3>
                <div className="p-4 overflow-y-auto space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-muted-color)'}}>Tên</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="input-neumorphic w-full" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-muted-color)'}}>{resourceName} Yêu Cầu ({resourceUnit})</label>
                        <input
                            name="resourceRequired"
                            type="text"
                            value={!isFinite(formData.resourceRequired) ? 'Infinity' : formData.resourceRequired}
                            onChange={handleChange}
                            className="input-neumorphic w-full"
                            placeholder="Nhập số, hoặc 'Infinity'"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium mb-1" style={{color: 'var(--text-muted-color)'}}>Điều Kiện Đột Phá (Mô tả cho AI)</label>
                        <textarea
                            name="breakthroughRequirements"
                            value={formData.breakthroughRequirements || ''}
                            onChange={handleChange}
                            rows={3}
                            className="input-neumorphic w-full resize-y"
                            placeholder="Nếu được điền, quy tắc này sẽ được ưu tiên hơn yêu cầu về tài nguyên. Vd: Cần hấp thụ một 'Hồn Hoàn' vạn năm."
                        />
                    </div>
                    <div>
                        <h4 className="text-base font-semibold mb-2" style={{color: 'var(--text-color)'}}>Thuộc Tính Cộng Thêm</h4>
                        <div className="space-y-2 mb-3">
                            {formData.bonuses.map((bonus, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 rounded" style={{boxShadow: 'var(--shadow-pressed)'}}>
                                    <span className="flex-grow text-sm" style={{color: 'var(--text-color)'}}>{bonus.attribute}: <span className="font-bold text-[var(--success-color)]">{bonus.value > 0 ? `+${bonus.value}`: bonus.value}</span></span>
                                    <button onClick={() => handleRemoveBonus(index)} className="p-1 text-[var(--text-muted-color)] hover:text-red-400"><FaTrash /></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded" style={{boxShadow: 'var(--shadow-pressed)'}}>
                             <select name="attribute" value={newBonus.attribute} onChange={handleBonusChange} className="input-neumorphic !py-1 text-sm flex-grow !shadow-none">
                                {attributeDefinitions.map(attr => (
                                    <option key={attr.id} value={attr.name}>{attr.name}</option>
                                ))}
                            </select>
                            <input type="number" name="value" value={newBonus.value} onChange={handleBonusChange} className="input-neumorphic !py-1 w-24 text-sm !shadow-none" />
                            <button onClick={handleAddBonus} className="btn btn-neumorphic !p-2"><FaPlus /></button>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t flex justify-end gap-3 mt-auto" style={{borderColor: 'var(--shadow-light)'}}>
                    <button onClick={onClose} className="btn btn-neumorphic flex items-center gap-2"><FaTimes /> Hủy</button>
                    <button onClick={handleSave} className="btn btn-primary flex items-center gap-2"><FaSave /> Lưu</button>
                </div>
            </div>
        </div>
    );
};

export default SubTierEditorModal;