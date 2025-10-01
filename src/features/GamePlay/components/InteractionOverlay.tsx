import React from 'react';
import type { EventChoice, CharacterAttributes } from '../../../types';
import { FaDiceD20 } from 'react-icons/fa';
import { DEFAULT_ATTRIBUTE_DEFINITIONS } from '../../../constants';

interface InteractionOverlayProps {
    choices: EventChoice[] | null | undefined;
    playerAttributes: CharacterAttributes;
    onChoiceSelect: (choice: EventChoice) => void;
}

const InteractionOverlay: React.FC<InteractionOverlayProps> = ({ choices, playerAttributes, onChoiceSelect }) => {

    const renderChoices = () => {
        if (!choices) return null;
        return (
             <div className="w-full max-w-2xl mx-auto text-center animate-fade-in" style={{animationDuration: '300ms'}}>
                <h3 className="text-2xl font-bold font-title mb-4" style={{color: 'var(--primary-accent-color)'}}>Bạn sẽ làm gì?</h3>
                <div className="space-y-3">
                    {choices.map(choice => {
                         const check = choice.check;
                         const attrDef = check ? DEFAULT_ATTRIBUTE_DEFINITIONS.find(def => def.name === check.attribute) : null;
                         const playerAttrValue = attrDef ? (playerAttributes[attrDef.id]?.value || 0) : 0;
                         const isUnavailable = check && playerAttrValue < check.difficulty;

                         return (
                            <button
                                key={choice.id}
                                onClick={() => onChoiceSelect(choice)}
                                disabled={isUnavailable}
                                className="w-full text-left p-3 bg-gray-800/60 hover:bg-gray-700/50 border border-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-900/80 disabled:hover:bg-gray-900/80"
                            >
                                <p className="font-semibold" style={{color: isUnavailable ? 'var(--text-muted-color)' : 'var(--text-color)'}}>{choice.text}</p>
                                {check && (
                                    <div className="text-xs mt-1 flex items-center gap-2" style={{color: isUnavailable ? 'var(--error-color)' : 'var(--secondary-accent-color)'}}>
                                        <FaDiceD20 />
                                        <span>Kiểm tra {check.attribute} (Độ khó: {check.difficulty}, Của bạn: {playerAttrValue})</span>
                                    </div>
                                )}
                            </button>
                         );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="flex-shrink-0 p-4 bg-black/60 backdrop-blur-sm border-t-2 border-amber-500/50 flex items-center justify-center min-h-[200px]">
            {renderChoices()}
        </div>
    );
};

export default InteractionOverlay;