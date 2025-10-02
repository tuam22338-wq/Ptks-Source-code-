import type { CurrencyType, NarrativeStyle, Theme, LayoutMode, GameSpeed, InnateTalentRank, AbilityRank, ItemQuality, EquipmentSlot } from '../types';

export const CURRENCY_DEFINITIONS: Record<CurrencyType, { name: CurrencyType; icon: string; category: 'Phàm Tệ' | 'Linh Tệ' | 'Tiên Tệ' | 'Đặc Biệt' }> = {
    'Đồng': { name: 'Đồng', icon: '🪙', category: 'Phàm Tệ' },
    'Bạc': { name: 'Bạc', icon: '⚪', category: 'Phàm Tệ' },
    'Vàng': { name: 'Vàng', icon: '🟡', category: 'Phàm Tệ' },
    'Linh thạch hạ phẩm': { name: 'Linh thạch hạ phẩm', icon: '💎', category: 'Linh Tệ' },
    'Linh thạch trung phẩm': { name: 'Linh thạch trung phẩm', icon: '💠', category: 'Linh Tệ' },
    'Linh thạch thượng phẩm': { name: 'Linh thạch thượng phẩm', icon: '🔮', category: 'Linh Tệ' },
    'Linh thạch cực phẩm': { name: 'Linh thạch cực phẩm', icon: '✨', category: 'Linh Tệ' },
    'Tiên Ngọc': { name: 'Tiên Ngọc', icon: '💖', category: 'Tiên Tệ' },
    'Điểm Cống Hiến Tông Môn': { name: 'Điểm Cống Hiến Tông Môn', icon: '📜', category: 'Đặc Biệt' },
    'Điểm Danh Vọng': { name: 'Điểm Danh Vọng', icon: '🌟', category: 'Đặc Biệt' },
    'Điểm Nguồn': { name: 'Điểm Nguồn', icon: '⚡', category: 'Đặc Biệt' },
};

export const NARRATIVE_STYLES: { value: NarrativeStyle; label: string }[] = [
    { value: 'classic_wuxia', label: 'Cổ điển Tiên hiệp' },
    { value: 'dark_fantasy', label: 'Hắc Ám Kỳ Ảo' },
    { value: 'poetic', label: 'Văn Phong Thi Ca' },
    { value: 'concise', label: 'Ngắn Gọn, Súc Tích' },
    { value: 'er_gen_style', label: 'Văn phong Nhĩ Căn' },
    { value: 'fenghuo_style', label: 'Văn phong Phong Hỏa' },
    { value: 'cyberpunk', label: 'Cyberpunk' },
    { value: 'noir_detective', label: 'Trinh Thám Đen' },
    { value: 'epic_fantasy', label: 'Sử Thi Kỳ Ảo' },
    { value: 'lovecraftian_horror', label: 'Kinh Dị Lovecraft' },
    { value: 'comedic', label: 'Hài Hước' },
    { value: 'slice_of_life', label: 'Đời Thường' },
];

export const THEME_OPTIONS: { value: Theme; label: string; premium?: boolean }[] = [
    { value: 'theme-bich-du-cung', label: 'Bích Du Cung (Mặc định)' },
    { value: 'theme-ink-wash-bamboo', label: 'Thủy Mặc Trúc Lâm' },
    { value: 'theme-bamboo-forest', label: 'Rừng Trúc Vàng' },
    { value: 'theme-sunrise-peak', label: 'Bình Minh (Sáng)' },
    { value: 'theme-huyet-sat-ma-dien', label: 'Huyết Sát Ma Điện (Hắc ám)' },
    { value: 'theme-thon-phe-tinh-ha', label: 'Thôn Phệ Tinh Hà' },
    { value: 'theme-cyber-cultivation-city', label: 'Cyber Tu Chân' },
    { value: 'theme-dao-ton-premium', label: 'Đạo Tôn 👑 (Premium)', premium: true },
    { value: 'theme-custom', label: 'Tùy Chỉnh Của Bạn' },
];

export const FONT_OPTIONS: { value: string; label: string }[] = [
    { value: "'Noto Serif', serif", label: 'Noto Serif (Mặc định)' },
    { value: "'Cormorant Garamond', serif", label: 'Cormorant Garamond' },
    { value: "'ZCOOL XiaoWei', serif", label: 'ZCOOL XiaoWei' },
    { value: 'sans-serif', label: 'Hệ thống (Không chân)' },
];

export const LAYOUT_MODES: { value: LayoutMode; label: string }[] = [
    { value: 'auto', label: 'Tự động' },
    { value: 'desktop', label: 'Máy tính' },
    { value: 'mobile', label: 'Di động' },
];

export const GAME_SPEEDS: { value: GameSpeed; label: string; multiplier: number }[] = [
    { value: 'very_slow', label: 'Rất chậm', multiplier: 0.5 },
    { value: 'slow', label: 'Chậm', multiplier: 0.75 },
    { value: 'normal', label: 'Bình thường', multiplier: 1 },
    { value: 'fast', label: 'Nhanh', multiplier: 1.5 },
    { value: 'very_fast', label: 'Rất nhanh', multiplier: 2 },
];


export const RANK_ORDER: InnateTalentRank[] = [
    'Phàm Giai', 'Siêu Phàm Giai', 'Sơ Tiên Giai', 'Trung Tiên Giai', 
    'Hậu Tiên Giai', 'Đại Tiên Giai', 'Thánh Giai'
];

export const ABILITY_RANK_ORDER: AbilityRank[] = [
    'Phàm Giai', 'Tiểu Giai', 'Trung Giai', 'Cao Giai', 'Siêu Giai', 'Địa Giai', 'Thiên Giai', 'Thánh Giai'
];
// FIX: Export alias for backward compatibility
export const PHAP_BAO_RANK_ORDER = ABILITY_RANK_ORDER;

export const ABILITY_RANKS: Record<AbilityRank, { color: string }> = {
    'Phàm Giai': { color: 'text-gray-400' },
    'Tiểu Giai': { color: 'text-green-400' },
    'Trung Giai': { color: 'text-blue-400' },
    'Cao Giai': { color: 'text-purple-400' },
    'Siêu Giai': { color: 'text-yellow-400' },
    'Địa Giai': { color: 'text-orange-400' },
    'Thiên Giai': { color: 'text-red-400' },
    'Thánh Giai': { color: 'text-fuchsia-400' },
};
// FIX: Export alias for backward compatibility
export const PHAP_BAO_RANKS = ABILITY_RANKS;

export const QUALITY_ORDER: ItemQuality[] = [
    'Phàm Phẩm', 'Linh Phẩm', 'Pháp Phẩm', 'Bảo Phẩm', 'Tiên Phẩm', 'Tuyệt Phẩm'
];

export const ITEM_QUALITY_STYLES: Record<ItemQuality, { color: string, glow: string }> = {
    'Phàm Phẩm': { color: 'text-gray-400', glow: '' },
    'Linh Phẩm': { color: 'text-green-400', glow: 'shadow-[0_0_8px_rgba(74,222,128,0.5)]' },
    'Pháp Phẩm': { color: 'text-blue-400', glow: 'shadow-[0_0_10px_rgba(96,165,250,0.6)]' },
    'Bảo Phẩm': { color: 'text-purple-400', glow: 'shadow-[0_0_12px_rgba(192,132,252,0.7)]' },
    'Tiên Phẩm': { color: 'text-amber-400', glow: 'shadow-[0_0_15px_rgba(252,211,77,0.8)]' },
    'Tuyệt Phẩm': { color: 'text-red-400', glow: 'shadow-[0_0_20px_rgba(248,113,113,0.9)]' },
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

export const DYNAMIC_BACKGROUND_OPTIONS = [
    { id: 'none', name: 'Tĩnh', thumbnailClass: 'bg-gray-800' },
    { id: 'ink_wash', name: 'Thủy Mặc', thumbnailClass: 'bg-thumbnail-ink_wash' },
    { id: 'sunset_peak', name: 'Hoàng Hôn', thumbnailClass: 'bg-thumbnail-sunset_peak' },
    { id: 'mystic_violet', name: 'Huyền Ảo', thumbnailClass: 'bg-thumbnail-mystic_violet' },
    { id: 'blood_moon', name: 'Huyết Nguyệt', thumbnailClass: 'bg-thumbnail-blood_moon' },
    { id: 'jade_forest', name: 'Rừng Ngọc', thumbnailClass: 'bg-thumbnail-jade_forest' },
    { id: 'cyber-cultivation-city', name: 'Cyber Tu Chân', thumbnailClass: 'bg-thumbnail-cyber-cultivation-city' },
];