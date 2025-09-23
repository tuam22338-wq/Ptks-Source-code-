


import { Type } from "@google/genai";
import type { ElementType } from 'react';
import type { InnateTalent, CharacterIdentity, GameState, Gender, NPC, PlayerNpcRelationship, ModTalent, ModTalentRank, TalentSystemConfig, Element, Currency, Relationship, NpcDensity, CharacterAttributes } from '../../types';
import { TALENT_RANK_NAMES, ALL_ATTRIBUTES, NARRATIVE_STYLES, SPIRITUAL_ROOT_CONFIG, PT_WORLD_MAP, REALM_SYSTEM, NPC_DENSITY_LEVELS, DEFAULT_ATTRIBUTE_DEFINITIONS } from "../../constants";
import { generateWithRetry, generateImagesWithRetry } from './gemini.core';
import * as db from '../dbService';
import { FaQuestionCircle } from "react-icons/fa";

export const generateDynamicNpcs = async (countOrDensity: NpcDensity | number, existingNames: string[] = []): Promise<NPC[]> => {
    const count = typeof countOrDensity === 'number' ? countOrDensity : NPC_DENSITY_LEVELS.find(d => d.id === countOrDensity)?.count ?? 15;
    if (count <= 0) return [];
    
    const availableLocations = PT_WORLD_MAP.map(l => l.id);
    const availableRealms = REALM_SYSTEM.map(r => r.name);
    const elements: Element[] = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ', 'Vô'];

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                gender: { type: Type.STRING, enum: ['Nam', 'Nữ'] },
                status: { type: Type.STRING, description: 'Mô tả trạng thái hiện tại của NPC (ví dụ: "Đang ngồi thiền trong hang động", "Đang mua bán ở chợ").' },
                description: { type: Type.STRING, description: 'Mô tả ngoại hình của NPC.' },
                origin: { type: Type.STRING, description: 'Mô tả xuất thân, nguồn gốc của NPC.' },
                personality: { type: Type.STRING, description: 'Tính cách của NPC (ví dụ: Trung Lập, Tà Ác, Hỗn Loạn, Chính Trực).' },
                motivation: { type: Type.STRING, description: "Động lực cốt lõi, sâu xa nhất của NPC. Ví dụ: 'Chứng tỏ bản thân', 'Tìm kiếm sự thật', 'Báo thù cho gia tộc'." },
                goals: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Danh sách 1-3 mục tiêu dài hạn mà NPC đang theo đuổi. Ví dụ: ['Trở thành đệ nhất luyện đan sư', 'Tìm ra kẻ đã hãm hại sư phụ']." },
                realmName: { type: Type.STRING, enum: availableRealms, description: 'Cảnh giới tu luyện của NPC, dựa trên sức mạnh của họ. "Phàm Nhân" cho người thường.' },
                element: { type: Type.STRING, enum: elements, description: 'Thuộc tính ngũ hành của NPC.' },
                initialEmotions: {
                    type: Type.OBJECT,
                    description: "Trạng thái cảm xúc ban đầu của NPC. Dựa vào tính cách để quyết định.",
                    properties: {
                        trust: { type: Type.NUMBER, description: "Độ tin tưởng ban đầu (0-100)." },
                        fear: { type: Type.NUMBER, description: "Mức độ sợ hãi/nhút nhát (0-100)." },
                        anger: { type: Type.NUMBER, description: "Mức độ nóng giận/thù địch (0-100)." }
                    },
                    required: ['trust', 'fear', 'anger']
                },
                ChinhDao: { type: Type.NUMBER, description: 'Điểm Chính Đạo (0-100).' },
                MaDao: { type: Type.NUMBER, description: 'Điểm Ma Đạo (0-100).' },
                LucLuong: { type: Type.NUMBER, description: 'Chỉ số Lực Lượng (sát thương vật lý).' },
                LinhLucSatThuong: { type: Type.NUMBER, description: 'Chỉ số Linh Lực Sát Thương (sát thương phép).' },
                CanCot: { type: Type.NUMBER, description: 'Chỉ số Căn Cốt (phòng ngự vật lý).' },
                NguyenThanKhang: { type: Type.NUMBER, description: 'Chỉ số Nguyên Thần Kháng (phòng ngự phép).' },
                SinhMenh: { type: Type.NUMBER, description: 'Chỉ số Sinh Mệnh chiến đấu.' },
                currency: {
                    type: Type.OBJECT,
                    description: 'Số tiền NPC sở hữu. Có thể để trống nếu là người thường.',
                    properties: {
                        linhThachHaPham: { type: Type.NUMBER, description: 'Số Linh thạch hạ phẩm.' },
                        bac: { type: Type.NUMBER, description: 'Số Bạc.' },
                    }
                },
                talents: {
                    type: Type.ARRAY,
                    description: "Một danh sách từ 0 đến 3 tiên tư độc đáo.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            rank: { type: Type.STRING, enum: TALENT_RANK_NAMES },
                            effect: { type: Type.STRING },
                             bonuses: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        attribute: { type: Type.STRING, enum: ALL_ATTRIBUTES },
                                        value: { type: Type.NUMBER }
                                    },
                                    required: ['attribute', 'value']
                                }
                            }
                        },
                        required: ['name', 'description', 'rank', 'effect'],
                    },
                },
                locationId: { type: Type.STRING, enum: availableLocations },
            },
            required: ['name', 'gender', 'status', 'description', 'origin', 'personality', 'motivation', 'goals', 'realmName', 'element', 'talents', 'locationId', 'ChinhDao', 'MaDao', 'LucLuong', 'LinhLucSatThuong', 'CanCot', 'NguyenThanKhang', 'SinhMenh', 'currency', 'initialEmotions'],
        },
    };
    
    const prompt = `Tạo ra ${count} NPC (Non-Player Characters) độc đáo cho thế giới game tu tiên Tam Thiên Thế Giới.
    Các NPC này có thể là tu sĩ, yêu ma, dân thường, hoặc các sinh vật kỳ dị.
    Mỗi NPC cần có thông tin đầy đủ theo schema. Hãy sáng tạo và làm cho thế giới trở nên sống động.
    **QUAN TRỌNG:** KHÔNG tạo ra các NPC có tên trong danh sách sau đây: ${existingNames.join(', ')}.
    
    **Yêu cầu chi tiết:**
    1.  **"Linh Hồn" NPC:** Dựa trên tính cách và xuất thân, hãy gán cho họ một trạng thái cảm xúc, động lực (motivation), và các mục tiêu (goals) hợp lý và có chiều sâu.
    2.  **Chỉ số:** Dựa vào tính cách và xuất thân, hãy gán cho họ các chỉ số Thiên Hướng (Chinh Đạo, Ma Đạo) và chỉ số chiến đấu mới.
    3.  **Cảnh Giới:** Dựa trên mô tả sức mạnh và vai vế của NPC, hãy chọn một cảnh giới (realmName) phù hợp. "Phàm Nhân" cho người thường.
    4.  **Ngũ Hành:** Gán một thuộc tính ngũ hành (element) cho mỗi NPC.
    5.  **Tiên Tư:** Tạo ra 1-2 tiên tư (talents) độc đáo và phù hợp cho mỗi NPC tu sĩ.
    6.  **Tài Sản:** Gán cho họ một lượng tiền tệ phù hợp.`;
    
    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.npcSimulationModel;
    const response = await generateWithRetry({
        model: settings?.npcSimulationModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
        }
    }, specificApiKey);

    const npcsData = JSON.parse(response.text);

    return npcsData.map((npcData: any): NPC => {
        const { name, gender, description, origin, personality, talents, realmName, currency, element, initialEmotions, motivation, goals, ...stats } = npcData;
        
        const targetRealm = REALM_SYSTEM.find(r => r.name === realmName) || REALM_SYSTEM[0];
        const targetStage = targetRealm.stages[Math.floor(Math.random() * targetRealm.stages.length)];

        const cultivation: NPC['cultivation'] = {
            currentRealmId: targetRealm.id,
            currentStageId: targetStage.id,
            spiritualQi: Math.floor(Math.random() * targetStage.qiRequired),
            hasConqueredInnerDemon: false,
        };
        
        const baseAttributes: CharacterAttributes = {};
        DEFAULT_ATTRIBUTE_DEFINITIONS.forEach(attrDef => {
            if(attrDef.baseValue !== undefined) {
                 baseAttributes[attrDef.id] = {
                    value: attrDef.baseValue,
                    ...(attrDef.type === 'VITAL' && { maxValue: attrDef.baseValue })
                };
            }
        });
        
        const updateAttr = (id: string, value: number) => {
             if (baseAttributes[id]) {
                baseAttributes[id].value = value;
                if(baseAttributes[id].maxValue !== undefined) {
                    baseAttributes[id].maxValue = value;
                }
            }
        };

        updateAttr('luc_luong', stats.LucLuong || 10);
        updateAttr('linh_luc_sat_thuong', stats.LinhLucSatThuong || 10);
        updateAttr('can_cot', stats.CanCot || 10);
        updateAttr('nguyen_than_khang', stats.NguyenThanKhang || 10);
        updateAttr('sinh_menh', stats.SinhMenh || 100);
        updateAttr('chinh_dao', stats.ChinhDao || 0);
        updateAttr('ma_dao', stats.MaDao || 0);

        const npcCurrencies: Partial<Currency> = {};
        if (currency?.linhThachHaPham > 0) {
            npcCurrencies['Linh thạch hạ phẩm'] = currency.linhThachHaPham;
        } else if (targetRealm.id !== 'pham_nhan') {
            npcCurrencies['Linh thạch hạ phẩm'] = Math.floor(Math.random() * 20);
        }

        if (currency?.bac > 0) {
            npcCurrencies['Bạc'] = currency.bac;
        } else {
            npcCurrencies['Bạc'] = 10 + Math.floor(Math.random() * 100);
        }

        return {
            ...stats,
            id: `dynamic-npc-${Math.random().toString(36).substring(2, 9)}`,
            identity: {
                name,
                gender,
                appearance: description,
                origin,
                personality,
                age: 20 + Math.floor(Math.random() * 200)
            },
            element: element || 'Vô',
            talents: talents || [],
            attributes: baseAttributes,
            emotions: initialEmotions || { trust: 50, fear: 10, anger: 10 },
            memory: { shortTerm: [], longTerm: [] },
            motivation: motivation || "Sống một cuộc sống bình yên.",
            goals: goals || [],
            currentPlan: null,
            cultivation,
            techniques: [],
            currencies: npcCurrencies,
            inventory: { items: [], weightCapacity: 15 },
            equipment: {},
            healthStatus: 'HEALTHY' as const,
            activeEffects: [],
            tuoiTho: 100 + Math.floor(Math.random() * 500)
        };
    });
};

export const generateRelationshipUpdate = async (
    npc1: NPC,
    npc2: NPC,
    currentRelationship: Relationship,
    gameState: GameState
): Promise<{ newRelationshipDescription: string; rumorText: string | null }> => {
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            newRelationshipDescription: { type: Type.STRING, description: `Một mô tả mới cho mối quan hệ giữa ${npc1.identity.name} và ${npc2.identity.name}. Mô tả này nên phản ánh sự thay đổi (hoặc không thay đổi) trong mối quan hệ của họ.` },
            rumorText: { type: Type.STRING, description: "Một tin đồn có thể được tạo ra từ sự tương tác này. Tin đồn phải ngắn gọn và thú vị. Nếu không có tin đồn, trả về một chuỗi rỗng." },
        },
        required: ['newRelationshipDescription', 'rumorText'],
    };

    const prompt = `Bạn là AI mô phỏng sự phát triển mối quan hệ giữa các NPC trong game tu tiên.
    Dựa trên thông tin được cung cấp, hãy quyết định xem mối quan hệ giữa hai NPC sau có thay đổi hay không và tạo ra một tin đồn liên quan (nếu có).

    **NPC 1:**
    - Tên: ${npc1.identity.name}
    - Tính cách: ${npc1.identity.personality}
    - Mục tiêu: ${npc1.goals.join('; ') || 'Không có'}

    **NPC 2:**
    - Tên: ${npc2.identity.name}
    - Tính cách: ${npc2.identity.personality}
    - Mục tiêu: ${npc2.goals.join('; ') || 'Không có'}

    **Mối quan hệ hiện tại (${npc1.identity.name} -> ${npc2.identity.name}):**
    - Loại: ${currentRelationship.type}
    - Mô tả: ${currentRelationship.description}

    **Bối cảnh thế giới:**
    - Năm: ${gameState.gameDate.year}, Đại kiếp Phong Thần đang diễn ra.
    - Sự kiện gần đây: ${gameState.storyLog.slice(-5).map(e => e.content).join('; ')}
    - Danh tiếng của người chơi: ${gameState.playerCharacter.danhVong.status}

    **Nhiệm vụ:**
    1.  **Phân tích:** Dựa trên tính cách, mục tiêu của hai NPC và bối cảnh thế giới, hãy suy nghĩ xem mối quan hệ của họ sẽ phát triển như thế nào. Ví dụ: hai người cùng phe có thể trở nên thân thiết hơn sau một chiến thắng, hai kẻ đối địch có thể mâu thuẫn sâu sắc hơn.
    2.  **Cập nhật mô tả:** Viết lại mô tả cho mối quan hệ của họ để phản ánh sự phát triển này. Kể cả khi không có thay đổi lớn, hãy làm mới câu chữ một chút.
    3.  **Tạo tin đồn (Tùy chọn):** Nếu tương tác của họ đủ đáng chú ý, hãy tạo ra một câu tin đồn mà người chơi có thể nghe được. Ví dụ: "Nghe nói Khương Tử Nha và Thân Công Báo lại tranh cãi kịch liệt về thiên số tại bờ sông Vị."

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.npcSimulationModel;
    const response = await generateWithRetry({
        model: settings?.npcSimulationModel || 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema },
    }, specificApiKey);

    const result = JSON.parse(response.text);
    return {
        ...result,
        rumorText: result.rumorText || null,
    };
};