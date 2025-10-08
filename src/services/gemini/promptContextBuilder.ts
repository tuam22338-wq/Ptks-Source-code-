import type { GameState, GameSettings } from '../../types';
import { DEFAULT_ATTRIBUTE_DEFINITIONS, NARRATIVE_STYLES, PERSONALITY_TRAITS } from '../../constants';
import { createModContextSummary } from '../../utils/modManager';

export const createFullGameStateContext = (gameState: GameState, settings: GameSettings, instantMemoryReport?: string, thoughtBubble?: string, forAssistant: boolean = false): string => {
  const { playerCharacter, gameDate, discoveredLocations, activeNpcs, worldState, storySummary, storyLog, activeMods, majorEvents, encounteredNpcIds, combatState, attributeSystem, progressionSystem, progressionSystemInfo, dialogueWithNpcId, dialogueHistory } = gameState;
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
        const relationship = playerCharacter.relationships.find(r => r.npcId === n.id);
        const relationshipText = relationship ? ` (Quan hệ: ${relationship.type} - ${relationship.status})` : '';
        const emotions = `[Tâm trạng: Tin tưởng(${n.emotions.trust}), Sợ hãi(${n.emotions.fear}), Tức giận(${n.emotions.anger})]`;
        const memories = n.memory.shortTerm.length > 0 ? ` [Ký ức gần đây: ${n.memory.shortTerm.join('; ')}]` : '';
        const willpower = ` [Động lực: ${n.motivation}, Mục tiêu: ${n.goals.join(', ')}]`;
        return `- ${n.identity.name} (${n.identity.gender}, ${n.identity.age} tuổi, ${n.status})${relationshipText}. ${emotions}${memories}${willpower}`;
      }).join('\n')
    : 'Không có ai đáng chú ý ở đây.';
  
    const isProgressionSystemActive = progressionSystem && (progressionSystem.length > 1 || (progressionSystem.length === 1 && progressionSystem[0].id !== 'pham_nhan'));
    
    const currentTier = isProgressionSystemActive ? progressionSystem.find(r => r.id === playerCharacter.progression.currentTierId) : null;
    const currentSubTier = currentTier?.subTiers.find(s => s.id === playerCharacter.progression.currentSubTierId);

    let resourceToNextSubTier = Infinity;
    let nextProgressionInfo: string | null = null; 

    if (isProgressionSystemActive && currentTier && currentSubTier) {
        const currentSubTierIndex = currentTier.subTiers.findIndex(s => s.id === currentSubTier.id);
        if (currentSubTierIndex !== -1 && currentSubTierIndex < currentTier.subTiers.length - 1) {
            const nextSubTier = currentTier.subTiers[currentSubTierIndex + 1];
            resourceToNextSubTier = nextSubTier.resourceRequired;
            nextProgressionInfo = `Mục tiêu tiếp theo: ${currentTier.name} - ${nextSubTier.name} (ID cấp bậc: ${currentTier.id}, ID cấp phụ: ${nextSubTier.id}).`;
        } else {
            const currentTierIndex = progressionSystem.findIndex(r => r.id === currentTier.id);
            if (currentTierIndex !== -1 && currentTierIndex < progressionSystem.length - 1) {
                const nextTier = progressionSystem[currentTierIndex + 1];
                if (nextTier && nextTier.subTiers.length > 0) {
                    const nextSubTier = nextTier.subTiers[0];
                    resourceToNextSubTier = nextSubTier.resourceRequired;
                    nextProgressionInfo = `Mục tiêu tiếp theo (ĐỘT PHÁ CẤP BẬC LỚN): ${nextTier.name} - ${nextSubTier.name} (ID cấp bậc: ${nextTier.id}, ID cấp phụ: ${nextSubTier.id}).`;
                }
            }
        }
    }

    const isBreakthroughPossible = isProgressionSystemActive && playerCharacter.progression.progressionResource >= resourceToNextSubTier && resourceToNextSubTier !== Infinity;

  let dialogueContext = '';
  if (dialogueWithNpcId) {
      const npc = activeNpcs.find(n => n.id === dialogueWithNpcId);
      if (npc) {
          dialogueContext = `
### BỐI CẢNH HỘI THOẠI (ƯU TIÊN CAO) ###
- **Bạn đang nói chuyện với:** ${npc.identity.name} (${npc.status}).
- **Tính cách NPC:** ${npc.identity.personality}.
- **Động lực NPC:** ${npc.motivation}.
- **Cảm xúc NPC với bạn:** Tin tưởng(${npc.emotions.trust}), Sợ hãi(${npc.emotions.fear}), Tức giận(${npc.emotions.anger}).
- **Lịch sử trò chuyện gần đây:**
${(dialogueHistory || []).map(h => `  - ${h.speaker === 'player' ? playerCharacter.identity.name : npc.identity.name}: ${h.content}`).join('\n')}
`;
      }
  }


  const combatContext = combatState ? `
### TRẠNG THÁI CHIẾN ĐẤU ###
- **Đối thủ:** ${combatState.enemies.map(e => `${e.identity.name} (HP: ${e.attributes.sinh_menh?.value})`).join(', ')}
- **Lượt đi:** Hiện tại là lượt của ${combatState.turnOrder[combatState.currentTurnIndex] === 'player' ? 'bạn' : combatState.enemies.find(e => e.id === combatState.turnOrder[combatState.currentTurnIndex])?.identity.name}.
` : '';

  const memoryContext = instantMemoryReport ? `
### BỐI CẢNH BỔ SUNG (Ký Ức & Tri Thức) ###
${instantMemoryReport}
` : '';

  const thoughtContext = thoughtBubble ? `
### SUY NGHĨ NỘI TÂM CỦA NPC ###
- **NPC mục tiêu có thể đang nghĩ:** "${thoughtBubble}"
` : '';

  const modContext = createModContextSummary(activeMods);
  
  const recentHistory = storyLog
    .slice(forAssistant ? -20 : -10)
    .map(entry => {
        switch (entry.type) {
            case 'player-action': return `[Hành Động] ${entry.content}`;
            case 'player-dialogue': return `[Lời Nói] ${entry.content}`;
            default: return `[Tường Thuật] ${entry.content}`;
        }
    })
    .join('\n');
    
  const forAssistantContext = forAssistant ? `
### BÁCH KHOA TOÀN THƯ (THÔNG TIN ĐÃ BIẾT) ###
- **Sự kiện lịch sử:** ${majorEvents.map(e => `${e.title} (Năm ${e.year})`).join(', ')}.
- **Nhân vật đã gặp:** ${activeNpcs.filter(n => encounteredNpcIds.includes(n.id)).map(n => n.identity.name).join(', ')}.
- **Địa điểm đã khám phá:** ${discoveredLocations.map(l => l.name).join(', ')}.
- **Phe phái:** ${playerCharacter.reputation.map(r => r.factionName).join(', ')}.
` : '';

  return `
### BỐI CẢNH GAME TOÀN CỤC ###
${modContext}
${dialogueContext}
${playerRulesContext}
**Thời gian:** ${gameDate.era} năm ${gameDate.year}, ${gameDate.season}, ${gameDate.timeOfDay} (giờ ${gameDate.shichen}). Thời tiết: ${gameDate.weather}.
**Nhân Vật Chính: ${playerCharacter.identity.name}**
- **Trạng thái:** ${playerCharacter.healthStatus}. ${activeEffectsSummary}
${isProgressionSystemActive ? `
- **${progressionSystemInfo.name}:** ${currentTier?.name} - ${currentSubTier?.name || ''} (${playerCharacter.progression.progressionResource.toLocaleString()} / ${(resourceToNextSubTier !== Infinity ? resourceToNextSubTier.toLocaleString() : 'MAX')} ${progressionSystemInfo.resourceUnit})
${nextProgressionInfo ? `- ${nextProgressionInfo}` : ''}
${isBreakthroughPossible ? `- **[TRẠNG THÁI QUAN TRỌNG]: ĐÃ ĐỦ ĐIỀU KIỆN ĐỂ ĐỘT PHÁ!**` : ''}
` : ''}
- **Thuộc tính:**${attributeSummary}
- **Danh Vọng:** ${playerCharacter.danhVong.status} (${playerCharacter.danhVong.value}).
- **Tiền tệ:** ${currencySummary || 'Không có'}.
- **Trang bị:** ${equipmentSummary || 'Không có'}.
- **Nhiệm vụ:**
${questSummary}
- **Quan hệ phe phái:** ${reputationSummary}.

**Bối Cảnh Hiện Tại:**
- **Vị trí:** ${currentLocation?.name}. (${currentLocation?.description}).
- **Nồng độ ${progressionSystemInfo.resourceName}:** ${currentLocation?.qiConcentration}/100.
- **NPC xung quanh:**
${npcsHereWithMindState}
${combatContext}
${thoughtContext}
${memoryContext}
**Nhật Ký Gần Đây (Không được lặp lại):**
${recentHistory}

**Tóm Tắt Cốt Truyện (Ký ức dài hạn):**
${storySummary || 'Hành trình vừa mới bắt đầu.'}
${forAssistantContext}
`;
};
