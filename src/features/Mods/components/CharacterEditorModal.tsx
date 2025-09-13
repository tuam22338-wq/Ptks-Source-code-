import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import type { ModCharacter, Gender } from '../../../types';
import StatBonusEditor from './StatBonusEditor';
import TagEditor from '../../../components/TagEditor';

interface CharacterEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (character: ModCharacter) => void;
    characterToEdit: ModCharacter | null;
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


const CharacterEditorModal: React.FC<CharacterEditorModalProps> = ({ isOpen, onClose, onSave, characterToEdit, allAttributes, suggestions }) => {
    const [character, setCharacter] = useState<ModCharacter | null>(null);

    useEffect(() => {
        if (isOpen) {
            const initialCharacter = characterToEdit 
                ? JSON.parse(JSON.stringify(characterToEdit))
                : { id: Date.now().toString(), name: '', gender: 'Nam' as Gender, origin: '', appearance: '', personality: '', bonuses: [], tags: [] };
            setCharacter(initialCharacter);
        }
    }, [isOpen, characterToEdit]);

    if (!isOpen || !character) return null;

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }}>
            <div className="bg-gray-900/95 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl text-gray-200 font-bold font-title">{characterToEdit ? 'Chỉnh Sửa Nhân Vật' : 'Tạo Nhân Vật Mới'}</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <FieldWrapper label="Tên Nhân Vật">
                            <input type="text" value={character.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: Lý Tiêu Dao" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" />
                        </FieldWrapper>
                        <FieldWrapper label="Giới Tính">
                            <select value={character.gender} onChange={e => handleChange('gender', e.target.value as Gender)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50">
                               {GENDERS.map(gender => <option key={gender} value={gender}>{gender}</option>)}
                            </select>
                        </FieldWrapper>
                    </div>
                    <FieldWrapper label="Tính Cách">
                        <input type="text" value={character.personality} onChange={e => handleChange('personality', e.target.value)} placeholder="Ví dụ: Lạnh lùng, chính trực..." className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" />
                    </FieldWrapper>
                    <FieldWrapper label="Xuất Thân">
                        <textarea value={character.origin} onChange={e => handleChange('origin', e.target.value)} rows={2} placeholder="Mô tả nguồn gốc của nhân vật..." className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" />
                    </FieldWrapper>
                     <FieldWrapper label="Ngoại Hình">
                        <textarea value={character.appearance} onChange={e => handleChange('appearance', e.target.value)} rows={2} placeholder="Mô tả vẻ ngoài của nhân vật..." className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" />
                    </FieldWrapper>
                    <FieldWrapper label="Tags (Thẻ)">
                        <TagEditor tags={character.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} />
                    </FieldWrapper>
                    <FieldWrapper label="Chỉ số cơ bản">
                        <StatBonusEditor bonuses={character.bonuses} onChange={bonuses => handleChange('bonuses', bonuses)} allAttributes={allAttributes} />
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

export default CharacterEditorModal;