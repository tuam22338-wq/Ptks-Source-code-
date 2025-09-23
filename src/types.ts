


// FIX: Import ElementType for local use and re-export it for other modules, resolving multiple 'Cannot find name' errors.
import type { ElementType } from 'react';
export type { ElementType };


// --- Generic Types ---
export interface Faction {
  name: string;
  description: string;
  imageUrl: string;
}

export type Element = 'Kim' | 'Mộc' | 'Thủy' | 'Hỏa' | 'Thổ' | 'Vô' | 'Dị' | 'Hỗn Độn';


// --- New Spiritual Root System Types ---
export type SpiritualRootQuality = 'Phàm Căn' | 'Linh Căn' | 'Địa Căn' | 'Thiên Căn' | 'Thánh Căn';

export interface SpiritualRoot {
  elements: { type: Element; purity: number }[]; // Purity from 1-100
  quality: SpiritualRootQuality;
  name: string; // e.g., "Hỏa Thiên Linh Căn", "Kim Mộc Thủy Tạp Linh Căn"
  description: string;
  bonuses: StatBonus[];
}
// --- End New System ---


// --- Save Slot Types ---
export interface SaveSlot {
  id: number;
  data: GameState | null;
}


// --- Settings Types ---
// Per Gemini guidelines, only 'gemini-2.5-flash' is permitted for general text tasks.
export type AIModel = 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.5-flash-lite' | 'gemini-2.5-flash-lite-preview-06-17' | 'gemini-2.5-flash-preview-05-20' | 'gemini-2.5-flash-preview-04-17';
export type ImageModel = 'imagen-4.0-generate-001';
export type RagEmbeddingModel = 'text-embedding-004';
export type LayoutMode = 'auto' | 'desktop' | 'mobile';
export type GameSpeed = 'very_slow' | 'slow' | 'normal' | 'fast' | 'very_fast';
export type SafetyLevel = 'HARM_BLOCK_THRESHOLD_UNSPECIFIED' | 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
export type NpcDensity = 'low' | 'medium' | 'high';
export type NarrativeStyle = 'classic_wuxia' | 'dark_fantasy' | 'poetic' | 'concise';
export type Theme = 'theme-bamboo-forest' | 'theme-sunrise-peak' | 'theme-bich-du-cung' | 'theme-ngoc-hu-cung' | 'theme-huyet-sat-ma-dien' | 'theme-thuy-mac-hoa';
export type DifficultyLevel = 'rookie' | 'easy' | 'medium' | 'hard' | 'hell';
export type AiSyncMode = 'classic' | 'intent_driven';

// New Detailed Gameplay Settings Types
export type AiCreativityLevel = 'grounded' | 'balanced' | 'free';
export type NarrativePacing = 'slow' | 'medium' | 'fast';
export type PlayerAgencyLevel = 'max' | 'balanced' | 'full';
export type AiMemoryDepth = 'short' | 'balanced' | 'full';

export type NpcComplexity = 'basic' | 'advanced' | 'full_simulation';
export type WorldEventFrequency = 'rare' | 'occasional' | 'frequent' | 'chaotic';
export type WorldReactivity = 'passive' | 'dynamic' | 'living';

export type DeathPenalty = 'none' | 'resource_loss' | 'realm_loss' | 'permadeath';
export type ValidationServiceCap = 'strict' | 'relaxed' | 'disabled';


export interface SafetySettings {
    harassment: SafetyLevel;
    hateSpeech: SafetyLevel;
    sexuallyExplicit: SafetyLevel;
    dangerousContent: SafetyLevel;
}

export type AssignableModel = 
    | 'mainTaskModel' | 'quickSupportModel' | 'itemAnalysisModel' | 'itemCraftingModel' 
    | 'soundSystemModel' | 'actionAnalysisModel' | 'gameMasterModel' | 'npcSimulationModel' 
    | 'dataParsingModel' | 'imageGenerationModel' | 'ragSummaryModel' | 'ragSourceIdModel'
    | 'ragEmbeddingModel' | 'ragOrchestratorModel'
    | 'memorySynthesisModel'
    | 'narrativeHarmonizerModel';

export interface BackgroundImageFilters {
  hue: number; // 0-360
  brightness: number; // 0-200
  saturate: number; // 0-200
}

export interface GameSettings {
    layoutMode: LayoutMode;
    gameSpeed: GameSpeed;
    narrativeStyle: NarrativeStyle;
    fontFamily: string;
    theme: Theme;
    backgroundImage: string;
    backgroundImageFilters: BackgroundImageFilters;
    zoomLevel: number;
    textColor: string;
    mainTaskModel: AIModel;
    quickSupportModel: AIModel;
    itemAnalysisModel: AIModel;
    itemCraftingModel: AIModel;
    soundSystemModel: AIModel;
    actionAnalysisModel: AIModel;
    gameMasterModel: AIModel;
    npcSimulationModel: AIModel;
    dataParsingModel: AIModel;
    imageGenerationModel: ImageModel;
    ragSummaryModel: AIModel;
    ragSourceIdModel: AIModel;
    ragEmbeddingModel: RagEmbeddingModel;
    ragOrchestratorModel: AIModel;
    memorySynthesisModel: AIModel;
    narrativeHarmonizerModel: AIModel;
    autoSummaryFrequency: number;
    ragTopK: number;
    historyTokenLimit: number;
    summarizeBeforePruning: boolean;
    itemsPerPage: number;
    aiResponseWordCount: number;
    enableAiSoundSystem: boolean;
    masterSafetySwitch: boolean;
    enableNsfwMode: boolean;
    safetyLevels: SafetySettings;
    enablePerformanceMode: boolean;
    temperature: number;
    topK: number;
    topP: number;
    enableThinking: boolean;
    thinkingBudget: number;
    apiKeys: string[];
    modelApiKeyAssignments: Partial<Record<AssignableModel, string>>;
    enableDeveloperConsole: boolean;
    backgroundMusicUrl: string;
    backgroundMusicName: string;
    backgroundMusicVolume: number;
    enableTTS: boolean;
    ttsVoiceURI: string;
    ttsRate: number;
    ttsPitch: number;
    ttsVolume: number;
    aiSyncMode: AiSyncMode;

    // New Detailed Gameplay Settings
    aiCreativityLevel: AiCreativityLevel;
    narrativePacing: NarrativePacing;
    playerAgencyLevel: PlayerAgencyLevel;
    aiMemoryDepth: AiMemoryDepth;
    npcComplexity: NpcComplexity;
    worldEventFrequency: WorldEventFrequency;
    worldReactivity: WorldReactivity;
    cultivationRateMultiplier: number;
    resourceRateMultiplier: number;
    damageDealtMultiplier: number;
    damageTakenMultiplier: number;
    enableSurvivalMechanics: boolean;
    deathPenalty: DeathPenalty;
    validationServiceCap: ValidationServiceCap;
}

// --- Character Creation & Stats Types ---

// NEW: Universal Attribute Framework
export interface AttributeDefinition {
  id: string; 
  name: string; 
  description: string;
  iconName: string; 
  type: 'PRIMARY' | 'SECONDARY' | 'VITAL' | 'INFORMATIONAL';
  baseValue?: number;
  formula?: string;
  tags?: string[];
  group: string;
}

export interface AttributeGroupDefinition {
    id: string;
    name: string;
    order: number;
}

export type CharacterAttributes = Record<string, {
    value: number;
    maxValue?: number;
}>;

// END: Universal Attribute Framework

export type InnateTalentRank = 'Phàm Giai' | 'Siêu Phàm Giai' | 'Sơ Tiên Giai' | 'Trung Tiên Giai' | 'Hậu Tiên Giai' | 'Đại Tiên Giai' | 'Thánh Giai';

export interface InnateTalent {
  name: string;
  description: string;
  rank: InnateTalentRank;
  effect: string;
  bonuses?: StatBonus[];
  triggerCondition?: string; // e.g., "Khi sinh mệnh dưới 20%"
  synergy?: string; // e.g., "Mạnh hơn khi trang bị kiếm"
}

export type Gender = 'Nam' | 'Nữ';

export interface CharacterIdentity {
  name: string;
  origin: string;
  appearance: string;
  gender: Gender;
  personality: string;
  age: number;
  familyName?: string;
}

// --- Timeline Types ---
export type Season = 'Xuân' | 'Hạ' | 'Thu' | 'Đông';
export type TimeOfDay = 'Sáng Sớm' | 'Buổi Sáng' | 'Buổi Trưa' | 'Buổi Chiều' | 'Hoàng Hôn' | 'Buổi Tối' | 'Nửa Đêm';
export type Weather = 'SUNNY' | 'CLOUDY' | 'RAIN' | 'STORM' | 'SNOW';

export interface GameDate {
  era: string; // Changed from 'Tiên Phong Thần' to string to support custom worlds
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

// --- Modding Types ---

export type ItemType = 'Vũ Khí' | 'Phòng Cụ' | 'Đan Dược' | 'Pháp Bảo' | 'Tạp Vật' | 'Đan Lô' | 'Linh Dược' | 'Đan Phương' | 'Nguyên Liệu';
export type PhapBaoRank = 'Phàm Giai' | 'Tiểu Giai' | 'Trung Giai' | 'Cao Giai' | 'Siêu Giai' | 'Địa Giai' | 'Thiên Giai' | 'Thánh Giai';
export type ItemQuality = 'Phàm Phẩm' | 'Linh Phẩm' | 'Pháp Phẩm' | 'Bảo Phẩm' | 'Tiên Phẩm' | 'Tuyệt Phẩm';
export type EquipmentSlot = 'Vũ Khí' | 'Thượng Y' | 'Hạ Y' | 'Giày' | 'Phụ Kiện 1' | 'Phụ Kiện 2';


export interface StatBonus {
  attribute: string;
  value: number;
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
    vitalEffects?: { vital: 'hunger' | 'thirst', value: number }[];
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

// Advanced Modding Types
export type TechniqueEffectType = 'DAMAGE' | 'HEAL' | 'BUFF' | 'DEBUFF' | 'APPLY_EFFECT';
export interface TechniqueEffect {
    type: TechniqueEffectType;
    details: Record<string, any>; 
}

// --- UPDATED TECHNIQUE MODDING TYPES ---
export type AuxiliaryTechniqueType = 'Tâm Pháp' | 'Độn Thuật' | 'Luyện Thể' | 'Kiếm Quyết' | 'Thần Thông';

export type ModAuxiliaryTechnique = Omit<CultivationTechnique, 'id' | 'type'> & {
    id: string;
    type: AuxiliaryTechniqueType;
    requirements?: StatBonus[];
    tags?: string[];
};
// --- END UPDATED TECHNIQUE MODDING TYPES ---


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

export type CurrencyType = 
    | 'Đồng' | 'Bạc' | 'Vàng' 
    | 'Linh thạch hạ phẩm' | 'Linh thạch trung phẩm' | 'Linh thạch thượng phẩm' | 'Linh thạch cực phẩm'
    | 'Tiên Ngọc'
    | 'Điểm Cống Hiến Tông Môn' | 'Điểm Danh Vọng' | 'Điểm Nguồn';

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

// --- NEW NPC WILLPOWER STATE ---
export interface NPC {
    id: string;
    identity: CharacterIdentity;
    status: string;
    attributes: CharacterAttributes;
    talents: InnateTalent[]; // NPCs still use talents for now
    locationId: string;
    relationships?: Relationship[];
    cultivation: CultivationState;
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

export interface InventoryItem {
    id: string;
    name: string;
    description: string;
    quantity: number;
    type: ItemType;
    rank?: PhapBaoRank;
    icon?: string;
    bonuses?: StatBonus[];
    weight: number;
    quality: ItemQuality;
    value?: number;
    isEquipped?: boolean;
    slot?: EquipmentSlot;
    recipeId?: string;
    vitalEffects?: { vital: 'hunger' | 'thirst', value: number }[];
}

export interface Inventory {
    items: InventoryItem[];
    weightCapacity: number;
}

export interface CultivationState {
    currentRealmId: string;
    currentStageId: string;
    spiritualQi: number;
    hasConqueredInnerDemon: boolean;
}

export type CultivationTechniqueType = 'Linh Kỹ' | 'Thần Thông' | 'Độn Thuật' | 'Tuyệt Kỹ' | 'Tâm Pháp' | 'Luyện Thể' | 'Kiếm Quyết';

export interface CultivationTechnique {
    id: string;
    name: string;
    description: string;
    type: CultivationTechniqueType;
    cost: {
        type: 'Linh Lực' | 'Sinh Mệnh' | 'Nguyên Thần';
        value: number;
    };
    cooldown: number; // in turns/actions, 0 for no cooldown
    effects: TechniqueEffect[];
    rank: PhapBaoRank;
    icon: string;
    level: number;
    maxLevel: number;
    levelBonuses?: { level: number, bonuses: StatBonus[] }[];
    element?: Element;
    requirements?: StatBonus[];
    tags?: string[];
    bonuses?: StatBonus[];
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

export interface CultivationPath {
  id: string;
  name: string;
  description: string;
  requiredRealmId: string; // The realm you must ENTER to be offered this path
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
    spiritualQi?: number;
    currencies?: Currency;
    items?: { name: string; quantity: number }[];
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

// --- New Transmigrator System Types ---
export interface SystemShopItem {
    id: string;
    name: string;
    description: string;
    cost: number; // in System Points
    effect: EventOutcome;
    stock?: number;
}

export type SystemFeature = 'status' | 'quests' | 'store' | 'analysis';

export interface SystemInfo {
    unlockedFeatures: SystemFeature[];
}
// --- End Transmigrator System Types ---

// --- NEW Player Vitals ---
export interface PlayerVitals {
    hunger: number;
    maxHunger: number;
    thirst: number;
    maxThirst: number;
    temperature: number;
}

export interface PlayerCharacter {
    identity: CharacterIdentity;
    attributes: CharacterAttributes;
    spiritualRoot: SpiritualRoot | null;
    inventory: Inventory;
    currencies: Currency;
    cultivation: CultivationState;
    currentLocationId: string;
    equipment: Partial<Record<EquipmentSlot, InventoryItem | null>>;
    vitals: PlayerVitals;
    
    // New Simplified Technique System
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
    techniqueCooldowns: Record<string, number>;
    activeQuests: ActiveQuest[];
    completedQuestIds: string[];
    inventoryActionLog: string[];
    element?: Element;
    systemInfo?: SystemInfo;
}

export interface StoryEntry {
    id: number;
    type: 'narrative' | 'dialogue' | 'action-result' | 'system' | 'player-action' | 'player-dialogue' | 'combat' | 'system-notification';
    content: string;
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
    dynamicEvents?: DynamicWorldEvent[];
    foreshadowedEvents?: ForeshadowedEvent[];
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


export interface GameState {
    version?: string;
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
    realmSystem: RealmConfig[];
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
}

// --- Gameplay Event Types ---
export interface SkillCheck {
    attribute: string; // Name of the attribute to check against, e.g., 'Thân Pháp'
    difficulty: number; // The DC (Difficulty Class) of the check
}

export interface EventChoice {
    id: string; // Unique ID for the choice
    text: string;
    check: SkillCheck | null; // null means no check is required
}

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
    startingTechnique?: Omit<CultivationTechnique, 'id' | 'level' | 'maxLevel'>;
}

// --- AI Memory System Types ---
export interface EntityReference {
  id: string; // ID of the entity (e.g., 'npc_khuong_tu_nha', 'item_123', 'player')
  type: 'player' | 'npc' | 'item' | 'location' | 'quest' | 'technique' | 'faction';
  name: string; // Display name for easier debugging
}

export interface MemoryFragment {
  id?: number; // Auto-incremented primary key
  slotId: number; // Foreign key to the save slot
  gameDate: GameDate;
  type: StoryEntry['type'];
  content: string;
  entities: EntityReference[];
}

export type RelationshipType = 
  | 'TALKED_TO' 
  | 'VISITED' 
  | 'ACQUIRED' 
  | 'USED_ITEM_ON' 
  | 'DEFEATED' 
  | 'QUEST_START' 
  | 'QUEST_COMPLETE';

export interface GraphEdge {
  id?: number; // Auto-incremented primary key
  slotId: number; // Foreign key to the save slot
  source: EntityReference;
  target: EntityReference;
  type: RelationshipType;
  memoryFragmentId: number; // Foreign key to the memory fragment that generated this edge
  gameDate: GameDate;
}

// --- RAG System Types ---
export type RagSourceType = 'CORE_LORE' | 'CORE_MECHANICS' | 'MOD' | 'PLAYER_JOURNAL' | 'SESSION_MEMORY';
export type RagSourceStatus = 'UNINDEXED' | 'INDEXING' | 'INDEXED' | 'ERROR';

export interface RagSource {
  id: string; // e.g., 'core_events', 'player_journal_1', 'mod_hac_am'
  name: string; // "Lịch sử Phong Thần", "Nhật ký của Lý Thanh Vân"
  type: RagSourceType;
  status: RagSourceStatus;
  lastIndexed: string | null;
  isEnabled: boolean;
  content?: string; // Only for player-added sources before indexing
}

export interface RagEmbedding {
  id?: number;
  sourceId: string; // Foreign key to RagSource
  chunk: string; // The actual text chunk
  embedding: number[]; // The vector embedding
}


// --- Thien Co Luan Hoi (State Sync) Types ---
export interface MechanicalIntent {
    statChanges?: { attribute: string; change: number; }[];
    currencyChanges?: { currencyName: CurrencyType; change: number; }[];
    itemsGained?: Omit<InventoryItem, 'id' | 'quantity' | 'isEquipped'> & { quantity?: number }[];
    itemsLost?: { name: string; quantity: number; }[];
    newTechniques?: Omit<CultivationTechnique, 'id' | 'level' | 'maxLevel' | 'effects'>[];
    newQuests?: Partial<ActiveQuest>[];
    newEffects?: Omit<ActiveEffect, 'id'>[];
    npcEncounters?: string[]; // Names of newly encountered NPCs
    locationChange?: string; // New location ID
    timeJump?: { years?: number; seasons?: number; days?: number; };
    emotionChanges?: { npcName: string; emotion: 'trust' | 'fear' | 'anger'; change: number; reason: string; }[];
    systemActions?: { actionType: string; details: Record<string, any>; }[];
    dialogueChoices?: EventChoice[];
}

export interface AIResponsePayload {
    narrative: string;
    mechanicalIntent: MechanicalIntent;
}