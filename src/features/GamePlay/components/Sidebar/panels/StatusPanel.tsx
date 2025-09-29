import React, { memo, useMemo } from 'react';
import type { GameState } from '../../../../../types';
import { UI_ICONS } from '../../../../../constants';
import { GiGoldBar, GiFamilyTree } from 'react-icons/gi';

// Helper component for displaying an attribute
const AttributeRow: React.FC<{
    label: string;
    value: string | number;
    maxValue?: string | number;
    icon: React.ElementType;
    description?: string;
}> = ({ label, value, maxValue, icon: Icon, description }) => (
    <div className="flex justify-between items-center text-sm py-1 group relative" title={description}>
        <div className="flex items-center gap-2 text-gray-300">
            <Icon />
            <span>{label}</span>
        </div>
        <span className="font-mono font-semibold text-amber-200">
            {value}
            {maxValue !== undefined && ` / ${maxValue}`}
        </span>
    </div>
);

// Helper for progress bars
const ProgressBar: React.FC<{ current: number; max: number; colorClass: string }> = ({ current, max, colorClass }) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    return (
        <div className="w-full bg-black/30 rounded-full h-2.5 border border-gray-700">
            <div className={`${colorClass} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const StatusPanel: React.FC<{ gameState: GameState }> = ({ gameState }) => {
    const { playerCharacter, realmSystem, attributeSystem, realmSystemInfo } = gameState;
    
    const currentRealm = useMemo(() => realmSystem.find(r => r.id === playerCharacter.cultivation.currentRealmId), [playerCharacter, realmSystem]);
    const currentStage = useMemo(() => currentRealm?.stages.find(s => s.id === playerCharacter.cultivation.currentStageId), [playerCharacter, currentRealm]);
    
    const qiToNextStage = useMemo(() => {
        if (!currentRealm || !currentStage) return Infinity;
        const currentStageIndex = currentRealm.stages.findIndex(s => s.id === currentStage.id);
        if (currentStageIndex === -1 || currentStageIndex >= currentRealm.stages.length - 1) {
            // Check next realm
            const currentRealmIndex = realmSystem.findIndex(r => r.id === currentRealm.id);
            if (currentRealmIndex !== -1 && currentRealmIndex < realmSystem.length - 1) {
                const nextRealm = realmSystem[currentRealmIndex + 1];
                if (nextRealm && nextRealm.stages.length > 0) {
                    return nextRealm.stages[0].qiRequired;
                }
            }
            return Infinity;
        }
        return currentRealm.stages[currentStageIndex + 1].qiRequired;
    }, [currentRealm, currentStage, realmSystem]);
    
    const getAttributeValue = (id: string) => playerCharacter.attributes[id] || { value: 0 };
    
    const renderAttributeGroup = (group: (typeof attributeSystem.groups)[0]) => {
        const attributesInGroup = attributeSystem.definitions
            .filter(def => def.group === group.id && playerCharacter.attributes[def.id]);
        
        if (attributesInGroup.length === 0) return null;

        return (
            <div key={group.id} className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                <h4 className="font-bold text-amber-300 font-title mb-2">{group.name}</h4>
                <div className="space-y-1">
                    {attributesInGroup.map(def => {
                        const attr = getAttributeValue(def.id);
                        const Icon = UI_ICONS[def.iconName] || (() => <span />);
                        
                        // Handle special case for informational attributes like realm
                        if (def.type === 'INFORMATIONAL' && def.id === 'canh_gioi') {
                             return (
                                <AttributeRow
                                    key={def.id}
                                    label={def.name}
                                    value={`${currentRealm?.name || ''} - ${currentStage?.name || ''}`}
                                    icon={Icon}
                                    description={def.description}
                                />
                            )
                        }

                        return (
                            <AttributeRow
                                key={def.id}
                                label={def.name}
                                value={Math.floor(attr.value)}
                                maxValue={attr.maxValue !== undefined ? Math.floor(attr.maxValue) : undefined}
                                icon={Icon}
                                description={def.description}
                            />
                        )
                    })}
                </div>
            </div>
        )
    }
    
    const renderCurrencies = () => {
        const currencies = Object.entries(playerCharacter.currencies).filter(([, amount]) => typeof amount === 'number' && amount > 0);
        if (currencies.length === 0) return null;

        return (
            <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                <h4 className="font-bold text-amber-300 font-title mb-2">Tài Sản</h4>
                <div className="space-y-1">
                    {currencies.map(([name, amount]) => {
                        return (
                            <AttributeRow
                                key={name}
                                label={name}
                                value={amount.toLocaleString()}
                                icon={GiGoldBar}
                            />
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderRelationships = () => {
        const { playerCharacter, activeNpcs } = gameState;
        const relationships = playerCharacter.relationships;
        if (!relationships || relationships.length === 0) return null;

        return (
            <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                <h4 className="font-bold text-amber-300 font-title mb-2 flex items-center gap-2"><GiFamilyTree /> Quan Hệ</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {relationships.map(rel => {
                        const npc = activeNpcs.find(n => n.id === rel.npcId);
                        if (!npc) return null;
                        return (
                            <div key={rel.npcId} className="text-sm">
                                <p className="font-semibold">{npc.identity.name} - <span className="text-gray-400">{rel.type}</span></p>
                                <p className="text-xs text-cyan-300">{rel.status} ({rel.value})</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const sortedGroups = [...attributeSystem.groups].sort((a, b) => a.order - b.order);

    return (
        <div className="space-y-4 animate-fade-in" style={{ animationDuration: '300ms' }}>
            {/* Cultivation Progress (if realm system exists) */}
            {realmSystem.length > 0 && (
                <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                    <h4 className="font-bold text-amber-300 font-title">{realmSystemInfo.name}</h4>
                    <p className="text-lg font-semibold text-cyan-300">{currentRealm?.name} - {currentStage?.name}</p>
                    <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>{realmSystemInfo.resourceName}</span>
                            <span>{playerCharacter.cultivation.spiritualQi.toLocaleString()} / {(isFinite(qiToNextStage) ? qiToNextStage.toLocaleString() : 'MAX')} {realmSystemInfo.resourceUnit}</span>
                        </div>
                        <ProgressBar 
                            current={playerCharacter.cultivation.spiritualQi} 
                            max={isFinite(qiToNextStage) ? qiToNextStage : playerCharacter.cultivation.spiritualQi} 
                            colorClass="bg-gradient-to-r from-cyan-400 to-blue-500"
                        />
                    </div>
                </div>
            )}
            
            {renderCurrencies()}

            {renderRelationships()}
            
            {/* Dynamic Attribute Groups */}
            {sortedGroups.map(group => renderAttributeGroup(group))}

            {/* Active Effects */}
            {playerCharacter.activeEffects.length > 0 && (
                <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                    <h4 className="font-bold text-amber-300 font-title mb-2">Hiệu Ứng</h4>
                    <div className="space-y-2">
                        {playerCharacter.activeEffects.map(effect => (
                            <div key={effect.id} className="text-sm">
                                <p className={`font-semibold ${effect.isBuff ? 'text-green-400' : 'text-red-400'}`}>{effect.name}</p>
                                <p className="text-xs text-gray-400">{effect.description} (Còn {effect.duration === -1 ? 'vĩnh viễn' : `${effect.duration} lượt`})</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(StatusPanel);