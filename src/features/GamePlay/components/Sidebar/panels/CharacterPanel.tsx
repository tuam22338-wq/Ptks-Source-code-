import React, { memo, useMemo, useState } from 'react';
import type { PlayerCharacter, Attribute, RealmConfig, ActiveEffect, StatBonus, AttributeGroup, InventoryItem } from '../../../../../types';
import { INNATE_TALENT_RANKS, CULTIVATION_PATHS, CHARACTER_STATUS_CONFIG, CURRENCY_ITEMS } from '../../../../../constants';
import { FaBolt, FaCoins, FaGem, FaRoute, FaUsers, FaChevronDown, FaShieldAlt } from 'react-icons/fa';

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
                <div className={`${color} h-2 rounded-full transition-all duration-300`} style={{ width: `${percentage}%` }}></div>
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
    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
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
    // Fix: Destructure currencies directly from the character prop.
    const { identity, attributes, talents, cultivation, chosenPathIds, danhVong, healthStatus, activeEffects, inventory, currencies } = character;
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

    const finalAttributes = useMemo(() => calculateFinalAttributes(attributes, activeEffects), [attributes, activeEffects]);
    

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

            {/* Currencies */}
             <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60 flex justify-around">
                <div className="flex items-center gap-2 text-yellow-400" title="Bạc">
                    <FaCoins className="w-5 h-5" />
                    <span className="font-semibold">{currencies?.['Bạc']?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center gap-2 text-green-400" title="Linh thạch hạ phẩm">
                    <FaGem className="w-5 h-5" />
                    <span className="font-semibold">{currencies?.['Linh thạch hạ phẩm']?.toLocaleString() || 0}</span>
                </div>
            </div>

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

            {/* Talents */}
            <div>
                <h3 className="text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">Tiên Tư</h3>
                <div className="space-y-3">
                    {talents.map(talent => {
                        const rankStyle = INNATE_TALENT_RANKS[talent.rank] || INNATE_TALENT_RANKS['Phàm Giai'];
                        const detailTooltip = [
                            `Hiệu ứng: ${talent.effect}`,
                            talent.triggerCondition ? `Kích hoạt: ${talent.triggerCondition}` : null,
                            talent.synergy ? `Tương tác: ${talent.synergy}` : null,
                        ].filter(Boolean).join('\n');

                        return (
                            <div key={talent.name} className="bg-black/20 p-3 rounded-lg border border-gray-700/60" title={detailTooltip}>
                                <h4 className={`font-bold font-title ${rankStyle.color} ${rankStyle.glow || ''}`}>{talent.name}</h4>
                                <p className="text-xs text-gray-400">{talent.description}</p>
                            </div>
                        )
                    })}
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