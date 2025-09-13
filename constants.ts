import type { Faction, GameSettings, AttributeGroup, InnateTalentRank, MajorEvent, PhapBaoRank, StatBonus, GameSpeed, Season, Weather, TimeOfDay, Location, NPC, NpcDensity, RealmConfig, SafetyLevel, AIModel, ImageModel, RagEmbeddingModel, LayoutMode, FullMod, ItemQuality, EquipmentSlot, CultivationTechnique, NarrativeStyle, InnateTalent, Shop, Theme, CultivationPath, AlchemyRecipe, FactionReputationStatus, Sect, CaveAbode } from './types';
import {
  GiCauldron, GiBroadsword,
  GiHealthNormal, GiHourglass, GiMagicSwirl, GiPentacle, GiPerspectiveDiceSixFacesRandom,
  GiRunningShoe, GiScrollQuill, GiSparklingSabre, GiStairsGoal, GiStoneTower, GiYinYang,
  GiSpinalCoil, GiMuscularTorso, GiSoulVessel, GiBoltSpellCast, GiHeartTower, GiScales,
  GiMountainCave, GiDoubleDragon
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
export const FACTION_NAMES = FACTIONS.map(f => f.name);

export const SECTS: Sect[] = [
    {
        id: 'xien_giao',
        name: 'Xiển Giáo',
        description: 'Do Nguyên Thủy Thiên Tôn đứng đầu, tuân theo thiên mệnh, đề cao căn cơ và tư chất. Đệ tử đều là những người có phúc duyên sâu dày.',
        alignment: 'Chính Phái',
        icon: FaSun,
        joinRequirements: [{ attribute: 'Chính Đạo', value: 20, greaterThan: true }, { attribute: 'Cơ Duyên', value: 12, greaterThan: true }],
        ranks: [
            { name: 'Đệ tử Ghi danh', contributionRequired: 0 },
            { name: 'Đệ tử Ngoại môn', contributionRequired: 500 },
            { name: 'Đệ tử Nội môn', contributionRequired: 2000 },
            { name: 'Đệ tử Chân truyền', contributionRequired: 10000 },
        ]
    },
    {
        id: 'triet_giao',
        name: 'Triệt Giáo',
        description: "Do Thông Thiên Giáo Chủ sáng lập, chủ trương 'hữu giáo vô loại', thu nhận mọi chúng sinh có lòng cầu đạo, không phân biệt nguồn gốc.",
        alignment: 'Trung Lập',
        icon: GiYinYang,
        joinRequirements: [{ attribute: 'Cảm Ngộ', value: 12, greaterThan: true }],
        ranks: [
            { name: 'Ký danh Đệ tử', contributionRequired: 0 },
            { name: 'Ngoại môn Đệ tử', contributionRequired: 400 },
            { name: 'Nội môn Đệ tử', contributionRequired: 1800 },
            { name: 'Thân truyền Đệ tử', contributionRequired: 9000 },
        ]
    },
];

export const DEFAULT_CAVE_ABODE: CaveAbode = {
    name: 'Tiên Phủ Sơ Khai',
    level: 1,
    spiritGatheringArrayLevel: 0,
    spiritHerbFieldLevel: 0,
    alchemyRoomLevel: 0,
    storageUpgradeLevel: 0,
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
            { attribute: 'Kiếm Pháp', value: 20 },
            { attribute: 'Tiên Lực', value: 10 },
        ]
    },
    {
        id: 'path_alchemy_master',
        name: 'Đan Đạo Tông Sư',
        description: 'Chuyên tâm vào việc luyện đan, cứu người giúp đời hoặc luyện chế độc dược hại người.',
        requiredRealmId: 'truc_co',
        bonuses: [
            { attribute: 'Đan Thuật', value: 20 },
            { attribute: 'Nguyên Thần', value: 10 },
        ]
    }
];

export const NPC_LIST: NPC[] = [
  {
    id: 'npc_khuong_tu_nha',
    identity: { name: 'Khương Tử Nha', gender: 'Nam', appearance: 'Một lão ông râu tóc bạc phơ, ánh mắt tinh anh, phong thái thoát tục, thường mặc đạo bào màu xám.', origin: 'Đệ tử của Nguyên Thủy Thiên Tôn ở núi Côn Lôn, phụng mệnh xuống núi phò Chu diệt Thương.', personality: 'Chính Trực' },
    status: 'Đang câu cá bên bờ sông Vị Thủy, chờ đợi minh chủ.',
    attributes: [],
    talents: [ { name: 'Phong Thần Bảng', description: 'Nắm giữ thiên cơ, có quyền phong thần.', rank: 'Thánh Giai', effect: 'Có khả năng nhìn thấu vận mệnh.' }, { name: 'Đả Thần Tiên', description: 'Pháp bảo do sư tôn ban tặng, chuyên đánh tiên nhân.', rank: 'Đại Tiên Giai', effect: 'Tăng mạnh sát thương lên kẻ địch có tu vi cao.' } ],
    locationId: 'song_vi_thuy',
    cultivation: { currentRealmId: 'hoa_than', currentStageId: 'ht_3', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 100, items: [] }, currencies: { 'Bạc': 100 }, equipment: {},
  },
  {
    id: 'npc_na_tra',
    identity: { name: 'Na Tra', gender: 'Nam', appearance: 'Hình hài thiếu niên, mặt đẹp như ngọc, môi đỏ như son, mắt sáng tựa sao. Tay cầm Hỏa Tiễn Thương, chân đạp Phong Hỏa Luân, mình quấn Hỗn Thiên Lăng.', origin: 'Linh Châu Tử chuyển thế, con trai thứ ba của Lý Tịnh. Là đệ tử của Thái Ất Chân Nhân.', personality: 'Hỗn Loạn' },
    status: 'Đang tuần tra tại Trần Đường Quan, tính tình nóng nảy.',
    attributes: [],
    talents: [ { name: 'Pháp Liên Hóa Thân', description: 'Thân thể được tái tạo từ hoa sen, miễn nhiễm với nhiều loại độc và tà thuật.', rank: 'Đại Tiên Giai', effect: 'Kháng tất cả hiệu ứng tiêu cực.' }, { name: 'Tam Đầu Lục Tý', description: 'Khi chiến đấu có thể hóa thành ba đầu sáu tay, sức mạnh tăng vọt.', rank: 'Hậu Tiên Giai', effect: 'Tăng mạnh các chỉ số chiến đấu trong giao tranh.' } ],
    locationId: 'tran_duong_quan',
    cultivation: { currentRealmId: 'nguyen_anh', currentStageId: 'na_2', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 100, items: [] }, currencies: { 'Bạc': 50 }, equipment: {},
  },
  {
    id: 'npc_duong_tien',
    identity: { name: 'Dương Tiễn', gender: 'Nam', appearance: 'Tướng mạo phi phàm, giữa trán có thiên nhãn. Thân mặc giáp bạc, tay cầm Tam Tiêm Lưỡng Nhận Đao, bên cạnh có Hao Thiên Khuyển.', origin: 'Đệ tử của Ngọc Đỉnh Chân Nhân, cháu của Ngọc Hoàng Đại Đế.', personality: 'Chính Trực' },
    status: 'Đang tu luyện tại Ngọc Hư Cung, chờ lệnh sư tôn.',
    attributes: [],
    talents: [ { name: 'Thiên Nhãn', description: 'Con mắt thứ ba giữa trán, có thể nhìn thấu bản chất, phá trừ ảo ảnh.', rank: 'Thánh Giai', effect: 'Nhìn thấu mọi ngụy trang và ẩn thân.' }, { name: 'Bát Cửu Huyền Công', description: 'Công pháp biến hóa vô song, có 72 phép biến hóa.', rank: 'Đại Tiên Giai', effect: 'Khả năng biến hóa thành vạn vật.' } ],
    locationId: 'ngoc_hu_cung',
    cultivation: { currentRealmId: 'hoa_than', currentStageId: 'ht_1', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 150, items: [] }, currencies: { 'Bạc': 200 }, equipment: {},
  },
  {
    id: 'npc_dat_ky',
    identity: { name: 'Đát Kỷ', gender: 'Nữ', appearance: 'Vẻ đẹp tuyệt thế, khuynh quốc khuynh thành, mỗi cái nhíu mày, mỗi nụ cười đều có sức mê hoặc lòng người. Ánh mắt luôn ẩn chứa một tia gian xảo.', origin: 'Cửu vỹ hồ ly tinh ngàn năm tu luyện tại Hiên Viên Mộ, phụng mệnh Nữ Oa vào cung mê hoặc Trụ Vương.', personality: 'Tà Ác' },
    status: 'Đang ở bên cạnh Trụ Vương tại Lộc Đài, bày mưu tính kế.',
    attributes: [],
    talents: [ { name: 'Hồ Mị', description: 'Sức quyến rũ trời sinh của hồ ly, khiến người khác phái khó lòng chống cự.', rank: 'Đại Tiên Giai', effect: 'Giảm mạnh ý chí của đối thủ nam.' } ],
    locationId: 'loc_dai',
    cultivation: { currentRealmId: 'ket_dan', currentStageId: 'kd_3', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 50, items: [] }, currencies: { 'Bạc': 10000 }, equipment: {},
  },
  {
    id: 'npc_tru_vuong',
    identity: { name: 'Trụ Vương', gender: 'Nam', appearance: 'Thân hình cao lớn, uy phong lẫm liệt của bậc đế vương, nhưng ánh mắt đã nhuốm màu hoang dâm và tàn bạo.', origin: 'Vị vua cuối cùng của nhà Thương, văn võ song toàn nhưng ham mê tửu sắc, tàn bạo vô đạo.', personality: 'Tà Ác' },
    status: 'Đang yến tiệc tại Lộc Đài, bỏ bê triều chính.',
    attributes: [],
    talents: [ { name: 'Thiên Tử Long Khí', description: 'Sở hữu khí vận của một triều đại, có khả năng áp chế kẻ địch.', rank: 'Trung Tiên Giai', effect: 'Tăng khả năng kháng hiệu ứng.' } ],
    locationId: 'loc_dai',
    cultivation: { currentRealmId: 'truc_co', currentStageId: 'tc_2', spiritualQi: 0, hasConqueredInnerDemon: false },
    techniques: [], inventory: { weightCapacity: 200, items: [] }, currencies: { 'Bạc': 999999 }, equipment: {},
  },
  {
    id: 'npc_van_trong',
    identity: { name: 'Văn Trọng', gender: 'Nam', appearance: 'Thái sư đầu đội kim quan, mình mặc giáp trụ, râu dài tới ngực, giữa trán cũng có một con mắt. Cưỡi Mặc Kỳ Lân, tay cầm Kim Tiên.', origin: 'Thái sư nhà Thương, đệ tử của Kim Linh Thánh Mẫu thuộc Triệt Giáo, là trụ cột của triều đình.', personality: 'Chính Trực' },
    status: 'Vừa dẹp yên Bắc Hải trở về, đang lo lắng cho xã tắc.',
    attributes: [],
    talents: [ { name: 'Thần Mục', description: 'Con mắt thứ ba có thể phân biệt trắng đen, nhìn rõ trung gian.', rank: 'Hậu Tiên Giai', effect: 'Miễn nhiễm với ảo thuật và lừa dối.' } ],
    locationId: 'trieu_ca',
    cultivation: { currentRealmId: 'hoa_than', currentStageId: 'ht_2', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 150, items: [] }, currencies: { 'Bạc': 5000 }, equipment: {},
  },
  {
    id: 'npc_than_cong_bao',
    identity: { name: 'Thân Công Báo', gender: 'Nam', appearance: 'Một đạo sĩ gầy gò, mặc áo bào đen, tướng mạo gian hoạt, luôn cưỡi trên lưng một con cọp đen.', origin: 'Bạn đồng môn với Khương Tử Nha, nhưng vì đố kỵ mà đi theo con đường tà đạo, chuyên đi khắp nơi mời gọi dị nhân giúp nhà Thương.', personality: 'Hỗn Loạn' },
    status: 'Đang tìm kiếm kỳ nhân dị sĩ để chống lại Tây Kỳ.',
    attributes: [],
    talents: [ { name: 'Miệng Lưỡi Sắc Sảo', description: 'Có tài ăn nói, dễ dàng thuyết phục người khác.', rank: 'Sơ Tiên Giai', effect: 'Tăng mạnh khả năng thuyết phục trong đối thoại.' } ],
    locationId: 'rung_me_vu',
    cultivation: { currentRealmId: 'nguyen_anh', currentStageId: 'na_1', spiritualQi: 0, hasConqueredInnerDemon: false },
    techniques: [], inventory: { weightCapacity: 80, items: [] }, currencies: { 'Bạc': 1000 }, equipment: {},
  },
  {
    id: 'npc_co_xuong',
    identity: { name: 'Cơ Xương', gender: 'Nam', appearance: 'Một vị hiền hầu, tuổi đã cao, râu tóc bạc trắng nhưng tinh thần minh mẫn, toát lên vẻ nhân từ đức độ.', origin: 'Tây Bá Hầu, một trong tứ đại chư hầu, tinh thông dịch lý, được lòng dân chúng.', personality: 'Chính Trực' },
    status: 'Đang cai quản Tây Kỳ, chiêu hiền đãi sĩ.',
    attributes: [],
    talents: [ { name: 'Hậu Thiên Bát Quái', description: 'Có khả năng suy diễn thiên cơ, biết trước họa phúc.', rank: 'Trung Tiên Giai', effect: 'Tăng chỉ số May Mắn.' } ],
    locationId: 'tay_ky',
    cultivation: { currentRealmId: 'luyen_khi', currentStageId: 'lk_dz', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 100, items: [] }, currencies: { 'Bạc': 20000 }, equipment: {},
  },
  {
    id: 'npc_thai_at_chan_nhan',
    identity: { name: 'Thái Ất Chân Nhân', gender: 'Nam', appearance: 'Một vị tiên nhân đạo cốt tiên phong, thường mặc đạo bào màu xanh biếc.', origin: 'Một trong Thập Nhị Kim Tiên của Xiển Giáo, sư phụ của Na Tra.', personality: 'Trung Lập' },
    status: 'Đang ở động Kim Quang, Càn Nguyên Sơn, nghiên cứu đạo pháp.',
    attributes: [],
    talents: [],
    locationId: 'ngoc_hu_cung',
    cultivation: { currentRealmId: 'hoa_than', currentStageId: 'ht_3', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 500, items: [] }, currencies: { 'Bạc': 1000 }, equipment: {},
  },
  {
    id: 'npc_trieu_cong_minh',
    identity: { name: 'Triệu Công Minh', gender: 'Nam', appearance: 'Một vị đại tiên uy mãnh, cưỡi cọp đen, tay cầm Định Hải Châu và Thần Tiên.', origin: 'Đại đệ tử ngoại môn của Triệt Giáo, tu tại núi Nga Mi.', personality: 'Hỗn Loạn' },
    status: 'Đang du ngoạn bốn biển, tìm kiếm đạo hữu.',
    attributes: [],
    talents: [ { name: 'Định Hải Châu', description: '24 viên ngọc có sức mạnh kinh thiên động địa.', rank: 'Đại Tiên Giai', effect: 'Sở hữu sức tấn công cực mạnh.' } ],
    locationId: 'dao_tam_tien',
    cultivation: { currentRealmId: 'hoa_than', currentStageId: 'ht_3', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 300, items: [] }, currencies: { 'Bạc': 3000 }, equipment: {},
  },
  {
    id: 'npc_van_tieu',
    identity: { name: 'Vân Tiêu Tiên Tử', gender: 'Nữ', appearance: 'Chị cả trong Tam Tiêu, dung mạo xinh đẹp, tính tình trầm ổn, đạo hạnh cao thâm.', origin: 'Đệ tử của Thông Thiên Giáo Chủ, cùng hai em gái tu luyện tại đảo Tam Tiên.', personality: 'Trung Lập' },
    status: 'Đang tĩnh tu trên đảo Tam Tiên.',
    attributes: [],
    talents: [ { name: 'Cửu Khúc Hoàng Hà Trận', description: 'Trận pháp thượng cổ, có thể gọt bỏ tu vi của tiên nhân.', rank: 'Thánh Giai', effect: 'Cực kỳ nguy hiểm, có thể làm người chơi mất cảnh giới.' } ],
    locationId: 'dao_tam_tien',
    cultivation: { currentRealmId: 'hoa_than', currentStageId: 'ht_2', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 100, items: [] }, currencies: { 'Bạc': 2000 }, equipment: {},
  },
  {
    id: 'npc_thach_co_nuong_nuong',
    identity: { name: 'Thạch Cơ Nương Nương', gender: 'Nữ', appearance: 'Một nữ yêu kiều diễm nhưng tà khí toát ra từ một tảng đá.', origin: 'Một tảng đá hấp thụ tinh hoa nhật nguyệt mà thành tinh, tu luyện tại Bạch Cốt Động.', personality: 'Tà Ác' },
    status: 'Đang tức giận vì đệ tử bị Na Tra giết chết.',
    attributes: [],
    talents: [],
    locationId: 'bach_cot_dong',
    cultivation: { currentRealmId: 'nguyen_anh', currentStageId: 'na_1', spiritualQi: 0, hasConqueredInnerDemon: false },
    techniques: [], inventory: { weightCapacity: 100, items: [] }, currencies: { 'Bạc': 500 }, equipment: {},
  },
  {
    id: 'npc_ly_tinh',
    identity: { name: 'Lý Tịnh', gender: 'Nam', appearance: 'Một vị tổng binh uy nghiêm, mày kiếm mắt sáng, tay luôn cầm Linh Lung Bảo Tháp.', origin: 'Tổng binh Trần Đường Quan, cha của Na Tra.', personality: 'Chính Trực' },
    status: 'Đang đau đầu vì đứa con nghịch tử Na Tra.',
    attributes: [],
    talents: [ { name: 'Linh Lung Bảo Tháp', description: 'Pháp bảo do Nhiên Đăng Cổ Phật tặng để khắc chế Na Tra.', rank: 'Trung Tiên Giai', effect: 'Có khả năng trấn áp kẻ địch.' } ],
    locationId: 'tran_duong_quan',
    cultivation: { currentRealmId: 'ket_dan', currentStageId: 'kd_1', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 120, items: [] }, currencies: { 'Bạc': 1500 }, equipment: {},
  },
  { id: 'npc_loi_chan_tu',
    identity: { name: 'Lôi Chấn Tử', gender: 'Nam', appearance: 'Thân xanh, mặt nhọn, mọc cánh sau lưng, tay cầm côn vàng.', origin: 'Con nuôi của Cơ Xương, đệ tử của Vân Trung Tử.', personality: 'Hỗn Loạn' },
    status: 'Bay lượn trên bầu trời Tây Kỳ.',
    attributes: [],
    talents: [ { name: 'Phong Lôi Dực', description: 'Đôi cánh có sức mạnh của gió và sấm sét, tốc độ cực nhanh.', rank: 'Hậu Tiên Giai', effect: 'Tốc độ di chuyển cực cao.' } ],
    locationId: 'tay_ky',
    cultivation: { currentRealmId: 'nguyen_anh', currentStageId: 'na_1', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 100, items: [] }, currencies: { 'Bạc': 300 }, equipment: {},
  },
  { id: 'npc_hoang_phi_ho',
    identity: { name: 'Hoàng Phi Hổ', gender: 'Nam', appearance: 'Võ tướng oai phong, mình mặc giáp trụ, cưỡi ngũ sắc thần ngưu.', origin: 'Trấn quốc Võ Thành Vương của nhà Thương, sau này phản lại Trụ Vương theo về nhà Chu.', personality: 'Chính Trực' },
    status: 'Đang trấn giữ Tam Sơn Quan.',
    attributes: [],
    talents: [],
    locationId: 'tam_son_quan',
    cultivation: { currentRealmId: 'truc_co', currentStageId: 'tc_3', spiritualQi: 0, hasConqueredInnerDemon: true },
    techniques: [], inventory: { weightCapacity: 150, items: [] }, currencies: { 'Bạc': 2500 }, equipment: {},
  },
  ...Array.from({ length: 35 }).map((_, i) => {
      const rand = Math.random();
      if (rand < 0.3) {
          return {
              id: `npc_tantien_${i}`,
// FIX: Added 'as const' to the gender property to ensure TypeScript infers the correct literal type ('Nam') instead of the wider 'string' type, resolving the type incompatibility with the 'NPC' interface.
              identity: { name: `Tán Tu Giáp ${i}`, gender: 'Nam' as const, appearance: 'Một tu sĩ áo xám, mặt mũi bình thường, ánh mắt ẩn chứa sự từng trải.', origin: 'Không rõ lai lịch, tu luyện một mình.', personality: 'Trung Lập' },
              status: 'Đang tìm kiếm cơ duyên trong Rừng Cổ Thụ.',
              attributes: [], talents: [], locationId: 'rung_co_thu',
              cultivation: { currentRealmId: 'luyen_khi', currentStageId: 'lk_7', spiritualQi: 0, hasConqueredInnerDemon: false },
              techniques: [], inventory: { weightCapacity: 70, items: [] }, currencies: { 'Bạc': Math.floor(Math.random() * 200) + 50 }, equipment: {},
          };
      } else if (rand < 0.6) {
          return {
              id: `npc_yeuquai_${i}`,
// FIX: Added 'as const' to the gender property to ensure TypeScript infers the correct literal type ('Nữ') instead of the wider 'string' type, resolving the type incompatibility with the 'NPC' interface.
              identity: { name: `Tiểu Yêu ${i}`, gender: 'Nữ' as const, appearance: 'Hình người nhưng vẫn còn vài đặc điểm của yêu tộc, ánh mắt lanh lợi.', origin: 'Một con yêu quái nhỏ tu luyện thành hình người.', personality: 'Hỗn Loạn' },
              status: 'Đang ẩn nấp trong Rừng Mê Vụ.',
              attributes: [], talents: [], locationId: 'rung_me_vu',
              cultivation: { currentRealmId: 'luyen_khi', currentStageId: 'lk_4', spiritualQi: 0, hasConqueredInnerDemon: false },
              techniques: [], inventory: { weightCapacity: 50, items: [] }, currencies: { 'Bạc': Math.floor(Math.random() * 100) }, equipment: {},
          };
      } else {
          return {
              id: `npc_thuongnhan_${i}`,
// FIX: Added 'as const' to the gender property to ensure TypeScript infers the correct literal type ('Nam') instead of the wider 'string' type, resolving the type incompatibility with the 'NPC' interface.
              identity: { name: `Thương Nhân ${i}`, gender: 'Nam' as const, appearance: 'Ăn mặc sang trọng, vẻ mặt lanh lợi, luôn tươi cười.', origin: 'Một thương nhân đi lại giữa Triều Ca và Tây Kỳ.', personality: 'Trung Lập' },
              status: 'Đang bày hàng ở chợ Triều Ca.',
              attributes: [], talents: [], locationId: 'trieu_ca',
              cultivation: { currentRealmId: 'pham_nhan', currentStageId: 'pn_1', spiritualQi: 0, hasConqueredInnerDemon: false },
              techniques: [], inventory: { weightCapacity: 300, items: [] }, currencies: { 'Bạc': Math.floor(Math.random() * 1000) + 500 }, equipment: {},
          };
      }
  })
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
                price: { currency: 'Bạc', amount: 50 },
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
        requiredAttribute: { name: 'Đan Thuật', value: 15 },
        icon: '💊',
        qualityCurve: [
            { threshold: 50, quality: 'Linh Phẩm' },
            { threshold: 25, quality: 'Phàm Phẩm' },
        ]
    }
];

// URL for the community mod manifest. Using a Gist is a great way to host this.
// For this example, it points to a sample manifest.
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
    temperature: 1,
    topK: 64,
    topP: 0.95,
    enableThinking: true,
    thinkingBudget: 2500,
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
    { rank: 'Phàm Giai', weight: 35 },
    { rank: 'Siêu Phàm Giai', weight: 25 },
    { rank: 'Sơ Tiên Giai', weight: 20 },
    { rank: 'Trung Tiên Giai', weight: 10 },
    { rank: 'Hậu Tiên Giai', weight: 5 },
    { rank: 'Đại Tiên Giai', weight: 3 },
    { rank: 'Thánh Giai', weight: 2 },
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
    { id: 'rung_co_thu', name: 'Rừng Cổ Thụ', description: 'Một khu rừng rậm rạp với những cây cổ thụ cao chọc trời, là nơi trú ngụ của nhiều yêu thú cấp thấp.', type: 'Hoang Dã', neighbors: ['thanh_ha_tran', 'hac_long_dam', 'thanh_loan_son', 'rung_me_vu'], isExplorable: true, coordinates: { x: 4, y: 6 } },
    { id: 'hac_long_dam', name: 'Hắc Long Đàm', description: 'Một hồ nước sâu không thấy đáy, quanh năm bao phủ bởi sương mù, tương truyền có giao long ẩn náu.', type: 'Bí Cảnh', neighbors: ['rung_co_thu'], coordinates: { x: 3, y: 8 } },
    { id: 'song_vi_thuy', name: 'Sông Vị Thủy', description: 'Một con sông lớn chảy xiết, nghe đồn Khương Tử Nha từng buông câu tại đây.', type: 'Hoang Dã', neighbors: ['thanh_ha_tran', 'trieu_ca', 'tay_ky'], coordinates: { x: 7, y: 5 } },
    { id: 'trieu_ca', name: 'Triều Ca', description: 'Kinh đô của nhà Thương, phồn hoa và tráng lệ, nhưng ẩn chứa nhiều âm mưu và nguy hiểm.', type: 'Thành Thị', neighbors: ['song_vi_thuy', 'tam_son_quan', 'loc_dai', 'ky_chau'], coordinates: { x: 12, y: 5 } },
    { id: 'tam_son_quan', name: 'Tam Sơn Quan', description: 'Cửa ải quân sự trọng yếu của nhà Thương, canh gác con đường tiến vào kinh đô.', type: 'Quan Ải', neighbors: ['trieu_ca', 'dong_hai'], coordinates: { x: 15, y: 7 } },
    { id: 'dong_hai', name: 'Đông Hải', description: 'Vùng biển rộng lớn phía đông, là địa bàn của Long Tộc. Sóng to gió lớn, cực kỳ nguy hiểm.', type: 'Hoang Dã', neighbors: ['tam_son_quan', 'dao_ngao_binh', 'tran_duong_quan', 'bich_du_cung', 'dao_tam_tien'], coordinates: { x: 20, y: 8 } },
    { id: 'dao_ngao_binh', name: 'Đảo Ngao Binh', description: 'Một hòn đảo nhỏ ở Đông Hải, là tiền đồn của Long Cung.', type: 'Bí Cảnh', neighbors: ['dong_hai'], coordinates: { x: 22, y: 10 } },
    { id: 'thanh_loan_son', name: 'Thanh Loan Sơn', description: 'Ngọn núi linh thiêng, quanh năm có mây mù bao phủ, là nơi tu luyện của các tán tu.', type: 'Sơn Mạch', neighbors: ['rung_co_thu', 'con_lon_son'], coordinates: { x: 2, y: 3 } },
    { id: 'tay_ky', name: 'Tây Kỳ', description: 'Kinh đô của nhà Chu, nơi Cơ Xương cai quản. Đất đai trù phú, lòng dân quy thuận, đang chiêu hiền đãi sĩ.', type: 'Thành Thị', neighbors: ['song_vi_thuy', 'gioi_bai_quan', 'tay_tho'], coordinates: { x: 8, y: 2 } },
    { id: 'con_lon_son', name: 'Côn Lôn Sơn', description: 'Dãy núi tổ của vạn sơn, là đạo trường của Xiển Giáo do Nguyên Thủy Thiên Tôn đứng đầu. Linh khí nồng đậm, tiên cảnh ngút ngàn.', type: 'Thánh Địa', neighbors: ['thanh_loan_son', 'ngoc_hu_cung'], coordinates: { x: 1, y: 1 } },
    { id: 'tran_duong_quan', name: 'Trần Đường Quan', description: 'Một cửa ải do Lý Tịnh trấn giữ, nằm gần Đông Hải.', type: 'Quan Ải', neighbors: ['dong_hai'], coordinates: { x: 18, y: 6 } },
    { id: 'bich_du_cung', name: 'Bích Du Cung', description: 'Đạo trường của Triệt Giáo do Thông Thiên Giáo Chủ đứng đầu, nằm trên một hòn đảo tiên ngoài Đông Hải. Vạn tiên đến triều, khí thế ngất trời.', type: 'Thánh Địa', neighbors: ['dong_hai', 'kim_ngao_dao'], coordinates: { x: 25, y: 12 } },
    { id: 'ngoc_hu_cung', name: 'Ngọc Hư Cung', description: 'Cung điện của Nguyên Thủy Thiên Tôn, nằm trên đỉnh cao nhất của Côn Lôn Sơn, mây mù bao phủ, không phải tiên nhân không thể đến.', type: 'Thánh Địa', neighbors: ['con_lon_son'], coordinates: { x: 0, y: 0 } },
    { id: 'kim_ngao_dao', name: 'Kim Ngao Đảo', description: 'Hòn đảo nơi Bích Du Cung tọa lạc, là trung tâm của Triệt Giáo.', type: 'Thánh Địa', neighbors: ['bich_du_cung'], coordinates: { x: 26, y: 13 } },
    { id: 'hoa_van_dong', name: 'Hỏa Vân Động', description: 'Nơi ở của Tam Thánh Hoàng: Phục Hy, Thần Nông, Hiên Viên. Là thánh địa của nhân tộc.', type: 'Thánh Địa', neighbors: ['tay_tho'], coordinates: { x: 10, y: 0 } },
    { id: 'ky_chau', name: 'Ký Châu', description: 'Một trong cửu châu, do Ký Châu hầu Tô Hộ cai quản. Đây là quê hương của Đát Kỷ.', type: 'Thành Thị', neighbors: ['trieu_ca', 'sung_thanh'], coordinates: { x: 14, y: 3 } },
    { id: 'sung_thanh', name: 'Sùng Thành', description: 'Đất phong của Bắc Bá Hầu Sùng Hầu Hổ, một chư hầu trung thành với Trụ Vương.', type: 'Thành Thị', neighbors: ['ky_chau', 'bac_hai'], coordinates: { x: 16, y: 1 } },
    { id: 'rung_me_vu', name: 'Rừng Mê Vụ', description: 'Một khu rừng quanh năm sương mù, dễ lạc đường, là nơi ẩn náu của nhiều yêu ma và tu sĩ tà đạo.', type: 'Hoang Dã', isExplorable: true, neighbors: ['rung_co_thu', 'bai_tha_ma'], coordinates: { x: 3, y: 4 } },
    { id: 'dieu_tri', name: 'Diêu Trì', description: 'Nơi ở của Tây Vương Mẫu trên Côn Lôn, nổi tiếng với vườn bàn đào.', type: 'Bí Cảnh', neighbors: ['con_lon_son'], coordinates: { x: 2, y: 0 } },
    { id: 'ngu_trang_quan', name: 'Ngũ Trang Quan', description: 'Đạo quan của Trấn Nguyên Tử đại tiên trên Vạn Thọ Sơn, nổi tiếng với cây Nhân Sâm Quả.', type: 'Thánh Địa', neighbors: ['tay_tho'], coordinates: { x: 7, y: 0 } },
    { id: 'bach_cot_dong', name: 'Bạch Cốt Động', description: 'Hang động của Thạch Cơ Nương Nương, âm u và đầy xương trắng.', type: 'Bí Cảnh', neighbors: ['thanh_loan_son'], coordinates: { x: 0, y: 4 } },
    { id: 'hien_vien_mo', name: 'Hiên Viên Mộ', description: 'Lăng mộ của Hiên Viên Hoàng Đế, nhưng đã trở thành sào huyệt của tam yêu, bao gồm Cửu Vỹ Hồ.', type: 'Bí Cảnh', neighbors: ['trieu_ca'], coordinates: { x: 13, y: 6 } },
    { id: 'oa_hoang_cung', name: 'Oa Hoàng Cung', description: 'Cung điện của Nữ Oa Nương Nương, một trong những vị thần cổ xưa nhất.', type: 'Thánh Địa', neighbors: [], coordinates: { x: 18, y: 0 } },
    { id: 'gioi_bai_quan', name: 'Giới Bài Quan', description: 'Cửa ải chiến lược giữa Tây Kỳ và Triều Ca, nơi diễn ra nhiều trận đại chiến.', type: 'Quan Ải', neighbors: ['tay_ky', 'thung_lung_tuyet_long'], coordinates: { x: 10, y: 2 } },
    { id: 'loc_dai', name: 'Lộc Đài', description: 'Một công trình xa hoa do Trụ Vương xây dựng để lấy lòng Đát Kỷ, nơi diễn ra vô số cuộc yến tiệc trác táng.', type: 'Thành Thị', neighbors: ['trieu_ca'], coordinates: { x: 11, y: 6 } },
    { id: 'bai_tha_ma', name: 'Bãi Tha Ma', description: 'Chiến trường cổ xưa đầy oán khí, là nơi tuyệt vời để luyện các công pháp tà đạo.', type: 'Hoang Dã', isExplorable: true, neighbors: ['rung_me_vu'], coordinates: { x: 4, y: 10 } },
    { id: 'nui_cuu_long', name: 'Núi Cửu Long', description: 'Nơi có Cửu Long Đảo, đạo trường của tứ thánh Triệt Giáo.', type: 'Sơn Mạch', neighbors: ['tam_son_quan'], coordinates: { x: 16, y: 9 } },
    { id: 'dao_tam_tien', name: 'Đảo Tam Tiên', description: 'Hòn đảo tiên nơi Tam Tiêu Tiên Tử tu luyện.', type: 'Bí Cảnh', neighbors: ['dong_hai'], coordinates: { x: 24, y: 10 } },
    { id: 'thung_lung_tuyet_long', name: 'Thung lũng Tuyệt Long', description: 'Một thung lũng hiểm trở, nơi Thái sư Văn Trọng tử trận.', type: 'Bí Cảnh', neighbors: ['gioi_bai_quan'], coordinates: { x: 10, y: 4 } },
    { id: 'tay_tho', name: 'Tây Thổ', description: 'Vùng đất rộng lớn phía Tây, màu mỡ và trù phú, thuộc phạm vi cai quản của Tây Bá Hầu.', type: 'Thành Thị', neighbors: ['tay_ky', 'ngu_trang_quan', 'hoa_van_dong'], coordinates: { x: 8, y: 0 } },
    { id: 'bac_hai', name: 'Bắc Hải', description: 'Vùng đất phương Bắc lạnh giá, nơi các chư hầu thường xuyên nổi loạn.', type: 'Hoang Dã', neighbors: ['sung_thanh'], coordinates: { x: 17, y: -1 } },
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
        name: 'Tĩnh Tọa Cơ Bản',
        description: 'Phương pháp cơ bản để dẫn khí nhập thể, tĩnh tâm凝神.',
        type: 'Linh Kỹ',
        cost: {
            type: 'Linh Lực',
            value: 0
        },
        cooldown: 0,
        effectDescription: 'Tăng tốc độ hấp thụ linh khí khi tu luyện.',
        rank: 'Phàm Giai',
        icon: '🧘',
        level: 1,
        maxLevel: 1,
    }
];
