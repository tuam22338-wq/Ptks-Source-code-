import type { GameState } from '../types';
import { SHICHEN_LIST, TIMEOFDAY_DETAILS } from '../constants';

const DAYS_PER_SEASON = 30;
const SEASONS: ['Xuân', 'Hạ', 'Thu', 'Đông'] = ['Xuân', 'Hạ', 'Thu', 'Đông'];

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
        playerCharacter: { ...playerCharacter, vitals }
    };

    return { newState, newDay };
};
