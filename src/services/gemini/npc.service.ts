import { Type } from "@google/genai";
import type { ElementType } from 'react';
import type { NPC, NpcDensity, AttributeGroup, InventoryItem, GameState, Rumor, Element, Currency } from '../../types';
import { TALENT_RANK_NAMES, ALL_ATTRIBUTES, WORLD_MAP, REALM_SYSTEM, NPC_DENSITY_LEVELS, ATTRIBUTES_CONFIG, CURRENCY_ITEMS } from "../../constants";
import { generateWithRetry } from './gemini.core';
import * as db from '../dbService';
import { FaQuestionCircle } from "react-icons/fa";

export const generateDynamicNpcs = async (countOrDensity: NpcDensity | number, existingNames: string[] = []): Promise<NPC[]> => {
    const count = typeof countOrDensity === 'number' ? countOrDensity : NPC_DENSITY_LEVELS.find(d => d.id === countOrDensity)?.count ?? 15;
    if (count <= 0) return [];
    
    const availableLocations = WORLD_MAP.map(l => l.id);
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
                realmName: { type: Type.STRING, enum: availableRealms, description: 'Cảnh giới tu luyện của NPC, dựa trên sức mạnh của họ. "Phàm Nhân" cho người thường.' },
                element: { type: Type.STRING, enum: elements, description: 'Thuộc tính ngũ hành của NPC.' },
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
            required: ['name', 'gender', 'status', 'description', 'origin', 'personality', 'realmName', 'element', 'talents', 'locationId', 'ChinhDao', 'MaDao', 'LucLuong', 'LinhLucSatThuong', 'CanCot', 'NguyenThanKhang', 'SinhMenh', 'currency'],
        },
    };
    
    const prompt = `Tạo ra ${count} NPC (Non-Player Characters) độc đáo cho thế giới game tu tiên Tam Thiên Thế Giới.
    Các NPC này có thể là tu sĩ, yêu ma, dân thường, hoặc các sinh vật kỳ dị.
    Mỗi NPC cần có thông tin đầy đủ theo schema. Hãy sáng tạo và làm cho thế giới trở nên sống động.
    **QUAN TRỌNG:** KHÔNG tạo ra các NPC có tên trong danh sách sau đây: ${existingNames.join(', ')}.
    
    **Yêu cầu chi tiết:**
    1.  **Chỉ số:** Dựa vào tính cách và xuất thân, hãy gán cho họ các chỉ số Thiên Hướng (Chinh Đạo, Ma Đạo) và chỉ số chiến đấu mới.
    2.  **Cảnh Giới:** Dựa trên mô tả sức mạnh và vai vế của NPC, hãy chọn một cảnh giới (realmName) phù hợp.
    3.  **Ngũ Hành:** Gán một thuộc tính ngũ hành (element) cho mỗi NPC.
    4.  **Tiên Tư:** Tạo ra 1-2 tiên tư (talents) độc đáo và phù hợp cho mỗi NPC tu sĩ.
    5.  **Tài Sản:** Gán cho họ một lượng tiền tệ phù hợp.`;
    
    const settings = await db.getSettings();
    const response = await generateWithRetry({
        model: settings?.npcSimulationModel || 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
        }
    });

    const npcsData = JSON.parse(response.text);
    
    const attrConfigMap = new Map<string, { description: string, icon: ElementType }>();
    ATTRIBUTES_CONFIG.forEach(group => {
        group.attributes.forEach(attr => {
            attrConfigMap.set(attr.name, { description: attr.description, icon: attr.icon || FaQuestionCircle });
        });
    });

    return npcsData.map((npcData: any): NPC => {
        const { name, gender, description, origin, personality, talents, realmName, currency, element, ...stats } = npcData;
        
        const targetRealm = REALM_SYSTEM.find(r => r.name === realmName) || REALM_SYSTEM[0];
        const targetStage = targetRealm.stages[Math.floor(Math.random() * targetRealm.stages.length)];

        const cultivation: NPC['cultivation'] = {
            currentRealmId: targetRealm.id,
            currentStageId: targetStage.id,
            spiritualQi: Math.floor(Math.random() * targetStage.qiRequired),
            hasConqueredInnerDemon: false,
        };

        const baseAttributes: AttributeGroup[] = ATTRIBUTES_CONFIG.map(group => ({
            ...group,
            attributes: group.attributes.map(attr => ({ ...attr }))
        }));
        
        const updateAttr = (name: string, value: number | string) => {
            for (const group of baseAttributes) {
                const attr = group.attributes.find(a => a.name === name);
                if (attr) {
                    attr.value = value;
                    if(attr.maxValue !== undefined) attr.maxValue = value as number;
                    return;
                }
            }
        };

        updateAttr('Lực Lượng', stats.LucLuong || 10);
        updateAttr('Linh Lực Sát Thương', stats.LinhLucSatThuong || 10);
        updateAttr('Căn Cốt', stats.CanCot || 10);
        updateAttr('Nguyên Thần Kháng', stats.NguyenThanKhang || 10);
        updateAttr('Sinh Mệnh', stats.SinhMenh || 100);
        updateAttr('Chính Đạo', stats.ChinhDao || 0);
        updateAttr('Ma Đạo', stats.MaDao || 0);

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

export const simulateNpcAction = async (npc: NPC, gameState: GameState): Promise<{ updatedNpc: NPC, rumor: Rumor | null }> => {
    const currentLocation = WORLD_MAP.find(l => l.id === npc.locationId);
    const neighborLocations = (currentLocation?.neighbors || [])
        .map(id => WORLD_MAP.find(l => l.id === id))
        .filter(Boolean) as { id: string, name: string }[];

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            action: { type: Type.STRING, description: "Hành động ngắn gọn mà NPC thực hiện. Ví dụ: 'Đi đến quán trà nghe ngóng tin tức', 'Bế quan luyện một môn thần thông mới'." },
            newLocationId: { type: Type.STRING, description: `ID của địa điểm mới. Nếu NPC di chuyển, chọn một ID từ danh sách hàng xóm. Nếu không, trả về ID hiện tại ('${npc.locationId}').`, enum: [npc.locationId, ...neighborLocations.map(l => l.id)] },
            rumorText: { type: Type.STRING, description: "Một tin đồn có thể được tạo ra từ hành động này. Nếu không có tin đồn, trả về một chuỗi rỗng." },
        },
        required: ['action', 'newLocationId', 'rumorText'],
    };

    const prompt = `Bạn là AI mô phỏng hành vi cho một NPC trong game tu tiên.
    - **NPC:** ${npc.identity.name}
    - **Tính cách:** ${npc.identity.personality}
    - **Trạng thái hiện tại:** ${npc.status}
    - **Vị trí hiện tại:** ${currentLocation?.name} (ID: ${npc.locationId})
    - **Các địa điểm lân cận:** ${neighborLocations.map(l => `${l.name} (ID: ${l.id})`).join(', ') || 'Không có'}
    - **Bối cảnh thế giới:** Năm ${gameState.gameDate.year}, ${gameState.majorEvents.find(e => e.year <= gameState.gameDate.year)?.title || 'Thế giới đang yên bình'}.

    Nhiệm vụ: Dựa trên thông tin trên, hãy quyết định một hành động hợp lý cho NPC này trong ngày hôm nay. Họ có thể ở lại hoặc di chuyển đến một địa điểm lân cận. Sau đó, tạo ra một tin đồn liên quan (nếu có).`;

    const settings = await db.getSettings();
    const response = await generateWithRetry({
        model: settings?.npcSimulationModel || 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema },
    });

    const data = JSON.parse(response.text);
    
    const updatedNpc: NPC = {
        ...npc,
        status: data.action,
        locationId: data.newLocationId,
    };

    const rumor: Rumor | null = data.rumorText 
        ? {
            id: `rumor-${Date.now()}-${Math.random()}`,
            locationId: updatedNpc.locationId, // Rumor is heard where the NPC ends up
            text: data.rumorText,
          }
        : null;

    return { updatedNpc, rumor };
};