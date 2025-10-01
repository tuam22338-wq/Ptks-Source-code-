import type { GameState, GameSettings } from '../../types';
import { DEFAULT_ATTRIBUTE_DEFINITIONS, NARRATIVE_STYLES, PERSONALITY_TRAITS } from '../../constants';
import { createModContextSummary } from '../../utils/modManager';

// FIX: Add 'settings' parameter to the function signature, remove incorrect access from gameState, and add missing return statement.
export const createFullGameStateContext = (gameState: GameState, settings: GameSettings, instantMemoryReport?: string, thoughtBubble?: string, forAssistant: boolean = false): string => {
  const { playerCharacter, gameDate, discoveredLocations, activeNpcs, worldState, storySummary, storyLog, activeMods, majorEvents, encounteredNpcIds, combatState, attributeSystem, realmSystem, realmSystemInfo } = gameState;
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
        const willpower = ` [Động lực: ${n.motivation}, Mục tiêu: ${n.goals.join(', ')}]`;
        return `- ${n.identity.name} (${n.status}). ${emotions}${memories}${willpower}`;
      }).join('\n')
    : 'Không có ai đáng chú ý ở đây.';
  
    const currentRealm = realmSystem.find(r => r.id === playerCharacter.cultivation.currentRealmId);
    const currentStage = currentRealm?.stages.find(s => s.id === playerCharacter.cultivation.currentStageId);

    let qiToNextStage = Infinity;
    if (currentRealm && currentStage) {
        const currentStageIndex = currentRealm.stages.findIndex(s => s.id === currentStage.id);
        if (currentStageIndex !== -1 && currentStageIndex < currentRealm.stages.length - 1) {
            qiToNextStage = currentRealm.stages[currentStageIndex + 1].qiRequired;
        } else {
            const currentRealmIndex = realmSystem.findIndex(r => r.id === currentRealm.id);
            if (currentRealmIndex !== -1 && currentRealmIndex < realmSystem.length - 1) {
                const nextRealm = realmSystem[currentRealmIndex + 1];
                if (nextRealm && nextRealm.stages.length > 0) {
                    qiToNextStage = nextRealm.stages[0].qiRequired;
                }
            }
        }
    }


  const combatContext = combatState ? `
### TRẠNG THÁI CHIẾN ĐẤU ###
- **Đối thủ:** ${combatState.enemies.map(e => `${e.identity.name} (HP: ${e.attributes.sinh_menh?.value})`).join(', ')}
- **Lượt đi:** Hiện tại là lượt của ${combatState.turnOrder[combatState.currentTurnIndex] === 'player' ? 'bạn' : combatState.enemies.find(e => e.id === combatState.turnOrder[combatState.currentTurnIndex])?.identity.name}.
` : '';

  const memoryContext = instantMemoryReport ? `
### KÝ ỨC LIÊN QUAN (TỪ TRÍ NHỚ DÀI HẠN) ###
- ${instantMemoryReport}
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

  // FIX: Added return statement
  return `
### BỐI CẢNH GAME TOÀN CỤC ###
${modContext}
${playerRulesContext}
**Thời gian:** ${gameDate.era} năm ${gameDate.year}, ${gameDate.season}, ${gameDate.timeOfDay} (giờ ${gameDate.shichen}). Thời tiết: ${gameDate.weather}.
**Nhân Vật Chính: ${playerCharacter.identity.name}**
- **Trạng thái:** ${playerCharacter.healthStatus}. ${activeEffectsSummary}
- **Cảnh giới:** ${currentRealm?.name} - ${currentStage?.name || ''} (${playerCharacter.cultivation.spiritualQi.toLocaleString()} / ${(qiToNextStage !== Infinity ? qiToNextStage.toLocaleString() : 'MAX')} ${realmSystemInfo.resourceName})
- **Thuộc tính:**${attributeSummary}
- **Danh Vọng:** ${playerCharacter.danhVong.status} (${playerCharacter.danhVong.value}).
- **Tiền tệ:** ${currencySummary || 'Không có'}.
- **Trang bị:** ${equipmentSummary || 'Không có'}.
- **Nhiệm vụ:**\n${questSummary}
- **Quan hệ phe phái:** ${reputationSummary}.

**Bối Cảnh Hiện Tại:**
- **Vị trí:** ${currentLocation?.name}. (${currentLocation?.description}).
- **Nồng độ ${realmSystemInfo.resourceName}:** ${currentLocation?.qiConcentration}/100.
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