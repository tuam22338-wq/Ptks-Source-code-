import type { GameDate, StoryEntry, CurrencyType, ItemType, ItemQuality, CultivationTechnique, ActiveEffect, ActiveQuest, EventChoice } from './';

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
    // FIX: Corrected the type definition for itemsGained to be a proper array of objects, resolving a critical type inference error. Also added `weight` to ensure type compatibility with InventoryItem.
    itemsGained?: { name: string; quantity: number; description: string; type: ItemType; quality: ItemQuality; icon: string; weight: number; bonuses?: StatBonus[] }[];
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