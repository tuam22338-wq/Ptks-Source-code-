import type { GameState, Rumor, NPC, DynamicWorldEvent, Currency } from '../types';
import { generateWithRetry } from './geminiService';
import * as db from './dbService';
import { Type } from '@google/genai';
import { WORLD_MAP } from '../constants';
import { generateFactionEvent } from './gemini/gameplay.service';

export const simulateWorldTurn = async (
    gameState: GameState
): Promise<{ newState: GameState; rumors: Rumor[] }> => {
    let { activeNpcs, playerCharacter, worldState, majorEvents, gameDate, playerStall } = gameState;
    const { dynamicEvents } = worldState;
    const newRumors: Rumor[] = [];

    // Chỉ mô phỏng một vài NPC mỗi lượt để tiết kiệm API calls và thời gian
    const npcsToSimulate = activeNpcs
        .filter(npc => npc.locationId !== playerCharacter.currentLocationId)
        .sort(() => 0.5 - Math.random()) // Shuffle
        .slice(0, 2); // Simulate 2 random NPCs per turn

    const updatedNpcData: { id: string, locationId: string, trangThaiHanhDong: string }[] = [];
    
    const activeEventsInfo = (dynamicEvents || [])
        .map(e => `- ${e.title} (Ảnh hưởng: ${e.affectedFactions.join(', ')} tại ${e.affectedLocationIds.join(', ')})`)
        .join('\n');

    // Make a mutable copy of gameState for this turn's simulation
    let currentTurnState = { ...gameState };

    for (const npc of npcsToSimulate) {
        try {
            // NPC buying from player stall logic
            if (playerStall && npc.locationId === playerStall.locationId && Math.random() < 0.15) {
                const availableItems = playerStall.items.filter(item => item.stock === 'infinite' || item.stock > 0);
                if (availableItems.length > 0) {
                    const itemToBuy = availableItems[Math.floor(Math.random() * availableItems.length)];
                    const price = itemToBuy.price;
                    const npcCurrency = npc.currencies[price.currencyName] || 0;

                    if (npcCurrency >= price.amount) {
                        // Update player stall
                        const newStallItems = playerStall.items.map(item => {
                            if (item.name === itemToBuy.name && typeof item.stock === 'number') {
                                return { ...item, stock: item.stock - 1 };
                            }
                            return item;
                        }).filter(item => item.stock !== 0);

                        const newEarnings: Partial<Currency> = { ...playerStall.earnings };
                        newEarnings[price.currencyName] = (newEarnings[price.currencyName] || 0) + price.amount;
                        
                        currentTurnState.playerStall = { ...playerStall, items: newStallItems, earnings: newEarnings };

                        // Update NPC currency
                        npc.currencies[price.currencyName] = npcCurrency - price.amount;
                        
                        // Create rumor
                        const rumor: Rumor = {
                            id: `rumor-${Date.now()}-${Math.random()}`,
                            locationId: playerStall.locationId,
                            text: `Có người thấy ${npc.identity.name} đã mua [${itemToBuy.name}] từ sạp hàng của ${playerCharacter.identity.name}.`
                        };
                        newRumors.push(rumor);
                        // Skip other actions for this NPC this turn
                        continue;
                    }
                }
            }


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
- **NPC:** ${npc.identity.name} (${npc.faction || 'Tán tu'})
- **Tính cách:** ${npc.identity.personality}
- **Mục tiêu:** ${npc.mucTieu || 'Không có mục tiêu cụ thể'}
- **Vị trí hiện tại:** ${currentLocation?.name} (ID: ${npc.locationId})
- **Các địa điểm lân cận:** ${neighborLocations.map(l => `${l.name} (ID: ${l.id})`).join(', ') || 'Không có'}
- **Bối cảnh thế giới:** Năm ${gameDate.year}, ${majorEvents.find(e => e.year <= gameDate.year)?.title || 'Thế giới đang yên bình'}.
- **Sự kiện đang diễn ra:**
${activeEventsInfo || "Không có sự kiện đặc biệt nào."}
- **Thông tin về Người Chơi (Kẻ Thay Đổi Vận Mệnh):**
  - Tên: ${playerCharacter.identity.name}
  - Vị trí gần đây: ${WORLD_MAP.find(l => l.id === playerCharacter.currentLocationId)?.name || 'Không rõ'}
  - Danh vọng với phe phái của NPC (${npc.faction || 'Tán tu'}): ${playerCharacter.reputation.find(r => r.factionName === npc.faction)?.status || 'Trung Lập'}.
  - Tin đồn về người chơi: ${playerCharacter.danhVong.status}.

Nhiệm vụ: Dựa trên TOÀN BỘ thông tin trên (đặc biệt là các sự kiện đang diễn ra và danh tiếng của người chơi), hãy quyết định một hành động hợp lý cho NPC này. Nếu phe phái hoặc vị trí của họ bị ảnh hưởng bởi một sự kiện, họ nên có phản ứng phù hợp (ví dụ: chạy trốn, tham gia, điều tra). Họ cũng có thể phản ứng với danh tiếng của người chơi. Trả về JSON theo schema.`;

            const settings = await db.getSettings();
            const response = await generateWithRetry({
                model: settings?.npcSimulationModel || 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: "application/json", responseSchema },
            });

            const data = JSON.parse(response.text);

            if (data) {
                 updatedNpcData.push({
                    id: npc.id,
                    locationId: data.newLocationId,
                    trangThaiHanhDong: data.action,
                });

                if (data.rumorText) {
                    const rumor: Rumor = {
                        id: `rumor-${Date.now()}-${Math.random()}`,
                        locationId: Math.random() < 0.5 ? npc.locationId : data.newLocationId,
                        text: data.rumorText
                    };
                    newRumors.push(rumor);
                }
            }
        } catch (error) {
            console.error(`Failed to simulate action for NPC ${npc.identity.name}:`, error);
            // Continue to the next NPC even if one fails
        }
    }

    // Cập nhật lại danh sách NPC trong gameState
    const finalNpcs = activeNpcs.map(originalNpc => {
        const updatedData = updatedNpcData.find(u => u.id === originalNpc.id);
        if (updatedData) {
            return {
                ...originalNpc,
                locationId: updatedData.locationId,
                trangThaiHanhDong: updatedData.trangThaiHanhDong,
                status: updatedData.trangThaiHanhDong, // Also update status for consistency
            };
        }
        return originalNpc;
    });

    const newWorldState = {
        ...currentTurnState.worldState,
        rumors: [...currentTurnState.worldState.rumors, ...newRumors.filter(nr => !currentTurnState.worldState.rumors.some(r => r.text === nr.text))],
    };

    return {
        newState: {
            ...currentTurnState,
            activeNpcs: finalNpcs,
            worldState: newWorldState,
        },
        rumors: newRumors,
    };
};

export const simulateFactionTurn = async (
    gameState: GameState
): Promise<{ newEvent: DynamicWorldEvent | null, narrative: string | null }> => {
    try {
        const eventData = await generateFactionEvent(gameState);
        if (!eventData) {
            return { newEvent: null, narrative: null };
        }
        
        const totalDays = (gameState.gameDate.year * 4 * 30) + (['Xuân', 'Hạ', 'Thu', 'Đông'].indexOf(gameState.gameDate.season) * 30) + gameState.gameDate.day;

        const newEvent: DynamicWorldEvent = {
            ...eventData,
            id: `world-event-${Date.now()}`,
            turnStart: totalDays,
        };

        const narrative = `[Thiên Hạ Đại Sự] ${eventData.title}: ${eventData.description}`;
        return { newEvent, narrative };

    } catch (error) {
        console.error("Failed to simulate faction turn:", error);
        return { newEvent: null, narrative: "Thiên cơ hỗn loạn, không thể suy diễn được đại sự trong thiên hạ." };
    }
};