import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import type { QuickActionButtonConfig } from '../../../types';
import { UI_ICONS } from '../../../constants';

interface QuickActionButtonEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (button: QuickActionButtonConfig) => void;
    button: QuickActionButtonConfig | null;
}

const sortedIconNames = Object.keys(UI_ICONS).sort();

const QuickActionButtonEditorModal: React.FC<QuickActionButtonEditorModalProps> = ({ isOpen, onClose, onSave, button }) => {
    const [formData, setFormData] = useState<QuickActionButtonConfig>({
        id: '', label: '', description: '', iconName: 'FaBolt', actionText: ''
    });
    const [isNew, setIsNew] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsNew(!button);
            const initialData = button || {
                id: '', label: '', description: '', iconName: 'FaBolt', actionText: ''
            };
            setFormData(initialData);
        }
    }, [button, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'label' && isNew) {
            const newId = value.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, '');
            setFormData(prev => ({ ...prev, id: newId }));
        }
    };

    const handleSave = () => {
        if (!formData.label.trim() || !formData.id.trim() || !formData.actionText.trim()) {
            alert("Tên, ID, và Lệnh Hành Động không được để trống.");
            return;
        }
        onSave(formData);
    };

    if (!isOpen) return null;

    const IconComponent = UI_ICONS[formData.iconName] || (() => <span />);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }} onClick={onClose}>
            <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl m-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold p-4 border-b border-gray-700 text-amber-300">{isNew ? 'Thêm Nút Mới' : 'Chỉnh Sửa Nút'}</h3>
                <div className="p-4 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Tên Nút (Label)</label>
                            <input name="label" value={formData.label} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" placeholder="Vd: Tu Luyện"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">ID (Mã định danh)</label>
                            <input name="id" value={formData.id} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" placeholder="vd: tu_luyen"/>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Mô Tả (Tooltip)</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 resize-y" placeholder="Vd: Hấp thụ linh khí tăng tu vi..."/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Lệnh Hành Động</label>
                        <input name="actionText" value={formData.actionText} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" placeholder="Vd: ta bắt đầu tu luyện"/>
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
                <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 flex items-center gap-2"><FaTimes /> Hủy</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500 flex items-center gap-2"><FaSave /> Lưu</button>
                </div>
            </div>
        </div>
    );
};

export default QuickActionButtonEditorModal;