import type { AlchemyRecipe } from '../types';

export const ALCHEMY_RECIPES: AlchemyRecipe[] = [
    {
        id: 'recipe_hoi_khi_dan_ha_pham',
        name: 'Hồi Khí Đan - Hạ Phẩm Đan Phương',
        description: 'Ghi lại phương pháp luyện chế Hồi Khí Đan Hạ Phẩm, giúp hồi phục linh lực.',
        ingredients: [
            { name: 'Linh Tâm Thảo', quantity: 3 },
            { name: 'Thanh Diệp Hoa', quantity: 1 },
        ],
        result: { name: 'Hồi Khí Đan', quantity: 1 },
        requiredAttribute: { name: 'Ngự Khí Thuật', value: 15 },
        icon: '💊',
        qualityCurve: [
            { threshold: 50, quality: 'Linh Phẩm' },
            { threshold: 25, quality: 'Phàm Phẩm' },
        ]
    }
];
