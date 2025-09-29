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