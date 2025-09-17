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

    const mapWidth = Math.max(1, maxX - minX + 4); // Add padding, prevent division by zero
    const mapHeight = Math.max(1, maxY - minY + 4);

    const getPosition = (coords: {x: number, y: number}) => ({
        x: ((coords.x - minX + 2) / mapWidth) * 100,
        y: ((coords.y - minY + 2) / mapHeight) * 100,
    });


    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
             <h3 className="text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                Cửu Châu Địa Đồ
            </h3>
            <div 
                className="relative w-full aspect-square bg-[#3a322acc] rounded-lg border-2 border-gray-700/60 overflow-hidden"
                style={{
                    backgroundImage: 'url("https://www.transparenttextures.com/patterns/old-map.png")',
                }}
            >
                <svg className="absolute inset-0 w-full h-full" width="100%" height="100%">
                    <defs>
                        <filter id="terrain-blur">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
                        </filter>
                    </defs>
                    {/* Visual Terrain Background */}
                    <g filter="url(#terrain-blur)" opacity="0.15">
                        {discoveredLocations.map(loc => {
                            const pos = getPosition(loc.coordinates);
                            let color = '#5a4d3a'; // Default plains
                            if (loc.type === 'Sơn Mạch' || loc.type === 'Thánh Địa') color = '#6b5d4c'; // Brown for mountains
                            if (loc.type === 'Hoang Dã') color = '#4a5a3a'; // Green for wilds
                            if (loc.id.includes('song_') || loc.id.includes('hai_') || loc.id.includes('dam_')) color = '#3a5a6b'; // Blue for water
                            
                            return <circle key={`bg-${loc.id}`} cx={`${pos.x}%`} cy={`${pos.y}%`} r="15%" fill={color} />;
                        })}
                    </g>
                    
                    {/* Render connection lines */}
                    {discoveredLocations.map(loc =>
                        loc.neighbors.map(neighborId => {
                            const neighbor = discoveredLocations.find(n => n.id === neighborId);
                            if (!neighbor || loc.id > neighbor.id) return null; // Draw each line once

                            const p1 = getPosition(loc.coordinates);
                            const p2 = getPosition(neighbor.coordinates);
                            
                            // Simple quadratic curve for path
                            const midX = (p1.x + p2.x) / 2 + (p2.y - p1.y) * 0.1;
                            const midY = (p1.y + p2.y) / 2 + (p1.x - p2.x) * 0.1;

                            return (
                                <path 
                                    key={`${loc.id}-${neighbor.id}`} 
                                    d={`M ${p1.x},${p1.y} Q ${midX},${midY} ${p2.x},${p2.y}`}
                                    stroke="rgba(245, 158, 11, 0.2)" 
                                    strokeWidth="2"
                                    strokeDasharray="4 4"
                                    fill="none"
                                />
                            );
                        })
                    )}
                </svg>

                {/* Render location and NPC nodes on top of SVG */}
                <div className="absolute inset-0 w-full h-full">
                    {discoveredLocations.map(loc => {
                        const pos = getPosition(loc.coordinates);
                        return (
                            <MapNode 
                                key={loc.id}
                                location={loc}
                                isCurrent={loc.id === playerCharacter.currentLocationId}
                                onTravel={onTravel}
                                style={{ top: `${pos.y}%`, left: `${pos.x}%` }}
                            />
                        );
                    })}
                    {allNpcs.map(npc => {
                        const loc = discoveredLocations.find(l => l.id === npc.locationId);
                        if (!loc) return null;

                        const locPos = getPosition(loc.coordinates);
                        const offsetX = (Math.random() - 0.5) * 2.5; 
                        const offsetY = (Math.random() - 0.5) * 2.5;
                        
                        return (
                            <NpcNode 
                                key={npc.id}
                                npc={npc}
                                style={{ top: `${locPos.y + offsetY}%`, left: `${locPos.x + offsetX}%` }}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default memo(MapView);