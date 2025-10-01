import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import type { ModTagDefinition } from '../../../types';

interface TagDefinitionEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tagDef: ModTagDefinition) => void;
    tagDef: ModTagDefinition | null;
}

const TagDefinitionEditorModal: React.FC<TagDefinitionEditorModalProps> = ({ isOpen, onClose, onSave, tagDef }) => {
    const [formData, setFormData] = useState<ModTagDefinition>({ id: '', name: '', description: '' });
    const [isNew, setIsNew] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsNew(!tagDef);
            setFormData(tagDef || { id: '', name: '', description: '' });
        }
    }, [tagDef, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'name' && isNew) {
            const newId = value.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, '');
            setFormData(prev => ({ ...prev, id: newId }));
        }
    };

    const handleSave = () => {
        if (!formData.name.trim() || !formData.id.trim()) {
            alert("Tên và ID Thể Loại không được để trống.");
            return;
        }
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={onClose}>
            <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold p-4 border-b border-gray-700" style={{color: 'var(--primary-accent-color)'}}>{isNew ? 'Thêm Định Nghĩa Thể Loại' : 'Chỉnh Sửa Định Nghĩa Thể Loại'}</h3>
                <div className="p-4 space-y-4">
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Tên Thể Loại (Vd: Cyber-Tu Chân)" className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2" style={{color: 'var(--text-color)'}} />
                    <input name="id" value={formData.id} onChange={handleChange} placeholder="ID (vd: cyber_tu_chan)" className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2" style={{color: 'var(--text-color)'}} />
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Mô tả ý nghĩa của thể loại này..." className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 resize-y" style={{color: 'var(--text-color)'}}/>
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"><FaTimes /> Hủy</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500"><FaSave /> Lưu</button>
                </div>
            </div>
        </div>
    );
};

export default TagDefinitionEditorModal;