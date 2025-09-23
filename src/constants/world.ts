import { PT_FACTIONS, PT_FACTION_NAMES, JTTW_FACTIONS, JTTW_FACTION_NAMES } from '../data/factions';
import { PT_WORLD_MAP, JTTW_WORLD_MAP } from '../data/locations';
import { PT_NPC_LIST, JTTW_NPC_LIST } from '../data/npcs';
import { PT_MAJOR_EVENTS, JTTW_MAJOR_EVENTS } from '../data/events';
import type { PhapBaoRank, ItemQuality } from '../types';

export {
    PT_FACTIONS, PT_FACTION_NAMES, JTTW_FACTIONS, JTTW_FACTION_NAMES,
    PT_WORLD_MAP, JTTW_WORLD_MAP,
    PT_NPC_LIST, JTTW_NPC_LIST,
    PT_MAJOR_EVENTS, JTTW_MAJOR_EVENTS
};

export const DEFAULT_WORLDS_INFO = {
    phong_than_dien_nghia: {
        id: 'phong_than_dien_nghia',
        name: 'Phong Thần Diễn Nghĩa',
        description: 'Thế giới nguyên bản của Tam Thiên Thế Giới, dựa trên bối cảnh Phong Thần Diễn Nghĩa với các sự kiện và nhân vật quen thuộc.',
        author: 'Nhà phát triển',
        majorEvents: PT_MAJOR_EVENTS,
        source: 'default' as const,
    },
    tay_du_ky: {
        id: 'tay_du_ky',
        name: 'Tây Du Ký',
        description: 'Hành trình đến Tây Thiên thỉnh kinh của bốn thầy trò Đường Tăng, vượt qua 81 kiếp nạn, đối đầu với vô số yêu ma quỷ quái.',
        author: 'Nhà phát triển',
        majorEvents: JTTW_MAJOR_EVENTS,
        source: 'default' as const,
    }
};

// Constants for Mechanical Filter (Pillar 3)
export const RANK_ORDER: PhapBaoRank[] = ['Phàm Giai', 'Tiểu Giai', 'Trung Giai', 'Cao Giai', 'Siêu Giai', 'Địa Giai', 'Thiên Giai', 'Thánh Giai'];
export const QUALITY_ORDER: ItemQuality[] = ['Phàm Phẩm', 'Linh Phẩm', 'Pháp Phẩm', 'Bảo Phẩm', 'Tiên Phẩm', 'Tuyệt Phẩm'];

export const REALM_RANK_CAPS: Record<string, { maxRank: PhapBaoRank, maxQuality: ItemQuality }> = {
    'pham_nhan': { maxRank: 'Phàm Giai', maxQuality: 'Phàm Phẩm' },
    'luyen_khi': { maxRank: 'Phàm Giai', maxQuality: 'Phàm Phẩm' },
    'truc_co': { maxRank: 'Tiểu Giai', maxQuality: 'Linh Phẩm' },
    'ket_dan': { maxRank: 'Trung Giai', maxQuality: 'Pháp Phẩm' },
    'nguyen_anh': { maxRank: 'Cao Giai', maxQuality: 'Bảo Phẩm' },
    'hoa_than': { maxRank: 'Siêu Giai', maxQuality: 'Tiên Phẩm' },
    'luyen_hu': { maxRank: 'Địa Giai', maxQuality: 'Tuyệt Phẩm' },
    'hop_the': { maxRank: 'Thiên Giai', maxQuality: 'Tuyệt Phẩm' },
    'dai_thua': { maxRank: 'Thánh Giai', maxQuality: 'Tuyệt Phẩm' },
    // Immortal realms have no caps
};
