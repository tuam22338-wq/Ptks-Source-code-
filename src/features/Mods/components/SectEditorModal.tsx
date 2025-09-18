import React, { useState, useEffect } from 'react';
import { FaSave, FaPlus, FaTrash } from 'react-icons/fa';
import type { ModSect, SectMember, SectMemberRank } from '../../../types';
import TagEditor from '../../../components/TagEditor';

interface SectEditorProps {
    onSave: (sect: ModSect) => void;
    sectToEdit: ModSect;
    suggestions?: string[];
}

const SECT_MEMBER_RANKS: SectMemberRank[] = ['Tông Chủ', 'Trưởng Lão', 'Đệ Tử Chân Truyền', 'Đệ Tử Nội Môn', 'Đệ Tử Ngoại Môn'];

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);


const SectEditor: React.FC<SectEditorProps> = ({ onSave, sectToEdit, suggestions }) => {
    const [sect, setSect] = useState<ModSect>(sectToEdit);

     useEffect(() => {
        setSect(sectToEdit);
    }, [sectToEdit]);

    const handleChange = (field: keyof ModSect, value: any) => {
        setSect({ ...sect, [field]: value });
    };

    const handleMemberChange = (id: string, field: keyof SectMember, value: string) => {
        const updatedMembers = sect.members.map(m =>
            m.id === id ? { ...m, [field]: value } : m
        );
        handleChange('members', updatedMembers);
    };

    const handleAddMember = () => {
        const newMember: SectMember = { id: Date.now().toString(), name: '', rank: 'Đệ Tử Ngoại Môn', description: '' };
        handleChange('members', [...sect.members, newMember]);
    };

    const handleRemoveMember = (id: string) => {
        handleChange('members', sect.members.filter(m => m.id !== id));
    };

    const handleSaveChanges = () => {
        if (!sect.name.trim()) {
            alert("Tên Tông Môn không được để trống.");
            return;
        }
        onSave(sect);
    };

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-xl text-gray-400 font-bold font-title mb-4 flex-shrink-0">
                Chỉnh sửa Tông Môn: <span className="text-white">{sect.name || '(Chưa có tên)'}</span>
            </h3>
            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FieldWrapper label="Tên Tông Môn">
                        <input type="text" value={sect.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: Thục Sơn Kiếm Phái" className="themed-input" />
                    </FieldWrapper>
                     <FieldWrapper label="Trụ Sở">
                        <input type="text" value={sect.location} onChange={e => handleChange('location', e.target.value)} placeholder="Ví dụ: Côn Lôn Sơn" className="themed-input" />
                    </FieldWrapper>
                </div>
                <FieldWrapper label="Mô Tả">
                    <textarea value={sect.description} onChange={e => handleChange('description', e.target.value)} rows={3} placeholder="Mô tả về lịch sử, tôn chỉ của tông môn..." className="themed-textarea" />
                </FieldWrapper>
                <FieldWrapper label="Tags (Thẻ)">
                    <TagEditor tags={sect.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} />
                </FieldWrapper>
                <FieldWrapper label="Thành Viên">
                    <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar bg-black/20 p-3 rounded-lg border border-gray-700/60">
                         {sect.members.length > 0 ? sect.members.map((member) => (
                            <div key={member.id} className="grid grid-cols-12 gap-2 items-center">
                                <input 
                                    type="text" 
                                    value={member.name} 
                                    onChange={e => handleMemberChange(member.id, 'name', e.target.value)}
                                    placeholder="Tên"
                                    className="col-span-5 bg-gray-800/70 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-300" 
                                />
                                 <select 
                                    value={member.rank} 
                                    onChange={e => handleMemberChange(member.id, 'rank', e.target.value as SectMemberRank)}
                                    className="col-span-6 bg-gray-800/70 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-300"
                                >
                                    {SECT_MEMBER_RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <button onClick={() => handleRemoveMember(member.id)} className="col-span-1 p-2 text-gray-500 hover:text-red-400"><FaTrash /></button>
                            </div>
                         )) : <p className="text-sm text-gray-500 text-center py-2">Chưa có thành viên nào.</p>}
                    </div>
                    <button 
                        onClick={handleAddMember} 
                        className="mt-2 flex items-center gap-2 w-full justify-center px-3 py-2 bg-gray-700/80 text-white text-sm font-bold rounded-lg hover:bg-gray-600/80 transition-colors"
                    >
                        <FaPlus /> Thêm Thành Viên
                    </button>
                </FieldWrapper>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                <button onClick={handleSaveChanges} className="px-5 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80">
                    <FaSave className="inline mr-2" /> Cập Nhật Tông Môn
                </button>
            </div>
        </div>
    );
};

export default SectEditor;
