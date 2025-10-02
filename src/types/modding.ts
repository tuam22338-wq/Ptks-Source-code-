import type {
    Faction, Gender, Element, StatBonus, ItemType, ItemQuality, EquipmentSlot, InnateTalentRank, AbilityRank,
    AbilityEffectType, 
    // FIX: Import SkillCheck, EventChoice, and EventOutcome from core types
    SkillCheck,
    AttributeDefinition,
    AttributeGroupDefinition,
    EventChoice,
    EventOutcome,
    // FIX: Import CultivationTechnique from core to resolve error.
    CultivationTechnique
} from './core';
import type { CharacterIdentity } from './character';
// FIX: Correct imports to resolve circular dependencies and missing types.
import type { MajorEvent, GameEvent, NPC, Location, ForeshadowedEvent } from './gameplay';

export interface ModTagDefinition {
    id: string; // e.g., 'cyberpunk_tu_chan'
    name: string; // 'Cyberpunk Tu Chân'
    description: string;
}

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

export interface SubTier {
    id: string;
    name: string;
    qiRequired: number;
    breakthroughRequirements?: string; // Descriptive text for AI, e.g., "Cần hấp thụ một 'Hồn Hoàn' vạn năm."
    bonuses: StatBonus[];
    description?: string;
}

// FIX: Renamed TierConfig to RealmConfig for consistency
export interface RealmConfig {
    id: string;
    name: string;
    stages: SubTier[];
    hasTribulation?: boolean;
    tribulationDescription?: string;
    description?: string;
    bonuses?: StatBonus[];
}

// FIX: Renamed NamedProgressionSystem to NamedRealmSystem
export interface NamedRealmSystem {
    id: string;
    name: string;
    description: string;
    resourceName: string; // Vd: 'Linh Khí', 'Hồn Lực', 'Điểm Kinh Nghiệm'
    resourceUnit: string; // Vd: 'điểm', 'năm', 'vòng'
    realms: RealmConfig[]; // field name 'realms' is kept for backward compatibility with schema
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

export interface ModForeshadowedEvent {
  title: string;
  description: string;
  relativeTriggerDay: number; // Days from the start of the game
  chance: 'Thấp' | 'Vừa' | 'Cao' | 'Chắc chắn';
}


export interface ModWorldData {
    // FIX: Add missing 'id' property required by ModWorldData type.
    id: string;
    name: string;
    description: string;
    majorEvents: MajorEvent[];
    foreshadowedEvents?: ModForeshadowedEvent[];
    initialNpcs: (Omit<ModNpc, 'id'> & { id?: string })[];
    initialLocations: (Omit<ModLocation, 'id'> & { id?: string })[];
    factions: Faction[];
    startingYear: number;
    eraName: string;
    tags?: string[];
}
// --- END NEW MODDING TYPES ---

// --- NEW: QUICK ACTION BAR MODDING ---
export interface QuickActionButtonConfig {
    id: string; // e.g., 'meditate', 'open_hellgate'
    label: string; // e.g., 'Thiền Định', 'Mở Địa Ngục Môn'
    description: string; // Tooltip text
    iconName: string; // Key from UI_ICONS, e.g., 'GiSprout'
    actionText: string; // The text submitted to the AI, e.g., "ta ngồi xuống thiền định"
}

export interface QuickActionBarConfig {
    id: string; // Unique ID for this bar configuration, e.g., 'city_actions'
    context: {
        type: 'DEFAULT' | 'LOCATION';
        value: string[]; // Array of location IDs for 'LOCATION', empty for 'DEFAULT'
    };
    buttons: QuickActionButtonConfig[];
}
// --- END NEW: QUICK ACTION BAR MODDING ---


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
    tags?: string[];
}

export interface ModInLibrary {
    modInfo: ModInfo;
    isEnabled: boolean;
}

// --- UPDATED ABILITY MODDING TYPES ---
export type AuxiliaryAbilityType = 'Tâm Pháp' | 'Độn Thuật' | 'Luyện Thể' | 'Kiếm Quyết' | 'Thần Thông';
export interface ModAbility {
    id: string;
    name: string;
    description: string;
    type: any; // Simplified for modding
    rank: AbilityRank;
    bonuses?: StatBonus[];
}
export type ModAuxiliaryAbility = Omit<ModAbility, 'id' | 'type'> & {
    id: string;
    type: AuxiliaryAbilityType;
    requirements?: StatBonus[];
    tags?: string[];
};
// --- END UPDATED ABILITY MODDING TYPES ---

export type ContentType = 'item' | 'talent' | 'character' | 'sect' | 'location' | 'worldData' | 'npc' | 'auxiliaryTechnique' | 'event' | 'customPanel' | 'recipe' | 'realm' | 'realmSystem' | 'talentSystem' | 'customDataPack';

export type EventTriggerType = 'ON_ENTER_LOCATION' | 'ON_TALK_TO_NPC' | 'ON_GAME_DATE';
export interface EventTrigger {
    type: EventTriggerType;
    details: Record<string, any>;
}

// FIX: This type is now defined locally as it's a core part of modding events.
export type ModEvent = Omit<GameEvent, 'id' | 'choices'> & {
    id: string;
    name: string;
    trigger?: EventTrigger;
    choices: Array<Omit<EventChoice, 'id' | 'check'> & { outcomes?: EventOutcome[], check?: SkillCheck }>;
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
    worldData?: ModWorldData[];
    auxiliaryTechniques?: Omit<ModAuxiliaryAbility, 'id'>[];
    npcs?: Omit<ModNpc, 'id'>[];
    events?: Omit<ModEvent, 'id'>[];
    recipes?: Omit<AlchemyRecipe, 'id'>[];
    // FIX: Renamed tierConfigs to realmConfigs
    realmConfigs?: RealmConfig[]; // DEPRECATED for new mods, used for single-system mods
    // FIX: Renamed namedProgressionSystems to namedRealmSystems
    namedRealmSystems?: NamedRealmSystem[];
    talentSystemConfig?: TalentSystemConfig;
    talentRanks?: Omit<ModTalentRank, 'id'>[];
    declarations?: ModDeclaration;
    storySystems?: Omit<StorySystem, 'id'>[];
    customPanels?: Omit<ModCustomPanel, 'id'>[];
    customDataPacks?: (Omit<ModCustomDataPack, 'id' | 'data'> & { data: Record<string, any> })[];
    dynamicEvents?: Omit<DynamicModEvent, 'id'>[];
    aiHooks?: AiHooks;
    attributeSystem?: ModAttributeSystem;
    quickActionBars?: QuickActionBarConfig[];
    tagDefinitions?: ModTagDefinition[];
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
