import type { AttributeDefinition, AttributeGroupDefinition } from '../types';

export const DEFAULT_ATTRIBUTE_GROUPS: AttributeGroupDefinition[] = [
    { id: 'physical', name: 'Tinh (精 - Nhục Thân)', order: 1 },
    { id: 'essence', name: 'Khí (气 - Chân Nguyên)', order: 2 },
    { id: 'spirit', name: 'Thần (神 - Linh Hồn)', order: 3 },
    { id: 'external', name: 'Ngoại Duyên (外缘 - Yếu Tố Bên Ngoài)', order: 4 },
    { id: 'vitals', name: 'Chỉ số Sinh Tồn', order: 5 },
    { id: 'cultivation', name: 'Thông Tin Tu Luyện', order: 6 },
    { id: 'alignment', name: 'Thiên Hướng', order: 7 },
];

export const DEFAULT_ATTRIBUTE_DEFINITIONS: AttributeDefinition[] = [
    // Physical Group
    { id: 'can_cot', name: 'Căn Cốt', description: 'Nền tảng cơ thể, ảnh hưởng đến giới hạn Sinh Mệnh, phòng ngự vật lý và tiềm năng thể tu.', iconName: 'GiSpinalCoil', type: 'PRIMARY', baseValue: 10, group: 'physical' },
    { id: 'luc_luong', name: 'Lực Lượng', description: 'Sức mạnh vật lý, ảnh hưởng đến sát thương cận chiến và khả năng mang vác.', iconName: 'GiMuscularTorso', type: 'PRIMARY', baseValue: 10, group: 'physical' },
    { id: 'than_phap', name: 'Thân Pháp', description: 'Sự nhanh nhẹn, tốc độ di chuyển, né tránh và tốc độ ra đòn.', iconName: 'GiRunningShoe', type: 'PRIMARY', baseValue: 10, group: 'physical' },
    { id: 'ben_bi', name: 'Bền Bỉ', description: 'Khả năng kháng các hiệu ứng bất lợi vật lý (trúng độc, choáng,...).', iconName: 'GiHeartTower', type: 'PRIMARY', baseValue: 10, group: 'physical' },
    { id: 'physical_damage', name: 'Sát Thương Vật Lý', description: 'Sát thương vật lý cơ bản gây ra trong chiến đấu. Tính bằng: (Lực Lượng * 2) + (Thân Pháp * 0.5)', iconName: 'GiBroadsword', type: 'SECONDARY', formula: '(luc_luong * 2) + (than_phap * 0.5)', group: 'physical' },

    // Essence Group
    { id: 'linh_can', name: 'Linh Căn', description: 'Tư chất tu luyện, quyết định tốc độ hấp thụ linh khí và sự tương thích với công pháp.', iconName: 'GiPentacle', type: 'INFORMATIONAL', group: 'essence' },
    { id: 'linh_luc_sat_thuong', name: 'Linh Lực Sát Thương', description: 'Sát thương gây ra bởi pháp thuật và pháp bảo.', iconName: 'GiBoltSpellCast', type: 'PRIMARY', baseValue: 10, group: 'essence' },
    { id: 'chan_nguyen_tinh_thuan', name: 'Chân Nguyên Tinh Thuần', description: 'Độ tinh khiết của linh lực, ảnh hưởng đến uy lực kỹ năng.', iconName: 'GiMagicSwirl', type: 'PRIMARY', baseValue: 10, group: 'essence' },
    { id: 'ngu_khi_thuat', name: 'Ngự Khí Thuật', description: 'Độ khéo léo điều khiển linh khí (luyện đan, luyện khí, bố trận).', iconName: 'GiCauldron', type: 'PRIMARY', baseValue: 10, group: 'essence' },

    // Spirit Group
    { id: 'ngo_tinh', name: 'Ngộ Tính', description: 'Khả năng lĩnh hội đại đạo, ảnh hưởng tốc độ học công pháp và đột phá.', iconName: 'GiScrollQuill', type: 'PRIMARY', baseValue: 10, group: 'spirit' },
    { id: 'nguyen_than', name: 'Nguyên Thần', description: 'Sức mạnh linh hồn, ảnh hưởng đến uy lực thần hồn kỹ và kháng hiệu ứng tinh thần.', iconName: 'GiSoulVessel', type: 'PRIMARY', baseValue: 10, group: 'spirit' },
    { id: 'nguyen_than_khang', name: 'Nguyên Thần Kháng', description: 'Khả năng phòng ngự trước các đòn tấn công linh hồn và pháp thuật.', iconName: 'FaShieldAlt', type: 'PRIMARY', baseValue: 10, group: 'spirit' },
    { id: 'than_thuc', name: 'Thần Thức', description: 'Phạm vi và độ rõ nét của giác quan tâm linh, dùng để dò xét, điều khiển pháp bảo.', iconName: 'GiSparklingSabre', type: 'PRIMARY', baseValue: 10, group: 'spirit' },
    { id: 'dao_tam', name: 'Đạo Tâm', description: 'Sự kiên định trên con đường tu luyện, ảnh hưởng khả năng chống lại tâm ma.', iconName: 'GiStoneTower', type: 'PRIMARY', baseValue: 10, group: 'spirit' },
    
    // External Group
    { id: 'co_duyen', name: 'Cơ Duyên', description: 'Vận may, khả năng gặp được kỳ ngộ và tìm thấy bảo vật.', iconName: 'GiPerspectiveDiceSixFacesRandom', type: 'PRIMARY', baseValue: 10, group: 'external' },
    { id: 'mi_luc', name: 'Mị Lực', description: 'Sức hấp dẫn cá nhân, ảnh hưởng đến thái độ của NPC và giá cả mua bán.', iconName: 'GiTalk', type: 'PRIMARY', baseValue: 10, group: 'external' },
    { id: 'nhan_qua', name: 'Nhân Quả', description: 'Nghiệp báo từ những hành động đã làm, có thể dẫn đến phúc hoặc họa.', iconName: 'GiScales', type: 'PRIMARY', baseValue: 0, group: 'external' },

    // Vitals Group
    { id: 'sinh_menh', name: 'Sinh Mệnh', description: 'Thể lực của nhân vật. Về 0 sẽ tử vong.', iconName: 'GiHealthNormal', type: 'VITAL', baseValue: 100, group: 'vitals' },
    { id: 'linh_luc', name: 'Linh Lực', description: 'Năng lượng để thi triển pháp thuật và kỹ năng.', iconName: 'GiMagicSwirl', type: 'VITAL', baseValue: 50, group: 'vitals' },
    { id: 'hunger', name: 'Độ No', description: 'Mức độ no bụng của nhân vật. Về 0 sẽ bắt đầu bị đói.', iconName: 'GiMeal', type: 'VITAL', baseValue: 100, group: 'vitals' },
    { id: 'thirst', name: 'Độ Khát', description: 'Mức độ đủ nước của nhân vật. Về 0 sẽ bắt đầu bị khát.', iconName: 'GiWaterDrop', type: 'VITAL', baseValue: 100, group: 'vitals' },

    // Cultivation Group
    { id: 'canh_gioi', name: 'Cảnh Giới', description: 'Cấp độ tu vi hiện tại.', iconName: 'GiStairsGoal', type: 'INFORMATIONAL', group: 'cultivation' },
    { id: 'tuoi_tho', name: 'Tuổi Thọ', description: 'Thời gian sống còn lại.', iconName: 'GiHourglass', type: 'VITAL', baseValue: 80, group: 'cultivation' },

    // Alignment Group
    { id: 'chinh_dao', name: 'Chính Đạo', description: 'Danh tiếng trong chính đạo. Càng cao càng được phe chính phái yêu mến, nhưng bị ma đạo căm ghét.', iconName: 'FaSun', type: 'PRIMARY', baseValue: 0, group: 'alignment' },
    { id: 'ma_dao', name: 'Ma Đạo', description: 'Uy danh trong ma đạo. Càng cao càng được ma tu kính sợ, nhưng bị chính đạo truy lùng.', iconName: 'FaMoon', type: 'PRIMARY', baseValue: 0, group: 'alignment' },
];