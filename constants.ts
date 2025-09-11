import type { Faction, GameSettings, AttributeGroup, InnateTalentRank, MajorEvent, PhapBaoRank, StatBonus, GameSpeed, Season, Weather, TimeOfDay, Location, NPC, NpcDensity, RealmConfig, SafetyLevel, AIModel, ImageModel, RagEmbeddingModel, LayoutMode, FullMod, ItemQuality, EquipmentSlot, CultivationTechnique, NarrativeStyle, InnateTalent, Shop, Theme } from './types';
import {
  GiCauldron, GiBroadsword,
  GiHealthNormal, GiHourglass, GiMagicSwirl, GiPentacle, GiPerspectiveDiceSixFacesRandom,
  GiRunningShoe, GiScrollQuill, GiSparklingSabre, GiStairsGoal, GiStoneTower, GiYinYang,
  GiSpinalCoil, GiMuscularTorso, GiSoulVessel, GiBoltSpellCast, GiHeartTower, GiScales
} from 'react-icons/gi';
import { FaSun, FaMoon } from 'react-icons/fa';

export const FACTIONS: Faction[] = [
  {
    name: "Nhà Thương",
    description: "Triều đại đang suy tàn dưới sự trị vì của Trụ Vương, chìm trong xa hoa và bạo ngược, là trung tâm của sự hỗn loạn sắp tới.",
    imageUrl: "https://images.unsplash.com/photo-1583012589241-c471e3cb2d7c?q=80&w=2670&auto=format-fit-crop",
  },
  {
    name: "Xiển Giáo",
    description: "Một trong tam giáo, do Nguyên Thủy Thiên Tôn lãnh đạo, tuân theo thiên mệnh và ủng hộ nhà Chu lật đổ nhà Thương.",
    imageUrl: "https://images.unsplash.com/photo-1627916943231-512614b1b86c?q=80&w=2670&auto=format-fit-crop",
  },
  {
    name: "Triệt Giáo",
    description: "Do Thông Thiên Giáo Chủ đứng đầu, chủ trương 'hữu giáo vô loại', thu nhận vạn vật chúng sinh, đối đầu với Xiển Giáo.",
    imageUrl: "https://images.unsplash.com/photo-1596779350257-259654823FF8?q=80&w=2670&auto=format-fit-crop",
  },
];

export const NARRATIVE_STYLES: { value: NarrativeStyle; label: string }[] = [
    { value: 'classic_wuxia', label: 'Cổ điển Tiên hiệp' },
    { value: 'dark_fantasy', label: 'Huyền huyễn Hắc ám' },
    { value: 'poetic', label: 'Văn phong Thi vị' },
    { value: 'concise', label: 'Súc tích, ngắn gọn' },
];

export const FONT_OPTIONS: { value: string; label: string }[] = [
    { value: "'Noto Serif', serif", label: 'Noto Serif (Mặc định)' },
    { value: "'Cormorant Garamond', serif", label: 'Cormorant Garamond' },
    { value: "'ZCOOL XiaoWei', serif", label: 'ZCOOL XiaoWei' },
    { value: "'Ma Shan Zheng', cursive", label: 'Ma Shan Zheng' },
];

export const THEME_OPTIONS: { value: Theme; label: string }[] = [
    { value: 'theme-amber', label: 'Hổ Phách (Mặc định)' },
    { value: 'theme-jade-green', label: 'Bích Ngọc' },
    { value: 'theme-amethyst-purple', label: 'Tử Tinh' },
    { value: 'theme-celestial-light', label: 'Thiên Quang' },
];

export const DEFAULT_SETTINGS: GameSettings = {
    layoutMode: 'auto',
    gameSpeed: 'normal',
    narrativeStyle: 'classic_wuxia',
    fontFamily: "'Noto Serif', serif",
    theme: 'theme-amber',
    mainTaskModel: 'gemini-2.5-flash',
    quickSupportModel: 'gemini-2.5-flash',
    itemAnalysisModel: 'gemini-2.5-flash',
    itemCraftingModel: 'gemini-2.5-flash',
    soundSystemModel: 'gemini-2.5-flash',
    actionAnalysisModel: 'gemini-2.5-flash',
    gameMasterModel: 'gemini-2.5-flash',
    npcSimulationModel: 'gemini-2.5-flash',
    imageGenerationModel: 'imagen-4.0-generate-001',
    ragSummaryModel: 'gemini-2.5-flash',
    ragSourceIdModel: 'gemini-2.5-flash',
    ragEmbeddingModel: 'text-embedding-004',
    autoSummaryFrequency: 5,
    ragTopK: 5,
    historyTokenLimit: 8192,
    summarizeBeforePruning: true,
    itemsPerPage: 10,
    enableAiSoundSystem: false,
    masterSafetySwitch: false,
    safetyLevels: {
        harassment: 'BLOCK_MEDIUM_AND_ABOVE',
        hateSpeech: 'BLOCK_MEDIUM_AND_ABOVE',
        sexuallyExplicit: 'BLOCK_MEDIUM_AND_ABOVE',
        dangerousContent: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    apiKey: '',
    apiKeys: [],
    useKeyRotation: false,
};

export const AI_MODELS: { value: AIModel; label: string }[] = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
    { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite (Nhanh)' },
];
export const IMAGE_AI_MODELS: { value: ImageModel; label: string }[] = [
    { value: 'imagen-4.0-generate-001', label: 'Imagen 4.0 Generate' },
];
export const RAG_EMBEDDING_MODELS: { value: RagEmbeddingModel; label: string }[] = [
    { value: 'text-embedding-004', label: 'text-embedding-004' },
];
export const SAFETY_LEVELS: { value: SafetyLevel; label: string }[] = [
    { value: 'HARM_BLOCK_THRESHOLD_UNSPECIFIED', label: 'Không xác định' },
    { value: 'BLOCK_LOW_AND_ABOVE', label: 'Chặn Thấp và Cao hơn' },
    { value: 'BLOCK_MEDIUM_AND_ABOVE', label: 'Chặn Trung bình và Cao hơn' },
    { value: 'BLOCK_ONLY_HIGH', label: 'Chỉ chặn Mức cao' },
    { value: 'BLOCK_NONE', label: 'Không chặn' },
];

export const LAYOUT_MODES: { value: LayoutMode; label: string }[] = [
    { value: 'auto', label: 'Tự động' },
    { value: 'desktop', label: 'Máy tính' },
    { value: 'mobile', label: 'Di động' },
];

export const GAME_SPEEDS: { value: GameSpeed; label: string }[] = [
    { value: 'very_slow', label: 'Rất chậm' },
    { value: 'slow', label: 'Chậm' },
    { value: 'normal', label: 'Bình thường' },
    { value: 'fast', label: 'Nhanh' },
    { value: 'very_fast', label: 'Rất nhanh' },
];

export const SAFETY_CATEGORIES = [
    { id: 'harassment', name: 'Quấy rối' },
    { id: 'hateSpeech', name: 'Ngôn từ kích động thù địch' },
    { id: 'sexuallyExplicit', name: 'Nội dung khiêu dâm' },
    { id: 'dangerousContent', name: 'Nội dung nguy hiểm' },
];

export const PERSONALITY_TRAITS = [
  { name: 'Trung Lập', description: 'Hành động theo lý trí, không thiên vị phe phái nào.' },
  { name: 'Chính Trực', description: 'Luôn đứng về phía lẽ phải, bảo vệ kẻ yếu, tuân theo đạo nghĩa.' },
  { name: 'Hỗn Loạn', description: 'Hành động khó lường, tùy theo cảm xúc và lợi ích nhất thời.' },
  { name: 'Tà Ác', description: 'Không từ thủ đoạn để đạt được mục đích, coi thường sinh mạng.' },
];

export const ATTRIBUTES_CONFIG: AttributeGroup[] = [
  {
    title: 'Thuộc tính Cơ Bản',
    attributes: [
      { name: 'Lực Lượng', description: 'Sức mạnh vật lý, ảnh hưởng đến sát thương cận chiến.', value: 10, icon: GiMuscularTorso },
      { name: 'Thân Pháp', description: 'Sự nhanh nhẹn, né tránh và tốc độ ra đòn.', value: 10, icon: GiRunningShoe },
      { name: 'Nhục Thân', description: 'Độ bền bỉ của cơ thể, ảnh hưởng đến sinh mệnh và phòng ngự.', value: 10, icon: GiSpinalCoil },
      { name: 'Nguyên Thần', description: 'Sức mạnh tinh thần, ảnh hưởng đến uy lực pháp thuật và kháng phép.', value: 10, icon: GiSoulVessel },
      { name: 'Cảm Ngộ', description: 'Khả năng lĩnh hội thiên địa đại đạo, ảnh hưởng đến tốc độ tu luyện và học công pháp.', value: 10, icon: GiScrollQuill },
      { name: 'Cơ Duyên', description: 'Vận may, khả năng gặp được kỳ ngộ và tìm thấy bảo vật.', value: 10, icon: GiPerspectiveDiceSixFacesRandom },
    ],
  },
  {
    title: 'Thuộc tính Nâng Cao',
    attributes: [
      { name: 'Kiếm Pháp', description: 'Độ thông thạo khi sử dụng kiếm.', value: 0, icon: GiSparklingSabre },
      { name: 'Đan Thuật', description: 'Kỹ năng luyện đan, ảnh hưởng đến chất lượng và thành công khi luyện dược.', value: 0, icon: GiCauldron },
      { name: 'Trận Pháp', description: 'Hiểu biết về các loại trận pháp, từ phòng thủ đến tấn công.', value: 0, icon: GiPentacle },
      { name: 'Tiên Lực', description: 'Sát thương gây ra bởi pháp thuật và pháp bảo.', value: 0, icon: GiBoltSpellCast },
      { name: 'Phòng Ngự', description: 'Khả năng chống đỡ sát thương vật lý và phép thuật.', value: 0, icon: GiHeartTower },
       { name: 'May Mắn', description: 'Ảnh hưởng đến các sự kiện ngẫu nhiên và tỉ lệ rơi đồ.', value: 0, icon: GiYinYang },
    ],
  },
   {
    title: 'Chỉ số Sinh Tồn',
    attributes: [
      { name: 'Sinh Mệnh', description: 'Thể lực của nhân vật. Về 0 sẽ tử vong.', value: 100, icon: GiHealthNormal },
      { name: 'Linh Lực', description: 'Năng lượng để thi triển pháp thuật và kỹ năng.', value: 50, icon: GiMagicSwirl },
    ],
  },
  {
    title: 'Thông Tin Tu Luyện',
    attributes: [
      { name: 'Cảnh Giới', description: 'Cấp độ tu vi hiện tại.', value: 'Phàm Nhân', icon: GiStairsGoal },
      { name: 'Tuổi Thọ', description: 'Thời gian sống còn lại.', value: 80, icon: GiHourglass },
       { name: 'Đạo Tâm', description: 'Sự kiên định trên con đường tu tiên, ảnh hưởng đến khả năng chống lại tâm ma.', value: 10, icon: GiStoneTower },
       { name: 'Nhân Quả', description: 'Nghiệp báo từ những hành động đã làm, có thể dẫn đến phúc hoặc họa.', value: 0, icon: GiScales },
    ],
  },
  {
    title: 'Thiên Hướng',
    attributes: [
      { name: 'Chính Đạo', description: 'Danh tiếng trong chính đạo. Càng cao càng được phe chính phái yêu mến, nhưng bị ma đạo căm ghét.', value: 0, icon: FaSun },
      { name: 'Ma Đạo', description: 'Uy danh trong ma đạo. Càng cao càng được ma tu kính sợ, nhưng bị chính đạo truy lùng.', value: 0, icon: FaMoon },
    ],
  },
];
export const ALL_ATTRIBUTES = ATTRIBUTES_CONFIG.flatMap(g => g.attributes.map(a => a.name));


export const INNATE_TALENT_PROBABILITY: { rank: InnateTalentRank, weight: number }[] = [
    { rank: 'Phàm Tư', weight: 40 },
    { rank: 'Tiểu Tư', weight: 30 },
    { rank: 'Đại Tư', weight: 15 },
    { rank: 'Siêu Tư', weight: 10 },
    { rank: 'Thiên Tư', weight: 5 },
];

export const TALENT_RANK_NAMES: InnateTalentRank[] = INNATE_TALENT_PROBABILITY.map(p => p.rank);

export const INNATE_TALENT_RANKS: Record<InnateTalentRank, { color: string }> = {
    'Phàm Tư': { color: 'text-gray-400' },
    'Tiểu Tư': { color: 'text-green-400' },
    'Đại Tư': { color: 'text-blue-400' },
    'Siêu Tư': { color: 'text-purple-400' },
    'Thiên Tư': { color: 'text-amber-400' },
};

export const MAJOR_EVENTS: MajorEvent[] = [
  {
    year: 1,
    title: "Trụ Vương Đề Thơ Cung Nữ Oa",
    location: "Miếu Nữ Oa, Triều Ca",
    involvedParties: "Trụ Vương, Nữ Oa Nương Nương",
    summary: "Trong lần đến miếu Nữ Oa dâng hương, Trụ Vương vì say mê sắc đẹp của tượng thần mà đã đề một bài thơ bất kính, ngụ ý khinh nhờn.",
    consequences: "Nữ Oa Nương Nương nổi giận, quyết định gieo mầm tai họa cho nhà Thương. Bà triệu hồi Tam Yêu tại Hiên Viên Mộ, ra lệnh cho chúng trà trộn vào cung cấm để mê hoặc Trụ Vương, làm cho cơ nghiệp nhà Thương sụp đổ, gieo mầm mống cho đại kiếp Phong Thần."
  },
  {
    year: 5,
    title: "Tô Hộ Phản Trụ",
    location: "Ký Châu",
    involvedParties: "Tô Hộ, Trụ Vương, Sùng Hầu Hổ",
    summary: "Ký Châu hầu Tô Hộ bị yêu cầu phải dâng con gái là Tô Đát Kỷ cho Trụ Vương. Coi đây là một sự sỉ nhục, Tô Hộ đã viết thơ phản nghịch ngay tại cổng thành, quyết không tuân lệnh.",
    consequences: "Trụ Vương tức giận, cử Sùng Hầu Hổ đem quân đi chinh phạt Ký Châu. Cuộc chiến này dẫn đến việc Tô Hộ thất bại và buộc phải dâng con gái, tạo cơ hội cho Hồ Ly Tinh chiếm đoạt thân xác Đát Kỷ."
  },
  {
    year: 7,
    title: "Đát Kỷ Nhập Cung",
    location: "Triều Ca",
    involvedParties: "Cửu Vỹ Hồ (trong thân xác Đát Kỷ), Trụ Vương",
    summary: "Trên đường dâng đến Triều Ca, Tô Đát Kỷ thật đã bị Cửu Vỹ Hồ Ly Tinh (Hồ Ly Tinh ngàn năm) phụng mệnh Nữ Oa chiếm đoạt thân xác. Hồ Ly Tinh tiến cung và nhanh chóng mê hoặc Trụ Vương bằng sắc đẹp tuyệt trần.",
    consequences: "Triều chính nhà Thương bắt đầu một chuỗi ngày đen tối. Đát Kỷ xúi giục Trụ Vương làm những việc tàn bạo như xây Lộc Đài, thiêu Bào Lạc, giết hại trung thần, khiến lòng dân oán thán, đẩy nhanh sự sụp đổ của triều đại."
  },
  {
    year: 20,
    title: "Cơ Xương Thoát Nạn",
    location: "Dũ Lý, Triều Ca",
    involvedParties: "Tây Bá Hầu Cơ Xương (sau là Chu Văn Vương), Trụ Vương",
    summary: "Bị Trụ Vương nghi kỵ và giam cầm ở Dũ Lý suốt 7 năm, Cơ Xương đã nhẫn nhục chịu đựng, âm thầm diễn giải Bát Quái thành 64 quẻ. Các con trai và bề tôi của ông đã phải dâng mỹ nữ và bảo vật để chuộc ông ra.",
    consequences: "Sau khi được thả về, Cơ Xương quyết tâm chiêu hiền đãi sĩ, tìm kiếm nhân tài để lật đổ nhà Thương. Ông đã tìm được Khương Tử Nha, đặt nền móng vững chắc cho cuộc phạt Trụ của con trai ông là Cơ Phát (Chu Vũ Vương) sau này."
  },
  {
    year: 25,
    title: "Khương Tử Nha Xuống Núi",
    location: "Núi Côn Lôn, Sông Vị Thủy",
    involvedParties: "Khương Tử Nha, Nguyên Thủy Thiên Tôn, Cơ Xương",
    summary: "Khương Tử Nha, đệ tử của Nguyên Thủy Thiên Tôn tại Xiển Giáo, tu đạo đến năm 72 tuổi vẫn chưa thành tiên. Ông phụng mệnh sư phụ xuống núi để phò Chu diệt Thương, hoàn thành đại nghiệp Phong Thần.",
    consequences: "Khương Tử Nha đến bờ sông Vị Thủy buông câu, chờ đợi minh chủ. Cơ Xương tìm đến và phong ông làm thừa tướng, giao cho trọng trách quân sự. Điều này chính thức khởi động cuộc chiến giữa Chu và Thương, đồng thời mở ra màn chủ trì Phong Thần Bảng của Khương Tử Nha."
  },
];


export const PHAP_BAO_RANKS: Record<PhapBaoRank, { color: string }> = {
    'Phàm Giai': { color: 'text-gray-400' },
    'Tiểu Giai': { color: 'text-green-400' },
    'Trung Giai': { color: 'text-blue-400' },
    'Cao Giai': { color: 'text-purple-400' },
    'Siêu Giai': { color: 'text-cyan-400' },
    'Địa Giai': { color: 'text-amber-400' },
    'Thiên Giai': { color: 'text-red-400' },
    'Thánh Giai': { color: 'text-yellow-300' },
};

export const ITEM_QUALITY_STYLES: Record<ItemQuality, { color: string }> = {
    'Phàm Phẩm': { color: 'text-gray-300' },
    'Linh Phẩm': { color: 'text-green-400' },
    'Pháp Phẩm': { color: 'text-blue-400' },
    'Bảo Phẩm': { color: 'text-purple-400' },
    'Tiên Phẩm': { color: 'text-amber-400' },
    'Tuyệt Phẩm': { color: 'text-red-400' },
};

export const EQUIPMENT_SLOTS: Record<EquipmentSlot, { label: string }> = {
    'Vũ Khí': { label: 'Vũ Khí' },
    'Thượng Y': { label: 'Thượng Y' },
    'Hạ Y': { label: 'Hạ Y' },
    'Giày': { label: 'Giày' },
    'Phụ Kiện 1': { label: 'Phụ Kiện 1' },
    'Phụ Kiện 2': { label: 'Phụ Kiện 2' },
};


export const SHICHEN_LIST: { name: string; icon: string }[] = [
    { name: 'Tý', icon: '🐭' }, { name: 'Sửu', icon: '🐮' }, { name: 'Dần', icon: '🐯' }, { name: 'Mão', icon: '🐰' },
    { name: 'Thìn', icon: '🐲' }, { name: 'Tỵ', icon: '🐍' }, { name: 'Ngọ', icon: '🐴' }, { name: 'Mùi', icon: '🐑' },
    { name: 'Thân', icon: '🐵' }, { name: 'Dậu', icon: '🐔' }, { name: 'Tuất', icon: '🐶' }, { name: 'Hợi', icon: '🐷' },
];

export const TIMEOFDAY_DETAILS: Record<string, { name: TimeOfDay, icon: string }> = {
    'Tý': { name: 'Nửa Đêm', icon: '🌙' }, 'Sửu': { name: 'Nửa Đêm', icon: '🌙' },
    'Dần': { name: 'Sáng Sớm', icon: '🌅' }, 'Mão': { name: 'Sáng Sớm', icon: '🌅' },
    'Thìn': { name: 'Buổi Sáng', icon: '🏙️' }, 'Tỵ': { name: 'Buổi Sáng', icon: '🏙️' },
    'Ngọ': { name: 'Buổi Trưa', icon: '☀️' }, 'Mùi': { name: 'Buổi Trưa', icon: '☀️' },
    'Thân': { name: 'Buổi Chiều', icon: '🌤️' }, 'Dậu': { name: 'Hoàng Hôn', icon: '🌇' },
    'Tuất': { name: 'Buổi Tối', icon: '🌃' }, 'Hợi': { name: 'Buổi Tối', icon: '🌃' },
};

export const WEATHER_INFO: Record<Weather, { name: string; icon: string }> = {
    'SUNNY': { name: 'Trời Quang', icon: '☀️' },
    'CLOUDY': { name: 'Nhiều Mây', icon: '☁️' },
    'RAIN': { name: 'Mưa', icon: '🌧️' },
    'STORM': { name: 'Bão Tố', icon: '⛈️' },
    'SNOW': { name: 'Tuyết Rơi', icon: '❄️' },
};

export const SEASON_ICONS: Record<Season, string> = { 'Xuân': '🌸', 'Hạ': '☀️', 'Thu': '🍂', 'Đông': '❄️' };

export const WORLD_MAP: Location[] = [
    { id: 'thanh_ha_tran', name: 'Thanh Hà Trấn', description: 'Một trấn nhỏ yên bình nằm bên cạnh con sông lớn, là nơi giao thương của các thôn làng lân cận.', type: 'Thôn Làng', neighbors: ['rung_co_thu', 'song_vi_thuy'], coordinates: { x: 5, y: 5 } },
    { id: 'rung_co_thu', name: 'Rừng Cổ Thụ', description: 'Một khu rừng rậm rạp với những cây cổ thụ cao chọc trời, là nơi trú ngụ của nhiều yêu thú cấp thấp.', type: 'Hoang Dã', neighbors: ['thanh_ha_tran', 'hac_long_dam', 'thanh_loan_son'], isExplorable: true, coordinates: { x: 4, y: 6 } },
    { id: 'hac_long_dam', name: 'Hắc Long Đàm', description: 'Một hồ nước sâu không thấy đáy, quanh năm bao phủ bởi sương mù, tương truyền có giao long ẩn náu.', type: 'Bí Cảnh', neighbors: ['rung_co_thu'], coordinates: { x: 3, y: 8 } },
    { id: 'song_vi_thuy', name: 'Sông Vị Thủy', description: 'Một con sông lớn chảy xiết, nghe đồn Khương Tử Nha từng buông câu tại đây.', type: 'Hoang Dã', neighbors: ['thanh_ha_tran', 'trieu_ca'], coordinates: { x: 7, y: 5 } },
    { id: 'trieu_ca', name: 'Triều Ca', description: 'Kinh đô của nhà Thương, phồn hoa và tráng lệ, nhưng ẩn chứa nhiều âm mưu và nguy hiểm.', type: 'Thành Thị', neighbors: ['song_vi_thuy', 'tam_son_quan'], coordinates: { x: 12, y: 5 } },
    { id: 'tam_son_quan', name: 'Tam Sơn Quan', description: 'Cửa ải quân sự trọng yếu của nhà Thương, canh gác con đường tiến vào kinh đô.', type: 'Quan Ải', neighbors: ['trieu_ca', 'dong_hai'], coordinates: { x: 15, y: 7 } },
    { id: 'dong_hai', name: 'Đông Hải', description: 'Vùng biển rộng lớn phía đông, là địa bàn của Long Tộc. Sóng to gió lớn, cực kỳ nguy hiểm.', type: 'Hoang Dã', neighbors: ['tam_son_quan', 'dao_ngao_binh'], coordinates: { x: 20, y: 8 } },
    { id: 'dao_ngao_binh', name: 'Đảo Ngao Binh', description: 'Một hòn đảo nhỏ ở Đông Hải, là tiền đồn của Long Cung.', type: 'Bí Cảnh', neighbors: ['dong_hai'], coordinates: { x: 22, y: 10 } },
    { id: 'thanh_loan_son', name: 'Thanh Loan Sơn', description: 'Ngọn núi linh thiêng, quanh năm có mây mù bao phủ, là nơi tu luyện của các tán tu.', type: 'Sơn Mạch', neighbors: ['rung_co_thu'], coordinates: { x: 2, y: 3 } },
];

export const REALM_SYSTEM: RealmConfig[] = [
    { 
        id: 'pham_nhan', name: 'Phàm Nhân', 
        description: 'Điểm khởi đầu của vạn vật, thân thể yếu đuối, chưa có linh lực, tuổi thọ hữu hạn.',
        stages: [
            { id: 'pn_1', name: '', qiRequired: 0, bonuses: [], description: 'Sinh mệnh bình thường, không có khả năng đặc biệt.' },
        ]
    },
    { 
        id: 'luyen_khi', name: 'Luyện Khí Kỳ',
        description: 'Bước đầu tiên trên con đường tu tiên, dẫn khí vào cơ thể, tẩy kinh phạt tủy, dần dần thoát ly khỏi thân xác phàm tục. Tuổi thọ tăng nhẹ.',
        stages: [
            { id: 'lk_1', name: 'Tầng 1-3 (Sơ Kỳ)', qiRequired: 500, bonuses: [{ attribute: 'Sinh Mệnh', value: 20 }, { attribute: 'Linh Lực', value: 40 }], description: 'Cảm nhận được linh khí, có thể sử dụng các pháp thuật đơn giản.' },
            { id: 'lk_4', name: 'Tầng 4-6 (Trung Kỳ)', qiRequired: 4000, bonuses: [{ attribute: 'Sinh Mệnh', value: 30 }, { attribute: 'Linh Lực', value: 60 }], description: 'Linh lực trong cơ thể dồi dào hơn, có thể điều khiển các pháp khí cấp thấp.' },
            { id: 'lk_7', name: 'Tầng 7-9 (Hậu Kỳ)', qiRequired: 32000, bonuses: [{ attribute: 'Sinh Mệnh', value: 50 }, { attribute: 'Linh Lực', value: 100 }], description: 'Linh lực ngưng tụ, chuẩn bị cho việc Trúc Cơ.' },
            { id: 'lk_dz', name: 'Viên Mãn', qiRequired: 65000, bonuses: [{ attribute: 'Tuổi Thọ', value: 20 }, { attribute: 'Nguyên Thần', value: 5 }], description: 'Đạt tới đỉnh cao của Luyện Khí, có thể thử đột phá Trúc Cơ.' },
        ]
    },
    { 
        id: 'truc_co', name: 'Trúc Cơ Kỳ', 
        description: 'Xây dựng nền tảng (Đạo Cơ) cho con đường tu luyện sau này. Linh lực chuyển hóa thành chân nguyên, sức mạnh tăng vọt, tuổi thọ đạt 200 năm.',
        hasTribulation: true, 
        stages: [
            { id: 'tc_1', name: 'Sơ Kỳ', qiRequired: 100000, bonuses: [{ attribute: 'Nhục Thân', value: 10 }, { attribute: 'Nguyên Thần', value: 10 }], description: 'Đạo cơ hình thành, thần thức có thể xuất ra ngoài.' },
            { id: 'tc_2', name: 'Trung Kỳ', qiRequired: 250000, bonuses: [{ attribute: 'Nhục Thân', value: 10 }, { attribute: 'Nguyên Thần', value: 10 }], description: 'Đạo cơ vững chắc, có thể bắt đầu ngự vật phi hành.' },
            { id: 'tc_3', name: 'Hậu Kỳ', qiRequired: 500000, bonuses: [{ attribute: 'Nhục Thân', value: 15 }, { attribute: 'Nguyên Thần', value: 15 }, { attribute: 'Tuổi Thọ', value: 50 }], description: 'Chân nguyên hùng hậu, chuẩn bị ngưng tụ Kim Đan.' },
        ]
    },
    {
        id: 'ket_dan', name: 'Kết Đan Kỳ',
        description: 'Ngưng tụ toàn bộ chân nguyên trong cơ thể thành một viên Kim Đan. Một khi thành công, tu sĩ sẽ chính thức bước vào hàng ngũ cao thủ, tuổi thọ tăng lên 500 năm.',
        stages: [
            { id: 'kd_1', name: 'Sơ Kỳ', qiRequired: 1500000, bonuses: [{ attribute: 'Tiên Lực', value: 20 }, { attribute: 'Phòng Ngự', value: 20 }], description: 'Kim đan sơ thành, có thể sử dụng Đan hỏa.'},
            { id: 'kd_2', name: 'Trung Kỳ', qiRequired: 4000000, bonuses: [{ attribute: 'Tiên Lực', value: 25 }, { attribute: 'Phòng Ngự', value: 25 }], description: 'Kim đan ổn định, uy lực pháp thuật tăng mạnh.'},
            { id: 'kd_3', name: 'Hậu Kỳ', qiRequired: 10000000, bonuses: [{ attribute: 'Tiên Lực', value: 30 }, { attribute: 'Phòng Ngự', value: 30 }, { attribute: 'Tuổi Thọ', value: 150 }], description: 'Kim đan viên mãn, chuẩn bị cho việc phá đan thành anh.'},
        ]
    },
    {
        id: 'nguyen_anh', name: 'Nguyên Anh Kỳ',
        description: 'Phá vỡ Kim Đan, thai nghén ra một "Nguyên Anh" - một tiểu nhân giống hệt bản thân và chứa đựng toàn bộ tinh, khí, thần. Nguyên Anh có thể xuất khiếu, ngao du thái hư. Tuổi thọ đạt 1000 năm.',
        hasTribulation: true,
        stages: [
            { id: 'na_1', name: 'Sơ Kỳ', qiRequired: 50000000, bonuses: [{ attribute: 'Nguyên Thần', value: 50 }, { attribute: 'Cảm Ngộ', value: 20 }], description: 'Nguyên Anh được sinh ra, có thể đoạt xá trùng sinh.' },
            { id: 'na_2', name: 'Trung Kỳ', qiRequired: 150000000, bonuses: [{ attribute: 'Nguyên Thần', value: 50 }, { attribute: 'Cảm Ngộ', value: 20 }], description: 'Nguyên Anh lớn mạnh, có thể thi triển các thần thông mạnh mẽ.'},
            { id: 'na_3', name: 'Hậu Kỳ', qiRequired: 400000000, bonuses: [{ attribute: 'Nguyên Thần', value: 60 }, { attribute: 'Cảm Ngộ', value: 30 }, { attribute: 'Tuổi Thọ', value: 300 }], description: 'Nguyên Anh và nhục thân hợp nhất, chuẩn bị cho Hóa Thần.'},
        ]
    },
    {
        id: 'hoa_than', name: 'Hóa Thần Kỳ',
        description: 'Nguyên Anh và nhục thân hoàn toàn dung hợp, lĩnh ngộ được một phần法则之力 của thiên địa. Tu sĩ Hóa Thần có thể di chuyển trong hư không, thần thông quảng đại, tuổi thọ trên 2000 năm.',
        stages: [
            { id: 'ht_1', name: 'Sơ Kỳ', qiRequired: 1000000000, bonuses: [{ attribute: 'Thân Pháp', value: 50 }, { attribute: 'Lực Lượng', value: 50 }], description: 'Sơ bộ nắm giữ pháp tắc không gian, có thể thuấn di.'},
            { id: 'ht_2', name: 'Trung Kỳ', qiRequired: 3000000000, bonuses: [{ attribute: 'Thân Pháp', value: 60 }, { attribute: 'Lực Lượng', value: 60 }], description: 'Lĩnh ngộ sâu hơn về pháp tắc, có thể tạo ra lĩnh vực của riêng mình.' },
            { id: 'ht_3', name: 'Hậu Kỳ', qiRequired: 8000000000, bonuses: [{ attribute: 'Thân Pháp', value: 70 }, { attribute: 'Lực Lượng', value: 70 }, { attribute: 'Tuổi Thọ', value: 1000 }], description: 'Đỉnh cao Hóa Thần, chuẩn bị phi thăng.'},
        ]
    }
];

export const NPC_LIST: NPC[] = [
    { 
        id: 'npc_khuong_tu_nha', 
        name: 'Khương Tử Nha', 
        status: 'Đang câu cá bên bờ sông Vị Thủy, vẻ mặt trầm tư.', 
        description: 'Một lão ông râu tóc bạc phơ, mặc áo vải, trông có vẻ bình thường nhưng ánh mắt lại ẩn chứa sự thông tuệ phi phàm.', 
        origin: 'Đệ tử của Nguyên Thủy Thiên Tôn, phái Xiển Giáo.', 
        personality: 'Chính Trực', 
        talents: [
            { name: 'Thiên Mệnh Chi Tử', rank: 'Thiên Tư', description: 'Người được thiên mệnh lựa chọn để hoàn thành đại nghiệp Phong Thần.', effect: 'Cơ Duyên cực cao, dễ dàng gặp được kỳ ngộ và người tài. Luôn có thể tìm ra một con đường sống trong tuyệt cảnh.', bonuses: [{ attribute: 'Cơ Duyên', value: 20 }] },
            { name: 'Đại Trí Nhược Ngu', rank: 'Siêu Tư', description: 'Trí tuệ vĩ đại ẩn sau vẻ ngoài bình thường.', effect: 'Ẩn giấu khí tức, người khác khó có thể nhìn thấu tu vi thật sự. Khả năng lĩnh ngộ và hoạch định chiến lược vượt xa người thường.', bonuses: [{ attribute: 'Cảm Ngộ', value: 15 }] }
        ], 
        locationId: 'song_vi_thuy',
        ChinhDao: 100,
        MaDao: 0,
        TienLuc: 500,
        PhongNgu: 300,
        SinhMenh: 1000,
    },
    { 
        id: 'npc_na_tra', 
        name: 'Na Tra', 
        status: 'Đang gây náo loạn ở Đông Hải, chân đạp Phong Hỏa Luân, tay cầm Hỏa Tiêm Thương.', 
        description: 'Một thiếu niên khôi ngô, tuấn tú nhưng ánh mắt đầy vẻ ngang tàng, kiêu ngạo. Toàn thân khoác hồng lụa, khí thế bức người.', 
        origin: 'Linh Châu Tử chuyển thế, con trai thứ ba của Lý Tịnh.', 
        personality: 'Hỗn Loạn', 
        talents: [
            { name: 'Liên Hoa Hóa Thân', rank: 'Thiên Tư', description: 'Thân thể được tái tạo từ hoa sen, miễn nhiễm với phần lớn độc tố và ma khí.', effect: 'Kháng độc và kháng ma thuật cực cao. Có thể tái sinh một lần sau khi tử vong.', bonuses: [{ attribute: 'Nhục Thân', value: 20 }] },
            { name: 'Tam Đầu Lục Tí', rank: 'Siêu Tư', description: 'Thần thông hiển hóa ba đầu sáu tay, chiến lực tăng vọt.', effect: 'Khi chiến đấu có thể tấn công nhiều mục tiêu hoặc sử dụng nhiều pháp bảo cùng lúc.', bonuses: [{ attribute: 'Thân Pháp', value: 15 }] }
        ], 
        locationId: 'dong_hai',
        ChinhDao: 20,
        MaDao: 30,
        TienLuc: 800,
        PhongNgu: 600,
        SinhMenh: 2000,
    },
];

export const NPC_DENSITY_LEVELS: { id: NpcDensity; name: string; description: string; count: number }[] = [
    { id: 'low', name: 'Thấp', description: 'Thế giới ít người, chủ yếu là hoang dã.', count: 10 },
    { id: 'medium', name: 'Vừa', description: 'Cân bằng giữa thành thị và hoang dã.', count: 20 },
    { id: 'high', name: 'Cao', description: 'Thế giới đông đúc, náo nhiệt.', count: 35 },
];

export const INITIAL_TECHNIQUES: CultivationTechnique[] = [
    { id: 'tech_linh_dan_thuat', name: 'Linh Đạn Thuật', description: 'Ngưng tụ linh khí thành một viên đạn nhỏ tấn công mục tiêu.', type: 'Linh Kỹ', cost: { type: 'Linh Lực', value: 5 }, cooldown: 0, effectDescription: 'Gây sát thương Tiên Lực cơ bản.', rank: 'Phàm Giai', icon: '💧' },
    { id: 'tech_ngu_phong_thuat', name: 'Ngự Phong Thuật', description: 'Sử dụng linh khí để gia tăng tốc độ, giúp di chuyển nhanh hơn.', type: 'Độn Thuật', cost: { type: 'Linh Lực', value: 10 }, cooldown: 2, effectDescription: 'Tăng Thân Pháp trong một khoảng thời gian ngắn.', rank: 'Phàm Giai', icon: '💨' },
];

export const PREMADE_MODS: FullMod[] = [
    {
        modInfo: {
            id: 'than_binh_loi_khi_v1',
            name: 'Thần Binh Lợi Khí',
            author: 'GameMaster AI',
            description: 'Bổ sung 5 món vũ khí và pháp bảo huyền thoại vào thế giới Phong Thần.',
            version: '1.0.0',
        },
        content: {
            items: [
                { name: 'Phiên Thiên Ấn', description: 'Pháp bảo của Quảng Thành Tử, có sức mạnh lật trời, cực kỳ nặng.', type: 'Pháp Bảo', quality: 'Tiên Phẩm', weight: 10, bonuses: [{ attribute: 'Lực Lượng', value: 15 }, { attribute: 'Tiên Lực', value: 20 }], tags: ['vũ khí', 'pháp bảo', 'xiển giáo'] },
                { name: 'Tru Tiên Kiếm', description: 'Một trong Tứ Tiên Kiếm của Triệt Giáo, sát khí ngút trời, phi Thánh nhân không thể địch.', type: 'Vũ Khí', quality: 'Tuyệt Phẩm', weight: 5, bonuses: [{ attribute: 'Kiếm Pháp', value: 25 }, { attribute: 'Tiên Lực', value: 30 }], tags: ['vũ khí', 'kiếm', 'triệt giáo'], slot: 'Vũ Khí' },
                // ... more items
            ]
        }
    }
];

export const SHOPS: Shop[] = [
    {
        id: 'thien_co_cac',
        name: 'Thiên Cơ Các',
        description: 'Nơi bán đủ loại kỳ trân dị bảo, chỉ cần bạn có đủ linh thạch.',
        inventory: [
            { name: 'Hồi Lực Đan', description: 'Viên đan dược giúp hồi phục 100 Linh Lực.', type: 'Đan Dược', icon: '💊', weight: 0.1, quality: 'Linh Phẩm', price: { currency: 'Linh thạch hạ phẩm', amount: 50 }, stock: 10 },
            { name: 'Trúc Cơ Đan', description: 'Tăng 20% tỷ lệ thành công khi đột phá Trúc Cơ.', type: 'Đan Dược', icon: '🌟', weight: 0.1, quality: 'Pháp Phẩm', price: { currency: 'Linh thạch hạ phẩm', amount: 500 }, stock: 1 },
            { name: 'Huyền Thiết Trọng Kiếm', description: 'Một thanh trọng kiếm làm từ huyền thiết, uy lực kinh người.', type: 'Vũ Khí', icon: '🗡️', bonuses: [{ attribute: 'Lực Lượng', value: 5 }, { attribute: 'Tiên Lực', value: 10 }], weight: 15.0, quality: 'Linh Phẩm', slot: 'Vũ Khí', price: { currency: 'Linh thạch hạ phẩm', amount: 350 }, stock: 1 },
            { name: 'Ngự Phong Chu', description: 'Một chiếc thuyền nhỏ có thể ngự không phi hành, tăng tốc độ di chuyển giữa các địa điểm.', type: 'Pháp Bảo', rank: 'Trung Giai', icon: '⛵', weight: 5.0, quality: 'Bảo Phẩm', price: { currency: 'Linh thạch hạ phẩm', amount: 1200 }, stock: 1 },
            { name: 'Bản đồ Sơn Hà Xã Tắc (Mảnh vỡ)', description: 'Một mảnh vỡ của bản đồ cổ, ẩn chứa bí mật động trời.', type: 'Tạp Vật', icon: '🗺️', weight: 0.1, quality: 'Tiên Phẩm', price: { currency: 'Bạc', amount: 10000 }, stock: 'infinite' },
        ]
    }
];