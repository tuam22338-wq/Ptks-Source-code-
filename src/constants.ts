import type { Faction, GameSettings, AttributeGroup, InnateTalentRank, MajorEvent, PhapBaoRank, StatBonus, GameSpeed, Season, Weather, TimeOfDay, Location, NPC, NpcDensity, RealmConfig, SafetyLevel, AIModel, ImageModel, RagEmbeddingModel, LayoutMode, FullMod, ItemQuality, EquipmentSlot, CultivationTechnique, NarrativeStyle, InnateTalent, Shop, Theme, CultivationPath, AlchemyRecipe, FactionReputationStatus, Sect, CaveAbode, CharacterStatus, SectMission, MainCultivationTechnique } from './types';
import {
  GiCauldron, GiBroadsword,
  GiHealthNormal, GiHourglass, GiMagicSwirl, GiPentacle, GiPerspectiveDiceSixFacesRandom,
  GiRunningShoe, GiScrollQuill, GiSparklingSabre, GiStairsGoal, GiStoneTower, GiYinYang,
  GiSpinalCoil, GiMuscularTorso, GiSoulVessel, GiBoltSpellCast, GiHeartTower, GiScales,
  GiMountainCave, GiDoubleDragon, GiTalk, GiBed, GiSprout, GiStoneBlock, GiHerbsBundle
} from 'react-icons/gi';
import { FaSun, FaMoon } from 'react-icons/fa';

export const CURRENT_GAME_VERSION = "1.1.0";

export const INVENTORY_ACTION_LOG_PREFIX = "[System Note: Trong lúc kiểm tra túi đồ, người chơi đã:\n";

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
export const FACTION_NAMES = FACTIONS.map(f => f.name);

export const CHARACTER_STATUS_CONFIG: Record<CharacterStatus, { label: string; threshold: number; debuffs: StatBonus[]; color: string }> = {
  HEALTHY: { label: 'Khỏe mạnh', threshold: 0.9, debuffs: [], color: 'text-green-400' },
  LIGHTLY_INJURED: { label: 'Bị thương nhẹ', threshold: 0.5, debuffs: [{ attribute: 'Thân Pháp', value: -2 }, { attribute: 'Lực Lượng', value: -2 }], color: 'text-yellow-400' },
  HEAVILY_INJURED: { label: 'Bị thương nặng', threshold: 0.1, debuffs: [{ attribute: 'Thân Pháp', value: -5 }, { attribute: 'Lực Lượng', value: -5 }, { attribute: 'Nguyên Thần', value: -3 }], color: 'text-orange-500' },
  NEAR_DEATH: { label: 'Sắp chết', threshold: 0, debuffs: [{ attribute: 'Thân Pháp', value: -10 }, { attribute: 'Lực Lượng', value: -10 }, { attribute: 'Nguyên Thần', value: -5 }, { attribute: 'Ngộ Tính', value: -5 }], color: 'text-red-600' },
};

const XIEN_GIAO_MISSIONS: SectMission[] = [
    {
        id: 'xg_mission_1',
        title: 'Diệt Yêu Thú',
        description: 'Yêu thú tại Rừng Cổ Thụ đang quấy nhiễu dân lành. Hãy đến đó trừ hại cho dân.',
        objectives: [{ type: 'DEFEAT', targetId: 'Yêu Thú Rừng', quantity: 3 }],
        rewards: { contribution: 100, currency: { 'Bạc': 200 } }
    },
    {
        id: 'xg_mission_2',
        title: 'Thu thập Linh Thảo',
        description: 'Trưởng lão luyện đan đang cần gấp một số dược liệu. Hãy thu thập Linh Tâm Thảo và Thanh Diệp Hoa.',
        objectives: [
            { type: 'GATHER', targetId: 'Linh Tâm Thảo', quantity: 5 },
            { type: 'GATHER', targetId: 'Thanh Diệp Hoa', quantity: 2 },
        ],
        rewards: { contribution: 150, items: [{ name: 'Hồi Khí Đan', quantity: 2 }] }
    }
];

const TRIET_GIAO_MISSIONS: SectMission[] = [
     {
        id: 'tg_mission_1',
        title: 'Tìm Kiếm Tán Tu',
        description: 'Giáo chủ chủ trương hữu giáo vô loại. Hãy đi tìm các tán tu có tiềm năng và thuyết phục họ gia nhập.',
        objectives: [{ type: 'DEFEAT', targetId: 'Tán Tu', quantity: 2 }], // Using defeat as placeholder for interaction
        rewards: { contribution: 120, currency: { 'Linh thạch hạ phẩm': 10 } }
    },
];

export const SECTS: Sect[] = [
    {
        id: 'xien_giao',
        name: 'Xiển Giáo',
        description: 'Do Nguyên Thủy Thiên Tôn đứng đầu, tuân theo thiên mệnh, đề cao căn cơ và tư chất. Đệ tử đều là những người có phúc duyên sâu dày.',
        alignment: 'Chính Phái',
        icon: FaSun,
        joinRequirements: [{ attribute: 'Ngộ Tính', value: 15, greaterThan: true }, { attribute: 'Cơ Duyên', value: 15, greaterThan: true }],
        ranks: [
            { name: 'Đệ tử Ghi danh', contributionRequired: 0 },
            { name: 'Đệ tử Ngoại môn', contributionRequired: 500 },
            { name: 'Đệ tử Nội môn', contributionRequired: 2000 },
            { name: 'Đệ tử Chân truyền', contributionRequired: 10000 },
        ],
        missions: XIEN_GIAO_MISSIONS
    },
    {
        id: 'triet_giao',
        name: 'Triệt Giáo',
        description: "Do Thông Thiên Giáo Chủ sáng lập, chủ trương 'hữu giáo vô loại', thu nhận mọi chúng sinh có lòng cầu đạo, không phân biệt nguồn gốc.",
        alignment: 'Trung Lập',
        icon: GiYinYang,
        joinRequirements: [{ attribute: 'Đạo Tâm', value: 12, greaterThan: true }],
        ranks: [
            { name: 'Ký danh Đệ tử', contributionRequired: 0 },
            { name: 'Ngoại môn Đệ tử', contributionRequired: 400 },
            { name: 'Nội môn Đệ tử', contributionRequired: 1800 },
            { name: 'Thân truyền Đệ tử', contributionRequired: 9000 },
        ],
        missions: TRIET_GIAO_MISSIONS
    },
];

export const DEFAULT_CAVE_ABODE: CaveAbode = {
    name: 'Tiên Phủ Sơ Khai',
    level: 1,
    spiritGatheringArrayLevel: 0,
    spiritHerbFieldLevel: 0,
    alchemyRoomLevel: 0,
    storageUpgradeLevel: 0,
    locationId: 'dong_phu',
};

export const FACTION_REPUTATION_TIERS: { threshold: number; status: FactionReputationStatus }[] = [
    { threshold: -101, status: 'Kẻ Địch' }, // -100 to -51
    { threshold: -50, status: 'Lạnh Nhạt' }, // -50 to -1
    { threshold: 0, status: 'Trung Lập' }, // 0 to 49
    { threshold: 50, status: 'Thân Thiện' }, // 50 to 99
    { threshold: 100, status: 'Đồng Minh' }, // 100
];

export const CULTIVATION_PATHS: CultivationPath[] = [
    {
        id: 'path_sword_immortal',
        name: 'Kiếm Tiên Chi Lộ',
        description: 'Tập trung vào việc tu luyện kiếm pháp, lấy công làm thủ, một kiếm phá vạn pháp.',
        requiredRealmId: 'truc_co', // Offered when entering Foundation Establishment
        bonuses: [
            { attribute: 'Lực Lượng', value: 10 },
            { attribute: 'Linh Lực Sát Thương', value: 15 },
        ]
    },
    {
        id: 'path_alchemy_master',
        name: 'Đan Đạo Tông Sư',
        description: 'Chuyên tâm vào việc luyện đan, cứu người giúp đời hoặc luyện chế độc dược hại người.',
        requiredRealmId: 'truc_co',
        bonuses: [
            { attribute: 'Ngự Khí Thuật', value: 20 },
            { attribute: 'Nguyên Thần', value: 10 },
        ]
    }
];

export const NPC_LIST: NPC[] = [
  {
    id: 'npc_khuong_tu_nha',
    identity: { name: 'Khương Tử Nha', gender: 'Nam', appearance: 'Một lão ông râu tóc bạc phơ, ánh mắt tinh anh, phong thái thoát tục, thường mặc đạo bào màu xám.', origin: 'Đệ tử của Nguyên Thủy Thiên Tôn ở núi Côn Lôn, phụng mệnh xuống núi phò Chu diệt Thương.', personality: 'Chính Trực', age: 72 },
    tuoiTho: 350,
    status: 'Đang câu cá bên bờ sông Vị Thủy, chờ đợi minh chủ.',
    attributes: [],
    talents: [ { name: 'Phong Thần Bảng', description: 'Nắm giữ thiên cơ, có quyền phong thần.', rank: 'Thánh Giai', effect: 'Có khả năng nhìn thấu vận mệnh.' }, { name: 'Đả Thần Tiên', description: 'Pháp bảo do sư tôn ban tặng, chuyên đánh tiên nhân.', rank: 'Đại Tiên Giai', effect: 'Tăng mạnh sát thương lên kẻ địch có tu vi cao.' } ],
    locationId: 'song_vi_thuy',
    cultivation: { currentRealmId: 'thien_tien', currentStageId: 'tt_1', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 100, items: [] }, currencies: { 'Bạc': 100, 'Linh thạch hạ phẩm': 50 }, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_na_tra',
    identity: { name: 'Na Tra', gender: 'Nam', appearance: 'Hình hài thiếu niên, mặt đẹp như ngọc, môi đỏ như son, mắt sáng tựa sao. Tay cầm Hỏa Tiễn Thương, chân đạp Phong Hỏa Luân, mình quấn Hỗn Thiên Lăng.', origin: 'Linh Châu Tử chuyển thế, con trai thứ ba của Lý Tịnh. Là đệ tử của Thái Ất Chân Nhân.', personality: 'Hỗn Loạn', familyName: 'Lý gia', age: 16 },
    tuoiTho: 9999,
    status: 'Đang tuần tra tại Trần Đường Quan, tính tình nóng nảy.',
    attributes: [],
    talents: [ { name: 'Pháp Liên Hóa Thân', description: 'Thân thể được tái tạo từ hoa sen, miễn nhiễm với nhiều loại độc và tà thuật.', rank: 'Đại Tiên Giai', effect: 'Kháng tất cả hiệu ứng tiêu cực.' }, { name: 'Tam Đầu Lục Tý', description: 'Khi chiến đấu có thể hóa thành ba đầu sáu tay, sức mạnh tăng vọt.', rank: 'Hậu Tiên Giai', effect: 'Tăng mạnh các chỉ số chiến đấu trong giao tranh.' } ],
    locationId: 'tran_duong_quan',
    cultivation: { currentRealmId: 'kim_tien', currentStageId: 'kt_2', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 100, items: [] }, currencies: { 'Linh thạch hạ phẩm': 200 }, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_duong_tien',
    identity: { name: 'Dương Tiễn', gender: 'Nam', appearance: 'Tướng mạo phi phàm, giữa trán có thiên nhãn. Thân mặc giáp bạc, tay cầm Tam Tiêm Lưỡng Nhận Đao, bên cạnh có Hao Thiên Khuyển.', origin: 'Đệ tử của Ngọc Đỉnh Chân Nhân, cháu của Ngọc Hoàng Đại Đế.', personality: 'Chính Trực', age: 25 },
    tuoiTho: 9999,
    status: 'Đang tu luyện tại Ngọc Hư Cung, chờ lệnh sư tôn.',
    attributes: [],
    talents: [ { name: 'Thiên Nhãn', description: 'Con mắt thứ ba giữa trán, có thể nhìn thấu bản chất, phá trừ ảo ảnh.', rank: 'Thánh Giai', effect: 'Nhìn thấu mọi ngụy trang và ẩn thân.' }, { name: 'Bát Cửu Huyền Công', description: 'Công pháp biến hóa vô song, có 72 phép biến hóa.', rank: 'Đại Tiên Giai', effect: 'Khả năng biến hóa thành vạn vật.' } ],
    locationId: 'ngoc_hu_cung',
    cultivation: { currentRealmId: 'thai_at', currentStageId: 'ta_1', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 150, items: [] }, currencies: { 'Linh thạch hạ phẩm': 500 }, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_dat_ky',
    identity: { name: 'Đát Kỷ', gender: 'Nữ', appearance: 'Vẻ đẹp tuyệt thế, khuynh quốc khuynh thành, mỗi cái nhíu mày, mỗi nụ cười đều có sức mê hoặc lòng người. Ánh mắt luôn ẩn chứa một tia gian xảo.', origin: 'Cửu vỹ hồ ly tinh ngàn năm tu luyện tại Hiên Viên Mộ, phụng mệnh Nữ Oa vào cung mê hoặc Trụ Vương.', personality: 'Tà Ác', age: 1017 },
    tuoiTho: 5000,
    status: 'Đang ở bên cạnh Trụ Vương tại Lộc Đài, bày mưu tính kế.',
    attributes: [],
    talents: [ { name: 'Hồ Mị', description: 'Sức quyến rũ trời sinh của hồ ly, khiến người khác phái khó lòng chống cự.', rank: 'Đại Tiên Giai', effect: 'Giảm mạnh ý chí của đối thủ nam.' } ],
    locationId: 'loc_dai',
    cultivation: { currentRealmId: 'thien_tien', currentStageId: 'tt_1', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 50, items: [] }, currencies: { 'Vàng': 10000, 'Bạc': 50000 }, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_tru_vuong',
    identity: { name: 'Trụ Vương', gender: 'Nam', appearance: 'Thân hình cao lớn, uy phong lẫm liệt của bậc đế vương, nhưng ánh mắt đã nhuốm màu hoang dâm và tàn bạo.', origin: 'Vị vua cuối cùng của nhà Thương, văn võ song toàn nhưng ham mê tửu sắc, tàn bạo vô đạo.', personality: 'Tà Ác', age: 45 },
    tuoiTho: 80,
    status: 'Đang yến tiệc tại Lộc Đài, bỏ bê triều chính.',
    attributes: [],
    talents: [ { name: 'Thiên Tử Long Khí', description: 'Sở hữu khí vận của một triều đại, có khả năng áp chế kẻ địch.', rank: 'Trung Tiên Giai', effect: 'Tăng khả năng kháng hiệu ứng.' } ],
    locationId: 'loc_dai',
    cultivation: { currentRealmId: 'truc_co', currentStageId: 'tc_2', spiritualQi: 0, hasConqueredInnerDemon: false },
    techniques: [], inventory: { weightCapacity: 200, items: [] }, currencies: { 'Vàng': 99999 }, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_van_trong',
    identity: { name: 'Văn Trọng', gender: 'Nam', appearance: 'Thái sư đầu đội kim quan, mình mặc giáp trụ, râu dài tới ngực, giữa trán cũng có một con mắt. Cưỡi Mặc Kỳ Lân, tay cầm Kim Tiên.', origin: 'Thái sư nhà Thương, đệ tử của Kim Linh Thánh Mẫu thuộc Triệt Giáo, là trụ cột của triều đình.', personality: 'Chính Trực', age: 280 },
    tuoiTho: 1000,
    status: 'Vừa dẹp yên Bắc Hải trở về, đang lo lắng cho xã tắc.',
    attributes: [],
    talents: [ { name: 'Thần Mục', description: 'Con mắt thứ ba có thể phân biệt trắng đen, nhìn rõ trung gian.', rank: 'Hậu Tiên Giai', effect: 'Miễn nhiễm với ảo thuật và lừa dối.' } ],
    locationId: 'trieu_ca',
    cultivation: { currentRealmId: 'thai_at', currentStageId: 'ta_2', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 150, items: [] }, currencies: { 'Linh thạch hạ phẩm': 2000, 'Vàng': 5000 }, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_than_cong_bao',
    identity: { name: 'Thân Công Báo', gender: 'Nam', appearance: 'Một đạo sĩ gầy gò, mặc áo bào đen, tướng mạo gian hoạt, luôn cưỡi trên lưng một con cọp đen.', origin: 'Bạn đồng môn với Khương Tử Nha, nhưng vì đố kỵ mà đi theo con đường tà đạo, chuyên đi khắp nơi mời gọi dị nhân giúp nhà Thương.', personality: 'Hỗn Loạn', age: 90 },
    tuoiTho: 300,
    status: 'Đang tìm kiếm kỳ nhân dị sĩ để chống lại Tây Kỳ.',
    attributes: [],
    talents: [ { name: 'Miệng Lưỡi Sắc Sảo', description: 'Có tài ăn nói, dễ dàng thuyết phục người khác.', rank: 'Sơ Tiên Giai', effect: 'Tăng mạnh khả năng thuyết phục trong đối thoại.' } ],
    locationId: 'rung_me_vu',
    cultivation: { currentRealmId: 'thien_tien', currentStageId: 'tt_1', spiritualQi: 0, hasConqueredInnerDemon: false },
    techniques: [], inventory: { weightCapacity: 80, items: [] }, currencies: { 'Linh thạch hạ phẩm': 500, 'Bạc': 1000 }, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_co_xuong',
    identity: { name: 'Cơ Xương', gender: 'Nam', appearance: 'Một vị hiền hầu, tuổi đã cao, râu tóc bạc trắng nhưng tinh thần minh mẫn, toát lên vẻ nhân từ đức độ.', origin: 'Tây Bá Hầu, một trong tứ đại chư hầu, tinh thông dịch lý, được lòng dân chúng.', personality: 'Chính Trực', familyName: 'Cơ gia', age: 90 },
    tuoiTho: 97,
    status: 'Đang cai quản Tây Kỳ, chiêu hiền đãi sĩ.',
    attributes: [],
    talents: [ { name: 'Hậu Thiên Bát Quái', description: 'Có khả năng suy diễn thiên cơ, biết trước họa phúc.', rank: 'Trung Tiên Giai', effect: 'Tăng chỉ số Cơ Duyên.' } ],
    locationId: 'tay_ky',
    cultivation: { currentRealmId: 'luyen_khi', currentStageId: 'lk_dz', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 100, items: [] }, currencies: { 'Vàng': 2000 }, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_thai_at_chan_nhan',
    identity: { name: 'Thái Ất Chân Nhân', gender: 'Nam', appearance: 'Một vị tiên nhân đạo cốt tiên phong, thường mặc đạo bào màu xanh biếc.', origin: 'Một trong Thập Nhị Kim Tiên của Xiển Giáo, sư phụ của Na Tra.', personality: 'Trung Lập', age: 3000 },
    tuoiTho: 15000,
    status: 'Đang ở động Kim Quang, Càn Nguyên Sơn, nghiên cứu đạo pháp.',
    attributes: [],
    talents: [],
    locationId: 'ngoc_hu_cung',
    cultivation: { currentRealmId: 'thai_at', currentStageId: 'ta_2', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 500, items: [] }, currencies: { 'Linh thạch thượng phẩm': 100 }, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_trieu_cong_minh',
    identity: { name: 'Triệu Công Minh', gender: 'Nam', appearance: 'Một vị đại tiên uy mãnh, cưỡi cọp đen, tay cầm Định Hải Châu và Thần Tiên.', origin: 'Đại đệ tử ngoại môn của Triệt Giáo, tu tại núi Nga Mi.', personality: 'Hỗn Loạn', age: 4500 },
    tuoiTho: 20000,
    status: 'Đang du ngoạn bốn biển, tìm kiếm đạo hữu.',
    attributes: [],
    talents: [ { name: 'Định Hải Châu', description: '24 viên ngọc có sức mạnh kinh thiên động địa.', rank: 'Đại Tiên Giai', effect: 'Sở hữu sức tấn công cực mạnh.' } ],
    locationId: 'dao_tam_tien',
    cultivation: { currentRealmId: 'dai_la', currentStageId: 'dl_1', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 300, items: [] }, currencies: { 'Linh thạch thượng phẩm': 200 }, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_van_tieu',
    identity: { name: 'Vân Tiêu Tiên Tử', gender: 'Nữ', appearance: 'Chị cả trong Tam Tiêu, dung mạo xinh đẹp, tính tình trầm ổn, đạo hạnh cao thâm.', origin: 'Đệ tử của Thông Thiên Giáo Chủ, cùng hai em gái tu luyện tại đảo Tam Tiên.', personality: 'Trung Lập', age: 4200 },
    tuoiTho: 18000,
    status: 'Đang tĩnh tu trên đảo Tam Tiên.',
    attributes: [],
    talents: [ { name: 'Cửu Khúc Hoàng Hà Trận', description: 'Trận pháp thượng cổ, có thể gọt bỏ tu vi của tiên nhân.', rank: 'Thánh Giai', effect: 'Cực kỳ nguy hiểm, có thể làm người chơi mất cảnh giới.' } ],
    locationId: 'dao_tam_tien',
    cultivation: { currentRealmId: 'dai_la', currentStageId: 'dl_2', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 100, items: [] }, currencies: { 'Linh thạch trung phẩm': 500 }, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_thach_co_nuong_nuong',
    identity: { name: 'Thạch Cơ Nương Nương', gender: 'Nữ', appearance: 'Một nữ yêu kiều diễm nhưng tà khí toát ra từ một tảng đá.', origin: 'Một tảng đá hấp thụ tinh hoa nhật nguyệt mà thành tinh, tu luyện tại Bạch Cốt Động.', personality: 'Tà Ác', age: 800 },
    tuoiTho: 2000,
    status: 'Đang tức giận vì đệ tử bị Na Tra giết chết.',
    attributes: [],
    talents: [],
    locationId: 'bach_cot_dong',
    cultivation: { currentRealmId: 'kim_tien', currentStageId: 'kt_1', spiritualQi: 0, hasConqueredInnerDemon: false },
    techniques: [], inventory: { weightCapacity: 100, items: [] }, currencies: { 'Linh thạch hạ phẩm': 500 }, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_ly_tinh',
    identity: { name: 'Lý Tịnh', gender: 'Nam', appearance: 'Một vị tổng binh uy nghiêm, mày kiếm mắt sáng, tay luôn cầm Linh Lung Bảo Tháp.', origin: 'Tổng binh Trần Đường Quan, cha của Na Tra.', personality: 'Chính Trực', familyName: 'Lý gia', age: 50 },
    tuoiTho: 200,
    status: 'Đang đau đầu vì đứa con nghịch tử Na Tra.',
    attributes: [],
    talents: [ { name: 'Linh Lung Bảo Tháp', description: 'Pháp bảo do Nhiên Đăng Cổ Phật tặng để khắc chế Na Tra.', rank: 'Trung Tiên Giai', effect: 'Có khả năng trấn áp kẻ địch.' } ],
    locationId: 'tran_duong_quan',
    cultivation: { currentRealmId: 'nhan_tien', currentStageId: 'nt_2', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 120, items: [] }, currencies: { 'Bạc': 1500 }, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  { id: 'npc_loi_chan_tu',
    identity: { name: 'Lôi Chấn Tử', gender: 'Nam', appearance: 'Thân xanh, mặt nhọn, mọc cánh sau lưng, tay cầm côn vàng.', origin: 'Con nuôi của Cơ Xương, đệ tử của Vân Trung Tử.', personality: 'Hỗn Loạn', familyName: 'Cơ gia', age: 20 },
    tuoiTho: 5000,
    status: 'Bay lượn trên bầu trời Tây Kỳ.',
    attributes: [],
    talents: [ { name: 'Phong Lôi Dực', description: 'Đôi cánh có sức mạnh của gió và sấm sét, tốc độ cực nhanh.', rank: 'Hậu Tiên Giai', effect: 'Tốc độ di chuyển cực cao.' } ],
    locationId: 'tay_ky',
    cultivation: { currentRealmId: 'kim_tien', currentStageId: 'kt_1', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 100, items: [] }, currencies: { 'Linh thạch hạ phẩm': 300 }, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  { id: 'npc_hoang_phi_ho',
    identity: { name: 'Hoàng Phi Hổ', gender: 'Nam', appearance: 'Võ tướng oai phong, mình mặc giáp trụ, cưỡi ngũ sắc thần ngưu.', origin: 'Trấn quốc Võ Thành Vương của nhà Thương, sau này phản lại Trụ Vương theo về nhà Chu.', personality: 'Chính Trực', age: 40 },
    tuoiTho: 120,
    status: 'Đang trấn giữ Tam Sơn Quan.',
    attributes: [],
    talents: [],
    locationId: 'tam_son_quan',
    cultivation: { currentRealmId: 'truc_co', currentStageId: 'tc_3', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 150, items: [] }, currencies: { 'Vàng': 250 }, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_quang_thanh_tu',
    identity: { name: 'Quảng Thành Tử', gender: 'Nam', appearance: 'Đạo nhân tiên phong đạo cốt, tay cầm Phiên Thiên Ấn.', origin: 'Đứng đầu Thập Nhị Kim Tiên, tu tại động Đào Nguyên, núi Cửu Tiên.', personality: 'Chính Trực', age: 5000 },
    tuoiTho: 20000,
    status: 'Đang bế quan tu luyện, không màng thế sự.',
    attributes: [],
    talents: [{ name: 'Phiên Thiên Ấn', description: 'Pháp bảo cực mạnh, có sức nặng của một ngọn núi.', rank: 'Đại Tiên Giai', effect: 'Gây sát thương vật lý cực lớn.' }],
    locationId: 'ngoc_hu_cung',
    cultivation: { currentRealmId: 'thai_at', currentStageId: 'ta_2', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 200, items: [] }, currencies: {}, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_xich_tinh_tu',
    identity: { name: 'Xích Tinh Tử', gender: 'Nam', appearance: 'Đạo sĩ mặc áo bào đỏ, tính tình nóng nảy.', origin: 'Một trong Thập Nhị Kim Tiên, tu tại động Vân Quang, núi Thái Hoa.', personality: 'Hỗn Loạn', age: 4800 },
    tuoiTho: 18000,
    status: 'Đang luyện bảo.',
    attributes: [],
    talents: [{ name: 'Âm Dương Kính', description: 'Có hai mặt sinh tử, một mặt cứu người, một mặt giết người.', rank: 'Đại Tiên Giai', effect: 'Có khả năng hồi sinh hoặc tiêu diệt mục tiêu.' }],
    locationId: 'ngoc_hu_cung',
    cultivation: { currentRealmId: 'thai_at', currentStageId: 'ta_2', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 200, items: [] }, currencies: {}, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_dao_hanh_thien_ton',
    identity: { name: 'Đạo Hạnh Thiên Tôn', gender: 'Nam', appearance: 'Tiên nhân có vẻ ngoài bí ẩn, khó đoán.', origin: 'Một trong Thập Nhị Kim Tiên, tu tại động Ngọc Tuyền, núi Kim Đình.', personality: 'Trung Lập', age: 4900 },
    tuoiTho: 19000,
    status: 'Đang diễn giải thiên cơ.',
    attributes: [],
    talents: [],
    locationId: 'ngoc_hu_cung',
    cultivation: { currentRealmId: 'thai_at', currentStageId: 'ta_1', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 200, items: [] }, currencies: {}, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_nhien_dang_dao_nhan',
    identity: { name: 'Nhiên Đăng Đạo Nhân', gender: 'Nam', appearance: 'Lão đạo có vẻ ngoài cổ xưa, uy nghiêm, là phó giáo chủ Xiển Giáo.', origin: 'Một trong những vị tiên cổ xưa nhất, có địa vị cao trong Xiển Giáo.', personality: 'Trung Lập', age: 10000 },
    tuoiTho: 50000,
    status: 'Đang quan sát đại kiếp.',
    attributes: [],
    talents: [{ name: 'Linh Cữu Đăng', description: 'Ngọn đèn thần chứa ngọn lửa vĩnh cửu.', rank: 'Thánh Giai', effect: 'Khắc chế các loại tà ma.' }],
    locationId: 'ngoc_hu_cung',
    cultivation: { currentRealmId: 'dai_la', currentStageId: 'dl_2', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 300, items: [] }, currencies: {}, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_da_bao_dao_nhan',
    identity: { name: 'Đa Bảo Đạo Nhân', gender: 'Nam', appearance: 'Tiên nhân có vô số pháp bảo bên mình.', origin: 'Đại đệ tử của Thông Thiên Giáo Chủ, đứng đầu chúng tiên Triệt Giáo.', personality: 'Hỗn Loạn', age: 6000 },
    tuoiTho: 30000,
    status: 'Đang ở Bích Du Cung, chờ lệnh sư tôn.',
    attributes: [],
    talents: [{ name: 'Vạn Bảo', description: 'Sở hữu vô số pháp bảo, có thể tùy ý sử dụng.', rank: 'Đại Tiên Giai', effect: 'Có nhiều lựa chọn chiến đấu.' }],
    locationId: 'bich_du_cung',
    cultivation: { currentRealmId: 'dai_la', currentStageId: 'dl_1', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 999, items: [] }, currencies: {}, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_kim_linh_thanh_mau',
    identity: { name: 'Kim Linh Thánh Mẫu', gender: 'Nữ', appearance: 'Nữ tiên uy nghiêm, pháp lực cao cường.', origin: 'Một trong tứ đại đệ tử của Thông Thiên Giáo Chủ, sư phụ của Văn Trọng.', personality: 'Chính Trực', age: 5800 },
    tuoiTho: 28000,
    status: 'Đang ở Bích Du Cung.',
    attributes: [],
    talents: [{ name: 'Tứ Tượng Tháp', description: 'Bảo tháp có thể trấn áp kẻ địch.', rank: 'Đại Tiên Giai', effect: 'Gây choáng và sát thương diện rộng.' }],
    locationId: 'bich_du_cung',
    cultivation: { currentRealmId: 'dai_la', currentStageId: 'dl_1', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 200, items: [] }, currencies: {}, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_khong_tuyen',
    identity: { name: 'Khổng Tuyên', gender: 'Nam', appearance: 'Vị tướng quân anh tuấn, khi tức giận sau lưng hiện ra ngũ sắc thần quang.', origin: 'Là con Khổng Tước đầu tiên của trời đất, hiện đang làm tổng binh Tam Sơn Quan cho nhà Thương.', personality: 'Trung Lập', age: 9000 },
    tuoiTho: 99999,
    status: 'Đang trấn giữ Tam Sơn Quan.',
    attributes: [],
    talents: [{ name: 'Ngũ Sắc Thần Quang', description: 'Năm sợi lông đuôi có thể thu vạn vật trong ngũ hành, không gì không quét.', rank: 'Thánh Giai', effect: 'Có thể vô hiệu hóa mọi pháp bảo và đòn tấn công.' }],
    locationId: 'tam_son_quan',
    cultivation: { currentRealmId: 'chuan_thanh', currentStageId: 'ct_1', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 200, items: [] }, currencies: {}, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_co_phat',
    identity: { name: 'Cơ Phát', gender: 'Nam', appearance: 'Người có tướng mạo đế vương, nhân từ và quyết đoán.', origin: 'Con trai thứ của Cơ Xương, sau này là Chu Vũ Vương, người lật đổ nhà Thương.', personality: 'Chính Trực', familyName: 'Cơ gia', age: 30 },
    tuoiTho: 93,
    status: 'Đang ở Tây Kỳ, chuẩn bị cho đại nghiệp.',
    attributes: [],
    talents: [{ name: 'Chân Long Thiên Tử', description: 'Có được sự phù hộ của thiên mệnh, là vua của nhân gian.', rank: 'Đại Tiên Giai', effect: 'Tăng mạnh may mắn và uy thế.' }],
    locationId: 'tay_ky',
    cultivation: { currentRealmId: 'pham_nhan', currentStageId: 'pn_1', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 150, items: [] }, currencies: { 'Vàng': 500 }, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_nu_oa',
    identity: { name: 'Nữ Oa Nương Nương', gender: 'Nữ', appearance: 'Thánh nhân của Yêu tộc, vẻ đẹp và uy nghiêm không thể tả xiết.', origin: 'Một trong những vị thánh cổ xưa nhất, người đã tạo ra loài người.', personality: 'Trung Lập', age: 99999 },
    tuoiTho: 999999,
    status: 'Đang ở Oa Hoàng Cung, quan sát thế gian.',
    attributes: [],
    talents: [{ name: 'Sơn Hà Xã Tắc Đồ', description: 'Một thế giới chứa trong một bức tranh, có thể nhốt cả Thánh Nhân.', rank: 'Thánh Giai', effect: 'Không thể chống cự.' }],
    locationId: 'oa_hoang_cung',
    cultivation: { currentRealmId: 'thanh_nhan', currentStageId: 'tn_1', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 1000, items: [] }, currencies: {}, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  },
  {
    id: 'npc_luc_ap_dao_nhan',
    identity: { name: 'Lục Áp Đạo Nhân', gender: 'Nam', appearance: 'Một đạo nhân bí ẩn, không rõ lai lịch, luôn xuất hiện vào những thời khắc quan trọng.', origin: 'Không ai biết y từ đâu tới, chỉ biết y không thuộc tam giáo.', personality: 'Hỗn Loạn', age: 8000 },
    tuoiTho: 99999,
    status: 'Đang du ngoạn trong hồng trần.',
    attributes: [],
    talents: [{ name: 'Trảm Tiên Phi Đao', description: 'Một hồ lô có thể phóng ra một tia sáng có mắt, chém đầu tiên nhân.', rank: 'Thánh Giai', effect: 'Gây sát thương chí mạng.' }],
    locationId: 'rung_me_vu',
    cultivation: { currentRealmId: 'chuan_thanh', currentStageId: 'ct_2', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 100, items: [] }, currencies: {}, equipment: {}, healthStatus: 'HEALTHY', activeEffects: [],
  }
];

export const SHOPS: Shop[] = [
    {
        id: 'van_bao_lau',
        name: 'Vạn Bảo Lâu',
        description: 'Cửa hàng pháp bảo nổi tiếng nhất Triều Ca, có bán đủ mọi thứ từ linh dược đến pháp khí.',
        inventory: [
            { 
                name: 'Hồi Khí Đan', 
                description: 'Đan dược hạ phẩm giúp hồi phục một lượng nhỏ linh lực.',
                type: 'Đan Dược',
                quality: 'Linh Phẩm',
                weight: 0.1,
                price: { currency: 'Linh thạch hạ phẩm', amount: 10 },
                stock: 'infinite'
            },
            {
                name: 'Linh Thạch Hạ Phẩm',
                description: 'Đơn vị tiền tệ cơ bản trong giới tu tiên, chứa một lượng nhỏ linh khí.',
                type: 'Tạp Vật',
                quality: 'Phàm Phẩm',
                weight: 0.1,
                price: { currency: 'Bạc', amount: 100 },
                stock: 'infinite'
            }
        ]
    }
];

export const ALCHEMY_RECIPES: AlchemyRecipe[] = [
    {
        id: 'recipe_hoi_khi_dan_ha_pham',
        name: 'Hồi Khí Đan - Hạ Phẩm Đan Phương',
        description: 'Ghi lại phương pháp luyện chế Hồi Khí Đan Hạ Phẩm, giúp hồi phục linh lực.',
        ingredients: [
            { name: 'Linh Tâm Thảo', quantity: 3 },
            { name: 'Thanh Diệp Hoa', quantity: 1 },
        ],
        result: { name: 'Hồi Khí Đan', quantity: 1 },
        requiredAttribute: { name: 'Ngự Khí Thuật', value: 15 },
        icon: '💊',
        qualityCurve: [
            { threshold: 50, quality: 'Linh Phẩm' },
            { threshold: 25, quality: 'Phàm Phẩm' },
        ]
    }
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
    theme: 'theme-amber',
    backgroundImage: '',
    zoomLevel: 100,
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
    storyLogItemsPerPage: 20,
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
    thinkingBudget: 2500,
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
    year: 7,
    title: "Đát Kỷ Nhập Cung",
    location: "Triều Ca",
    involvedParties: "Cửu Vỹ Hồ (trong thân xác Đát Kỷ), Trụ Vương",
    summary: "Trên đường dâng đến Triều Ca, Tô Đát Kỷ thật đã bị Cửu Vỹ Hồ Ly Tinh phụng mệnh Nữ Oa chiếm đoạt thân xác. Hồ Ly Tinh tiến cung và nhanh chóng mê hoặc Trụ Vương bằng sắc đẹp tuyệt trần.",
    consequences: "Triều chính nhà Thương bắt đầu một chuỗi ngày đen tối. Đát Kỷ xúi giục Trụ Vương làm những việc tàn bạo như xây Lộc Đài, thiêu Bào Lạc, giết hại trung thần, khiến lòng dân oán thán, đẩy nhanh sự sụp đổ của triều đại."
  },
    {
    year: 10,
    title: "Na Tra Náo Hải",
    location: "Trần Đường Quan, Đông Hải",
    involvedParties: "Na Tra, Ngao Bính (Tam thái tử Đông Hải), Lý Tịnh",
    summary: "Na Tra, vốn là Linh Châu Tử chuyển thế, nghịch ngợm dùng Càn Khôn Quyển và Hỗn Thiên Lăng làm chấn động Đông Hải Long Cung. Tam thái tử Ngao Bính lên bờ hỏi tội, bị Na Tra đánh chết, rút cả gân rồng.",
    consequences: "Đông Hải Long Vương Ngao Quảng nổi giận, dâng nước lên Trần Đường Quan. Để cứu dân chúng, Na Tra lóc xương trả cha, lóc thịt trả mẹ. Sau được Thái Ất Chân Nhân dùng hoa sen tái tạo lại thân thể, trở nên mạnh mẽ hơn."
  },
  {
    year: 20,
    title: "Cơ Xương Thoát Nạn",
    location: "Dũ Lý, Triều Ca",
    involvedParties: "Tây Bá Hầu Cơ Xương, Trụ Vương",
    summary: "Bị Trụ Vương nghi kỵ và giam cầm ở Dũ Lý suốt 7 năm, Cơ Xương đã nhẫn nhục chịu đựng, âm thầm diễn giải Bát Quái. Các con trai và bề tôi của ông đã phải dâng mỹ nữ và bảo vật để chuộc ông ra.",
    consequences: "Sau khi được thả về, Cơ Xương quyết tâm chiêu hiền đãi sĩ, tìm kiếm nhân tài để lật đổ nhà Thương. Ông đã tìm được Khương Tử Nha, đặt nền móng cho cuộc phạt Trụ của con trai ông là Cơ Phát (Chu Vũ Vương)."
  },
  {
    year: 25,
    title: "Khương Tử Nha Xuống Núi",
    location: "Núi Côn Lôn, Sông Vị Thủy",
    involvedParties: "Khương Tử Nha, Nguyên Thủy Thiên Tôn, Cơ Xương",
    summary: "Khương Tử Nha, đệ tử của Nguyên Thủy Thiên Tôn, phụng mệnh sư phụ xuống núi để phò Chu diệt Thương, hoàn thành đại nghiệp Phong Thần.",
    consequences: "Khương Tử Nha đến bờ sông Vị Thủy buông câu, chờ đợi minh chủ. Cơ Xương tìm đến và phong ông làm thừa tướng, chính thức khởi động cuộc chiến giữa Chu và Thương."
  },
  {
    year: 29,
    title: "Hoàng Phi Hổ Phản Trụ",
    location: "Triều Ca, Tây Kỳ",
    involvedParties: "Hoàng Phi Hổ, Trụ Vương, Đát Kỷ",
    summary: "Trấn quốc Võ Thành Vương Hoàng Phi Hổ vì vợ và em gái bị Trụ Vương và Đát Kỷ bức hại đến chết đã vô cùng phẫn nộ. Ông quyết định phản lại nhà Thương, vượt qua 5 cửa ải, mang theo gia quyến và thuộc hạ về với Tây Kỳ.",
    consequences: "Nhà Thương mất đi một trụ cột quân sự quan trọng, trong khi nhà Chu có thêm một vị mãnh tướng. Sự kiện này làm rúng động triều đình và cho thấy sự mục nát của Trụ Vương, củng cố thêm tính chính danh cho cuộc phạt Trụ."
  },
    {
    year: 32,
    title: "Thập Tuyệt Trận",
    location: "Phía ngoài thành Tây Kỳ",
    involvedParties: "Thập Thiên Quân (Triệt Giáo), Xiển Giáo Thập Nhị Kim Tiên",
    summary: "Thập Thiên Quân của Triệt Giáo đã bày ra mười trận pháp vô cùng lợi hại, gây ra tổn thất nặng nề cho quân Chu và các đệ tử Xiển Giáo.",
    consequences: "Để phá Thập Tuyệt Trận, Xiển Giáo đã phải nhờ đến các đại tiên, thậm chí cả Nguyên Thủy Thiên Tôn và Lão Tử. Nhiều đạo hữu của Triệt Giáo đã phải lên Phong Thần Bảng, làm sâu sắc thêm mâu thuẫn giữa hai giáo."
  },
  {
    year: 33,
    title: "Triệu Công Minh Trợ Trận",
    location: "Tây Kỳ",
    involvedParties: "Triệu Công Minh, Xiển Giáo Kim Tiên, Nhiên Đăng Đạo Nhân",
    summary: "Nghe tin đồng môn bị hại, Triệu Công Minh cưỡi Hắc Hổ, mang theo Định Hải Châu và Thần Tiên đến trợ giúp Văn Trọng. Ông đã một mình đánh bại nhiều cao thủ Xiển Giáo, kể cả Thập Nhị Kim Tiên.",
    consequences: "Sự xuất hiện của Triệu Công Minh đã đẩy cuộc chiến lên một tầm cao mới. Cuối cùng, ông bị Khương Tử Nha và Lục Áp Đạo Nhân dùng thuật 'Đinh Đầu Thất Tiễn' để ám hại. Cái chết của ông đã châm ngòi cho sự kiện kinh thiên động địa hơn: Tam Tiêu Bày Cửu Khúc Hoàng Hà Trận."
  },
  {
    year: 34,
    title: "Cửu Khúc Hoàng Hà Trận",
    location: "Tây Kỳ",
    involvedParties: "Vân Tiêu, Quỳnh Tiêu, Bích Tiêu (Tam Tiêu), Thập Nhị Kim Tiên",
    summary: "Để báo thù cho anh trai Triệu Công Minh, Tam Tiêu đã bày ra Cửu Khúc Hoàng Hà Trận. Trận pháp này vô cùng lợi hại, đã bắt và gọt bỏ tu vi của toàn bộ Thập Nhị Kim Tiên, biến họ thành凡人.",
    consequences: "Xiển Giáo gặp phải kiếp nạn lớn nhất từ trước đến nay. Nguyên Thủy Thiên Tôn và Lão Tử đã phải đích thân ra tay mới phá được trận, thu phục Tam Tiêu. Sự kiện này cho thấy mâu thuẫn giữa hai giáo đã không thể cứu vãn."
  },
  {
    year: 37,
    title: "Vạn Tiên Trận",
    location: "Gần Giới Bài Quan",
    involvedParties: "Thông Thiên Giáo Chủ, Lão Tử, Nguyên Thủy Thiên Tôn, Tiếp Dẫn, Chuẩn Đề",
    summary: "Sau nhiều thất bại, Thông Thiên Giáo Chủ tức giận bày ra Vạn Tiên Trận, quy tụ hàng vạn tiên nhân của Triệt Giáo để quyết một trận sống mái với Xiển Giáo.",
    consequences: "Đây là trận chiến lớn nhất và bi thảm nhất. Tứ Thánh (Lão Tử, Nguyên Thủy, Tiếp Dẫn, Chuẩn Đề) cùng nhau ra tay phá trận. Vạn Tiên Trận bị phá, Triệt Giáo tổn thất nặng nề, gần như toàn bộ đệ tử của ông đều phải lên Phong Thần Bảng hoặc bị bắt đi Tây Phương."
  },
  {
    year: 38,
    title: "Văn Trọng Băng hà tại Tuyệt Long Lĩnh",
    location: "Thung lũng Tuyệt Long",
    involvedParties: "Thái sư Văn Trọng, Vân Trung Tử, Nhiên Đăng Đạo Nhân",
    summary: "Thái sư Văn Trọng sau nhiều trận chiến đã bị dồn vào đường cùng tại Tuyệt Long Lĩnh. Dù chiến đấu anh dũng nhưng cuối cùng ông vẫn không thoát khỏi số kiếp, bị cột Thông Thiên Thần Hỏa của Vân Trung Tử thiêu chết.",
    consequences: "Cái chết của Văn Trọng là dấu chấm hết cho hy vọng cuối cùng của nhà Thương. Triều đình mất đi vị thái sư trung thành và mạnh mẽ nhất, quân đội nhà Chu thừa thắng xông lên, tiến thẳng về kinh đô Triều Ca."
  },
  {
    year: 39,
    title: "Trụ Vương Tự Thiêu",
    location: "Trích Tinh Lâu, Triều Ca",
    involvedParties: "Trụ Vương, Cơ Phát (Chu Võ Vương)",
    summary: "Đại quân nhà Chu công phá Triều Ca, Trụ Vương biết cơ nghiệp đã tận, bèn mặc thiên tử bào, gom hết châu báu lên Trích Tinh Lâu rồi tự thiêu. Đát Kỷ và các yêu hồ khác cũng bị Khương Tử Nha trảm giết.",
    consequences: "Nhà Thương chính thức diệt vong. Chu Võ Vương Cơ Phát lên ngôi, lập ra nhà Chu, mở ra một triều đại mới kéo dài 800 năm."
  },
  {
    year: 40,
    title: "Khương Tử Nha Phong Thần",
    location: "Phong Thần Đài, Tây Kỳ",
    involvedParties: "Khương Tử Nha, các linh hồn trên Phong Thần Bảng",
    summary: "Sau khi đại cục đã định, Khương Tử Nha vâng lệnh Nguyên Thủy Thiên Tôn, lên Phong Thần Đài, dùng Đả Thần Tiên và Phong Thần Bảng để sắc phong 365 vị chính thần, định lại trật tự Tam Giới.",
    consequences: "Đại kiếp Phong Thần kết thúc. Các tiên nhân có tên trên bảng được phong làm thần, chịu sự quản lý của Thiên Đình. Thiên Đình từ đó có đủ nhân lực, trật tự Tam Giới được thiết lập lại. Những người không có tên trên bảng tiếp tục con đường tu tiên của mình."
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
    { id: 'thanh_ha_tran', name: 'Thanh Hà Trấn', description: 'Một trấn nhỏ yên bình nằm bên cạnh con sông lớn, là nơi giao thương của các thôn làng lân cận.', type: 'Thôn Làng', neighbors: ['rung_co_thu', 'song_vi_thuy'], coordinates: { x: 5, y: 5 }, qiConcentration: 5, contextualActions: [{ id: 'talk_villagers', label: 'Nghe ngóng tin đồn', description: 'Trò chuyện với dân làng để thu thập thông tin.', icon: GiTalk }, { id: 'rest_inn', label: 'Nghỉ tại quán trọ', description: 'Nghỉ ngơi để hồi phục thể lực.', icon: GiBed }] },
    { id: 'rung_co_thu', name: 'Rừng Cổ Thụ', description: 'Một khu rừng rậm rạp với những cây cổ thụ cao chọc trời, là nơi trú ngụ của nhiều yêu thú cấp thấp.', type: 'Hoang Dã', neighbors: ['thanh_ha_tran', 'hac_long_dam', 'thanh_loan_son', 'rung_me_vu'], isExplorable: true, coordinates: { x: 4, y: 6 }, qiConcentration: 15, 
        resources: [
            { id: 'res_linh_tam_thao', name: 'Linh Tâm Thảo', description: 'Linh thảo phổ biến, dùng để luyện đan.', itemId: 'linh_tam_thao', requiredSkill: { attribute: 'Ngự Khí Thuật', value: 5 }, apCost: 2 },
            { id: 'res_thanh_diep_hoa', name: 'Thanh Diệp Hoa', description: 'Một loại hoa có tác dụng thanh lọc.', itemId: 'thanh_diep_hoa', requiredSkill: { attribute: 'Ngự Khí Thuật', value: 10 }, apCost: 2 }
        ],
        contextualActions: [{ id: 'gather_herbs', label: 'Hái Linh Thảo', description: 'Tìm kiếm các loại linh thảo trong rừng.', icon: GiHerbsBundle }] 
    },
    { id: 'hac_long_dam', name: 'Hắc Long Đàm', description: 'Một hồ nước sâu không thấy đáy, quanh năm bao phủ bởi sương mù, tương truyền có giao long ẩn náu.', type: 'Bí Cảnh', neighbors: ['rung_co_thu'], coordinates: { x: 3, y: 8 }, qiConcentration: 25 },
    { id: 'song_vi_thuy', name: 'Sông Vị Thủy', description: 'Một con sông lớn chảy xiết, nghe đồn Khương Tử Nha từng buông câu tại đây.', type: 'Hoang Dã', neighbors: ['thanh_ha_tran', 'trieu_ca', 'tay_ky'], coordinates: { x: 7, y: 5 }, qiConcentration: 12 },
    { id: 'trieu_ca', name: 'Triều Ca', description: 'Kinh đô của nhà Thương, phồn hoa và tráng lệ, nhưng ẩn chứa nhiều âm mưu và nguy hiểm.', type: 'Thành Thị', neighbors: ['song_vi_thuy', 'tam_son_quan', 'loc_dai', 'ky_chau', 'thanh_khau_quoc', 'cuu_le_thon', 'hien_vien_mo'], coordinates: { x: 12, y: 5 }, qiConcentration: 2 },
    { id: 'tam_son_quan', name: 'Tam Sơn Quan', description: 'Cửa ải quân sự trọng yếu của nhà Thương, canh gác con đường tiến vào kinh đô.', type: 'Quan Ải', neighbors: ['trieu_ca', 'dong_hai', 'nui_cuu_long'], coordinates: { x: 15, y: 7 }, qiConcentration: 3 },
    { id: 'dong_hai', name: 'Đông Hải', description: 'Vùng biển rộng lớn phía đông, là địa bàn của Long Tộc. Sóng to gió lớn, cực kỳ nguy hiểm.', type: 'Hoang Dã', neighbors: ['tam_son_quan', 'dao_ngao_binh', 'tran_duong_quan', 'bich_du_cung', 'dao_tam_tien', 'bong_lai_tien_dao', 'phuong_truong_tien_son', 'doanh_chau_tien_dao'], coordinates: { x: 20, y: 8 }, qiConcentration: 18 },
    { id: 'dao_ngao_binh', name: 'Đảo Ngao Binh', description: 'Một hòn đảo nhỏ ở Đông Hải, là tiền đồn của Long Cung.', type: 'Bí Cảnh', neighbors: ['dong_hai'], coordinates: { x: 22, y: 10 }, qiConcentration: 22 },
    { id: 'thanh_loan_son', name: 'Thanh Loan Sơn', description: 'Ngọn núi linh thiêng, quanh năm có mây mù bao phủ, là nơi tu luyện của các tán tu.', type: 'Sơn Mạch', neighbors: ['rung_co_thu', 'con_lon_son', 'dong_phu', 'bach_cot_dong'], coordinates: { x: 2, y: 3 }, qiConcentration: 30,
        resources: [
             { id: 'res_hac_thiet', name: 'Hắc Thiết Khoáng', description: 'Khoáng thạch phổ biến, dùng để luyện khí.', itemId: 'hac_thiet_khoang', requiredSkill: { attribute: 'Lực Lượng', value: 15 }, apCost: 3 }
        ],
        contextualActions: [{ id: 'mine_ore', label: 'Khai Khoáng', description: 'Tìm kiếm và khai thác khoáng thạch.', icon: GiStoneBlock }] 
    },
    { id: 'tay_ky', name: 'Tây Kỳ', description: 'Kinh đô của nhà Chu, nơi Cơ Xương cai quản. Đất đai trù phú, lòng dân quy thuận, đang chiêu hiền đãi sĩ.', type: 'Thành Thị', neighbors: ['song_vi_thuy', 'gioi_bai_quan', 'tay_tho', 'loi_trach', 'vo_tan_sa_mac'], coordinates: { x: 8, y: 2 }, qiConcentration: 4 },
    { id: 'con_lon_son', name: 'Côn Lôn Sơn', description: 'Dãy núi tổ của vạn sơn, là đạo trường của Xiển Giáo do Nguyên Thủy Thiên Tôn đứng đầu. Linh khí nồng đậm, tiên cảnh ngút ngàn.', type: 'Thánh Địa', neighbors: ['thanh_loan_son', 'ngoc_hu_cung', 'dieu_tri', 'bat_chu_son'], coordinates: { x: 1, y: 1 }, qiConcentration: 100 },
    { id: 'tran_duong_quan', name: 'Trần Đường Quan', description: 'Một cửa ải do Lý Tịnh trấn giữ, nằm gần Đông Hải.', type: 'Quan Ải', neighbors: ['dong_hai'], coordinates: { x: 18, y: 6 }, qiConcentration: 3 },
    { id: 'bich_du_cung', name: 'Bích Du Cung', description: 'Đạo trường của Triệt Giáo do Thông Thiên Giáo Chủ đứng đầu, nằm trên một hòn đảo tiên ngoài Đông Hải. Vạn tiên đến triều, khí thế ngất trời.', type: 'Thánh Địa', neighbors: ['dong_hai', 'kim_ngao_dao'], coordinates: { x: 25, y: 12 }, qiConcentration: 120 },
    { id: 'ngoc_hu_cung', name: 'Ngọc Hư Cung', description: 'Cung điện của Nguyên Thủy Thiên Tôn, nằm trên đỉnh cao nhất của Côn Lôn Sơn, mây mù bao phủ, không phải tiên nhân không thể đến.', type: 'Thánh Địa', neighbors: ['con_lon_son'], coordinates: { x: 0, y: 0 }, qiConcentration: 150 },
    { id: 'kim_ngao_dao', name: 'Kim Ngao Đảo', description: 'Hòn đảo nơi Bích Du Cung tọa lạc, là trung tâm của Triệt Giáo.', type: 'Thánh Địa', neighbors: ['bich_du_cung'], coordinates: { x: 26, y: 13 }, qiConcentration: 110 },
    { id: 'hoa_van_dong', name: 'Hỏa Vân Động', description: 'Nơi ở của Tam Thánh Hoàng: Phục Hy, Thần Nông, Hiên Viên. Là thánh địa của nhân tộc.', type: 'Thánh Địa', neighbors: ['tay_tho', 'thu_duong_son'], coordinates: { x: 10, y: 0 }, qiConcentration: 80 },
    { id: 'ky_chau', name: 'Ký Châu', description: 'Một trong cửu châu, do Ký Châu hầu Tô Hộ cai quản. Đây là quê hương của Đát Kỷ.', type: 'Thành Thị', neighbors: ['trieu_ca', 'sung_thanh'], coordinates: { x: 14, y: 3 }, qiConcentration: 3 },
    { id: 'sung_thanh', name: 'Sùng Thành', description: 'Đất phong của Bắc Bá Hầu Sùng Hầu Hổ, một chư hầu trung thành với Trụ Vương.', type: 'Thành Thị', neighbors: ['ky_chau', 'bac_hai', 'thuong_lang_thao_nguyen'], coordinates: { x: 16, y: 1 }, qiConcentration: 2 },
    { id: 'rung_me_vu', name: 'Rừng Mê Vụ', description: 'Một khu rừng quanh năm sương mù, dễ lạc đường, là nơi ẩn náu của nhiều yêu ma và tu sĩ tà đạo.', type: 'Hoang Dã', isExplorable: true, neighbors: ['rung_co_thu', 'bai_tha_ma'], coordinates: { x: 3, y: 4 }, qiConcentration: 18 },
    { id: 'dieu_tri', name: 'Diêu Trì', description: 'Nơi ở của Tây Vương Mẫu trên Côn Lôn, nổi tiếng với vườn bàn đào.', type: 'Bí Cảnh', neighbors: ['con_lon_son'], coordinates: { x: 2, y: 0 }, qiConcentration: 90 },
    { id: 'ngu_trang_quan', name: 'Ngũ Trang Quan', description: 'Đạo quan của Trấn Nguyên Tử đại tiên trên Vạn Thọ Sơn, nổi tiếng với cây Nhân Sâm Quả.', type: 'Thánh Địa', neighbors: ['tay_tho'], coordinates: { x: 7, y: 0 }, qiConcentration: 85 },
    { id: 'bach_cot_dong', name: 'Bạch Cốt Động', description: 'Hang động của Thạch Cơ Nương Nương, âm u và đầy xương trắng.', type: 'Bí Cảnh', neighbors: ['thanh_loan_son'], coordinates: { x: 0, y: 4 }, qiConcentration: 20 },
    { id: 'hien_vien_mo', name: 'Hiên Viên Mộ', description: 'Lăng mộ của Hiên Viên Hoàng Đế, nhưng đã trở thành sào huyệt của tam yêu, bao gồm Cửu Vỹ Hồ.', type: 'Bí Cảnh', neighbors: ['trieu_ca', 'yeu_than_dien'], coordinates: { x: 13, y: 6 }, qiConcentration: 28 },
    { id: 'oa_hoang_cung', name: 'Oa Hoàng Cung', description: 'Cung điện của Nữ Oa Nương Nương, một trong những vị thần cổ xưa nhất.', type: 'Thánh Địa', neighbors: ['thien_ha'], coordinates: { x: 18, y: 0 }, qiConcentration: 200 },
    { id: 'gioi_bai_quan', name: 'Giới Bài Quan', description: 'Cửa ải chiến lược giữa Tây Kỳ và Triều Ca, nơi diễn ra nhiều trận đại chiến.', type: 'Quan Ải', neighbors: ['tay_ky', 'thung_lung_tuyet_long'], coordinates: { x: 10, y: 2 }, qiConcentration: 3 },
    { id: 'loc_dai', name: 'Lộc Đài', description: 'Một công trình xa hoa do Trụ Vương xây dựng để lấy lòng Đát Kỷ, nơi diễn ra vô số cuộc yến tiệc trác táng.', type: 'Thành Thị', neighbors: ['trieu_ca'], coordinates: { x: 11, y: 6 }, qiConcentration: 1 },
    { id: 'bai_tha_ma', name: 'Bãi Tha Ma', description: 'Chiến trường cổ xưa đầy oán khí, là nơi tuyệt vời để luyện các công pháp tà đạo.', type: 'Hoang Dã', isExplorable: true, neighbors: ['rung_me_vu', 'vong_xuyen_ha', 'ma_gioi_nhap_khau'], coordinates: { x: 4, y: 10 }, qiConcentration: 22 },
    { id: 'nui_cuu_long', name: 'Núi Cửu Long', description: 'Nơi có Cửu Long Đảo, đạo trường của tứ thánh Triệt Giáo.', type: 'Sơn Mạch', neighbors: ['tam_son_quan'], coordinates: { x: 16, y: 9 }, qiConcentration: 35 },
    { id: 'dao_tam_tien', name: 'Đảo Tam Tiên', description: 'Hòn đảo tiên nơi Tam Tiêu Tiên Tử tu luyện.', type: 'Bí Cảnh', neighbors: ['dong_hai'], coordinates: { x: 24, y: 10 }, qiConcentration: 45 },
    { id: 'thung_lung_tuyet_long', name: 'Thung lũng Tuyệt Long', description: 'Một thung lũng hiểm trở, nơi Thái sư Văn Trọng tử trận.', type: 'Bí Cảnh', neighbors: ['gioi_bai_quan'], coordinates: { x: 10, y: 4 }, qiConcentration: 10 },
    { id: 'tay_tho', name: 'Tây Thổ', description: 'Vùng đất rộng lớn phía Tây, màu mỡ và trù phú, thuộc phạm vi cai quản của Tây Bá Hầu.', type: 'Thành Thị', neighbors: ['tay_ky', 'ngu_trang_quan', 'hoa_van_dong', 'linh_son'], coordinates: { x: 8, y: 0 }, qiConcentration: 5 },
    { id: 'bac_hai', name: 'Bắc Hải', description: 'Vùng đất phương Bắc lạnh giá, nơi các chư hầu thường xuyên nổi loạn.', type: 'Hoang Dã', neighbors: ['sung_thanh', 'bac_minh_cung', 'thuong_lang_thao_nguyen'], coordinates: { x: 17, y: -1 }, qiConcentration: 10 },
    { id: 'dong_phu', name: 'Động Phủ Bí Mật', description: 'Một nơi ẩn tu hẻo lánh, linh khí hội tụ, thích hợp để khai sơn lập phủ.', type: 'Bí Cảnh', neighbors: ['thanh_loan_son'], coordinates: { x: 1, y: 4 }, qiConcentration: 40, contextualActions: [{ id: 'closed_door_cultivation', label: 'Bế quan tu luyện', description: 'Tập trung tu luyện trong thời gian dài để đột phá.', icon: GiMountainCave }, { id: 'alchemy', label: 'Luyện Đan', description: 'Sử dụng Luyện Đan Thất để luyện chế đan dược.', icon: GiCauldron }] },
    { id: 'vong_xuyen_ha', name: 'Vong Xuyên Hà', description: 'Con sông ngăn cách cõi âm và cõi dương, nước sông vàng đục, không một sinh vật nào có thể sống sót.', type: 'Hoang Dã', neighbors: ['bai_tha_ma', 'dia_phu_mon'], coordinates: { x: 5, y: 12 }, qiConcentration: -10 },
    { id: 'dia_phu_mon', name: 'Địa Phủ Môn', description: 'Cánh cổng khổng lồ dẫn đến địa phủ, được các âm binh canh gác nghiêm ngặt.', type: 'Bí Cảnh', neighbors: ['vong_xuyen_ha'], coordinates: { x: 5, y: 14 }, qiConcentration: -5 },
    { id: 'bac_minh_cung', name: 'Bắc Minh Cung', description: 'Cung điện của Côn Bằng Yêu Sư, nằm dưới biển Bắc Minh sâu thẳm, lạnh giá thấu xương.', type: 'Thánh Địa', neighbors: ['bac_hai'], coordinates: { x: 18, y: -3 }, qiConcentration: 75 },
    { id: 'yeu_than_dien', name: 'Yêu Thần Điện', description: 'Một ngôi điện cổ kính thờ phụng các Yêu Thần thượng cổ, ẩn sâu trong lòng đất, là nơi bí mật của Yêu Tộc.', type: 'Bí Cảnh', neighbors: ['hien_vien_mo'], coordinates: { x: 14, y: 7 }, qiConcentration: 40 },
    { id: 'tay_phuong_giao', name: 'Tây Phương Giáo', description: 'Thánh địa của giáo phái đến từ Tây Thổ, do hai vị giáo chủ Tiếp Dẫn và Chuẩn Đề đứng đầu, ánh sáng phật pháp soi rọi.', type: 'Thánh Địa', neighbors: ['linh_son'], coordinates: { x: -5, y: 5 }, qiConcentration: 95 },
    { id: 'linh_son', name: 'Linh Sơn', description: 'Ngọn núi chính của Tây Phương Giáo, nơi có Bát Bảo Công Đức Trì và hàng vạn tín đồ tu hành.', type: 'Sơn Mạch', neighbors: ['tay_phuong_giao', 'tay_tho'], coordinates: { x: -4, y: 4 }, qiConcentration: 55 },
    { id: 'ma_gioi_nhap_khau', name: 'Ma Giới Nhập Khẩu', description: 'Một khe nứt không gian không ổn định, tỏa ra ma khí nồng đậm, là lối thông đến Ma Giới.', type: 'Bí Cảnh', neighbors: ['bai_tha_ma'], coordinates: { x: 3, y: 11 }, qiConcentration: -20 },
    { id: 'thanh_khau_quoc', name: 'Thanh Khâu Quốc', description: 'Vùng đất của Cửu Vỹ Hồ Tộc, cảnh đẹp như tranh vẽ nhưng đầy ảo ảnh và cạm bẫy.', type: 'Thành Thị', neighbors: ['trieu_ca'], coordinates: { x: 10, y: 8 }, qiConcentration: 25 },
    { id: 'bat_chu_son', name: 'Bất Chu Sơn', description: 'Cột chống trời thời thượng cổ, đã bị Cung Công húc đổ, tàn tích vẫn còn tỏa ra uy áp kinh người.', type: 'Sơn Mạch', neighbors: ['con_lon_son'], coordinates: { x: -2, y: -2 }, qiConcentration: 60 },
    { id: 'thai_am_tinh', name: 'Thái Âm Tinh', description: 'Ngôi sao của mặt trăng, nơi ở của Hằng Nga, âm khí cực thịnh, không phải tiên nhân không thể đặt chân đến.', type: 'Thánh Địa', neighbors: [], coordinates: { x: 10, y: -5 }, qiConcentration: 110 },
    { id: 'thai_duong_tinh', name: 'Thái Dương Tinh', description: 'Ngôi sao của mặt trời, nơi ở của Kim Ô, dương khí hừng hực, có thể thiêu đốt vạn vật.', type: 'Thánh Địa', neighbors: [], coordinates: { x: 15, y: -5 }, qiConcentration: 110 },
    { id: 'bong_lai_tien_dao', name: 'Bồng Lai Tiên Đảo', description: 'Một trong ba hòn đảo tiên huyền thoại trên Đông Hải, nơi ở của các tán tiên thượng cổ.', type: 'Bí Cảnh', neighbors: ['dong_hai'], coordinates: { x: 28, y: 6 }, qiConcentration: 70 },
    { id: 'phuong_truong_tien_son', name: 'Phương Trượng Tiên Sơn', description: 'Một trong ba hòn đảo tiên huyền thoại, mây mù bao phủ, khó tìm thấy dấu vết.', type: 'Bí Cảnh', neighbors: ['dong_hai'], coordinates: { x: 29, y: 9 }, qiConcentration: 70 },
    { id: 'doanh_chau_tien_dao', name: 'Doanh Châu Tiên Đảo', description: 'Một trong ba hòn đảo tiên huyền thoại, tương truyền có cỏ bất tử.', type: 'Bí Cảnh', neighbors: ['dong_hai'], coordinates: { x: 27, y: 15 }, qiConcentration: 70 },
    { id: 'loi_trach', name: 'Lôi Trạch', description: 'Một đầm lầy rộng lớn, quanh năm có sấm sét đánh xuống, là nơi cực kỳ nguy hiểm nhưng cũng là nơi luyện thể tuyệt vời.', type: 'Hoang Dã', neighbors: ['tay_ky'], coordinates: { x: 9, y: 4 }, qiConcentration: 30 },
    { id: 'thu_duong_son', name: 'Thủ Dương Sơn', description: 'Nơi ở của Bá Di, Thúc Tề. Linh khí trong lành, thích hợp cho tu sĩ nho giáo tu tâm dưỡng tính.', type: 'Sơn Mạch', neighbors: ['hoa_van_dong'], coordinates: { x: 11, y: -1 }, qiConcentration: 40 },
    { id: 'cuu_le_thon', name: 'Cửu Lê Thôn', description: 'Một ngôi làng nhỏ của hậu duệ Xi Vưu, người dân dũng mãnh, am hiểu vu thuật.', type: 'Thôn Làng', neighbors: ['trieu_ca'], coordinates: { x: 12, y: 8 }, qiConcentration: 8 },
    { id: 'thuong_lang_thao_nguyen', name: 'Thảo nguyên Thương Lang', description: 'Thảo nguyên rộng lớn ở phương bắc, là nơi sinh sống của các bộ tộc du mục và bầy sói yêu.', type: 'Hoang Dã', neighbors: ['sung_thanh', 'bac_hai'], coordinates: { x: 17, y: -2 }, qiConcentration: 10 },
    { id: 'vo_tan_sa_mac', name: 'Sa mạc Vô Tận', description: 'Biển cát mênh mông, thời tiết khắc nghiệt, ẩn giấu nhiều di tích của các vương triều cổ đại.', type: 'Hoang Dã', neighbors: ['tay_ky'], coordinates: { x: 4, y: 0 }, qiConcentration: 5 },
    { id: 'thien_ha', name: 'Thiên Hà', description: 'Con sông chảy trên chín tầng trời, ngăn cách Thiên Đình và nhân gian, nước sông có sức mạnh cuốn trôi tiên thể.', type: 'Hoang Dã', neighbors: ['oa_hoang_cung'], coordinates: { x: 20, y: -2 }, qiConcentration: 50 },
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
            { id: 'tc_1', name: 'Sơ Kỳ', qiRequired: 100000, bonuses: [{ attribute: 'Căn Cốt', value: 10 }, { attribute: 'Nguyên Thần', value: 10 }], description: 'Đạo cơ hình thành, thần thức có thể xuất ra ngoài.' },
            { id: 'tc_2', name: 'Trung Kỳ', qiRequired: 250000, bonuses: [{ attribute: 'Căn Cốt', value: 10 }, { attribute: 'Nguyên Thần', value: 10 }], description: 'Đạo cơ vững chắc, có thể bắt đầu ngự vật phi hành.' },
            { id: 'tc_3', name: 'Hậu Kỳ', qiRequired: 500000, bonuses: [{ attribute: 'Căn Cốt', value: 15 }, { attribute: 'Nguyên Thần', value: 15 }, { attribute: 'Tuổi Thọ', value: 50 }], description: 'Chân nguyên hùng hậu, chuẩn bị ngưng tụ Kim Đan.' },
        ]
    },
    {
        id: 'ket_dan', name: 'Kết Đan Kỳ',
        description: 'Ngưng tụ toàn bộ chân nguyên trong cơ thể thành một viên Kim Đan. Một khi thành công, tu sĩ sẽ chính thức bước vào hàng ngũ cao thủ, tuổi thọ tăng lên 500 năm.',
        stages: [
            { id: 'kd_1', name: 'Sơ Kỳ', qiRequired: 1500000, bonuses: [{ attribute: 'Linh Lực Sát Thương', value: 20 }, { attribute: 'Bền Bỉ', value: 20 }], description: 'Kim đan sơ thành, có thể sử dụng Đan hỏa.'},
            { id: 'kd_2', name: 'Trung Kỳ', qiRequired: 4000000, bonuses: [{ attribute: 'Linh Lực Sát Thương', value: 25 }, { attribute: 'Bền Bỉ', value: 25 }], description: 'Kim đan ổn định, uy lực pháp thuật tăng mạnh.'},
            { id: 'kd_3', name: 'Hậu Kỳ', qiRequired: 10000000, bonuses: [{ attribute: 'Linh Lực Sát Thương', value: 30 }, { attribute: 'Bền Bỉ', value: 30 }, { attribute: 'Tuổi Thọ', value: 150 }], description: 'Kim đan viên mãn, chuẩn bị cho việc phá đan thành anh.'},
        ]
    },
    {
        id: 'nguyen_anh', name: 'Nguyên Anh Kỳ',
        description: 'Phá vỡ Kim Đan, thai nghén ra một "Nguyên Anh" - một tiểu nhân giống hệt bản thân và chứa đựng toàn bộ tinh, khí, thần. Nguyên Anh có thể xuất khiếu, ngao du thái hư. Tuổi thọ đạt 1000 năm.',
        hasTribulation: true,
        stages: [
            { id: 'na_1', name: 'Sơ Kỳ', qiRequired: 50000000, bonuses: [{ attribute: 'Nguyên Thần', value: 50 }, { attribute: 'Ngộ Tính', value: 20 }], description: 'Nguyên Anh được sinh ra, có thể đoạt xá trùng sinh.' },
            { id: 'na_2', name: 'Trung Kỳ', qiRequired: 150000000, bonuses: [{ attribute: 'Nguyên Thần', value: 50 }, { attribute: 'Ngộ Tính', value: 20 }], description: 'Nguyên Anh lớn mạnh, có thể thi triển các thần thông mạnh mẽ.'},
            { id: 'na_3', name: 'Hậu Kỳ', qiRequired: 400000000, bonuses: [{ attribute: 'Nguyên Thần', value: 60 }, { attribute: 'Ngộ Tính', value: 30 }, { attribute: 'Tuổi Thọ', value: 300 }], description: 'Nguyên Anh và nhục thân hợp nhất, chuẩn bị cho Hóa Thần.'},
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
            { id: 'lh_1', name: 'Sơ Kỳ', qiRequired: 20000000000, bonuses: [{ attribute: 'Nguyên Thần', value: 100 }, { attribute: 'Ngộ Tính', value: 50 }], description: 'Thần thức hóa hư, có thể cảm nhận các dòng chảy quy tắc.' },
            { id: 'lh_2', name: 'Hậu Kỳ', qiRequired: 50000000000, bonuses: [{ attribute: 'Nguyên Thần', value: 150 }, { attribute: 'Tuổi Thọ', value: 2000 }], description: 'Có thể điều động một phần quy tắc lực, tạo ra hư không lĩnh vực.' },
        ]
    },
    {
        id: 'hop_the', name: 'Hợp Thể Kỳ',
        description: 'Nhục thân và nguyên thần hoàn toàn hợp nhất với thiên địa, đạt tới cảnh giới "thiên nhân hợp nhất". Sức mạnh vô song, có thể di sơn đảo hải. Tuổi thọ đạt 10.000 năm.',
        stages: [
            { id: 'hthe_1', name: 'Sơ Kỳ', qiRequired: 100000000000, bonuses: [{ attribute: 'Căn Cốt', value: 100 }, { attribute: 'Linh Lực Sát Thương', value: 100 }], description: 'Mỗi cử động đều ẩn chứa uy lực của thiên địa.' },
            { id: 'hthe_2', name: 'Trung Kỳ', qiRequired: 250000000000, bonuses: [{ attribute: 'Căn Cốt', value: 120 }, { attribute: 'Linh Lực Sát Thương', value: 120 }], description: 'Pháp tướng thiên địa, sức mạnh kinh người.' },
            { id: 'hthe_3', name: 'Hậu Kỳ', qiRequired: 500000000000, bonuses: [{ attribute: 'Căn Cốt', value: 150 }, { attribute: 'Linh Lực Sát Thương', value: 150 }, { attribute: 'Tuổi Thọ', value: 5000 }], description: 'Hợp thể viên mãn, chuẩn bị cho Đại Thừa.' },
        ]
    },
    {
        id: 'dai_thua', name: 'Đại Thừa Kỳ',
        description: 'Đại đạo thành tựu, là cảnh giới đỉnh cao của nhân gian. Tu sĩ Đại Thừa đã gần như bất tử, chỉ còn một bước nữa là phi thăng tiên giới. Tuổi thọ không còn là giới hạn.',
        hasTribulation: true,
        stages: [
            { id: 'dt_1', name: 'Sơ Kỳ', qiRequired: 1000000000000, bonuses: [{ attribute: 'Lực Lượng', value: 200 }, { attribute: 'Thân Pháp', value: 200 }, { attribute: 'Nguyên Thần', value: 200 }], description: 'Lĩnh ngộ hoàn toàn một đại đạo.' },
            { id: 'dt_2', name: 'Trung Kỳ', qiRequired: 2000000000000, bonuses: [{ attribute: 'Linh Lực Sát Thương', value: 200 }, { attribute: 'Bền Bỉ', value: 200 }], description: 'Ngôn xuất pháp tùy, ý niệm di chuyển vạn dặm.' },
            { id: 'dt_3', name: 'Hậu Kỳ', qiRequired: 5000000000000, bonuses: [{ attribute: 'Ngộ Tính', value: 100 }, { attribute: 'Cơ Duyên', value: 50 }], description: 'Viên mãn vô khuyết, có thể cảm ứng được tiên giới chi môn.' },
        ]
    },
    {
        id: 'do_kiep', name: 'Độ Kiếp Kỳ',
        description: 'Đối mặt với thiên kiếp cuối cùng, là thử thách để thoát ly phàm tục, phi thăng tiên giới. Thành công thì thành tiên, thất bại thì hồn phi phách tán.',
        stages: [
            { id: 'dk_1', name: 'Thiên Lôi Kiếp', qiRequired: 1e13, bonuses: [{ attribute: 'Tuổi Thọ', value: 99999 }], description: 'Vượt qua chín chín tám mươi mốt đạo thiên lôi.' },
            { id: 'dk_2', name: 'Tâm Ma Kiếp', qiRequired: 2e13, bonuses: [{ attribute: 'Đạo Tâm', value: 100 }], description: 'Trảm phá tâm ma cuối cùng, đạo tâm viên mãn.' },
            { id: 'dk_3', name: 'Phi Thăng', qiRequired: 5e13, bonuses: [{ attribute: 'Cơ Duyên', value: 100 }], description: 'Phá vỡ hư không, phi thăng tiên giới.' },
        ]
    },
    {
        id: 'nhan_tien', name: 'Nhân Tiên',
        description: 'Thoát khỏi vòng luân hồi, thân thể hóa thành tiên躯, không còn bị sinh lão bệnh tử trói buộc. Tuổi thọ vĩnh cửu, nhưng vẫn còn trong tam giới.',
        stages: [
            { id: 'nt_1', name: 'Sơ Kỳ', qiRequired: 1e14, bonuses: [{ attribute: 'Căn Cốt', value: 200 }, { attribute: 'Nguyên Thần', value: 200 }], description: 'Tiên lực sơ thành, có thể miễn cưỡng du hành trong hư không.' },
            { id: 'nt_2', name: 'Hậu Kỳ', qiRequired: 5e14, bonuses: [{ attribute: 'Linh Lực Sát Thương', value: 200 }, { attribute: 'Bền Bỉ', value: 200 }], description: 'Tiên thể vững chắc, thần thông bắt đầu hiển lộ.' },
        ]
    },
    {
        id: 'dia_tien', name: 'Địa Tiên',
        description: 'Tiên nhân của mặt đất, hấp thụ địa khí để tu luyện, thần thông gắn liền với sơn xuyên đại địa. Sức mạnh bền bỉ, khó bị tiêu diệt.',
        stages: [
            { id: 'dtien_1', name: 'Sơ Kỳ', qiRequired: 1e15, bonuses: [{ attribute: 'Bền Bỉ', value: 300 }, { attribute: 'Sinh Mệnh', value: 5000 }], description: 'Có thể điều khiển sức mạnh của đất đá.' },
            { id: 'dtien_2', name: 'Hậu Kỳ', qiRequired: 5e15, bonuses: [{ attribute: 'Bền Bỉ', value: 400 }, { attribute: 'Căn Cốt', value: 300 }], description: 'Thân thể cứng như kim cương, có thể mượn sức mạnh từ long mạch.' },
        ]
    },
    {
        id: 'thien_tien', name: 'Thiên Tiên',
        description: 'Tiên nhân của trời cao, hấp thụ thiên địa linh khí, có thể tự do đi lại giữa các tầng trời. Pháp lực cao thâm, không bị trói buộc bởi mặt đất.',
        stages: [
            { id: 'tt_1', name: 'Sơ Kỳ', qiRequired: 1e16, bonuses: [{ attribute: 'Thân Pháp', value: 300 }, { attribute: 'Linh Lực Sát Thương', value: 300 }], description: 'Ngự không phi hành, tốc độ như điện.' },
            { id: 'tt_2', name: 'Hậu Kỳ', qiRequired: 5e16, bonuses: [{ attribute: 'Thân Pháp', value: 400 }, { attribute: 'Nguyên Thần', value: 300 }], description: 'Lĩnh ngộ pháp tắc không gian, thần thông biến hóa.' },
        ]
    },
    {
        id: 'nguyen_tien', name: 'Nguyên Tiên',
        description: 'Bắt đầu chạm đến bản nguyên của đại đạo, pháp lực không chỉ mạnh mà còn ẩn chứa quy tắc lực. Thần thông tự sinh, uy lực khó lường.',
        stages: [
            { id: 'ngt_1', name: 'Sơ Kỳ', qiRequired: 1e17, bonuses: [{ attribute: 'Ngộ Tính', value: 200 }, { attribute: 'Linh Lực Sát Thương', value: 400 }], description: 'Mỗi chiêu thức đều mang theo một tia đạo vận.' },
            { id: 'ngt_2', name: 'Hậu Kỳ', qiRequired: 5e17, bonuses: [{ attribute: 'Ngộ Tính', value: 300 }, { attribute: 'Nguyên Thần', value: 400 }], description: 'Có thể tạo ra các thần thông của riêng mình.' },
        ]
    },
    {
        id: 'kim_tien', name: 'Kim Tiên',
        description: 'Thân thể bất hoại, vạn kiếp không mài, là cảnh giới của phần lớn cao thủ trong tam giáo. Kim Tiên đã có tư cách khai tông lập phái, được người đời kính ngưỡng.',
        stages: [
            { id: 'kt_1', name: 'Sơ Kỳ', qiRequired: 1e18, bonuses: [{ attribute: 'Căn Cốt', value: 500 }, { attribute: 'Bền Bỉ', value: 500 }], description: 'Kim thân sơ thành, miễn nhiễm với phần lớn pháp thuật cấp thấp.' },
            { id: 'kt_2', name: 'Viên Mãn', qiRequired: 5e18, bonuses: [{ attribute: 'Căn Cốt', value: 600 }, { attribute: 'Bền Bỉ', value: 600 }], description: 'Kim thân viên mãn, là trụ cột của các đại giáo.' },
        ]
    },
    {
        id: 'thai_at', name: 'Thái Ất Kim Tiên',
        description: 'Kim Tiên đạt đến trình độ cao hơn, trên đỉnh đầu ngưng tụ tam hoa, trong lồng ngực kết thành ngũ khí. Là cấp bậc của Thập Nhị Kim Tiên Xiển Giáo.',
        stages: [
            { id: 'ta_1', name: 'Tam Hoa Tụ Đỉnh', qiRequired: 1e20, bonuses: [{ attribute: 'Nguyên Thần', value: 800 }, { attribute: 'Ngộ Tính', value: 500 }], description: 'Tinh, Khí, Thần hóa thành ba đóa hoa sen trên đỉnh đầu, vạn pháp bất xâm.' },
            { id: 'ta_2', name: 'Ngũ Khí Triều Nguyên', qiRequired: 5e20, bonuses: [{ attribute: 'Linh Lực Sát Thương', value: 800 }, { attribute: 'Bền Bỉ', value: 800 }], description: 'Ngũ tạng tương ứng với ngũ hành, pháp lực vô biên, sinh sôi không ngừng.' },
        ]
    },
    {
        id: 'dai_la', name: 'Đại La Kim Tiên',
        description: 'Nhảy ra khỏi tam giới, không còn trong ngũ hành. Đại La có nghĩa là tất cả không gian và thời gian, vĩnh hằng tự tại, là cảnh giới tối cao của tiên nhân.',
        stages: [
            { id: 'dl_1', name: 'Sơ Kỳ', qiRequired: 1e22, bonuses: [{ attribute: 'Cơ Duyên', value: 200 }, { attribute: 'Đạo Tâm', value: 200 }], description: 'Thoát khỏi xiềng xích của số mệnh, không bị nhân quả trói buộc.' },
            { id: 'dl_2', name: 'Viên Mãn', qiRequired: 5e22, bonuses: [{ attribute: 'Nhân Quả', value: 0 }], description: 'Bất tử bất diệt, ngao du trong dòng sông thời gian.' },
        ]
    },
    {
        id: 'chuan_thanh', name: 'Chuẩn Thánh',
        description: 'Chém tam thi, đã bước một chân vào cảnh giới Thánh Nhân. Là những tồn tại kinh khủng nhất dưới Thánh Nhân, một ý niệm có thể hủy diệt vô số thế giới.',
        stages: [
            { id: 'ct_1', name: 'Trảm Nhất Thi', qiRequired: 1e25, bonuses: [{ attribute: 'Lực Lượng', value: 2000 }, { attribute: 'Linh Lực Sát Thương', value: 2000 }], description: 'Chém bỏ một trong ba xác (thiện, ác, chấp niệm), sức mạnh tăng vọt.' },
            { id: 'ct_2', name: 'Trảm Nhị Thi', qiRequired: 5e25, bonuses: [{ attribute: 'Nguyên Thần', value: 2000 }, { attribute: 'Bền Bỉ', value: 2000 }], description: 'Chém bỏ hai xác, đã có thể được gọi là Á Thánh.' },
            { id: 'ct_3', name: 'Trảm Tam Thi', qiRequired: 1e26, bonuses: [{ attribute: 'Đạo Tâm', value: 1000 }, { attribute: 'Ngộ Tính', value: 1000 }], description: 'Chém cả ba xác, chỉ còn một bước nữa là chứng đạo thành Thánh.' },
        ]
    },
    {
        id: 'thanh_nhan', name: 'Thánh Nhân',
        description: 'Thiên đạo Thánh Nhân, vạn kiếp bất diệt, nguyên thần ký thác vào thiên đạo. Dưới thiên đạo đều là con kiến. Là những tồn tại tối cao, định ra quy luật của vũ trụ.',
        stages: [
            { id: 'tn_1', name: 'Thánh Nhân', qiRequired: Infinity, bonuses: [], description: 'Ngôn xuất pháp tùy, một lời nói có thể thay đổi thiên đạo.' },
        ]
    }
];

export const NPC_DENSITY_LEVELS: { id: NpcDensity; name: string; description: string; count: number }[] = [
    { id: 'low', name: 'Thưa Thớt', description: 'Ít NPC, thế giới yên tĩnh.', count: 10 },
    { id: 'medium', name: 'Vừa Phải', description: 'Cân bằng, thế giới sống động.', count: 20 },
    { id: 'high', name: 'Đông Đúc', description: 'Nhiều NPC, thế giới hỗn loạn.', count: 200 },
];

export const INITIAL_TECHNIQUES: CultivationTechnique[] = [
    {
        id: 'tech_basic_meditation',
        name: 'Tĩnh Tọa Cơ Bản',
        description: 'Phương pháp cơ bản để dẫn khí nhập thể, tĩnh tâm凝神.',
        type: 'Linh Kỹ',
        cost: {
            type: 'Linh Lực',
            value: 0
        },
        cooldown: 0,
        effects: [],
        rank: 'Phàm Giai',
        icon: '🧘',
        level: 1,
        maxLevel: 1,
    }
];


export const MAIN_CULTIVATION_TECHNIQUE: MainCultivationTechnique = {
    id: 'main_tech_van_vat_quy_nguyen',
    name: 'Vạn Vật Quy Nguyên Quyết',
    description: 'Một công pháp cổ xưa, tập trung vào việc hấp thụ linh khí từ vạn vật để củng cố bản thân, nền tảng vững chắc, hậu kỳ vô tận.',
    skillTreeNodes: {
        'root': { id: 'root', name: 'Quy Nguyên Tâm Pháp', description: 'Nền tảng của Vạn Vật Quy Nguyên Quyết, tăng tốc độ hấp thụ linh khí.', icon: '🌀', realmRequirement: 'luyen_khi', cost: 0, isUnlocked: true, type: 'core_enhancement', childrenIds: ['lk_passive_1', 'lk_active_1'], position: { x: 50, y: 5 }, bonuses: [{ attribute: 'Ngộ Tính', value: 5 }] },
        // Luyện Khí Branch
        'lk_passive_1': { id: 'lk_passive_1', name: 'Tẩy Tủy', description: 'Thanh lọc cơ thể, tăng cường Căn Cốt.', icon: '💧', realmRequirement: 'luyen_khi', cost: 1, isUnlocked: false, type: 'passive_bonus', childrenIds: ['lk_passive_2'], position: { x: 30, y: 15 }, bonuses: [{ attribute: 'Căn Cốt', value: 10 }] },
        'lk_active_1': { id: 'lk_active_1', name: 'Linh Khí Thuẫn', description: 'Tạo ra một tấm khiên linh khí để phòng ngự.', icon: '🛡️', realmRequirement: 'luyen_khi', cost: 1, isUnlocked: false, type: 'active_skill', childrenIds: ['lk_passive_2'], position: { x: 70, y: 15 }, activeSkill: { name: 'Linh Khí Thuẫn', description: 'Tạo một tấm khiên hấp thụ 50 sát thương trong 3 lượt.', type: 'Linh Kỹ', cost: { type: 'Linh Lực', value: 20 }, cooldown: 5, effects: [], rank: 'Phàm Giai', icon: '🛡️' } },
        'lk_passive_2': { id: 'lk_passive_2', name: 'Dưỡng Thần', description: 'Tẩm bổ linh hồn, tăng cường Nguyên Thần.', icon: '🧠', realmRequirement: 'luyen_khi', cost: 2, isUnlocked: false, type: 'passive_bonus', childrenIds: ['tc_core'], position: { x: 50, y: 25 }, bonuses: [{ attribute: 'Nguyên Thần', value: 10 }] },
        // Trúc Cơ Branch
        'tc_core': { id: 'tc_core', name: 'Trúc Cơ Đạo Thể', description: 'Sau khi Trúc Cơ, cơ thể trở nên mạnh mẽ hơn, tăng Sinh Mệnh và Linh Lực.', icon: '💪', realmRequirement: 'truc_co', cost: 1, isUnlocked: false, type: 'core_enhancement', childrenIds: ['tc_passive_1', 'tc_active_1'], position: { x: 50, y: 35 }, bonuses: [{ attribute: 'Sinh Mệnh', value: 100 }, { attribute: 'Linh Lực', value: 50 }] },
        'tc_passive_1': { id: 'tc_passive_1', name: 'Chân Nguyên Hộ Thể', description: 'Chân nguyên tự động bảo vệ cơ thể, tăng Bền Bỉ.', icon: '🧱', realmRequirement: 'truc_co', cost: 2, isUnlocked: false, type: 'passive_bonus', childrenIds: ['tc_active_2'], position: { x: 30, y: 45 }, bonuses: [{ attribute: 'Bền Bỉ', value: 15 }] },
        'tc_active_1': { id: 'tc_active_1', name: 'Linh Tức Trảm', description: 'Ngưng tụ linh khí thành một đòn tấn công.', icon: '⚔️', realmRequirement: 'truc_co', cost: 2, isUnlocked: false, type: 'active_skill', childrenIds: ['tc_active_2'], position: { x: 70, y: 45 }, activeSkill: { name: 'Linh Tức Trảm', description: 'Gây sát thương bằng 120% chỉ số Linh Lực Sát Thương của bạn.', type: 'Thần Thông', cost: { type: 'Linh Lực', value: 40 }, cooldown: 3, effects: [], rank: 'Tiểu Giai', icon: '⚔️' } },
        'tc_active_2': { id: 'tc_active_2', name: 'Quy Nguyên Thuật', description: 'Hấp thụ linh khí từ môi trường để hồi phục.', icon: '➕', realmRequirement: 'truc_co', cost: 3, isUnlocked: false, type: 'active_skill', childrenIds: [], position: { x: 50, y: 55 }, activeSkill: { name: 'Quy Nguyên Thuật', description: 'Hồi phục 30% Linh Lực đã mất.', type: 'Linh Kỹ', cost: { type: 'Linh Lực', value: 0 }, cooldown: 8, effects: [], rank: 'Tiểu Giai', icon: '➕' } },
    }
};
