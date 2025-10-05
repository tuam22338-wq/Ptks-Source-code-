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
    {
        id: 'douluo',
        name: 'Hồn Sư (Đấu La)',
        description: 'Hệ thống tu luyện dựa trên Hồn Lực và hấp thụ Hồn Hoàn từ Hồn Thú.',
        system: {
            id: 'douluo_main',
            name: 'Hệ Thống Hồn Sư',
            description: 'Trở thành Hồn Sư, săn bắt Hồn Thú, hấp thụ Hồn Hoàn để nhận Hồn Kỹ và trở nên mạnh mẽ.',
            resourceName: 'Hồn Lực',
            resourceUnit: 'cấp',
            realms: [
                { id: 'hon_si', name: 'Hồn Sĩ', stages: Array.from({ length: 10 }, (_, i) => ({ id: `hs_${i + 1}`, name: `Cấp ${i + 1}`, qiRequired: (i + 1), bonuses: [] })) },
                { id: 'hon_su', name: 'Hồn Sư', stages: Array.from({ length: 10 }, (_, i) => ({ id: `hsu_${i + 11}`, name: `Cấp ${i + 11}`, qiRequired: (i + 11), bonuses: [] })) },
                { id: 'dai_hon_su', name: 'Đại Hồn Sư', stages: Array.from({ length: 10 }, (_, i) => ({ id: `dhs_${i + 21}`, name: `Cấp ${i + 21}`, qiRequired: (i + 21), bonuses: [] })) },
                { id: 'hon_ton', name: 'Hồn Tông', stages: Array.from({ length: 10 }, (_, i) => ({ id: `ht_${i + 31}`, name: `Cấp ${i + 31}`, qiRequired: (i + 31), bonuses: [] })) },
                { id: 'hon_vuong', name: 'Hồn Vương', stages: Array.from({ length: 10 }, (_, i) => ({ id: `hv_${i + 41}`, name: `Cấp ${i + 41}`, qiRequired: (i + 41), bonuses: [] })) },
                { id: 'hon_de', name: 'Hồn Đế', stages: Array.from({ length: 10 }, (_, i) => ({ id: `hd_${i + 51}`, name: `Cấp ${i + 51}`, qiRequired: (i + 51), bonuses: [] })) },
                { id: 'hon_thanh', name: 'Hồn Thánh', stages: Array.from({ length: 10 }, (_, i) => ({ id: `hth_${i + 61}`, name: `Cấp ${i + 61}`, qiRequired: (i + 61), bonuses: [] })) },
                { id: 'hon_dau_la', name: 'Hồn Đấu La', stages: Array.from({ length: 10 }, (_, i) => ({ id: `hdl_${i + 71}`, name: `Cấp ${i + 71}`, qiRequired: (i + 71), bonuses: [] })) },
                { id: 'phong_hao_dau_la', name: 'Phong Hào Đấu La', stages: Array.from({ length: 10 }, (_, i) => ({ id: `phdl_${i + 81}`, name: `Cấp ${i + 81}`, qiRequired: (i + 81), bonuses: [] })) },
                { id: 'cuc_han_dau_la', name: 'Cực Hạn Đấu La', stages: [{ id: `chdl_99`, name: `Cấp 99`, qiRequired: 99, bonuses: [] }] },
            ]
        }
    },
    {
        id: 'body_cultivation',
        name: 'Luyện Thể Cực Hạn',
        description: 'Con đường tu luyện thuần túy nhục thân, không dựa vào linh khí, chỉ tin vào sức mạnh cơ bắp.',
        system: {
            id: 'body_main',
            name: 'Hệ Thống Luyện Thể',
            description: 'Rèn luyện thân thể đến cực hạn, đạt tới cảnh giới vạn kiếp bất diệt, nhục thân thành thánh.',
            resourceName: 'Khí Huyết',
            resourceUnit: 'vòng',
            realms: [
                { id: 'luyen_bi', name: 'Luyện Bì', stages: [{ id: 'lb_1', name: 'Đại Thành', qiRequired: 1000, bonuses: [] }] },
                { id: 'luyen_nhuc', name: 'Luyện Nhục', stages: [{ id: 'ln_1', name: 'Đại Thành', qiRequired: 5000, bonuses: [] }] },
                { id: 'luyen_can', name: 'Luyện Cân', stages: [{ id: 'lc_1', name: 'Đại Thành', qiRequired: 20000, bonuses: [] }] },
                { id: 'luyen_cot', name: 'Luyện Cốt', stages: [{ id: 'lcot_1', name: 'Đại Thành', qiRequired: 100000, bonuses: [] }] },
                { id: 'luyen_tuy', name: 'Luyện Tủy', stages: [{ id: 'lt_1', name: 'Đại Thành', qiRequired: 500000, bonuses: [] }] },
                { id: 'hoan_huyet', name: 'Hoán Huyết', stages: [{ id: 'hh_1', name: 'Đại Thành', qiRequired: 2000000, bonuses: [] }] },
                { id: 'thong_khieu', name: 'Thông Khiếu', stages: [{ id: 'tk_1', name: 'Đại Thành', qiRequired: 10000000, bonuses: [] }] },
                { id: 'kim_than', name: 'Kim Thân', stages: [{ id: 'kth_1', name: 'Đại Thành', qiRequired: 50000000, bonuses: [] }] },
                { id: 'bat_diet', name: 'Bất Diệt Thể', stages: [{ id: 'bd_1', name: 'Đại Thành', qiRequired: 200000000, bonuses: [] }] },
            ]
        }
    },
    {
        id: 'mage',
        name: 'Ma Pháp Sư (Fantasy)',
        description: 'Hệ thống sức mạnh ma pháp phương Tây, từ học徒 đến pháp sư thần thoại.',
        system: {
            id: 'mage_main',
            name: 'Hệ Thống Ma Pháp',
            description: 'Nghiên cứu bản chất của vạn vật, điều khiển năng lượng ma thuật để tạo ra những phép màu vĩ đại.',
            resourceName: 'Mana',
            resourceUnit: 'điểm',
            realms: [
                { id: 'apprentice', name: 'Học徒 Ma Pháp', stages: [{ id: 'app_1', name: 'Sơ cấp', qiRequired: 100, bonuses: [] }, { id: 'app_2', name: 'Trung cấp', qiRequired: 500, bonuses: [] }, { id: 'app_3', name: 'Cao cấp', qiRequired: 1000, bonuses: [] }] },
                { id: 'adept', name: 'Chuyên Gia Ma Pháp', stages: [{ id: 'ad_1', name: 'Bậc 1', qiRequired: 5000, bonuses: [] }, { id: 'ad_2', name: 'Bậc 2', qiRequired: 10000, bonuses: [] }] },
                { id: 'master', name: 'Bậc Thầy Ma Pháp', stages: [{ id: 'mas_1', name: 'Bậc 1', qiRequired: 50000, bonuses: [] }, { id: 'mas_2', name: 'Bậc 2', qiRequired: 100000, bonuses: [] }] },
                { id: 'archmage', name: 'Đại Pháp Sư', stages: [{ id: 'arch_1', name: 'Bậc 1', qiRequired: 500000, bonuses: [] }] },
                { id: 'saint', name: 'Thánh Pháp Sư', stages: [{ id: 'saint_1', name: 'Thánh Vực', qiRequired: 2000000, bonuses: [] }] },
                { id: 'mythic', name: 'Pháp Sư Thần Thoại', stages: [{ id: 'myth_1', name: 'Thần Thoại', qiRequired: 10000000, bonuses: [] }] },
            ]
        }
    },
    {
        id: 'mecha',
        name: 'Cơ Giáp Sư (Sci-fi)',
        description: 'Cấp bậc phi công và sức mạnh cơ giáp trong thế giới khoa huyễn.',
        system: {
            id: 'mecha_main',
            name: 'Hệ Thống Cơ Giáp',
            description: 'Điều khiển những cỗ máy chiến tranh khổng lồ, trở thành át chủ bài trên chiến trường tương lai.',
            resourceName: 'Tỷ Lệ Đồng Bộ',
            resourceUnit: '%',
            realms: [
                { id: 'rank_f', name: 'Hạng F', stages: [{ id: 'f_1', name: 'Tân Binh', qiRequired: 10, bonuses: [] }] },
                { id: 'rank_e', name: 'Hạng E', stages: [{ id: 'e_1', name: 'Binh Nhì', qiRequired: 20, bonuses: [] }] },
                { id: 'rank_d', name: 'Hạng D', stages: [{ id: 'd_1', name: 'Binh Nhất', qiRequired: 30, bonuses: [] }] },
                { id: 'rank_c', name: 'Hạng C', stages: [{ id: 'c_1', name: 'Hạ Sĩ', qiRequired: 40, bonuses: [] }] },
                { id: 'rank_b', name: 'Hạng B', stages: [{ id: 'b_1', name: 'Trung Sĩ', qiRequired: 50, bonuses: [] }] },
                { id: 'rank_a', name: 'Hạng A', stages: [{ id: 'a_1', name: 'Thượng Sĩ', qiRequired: 60, bonuses: [] }] },
                { id: 'rank_s', name: 'Hạng S', stages: [{ id: 's_1', name: 'Chuẩn Úy', qiRequired: 75, bonuses: [] }] },
                { id: 'rank_ss', name: 'Hạng SS', stages: [{ id: 'ss_1', name: 'Thiếu Úy', qiRequired: 90, bonuses: [] }] },
                { id: 'rank_sss', name: 'Hạng SSS', stages: [{ id: 'sss_1', name: 'Vương Bài', qiRequired: 100, bonuses: [] }] },
            ]
        }
    },
    {
        id: 'gu_master',
        name: 'Cổ Sư (Gu Master)',
        description: 'Hệ thống tu luyện độc đáo dựa trên việc luyện và sử dụng Cổ Trùng.',
        system: {
            id: 'gu_main',
            name: 'Hệ Thống Cổ Sư',
            description: 'Thu phục và luyện hóa Cổ trùng trong trời đất, dùng chúng làm vũ khí, công cụ để bước lên con đường vô địch.',
            resourceName: 'Chân Nguyên',
            resourceUnit: 'viên',
            realms: [
                { id: 'rank_1', name: 'Nhất Chuyển', stages: [{ id: 'r1_1', name: 'Sơ Giai', qiRequired: 100, bonuses: [] }, { id: 'r1_2', name: 'Trung Giai', qiRequired: 300, bonuses: [] }, { id: 'r1_3', name: 'Thượng Giai', qiRequired: 600, bonuses: [] }, { id: 'r1_4', name: 'Đỉnh Phong', qiRequired: 1000, bonuses: [] }] },
                { id: 'rank_2', name: 'Nhị Chuyển', stages: [{ id: 'r2_1', name: 'Sơ Giai', qiRequired: 2000, bonuses: [] }, { id: 'r2_4', name: 'Đỉnh Phong', qiRequired: 5000, bonuses: [] }] },
                { id: 'rank_3', name: 'Tam Chuyển', stages: [{ id: 'r3_1', name: 'Sơ Giai', qiRequired: 10000, bonuses: [] }, { id: 'r3_4', name: 'Đỉnh Phong', qiRequired: 30000, bonuses: [] }] },
                { id: 'rank_4', name: 'Tứ Chuyển', stages: [{ id: 'r4_1', name: 'Sơ Giai', qiRequired: 80000, bonuses: [] }, { id: 'r4_4', name: 'Đỉnh Phong', qiRequired: 200000, bonuses: [] }] },
                { id: 'rank_5', name: 'Ngũ Chuyển', stages: [{ id: 'r5_1', name: 'Sơ Giai', qiRequired: 500000, bonuses: [] }, { id: 'r5_4', name: 'Đỉnh Phong', qiRequired: 1000000, bonuses: [] }] },
                { id: 'rank_6', name: 'Lục Chuyển', stages: [{ id: 'r6_1', name: 'Cổ Tiên', qiRequired: 5000000, bonuses: [] }] },
                { id: 'rank_7', name: 'Thất Chuyển', stages: [{ id: 'r7_1', name: 'Cổ Tiên', qiRequired: 20000000, bonuses: [] }] },
                { id: 'rank_8', name: 'Bát Chuyển', stages: [{ id: 'r8_1', name: 'Cổ Tiên', qiRequired: 100000000, bonuses: [] }] },
                { id: 'rank_9', name: 'Cửu Chuyển', stages: [{ id: 'r9_1', name: 'Tôn Giả', qiRequired: 500000000, bonuses: [] }] },
            ]
        }
    }
];