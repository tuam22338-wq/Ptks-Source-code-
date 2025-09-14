import type { ElementType } from 'react';

// --- Generic Types ---
export interface Faction {
  name: string;
  description: string;
  imageUrl: string;
}

// --- Save Slot Types ---
export interface SaveSlot {
  id: number;
  data: GameState | null;
}


// --- Settings Types ---
// FIX: Per Gemini guidelines, only 'gemini-2.5-flash' is permitted for general text tasks.
export type AIModel = 'gemini-2.5-flash';
export type ImageModel = 'imagen-4.0-generate-001';
export type RagEmbeddingModel = 'text-embedding-004';
export type LayoutMode = 'auto' | 'desktop' | 'mobile';
export type GameSpeed = 'very_slow' | 'slow' | 'normal' | 'fast' | 'very_fast';
export type SafetyLevel = 'HARM_BLOCK_THRESHOLD_UNSPECIFIED' | 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
export type NpcDensity = 'low' | 'medium' | 'high';
export type NarrativeStyle = 'classic_wuxia' | 'dark_fantasy' | 'poetic' | 'concise';
export type Theme = 'theme-amber' | 'theme-jade-green' | 'theme-amethyst-purple' | 'theme-celestial-light' | 'theme-blood-moon' | 'theme-bamboo-forest';


export interface SafetySettings {
    harassment: SafetyLevel;
    hateSpeech: SafetyLevel;
    sexuallyExplicit: SafetyLevel;
    dangerousContent: SafetyLevel;
}

export interface GameSettings {
    layoutMode: LayoutMode;
    gameSpeed: GameSpeed;
    narrativeStyle: NarrativeStyle;
    fontFamily: string;
    theme: Theme;
    backgroundImage: string;
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
    imageGenerationModel: ImageModel;
    ragSummaryModel: AIModel;
    ragSourceIdModel: AIModel;
    ragEmbeddingModel: RagEmbeddingModel;
    autoSummaryFrequency: number;
    ragTopK: number;
    historyTokenLimit: number;
    summarizeBeforePruning: boolean;
    itemsPerPage: number;
    storyLogItemsPerPage: number;
    enableAiSoundSystem: boolean;
    masterSafetySwitch: boolean;
    safetyLevels: SafetySettings;
    enablePerformanceMode: boolean;
    temperature: number;
    topK: number;
    topP: number;
    enableThinking: boolean;
    thinkingBudget: number;
    enableDeveloperConsole: boolean;
}

// --- Character Creation & Stats Types ---
export interface Attribute {
  name: string;
  description: string;
  value: number | string;
  maxValue?: number;
  icon?: ElementType;
}

export interface AttributeGroup {
  title: string;
  attributes: Attribute[];
}

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
  era: 'Tiên Phong Thần';
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
    bonuses: StatBonus[];
    tags: string[];
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

export interface ModWorldBuilding {
    id: string;
    title: string;
    description: string;
    data: Record<string, any>;
    tags: string[];
    storySystemId?: string;
}

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

export type ModTechnique = Omit<CultivationTechnique, 'id'> & {
    id: string;
    requirements?: StatBonus[];
    effects?: TechniqueEffect[];
    tags?: string[];
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

export type ContentType = 'item' | 'talent' | 'character' | 'sect' | 'worldBuilding' | 'npc' | 'technique' | 'event' | 'customPanel' | 'recipe' | 'realm' | 'realmSystem' | 'talentSystem';

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

export interface ModContent {
    items?: Omit<ModItem, 'id'>[];
    talents?: Omit<ModTalent, 'id'>[];
    characters?: Omit<ModCharacter, 'id'>[];
    sects?: Omit<ModSect, 'id'>[];
    worldBuilding?: Omit<ModWorldBuilding, 'id'>[];
    techniques?: Omit<ModTechnique, 'id'>[];
    npcs?: Omit<ModNpc, 'id'>[];
    events?: Omit<ModEvent, 'id'>[];
    recipes?: Omit<AlchemyRecipe, 'id'>[];
    realmConfigs?: Omit<RealmConfig, 'id'>[];
    talentSystemConfig?: TalentSystemConfig;
    talentRanks?: Omit<ModTalentRank, 'id'>[];
    declarations?: ModDeclaration;
    storySystems?: Omit<StorySystem, 'id'>[];
    customPanels?: Omit<ModCustomPanel, 'id'>[];
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

// --- New AI Content Generation Types ---
export type ModContentObject =
    | (Omit<ModItem, 'id'> & { contentType: 'item' })
    | (Omit<ModTalent, 'id'> & { contentType: 'talent' })
    | (Omit<ModCharacter, 'id'> & { contentType: 'character' })
    | (Omit<ModSect, 'id'> & { contentType: 'sect' })
    | (Omit<ModWorldBuilding, 'id'> & { contentType: 'worldBuilding' })
    | (Omit<ModNpc, 'id'> & { contentType: 'npc' })
    | (Omit<ModTechnique, 'id'> & { contentType: 'technique' })
    | (Omit<ModEvent, 'id'> & { contentType: 'event' })
    | (Omit<AlchemyRecipe, 'id'> & { contentType: 'recipe' })
    | (Omit<ModCustomPanel, 'id'> & { contentType: 'customPanel' });

export interface AiGeneratedModData {
    content?: ModContentObject[];
    realmConfigs?: Omit<RealmConfig, 'id'>[];
    talentSystemConfig?: TalentSystemConfig;
}

export type AIActionType =
    | 'CHAT'
    | 'CREATE_ITEM' | 'CREATE_MULTIPLE_ITEMS' | 'CREATE_TALENT' | 'CREATE_MULTIPLE_TALENTS' | 'CREATE_SECT' | 'CREATE_MULTIPLE_SECTS' | 'CREATE_CHARACTER' | 'CREATE_MULTIPLE_CHARACTERS'
    | 'DEFINE_WORLD_BUILDING' | 'CREATE_TECHNIQUE' | 'CREATE_NPC' | 'CREATE_EVENT' | 'CREATE_RECIPE' | 'CREATE_CUSTOM_PANEL'
    | 'UPDATE_ITEM' | 'UPDATE_TALENT' | 'UPDATE_SECT' | 'UPDATE_CHARACTER' | 'UPDATE_TECHNIQUE' | 'UPDATE_NPC' | 'UPDATE_EVENT' | 'UPDATE_RECIPE' | 'UPDATE_WORLD_BUILDING' | 'UPDATE_CUSTOM_PANEL'
    | 'DELETE_ITEM' | 'DELETE_TALENT' | 'DELETE_SECT' | 'DELETE_CHARACTER' | 'DELETE_TECHNIQUE' | 'DELETE_NPC' | 'DELETE_EVENT' | 'DELETE_RECIPE' | 'DELETE_WORLD_BUILDING' | 'DELETE_CUSTOM_PANEL'
    | 'CREATE_REALM_SYSTEM' | 'CONFIGURE_TALENT_SYSTEM' | 'BATCH_ACTIONS';

export interface AIAction {
    action: AIActionType;
    data: any;
}

// Client-side representation of content in the mod editor
export type AddedContentUnion = 
    (ModItem & { contentType: 'item' }) |
    (ModTalent & { contentType: 'talent' }) |
    (ModCharacter & { contentType: 'character' }) |
    (ModSect & { contentType: 'sect' }) |
    (ModWorldBuilding & { contentType: 'worldBuilding' }) |
    (ModNpc & { contentType: 'npc' }) |
    (ModTechnique & { contentType: 'technique' }) |
    (ModEvent & { contentType: 'event' }) |
    (AlchemyRecipe & { contentType: 'recipe' }) |
    (ModCustomPanel & { contentType: 'customPanel' });


// --- Gameplay Types ---
export type CharacterStatus = 'HEALTHY' | 'LIGHTLY_INJURED' | 'HEAVILY_INJURED' | 'NEAR_DEATH';

export interface ActiveEffect {
    id: string; // Unique instance ID
    name: string;
    source: string; // e.g., 'status_lightly_injured', 'technique_poison_cloud'
    description: string;
    bonuses: StatBonus[];
    duration: number; // in turns
    isBuff: boolean;
    dot?: { // Damage over time
        damage: number;
        type: 'Sinh Mệnh' | 'Linh Lực';
    };
}

export interface Currency {
  /**
   * Phàm Tệ (Mundane Currency):
   * - Đồng: Copper coins
   * - Bạc: Silver coins
   * - Vàng: Gold coins
   * Linh Tệ (Spiritual Currency):
   * - Linh thạch hạ phẩm: Low-grade spirit stones
   * - Linh thạch trung phẩm: Mid-grade spirit stones
   * - Linh thạch thượng phẩm: High-grade spirit stones
   * - Linh thạch cực phẩm: Peak-grade spirit stones
   * Tiên Tệ (Immortal Currency):
   * - Tiên Ngọc: Immortal Jade
   * Đặc Biệt (Special Currency):
   * - Điểm Cống Hiến Tông Môn: Sect Contribution Points
   * - Điểm Danh Vọng: Reputation Points
   */
  [key: string]: number;
}

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
        icon?: ElementType;
    }[];
}

export interface Relationship {
  targetNpcId: string;
  type: string; // e.g., 'Thân tộc', 'Đối địch', 'Sư đồ'
  description: string;
}

export interface NPC {
    id: string;
    identity: CharacterIdentity;
    status: string;
    attributes: AttributeGroup[];
    talents: InnateTalent[];
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

export type CultivationTechniqueType = 'Linh Kỹ' | 'Thần Thông' | 'Độn Thuật' | 'Tuyệt Kỹ';

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
}


// --- New Main Cultivation Technique System ---
export type SkillTreeNodeType = 'passive_bonus' | 'active_skill' | 'core_enhancement';

export interface SkillTreeNode {
    id: string;
    name: string;
    description: string;
    icon: string;
    realmRequirement: string; // ID of the realm, e.g., 'luyen_khi'
    cost: number; // Technique points to unlock
    isUnlocked: boolean;
    type: SkillTreeNodeType;
    childrenIds: string[];
    position: { x: number; y: number }; // For rendering the tree
    bonuses?: StatBonus[];
    activeSkill?: Omit<CultivationTechnique, 'id' | 'level' | 'maxLevel'>;
}

export interface MainCultivationTechnique {
    id: string;
    name: string;
    description: string;
    skillTreeNodes: Record<string, SkillTreeNode>; // Keyed by node ID
}
// --- End New System ---


export interface PlayerNpcRelationship {
    npcId: string;
    value: number; // e.g., -100 (Hated) to 100 (Loved)
    status: 'Thù địch' | 'Lạnh nhạt' | 'Trung lập' | 'Thân thiện' | 'Tri kỷ';
}

export type FactionReputationStatus = 'Kẻ Địch' | 'Lạnh Nhạt' | 'Trung Lập' | 'Thân Thiện' | 'Đồng Minh';

export interface PlayerReputation {
  factionName: string;
  value: number; // -100 to 100
  status: FactionReputationStatus;
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

export interface ActiveMission {
    missionId: string;
    progress: number;
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

export interface PlayerCharacter {
    identity: CharacterIdentity;
    attributes: AttributeGroup[];
    talents: InnateTalent[];
    inventory: Inventory;
    currencies: Currency;
    cultivation: CultivationState;
    currentLocationId: string;
    equipment: Partial<Record<EquipmentSlot, InventoryItem | null>>;
    
    // New Technique System
    mainCultivationTechnique: MainCultivationTechnique | null;
    auxiliaryTechniques: CultivationTechnique[];
    techniquePoints: number;

    relationships: PlayerNpcRelationship[];
    reputation: PlayerReputation[];
    chosenPathIds: string[];
    knownRecipeIds: string[];
    sect: PlayerSectInfo | null;
    caveAbode: CaveAbode;
    healthStatus: CharacterStatus;
    activeEffects: ActiveEffect[];
    techniqueCooldowns: Record<string, number>;
    activeMissions: ActiveMission[];
    inventoryActionLog: string[];
}

export interface StoryEntry {
    id: number;
    type: 'narrative' | 'dialogue' | 'action-result' | 'system' | 'player-action' | 'player-dialogue' | 'combat';
    content: string;
}

export interface Rumor {
    id: string;
    locationId: string;
    text: string;
}

export interface WorldState {
    rumors: Rumor[];
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


export interface GameState {
    version?: string;
    playerCharacter: PlayerCharacter;
    activeNpcs: NPC[];
    discoveredLocations: Location[];
    worldState: WorldState;
    gameDate: GameDate;
    storyLog: StoryEntry[];
    lastSaved?: string;
    encounteredNpcIds: string[];
    activeMods: FullMod[];
    realmSystem: RealmConfig[];
    activeStory: ActiveStoryState | null;
    combatState: CombatState | null;
    dialogueWithNpcId: string | null;
    dialogueChoices: string[] | null;
    worldSects?: Sect[];
    eventIllustrations?: { eventId: string; imageUrl: string; narrative: string }[];
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
        currency: string;
        amount: number;
    };
    stock: number | 'infinite';
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
    icon?: ElementType;
}
