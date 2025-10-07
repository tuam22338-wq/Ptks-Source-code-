import type { ModAttributeSystem } from "../types";

/**
 * Kho lưu trữ các mẫu hệ thống thuộc tính được thiết kế sẵn cho nhiều thể loại khác nhau.
 * Mỗi mẫu là một thế giới quan thu nhỏ, định hình cách nhân vật tương tác và phát triển.
 */
export const ATTRIBUTE_TEMPLATES: { id: string; name: string; description: string; system: ModAttributeSystem }[] = [
    // --- MẪU TU TIÊN & VÕ HIỆP ---
    {
        id: 'xianxia_default',
        name: 'Huyền Huyễn Tu Chân (Chi Tiết)',
        description: 'Hệ thống tu tiên mặc định, tập trung vào Tinh-Khí-Thần và các yếu tố ngoại duyên.',
        system: {
            groups: [
                { id: 'physical', name: 'Tinh (精 - Nhục Thân)', order: 1 },
                { id: 'essence', name: 'Khí (气 - Chân Nguyên)', order: 2 },
                { id: 'spirit', name: 'Thần (神 - Linh Hồn)', order: 3 },
                { id: 'external', name: 'Ngoại Duyên (外缘 - Yếu Tố Bên Ngoài)', order: 4 },
                { id: 'vitals', name: 'Chỉ số Sinh Tồn', order: 5 },
                { id: 'cultivation', name: 'Thông Tin Tu Luyện', order: 6 },
            ],
            definitions: [
                // Tinh
                { id: 'can_cot', name: 'Căn Cốt', description: 'Nền tảng cơ thể, ảnh hưởng đến giới hạn Sinh Mệnh, phòng ngự vật lý.', iconName: 'GiSpinalCoil', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'luc_luong', name: 'Lực Lượng', description: 'Sức mạnh vật lý, ảnh hưởng đến sát thương cận chiến.', iconName: 'GiMuscularTorso', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'than_phap', name: 'Thân Pháp', description: 'Sự nhanh nhẹn, tốc độ di chuyển và né tránh.', iconName: 'GiRunningShoe', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                // Khí
                { id: 'linh_luc_sat_thuong', name: 'Linh Lực Sát Thương', description: 'Sát thương gây ra bởi pháp thuật và pháp bảo.', iconName: 'GiBoltSpellCast', type: 'PRIMARY', baseValue: 10, group: 'essence' },
                { id: 'ngu_khi_thuat', name: 'Ngự Khí Thuật', description: 'Độ khéo léo điều khiển linh khí (luyện đan, luyện khí, bố trận).', iconName: 'GiCauldron', type: 'PRIMARY', baseValue: 10, group: 'essence' },
                // Thần
                { id: 'ngo_tinh', name: 'Ngộ Tính', description: 'Khả năng lĩnh hội đại đạo, ảnh hưởng tốc độ học công pháp.', iconName: 'GiScrollQuill', type: 'PRIMARY', baseValue: 10, group: 'spirit' },
                { id: 'nguyen_than', name: 'Nguyên Thần', description: 'Sức mạnh linh hồn, ảnh hưởng đến uy lực thần hồn kỹ và kháng hiệu ứng tinh thần.', iconName: 'GiSoulVessel', type: 'PRIMARY', baseValue: 10, group: 'spirit' },
                // Ngoại Duyên
                { id: 'co_duyen', name: 'Cơ Duyên', description: 'Vận may, khả năng gặp được kỳ ngộ.', iconName: 'GiPerspectiveDiceSixFacesRandom', type: 'PRIMARY', baseValue: 10, group: 'external' },
                { id: 'mi_luc', name: 'Mị Lực', description: 'Sức hấp dẫn cá nhân, ảnh hưởng đến thái độ của NPC.', iconName: 'GiTalk', type: 'PRIMARY', baseValue: 10, group: 'external' },
                // Sinh Tồn
                { id: 'sinh_menh', name: 'Sinh Mệnh', description: 'Thể lực. Về 0 sẽ tử vong.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'linh_luc', name: 'Linh Lực', description: 'Năng lượng để thi triển pháp thuật.', iconName: 'GiMagicSwirl', type: 'VITAL', baseValue: 50, group: 'vitals' },
                { id: 'hunger', name: 'Độ No', description: 'Mức độ no bụng.', iconName: 'GiMeal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'thirst', name: 'Độ Khát', description: 'Mức độ đủ nước.', iconName: 'GiWaterDrop', type: 'VITAL', baseValue: 100, group: 'vitals' },
                // Tu Luyện
                { id: 'tuoi_tho', name: 'Tuổi Thọ', description: 'Thời gian sống.', iconName: 'GiHourglass', type: 'VITAL', baseValue: 80, group: 'cultivation' },
                { id: 'canh_gioi', name: 'Cảnh Giới', description: 'Cấp độ tu vi hiện tại.', iconName: 'GiStairsGoal', type: 'INFORMATIONAL', group: 'cultivation' },
            ]
        }
    },
    {
        id: 'wuxia',
        name: 'Võ Hiệp Giang Hồ',
        description: 'Hệ thống thuộc tính tập trung vào nội công, ngoại công, và các yếu tố võ thuật giang hồ.',
        system: {
            groups: [
                { id: 'ngoai_cong', name: 'Ngoại Công', order: 1 },
                { id: 'noi_cong', name: 'Nội Công', order: 2 },
                { id: 'tinh_than', name: 'Tinh Thần', order: 3 },
                { id: 'ngoai_duyen', name: 'Ngoại Duyên', order: 4 },
                { id: 'sinh_ton', name: 'Sinh Tồn', order: 5 },
            ],
            definitions: [
                { id: 'cuong_luc', name: 'Cương Lực', description: 'Sức mạnh cơ bắp, ảnh hưởng đến sát thương chiêu thức ngoại công.', iconName: 'GiMuscularTorso', type: 'PRIMARY', baseValue: 10, group: 'ngoai_cong' },
                { id: 'than_phap', name: 'Thân Pháp', description: 'Sự nhanh nhẹn, tốc độ di chuyển và né tránh.', iconName: 'GiRunningShoe', type: 'PRIMARY', baseValue: 10, group: 'ngoai_cong' },
                { id: 'can_cot', name: 'Căn Cốt', description: 'Nền tảng cơ thể, ảnh hưởng đến giới hạn Khí Huyết và phòng ngự.', iconName: 'GiSpinalCoil', type: 'PRIMARY', baseValue: 10, group: 'ngoai_cong' },
                { id: 'noi_luc_tham_hau', name: 'Nội Lực Thâm Hậu', description: 'Độ tinh thuần và mạnh mẽ của nội lực, ảnh hưởng đến uy lực võ công.', iconName: 'GiMagicSwirl', type: 'PRIMARY', baseValue: 10, group: 'noi_cong' },
                { id: 'ngo_tinh', name: 'Ngộ Tính', description: 'Khả năng lĩnh hội võ học, ảnh hưởng tốc độ học và sáng tạo võ công.', iconName: 'GiScrollQuill', type: 'PRIMARY', baseValue: 10, group: 'tinh_than' },
                { id: 'y_chi', name: 'Ý Chí', description: 'Sự kiên định, ảnh hưởng đến khả năng chống lại các hiệu ứng tinh thần.', iconName: 'GiStoneTower', type: 'PRIMARY', baseValue: 10, group: 'tinh_than' },
                { id: 'co_duyen', name: 'Cơ Duyên', description: 'Vận may, khả năng gặp được kỳ ngộ và bí kíp.', iconName: 'GiPerspectiveDiceSixFacesRandom', type: 'PRIMARY', baseValue: 10, group: 'ngoai_duyen' },
                { id: 'mi_luc', name: 'Mị Lực', description: 'Sức hấp dẫn cá nhân, ảnh hưởng đến thái độ của người khác.', iconName: 'GiTalk', type: 'PRIMARY', baseValue: 10, group: 'ngoai_duyen' },
                { id: 'khi_huyet', name: 'Khí Huyết', description: 'Thể lực. Về 0 sẽ tử vong.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'sinh_ton' },
                { id: 'noi_luc', name: 'Nội Lực', description: 'Năng lượng để thi triển võ công.', iconName: 'GiMagicSwirl', type: 'VITAL', baseValue: 50, group: 'sinh_ton' },
            ]
        }
    },

    // --- CÁC MẪU ĐẶC THÙ (SPECIFIC GENRES) ---
    {
        id: 'douluo',
        name: 'Hồn Sư (Đấu La)',
        description: 'Hệ thống thuộc tính cho thế giới Hồn Sư, tập trung vào Hồn Lực và Tinh Thần Lực.',
        system: {
            groups: [
                { id: 'core', name: 'Thuộc Tính Cốt Lõi', order: 1 },
                { id: 'combat', name: 'Thuộc Tính Chiến Đấu', order: 2 },
                { id: 'vitals', name: 'Sinh Tồn', order: 3 },
            ],
            definitions: [
                { id: 'tinh_than_luc', name: 'Tinh Thần Lực', description: 'Sức mạnh tinh thần, ảnh hưởng đến khả năng khống chế Hồn Thú và uy lực Hồn Kỹ.', iconName: 'FaBrain', type: 'PRIMARY', baseValue: 10, group: 'core' },
                { id: 'hon_luc_cap', name: 'Hồn Lực Cấp', description: 'Cấp bậc tu luyện của Hồn Sư.', iconName: 'GiStairsGoal', type: 'INFORMATIONAL', group: 'core' },
                { id: 'luc_luong', name: 'Lực Lượng', description: 'Sức mạnh của các đòn tấn công vật lý.', iconName: 'GiMuscularTorso', type: 'PRIMARY', baseValue: 10, group: 'combat' },
                { id: 'phong_ngu', name: 'Phòng Ngự', description: 'Khả năng chống chịu sát thương.', iconName: 'FaShieldAlt', type: 'PRIMARY', baseValue: 10, group: 'combat' },
                { id: 'toc_do', name: 'Tốc Độ', description: 'Sự nhanh nhẹn, tốc độ di chuyển và ra đòn.', iconName: 'GiRunningShoe', type: 'PRIMARY', baseValue: 10, group: 'combat' },
                { id: 'sinh_menh', name: 'Thể Lực', description: 'Sức sống của Hồn Sư.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'hon_luc', name: 'Hồn Lực', description: 'Năng lượng để thi triển Hồn Kỹ.', iconName: 'GiMagicSwirl', type: 'VITAL', baseValue: 100, group: 'vitals' },
            ]
        }
    },
    {
        id: 'gu_master',
        name: 'Cổ Sư',
        description: 'Hệ thống thuộc tính cho thế giới Cổ, nơi sức mạnh đến từ việc luyện và dùng Cổ trùng.',
        system: {
            groups: [
                { id: 'master', name: 'Chỉ Số Cổ Sư', order: 1 },
                { id: 'vitals', name: 'Sinh Tồn', order: 2 },
            ],
            definitions: [
                { id: 'khong_khieu', name: 'Không Khiếu', description: 'Nguồn gốc và nơi chứa đựng chân nguyên. Tư chất càng cao, không khiếu càng lớn.', iconName: 'GiYinYang', type: 'INFORMATIONAL', group: 'master' },
                { id: 'chan_nguyen', name: 'Chân Nguyên', description: 'Năng lượng để thôi động Cổ trùng.', iconName: 'GiMagicSwirl', type: 'VITAL', baseValue: 100, group: 'master' },
                { id: 'than_niem', name: 'Thần Niệm', description: 'Ý chí của Cổ sư, dùng để điều khiển và cảm nhận Cổ trùng.', iconName: 'FaBrain', type: 'PRIMARY', baseValue: 10, group: 'master' },
                { id: 'the_phach', name: 'Thể Phách', description: 'Sức mạnh và độ bền của nhục thân Cổ sư.', iconName: 'GiSpinalCoil', type: 'PRIMARY', baseValue: 10, group: 'master' },
                { id: 'luyen_co_thuat', name: 'Luyện Cổ Thuật', description: 'Kỹ năng luyện hóa và hợp thành Cổ trùng.', iconName: 'GiCauldron', type: 'PRIMARY', baseValue: 5, group: 'master' },
                { id: 'sinh_menh', name: 'Sinh Mệnh', description: 'Sức sống của Cổ sư.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'vitals' },
            ]
        }
    },

    // --- MẪU FANTASY & KHOA HỌC VIỄN TƯỞNG ---
    {
        id: 'high_fantasy',
        name: 'Fantasy Cổ Điển (D&D)',
        description: 'Hệ thống thuộc tính D&D cổ điển, phù hợp cho thế giới anh hùng, phép thuật và rồng.',
        system: {
            groups: [
                { id: 'physical', name: 'Thể Chất', order: 1 },
                { id: 'mental', name: 'Tinh Thần', order: 2 },
                { id: 'social', name: 'Xã Hội', order: 3 },
                { id: 'vitals', name: 'Sinh Tồn', order: 4 },
            ],
            definitions: [
                { id: 'strength', name: 'Sức Mạnh (Strength)', description: 'Sức mạnh cơ bắp, sát thương cận chiến.', iconName: 'GiMuscularTorso', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'dexterity', name: 'Nhanh Nhẹn (Dexterity)', description: 'Sự khéo léo, phản xạ, sát thương tầm xa.', iconName: 'GiRunningShoe', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'constitution', name: 'Thể Trạng (Constitution)', description: 'Sức bền, sức chịu đựng, ảnh hưởng đến Máu.', iconName: 'GiHeartTower', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'intelligence', name: 'Trí Tuệ (Intelligence)', description: 'Logic, kiến thức, ma pháp học thuật.', iconName: 'FaBrain', type: 'PRIMARY', baseValue: 10, group: 'mental' },
                { id: 'wisdom', name: 'Thông Thái (Wisdom)', description: 'Trực giác, nhận thức, ma pháp thần thánh.', iconName: 'GiScrollQuill', type: 'PRIMARY', baseValue: 10, group: 'mental' },
                { id: 'charisma', name: 'Sức Hấp Dẫn (Charisma)', description: 'Khả năng thuyết phục, lãnh đạo, ma pháp bẩm sinh.', iconName: 'GiTalk', type: 'PRIMARY', baseValue: 10, group: 'social' },
                { id: 'hp', name: 'Máu (HP)', description: 'Sức sống. Về 0 sẽ bất tỉnh.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'mana', name: 'Năng Lượng (Mana)', description: 'Năng lượng cho phép thuật, kỹ năng.', iconName: 'GiMagicSwirl', type: 'VITAL', baseValue: 50, group: 'vitals' },
            ]
        }
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk: Thành Phố Ne-On',
        description: 'Hệ thống thuộc tính cho bối cảnh tương lai đen tối, tập trung vào cấy ghép, hack và chiến đấu đường phố.',
        system: {
            groups: [
                { id: 'hardware', name: 'Phần Cứng (Cơ Thể)', order: 1 },
                { id: 'software', name: 'Phần Mềm (Trí Tuệ)', order: 2 },
                { id: 'wetware', name: 'Wetware (Tương Tác)', order: 3 },
                { id: 'vitals', name: 'Hệ Thống Sống', order: 4 },
            ],
            definitions: [
                { id: 'the_trang', name: 'Thể Trạng', description: 'Sức bền và khả năng chống chịu sát thương vật lý.', iconName: 'GiHeartTower', type: 'PRIMARY', baseValue: 10, group: 'hardware' },
                { id: 'phan_xa', name: 'Phản Xạ', description: 'Tốc độ, sự nhanh nhẹn và khả năng né tránh.', iconName: 'GiRunningShoe', type: 'PRIMARY', baseValue: 10, group: 'hardware' },
                { id: 'ky_thuat', name: 'Kỹ Thuật', description: 'Khả năng chế tạo, sửa chữa và sử dụng công nghệ.', iconName: 'GiGears', type: 'PRIMARY', baseValue: 10, group: 'software' },
                { id: 'tri_tue', name: 'Trí Tuệ', description: 'Khả năng hack, xử lý thông tin và xâm nhập hệ thống.', iconName: 'FaBrain', type: 'PRIMARY', baseValue: 10, group: 'software' },
                { id: 'lanh_lung', name: 'Lạnh Lùng (Cool)', description: 'Sự bình tĩnh trong giao tranh, ảnh hưởng đến độ chính xác và khả năng chống lại áp lực tâm lý.', iconName: 'GiStoneTower', type: 'PRIMARY', baseValue: 10, group: 'wetware' },
                { id: 'tieng_tam_duong_pho', name: 'Tiếng Tăm Đường Phố', description: 'Danh tiếng trong thế giới ngầm, ảnh hưởng đến các mối quan hệ và cơ hội.', iconName: 'GiTalk', type: 'PRIMARY', baseValue: 0, group: 'wetware' },
                { id: 'diem_ben', name: 'Điểm Bền (HP)', description: 'Độ bền của cơ thể. Về 0 sẽ bất tỉnh hoặc chết.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'dung_luong_cay_ghep', name: 'Dung Lượng Cấy Ghép', description: 'Khả năng chịu đựng của cơ thể đối với các bộ phận máy móc. Quá tải có thể dẫn đến tâm thần bất ổn.', iconName: 'GiSpinalCoil', type: 'VITAL', baseValue: 10, group: 'vitals' },
            ]
        }
    },
    {
        id: 'post_apocalypse',
        name: 'Hậu Tận Thế',
        description: 'Hệ thống thuộc tính cho bối cảnh sinh tồn trong một thế giới hoang tàn.',
        system: {
            groups: [
                { id: 'survival', name: 'Kỹ Năng Sinh Tồn', order: 1 },
                { id: 'combat', name: 'Kỹ Năng Chiến Đấu', order: 2 },
                { id: 'social', name: 'Kỹ Năng Xã Hội', order: 3 },
                { id: 'vitals', name: 'Chỉ Số Sống', order: 4 },
            ],
            definitions: [
                { id: 'tim_kiem', name: 'Tìm Kiếm', description: 'Khả năng tìm thấy vật phẩm hữu ích trong môi trường.', iconName: 'GiHerbsBundle', type: 'PRIMARY', baseValue: 10, group: 'survival' },
                { id: 'che_tao', name: 'Chế Tạo', description: 'Khả năng tạo ra và sửa chữa vật phẩm.', iconName: 'GiGears', type: 'PRIMARY', baseValue: 10, group: 'survival' },
                { id: 'y_hoc', name: 'Y Học', description: 'Khả năng chữa trị vết thương và bệnh tật.', iconName: 'GiHealthNormal', type: 'PRIMARY', baseValue: 10, group: 'survival' },
                { id: 'can_chien', name: 'Cận Chiến', description: 'Kỹ năng sử dụng vũ khí cận chiến.', iconName: 'GiBroadsword', type: 'PRIMARY', baseValue: 10, group: 'combat' },
                { id: 'ban_xa', name: 'Bắn Xa', description: 'Kỹ năng sử dụng vũ khí tầm xa.', iconName: 'GiSparklingSabre', type: 'PRIMARY', baseValue: 10, group: 'combat' },
                { id: 'thuong_luong', name: 'Thương Lượng', description: 'Khả năng mua bán và thuyết phục người khác.', iconName: 'GiTalk', type: 'PRIMARY', baseValue: 10, group: 'social' },
                { id: 'mau', name: 'Máu (HP)', description: 'Sức sống của bạn.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'the_luc', name: 'Thể Lực', description: 'Thể lực để thực hiện các hành động nặng.', iconName: 'GiRunningShoe', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'thuc_an', name: 'Thức Ăn', description: 'Mức độ no.', iconName: 'GiMeal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'nuoc_uong', name: 'Nước Uống', description: 'Mức độ đủ nước.', iconName: 'GiWaterDrop', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'nhiem_xa', name: 'Nhiễm Xạ', description: 'Mức độ nhiễm phóng xạ trong cơ thể.', iconName: 'FaBiohazard', type: 'VITAL', baseValue: 0, group: 'vitals' },
            ]
        }
    },
    {
        id: 'litrpg',
        name: 'Hệ Thống Tu Luyện Số Hóa',
        description: 'Một hệ thống tu luyện hiện đại, nơi mọi sức mạnh được số hóa thành các chỉ số rõ ràng, giống như trong một trò chơi.',
        system: {
            groups: [
                { id: 'combat_stats', name: 'Thuộc tính Chiến đấu', order: 1 },
                { id: 'vitals', name: 'Chỉ số Sinh tồn', order: 2 },
                { id: 'system_info', name: 'Thông tin Hệ thống', order: 3 },
            ],
            definitions: [
                { id: 'luc_luong', name: 'Lực Lượng', description: 'Tăng sát thương vật lý và các kỹ năng dựa trên sức mạnh.', iconName: 'GiMuscularTorso', type: 'PRIMARY', baseValue: 10, group: 'combat_stats' },
                { id: 'than_phap', name: 'Thân Pháp', description: 'Tăng tốc độ, né tránh và độ chính xác.', iconName: 'GiRunningShoe', type: 'PRIMARY', baseValue: 10, group: 'combat_stats' },
                { id: 'the_chat', name: 'Thể Chất', description: 'Tăng Khí Huyết tối đa, phòng ngự và kháng hiệu ứng.', iconName: 'GiHeartTower', type: 'PRIMARY', baseValue: 10, group: 'combat_stats' },
                { id: 'tinh_than', name: 'Tinh Thần', description: 'Tăng Chân Nguyên tối đa, sức mạnh kỹ năng và kháng phép.', iconName: 'FaBrain', type: 'PRIMARY', baseValue: 10, group: 'combat_stats' },
                { id: 'khi_van', name: 'Khí Vận', description: 'Ảnh hưởng đến tỷ lệ rơi vật phẩm hiếm, cơ duyên và tỷ lệ chí mạng.', iconName: 'GiPerspectiveDiceSixFacesRandom', type: 'PRIMARY', baseValue: 5, group: 'combat_stats' },
                { id: 'khi_huyet', name: 'Khí Huyết (HP)', description: 'Sinh lực của bạn. Về 0 là tử vong.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'chan_nguyen', name: 'Chân Nguyên (MP)', description: 'Năng lượng để sử dụng kỹ năng.', iconName: 'GiMagicSwirl', type: 'VITAL', baseValue: 50, group: 'vitals' },
                { id: 'cap_do', name: 'Cấp Độ', description: 'Cấp độ hiện tại của bạn trong Hệ Thống.', iconName: 'GiStairsGoal', type: 'INFORMATIONAL', group: 'system_info' },
                { id: 'diem_kinh_nghiem', name: 'Điểm Kinh Nghiệm (EXP)', description: 'Điểm kinh nghiệm cần thiết để thăng cấp.', iconName: 'GiStairsGoal', type: 'INFORMATIONAL', group: 'system_info' },
            ]
        }
    },
    {
        id: 'world_of_darkness',
        name: 'Thế Giới Hắc Ám (Vampire)',
        description: 'Hệ thống thuộc tính cho các sinh vật bóng đêm, tập trung vào đấu tranh nội tâm và quyền lực xã hội.',
        system: {
            groups: [
                { id: 'physical', name: 'Thuộc tính Thể chất', order: 1 },
                { id: 'social', name: 'Thuộc tính Xã hội', order: 2 },
                { id: 'mental', name: 'Thuộc tính Tinh thần', order: 3 },
                { id: 'vitals', name: 'Trạng thái Siêu nhiên', order: 4 },
            ],
            definitions: [
                { id: 'suc_manh', name: 'Sức Mạnh', description: 'Sức mạnh cơ bắp phi thường.', iconName: 'GiMuscularTorso', type: 'PRIMARY', baseValue: 1, group: 'physical' },
                { id: 'nhanh_nhen', name: 'Nhanh Nhẹn', description: 'Tốc độ và sự khéo léo siêu nhiên.', iconName: 'GiRunningShoe', type: 'PRIMARY', baseValue: 1, group: 'physical' },
                { id: 'suc_ben', name: 'Sức Bền', description: 'Khả năng chống chịu sát thương và sự khắc nghiệt.', iconName: 'GiHeartTower', type: 'PRIMARY', baseValue: 1, group: 'physical' },
                { id: 'loi_cuon', name: 'Lôi Cuốn', description: 'Sức hấp dẫn và khả năng thu hút người khác.', iconName: 'GiTalk', type: 'PRIMARY', baseValue: 1, group: 'social' },
                { id: 'thao_tung', name: 'Thao Túng', description: 'Khả năng điều khiển và gây ảnh hưởng lên người khác.', iconName: 'GiTalk', type: 'PRIMARY', baseValue: 1, group: 'social' },
                { id: 'diem_tinh', name: 'Điềm Tĩnh', description: 'Vẻ ngoài bình tĩnh và khả năng che giấu cảm xúc.', iconName: 'GiStoneTower', type: 'PRIMARY', baseValue: 1, group: 'social' },
                { id: 'nhan_thuc', name: 'Nhận Thức', description: 'Sự tinh tường, khả năng nhận biết các chi tiết.', iconName: 'GiSparklingSabre', type: 'PRIMARY', baseValue: 1, group: 'mental' },
                { id: 'tri_tue', name: 'Trí Tuệ', description: 'Khả năng suy luận và kiến thức.', iconName: 'FaBrain', type: 'PRIMARY', baseValue: 1, group: 'mental' },
                { id: 'muu_tri', name: 'Mưu Trí', description: 'Sự thông minh, ứng biến nhanh nhạy.', iconName: 'GiScrollQuill', type: 'PRIMARY', baseValue: 1, group: 'mental' },
                { id: 'huyet_nang', name: 'Huyết Năng', description: 'Nguồn sức mạnh bất tử, dùng để kích hoạt dị năng.', iconName: 'GiWaterDrop', type: 'VITAL', baseValue: 10, group: 'vitals' },
                { id: 'nhan_tinh', name: 'Nhân Tính', description: 'Sự kết nối còn lại với con người. Về 0 sẽ hóa thành quái vật.', iconName: 'GiSoulVessel', type: 'VITAL', baseValue: 7, group: 'vitals' },
            ]
        }
    },
    {
        id: 'urban_supernatural',
        name: 'Đô Thị Dị Năng',
        description: 'Hệ thống cho bối cảnh hiện đại nơi các dị năng giả ẩn mình trong xã hội loài người.',
        system: {
            groups: [
                { id: 'core', name: 'Chỉ Số Dị Năng', order: 1 },
                { id: 'physical', name: 'Thể Chất', order: 2 },
                { id: 'social', name: 'Xã Hội', order: 3 },
                { id: 'vitals', name: 'Sinh Tồn', order: 4 },
            ],
            definitions: [
                { id: 'di_nang_luc', name: 'Dị Năng Lực', description: 'Năng lượng để sử dụng dị năng.', iconName: 'GiMagicSwirl', type: 'VITAL', baseValue: 100, group: 'core' },
                { id: 'thao_tung_hien_thuc', name: 'Thao Túng Hiện Thực', description: 'Cường độ và khả năng kiểm soát dị năng.', iconName: 'GiSparkles', type: 'PRIMARY', baseValue: 10, group: 'core' },
                { id: 'tinh_than_luc', name: 'Tinh Thần Lực', description: 'Sức mạnh ý chí, kháng lại các dị năng tâm linh.', iconName: 'FaBrain', type: 'PRIMARY', baseValue: 10, group: 'core' },
                { id: 'the_chat', name: 'Thể Chất', description: 'Sức mạnh và độ bền của cơ thể.', iconName: 'GiMuscularTorso', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'phan_ung', name: 'Phản Ứng', description: 'Tốc độ phản xạ và né tránh.', iconName: 'GiRunningShoe', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'an_minh', name: 'Ẩn Mình', description: 'Khả năng che giấu thân phận và hoạt động trong bóng tối.', iconName: 'GiTalk', type: 'PRIMARY', baseValue: 10, group: 'social' },
                { id: 'sinh_menh', name: 'Sinh Lực', description: 'Sức sống của bạn.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'vitals' },
            ]
        }
    },
    {
        id: 'steampunk',
        name: 'Steampunk & Arcanepunk',
        description: 'Hệ thống thuộc tính cho thế giới của máy hơi nước, bánh răng và ma thuật cổ xưa.',
        system: {
            groups: [
                { id: 'craft', name: 'Kỹ Năng Chế Tác', order: 1 },
                { id: 'academic', name: 'Học Thuật', order: 2 },
                { id: 'social', name: 'Xã Giao', order: 3 },
                { id: 'vitals', name: 'Nguồn Lực', order: 4 },
            ],
            definitions: [
                { id: 'che_tac', name: 'Chế Tác', description: 'Kỹ năng làm việc với máy móc, bánh răng và các thiết bị phức tạp.', iconName: 'GiGears', type: 'PRIMARY', baseValue: 10, group: 'craft' },
                { id: 'ky_thuat_hoi_nuoc', name: 'Kỹ Thuật Hơi Nước', description: 'Hiểu biết về công nghệ hơi nước, từ động cơ đến vũ khí.', iconName: 'GiCauldron', type: 'PRIMARY', baseValue: 10, group: 'craft' },
                { id: 'luyen_kim', name: 'Luyện Kim', description: 'Kiến thức về biến đổi vật chất và tạo ra các hợp kim kỳ diệu.', iconName: 'GiVial', type: 'PRIMARY', baseValue: 5, group: 'academic' },
                { id: 'huyen_hoc', name: 'Huyền Học', description: 'Kiến thức về các cổ ngữ, tàn tích và ma thuật bị lãng quên.', iconName: 'GiBook', type: 'PRIMARY', baseValue: 5, group: 'academic' },
                { id: 'thuyet_phuc', name: 'Thuyết Phục', description: 'Khả năng đàm phán và gây ảnh hưởng trong xã hội quý tộc và công nghiệp.', iconName: 'GiTalk', type: 'PRIMARY', baseValue: 10, group: 'social' },
                { id: 'the_luc', name: 'Thể Lực', description: 'Sức bền để làm việc và chiến đấu.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'ap_suat_hoi_nuoc', name: 'Áp Suất Hơi Nước', description: 'Năng lượng dự trữ cho các thiết bị hơi nước cá nhân.', iconName: 'GiMagicSwirl', type: 'VITAL', baseValue: 100, group: 'vitals' },
            ]
        }
    },
];
