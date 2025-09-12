import React from 'react';
import type { Location, PlayerCharacter } from '../types';
import MapNode from './MapNode';

interface MapViewProps {
    discoveredLocations: Location[];
    playerCharacter: PlayerCharacter;
    onTravel: (destinationId: string) => void;
}

const MapView: React.FC<MapViewProps> = ({ discoveredLocations, playerCharacter, onTravel }) => {
    // Determine map boundaries to scale and position nodes
    const allCoords = discoveredLocations.map(l => l.coordinates);
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
            </div>
        </div>
    );
};

export default MapView;
