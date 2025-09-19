import type { GameState, ActiveEffect } from '../types';
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
): { newState: GameState; newDay: boolean } => {
    let newDay = false;
    let { gameDate, playerCharacter } = currentState;
    let { vitals } = playerCharacter;

    // Vitals decay
    vitals.hunger = Math.max(0, vitals.hunger - apCost * 2); // 2 hunger per AP
    vitals.thirst = Math.max(0, vitals.thirst - apCost * 3); // 3 thirst per AP

    // Apply/remove debuffs based on vitals
    let newActiveEffects = [...playerCharacter.activeEffects];

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
    newActiveEffects = manageEffect(newActiveEffects, vitals.hunger <= 20 && vitals.hunger > 0, STARVATION_DEBUFF);
    newActiveEffects = manageEffect(newActiveEffects, vitals.hunger <= 0, SEVERE_STARVATION_DEBUFF);
    if (newActiveEffects.some(e => e.name === SEVERE_STARVATION_DEBUFF.name)) {
        newActiveEffects = newActiveEffects.filter(e => e.name !== STARVATION_DEBUFF.name);
    }

    // Manage Thirst Debuffs
    newActiveEffects = manageEffect(newActiveEffects, vitals.thirst <= 20 && vitals.thirst > 0, DEHYDRATION_DEBUFF);
    newActiveEffects = manageEffect(newActiveEffects, vitals.thirst <= 0, SEVERE_DEHYDRATION_DEBUFF);
    if (newActiveEffects.some(e => e.name === SEVERE_DEHYDRATION_DEBUFF.name)) {
        newActiveEffects = newActiveEffects.filter(e => e.name !== DEHYDRATION_DEBUFF.name);
    }

    playerCharacter = { ...playerCharacter, vitals, activeEffects: newActiveEffects };

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
        const shichensToAdvance = Math.floor(apCost * 2); // Assuming 1 AP = 2 shichens (4 hours)
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

    return { newState, newDay };
};