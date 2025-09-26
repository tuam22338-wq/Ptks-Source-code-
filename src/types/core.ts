// FIX: Add ElementType import and export here to be used globally.
import type { ElementType } from 'react';
export type { ElementType };

// --- Generic Types ---
export interface Faction {
  name: string;
  description: string;
  imageUrl: string;
}

export type Element = 'Kim' | 'Mộc' | 'Thủy' | 'Hỏa' | 'Thổ' | 'Vô' | 'Dị' | 'Hỗn Độn';

// --- Foundational Types ---
export interface StatBonus {
  attribute: string;
  value: number;
}

export interface AttributeDefinition {
  id: string; // Machine-readable ID, e.g., 'can_cot', 'radiation_resist'
  name: string; // Display name, e.g., 'Căn Cốt', 'Kháng Xạ'
  description: string; // Description for UI and AI context
  iconName: string; // Icon from a predefined library
  type: 'PRIMARY' | 'SECONDARY' | 'VITAL' | 'INFORMATIONAL'; // PRIMARY: base stat, SECONDARY: derived, VITAL: depletable (HP/MP), INFORMATIONAL: non-numeric (e.g., realm)
  baseValue?: number; // Default starting value
  formula?: string; // Formula for SECONDARY stats, e.g., "(can_cot * 5) + (ben_bi * 2)"
  group: string; // The ID of the group this attribute belongs to
}

export interface AttributeGroupDefinition {
    id: string; // e.g., 'physical', 'survival_metrics'
    name: string; // e.g., 'Tinh (精 - Nhục Thân)', 'Chỉ Số Sinh Tồn'
    order: number; // Display order
}

export type CharacterAttributes = Record<string, {
    value: number;
    maxValue?: number;
}>;

export type Gender = 'Nam' | 'Nữ';

export type ItemType = 'Vũ Khí' | 'Phòng Cụ' | 'Đan Dược' | 'Pháp Bảo' | 'Tạp Vật' | 'Đan Lô' | 'Linh Dược' | 'Đan Phương' | 'Nguyên Liệu';
export type PhapBaoRank = 'Phàm Giai' | 'Tiểu Giai' | 'Trung Giai' | 'Cao Giai' | 'Siêu Giai' | 'Địa Giai' | 'Thiên Giai' | 'Thánh Giai';
export type ItemQuality = 'Phàm Phẩm' | 'Linh Phẩm' | 'Pháp Phẩm' | 'Bảo Phẩm' | 'Tiên Phẩm' | 'Tuyệt Phẩm';
export type EquipmentSlot = 'Vũ Khí' | 'Thượng Y' | 'Hạ Y' | 'Giày' | 'Phụ Kiện 1' | 'Phụ Kiện 2';
export type InnateTalentRank = 'Phàm Giai' | 'Siêu Phàm Giai' | 'Sơ Tiên Giai' | 'Trung Tiên Giai' | 'Hậu Tiên Giai' | 'Đại Tiên Giai' | 'Thánh Giai';
export type Season = 'Xuân' | 'Hạ' | 'Thu' | 'Đông';
export type TimeOfDay = 'Sáng Sớm' | 'Buổi Sáng' | 'Buổi Trưa' | 'Buổi Chiều' | 'Hoàng Hôn' | 'Buổi Tối' | 'Nửa Đêm';
export type Weather = 'SUNNY' | 'CLOUDY' | 'RAIN' | 'STORM' | 'SNOW';
export type TechniqueEffectType = 'DAMAGE' | 'HEAL' | 'BUFF' | 'DEBUFF' | 'APPLY_EFFECT';

// FIX: Define SkillCheck here to be used across modules without conflict.
export interface SkillCheck {
  attribute: string;
  difficulty: number;
}

export interface TechniqueEffect {
    type: TechniqueEffectType;
    details: Record<string, any>;
}
export type CultivationTechniqueType = 'Linh Kỹ' | 'Thần Thông' | 'Độn Thuật' | 'Tuyệt Kỹ' | 'Tâm Pháp' | 'Luyện Thể' | 'Kiếm Quyết';
export type CurrencyType = 
    | 'Đồng' | 'Bạc' | 'Vàng' 
    | 'Linh thạch hạ phẩm' | 'Linh thạch trung phẩm' | 'Linh thạch thượng phẩm' | 'Linh thạch cực phẩm'
    | 'Tiên Ngọc'
    | 'Điểm Cống Hiến Tông Môn' | 'Điểm Danh Vọng' | 'Điểm Nguồn';