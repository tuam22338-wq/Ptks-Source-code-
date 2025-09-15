import type { GameState, NPC, Location } from '../types';
import { WORLD_MAP } from '../constants';

export const simulateNpcActions = (gameState: GameState): GameState => {
    const { activeNpcs } = gameState;
    const locationMap = new Map<string, Location>(WORLD_MAP.map(l => [l.id, l]));

    const updatedNpcs = activeNpcs.map(npc => {
        // Chỉ những NPC không có mối quan hệ trực tiếp với người chơi mới di chuyển ngẫu nhiên
        const isRelatedToPlayer = gameState.playerCharacter.relationships.some(rel => rel.npcId === npc.id);
        
        if (!isRelatedToPlayer && Math.random() < 0.1) { // 10% cơ hội hành động mỗi tick thời gian
            const currentLocation = locationMap.get(npc.locationId);
            if (currentLocation && currentLocation.neighbors.length > 0) {
                const destinationId = currentLocation.neighbors[Math.floor(Math.random() * currentLocation.neighbors.length)];
                const destinationLocation = locationMap.get(destinationId);
                if (destinationLocation) {
                    return {
                        ...npc,
                        locationId: destinationId,
                        status: `Đang di chuyển đến ${destinationLocation.name}.`,
                    };
                }
            }
        }
        // TODO: Thêm logic phức tạp hơn dựa trên tính cách, mục tiêu, v.v.
        return npc;
    });

    return { ...gameState, activeNpcs: updatedNpcs };
};