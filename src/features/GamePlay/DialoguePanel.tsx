import React from 'react';
import type { NPC } from '../../types';

interface DialoguePanelProps {
    npc: NPC;
    onClose: () => void;
}

const DialoguePanel: React.FC<DialoguePanelProps> = ({ npc, onClose }) => {
    return (
        <div className="flex-shrink-0 p-4 bg-black/40 backdrop-blur-sm border-t border-gray-700/50">
            <div className="bg-black/20 border-2 border-purple-500/50 p-4 rounded-lg shadow-lg text-center">
                <h3 className="text-lg font-bold text-purple-300 font-title">Đối thoại với {npc.identity.name}</h3>
                <p className="text-gray-300 italic my-2">"{npc.status}"</p>
                <div className="space-y-2 mt-4">
                    <button className="w-full text-left p-3 bg-gray-800/60 hover:bg-gray-700/50 border border-gray-700 rounded-md transition-colors text-gray-200">Hỏi thăm</button>
                    <button onClick={onClose} className="w-full text-left p-3 bg-gray-800/60 hover:bg-gray-700/50 border border-gray-700 rounded-md transition-colors text-gray-200">Kết thúc</button>
                </div>
            </div>
        </div>
    );
};

export default DialoguePanel;