import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import type { ModAuxiliaryTechnique, AuxiliaryTechniqueType } from '../../../types';
import TagEditor from '../../../components/TagEditor';
import StatBonusEditor from './StatBonusEditor';
import { PHAP_BAO_RANKS } from '../../../constants';

interface AuxiliaryTechniqueEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (technique: ModAuxiliaryTechnique) => void;
    techniqueToEdit: ModAuxiliaryTechnique | null;
    allAttributes: string[];
    suggestions?: string[];
}

const TECHNIQUE_TYPES: AuxiliaryTechniqueType[] = ['Tâm Pháp', 'Độn Thuật', 'Luyện Thể', 'Kiếm Quyết', 'Thần Thông'];
const COST_TYPES = ['Linh Lực', 'Sinh Mệnh', 'Nguyên Thần'];

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);

const AuxiliaryTechniqueEditorModal: React.FC<AuxiliaryTechniqueEditorModalProps> = ({ isOpen, onClose, onSave, techniqueToEdit, allAttributes, suggestions }) => {
    const [technique, setTechnique] = useState<ModAuxiliaryTechnique | null>(null);

    useEffect(() => {
        if (isOpen) {
            const initialTechnique = techniqueToEdit 
                ? JSON.parse(JSON.stringify(techniqueToEdit))
                : { 
                    id: Date.now().toString(), 
                    name: '',
                    description: '',
                    type: 'Thần Thông' as AuxiliaryTechniqueType,
                    cost: { type: 'Linh Lực', value: 10 },
                    cooldown: 0,
                    rank: 'Phàm Giai',
                    icon: '💫',
                    requirements: [],
                    effects: [],
                    tags: []
                  };
            setTechnique(initialTechnique);
        }
    }, [isOpen, techniqueToEdit]);

    if (!isOpen || !technique) return null;

    const handleChange = (field: keyof ModAuxiliaryTechnique, value: any) => {
        setTechnique({ ...technique, [field]: value });
    };
    
    const handleCostChange = (field: 'type' | 'value', value: any) => {
        handleChange('cost', { ...technique.cost, [field]: value });
    };

    const handleSaveChanges = () => {
        if (!technique.name.trim()) {
            alert("Tên Công Pháp không được để trống.");
            return;
        }
        onSave(technique);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }}>
            <div className="bg-gray-900/95 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 w-full max-w-lg max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl text-gray-200 font-bold font-title">{techniqueToEdit ? 'Chỉnh Sửa Công Pháp Phụ' : 'Tạo Công Pháp Phụ'}</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    <FieldWrapper label="Tên Công Pháp">
                        <input type="text" value={technique.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: Hỏa Long Thuật" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" />
                    </FieldWrapper>

                     <FieldWrapper label="Mô Tả">
                        <textarea value={technique.description} onChange={e => handleChange('description', e.target.value)} rows={2} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" />
                    </FieldWrapper>
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FieldWrapper label="Loại">
                           <select value={technique.type} onChange={e => handleChange('type', e.target.value as AuxiliaryTechniqueType)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200">
                               {TECHNIQUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                           </select>
                        </FieldWrapper>
                         <FieldWrapper label="Cấp Bậc">
                           <select value={technique.rank} onChange={e => handleChange('rank', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200">
                               {Object.keys(PHAP_BAO_RANKS).map(r => <option key={r} value={r}>{r}</option>)}
                           </select>
                        </FieldWrapper>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FieldWrapper label="Loại Tiêu Hao">
                           <select value={technique.cost.type} onChange={e => handleCostChange('type', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200">
                               {COST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                           </select>
                        </FieldWrapper>
                        <FieldWrapper label="Giá trị Tiêu Hao">
                            <input type="number" value={technique.cost.value} onChange={e => handleCostChange('value', parseInt(e.target.value) || 0)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" />
                        </FieldWrapper>
                    </div>

                    <FieldWrapper label="Yêu Cầu (Chỉ số)">
                        <StatBonusEditor bonuses={technique.requirements || []} onChange={bonuses => handleChange('requirements', bonuses)} allAttributes={allAttributes} />
                    </FieldWrapper>
                    
                    <FieldWrapper label="Tags">
                        <TagEditor tags={technique.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} />
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

export default AuxiliaryTechniqueEditorModal;
