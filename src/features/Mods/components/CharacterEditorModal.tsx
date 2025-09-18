import React, { useState, useEffect } from 'react';
import { FaSave } from 'react-icons/fa';
import type { ModCharacter, Gender } from '../../../types';
import StatBonusEditor from './StatBonusEditor';
import TagEditor from '../../../components/TagEditor';

interface CharacterEditorProps {
    onSave: (character: ModCharacter) => void;
    characterToEdit: ModCharacter;
    allAttributes: string[];
    suggestions?: string[];
}

const GENDERS: Gender[] = ['Nam', 'Nữ'];

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);


const CharacterEditor: React.FC<CharacterEditorProps> = ({ onSave, characterToEdit, allAttributes, suggestions }) => {
    const [character, setCharacter] = useState<ModCharacter>(characterToEdit);

    useEffect(() => {
        setCharacter(characterToEdit);
    }, [characterToEdit]);

    const handleChange = (field: keyof ModCharacter, value: any) => {
        setCharacter({ ...character, [field]: value });
    };

    const handleSaveChanges = () => {
        if (!character.name.trim()) {
            alert("Tên nhân vật không được để trống.");
            return;
        }
        onSave(character);
    };

    return (
        <div className="flex flex-col h-full">
             <h3 className="text-xl text-emerald-400 font-bold font-title mb-4 flex-shrink-0">
                Chỉnh sửa Nhân vật Mẫu: <span className="text-white">{character.name || '(Chưa có tên)'}</span>
             </h3>

            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FieldWrapper label="Tên Nhân Vật">
                        <input type="text" value={character.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: Lý Tiêu Dao" className="themed-input" />
                    </FieldWrapper>
                    <FieldWrapper label="Giới Tính">
                        <select value={character.gender} onChange={e => handleChange('gender', e.target.value as Gender)} className="themed-select">
                           {GENDERS.map(gender => <option key={gender} value={gender}>{gender}</option>)}
                        </select>
                    </FieldWrapper>
                </div>
                <FieldWrapper label="Tính Cách">
                    <input type="text" value={character.personality} onChange={e => handleChange('personality', e.target.value)} placeholder="Ví dụ: Lạnh lùng, chính trực..." className="themed-input" />
                </FieldWrapper>
                <FieldWrapper label="Xuất Thân">
                    <textarea value={character.origin} onChange={e => handleChange('origin', e.target.value)} rows={2} placeholder="Mô tả nguồn gốc của nhân vật..." className="themed-textarea" />
                </FieldWrapper>
                 <FieldWrapper label="Ngoại Hình">
                    <textarea value={character.appearance} onChange={e => handleChange('appearance', e.target.value)} rows={2} placeholder="Mô tả vẻ ngoài của nhân vật..." className="themed-textarea" />
                </FieldWrapper>
                <FieldWrapper label="Tags (Thẻ)">
                    <TagEditor tags={character.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} />
                </FieldWrapper>
                <FieldWrapper label="Chỉ số cơ bản">
                    <StatBonusEditor bonuses={character.bonuses} onChange={bonuses => handleChange('bonuses', bonuses)} allAttributes={allAttributes} />
                </FieldWrapper>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                <button onClick={handleSaveChanges} className="px-5 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80">
                    <FaSave className="inline mr-2" /> Cập Nhật Nhân Vật
                </button>
            </div>
        </div>
    );
};

export default CharacterEditor;
