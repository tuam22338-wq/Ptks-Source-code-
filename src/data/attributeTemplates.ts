import type { ModAttributeSystem } from "../types";

export const ATTRIBUTE_TEMPLATES: { id: string; name: string; description: string; system: ModAttributeSystem }[] = [
    {
        id: 'wuxia',
        name: 'Võ Hiệp Kim Dung',
        description: 'Hệ thống thuộc tính tập trung vào nội công, ngoại công, và các yếu tố võ thuật giang hồ.',
        system: {
            groups: [
                { id: 'physical', name: 'Ngoại Công', order: 1 },
                { id: 'internal', name: 'Nội Công', order: 2 },
                { id: 'spirit', name: 'Tinh Thần', order: 3 },
                { id: 'external', name: 'Ngoại Duyên', order: 4 },
                { id: 'vitals', name: 'Sinh Tồn', order: 5 },
            ],
            definitions: [
                { id: 'ngoai_cong', name: 'Ngoại Công', description: 'Sức mạnh cơ bắp, ảnh hưởng đến sát thương chiêu thức ngoại công.', iconName: 'GiMuscularTorso', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'than_phap', name: 'Thân Pháp', description: 'Sự nhanh nhẹn, tốc độ di chuyển và né tránh.', iconName: 'GiRunningShoe', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'can_cot', name: 'Căn Cốt', description: 'Nền tảng cơ thể, ảnh hưởng đến giới hạn Khí Huyết và phòng ngự.', iconName: 'GiSpinalCoil', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'noi_cong', name: 'Nội Công Thâm Hậu', description: 'Độ tinh thuần và mạnh mẽ của nội lực, ảnh hưởng đến uy lực võ công.', iconName: 'GiMagicSwirl', type: 'PRIMARY', baseValue: 10, group: 'internal' },
                { id: 'ngo_tinh', name: 'Ngộ Tính', description: 'Khả năng lĩnh hội võ học, ảnh hưởng tốc độ học và sáng tạo võ công.', iconName: 'GiScrollQuill', type: 'PRIMARY', baseValue: 10, group: 'spirit' },
                { id: 'y_chi', name: 'Ý Chí', description: 'Sự kiên định, ảnh hưởng đến khả năng chống lại các hiệu ứng tinh thần.', iconName: 'GiStoneTower', type: 'PRIMARY', baseValue: 10, group: 'spirit' },
                { id: 'co_duyen', name: 'Cơ Duyên', description: 'Vận may, khả năng gặp được kỳ ngộ và bí kíp.', iconName: 'GiPerspectiveDiceSixFacesRandom', type: 'PRIMARY', baseValue: 10, group: 'external' },
                { id: 'mi_luc', name: 'Mị Lực', description: 'Sức hấp dẫn cá nhân, ảnh hưởng đến thái độ của người khác.', iconName: 'GiTalk', type: 'PRIMARY', baseValue: 10, group: 'external' },
                { id: 'sinh_menh', name: 'Khí Huyết', description: 'Thể lực. Về 0 sẽ tử vong.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'linh_luc', name: 'Nội Lực', description: 'Năng lượng để thi triển võ công.', iconName: 'GiMagicSwirl', type: 'VITAL', baseValue: 50, group: 'vitals' },
                { id: 'hunger', name: 'Độ No', description: 'Mức độ no bụng.', iconName: 'GiMeal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'thirst', name: 'Độ Khát', description: 'Mức độ đủ nước.', iconName: 'GiWaterDrop', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'tuoi_tho', name: 'Tuổi Thọ', description: 'Thời gian sống.', iconName: 'GiHourglass', type: 'VITAL', baseValue: 80, group: 'vitals' },
            ]
        }
    },
    {
        id: 'xianxia_default',
        name: 'Huyền Huyễn Tu Chân (Mặc định)',
        description: 'Hệ thống thuộc tính tu tiên mặc định của game, tập trung vào Tinh-Khí-Thần.',
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
                { id: 'can_cot', name: 'Căn Cốt', description: 'Nền tảng cơ thể, ảnh hưởng đến giới hạn Sinh Mệnh, phòng ngự vật lý.', iconName: 'GiSpinalCoil', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'luc_luong', name: 'Lực Lượng', description: 'Sức mạnh vật lý, ảnh hưởng đến sát thương cận chiến.', iconName: 'GiMuscularTorso', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'than_phap', name: 'Thân Pháp', description: 'Sự nhanh nhẹn, tốc độ di chuyển và né tránh.', iconName: 'GiRunningShoe', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'linh_luc_sat_thuong', name: 'Linh Lực Sát Thương', description: 'Sát thương gây ra bởi pháp thuật và pháp bảo.', iconName: 'GiBoltSpellCast', type: 'PRIMARY', baseValue: 10, group: 'essence' },
                { id: 'ngu_khi_thuat', name: 'Ngự Khí Thuật', description: 'Độ khéo léo điều khiển linh khí (luyện đan, luyện khí, bố trận).', iconName: 'GiCauldron', type: 'PRIMARY', baseValue: 10, group: 'essence' },
                { id: 'ngo_tinh', name: 'Ngộ Tính', description: 'Khả năng lĩnh hội đại đạo, ảnh hưởng tốc độ học công pháp.', iconName: 'GiScrollQuill', type: 'PRIMARY', baseValue: 10, group: 'spirit' },
                { id: 'nguyen_than', name: 'Nguyên Thần', description: 'Sức mạnh linh hồn, ảnh hưởng đến uy lực thần hồn kỹ.', iconName: 'GiSoulVessel', type: 'PRIMARY', baseValue: 10, group: 'spirit' },
                { id: 'co_duyen', name: 'Cơ Duyên', description: 'Vận may, khả năng gặp được kỳ ngộ.', iconName: 'GiPerspectiveDiceSixFacesRandom', type: 'PRIMARY', baseValue: 10, group: 'external' },
                { id: 'sinh_menh', name: 'Sinh Mệnh', description: 'Thể lực. Về 0 sẽ tử vong.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'linh_luc', name: 'Linh Lực', description: 'Năng lượng để thi triển pháp thuật.', iconName: 'GiMagicSwirl', type: 'VITAL', baseValue: 50, group: 'vitals' },
                { id: 'hunger', name: 'Độ No', description: 'Mức độ no bụng.', iconName: 'GiMeal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'thirst', name: 'Độ Khát', description: 'Mức độ đủ nước.', iconName: 'GiWaterDrop', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'tuoi_tho', name: 'Tuổi Thọ', description: 'Thời gian sống.', iconName: 'GiHourglass', type: 'VITAL', baseValue: 80, group: 'cultivation' },
                { id: 'canh_gioi', name: 'Cảnh Giới', description: 'Cấp độ tu vi hiện tại.', iconName: 'GiStairsGoal', type: 'INFORMATIONAL', group: 'cultivation' },
            ]
        }
    },
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
                { id: 'hon_luc', name: 'Hồn Lực', description: 'Năng lượng cơ bản của Hồn Sư để thi triển Hồn Kỹ.', iconName: 'GiMagicSwirl', type: 'VITAL', baseValue: 10, group: 'core' },
                { id: 'luc_luong', name: 'Lực Lượng', description: 'Sức mạnh của các đòn tấn công vật lý.', iconName: 'GiMuscularTorso', type: 'PRIMARY', baseValue: 10, group: 'combat' },
                { id: 'phong_ngu', name: 'Phòng Ngự', description: 'Khả năng chống chịu sát thương.', iconName: 'FaShieldAlt', type: 'PRIMARY', baseValue: 10, group: 'combat' },
                { id: 'toc_do', name: 'Tốc Độ', description: 'Sự nhanh nhẹn, tốc độ di chuyển và ra đòn.', iconName: 'GiRunningShoe', type: 'PRIMARY', baseValue: 10, group: 'combat' },
                { id: 'sinh_menh', name: 'Thể Lực', description: 'Sức sống của Hồn Sư.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'vitals' },
            ]
        }
    },
    {
        id: 'body_cultivation',
        name: 'Luyện Thể',
        description: 'Thuộc tính cho con đường Luyện Thể, tập trung vào sức mạnh và độ bền của nhục thân.',
        system: {
            groups: [
                { id: 'physical', name: 'Nhục Thân', order: 1 },
                { id: 'vitals', name: 'Sinh Tồn', order: 2 },
            ],
            definitions: [
                { id: 'khi_huyet', name: 'Khí Huyết', description: 'Năng lượng sinh mệnh, nguồn gốc sức mạnh của Luyện Thể Sư.', iconName: 'GiHeartTower', type: 'VITAL', baseValue: 100, group: 'physical' },
                { id: 'luc_boc_phat', name: 'Lực Bộc Phát', description: 'Sát thương vật lý trong một đòn đánh.', iconName: 'GiMuscularTorso', type: 'PRIMARY', baseValue: 15, group: 'physical' },
                { id: 'do_ben_nhuc_than', name: 'Độ Bền Nhục Thân', description: 'Khả năng chống chịu sát thương vật lý.', iconName: 'FaShieldAlt', type: 'PRIMARY', baseValue: 15, group: 'physical' },
                { id: 'toc_do_hoi_phuc', name: 'Tốc Độ Hồi Phục', description: 'Khả năng tự chữa lành vết thương.', iconName: 'GiHealthNormal', type: 'PRIMARY', baseValue: 5, group: 'physical' },
                { id: 'sinh_menh', name: 'Sinh Mệnh', description: 'Sức sống của bạn.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 150, group: 'vitals' },
            ]
        }
    },
    {
        id: 'mage',
        name: 'Ma Pháp Sư (Fantasy)',
        description: 'Các thuộc tính cho thế giới ma pháp phương Tây, nhấn mạnh Trí Tuệ và Tinh Thần.',
        system: {
            groups: [
                { id: 'core', name: 'Thuộc Tính Ma Pháp', order: 1 },
                { id: 'mental', name: 'Thuộc Tính Tinh Thần', order: 2 },
                { id: 'vitals', name: 'Sinh Tồn', order: 3 },
            ],
            definitions: [
                { id: 'tri_tue', name: 'Trí Tuệ', description: 'Ảnh hưởng đến sức mạnh và độ phức tạp của phép thuật.', iconName: 'FaBrain', type: 'PRIMARY', baseValue: 15, group: 'core' },
                { id: 'nguyen_to_thong_thao', name: 'Nguyên Tố Tinh Thông', description: 'Khả năng điều khiển các nguyên tố (Lửa, Nước, Khí, Đất).', iconName: 'GiPentacle', type: 'PRIMARY', baseValue: 10, group: 'core' },
                { id: 'toc_do_thi_phap', name: 'Tốc Độ Thi Pháp', description: 'Tốc độ niệm chú và thi triển phép thuật.', iconName: 'GiRunningShoe', type: 'PRIMARY', baseValue: 10, group: 'core' },
                { id: 'tinh_than', name: 'Tinh Thần', description: 'Ý chí, khả năng chống lại ma pháp tinh thần và sự hỗn loạn.', iconName: 'GiSoulVessel', type: 'PRIMARY', baseValue: 10, group: 'mental' },
                { id: 'sinh_menh', name: 'Máu', description: 'Sức sống của pháp sư.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 80, group: 'vitals' },
                { id: 'linh_luc', name: 'Mana', description: 'Năng lượng để thi triển phép thuật.', iconName: 'GiMagicSwirl', type: 'VITAL', baseValue: 150, group: 'vitals' },
            ]
        }
    },
    {
        id: 'mecha',
        name: 'Cơ Giáp Sư (Sci-fi)',
        description: 'Thuộc tính cho phi công và cơ giáp trong bối cảnh khoa huyễn.',
        system: {
            groups: [
                { id: 'pilot', name: 'Chỉ Số Người Lái', order: 1 },
                { id: 'mech', name: 'Chỉ Số Cơ Giáp', order: 2 },
                { id: 'vitals', name: 'Sinh Tồn', order: 3 },
            ],
            definitions: [
                { id: 'toc_do_phan_ung', name: 'Tốc Độ Phản Ứng', description: 'Phản xạ của phi công, ảnh hưởng đến khả năng né tránh.', iconName: 'GiRunningShoe', type: 'PRIMARY', baseValue: 10, group: 'pilot' },
                { id: 'tinh_than_luc', name: 'Tinh Thần Lực', description: 'Sức mạnh ý chí, ảnh hưởng đến tỷ lệ đồng bộ.', iconName: 'FaBrain', type: 'PRIMARY', baseValue: 10, group: 'pilot' },
                { id: 'nang_luong_loi', name: 'Năng Lượng Lõi', description: 'Năng lượng của cơ giáp để di chuyển và chiến đấu.', iconName: 'GiBoltSpellCast', type: 'VITAL', baseValue: 1000, group: 'mech' },
                { id: 'do_ben_giap', name: 'Độ Bền Giáp', description: 'Khả năng chống chịu sát thương của cơ giáp.', iconName: 'FaShieldAlt', type: 'PRIMARY', baseValue: 100, group: 'mech' },
                { id: 'hoa_luc', name: 'Hỏa Lực', description: 'Sát thương gây ra bởi vũ khí của cơ giáp.', iconName: 'GiBroadsword', type: 'PRIMARY', baseValue: 20, group: 'mech' },
                { id: 'sinh_menh', name: 'Độ Bền Khoang Lái', description: 'Sức sống của phi công.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'vitals' },
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
    {
        id: 'cyberpunk',
        name: 'Cyberpunk: Thành Phố Ne-On',
        description: 'Hệ thống thuộc tính cho bối cảnh tương lai đen tối, tập trung vào cấy ghép, hack và chiến đấu đường phố.',
        system: {
            groups: [
                { id: 'physical', name: 'Thể Chất', order: 1 },
                { id: 'tech', name: 'Kỹ Thuật & Cấy Ghép', order: 2 },
                { id: 'net', name: 'Tác Vụ Mạng', order: 3 },
                { id: 'social', name: 'Xã Hội', order: 4 },
                { id: 'vitals', name: 'Sinh Tồn', order: 5 },
            ],
            definitions: [
                { id: 'the_trang', name: 'Thể Trạng', description: 'Sức bền và khả năng chống chịu sát thương vật lý.', iconName: 'GiHeartTower', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'phan_xa', name: 'Phản Xạ', description: 'Tốc độ, sự nhanh nhẹn và khả năng né tránh.', iconName: 'GiRunningShoe', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'ky_thuat', name: 'Kỹ Thuật', description: 'Khả năng chế tạo, sửa chữa và sử dụng công nghệ.', iconName: 'GiGears', type: 'PRIMARY', baseValue: 10, group: 'tech' },
                { id: 'gioi_han_cay_ghep', name: 'Giới Hạn Cấy Ghép', description: 'Khả năng chịu đựng của cơ thể đối với các bộ phận máy móc.', iconName: 'GiSpinalCoil', type: 'PRIMARY', baseValue: 10, group: 'tech' },
                { id: 'tri_tue', name: 'Trí Tuệ', description: 'Khả năng hack, xử lý thông tin và xâm nhập hệ thống.', iconName: 'FaBrain', type: 'PRIMARY', baseValue: 10, group: 'net' },
                { id: 'lanh_lung', name: 'Lạnh Lùng', description: 'Sự bình tĩnh trong giao tranh, ảnh hưởng đến độ chính xác và khả năng chống lại áp lực tâm lý.', iconName: 'GiStoneTower', type: 'PRIMARY', baseValue: 10, group: 'social' },
                { id: 'tieng_tam_duong_pho', name: 'Tiếng Tăm Đường Phố', description: 'Danh tiếng trong thế giới ngầm, ảnh hưởng đến các mối quan hệ và cơ hội.', iconName: 'GiTalk', type: 'PRIMARY', baseValue: 0, group: 'social' },
                { id: 'sinh_menh', name: 'Điểm Bền', description: 'Độ bền của cơ thể. Về 0 sẽ bất tỉnh hoặc chết.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'linh_luc', name: 'Năng Lượng Lõi', description: 'Năng lượng cho các cấy ghép và thiết bị công nghệ.', iconName: 'GiBoltSpellCast', type: 'VITAL', baseValue: 50, group: 'vitals' },
                { id: 'hunger', name: 'Dinh Dưỡng', description: 'Nhu cầu dinh dưỡng của cơ thể.', iconName: 'GiMeal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'thirst', name: 'Nước', description: 'Nhu cầu nước của cơ thể.', iconName: 'GiWaterDrop', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'tuoi_tho', name: 'Tuổi Thọ', description: 'Thời gian sống.', iconName: 'GiHourglass', type: 'VITAL', baseValue: 80, group: 'vitals' },
            ]
        }
    },
    {
        id: 'high_fantasy',
        name: 'Fantasy Cổ Điển',
        description: 'Hệ thống thuộc tính D&D cổ điển, phù hợp cho thế giới anh hùng, phép thuật và rồng.',
        system: {
            groups: [
                { id: 'physical', name: 'Thể Chất', order: 1 },
                { id: 'mental', name: 'Tinh Thần', order: 2 },
                { id: 'social', name: 'Xã Hội', order: 3 },
                { id: 'vitals', name: 'Sinh Tồn', order: 4 },
            ],
            definitions: [
                { id: 'strength', name: 'Sức Mạnh', description: 'Sức mạnh cơ bắp.', iconName: 'GiMuscularTorso', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'dexterity', name: 'Nhanh Nhẹn', description: 'Sự khéo léo, phản xạ.', iconName: 'GiRunningShoe', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'constitution', name: 'Thể Trạng', description: 'Sức bền, sức chịu đựng.', iconName: 'GiHeartTower', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'intelligence', name: 'Trí Tuệ', description: 'Logic, kiến thức, ma pháp học thuật.', iconName: 'FaBrain', type: 'PRIMARY', baseValue: 10, group: 'mental' },
                { id: 'wisdom', name: 'Thông Thái', description: 'Trực giác, nhận thức, ma pháp thần thánh.', iconName: 'GiScrollQuill', type: 'PRIMARY', baseValue: 10, group: 'mental' },
                { id: 'charisma', name: 'Sức Hấp Dẫn', description: 'Khả năng thuyết phục, lãnh đạo.', iconName: 'GiTalk', type: 'PRIMARY', baseValue: 10, group: 'social' },
                { id: 'sinh_menh', name: 'Máu (HP)', description: 'Sức sống. Về 0 sẽ bất tỉnh.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'linh_luc', name: 'Năng Lượng (Mana)', description: 'Năng lượng cho phép thuật, kỹ năng.', iconName: 'GiMagicSwirl', type: 'VITAL', baseValue: 50, group: 'vitals' },
                { id: 'hunger', name: 'Độ No', description: 'Mức độ no bụng.', iconName: 'GiMeal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'thirst', name: 'Độ Khát', description: 'Mức độ đủ nước.', iconName: 'GiWaterDrop', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'tuoi_tho', name: 'Tuổi Thọ', description: 'Thời gian sống.', iconName: 'GiHourglass', type: 'VITAL', baseValue: 80, group: 'vitals' },
            ]
        }
    },
    {
        id: 'lovecraftian',
        name: 'Kinh Dị Lovecraft',
        description: 'Hệ thống thuộc tính tập trung vào sự mong manh của con người khi đối mặt với những kinh hoàng vũ trụ.',
        system: {
            groups: [
                { id: 'physical', name: 'Thể Chất', order: 1 },
                { id: 'mental', name: 'Tinh Thần', order: 2 },
                { id: 'knowledge', name: 'Kiến Thức', order: 3 },
                { id: 'vitals', name: 'Sinh Tồn', order: 4 },
            ],
            definitions: [
                { id: 'suc_ben', name: 'Sức Bền', description: 'Sức mạnh và khả năng chịu đựng thể chất.', iconName: 'GiMuscularTorso', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'nhanh_nhen', name: 'Nhanh Nhẹn', description: 'Sự khéo léo, tốc độ phản ứng.', iconName: 'GiRunningShoe', type: 'PRIMARY', baseValue: 10, group: 'physical' },
                { id: 'y_chi', name: 'Ý Chí', description: 'Sức mạnh tinh thần, khả năng chống lại sự điên rồ.', iconName: 'GiStoneTower', type: 'PRIMARY', baseValue: 10, group: 'mental' },
                { id: 'nhan_thuc', name: 'Nhận Thức', description: 'Khả năng quan sát và phát hiện những điều bất thường.', iconName: 'GiSparklingSabre', type: 'PRIMARY', baseValue: 10, group: 'mental' },
                { id: 'huyen_hoc', name: 'Huyền Học', description: 'Kiến thức về những điều huyền bí và cấm kỵ.', iconName: 'GiBook', type: 'PRIMARY', baseValue: 0, group: 'knowledge' },
                { id: 'may_man', name: 'May Mắn', description: 'Vận may thuần túy, có thể cứu bạn khỏi những tình huống hiểm nghèo.', iconName: 'GiPerspectiveDiceSixFacesRandom', type: 'PRIMARY', baseValue: 10, group: 'knowledge' },
                { id: 'sinh_menh', name: 'Thể Lực', description: 'Sức chịu đựng của cơ thể.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 50, group: 'vitals' },
                { id: 'linh_luc', name: 'Tinh Thần Lực (Sanity)', description: 'Sự tỉnh táo. Về 0 sẽ hoàn toàn điên loạn.', iconName: 'GiSoulVessel', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'hunger', name: 'Độ No', description: 'Mức độ no bụng.', iconName: 'GiMeal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'thirst', name: 'Độ Khát', description: 'Mức độ đủ nước.', iconName: 'GiWaterDrop', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'tuoi_tho', name: 'Tuổi Thọ', description: 'Thời gian sống.', iconName: 'GiHourglass', type: 'VITAL', baseValue: 80, group: 'vitals' },
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
                { id: 'kham_benh', name: 'Y Học', description: 'Khả năng chữa trị vết thương và bệnh tật.', iconName: 'GiHealthNormal', type: 'PRIMARY', baseValue: 10, group: 'survival' },
                { id: 'can_chien', name: 'Cận Chiến', description: 'Kỹ năng sử dụng vũ khí cận chiến.', iconName: 'GiBroadsword', type: 'PRIMARY', baseValue: 10, group: 'combat' },
                { id: 'ban_xa', name: 'Bắn Xa', description: 'Kỹ năng sử dụng vũ khí tầm xa.', iconName: 'GiSparklingSabre', type: 'PRIMARY', baseValue: 10, group: 'combat' },
                { id: 'thuong_luong', name: 'Thương Lượng', description: 'Khả năng mua bán và thuyết phục người khác.', iconName: 'GiTalk', type: 'PRIMARY', baseValue: 10, group: 'social' },
                { id: 'sinh_menh', name: 'Máu', description: 'Sức sống của bạn.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'linh_luc', name: 'Năng Lượng', description: 'Thể lực để thực hiện các hành động nặng.', iconName: 'GiRunningShoe', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'hunger', name: 'Thức Ăn', description: 'Mức độ no.', iconName: 'GiMeal', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'thirst', name: 'Nước Uống', description: 'Mức độ đủ nước.', iconName: 'GiWaterDrop', type: 'VITAL', baseValue: 100, group: 'vitals' },
                { id: 'nhiem_xa', name: 'Nhiễm Xạ', description: 'Mức độ nhiễm phóng xạ trong cơ thể.', iconName: 'FaBiohazard', type: 'VITAL', baseValue: 0, group: 'vitals' },
                { id: 'tuoi_tho', name: 'Tuổi Thọ', description: 'Thời gian sống.', iconName: 'GiHourglass', type: 'VITAL', baseValue: 80, group: 'vitals' },
            ]
        }
    },
    // Add more templates as needed...
];