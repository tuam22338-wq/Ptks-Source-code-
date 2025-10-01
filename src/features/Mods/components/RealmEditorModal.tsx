import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaPlus, FaTrash, FaEdit, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import type { RealmConfig, SubTier, ModAttributeSystem, NamedRealmSystem } from '../../../types';
import SubTierEditorModal from './SubTierEditorModal';

interface RealmEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (systems: NamedRealmSystem[]) => void;
    initialSystems: NamedRealmSystem[];
    attributeSystem: ModAttributeSystem;
}

const RealmEditorModal: React.FC<RealmEditorModalProps> = ({ isOpen, onClose, onSave, initialSystems, attributeSystem }) => {
    const [tiers, setTiers] = useState<RealmConfig[]>([]);
    const [systemInfo, setSystemInfo] = useState({ name: '', description: '', resourceName: 'Linh Khí', resourceUnit: 'điểm' });
    const [expandedTiers, setExpandedTiers] = useState<Record<string, boolean>>({});
    const [isSubTierModalOpen, setIsSubTierModalOpen] = useState(false);
    const [editingSubTier, setEditingSubTier] = useState<{ subTier: SubTier | null; tierIndex: number }>({ subTier: null, tierIndex: -1 });

    useEffect(() => {
        if (isOpen) {
            const mainSystem = initialSystems.length > 0 ? initialSystems[0] : null;
            setTiers(mainSystem ? JSON.parse(JSON.stringify(mainSystem.realms)) : []);
            setSystemInfo({
                name: mainSystem?.name || 'Hệ Thống Sức Mạnh Chính',
                description: mainSystem?.description || 'Hệ thống tiến trình mặc định.',
                resourceName: mainSystem?.resourceName || 'Điểm Kinh Nghiệm',
                resourceUnit: mainSystem?.resourceUnit || 'điểm',
            });
            const initialExpanded = (mainSystem?.realms || []).reduce((acc, tier, index) => {
                acc[tier.id || index] = index === 0;
                return acc;
            }, {} as Record<string, boolean>);
            setExpandedTiers(initialExpanded);
        }
    }, [initialSystems, isOpen]);
    
    const handleSystemInfoChange = (field: keyof typeof systemInfo, value: string) => {
        setSystemInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveAndClose = () => {
        onSave([{ ...systemInfo, id: 'main_system', realms: tiers }]);
        onClose();
    };

    const handleTierChange = (index: number, field: keyof RealmConfig, value: any) => {
        const newTiers = [...tiers];
        (newTiers[index] as any)[field] = value;
        setTiers(newTiers);
    };
    
    const handleAddTier = () => {
        const newTier: RealmConfig = { id: `tier_${Date.now()}`, name: 'Cấp Bậc Mới', description: '', stages: [] };
        setTiers([...tiers, newTier]);
    };
    
    const handleDeleteTier = (index: number) => {
        if (window.confirm(`Bạn có chắc muốn xóa cấp bậc "${tiers[index].name}"?`)) {
            setTiers(tiers.filter((_, i) => i !== index));
        }
    };
    
    const handleOpenSubTierModal = (subTier: SubTier | null, tierIndex: number) => {
        setEditingSubTier({ subTier, tierIndex });
        setIsSubTierModalOpen(true);
    };
    
    const handleSaveSubTier = (subTier: SubTier) => {
        const newTiers = [...tiers];
        const tier = newTiers[editingSubTier.tierIndex];
        const subTierIndex = tier.stages.findIndex(s => s.id === subTier.id);
        
        if (subTierIndex > -1) {
            tier.stages[subTierIndex] = subTier;
        } else {
            tier.stages.push(subTier);
        }
        
        setTiers(newTiers);
        setIsSubTierModalOpen(false);
    };

    const handleDeleteSubTier = (tierIndex: number, subTierIndex: number) => {
        if (window.confirm("Bạn có chắc muốn xóa cấp bậc phụ này?")) {
            const newTiers = [...tiers];
            newTiers[tierIndex].stages.splice(subTierIndex, 1);
            setTiers(newTiers);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <SubTierEditorModal
                isOpen={isSubTierModalOpen}
                onClose={() => setIsSubTierModalOpen(false)}
                onSave={handleSaveSubTier}
                subTier={editingSubTier.subTier}
                attributeDefinitions={attributeSystem.definitions}
                resourceName={systemInfo.resourceName}
                resourceUnit={systemInfo.resourceUnit}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
                <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-3xl m-4 h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold p-4 border-b border-gray-700" style={{color: 'var(--primary-accent-color)'}}>Chỉnh Sửa Hệ Thống Tiến Trình</h3>
                    <div className="p-4 overflow-y-auto space-y-3">
                        <div className="p-3 bg-black/25 rounded-lg border border-gray-800/80 mb-3 space-y-3">
                            <h4 className="font-bold" style={{color: 'var(--text-color)'}}>Thông Tin Hệ Thống</h4>
                            <input value={systemInfo.name} onChange={e => handleSystemInfoChange('name', e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2" style={{color: 'var(--text-color)'}} placeholder="Tên Hệ Thống (Vd: Hệ Thống Hồn Sư)"/>
                            <div className="grid grid-cols-2 gap-2">
                                <input value={systemInfo.resourceName} onChange={e => handleSystemInfoChange('resourceName', e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2" style={{color: 'var(--text-color)'}} placeholder="Tên Tài Nguyên (Vd: Hồn Lực)"/>
                                <input value={systemInfo.resourceUnit} onChange={e => handleSystemInfoChange('resourceUnit', e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2" style={{color: 'var(--text-color)'}} placeholder="Đơn Vị (Vd: năm, cấp)"/>
                            </div>
                            <textarea value={systemInfo.description} onChange={e => handleSystemInfoChange('description', e.target.value)} rows={2} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 resize-y" style={{color: 'var(--text-color)'}} placeholder="Mô tả hệ thống..."/>
                        </div>
                        {tiers.map((tier, tierIndex) => (
                            <div key={tier.id || tierIndex} className="bg-black/25 rounded-lg border border-gray-800/80">
                                <button onClick={() => setExpandedTiers(p => ({...p, [tier.id || tierIndex]: !p[tier.id || tierIndex]}))} className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-800/50">
                                    <span className="font-bold text-lg" style={{color: 'var(--text-color)'}}>{tier.name}</span>
                                    <div className="flex items-center gap-4">
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTier(tierIndex); }} className="p-1 text-[var(--text-muted-color)] hover:text-red-400"><FaTrash /></button>
                                        {expandedTiers[tier.id || tierIndex] ? <FaChevronUp /> : <FaChevronDown />}
                                    </div>
                                </button>
                                {expandedTiers[tier.id || tierIndex] && (
                                    <div className="p-3 border-t border-gray-800/80 space-y-3">
                                        <input value={tier.name} onChange={e => handleTierChange(tierIndex, 'name', e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 mb-2" style={{color: 'var(--text-color)'}} placeholder="Tên Đại Cảnh Giới"/>
                                        <textarea value={tier.description} onChange={e => handleTierChange(tierIndex, 'description', e.target.value)} rows={2} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 resize-y" style={{color: 'var(--text-color)'}} placeholder="Mô tả..."/>
                                        <div className="space-y-2">
                                            {tier.stages.map((subTier, subTierIndex) => (
                                                <div key={subTier.id || subTierIndex} className="flex justify-between items-center p-2 bg-black/30 rounded">
                                                    <div>
                                                        <p className="text-sm font-semibold" style={{color: 'var(--text-color)'}}>{subTier.name}</p>
                                                        <p className="text-xs" style={{color: 'var(--text-muted-color)'}}>{systemInfo.resourceName}: {!isFinite(subTier.qiRequired) ? 'Vô Hạn' : (subTier.qiRequired || 0).toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleOpenSubTierModal(subTier, tierIndex)} className="p-1 text-[var(--text-muted-color)] hover:text-white"><FaEdit /></button>
                                                        <button onClick={() => handleDeleteSubTier(tierIndex, subTierIndex)} className="p-1 text-[var(--text-muted-color)] hover:text-red-400"><FaTrash /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => handleOpenSubTierModal(null, tierIndex)} className="w-full mt-2 text-sm hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded" style={{color: 'var(--secondary-accent-color)'}}>
                                            <FaPlus /> Thêm Cấp Bậc Phụ
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button onClick={handleAddTier} className="w-full mt-3 text-base hover:text-amber-200 flex items-center justify-center gap-2 p-2 bg-amber-900/30 rounded border border-amber-500/30" style={{color: 'var(--primary-accent-color)'}}>
                            <FaPlus /> Thêm Cấp Bậc Chính
                        </button>
                    </div>
                    <div className="p-4 border-t border-gray-700 flex justify-end gap-3 mt-auto">
                        <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 flex items-center gap-2"><FaTimes /> Hủy</button>
                        <button onClick={handleSaveAndClose} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500 flex items-center gap-2"><FaSave /> Lưu & Đóng</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RealmEditorModal;