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
        <div className="flex items-center gap-2" style={{color: 'var(--text-color)'}}>
            <Icon />
            <span>{label}</span>
        </div>
        <span className="font-mono font-semibold" style={{color: 'var(--primary-accent-color)'}}>
            {value}
            {maxValue !== undefined && ` / ${maxValue}`}
        </span>
    </div>
);

// Helper for progress bars
const ProgressBar: React.FC<{ current: number; max: number; colorClass: string }> = ({ current, max, colorClass }) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    return (
        <div className="w-full bg-black/30 rounded-full h-2.5" style={{boxShadow: 'var(--shadow-pressed)'}}>
            <div className={`${colorClass} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
        </div>
    );
};

const StatusPanel: React.FC<{ gameState: GameState }> = ({ gameState }) => {
    // @google-genai-fix: Changed 'realmSystem' to 'progressionSystem'.
    const { playerCharacter, progressionSystem, attributeSystem, progressionSystemInfo } = gameState;
    
    // @google-genai-fix: Changed 'cultivation' to 'progression' and 'realmSystem' to 'progressionSystem'.
    const currentRealm = useMemo(() => progressionSystem.find(r => r.id === playerCharacter.progression.currentTierId), [playerCharacter, progressionSystem]);
    // @google-genai-fix: Changed 'cultivation' to 'progression' and 'stages' to 'subTiers'.
    const currentStage = useMemo(() => currentRealm?.subTiers.find(s => s.id === playerCharacter.progression.currentSubTierId), [playerCharacter, currentRealm]);
    
    const qiToNextStage = useMemo(() => {
        if (!currentRealm || !currentStage) return Infinity;
        // @google-genai-fix: Changed 'stages' to 'subTiers'.
        const currentStageIndex = currentRealm.subTiers.findIndex(s => s.id === currentStage.id);
        // @google-genai-fix: Changed 'stages' to 'subTiers'.
        if (currentStageIndex === -1 || currentStageIndex >= currentRealm.subTiers.length - 1) {
            // Check next realm
            // @google-genai-fix: Changed 'realmSystem' to 'progressionSystem'.
            const currentRealmIndex = progressionSystem.findIndex(r => r.id === currentRealm.id);
            // @google-genai-fix: Changed 'realmSystem' to 'progressionSystem'.
            if (currentRealmIndex !== -1 && currentRealmIndex < progressionSystem.length - 1) {
                // @google-genai-fix: Changed 'realmSystem' to 'progressionSystem'.
                const nextRealm = progressionSystem[currentRealmIndex + 1];
                // @google-genai-fix: Changed 'stages' to 'subTiers'.
                if (nextRealm && nextRealm.subTiers.length > 0) {
                    // @google-genai-fix: Changed 'stages' to 'subTiers' and 'qiRequired' to 'resourceRequired'.
                    return nextRealm.subTiers[0].resourceRequired;
                }
            }
            return Infinity;
        }
        // @google-genai-fix: Changed 'stages' to 'subTiers' and 'qiRequired' to 'resourceRequired'.
        return currentRealm.subTiers[currentStageIndex + 1].resourceRequired;
    }, [currentRealm, currentStage, progressionSystem]);
    
    const getAttributeValue = (id: string) => playerCharacter.attributes[id] || { value: 0 };
    
    // @google-genai-fix: Changed 'realmSystem' to 'progressionSystem' and 'stages' to 'subTiers'.
    const isProgressionSystem = progressionSystem && (progressionSystem.length > 1 || (progressionSystem.length === 1 && progressionSystem[0].subTiers.length > 1));
    
    const renderAttributeGroup = (group: (typeof attributeSystem.groups)[0]) => {
        // Hide the entire "Cultivation Info" group if the realm system is disabled.
        // @google-genai-fix: Changed 'realmSystem' to 'progressionSystem'.
        if (group.id === 'cultivation' && (!progressionSystem || progressionSystem.length === 0)) {
            return null;
        }

        const attributesInGroup = attributeSystem.definitions
            .filter(def => def.group === group.id && (playerCharacter.attributes[def.id] || def.type === 'INFORMATIONAL'));
        
        if (attributesInGroup.length === 0) return null;

        return (
            <div key={group.id} className="neumorphic-inset-box p-3">
                <h4 className="font-bold font-title mb-2" style={{color: 'var(--primary-accent-color)'}}>{group.name}</h4>
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
                                    value={`${currentRealm?.name || 'Vô'} - ${currentStage?.name || ''}`}
                                    icon={Icon}
                                    description={def.description}
                                />
                            )
                        }

                        // Don't render attributes that don't have a value (unless they are informational)
                        if(!playerCharacter.attributes[def.id]) return null;

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
            <div className="neumorphic-inset-box p-3">
                <h4 className="font-bold font-title mb-2" style={{color: 'var(--primary-accent-color)'}}>Tài Sản</h4>
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
            <div className="neumorphic-inset-box p-3">
                <h4 className="font-bold font-title mb-2 flex items-center gap-2" style={{color: 'var(--primary-accent-color)'}}><GiFamilyTree /> Quan Hệ</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {relationships.map(rel => {
                        const npc = activeNpcs.find(n => n.id === rel.npcId);
                        if (!npc) return null;
                        return (
                            <div key={rel.npcId} className="text-sm">
                                <p className="font-semibold">{npc.identity.name} - <span style={{color: 'var(--text-muted-color)'}}>{rel.type}</span></p>
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
            {/* Cultivation Progress (if realm system exists and is a progression system) */}
            {isProgressionSystem && (
                <div className="neumorphic-inset-box p-3">
                    <h4 className="font-bold font-title" style={{color: 'var(--primary-accent-color)'}}>{progressionSystemInfo.name}</h4>
                    <p className="text-lg font-semibold text-cyan-300">{currentRealm?.name} - {currentStage?.name}</p>
                    <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1" style={{color: 'var(--text-muted-color)'}}>
                            <span>{progressionSystemInfo.resourceName}</span>
                            {/* @google-genai-fix: Changed 'cultivation.spiritualQi' to 'progression.progressionResource'. */}
                            <span>{playerCharacter.progression.progressionResource.toLocaleString()} / {(isFinite(qiToNextStage) ? qiToNextStage.toLocaleString() : 'MAX')} {progressionSystemInfo.resourceUnit}</span>
                        </div>
                        <ProgressBar 
                            // @google-genai-fix: Changed 'cultivation.spiritualQi' to 'progression.progressionResource'.
                            current={playerCharacter.progression.progressionResource} 
                            // @google-genai-fix: Changed 'cultivation.spiritualQi' to 'progression.progressionResource'.
                            max={isFinite(qiToNextStage) ? qiToNextStage : playerCharacter.progression.progressionResource} 
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
                <div className="neumorphic-inset-box p-3">
                    <h4 className="font-bold font-title mb-2" style={{color: 'var(--primary-accent-color)'}}>Hiệu Ứng</h4>
                    <div className="space-y-2">
                        {playerCharacter.activeEffects.map(effect => (
                            <div key={effect.id} className="text-sm">
                                <p className={`font-semibold ${effect.isBuff ? 'text-green-400' : 'text-red-400'}`}>{effect.name}</p>
                                <p className="text-xs" style={{color: 'var(--text-muted-color)'}}>{effect.description} (Còn {effect.duration === -1 ? 'vĩnh viễn' : `${effect.duration} lượt`})</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(StatusPanel);
