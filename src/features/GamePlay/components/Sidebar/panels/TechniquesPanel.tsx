
import React, { memo, useMemo, useState } from 'react';
import type { PlayerCharacter, CultivationTechnique, MainCultivationTechnique, SkillTreeNode, StatBonus } from '../../../../../types';
import { PHAP_BAO_RANKS, REALM_SYSTEM } from '../../../../../constants';
import { FaLock, FaCheckCircle } from 'react-icons/fa';
import { GiPointyHat } from 'react-icons/gi';

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

const SkillTreeNodeDisplay: React.FC<{
    node: SkillTreeNode;
    character: PlayerCharacter;
    isUnlockable: boolean;
    unlockReason: string;
    onUnlock: (nodeId: string) => void;
}> = memo(({ node, character, isUnlockable, unlockReason, onUnlock }) => {
    const { cost, bonuses, activeSkill, type } = node;
    const realm = REALM_SYSTEM.find(r => r.id === node.realmRequirement);

    return (
        <div className={`p-3 rounded-lg border-2 ${node.isUnlocked ? 'bg-green-900/30 border-green-500/50' : 'bg-black/20 border-gray-700/60'}`}>
            <div className="flex justify-between items-start gap-2">
                 <h4 className="font-bold font-title text-gray-200">{node.icon} {node.name}</h4>
                 {!node.isUnlocked && (
                     <span className="text-xs font-semibold bg-gray-700/80 px-2 py-0.5 rounded-full text-gray-300">
                        {cost} TP
                     </span>
                 )}
            </div>
            <p className="text-xs text-gray-400 mt-1">{node.description}</p>

            <div className="mt-2 pt-2 border-t border-gray-600/50 text-xs text-gray-500">
                Yêu cầu: {realm?.name || 'Không rõ'}
            </div>

            {bonuses && bonuses.length > 0 && (
                <div className="mt-1 text-xs text-teal-300">
                    <p>Thưởng bị động: {bonuses.map(b => `${b.attribute} +${b.value}`).join(', ')}</p>
                </div>
            )}
            
            {activeSkill && (
                 <div className="mt-1 text-xs text-cyan-300">
                    <p>Mở khóa thần thông: <span className="font-semibold">{activeSkill.name}</span></p>
                </div>
            )}

            {!node.isUnlocked && (
                 <button 
                    onClick={() => onUnlock(node.id)}
                    disabled={!isUnlockable}
                    title={unlockReason}
                    className="w-full mt-3 p-2 text-sm font-bold bg-teal-700/80 rounded text-white hover:bg-teal-600/80 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                 >
                     <FaLock /> Mở Khóa
                 </button>
            )}
        </div>
    );
});


const TechniquesPanel: React.FC<TechniquesPanelProps> = ({ character, setPlayerCharacter, showNotification }) => {
    const { mainCultivationTechnique, auxiliaryTechniques, techniquePoints, cultivation } = character;

    const parentMap = useMemo(() => {
        const map = new Map<string, string | null>();
        if (!mainCultivationTechnique) return map;
        map.set('root', null); // Root has no parent
        Object.values(mainCultivationTechnique.skillTreeNodes).forEach(parent => {
            parent.childrenIds.forEach(childId => {
                map.set(childId, parent.id);
            });
        });
        return map;
    }, [mainCultivationTechnique]);

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
                            return { ...attr, value: (attr.value as number) + bonus.value };
                        }
                        return attr;
                    })
                }));
                 newPc.attributes = newAttributes;
            }

            return newPc;
        });

        showNotification(`Đã mở khóa [${node.name}]!`);
    };

    const skillTreeByRealm = useMemo(() => {
        if (!mainCultivationTechnique) return [];
        const grouped: { realmName: string, nodes: SkillTreeNode[] }[] = [];
        
        Object.values(mainCultivationTechnique.skillTreeNodes).forEach(node => {
            const realm = REALM_SYSTEM.find(r => r.id === node.realmRequirement);
            if (realm) {
                let group = grouped.find(g => g.realmName === realm.name);
                if (!group) {
                    group = { realmName: realm.name, nodes: [] };
                    grouped.push(group);
                }
                group.nodes.push(node);
            }
        });

        // Sort realms by their order in REALM_SYSTEM
        grouped.sort((a, b) => {
            const indexA = REALM_SYSTEM.findIndex(r => r.name === a.realmName);
            const indexB = REALM_SYSTEM.findIndex(r => r.name === b.realmName);
            return indexA - indexB;
        });
        return grouped;
    }, [mainCultivationTechnique]);

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
                        {skillTreeByRealm.map(group => (
                            <div key={group.realmName}>
                                <h4 className="font-bold text-gray-400 text-center mb-2">{group.realmName}</h4>
                                <div className="space-y-3">
                                {group.nodes.map(node => {
                                    const parentId = parentMap.get(node.id);
                                    const parentNode = parentId ? mainCultivationTechnique.skillTreeNodes[parentId] : null;
                                    const currentRealmIndex = REALM_SYSTEM.findIndex(r => r.id === cultivation.currentRealmId);
                                    const requiredRealmIndex = REALM_SYSTEM.findIndex(r => r.id === node.realmRequirement);

                                    let isUnlockable = true;
                                    let unlockReason = "";

                                    if (node.isUnlocked) {
                                        isUnlockable = false;
                                        unlockReason = "Đã mở khóa.";
                                    } else if (character.techniquePoints < node.cost) {
                                        isUnlockable = false;
                                        unlockReason = "Không đủ điểm.";
                                    } else if (currentRealmIndex < requiredRealmIndex) {
                                        isUnlockable = false;
                                        unlockReason = `Yêu cầu cảnh giới ${REALM_SYSTEM[requiredRealmIndex]?.name}.`;
                                    } else if (parentId && !mainCultivationTechnique.skillTreeNodes[parentId]?.isUnlocked) {
                                        isUnlockable = false;
                                        unlockReason = `Yêu cầu mở khóa [${parentNode?.name}].`;
                                    }

                                    return <SkillTreeNodeDisplay 
                                                key={node.id} 
                                                node={node} 
                                                character={character}
                                                isUnlockable={isUnlockable}
                                                unlockReason={unlockReason}
                                                onUnlock={handleUnlockSkill}
                                            />
                                })}
                                </div>
                            </div>
                        ))}
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
