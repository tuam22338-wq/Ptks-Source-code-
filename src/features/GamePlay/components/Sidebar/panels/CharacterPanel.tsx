import React, { memo, useMemo, useState } from 'react';
import type { PlayerCharacter, Attribute, RealmConfig, ActiveEffect, StatBonus, AttributeGroup } from '../../../../../types';
import { CHARACTER_STATUS_CONFIG, CULTIVATION_PATHS, SPIRITUAL_ROOT_CONFIG, SPIRITUAL_ROOT_QUALITY_CONFIG } from '../../../../../constants';
import { FaBolt, FaRoute, FaChevronDown, FaShieldAlt } from 'react-icons/fa';
import { GiPentacle, GiStomach, GiWaterDrop, GiThermometerScale } from 'react-icons/gi';

interface CharacterPanelProps {
    character: PlayerCharacter;
    onBreakthrough: () => void;
    realmSystem: RealmConfig[];
}

const ProgressBar: React.FC<{
    current: number;
    max: number;
    label: string;
    color: string;
    icon: React.ElementType;
}> = ({ current, max, label, color, icon: Icon }) => {
    const percentage = max > 0 ? (current / max) * 100 : 0;
    return (
        <div className="w-full">
            <div className="flex justify-between items-baseline mb-1">
                 <div className="flex items-center text-sm text-gray-300">
                    <Icon className="w-4 h-4 mr-2" />
                    <span>{label}</span>
                 </div>
                <span className="text-xs font-mono">{`${Math.floor(current)}/${max}`}</span>
            </div>
            <div className="w-full bg-black/30 rounded-full h-2.5 border border-gray-700">
                <div className={`${color} h-2 rounded-full transition-all duration-300 animated-progress-bar`} style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const calculateFinalAttributes = (baseAttributes: AttributeGroup[], activeEffects: ActiveEffect[]): AttributeGroup[] => {
    const finalAttributes = baseAttributes.map(group => ({
        ...group,
        attributes: group.attributes.map(attr => ({ ...attr }))
    }));

    const allBonuses = activeEffects.flatMap(effect => effect.bonuses);

    allBonuses.forEach(bonus => {
        for (const group of finalAttributes) {
            const attr = group.attributes.find(a => a.name === bonus.attribute);
            if (attr && typeof attr.value === 'number') {
                (attr.value as number) += bonus.value;
                if(attr.maxValue) {
                    (attr.maxValue as number) += bonus.value;
                }
                break;
            }
        }
    });

    return finalAttributes;
};

const AttributeGrid: React.FC<{
    attributes: Attribute[];
    baseAttributes?: Attribute[];
}> = ({ attributes, baseAttributes }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
      {attributes.map(attr => {
        const baseAttr = baseAttributes?.find(ba => ba.name === attr.name);
        const baseValue = baseAttr?.value;
        const currentValue = attr.value;
        const bonus = (typeof currentValue === 'number' && typeof baseValue === 'number') ? currentValue - baseValue : 0;
        
        let valueColor = 'text-gray-100';
        if (bonus > 0) valueColor = 'text-green-400';
        if (bonus < 0) valueColor = 'text-red-400';
        
        return (
            <div key={attr.name} className="flex items-center" title={`${attr.description}${bonus !== 0 ? ` (Cơ bản: ${baseValue}, Thưởng: ${bonus > 0 ? '+' : ''}${bonus})` : ''}`}>
              <attr.icon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
              <div className="flex-grow flex justify-between items-baseline text-sm">
                <span className="text-gray-300">{attr.name}:</span>
                <span className={`font-bold text-md font-title transition-colors duration-300 ${valueColor}`}>{attr.value}</span>
              </div>
            </div>
        );
      })}
    </div>
);


const CharacterPanel: React.FC<CharacterPanelProps> = ({ character, onBreakthrough, realmSystem }) => {
    const { identity, attributes, spiritualRoot, cultivation, chosenPathIds, danhVong, healthStatus, activeEffects, vitals } = character;
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Thuộc tính Cơ Bản', 'Thiên Hướng']));

    const toggleGroup = (title: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(title)) {
                newSet.delete(title);
            } else {
                newSet.add(title);
            }
            return newSet;
        });
    };

    const finalAttributes = useMemo(() => {
        let attrs = calculateFinalAttributes(attributes, activeEffects);
        if (spiritualRoot) {
            attrs = attrs.map(group => {
                if (group.title === 'Khí (气 - Chân Nguyên)') {
                    return {
                        ...group,
                        attributes: group.attributes.map(attr => {
                            if (attr.name === 'Linh Căn') {
                                return { ...attr, value: spiritualRoot.name };
                            }
                            return attr;
                        })
                    };
                }
                return group;
            });
        }
        return attrs;
    }, [attributes, activeEffects, spiritualRoot]);
    

    const currentRealmData = realmSystem.find(r => r.id === cultivation.currentRealmId);
    const currentStageData = currentRealmData?.stages.find(s => s.id === cultivation.currentStageId);
    const currentRealmState = `${currentRealmData?.name || 'Vô danh'} - ${currentStageData?.name || 'Sơ kỳ'}`;
    const qiRequired = currentStageData?.qiRequired || 100;
    
    const canBreakthrough = cultivation.spiritualQi >= qiRequired;

    const currentStageIndex = currentRealmData?.stages.findIndex(s => s.id === cultivation.currentStageId) ?? -1;
    let isNextRealmTribulation = false;
    if (currentRealmData && currentStageIndex === currentRealmData.stages.length - 1) {
        const currentRealmIndex = realmSystem.findIndex(r => r.id === currentRealmData.id);
        const nextRealmData = realmSystem[currentRealmIndex + 1];
        if (nextRealmData?.hasTribulation) {
            isNextRealmTribulation = true;
        }
    }
    
    const sinhMenh = finalAttributes.flatMap(g => g.attributes).find(a => a.name === 'Sinh Mệnh') as Attribute & { value: number; maxValue: number };
    const linhLuc = finalAttributes.flatMap(g => g.attributes).find(a => a.name === 'Linh Lực') as Attribute & { value: number; maxValue: number };
    
    const chosenPaths = CULTIVATION_PATHS.filter(path => chosenPathIds.includes(path.id));
    const statusInfo = CHARACTER_STATUS_CONFIG[healthStatus];

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            {/* Identity */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-amber-300 font-title">{identity.name} ({identity.age} tuổi)</h2>
                <p className="text-sm text-gray-400 mb-2">{identity.origin}</p>
                 <div className="flex items-center justify-center gap-4">
                    <p className="text-md font-semibold text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full inline-block border border-cyan-500/30">{currentRealmState}</p>
                    <p className={`text-md font-semibold ${statusInfo.color} bg-black/20 px-3 py-1 rounded-full inline-block border border-gray-700`}>{statusInfo.label}</p>
                </div>
            </div>
            
            {/* Main Stats Bars */}
             <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60 space-y-3">
                 <ProgressBar current={sinhMenh.value} max={sinhMenh.maxValue} label="Sinh Mệnh" color="bg-red-500" icon={sinhMenh.icon} />
                 <ProgressBar current={linhLuc.value} max={linhLuc.maxValue} label="Linh Lực" color="bg-blue-500" icon={linhLuc.icon} />
            </div>

            {/* Vitals */}
            {vitals && (
                <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60 space-y-3">
                    <ProgressBar current={vitals.hunger} max={vitals.maxHunger} label="No Bụng" color="bg-yellow-600" icon={GiStomach} />
                    <ProgressBar current={vitals.thirst} max={vitals.maxThirst} label="Nước Uống" color="bg-sky-500" icon={GiWaterDrop} />
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-300">
                        <GiThermometerScale className="w-4 h-4" />
                        <span>Nhiệt Độ: <span className="font-bold">{vitals.temperature.toFixed(1)}°C</span></span>
                    </div>
                </div>
            )}

            {/* Cultivation */}
            <div>
                <h3 className="text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">Tu Luyện</h3>
                <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60 space-y-3">
                    <ProgressBar current={cultivation.spiritualQi} max={qiRequired} label="Linh Khí" color="bg-teal-400" icon={() => <span className="text-teal-300">🌀</span>} />
                    <div className="flex gap-2">
                        <button 
                            onClick={onBreakthrough} 
                            disabled={!canBreakthrough} 
                            className={`w-full flex items-center justify-center gap-2 font-bold py-2 px-4 rounded transition-colors text-sm ${
                                isNextRealmTribulation 
                                ? 'bg-purple-700 hover:bg-purple-600 text-white' 
                                : 'bg-amber-600 hover:bg-amber-500 text-white'
                            } disabled:bg-gray-500 disabled:cursor-not-allowed`}
                        >
                            {isNextRealmTribulation && <FaBolt />}
                            {isNextRealmTribulation ? 'Độ Kiếp' : 'Đột Phá'}
                        </button>
                    </div>
                     <p className="text-center text-xs text-gray-500 pt-2">Sử dụng hành động "Tu luyện" để hấp thụ linh khí.</p>
                </div>
            </div>

            {/* Spiritual Root */}
            {spiritualRoot && (
                <div>
                    <h3 className="flex items-center justify-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                        <GiPentacle /> Linh Căn
                    </h3>
                     <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                        <h4 className={`font-bold font-title text-center ${SPIRITUAL_ROOT_QUALITY_CONFIG[spiritualRoot.quality].color} ${SPIRITUAL_ROOT_QUALITY_CONFIG[spiritualRoot.quality].glow || ''}`}>{spiritualRoot.name}</h4>
                        <p className="text-xs text-gray-400 text-center">{spiritualRoot.description}</p>
                         <div className="mt-3 pt-3 border-t border-gray-700/50 grid grid-cols-1 gap-2">
                            {spiritualRoot.elements.map(element => {
                                const config = SPIRITUAL_ROOT_CONFIG[element.type];
                                return (
                                    <div key={element.type}>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-300">
                                            <config.icon/> {config.name} <span>({element.purity}%)</span>
                                        </div>
                                        <div className="w-full bg-gray-700/50 rounded-full h-1 mt-1">
                                            <div className="bg-amber-400 h-1 rounded-full" style={{width: `${element.purity}%`}}></div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Reputation */}
            <div>
                <h3 className="flex items-center justify-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                    <FaShieldAlt /> Danh Vọng
                </h3>
                <div className="flex justify-between items-center bg-black/20 px-3 py-2 rounded-lg border border-gray-700/60 text-sm">
                    <span className="text-gray-300">Toàn cõi</span>
                    <div className="text-right">
                        <span className="font-bold text-amber-300">{danhVong.status}</span>
                        <span className="text-xs text-gray-400 ml-2">({danhVong.value})</span>
                    </div>
                </div>
            </div>


            {/* Destiny Paths */}
            {chosenPaths.length > 0 && (
                <div>
                    <h3 className="flex items-center justify-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                        <FaRoute /> Thiên Mệnh Lộ
                    </h3>
                    <div className="space-y-3">
                        {chosenPaths.map(path => (
                            <div key={path.id} className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                                <h4 className="font-bold font-title text-amber-300">{path.name}</h4>
                                <p className="text-xs text-gray-400">{path.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {/* Attributes */}
            <div>
                 <h3 className="text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">Thuộc Tính Chi Tiết</h3>
                <div className="space-y-2">
                    {finalAttributes.filter(g => !['Chỉ số Sinh Tồn', 'Thông Tin Tu Luyện'].includes(g.title)).map(group => {
                        const isExpanded = expandedGroups.has(group.title);
                        const baseGroup = attributes.find(bg => bg.title === group.title);
                        return (
                          <div key={group.title} className="bg-black/20 rounded-lg border border-gray-700/60 transition-all duration-300">
                            <button onClick={() => toggleGroup(group.title)} className="w-full flex justify-between items-center p-2 text-left">
                                <h4 className="text-md text-gray-400 font-title">{group.title}</h4>
                                <FaChevronDown className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {isExpanded && (
                                <div className="p-3 border-t border-gray-700/50 animate-fade-in" style={{animationDuration: '300ms'}}>
                                    <AttributeGrid attributes={group.attributes} baseAttributes={baseGroup?.attributes} />
                                </div>
                            )}
                          </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default memo(CharacterPanel);