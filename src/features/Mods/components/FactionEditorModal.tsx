import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import type { Faction } from '../../../types';

interface FactionEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (faction: Faction) => void;
    faction: Faction | null;
}

const FactionEditorModal: React.FC<FactionEditorModalProps> = ({ isOpen, onClose, onSave, faction }) => {
    const [formData, setFormData] = useState<Faction>({ name: '', description: '', imageUrl: '' });

    useEffect(() => {
        if (isOpen) {
            setFormData(faction || { name: '', description: '', imageUrl: '' });
        }
    }, [faction, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!formData.name.trim()) {
            alert("Tên phe phái không được để trống.");
            return;
        }
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={onClose}>
            <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold p-4 border-b border-gray-700 text-amber-300">{faction ? 'Chỉnh Sửa Phe Phái' : 'Thêm Phe Phái'}</h3>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Tên Phe Phái</label>
                        <input name="name" value={formData.name} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" disabled={!!faction}/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Mô Tả</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 resize-y"/>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"><FaTimes /> Hủy</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500"><FaSave /> Lưu</button>
                </div>
            </div>
        </div>
    );
};

export default FactionEditorModal;
