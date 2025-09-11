import React, { useState, memo } from 'react';
import type { PlayerCharacter, RealmConfig } from '../types';
import { FaGopuram, FaChevronDown } from 'react-icons/fa';

interface RealmPanelProps {
    playerCharacter: PlayerCharacter;
    realmSystem: RealmConfig[];
}

const RealmPanel: React.FC<RealmPanelProps> = ({ playerCharacter, realmSystem }) => {
    const { cultivation } = playerCharacter;
    const [openRealms, setOpenRealms] = useState<Set<string>>(new Set([cultivation.currentRealmId]));

    const toggleRealm = (realmId: string) => {
        setOpenRealms(prev => {
            const newSet = new Set(prev);
            if (newSet.has(realmId)) {
                newSet.delete(realmId);
            } else {
                newSet.add(realmId);
            }
            return newSet;
        });
    };

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div>
                <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                    <FaGopuram className="text-purple-300" /> Hệ Thống Cảnh Giới
                </h3>
                <div className="space-y-2">
                    {realmSystem.map((realm, index) => {
                        const isCurrentRealm = realm.id === cultivation.currentRealmId;
                        const isOpen = openRealms.has(realm.id);
                        const isUnlocked = realmSystem.findIndex(r => r.id === cultivation.currentRealmId) >= index;

                        return (
                            <div key={realm.id} className={`rounded-lg border-2 transition-all duration-300 ${isCurrentRealm ? 'bg-purple-900/30 border-purple-500/50' : 'bg-black/20 border-gray-700/60'}`}>
                                <button 
                                    onClick={() => toggleRealm(realm.id)}
                                    className={`w-full flex justify-between items-center p-3 text-left focus:outline-none ${!isUnlocked ? 'opacity-50' : ''}`}
                                >
                                    <h4 className={`text-lg font-bold font-title ${isCurrentRealm ? 'text-purple-300' : isUnlocked ? 'text-gray-200' : 'text-gray-500'}`}>
                                        {realm.name}
                                    </h4>
                                    <FaChevronDown className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${isUnlocked ? 'text-gray-400' : 'text-gray-600'}`} />
                                </button>
                                
                                {isOpen && isUnlocked && (
                                    <div className="p-3 border-t-2 border-gray-700/60 animate-fade-in" style={{animationDuration: '300ms'}}>
                                        {realm.description && <p className="text-sm text-gray-400 mb-3 italic">{realm.description}</p>}
                                        <div className="space-y-3 pl-2">
                                            {realm.stages.map(stage => {
                                                const isCurrentStage = isCurrentRealm && stage.id === cultivation.currentStageId;
                                                return (
                                                    <div key={stage.id} className="pl-2 border-l-2 border-gray-700/50">
                                                        <p className={`text-sm transition-colors ${isCurrentStage ? 'text-amber-300 font-semibold' : 'text-gray-300'}`}>
                                                            {isCurrentStage && '▶ '} {stage.name}
                                                        </p>
                                                        <div className="pl-4 text-xs text-gray-500 space-y-1 mt-1">
                                                            {stage.description && <p className="italic">{stage.description}</p>}
                                                            <p>Linh khí cần: <span className="font-semibold text-teal-400">{stage.qiRequired.toLocaleString()}</span></p>
                                                            {stage.bonuses.length > 0 && (
                                                                <p>Thưởng: <span className="font-semibold text-green-400">{stage.bonuses.map(b => `${b.attribute} +${b.value}`).join(', ')}</span></p>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default memo(RealmPanel);
