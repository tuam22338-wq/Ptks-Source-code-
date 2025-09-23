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
  id: string;
  name: string;
  description: string;
  iconName: string;
  type: 'PRIMARY' | 'SECONDARY' | 'VITAL' | 'INFORMATIONAL';
  baseValue?: number;
  formula?: string;
  tags?: string[];
  group: string;
}

export interface AttributeGroupDefinition {
    id: string;
    name: string;
    order: number;
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