import type { GameState, StoryEntry, GameSettings, ActiveEffect, ActiveQuest, CultivationTechnique, ItemQuality, PlayerCharacter } from '../types';
import { generateStoryContinuationStream, parseNarrativeForGameData, summarizeStory } from './geminiService';
import { advanceGameTime } from '../utils/timeManager';
import { simulateWorldTurn, simulateFactionTurn } from './worldSimulator';
import * as questManager from '../utils/questManager';
import { SECTS, ALCHEMY_RECIPES, CAVE_FACILITIES_CONFIG } from '../constants';

export const processPlayerAction = async (
    gameState: GameState,
    text: string,
    type: 'say' | 'act',
    apCost: number,
    settings: GameSettings,
    showNotification: (message: string) => void,
    abortSignal: AbortController['signal']
): Promise<GameState> => {
    // This is essentially the logic from the old handleActionSubmit
    const { newState: stateAfterTime, newDay, notifications: timeNotifications } = advanceGameTime(gameState, apCost);
    timeNotifications.forEach(showNotification);
    
    let stateAfterSim = stateAfterTime;
    let rumors: { text: string }[] = [];
    if (newDay) {
        if (stateAfterSim.gameDate.day % 7 === 1) {
            const { newEvent } = await simulateFactionTurn(stateAfterSim);
            if (newEvent) {
                stateAfterSim = { ...stateAfterSim, worldState: { ...stateAfterSim.worldState, dynamicEvents: [...(stateAfterSim.worldState.dynamicEvents || []), newEvent] } };
            }
        }
        const simResult = await simulateWorldTurn(stateAfterSim);
        stateAfterSim = simResult.newState;
        rumors = simResult.rumors;
    }
    
    const stream = generateStoryContinuationStream(stateAfterSim, text, type);
    let fullResponse = '';
    for await (const chunk of stream) {
        if (abortSignal.aborted) {
             throw new Error("Hành động đã bị hủy.");
        };
        fullResponse += chunk;
    }

    const parsedData = await parseNarrativeForGameData(fullResponse, stateAfterSim);
    
    let finalState = { ...stateAfterSim };
    let pc = { ...finalState.playerCharacter };

    // Apply parsed location change
    if (parsedData.newLocation && finalState.discoveredLocations.some(l => l.id === parsedData.newLocation!.locationId)) {
        pc.currentLocationId = parsedData.newLocation.locationId;
        showNotification(`Đã đến: ${finalState.discoveredLocations.find(l => l.id === pc.currentLocationId)?.name || pc.currentLocationId}`);
    }

    // Apply parsed items
    if (parsedData.newItems && parsedData.newItems.length > 0) {
        const updatedItems = [...pc.inventory.items];
        parsedData.newItems.forEach(newItem => {
            const existing = updatedItems.find(i => i.name === newItem.name);
            if (existing) existing.quantity += newItem.quantity; else updatedItems.push(newItem);
            showNotification(`Nhận được: ${newItem.name} x${newItem.quantity}`);
        });
        pc.inventory = { ...pc.inventory, items: updatedItems };
    }

    // Apply parsed techniques
    if (parsedData.newTechniques && parsedData.newTechniques.length > 0) {
// Fix: Use the correct 'techniques' property instead of the deprecated 'auxiliaryTechniques'
        let updatedTechniques = [...pc.techniques];
        let effectsFromTechniques: ActiveEffect[] = [];
        parsedData.newTechniques.forEach(tech => {
            if (!updatedTechniques.some(t => t.name === tech.name)) {
                updatedTechniques.push(tech);
                showNotification(`Lĩnh ngộ: ${tech.name}`);
                if (tech.bonuses) effectsFromTechniques.push({ id: `tech-passive-${tech.id}`, name: `${tech.name} (Bị Động)`, source: `technique:${tech.id}`, description: `Hiệu quả bị động từ công pháp ${tech.name}.`, bonuses: tech.bonuses, duration: -1, isBuff: true });
            }
        });
// Fix: Use the correct 'techniques' property instead of the deprecated 'auxiliaryTechniques'
        pc.techniques = updatedTechniques;
            if (effectsFromTechniques.length > 0) {
            pc.activeEffects = [...pc.activeEffects, ...effectsFromTechniques];
        }
    }
    
    // Apply parsed stat changes
    if (parsedData.statChanges && parsedData.statChanges.length > 0) {
        const changesMap = parsedData.statChanges.reduce((acc, sc) => ({ ...acc, [sc.attribute]: sc.change }), {} as Record<string, number>);
        pc.attributes = pc.attributes.map(group => ({
            ...group,
            attributes: group.attributes.map(attr => {
                const change = changesMap[attr.name];
                if (change && typeof attr.value === 'number') {
                    const newValue = attr.value + change;
                    showNotification(`${attr.name}: ${change > 0 ? '+' : ''}${change}`);
                    if (attr.maxValue) {
                        if (['Sinh Mệnh', 'Linh Lực'].includes(attr.name)) {
                                return { ...attr, value: Math.max(0, Math.min(attr.maxValue, newValue)) };
                        }
                        return { ...attr, value: newValue, maxValue: attr.maxValue + change };
                    }
                    return { ...attr, value: newValue };
                }
                return attr;
            })
        }));
        if (changesMap.spiritualQi) {
            pc.cultivation.spiritualQi = Math.max(0, pc.cultivation.spiritualQi + changesMap.spiritualQi);
            showNotification(`Linh Khí: ${changesMap.spiritualQi > 0 ? '+' : ''}${changesMap.spiritualQi}`);
        }
        if (changesMap.hunger) {
            pc.vitals.hunger = Math.max(0, Math.min(pc.vitals.maxHunger, pc.vitals.hunger + changesMap.hunger));
            showNotification(`No Bụng: ${changesMap.hunger > 0 ? '+' : ''}${changesMap.hunger}`);
        }
        if (changesMap.thirst) {
            pc.vitals.thirst = Math.max(0, Math.min(pc.vitals.maxThirst, pc.vitals.thirst + changesMap.thirst));
            showNotification(`Nước Uống: ${changesMap.thirst > 0 ? '+' : ''}${changesMap.thirst}`);
        }
    }

    // Apply parsed effects
    if (parsedData.newEffects && parsedData.newEffects.length > 0) {
        const allNewEffects = parsedData.newEffects.map(effect => ({ ...effect, id: `effect-${Date.now()}-${Math.random()}` }));
        pc.activeEffects = [...pc.activeEffects, ...allNewEffects];
        allNewEffects.forEach(eff => showNotification(`Bạn nhận được hiệu ứng: ${eff.name}`));
    }

    // Handle System Actions
    if (parsedData.systemActions && parsedData.systemActions.length > 0) {
        for (const action of parsedData.systemActions) {
            switch (action.actionType) {
                case 'JOIN_SECT':
                    const sectId = action.details.sectId;
                    const sectToJoin = SECTS.find(s => s.id === sectId);
                    if (sectToJoin && !pc.sect) {
                        pc.sect = { sectId: sectToJoin.id, rank: sectToJoin.ranks[0].name, contribution: 0 };
                        if (sectToJoin.startingTechnique) {
                            const newTechnique: CultivationTechnique = {
                                id: `tech_${sectToJoin.id}_start`,
                                level: 1,
                                maxLevel: 10,
                                ...sectToJoin.startingTechnique,
                            };
// Fix: Use the correct 'techniques' property instead of the deprecated 'auxiliaryTechniques'
                            pc.techniques.push(newTechnique);
                            showNotification(`Đã học được công pháp nhập môn: [${newTechnique.name}]!`);
                        }
                        showNotification(`Đã gia nhập ${sectToJoin.name}!`);
                    }
                    break;
                
                case 'CRAFT_ITEM':
                    const recipeId = action.details.recipeId;
                    const recipe = ALCHEMY_RECIPES.find(r => r.id === recipeId);
                    const alchemySkillAttr = pc.attributes.flatMap(g => g.attributes).find(a => a.name === 'Ngự Khí Thuật');
                    const alchemySkillValue = (alchemySkillAttr?.value as number) || 0;
                    
                    if (recipe) {
                        const hasIngredients = recipe.ingredients.every(ing => {
                            const playerItem = pc.inventory.items.find(i => i.name === ing.name);
                            return playerItem && playerItem.quantity >= ing.quantity;
                        });
                        const hasCauldron = pc.inventory.items.some(i => i.type === 'Đan Lô');
                        const hasSkill = alchemySkillValue >= recipe.requiredAttribute.value;
                        
                        if (hasIngredients && hasCauldron && hasSkill) {
                            let newItems = [...pc.inventory.items];
                            recipe.ingredients.forEach(ing => {
                                newItems = newItems.map(i => i.name === ing.name ? { ...i, quantity: i.quantity - ing.quantity } : i).filter(i => i.quantity > 0);
                            });

                            const skillDifference = alchemySkillValue - recipe.requiredAttribute.value;
                            const successChance = Math.min(0.98, 0.6 + skillDifference * 0.02);
                            if (Math.random() < successChance) {
                                let quality: ItemQuality = 'Phàm Phẩm';
                                const qualityRoll = Math.random() * (alchemySkillValue + 20);
                                for (const curve of recipe.qualityCurve) {
                                    if (qualityRoll >= curve.threshold) { quality = curve.quality; break; }
                                }
                                const resultItem = newItems.find(i => i.name === recipe.result.name);
                                if (resultItem) {
                                    newItems = newItems.map(i => i.name === recipe.result.name ? {...i, quantity: i.quantity + recipe.result.quantity} : i);
                                } else {
                                    newItems.push({ id: `item-${Date.now()}`, name: recipe.result.name, description: `Một viên ${recipe.result.name}.`, quantity: recipe.result.quantity, type: 'Đan Dược', icon: recipe.icon, quality: quality, weight: 0.1, bonuses: [], recipeId, slot: undefined, value: undefined, isEquipped: false, rank: undefined, vitalEffects: undefined });
                                }
                                pc.inventory = { ...pc.inventory, items: newItems };
                                showNotification(`Luyện chế thành công [${recipe.result.name} - ${quality}]!`);
                            } else {
                                pc.inventory = { ...pc.inventory, items: newItems };
                                showNotification("Luyện chế thất bại, nguyên liệu đã bị hủy!");
                            }
                        }
                    }
                    break;

                case 'UPGRADE_CAVE':
                    const facilityId = action.details.facilityId as keyof PlayerCharacter['caveAbode'];
                    const facilityConfig = CAVE_FACILITIES_CONFIG.find(f => f.id === facilityId);
                    if (facilityConfig && pc.caveAbode) {
                        const currentLevel = pc.caveAbode[facilityId] as number;
                        const cost = facilityConfig.upgradeCost(currentLevel);
                        const currencyName = 'Linh thạch hạ phẩm';
                        if ((pc.currencies[currencyName] || 0) >= cost) {
                            pc.currencies = { ...pc.currencies, [currencyName]: pc.currencies[currencyName] - cost };
                            pc.caveAbode = { ...pc.caveAbode, [facilityId]: currentLevel + 1 };
                            if (facilityId === 'storageUpgradeLevel') {
                                pc.inventory.weightCapacity += 10 * (currentLevel + 1);
                            }
                            showNotification(`${facilityConfig.name} đã được nâng cấp!`);
                        }
                    }
                    break;
            }
        }
    }

    // Apply parsed quests
    if (parsedData.newQuests && parsedData.newQuests.length > 0) {
        pc.activeQuests = [...pc.activeQuests, ...parsedData.newQuests.map(questData => ({
            id: `quest_${questData.source || 'narrative'}_${Date.now()}`,
            type: 'SIDE' as const,
            source: questData.source || `narrative-${Date.now()}`,
            title: questData.title || 'Nhiệm vụ không tên',
            description: questData.description || '',
            objectives: (questData.objectives || []).map(obj => ({ ...obj, current: 0, isCompleted: false })),
            rewards: questData.rewards || {},
        }))];
        parsedData.newQuests.forEach(q => showNotification(`Nhiệm vụ mới: ${q.title}`));
    }
    
    finalState.playerCharacter = pc;
    finalState.encounteredNpcIds = [...new Set([...finalState.encounteredNpcIds, ...parsedData.newNpcEncounterIds])];
    
    const playerActionEntry: StoryEntry = { id: 0, type: type === 'say' ? 'player-dialogue' : 'player-action', content: text };
    const newLogEntries: StoryEntry[] = [playerActionEntry];

    if (newDay) newLogEntries.push({ id: 0, type: 'system', content: `Một ngày mới đã bắt đầu: ${finalState.gameDate.season}, ngày ${finalState.gameDate.day}` });
    rumors.forEach(r => newLogEntries.push({ id: 0, type: 'narrative', content: `Có tin đồn rằng: ${r.text}` }));
    newLogEntries.push({ id: 0, type: 'narrative', content: fullResponse });
    
    const lastId = gameState.storyLog.length > 0 ? gameState.storyLog[gameState.storyLog.length - 1].id : 0;
    finalState.storyLog = [...gameState.storyLog, ...newLogEntries.map((entry, index) => ({ ...entry, id: lastId + index + 1 }))];

    const finalQuestCheck = await questManager.processQuestUpdates(finalState, newDay);
    finalQuestCheck.notifications.forEach(showNotification);

    let finalStateForSummary = finalQuestCheck.newState;

    // Auto-summary logic
    if (finalStateForSummary.storyLog.length > 0 && finalStateForSummary.storyLog.length % settings.autoSummaryFrequency === 0) {
        try {
            const summary = await summarizeStory(finalStateForSummary.storyLog);
            finalStateForSummary = { ...finalStateForSummary, storySummary: summary };
            console.log("Story summarized and saved to AI memory.");
        } catch (summaryError) {
            console.error("Failed to summarize story:", summaryError);
        }
    }
    
    return finalStateForSummary;
};