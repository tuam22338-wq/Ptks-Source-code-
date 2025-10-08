import Dexie, { type Table } from 'dexie';
import type { 
    GameState, 
    GameSettings, 
    FullMod, 
    SaveSlot, 
    NPC, 
    Sect,
    MemoryFragment,
    GraphEdge,
    RagSource,
    RagEmbedding,
    ModInLibrary,
    Novel,
    HeuristicFixReport
} from '../types';

export interface DbSaveSlot {
  id: number;
  data: GameState | null;
}

export interface DbSetting {
  key: string;
  value: any;
}

export interface DbModContent {
    id: string; // modInfo.id
    mod: FullMod;
}

export class MyDatabase extends Dexie {
  saveSlots!: Table<DbSaveSlot, number>;
  settings!: Table<DbSetting, string>;
  modLibrary!: Table<ModInLibrary, string>; // primary key is modInfo.id
  modContent!: Table<DbModContent, string>; // primary key is id
  modDrafts!: Table<{id: string, data: any}, string>;
  misc!: Table<{key: string, value: any}, string>;
  memoryFragments!: Table<MemoryFragment, number>;
  graphEdges!: Table<GraphEdge, number>;
  ragSources!: Table<RagSource, string>; // primary key is id
  ragEmbeddings!: Table<RagEmbedding, number>; // auto-incrementing primary key
  assetCache!: Table<{id: string, data: any}, string>;
  novels!: Table<Novel, number>; // Bảng mới cho tính năng Tiểu Thuyết Gia AI
  heuristicFixLogs!: Table<HeuristicFixReport, number>; // Bảng mới cho Thiên Đạo Giám

  constructor() {
    super('TamThienTheGioiDB');
    (this as Dexie).version(7).stores({
      saveSlots: 'id',
      settings: 'key',
      modLibrary: 'modInfo.id',
      modContent: 'id',
      modDrafts: 'id',
      misc: 'key',
      memoryFragments: '++id, slotId, [slotId+gameDate.year], *entities.id',
      graphEdges: '++id, slotId, [source.id+target.id], type, memoryFragmentId',
      ragSources: 'id, type, isEnabled',
      ragEmbeddings: '++id, sourceId',
      assetCache: 'id',
      novels: '++id, title, lastModified',
      heuristicFixLogs: '++id, timestamp', // Schema cho bảng logs
    });
    (this as Dexie).on('populate', () => {
        // This is where you'd put initial data if needed.
    });
  }

  // New methods to encapsulate casting for meta-operations
  public getTables(): Table[] {
    // This is a safe cast as `tables` is a meta-property on Dexie instances.
    return (this as Dexie).tables;
  }

  public async deleteDatabase(): Promise<void> {
    // This is a safe cast to call the root delete method.
    return (this as Dexie).delete();
  }
}

export const db = new MyDatabase();

// --- Asset Cache Service ---
export const getAsset = async (id: string): Promise<any | null> => {
    const asset = await db.assetCache.get(id);
    return asset ? asset.data : null;
};

export const saveAsset = async (id:string, data: any): Promise<void> => {
    await db.assetCache.put({ id, data });
};
export const getAllAssets = async (): Promise<Record<string, any>> => {
    const assets = await db.assetCache.toArray();
    const assetMap: Record<string, any> = {};
    assets.forEach(asset => {
        assetMap[asset.id] = asset.data;
    });
    return assetMap;
};


// --- Migration Service ---
export const getMigrationStatus = async (): Promise<boolean> => {
    const status = await db.misc.get('migrationToIndexedDBComplete');
    return status?.value === true;
};

export const setMigrationStatus = async (isComplete: boolean): Promise<void> => {
    await db.misc.put({ key: 'migrationToIndexedDBComplete', value: isComplete });
};

// --- Dehydration logic for saving ---
const dehydrateGameStateForSave = (gameState: GameState): GameState => {
    // Create a shallow copy to avoid mutating the live state
    const dehydratedState: any = { ...gameState };

    // Store active mod IDs instead of the full mod content
    if (dehydratedState.activeMods) {
        dehydratedState.activeModIds = dehydratedState.activeMods.map((mod: FullMod) => mod.modInfo.id);
    }

    // Remove non-serializable or reconstructable data to optimize save size
    delete dehydratedState.activeMods;
    delete dehydratedState.progressionSystem;
    
    // The new attribute system (Record<string, ...>) is fully serializable and must be saved.
    // No longer deleting attributeSystem to fix save/load bug.
    // delete dehydratedState.attributeSystem;
    
    if (dehydratedState.activeNpcs) {
        dehydratedState.activeNpcs = dehydratedState.activeNpcs.map((npc: NPC) => {
            const { currencies, ...rest } = npc;
            return rest;
        });
    }

    if (dehydratedState.worldSects) {
        dehydratedState.worldSects = dehydratedState.worldSects.map(sect => {
            const { iconName, ...rest } = sect;
            return rest as Sect;
        })
    }
    
    if (dehydratedState.discoveredLocations) {
        dehydratedState.discoveredLocations = dehydratedState.discoveredLocations.map(location => {
            if (!location.contextualActions) {
                return location;
            }
            return {
                ...location,
                contextualActions: location.contextualActions.map(action => {
                    const { iconName, ...rest } = action;
                    return rest;
                })
            };
        });
    }
    
    return dehydratedState as GameState;
};


// --- Save Slot Service ---
export const getAllSaveSlots = async (): Promise<SaveSlot[]> => {
    const slotsFromDb = await db.saveSlots.toArray();
    const allSlots: SaveSlot[] = [];
    for (let i = 1; i <= 9; i++) {
        const found = slotsFromDb.find(s => s.id === i);
        allSlots.push(found || { id: i, data: null });
    }
    return allSlots;
};

export const saveGameState = async (slotId: number, gameState: GameState): Promise<void> => {
    const stateToSave = dehydrateGameStateForSave(gameState);
    await db.saveSlots.put({ id: slotId, data: stateToSave });
};

export const deleteGameState = async (slotId: number): Promise<void> => {
    await db.saveSlots.delete(slotId);
};


// --- Settings Service ---
export const getSettings = async (): Promise<GameSettings | null> => {
    const setting = await db.settings.get('game-settings');
    return setting ? setting.value : null;
};

export const saveSettings = async (settings: GameSettings): Promise<void> => {
    await db.settings.put({ key: 'game-settings', value: settings });
};


// --- Mod Service ---
export const getModLibrary = async (): Promise<ModInLibrary[]> => {
    return await db.modLibrary.toArray();
};

export const saveModToLibrary = async (mod: ModInLibrary): Promise<void> => {
    await db.modLibrary.put(mod);
}

export const saveModLibrary = async (library: ModInLibrary[]): Promise<void> => {
    await (db as unknown as Dexie).transaction('rw', db.modLibrary, async () => {
        await db.modLibrary.clear();
        await db.modLibrary.bulkPut(library);
    });
};

export const deleteModFromLibrary = async (modId: string): Promise<void> => {
    await db.modLibrary.delete(modId);
};

export const getModContent = async(modId: string): Promise<FullMod | undefined> => {
    const content = await db.modContent.get(modId);
    return content?.mod;
}

export const saveModContent = async (modId: string, mod: FullMod): Promise<void> => {
    await db.modContent.put({ id: modId, mod });
}

export const deleteModContent = async (modId: string): Promise<void> => {
    await db.modContent.delete(modId);
}

// --- Mod Draft Service ---
export const getModDraft = async (): Promise<any | null> => {
    const draft = await db.modDrafts.get('current-draft');
    return draft ? draft.data : null;
};

export const saveModDraft = async (draftData: any): Promise<void> => {
    await db.modDrafts.put({ id: 'current-draft', data: draftData });
};

// --- World Service ---
export const getActiveWorldId = async (): Promise<string> => {
    const setting = await db.misc.get('activeWorldId');
    return setting?.value || 'khoi_nguyen_gioi'; // Default world ID
};

export const setActiveWorldId = async (worldId: string): Promise<void> => {
    await db.misc.put({ key: 'activeWorldId', value: worldId });
};

// --- Update Version Service ---
export const getLastDismissedUpdate = async (): Promise<string | null> => {
    const record = await db.misc.get('lastDismissedUpdate');
    return record?.value || null;
};

export const setLastDismissedUpdate = async (version: string): Promise<void> => {
    await db.misc.put({ key: 'lastDismissedUpdate', value: version });
};

/**
 * Exports all data from all tables in the database.
 * @returns A record object where keys are table names and values are arrays of records.
 */
export const exportAllData = async (): Promise<Record<string, any>> => {
  const data: Record<string, any> = {};
  const allTables = db.getTables();
  await (db as unknown as Dexie).transaction('r', allTables, async () => {
    for (const table of allTables) {
      data[table.name] = await table.toArray();
    }
  });
  return data;
};

/**
 * Imports data into the database, overwriting all existing data.
 * @param data A record object where keys are table names and values are arrays of records.
 */
export const importAllData = async (data: Record<string, any>): Promise<void> => {
  // Validate the basic structure of the imported data before wiping anything.
  if (!data || typeof data !== 'object' || !Array.isArray(data.saveSlots) || !Array.isArray(data.settings)) {
    throw new Error("Tệp sao lưu không hợp lệ hoặc bị hỏng. Thiếu các bảng dữ liệu chính (saveSlots, settings).");
  }
  if (data.saveSlots.length > 0) {
      const firstSlot = data.saveSlots[0];
      if (typeof firstSlot.id !== 'number' || (firstSlot.data !== null && typeof firstSlot.data !== 'object')) {
           throw new Error("Dữ liệu 'saveSlots' trong tệp sao lưu không hợp lệ.");
      }
  }
  if (data.settings.length > 0) {
      const firstSetting = data.settings[0];
      if (typeof firstSetting.key !== 'string' || (firstSetting.value !== null && typeof firstSetting.value !== 'object')) {
           throw new Error("Dữ liệu 'settings' trong tệp sao lưu không hợp lệ.");
      }
  }

  const allTables = db.getTables();
  await (db as unknown as Dexie).transaction('rw', allTables, async () => {
    // Clear all tables first for a clean import
    await Promise.all(allTables.map(table => table.clear()));

    // Import new data table by table
    for (const table of allTables) {
      // Check if the backup data contains this table
      if (data[table.name] && Array.isArray(data[table.name])) {
        try {
          await table.bulkPut(data[table.name]);
        } catch (error: any) {
          console.error(`Lỗi khi nhập dữ liệu cho bảng ${table.name}:`, error);
          // Optional: re-throw to abort the entire transaction
          throw new Error(`Nhập dữ liệu cho bảng ${table.name} thất bại.`);
        }
      } else {
        console.warn(`Không tìm thấy dữ liệu cho bảng '${table.name}' trong tệp sao lưu. Bảng này sẽ bị trống.`);
      }
    }
  });
};


// Encapsulate database deletion logic to resolve typing issue where 'delete' is not found on the subclass.
export const deleteDb = (): Promise<void> => {
    return db.deleteDatabase();
};

// --- Memory Service ---
export const saveMemoryFragment = async (fragment: MemoryFragment): Promise<number> => {
    return await db.memoryFragments.add(fragment);
};

export const deleteMemoryForSlot = async (slotId: number): Promise<void> => {
    await (db as unknown as Dexie).transaction('rw', db.memoryFragments, db.graphEdges, async () => {
        await db.memoryFragments.where('slotId').equals(slotId).delete();
        await db.graphEdges.where('slotId').equals(slotId).delete();
    });
};

export const getRelevantMemories = async (
  slotId: number,
  entityIds: string[],
  limit: number = 15
): Promise<MemoryFragment[]> => {
  const fragmentsByEntity = await db.memoryFragments
    .where('entities.id').anyOf(entityIds)
    .and(frag => frag.slotId === slotId)
    .toArray();

  const edgeQueries = entityIds
      .filter(id => id !== 'player')
      .map(targetId => ['player', targetId]);

  const edges = edgeQueries.length > 0 ? await db.graphEdges
      .where('[source.id+target.id]').anyOf(...edgeQueries)
      .and(edge => edge.slotId === slotId)
      .toArray() : [];

  const fragmentIdsFromEdges = edges.map(e => e.memoryFragmentId);
  const fragmentsFromEdges = fragmentIdsFromEdges.length > 0
    ? await db.memoryFragments.bulkGet(fragmentIdsFromEdges)
    : [];

  const allFragments = [
      ...fragmentsByEntity,
      ...(fragmentsFromEdges.filter((f): f is MemoryFragment => f !== undefined)),
  ];

  // Deduplicate and sort
  const uniqueFragments = Array.from(new Map(allFragments.map(f => [f.id, f])).values());
  
  uniqueFragments.sort((a: MemoryFragment, b: MemoryFragment) => {
      if (a.gameDate.year !== b.gameDate.year) return b.gameDate.year - a.gameDate.year;
      const seasonOrder = ['Xuân', 'Hạ', 'Thu', 'Đông'];
      if (a.gameDate.season !== b.gameDate.season) return seasonOrder.indexOf(b.gameDate.season) - seasonOrder.indexOf(a.gameDate.season);
      if (a.gameDate.day !== b.gameDate.day) return b.gameDate.day - a.gameDate.day;
      return 0; // Fallback for identical dates
  });
  
  return uniqueFragments.slice(0, limit);
};

// --- Heuristic Fixer Service ---
export const getAllHeuristicFixLogs = async (): Promise<HeuristicFixReport[]> => {
    return await db.heuristicFixLogs.orderBy('timestamp').reverse().toArray();
};

export const addHeuristicFixLog = async (log: Omit<HeuristicFixReport, 'id'>): Promise<number> => {
    return await db.heuristicFixLogs.add(log as HeuristicFixReport);
};
