import React, { useRef, useEffect, memo } from 'react';
import type { StoryEntry, InventoryItem, CultivationTechnique } from '../../../types';

interface StoryLogProps {
    story: StoryEntry[];
    inventoryItems: InventoryItem[];
    techniques: CultivationTechnique[];
}

const highlightText = (text: string, items: InventoryItem[], techniques: CultivationTechnique[]): React.ReactNode => {
    if (!text) return text;
    
    const itemNames = items ? [...new Set(items.map(item => item.name))] : [];
    const techniqueNames = techniques ? [...new Set(techniques.map(tech => tech.name))] : [];

    if (itemNames.length === 0 && techniqueNames.length === 0) return text;

    const allNames = [...itemNames, ...techniqueNames]
        .sort((a, b) => b.length - a.length)
        .map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')); 
        
    if (allNames.length === 0) return text;

    const regex = new RegExp(`(${allNames.join('|')})`, 'g');
    const parts = text.split(regex);

    return parts.map((part, i) => {
        const unescapedPart = part.replace(/\\/g, '');
        if (itemNames.includes(unescapedPart)) {
            return (
                <span key={i} className="font-bold text-amber-300 bg-amber-500/10 px-1 rounded-sm">
                    {part}
                </span>
            );
        }
        if (techniqueNames.includes(unescapedPart)) {
            return (
                <span key={i} className="font-bold text-cyan-400 bg-cyan-500/10 px-1 rounded-sm">
                    {part}
                </span>
            );
        }
        return part;
    });
};


const StoryLog: React.FC<StoryLogProps> = ({ story, inventoryItems, techniques }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [story]);

    return (
        <div className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-4">
            {story.map((entry) => {
                const animationStyle = { animationDuration: '600ms' };
                const contentWithHighlight = highlightText(entry.content, inventoryItems, techniques);

                switch (entry.type) {
                    case 'narrative':
                        return <p key={entry.id} style={animationStyle} className="text-gray-300 italic text-justify my-4 leading-relaxed animate-fade-in whitespace-pre-wrap">{contentWithHighlight}</p>;
                    
                    case 'system':
                        return <p key={entry.id} style={animationStyle} className="text-center text-xs text-gray-500 tracking-widest my-4 uppercase animate-fade-in">{contentWithHighlight}</p>;
                    
                    case 'player-action':
                    case 'player-dialogue':
                        return (
                            <div key={entry.id} style={animationStyle} className="flex justify-end ml-10 sm:ml-20 animate-fade-in">
                                <div className="bg-gray-700/80 p-3 rounded-xl rounded-br-none">
                                    <p className={`text-lg leading-relaxed ${entry.type === 'player-action' ? 'text-lime-300 italic' : 'text-cyan-200'}`}>
                                        {contentWithHighlight}
                                    </p>
                                </div>
                            </div>
                        );
                    
                    case 'dialogue':
                    case 'action-result':
                    case 'combat':
                    default:
                        return (
                            <div key={entry.id} style={animationStyle} className="flex justify-start mr-10 sm:mr-20 animate-fade-in">
                                <div className="bg-gray-800/60 p-3 rounded-xl rounded-bl-none">
                                    <p className="text-amber-200 text-lg leading-relaxed">{contentWithHighlight}</p>
                                </div>
                            </div>
                        );
                }
            })}
            <div ref={endOfMessagesRef} />
        </div>
    );
};

export default memo(StoryLog);