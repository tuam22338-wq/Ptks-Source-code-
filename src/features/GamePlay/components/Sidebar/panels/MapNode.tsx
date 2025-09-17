import React, { memo } from 'react';
import type { Location } from '../../../../../types';
import { GiStoneTower, GiVillage, GiMountains, GiAncientRuins, GiForest, GiBridge, GiCastle } from 'react-icons/gi';

interface MapNodeProps {
    location: Location;
    isCurrent: boolean;
    onTravel: (destinationId: string) => void;
    style: React.CSSProperties;
}

const LOCATION_ICONS: Record<Location['type'], React.ElementType> = {
    'Thành Thị': GiCastle,
    'Thôn Làng': GiVillage,
    'Hoang Dã': GiForest,
    'Sơn Mạch': GiMountains,
    'Thánh Địa': GiStoneTower,
    'Bí Cảnh': GiAncientRuins,
    'Quan Ải': GiBridge,
};

const MapNode: React.FC<MapNodeProps> = ({ location, isCurrent, onTravel, style }) => {
    const Icon = LOCATION_ICONS[location.type] || GiStoneTower;

    const handleTravelClick = () => {
        if (!isCurrent) {
            onTravel(location.id);
        }
    };

    return (
        <div 
            className="absolute -translate-x-1/2 -translate-y-1/2 group"
            style={style}
        >
            <button 
                className={`relative w-10 h-10 flex items-center justify-center rounded-full border-2 transition-all duration-300
                ${isCurrent 
                    ? 'bg-amber-400/30 border-amber-400 shadow-lg shadow-amber-500/50' 
                    : 'bg-gray-800/80 border-gray-500 hover:border-amber-300 hover:scale-125 hover:z-20 cursor-pointer'
                }`}
             onClick={handleTravelClick}
             title={location.name}
             aria-label={`Đi đến ${location.name}`}
            >
                <Icon className={`w-6 h-6 ${isCurrent ? 'text-amber-200' : 'text-gray-300 group-hover:text-amber-200'}`} />
                 {isCurrent && <div className="absolute inset-0 rounded-full border-2 border-amber-300 animate-ping"></div>}
                 {isCurrent && <div className="absolute inset-0 rounded-full text-amber-300 map-node-pulse"></div>}
            </button>
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-md bg-black/80 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30`}>
                {location.name}
            </div>
        </div>
    );
};

export default memo(MapNode);