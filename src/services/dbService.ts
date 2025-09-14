import Dexie, { type Table } from 'dexie';
import type { GameState, GameSettings, ModInfo, FullMod, SaveSlot, AttributeGroup, NPC, Sect, Location } from '../types';

export interface DbSaveSlot {
  id: number;
  data: GameState | null;
}

export interface DbSetting {
  key: string;
  value: any;
}

export interface DbModInLibrary {
    modInfo: ModInfo;
    isEnabled: boolean;
}

export interface DbModContent {
    id: string; // modInfo.id
    mod: FullMod;
}

export class MyDatabase extends Dexie {
  saveSlots!: Table<DbSaveSlot, number>;
  settings!: Table<DbSetting, string>;
  modLibrary!: Table<DbModInLibrary, string>; // primary key is modInfo.id
  modContent!: Table<DbModContent, string>; // primary key is id
  modDrafts!: Table<{id: string, data: any}, string>;
  misc!: Table<{key: string, value: any}, string>;

  constructor() {
    super('PhongThanKySuDB');
    (this as Dexie).version(1).stores({
      saveSlots: 'id',
      settings: 'key',
      modLibrary: 'modInfo.id',
      modContent: 'id',
      modDrafts: 'id',
misc: 'key',
    });
  }
}

export const db = new MyDatabase();

// --- Migration Service ---
export const getMigrationStatus = async (): Promise<boolean> => {
    const status = await db.misc.get('migrationToIndexedDBComplete');
    return status?.value === true;
};

export const setMigrationStatus = async (isComplete: boolean): Promise<void> => {
    await db.misc.put({ key: 'migrationToIndexedDBComplete', value: isComplete });
};

// --- Dehydration logic for saving ---
const dehydrateAttributesForSave = (groups: AttributeGroup[]): any[] => {
    return groups.map(group => ({
        ...group,
        attributes: group.attributes.map(attr => {
            const { icon, ...rest } = attr; // remove icon component
            return rest;
        })
    }));
};

const dehydrateGameStateForSave = (gameState: GameState): GameState => {
    // Create new objects/arrays for modified paths to avoid mutating the live state
    const dehydratedState: GameState = { ...gameState };

    if (dehydratedState.playerCharacter?.attributes) {
        dehydratedState.playerCharacter = {
            ...dehydratedState.playerCharacter,
            attributes: dehydrateAttributesForSave(dehydratedState.playerCharacter.attributes) as AttributeGroup[]
        };
    }

    if (dehydratedState.activeNpcs) {
        dehydratedState.activeNpcs = dehydratedState.activeNpcs.map((npc: NPC) => {
            let newNpc: any = { ...npc };
            if (newNpc.attributes) {
                newNpc = {
                    ...newNpc,
                    attributes: dehydrateAttributesForSave(newNpc.attributes) as AttributeGroup[]
                };
            }
            // Ensure obsolete currencies property is removed for forward compatibility
            if ('currencies' in newNpc) {
                delete newNpc.currencies;
            }
            return newNpc;
        });
    }

    if (dehydratedState.worldSects) {
        dehydratedState.worldSects = dehydratedState.worldSects.map(sect => {
            const { icon, ...rest } = sect;
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
                    const { icon, ...rest } = action;
                    return rest;
                })
            };
        });
    }
    
    return dehydratedState;
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
export const getModLibrary = async (): Promise<DbModInLibrary[]> => {
    return await db.modLibrary.toArray();
};

export const saveModToLibrary = async (mod: DbModInLibrary): Promise<void> => {
    await db.modLibrary.put(mod);
}

export const saveModLibrary = async (library: DbModInLibrary[]): Promise<void> => {
    await (db as Dexie).transaction('rw', db.modLibrary, async () => {
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
    return setting?.value || 'phong_than_dien_nghia'; // Default world ID
};

export const setActiveWorldId = async (worldId: string): Promise<void> => {
    await db.misc.put({ key: 'activeWorldId', value: worldId });
};

// Encapsulate database deletion logic to resolve typing issue where 'delete' is not found on the subclass.
export const deleteDb = (): Promise<void> => {
    return (db as Dexie).delete();
};