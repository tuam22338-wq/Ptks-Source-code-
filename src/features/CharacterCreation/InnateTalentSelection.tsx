import React, { useState, useRef, memo } from 'react';
import type { InnateTalent } from '../../types';
import InnateTalentCard from './InnateTalentDisplay';

interface InnateTalentSelectionProps {
    talents: InnateTalent[];
    selectedTalents: InnateTalent[];
    onSelectionChange: (talents: InnateTalent[]) => void;
    maxSelectable: number;
}

const InnateTalentSelection: React.FC<InnateTalentSelectionProps> = ({ talents, selectedTalents, onSelectionChange, maxSelectable }) => {
    const [viewingDetailsOf, setViewingDetailsOf] = useState<string | null>(null);
    const holdTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleTalentClick = (talent: InnateTalent) => {
        const isSelected = selectedTalents.some(t => t.name === talent.name);
        
        if (isSelected) {
            onSelectionChange(selectedTalents.filter(t => t.name !== talent.name));
        } else if (selectedTalents.length < maxSelectable) {
            onSelectionChange([...selectedTalents, talent]);
        }
    };

    const handlePointerDown = (talentName: string) => {
        holdTimeout.current = setTimeout(() => {
            setViewingDetailsOf(talentName);
        }, 250);
    };
    
    const handlePointerUp = (talent: InnateTalent) => {
        if (holdTimeout.current) {
            clearTimeout(holdTimeout.current);
        }
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
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {talents.map((talent, index) => {
                const isSelected = selectedTalents.some(t => t.name === talent.name);
                const canSelectMore = selectedTalents.length < maxSelectable;
                const isSelectable = isSelected || canSelectMore;
                
                return (
                    <div 
                        key={index} 
                        className="animate-talent-reveal aspect-[4/5] relative" 
                        style={{animationDelay: `${index * 50}ms`}}
                        onMouseDown={() => handlePointerDown(talent.name)}
                        onMouseUp={() => handlePointerUp(talent)}
                        onMouseLeave={handlePointerLeave}
                        onTouchStart={() => handlePointerDown(talent.name)}
                        onTouchEnd={(e) => {
                            e.preventDefault();
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
    );
};

export default memo(InnateTalentSelection);