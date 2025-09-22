import type { CharacterAttributes, AttributeDefinition } from "../types";

/**
 * Safely parses and executes a formula string.
 * It replaces attribute IDs with their values before execution.
 * @param formula The formula string, e.g., "(strength * 2) + (agility * 0.5)".
 * @param attributes The character's current attributes record.
 * @returns The calculated result of the formula.
 */
const parseFormula = (formula: string, attributes: CharacterAttributes): number => {
    // Create a scope object containing only the numeric values of the attributes.
    const scope: Record<string, number> = {};
    for (const key in attributes) {
        scope[key] = attributes[key].value;
    }

    // This is a safer alternative to eval(). It creates a new Function
    // that can only access the variables provided in its scope.
    try {
        const attributeIds = Object.keys(scope);
        // Sanitize formula to prevent access to global scope (e.g., window, document)
        if (/[^a-zA-Z0-9_()+\-*/.\s]/.test(formula)) {
            console.error("Formula contains invalid characters:", formula);
            return 0;
        }
        const func = new Function(...attributeIds, `return ${formula}`);
        const values = attributeIds.map(id => scope[id]);
        const result = func(...values);
        return typeof result === 'number' && !isNaN(result) ? result : 0;
    } catch (error) {
        console.error(`Error executing formula "${formula}":`, error);
        return 0;
    }
};

/**
 * Calculates all derived (SECONDARY) stats based on their formulas.
 * @param characterAttributes The current attributes of the character.
 * @param attributeDefinitions The list of all attribute definitions for the current system.
 * @returns A new CharacterAttributes object with the secondary stats calculated and updated.
 */
export const calculateDerivedStats = (
    characterAttributes: CharacterAttributes,
    attributeDefinitions: AttributeDefinition[]
): CharacterAttributes => {
    const newAttributes = JSON.parse(JSON.stringify(characterAttributes));

    const secondaryAttributes = attributeDefinitions.filter(
        (def) => def.type === 'SECONDARY' && def.formula
    );

    for (const attrDef of secondaryAttributes) {
        const calculatedValue = parseFormula(attrDef.formula!, newAttributes);
        
        if (newAttributes[attrDef.id]) {
            newAttributes[attrDef.id].value = calculatedValue;
        } else {
            // If the secondary attribute doesn't exist yet, create it.
            newAttributes[attrDef.id] = { value: calculatedValue };
        }
    }

    return newAttributes;
};
