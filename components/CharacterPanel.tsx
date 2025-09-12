import React, { memo } from 'react';
import type { PlayerCharacter, Attribute, RealmConfig } from '../types';
import { INNATE_TALENT_RANKS, CULTIVATION_PATHS } from '../constants';
import { FaBolt, FaCoins, FaGem, FaRoute, FaUsers } from 'react-icons/fa';

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


const CharacterPanel: React.FC<CharacterPanelProps> = ({ character, onBreakthrough, realmSystem }) => {
    const { identity, attributes, talents, cultivation, currencies, chosenPathIds, reputation } = character;

    const currentRealmData = realmSystem.find(r => r.id === cultivation.currentRealmId);
    const currentStageData = currentRealmData?.stages.find(s => s.id === cultivation.currentStageId);
    const currentRealmState = `${currentRealmData?.name || 'Vô danh'} - ${currentStageData?.name || 'Sơ kỳ'}`;
    const qiRequired = currentStageData?.qiRequired || 100;
    
    const canBreakthrough = cultivation.spiritualQi >= qiRequired;

    // Check for tribulation
    const currentStageIndex = currentRealmData?.stages.findIndex(s => s.id === cultivation.currentStageId) ?? -1;
    let isNextRealmTribulation = false;
    if (currentRealmData && currentStageIndex === currentRealmData.stages.length - 1) {
        const currentRealmIndex = realmSystem.findIndex(r => r.id === currentRealmData.id);
        const nextRealmData = realmSystem[currentRealmIndex + 1];
        if (nextRealmData?.hasTribulation) {
            isNextRealmTribulation = true;
        }
    }
    
    const sinhMenh = attributes.flatMap(g => g.attributes).find(a => a.name === 'Sinh Mệnh') as Attribute & { value: number; maxValue: number };
    const linhLuc = attributes.flatMap(g => g.attributes).find(a => a.name === 'Linh Lực') as Attribute & { value: number; maxValue: number };
    
    const chosenPaths = CULTIVATION_PATHS.filter(path => chosenPathIds.includes(path.id));

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            {/* Identity */}
            <div className="text-center">
                <h2 className="text-2xl font-bold text-amber-300 font-title">{identity.name} ({identity.age} tuổi)</h2>
                <p className="text-sm text-gray-400 mb-2">{identity.origin}</p>
                <p className="text-md font-semibold text-cyan-300 bg-cyan-500/10 px-3 py-1 rounded-full inline-block border border-cyan-500/30">{currentRealmState}</p>
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
                    <span className="font-semibold">{currencies['Bạc']?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center gap-2 text-green-400" title="Linh thạch hạ phẩm">
                    <FaGem className="w-5 h-5" />
                    <span className="font-semibold">{currencies['Linh thạch hạ phẩm']?.toLocaleString() || 0}</span>
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
                     <p className="text-center text-xs text-gray-500 pt-2">Nhập "tu luyện" vào ô chat để hấp thụ linh khí.</p>
                </div>
            </div>

            {/* Faction Reputation */}
            {reputation && reputation.length > 0 && (
                <div>
                    <h3 className="flex items-center justify-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                        <FaUsers /> Danh Vọng
                    </h3>
                    <div className="space-y-2">
                        {reputation.map(rep => (
                            <div key={rep.factionName} className="flex justify-between items-center bg-black/20 px-3 py-2 rounded-lg border border-gray-700/60 text-sm">
                                <span className="text-gray-300">{rep.factionName}</span>
                                <div className="text-right">
                                    <span className="font-bold text-amber-300">{rep.status}</span>
                                    <span className="text-xs text-gray-400 ml-2">({rep.value})</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Talents */}
            <div>
                <h3 className="text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">Tiên Tư</h3>
                <div className="space-y-3">
                    {talents.map(talent => {
                        const rankStyle = INNATE_TALENT_RANKS[talent.rank] || INNATE_TALENT_RANKS['Phàm Tư'];
                        const detailTooltip = [
                            `Hiệu ứng: ${talent.effect}`,
                            talent.triggerCondition ? `Kích hoạt: ${talent.triggerCondition}` : null,
                            talent.synergy ? `Tương tác: ${talent.synergy}` : null,
                        ].filter(Boolean).join('\n');

                        return (
                            <div key={talent.name} className="bg-black/20 p-3 rounded-lg border border-gray-700/60" title={detailTooltip}>
                                <h4 className={`font-bold font-title ${rankStyle.color}`}>{talent.name}</h4>
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
                <div className="space-y-4">
                    {attributes.filter(g => !['Chỉ số Sinh Tồn', 'Thông Tin Tu Luyện'].includes(g.title)).map(group => (
                      <div key={group.title}>
                        <h4 className="text-md text-gray-400 font-title mb-2">{group.title}</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {group.attributes.map(attr => {
                            if (attr.name === 'Cảnh Giới') return null; // Hide Cảnh Giới from here as it's displayed at the top
                            return (
                                <div key={attr.name} className="flex items-center" title={attr.description}>
                                <attr.icon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                                <div className="flex-grow flex justify-between items-baseline text-sm">
                                    <span className="text-gray-300">{attr.name}:</span>
                                    <span className="font-bold text-md font-title text-gray-100">{attr.value}</span>
                                </div>
                                </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default memo(CharacterPanel);