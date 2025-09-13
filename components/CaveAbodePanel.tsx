import React from 'react';
import type { PlayerCharacter, Location } from '../types';
import { GiMountainCave, GiSprout, GiCauldron, GiAbstract050, GiTreasureMap } from 'react-icons/gi';

interface CaveAbodePanelProps {
    playerCharacter: PlayerCharacter;
    setPlayerCharacter: (updater: (pc: PlayerCharacter) => PlayerCharacter) => void;
    showNotification: (message: string) => void;
    currentLocation: Location;
}

const CAVE_FACILITIES_CONFIG = [
    {
        id: 'spiritGatheringArrayLevel',
        name: 'Tụ Linh Trận',
        icon: GiAbstract050,
        description: (level: number) => `Tăng tốc độ hấp thụ linh khí khi tu luyện. Cấp ${level + 1} sẽ tăng hiệu quả lên ${5 * (level + 1)}%.`,
        upgradeCost: (level: number) => 100 * Math.pow(2, level),
    },
    {
        id: 'spiritHerbFieldLevel',
        name: 'Linh Điền',
        icon: GiSprout,
        description: (level: number) => `Mở rộng Linh Điền, cho phép trồng các loại linh dược hiếm hơn. Cấp ${level + 1} mở khóa dược liệu cấp ${level + 1}.`,
        upgradeCost: (level: number) => 150 * Math.pow(2, level),
    },
    {
        id: 'alchemyRoomLevel',
        name: 'Luyện Đan Thất',
        icon: GiCauldron,
        description: (level: number) => `Nâng cao hiệu suất và tỉ lệ thành công khi luyện đan. Cấp ${level + 1} tăng ${5 * (level + 1)}% tỉ lệ thành công.`,
        upgradeCost: (level: number) => 120 * Math.pow(2, level),
    },
     {
        id: 'storageUpgradeLevel',
        name: 'Kho Chứa Đồ',
        icon: GiTreasureMap,
        description: (level: number) => `Mở rộng không gian kho, tăng giới hạn trọng lượng túi đồ. Cấp ${level + 1} tăng ${10 * (level + 1)}kg.`,
        upgradeCost: (level: number) => 80 * Math.pow(2, level),
    },
];

const CaveAbodePanel: React.FC<CaveAbodePanelProps> = ({ playerCharacter, setPlayerCharacter, showNotification, currentLocation }) => {
    const { caveAbode, currencies } = playerCharacter;
    const canInteract = currentLocation.id === caveAbode.locationId;

    const handleUpgrade = (facilityId: keyof typeof caveAbode, cost: number) => {
        if (!canInteract) {
            showNotification("Bạn phải ở Động Phủ mới có thể nâng cấp.");
            return;
        }

        const currencyName = 'Linh thạch hạ phẩm';
        if ((currencies[currencyName] || 0) < cost) {
            showNotification(`Không đủ ${currencyName}!`);
            return;
        }

        setPlayerCharacter(pc => {
            const currentLevel = pc.caveAbode[facilityId] as number;
            
            // Update currency
            const newCurrencies = { ...pc.currencies, [currencyName]: pc.currencies[currencyName] - cost };
            
            // Update cave abode
            const newCaveAbode = { ...pc.caveAbode, [facilityId]: currentLevel + 1 };
            
            // Apply bonus if applicable (e.g., storage)
            let newInventory = pc.inventory;
            if(facilityId === 'storageUpgradeLevel') {
                const weightIncrease = 10 * (currentLevel + 1);
                newInventory = {...pc.inventory, weightCapacity: pc.inventory.weightCapacity + weightIncrease };
            }

            return { 
                ...pc, 
                currencies: newCurrencies, 
                caveAbode: newCaveAbode,
                inventory: newInventory,
            };
        });

        const facilityName = CAVE_FACILITIES_CONFIG.find(f => f.id === facilityId)?.name || "Công trình";
        showNotification(`${facilityName} đã được nâng cấp!`);
    };

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
                <div className="space-y-3">
                    {CAVE_FACILITIES_CONFIG.map(facility => {
                        const currentLevel = caveAbode[facility.id as keyof typeof caveAbode] as number;
                        const cost = facility.upgradeCost(currentLevel);
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
                                <button 
                                    onClick={() => handleUpgrade(facility.id as keyof typeof caveAbode, cost)}
                                    disabled={!canInteract}
                                    className="w-full mt-3 p-2 text-sm font-bold bg-teal-700/80 rounded text-white hover:bg-teal-600/80 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >
                                    Nâng Cấp ({cost.toLocaleString()} Linh Thạch)
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CaveAbodePanel;