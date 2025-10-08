import type { FullMod } from '../types';

/**
 * Tạo một bản tóm tắt bằng văn bản về bối cảnh lore của các mod đang hoạt động.
 * @param activeMods Danh sách các mod đang được kích hoạt.
 * @returns Một chuỗi văn bản tóm tắt bối cảnh mod.
 */
export function createModContextSummary(activeMods: FullMod[]): string {
    if (!activeMods || activeMods.length === 0) {
        return '';
    }
    
    const worldSummaries: string[] = [];

    for (const mod of activeMods) {
        if (!mod.content) continue;
        
        const modName = mod.modInfo.name;

        if (mod.content.worldData || mod.content.namedProgressionSystems || mod.content.sects) {
            let worldSummary = `Bối cảnh từ mod '[${modName}]' đang được áp dụng:\n`;

            if (mod.content.worldData && mod.content.worldData.length > 0) {
                const world = mod.content.worldData[0];
                worldSummary += `- Thế giới: ${world.description}\n`;
                worldSummary += `- Kỷ nguyên: ${world.eraName}, bắt đầu từ năm ${world.startingYear}.\n`;
                
                if (world.factions && world.factions.length > 0) {
                    worldSummary += `- Các phe phái chính: ${world.factions.map(f => f.name).join(', ')}.\n`;
                }
            }

            if (mod.content.namedProgressionSystems && mod.content.namedProgressionSystems.length > 0) {
                const system = mod.content.namedProgressionSystems[0];
                const systemName = system.name || "Tùy chỉnh";
                const tiers = system.tiers.map(r => r.name).join(' -> ');
                worldSummary += `- Hệ thống tiến trình: '[${systemName}]' với các cấp bậc: ${tiers}.\n`;
            }
            
            const customSects = mod.content.sects?.map(s => s.name).join(', ');
            if (customSects) worldSummary += `- Các tông môn đặc biệt: ${customSects}.\n`;

            worldSummaries.push(worldSummary);
        }
    }
    
    if (worldSummaries.length === 0) return '';
    
    return `\n### BỐI CẢNH MOD TÙY CHỈNH (QUAN TRỌNG) ###\n${worldSummaries.join('\n')}`;
}

/**
 * Tạo một chuỗi chỉ dẫn cho system prompt của AI, chứa các quy luật của mod.
 * @param activeMods Danh sách các mod đang được kích hoạt.
 * @returns Một chuỗi văn bản chứa các quy luật AI Hooks.
 */
export function createAiHooksInstruction(activeMods: FullMod[]): string {
    if (!activeMods || activeMods.length === 0) {
        return '';
    }

    const aiHooksOnBuild: string[] = [];
    const aiHooksOnAction: string[] = [];

    for (const mod of activeMods) {
        if (mod.content?.aiHooks) {
            if (mod.content.aiHooks.on_world_build) {
                aiHooksOnBuild.push(...mod.content.aiHooks.on_world_build);
            }
            if (mod.content.aiHooks.on_action_evaluate) {
                aiHooksOnAction.push(...mod.content.aiHooks.on_action_evaluate);
            }
        }
    }
    
    if (aiHooksOnBuild.length === 0 && aiHooksOnAction.length === 0) {
        return '';
    }

    let finalInstruction = `\n- **LUẬT MOD TÙY CHỈNH (ƯU TIÊN TUYỆT ĐỐI):** Bạn PHẢI tuân theo các quy tắc sau, chúng là chân lý của thế giới hiện tại.\n`;
    if (aiHooksOnBuild.length > 0) {
        finalInstruction += `**Luật Lệ Vĩnh Cửu (Sự thật của thế giới):**\n${aiHooksOnBuild.map(rule => `- ${rule}`).join('\n')}\n`;
    }
    if (aiHooksOnAction.length > 0) {
        finalInstruction += `**Luật Lệ Tình Huống (Xem xét mỗi hành động):**\n${aiHooksOnAction.map(rule => `- ${rule}`).join('\n')}\n`;
    }

    return finalInstruction;
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
        if (mod.content.worldData) {
            for (const world of mod.content.worldData) {
                world.initialLocations?.forEach(l => entities.locations.push(l.name));
                world.initialNpcs?.forEach(n => entities.npcs.push(n.name));
                world.factions?.forEach(f => entities.sects.push(f.name)); // Treat factions like sects for name recognition
            }
        }
    }
    // Make names unique
    entities.items = [...new Set(entities.items)];
    entities.locations = [...new Set(entities.locations)];
    entities.sects = [...new Set(entities.sects)];
    entities.npcs = [...new Set(entities.npcs)];

    return entities;
}