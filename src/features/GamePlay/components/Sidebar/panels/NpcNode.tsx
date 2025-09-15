import React, { memo } from 'react';
import type { NPC } from '../../../../../types';
import { FaUser } from 'react-icons/fa';

interface NpcNodeProps {
    npc: NPC;
    style: React.CSSProperties;
}

const NpcNode: React.FC<NpcNodeProps> = ({ npc, style }) => {
    return (
        <div 
            className="absolute -translate-x-1/2 -translate-y-1/2 group z-10"
            style={style}
            title={npc.identity.name}
        >
            <div className="w-4 h-4 flex items-center justify-center rounded-full bg-purple-600/80 border border-purple-300/80 animate-pulse">
                <FaUser className="w-2 h-2 text-purple-100" />
            </div>
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded-sm bg-black/70 text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {npc.identity.name}
            </div>
        </div>
    );
};

export default memo(NpcNode);