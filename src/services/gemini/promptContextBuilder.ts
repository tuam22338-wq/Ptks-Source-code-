import type { GameState } from '../../types';
import { DEFAULT_ATTRIBUTE_DEFINITIONS, NARRATIVE_STYLES, PERSONALITY_TRAITS } from '../../constants';
import { createModContextSummary } from '../../utils/modManager';

export const createFullGameStateContext = (gameState: GameState, instantMemoryReport?: string, thoughtBubble?: string, forAssistant: boolean = false): string => {
  const { playerCharacter, gameDate, discoveredLocations, activeNpcs, worldState, storySummary, storyLog, activeMods, majorEvents, encounteredNpcIds } = gameState;
  const currentLocation = discoveredLocations.find(l => l.id === playerCharacter.currentLocationId);
  const npcsHere = activeNpcs.filter(n => n.locationId === playerCharacter.currentLocationId);
  const neighbors = currentLocation?.neighbors.map(id => discoveredLocations.find(l => l.id === id)?.name).filter(Boolean) || [];

  const modContext = createModContextSummary(activeMods);

  const currencySummary = Object.entries(playerCharacter.currencies)
    // FIX: Add type check to ensure amount is a number before filtering.
    .filter(([, amount]) => typeof amount === 'number' && amount > 0)
    .map(([name, amount]) => `${name}: ${amount.toLocaleString()}`)
    .join(', ');

  const equipmentSummary = Object.entries(playerCharacter.equipment)
    .filter(([, item]) => item)
    // FIX: Add non-null assertion `!` as the filter ensures item is not null.
    .map(([slot, item]) => `${slot}: ${item!.name}`)
    .join(', ');
  
  const questSummary = playerCharacter.activeQuests.length > 0
    ? playerCharacter.activeQuests.map(q => `- ${q.title}: ${q.objectives.find(o => !o.isCompleted)?.description || 'Sắp hoàn thành'}`).join('\n')
    : 'Không có nhiệm vụ nào.';
  
  const reputationSummary = playerCharacter.reputation.map(r => `${r.factionName}: ${r.status} (${r.value})`).join('; ');
  
  const keyAttributes = DEFAULT_ATTRIBUTE_DEFINITIONS
    .filter(def => ['luc_luong', 'than_phap', 'ngo_tinh', 'co_duyen', 'can_cot', 'sinh_menh', 'linh_luc'].includes(def.id))
    .map(def => {
        const attr = playerCharacter.attributes[def.id];
        if (!attr) return null;
        return `${def.name}: ${attr.value}${attr.maxValue ? `/${attr.maxValue}` : ''}`;
    })
    .filter(Boolean)
    .join(', ');

  const activeEffectsSummary = playerCharacter.activeEffects.length > 0
    ? `Hiệu ứng: ${playerCharacter.activeEffects.map(e => e.name).join(', ')}.`
    : 'Không có hiệu ứng đặc biệt.';

  const hungerAttr = playerCharacter.attributes.hunger;
  const thirstAttr = playerCharacter.attributes.thirst;
  const hungerText = hungerAttr ? `No ${Math.floor(hungerAttr.value)}/${hungerAttr.maxValue}` : '';
  const thirstText = thirstAttr ? `Khát ${Math.floor(thirstAttr.value)}/${thirstAttr.maxValue}` : '';
  const vitalsSummary = `Tình trạng Sinh Tồn: ${[hungerText, thirstText].filter(Boolean).join(', ')}. ${activeEffectsSummary}`;
  
  const npcsHereWithMindState = npcsHere.length > 0
    ? npcsHere.map(n => {
        const emotions = `[Tâm trạng: Tin tưởng(${n.emotions.trust}), Sợ hãi(${n.emotions.fear}), Tức giận(${n.emotions.anger})]`;
        const memories = n.memory.shortTerm.length > 0 ? ` [Ký ức gần đây: ${n.memory.shortTerm.join('; ')}]` : '';
        const willpower = ` [Động lực: ${n.motivation}] [Mục tiêu: ${n.goals.join(', ')}] [Kế hoạch: ${n.currentPlan ? n.currentPlan[0] : 'Chưa có'}]`;
        return `${n.identity.name} (${n.status}) ${emotions}${memories}${willpower}`;
      }).join('\n')
    : 'Không có ai.';

  let assistantContext = '';
  if (forAssistant) {
      const encounteredNpcsDetails = activeNpcs.filter(npc => encounteredNpcIds.includes(npc.id)).map(npc => `- ${npc.identity.name}: ${npc.identity.origin}. ${npc.status}`).join('\n');
      assistantContext = `
**4. Bách Khoa Toàn Thư (Thông tin đã biết)**
- **Nhân vật đã gặp:**
${encounteredNpcsDetails || 'Chưa gặp ai.'}
- **Địa danh đã khám phá:**
${discoveredLocations.map(l => `- ${l.name}: ${l.description}`).join('\n')}
- **Thiên Mệnh Niên Biểu (Sự kiện lịch sử):**
${majorEvents.map(e => `- Năm ${e.year}, ${e.title}: ${e.summary}`).join('\n')}
      `;
  }

  const memoryReportContext = instantMemoryReport
    ? `
**Ký Ức Liên Quan Gần Đây (TRỌNG TÂM):**
${instantMemoryReport}`
    : '';
    
  const thoughtBubbleContext = thoughtBubble
    ? `
**SUY NGHĨ NỘI TÂM CỦA NPC (ƯU TIÊN TUYỆT ĐỐI):**
NPC mà người chơi đang tương tác có suy nghĩ nội tâm sau: "${thoughtBubble}"
`
    : '';

  const context = `
${modContext}### TOÀN BỘ BỐI CẢNH GAME ###
Đây là toàn bộ thông tin về trạng thái game hiện tại. Hãy sử dụng thông tin này để đảm bảo tính nhất quán và logic cho câu chuyện.

**1. Nhân Vật Chính: ${playerCharacter.identity.name}**
- **Tu Luyện:** Cảnh giới ${gameState.realmSystem.find(r => r.id === playerCharacter.cultivation.currentRealmId)?.name}, Linh khí ${playerCharacter.cultivation.spiritualQi.toLocaleString()}.
- **Tài Sản (QUAN TRỌNG):** ${currencySummary || 'Không một xu dính túi.'}
- **Linh Căn:** ${playerCharacter.spiritualRoot?.name || 'Chưa xác định'}. (${playerCharacter.spiritualRoot?.description || 'Là một phàm nhân bình thường.'})
- **Công Pháp Chủ Đạo:** ${playerCharacter.mainCultivationTechniqueInfo ? `${playerCharacter.mainCultivationTechniqueInfo.name} - ${playerCharacter.mainCultivationTechniqueInfo.description}` : 'Chưa có'}.
- **Thần Thông/Kỹ Năng:** ${playerCharacter.techniques.map(t => t.name).join(', ') || 'Chưa có'}.
- **Thân Phận:** ${playerCharacter.identity.origin}, Tính cách: **${playerCharacter.identity.personality}**.
- **Trang Bị:** ${equipmentSummary || 'Không có'}.
- **Chỉ Số Chính:** ${keyAttributes}.
- **${vitalsSummary}**
- **Danh Vọng & Quan Hệ:** Danh vọng ${playerCharacter.danhVong.status}. Các phe phái: ${reputationSummary}.
- **Thông tin Tông Môn:** ${playerCharacter.sect ? `Là đệ tử của ${playerCharacter.sect.sectId}, chức vị ${playerCharacter.sect.rank}.` : 'Hiện là tán tu.'}
- **Vật phẩm trong túi đồ:** ${playerCharacter.inventory.items.map(i => `${i.name} (x${i.quantity})`).join(', ') || 'Trống rỗng.'}

**2. Thế Giới Hiện Tại**
- **Thời Gian:** ${gameDate.era} năm ${gameDate.year}, ${gameDate.season} ngày ${gameDate.day}, giờ ${gameDate.shichen}.
- **Vị Trí Hiện Tại (CỰC KỲ QUAN TRỌNG):** Bạn đang ở '${currentLocation?.name}'. Mô tả: ${currentLocation?.description}.
- **Các lối đi có thể đến:** ${neighbors.join(', ') || 'Không có'}.
- **NPCs Tại Đây:** 
${npcsHereWithMindState}
- **Sự Kiện Thế Giới Đang Diễn Ra:** ${worldState.dynamicEvents?.map(e => e.title).join(', ') || 'Bình yên.'}

**3. Nhiệm Vụ & Cốt Truyện**
- **Nhiệm Vụ Đang Làm:**
${questSummary}
- **Tóm Tắt Cốt Truyện (Ký ức dài hạn):**
${storySummary || 'Hành trình vừa bắt đầu.'}
${memoryReportContext}
${thoughtBubbleContext}
- **Nhật Ký Gần Đây (Ký ức ngắn hạn):**
${storyLog.slice(-5).map(entry => `[${entry.type}] ${entry.content}`).join('\n')}
${assistantContext}
#############################
  `;
  return context;
};