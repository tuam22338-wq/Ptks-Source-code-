import React, { useState } from 'react';
import type { SkillCheck, EventChoice, CharacterAttributes } from '../../../types';
import { FaDiceD20 } from 'react-icons/fa';
import { DEFAULT_ATTRIBUTE_DEFINITIONS } from '../../../constants';

interface InteractionOverlayProps {
    skillCheck: SkillCheck | null | undefined;
    choices: EventChoice[] | null | undefined;
    playerAttributes: CharacterAttributes;
    onSkillCheckResult: (success: boolean) => void;
    onChoiceSelect: (choice: EventChoice) => void;
}

const InteractionOverlay: React.FC<InteractionOverlayProps> = ({ skillCheck, choices, playerAttributes, onSkillCheckResult, onChoiceSelect }) => {
    const [isRolling, setIsRolling] = useState(false);
    const [rollResult, setRollResult] = useState<{ roll: number; total: number; success: boolean } | null>(null);

    const handleSkillCheck = () => {
        if (!skillCheck) return;
        setIsRolling(true);
        
        const attrDef = DEFAULT_ATTRIBUTE_DEFINITIONS.find(def => def.name === skillCheck.attribute);
        const playerAttrValue = attrDef ? playerAttributes[attrDef.id]?.value || 0 : 0;
        
        // Simple D100 roll system
        const roll = Math.floor(Math.random() * 100) + 1;
        const total = roll + Math.floor(playerAttrValue / 2); // Add half of the attribute value as a bonus
        const success = total >= skillCheck.difficulty;

        setTimeout(() => {
            setRollResult({ roll, total, success });
            setTimeout(() => {
                onSkillCheckResult(success);
            }, 1500); // Show result for a bit
        }, 1000); // Animation duration
    };

    const renderSkillCheck = () => {
        if (!skillCheck) return null;
        
        const attrDef = DEFAULT_ATTRIBUTE_DEFINITIONS.find(def => def.name === skillCheck.attribute);
        const playerAttrValue = attrDef ? playerAttributes[attrDef.id]?.value || 0 : 0;

        return (
            <div className="w-full max-w-md mx-auto text-center">
                <h3 className="text-2xl font-bold font-title text-amber-300">Yêu Cầu Kiểm Tra</h3>
                <p className="text-lg text-gray-300 mt-2">
                    Cần kiểm tra <strong className="text-cyan-300">{skillCheck.attribute}</strong> để tiếp tục.
                </p>
                <p className="text-gray-400">Độ khó: {skillCheck.difficulty} (Chỉ số của bạn: {Math.floor(playerAttrValue)})</p>

                <div className="my-6 h-24 flex items-center justify-center">
                    {isRolling ? (
                        rollResult ? (
                            <div className="animate-fade-in">
                                <p className="text-xl">Kết quả: <strong className={rollResult.success ? 'text-green-400' : 'text-red-400'}>{rollResult.total}</strong> ({rollResult.roll} + {Math.floor(playerAttrValue / 2)})</p>
                                <p className={`text-3xl font-bold ${rollResult.success ? 'text-green-400' : 'text-red-400'}`}>{rollResult.success ? 'Thành Công!' : 'Thất Bại!'}</p>
                            </div>
                        ) : (
                            <FaDiceD20 className="text-7xl text-amber-400 animate-roll" />
                        )
                    ) : (
                         <button onClick={handleSkillCheck} className="px-8 py-4 bg-amber-600 text-white font-bold rounded-lg text-xl hover:bg-amber-500 transition-colors flex items-center gap-3">
                            <FaDiceD20 /> Tung Xúc Xắc
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const renderChoices = () => {
        if (!choices) return null;
        return (
             <div className="w-full max-w-2xl mx-auto text-center">
                <h3 className="text-2xl font-bold font-title text-amber-300 mb-4">Bạn sẽ làm gì?</h3>
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
                                <p className="font-semibold text-gray-200 disabled:text-gray-500">{choice.text}</p>
                                {check && (
                                    <div className={`text-xs mt-1 flex items-center gap-2 ${isUnavailable ? 'text-red-400/70' : 'text-cyan-300'}`}>
                                        <FaDiceD20 />
                                        <span>Yêu cầu {check.attribute} &ge; {check.difficulty} (Của bạn: {Math.floor(playerAttrValue)})</span>
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
            {skillCheck ? renderSkillCheck() : renderChoices()}
        </div>
    );
};

export default InteractionOverlay;