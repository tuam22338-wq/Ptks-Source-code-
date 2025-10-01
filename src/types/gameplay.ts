import type {
    Gender, Element, StatBonus, CharacterAttributes, AbilityRank, ItemQuality, EquipmentSlot, InnateTalentRank,
    Season, TimeOfDay, Weather, AbilityEffect, AbilityType, CurrencyType,
    ItemType, SkillCheck, EventChoice, EventOutcome, Faction, CultivationTechnique
} from './core';
import type { SpiritualRoot, CharacterIdentity, InnateTalent } from './character';
// FIX: Update imports to use renamed types 'RealmConfig' and 'NamedRealmSystem' and remove Faction to avoid circular dependency issues.
import type { FullMod, RealmConfig, ModAttributeSystem, ModEvent, NamedRealmSystem, ModLocation, ModNpc } from './modding';
import type { SystemInfo, NpcDensity, GameplaySettings } from './settings';
import type { MechanicalIntent } from './ai';

// --- New Asset Types ---
export type AssetLoadStatus = 'idle' | 'loading' | 'loaded' | 'error';
export interface BackgroundSet {
    layer1: string;
    layer2: string;
    layer3: string;
    layer4: string;
}
export interface BackgroundState {
    status: Record<string, AssetLoadStatus>;
    urls: Record<string, BackgroundSet>;
}
// --- End Asset Types ---


// --- Save Slot Types ---
export interface SaveSlot {
  id: number;
  data: GameState | null;
}

// --- Timeline Types ---
export interface GameDate {
  era: string; 
  year: number;
  season: Season;
  day: number;
  timeOfDay: TimeOfDay;
  shichen: string;
  weather: Weather;
  actionPoints: number;
  maxActionPoints: number;
}

export interface MajorEvent {
    year: number;
    title: string;
    location: string;
    involvedParties: string;
    summary: string;
    consequences: string;
}

// --- Gameplay Types ---
export type CharacterStatus = 'HEALTHY' | 'LIGHTLY_INJURED' | 'HEAVILY_INJURED' | 'NEAR_DEATH';

export interface ActiveEffect {
    id: string; // Unique instance ID
    name: string;
    source: string; // e.g., 'status_lightly_injured', 'technique_poison_cloud'
    description: string;
    bonuses: StatBonus[];
    duration: number; // in turns, -1 for permanent until condition is met
    isBuff: boolean;
    dot?: { // Damage over time
        damage: number;
        type: 'Sinh Mệnh' | 'Linh Lực';
    };
}

export type Currency = Partial<Record<CurrencyType, number>>;

export interface ResourceNode {
    id: string;
    name: string;
    description: string;
    itemId: string; // ID of the item
    requiredSkill: { attribute: string; value: number };
    apCost: number;
}

export interface Location {
    id: string;
    name: string;
    description: string;
    type: 'Thành Thị' | 'Thôn Làng' | 'Hoang Dã' | 'Sơn Mạch' | 'Thánh Địa' | 'Bí Cảnh' | 'Quan Ải';
    neighbors: string[]; // Array of location IDs
    factionInfluence?: { name: string; level: 'Mạnh' | 'Trung bình' | 'Yếu' | 'Không có' }[];
    isExplorable?: boolean;
    coordinates: { x: number; y: number; };
    resources?: ResourceNode[];
    qiConcentration: number;
    contextualActions?: {
        id: string;
        label: string;
        description: string;
        iconName?: string;
    }[];
    shopIds?: string[];
}

export interface Relationship {
  targetNpcId: string;
  type: string; // e.g., 'Thân tộc', 'Đối địch', 'Sư đồ'
  description: string;
}

// --- NEW NPC MIND STATE ---
export interface EmotionState {
    trust: number; // 0-100
    fear: number;  // 0-100
    anger: number; // 0-100
}

export interface MemoryState {
    shortTerm: string[]; // Recent events, max length of ~5
    longTerm: string[];  // Core, defining memories
}
// --- END NPC MIND STATE ---

// FIX: Renamed ProgressionState to CultivationState
export interface CultivationState {
    currentRealmId: string;
    currentStageId: string;
    spiritualQi: number;
    hasConqueredInnerDemon: boolean;
}

// FIX: Renamed Ability to CultivationTechnique, moved definition to core.ts

export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    quantity: number;
    type: ItemType;
    rank?: AbilityRank;
    icon?: string;
    bonuses?: StatBonus[];
    weight: number;
    quality: ItemQuality;
    value?: number;
    isEquipped?: boolean;
    slot?: EquipmentSlot;
    recipeId?: string;
    vitalEffects?: { vital: string, value: number }[];
}

export interface Inventory {
    items: InventoryItem[];
    weightCapacity: number;
}

// --- NEW NPC WILLPOWER STATE ---
export interface NPC {
    id: string;
    identity: CharacterIdentity;
    status: string;
    attributes: CharacterAttributes;
    talents: InnateTalent[];
    locationId: string;
    relationships?: Relationship[];
    // FIX: Add missing cultivation property
    cultivation: CultivationState;
    // FIX: Add missing techniques property
    techniques: CultivationTechnique[];
    inventory: Inventory;
    currencies: Currency;
    equipment: Partial<Record<EquipmentSlot, InventoryItem | null>>;
    faction?: string;
    isHostile?: boolean;
    dialogueTreeId?: string;
    shopId?: string;
    healthStatus: CharacterStatus;
    activeEffects: ActiveEffect[];
    loot?: { itemId: string; chance: number; min: number; max: number }[];
    tuoiTho: number;
    element?: Element;
    emotions: EmotionState;
    memory: MemoryState;
    motivation: string; // Core drive, e.g., "Protect my family at all costs."
    goals: string[]; // Long-term objectives, e.g., ["Find the cure for my sister's illness", "Become a master blacksmith"]
    currentPlan: string[] | null; // Step-by-step plan to achieve a goal, null if idle.
}

export interface PlayerNpcRelationship {
    npcId: string;
    type: string; // e.g., 'Phụ thân', 'Bằng hữu', 'Thanh mai trúc mã'
    value: number; // e.g., -100 (Hated) to 100 (Loved)
    status: 'Thù địch' | 'Lạnh nhạt' | 'Trung lập' | 'Thân thiện' | 'Tri kỷ';
}

export type FactionReputationStatus = 'Kẻ Địch' | 'Lạnh Nhạt' | 'Trung Lập' | 'Thân Thiện' | 'Đồng Minh';

export interface PlayerReputation {
  factionName: string;
  value: number; // -100 to 100
  status: FactionReputationStatus;
}

export interface DanhVong {
    value: number;
    status: string;
}

// FIX: Renamed ProgressionPath to CultivationPath
export interface CultivationPath {
  id: string;
  name: string;
  description: string;
  requiredRealmId: string; // The tier you must ENTER to be offered this path
  bonuses: StatBonus[];
}

export interface PlayerSectInfo {
  sectId: string;
  rank: string;
  contribution: number;
}

export interface CaveAbode {
    name: string;
    level: number;
    spiritGatheringArrayLevel: number; // Tụ Linh Trận
    spiritHerbFieldLevel: number;     // Linh Điền
    alchemyRoomLevel: number;         // Luyện Đan Thất
    storageUpgradeLevel: number;      // Kho chứa đồ
    locationId: string;
}

// --- Quest System Types ---
export type QuestObjectiveType = 'TRAVEL' | 'GATHER' | 'TALK' | 'DEFEAT';

export interface QuestObjective {
    type: QuestObjectiveType;
    description: string;
    target: string; // Location ID, Item Name, NPC ID, Enemy Tag
    required: number;
    current: number;
    isCompleted: boolean;
}

export interface QuestReward {
    // FIX: Add missing spiritualQi property
    spiritualQi?: number;
    currencies?: Currency;
    items?: { name: string, quantity: number }[];
    danhVong?: number;
    reputation?: { factionName: string; change: number; }[];
}

export interface ActiveQuest {
    id: string;
    title: string;
    description: string;
    type: 'MAIN' | 'SIDE' | 'SYSTEM';
    source: string; // e.g., 'event:tru_vuong_de_tho' or 'npc:npc_khuong_tu_nha' or 'system'
    objectives: QuestObjective[];
    rewards: QuestReward;
    timeLimit?: number; // in game days
    onFailure?: EventOutcome[];
}

export interface InnerDemonTrial {
    challenge: string;
    choices: {
        text: string;
        isCorrect: boolean;
    }[];
}

// --- NEW Player Vitals ---
export interface PlayerVitals {
    temperature: number;
}

export interface PlayerAiHooks {
  on_world_build?: string;
  on_action_evaluate?: string;
  on_narration?: string;
  on_realm_rules?: string;
  on_conditional_rules?: string;
}

export interface PlayerCharacter {
    identity: CharacterIdentity;
    attributes: CharacterAttributes;
    // FIX: Renamed powerSource to spiritualRoot
    spiritualRoot: SpiritualRoot | null;
    inventory: Inventory;
    currencies: Currency;
    // FIX: Add missing cultivation property
    cultivation: CultivationState;
    currentLocationId: string;
    equipment: Partial<Record<EquipmentSlot, InventoryItem | null>>;
    vitals: PlayerVitals;
    
    // FIX: Renamed mainAbilityInfo to mainCultivationTechniqueInfo and abilities to techniques
    mainCultivationTechniqueInfo: { name: string; description: string; } | null;
    techniques: CultivationTechnique[];

    relationships: PlayerNpcRelationship[];
    danhVong: DanhVong;
    reputation: PlayerReputation[];
    chosenPathIds: string[];
    knownRecipeIds: string[];
    sect: PlayerSectInfo | null;
    caveAbode: CaveAbode;
    healthStatus: CharacterStatus;
    activeEffects: ActiveEffect[];
    // FIX: Add missing techniqueCooldowns property
    techniqueCooldowns: Record<string, number>;
    activeQuests: ActiveQuest[];
    completedQuestIds: string[];
    inventoryActionLog: string[];
    element?: Element;
    systemInfo?: SystemInfo;
    playerAiHooks?: PlayerAiHooks;
}

export interface StoryEntry {
    id: number;
    type: 'narrative' | 'dialogue' | 'action-result' | 'system' | 'player-action' | 'player-dialogue' | 'combat' | 'system-notification';
    content: string;
    isPending?: boolean;
    effects?: MechanicalIntent; // Contains the direct consequences of this narrative entry.
}

export interface Rumor {
    id: string;
    locationId: string;
    text: string;
}

export interface DynamicWorldEvent {
  id: string;
  title: string;
  description: string;
  turnStart: number; // Game day number (absolute)
  duration: number; // in game days
  affectedFactions: string[]; // Faction names
  affectedLocationIds: string[]; // Location IDs
}

export interface ForeshadowedEvent {
  id: string;
  title: string;
  description: string;
  turnStart: number; // Game day number it was created
  potentialTriggerDay: number; // Estimated day it might happen
  chance: 'Thấp' | 'Vừa' | 'Cao' | 'Chắc chắn';
}

export interface WorldState {
    rumors: Rumor[];
    dynamicEvents: DynamicWorldEvent[];
    foreshadowedEvents: ForeshadowedEvent[];
    triggeredDynamicEventIds?: Record<string, number>; // stores { eventId: gameDayNumber }
}

export interface ActiveStoryState {
    systemId: string;
    currentNodeId: string;
}

export interface CombatState {
    enemies: NPC[];
    turnOrder: string[]; // Array of IDs ('player' or NPC IDs)
    currentTurnIndex: number;
    combatLog: { turn: number; message: string }[];
}


// --- Player-managed Sect Types ---
export interface SectBuilding {
  id: 'main_hall' | 'disciple_quarters' | 'treasury' | 'alchemy_room' | 'spirit_field';
  name: string;
  level: number;
  description: string;
}

export interface PlayerSectMember extends NPC {
  sectRank: string;
  contribution: number;
}

export interface PlayerSect {
  id: string;
  name: string;
  description: string;
  locationId: string;
  reputation: number;
  members: PlayerSectMember[];
  ranks: SectRank[];
  treasury: Currency;
  buildings: SectBuilding[];
}
// --- End Player-managed Sect Types ---

export type DifficultyLevel = 'rookie' | 'easy' | 'medium' | 'hard' | 'hell';
export type GenerationMode = 'fast' | 'deep' | 'super_deep';
export type DataGenerationMode = 'AI' | 'CUSTOM' | 'NONE';

export interface WorldCreationData extends GameplaySettings {
    genre: string;
    theme: string;
    setting: string;
    mainGoal: string;
    openingStory: string;
    importedMod: FullMod | null;
    fanficMode: boolean;
    // FIX: Add missing 'hardcoreMode' property to align type with its usage.
    hardcoreMode: boolean;
    character: {
        name: string;
        gender: Gender;
        bio: string;
    };
    attributeSystem?: ModAttributeSystem;
    enableRealmSystem: boolean; // Kept for UI state, will be translated to enableProgressionSystem
    realmTemplateId: string; // Kept for UI state, will be translated
    namedRealmSystem: NamedRealmSystem | null; // Updated type
    // FIX: Add missing generationMode to satisfy the GameStartData type requirement in AppContext.
    generationMode: GenerationMode;
    // New data generation controls
    npcGenerationMode: DataGenerationMode;
    locationGenerationMode: DataGenerationMode;
    factionGenerationMode: DataGenerationMode;
    customNpcs: ModNpc[];
    customLocations: ModLocation[];
    customFactions: Faction[];
}

export interface GameState {
    version?: string;
    activeWorldId: string;
    difficulty?: DifficultyLevel;
    playerCharacter: PlayerCharacter;
    activeNpcs: NPC[];
    discoveredLocations: Location[];
    worldState: WorldState;
    gameDate: GameDate;
    storyLog: StoryEntry[];
    lastSaved?: string;
    encounteredNpcIds: string[];
    activeMods: FullMod[];
    activeModIds?: string[];
    // FIX: Rename progressionSystem to realmSystem and use RealmConfig
    realmSystem: RealmConfig[];
    // FIX: Rename progressionSystemInfo to realmSystemInfo
    realmSystemInfo: {
        name: string;
        resourceName: string;
        resourceUnit: string;
    };
    // FIX: Rename namedProgressionSystems to namedRealmSystems
    namedRealmSystems?: NamedRealmSystem[];
    attributeSystem: ModAttributeSystem;
    majorEvents: MajorEvent[];
    activeStory: ActiveStoryState | null;
    combatState: CombatState | null;
    dialogueWithNpcId: string | null;
    dialogueChoices: EventChoice[] | null;
    worldSects?: Sect[];
    eventIllustrations?: { eventId: string; imageUrl: string; narrative: string }[];
    storySummary?: string;
    shopStates?: Record<string, { itemPriceMultipliers: Record<string, number> }>;
    playerStall: PlayerStall | null;
    playerSect: PlayerSect | null;
    isHydrated?: boolean;
    creationData?: {
        npcDensity: NpcDensity;
        generationMode: GenerationMode;
        npcGenerationMode?: DataGenerationMode;
        locationGenerationMode?: DataGenerationMode;
        factionGenerationMode?: DataGenerationMode;
    };
    gameplaySettings: GameplaySettings;
}

// --- Gameplay Event Types ---
export interface GameEvent {
    id: string;
    description: string;
    choices: EventChoice[];
}

// --- Shop Types ---
export interface ShopItem extends Omit<InventoryItem, 'id' | 'quantity'> {
    price: {
        currencyName: CurrencyType;
        amount: number;
    };
    stock: number | 'infinite';
}

export interface PlayerStall {
    locationId: string;
    name: string;
    items: ShopItem[];
    earnings: Currency;
}

export interface Shop {
    id: string;
    name: string;
    description: string;
    inventory: ShopItem[];
}

// --- Sect Types ---
export interface SectRank {
    name: string;
    contributionRequired: number;
}

export interface MissionObjective {
    type: 'GATHER' | 'DEFEAT';
    targetId: string; // item name or enemy tag/name
    quantity: number;
}

export interface MissionReward {
    contribution: number;
    currency?: Currency;
    items?: { name: string, quantity: number }[];
}

export interface SectMission {
    id: string;
    title: string;
    description: string;
    objectives: MissionObjective[];
    rewards: MissionReward;
}

export interface Sect {
    id: string;
    name: string;
    description: string;
    alignment: 'Chính Phái' | 'Ma Phái' | 'Trung Lập';
    ranks: SectRank[];
    joinRequirements: { attribute: string; value: number; greaterThan?: boolean }[];
    missions: SectMission[];
    iconName?: string;
    // FIX: Renamed startingTechnique to use CultivationTechnique type
    startingTechnique?: Omit<CultivationTechnique, 'id' | 'level' | 'maxLevel'>;
}