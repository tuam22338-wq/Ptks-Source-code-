import type { GameState, GameSettings } from '../../types';
import { DEFAULT_ATTRIBUTE_DEFINITIONS, NARRATIVE_STYLES, PERSONALITY_TRAITS } from '../../constants';
import { createModContextSummary } from '../../utils/modManager';

// FIX: Add 'settings' parameter to the function signature and remove the incorrect access from gameState.
export const createFullGameStateContext = (gameState: GameState, settings: GameSettings, instantMemoryReport?: string, thoughtBubble?: string, forAssistant: boolean = false): string => {
  const { playerCharacter, gameDate, discoveredLocations, activeNpcs, worldState, storySummary, storyLog, activeMods, majorEvents, encounteredNpcIds, combatState, attributeSystem, realmSystem } = gameState;
  const playerAiHooks = gameState.playerCharacter.playerAiHooks;
  let playerRulesContext = '';
  if (playerAiHooks) {
      playerRulesContext += '\n- **QUY LUẬT TÙY CHỈNH CỦA NGƯỜI CHƠI (ƯU TIÊN TUYỆT ĐỐI):**\n';
      if (playerAiHooks.on_world_build) {
           playerRulesContext += `**Luật Lệ Vĩnh Cửu (Sự thật của thế giới):**\n${playerAiHooks.on_world_build.split('\n').filter(Boolean).map(r => `- ${r}`).join('\n')}\n`;
      }
      if (playerAiHooks.on_action_evaluate) {
           playerRulesContext += `**Luật Lệ Tình Huống (Xem xét mỗi hành động):**\n${playerAiHooks.on_action_evaluate.split('\n').filter(Boolean).map(r => `- ${r}`).join('\n')}\n`;
      }
      if (playerAiHooks.on_narration) {
           playerRulesContext += `**Luật Lệ Tường Thuật (Văn phong & Giọng điệu):**\n${playerAiHooks.on_narration.split('\n').filter(Boolean).map(r => `- ${r}`).join('\n')}\n`;
      }
      if (playerAiHooks.on_realm_rules) {
           playerRulesContext += `**Luật Lệ Cảnh Giới (Hệ thống tu luyện):**\n${playerAiHooks.on_realm_rules.split('\n').filter(Boolean).map(r => `- ${r}`).join('\n')}\n`;
      }
  }

  const currentLocation = discoveredLocations.find(l => l.id === playerCharacter.currentLocationId);
  const npcsHere = activeNpcs.filter(npc => npc.locationId === playerCharacter.currentLocationId);

  const currencySummary = Object.entries(playerCharacter.currencies)
    .filter(([, amount]) => typeof amount === 'number' && amount > 0)
    .map(([name, amount]) => `${name}: ${amount.toLocaleString()}`)
    .join(', ');

  const equipmentSummary = Object.entries(playerCharacter.equipment)
    .filter(([, item]) => item)
    .map(([slot, item]) => `${slot}: ${item!.name}`)
    .join(', ');
  
  const questSummary = playerCharacter.activeQuests.length > 0
    ? playerCharacter.activeQuests.map(q => `- ${q.title}: ${q.objectives.find(o => !o.isCompleted)?.description || 'Sắp hoàn thành'}`).join('\n')
    : 'Không có nhiệm vụ nào.';
  
  const reputationSummary = playerCharacter.reputation.map(r => `${r.factionName}: ${r.status} (${r.value})`).join('; ');
  
  // DYNAMIC ATTRIBUTE SUMMARY
  let attributeSummary = '';
  const sortedGroups = [...attributeSystem.groups].sort((a,b) => a.order - b.order);

  for (const group of sortedGroups) {
      const attrsInGroup = attributeSystem.definitions.filter(def => def.group === group.id && playerCharacter.attributes[def.id]);
      if (attrsInGroup.length === 0) continue;
      
      let groupContent = '';
      const attributeLines = attrsInGroup.map(def => {
          const attr = playerCharacter.attributes[def.id];
          if (!attr) return null;
          
          if (def.id === 'canh_gioi') return null; // Handled separately

          return `  - ${def.name}: ${Math.floor(attr.value)}${attr.maxValue !== undefined ? `/${Math.floor(attr.maxValue)}` : ''}`;
      }).filter(Boolean);

      if (attributeLines.length > 0) {
          groupContent += `\n- **${group.name}:**\n${attributeLines.join('\n')}`;
      }
      attributeSummary += groupContent;
  }
  
  const activeEffectsSummary = playerCharacter.activeEffects.length > 0
    ? `Hiệu ứng: ${playerCharacter.activeEffects.map(e => e.name).join(', ')}.`
    : 'Không có hiệu ứng đặc biệt.';
  
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

  let dynamicStyleInstruction = '';
  if (combatState) {
      dynamicStyleInstruction = `**LUẬT VĂN PHONG (ĐANG CHIẾN ĐẤU):** Hãy dùng câu ngắn, động từ mạnh. Tập trung vào hành động và tác động. Tăng tốc độ tường thuật.`;
  } else if (gameState.dialogueWithNpcId) {
      dynamicStyleInstruction = `**LUẬT VĂN PHONG (ĐANG ĐỐI THOẠI):** Tập trung vào biểu cảm, ngôn ngữ cơ thể và ẩn ý trong lời nói.`;
  }
  
  const narrativeStyle = NARRATIVE_STYLES.find(s => s.value === settings?.narrativeStyle)?.label || 'Cổ điển Tiên hiệp';
  const neighbors = currentLocation?.neighbors.map(id => discoveredLocations.find(l => l.id === id)?.name).filter(Boolean) || [];
  const modContext = createModContextSummary(activeMods);
  
  const attributeDefinitionsContext = `
**3. Hệ Thống Thuộc Tính Của Thế Giới Này**
Đây là các định nghĩa về chỉ số và thuộc tính tồn tại trong thế giới này. Hãy sử dụng chúng để hiểu ý nghĩa của từng chỉ số.
${attributeSystem.definitions.map(def => `- **${def.name}:** ${def.description}`).join('\n')}
`;
  
  let cultivationContext = '';
  if (realmSystem && realmSystem.length > 0) {
      const currentRealm = realmSystem.find(r => r.id === playerCharacter.cultivation.currentRealmId);
      const currentStage = currentRealm?.stages.find(s => s.id === playerCharacter.cultivation.currentStageId);
      
      const currentRealmStagesInfo = currentRealm 
        ? `Các tiểu cảnh giới của ${currentRealm.name} là: ${currentRealm.stages.map(s => s.name).join(', ')}.`
        : '';

      cultivationContext = `
- **Tu Luyện (CỰC KỲ QUAN TRỌNG):**
  - Cảnh giới hiện tại: ${currentRealm?.name || 'Không rõ'} - ${currentStage?.name || 'Không rõ'}. ${currentRealmStagesInfo}
  - Linh khí: ${playerCharacter.cultivation.spiritualQi.toLocaleString()}.
- **Toàn bộ hệ thống cảnh giới (để tham khảo):** ${realmSystem.map(r => r.name).join(' -> ')}.
`;
  } else {
      cultivationContext = `- **Hệ thống sức mạnh:** Thế giới này không sử dụng hệ thống tu luyện cảnh giới truyền thống.`;
  }

  const context = `
${modContext}${playerRulesContext}### TOÀN BỘ BỐI CẢNH GAME ###
Đây là toàn bộ thông tin về trạng thái game hiện tại. Hãy sử dụng thông tin này để đảm bảo tính nhất quán và logic cho câu chuyện.
${dynamicStyleInstruction}

**1. Nhân Vật Chính: ${playerCharacter.identity.name}**
${cultivationContext}
- **Tài Sản (QUAN TRỌNG):** ${currencySummary || 'Không một xu dính túi.'}
- **Nguồn Gốc Sức Mạnh:** ${playerCharacter.spiritualRoot?.name || 'Chưa xác định'}. (${playerCharacter.spiritualRoot?.description || 'Là một phàm nhân bình thường.'})
- **Thần Thông/Kỹ Năng:** ${playerCharacter.techniques.map(t => t.name).join(', ') || 'Chưa có'}.
- **Thân Phận:** ${playerCharacter.identity.origin}, Tính cách: **${playerCharacter.identity.personality}**.
- **Trang Bị:** ${equipmentSummary || 'Không có'}.
- **Chi Tiết Trạng Thái:**${attributeSummary}
- **Hiệu ứng:** ${activeEffectsSummary}
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

${attributeDefinitionsContext}

**4. Nhiệm Vụ & Cốt Truyện**
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