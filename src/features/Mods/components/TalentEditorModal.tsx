import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import type { ModTalent, InnateTalentRank, ModTalentRank } from '../../../types';
import StatBonusEditor from './StatBonusEditor';
import TagEditor from '../../../components/TagEditor';

interface TalentEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (talent: ModTalent) => void;
    talentToEdit: ModTalent | null;
    allAttributes: string[];
    talentRanks: ModTalentRank[];
    suggestions?: string[];
}

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);

const TalentEditorModal: React.FC<TalentEditorModalProps> = ({ isOpen, onClose, onSave, talentToEdit, allAttributes, talentRanks, suggestions }) => {
    const [talent, setTalent] = useState<ModTalent | null>(null);

    useEffect(() => {
        if (isOpen) {
            const defaultRank = talentRanks.length > 0 ? talentRanks[0].name : 'Phàm Giai';
            const initialTalent = talentToEdit 
                ? JSON.parse(JSON.stringify(talentToEdit))
                : { id: Date.now().toString(), name: '', description: '', rank: defaultRank, bonuses: [], tags: [] };
            setTalent(initialTalent);
        }
    }, [isOpen, talentToEdit, talentRanks]);

    if (!isOpen || !talent) return null;

    const handleChange = (field: keyof ModTalent, value: any) => {
        setTalent({ ...talent, [field]: value });
    };

    const handleSaveChanges = () => {
        if (!talent.name.trim()) {
            alert("Tên Tiên Tư không được để trống.");
            return;
        }
        onSave(talent);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }}>
            <div className="bg-gray-900/95 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl text-gray-200 font-bold font-title">{talentToEdit ? 'Chỉnh Sửa Tiên Tư' : 'Tạo Tiên Tư Mới'}</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FieldWrapper label="Tên Tiên Tư">
                            <input type="text" value={talent.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: Thánh Thể Hoang Cổ" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" />
                        </FieldWrapper>
                        <FieldWrapper label="Cấp Bậc">
                            <select value={talent.rank} onChange={e => handleChange('rank', e.target.value as InnateTalentRank)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50">
                               {talentRanks.map(rank => (
                                    <option key={rank.id} value={rank.name}>{rank.name}</option>
                               ))}
                            </select>
                        </FieldWrapper>
                    </div>
                    <FieldWrapper label="Mô Tả">
                        <textarea value={talent.description} onChange={e => handleChange('description', e.target.value)} rows={3} placeholder="Mô tả về nguồn gốc, bản chất của Tiên Tư..." className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" />
                    </FieldWrapper>
                    <FieldWrapper label="Tags (Thẻ)">
                        <TagEditor tags={talent.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} />
                    </FieldWrapper>
                    <FieldWrapper label="Chỉ số thưởng">
                         <StatBonusEditor bonuses={talent.bonuses} onChange={bonuses => handleChange('bonuses', bonuses)} allAttributes={allAttributes} />
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

export default TalentEditorModal;