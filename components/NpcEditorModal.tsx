import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import type { ModNpc } from '../types';
import TagEditor from './TagEditor';
import { WORLD_MAP } from '../constants';

interface NpcEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (npc: ModNpc) => void;
    npcToEdit: ModNpc | null;
    suggestions?: string[];
}

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);

const NpcEditorModal: React.FC<NpcEditorModalProps> = ({ isOpen, onClose, onSave, npcToEdit, suggestions }) => {
    const [npc, setNpc] = useState<ModNpc | null>(null);

    useEffect(() => {
        if (isOpen) {
            const initialNpc = npcToEdit 
                ? JSON.parse(JSON.stringify(npcToEdit))
                : { 
                    id: Date.now().toString(), 
                    name: '', 
                    status: '',
                    description: '',
                    origin: '',
                    personality: '',
                    locationId: WORLD_MAP[0]?.id || '',
                    tags: [] 
                  };
            setNpc(initialNpc);
        }
    }, [isOpen, npcToEdit]);

    if (!isOpen || !npc) return null;

    const handleChange = (field: keyof ModNpc, value: any) => {
        setNpc({ ...npc, [field]: value });
    };

    const handleSaveChanges = () => {
        if (!npc.name.trim()) {
            alert("Tên NPC không được để trống.");
            return;
        }
        onSave(npc);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }}>
            <div className="bg-gray-900/95 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl text-gray-200 font-bold font-title">{npcToEdit ? 'Chỉnh Sửa NPC' : 'Tạo NPC Mới'}</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FieldWrapper label="Tên NPC">
                            <input type="text" value={npc.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: Khương Tử Nha" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" />
                        </FieldWrapper>
                        <FieldWrapper label="Vị Trí Ban Đầu">
                           <select value={npc.locationId} onChange={e => handleChange('locationId', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200">
                               {WORLD_MAP.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                           </select>
                        </FieldWrapper>
                    </div>
                    <FieldWrapper label="Trạng Thái Hiện Tại">
                        <input type="text" value={npc.status} onChange={e => handleChange('status', e.target.value)} placeholder="Ví dụ: Đang câu cá bên bờ sông Vị Thủy" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" />
                    </FieldWrapper>
                    <FieldWrapper label="Mô Tả Ngoại Hình">
                        <textarea value={npc.description} onChange={e => handleChange('description', e.target.value)} rows={2} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" />
                    </FieldWrapper>
                     <FieldWrapper label="Xuất Thân">
                        <textarea value={npc.origin} onChange={e => handleChange('origin', e.target.value)} rows={2} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" />
                    </FieldWrapper>
                    <FieldWrapper label="Tính Cách">
                        <input type="text" value={npc.personality} onChange={e => handleChange('personality', e.target.value)} placeholder="Ví dụ: Chính trực, thông tuệ" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" />
                    </FieldWrapper>
                    <FieldWrapper label="Tags">
                        <TagEditor tags={npc.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} />
                    </FieldWrapper>
                     {/* TODO: Add UI for Talents and Relationships */}
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

export default NpcEditorModal;
