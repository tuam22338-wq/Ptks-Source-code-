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

export type Gender = 'Nam' | 'Nữ' | 'AI';

export type ItemType = 'Vũ Khí' | 'Phòng Cụ' | 'Đan Dược' | 'Pháp Bảo' | 'Tạp Vật' | 'Đan Lô' | 'Linh Dược' | 'Đan Phương' | 'Nguyên Liệu';
export type AbilityRank = 'Phàm Giai' | 'Tiểu Giai' | 'Trung Giai' | 'Cao Giai' | 'Siêu Giai' | 'Địa Giai' | 'Thiên Giai' | 'Thánh Giai';
export type ItemQuality = 'Phàm Phẩm' | 'Linh Phẩm' | 'Pháp Phẩm' | 'Bảo Phẩm' | 'Tiên Phẩm' | 'Tuyệt Phẩm';
export type EquipmentSlot = 'Vũ Khí' | 'Thượng Y' | 'Hạ Y' | 'Giày' | 'Phụ Kiện 1' | 'Phụ Kiện 2';
export type InnateTalentRank = 'Phàm Giai' | 'Siêu Phàm Giai' | 'Sơ Tiên Giai' | 'Trung Tiên Giai' | 'Hậu Tiên Giai' | 'Đại Tiên Giai' | 'Thánh Giai';
export type Season = 'Xuân' | 'Hạ' | 'Thu' | 'Đông';
export type TimeOfDay = 'Sáng Sớm' | 'Buổi Sáng' | 'Buổi Trưa' | 'Buổi Chiều' | 'Hoàng Hôn' | 'Buổi Tối' | 'Nửa Đêm';
export type Weather = 'SUNNY' | 'CLOUDY' | 'RAIN' | 'STORM' | 'SNOW';
export type AbilityEffectType = 'DAMAGE' | 'HEAL' | 'BUFF' | 'DEBUFF' | 'APPLY_EFFECT';

// FIX: Define SkillCheck, EventChoice, and EventOutcome here to be used across modules without conflict.
export interface SkillCheck {
  attribute: string;
  difficulty: number;
}

export interface EventChoice {
    id: string;
    text: string;
    check?: SkillCheck;
}

export type EventOutcomeType = 'GIVE_ITEM' | 'REMOVE_ITEM' | 'CHANGE_STAT' | 'ADD_RUMOR' | 'START_EVENT' | 'START_STORY' | 'UPDATE_REPUTATION';

export interface EventOutcome {
    type: EventOutcomeType;
    details: Record<string, any>;
}

// FIX: Moved CultivationTechnique from gameplay.ts to here to resolve circular dependency.
export interface CultivationTechnique {
    id: string;
    name: string;
    description: string;
    type: AbilityType;
    cost: {
        type: 'Linh Lực' | 'Sinh Mệnh' | 'Nguyên Thần';
        value: number;
    };
    cooldown: number; // in turns/actions, 0 for no cooldown
    effects: AbilityEffect[];
    rank: AbilityRank;
    icon: string;
    level: number;
    maxLevel: number;
    levelBonuses?: { level: number, bonuses: StatBonus[] }[];
    element?: Element;
    requirements?: StatBonus[];
    tags?: string[];
    bonuses?: StatBonus[];
}

export interface AbilityEffect {
    type: AbilityEffectType;
    details: Record<string, any>;
}
export type AbilityType = 'Linh Kỹ' | 'Thần Thông' | 'Độn Thuật' | 'Tuyệt Kỹ' | 'Tâm Pháp' | 'Luyện Thể' | 'Kiếm Quyết';
export type CurrencyType = 
    | 'Đồng' | 'Bạc' | 'Vàng' 
    | 'Linh thạch hạ phẩm' | 'Linh thạch trung phẩm' | 'Linh thạch thượng phẩm' | 'Linh thạch cực phẩm'
    | 'Tiên Ngọc'
    | 'Điểm Cống Hiến Tông Môn' | 'Điểm Danh Vọng' | 'Điểm Nguồn';