import { GiAbstract050, GiCauldron, GiSprout, GiTreasureMap } from 'react-icons/gi';

export const CAVE_FACILITIES_CONFIG = [
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
