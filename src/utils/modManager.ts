import type { FullMod } from '../types';

/**
 * Tạo một bản tóm tắt bằng văn bản về nội dung của các mod đang hoạt động để "tiêm" vào context của AI.
 * @param activeMods Danh sách các mod đang được kích hoạt.
 * @returns Một chuỗi văn bản tóm tắt bối cảnh mod.
 */
export function createModContextSummary(activeMods: FullMod[]): string {
    const summaries: string[] = [];

    for (const mod of activeMods) {
        if (!mod.content) continue;

        // Bỏ qua các mod chỉ thêm vật phẩm hoặc nhân vật nhỏ lẻ để giữ context gọn gàng
        const isWorldMod = mod.content.worldData || mod.content.realmConfigs;
        if (!isWorldMod) continue;

        const modName = mod.modInfo.name;
        let modSummary = `Bối cảnh từ mod '[${modName}]' đang được áp dụng:\n`;

        if (mod.content.worldData && mod.content.worldData.length > 0) {
            const world = mod.content.worldData[0];
            modSummary += `- Thế giới: ${world.description}\n`;
            modSummary += `- Kỷ nguyên: ${world.eraName}, bắt đầu từ năm ${world.startingYear}.\n`;
            
            if (world.factions && world.factions.length > 0) {
                modSummary += `- Các phe phái chính: ${world.factions.map(f => f.name).join(', ')}.\n`;
            }
        }

        if (mod.content.realmConfigs && mod.content.realmConfigs.length > 0) {
            const systemName = mod.content.realmConfigs[0].name || "Tùy chỉnh";
            const realms = mod.content.realmConfigs.map(r => r.name).join(' -> ');
            modSummary += `- Hệ thống tu luyện: '[${systemName}]' với các cảnh giới: ${realms}.\n`;
        }
        
        const customSects = mod.content.sects?.map(s => s.name).join(', ');
        if (customSects) modSummary += `- Các tông môn đặc biệt: ${customSects}.\n`;
        
        summaries.push(modSummary);
    }

    if (summaries.length === 0) {
        return '';
    }

    return `\n### BỐI CẢNH MOD TÙY CHỈNH (QUAN TRỌNG NHẤT) ###\n${summaries.join('\n')}\n################################################\n`;
}

/**
 * Trích xuất danh sách tên các thực thể tùy chỉnh từ mod để hỗ trợ AI phân tích.
 * @param activeMods Danh sách các mod đang được kích hoạt.
 * @returns Một đối tượng chứa danh sách tên các vật phẩm, địa điểm, tông môn, và NPC.
 */
export function getCustomEntityNames(activeMods: FullMod[]): { items: string[], locations: string[], sects: string[], npcs: string[] } {
    const entities: { items: string[], locations: string[], sects: string[], npcs: string[] } = { items: [], locations: [], sects: [], npcs: [] };
    
    for (const mod of activeMods) {
        if (!mod.content) continue;
        mod.content.items?.forEach(i => entities.items.push(i.name));
        mod.content.locations?.forEach(l => entities.locations.push(l.name));
        mod.content.sects?.forEach(s => entities.sects.push(s.name));
        mod.content.npcs?.forEach(n => entities.npcs.push(n.name));
    }
    return entities;
}
