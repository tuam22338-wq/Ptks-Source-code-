import type { ModWorldData } from '../types';

const KHOI_NGUYEN_MAJOR_EVENTS: ModWorldData['majorEvents'] = [];

const KHOI_NGUYEN_FACTIONS: ModWorldData['factions'] = [
  { name: "Vệ Binh Ánh Sáng", description: "Một trật tự cổ xưa chuyên bảo vệ các di tích và chống lại sự trỗi dậy của bóng tối.", imageUrl: "", },
  { name: "Hội Hắc Ám", description: "Một giáo phái bí ẩn thờ phụng các thực thể cổ xưa, tìm cách giải phóng chúng.", imageUrl: "", },
];

const KHOI_NGUYEN_WORLD_MAP: ModWorldData['initialLocations'] = [
    { id: 'lang_khoi_nguyen', name: 'Làng Khởi Nguyên', description: 'Một ngôi làng nhỏ bình yên nép mình bên một khu rừng già, nơi bắt đầu của nhiều cuộc hành trình.', type: 'Thôn Làng', neighbors: ['rung_thanh_am', 'thanh_hy_vong'], coordinates: { x: 10, y: 10 }, qiConcentration: 10, tags: [] },
    { id: 'rung_thanh_am', name: 'Rừng Thanh Âm', description: 'Một khu rừng rậm rạp, ánh nắng khó lọt qua tán lá, luôn vang vọng những âm thanh kỳ lạ.', type: 'Hoang Dã', neighbors: ['lang_khoi_nguyen', 'hang_vong_am'], coordinates: { x: 9, y: 11 }, qiConcentration: 15, tags: [] },
    { id: 'hang_vong_am', name: 'Hang Vọng Âm', description: 'Một hang động sâu thẳm trong Rừng Thanh Âm, nơi những tiếng vọng dường như kể lại câu chuyện của quá khứ.', type: 'Bí Cảnh', neighbors: ['rung_thanh_am'], coordinates: { x: 8, y: 12 }, qiConcentration: 25, tags: [] },
    { id: 'thanh_hy_vong', name: 'Thành Hy Vọng', description: 'Thành phố lớn gần nhất, một trung tâm thương mại và là pháo đài chống lại các mối đe dọa từ vùng hoang dã.', type: 'Thành Thị', neighbors: ['lang_khoi_nguyen'], coordinates: { x: 12, y: 9 }, qiConcentration: 8, tags: [] },
];

const KHOI_NGUYEN_NPC_LIST: ModWorldData['initialNpcs'] = [
  { id: 'npc_truong_lao_lang', name: 'Trưởng Lão A Mộc', description: 'Một ông lão có mái tóc bạc trắng và ánh mắt hiền từ, luôn cầm một cây gậy gỗ.', origin: 'Trưởng làng của Làng Khởi Nguyên, người nắm giữ nhiều câu chuyện cổ xưa.', personality: 'Chính Trực', status: 'Đang ngồi dưới gốc cây đa đầu làng, trầm ngâm nhìn về phía xa.', locationId: 'lang_khoi_nguyen', faction: '', tags: [] },
  { id: 'npc_tho_san_bi_an', name: 'Linh', description: 'Một nữ thợ săn trẻ tuổi, ánh mắt sắc bén, hành động nhanh nhẹn, thường mang theo một cây cung dài.', origin: 'Một người sống đơn độc trong Rừng Thanh Âm, có mối liên kết kỳ lạ với khu rừng.', personality: 'Trung Lập', status: 'Đang tuần tra trong Rừng Thanh Âm.', locationId: 'rung_thanh_am', faction: '', tags: [] },
];

export const DEFAULT_WORLDS_DATA: ModWorldData[] = [
    {
// @google-genai-fix: Added missing 'id' property required by ModWorldData type.
                id: 'khoi_nguyen_gioi',
        name: 'Khởi Nguyên Giới',
        description: 'Một thế giới khởi đầu đơn giản, là một tấm canvas trắng để bạn bắt đầu viết nên câu chuyện của riêng mình.',
        majorEvents: KHOI_NGUYEN_MAJOR_EVENTS,
        initialNpcs: KHOI_NGUYEN_NPC_LIST,
        initialLocations: KHOI_NGUYEN_WORLD_MAP,
        factions: KHOI_NGUYEN_FACTIONS,
        startingYear: 1,
        eraName: 'Kỷ Nguyên Khởi Nguyên',
    },
];