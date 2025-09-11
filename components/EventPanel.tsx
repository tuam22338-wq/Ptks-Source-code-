import React, { useState, memo } from 'react';
import type { GameEvent, EventChoice, Attribute } from '../types';
import { FaDiceD20 } from 'react-icons/fa';

interface EventPanelProps {
    event: GameEvent;
    onChoice: (choice: EventChoice) => void;
    playerAttributes: Attribute[];
}

const EventPanel: React.FC<EventPanelProps> = ({ event, onChoice, playerAttributes }) => {
    const [selectedChoice, setSelectedChoice] = useState<EventChoice | null>(null);
    const [rollResult, setRollResult] = useState<{ roll: number; modifier: number; total: number; dc: number; success: boolean } | null>(null);
    const [animationState, setAnimationState] = useState<'idle' | 'rolling' | 'result'>('idle');

    const handleChoiceClick = (choice: EventChoice) => {
        setSelectedChoice(choice);
        
        if (choice.check) {
            setAnimationState('rolling');
            const attribute = playerAttributes.find(a => a.name === choice.check!.attribute);
            const attributeValue = (attribute?.value as number) || 10;
            const modifier = Math.floor((attributeValue - 10) / 2);
            const roll = Math.floor(Math.random() * 20) + 1;
            const total = roll + modifier;
            const dc = choice.check.difficulty;
            const success = total >= dc;

            setTimeout(() => {
                setRollResult({ roll, modifier, total, dc, success });
                setAnimationState('result');
                setTimeout(() => onChoice(choice), 2500); // Wait to show result, then proceed
            }, 1500); // Rolling animation duration
        } else {
            // No check, proceed immediately
            onChoice(choice);
        }
    };

    if (animationState !== 'idle') {
        return (
            <div className="flex-shrink-0 p-4 bg-black/40 backdrop-blur-sm border-t border-gray-700/50 flex flex-col items-center justify-center min-h-[150px]">
                <p className="text-lg text-gray-300 font-title mb-4 text-center">{selectedChoice?.text}</p>
                {animationState === 'rolling' && (
                    <div className="flex flex-col items-center animate-fade-in">
                        <FaDiceD20 className="text-6xl text-amber-300 animate-roll" />
                        <p className="mt-4 text-amber-200">Đang kiểm tra {selectedChoice?.check?.attribute}...</p>
                    </div>
                )}
                 {animationState === 'result' && rollResult && (
                    <div className="text-center animate-fade-in">
                        <p className={`text-4xl font-bold font-title ${rollResult.success ? 'text-green-400' : 'text-red-400'}`}>
                            {rollResult.success ? 'THÀNH CÔNG' : 'THẤT BẠI'}
                        </p>
                        <p className="text-lg text-gray-300">
                            {rollResult.total}
                            <span className="text-sm text-gray-400"> ({rollResult.roll > 0 ? rollResult.roll : `(${rollResult.roll})`}{rollResult.modifier >= 0 ? `+${rollResult.modifier}`: rollResult.modifier}) vs DC {rollResult.dc}</span>
                        </p>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex-shrink-0 p-4 bg-black/40 backdrop-blur-sm border-t border-gray-700/50 animate-fade-in" style={{animationDuration: '300ms'}}>
            <div className="bg-black/20 border-2 border-amber-500/50 p-4 rounded-lg shadow-lg">
                <p className="text-amber-200 text-lg italic mb-4 text-center">{event.description}</p>
                <div className="space-y-2">
                    {event.choices.map(choice => (
                        <button
                            key={choice.id}
                            onClick={() => handleChoiceClick(choice)}
                            className="w-full text-left p-3 bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700 rounded-md transition-colors"
                        >
                            <p className="font-semibold text-gray-200">{choice.text}</p>
                            {choice.check && <p className="text-xs text-gray-400">Yêu cầu kiểm tra [{choice.check.attribute}]</p>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default memo(EventPanel);
