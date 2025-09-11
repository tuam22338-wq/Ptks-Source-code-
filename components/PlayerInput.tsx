import React, { useState, memo } from 'react';
import { FaPaperPlane } from 'react-icons/fa';
import { GiFootsteps } from "react-icons/gi";

interface PlayerInputProps {
    onAction: (type: 'speak' | 'action' | 'continue', text: string) => void;
    disabled: boolean;
}

type InputMode = 'speak' | 'action';

const PlayerInput: React.FC<PlayerInputProps> = ({ onAction, disabled }) => {
    const [mode, setMode] = useState<InputMode>('speak');
    const [text, setText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (text.trim()) {
            onAction(mode, text);
            setText('');
        }
    };

    return (
        <div className="flex-shrink-0 p-4 bg-black/40 backdrop-blur-sm border-t border-gray-700/50">
            <div className="flex gap-2 mb-2">
                <button 
                    onClick={() => setMode('speak')}
                    disabled={disabled}
                    className={`px-4 py-1.5 text-sm rounded-t-lg border-b-2 transition-colors ${mode === 'speak' ? 'bg-gray-700/50 border-cyan-400 text-white' : 'border-transparent text-gray-400 hover:bg-gray-800/50'} disabled:cursor-not-allowed disabled:text-gray-500`}
                >
                    Nói
                </button>
                 <button 
                    onClick={() => setMode('action')}
                    disabled={disabled}
                    className={`px-4 py-1.5 text-sm rounded-t-lg border-b-2 transition-colors ${mode === 'action' ? 'bg-gray-700/50 border-lime-400 text-white' : 'border-transparent text-gray-400 hover:bg-gray-800/50'} disabled:cursor-not-allowed disabled:text-gray-500`}
                >
                    Hành Động
                </button>
            </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSubmit(e);
                        }
                    }}
                    rows={1}
                    placeholder={disabled ? "AI đang suy nghĩ..." : (mode === 'speak' ? 'Bạn muốn nói gì?' : 'Bạn muốn làm gì?')}
                    disabled={disabled}
                    className="flex-grow bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500/50 transition-all resize-none disabled:bg-gray-800/50"
                />
                <button type="submit" className="p-4 bg-teal-700/80 text-white rounded-lg hover:bg-teal-600/80 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors" disabled={!text.trim() || disabled}>
                    <FaPaperPlane />
                </button>
                 <button type="button" onClick={() => onAction('continue', '')} className="p-4 bg-gray-700/80 text-white rounded-lg hover:bg-gray-600/80 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed" title="Tiếp tục" disabled={disabled}>
                    <GiFootsteps />
                </button>
            </form>
        </div>
    );
};

export default memo(PlayerInput);
