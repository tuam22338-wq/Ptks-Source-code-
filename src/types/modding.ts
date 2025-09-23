import type {
    Faction, Gender, Element, StatBonus, ItemType, ItemQuality, EquipmentSlot, InnateTalentRank, PhapBaoRank,
    TechniqueEffectType, TechniqueEffect,
    // FIX: Import SkillCheck from core types
    SkillCheck
} from './core';
import type { CharacterIdentity } from './character';
// FIX: Correct imports to resolve circular dependencies and missing types.
import type { MajorEvent, GameEvent, NPC, Location } from './gameplay';
import type { AttributeDefinition, AttributeGroupDefinition } from './core';

export interface ModItem {
    id: string;
    name: string;
    description: string;
    type: ItemType;
    quality: ItemQuality;
    weight: number;
    value?: number;
    slot?: EquipmentSlot;
    icon?: string;
    bonuses: StatBonus[];
    tags: string[];
    vitalEffects?: { vital: string, value: number }[];
}

export interface ModTalent {
    id: string;
    name: string;
    description: string;
    rank: InnateTalentRank;
    bonuses: StatBonus[];
    tags: string[];
}

export interface RealmStage {
    id: string;
    name: string;
    qiRequired: number;
    bonuses: StatBonus[];
    description?: string;
}

export interface RealmConfig {
    id: string;
    name: string;
    stages: RealmStage[];
    hasTribulation?: boolean;
    tribulationDescription?: string;
    description?: string;
}

export interface TalentSystemConfig {
    systemName: string;
    choicesPerRoll: number;
    maxSelectable: number;
    allowAIGeneratedTalents?: boolean;
}

export interface ModTalentRank {
    id: string;
    name: string;
    color: string;
    weight: number;
}

export interface ModCharacter {
    id: string;
    name: string;
    gender: Gender;
    origin: string;
    appearance: string;
    personality: string;
    bonuses: StatBonus[];
    tags: string[];
}

// --- NEW MODDING TYPES FOR WORLD OVERHAUL ---
export type ModLocation = Omit<Location, 'id' | 'contextualActions' | 'shopIds'> & {
    id: string;
    tags: string[];
};

export type NpcRelationshipInput = { 
    targetNpcName: string; 
    type: string; 
    description: string; 
};

// This type represents a template for an NPC in a mod file.
export type ModNpc = {
    id: string;
    name: string;
    status: string;
    description: string; // Used for appearance in the mod definition
    origin: string;
    personality: string;
    locationId: string;
    relationships?: NpcRelationshipInput[];
    talentNames?: string[];
    faction?: string;
    tags: string[];
};


export interface ModWorldData {
    id: string;
    name: string;
    description: string;
    majorEvents: MajorEvent[];
    initialNpcs: (Omit<ModNpc, 'id'> & { id?: string })[];
    initialLocations: (Omit<ModLocation, 'id'> & { id?: string })[];
    factions: Faction[];
    startingYear: number;
    eraName: string;
    tags?: string[];
}
// --- END NEW MODDING TYPES ---


export type SectMemberRank = 'Tông Chủ' | 'Trưởng Lão' | 'Đệ Tử Chân Truyền' | 'Đệ Tử Nội Môn' | 'Đệ Tử Ngoại Môn';

export interface SectMember {
    id: string;
    name: string;
    rank: SectMemberRank;
    description?: string;
}

export interface ModSect {
    id: string;
    name: string;
    description: string;
    location: string;
    members: SectMember[];
    tags: string[];
}

export interface ModInfo {
    id: string;
    name: string;
    author?: string;
    description?: string;
    version?: string;
}

// --- UPDATED TECHNIQUE MODDING TYPES ---
export type AuxiliaryTechniqueType = 'Tâm Pháp' | 'Độn Thuật' | 'Luyện Thể' | 'Kiếm Quyết' | 'Thần Thông';
// FIX: Renamed to avoid conflict with gameplay CultivationTechnique type.
export interface ModCultivationTechnique {
    id: string;
    name: string;
    description: string;
    type: any; // Simplified for modding
    rank: PhapBaoRank;
    bonuses?: StatBonus[];
}
// FIX: Updated to use renamed type.
export type ModAuxiliaryTechnique = Omit<ModCultivationTechnique, 'id' | 'type'> & {
    id: string;
    type: AuxiliaryTechniqueType;
    requirements?: StatBonus[];
    tags?: string[];
};
// --- END UPDATED TECHNIQUE MODDING TYPES ---

export type ContentType = 'item' | 'talent' | 'character' | 'sect' | 'location' | 'worldData' | 'npc' | 'auxiliaryTechnique' | 'event' | 'customPanel' | 'recipe' | 'realm' | 'realmSystem' | 'talentSystem' | 'customDataPack';

export type EventTriggerType = 'ON_ENTER_LOCATION' | 'ON_TALK_TO_NPC' | 'ON_GAME_DATE';
export interface EventTrigger {
    type: EventTriggerType;
    details: Record<string, any>;
}

export type EventOutcomeType = 'GIVE_ITEM' | 'REMOVE_ITEM' | 'CHANGE_STAT' | 'ADD_RUMOR' | 'START_EVENT' | 'START_STORY' | 'UPDATE_REPUTATION';
export interface EventOutcome {
    type: EventOutcomeType;
    details: Record<string, any>;
}

// FIX: This type is now defined locally as it's a core part of modding events.
export interface EventChoice {
    id: string;
    text: string;
    check: SkillCheck | null;
}
export type ModEvent = Omit<GameEvent, 'id' | 'choices'> & {
    id: string;
    name: string;
    trigger?: EventTrigger;
    choices: Array<Omit<EventChoice, 'id'> & { outcomes?: EventOutcome[] }>;
    tags?: string[];
};

// NEW: Pillar 2 - Dynamic Mod Events
export interface DynamicModEvent {
    id: string;
    trigger: EventTrigger;
    outcomes: EventOutcome[];
    narrative: string;
    cooldownDays?: number;
    tags?: string[];
}
// END: Pillar 2

export interface AlchemyRecipe {
  id: string;
  name: string;
  description: string;
  ingredients: { name: string; quantity: number }[];
  result: { name: string; quantity: number };
  requiredAttribute: { name: 'Ngự Khí Thuật'; value: number };
  icon: string;
  qualityCurve: { threshold: number; quality: ItemQuality }[];
}

// --- New Deep Modding Types ---
export type ModDeclaration = Record<string, string[]>;

export interface StoryChoice {
    text: string;
    nextNodeId: string;
    outcomes?: EventOutcome[];
}

export interface StoryNode {
    id: string;
    type: 'narrative' | 'choice' | 'check' | 'end';
    content: string;
    choices?: StoryChoice[];
    check?: SkillCheck;
    successNodeId?: string;
    failureNodeId?: string;
    nextNodeId?: string; // For narrative nodes
    tags?: string[];
}

export interface StorySystem {
    id: string;
    name: string;
    description: string;
    entryPoint: string; // ID of the first story node
    nodes: Record<string, Omit<StoryNode, 'id'>>; // Nodes keyed by their ID
    tags?: string[];
}

export interface ModCustomPanel {
    id: string;
    title: string;
    iconName: string; // e.g., "FaScroll", must match a key in a predefined map
    content: string[]; // Array of WorldBuilding entry titles
    tags?: string[];
}

export interface ModCustomDataPack {
    id: string;
    name: string;
    data: string; // Storing as string to preserve formatting and handle potential JSON errors gracefully in UI
    tags?: string[];
}

// New AI Hooks type for "Pillar 3"
export interface AiHooks {
  on_world_build?: string[]; // Permanent world rules
  on_action_evaluate?: string[]; // Dynamic rules evaluated on each player action
}

export interface ModAttributeSystem {
    definitions: AttributeDefinition[];
    groups: AttributeGroupDefinition[];
}

export interface ModContent {
    items?: Omit<ModItem, 'id'>[];
    talents?: Omit<ModTalent, 'id'>[];
    characters?: Omit<ModCharacter, 'id'>[];
    sects?: Omit<ModSect, 'id'>[];
    locations?: Omit<ModLocation, 'id'>[];
    worldData?: Omit<ModWorldData, 'id'>[];
    auxiliaryTechniques?: Omit<ModAuxiliaryTechnique, 'id'>[];
    npcs?: Omit<ModNpc, 'id'>[];
    events?: Omit<ModEvent, 'id'>[];
    recipes?: Omit<AlchemyRecipe, 'id'>[];
    realmConfigs?: Omit<RealmConfig, 'id'>[];
    talentSystemConfig?: TalentSystemConfig;
    talentRanks?: Omit<ModTalentRank, 'id'>[];
    declarations?: ModDeclaration;
    storySystems?: Omit<StorySystem, 'id'>[];
    customPanels?: Omit<ModCustomPanel, 'id'>[];
    customDataPacks?: (Omit<ModCustomDataPack, 'id' | 'data'> & { data: Record<string, any> })[];
    dynamicEvents?: Omit<DynamicModEvent, 'id'>[];
    aiHooks?: AiHooks;
    attributeSystem?: ModAttributeSystem;
}

export interface FullMod {
    modInfo: ModInfo;
    content: ModContent;
}

// New type for the community mod library
export interface CommunityMod {
    modInfo: ModInfo;
    downloadUrl: string;
}