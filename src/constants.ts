
import type { GameSettings, InnateTalentRank, PhapBaoRank, StatBonus, GameSpeed, Season, Weather, TimeOfDay, NpcDensity, RealmConfig, SafetyLevel, AIModel, ImageModel, RagEmbeddingModel, LayoutMode, ItemQuality, EquipmentSlot, NarrativeStyle, InnateTalent, Theme, CultivationPath, AlchemyRecipe, FactionReputationStatus, Sect, CaveAbode, CharacterStatus, InventoryItem, DifficultyLevel, SystemShopItem, Element, SpiritualRootQuality, AttributeDefinition, WorldlyBackground, TransmigratorLegacy } from './types';
import { UI_ICONS } from './data/uiIcons';

// Re-export non-world-specific data
export * from './data/sects';
export * from './data/shops';
export * from './data/recipes';
export * from './data/cultivationPaths';
export * from './data/realmSystem';
export * from './data/cave';
export * from './data/attributes';
export * from './data/uiIcons';

// Explicitly import and re-export world-specific data for clarity
import { PT_FACTIONS, PT_FACTION_NAMES, JTTW_FACTIONS, JTTW_FACTION_NAMES } from './data/factions';
import { PT_WORLD_MAP, JTTW_WORLD_MAP } from './data/locations';
import { PT_NPC_LIST, JTTW_NPC_LIST } from './data/npcs';
import { PT_MAJOR_EVENTS, JTTW_MAJOR_EVENTS } from './data/events';
import { DEFAULT_ATTRIBUTE_DEFINITIONS } from './data/attributes';

export {
    PT_FACTIONS, PT_FACTION_NAMES, JTTW_FACTIONS, JTTW_FACTION_NAMES,
    PT_WORLD_MAP, JTTW_WORLD_MAP,
    PT_NPC_LIST, JTTW_NPC_LIST,
    PT_MAJOR_EVENTS, JTTW_MAJOR_EVENTS
};


export const DEFAULT_WORLD_ID = "phong_than_dien_nghia";
export const CURRENT_GAME_VERSION = "1.0.10";

export const INVENTORY_ACTION_LOG_PREFIX = "[System Note: Trong lúc kiểm tra túi đồ, người chơi đã:\n";

// --- NEW CHARACTER CREATION DATA ---
export const WORLDLY_BACKGROUNDS: WorldlyBackground[] = [
    {
        id: 'noble_child',
        name: 'Con Cháu Dòng Dõi Quý Tộc',
        description: 'Sinh ra trong nhung lụa, bạn có khởi đầu thuận lợi về tiền bạc và các mối quan hệ, nhưng cũng dễ vướng vào tranh đấu gia tộc.',
        bonuses: [{ attribute: 'Mị Lực', value: 5 }, { attribute: 'Ngộ Tính', value: 2 }],
        startingItems: [
            { name: 'Ngọc Bội Gia Truyền', quantity: 1, description: 'Một miếng ngọc bội tinh xảo, có thể là vật tín.', type: 'Tạp Vật', quality: 'Bảo Phẩm', icon: '💎' },
        ],
    },
    {
        id: 'street_orphan',
        name: 'Cô Nhi Đầu Đường',
        description: 'Lớn lên trong sự thiếu thốn và hiểm nguy, bạn không có gì ngoài sự lanh lợi và ý chí sinh tồn mãnh liệt.',
        bonuses: [{ attribute: 'Thân Pháp', value: 5 }, { attribute: 'Bền Bỉ', value: 2 }],
        startingItems: [],
    },
    {
        id: 'library_disciple',
        name: 'Đệ Tử Thư Viện',
        description: 'Dành cả tuổi thơ đắm mình trong sách vở, bạn có kiến thức uyên bác và khả năng lĩnh ngộ vượt trội.',
        bonuses: [{ attribute: 'Ngộ Tính', value: 5 }, { attribute: 'Đạo Tâm', value: 2 }],
        startingItems: [
            { name: 'Sách Cổ Rách Nát', quantity: 1, description: 'Một cuốn sách cũ ghi lại những câu chuyện kỳ dị, có thể ẩn chứa bí mật.', type: 'Tạp Vật', quality: 'Phàm Phẩm', icon: '📖' },
        ],
    },
    {
        id: 'mountain_hunter',
        name: 'Thợ Săn Vùng Sơn Cước',
        description: 'Lớn lên giữa núi rừng hoang dã, bạn thông thạo địa hình và có kỹ năng sinh tồn tuyệt vời.',
        bonuses: [{ attribute: 'Lực Lượng', value: 3 }, { attribute: 'Thân Pháp', value: 3 }, { attribute: 'Căn Cốt', value: 2 }],
        startingItems: [
            { name: 'Cung Gỗ Thô', quantity: 1, description: 'Một cây cung săn đơn giản nhưng hiệu quả.', type: 'Vũ Khí', quality: 'Phàm Phẩm', icon: '🏹' },
        ],
    }
];

export const TRANSMIGRATOR_LEGACIES: TransmigratorLegacy[] = [
    {
        id: 'system_user',
        name: 'Kiến Thức Dị Giới (Hệ Thống)',
        description: 'Bạn mang theo một "Hệ Thống" bí ẩn, cung cấp nhiệm vụ, cửa hàng điểm thưởng và khả năng phân tích độc nhất.',
        bonuses: [{ attribute: 'Ngộ Tính', value: 5 }],
        isSystemUser: true,
    },
    {
        id: 'engraved_skill',
        name: 'Kỹ Năng Khắc Sâu',
        description: 'Một kỹ năng từ kiếp trước đã khắc sâu vào linh hồn bạn, một kiến thức không thuộc về thế giới này.',
        bonuses: [{ attribute: 'Ngự Khí Thuật', value: 10 }],
        isSystemUser: false,
    }
];
// --- END NEW CHARACTER CREATION DATA ---


export const SPIRITUAL_ROOT_CONFIG: Record<Element, { name: string, iconName: string, description: string, baseBonuses: StatBonus[] }> = {
    'Kim': { name: 'Kim', iconName: 'GiGoldBar', description: 'Chủ về sát伐, cương mãnh vô song. Tu sĩ Kim Linh Căn có lực công kích và phòng ngự vật lý vượt trội.', baseBonuses: [{ attribute: 'Lực Lượng', value: 5 }, { attribute: 'Căn Cốt', value: 3 }] },
    'Mộc': { name: 'Mộc', iconName: 'GiTreeBranch', description: 'Chủ về sinh cơ, chữa trị và khống chế. Tu sĩ Mộc Linh Căn có khả năng hồi phục mạnh mẽ và am hiểu thảo dược.', baseBonuses: [{ attribute: 'Sinh Mệnh', value: 20 }, { attribute: 'Ngự Khí Thuật', value: 3 }] },
    'Thủy': { name: 'Thủy', iconName: 'GiWaterDrop', description: 'Chủ về biến hóa, linh hoạt và khống chế. Tu sĩ Thủy Linh Căn có thân pháp nhanh nhẹn và pháp thuật đa dạng.', baseBonuses: [{ attribute: 'Thân Pháp', value: 5 }, { attribute: 'Linh Lực', value: 15 }] },
    'Hỏa': { name: 'Hỏa', iconName: 'GiFire', description: 'Chủ về bùng nổ, hủy diệt. Tu sĩ Hỏa Linh Căn có sát thương pháp thuật cực cao, thiêu đốt vạn vật.', baseBonuses: [{ attribute: 'Linh Lực Sát Thương', value: 5 }, { attribute: 'Nguyên Thần', value: 3 }] },
    'Thổ': { name: 'Thổ', iconName: 'GiGroundbreaker', description: 'Chủ về phòng ngự, vững chắc và bền bỉ. Tu sĩ Thổ Linh Căn có sức phòng ngự và sức bền không gì sánh bằng.', baseBonuses: [{ attribute: 'Bền Bỉ', value: 5 }, { attribute: 'Nguyên Thần Kháng', value: 3 }] },
    'Vô': { name: 'Vô', iconName: 'GiYinYang', description: 'Không có linh căn.', baseBonuses: [] },
    'Dị': { name: 'Dị', iconName: 'GiYinYang', description: 'Linh căn biến dị đặc biệt.', baseBonuses: [] },
    'Hỗn Độn': { name: 'Hỗn Độn', iconName: 'GiYinYang', description: 'Linh căn trong truyền thuyết.', baseBonuses: [] },
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
    { value: 'theme-bamboo-forest', label: 'Trúc Lâm U Tịch' },
];

export const DEFAULT_SETTINGS: GameSettings = {
    layoutMode: 'auto',
    gameSpeed: 'normal',
    narrativeStyle: 'classic_wuxia',
    fontFamily: "'Noto Serif', serif",
    theme: 'theme-bamboo-forest',
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
    dataParsingModel: 'gemini-2.5-flash',
    imageGenerationModel: 'imagen-4.0-generate-001',
    ragSummaryModel: 'gemini-2.5-flash',
    ragSourceIdModel: 'gemini-2.5-flash',
    ragEmbeddingModel: 'text-embedding-004',
    memorySynthesisModel: 'gemini-2.5-flash',
    autoSummaryFrequency: 5,
    ragTopK: 5,
    historyTokenLimit: 8192,
    summarizeBeforePruning: true,
    itemsPerPage: 10,
    aiResponseWordCount: 2000,
    enableAiSoundSystem: false,
    masterSafetySwitch: true,
    enableNsfwMode: false,
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
    apiKeys: [],
    modelApiKeyAssignments: {},
    enableDeveloperConsole: false,
    backgroundMusicUrl: '',
    backgroundMusicName: '',
    backgroundMusicVolume: 0.5,
    enableTTS: false,
    ttsVoiceURI: '',
    ttsRate: 1,
    ttsPitch: 1,
    ttsVolume: 1,
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

export const ALL_ATTRIBUTES = DEFAULT_ATTRIBUTE_DEFINITIONS.map(a => a.name);

export const ALL_PARSABLE_STATS = [...DEFAULT_ATTRIBUTE_DEFINITIONS.map(a => a.id), 'spiritualQi', 'hunger', 'thirst', 'temperature'];


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

export const EQUIPMENT_SLOT_ICONS: Record<EquipmentSlot, string> = {
    'Vũ Khí': 'GiBroadsword',
    'Thượng Y': 'GiChestArmor',
    'Hạ Y': 'GiLegArmor',
    'Giày': 'GiBoots',
    'Phụ Kiện 1': 'GiRing',
    'Phụ Kiện 2': 'GiNecklace',
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

export const DEFAULT_WORLDS_INFO = {
    phong_than_dien_nghia: {
        id: 'phong_than_dien_nghia',
        name: 'Phong Thần Diễn Nghĩa',
        description: 'Thế giới nguyên bản của Tam Thiên Thế Giới, dựa trên bối cảnh Phong Thần Diễn Nghĩa với các sự kiện và nhân vật quen thuộc.',
        author: 'Nhà phát triển',
        majorEvents: PT_MAJOR_EVENTS,
        source: 'default' as const,
    },
    tay_du_ky: {
        id: 'tay_du_ky',
        name: 'Tây Du Ký',
        description: 'Hành trình đến Tây Thiên thỉnh kinh của bốn thầy trò Đường Tăng, vượt qua 81 kiếp nạn, đối đầu với vô số yêu ma quỷ quái.',
        author: 'Nhà phát triển',
        majorEvents: JTTW_MAJOR_EVENTS,
        source: 'default' as const,
    }
};

// Constants for Mechanical Filter (Pillar 3)
export const RANK_ORDER: PhapBaoRank[] = ['Phàm Giai', 'Tiểu Giai', 'Trung Giai', 'Cao Giai', 'Siêu Giai', 'Địa Giai', 'Thiên Giai', 'Thánh Giai'];
export const QUALITY_ORDER: ItemQuality[] = ['Phàm Phẩm', 'Linh Phẩm', 'Pháp Phẩm', 'Bảo Phẩm', 'Tiên Phẩm', 'Tuyệt Phẩm'];

export const REALM_RANK_CAPS: Record<string, { maxRank: PhapBaoRank, maxQuality: ItemQuality }> = {
    'pham_nhan': { maxRank: 'Phàm Giai', maxQuality: 'Phàm Phẩm' },
    'luyen_khi': { maxRank: 'Phàm Giai', maxQuality: 'Phàm Phẩm' },
    'truc_co': { maxRank: 'Tiểu Giai', maxQuality: 'Linh Phẩm' },
    'ket_dan': { maxRank: 'Trung Giai', maxQuality: 'Pháp Phẩm' },
    'nguyen_anh': { maxRank: 'Cao Giai', maxQuality: 'Bảo Phẩm' },
    'hoa_than': { maxRank: 'Siêu Giai', maxQuality: 'Tiên Phẩm' },
    'luyen_hu': { maxRank: 'Địa Giai', maxQuality: 'Tuyệt Phẩm' },
    'hop_the': { maxRank: 'Thiên Giai', maxQuality: 'Tuyệt Phẩm' },
    'dai_thua': { maxRank: 'Thánh Giai', maxQuality: 'Tuyệt Phẩm' },
    // Immortal realms have no caps
};
