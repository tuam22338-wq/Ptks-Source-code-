import type { CurrencyType, NarrativeStyle, Theme, LayoutMode, GameSpeed, InnateTalentRank, PhapBaoRank, ItemQuality, EquipmentSlot } from '../types';

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
    { value: 'dark_fantasy', label: 'Huyền huyễn Hắc ám' },
    { value: 'poetic', label: 'Văn phong Thi vị' },
    { value: 'concise', label: 'Súc tích, ngắn gọn' },
    { value: 'er_gen_style', label: 'Phong cách Nhĩ Căn' },
    { value: 'fenghuo_style', label: 'Phong cách Phong Hỏa' },
];

export const FONT_OPTIONS: { value: string; label: string }[] = [
    { value: "'Noto Serif', serif", label: 'Noto Serif (Mặc định)' },
    { value: "'Cormorant Garamond', serif", label: 'Cormorant Garamond' },
    { value: "'ZCOOL XiaoWei', serif", label: 'ZCOOL XiaoWei' },
    { value: "'Ma Shan Zheng', cursive", label: 'Ma Shan Zheng' },
];

export const THEME_OPTIONS: { value: Theme; label: string }[] = [
    { value: 'theme-bamboo-forest', label: 'Trúc Lâm U Tịch (Tối)' },
    { value: 'theme-sunrise-peak', label: 'Triêu Dương Đỉnh (Sáng)' },
    { value: 'theme-bich-du-cung', label: 'Bích Du Cung (Huyền ảo)' },
    { value: 'theme-ngoc-hu-cung', label: 'Ngọc Hư Cung (Trang nghiêm)' },
    { value: 'theme-huyet-sat-ma-dien', label: 'Huyết Sát Ma Điện (Hắc ám)' },
    { value: 'theme-thuy-mac-hoa', label: 'Thủy Mặc Họa (Tối giản)' },
];

export const DYNAMIC_BACKGROUND_OPTIONS: { id: string; name: string; thumbnailClass: string }[] = [
    { id: 'none', name: 'Tĩnh', thumbnailClass: 'bg-gray-800' },
    { id: 'ink_wash', name: 'Thủy Mặc', thumbnailClass: 'bg-thumbnail-ink_wash' },
    { id: 'sunset_peak', name: 'Hoàng Hôn', thumbnailClass: 'bg-thumbnail-sunset_peak' },
    { id: 'mystic_violet', name: 'Huyền Tím', thumbnailClass: 'bg-thumbnail-mystic_violet' },
    { id: 'blood_moon', name: 'Huyết Nguyệt', thumbnailClass: 'bg-thumbnail-blood_moon' },
    { id: 'jade_forest', name: 'Ngọc Lâm', thumbnailClass: 'bg-thumbnail-jade_forest' },
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