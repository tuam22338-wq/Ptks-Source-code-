import React, { memo } from 'react';
import type { Location, Rumor, DynamicWorldEvent } from '../../../../../types';
import { FaMapMarkerAlt, FaCommentDots, FaExclamationTriangle } from 'react-icons/fa';

interface WorldPanelProps {
    currentLocation: Location;
    rumors: Rumor[];
    dynamicEvents?: DynamicWorldEvent[];
}

const WorldPanel: React.FC<WorldPanelProps> = ({ currentLocation, rumors, dynamicEvents }) => {
    
    const rumorsAtLocation = rumors.filter(r => r.locationId === currentLocation.id);
    const eventsAtLocation = dynamicEvents?.filter(e => e.affectedLocationIds.includes(currentLocation.id));

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
                </div>
            </div>

            {/* Dynamic Events */}
            {eventsAtLocation && eventsAtLocation.length > 0 && (
                <div>
                    <h3 className="flex items-center gap-2 text-lg text-red-400 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                        <FaExclamationTriangle /> Sự Kiện
                    </h3>
                    <div className="space-y-2">
                        {eventsAtLocation.map(event => (
                            <div key={event.id} className="bg-red-900/20 p-3 rounded-lg border border-dashed border-red-500/50">
                                <h4 className="font-bold text-red-300">{event.title}</h4>
                                <p className="text-sm text-gray-300 italic">"{event.description}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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
             <div className="p-3 text-center bg-blue-900/20 border border-blue-600/50 rounded-lg text-blue-200 text-sm">
                Sử dụng ô "Hành Động" để tương tác với thế giới. Thử gõ "nhìn xung quanh", "di chuyển đến [tên địa điểm]", hoặc "nói chuyện với [tên người]".
            </div>
        </div>
    );
};

export default memo(WorldPanel);