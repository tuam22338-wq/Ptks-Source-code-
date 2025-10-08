import type { Element, StatBonus, InnateTalentRank, Gender } from './core';

// --- New PowerSource System Types ---
export type SpiritualRootQuality = 'Phàm Căn' | 'Linh Căn' | 'Địa Căn' | 'Thiên Căn' | 'Thánh Căn';

export interface SpiritualRoot {
  elements: { type: Element; purity: number }[]; // Purity from 1-100
  quality: SpiritualRootQuality;
  name: string; // e.g., "Hỏa Thiên Linh Căn", "Kim Mộc Thủy Tạp Linh Căn", "Lõi Năng Lượng Cybernetic"
  description: string;
  bonuses: StatBonus[];
}
// --- End New System ---

export interface InnateTalent {
  name: string;
  description: string;
  rank: InnateTalentRank;
  effect: string;
  bonuses?: StatBonus[];
  triggerCondition?: string; // e.g., "Khi sinh mệnh dưới 20%"
  synergy?: string; // e.g., "Mạnh hơn khi trang bị kiếm"
}

export interface CharacterIdentity {
  name: string;
  origin: string;
  appearance: string;
  gender: Gender;
  personality: string;
  age: number;
  familyName?: string;
}
