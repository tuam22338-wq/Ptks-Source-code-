import type { Shop } from '../types';

export const SHOPS: Shop[] = [
    {
        id: 'van_bao_lau',
        name: 'Vạn Bảo Lâu',
        description: 'Cửa hàng pháp bảo nổi tiếng nhất Triều Ca, có bán đủ mọi thứ từ linh dược đến pháp khí.',
        inventory: [
            { 
                name: 'Hồi Khí Đan', 
                description: 'Đan dược hạ phẩm giúp hồi phục một lượng nhỏ linh lực.',
                type: 'Đan Dược',
                quality: 'Linh Phẩm',
                weight: 0.1,
                price: { currencyName: 'Linh thạch hạ phẩm', amount: 10 },
                stock: 'infinite'
            },
            {
                name: 'Linh Thạch Hạ Phẩm',
                description: 'Đơn vị tiền tệ cơ bản trong giới tu tiên, chứa một lượng nhỏ linh khí.',
                type: 'Tạp Vật',
                quality: 'Phàm Phẩm',
                weight: 0.1,
                price: { currencyName: 'Bạc', amount: 100 },
                stock: 'infinite'
            }
        ]
    }
];