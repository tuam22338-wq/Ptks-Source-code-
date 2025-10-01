// FIX: import SpiritualRootQuality from the correct file
import type { InnateTalentRank, StatBonus, CharacterStatus, SpiritualRootQuality, Element } from '../types';

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

export const CHARACTER_STATUS_CONFIG: Record<CharacterStatus, { label: string; threshold: number; debuffs: StatBonus[]; color: string }> = {
  HEALTHY: { label: 'Khỏe mạnh', threshold: 0.9, debuffs: [], color: 'text-green-400' },
  LIGHTLY_INJURED: { label: 'Bị thương nhẹ', threshold: 0.5, debuffs: [{ attribute: 'Thân Pháp', value: -2 }, { attribute: 'Lực Lượng', value: -2 }], color: 'text-yellow-400' },
  HEAVILY_INJURED: { label: 'Bị thương nặng', threshold: 0.1, debuffs: [{ attribute: 'Thân Pháp', value: -5 }, { attribute: 'Lực Lượng', value: -5 }, { attribute: 'Nguyên Thần', value: -3 }], color: 'text-orange-500' },
  NEAR_DEATH: { label: 'Sắp chết', threshold: 0, debuffs: [{ attribute: 'Thân Pháp', value: -10 }, { attribute: 'Lực Lượng', value: -10 }, { attribute: 'Nguyên Thần', value: -5 }, { attribute: 'Ngộ Tính', value: -5 }], color: 'text-red-600' },
};

export const PERSONALITY_TRAITS = [
  { name: 'Trung Lập', description: 'Hành động theo lý trí, không thiên vị phe phái nào.' },
  { name: 'Chính Trực', description: 'Luôn đứng về phía lẽ phải, bảo vệ kẻ yếu, tuân theo đạo nghĩa.' },
  { name: 'Hỗn Loạn', description: 'Hành động khó lường, tùy theo cảm xúc và lợi ích nhất thời.' },
  { name: 'Tà Ác', description: 'Không từ thủ đoạn để đạt được mục đích, coi thường sinh mạng.' },
];

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