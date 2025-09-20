import React, { useRef, useEffect, memo } from 'react';
import type { StoryEntry, InventoryItem, CultivationTechnique } from '../../types';
import { FaVolumeUp } from 'react-icons/fa';

interface StoryLogProps {
    story: StoryEntry[];
    inventoryItems: InventoryItem[];
    techniques: CultivationTechnique[];
    onSpeak: (text: string) => void;
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


const StoryLog: React.FC<StoryLogProps> = ({ story, inventoryItems, techniques, onSpeak }) => {
    const endOfMessagesRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            // A threshold of 100px. If the user is scrolled up more than this, we don't auto-scroll.
            const isNearBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 100;

            if (isNearBottom) {
                // Using 'auto' instead of 'smooth' prevents jank during rapid stream updates.
                endOfMessagesRef.current?.scrollIntoView({ behavior: 'auto' });
            }
        }
    }, [story]);

    const handleSpeak = (content: string) => {
        const cleanText = content.replace(/\[.*?\]/g, '');
        onSpeak(cleanText);
    };

    return (
        <div ref={scrollContainerRef} className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-4">
            {story.map((entry) => {
                const animationStyle = { animationDuration: '600ms' };
                const contentWithHighlight = highlightText(entry.content, inventoryItems, techniques);
                const isSpeakable = ['narrative', 'dialogue', 'action-result', 'system-notification', 'player-dialogue', 'combat'].includes(entry.type);

                switch (entry.type) {
                    case 'narrative':
                        return (
                            <div key={entry.id} className="group relative animate-fade-in my-4" style={animationStyle}>
                                <p className="font-bold text-lg text-justify leading-relaxed whitespace-pre-wrap">{contentWithHighlight}</p>
                                {isSpeakable && <button onClick={() => handleSpeak(entry.content)} className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"><FaVolumeUp /></button>}
                            </div>
                        );
                    
                    case 'system':
                        return <p key={entry.id} style={animationStyle} className="text-center text-xs text-[var(--text-muted-color)]/70 tracking-widest my-4 uppercase animate-fade-in">{contentWithHighlight}</p>;
                    
                    case 'system-notification':
                        return (
                             <div key={entry.id} className="group relative my-4 p-3 bg-blue-900/20 border-l-4 border-blue-400 rounded-r-lg animate-fade-in" style={animationStyle}>
                                <p className="font-mono text-blue-300 whitespace-pre-wrap">{contentWithHighlight}</p>
                                {isSpeakable && <button onClick={() => handleSpeak(entry.content)} className="absolute -right-8 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"><FaVolumeUp /></button>}
                            </div>
                        );

                    case 'player-action':
                    case 'player-dialogue':
                        return (
                            <div key={entry.id} style={animationStyle} className="group relative flex justify-end ml-10 sm:ml-20 animate-fade-in">
                                <div className="bg-[var(--player-bubble-bg-color)] p-3 rounded-xl rounded-br-none">
                                    <p className={`text-lg leading-relaxed ${entry.type === 'player-action' ? 'text-lime-300 italic' : 'text-cyan-200'}`}>
                                        {contentWithHighlight}
                                    </p>
                                </div>
                                 {isSpeakable && <button onClick={() => handleSpeak(entry.content)} className="absolute -left-8 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"><FaVolumeUp /></button>}
                            </div>
                        );
                    
                    case 'dialogue':
                    case 'action-result':
                    case 'combat':
                    default:
                        return (
                            <div key={entry.id} style={animationStyle} className="group relative flex justify-start mr-10 sm:mr-20 animate-fade-in">
                                <div className="bg-[var(--npc-bubble-bg-color)] p-3 rounded-xl rounded-bl-none">
                                    <p className="text-amber-200 text-lg leading-relaxed font-bold">{contentWithHighlight}</p>
                                </div>
                                {isSpeakable && <button onClick={() => handleSpeak(entry.content)} className="absolute -right-8 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"><FaVolumeUp /></button>}
                            </div>
                        );
                }
            })}
            <div ref={endOfMessagesRef} />
        </div>
    );
};

export default memo(StoryLog);