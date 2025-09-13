import React from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import type { StatBonus } from '../../../types';

interface StatBonusEditorProps {
    bonuses: StatBonus[];
    onChange: (bonuses: StatBonus[]) => void;
    allAttributes: string[];
}

const StatBonusEditor: React.FC<StatBonusEditorProps> = ({ bonuses, onChange, allAttributes }) => {
    const handleBonusChange = (index: number, field: keyof StatBonus, value: any) => {
        const newBonuses = [...bonuses];
        newBonuses[index] = { ...newBonuses[index], [field]: field === 'value' ? parseInt(value) || 0 : value };
        onChange(newBonuses);
    };

    const addBonus = () => {
        onChange([...bonuses, { attribute: allAttributes[0] || 'Lực Lượng', value: 0 }]);
    };
    
    const removeBonus = (index: number) => {
        onChange(bonuses.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-3">
            <div className="space-y-2 max-h-[25vh] overflow-y-auto pr-2 custom-scrollbar">
                {bonuses.length > 0 ? bonuses.map((bonus, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-black/20 rounded-md border border-gray-700/60">
                        <select 
                            value={bonus.attribute} 
                            onChange={e => handleBonusChange(index, 'attribute', e.target.value)} 
                            className="w-1/2 bg-gray-800/70 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                        >
                            {allAttributes.map(attr => <option key={attr} value={attr}>{attr}</option>)}
                        </select>
                        <input 
                            type="number" 
                            value={bonus.value} 
                            onChange={e => handleBonusChange(index, 'value', e.target.value)} 
                            className="w-1/2 bg-gray-800/70 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-teal-400/50" 
                        />
                        <button onClick={() => removeBonus(index)} className="p-2 text-gray-500 hover:text-red-400 transition-colors"><FaTrash /></button>
                    </div>
                )) : (
                    <p className="text-sm text-gray-500 text-center py-2">Chưa có chỉ số thưởng nào.</p>
                )}
            </div>
            <button 
                onClick={addBonus} 
                className="flex items-center gap-2 w-full justify-center px-3 py-2 bg-gray-700/80 text-white text-sm font-bold rounded-lg hover:bg-gray-600/80 transition-colors"
            >
                <FaPlus /> Thêm Chỉ Số
            </button>
        </div>
    );
};

export default StatBonusEditor;
