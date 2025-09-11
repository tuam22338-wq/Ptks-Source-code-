import React, { useState, useRef } from 'react';
import type { InnateTalent } from '../types';
import InnateTalentCard from './InnateTalentDisplay';

interface InnateTalentSelectionProps {
    talents: InnateTalent[];
    selectedTalents: InnateTalent[];
    onSelectionChange: (talents: InnateTalent[]) => void;
}

const InnateTalentSelection: React.FC<InnateTalentSelectionProps> = ({ talents, selectedTalents, onSelectionChange }) => {
    const [viewingDetailsOf, setViewingDetailsOf] = useState<string | null>(null);
    // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> to be environment-agnostic and resolve the type error.
    const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleTalentClick = (talent: InnateTalent) => {
        const isSelected = selectedTalents.some(t => t.name === talent.name);
        
        if (isSelected) {
            onSelectionChange(selectedTalents.filter(t => t.name !== talent.name));
        } else if (selectedTalents.length < 3) {
            onSelectionChange([...selectedTalents, talent]);
        }
    };

    const handlePointerDown = (talentName: string) => {
        holdTimeout.current = setTimeout(() => {
            setViewingDetailsOf(talentName);
        }, 250); // 250ms delay before showing details
    };
    
    const handlePointerUp = (talent: InnateTalent) => {
        if (holdTimeout.current) {
            clearTimeout(holdTimeout.current);
        }
        // If details were not shown, it's a click
        if (viewingDetailsOf !== talent.name) {
            handleTalentClick(talent);
        }
        setViewingDetailsOf(null);
    };

    const handlePointerLeave = () => {
        if (holdTimeout.current) {
            clearTimeout(holdTimeout.current);
        }
        setViewingDetailsOf(null);
    };

    return (
        <div className="bg-black/20 p-4 rounded-lg border border-gray-700/60">
            <h3 className="text-xl text-gray-300 font-title font-semibold mb-1">Lựa chọn Tiên Tư</h3>
            <p className="text-sm text-gray-400 mb-4">Ấn giữ để xem chi tiết. Bạn có thể chọn tối đa 3 Tiên Tư.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {talents.map((talent, index) => {
                    const isSelected = selectedTalents.some(t => t.name === talent.name);
                    const canSelectMore = selectedTalents.length < 3;
                    const isSelectable = isSelected || canSelectMore;
                    
                    return (
                        <div 
                            key={index} 
                            className="animate-talent-reveal aspect-[4/5]" 
                            style={{animationDelay: `${index * 50}ms`}}
                            onMouseDown={() => handlePointerDown(talent.name)}
                            onMouseUp={() => handlePointerUp(talent)}
                            onMouseLeave={handlePointerLeave}
                            onTouchStart={() => handlePointerDown(talent.name)}
                            onTouchEnd={(e) => {
                                e.preventDefault(); // Prevents firing mouse events on touch devices
                                handlePointerUp(talent);
                            }}
                        >
                             <InnateTalentCard 
                                talent={talent}
                                isSelected={isSelected}
                                isSelectable={isSelectable}
                                showDetails={viewingDetailsOf === talent.name}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default InnateTalentSelection;