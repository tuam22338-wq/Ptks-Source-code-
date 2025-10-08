import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaPlus, FaTrash, FaEdit, FaChevronDown, FaChevronUp } from 'react-icons/fa';
// @google-genai-fix: Rename types to their 'Progression' equivalents to match refactored definitions.
import type { ProgressionTierConfig, ProgressionSubTier, ModAttributeSystem, NamedProgressionSystem, AttributeDefinition, StatBonus } from '../../../types';
import SubTierEditorModal from './SubTierEditorModal';

interface RealmEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (systems: NamedProgressionSystem[]) => void;
    initialSystems: NamedProgressionSystem[];
    attributeSystem: ModAttributeSystem;
}

const TierBonusEditor: React.FC<{
    tier: ProgressionTierConfig;
    onTierChange: (field: keyof ProgressionTierConfig, value: any) => void;
    attributeDefinitions: AttributeDefinition[];
}> = ({ tier, onTierChange, attributeDefinitions }) => {
    const [newBonus, setNewBonus] = useState<{ attribute: string; value: number }>({ attribute: attributeDefinitions[0]?.name || '', value: 0 });

    useEffect(() => {
        if (attributeDefinitions.length > 0 && !attributeDefinitions.find(d => d.name === newBonus.attribute)) {
            setNewBonus(prev => ({...prev, attribute: attributeDefinitions[0]?.name || ''}));
        }
    }, [attributeDefinitions, newBonus.attribute]);

    const handleBonusChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewBonus(prev => ({ ...prev, [name]: name === 'value' ? parseInt(value) || 0 : value }));
    };

    const handleAddBonus = () => {
        if (newBonus.attribute && newBonus.value !== 0) {
            const currentBonuses = tier.bonuses || [];
            onTierChange('bonuses', [...currentBonuses, { ...newBonus }]);
        }
    };

    const handleRemoveBonus = (index: number) => {
        const currentBonuses = tier.bonuses || [];
        onTierChange('bonuses', currentBonuses.filter((_, i) => i !== index));
    };

    return (
        <div className="mt-3 pt-3 border-t" style={{borderColor: 'var(--shadow-light)'}}>
            <h5 className="text-sm font-semibold mb-2" style={{color: 'var(--text-color)'}}>Thuộc Tính Cộng Thêm (Khi Đạt Đại Cảnh Giới)</h5>
            <div className="space-y-2 mb-3">
                {(tier.bonuses || []).map((bonus, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 rounded" style={{boxShadow: 'var(--shadow-pressed)'}}>
                        <span className="flex-grow text-sm" style={{color: 'var(--text-color)'}}>{bonus.attribute}: <span className="font-bold text-[var(--success-color)]">{bonus.value > 0 ? `+${bonus.value}`: bonus.value}</span></span>
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveBonus(index); }} className="p-1 text-[var(--text-muted-color)] hover:text-red-400"><FaTrash /></button>
                    </div>
                ))}
            </div>
            <div className="flex items-center gap-2 p-2 rounded" style={{boxShadow: 'var(--shadow-pressed)'}}>
                 <select name="attribute" value={newBonus.attribute} onChange={handleBonusChange} className="input-neumorphic !py-1 text-sm flex-grow !shadow-none">
                    {attributeDefinitions.map(attr => (
                        <option key={attr.id} value={attr.name}>{attr.name}</option>
                    ))}
                </select>
                <input type="number" name="value" value={newBonus.value} onChange={handleBonusChange} className="input-neumorphic !py-1 w-24 text-sm !shadow-none" />
                <button onClick={handleAddBonus} className="p-2 btn-neumorphic !rounded-md"><FaPlus /></button>
            </div>
        </div>
    );
};


const RealmEditorModal: React.FC