import type { Faction, GameSettings, AttributeGroup, InnateTalentRank, MajorEvent, PhapBaoRank, StatBonus, GameSpeed, Season, Weather, TimeOfDay, Location, NPC, NpcDensity, RealmConfig, SafetyLevel, AIModel, ImageModel, RagEmbeddingModel, LayoutMode, FullMod, ItemQuality, EquipmentSlot, CultivationTechnique, NarrativeStyle, InnateTalent, Shop, Theme, CultivationPath, AlchemyRecipe } from './types';
import {
  GiCauldron, GiBroadsword,
  GiHealthNormal, GiHourglass, GiMagicSwirl, GiPentacle, GiPerspectiveDiceSixFacesRandom,
  GiRunningShoe, GiScrollQuill, GiSparklingSabre, GiStairsGoal, GiStoneTower, GiYinYang,
  GiSpinalCoil, GiMuscularTorso, GiSoulVessel, GiBoltSpellCast, GiHeartTower, GiScales
} from 'react-icons/gi';
import { FaSun, FaMoon } from 'react-icons/fa';

export const CURRENT_GAME_VERSION = "1.1.0";

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

// URL for the community mod manifest. Using a Gist is a great way to host this.
// For this example, it points to a sample manifest.
export const COMMUNITY_MODS_URL = 'https://gist.githubusercontent.com/anonymous/832128e932a3a0e6b52865917b2b3563/raw/phongthan-community-mods.json';

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
    enablePerformanceMode: true,
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
    year: 10,
    title: "Na Tra Náo Hải",
    location: "Trần Đường Quan, Đông Hải",
    involvedParties: "Na Tra, Ngao Bính (Tam thái tử Đông Hải), Lý Tịnh",
    summary: "Na Tra, vốn là Linh Châu Tử chuyển thế, nghịch ngợm dùng Càn Khôn Quyển và Hỗn Thiên Lăng làm chấn động Đông Hải Long Cung. Tam thái tử Ngao Bính lên bờ hỏi tội, bị Na Tra đánh chết, rút cả gân rồng.",
    consequences: "Đông Hải Long Vương Ngao Quảng nổi giận, dâng nước lên Trần Đường Quan, dọa dâng tấu lên Thiên Đình. Để cứu dân chúng, Na Tra lóc xương trả cha, lóc thịt trả mẹ. Sau được Thái Ất Chân Nhân dùng hoa sen tái tạo lại thân thể, trở nên mạnh mẽ hơn."
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
   {
    year: 28,
    title: "Dương Tiễn Phách Sơn Cứu Mẫu",
    location: "Đào Sơn",
    involvedParties: "Dương Tiễn, Vân Hoa Tiên Tử (Dao Cơ)",
    summary: "Dương Tiễn, con trai của Dương Thiên Hựu và em gái Ngọc Đế là Vân Hoa Tiên Tử, sau khi học thành tài nghệ từ Ngọc Đỉnh Chân Nhân, đã dùng rìu khai sơn để chẻ đôi Đào Sơn, cứu mẹ mình bị Ngọc Đế giam cầm.",
    consequences: "Hành động này thể hiện sức mạnh và lòng hiếu thảo của Dương Tiễn, khiến ông nổi danh tam giới. Sau sự việc, ông trở thành một trong những chiến tướng đắc lực nhất của phe Xiển Giáo, phò trợ Khương Tử Nha."
  },
    {
    year: 30,
    title: "Văn Trọng Phạt Tây Kỳ",
    location: "Tây Kỳ",
    involvedParties: "Thái sư Văn Trọng, Khương Tử Nha, quân đội Thương và Chu",
    summary: "Sau khi dẹp yên các cuộc nổi loạn ở Bắc Hải, Thái sư Văn Trọng trở về Triều Ca và nhận thấy sự suy đồi của triều đình. Ông tức giận và quyết định thân chinh dẫn đại quân chinh phạt Tây Kỳ để diệt trừ hậu họa.",
    consequences: "Mở đầu cho một loạt các trận chiến lớn giữa hai phe. Văn Trọng mời nhiều kỳ nhân dị sĩ của Triệt Giáo tới trợ giúp, khiến cho cuộc chiến trở nên vô cùng khốc liệt, nhiều tiên nhân của cả hai giáo đều bị cuốn vào vòng xoáy đại kiếp."
  },
  {
    year: 32,
    title: "Thập Tuyệt Trận",
    location: "Phía ngoài thành Tây Kỳ",
    involvedParties: "Thập Thiên Quân (Triệt Giáo), Xiển Giáo Thập Nhị Kim Tiên",
    summary: "Thập Thiên Quân của Triệt Giáo đã bày ra mười trận pháp vô cùng lợi hại, mỗi trận mang một sức mạnh hủy diệt khác nhau, gây ra tổn thất nặng nề cho quân Chu và các đệ tử Xiển Giáo.",
    consequences: "Để phá Thập Tuyệt Trận, Xiển Giáo đã phải nhờ đến các đại tiên, thậm chí cả Nguyên Thủy Thiên Tôn và Lão Tử cũng phải ra tay. Nhiều đạo hữu của Triệt Giáo đã phải lên Phong Thần Bảng trong trận chiến này, làm sâu sắc thêm mâu thuẫn giữa hai giáo."
  },
  {
    year: 35,
    title: "Võ Vương Phạt Trụ",
    location: "Từ Tây Kỳ đến Triều Ca",
    involvedParties: "Cơ Phát (Chu Võ Vương), Khương Tử Nha, Trụ Vương",
    summary: "Sau khi Chu Văn Vương qua đời, con trai là Cơ Phát lên ngôi, tức Chu Võ Vương. Ông cùng Khương Tử Nha và các chư hầu chính thức khởi binh phạt Trụ, tiến về kinh đô Triều Ca.",
    consequences: "Cuộc chiến cuối cùng giữa hai triều đại bùng nổ. Quân Chu vượt qua nhiều cửa ải, chiến đấu với vô số tướng lĩnh và dị nhân trung thành với nhà Thương, từng bước tiến tới sự sụp đổ của Trụ Vương."
  },
  {
    year: 36,
    title: "Vạn Tiên Trận",
    location: "Gần Giới Bài Quan",
    involvedParties: "Thông Thiên Giáo Chủ, Lão Tử, Nguyên Thủy Thiên Tôn, Tiếp Dẫn, Chuẩn Đề",
    summary: "Sau nhiều thất bại, Thông Thiên Giáo Chủ tức giận bày ra Vạn Tiên Trận, quy tụ hàng vạn tiên nhân của Triệt Giáo để quyết một trận sống mái với Xiển Giáo.",
    consequences: "Đây là trận chiến lớn nhất và bi thảm nhất trong đại kiếp Phong Thần. Tứ Thánh (Lão Tử, Nguyên Thủy, Tiếp Dẫn, Chuẩn Đề) cùng nhau ra tay phá trận. Vạn Tiên Trận bị phá, Triệt Giáo tổn thất nặng nề, Thông Thiên Giáo Chủ bại trận, gần như toàn bộ đệ tử của ông đều phải lên Phong Thần Bảng hoặc bị bắt đi Tây Phương."
  }
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
    { id: 'song_vi_thuy', name: 'Sông Vị Thủy', description: 'Một con sông lớn chảy xiết, nghe đồn Khương Tử Nha từng buông câu tại đây.', type: 'Hoang Dã', neighbors: ['thanh_ha_tran', 'trieu_ca', 'tay_ky'], coordinates: { x: 7, y: 5 } },
    { id: 'trieu_ca', name: 'Triều Ca', description: 'Kinh đô của nhà Thương, phồn hoa và tráng lệ, nhưng ẩn chứa nhiều âm mưu và nguy hiểm.', type: 'Thành Thị', neighbors: ['song_vi_thuy', 'tam_son_quan'], coordinates: { x: 12, y: 5 } },
    { id: 'tam_son_quan', name: 'Tam Sơn Quan', description: 'Cửa ải quân sự trọng yếu của nhà Thương, canh gác con đường tiến vào kinh đô.', type: 'Quan Ải', neighbors: ['trieu_ca', 'dong_hai'], coordinates: { x: 15, y: 7 } },
    { id: 'dong_hai', name: 'Đông Hải', description: 'Vùng biển rộng lớn phía đông, là địa bàn của Long Tộc. Sóng to gió lớn, cực kỳ nguy hiểm.', type: 'Hoang Dã', neighbors: ['tam_son_quan', 'dao_ngao_binh', 'tran_duong_quan'], coordinates: { x: 20, y: 8 } },
    { id: 'dao_ngao_binh', name: 'Đảo Ngao Binh', description: 'Một hòn đảo nhỏ ở Đông Hải, là tiền đồn của Long Cung.', type: 'Bí Cảnh', neighbors: ['dong_hai'], coordinates: { x: 22, y: 10 } },
    { id: 'thanh_loan_son', name: 'Thanh Loan Sơn', description: 'Ngọn núi linh thiêng, quanh năm có mây mù bao phủ, là nơi tu luyện của các tán tu.', type: 'Sơn Mạch', neighbors: ['rung_co_thu', 'con_lon_son'], coordinates: { x: 2, y: 3 } },
    { id: 'tay_ky', name: 'Tây Kỳ', description: 'Kinh đô của nhà Chu, nơi Cơ Xương cai quản. Đất đai trù phú, lòng dân quy thuận, đang chiêu hiền đãi sĩ.', type: 'Thành Thị', neighbors: ['song_vi_thuy'], coordinates: { x: 8, y: 2 } },
    { id: 'con_lon_son', name: 'Côn Lôn Sơn', description: 'Dãy núi tổ của vạn sơn, là đạo trường của Xiển Giáo do Nguyên Thủy Thiên Tôn đứng đầu. Linh khí nồng đậm, tiên cảnh ngút ngàn.', type: 'Thánh Địa', neighbors: ['thanh_loan_son'], coordinates: { x: 1, y: 1 } },
    { id: 'tran_duong_quan', name: 'Trần Đường Quan', description: 'Một cửa ải do Lý Tịnh trấn giữ, nằm gần Đông Hải.', type: 'Quan Ải', neighbors: ['dong_hai'], coordinates: { x: 18, y: 6 } },
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
            { id: 'ht_3', name: 'Hậu Kỳ', qiRequired: 8000000000, bonuses: [{ attribute: 'Thân Pháp', value: 70 }, { attribute: 'Lực Lượng', value: 70 }, { attribute: 'Tuổi Thọ', value: 1000 }], description: 'Hoàn toàn nắm giữ pháp tắc, chuẩn bị phi thăng.'},
        ]
    },
    {
        id: 'luyen_hu', name: 'Luyện Hư Kỳ',
        description: 'Luyện hóa hư không, dung hợp thần thức vào thiên địa, bắt đầu cảm ngộ sâu sắc hơn về các quy tắc của đại đạo. Tuổi thọ đạt 5000 năm.',
        hasTribulation: true,
        stages: [
            { id: 'lh_1', name: 'Sơ Kỳ', qiRequired: 20000000000, bonuses: [{ attribute: 'Nguyên Thần', value: 100 }, { attribute: 'Cảm Ngộ', value: 50 }], description: 'Thần thức hóa hư, có thể cảm nhận các dòng chảy quy tắc.' },
            { id: 'lh_2', name: 'Hậu Kỳ', qiRequired: 50000000000, bonuses: [{ attribute: 'Nguyên Thần', value: 150 }, { attribute: 'Tuổi Thọ', value: 2000 }], description: 'Có thể điều động một phần quy tắc lực, tạo ra hư không lĩnh vực.' },
        ]
    },
    {
        id: 'hop_the', name: 'Hợp Thể Kỳ',
        description: 'Nhục thân và nguyên thần hoàn toàn hợp nhất với thiên địa, đạt tới cảnh giới "thiên nhân hợp nhất". Sức mạnh vô song, có thể di sơn đảo hải. Tuổi thọ đạt 10.000 năm.',
        stages: [
            { id: 'hthe_1', name: 'Sơ Kỳ', qiRequired: 100000000000, bonuses: [{ attribute: 'Nhục Thân', value: 100 }, { attribute: 'Tiên Lực', value: 100 }], description: 'Mỗi cử động đều ẩn chứa uy lực của thiên địa.' },
            { id: 'hthe_2', name: 'Trung Kỳ', qiRequired: 250000000000, bonuses: [{ attribute: 'Nhục Thân', value: 120 }, { attribute: 'Tiên Lực', value: 120 }], description: 'Pháp tướng thiên địa, sức mạnh kinh người.' },
            { id: 'hthe_3', name: 'Hậu Kỳ', qiRequired: 500000000000, bonuses: [{ attribute: 'Nhục Thân', value: 150 }, { attribute: 'Tiên Lực', value: 150 }, { attribute: 'Tuổi Thọ', value: 5000 }], description: 'Hợp thể viên mãn, chuẩn bị cho Đại Thừa.' },
        ]
    },
    {
        id: 'dai_thua', name: 'Đại Thừa Kỳ',
        description: 'Đại đạo thành tựu, là cảnh giới đỉnh cao của nhân gian. Tu sĩ Đại Thừa đã gần như bất tử, chỉ còn một bước nữa là phi thăng tiên giới. Tuổi thọ không còn là giới hạn.',
        hasTribulation: true,
        stages: [
            { id: 'dt_1', name: 'Sơ Kỳ', qiRequired: 1000000000000, bonuses: [{ attribute: 'Lực Lượng', value: 200 }, { attribute: 'Thân Pháp', value: 200 }, { attribute: 'Nguyên Thần', value: 200 }], description: 'Lĩnh ngộ hoàn toàn một đại đạo.' },
            { id: 'dt_2', name: 'Trung Kỳ', qiRequired: 2000000000000, bonuses: [{ attribute: 'Tiên Lực', value: 200 }, { attribute: 'Phòng Ngự', value: 200 }], description: 'Ngôn xuất pháp tùy, ý niệm di chuyển vạn dặm.' },
            { id: 'dt_3', name: 'Hậu Kỳ', qiRequired: 5000000000000, bonuses: [{ attribute: 'Cảm Ngộ', value: 100 }, { attribute: 'Cơ Duyên', value: 50 }], description: 'Viên mãn vô khuyết, có thể cảm ứng được tiên giới chi môn.' },
        ]
    },
    {
        id: 'do_kiep', name: 'Độ Kiếp Kỳ',
        description: 'Đối mặt với thiên kiếp cuối cùng, là thử thách để thoát ly phàm tục, phi thăng tiên giới. Thành công thì thành tiên, thất bại thì hồn phi phách tán.',
        stages: [
            { id: 'dk_1', name: 'Thiên Lôi Kiếp', qiRequired: 10000000000000, bonuses: [{ attribute: 'Tuổi Thọ', value: 99999 }], description: 'Vượt qua chín chín tám mươi mốt đạo thiên lôi.' },
            { id: 'dk_2', name: 'Tâm Ma Kiếp', qiRequired: 20000000000000, bonuses: [{ attribute: 'Đạo Tâm', value: 100 }], description: 'Trảm phá tâm ma cuối cùng, đạo tâm viên mãn.' },
            { id: 'dk_3', name: 'Phi Thăng', qiRequired: 50000000000000, bonuses: [{ attribute: 'May Mắn', value: 100 }], description: 'Phá vỡ hư không, phi thăng tiên giới.' },
        ]
    }
];

export const NPC_DENSITY_LEVELS: { id: NpcDensity; name: string; description: string; count: number }[] = [
    { id: 'low', name: 'Thưa Thớt', description: 'Ít NPC, thế giới yên tĩnh.', count: 10 },
    { id: 'medium', name: 'Vừa Phải', description: 'Cân bằng, thế giới sống động.', count: 20 },
    { id: 'high', name: 'Đông Đúc', description: 'Nhiều NPC, thế giới hỗn loạn.', count: 35 },
];

export const INITIAL_TECHNIQUES: CultivationTechnique[] = [
    {
        id: 'tech_basic_meditation',
        name: 'Sơ Cấp Dẫn Khí Quyết',
        description: 'Một tâm pháp cơ bản để dẫn linh khí trời đất vào cơ thể, củng cố nền tảng tu luyện.',
        type: 'Linh Kỹ',
        cost: { type: 'Linh Lực', value: 5 },
        cooldown: 0,
        effectDescription: 'Tăng nhẹ tốc độ hấp thụ linh khí khi đả tọa trong 1 canh giờ.',
        rank: 'Phàm Giai',
        icon: '🧘',
        level: 1,
        maxLevel: 5,
    },
    {
        id: 'tech_basic_strike',
        name: 'Ngưng Khí Chỉ',
        description: 'Ngưng tụ một lượng nhỏ linh lực ở đầu ngón tay và bắn ra, gây sát thương cho kẻ địch ở cự ly gần.',
        type: 'Linh Kỹ',
        cost: { type: 'Linh Lực', value: 10 },
        cooldown: 1,
        effectDescription: 'Gây một lượng nhỏ sát thương Tiên Lực.',
        rank: 'Phàm Giai',
        icon: '👉',
        level: 1,
        maxLevel: 10,
    },
];

export const PREMADE_MODS: FullMod[] = [
    {
        modInfo: {
            id: 'phongthan-thanbinh',
            name: 'Thần Binh Lợi Khí',
            author: 'Game Master',
            description: 'Bổ sung một số thần binh và pháp bảo nổi tiếng trong thế giới Phong Thần.',
            version: '1.0.0',
        },
        content: {
            items: [
                {
                    name: 'Phiên Thiên Ấn',
                    description: 'Một pháp bảo của Quảng Thành Tử, có sức mạnh lật trời, một khi tung ra, vạn vật đều khó chống đỡ.',
                    type: 'Pháp Bảo',
                    quality: 'Tiên Phẩm',
                    weight: 5.0,
                    bonuses: [{ attribute: 'Lực Lượng', value: 25 }, { attribute: 'Tiên Lực', value: 50 }],
                    tags: ['Xiển Giáo', 'Pháp Bảo Mạnh'],
                },
                {
                    name: 'Hỗn Nguyên Kim Đấu',
                    description: 'Bảo vật trấn động của Tam Tiêu Nương Nương, có thể thu nhiếp vạn vật, làm mất đi tu vi của tiên nhân.',
                    type: 'Pháp Bảo',
                    quality: 'Tiên Phẩm',
                    weight: 3.0,
                    bonuses: [{ attribute: 'Nguyên Thần', value: 30 }, { attribute: 'Phòng Ngự', value: 40 }],
                    tags: ['Triệt Giáo', 'Khống Chế'],
                },
            ],
        },
    },
];

export const NPC_LIST: NPC[] = [
    {
        id: 'canon-npc-kzy',
        identity: {
            name: 'Khương Tử Nha',
            gender: 'Nam',
            origin: 'Đệ tử Xiển Giáo, phụng mệnh xuống núi phò Chu diệt Thương.',
            appearance: 'Một lão ông râu tóc bạc phơ, tướng mạo phi phàm, ánh mắt tinh anh, thường mặc đạo bào màu xám.',
            personality: 'Thông tuệ, kiên nhẫn, có tầm nhìn xa trông rộng.',
        },
        status: 'Đang câu cá bên bờ sông Vị Thủy.',
        attributes: [],
        talents: [],
        locationId: 'song_vi_thuy',
        cultivation: { currentRealmId: 'nguyen_anh', currentStageId: 'na_3', spiritualQi: 0, hasConqueredInnerDemon: true },
        techniques: [],
        inventory: { items: [], weightCapacity: 20 },
        currencies: {},
        equipment: {},
        ChinhDao: 95,
        MaDao: 0,
        TienLuc: 350,
        PhongNgu: 280,
        SinhMenh: 2000,
    },
];

export const ALCHEMY_RECIPES: AlchemyRecipe[] = [
    {
        id: 'recipe_hoi_khi_dan_ha_pham',
        name: 'Hồi Khí Đan - Hạ Phẩm',
        description: 'Loại đan dược cơ bản nhất, giúp hồi phục một lượng nhỏ linh lực đã tiêu hao.',
        ingredients: [
            { name: 'Linh Tinh Thảo', quantity: 2 },
        ],
        result: { name: 'Hạ Phẩm Hồi Khí Đan', quantity: 1 },
        requiredAttribute: { name: 'Đan Thuật', value: 10 },
        icon: '💊',
        qualityCurve: [
            { threshold: 50, quality: 'Linh Phẩm' },
            { threshold: 20, quality: 'Pháp Phẩm' }
        ]
    }
];

export const SHOPS: Shop[] = [
    {
        id: 'thien_co_cac',
        name: 'Thiên Cơ Các',
        description: 'Một cửa hàng bí ẩn bán đủ loại vật phẩm kỳ lạ, từ pháp bảo đến tin tức.',
        inventory: [
            {
                name: 'La Bàn Tìm Rồng',
                description: 'Một la bàn có khả năng chỉ dẫn đến nơi có long mạch hoặc bảo vật ẩn giấu.',
                type: 'Pháp Bảo',
                quality: 'Pháp Phẩm',
                weight: 0.5,
                price: { currency: 'Linh thạch hạ phẩm', amount: 150 },
                stock: 1,
            },
            {
                name: 'Tẩy Tủy Đan',
                description: 'Đan dược giúp tẩy trừ tạp chất trong cơ thể, tăng nhẹ tư chất tu luyện.',
                type: 'Đan Dược',
                quality: 'Linh Phẩm',
                weight: 0.1,
                bonuses: [{ attribute: 'Cảm Ngộ', value: 1 }],
                price: { currency: 'Linh thạch hạ phẩm', amount: 50 },
                stock: 5,
            },
            {
                name: 'Thanh Đồng Đan Lô',
                description: 'Một lò luyện đan bằng đồng, chất lượng phổ thông, thích hợp cho người mới bắt đầu.',
                type: 'Đan Lô',
                quality: 'Phàm Phẩm',
                weight: 5.0,
                bonuses: [{ attribute: 'Đan Thuật', value: 5 }],
                price: { currency: 'Bạc', amount: 200 },
                stock: 3
            },
            {
                name: 'Linh Tinh Thảo',
                description: 'Loại linh thảo phổ biến, chứa một lượng linh khí mỏng manh, là nguyên liệu chính cho nhiều loại đan dược cấp thấp.',
                type: 'Linh Dược',
                quality: 'Phàm Phẩm',
                weight: 0.1,
                price: { currency: 'Bạc', amount: 10 },
                stock: 'infinite'
            },
            {
                name: 'Hồi Khí Đan - Đan Phương',
                description: 'Ghi lại phương pháp luyện chế Hồi Khí Đan Hạ Phẩm.',
                type: 'Đan Phương',
                quality: 'Phàm Phẩm',
                weight: 0.1,
                recipeId: 'recipe_hoi_khi_dan_ha_pham',
                price: { currency: 'Bạc', amount: 100 },
                stock: 1
            }
        ],
    },
];
