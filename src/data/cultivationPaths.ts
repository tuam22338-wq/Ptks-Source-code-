import type { CultivationPath } from '../types';

export const CULTIVATION_PATHS: CultivationPath[] = [
    {
        id: 'path_sword_immortal',
        name: 'Kiếm Tiên Chi Lộ',
        description: 'Tập trung vào việc tu luyện kiếm pháp, lấy công làm thủ, một kiếm phá vạn pháp.',
        requiredRealmId: 'truc_co', // Offered when entering Foundation Establishment
        bonuses: [
            { attribute: 'Lực Lượng', value: 10 },
            { attribute: 'Linh Lực Sát Thương', value: 15 },
        ]
    },
    {
        id: 'path_alchemy_master',
        name: 'Đan Đạo Tông Sư',
        description: 'Chuyên tâm vào việc luyện đan, cứu người giúp đời hoặc luyện chế độc dược hại người.',
        requiredRealmId: 'truc_co',
        bonuses: [
            { attribute: 'Ngự Khí Thuật', value: 20 },
            { attribute: 'Nguyên Thần', value: 10 },
        ]
    }
];
