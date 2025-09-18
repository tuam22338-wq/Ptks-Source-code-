import React, { useState, useEffect } from 'react';
import { FaSave } from 'react-icons/fa';
import type { ModTalent, InnateTalentRank, ModTalentRank } from '../../../types';
import StatBonusEditor from './StatBonusEditor';
import TagEditor from '../../../components/TagEditor';
import { INNATE_TALENT_PROBABILITY } from '../../../constants';

interface TalentEditorProps {
    onSave: (talent: ModTalent) => void;
    talentToEdit: ModTalent;
    allAttributes: string[];
    talentRanks: ModTalentRank[];
    suggestions?: string[];
}

const TALENT_RANK_OPTIONS = INNATE_TALENT_PROBABILITY.map(r => r.rank);

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);

const TalentEditor: React.FC<TalentEditorProps> = ({ onSave, talentToEdit, allAttributes, talentRanks, suggestions }) => {
    const [talent, setTalent] = useState<ModTalent>(talentToEdit);

    useEffect(() => {
        setTalent(talentToEdit);
    }, [talentToEdit]);

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
        <div className="flex flex-col h-full">
            <h3 className="text-xl text-purple-400 font-bold font-title mb-4 flex-shrink-0">
                Chỉnh sửa Tiên tư: <span className="text-white">{talent.name || '(Chưa có tên)'}</span>
            </h3>

            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FieldWrapper label="Tên Tiên Tư">
                        <input type="text" value={talent.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: Thánh Thể Hoang Cổ" className="themed-input" />
                    </FieldWrapper>
                    <FieldWrapper label="Cấp Bậc">
                        <select value={talent.rank} onChange={e => handleChange('rank', e.target.value as InnateTalentRank)} className="themed-select">
                           {TALENT_RANK_OPTIONS.map(rank => (
                                <option key={rank} value={rank}>{rank}</option>
                           ))}
                        </select>
                    </FieldWrapper>
                </div>
                <FieldWrapper label="Mô Tả">
                    <textarea value={talent.description} onChange={e => handleChange('description', e.target.value)} rows={3} placeholder="Mô tả về nguồn gốc, bản chất của Tiên Tư..." className="themed-textarea" />
                </FieldWrapper>
                <FieldWrapper label="Tags (Thẻ)">
                    <TagEditor tags={talent.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} />
                </FieldWrapper>
                <FieldWrapper label="Chỉ số thưởng">
                     <StatBonusEditor bonuses={talent.bonuses} onChange={bonuses => handleChange('bonuses', bonuses)} allAttributes={allAttributes} />
                </FieldWrapper>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                <button onClick={handleSaveChanges} className="px-5 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80">
                    <FaSave className="inline mr-2" /> Cập nhật Tiên Tư
                </button>
            </div>
        </div>
    );
};

export default TalentEditor;
