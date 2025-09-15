import React, { useState, useEffect, useMemo } from 'react';
import { FaSave, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import type { ModMainCultivationTechnique, ModSkillTreeNode, SkillTreeNodeType, StatBonus } from '../../../types';
import { REALM_SYSTEM } from '../../../constants';
import StatBonusEditor from './StatBonusEditor';

interface MainTechniqueEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (technique: ModMainCultivationTechnique) => void;
    techniqueToEdit: ModMainCultivationTechnique | null;
    allAttributes: string[];
}

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);

const SKILL_NODE_TYPES: SkillTreeNodeType[] = ['core_enhancement', 'passive_bonus', 'active_skill'];

const SkillNodeEditor: React.FC<{
    node: ModSkillTreeNode;
    onUpdate: (updatedNode: ModSkillTreeNode) => void;
    allNodeIds: string[];
    allAttributes: string[];
}> = ({ node, onUpdate, allNodeIds, allAttributes }) => {
    
    const handleChange = (field: keyof ModSkillTreeNode, value: any) => {
        onUpdate({ ...node, [field]: value });
    };

    const handleActiveSkillChange = (field: string, value: any) => {
        const newActiveSkill = { ...(node.activeSkill || {}), [field]: value };
        handleChange('activeSkill', newActiveSkill);
    };

    return (
        <div className="bg-black/20 p-4 rounded-lg border border-gray-700/60 space-y-4">
            <h4 className="font-bold text-amber-300">Chỉnh sửa nút: {node.name || '(Nút mới)'}</h4>
            <div className="grid grid-cols-2 gap-4">
                <FieldWrapper label="ID (Duy nhất)"><input type="text" value={node.id} onChange={e => handleChange('id', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm"/></FieldWrapper>
                <FieldWrapper label="Tên nút"><input type="text" value={node.name} onChange={e => handleChange('name', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm"/></FieldWrapper>
                <FieldWrapper label="Biểu tượng (Emoji)"><input type="text" value={node.icon} onChange={e => handleChange('icon', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm"/></FieldWrapper>
                <FieldWrapper label="Loại nút">
                    <select value={node.type} onChange={e => handleChange('type', e.target.value as SkillTreeNodeType)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm">
                        {SKILL_NODE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </FieldWrapper>
                <FieldWrapper label="Cảnh giới yêu cầu">
                    <select value={node.realmRequirement} onChange={e => handleChange('realmRequirement', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm">
                        {REALM_SYSTEM.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </FieldWrapper>
                <FieldWrapper label="Điểm tiềm năng (Cost)"><input type="number" value={node.cost} onChange={e => handleChange('cost', parseInt(e.target.value) || 0)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm"/></FieldWrapper>
            </div>
            <FieldWrapper label="Mô tả"><textarea value={node.description} onChange={e => handleChange('description', e.target.value)} rows={2} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm"/></FieldWrapper>
            <FieldWrapper label="Nút con (Children IDs)">
                 <select multiple value={node.childrenIds} onChange={e => handleChange('childrenIds', Array.from(e.target.selectedOptions, option => option.value))} className="w-full h-24 bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm">
                    {allNodeIds.filter(id => id !== node.id).map(id => <option key={id} value={id}>{id}</option>)}
                </select>
            </FieldWrapper>
            {(node.type === 'passive_bonus' || node.type === 'core_enhancement') && (
                <FieldWrapper label="Thưởng chỉ số (Bonuses)">
                    <StatBonusEditor bonuses={node.bonuses || []} onChange={b => handleChange('bonuses', b)} allAttributes={allAttributes} />
                </FieldWrapper>
            )}
            {node.type === 'active_skill' && (
                <div className="p-3 border border-dashed border-gray-600 rounded-lg space-y-3">
                    <h5 className="font-semibold text-gray-300">Chi tiết Kỹ Năng Chủ Động</h5>
                     <FieldWrapper label="Tên Kỹ Năng"><input type="text" value={node.activeSkill?.name || ''} onChange={e => handleActiveSkillChange('name', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm"/></FieldWrapper>
                     <FieldWrapper label="Mô tả"><textarea value={node.activeSkill?.description || ''} onChange={e => handleActiveSkillChange('description', e.target.value)} rows={2} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm"/></FieldWrapper>
                </div>
            )}
        </div>
    );
};


const MainTechniqueEditorModal: React.FC<MainTechniqueEditorModalProps> = ({ isOpen, onClose, onSave, techniqueToEdit, allAttributes }) => {
    const [technique, setTechnique] = useState<ModMainCultivationTechnique | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const initial = techniqueToEdit
                ? JSON.parse(JSON.stringify(techniqueToEdit))
                : { id: Date.now().toString(), name: '', description: '', skillTreeNodes: [] };
            setTechnique(initial);
            setSelectedNodeId(initial.skillTreeNodes.length > 0 ? initial.skillTreeNodes[0].id : null);
        }
    }, [isOpen, techniqueToEdit]);
    
    const allNodeIds = useMemo(() => technique?.skillTreeNodes.map(n => n.id) || [], [technique]);

    if (!isOpen || !technique) return null;

    const handleChange = (field: keyof ModMainCultivationTechnique, value: any) => {
        setTechnique({ ...technique, [field]: value });
    };

    const handleAddNode = () => {
        const newNode: ModSkillTreeNode = {
            id: `node_${Date.now()}`, name: 'Nút Mới', description: '', icon: '❓',
            realmRequirement: 'luyen_khi', cost: 1, type: 'passive_bonus',
            childrenIds: [], position: { x: 0, y: 0 }, bonuses: []
        };
        handleChange('skillTreeNodes', [...technique.skillTreeNodes, newNode]);
        setSelectedNodeId(newNode.id);
    };

    const handleRemoveNode = (nodeId: string) => {
        if (!window.confirm(`Bạn có chắc muốn xóa nút "${nodeId}"?`)) return;
        
        const newNodes = technique.skillTreeNodes.filter(n => n.id !== nodeId);
        // Also remove from childrenIds of other nodes
        const updatedNodes = newNodes.map(n => ({
            ...n,
            childrenIds: n.childrenIds.filter(id => id !== nodeId)
        }));

        handleChange('skillTreeNodes', updatedNodes);
        if (selectedNodeId === nodeId) {
            setSelectedNodeId(updatedNodes.length > 0 ? updatedNodes[0].id : null);
        }
    };
    
    const handleUpdateNode = (updatedNode: ModSkillTreeNode) => {
        const newNodes = technique.skillTreeNodes.map(n => n.id === selectedNodeId ? updatedNode : n);
        handleChange('skillTreeNodes', newNodes);
    };

    const handleSaveChanges = () => {
        if (!technique.name.trim()) {
            alert("Tên Công Pháp không được để trống.");
            return;
        }
        onSave(technique);
    };
    
    const selectedNode = technique.skillTreeNodes.find(n => n.id === selectedNodeId);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }}>
            <div className="bg-gray-900/95 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 w-full max-w-4xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl text-gray-200 font-bold font-title">{techniqueToEdit ? 'Chỉnh Sửa Công Pháp Chủ Đạo' : 'Tạo Công Pháp Chủ Đạo'}</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>

                <div className="p-6 flex-grow flex gap-6 min-h-0">
                    {/* Left Panel: Info & Node List */}
                    <div className="w-1/3 flex flex-col gap-4">
                        <FieldWrapper label="Tên Công Pháp"><input type="text" value={technique.name} onChange={e => handleChange('name', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm"/></FieldWrapper>
                        <FieldWrapper label="Mô tả"><textarea value={technique.description} onChange={e => handleChange('description', e.target.value)} rows={3} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm"/></FieldWrapper>
                        <div className="flex-grow flex flex-col min-h-0">
                             <h4 className="text-md font-medium text-gray-400 mb-1 flex-shrink-0">Các Nút Kỹ Năng</h4>
                             <div className="flex-grow overflow-y-auto space-y-2 pr-2 bg-black/20 p-2 rounded-lg border border-gray-700/60">
                                {technique.skillTreeNodes.map(node => (
                                    <div key={node.id} className={`flex justify-between items-center p-2 rounded-md cursor-pointer ${selectedNodeId === node.id ? 'bg-amber-500/20' : 'bg-gray-800/50 hover:bg-gray-700/50'}`}>
                                        <button onClick={() => setSelectedNodeId(node.id)} className="flex-grow text-left">
                                            <span className="mr-2">{node.icon}</span>
                                            <span className="font-semibold text-gray-300">{node.name}</span>
                                        </button>
                                        <button onClick={() => handleRemoveNode(node.id)} className="p-1 text-gray-500 hover:text-red-400"><FaTrash size={12}/></button>
                                    </div>
                                ))}
                             </div>
                             <button onClick={handleAddNode} className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-700/80 text-white text-sm font-bold rounded-lg hover:bg-gray-600/80"><FaPlus /> Thêm Nút</button>
                        </div>
                    </div>

                    {/* Right Panel: Node Editor */}
                    <div className="w-2/3 overflow-y-auto pr-2">
                        {selectedNode ? (
                           <SkillNodeEditor node={selectedNode} onUpdate={handleUpdateNode} allNodeIds={allNodeIds} allAttributes={allAttributes} />
                        ) : (
                            <div className="flex items-center justify-center h-full text-center text-gray-500">
                                <p>Chọn một nút để chỉnh sửa hoặc thêm nút mới.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80">Hủy</button>
                    <button onClick={handleSaveChanges} className="px-5 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80">
                        <FaSave className="inline mr-2" /> Lưu Công Pháp
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MainTechniqueEditorModal;