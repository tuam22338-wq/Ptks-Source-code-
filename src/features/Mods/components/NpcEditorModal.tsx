import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import type { ModNpc } from '../../../types';
import { PERSONALITY_TRAITS } from '../../../constants';

interface NpcEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (npc: ModNpc) => void;
    npc: ModNpc | null;
}

const NpcEditorModal: React.FC<NpcEditorModalProps> = ({ isOpen, onClose, onSave, npc }) => {
    const [formData, setFormData] = useState<Omit<ModNpc, 'id' | 'tags'>>({ name: '', status: '', description: '', origin: '', personality: 'Trung Lập', locationId: '' });

    useEffect(() => {
        if (isOpen) {
            setFormData(npc || { name: '', status: '', description: '', origin: '', personality: 'Trung Lập', locationId: '' });
        }
    }, [npc, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        if (!formData.name.trim()) {
            alert("Tên NPC không được để trống.");
            return;
        }
        const finalNpc: ModNpc = {
            ...formData,
            id: npc?.id || `npc_${Date.now()}`,
            tags: [],
        };
        onSave(finalNpc);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={onClose}>
            <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold p-4 border-b border-gray-700" style={{color: 'var(--primary-accent-color)'}}>{npc ? 'Chỉnh Sửa NPC' : 'Thêm NPC'}</h3>
                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Tên NPC" className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2" style={{color: 'var(--text-color)'}} />
                    <input name="status" value={formData.status} onChange={handleChange} placeholder="Trạng thái hiện tại" className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2" style={{color: 'var(--text-color)'}} />
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={2} placeholder="Mô tả ngoại hình" className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 resize-y" style={{color: 'var(--text-color)'}}/>
                    <textarea name="origin" value={formData.origin} onChange={handleChange} rows={2} placeholder="Xuất thân" className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 resize-y" style={{color: 'var(--text-color)'}}/>
                    <select name="personality" value={formData.personality} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2" style={{color: 'var(--text-color)'}}>
                        {PERSONALITY_TRAITS.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                    <input name="locationId" value={formData.locationId} onChange={handleChange} placeholder="ID Địa điểm (tên đã chuẩn hóa)" className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2" style={{color: 'var(--text-color)'}} />
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"><FaTimes /> Hủy</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500"><FaSave /> Lưu</button>
                </div>
            </div>
        </div>
    );
};

export default NpcEditorModal;