import React, { useState, useEffect } from 'react';
import { FaSave } from 'react-icons/fa';
import type { ModAuxiliaryTechnique, AuxiliaryTechniqueType, Element } from '../../../types';
import TagEditor from '../../../components/TagEditor';
import StatBonusEditor from './StatBonusEditor';
import { PHAP_BAO_RANKS, SPIRITUAL_ROOT_CONFIG } from '../../../constants';

interface AuxiliaryTechniqueEditorProps {
    onSave: (technique: ModAuxiliaryTechnique) => void;
    techniqueToEdit: ModAuxiliaryTechnique;
    allAttributes: string[];
    suggestions?: string[];
}

const TECHNIQUE_TYPES: AuxiliaryTechniqueType[] = ['Tâm Pháp', 'Độn Thuật', 'Luyện Thể', 'Kiếm Quyết', 'Thần Thông'];
const COST_TYPES = ['Linh Lực', 'Sinh Mệnh', 'Nguyên Thần'];
const ELEMENT_OPTIONS = Object.keys(SPIRITUAL_ROOT_CONFIG) as Element[];

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);

const AuxiliaryTechniqueEditor: React.FC<AuxiliaryTechniqueEditorProps> = ({ onSave, techniqueToEdit, allAttributes, suggestions }) => {
    const [technique, setTechnique] = useState<ModAuxiliaryTechnique>(techniqueToEdit);

    useEffect(() => {
        setTechnique(techniqueToEdit);
    }, [techniqueToEdit]);

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
        <div className="flex flex-col h-full">
            <h3 className="text-xl text-yellow-400 font-bold font-title mb-4 flex-shrink-0">
                Chỉnh sửa Công Pháp Phụ: <span className="text-white">{technique.name || '(Chưa có tên)'}</span>
            </h3>

            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                <FieldWrapper label="Tên Công Pháp">
                    <input type="text" value={technique.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: Hỏa Long Thuật" className="themed-input" />
                </FieldWrapper>

                 <FieldWrapper label="Mô Tả">
                    <textarea value={technique.description} onChange={e => handleChange('description', e.target.value)} rows={2} className="themed-textarea" />
                </FieldWrapper>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldWrapper label="Loại">
                       <select value={technique.type} onChange={e => handleChange('type', e.target.value as AuxiliaryTechniqueType)} className="themed-select">
                           {TECHNIQUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                    </FieldWrapper>
                     <FieldWrapper label="Cấp Bậc">
                       <select value={technique.rank} onChange={e => handleChange('rank', e.target.value as any)} className="themed-select">
                           {Object.keys(PHAP_BAO_RANKS).map(r => <option key={r} value={r}>{r}</option>)}
                       </select>
                    </FieldWrapper>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FieldWrapper label="Thuộc tính Ngũ Hành">
                       <select value={technique.element || 'Vô'} onChange={e => handleChange('element', e.target.value as Element)} className="themed-select">
                           {ELEMENT_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                    </FieldWrapper>
                    <FieldWrapper label="Biểu tượng (Emoji)">
                       <input type="text" value={technique.icon} onChange={e => handleChange('icon', e.target.value)} className="themed-input" />
                    </FieldWrapper>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldWrapper label="Cấp Độ Ban Đầu">
                        <input type="number" value={technique.level} onChange={e => handleChange('level', parseInt(e.target.value) || 1)} className="themed-input" />
                    </FieldWrapper>
                    <FieldWrapper label="Cấp Độ Tối Đa">
                        <input type="number" value={technique.maxLevel} onChange={e => handleChange('maxLevel', parseInt(e.target.value) || 10)} className="themed-input" />
                    </FieldWrapper>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldWrapper label="Loại Tiêu Hao">
                       <select value={technique.cost.type} onChange={e => handleCostChange('type', e.target.value)} className="themed-select">
                           {COST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                       </select>
                    </FieldWrapper>
                    <FieldWrapper label="Giá trị Tiêu Hao">
                        <input type="number" value={technique.cost.value} onChange={e => handleCostChange('value', parseInt(e.target.value) || 0)} className="themed-input" />
                    </FieldWrapper>
                </div>
                
                 <FieldWrapper label="Hồi chiêu (số lượt)">
                    <input type="number" value={technique.cooldown} onChange={e => handleChange('cooldown', parseInt(e.target.value) || 0)} className="themed-input" />
                </FieldWrapper>

                <FieldWrapper label="Yêu Cầu (Chỉ số)">
                    <StatBonusEditor bonuses={technique.requirements || []} onChange={bonuses => handleChange('requirements', bonuses)} allAttributes={allAttributes} />
                </FieldWrapper>
                
                <FieldWrapper label="Tags">
                    <TagEditor tags={technique.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} />
                </FieldWrapper>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                <button onClick={handleSaveChanges} className="px-5 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80">
                    <FaSave className="inline mr-2" /> Cập nhật Công Pháp
                </button>
            </div>
        </div>
    );
};

export default AuxiliaryTechniqueEditor;