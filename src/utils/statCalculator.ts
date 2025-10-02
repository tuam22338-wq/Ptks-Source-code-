
import type { CharacterAttributes, AttributeDefinition } from "../types";

/**
 * Safely parses and executes a formula string.
 * It identifies all variables in the formula, maps them to function arguments from the attributes record,
 * and defaults any missing attributes to 0 to prevent reference errors.
 * @param formula The formula string, e.g., "(strength * 2) + (agility * 0.5)".
 * @param attributes The character's current attributes record.
 * @returns The calculated result of the formula.
 */
const parseFormula = (formula: string, attributes: CharacterAttributes): number => {
    // Extract all potential variable names from the formula
    const formulaVars = [...new Set(formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [])];
    
    const argNames: string[] = [];
    const argValues: number[] = [];

    // Map formula variables to their values from the attributes object
    formulaVars.forEach(varName => {
        argNames.push(varName);
        const attr = attributes[varName];
        // Default to 0 if the attribute doesn't exist or its value is not a number
        argValues.push(Number(attr?.value) || 0);
    });

    try {
        // Sanitize formula to only allow safe characters.
        if (/[^a-zA-Z0-9_()+\-*/.\s]/.test(formula)) {
            console.error("Formula contains invalid characters:", formula);
            return 0;
        }

        // Create a function with named parameters matching the variables in the formula
        const func = new Function(...argNames, `return ${formula}`);
        const result = func(...argValues);

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
