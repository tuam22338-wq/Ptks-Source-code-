import React, { useMemo, memo } from 'react';
import type { PlayerCharacter } from '../../../../../types';
import { useGameUIContext } from '../../../../../contexts/GameUIContext';
import { GiWeight, GiSwapBag } from "react-icons/gi";
import { FaCoins, FaGem } from 'react-icons/fa';

interface InventoryPanelProps {
    playerCharacter: PlayerCharacter;
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({ playerCharacter }) => {
    const { openInventoryModal } = useGameUIContext();
    const { inventory, currencies } = playerCharacter;

    const currentWeight = useMemo(() => {
        return inventory.items.reduce((total, item) => total + (item.weight * item.quantity), 0);
    }, [inventory.items]);

    const weightPercentage = (currentWeight / inventory.weightCapacity) * 100;

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div>
                <h3 className="text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">Hành Trang</h3>
                <div className="space-y-3">
                    {/* Currency */}
                    <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                        <h4 className="font-semibold text-gray-400 mb-2 text-center">Tài Sản</h4>
                        <div className="flex justify-around items-center">
                            <div className="flex items-center gap-2 text-yellow-400" title="Bạc">
                                <FaCoins />
                                <span>{currencies['Bạc']?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center gap-2 text-green-400" title="Linh thạch hạ phẩm">
                                <FaGem />
                                <span>{currencies['Linh thạch hạ phẩm']?.toLocaleString() || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Weight */}
                    <div className="w-full bg-black/20 p-3 rounded-lg border border-gray-700/60 space-y-1">
                         <div className="flex justify-between items-baseline text-sm">
                             <div className="flex items-center gap-2 text-gray-300"><GiWeight /> <span>Tải trọng</span></div>
                             <span className="font-mono">{currentWeight.toFixed(1)} / {inventory.weightCapacity.toFixed(1)} kg</span>
                         </div>
                         <div className="w-full bg-black/40 rounded-full h-2 border border-gray-800">
                             <div className={`h-full rounded-full transition-all duration-300 ${weightPercentage > 90 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, weightPercentage)}%` }}></div>
                         </div>
                    </div>

                    {/* Open Inventory Button */}
                    <button onClick={openInventoryModal} className="w-full flex items-center justify-center gap-3 py-3 text-lg font-bold rounded-lg themed-button-primary">
                        <GiSwapBag /> Mở Túi Càn Khôn
                    </button>
                </div>
            </div>
        </div>
    );
};

export default memo(InventoryPanel);
