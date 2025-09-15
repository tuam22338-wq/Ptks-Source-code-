import type { GameSettings, AttributeGroup, InnateTalentRank, PhapBaoRank, StatBonus, GameSpeed, Season, Weather, TimeOfDay, NpcDensity, RealmConfig, SafetyLevel, AIModel, ImageModel, RagEmbeddingModel, LayoutMode, ItemQuality, EquipmentSlot, NarrativeStyle, InnateTalent, Theme, CultivationPath, AlchemyRecipe, FactionReputationStatus, Sect, CaveAbode, CharacterStatus, InventoryItem, DifficultyLevel, SystemShopItem, Element, SpiritualRootQuality } from './types';
import {
  GiCauldron, GiBroadsword,
  GiHealthNormal, GiHourglass, GiMagicSwirl, GiPentacle, GiPerspectiveDiceSixFacesRandom,
  GiRunningShoe, GiScrollQuill, GiSparklingSabre, GiStairsGoal, GiStoneTower, GiYinYang,
  GiSpinalCoil, GiMuscularTorso, GiSoulVessel, GiBoltSpellCast, GiHeartTower, GiScales,
  GiMountainCave, GiDoubleDragon, GiTalk, GiBed, GiSprout, GiStoneBlock, GiHerbsBundle,
  GiGoldBar, GiTreeBranch, GiWaterDrop, GiFire, GiGroundbreaker
} from 'react-icons/gi';
import { FaSun, FaMoon, FaShieldAlt } from 'react-icons/fa';

// Re-export data from the new data directory
export * from './data/factions';
export * from './data/locations';
export * from './data/npcs';
export * from './data/events';
export * from './data/sects';
export * from './data/shops';
export * from './data/recipes';
export * from './data/cultivationPaths';
export * from './data/mainCultivationTechniques';
export * from './data/realmSystem';


export const DEFAULT_WORLD_ID = "phong_than_dien_nghia";
export const CURRENT_GAME_VERSION = "1.0.2";

export const INVENTORY_ACTION_LOG_PREFIX = "[System Note: Trong lúc kiểm tra túi đồ, người chơi đã:\n";

export const SPIRITUAL_ROOT_CONFIG: Record<Element, { name: string, icon: React.ElementType, description: string, baseBonuses: StatBonus[] }> = {
    'Kim': { name: 'Kim', icon: GiGoldBar, description: 'Chủ về sát伐, cương mãnh vô song. Tu sĩ Kim Linh Căn có lực công kích và phòng ngự vật lý vượt trội.', baseBonuses: [{ attribute: 'Lực Lượng', value: 5 }, { attribute: 'Căn Cốt', value: 3 }] },
    'Mộc': { name: 'Mộc', icon: GiTreeBranch, description: 'Chủ về sinh cơ, chữa trị và khống chế. Tu sĩ Mộc Linh Căn có khả năng hồi phục mạnh mẽ và am hiểu thảo dược.', baseBonuses: [{ attribute: 'Sinh Mệnh', value: 20 }, { attribute: 'Ngự Khí Thuật', value: 3 }] },
    'Thủy': { name: 'Thủy', icon: GiWaterDrop, description: 'Chủ về biến hóa, linh hoạt và khống chế. Tu sĩ Thủy Linh Căn có thân pháp nhanh nhẹn và pháp thuật đa dạng.', baseBonuses: [{ attribute: 'Thân Pháp', value: 5 }, { attribute: 'Linh Lực', value: 15 }] },
    'Hỏa': { name: 'Hỏa', icon: GiFire, description: 'Chủ về bùng nổ, hủy diệt. Tu sĩ Hỏa Linh Căn có sát thương pháp thuật cực cao, thiêu đốt vạn vật.', baseBonuses: [{ attribute: 'Linh Lực Sát Thương', value: 5 }, { attribute: 'Nguyên Thần', value: 3 }] },
    'Thổ': { name: 'Thổ', icon: GiGroundbreaker, description: 'Chủ về phòng ngự, vững chắc và bền bỉ. Tu sĩ Thổ Linh Căn có sức phòng ngự và sức bền không gì sánh bằng.', baseBonuses: [{ attribute: 'Bền Bỉ', value: 5 }, { attribute: 'Nguyên Thần Kháng', value: 3 }] },
    'Vô': { name: 'Vô', icon: GiYinYang, description: 'Không có linh căn.', baseBonuses: [] },
    'Dị': { name: 'Dị', icon: GiYinYang, description: 'Linh căn biến dị đặc biệt.', baseBonuses: [] },
    'Hỗn Độn': { name: 'Hỗn Độn', icon: GiYinYang, description: 'Linh căn trong truyền thuyết.', baseBonuses: [] },
};

export const SPIRITUAL_ROOT_QUALITY_CONFIG: Record<SpiritualRootQuality, { color: string, glow?: string, weight: number, multiplier: number }> = {
    'Phàm Căn': { color: 'text-gray-400', weight: 50, multiplier: 0.5 },
    'Linh Căn': { color: 'text-green-400', weight: 30, multiplier: 1.0 },
    'Địa Căn': { color: 'text-blue-400', weight: 15, multiplier: 1.5 },
    'Thiên Căn': { color: 'text-purple-400', weight: 4, multiplier: 2.5 },
    'Thánh Căn': { color: 'text-amber-400', glow: 'talent-saint-glow', weight: 1, multiplier: 4.0 },
};

export const CURRENCY_ITEMS: Omit<InventoryItem, 'quantity'>[] = [
    { id: 'currency_dong', name: 'Đồng', description: 'Tiền tệ cơ bản nhất của phàm nhân.', type: 'Tạp Vật', weight: 0.01, quality: 'Phàm Phẩm', value: 1, icon: '🪙' },
    { id: 'currency_bac', name: 'Bạc', description: 'Tiền tệ phổ biến của phàm nhân.', type: 'Tạp Vật', weight: 0.01, quality: 'Phàm Phẩm', value: 100, icon: '⚪' },
    { id: 'currency_vang', name: 'Vàng', description: 'Tiền tệ quý giá của phàm nhân.', type: 'Tạp Vật', weight: 0.01, quality: 'Phàm Phẩm', value: 10000, icon: '🟡' },
    { id: 'currency_lthp', name: 'Linh thạch hạ phẩm', description: 'Đá chứa linh khí, tiền tệ của tu sĩ.', type: 'Tạp Vật', weight: 0.1, quality: 'Linh Phẩm', value: 10000, icon: '💎' },
];

export const SYSTEM_SHOP_ITEMS: SystemShopItem[] = [
    { id: 'sys_item_stat_boost', name: 'Dịch Cân Tẩy Tủy Dịch', description: 'Một liều thuốc từ thế giới khác, giúp cải thiện toàn bộ thuộc tính cơ bản vĩnh viễn.', cost: 250, effect: { type: 'CHANGE_STAT', details: { attribute: 'all_base', change: 1 } } },
    { id: 'sys_item_qi_boost', name: 'Linh Khí Kết Tinh', description: 'Một khối tinh thể chứa đựng linh khí thuần khiết, giúp tăng mạnh tu vi hiện tại.', cost: 100, effect: { type: 'CHANGE_STAT', details: { attribute: 'spiritualQi', change: 5000 } } },
    { id: 'sys_item_gacha_ticket', name: 'Vé Gacha Vận Mệnh', description: 'Một chiếc vé bí ẩn, có thể rút ra một vật phẩm hoặc kỳ ngộ ngẫu nhiên.', cost: 50, effect: { type: 'START_EVENT', details: { eventId: 'system_gacha' } } },
];

export const CHARACTER_STATUS_CONFIG: Record<CharacterStatus, { label: string; threshold: number; debuffs: StatBonus[]; color: string }> = {
  HEALTHY: { label: 'Khỏe mạnh', threshold: 0.9, debuffs: [], color: 'text-green-400' },
  LIGHTLY_INJURED: { label: 'Bị thương nhẹ', threshold: 0.5, debuffs: [{ attribute: 'Thân Pháp', value: -2 }, { attribute: 'Lực Lượng', value: -2 }], color: 'text-yellow-400' },
  HEAVILY_INJURED: { label: 'Bị thương nặng', threshold: 0.1, debuffs: [{ attribute: 'Thân Pháp', value: -5 }, { attribute: 'Lực Lượng', value: -5 }, { attribute: 'Nguyên Thần', value: -3 }], color: 'text-orange-500' },
  NEAR_DEATH: { label: 'Sắp chết', threshold: 0, debuffs: [{ attribute: 'Thân Pháp', value: -10 }, { attribute: 'Lực Lượng', value: -10 }, { attribute: 'Nguyên Thần', value: -5 }, { attribute: 'Ngộ Tính', value: -5 }], color: 'text-red-600' },
};

export const FACTION_REPUTATION_TIERS: { threshold: number; status: FactionReputationStatus }[] = [
    { threshold: -101, status: 'Kẻ Địch' }, // -100 to -51
    { threshold: -50, status: 'Lạnh Nhạt' }, // -50 to -1
    { threshold: 0, status: 'Trung Lập' }, // 0 to 49
    { threshold: 50, status: 'Thân Thiện' }, // 50 to 99
    { threshold: 100, status: 'Đồng Minh' }, // 100
];

export const COMMUNITY_MODS_URL = 'https://gist.githubusercontent.com/world-class-dev/893c597818788478f7e2c60e34c565c6/raw/phongthan-community-mods.json';

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
    { value: 'theme-blood-moon', label: 'Vong Xuyên Huyết Nguyệt' },
    { value: 'theme-bamboo-forest', label: 'Trúc Lâm U Tịch' },
];

export const DEFAULT_SETTINGS: GameSettings = {
    layoutMode: 'auto',
    gameSpeed: 'normal',
    narrativeStyle: 'classic_wuxia',
    fontFamily: "'Noto Serif', serif",
    theme: 'theme-celestial-light',
    backgroundImage: '',
    zoomLevel: 50,
    textColor: '#d1d5db',
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
    aiResponseWordCount: 2000,
    enableAiSoundSystem: false,
    masterSafetySwitch: false,
    safetyLevels: {
        harassment: 'BLOCK_MEDIUM_AND_ABOVE',
        hateSpeech: 'BLOCK_MEDIUM_AND_ABOVE',
        sexuallyExplicit: 'BLOCK_MEDIUM_AND_ABOVE',
        dangerousContent: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    enablePerformanceMode: false,
    temperature: 1,
    topK: 64,
    topP: 0.95,
    enableThinking: true,
    thinkingBudget: 250,
    enableDeveloperConsole: false,
};

export const AI_MODELS: { value: AIModel; label: string }[] = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
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

export const DIFFICULTY_LEVELS: { id: DifficultyLevel; name: string; description: string; baseStatValue: number; color: string }[] = [
    { id: 'rookie', name: 'Tân Thủ', description: 'Trải nghiệm thư giãn, phù hợp cho người mới làm quen.', baseStatValue: 15, color: 'border-green-500' },
    { id: 'easy', name: 'Dễ', description: 'Thuộc tính khởi đầu cao hơn một chút. Phù hợp cho người mới.', baseStatValue: 12, color: 'border-sky-500' },
    { id: 'medium', name: 'Trung Bình', description: 'Trải nghiệm cân bằng, đúng với ý đồ của trò chơi.', baseStatValue: 10, color: 'border-gray-500' },
    { id: 'hard', name: 'Khó', description: 'Thử thách cao hơn, thuộc tính khởi đầu bị giảm.', baseStatValue: 8, color: 'border-orange-500' },
    { id: 'hell', name: 'Gà Đất Chó Sành', description: 'Thử thách cực đại, khởi đầu như một kẻ tay mơ giữa thế giới tu chân tàn khốc.', baseStatValue: 5, color: 'border-red-600' },
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
    title: 'Tinh (精 - Nhục Thân)',
    attributes: [
      { name: 'Căn Cốt', description: 'Nền tảng cơ thể, ảnh hưởng đến giới hạn Sinh Mệnh, phòng ngự vật lý và tiềm năng thể tu.', value: 10, icon: GiSpinalCoil },
      { name: 'Lực Lượng', description: 'Sức mạnh vật lý, ảnh hưởng đến sát thương cận chiến và khả năng mang vác.', value: 10, icon: GiMuscularTorso },
      { name: 'Thân Pháp', description: 'Sự nhanh nhẹn, tốc độ di chuyển, né tránh và tốc độ ra đòn.', value: 10, icon: GiRunningShoe },
      { name: 'Bền Bỉ', description: 'Khả năng kháng các hiệu ứng bất lợi vật lý (trúng độc, choáng,...).', value: 10, icon: GiHeartTower },
    ],
  },
  {
    title: 'Khí (气 - Chân Nguyên)',
    attributes: [
      { name: 'Linh Căn', description: 'Tư chất tu luyện, quyết định tốc độ hấp thụ linh khí và sự tương thích với công pháp.', value: 'Ngũ Hành Tạp Linh Căn', icon: GiPentacle },
      { name: 'Linh Lực Sát Thương', description: 'Sát thương gây ra bởi pháp thuật và pháp bảo.', value: 10, icon: GiBoltSpellCast },
      { name: 'Chân Nguyên Tinh Thuần', description: 'Độ tinh khiết của linh lực, ảnh hưởng đến uy lực kỹ năng.', value: 10, icon: GiMagicSwirl },
      { name: 'Ngự Khí Thuật', description: 'Độ khéo léo điều khiển linh khí (luyện đan, luyện khí, bố trận).', value: 10, icon: GiCauldron },
    ],
  },
  {
    title: 'Thần (神 - Linh Hồn)',
    attributes: [
      { name: 'Ngộ Tính', description: 'Khả năng lĩnh hội đại đạo, ảnh hưởng tốc độ học công pháp và đột phá.', value: 10, icon: GiScrollQuill },
      { name: 'Nguyên Thần', description: 'Sức mạnh linh hồn, ảnh hưởng đến uy lực thần hồn kỹ và kháng hiệu ứng tinh thần.', value: 10, icon: GiSoulVessel },
      { name: 'Nguyên Thần Kháng', description: 'Khả năng phòng ngự trước các đòn tấn công linh hồn và pháp thuật.', value: 10, icon: FaShieldAlt },
      { name: 'Thần Thức', description: 'Phạm vi và độ rõ nét của giác quan tâm linh, dùng để dò xét, điều khiển pháp bảo.', value: 10, icon: GiSparklingSabre },
      { name: 'Đạo Tâm', description: 'Sự kiên định trên con đường tu luyện, ảnh hưởng khả năng chống lại tâm ma.', value: 10, icon: GiStoneTower },
    ],
  },
  {
    title: 'Ngoại Duyên (外缘 - Yếu Tố Bên Ngoài)',
    attributes: [
      { name: 'Cơ Duyên', description: 'Vận may, khả năng gặp được kỳ ngộ và tìm thấy bảo vật.', value: 10, icon: GiPerspectiveDiceSixFacesRandom },
      { name: 'Mị Lực', description: 'Sức hấp dẫn cá nhân, ảnh hưởng đến thái độ của NPC và giá cả mua bán.', value: 10, icon: GiTalk },
      { name: 'Nhân Quả', description: 'Nghiệp báo từ những hành động đã làm, có thể dẫn đến phúc hoặc họa.', value: 0, icon: GiScales },
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
    { rank: 'Phàm Giai', weight: 90 },
    { rank: 'Siêu Phàm Giai', weight: 50 },
    { rank: 'Sơ Tiên Giai', weight: 30 },
    { rank: 'Trung Tiên Giai', weight: 16 },
    { rank: 'Hậu Tiên Giai', weight: 8 },
    { rank: 'Đại Tiên Giai', weight: 5 },
    { rank: 'Thánh Giai', weight: 1 },
];

export const TALENT_RANK_NAMES: InnateTalentRank[] = INNATE_TALENT_PROBABILITY.map(p => p.rank);

export const INNATE_TALENT_RANKS: Record<InnateTalentRank, { color: string; glow?: string }> = {
    'Phàm Giai': { color: 'text-gray-400' },
    'Siêu Phàm Giai': { color: 'text-green-400' },
    'Sơ Tiên Giai': { color: 'text-blue-400' },
    'Trung Tiên Giai': { color: 'text-purple-400' },
    'Hậu Tiên Giai': { color: 'text-cyan-400' },
    'Đại Tiên Giai': { color: 'text-amber-400' },
    'Thánh Giai': { color: 'text-red-400', glow: 'talent-saint-glow' },
};

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

export const NPC_DENSITY_LEVELS: { id: NpcDensity; name: string; description: string; count: number }[] = [
    { id: 'low', name: 'Thưa Thớt', description: 'Ít NPC, thế giới yên tĩnh.', count: 10 },
    { id: 'medium', name: 'Vừa Phải', description: 'Cân bằng, thế giới sống động.', count: 20 },
    { id: 'high', name: 'Đông Đúc', description: 'Nhiều NPC, thế giới hỗn loạn.', count: 200 },
];
