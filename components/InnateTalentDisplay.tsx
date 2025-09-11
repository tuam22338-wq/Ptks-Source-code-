import React from 'react';
import type { InnateTalent } from '../types';
import { INNATE_TALENT_RANKS } from '../constants';

interface InnateTalentCardProps {
  talent: InnateTalent;
  isSelected: boolean;
  isSelectable: boolean;
  showDetails: boolean;
}

const InnateTalentCard: React.FC<InnateTalentCardProps> = ({ talent, isSelected, isSelectable, showDetails }) => {
  const rankStyle = INNATE_TALENT_RANKS[talent.rank] || INNATE_TALENT_RANKS['Phàm Tư'];

  const borderClass = isSelected 
    ? `border-amber-400 ring-2 ring-amber-400/50` 
    : isSelectable 
    ? `border-gray-700 hover:border-gray-500` 
    : `border-gray-800`;

  const opacityClass = !isSelectable && !isSelected ? 'opacity-50' : 'opacity-100';
  const cursorClass = !isSelectable && !isSelected ? 'cursor-not-allowed' : 'cursor-pointer';

  return (
    <div className={`relative w-full h-full bg-black/30 p-3 rounded-lg border-2 flex flex-col items-center justify-center text-center shadow-lg transition-all duration-300 ${borderClass} ${opacityClass} ${cursorClass}`}>
      {/* Compact View */}
      <h4 className={`text-lg font-bold font-title ${rankStyle.color}`} style={{textShadow: '0 0 6px currentColor'}}>
          {talent.name}
      </h4>
      <p className={`mt-1 text-xs font-semibold ${rankStyle.color}`}>
          [{talent.rank}]
      </p>

      {/* Detailed View (Overlay on hold) */}
      {showDetails && (
        <div className="absolute inset-0 z-20 bg-gray-900/95 backdrop-blur-md p-4 rounded-lg border-2 border-amber-400 flex flex-col justify-between animate-fade-in w-full h-full shadow-2xl shadow-black/70"
             style={{ animationDuration: '150ms' }}
        >
          <div className="text-center">
            <h4 className={`text-xl font-bold font-title ${rankStyle.color}`} style={{textShadow: '0 0 8px currentColor'}}>
                {talent.name}
            </h4>
            <p className={`mt-1 text-sm font-semibold ${rankStyle.color}`}>
                [{talent.rank}]
            </p>
          </div>
          
          <div className="text-center text-gray-200 text-sm my-3 flex-grow flex items-center justify-center">
            <p>
                {talent.description}
            </p>
          </div>
          
          <div className="space-y-2 text-xs text-left">
            {talent.triggerCondition && (
                 <p className="text-cyan-300 bg-cyan-500/10 p-2 rounded-md border border-cyan-500/30">
                    <span className="font-bold">Kích hoạt:</span> {talent.triggerCondition}
                </p>
            )}
            {talent.synergy && (
                <p className="text-purple-300 bg-purple-500/10 p-2 rounded-md border border-purple-500/30">
                    <span className="font-bold">Tương tác:</span> {talent.synergy}
                </p>
            )}
             <p className="font-semibold text-teal-300 bg-teal-500/10 p-2 rounded-md border border-teal-500/30">
              <span className="font-bold">Hiệu ứng:</span> {talent.effect}
            </p>
          </div>

        </div>
      )}
    </div>
  );
};

export default InnateTalentCard;