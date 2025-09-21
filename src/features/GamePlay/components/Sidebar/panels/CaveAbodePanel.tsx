import React, { memo } from 'react';
import type { PlayerCharacter, Location } from '../../../../../types';
import { GiMountainCave, GiSprout, GiCauldron, GiAbstract050, GiTreasureMap } from 'react-icons/gi';
import { CAVE_FACILITIES_CONFIG } from '../../../../../constants';

interface CaveAbodePanelProps {
    playerCharacter: PlayerCharacter;
    currentLocation: Location;
}

const CaveAbodePanel: React.FC<CaveAbodePanelProps> = ({ playerCharacter, currentLocation }) => {
    const { caveAbode, currencies } = playerCharacter;
    const canInteract = currentLocation.id === caveAbode.locationId;

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
             <div>
                <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                    <GiMountainCave className="text-amber-300" /> {caveAbode.name} (Cấp {caveAbode.level})
                </h3>
                 {!canInteract && (
                    <div className="p-3 text-center bg-yellow-900/30 border border-yellow-600/50 rounded-lg text-yellow-300 text-sm mb-4">
                        Bạn phải trở về động phủ để quản lý.
                    </div>
                 )}
                 <div className="p-3 text-center bg-blue-900/20 border border-blue-600/50 rounded-lg text-blue-200 text-sm mb-4">
                    Dùng lệnh "nâng cấp [tên công trình]" để cải thiện động phủ của bạn.
                 </div>
                <div className="space-y-3">
                    {CAVE_FACILITIES_CONFIG.map(facility => {
                        const currentLevel = caveAbode[facility.id as keyof typeof caveAbode] as number;
                        const cost = facility.upgradeCost(currentLevel);
                        const hasEnoughCurrency = (currencies['Linh thạch hạ phẩm'] || 0) >= cost;
                        return (
                            <div key={facility.id} className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <facility.icon className="w-6 h-6 text-amber-300" />
                                        <h4 className="font-bold text-gray-200">{facility.name}</h4>
                                    </div>
                                    <span className="text-sm font-semibold bg-gray-700/80 px-2 py-0.5 rounded-full text-gray-300">Cấp {currentLevel}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-2">{facility.description(currentLevel)}</p>
                                <div className="mt-3 p-2 bg-black/30 rounded text-center text-sm">
                                    <span className="text-gray-400">Chi phí nâng cấp: </span>
                                    <span className={hasEnoughCurrency ? 'text-green-400' : 'text-red-400'}>
                                        {cost.toLocaleString()} Linh Thạch
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default memo(CaveAbodePanel);