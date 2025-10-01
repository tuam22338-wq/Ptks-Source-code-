import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaPlus, FaTrash, FaEdit, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import type { RealmConfig, RealmStage, ModAttributeSystem, NamedRealmSystem } from '../../../types';
import RealmStageEditorModal from './RealmStageEditorModal';

interface RealmEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (systems: NamedRealmSystem[]) => void;
    initialSystems: NamedRealmSystem[];
    attributeSystem: ModAttributeSystem;
}

const RealmEditorModal: React.FC<RealmEditorModalProps> = ({ isOpen, onClose, onSave, initialSystems, attributeSystem }) => {
    const [realms, setRealms] = useState<RealmConfig[]>([]);
    const [systemInfo, setSystemInfo] = useState({ name: '', description: '', resourceName: 'Linh Khí', resourceUnit: 'điểm' });
    const [expandedRealms, setExpandedRealms] = useState<Record<string, boolean>>({});
    const [isStageModalOpen, setIsStageModalOpen] = useState(false);
    const [editingStage, setEditingStage] = useState<{ stage: RealmStage | null; realmIndex: number }>({ stage: null, realmIndex: -1 });

    useEffect(() => {
        if (isOpen) {
            const mainSystem = initialSystems.length > 0 ? initialSystems[0] : null;
            setRealms(mainSystem ? JSON.parse(JSON.stringify(mainSystem.realms)) : []);
            setSystemInfo({
                name: mainSystem?.name || 'Hệ Thống Tu Luyện Chính',
                description: mainSystem?.description || 'Hệ thống tu luyện mặc định.',
                resourceName: mainSystem?.resourceName || 'Linh Khí',
                resourceUnit: mainSystem?.resourceUnit || 'điểm',
            });
            const initialExpanded = (mainSystem?.realms || []).reduce((acc, realm, index) => {
                acc[realm.id || index] = index === 0;
                return acc;
            }, {} as Record<string, boolean>);
            setExpandedRealms(initialExpanded);
        }
    }, [initialSystems, isOpen]);
    
    const handleSystemInfoChange = (field: keyof typeof systemInfo, value: string) => {
        setSystemInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveAndClose = () => {
        onSave([{ ...systemInfo, id: 'main_system', realms }]);
        onClose();
    };

    const handleRealmChange = (index: number, field: keyof RealmConfig, value: any) => {
        const newRealms = [...realms];
        (newRealms[index] as any)[field] = value;
        setRealms(newRealms);
    };
    
    const handleAddRealm = () => {
        const newRealm: RealmConfig = { id: `realm_${Date.now()}`, name: 'Cảnh Giới Mới', description: '', stages: [] };
        setRealms([...realms, newRealm]);
    };
    
    const handleDeleteRealm = (index: number) => {
        if (window.confirm(`Bạn có chắc muốn xóa cảnh giới "${realms[index].name}"?`)) {
            setRealms(realms.filter((_, i) => i !== index));
        }
    };
    
    const handleOpenStageModal = (stage: RealmStage | null, realmIndex: number) => {
        setEditingStage({ stage, realmIndex });
        setIsStageModalOpen(true);
    };
    
    const handleSaveStage = (stage: RealmStage) => {
        const newRealms = [...realms];
        const realm = newRealms[editingStage.realmIndex];
        const stageIndex = realm.stages.findIndex(s => s.id === stage.id);
        
        if (stageIndex > -1) {
            realm.stages[stageIndex] = stage;
        } else {
            realm.stages.push(stage);
        }
        
        setRealms(newRealms);
        setIsStageModalOpen(false);
    };

    const handleDeleteStage = (realmIndex: number, stageIndex: number) => {
        if (window.confirm("Bạn có chắc muốn xóa tiểu cảnh giới này?")) {
            const newRealms = [...realms];
            newRealms[realmIndex].stages.splice(stageIndex, 1);
            setRealms(newRealms);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <RealmStageEditorModal
                isOpen={isStageModalOpen}
                onClose={() => setIsStageModalOpen(false)}
                onSave={handleSaveStage}
                stage={editingStage.stage}
                attributeDefinitions={attributeSystem.definitions}
                resourceName={systemInfo.resourceName}
                resourceUnit={systemInfo.resourceUnit}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
                <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-3xl m-4 h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                    <h3 className="text-xl font-bold p-4 border-b border-gray-700 text-amber-300">Chỉnh Sửa Hệ Thống Tu Luyện</h3>
                    <div className="p-4 overflow-y-auto space-y-3">
                        <div className="p-3 bg-black/25 rounded-lg border border-gray-800/80 mb-3 space-y-3">
                            <h4 className="font-bold text-gray-200">Thông Tin Hệ Thống</h4>
                            <input value={systemInfo.name} onChange={e => handleSystemInfoChange('name', e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" placeholder="Tên Hệ Thống (Vd: Hệ Thống Hồn Sư)"/>
                            <div className="grid grid-cols-2 gap-2">
                                <input value={systemInfo.resourceName} onChange={e => handleSystemInfoChange('resourceName', e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" placeholder="Tên Tài Nguyên (Vd: Hồn Lực)"/>
                                <input value={systemInfo.resourceUnit} onChange={e => handleSystemInfoChange('resourceUnit', e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" placeholder="Đơn Vị (Vd: năm, cấp)"/>
                            </div>
                            <textarea value={systemInfo.description} onChange={e => handleSystemInfoChange('description', e.target.value)} rows={2} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 resize-y" placeholder="Mô tả hệ thống..."/>
                        </div>
                        {realms.map((realm, realmIndex) => (
                            <div key={realm.id || realmIndex} className="bg-black/25 rounded-lg border border-gray-800/80">
                                <button onClick={() => setExpandedRealms(p => ({...p, [realm.id || realmIndex]: !p[realm.id || realmIndex]}))} className="w-full flex justify-between items-center p-3 text-left hover:bg-gray-800/50">
                                    <span className="font-bold text-gray-200 text-lg">{realm.name}</span>
                                    <div className="flex items-center gap-4">
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteRealm(realmIndex); }} className="p-1 text-gray-400 hover:text-red-400"><FaTrash /></button>
                                        {expandedRealms[realm.id || realmIndex] ? <FaChevronUp /> : <FaChevronDown />}
                                    </div>
                                </button>
                                {expandedRealms[realm.id || realmIndex] && (
                                    <div className="p-3 border-t border-gray-800/80 space-y-3">
                                        <input value={realm.name} onChange={e => handleRealmChange(realmIndex, 'name', e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 mb-2" placeholder="Tên Đại Cảnh Giới"/>
                                        <textarea value={realm.description} onChange={e => handleRealmChange(realmIndex, 'description', e.target.value)} rows={2} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 resize-y" placeholder="Mô tả..."/>
                                        <div className="space-y-2">
                                            {realm.stages.map((stage, stageIndex) => (
                                                <div key={stage.id || stageIndex} className="flex justify-between items-center p-2 bg-black/30 rounded">
                                                    <div>
                                                        <p className="text-sm font-semibold">{stage.name}</p>
                                                        <p className="text-xs text-gray-400">{systemInfo.resourceName}: {!isFinite(stage.qiRequired) ? 'Vô Hạn' : (stage.qiRequired || 0).toLocaleString()}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleOpenStageModal(stage, realmIndex)} className="p-1 text-gray-400 hover:text-white"><FaEdit /></button>
                                                        <button onClick={() => handleDeleteStage(realmIndex, stageIndex)} className="p-1 text-gray-400 hover:text-red-400"><FaTrash /></button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button onClick={() => handleOpenStageModal(null, realmIndex)} className="w-full mt-2 text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded">
                                            <FaPlus /> Thêm Tiểu Cảnh Giới
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button onClick={handleAddRealm} className="w-full mt-3 text-base text-amber-300/80 hover:text-amber-200 flex items-center justify-center gap-2 p-2 bg-amber-900/30 rounded border border-amber-500/30">
                            <FaPlus /> Thêm Đại Cảnh Giới
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