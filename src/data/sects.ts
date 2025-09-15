import type { Sect, SectMission } from '../types';
import { FaSun } from 'react-icons/fa';
import { GiYinYang } from 'react-icons/gi';

const XIEN_GIAO_MISSIONS: SectMission[] = [
    {
        id: 'xg_mission_1',
        title: 'Diệt Yêu Thú',
        description: 'Yêu thú tại Rừng Cổ Thụ đang quấy nhiễu dân lành. Hãy đến đó trừ hại cho dân.',
        objectives: [{ type: 'DEFEAT', targetId: 'Yêu Thú Rừng', quantity: 3 }],
        rewards: { contribution: 100, currency: { 'Bạc': 200 } }
    },
    {
        id: 'xg_mission_2',
        title: 'Thu thập Linh Thảo',
        description: 'Trưởng lão luyện đan đang cần gấp một số dược liệu. Hãy thu thập Linh Tâm Thảo và Thanh Diệp Hoa.',
        objectives: [
            { type: 'GATHER', targetId: 'Linh Tâm Thảo', quantity: 5 },
            { type: 'GATHER', targetId: 'Thanh Diệp Hoa', quantity: 2 },
        ],
        rewards: { contribution: 150, items: [{ name: 'Hồi Khí Đan', quantity: 2 }] }
    }
];

const TRIET_GIAO_MISSIONS: SectMission[] = [
     {
        id: 'tg_mission_1',
        title: 'Tìm Kiếm Tán Tu',
        description: 'Giáo chủ chủ trương hữu giáo vô loại. Hãy đi tìm các tán tu có tiềm năng và thuyết phục họ gia nhập.',
        objectives: [{ type: 'DEFEAT', targetId: 'Tán Tu', quantity: 2 }], // Using defeat as placeholder for interaction
        rewards: { contribution: 120, currency: { 'Linh thạch hạ phẩm': 10 } }
    },
];

export const SECTS: Sect[] = [
    {
        id: 'xien_giao',
        name: 'Xiển Giáo',
        description: 'Do Nguyên Thủy Thiên Tôn đứng đầu, tuân theo thiên mệnh, đề cao căn cơ và tư chất. Đệ tử đều là những người có phúc duyên sâu dày.',
        alignment: 'Chính Phái',
        icon: FaSun,
        joinRequirements: [{ attribute: 'Ngộ Tính', value: 15, greaterThan: true }, { attribute: 'Cơ Duyên', value: 15, greaterThan: true }],
        ranks: [
            { name: 'Đệ tử Ghi danh', contributionRequired: 0 },
            { name: 'Đệ tử Ngoại môn', contributionRequired: 500 },
            { name: 'Đệ tử Nội môn', contributionRequired: 2000 },
            { name: 'Đệ tử Chân truyền', contributionRequired: 10000 },
        ],
        missions: XIEN_GIAO_MISSIONS
    },
    {
        id: 'triet_giao',
        name: 'Triệt Giáo',
        description: "Do Thông Thiên Giáo Chủ sáng lập, chủ trương 'hữu giáo vô loại', thu nhận mọi chúng sinh có lòng cầu đạo, không phân biệt nguồn gốc.",
        alignment: 'Trung Lập',
        icon: GiYinYang,
        joinRequirements: [{ attribute: 'Đạo Tâm', value: 12, greaterThan: true }],
        ranks: [
            { name: 'Ký danh Đệ tử', contributionRequired: 0 },
            { name: 'Ngoại môn Đệ tử', contributionRequired: 400 },
            { name: 'Nội môn Đệ tử', contributionRequired: 1800 },
            { name: 'Thân truyền Đệ tử', contributionRequired: 9000 },
        ],
        missions: TRIET_GIAO_MISSIONS
    },
];
