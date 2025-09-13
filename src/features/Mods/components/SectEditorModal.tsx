import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import type { ModSect, SectMember, SectMemberRank } from '../../../types';
import TagEditor from '../../../components/TagEditor';

interface SectEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (sect: ModSect) => void;
    sectToEdit: ModSect | null;
    suggestions?: string[];
}

const SECT_MEMBER_RANKS: SectMemberRank[] = ['Tông Chủ', 'Trưởng Lão', 'Đệ Tử Chân Truyền', 'Đệ Tử Nội Môn', 'Đệ Tử Ngoại Môn'];

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);


const SectEditorModal: React.FC<SectEditorModalProps> = ({ isOpen, onClose, onSave, sectToEdit, suggestions }) => {
    const [sect, setSect] = useState<ModSect | null>(null);

    useEffect(() => {
        if (isOpen) {
            const initialSect = sectToEdit 
                ? JSON.parse(JSON.stringify(sectToEdit))
                : { id: Date.now().toString(), name: '', description: '', location: '', members: [], tags: [] };
            setSect(initialSect);
        }
    }, [isOpen, sectToEdit]);

    if (!isOpen || !sect) return null;

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }}>
            <div className="bg-gray-900/95 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl text-gray-200 font-bold font-title">{sectToEdit ? 'Chỉnh Sửa Tông Môn' : 'Tạo Tông Môn Mới'}</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FieldWrapper label="Tên Tông Môn">
                            <input type="text" value={sect.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: Thục Sơn Kiếm Phái" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" />
                        </FieldWrapper>
                         <FieldWrapper label="Trụ Sở">
                            <input type="text" value={sect.location} onChange={e => handleChange('location', e.target.value)} placeholder="Ví dụ: Côn Lôn Sơn" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" />
                        </FieldWrapper>
                    </div>
                    <FieldWrapper label="Mô Tả">
                        <textarea value={sect.description} onChange={e => handleChange('description', e.target.value)} rows={3} placeholder="Mô tả về lịch sử, tôn chỉ của tông môn..." className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" />
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
                                        onChange={e => handleMemberChange(member.id, 'rank', e.target.value)}
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

export default SectEditorModal;