import React, { memo } from 'react';
import type { Location } from '../../../../../types';
import { FaMapPin } from 'react-icons/fa';

interface MapViewProps {
    discoveredLocations: Location[];
    currentLocationId: string;
}

const MapView: React.FC<MapViewProps> = ({ discoveredLocations, currentLocationId }) => {
    return (
        <div className="space-y-3 animate-fade-in" style={{ animationDuration: '300ms' }}>
            {discoveredLocations.map(location => {
                const isCurrent = location.id === currentLocationId;
                const neighbors = location.neighbors
                    .map(id => discoveredLocations.find(l => l.id === id)?.name)
                    .filter(Boolean);
                return (
                    <div key={location.id} className={`bg-black/20 p-3 rounded-lg border-2 ${isCurrent ? 'border-amber-400' : 'border-gray-700/60'}`}>
                         <h4 className="font-bold text-lg font-title text-amber-300 flex items-center gap-2">
                             {isCurrent && <FaMapPin className="text-red-500 animate-pulse" />}
                             {location.name}
                        </h4>
                        <p className="text-xs text-gray-500">{location.type}</p>
                        <p className="text-sm text-gray-400 mt-2">{location.description}</p>
                        {neighbors.length > 0 && (
                            <div className="mt-3 pt-2 border-t border-gray-700/50">
                                <p className="text-xs text-gray-500">Lối đi đến: <span className="text-gray-400">{neighbors.join(', ')}</span></p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default memo(MapView);
