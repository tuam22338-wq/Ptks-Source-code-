import React, { memo } from 'react';
import type { Location, NPC, Rumor } from '../../../../../types';
import { FaMapMarkerAlt, FaUsers, FaRoute, FaCommentDots } from 'react-icons/fa';
import { GiForest } from 'react-icons/gi';

interface WorldPanelProps {
    currentLocation: Location;
    npcsAtLocation: NPC[];
    neighbors: Location[];
    rumors: Rumor[];
    onTravel: (destinationId: string) => void;
    onExplore: () => void;
    onNpcSelect: (npc: NPC) => void;
}

const WorldPanel: React.FC<WorldPanelProps> = ({ currentLocation, npcsAtLocation, neighbors, rumors, onTravel, onExplore, onNpcSelect }) => {
    
    const rumorsAtLocation = rumors.filter(r => r.locationId === currentLocation.id);

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            {/* Current Location */}
            <div>
                <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                    <FaMapMarkerAlt className="text-amber-300" /> Vị Trí Hiện Tại
                </h3>
                <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                    <h4 className="font-bold text-amber-300 font-title">{currentLocation.name}</h4>
                    <p className="text-sm text-gray-400 mt-1">{currentLocation.description}</p>
                     {currentLocation.isExplorable && (
                        <div className="mt-3">
                            <button 
                                onClick={onExplore}
                                className="w-full flex items-center justify-center gap-2 text-sm font-bold py-2 px-4 rounded transition-colors bg-green-800/70 hover:bg-green-700/70 text-white"
                            >
                                <GiForest />
                                Khám Phá
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Rumors */}
            {rumorsAtLocation.length > 0 && (
                <div>
                    <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                        <FaCommentDots className="text-yellow-300" /> Tin Đồn
                    </h3>
                    <div className="space-y-2">
                        {rumorsAtLocation.map(rumor => (
                            <div key={rumor.id} className="bg-black/20 p-3 rounded-lg border border-dashed border-gray-700/60">
                                <p className="text-sm text-gray-300 italic">"{rumor.text}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* NPCs */}
            <div>
                <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                    <FaUsers className="text-cyan-300" /> Nhân Vật
                </h3>
                <div className="space-y-3">
                    {npcsAtLocation.length > 0 ? (
                        npcsAtLocation.map(npc => (
                            <button key={npc.id} onClick={() => onNpcSelect(npc)} className="w-full text-left bg-black/20 p-3 rounded-lg border border-gray-700/60 hover:bg-gray-800/50 hover:border-cyan-400/50 transition-colors">
                                <h4 className="font-bold text-cyan-300 font-title">{npc.identity.name}</h4>
                                <p className="text-xs text-gray-400 mt-1 italic">"{npc.status}"</p>
                            </button>
                        ))
                    ) : (
                        <p className="text-center text-sm text-gray-500 py-2">Nơi này không có ai đáng chú ý.</p>
                    )}
                </div>
            </div>

            {/* Travel Options */}
            <div>
                 <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                    <FaRoute className="text-lime-300" /> Di Chuyển
                </h3>
                 <div className="space-y-2">
                     {neighbors.map(loc => (
                         <button 
                            key={loc.id} 
                            onClick={() => onTravel(loc.id)}
                            className="w-full text-left p-3 bg-gray-800/60 hover:bg-gray-700/80 border border-gray-700 rounded-md transition-colors"
                        >
                            <div className="flex justify-between items-center">
                                <p className="font-semibold text-lime-300">Đi đến {loc.name}</p>
                                <p className="text-xs text-gray-400">(1 canh giờ)</p>
                            </div>
                            <p className="text-xs text-gray-500">{loc.type}</p>
                        </button>
                     ))}
                 </div>
            </div>
        </div>
    );
};

export default memo(WorldPanel);
