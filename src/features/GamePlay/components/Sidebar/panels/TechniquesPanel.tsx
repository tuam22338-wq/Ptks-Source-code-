import React, { memo } from 'react';
import type { PlayerCharacter, CultivationTechnique, CultivationTechniqueType } from '../../../../../types';
import { PHAP_BAO_RANKS } from '../../../../../constants';

interface TechniquesPanelProps {
    character: PlayerCharacter;
}

const TechniqueCard: React.FC<{ technique: CultivationTechnique }> = ({ technique }) => {
    const rankStyle = PHAP_BAO_RANKS[technique.rank] || PHAP_BAO_RANKS['Phàm Giai'];
    
    // FIX: The 'effectDescription' property does not exist on the 'CultivationTechnique' type.
    // Generate a descriptive string from the 'effects' array instead.
    const effectDescription = technique.effects
        .map(e => {
            const details = Object.entries(e.details)
                .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
                .join(', ');
            return `${e.type} (${details})`;
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
            <div className="mt-1 text-xs text-gray-400">
                <p>Hiệu quả: <span className="italic">{effectDescription}</span></p>
            </div>
        </div>
    );
};


const TechniquesPanel: React.FC<TechniquesPanelProps> = ({ character }) => {
    const { techniques } = character;

    const categorizedTechniques: Record<CultivationTechniqueType, CultivationTechnique[]> = {
        'Linh Kỹ': [],
        'Thần Thông': [],
        'Độn Thuật': [],
        'Tuyệt Kỹ': [],
    };

    techniques.forEach(tech => {
        if (categorizedTechniques[tech.type]) {
            categorizedTechniques[tech.type].push(tech);
        }
    });

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            {Object.entries(categorizedTechniques).map(([category, techList]) => {
                if (techList.length === 0) return null; // Don't show empty categories
                return (
                    <div key={category}>
                        <h3 className="text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">{category}</h3>
                        <div className="space-y-3">
                            {techList.map(tech => (
                                <TechniqueCard key={tech.id} technique={tech} />
                            ))}
                        </div>
                    </div>
                )
            })}
             {techniques.length === 0 && (
                <p className="text-center text-gray-500 py-4">Bạn chưa học được công pháp nào.</p>
             )}
        </div>
    );
};

export default memo(TechniquesPanel);
