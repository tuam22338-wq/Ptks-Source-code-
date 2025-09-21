import React, { useMemo, memo } from 'react';
import type { MainCultivationTechnique, SkillTreeNode, PlayerCharacter } from '../../../../../types';
import { REALM_SYSTEM } from '../../../../../constants';
import { FaLock } from 'react-icons/fa';

interface SkillTreeViewProps {
    technique: MainCultivationTechnique;
    playerCharacter: PlayerCharacter;
    selectedNodeId: string | null;
    onNodeSelect: (node: SkillTreeNode) => void;
}

const SkillNode: React.FC<{
    node: SkillTreeNode;
    onClick: () => void;
    isSelected: boolean;
    isUnlockable: boolean;
}> = memo(({ node, onClick, isSelected, isUnlockable }) => {
    const baseClasses = "w-16 h-16 rounded-lg flex flex-col items-center justify-center text-center p-1 cursor-pointer transition-all duration-300 transform hover:scale-110";
    const borderClasses = isSelected ? 'border-2 border-amber-400 ring-2 ring-amber-400/50' : 'border-2 border-gray-700/60';
    const bgClasses = node.isUnlocked 
        ? 'bg-green-900/30' 
        : isUnlockable 
        ? 'bg-black/30 hover:bg-teal-900/40' 
        : 'bg-black/40';
    const textClasses = node.isUnlocked ? 'text-gray-200' : 'text-gray-500';
    const opacityClass = !node.isUnlocked && !isUnlockable ? 'opacity-60' : '';

    return (
        <div className={`relative ${baseClasses} ${borderClasses} ${bgClasses} ${opacityClass}`} onClick={onClick} title={node.name}>
            <div className={`text-2xl ${node.isUnlocked ? '' : 'grayscale'}`}>{node.icon}</div>
            <p className={`text-[10px] font-bold leading-tight mt-1 ${textClasses}`}>{node.name}</p>
            {!node.isUnlocked && !isUnlockable && <FaLock className="absolute top-1 right-1 text-gray-600 text-xs" />}
        </div>
    );
});


const SkillTreeView: React.FC<SkillTreeViewProps> = ({ technique, playerCharacter, selectedNodeId, onNodeSelect }) => {
    
    const skillTreeByRealm = useMemo(() => {
        const grouped: { realmName: string; nodes: SkillTreeNode[] }[] = [];
        const realmOrder = REALM_SYSTEM.map(r => r.name);
        
        Object.values(technique.skillTreeNodes).forEach(node => {
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

        grouped.sort((a, b) => realmOrder.indexOf(a.realmName) - realmOrder.indexOf(b.realmName));
        return grouped;
    }, [technique]);

    const parentMap = useMemo(() => {
        const map = new Map<string, string | null>();
        map.set('root', null);
        Object.values(technique.skillTreeNodes).forEach(parent => {
            parent.childrenIds.forEach(childId => {
                map.set(childId, parent.id);
            });
        });
        return map;
    }, [technique]);

     const { cultivation } = playerCharacter;
     const currentRealmIndex = REALM_SYSTEM.findIndex(r => r.id === cultivation.currentRealmId);

    return (
        <div className="space-y-2 relative">
             {/* Render connection lines (simple vertical lines) */}
            {skillTreeByRealm.map((group, groupIndex) => {
                if (groupIndex === skillTreeByRealm.length - 1) return null;
                return (
                     <div
                        key={`line-${group.realmName}`}
                        className="absolute left-1/2 -translate-x-1/2 h-12 w-0.5 bg-gray-600/70"
                        style={{ top: `${(groupIndex + 1) * 11 - 3}rem` }} // Position between realm groups
                    />
                );
            })}

            {skillTreeByRealm.map((group) => {
                const requiredRealmIndex = REALM_SYSTEM.findIndex(r => r.name === group.realmName);
                const isRealmUnlocked = currentRealmIndex >= requiredRealmIndex;

                return (
                    <div key={group.realmName} className="relative text-center py-4 min-h-[11rem]">
                        <h4 className={`font-bold font-title text-lg mb-4 ${isRealmUnlocked ? 'text-gray-300' : 'text-gray-600'}`}>{group.realmName}</h4>
                        <div className="flex justify-center items-center gap-4 flex-wrap">
                            {group.nodes.map(node => {
                                const parentId = parentMap.get(node.id);
                                const isParentUnlocked = !parentId || technique.skillTreeNodes[parentId]?.isUnlocked;
                                const isUnlockable = isParentUnlocked && isRealmUnlocked && playerCharacter.techniquePoints >= node.cost;

                                return (
                                    <SkillNode
                                        key={node.id}
                                        node={node}
                                        onClick={() => onNodeSelect(node)}
                                        isSelected={selectedNodeId === node.id}
                                        isUnlockable={isUnlockable}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

export default memo(SkillTreeView);
