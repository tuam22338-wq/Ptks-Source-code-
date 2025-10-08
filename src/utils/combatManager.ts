import type { NPC, PlayerCharacter, CultivationTechnique, Element, GameState } from '../types';

const ELEMENTAL_CHART: Record<Element, { strongAgainst: Element[], weakAgainst: Element[] }> = {
    'Kim': { strongAgainst: ['Mộc'], weakAgainst: ['Hỏa'] },
    'Mộc': { strongAgainst: ['Thổ'], weakAgainst: ['Kim'] },
    'Thủy': { strongAgainst: ['Hỏa'], weakAgainst: ['Thổ'] },
    'Hỏa': { strongAgainst: ['Kim'], weakAgainst: ['Thủy'] },
    'Thổ': { strongAgainst: ['Thủy'], weakAgainst: ['Mộc'] },
    'Vô': { strongAgainst: [], weakAgainst: [] },
    // Dị and Hỗn Độn can be considered neutral or have special rules
    'Dị': { strongAgainst: [], weakAgainst: [] }, 
    'Hỗn Độn': { strongAgainst: ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'], weakAgainst: [] },
};

const getFinalAttributeValue = (character: PlayerCharacter | NPC, attributeId: string, gameState: GameState): number => {
    const baseValue = character.attributes[attributeId]?.value || 10;
    
    const attrDef = gameState.attributeSystem.definitions.find(def => def.id === attributeId);
    if (!attrDef) return baseValue;

    const bonus = (character.activeEffects || [])
        .flatMap(e => e.bonuses)
        .filter(b => b.attribute === attrDef.name) // Bonuses are often by name
        .reduce((sum, b) => sum + b.value, 0);

    return baseValue + bonus;
};

export const calculateDamage = (
    attacker: PlayerCharacter | NPC,
    target: PlayerCharacter | NPC,
    isMagic: boolean,
    gameState: GameState,
    techniqueElement?: Element
): { damage: number; narrative: string } => {
    const attackerElement = techniqueElement || attacker.element || 'Vô';
    const targetElement = target.element || 'Vô';

    const attackStat = isMagic ? getFinalAttributeValue(attacker, 'linh_luc_sat_thuong', gameState) : getFinalAttributeValue(attacker, 'luc_luong', gameState);
    const defenseStat = isMagic ? getFinalAttributeValue(target, 'nguyen_than_khang', gameState) : getFinalAttributeValue(target, 'can_cot', gameState);

    let baseDamage = Math.max(1, attackStat - (defenseStat / 2));
    let narrative = '';

    // Elemental interaction
    let multiplier = 1.0;
    if (attackerElement !== 'Vô' && targetElement !== 'Vô') {
        if (ELEMENTAL_CHART[attackerElement]?.strongAgainst.includes(targetElement)) {
            multiplier = 1.5;
            narrative = 'Hệ ngũ hành tương khắc, uy lực tăng mạnh! ';
        } else if (ELEMENTAL_CHART[attackerElement]?.weakAgainst.includes(targetElement)) {
            multiplier = 0.75;
            narrative = 'Hệ ngũ hành bị khắc chế, uy lực giảm bớt. ';
        }
    }
    
    let finalDamage = Math.floor(baseDamage * multiplier);
    
    // Add randomness (+/- 15%)
    finalDamage = Math.floor(finalDamage * (0.85 + Math.random() * 0.3));

    narrative += `Gây ra ${finalDamage} sát thương.`;

    return { damage: finalDamage, narrative };
};
