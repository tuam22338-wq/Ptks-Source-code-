import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import type { RealmStage, StatBonus, AttributeDefinition } from '../../../types';

interface RealmStageEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (stage: RealmStage) => void;
    stage: RealmStage | null;
    attributeDefinitions: AttributeDefinition[];
}

const RealmStageEditorModal: React.FC<RealmStageEditorModalProps> = ({ isOpen, onClose, onSave, stage, attributeDefinitions }) => {
    const [formData, setFormData] = useState<RealmStage>({ id: '', name: '', qiRequired: 0, bonuses: [] });
    const [newBonus, setNewBonus] = useState<{ attribute: string; value: number }>({ attribute: '', value: 0 });

    useEffect(() => {
        if (isOpen) {
            const isInfinite = stage?.qiRequired === null || stage?.qiRequired === Infinity;
            const initialQi = isInfinite ? Infinity : (stage?.qiRequired || 0);

            setFormData(stage ? { ...stage, qiRequired: initialQi } : { id: `stage_${Date.now()}`, name: '', qiRequired: 0, bonuses: [] });
            
            if (attributeDefinitions.length > 0) {
                const defaultAttr = attributeDefinitions[0]?.name || '';
                setNewBonus({ attribute: defaultAttr, value: 0 });
            }
        }
    }, [stage, isOpen, attributeDefinitions]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'qiRequired') {
            if (value.trim().toLowerCase() === 'infinity' || value.trim().toLowerCase() === 'vô hạn') {
                setFormData(prev => ({ ...prev, qiRequired: Infinity }));
            } else {
                setFormData(prev => ({ ...prev, qiRequired: parseInt(value, 10) || 0 }));
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
            alert("Tên tiểu cảnh giới không được để trống.");
            return;
        }
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-xl m-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold p-4 border-b border-gray-700 text-amber-300">{stage ? 'Chỉnh Sửa Tiểu Cảnh Giới' : 'Thêm Tiểu Cảnh Giới'}</h3>
                <div className="p-4 overflow-y-auto space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Tên</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Linh Khí Yêu Cầu</label>
                        <input
                            name="qiRequired"
                            type="text"
                            value={!isFinite(formData.qiRequired) ? 'Infinity' : formData.qiRequired}
                            onChange={handleChange}
                            className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200"
                            placeholder="Nhập số, hoặc 'Infinity'"
                        />
                    </div>
                    <div>
                        <h4 className="text-base font-semibold text-gray-300 mb-2">Thuộc Tính Cộng Thêm</h4>
                        <div className="space-y-2 mb-3">
                            {formData.bonuses.map((bonus, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-black/20 rounded">
                                    <span className="flex-grow text-sm text-gray-300">{bonus.attribute}: <span className="font-bold text-teal-300">{bonus.value > 0 ? `+${bonus.value}`: bonus.value}</span></span>
                                    <button onClick={() => handleRemoveBonus(index)} className="p-1 text-gray-400 hover:text-red-400"><FaTrash /></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-black/25 border border-gray-700/60 rounded">
                             <select name="attribute" value={newBonus.attribute} onChange={handleBonusChange} className="bg-black/30 border border-gray-600 rounded-lg px-2 py-1 text-gray-200 text-sm flex-grow">
                                {attributeDefinitions.map(attr => (
                                    <option key={attr.id} value={attr.name}>{attr.name}</option>
                                ))}
                            </select>
                            <input type="number" name="value" value={newBonus.value} onChange={handleBonusChange} className="w-24 bg-black/30 border border-gray-600 rounded-lg px-2 py-1 text-gray-200 text-sm" />
                            <button onClick={handleAddBonus} className="p-2 text-green-400 hover:text-white bg-green-900/50 rounded"><FaPlus /></button>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end gap-3 mt-auto">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 flex items-center gap-2"><FaTimes /> Hủy</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500 flex items-center gap-2"><FaSave /> Lưu</button>
                </div>
            </div>
        </div>
    );
};

export default RealmStageEditorModal;