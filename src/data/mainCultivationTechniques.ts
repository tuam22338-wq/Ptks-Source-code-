import type { MainCultivationTechnique } from '../types';

// This is a database of 50 main cultivation techniques.
// Each technique has a full skill tree from Luyện Khí to Độ Kiếp.
export const MAIN_CULTIVATION_TECHNIQUES_DATABASE: MainCultivationTechnique[] = [
  {
    "id": "main_tech_van_vat_quy_nguyen",
    "name": "Vạn Vật Quy Nguyên Quyết",
    "description": "Một công pháp cổ xưa, tập trung vào việc hấp thụ linh khí từ vạn vật để củng cố bản thân, nền tảng vững chắc, hậu kỳ vô tận.",
    "skillTreeNodes": {
      "root": {
        "id": "root",
        "name": "Quy Nguyên Tâm Pháp",
        "description": "Nền tảng của Vạn Vật Quy Nguyên Quyết, tăng tốc độ hấp thụ linh khí.",
        "icon": "🌀",
        "realmRequirement": "luyen_khi",
        "cost": 0,
        "isUnlocked": false,
        "type": "core_enhancement",
        "childrenIds": [
          "lk_passive_1",
          "lk_active_1"
        ],
        "position": {
          "x": 50,
          "y": 5
        },
        "bonuses": [
          {
            "attribute": "Ngộ Tính",
            "value": 5
          }
        ]
      },
      "lk_passive_1": {
        "id": "lk_passive_1",
        "name": "Tẩy Tủy",
        "description": "Thanh lọc cơ thể, tăng cường Căn Cốt.",
        "icon": "💧",
        "realmRequirement": "luyen_khi",
        "cost": 1,
        "isUnlocked": false,
        "type": "passive_bonus",
        "childrenIds": [
          "lk_passive_2"
        ],
        "position": {
          "x": 30,
          "y": 15
        },
        "bonuses": [
          {
            "attribute": "Căn Cốt",
            "value": 10
          }
        ]
      },
      "lk_active_1": {
        "id": "lk_active_1",
        "name": "Linh Khí Thuẫn",
        "description": "Tạo ra một tấm khiên linh khí để phòng ngự.",
        "icon": "🛡️",
        "realmRequirement": "luyen_khi",
        "cost": 1,
        "isUnlocked": false,
        "type": "active_skill",
        "childrenIds": [
          "lk_passive_2"
        ],
        "position": {
          "x": 70,
          "y": 15
        },
        "activeSkill": {
          "name": "Linh Khí Thuẫn",
          "description": "Tạo một tấm khiên hấp thụ 50 sát thương trong 3 lượt.",
          "type": "Linh Kỹ",
          "cost": {
            "type": "Linh Lực",
            "value": 20
          },
          "cooldown": 5,
          "effects": [],
          "rank": "Phàm Giai",
          "icon": "🛡️"
        }
      },
      "lk_passive_2": {
        "id": "lk_passive_2",
        "name": "Dưỡng Thần",
        "description": "Tẩm bổ linh hồn, tăng cường Nguyên Thần.",
        "icon": "🧠",
        "realmRequirement": "luyen_khi",
        "cost": 2,
        "isUnlocked": false,
        "type": "passive_bonus",
        "childrenIds": [
          "tc_core"
        ],
        "position": {
          "x": 50,
          "y": 25
        },
        "bonuses": [
          {
            "attribute": "Nguyên Thần",
            "value": 10
          }
        ]
      },
      "tc_core": {
        "id": "tc_core",
        "name": "Trúc Cơ Đạo Thể",
        "description": "Sau khi Trúc Cơ, cơ thể trở nên mạnh mẽ hơn, tăng Sinh Mệnh và Linh Lực.",
        "icon": "💪",
        "realmRequirement": "truc_co",
        "cost": 1,
        "isUnlocked": false,
        "type": "core_enhancement",
        "childrenIds": [
          "tc_passive_1",
          "tc_active_1"
        ],
        "position": {
          "x": 50,
          "y": 35
        },
        "bonuses": [
          {
            "attribute": "Sinh Mệnh",
            "value": 100
          },
          {
            "attribute": "Linh Lực",
            "value": 50
          }
        ]
      },
      "tc_passive_1": {
        "id": "tc_passive_1",
        "name": "Chân Nguyên Hộ Thể",
        "description": "Chân nguyên tự động bảo vệ cơ thể, tăng Bền Bỉ.",
        "icon": "🧱",
        "realmRequirement": "truc_co",
        "cost": 2,
        "isUnlocked": false,
        "type": "passive_bonus",
        "childrenIds": [
          "tc_active_2"
        ],
        "position": {
          "x": 30,
          "y": 45
        },
        "bonuses": [
          {
            "attribute": "Bền Bỉ",
            "value": 15
          }
        ]
      },
      "tc_active_1": {
        "id": "tc_active_1",
        "name": "Linh Tức Trảm",
        "description": "Ngưng tụ linh khí thành một đòn tấn công.",
        "icon": "⚔️",
        "realmRequirement": "truc_co",
        "cost": 2,
        "isUnlocked": false,
        "type": "active_skill",
        "childrenIds": [
          "tc_active_2"
        ],
        "position": {
          "x": 70,
          "y": 45
        },
        "activeSkill": {
          "name": "Linh Tức Trảm",
          "description": "Gây sát thương bằng 120% chỉ số Linh Lực Sát Thương của bạn.",
          "type": "Thần Thông",
          "cost": {
            "type": "Linh Lực",
            "value": 40
          },
          "cooldown": 3,
          "effects": [],
          "rank": "Tiểu Giai",
          "icon": "⚔️"
        }
      },
      "tc_active_2": {
        "id": "tc_active_2",
        "name": "Quy Nguyên Thuật",
        "description": "Hấp thụ linh khí từ môi trường để hồi phục.",
        "icon": "➕",
        "realmRequirement": "truc_co",
        "cost": 3,
        "isUnlocked": false,
        "type": "active_skill",
        "childrenIds": [
          "kd_core"
        ],
        "position": {
          "x": 50,
          "y": 55
        },
        "activeSkill": {
          "name": "Quy Nguyên Thuật",
          "description": "Hồi phục 30% Linh Lực đã mất.",
          "type": "Linh Kỹ",
          "cost": {
            "type": "Linh Lực",
            "value": 0
          },
          "cooldown": 8,
          "effects": [],
          "rank": "Tiểu Giai",
          "icon": "➕"
        }
      },
      "kd_core": {
        "id": "kd_core",
        "name": "Kim Đan Bất Diệt",
        "description": "Kim Đan kiên cố, tăng mạnh khả năng phòng ngự và kháng hiệu ứng.",
        "icon": "🔮",
        "realmRequirement": "ket_dan",
        "cost": 2,
        "isUnlocked": false,
        "type": "core_enhancement",
        "childrenIds": [
          "kd_passive_1"
        ],
        "position": {
          "x": 0,
          "y": 0
        },
        "bonuses": [
          {
            "attribute": "Bền Bỉ",
            "value": 20
          }
        ]
      },
      "kd_passive_1": {
        "id": "kd_passive_1",
        "name": "Vạn Vật Triều Tông",
        "description": "Gia tăng tốc độ thu nạp linh khí khi ở nơi có linh khí dồi dào.",
        "icon": "🌿",
        "realmRequirement": "ket_dan",
        "cost": 3,
        "isUnlocked": false,
        "type": "passive_bonus",
        "childrenIds": [
          "na_core"
        ],
        "position": {
          "x": 0,
          "y": 0
        },
        "bonuses": []
      },
      "na_core": {
        "id": "na_core",
        "name": "Nguyên Anh Xuất Khiếu",
        "description": "Nguyên Anh có thể rời khỏi cơ thể, tăng cường sức mạnh Thần Thức.",
        "icon": "👻",
        "realmRequirement": "nguyen_anh",
        "cost": 3,
        "isUnlocked": false,
        "type": "core_enhancement",
        "childrenIds": [
          "na_active_1"
        ],
        "position": {
          "x": 0,
          "y": 0
        },
        "bonuses": [
          {
            "attribute": "Thần Thức",
            "value": 30
          }
        ]
      },
      "na_active_1": {
        "id": "na_active_1",
        "name": "Đoạt Linh Thuật",
        "description": "Hút linh lực của kẻ địch để bổ sung cho bản thân.",
        "icon": "🧛",
        "realmRequirement": "nguyen_anh",
        "cost": 4,
        "isUnlocked": false,
        "type": "active_skill",
        "childrenIds": [
          "ht_core"
        ],
        "position": {
          "x": 0,
          "y": 0
        },
        "activeSkill": {
          "name": "Đoạt Linh Thuật",
          "description": "Gây sát thương và hồi phục một lượng Linh Lực bằng 50% sát thương gây ra.",
          "type": "Thần Thông",
          "cost": {
            "type": "Linh Lực",
            "value": 100
          },
          "cooldown": 6,
          "effects": [],
          "rank": "Trung Giai",
          "icon": "🧛"
        }
      },
      "ht_core": {
        "id": "ht_core",
        "name": "Hóa Thần Lĩnh Vực",
        "description": "Tạo ra một lĩnh vực nhỏ, áp chế kẻ địch và tăng sức mạnh cho bản thân.",
        "icon": "🌌",
        "realmRequirement": "hoa_than",
        "cost": 5,
        "isUnlocked": false,
        "type": "core_enhancement",
        "childrenIds": [
          "lh_core"
        ],
        "position": {
          "x": 0,
          "y": 0
        },
        "bonuses": [
          {
            "attribute": "Linh Lực Sát Thương",
            "value": 50
          }
        ]
      },
      "lh_core": {
        "id": "lh_core",
        "name": "Dung Nhập Hư Không",
        "description": "Cơ thể hòa vào hư không, tăng mạnh Thân Pháp và khả năng né tránh.",
        "icon": "💨",
        "realmRequirement": "luyen_hu",
        "cost": 6,
        "isUnlocked": false,
        "type": "core_enhancement",
        "childrenIds": [
          "hthe_core"
        ],
        "position": {
          "x": 0,
          "y": 0
        },
        "bonuses": [
          {
            "attribute": "Thân Pháp",
            "value": 100
          }
        ]
      },
      "hthe_core": {
        "id": "hthe_core",
        "name": "Thiên Nhân Hợp Nhất",
        "description": "Mượn sức mạnh của thiên địa, tăng toàn bộ thuộc tính.",
        "icon": "🌍",
        "realmRequirement": "hop_the",
        "cost": 8,
        "isUnlocked": false,
        "type": "core_enhancement",
        "childrenIds": [
          "dt_core"
        ],
        "position": {
          "x": 0,
          "y": 0
        },
        "bonuses": [
          {
            "attribute": "Căn Cốt",
            "value": 50
          },
          {
            "attribute": "Nguyên Thần",
            "value": 50
          }
        ]
      },
      "dt_core": {
        "id": "dt_core",
        "name": "Đại Đạo Quy Nhất",
        "description": "Lĩnh ngộ bản nguyên đại đạo, tăng mạnh Ngộ Tính.",
        "icon": "📜",
        "realmRequirement": "dai_thua",
        "cost": 10,
        "isUnlocked": false,
        "type": "core_enhancement",
        "childrenIds": [
          "dk_core"
        ],
        "position": {
          "x": 0,
          "y": 0
        },
        "bonuses": [
          {
            "attribute": "Ngộ Tính",
            "value": 100
          }
        ]
      },
      "dk_core": {
        "id": "dk_core",
        "name": "Vạn Vật Bất Tử Thân",
        "description": "Cơ thể hấp thụ sức mạnh của vạn vật, trở nên gần như bất tử, tăng mạnh Sinh Mệnh.",
        "icon": "♾️",
        "realmRequirement": "do_kiep",
        "cost": 15,
        "isUnlocked": false,
        "type": "core_enhancement",
        "childrenIds": [],
        "position": {
          "x": 0,
          "y": 0
        },
        "bonuses": [
          {
            "attribute": "Sinh Mệnh",
            "value": 10000
          }
        ]
      }
    }
  }
]
