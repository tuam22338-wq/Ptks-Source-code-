import type { NamedRealmSystem } from "../types";

export const REALM_TEMPLATES: { id: string; name: string; description: string; system: NamedRealmSystem }[] = [
    {
        id: 'xianxia_default',
        name: 'Huyền Huyễn Tu Chân',
        description: 'Hệ thống tu luyện kinh điển từ Phàm Nhân đến Thánh Nhân.',
        system: {
            id: 'xianxia_main',
            name: 'Hệ Thống Tu Tiên',
            description: 'Con đường tu luyện để trường sinh bất tử, từ một凡人 yếu đuối đến tồn tại tối cao.',
            resourceName: 'Linh Khí',
            resourceUnit: 'điểm',
            realms: [
                { id: 'luyen_khi', name: 'Luyện Khí', bonuses: [], stages: [{ id: 'lk_1', name: 'Tầng 1', qiRequired: 100, bonuses: [] }, { id: 'lk_9', name: 'Tầng 9', qiRequired: 50000, bonuses: [] }] },
                { id: 'truc_co', name: 'Trúc Cơ', bonuses: [], stages: [{ id: 'tc_so_ky', name: 'Sơ Kỳ', qiRequired: 150000, bonuses: [] }] },
                { id: 'ket_dan', name: 'Kết Đan', bonuses: [], stages: [{ id: 'kd_so_ky', name: 'Sơ Kỳ', qiRequired: 2500000, bonuses: [] }] },
                { id: 'nguyen_anh', name: 'Nguyên Anh', bonuses: [], stages: [{ id: 'na_so_ky', name: 'Sơ Kỳ', qiRequired: 80000000, bonuses: [] }] },
                { id: 'hoa_than', name: 'Hóa Thần', bonuses: [], stages: [{ id: 'ht_so_ky', name: 'Sơ Kỳ', qiRequired: 2e9, bonuses: [] }] },
            ]
        }
    },
    {
        id: 'wuxia',
        name: 'Võ Hiệp Giang Hồ',
        description: 'Hệ thống tu luyện nội công và ngoại công trong thế giới võ lâm.',
        system: {
            id: 'wuxia_main',
            name: 'Hệ Thống Võ Học',
            description: 'Con đường trở thành đại hiệp, từ một kẻ vô danh tiểu tốt đến võ lâm minh chủ.',
            resourceName: 'Nội Lực',
            resourceUnit: 'năm',
            realms: [
                { id: 'tam_luu', name: 'Tam Lưu', bonuses: [], stages: [{ id: 'tl_1', name: 'Sơ Nhập', qiRequired: 10, bonuses: [] }] },
                { id: 'nhi_luu', name: 'Nhị Lưu', bonuses: [], stages: [{ id: 'nl_1', name: 'Hạ Cấp', qiRequired: 50, bonuses: [] }] },
                { id: 'nhat_luu', name: 'Nhất Lưu', bonuses: [], stages: [{ id: 'il_1', name: 'Thượng Cấp', qiRequired: 200, bonuses: [] }] },
                { id: 'tuyet_dinh', name: 'Tuyệt Đỉnh Cao Thủ', bonuses: [], stages: [{ id: 'td_1', name: 'Đăng Phong', qiRequired: 1000, bonuses: [] }] },
                { id: 'vo_lam_than_thoai', name: 'Võ Lâm Thần Thoại', bonuses: [], stages: [{ id: 'vltt_1', name: 'Vô Cực', qiRequired: 5000, bonuses: [] }] },
            ]
        }
    },
    {
        id: 'sci_fi',
        name: 'Khoa Huyễn Viễn Tưởng',
        description: 'Hệ thống cấp bậc sức mạnh dựa trên công nghệ, cấy ghép và năng lượng.',
        system: {
            id: 'sci_fi_main',
            name: 'Hệ Thống Năng Lượng',
            description: 'Con đường tiến hóa trong một thế giới tương lai, từ người thường đến thực thể bán thần.',
            resourceName: 'Năng Lượng Lõi',
            resourceUnit: 'Joule',
            realms: [
                { id: 'cap_e', name: 'Cấp E', description: 'Người thường hoặc cấy ghép cơ bản.', bonuses: [], stages: [{ id: 'e_1', name: 'Bậc 1', qiRequired: 1000, bonuses: [] }] },
                { id: 'cap_d', name: 'Cấp D', description: 'Chiến binh đường phố được tăng cường.', bonuses: [], stages: [{ id: 'd_1', name: 'Bậc 1', qiRequired: 10000, bonuses: [] }] },
                { id: 'cap_c', name: 'Cấp C', description: 'Lính đánh thuê chuyên nghiệp, cấy ghép cao cấp.', bonuses: [], stages: [{ id: 'c_1', name: 'Bậc 1', qiRequired: 100000, bonuses: [] }] },
                { id: 'cap_b', name: 'Cấp B', description: 'Đặc vụ cấp cao, sở hữu công nghệ quân sự.', bonuses: [], stages: [{ id: 'b_1', name: 'Bậc 1', qiRequired: 1000000, bonuses: [] }] },
                { id: 'cap_a', name: 'Cấp A', description: 'Siêu chiến binh, gần như một vũ khí sống.', bonuses: [], stages: [{ id: 'a_1', name: 'Bậc 1', qiRequired: 10000000, bonuses: [] }] },
                { id: 'cap_s', name: 'Cấp S', description: 'Huyền thoại sống, sức mạnh có thể thay đổi cục diện chiến tranh.', bonuses: [], stages: [{ id: 's_1', name: 'Bậc 1', qiRequired: 100000000, bonuses: [] }] },
            ]
        }
    },
];
