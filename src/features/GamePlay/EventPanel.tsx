import React from 'react';
// FIX: Update type imports to use `CharacterAttributes` instead of the removed `Attribute` type.
import type { GameEvent, EventChoice, CharacterAttributes } from '../../types';
import { FaDiceD20 } from 'react-icons/fa';
// FIX: Import attribute definitions to look up attribute IDs by name.
import { DEFAULT_ATTRIBUTE_DEFINITIONS } from '../../constants';

interface EventPanelProps {
    event: GameEvent;
    onChoice: (choice: EventChoice) => void;
    playerAttributes: CharacterAttributes;
}

const EventPanel: React.FC<EventPanelProps> = ({ event, onChoice, playerAttributes }) => {
    return (
        <div className="flex-shrink-0 p-4 bg-black/40 backdrop-blur-sm border-t-2 border-amber-500/50">
            <div className="bg-black/20 p-4 rounded-lg shadow-lg w-full max-w-3xl mx-auto">
                <p className="text-amber-200 text-lg italic mb-4 text-center">{event.description}</p>
                <div className="space-y-2">
                    {event.choices.map(choice => {
                        const check = choice.check;
                        // FIX: Correctly look up the attribute value from the `CharacterAttributes` record using its name.
                        const attrDef = check ? DEFAULT_ATTRIBUTE_DEFINITIONS.find(def => def.name === check.attribute) : null;
                        const playerAttrValue = attrDef ? (playerAttributes[attrDef.id]?.value || 0) : 0;
                        
                        return (
                            <button
                                key={choice.id}
                                onClick={() => onChoice(choice)}
                                className="w-full text-left p-3 bg-gray-800/60 hover:bg-gray-700/50 border border-gray-700 rounded-md transition-colors"
                            >
                                <p className="font-semibold text-gray-200">{choice.text}</p>
                                {check && (
                                    <div className="text-xs text-cyan-300 mt-1 flex items-center gap-2">
                                        <FaDiceD20 />
                                        <span>Kiểm tra {check.attribute} (Độ khó: {check.difficulty}, Của bạn: {playerAttrValue})</span>
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default EventPanel;