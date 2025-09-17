import React, { memo, useMemo, useState } from 'react';
import type { PlayerCharacter, CultivationTechnique, SkillTreeNode } from '../../../../../types';
import { PHAP_BAO_RANKS, REALM_SYSTEM } from '../../../../../constants';
import { FaLock } from 'react-icons/fa';
import { GiPointyHat } from 'react-icons/gi';
import SkillTreeView from './SkillTreeView';

interface TechniquesPanelProps {
    character: PlayerCharacter;
    setPlayerCharacter: (updater: (pc: PlayerCharacter) => PlayerCharacter) => void;
    showNotification: (message: string) => void;
}

const TechniqueCard: React.FC<{ technique: CultivationTechnique }> = memo(({ technique }) => {
    const rankStyle = PHAP_BAO_RANKS[technique.rank] || PHAP_BAO_RANKS['Phàm Giai'];
    
    const effectDescription = (technique.effects || [])
        .map(e => {
            const details = Object.entries(e.details)
                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                .join(', ');
            return `${e.type}${details ? ` (${details})` : ''}`;
        })
        .join('; ');

    return (
        <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60 w-full text-left">
            <div className="flex justify-between items-start gap-2">
                <h4 className={`font-bold font-title ${rankStyle.color}`}>{technique.icon} {technique.name}</h4>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-black/30 ${rankStyle.color}`}>
                    {technique.rank}
                </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">{technique.description}</p>
            <div className="border-t border-gray-600/50 mt-2 pt-2 text-xs flex justify-between text-gray-300">
                <span>Tiêu hao: <span className="font-semibold text-amber-300">{technique.cost.value} {technique.cost.type}</span></span>
                <span>Hồi chiêu: <span className="font-semibold text-cyan-300">{technique.cooldown > 0 ? `${technique.cooldown} lượt` : 'Không'}</span></span>
            </div>
            {effectDescription && (
                <div className="mt-1 text-xs text-gray-400">
                    <p>Hiệu quả: <span className="italic">{effectDescription}</span></p>
                </div>
            )}
        </div>
    );
});


const TechniquesPanel: React.FC<TechniquesPanelProps> = ({ character, setPlayerCharacter, showNotification }) => {
    const { mainCultivationTechnique, auxiliaryTechniques, techniquePoints, cultivation } = character;
    const [selectedNode, setSelectedNode] = useState<SkillTreeNode | null>(null);

    const handleUnlockSkill = (nodeId: string) => {
        if (!mainCultivationTechnique) return;
        
        const node = mainCultivationTechnique.skillTreeNodes[nodeId];
        if (!node || node.isUnlocked) return;
        
        if (character.techniquePoints < node.cost) {
            showNotification("Không đủ Điểm Tiềm Năng!");
            return;
        }

        setPlayerCharacter(pc => {
            if (!pc.mainCultivationTechnique) return pc;
            
            let newPc = { ...pc };

            // 1. Deduct points
            newPc.techniquePoints -= node.cost;

            // 2. Unlock node
            const newSkillTree = { ...newPc.mainCultivationTechnique.skillTreeNodes };
            newSkillTree[nodeId] = { ...newSkillTree[nodeId], isUnlocked: true };
            newPc.mainCultivationTechnique = { ...newPc.mainCultivationTechnique, skillTreeNodes: newSkillTree };

            // 3. Apply passive bonuses
            if (node.bonuses && node.bonuses.length > 0) {
                const newAttributes = pc.attributes.map(group => ({
                    ...group,
                    attributes: group.attributes.map(attr => {
                        const bonus = node.bonuses!.find(b => b.attribute === attr.name);
                        if (bonus && typeof attr.value === 'number') {
                            const new_val = (attr.value as number) + bonus.value;
                             const new_max_val = attr.maxValue ? (attr.maxValue as number) + bonus.value : undefined;
                             return { ...attr, value: new_val, maxValue: new_max_val };
                        }
                        return attr;
                    })
                }));
                 newPc.attributes = newAttributes;
            }
             // Update selected node state if it's the one being unlocked
            if (selectedNode?.id === nodeId) {
                setSelectedNode({ ...node, isUnlocked: true });
            }

            return newPc;
        });

        showNotification(`Đã mở khóa [${node.name}]!`);
    };
    
    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            {mainCultivationTechnique && (
                 <div>
                    <h3 className="text-lg text-amber-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                        {mainCultivationTechnique.name} (Chủ Đạo)
                    </h3>
                     <div className="text-center mb-4 p-2 bg-black/20 rounded-lg border border-gray-700/60">
                        <p className="flex items-center justify-center gap-2 text-lg font-bold text-purple-300">
                            <GiPointyHat /> {techniquePoints} <span className="text-sm font-normal text-gray-400">Điểm Tiềm Năng</span>
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <SkillTreeView
                            technique={mainCultivationTechnique}
                            character={character}
                            onNodeSelect={setSelectedNode}
                            selectedNodeId={selectedNode?.id || null}
                        />

                        {selectedNode && (
                             <div className="mt-4 p-3 rounded-lg border-2 bg-black/20 border-amber-500/50 animate-fade-in" style={{animationDuration: '200ms'}}>
                                <h4 className="font-bold font-title text-amber-300">{selectedNode.icon} {selectedNode.name}</h4>
                                <p className="text-xs text-gray-400 mt-1">{selectedNode.description}</p>
                                
                                {selectedNode.bonuses && selectedNode.bonuses.length > 0 && (
                                    <div className="mt-1 text-xs text-teal-300">
                                        <p>Thưởng bị động: {selectedNode.bonuses.map(b => `${b.attribute} +${b.value}`).join(', ')}</p>
                                    </div>
                                )}
                                {selectedNode.activeSkill && (
                                    <div className="mt-1 text-xs text-cyan-300">
                                        <p>Mở khóa thần thông: <span className="font-semibold">{selectedNode.activeSkill.name}</span></p>
                                    </div>
                                )}

                                {!selectedNode.isUnlocked && (
                                     <button 
                                        onClick={() => handleUnlockSkill(selectedNode.id)}
                                        disabled={character.techniquePoints < selectedNode.cost}
                                        className="w-full mt-3 p-2 text-sm font-bold bg-teal-700/80 rounded text-white hover:bg-teal-600/80 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                     >
                                         <FaLock /> Mở Khóa ({selectedNode.cost} TP)
                                     </button>
                                )}
                             </div>
                        )}
                    </div>
                </div>
            )}
            
            {auxiliaryTechniques.length > 0 && (
                <div>
                    <h3 className="text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">Công Pháp Phụ</h3>
                    <div className="space-y-3">
                        {auxiliaryTechniques.map(tech => (
                            <TechniqueCard key={tech.id} technique={tech} />
                        ))}
                    </div>
                </div>
            )}
            
             {!mainCultivationTechnique && auxiliaryTechniques.length === 0 && (
                <p className="text-center text-gray-500 py-4">Bạn chưa học được công pháp nào.</p>
             )}
        </div>
    );
};

export default memo(TechniquesPanel);
