import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
import type { RealmConfig, RealmStage, StatBonus } from '../types';

// --- Props ---
interface RealmEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (realm: RealmConfig) => void;
    realmToEdit: RealmConfig | null;
    allAttributes: string[];
}

const RealmEditorModal: React.FC<RealmEditorModalProps> = ({ isOpen, onClose, onSave, realmToEdit, allAttributes }) => {
    const [realm, setRealm] = useState<RealmConfig | null>(null);

    useEffect(() => {
        if (isOpen) {
            const initialRealm = realmToEdit 
                ? JSON.parse(JSON.stringify(realmToEdit)) // Deep copy to avoid direct mutation
                : { id: Date.now().toString(), name: '', stages: [] };
            setRealm(initialRealm);
        }
    }, [isOpen, realmToEdit]);

    if (!isOpen || !realm) return null;

    // --- Handlers ---
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRealm({ ...realm, name: e.target.value });
    };

    const handleStageChange = (stageId: string, field: 'name' | 'qiRequired', value: string | number) => {
        const updatedStages = realm.stages.map(s => 
            s.id === stageId ? { ...s, [field]: value } : s
        );
        setRealm({ ...realm, stages: updatedStages });
    };

    const handleAddStage = () => {
        const newStage: RealmStage = { id: Date.now().toString(), name: `Giai Đoạn Mới ${realm.stages.length + 1}`, qiRequired: 100, bonuses: [] };
        setRealm({ ...realm, stages: [...realm.stages, newStage] });
    };

    const handleRemoveStage = (stageId: string) => {
        setRealm({ ...realm, stages: realm.stages.filter(s => s.id !== stageId) });
    };
    
    const handleBonusChange = (stageId: string, bonusIndex: number, field: 'attribute' | 'value', value: string | number) => {
        const updatedStages = realm.stages.map(s => {
            if (s.id === stageId) {
                const updatedBonuses = s.bonuses.map((b, i) => 
                    i === bonusIndex ? { ...b, [field]: value } : b
                );
                return { ...s, bonuses: updatedBonuses };
            }
            return s;
        });
        setRealm({ ...realm, stages: updatedStages });
    };

    const handleAddBonus = (stageId: string) => {
        const newBonus: StatBonus = { attribute: allAttributes[0] || 'Lực Lượng', value: 0 };
        const updatedStages = realm.stages.map(s => 
            s.id === stageId ? { ...s, bonuses: [...s.bonuses, newBonus] } : s
        );
        setRealm({ ...realm, stages: updatedStages });
    };

    const handleRemoveBonus = (stageId: string, bonusIndex: number) => {
         const updatedStages = realm.stages.map(s => {
            if (s.id === stageId) {
                return { ...s, bonuses: s.bonuses.filter((_, i) => i !== bonusIndex) };
            }
            return s;
        });
        setRealm({ ...realm, stages: updatedStages });
    };

    const handleSaveChanges = () => {
        if (!realm.name.trim()) {
            alert("Tên cảnh giới không được để trống.");
            return;
        }
        onSave(realm);
    };


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }}>
            <div className="bg-gray-900/95 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl text-gray-200 font-bold font-title">{realmToEdit ? 'Chỉnh Sửa Cảnh Giới' : 'Tạo Cảnh Giới Mới'}</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4 overflow-y-auto">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Tên Cảnh Giới</label>
                        <input type="text" value={realm.name} onChange={handleNameChange} placeholder="Ví dụ: Nguyên Anh Cảnh" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" />
                    </div>
                    <div>
                        <h4 className="text-lg text-gray-300 font-title mb-2">Các Giai Đoạn</h4>
                        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-2">
                            {realm.stages.map(stage => (
                                <div key={stage.id} className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                                    <div className="flex justify-between items-center mb-2">
                                        <input type="text" value={stage.name} onChange={e => handleStageChange(stage.id, 'name', e.target.value)} className="bg-transparent text-gray-200 font-semibold flex-grow focus:outline-none" />
                                        <button onClick={() => handleRemoveStage(stage.id)} className="p-1 text-gray-500 hover:text-red-400"><FaTrash /></button>
                                    </div>
                                    <div className="pl-4 border-l-2 border-gray-700/50 ml-2 space-y-2">
                                        <div>
                                            <label className="text-xs text-gray-400">Linh khí yêu cầu</label>
                                            <input type="number" value={stage.qiRequired} onChange={e => handleStageChange(stage.id, 'qiRequired', parseInt(e.target.value) || 0)} className="w-full bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-sm text-gray-300" />
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400">Chỉ số thưởng</label>
                                            {stage.bonuses.map((bonus, index) => (
                                                <div key={index} className="flex items-center gap-2 mt-1">
                                                    <select value={bonus.attribute} onChange={e => handleBonusChange(stage.id, index, 'attribute', e.target.value)} className="w-1/2 bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-sm text-gray-300">
                                                        {allAttributes.map(attr => <option key={attr} value={attr}>{attr}</option>)}
                                                    </select>
                                                    <input type="number" value={bonus.value} onChange={e => handleBonusChange(stage.id, index, 'value', parseInt(e.target.value) || 0)} className="w-1/2 bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-sm text-gray-300" />
                                                    <button onClick={() => handleRemoveBonus(stage.id, index)} className="p-1 text-gray-500 hover:text-red-400"><FaTrash size={12}/></button>
                                                </div>
                                            ))}
                                            <button onClick={() => handleAddBonus(stage.id)} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 mt-2">
                                                <FaPlus size={10} /> Thêm chỉ số thưởng
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                         <button onClick={handleAddStage} className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-gray-700/80 text-white text-sm font-bold rounded-lg hover:bg-gray-600/80">
                            <FaPlus /> Thêm Giai Đoạn
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80 transition-colors">Hủy</button>
                    <button onClick={handleSaveChanges} className="px-5 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 transition-colors">
                        <FaSave className="inline mr-2" /> Lưu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RealmEditorModal;