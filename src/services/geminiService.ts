// This file now acts as a facade, re-exporting from the new modular services.
// This approach avoids breaking existing imports throughout the application.

export * from './gemini/gemini.core';
export * from './gemini/character.service';
export * from './gemini/gameplay.service';
export * from './gemini/npc.service';
export * from './gemini/asset.service';
export * from './gemini/modding.service';
export * from './gemini/quest.service';
export * from './gemini/combat.service';
export * from './gemini/parsing.service';
export * from './gemini/interaction.service';
