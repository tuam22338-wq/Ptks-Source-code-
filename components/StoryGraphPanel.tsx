import React, { useState, memo } from 'react';
import type { StoryEntry } from '../types';
import { FaUser, FaBookOpen, FaCog, FaFeatherAlt } from 'react-icons/fa';

const NODE_INFO: { [key in StoryEntry['type']]: { icon: React.ElementType, color: string, label: string } } = {
    'narrative': { icon: FaBookOpen, color: 'border-gray-500', label: 'Tường thuật' },
    'dialogue': { icon: FaFeatherAlt, color: 'border-amber-500', label: 'Đối thoại' },
    'action-result': { icon: FaBookOpen, color: 'border-gray-500', label: 'Kết quả' },
    'system': { icon: FaCog, color: 'border-blue-500', label: 'Hệ thống' },
    'player-action': { icon: FaUser, color: 'border-lime-500', label: 'Hành động' },
    'player-dialogue': { icon: FaUser, color: 'border-cyan-500', label: 'Đối thoại' },
};

const StoryGraphNode: React.FC<{ entry: StoryEntry; isLast: boolean }> = ({ entry, isLast }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const info = NODE_INFO[entry.type] || NODE_INFO['narrative'];
    const Icon = info.icon;

    const summary = entry.content.length > 70 ? `${entry.content.substring(0, 70)}...` : entry.content;

    return (
        <div className="relative pl-8">
            {/* Timeline Connector */}
            {!isLast && <div className="absolute left-[10px] top-5 h-full w-0.5 bg-gray-700"></div>}
            
            {/* Node Icon */}
            <div className={`absolute left-0 top-3 w-6 h-6 rounded-full flex items-center justify-center bg-gray-800 border-2 ${info.color}`}>
                <Icon className="w-3 h-3 text-gray-300" />
            </div>

            {/* Node Content */}
            <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60 mb-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <p className="text-xs font-semibold text-gray-400">{info.label}</p>
                <p className={`text-sm mt-1 transition-all duration-300 ${isExpanded ? 'text-gray-200' : 'text-gray-400'}`}>
                    {isExpanded ? entry.content : summary}
                </p>
            </div>
        </div>
    );
};

const StoryGraphPanel: React.FC<{ storyLog: StoryEntry[] }> = ({ storyLog }) => {
    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div>
                <h3 className="text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                    Hành Trình Đồ
                </h3>
                <div className="space-y-0 max-h-[75vh] overflow-y-auto pr-2">
                    {storyLog.length > 0 ? (
                        storyLog.slice().reverse().map((entry, index) => (
                            <StoryGraphNode key={entry.id} entry={entry} isLast={index === storyLog.length - 1} />
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-4">Hành trình của bạn chưa bắt đầu.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(StoryGraphPanel);