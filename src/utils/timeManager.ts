import type { GameState, ActiveEffect, PlayerCharacter } from '../types';
import { SHICHEN_LIST, TIMEOFDAY_DETAILS } from '../constants';

const DAYS_PER_SEASON = 30;
const SEASONS: ['Xuân', 'Hạ', 'Thu', 'Đông'] = ['Xuân', 'Hạ', 'Thu', 'Đông'];

const STARVATION_DEBUFF: Omit<ActiveEffect, 'id'> = { name: 'Đói Lả', source: 'vitals', description: 'Cơ thể suy nhược vì đói, các chỉ số bị giảm.', duration: -1, isBuff: false, bonuses: [{ attribute: 'Lực Lượng', value: -5 }, { attribute: 'Bền Bỉ', value: -5 }] };
const SEVERE_STARVATION_DEBUFF: Omit<ActiveEffect, 'id'> = { name: 'Chết Đói', source: 'vitals', description: 'Sắp chết đói, sinh mệnh lực đang từ từ trôi đi.', duration: -1, isBuff: false, bonuses: [{ attribute: 'Lực Lượng', value: -10 }, { attribute: 'Bền Bỉ', value: -10 }], dot: { damage: 5, type: 'Sinh Mệnh' } };
const DEHYDRATION_DEBUFF: Omit<ActiveEffect, 'id'> = { name: 'Khát Khô', source: 'vitals', description: 'Thiếu nước trầm trọng, tinh thần và thể chất đều suy giảm.', duration: -1, isBuff: false, bonuses: [{ attribute: 'Thân Pháp', value: -5 }, { attribute: 'Nguyên Thần', value: -5 }] };
const SEVERE_DEHYDRATION_DEBUFF: Omit<ActiveEffect, 'id'> = { name: 'Chết Khát', source: 'vitals', description: 'Mất nước nghiêm trọng, sinh mệnh đang khô héo.', duration: -1, isBuff: false, bonuses: [{ attribute: 'Thân Pháp', value: -10 }, { attribute: 'Nguyên Thần', value: -10 }], dot: { damage: 5, type: 'Sinh Mệnh' } };


export const advanceGameTime = (
    currentState: GameState, 
    apCost: number
): { newState: GameState; newDay: boolean; notifications: string[] } => {
    let newDay = false;
    const notifications: string[] = [];
    let { gameDate, playerCharacter } = JSON.parse(JSON.stringify(currentState)); // Deep copy to prevent mutation
    let { vitals } = playerCharacter;

    // Vitals decay
    vitals.hunger = Math.max(0, vitals.hunger - apCost * 2); // 2 hunger per AP
    vitals.thirst = Math.max(0, vitals.thirst - apCost * 3); // 3 thirst per AP

    // Process DOT effects and duration
    let dotDamage = 0;
    const expiredEffects: string[] = [];
    
    let currentEffects = [...playerCharacter.activeEffects];

    const nextEffects = currentEffects.map(effect => {
        if (effect.dot && effect.dot.type === 'Sinh Mệnh') {
            dotDamage += effect.dot.damage * apCost; // Damage per AP
        }
        if (effect.duration > 0) {
            const newDuration = effect.duration - apCost;
            if (newDuration <= 0) {
                expiredEffects.push(effect.name);
                return null; // Mark for removal
            }
            return { ...effect, duration: newDuration };
        }
        return effect;
    }).filter(Boolean) as ActiveEffect[]; // Remove nulls (expired effects)

    if (expiredEffects.length > 0) {
        notifications.push(`Hiệu ứng đã kết thúc: ${expiredEffects.join(', ')}.`);
    }

    if (dotDamage > 0) {
        const sinhMenhAttr = playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === 'Sinh Mệnh');
        if (sinhMenhAttr) {
            const newSinhMenhValue = (sinhMenhAttr.value as number) - dotDamage;
            notifications.push(`Bạn mất ${dotDamage} Sinh Mệnh vì hiệu ứng bất lợi.`);
            playerCharacter.attributes = playerCharacter.attributes.map(group => ({
                ...group,
                attributes: group.attributes.map(attr => 
                    attr.name === 'Sinh Mệnh' ? { ...attr, value: Math.max(0, newSinhMenhValue) } : attr
                )
            }));
        }
    }
    
    playerCharacter.activeEffects = nextEffects;

    // Apply/remove debuffs based on vitals
    const manageEffect = (effects: ActiveEffect[], condition: boolean, effectToAdd: Omit<ActiveEffect, 'id'>): ActiveEffect[] => {
        const hasEffect = effects.some(e => e.name === effectToAdd.name);
        if (condition && !hasEffect) {
            return [...effects, { ...effectToAdd, id: `effect_${effectToAdd.name.replace(/\s+/g, '_')}` }];
        }
        if (!condition && hasEffect) {
            return effects.filter(e => e.name !== effectToAdd.name);
        }
        return effects;
    };

    // Manage Hunger Debuffs
    let updatedEffects = manageEffect(playerCharacter.activeEffects, vitals.hunger <= 20 && vitals.hunger > 0, STARVATION_DEBUFF);
    updatedEffects = manageEffect(updatedEffects, vitals.hunger <= 0, SEVERE_STARVATION_DEBUFF);
    if (updatedEffects.some(e => e.name === SEVERE_STARVATION_DEBUFF.name)) {
        updatedEffects = updatedEffects.filter(e => e.name !== STARVATION_DEBUFF.name);
    }

    // Manage Thirst Debuffs
    updatedEffects = manageEffect(updatedEffects, vitals.thirst <= 20 && vitals.thirst > 0, DEHYDRATION_DEBUFF);
    updatedEffects = manageEffect(updatedEffects, vitals.thirst <= 0, SEVERE_DEHYDRATION_DEBUFF);
    if (updatedEffects.some(e => e.name === SEVERE_DEHYDRATION_DEBUFF.name)) {
        updatedEffects = updatedEffects.filter(e => e.name !== DEHYDRATION_DEBUFF.name);
    }
    playerCharacter.activeEffects = updatedEffects;
    playerCharacter.vitals = vitals;

    let newActionPoints = gameDate.actionPoints - apCost;

    if (newActionPoints < 0) {
        newDay = true;
        let newDayCount = gameDate.day + 1;
        let newSeason = gameDate.season;
        let newYear = gameDate.year;

        if (newDayCount > DAYS_PER_SEASON) {
            newDayCount = 1;
            const currentSeasonIndex = SEASONS.indexOf(gameDate.season);
            const nextSeasonIndex = (currentSeasonIndex + 1) % SEASONS.length;
            newSeason = SEASONS[nextSeasonIndex];

            if (nextSeasonIndex === 0) { // New year starts with Spring
                newYear++;
            }
        }
        
        gameDate = {
            ...gameDate,
            day: newDayCount,
            season: newSeason,
            year: newYear,
            actionPoints: gameDate.maxActionPoints + newActionPoints, // Add remaining AP to new day's max AP
            shichen: 'Thìn', // Reset to morning
            timeOfDay: TIMEOFDAY_DETAILS['Thìn'].name,
        };

    } else {
        const currentShichenIndex = SHICHEN_LIST.findIndex(s => s.name === gameDate.shichen);
        // Assuming 1 AP = 1 shichen for simplicity in this version
        const shichensToAdvance = apCost; 
        const nextShichenIndex = (currentShichenIndex + shichensToAdvance) % SHICHEN_LIST.length;
        const newShichen = SHICHEN_LIST[nextShichenIndex].name;

        gameDate = {
            ...gameDate,
            actionPoints: newActionPoints,
            shichen: newShichen,
            timeOfDay: TIMEOFDAY_DETAILS[newShichen].name,
        };
    }

    const newState: GameState = {
        ...currentState,
        gameDate,
        playerCharacter
    };

    return { newState, newDay, notifications };
};