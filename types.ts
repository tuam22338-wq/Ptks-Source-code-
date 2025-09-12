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
export type AIModel = 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' | 'gemini-2.5-pro';
export type ImageModel = 'imagen-4.0-generate-001';
export type RagEmbeddingModel = 'text-embedding-004';
export type LayoutMode = 'auto' | 'desktop' | 'mobile';
export type GameSpeed = 'very_slow' | 'slow' | 'normal' | 'fast' | 'very_fast';
export type SafetyLevel = 'HARM_BLOCK_THRESHOLD_UNSPECIFIED' | 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
export type NpcDensity = 'low' | 'medium' | 'high';
export type NarrativeStyle = 'classic_wuxia' | 'dark_fantasy' | 'poetic' | 'concise';
// FIX: Add 'theme-celestial-light' to the Theme type to resolve the type error in constants.ts.
export type Theme = 'theme-amber' | 'theme-jade-green' | 'theme-amethyst-purple' | 'theme-celestial-light';


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
    enableAiSoundSystem: boolean;
    masterSafetySwitch: boolean;
    safetyLevels: SafetySettings;
    apiKey: string;
    apiKeys: string[];
    useKeyRotation: boolean;
    enablePerformanceMode: boolean;
    temperature: number;
    topK: number;
    topP: number;
    enableThinking: boolean;
    thinkingBudget: number;
}

// --- Character Creation & Stats Types ---
export interface Attribute {
  name: string;
  description: string;
  value: number | string;
  maxValue?: number;
  icon: ElementType;
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

export type ItemType = 'Vũ Khí' | 'Phòng Cụ' | 'Đan Dược' | 'Pháp Bảo' | 'Tạp Vật' | 'Đan Lô' | 'Linh Dược' | 'Đan Phương';
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
export type TechniqueEffectType = 'DAMAGE' | 'HEAL' | 'BUFF' | 'DEBUFF';
export interface TechniqueEffect {
    type: TechniqueEffectType;
    details: Record<string, any>; 
}

export type ModTechnique = Omit<CultivationTechnique, 'id' | 'effectDescription'> & {
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

// FIX: Redefined ModNpc to be a flat structure for mod creation, resolving editor component errors.
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

// FIX: Define and export ContentType to resolve import error in CreateModScreen.tsx.
export type ContentType = 'item' | 'talent' | 'character' | 'sect' | 'worldBuilding' | 'npc' | 'technique' | 'event' | 'customPanel' | 'realm' | 'realmSystem' | 'talentSystem' | 'recipe';

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
  requiredAttribute: { name: 'Đan Thuật'; value: number };
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

export interface ModStorySystem {
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
    storySystems?: Omit<ModStorySystem, 'id'>[];
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


// AI Action types from GameMaster
export type ChatResponse = { response: string };
export type CreateItemData = Omit<ModItem, 'id'>;
export type CreateTalentData = Omit<ModTalent, 'id'>;
export type CreateSectData = Omit<ModSect, 'id'>;
export type CreateRealmSystemData = Omit<RealmConfig, 'id'>[];
export type ConfigureTalentSystemData = TalentSystemConfig;
export type CreateCharacterData = Omit<ModCharacter, 'id'>;
export type DefineWorldBuildingData = Omit<ModWorldBuilding, 'id'>;
export type CreateTechniqueData = Omit<ModTechnique, 'id'>;
export type CreateNpcData = Omit<ModNpc, 'id'>;
export type CreateEventData = Omit<ModEvent, 'id'>;
export type CreateRecipeData = Omit<AlchemyRecipe, 'id'>;
export type CreateDeclarationData = ModDeclaration;
export type CreateStorySystemData = Omit<ModStorySystem, 'id'>;
export type CreateCustomPanelData = Omit<ModCustomPanel, 'id'>;



export type AIAction =
    | { action: 'CHAT'; data: ChatResponse }
    | { action: 'CREATE_ITEM'; data: CreateItemData }
    | { action: 'CREATE_MULTIPLE_ITEMS'; data: CreateItemData[] }
    | { action: 'CREATE_TALENT'; data: CreateTalentData }
    | { action: 'CREATE_MULTIPLE_TALENTS'; data: CreateTalentData[] }
    | { action: 'CREATE_SECT'; data: CreateSectData }
    | { action: 'CREATE_MULTIPLE_SECTS'; data: CreateSectData[] }
    | { action: 'CREATE_CHARACTER'; data: CreateCharacterData }
    | { action: 'CREATE_MULTIPLE_CHARACTERS'; data: CreateCharacterData[] }
    | { action: 'CREATE_TECHNIQUE'; data: CreateTechniqueData }
    | { action: 'CREATE_MULTIPLE_TECHNIQUES'; data: CreateTechniqueData[] }
    | { action: 'CREATE_NPC'; data: CreateNpcData }
    | { action: 'CREATE_MULTIPLE_NPCS'; data: CreateNpcData[] }
    | { action: 'CREATE_EVENT'; data: CreateEventData }
    | { action: 'CREATE_MULTIPLE_EVENTS'; data: CreateEventData[] }
    | { action: 'CREATE_RECIPE'; data: CreateRecipeData }
    | { action: 'CREATE_MULTIPLE_RECIPES'; data: CreateRecipeData[] }
    | { action: 'DEFINE_WORLD_BUILDING'; data: DefineWorldBuildingData }
    | { action: 'CREATE_REALM_SYSTEM'; data: CreateRealmSystemData }
    | { action: 'CONFIGURE_TALENT_SYSTEM'; data: ConfigureTalentSystemData }
    | { action: 'CREATE_DECLARATIONS'; data: CreateDeclarationData }
    | { action: 'CREATE_STORY_SYSTEM'; data: CreateStorySystemData }
    | { action: 'CREATE_CUSTOM_PANEL'; data: CreateCustomPanelData }
    | { action: 'UPDATE_ITEM', data: CreateItemData }
    | { action: 'DELETE_ITEM', data: { name: string } }
    | { action: 'UPDATE_TALENT', data: CreateTalentData }
    | { action: 'DELETE_TALENT', data: { name: string } }
    | { action: 'UPDATE_SECT', data: CreateSectData }
    | { action: 'DELETE_SECT', data: { name: string } }
    | { action: 'UPDATE_CHARACTER', data: CreateCharacterData }
    | { action: 'DELETE_CHARACTER', data: { name: string } }
    | { action: 'UPDATE_TECHNIQUE', data: CreateTechniqueData }
    | { action: 'DELETE_TECHNIQUE', data: { name: string } }
    | { action: 'UPDATE_NPC', data: CreateNpcData }
    | { action: 'DELETE_NPC', data: { name: string } }
    | { action: 'UPDATE_EVENT', data: CreateEventData }
    | { action: 'DELETE_EVENT', data: { name: string } }
    | { action: 'UPDATE_RECIPE', data: CreateRecipeData }
    | { action: 'DELETE_RECIPE', data: { name: string } }
    | { action: 'UPDATE_WORLD_BUILDING', data: DefineWorldBuildingData }
    | { action: 'DELETE_WORLD_BUILDING', data: { title: string } }
    | { action: 'UPDATE_CUSTOM_PANEL', data: CreateCustomPanelData }
    | { action: 'DELETE_CUSTOM_PANEL', data: { title: string } }
    | { action: 'UPDATE_REPUTATION', data: { factionName: string, change: number } }
    | { 
        action: 'BATCH_ACTIONS'; 
        data: Array<
            | { action: 'CREATE_ITEM'; data: CreateItemData }
            | { action: 'CREATE_MULTIPLE_ITEMS'; data: CreateItemData[] }
            | { action: 'CREATE_TALENT'; data: CreateTalentData }
            | { action: 'CREATE_MULTIPLE_TALENTS'; data: CreateTalentData[] }
            | { action: 'CREATE_SECT'; data: CreateSectData }
            | { action: 'CREATE_MULTIPLE_SECTS'; data: CreateSectData[] }
            | { action: 'CREATE_CHARACTER'; data: CreateCharacterData }
            | { action: 'CREATE_MULTIPLE_CHARACTERS'; data: CreateCharacterData[] }
            | { action: 'CREATE_TECHNIQUE'; data: CreateTechniqueData }
            | { action: 'CREATE_MULTIPLE_TECHNIQUES'; data: CreateTechniqueData[] }
            | { action: 'CREATE_NPC'; data: CreateNpcData }
            | { action: 'CREATE_MULTIPLE_NPCS'; data: CreateNpcData[] }
            | { action: 'CREATE_EVENT'; data: CreateEventData }
            | { action: 'CREATE_MULTIPLE_EVENTS'; data: CreateEventData[] }
            | { action: 'CREATE_RECIPE'; data: CreateRecipeData }
            | { action: 'CREATE_MULTIPLE_RECIPES'; data: CreateRecipeData[] }
            | { action: 'DEFINE_WORLD_BUILDING'; data: DefineWorldBuildingData }
            | { action: 'CREATE_REALM_SYSTEM'; data: CreateRealmSystemData }
            | { action: 'CONFIGURE_TALENT_SYSTEM'; data: ConfigureTalentSystemData }
            | { action: 'CREATE_DECLARATIONS'; data: CreateDeclarationData }
            | { action: 'CREATE_STORY_SYSTEM'; data: CreateStorySystemData }
            | { action: 'CREATE_CUSTOM_PANEL'; data: CreateCustomPanelData }
            | { action: 'UPDATE_ITEM', data: CreateItemData }
            | { action: 'DELETE_ITEM', data: { name: string } }
            | { action: 'UPDATE_TALENT', data: CreateTalentData }
            | { action: 'DELETE_TALENT', data: { name: string } }
            | { action: 'UPDATE_SECT', data: CreateSectData }
            | { action: 'DELETE_SECT', data: { name: string } }
            | { action: 'UPDATE_CHARACTER', data: CreateCharacterData }
            | { action: 'DELETE_CHARACTER', data: { name: string } }
            | { action: 'UPDATE_TECHNIQUE', data: CreateTechniqueData }
            | { action: 'DELETE_TECHNIQUE', data: { name: string } }
            | { action: 'UPDATE_NPC', data: CreateNpcData }
            | { action: 'DELETE_NPC', data: { name: string } }
            | { action: 'UPDATE_EVENT', data: CreateEventData }
            | { action: 'DELETE_EVENT', data: { name: string } }
            | { action: 'UPDATE_RECIPE', data: CreateRecipeData }
            | { action: 'DELETE_RECIPE', data: { name: string } }
            | { action: 'UPDATE_WORLD_BUILDING', data: DefineWorldBuildingData }
            | { action: 'DELETE_WORLD_BUILDING', data: { title: string } }
            | { action: 'UPDATE_CUSTOM_PANEL', data: CreateCustomPanelData }
            | { action: 'DELETE_CUSTOM_PANEL', data: { title: string } }
            | { action: 'UPDATE_REPUTATION', data: { factionName: string, change: number } }
        > 
      };

// --- Gameplay Types ---
export interface Currency {
    [key: string]: number;
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
}

export interface Relationship {
  targetNpcId: string;
  type: string; // e.g., 'Thân tộc', 'Đối địch', 'Sư đồ'
  description: string;
}

export interface NPC {
    id: string;
    identity: Omit<CharacterIdentity, 'age' | 'gender'> & { gender?: Gender };
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
    // FIX: Add optional properties to align with AI-generated data and context building.
    ChinhDao?: number;
    MaDao?: number;
    TienLuc?: number;
    PhongNgu?: number;
    SinhMenh?: number;
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
    effectDescription: string;
    rank: PhapBaoRank;
    icon: string;
    level: number;
    maxLevel: number;
    levelBonuses?: { level: number, bonuses: StatBonus[] }[];
}

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


export interface PlayerCharacter {
    identity: CharacterIdentity;
    attributes: AttributeGroup[];
    talents: InnateTalent[];
    inventory: Inventory;
    currencies: Currency;
    cultivation: CultivationState;
    currentLocationId: string;
    equipment: Partial<Record<EquipmentSlot, InventoryItem | null>>;
    techniques: CultivationTechnique[];
    relationships: PlayerNpcRelationship[];
    reputation: PlayerReputation[];
    chosenPathIds: string[];
    knownRecipeIds: string[];
}

export interface StoryEntry {
    id: number;
    type: 'narrative' | 'dialogue' | 'action-result' | 'system' | 'player-action' | 'player-dialogue';
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