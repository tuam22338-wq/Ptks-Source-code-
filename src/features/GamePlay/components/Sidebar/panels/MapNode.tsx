import React from 'react';
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
            <div className={`relative w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all duration-300 cursor-pointer
                ${isCurrent 
                    ? 'bg-amber-400/30 border-amber-400 animate-pulse' 
                    : 'bg-gray-800/80 border-gray-500 hover:border-amber-300 hover:scale-125'
                }`}
             onClick={handleTravelClick}
             title={location.name}
            >
                <Icon className={`w-5 h-5 ${isCurrent ? 'text-amber-300' : 'text-gray-300 group-hover:text-amber-200'}`} />
                 {isCurrent && <div className="absolute inset-0 rounded-full border-2 border-amber-400 animate-ping"></div>}
            </div>
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded-md bg-black/70 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`}>
                {location.name}
            </div>
        </div>
    );
};

export default MapNode;