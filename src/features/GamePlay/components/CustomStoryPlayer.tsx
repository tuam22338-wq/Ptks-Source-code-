import React, { useState, useMemo } from 'react';
import type { GameState, ActiveStoryState, StoryNode, StoryChoice } from '../../../types';
import { FaDiceD20 } from 'react-icons/fa';

interface CustomStoryPlayerProps {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
}

const CustomStoryPlayer: React.FC<CustomStoryPlayerProps> = ({ gameState, setGameState }) => {
    const { activeStory, activeMods, playerCharacter } = gameState;
    const [animationState, setAnimationState] = useState<'idle' | 'rolling' | 'result'>('idle');
    const [rollResult, setRollResult] = useState<{ roll: number; modifier: number; total: number; dc: number; success: boolean } | null>(null);

    const { storySystem, currentNode } = useMemo(() => {
        if (!activeStory) return { storySystem: null, currentNode: null };

        for (const mod of activeMods) {
            const system = mod.content.storySystems?.find(s => s.name === activeStory.systemId);
            if (system) {
                const node = system.nodes[activeStory.currentNodeId];
                if (node) {
                    return { storySystem: system, currentNode: { ...node, id: activeStory.currentNodeId } };
                }
            }
        }
        return { storySystem: null, currentNode: null };
    }, [activeStory, activeMods]);

    if (!activeStory || !storySystem || !currentNode) {
        if (activeStory) {
            setGameState(gs => gs ? { ...gs, activeStory: null } : null);
        }
        return <div className="flex-shrink-0 p-4 bg-black/40 text-red-400 text-center">Lỗi: Không tìm thấy dữ liệu cốt truyện.</div>;
    }
    
    const applyOutcomes = (outcomes: any[]) => {
        if (!outcomes || outcomes.length === 0) return;

        outcomes.forEach(outcome => {
             if (outcome.type === 'CHANGE_STAT') {
                 setGameState(gs => {
                    if (!gs) return null;
                    const { playerCharacter } = gs;
                    const newAttributes = playerCharacter.attributes.map(group => ({
                        ...group,
                        attributes: group.attributes.map(attr => {
                            if (attr.name === outcome.details.attribute && typeof attr.value === 'number') {
                                return { ...attr, value: attr.value + outcome.details.change };
                            }
                            return attr;
                        })
                    }));
                    return { ...gs, playerCharacter: { ...playerCharacter, attributes: newAttributes } };
                });
             }
        });
    };

    const handleChoice = (choice: StoryChoice) => {
        applyOutcomes(choice.outcomes || []);
        setGameState(gs => gs ? { ...gs, activeStory: { ...activeStory, currentNodeId: choice.nextNodeId } } : null);
    };

    const handleContinue = (nextNodeId: string) => {
        setGameState(gs => gs ? { ...gs, activeStory: { ...activeStory, currentNodeId: nextNodeId } } : null);
    };

    const handleFinish = () => {
        setGameState(gs => gs ? { ...gs, activeStory: null } : null);
    };
    
    const handleCheck = () => {
        if (!currentNode.check) return;
        
        setAnimationState('rolling');
        
        const attribute = playerCharacter.attributes
            .flatMap(g => g.attributes)
            .find(a => a.name === currentNode.check!.attribute);
        const attributeValue = (attribute?.value as number) || 10;
        const modifier = Math.floor((attributeValue - 10) / 2);
        const roll = Math.floor(Math.random() * 20) + 1;
        const total = roll + modifier;
        const dc = currentNode.check.difficulty;
        const success = total >= dc;

        setTimeout(() => {
            setRollResult({ roll, modifier, total, dc, success });
            setAnimationState('result');
            const nextNodeId = success ? currentNode.successNodeId : currentNode.failureNodeId;
            setTimeout(() => {
                setAnimationState('idle');
                if (nextNodeId) handleContinue(nextNodeId);
                else handleFinish();
            }, 2500);
        }, 1500);
    };
    
    const renderContent = () => {
        if (animationState !== 'idle' && rollResult) {
             return (
                <div className="text-center animate-fade-in">
                    <p className={`text-4xl font-bold font-title ${rollResult.success ? 'text-green-400' : 'text-red-400'}`}>
                        {rollResult.success ? 'THÀNH CÔNG' : 'THẤT BẠI'}
                    </p>
                    <p className="text-lg text-gray-300">
                        {rollResult.total}
                        <span className="text-sm text-gray-400"> ({rollResult.roll}{rollResult.modifier >= 0 ? `+${rollResult.modifier}`: rollResult.modifier}) vs DC {rollResult.dc}</span>
                    </p>
                </div>
            );
        }
        
        if (animationState === 'rolling') {
             return (
                <div className="flex flex-col items-center animate-fade-in">
                    <FaDiceD20 className="text-6xl text-amber-300 animate-roll" />
                    <p className="mt-4 text-amber-200">Đang kiểm tra {currentNode.check?.attribute}...</p>
                </div>
            );
        }

        return (
             <div className="bg-black/20 border-2 border-amber-500/50 p-4 rounded-lg shadow-lg w-full max-w-3xl mx-auto">
                <p className="text-amber-200 text-lg italic mb-4 text-center">{currentNode.content}</p>
                <div className="space-y-2">
                   {currentNode.type === 'choice' && currentNode.choices?.map((choice, index) => (
                       <button
                           key={index}
                           onClick={() => handleChoice(choice)}
                           className="w-full text-left p-3 bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700 rounded-md transition-colors"
                       >
                           <p className="font-semibold text-gray-200">{choice.text}</p>
                       </button>
                   ))}
                   {currentNode.type === 'narrative' && currentNode.nextNodeId && (
                        <button onClick={() => handleContinue(currentNode.nextNodeId!)} className="w-full p-3 bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700 rounded-md transition-colors font-semibold text-gray-200">
                            Tiếp tục...
                        </button>
                   )}
                   {currentNode.type === 'check' && (
                        <button onClick={handleCheck} className="w-full p-3 bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700 rounded-md transition-colors font-semibold text-gray-200">
                            Thử thách
                        </button>
                   )}
                   {currentNode.type === 'end' && (
                       <button onClick={handleFinish} className="w-full p-3 bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700 rounded-md transition-colors font-semibold text-gray-200">
                           Kết thúc
                       </button>
                   )}
                </div>
            </div>
        )
    }

    return (
        <div className="flex-shrink-0 p-4 bg-black/40 backdrop-blur-sm border-t border-gray-700/50 flex flex-col items-center justify-center min-h-[150px]">
            {renderContent()}
        </div>
    );
};

export default CustomStoryPlayer;