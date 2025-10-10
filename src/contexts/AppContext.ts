// FIX: Add React import to resolve namespace error.
import type React from 'react';
import { createContext } from 'react';
import type { View } from './AppProvider';
import type { GameSettings, PlayerCharacter, NpcDensity, DifficultyLevel, SpiritualRoot, DanhVong, StatBonus, ItemType, ItemQuality, Currency, FullMod, GenerationMode, WorldCreationData, ModAttributeSystem, NamedRealmSystem, GameplaySettings, DataGenerationMode, ModNpc, ModLocation, Faction } from '../types';
import type { AppState, Action } from './gameReducer';

export interface GameStartData extends GameplaySettings {
    identity: PlayerCharacter['identity'];
    npcDensity: NpcDensity;
    difficulty: DifficultyLevel;
    initialBonuses: StatBonus[];
    initialItems: { name: string; quantity: number; description: string; type: ItemType; quality: ItemQuality; icon: string; }[];
    spiritualRoot: SpiritualRoot;
    danhVong: DanhVong;
    initialCurrency?: Currency;
    generationMode: GenerationMode;
    attributeSystem?: ModAttributeSystem;
    namedRealmSystem?: NamedRealmSystem | null;
    genre: string;
    npcGenerationMode: DataGenerationMode;
    locationGenerationMode: DataGenerationMode;
    factionGenerationMode: DataGenerationMode;
    customNpcs?: ModNpc[];
    customLocations?: ModLocation[];
    customFactions?: Faction[];
    dlcs?: { title: string; content: string }[];
}


export interface AppContextType {
    state: AppState;
    dispatch: React.Dispatch<Action>;
    handleNavigate: (targetView: View) => void;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
    handleDynamicBackgroundChange: (themeId: string) => Promise<void>;
    handleSettingsSave: () => Promise<void>;
    handleSlotSelection: (slotId: number) => void;
    handleSaveGame: () => Promise<void>;
    handleDeleteGame: (slotId: number) => Promise<void>;
    handleVerifyAndRepairSlot: (slotId: number) => Promise<void>;
    handleCreateAndStartGame: (worldCreationData: WorldCreationData, slotId: number) => Promise<void>;
    handleQuickCreateAndStartGame: (description: string, characterName: string, slotId: number) => Promise<void>;
    handlePlayerAction: (text: string, type: 'say' | 'act', apCost: number, showNotification: (message: string) => void) => Promise<void>;
    handleUpdatePlayerCharacter: (updater: (pc: PlayerCharacter) => PlayerCharacter) => void;
    handleSetActiveWorldId: (worldId: string) => Promise<void>;
    quitGame: () => void;
    speak: (text: string, force?: boolean) => void;
    cancelSpeech: () => void;
    handleInstallMod: (modData: FullMod) => Promise<boolean>;
    handleToggleMod: (modId: string) => Promise<void>;
    handleDeleteModFromLibrary: (modId: string) => Promise<void>;
    handleEditWorld: (worldId: string) => Promise<void>;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
