import type { NamedRealmSystem } from "../types";

/**
 * Kho lưu trữ các mẫu hệ thống cảnh giới/cấp bậc được thiết kế sẵn.
 * Mỗi hệ thống cung cấp một con đường phát triển sức mạnh độc đáo cho một thể loại thế giới.
 */
export const REALM_TEMPLATES: { id: string; name: string; description: string; system: NamedRealmSystem }[] = [
    // --- MẪU TU TIÊN & VÕ HIỆP ---
    {
        id: 'xianxia_default',
        name: 'Huyền Huyễn Tu Chân',
        description: 'Hệ thống tu luyện kinh điển từ Phàm Nhân đến Thánh Nhân, với nhiều tiểu cảnh giới chi tiết.',
        system: {
            id: 'xianxia_main',
            name: 'Hệ Thống Tu Tiên',
            description: 'Con đường tu luyện để trường sinh bất tử, từ một凡人 yếu đuối đến tồn tại tối cao.',
            resourceName: 'Linh Khí',
            resourceUnit: 'điểm',
            realms: [
                { id: 'luyen_khi', name: 'Luyện Khí Kỳ', description: 'Bước đầu tiên trên con đường tu tiên, dẫn khí vào cơ thể, tẩy kinh phạt tủy. Mỗi tầng sẽ gia tăng một chút sức mạnh và thể chất.', stages: Array.from({ length: 9 }, (_, i) => ({ id: `lk_${i + 1}`, name: `Tầng ${i + 1}`, qiRequired: 100 * Math.pow(2.5, i), bonuses: [] })) },
                { id: 'truc_co', name: 'Trúc Cơ Kỳ', description: 'Xây dựng nền tảng (Đạo Cơ) cho con đường tu luyện. Linh lực chuyển hóa thành chân nguyên, sức mạnh tăng vọt, tuổi thọ đạt 200 năm.', hasTribulation: true, tribulationDescription: 'Thiên Kiếp đầu tiên, sấm sét sẽ gột rửa phàm thể, xây dựng đạo cơ.', stages: [{ id: 'tc_so_ky', name: 'Sơ Kỳ', qiRequired: 150000, bonuses: [] }, { id: 'tc_trung_ky', name: 'Trung Kỳ', qiRequired: 400000, bonuses: [] }, { id: 'tc_hau_ky', name: 'Hậu Kỳ', qiRequired: 800000, bonuses: [] }] },
                { id: 'ket_dan', name: 'Kết Đan Kỳ', description: 'Ngưng tụ toàn bộ chân nguyên trong cơ thể thành một viên Kim Đan. Tu sĩ chính thức bước vào hàng ngũ cao thủ, tuổi thọ tăng lên 500 năm.', stages: [{ id: 'kd_so_ky', name: 'Sơ Kỳ', qiRequired: 2500000, bonuses: [] }, { id: 'kd_trung_ky', name: 'Trung Kỳ', qiRequired: 6000000, bonuses: [] }, { id: 'kd_hau_ky', name: 'Hậu Kỳ', qiRequired: 15000000, bonuses: [] }] },
                { id: 'nguyen_anh', name: 'Nguyên Anh Kỳ', description: 'Phá vỡ Kim Đan, thai nghén ra "Nguyên Anh". Nguyên Anh có thể xuất khiếu, ngao du thái hư. Tuổi thọ đạt 1000 năm.', hasTribulation: true, tribulationDescription: 'Phá đan thành anh là nghịch thiên chi举, sẽ phải đối mặt với Tâm Ma Kiếp.', stages: [{ id: 'na_so_ky', name: 'Sơ Kỳ', qiRequired: 80000000, bonuses: [] }, { id: 'na_trung_ky', name: 'Trung Kỳ', qiRequired: 200000000, bonuses: [] }, { id: 'na_hau_ky', name: 'Hậu Kỳ', qiRequired: 500000000, bonuses: [] }] },
                { id: 'hoa_than', name: 'Hóa Thần Kỳ', description: 'Nguyên Anh và nhục thân hoàn toàn dung hợp, lĩnh ngộ được một phần pháp tắc của thiên địa. Tu sĩ có thể di chuyển trong hư không, tuổi thọ trên 2000 năm.', stages: [{ id: 'ht_so_ky', name: 'Sơ Kỳ', qiRequired: 2e9, bonuses: [] }, { id: 'ht_trung_ky', name: 'Trung Kỳ', qiRequired: 6e9, bonuses: [] }, { id: 'ht_hau_ky', name: 'Hậu Kỳ', qiRequired: 1.5e10, bonuses: [] }] },
            ]
        }
    },
    {
        id: 'wuxia',
        name: 'Võ Hiệp Giang Hồ',
        description: 'Hệ thống tu luyện nội công và ngoại công với tên gọi đậm chất võ lâm.',
        system: {
            id: 'wuxia_main',
            name: 'Hệ Thống Võ Học',
            description: 'Con đường trở thành đại hiệp, từ một kẻ vô danh tiểu tốt đến võ lâm minh chủ.',
            resourceName: 'Nội Lực',
            resourceUnit: 'năm',
            realms: [
                { id: 'so_nhap_giang_ho', name: 'Sơ Nhập Giang Hồ', description: 'Vừa mới bước chân vào chốn giang hồ, võ công còn non nớt.', stages: [{ id: 'sngh_1', name: 'Tân Thủ', qiRequired: 10, bonuses: [] }] },
                { id: 'tieu_huu_danh_tieng', name: 'Tiểu Hữu Danh Tiếng', description: 'Đã có chút danh tiếng trong vùng, được xem là một cao thủ trẻ tuổi.', stages: [{ id: 'thdt_1', name: 'Hảo Thủ', qiRequired: 50, bonuses: [] }] },
                { id: 'danh_chan_nhat_phuong', name: 'Danh Chấn Nhất Phương', description: 'Trở thành một nhân vật có tiếng tăm, được các môn phái lớn để mắt tới.', stages: [{ id: 'dcnp_1', name: 'Cao Thủ', qiRequired: 200, bonuses: [] }] },
                { id: 'vo_lam_tong_su', name: 'Võ Lâm Tông Sư', description: 'Đạt đến cảnh giới bậc thầy, có thể khai tông lập phái, được người đời kính trọng.', stages: [{ id: 'vlts_1', name: 'Tông Sư', qiRequired: 1000, bonuses: [] }] },
                { id: 'dang_phong_tao_cuc', name: 'Đăng Phong Tạo Cực', description: 'Trở thành huyền thoại sống của võ lâm, võ công đạt đến cảnh giới siêu phàm thoát tục.', stages: [{ id: 'dptc_1', name: 'Thần Thoại', qiRequired: 5000, bonuses: [] }] },
            ]
        }
    },

    // --- CÁC MẪU ĐẶC THÙ (SPECIFIC GENRES) ---
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
                { id: 'hon_si', name: 'Hồn Sĩ', description: 'Cấp bậc khởi đầu của Hồn Sư.', stages: Array.from({ length: 10 }, (_, i) => ({ id: `hs_${i + 1}`, name: `Cấp ${i + 1}`, qiRequired: (i + 1), bonuses: [] })) },
                { id: 'hon_su', name: 'Hồn Sư', description: 'Chính thức trở thành Hồn Sư, có thể hấp thụ Hồn Hoàn đầu tiên.', stages: Array.from({ length: 10 }, (_, i) => ({ id: `hsu_${i + 11}`, name: `Cấp ${i + 11}`, qiRequired: (i + 11), bonuses: [] })) },
                { id: 'dai_hon_su', name: 'Đại Hồn Sư', description: 'Hồn Sư đã có kinh nghiệm và sức mạnh nhất định.', stages: Array.from({ length: 10 }, (_, i) => ({ id: `dhs_${i + 21}`, name: `Cấp ${i + 21}`, qiRequired: (i + 21), bonuses: [] })) },
                { id: 'hon_ton', name: 'Hồn Tông', description: 'Bước vào hàng ngũ cao thủ, có thể hấp thụ Hồn Hoàn thứ ba.', stages: Array.from({ length: 10 }, (_, i) => ({ id: `ht_${i + 31}`, name: `Cấp ${i + 31}`, qiRequired: (i + 31), bonuses: [] })) },
                { id: 'hon_vuong', name: 'Hồn Vương', description: 'Một cường giả thực thụ trong thế giới Hồn Sư.', stages: Array.from({ length: 10 }, (_, i) => ({ id: `hv_${i + 41}`, name: `Cấp ${i + 41}`, qiRequired: (i + 41), bonuses: [] })) },
                { id: 'hon_de', name: 'Hồn Đế', description: 'Đạt đến đỉnh cao sức mạnh, có thể làm bá chủ một phương.', stages: Array.from({ length: 10 }, (_, i) => ({ id: `hd_${i + 51}`, name: `Cấp ${i + 51}`, qiRequired: (i + 51), bonuses: [] })) },
                { id: 'hon_thanh', name: 'Hồn Thánh', description: 'Những tồn tại hiếm có, sở hữu Võ Hồn Chân Thân.', stages: Array.from({ length: 10 }, (_, i) => ({ id: `hth_${i + 61}`, name: `Cấp ${i + 61}`, qiRequired: (i + 61), bonuses: [] })) },
                { id: 'hon_dau_la', name: 'Hồn Đấu La', description: 'Cường giả cấp bậc trưởng lão trong các tông môn hàng đầu.', stages: Array.from({ length: 10 }, (_, i) => ({ id: `hdl_${i + 71}`, name: `Cấp ${i + 71}`, qiRequired: (i + 71), bonuses: [] })) },
                { id: 'phong_hao_dau_la', name: 'Phong Hào Đấu La', description: 'Đỉnh cao của thế giới, mỗi người đều có một danh hiệu độc nhất.', stages: Array.from({ length: 10 }, (_, i) => ({ id: `phdl_${i + 81}`, name: `Cấp ${i + 81}`, qiRequired: (i + 81), bonuses: [] })) },
                { id: 'cuc_han_dau_la', name: 'Cực Hạn Đấu La', description: 'Những tồn tại đứng trên đỉnh thế giới, gần với thần nhất.', stages: [{ id: `chdl_99`, name: `Cấp 99`, qiRequired: 99, bonuses: [] }] },
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
            resourceUnit: 'giọt',
            realms: [
                { id: 'rank_1', name: 'Nhất Chuyển', description: 'Bắt đầu con đường Cổ sư, mở ra không khiếu.', stages: [{ id: 'r1_1', name: 'Sơ Giai', qiRequired: 100, bonuses: [] }, { id: 'r1_4', name: 'Đỉnh Phong', qiRequired: 1000, bonuses: [] }] },
                { id: 'rank_2', name: 'Nhị Chuyển', description: 'Chân nguyên từ lục thanh chuyển thành xích hồng.', stages: [{ id: 'r2_1', name: 'Sơ Giai', qiRequired: 2000, bonuses: [] }, { id: 'r2_4', name: 'Đỉnh Phong', qiRequired: 5000, bonuses: [] }] },
                { id: 'rank_3', name: 'Tam Chuyển', description: 'Chân nguyên hóa thành bạch ngân, có thể thôi động Cổ tam chuyển.', stages: [{ id: 'r3_1', name: 'Sơ Giai', qiRequired: 10000, bonuses: [] }, { id: 'r3_4', name: 'Đỉnh Phong', qiRequired: 30000, bonuses: [] }] },
                { id: 'rank_4', name: 'Tứ Chuyển', description: 'Chân nguyên hoàng kim, trở thành trưởng lão của gia tộc.', stages: [{ id: 'r4_1', name: 'Sơ Giai', qiRequired: 80000, bonuses: [] }, { id: 'r4_4', name: 'Đỉnh Phong', qiRequired: 200000, bonuses: [] }] },
                { id: 'rank_5', name: 'Ngũ Chuyển', description: 'Chân nguyên tử tinh, là bá chủ một phương ở phàm thế.', stages: [{ id: 'r5_1', name: 'Sơ Giai', qiRequired: 500000, bonuses: [] }, { id: 'r5_4', name: 'Đỉnh Phong', qiRequired: 1000000, bonuses: [] }] },
                { id: 'rank_6', name: 'Lục Chuyển', description: 'Thoát ly phàm tục, trở thành Cổ Tiên bất tử.', stages: [{ id: 'r6_1', name: 'Cổ Tiên', qiRequired: 5000000, bonuses: [] }] },
                { id: 'rank_9', name: 'Cửu Chuyển', description: 'Tôn giả vô địch, đứng trên đỉnh của vạn vật.', stages: [{ id: 'r9_1', name: 'Tôn Giả', qiRequired: 500000000, bonuses: [] }] },
            ]
        }
    },

    // --- MẪU FANTASY & KHOA HỌC VIỄN TƯỞNG ---
    {
        id: 'high_fantasy',
        name: 'Ma Pháp Sư (Fantasy)',
        description: 'Hệ thống sức mạnh ma pháp phương Tây, từ học徒 đến pháp sư thần thoại.',
        system: {
            id: 'mage_main',
            name: 'Hệ Thống Ma Pháp',
            description: 'Nghiên cứu bản chất của vạn vật, điều khiển năng lượng ma thuật để tạo ra những phép màu vĩ đại.',
            resourceName: 'Mana',
            resourceUnit: 'điểm',
            realms: [
                { id: 'apprentice', name: 'Học徒 Ma Pháp', description: 'Những người mới bắt đầu cảm nhận và học cách điều khiển Mana.', stages: [{ id: 'app_1', name: 'Sơ cấp', qiRequired: 100, bonuses: [] }, { id: 'app_3', name: 'Cao cấp', qiRequired: 1000, bonuses: [] }] },
                { id: 'adept', name: 'Chuyên Gia Ma Pháp', description: 'Có thể thi triển các phép thuật phức tạp và bắt đầu chuyên sâu vào một trường phái.', stages: [{ id: 'ad_1', name: 'Bậc 1', qiRequired: 5000, bonuses: [] }, { id: 'ad_2', name: 'Bậc 2', qiRequired: 10000, bonuses: [] }] },
                { id: 'master', name: 'Bậc Thầy Ma Pháp', description: 'Những pháp sư có kiến thức uyên thâm và sức mạnh to lớn.', stages: [{ id: 'mas_1', name: 'Bậc 1', qiRequired: 50000, bonuses: [] }, { id: 'mas_2', name: 'Bậc 2', qiRequired: 100000, bonuses: [] }] },
                { id: 'archmage', name: 'Đại Pháp Sư', description: 'Những người đứng đầu các học viện ma pháp, sức mạnh có thể ảnh hưởng đến cả một quốc gia.', stages: [{ id: 'arch_1', name: 'Bậc 1', qiRequired: 500000, bonuses: [] }] },
                { id: 'mythic_sorcerer', name: 'Pháp Sư Thần Thoại', description: 'Những tồn tại huyền thoại, sức mạnh của họ được ví như thần thánh.', stages: [{ id: 'myth_1', name: 'Thần Thoại', qiRequired: 10000000, bonuses: [] }] },
            ]
        }
    },
    {
        id: 'sci_fi',
        name: 'Khoa Huyễn Viễn Tưởng',
        description: 'Hệ thống cấp bậc sức mạnh dựa trên công nghệ, cấy ghép và năng lượng.',
        system: {
            id: 'sci_fi_main',
            name: 'Hệ Thống Phân Cấp Năng Lượng',
            description: 'Con đường tiến hóa trong một thế giới tương lai, từ người thường đến thực thể có sức mạnh thay đổi tinh hệ.',
            resourceName: 'Chỉ Số Năng Lượng',
            resourceUnit: 'đơn vị',
            realms: [
                { id: 'civilian', name: 'Người Thường', description: 'Người bình thường, không có năng lực đặc biệt.', stages: [{ id: 'civ_1', name: 'Bậc 1', qiRequired: 1000, bonuses: [] }] },
                { id: 'street_soldier', name: 'Chiến Binh Đường Phố', description: 'Những cá nhân được tăng cường bằng cấy ghép cấp thấp, chiến đấu trong thế giới ngầm.', stages: [{ id: 'ss_1', name: 'Bậc 1', qiRequired: 10000, bonuses: [] }] },
                { id: 'agent', name: 'Đặc Vụ', description: 'Lính đánh thuê chuyên nghiệp, được trang bị cấy ghép cao cấp và vũ khí tân tiến.', stages: [{ id: 'agent_1', name: 'Bậc 1', qiRequired: 100000, bonuses: [] }] },
                { id: 'super_soldier', name: 'Siêu Chiến Binh', description: 'Sản phẩm của các dự án quân sự, sở hữu công nghệ đỉnh cao, một mình là một đội quân.', stages: [{ id: 'sups_1', name: 'Bậc 1', qiRequired: 1000000, bonuses: [] }] },
                { id: 'living_weapon', name: 'Vũ Khí Sống', description: 'Huyền thoại sống, sức mạnh có thể thay đổi cục diện chiến tranh giữa các vì sao.', stages: [{ id: 'lw_1', name: 'Bậc 1', qiRequired: 10000000, bonuses: [] }] },
                { id: 'cosmic_legend', name: 'Huyền Thoại Vũ Trụ', description: 'Những thực thể gần như thần thánh, có khả năng tác động đến các quy luật vật lý.', stages: [{ id: 'cl_1', name: 'Bậc 1', qiRequired: 100000000, bonuses: [] }] },
            ]
        }
    },

    // --- CÁC MẪU MỚI ---
    {
        id: 'litrpg',
        name: 'LitRPG/Hệ Thống',
        description: 'Hệ thống cấp bậc dựa trên Cấp Độ (Level) và Điểm Kinh Nghiệm (EXP) như trong game.',
        system: {
            id: 'litrpg_main',
            name: 'Hệ Thống Cấp Độ',
            description: 'Tích lũy kinh nghiệm bằng cách chiến đấu và hoàn thành nhiệm vụ để lên cấp và mạnh hơn.',
            resourceName: 'Kinh Nghiệm',
            resourceUnit: 'EXP',
            realms: [
                { id: 'tan_binh', name: 'Tân Binh', description: 'Giai đoạn khởi đầu, làm quen với Hệ Thống.', stages: Array.from({ length: 10 }, (_, i) => ({ id: `lvl_${i + 1}`, name: `Cấp ${i + 1}`, qiRequired: (i + 1) * 100, bonuses: [] })) },
                { id: 'chien_binh', name: 'Chiến Binh', description: 'Đã có kinh nghiệm chiến đấu, có thể chọn Chức Nghiệp đầu tiên.', stages: Array.from({ length: 10 }, (_, i) => ({ id: `lvl_${i + 11}`, name: `Cấp ${i + 11}`, qiRequired: (i + 11) * 200, bonuses: [] })) },
                { id: 'tinh_anh', name: 'Tinh Anh', description: 'Những chiến binh dày dạn kinh nghiệm, bắt đầu nổi danh.', stages: Array.from({ length: 10 }, (_, i) => ({ id: `lvl_${i + 21}`, name: `Cấp ${i + 21}`, qiRequired: (i + 21) * 400, bonuses: [] })) },
                { id: 'quan_doan', name: 'Quân Đoàn', description: 'Có đủ sức mạnh để dẫn dắt một đội quân hoặc trấn giữ một pháo đài.', stages: Array.from({ length: 10 }, (_, i) => ({ id: `lvl_${i + 41}`, name: `Cấp ${i + 41}`, qiRequired: (i + 41) * 1000, bonuses: [] })) },
                { id: 'anh_hung', name: 'Anh Hùng', description: 'Những người có khả năng thay đổi vận mệnh của một vương quốc.', stages: Array.from({ length: 10 }, (_, i) => ({ id: `lvl_${i + 71}`, name: `Cấp ${i + 71}`, qiRequired: (i + 71) * 5000, bonuses: [] })) },
                { id: 'huyen_thoai', name: 'Huyền Thoại', description: 'Những tồn tại được ghi vào sử sách, sức mạnh gần như thần thánh.', stages: [{ id: 'lvl_100', name: 'Cấp 100', qiRequired: 100 * 10000, bonuses: [] }] },
            ]
        }
    },
    {
        id: 'world_of_darkness',
        name: 'Thế Giới Hắc Ám (Vampire)',
        description: 'Hệ thống cấp bậc dựa trên Thế Hệ và tuổi tác của ma cà rồng.',
        system: {
            id: 'wod_main',
            name: 'Hệ Thống Thế Hệ',
            description: 'Sức mạnh của ma cà rồng được quyết định bởi dòng máu và khoảng cách của họ với Thủy Tổ Cain.',
            resourceName: 'Kinh Nghiệm',
            resourceUnit: 'điểm',
            realms: [
                { id: 'tan_sinh', name: 'Tân Sinh (Fledgling)', description: 'Vừa được biến đổi, yếu đuối và non nớt, đang học cách tồn tại.', stages: [{ id: 'ts_1', name: 'Thế hệ 13-15', qiRequired: 100, bonuses: [] }] },
                { id: 'truong_thanh', name: 'Trưởng Thành (Neonate)', description: 'Đã sống sót qua những năm đầu, bắt đầu có chỗ đứng trong xã hội ma cà rồng.', stages: [{ id: 'tt_1', name: 'Thế hệ 10-12', qiRequired: 500, bonuses: [] }] },
                { id: 'ke_an_phan', name: 'Kẻ An Phận (Ancilla)', description: 'Những ma cà rồng có kinh nghiệm và quyền lực nhất định, là tay sai đắc lực của các Trưởng Lão.', stages: [{ id: 'kap_1', name: 'Thế hệ 8-9', qiRequired: 2000, bonuses: [] }] },
                { id: 'truong_lao', name: 'Trưởng Lão (Elder)', description: 'Những kẻ quyền lực thực sự, điều khiển thành phố từ trong bóng tối.', stages: [{ id: 'tl_1', name: 'Thế hệ 6-7', qiRequired: 10000, bonuses: [] }] },
                { id: 'thuong_co', name: 'Thượng Cổ (Methuselah)', description: 'Những sinh vật cổ xưa gần như thần thoại, mục tiêu và sức mạnh của họ không thể đo lường.', stages: [{ id: 'tc_1', name: 'Thế hệ 4-5', qiRequired: 50000, bonuses: [] }] },
            ]
        }
    },
    {
        id: 'urban_supernatural',
        name: 'Đô Thị Dị Năng',
        description: 'Phân cấp sức mạnh cho các dị năng giả trong thế giới hiện đại.',
        system: {
            id: 'urban_main',
            name: 'Hệ Thống Xếp Hạng Dị Năng',
            description: 'Các dị năng giả được xếp hạng dựa trên sức mạnh hủy diệt và khả năng kiểm soát năng lực.',
            resourceName: 'Chỉ số Năng Lượng',
            resourceUnit: 'đơn vị',
            realms: [
                { id: 'rank_f', name: 'Hạng F', description: 'Năng lực yếu, hầu như không có khả năng chiến đấu.', stages: [{ id: 'f_1', name: 'Bậc 1', qiRequired: 100, bonuses: [] }] },
                { id: 'rank_e', name: 'Hạng E', description: 'Năng lực có thể ảnh hưởng nhỏ đến môi trường xung quanh.', stages: [{ id: 'e_1', name: 'Bậc 1', qiRequired: 1000, bonuses: [] }] },
                { id: 'rank_d', name: 'Hạng D', description: 'Có khả năng chiến đấu cơ bản, là thành viên của các đội dị năng nhỏ.', stages: [{ id: 'd_1', name: 'Bậc 1', qiRequired: 5000, bonuses: [] }] },
                { id: 'rank_c', name: 'Hạng C', description: 'Dị năng giả có kinh nghiệm, có thể xử lý các mối đe dọa vừa phải.', stages: [{ id: 'c_1', name: 'Bậc 1', qiRequired: 20000, bonuses: [] }] },
                { id: 'rank_b', name: 'Hạng B', description: 'Những cá nhân mạnh mẽ, có thể một mình chống lại một đội quân nhỏ.', stages: [{ id: 'b_1', name: 'Bậc 1', qiRequired: 100000, bonuses: [] }] },
                { id: 'rank_a', name: 'Hạng A', description: 'Sức mạnh cấp quốc gia, mỗi hành động đều được theo dõi chặt chẽ.', stages: [{ id: 'a_1', name: 'Bậc 1', qiRequired: 500000, bonuses: [] }] },
                { id: 'rank_s', name: 'Hạng S', description: 'Thảm họa di động, sức mạnh có thể hủy diệt cả một thành phố.', stages: [{ id: 's_1', name: 'Bậc 1', qiRequired: 2000000, bonuses: [] }] },
                { id: 'rank_ss', name: 'Hạng SS', description: 'Sức mạnh cấp lục địa, những huyền thoại sống.', stages: [{ id: 'ss_1', name: 'Bậc 1', qiRequired: 10000000, bonuses: [] }] },
                { id: 'rank_sss', name: 'Hạng SSS', description: 'Những thực thể có sức mạnh thay đổi thế giới, gần như là thần thánh.', stages: [{ id: 'sss_1', name: 'Bậc 1', qiRequired: 50000000, bonuses: [] }] },
            ]
        }
    },
    {
        id: 'steampunk',
        name: 'Steampunk & Arcanepunk',
        description: 'Con đường trở thành một nhà phát minh vĩ đại trong thế giới của máy hơi nước và bánh răng.',
        system: {
            id: 'steampunk_main',
            name: 'Hệ Thống Bậc Thầy Chế Tác',
            description: 'Thông qua học hỏi và thực hành, tạo ra những cỗ máy và phát minh vĩ đại để thay đổi thế giới.',
            resourceName: 'Điểm Sáng Chế',
            resourceUnit: 'điểm',
            realms: [
                { id: 'apprentice', name: 'Thợ Học Việc', description: 'Bắt đầu học những nguyên lý cơ bản về cơ khí và hơi nước.', stages: [{ id: 'app_1', name: 'Năm 1', qiRequired: 100, bonuses: [] }] },
                { id: 'journeyman', name: 'Thợ Chính', description: 'Có thể tự mình chế tạo và sửa chữa các thiết bị đơn giản.', stages: [{ id: 'jour_1', name: 'Năm 1', qiRequired: 1000, bonuses: [] }] },
                { id: 'master', name: 'Bậc Thầy', description: 'Có khả năng tạo ra những cỗ máy phức tạp và độc đáo.', stages: [{ id: 'master_1', name: 'Năm 1', qiRequired: 5000, bonuses: [] }] },
                { id: 'inventor', name: 'Nhà Phát Minh', description: 'Sáng tạo ra những công nghệ hoàn toàn mới, được xã hội công nhận.', stages: [{ id: 'inv_1', name: 'Năm 1', qiRequired: 20000, bonuses: [] }] },
                { id: 'mechanical_genius', name: 'Thiên Tài Cơ Khí', description: 'Những huyền thoại có khả năng tạo ra những kỳ quan công nghệ làm thay đổi cả một kỷ nguyên.', stages: [{ id: 'mg_1', name: 'Năm 1', qiRequired: 100000, bonuses: [] }] },
            ]
        }
    },
];
