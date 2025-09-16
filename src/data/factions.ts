import type { Faction } from '../types';

export const FACTIONS: Faction[] = [
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
export const FACTION_NAMES = FACTIONS.map(f => f.name);