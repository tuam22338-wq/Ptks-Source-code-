import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaPlus, FaTrash, FaEdit, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import type { RealmConfig, SubTier, ModAttributeSystem, NamedRealmSystem, AttributeDefinition, StatBonus } from '../../../types';
import SubTierEditorModal from './SubTierEditorModal';

interface RealmEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (systems: NamedRealmSystem[]) => void;
    initialSystems: NamedRealmSystem[];
    attributeSystem: ModAttributeSystem;
}

const TierBonusEditor: React.FC<{
    tier: RealmConfig;
    onTierChange: (field: keyof RealmConfig, value: any) => void;
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
    }, [isOpen]);
    
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
        const newTier: RealmConfig = { id: `tier_${Date.now()}`, name: 'Cấp Bậc Mới', description: '', stages: [], bonuses: [] };
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
                <div className="w-full max-w-3xl m-4 h-[90vh] flex flex-col rounded-xl" style={{backgroundColor: 'var(--bg-color)', boxShadow: 'var(--shadow-raised)'}} onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold p-4 border-b" style={{color: 'var(--primary-accent-color)', borderColor: 'var(--shadow-light)'}}>Chỉnh Sửa Hệ Thống Tiến Trình</h3>
                    <div className="p-4 overflow-y-auto space-y-3">
                        <div className="neumorphic-inset-box p-3 mb-3 space-y-3">
                            <h4 className="font-bold" style={{color: 'var(--text-color)'}}>Thông Tin Hệ Thống</h4>
                            <input value={systemInfo.name} onChange={e => handleSystemInfoChange('name', e.target.value)} className="input-neumorphic w-full" placeholder="Tên Hệ Thống (Vd: Hệ Thống Hồn Sư)"/>
                            <div className="grid grid-cols-2 gap-2">
                                <input value={systemInfo.resourceName} onChange={e => handleSystemInfoChange('resourceName', e.target.value)} className="input-neumorphic w-full" placeholder="Tên Tài Nguyên (Vd: Hồn Lực)"/>
                                <input value={systemInfo.resourceUnit} onChange={e => handleSystemInfoChange('resourceUnit', e.target.value)} className="input-neumorphic w-full" placeholder="Đơn Vị (Vd: năm, cấp)"/>
                            </div>
                            <textarea value={systemInfo.description} onChange={e => handleSystemInfoChange('description', e.target.value)} rows={2} className="input-neumorphic w-full resize-y" placeholder="Mô tả hệ thống..."/>
                        </div>
                        {tiers.map((tier, tierIndex) => (
                            <div key={tier.id || tierIndex} className="rounded-lg" style={{boxShadow: 'var(--shadow-raised)'}}>
                                <button onClick={() => setExpandedTiers(p => ({...p, [tier.id || tierIndex]: !p[tier.id || tierIndex]}))} className="w-full flex justify-between items-center p-3 text-left hover:bg-[var(--shadow-light)]/30 rounded-t-lg">
                                    <span className="font-bold text-lg" style={{color: 'var(--text-color)'}}>{tier.name}</span>
                                    <div className="flex items-center gap-4">
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteTier(tierIndex); }} className="p-1 text-[var(--text-muted-color)] hover:text-red-400"><FaTrash /></button>
                                        {expandedTiers[tier.id || tierIndex] ? <FaChevronUp /> : <FaChevronDown />}
                                    </div>
                                </button>
                                {expandedTiers[tier.id || tierIndex] && (
                                    <div className="p-3 border-t space-y-3" style={{borderColor: 'var(--shadow-light)'}}>
                                        <input value={tier.name} onChange={e => handleTierChange(tierIndex, 'name', e.target.value)} className="input-neumorphic w-full mb-2" placeholder="Tên Đại Cảnh Giới"/>
                                        <textarea value={tier.description} onChange={e => handleTierChange(tierIndex, 'description', e.target.value)} rows={2} className="input-neumorphic w-full resize-y" placeholder="Mô tả..."/>
                                        
                                        {(tier.bonuses && tier.bonuses.length > 0) &&
                                            <div className="mt-2 text-xs">
                                                <span className="font-semibold" style={{color: 'var(--text-muted-color)'}}>Cộng thêm: </span>
                                                {tier.bonuses.map((b, i) => (
                                                    <span key={i} className="inline-block bg-teal-900/50 text-teal-200 rounded-full px-2 py-0.5 mr-1 mb-1">{b.attribute} {b.value > 0 ? `+${b.value}` : b.value}</span>
                                                ))}
                                            </div>
                                        }

                                        <TierBonusEditor
                                            tier={tier}
                                            onTierChange={(field, value) => handleTierChange(tierIndex, field, value)}
                                            attributeDefinitions={attributeSystem.definitions}
                                        />

                                        <div className="mt-4 pt-3 border-t" style={{borderColor: 'var(--shadow-light)'}}>
                                            <h5 className="text-sm font-semibold mb-2" style={{color: 'var(--text-color)'}}>Các Cấp Bậc Phụ (Tiểu Cảnh Giới)</h5>
                                            <div className="space-y-2">
                                                {tier.stages.map((subTier, subTierIndex) => (
                                                    <div key={subTier.id || subTierIndex} className="flex justify-between items-center p-2 rounded" style={{boxShadow: 'var(--shadow-pressed)'}}>
                                                        <div>
                                                            <p className="text-sm font-semibold" style={{color: 'var(--text-color)'}}>{subTier.name}</p>
                                                            <p className="text-xs" style={{color: 'var(--text-muted-color)'}}>{systemInfo.resourceName}: {!isFinite(subTier.qiRequired) ? 'Vô Hạn' : (subTier.qiRequired || 0).toLocaleString()}</p>
                                                             {(subTier.bonuses && subTier.bonuses.length > 0) &&
                                                                <div className="mt-1 text-xs">
                                                                    {subTier.bonuses.map((b, i) => (
                                                                        <span key={i} className="inline-block bg-sky-900/50 text-sky-200 rounded-full px-2 py-0.5 mr-1 mb-1">{b.attribute} {b.value > 0 ? `+${b.value}` : b.value}</span>
                                                                    ))}
                                                                </div>
                                                            }
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

                                    </div>
                                )}
                            </div>
                        ))}
                        <button onClick={handleAddTier} className="btn btn-neumorphic w-full mt-3 text-base flex items-center justify-center gap-2 p-2">
                            <FaPlus /> Thêm Cấp Bậc Chính
                        </button>
                    </div>
                    <div className="p-4 border-t flex justify-end gap-3 mt-auto" style={{borderColor: 'var(--shadow-light)'}}>
                        <button onClick={onClose} className="btn btn-neumorphic flex items-center gap-2"><FaTimes /> Hủy</button>
                        <button onClick={handleSaveAndClose} className="btn btn-primary flex items-center gap-2"><FaSave /> Lưu & Đóng</button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default RealmEditorModal;