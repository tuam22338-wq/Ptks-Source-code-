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
                    <div key={location.id} className={`neumorphic-inset-box p-3 ${isCurrent ? 'ring-2 ring-[var(--primary-accent-color)]' : ''}`}>
                         <h4 className="font-bold text-lg font-title flex items-center gap-2" style={{color: 'var(--primary-accent-color)'}}>
                             {isCurrent && <FaMapPin className="text-red-500 animate-pulse" />}
                             {location.name}
                        </h4>
                        <p className="text-xs" style={{color: 'var(--text-muted-color)'}}>{location.type}</p>
                        <p className="text-sm mt-2" style={{color: 'var(--text-color)'}}>{location.description}</p>
                        {neighbors.length > 0 && (
                            <div className="mt-3 pt-2 border-t" style={{borderColor: 'var(--shadow-light)'}}>
                                <p className="text-xs" style={{color: 'var(--text-muted-color)'}}>Lối đi đến: <span style={{color: 'var(--text-color)'}}>{neighbors.join(', ')}</span></p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default memo(MapView);