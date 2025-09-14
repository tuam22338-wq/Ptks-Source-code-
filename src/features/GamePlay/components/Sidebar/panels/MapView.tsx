import React, { memo } from 'react';
import type { Location, PlayerCharacter, NPC } from '../../../../../types';
import MapNode from './MapNode';
import NpcNode from './NpcNode';

interface MapViewProps {
    discoveredLocations: Location[];
    playerCharacter: PlayerCharacter;
    onTravel: (destinationId: string) => void;
    allNpcs: NPC[];
}

const MapView: React.FC<MapViewProps> = ({ discoveredLocations, playerCharacter, onTravel, allNpcs }) => {
    // Determine map boundaries to scale and position nodes
    const allCoords = discoveredLocations.map(l => l.coordinates);
    if (allCoords.length === 0) {
        return <div className="text-center text-gray-500">Chưa khám phá được địa điểm nào.</div>;
    }
    const minX = Math.min(...allCoords.map(c => c.x));
    const maxX = Math.max(...allCoords.map(c => c.x));
    const minY = Math.min(...allCoords.map(c => c.y));
    const maxY = Math.max(...allCoords.map(c => c.y));

    const mapWidth = maxX - minX + 4; // Add padding
    const mapHeight = maxY - minY + 4;

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
             <h3 className="text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                Cửu Châu Địa Đồ
            </h3>
            <div 
                className="relative w-full aspect-square bg-black/20 rounded-lg border-2 border-gray-700/60 overflow-hidden"
                style={{
                    backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-map.png")',
                    backgroundColor: 'rgba(100, 80, 50, 0.1)'
                }}
            >
                <svg className="absolute inset-0 w-full h-full">
                    {/* Render connection lines */}
                    {discoveredLocations.map(loc =>
                        loc.neighbors.map(neighborId => {
                            const neighbor = discoveredLocations.find(n => n.id === neighborId);
                            if (!neighbor || loc.id > neighbor.id) return null; // Draw each line once

                            const x1 = ((loc.coordinates.x - minX + 2) / mapWidth) * 100;
                            const y1 = ((loc.coordinates.y - minY + 2) / mapHeight) * 100;
                            const x2 = ((neighbor.coordinates.x - minX + 2) / mapWidth) * 100;
                            const y2 = ((neighbor.coordinates.y - minY + 2) / mapHeight) * 100;
                            
                            return (
                                <line 
                                    key={`${loc.id}-${neighbor.id}`} 
                                    x1={`${x1}%`} y1={`${y1}%`} 
                                    x2={`${x2}%`} y2={`${y2}%`} 
                                    stroke="rgba(245, 158, 11, 0.2)" 
                                    strokeWidth="2"
                                    strokeDasharray="4 4"
                                />
                            );
                        })
                    )}
                </svg>

                {/* Render location nodes */}
                {discoveredLocations.map(loc => {
                    const left = ((loc.coordinates.x - minX + 2) / mapWidth) * 100;
                    const top = ((loc.coordinates.y - minY + 2) / mapHeight) * 100;
                    
                    return (
                        <MapNode 
                            key={loc.id}
                            location={loc}
                            isCurrent={loc.id === playerCharacter.currentLocationId}
                            onTravel={onTravel}
                            style={{ top: `${top}%`, left: `${left}%` }}
                        />
                    );
                })}

                {/* Render NPC nodes */}
                {allNpcs.map(npc => {
                    const loc = discoveredLocations.find(l => l.id === npc.locationId);
                    if (!loc) return null; // Don't render if location isn't discovered

                    // small random offset to avoid perfect stacking
                    const offsetX = (Math.random() - 0.5) * 2.5; 
                    const offsetY = (Math.random() - 0.5) * 2.5;
                    const left = ((loc.coordinates.x - minX + 2 + offsetX) / mapWidth) * 100;
                    const top = ((loc.coordinates.y - minY + 2 + offsetY) / mapHeight) * 100;
                    
                    return (
                        <NpcNode 
                            key={npc.id}
                            npc={npc}
                            style={{ top: `${top}%`, left: `${left}%` }}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default memo(MapView);
