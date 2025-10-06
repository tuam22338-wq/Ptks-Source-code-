import type { FactionReputationStatus, DifficultyLevel, NpcDensity, QuickActionButtonConfig, AbilityRank, ItemQuality } from '../types';
import { DEFAULT_ATTRIBUTE_DEFINITIONS } from '../data/attributes';

export const SYSTEM_SHOP_ITEMS = [
    { id: 'sys_item_stat_boost', name: 'Dịch Cân Tẩy Tủy Dịch', description: 'Một liều thuốc từ thế giới khác, giúp cải thiện toàn bộ thuộc tính cơ bản vĩnh viễn.', cost: 250, effect: { type: 'CHANGE_STAT', details: { attribute: 'all_base', change: 1 } } },
    { id: 'sys_item_qi_boost', name: 'Linh Khí Kết Tinh', description: 'Một khối tinh thể chứa đựng linh khí thuần khiết, giúp tăng mạnh tu vi hiện tại.', cost: 100, effect: { type: 'CHANGE_STAT', details: { attribute: 'spiritualQi', change: 5000 } } },
    { id: 'sys_item_gacha_ticket', name: 'Vé Gacha Vận Mệnh', description: 'Một chiếc vé bí ẩn, có thể rút ra một vật phẩm hoặc kỳ ngộ ngẫu nhiên.', cost: 50, effect: { type: 'START_EVENT', details: { eventId: 'system_gacha' } } },
];

export const FACTION_REPUTATION_TIERS: { threshold: number; status: FactionReputationStatus }[] = [
    { threshold: -101, status: 'Kẻ Địch' }, // -100 to -51
    { threshold: -50, status: 'Lạnh Nhạt' }, // -50 to -1
    { threshold: 0, status: 'Trung Lập' }, // 0 to 49
    { threshold: 50, status: 'Thân Thiện' }, // 50 to 99
    { threshold: 100, status: 'Đồng Minh' }, // 100
];

export const DIFFICULTY_LEVELS: { id: DifficultyLevel; name: string; description: string; baseStatValue: number; color: string }[] = [
    { id: 'rookie', name: 'Tân Thủ', description: 'Trải nghiệm thư giãn, phù hợp cho người mới làm quen.', baseStatValue: 15, color: 'border-green-500' },
    { id: 'easy', name: 'Dễ', description: 'Thuộc tính khởi đầu cao hơn một chút. Phù hợp cho người mới.', baseStatValue: 12, color: 'border-sky-500' },
    { id: 'medium', name: 'Trung Bình', description: 'Trải nghiệm cân bằng, đúng với ý đồ của trò chơi.', baseStatValue: 10, color: 'border-gray-500' },
    { id: 'hard', name: 'Khó', description: 'Thử thách cao hơn, thuộc tính khởi đầu bị giảm.', baseStatValue: 8, color: 'border-orange-500' },
    { id: 'hell', name: 'Gà Đất Chó Sành', description: 'Thử thách cực đại, khởi đầu như một kẻ tay mơ giữa thế giới tu chân tàn khốc.', baseStatValue: 5, color: 'border-red-600' },
];

export const NPC_DENSITY_LEVELS: { id: NpcDensity; name: string; description: string; count: number }[] = [
    { id: 'low', name: 'Thưa Thớt', description: 'Ít NPC, thế giới yên tĩnh.', count: 10 },
    { id: 'medium', name: 'Vừa Phải', description: 'Cân bằng, thế giới sống động.', count: 20 },
    { id: 'high', name: 'Đông Đúc', description: 'Nhiều NPC, thế giới hỗn loạn.', count: 200 },
];

export const ALL_ATTRIBUTES = DEFAULT_ATTRIBUTE_DEFINITIONS.map(a => a.name);
// FIX: Changed spiritualQi to spiritualQi to match new type
export const ALL_PARSABLE_STATS = [...DEFAULT_ATTRIBUTE_DEFINITIONS.map(a => a.id), 'spiritualQi'];

export const DEFAULT_BUTTONS: QuickActionButtonConfig[] = [
    { id: 'inventory', label: 'Túi Đồ', description: 'Mở túi đồ của bạn', iconName: 'GiSwapBag', actionText: 'mở túi đồ' },
    { id: 'wiki', label: 'Bách Khoa', description: 'Mở Bách Khoa Toàn Thư để tra cứu thông tin thế giới.', iconName: 'FaBookOpen', actionText: 'mở bách khoa' },
    { id: 'dashboard', label: 'Trạng Thái', description: 'Mở bảng trạng thái nhân vật', iconName: 'FaUser', actionText: 'mở bảng trạng thái' },
];

// FIX: Renamed TIER_RANK_CAPS to REALM_RANK_CAPS
export const REALM_RANK_CAPS: Record<string, { maxRank: AbilityRank, maxQuality: ItemQuality }> = {
    'pham_nhan': { maxRank: 'Phàm Giai', maxQuality: 'Phàm Phẩm' },
    'luyen_khi': { maxRank: 'Tiểu Giai', maxQuality: 'Linh Phẩm' },
    'truc_co': { maxRank: 'Trung Giai', maxQuality: 'Pháp Phẩm' },
    'ket_dan': { maxRank: 'Cao Giai', maxQuality: 'Bảo Phẩm' },
    'nguyen_anh': { maxRank: 'Siêu Giai', maxQuality: 'Tiên Phẩm' },
    'hoa_than': { maxRank: 'Địa Giai', maxQuality: 'Tiên Phẩm' },
    'luyen_hu': { maxRank: 'Thiên Giai', maxQuality: 'Tuyệt Phẩm' },
    'hop_the': { maxRank: 'Thánh Giai', maxQuality: 'Tuyệt Phẩm' },
    'dai_thua': { maxRank: 'Thánh Giai', maxQuality: 'Tuyệt Phẩm' },
    'do_kiep': { maxRank: 'Thánh Giai', maxQuality: 'Tuyệt Phẩm' },
    'nhan_tien': { maxRank: 'Thánh Giai', maxQuality: 'Tuyệt Phẩm' },
};