import type { Faction } from '../types';

export const PT_FACTIONS: Faction[] = [
  {
    name: "Nhà Thương",
    description: "Triều đại đang suy tàn dưới sự trị vì của Trụ Vương, chìm trong xa hoa và bạo ngược, là trung tâm của sự hỗn loạn sắp tới.",
    imageUrl: "https://images.unsplash.com/photo-1583012589241-c471e3cb2d7c?q=80&w=2670&auto=format-fit-crop",
  },
  {
    name: "Xiển Giáo",
    description: "Một trong tam giáo, do Nguyên Thủy Thiên Tôn lãnh đạo, tuân theo thiên mệnh và ủng hộ nhà Chu lật đổ nhà Thương.",
    imageUrl: "https://images.unsplash.com/photo-1627916943231-512614b1b86c?q=80&w=2670&auto=format-fit-crop",
  },
  {
    name: "Triệt Giáo",
    description: "Do Thông Thiên Giáo Chủ đứng đầu, chủ trương 'hữu giáo vô loại', thu nhận vạn vật chúng sinh, đối đầu với Xiển Giáo.",
    imageUrl: "https://images.unsplash.com/photo-1596779350257-259654823FF8?q=80&w=2670&auto=format-fit-crop",
  },
];
export const PT_FACTION_NAMES = PT_FACTIONS.map(f => f.name);

export const JTTW_FACTIONS: Faction[] = [
  {
    name: "Thiên Đình",
    description: "Cung đình của Ngọc Hoàng Đại Đế, cai quản tam giới, duy trì trật tự của trời đất.",
    imageUrl: "...",
  },
  {
    name: "Phật Môn",
    description: "Thế lực của Phật Tổ Như Lai ở Tây Thiên, chủ trương phổ độ chúng sinh, lấy từ bi làm gốc.",
    imageUrl: "...",
  },
  {
    name: "Yêu Giới",
    description: "Tập hợp các yêu ma, quỷ quái chiếm núi xưng vương, không tuân theo luật lệ của Thiên Đình.",
    imageUrl: "...",
  },
];
export const JTTW_FACTION_NAMES = JTTW_FACTIONS.map(f => f.name);