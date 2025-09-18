import React, { useState, useEffect } from 'react';
import { FaSave, FaPlus, FaTrash } from 'react-icons/fa';
import type { ModNpc, NpcRelationshipInput } from '../../../types';
import TagEditor from '../../../components/TagEditor';
import { WORLD_MAP, FACTION_NAMES } from '../../../constants';

interface NpcEditorProps {
    onSave: (npc: ModNpc) => void;
    npcToEdit: ModNpc;
    suggestions?: string[];
}

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);

const NpcEditor: React.FC<NpcEditorProps> = ({ onSave, npcToEdit, suggestions }) => {
    const [npc, setNpc] = useState<ModNpc>(npcToEdit);

    useEffect(() => {
        setNpc(npcToEdit);
    }, [npcToEdit]);

    const handleChange = (field: keyof ModNpc, value: any) => {
        setNpc({ ...npc, [field]: value });
    };

    const handleRelationshipChange = (index: number, field: keyof NpcRelationshipInput, value: string) => {
        const newRelationships = [...(npc.relationships || [])];
        newRelationships[index] = { ...newRelationships[index], [field]: value };
        handleChange('relationships', newRelationships);
    };

    const addRelationship = () => {
        const newRel: NpcRelationshipInput = { targetNpcName: '', type: 'Bằng hữu', description: '' };
        handleChange('relationships', [...(npc.relationships || []), newRel]);
    };
    
    const removeRelationship = (index: number) => {
        handleChange('relationships', (npc.relationships || []).filter((_, i) => i !== index));
    };

    const handleSaveChanges = () => {
        if (!npc.name.trim()) {
            alert("Tên NPC không được để trống.");
            return;
        }
        onSave(npc);
    };

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-xl text-cyan-400 font-bold font-title mb-4 flex-shrink-0">
                Chỉnh sửa NPC: <span className="text-white">{npc.name || '(Chưa có tên)'}</span>
            </h3>

            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FieldWrapper label="Tên NPC">
                        <input type="text" value={npc.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: Khương Tử Nha" className="themed-input" />
                    </FieldWrapper>
                    <FieldWrapper label="Vị Trí Ban Đầu">
                       <select value={npc.locationId} onChange={e => handleChange('locationId', e.target.value)} className="themed-select">
                           {WORLD_MAP.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                       </select>
                    </FieldWrapper>
                </div>
                <FieldWrapper label="Phe Phái">
                   <select value={npc.faction || ''} onChange={e => handleChange('faction', e.target.value || undefined)} className="themed-select">
                       <option value="">Không có</option>
                       {FACTION_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
                   </select>
                </FieldWrapper>
                <FieldWrapper label="Trạng Thái Hiện Tại">
                    <input type="text" value={npc.status} onChange={e => handleChange('status', e.target.value)} placeholder="Ví dụ: Đang câu cá bên bờ sông Vị Thủy" className="themed-input" />
                </FieldWrapper>
                <FieldWrapper label="Mô Tả Ngoại Hình">
                    <textarea value={npc.description} onChange={e => handleChange('description', e.target.value)} rows={2} className="themed-textarea" />
                </FieldWrapper>
                 <FieldWrapper label="Xuất Thân">
                    <textarea value={npc.origin} onChange={e => handleChange('origin', e.target.value)} rows={2} className="themed-textarea" />
                </FieldWrapper>
                <FieldWrapper label="Tính Cách">
                    <input type="text" value={npc.personality} onChange={e => handleChange('personality', e.target.value)} placeholder="Ví dụ: Chính trực, thông tuệ" className="themed-input" />
                </FieldWrapper>
                <FieldWrapper label="Tên các Tiên Tư (phân cách bằng dấu phẩy)">
                    <input type="text" value={(npc.talentNames || []).join(', ')} onChange={e => handleChange('talentNames', e.target.value.split(',').map(t => t.trim()))} placeholder="Thánh Thể Hoang Cổ, Kiếm Tâm Thông Minh" className="themed-input" />
                </FieldWrapper>
                <FieldWrapper label="Quan Hệ">
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {(npc.relationships || []).map((rel, index) => (
                            <div key={index} className="grid grid-cols-12 gap-2 items-center bg-black/20 p-2 rounded-md">
                                <input type="text" value={rel.targetNpcName} onChange={e => handleRelationshipChange(index, 'targetNpcName', e.target.value)} placeholder="Tên NPC mục tiêu" className="col-span-4 bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-sm"/>
                                <input type="text" value={rel.type} onChange={e => handleRelationshipChange(index, 'type', e.target.value)} placeholder="Loại quan hệ (vd: Sư đồ)" className="col-span-3 bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-sm"/>
                                <input type="text" value={rel.description} onChange={e => handleRelationshipChange(index, 'description', e.target.value)} placeholder="Mô tả ngắn" className="col-span-4 bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-sm"/>
                                <button onClick={() => removeRelationship(index)} className="col-span-1 p-1 text-gray-500 hover:text-red-400"><FaTrash size={12}/></button>
                            </div>
                        ))}
                    </div>
                     <button onClick={addRelationship} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 mt-2">
                        <FaPlus size={10} /> Thêm quan hệ
                    </button>
                </FieldWrapper>
                <FieldWrapper label="Tags">
                    <TagEditor tags={npc.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} />
                </FieldWrapper>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                <button onClick={handleSaveChanges} className="px-5 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80">
                    <FaSave className="inline mr-2" /> Cập Nhật NPC
                </button>
            </div>
        </div>
    );
};

export default NpcEditor;
