



import { FaQuestionCircle } from 'react-icons/fa';
import {
    REALM_SYSTEM, SECTS,
    DEFAULT_WORLD_ID,
    PT_FACTIONS, PT_WORLD_MAP, PT_NPC_LIST, PT_MAJOR_EVENTS,
    JTTW_FACTIONS, JTTW_WORLD_MAP, JTTW_NPC_LIST, JTTW_MAJOR_EVENTS,
    DEFAULT_ATTRIBUTE_DEFINITIONS,
    DEFAULT_ATTRIBUTE_GROUPS,
    CURRENT_GAME_VERSION, DIFFICULTY_LEVELS
} from "../constants";
import type { GameState, CharacterAttributes, PlayerCharacter, NpcDensity, Inventory, Currency, CultivationState, GameDate, WorldState, Location, FullMod, NPC, Sect, DanhVong, ModNpc, ModLocation, RealmConfig, ModWorldData, DifficultyLevel, InventoryItem, CaveAbode, SystemInfo, SpiritualRoot, PlayerVitals, CultivationTechnique, ModAttributeSystem, StatBonus } from "../types";
// FIX: Import `generateDynamicNpcs` to resolve 'Cannot find name' error.
import { generateFamilyAndFriends, generateOpeningScene, generateDynamicNpcs } from '../services/geminiService';
import * as db from '../services/dbService';
import { calculateDerivedStats } from './statCalculator';
import type { GameStartData } from '../contexts/AppContext';

const ATTRIBUTE_NAME_TO_ID_MAP: Record<string, string> = {
    'Căn Cốt': 'can_cot',
    'Lực Lượng': 'luc_luong',
    'Thân Pháp': 'than_phap',
    'Bền Bỉ': 'ben_bi',
    'Linh Căn': 'linh_can',
    'Linh Lực Sát Thương': 'linh_luc_sat_thuong',
    'Chân Nguyên Tinh Thuần': 'chan_nguyen_tinh_thuan',
    'Ngự Khí Thuật': 'ngu_khi_thuat',
    'Ngộ Tính': 'ngo_tinh',
    'Nguyên Thần': 'nguyen_than',
    'Nguyên Thần Kháng': 'nguyen_than_khang',
    'Thần Thức': 'than_thuc',
    'Đạo Tâm': 'dao_tam',
    'Cơ Duyên': 'co_duyen',
    'Mị Lực': 'mi_luc',
    'Nhân Quả': 'nhan_qua',
    'Sinh Mệnh': 'sinh_menh',
    'Linh Lực': 'linh_luc',
    'Cảnh Giới': 'canh_gioi',
    'Tuổi Thọ': 'tuoi_tho',
    'Chính Đạo': 'chinh_dao',
    'Ma Đạo': 'ma_dao',
};


export const migrateGameState = async (savedGame: any): Promise<GameState> => {
    if (!savedGame || typeof savedGame !== 'object') {
        throw new Error("Invalid save data provided to migration function.");
    }
    let dataToProcess = JSON.parse(JSON.stringify(savedGame)); // Deep copy to prevent mutation issues

    // --- Versioned Migration Cascade ---
    let version = dataToProcess.version || "1.0.0";

    // ... [existing version migrations up to 1.0.8] ...

    if (version < "1.0.8") {
        // ... (previous migration logic)
        version = "1.0.8";
    }

    if (version < "1.0.9") {
        console.log(`Migrating save from v${version} to v1.0.9 (Data-Driven Attributes & NPC Mind)...`);
        
        const convertAttributes = (oldAttributes: any): CharacterAttributes => {
            if (!Array.isArray(oldAttributes)) {
                return oldAttributes; // Already in new format or invalid
            }
            const newAttributes: CharacterAttributes = {};
            for (const group of oldAttributes) {
                if (group && Array.isArray(group.attributes)) {
                    for (const attr of group.attributes) {
                        const attrId = ATTRIBUTE_NAME_TO_ID_MAP[attr.name];
                        if (attrId) {
                            newAttributes[attrId] = {
                                value: attr.value,
                                ...(attr.maxValue !== undefined && { maxValue: attr.maxValue })
                            };
                        } else {
                            console.warn(`Could not find ID for legacy attribute: ${attr.name}`);
                        }
                    }
                }
            }
            return newAttributes;
        };
        
        // Migrate player character attributes
        if (dataToProcess.playerCharacter && Array.isArray(dataToProcess.playerCharacter.attributes)) {
            dataToProcess.playerCharacter.attributes = convertAttributes(dataToProcess.playerCharacter.attributes);
        }

        // Migrate NPC attributes and add mind state
        if (dataToProcess.activeNpcs && Array.isArray(dataToProcess.activeNpcs)) {
            dataToProcess.activeNpcs = dataToProcess.activeNpcs.map((npc: any) => {
                let updatedNpc = { ...npc };
                if (npc && Array.isArray(npc.attributes)) {
                    updatedNpc.attributes = convertAttributes(npc.attributes);
                }
                // Add default mind state if it doesn't exist
                if (!updatedNpc.emotions) {
                    updatedNpc.emotions = { trust: 50, fear: 10, anger: 10 };
                }
                if (!updatedNpc.memory) {
                    updatedNpc.memory = { shortTerm: [], longTerm: [] };
                }
                // Add default willpower state
                if (!updatedNpc.motivation) {
                    updatedNpc.motivation = "Sống một cuộc sống bình thường.";
                }
                if (!updatedNpc.goals) {
                    updatedNpc.goals = [];
                }
                if (updatedNpc.currentPlan === undefined) {
                    updatedNpc.currentPlan = null;
                }
                return updatedNpc;
            });
        }
    }


    // --- Post-migration Default Values & Finalization ---
    // ... [existing finalization logic] ...

    dataToProcess.version = CURRENT_GAME_VERSION;

    // --- Re-hydration ---
    let activeMods: FullMod[] = [];
    if (dataToProcess.activeModIds && dataToProcess.activeModIds.length > 0) {
        activeMods = (await Promise.all(
            dataToProcess.activeModIds.map((id: string) => db.getModContent(id))
        )).filter((mod): mod is FullMod => mod !== undefined);
    }
    dataToProcess.activeMods = activeMods;

    const modRealmSystem = activeMods.find(m => m.content.realmConfigs)?.content.realmConfigs;
    const realmSystemToUse = modRealmSystem && modRealmSystem.length > 0
        ? modRealmSystem.map(realm => ({...realm, id: realm.name.toLowerCase().replace(/\s+/g, '_')}))
        : REALM_SYSTEM;
    dataToProcess.realmSystem = realmSystemToUse;

    // Add attribute system
    const modAttributeSystem = activeMods.find(m => m.content.attributeSystem)?.content.attributeSystem;
    dataToProcess.attributeSystem = modAttributeSystem || {
        definitions: DEFAULT_ATTRIBUTE_DEFINITIONS,
        groups: DEFAULT_ATTRIBUTE_GROUPS
    };
    
    // Recalculate derived stats for the loaded character
    dataToProcess.playerCharacter.attributes = calculateDerivedStats(
        dataToProcess.playerCharacter.attributes,
        dataToProcess.attributeSystem.definitions
    );

    return dataToProcess as GameState;
};

const convertModNpcToNpc = (modNpc: Omit<ModNpc, 'id'> & { id?: string }, realmSystem: RealmConfig[], attributeSystem: ModAttributeSystem): NPC => {
    const realm = realmSystem[1] || realmSystem[0];
    const baseAttributes: CharacterAttributes = {};
    attributeSystem.definitions.forEach(attrDef => {
        if (attrDef.type === 'VITAL' || attrDef.type === 'PRIMARY') {
            baseAttributes[attrDef.id] = {
                value: attrDef.baseValue || 10,
                ...(attrDef.type === 'VITAL' && { maxValue: attrDef.baseValue || 10 })
            };
        }
    });

    const finalAttributes = calculateDerivedStats(baseAttributes, attributeSystem.definitions);

    return {
        id: modNpc.id || `mod-npc-${Math.random().toString(36).substring(2, 9)}`,
        identity: {
            name: modNpc.name,
            gender: 'Nam',
            appearance: modNpc.description,
            origin: modNpc.origin,
            personality: modNpc.personality,
            age: 50 + Math.floor(Math.random() * 200),
        },
        status: modNpc.status,
        attributes: finalAttributes,
        emotions: { trust: 50, fear: 10, anger: 10 },
        memory: { shortTerm: [], longTerm: [] },
        motivation: "Thực hiện vai trò được định sẵn trong thế giới mod.",
        goals: [],
        currentPlan: null,
        talents: [],
        locationId: modNpc.locationId,
        cultivation: {
            currentRealmId: realm.id,
            currentStageId: realm.stages[0].id,
            spiritualQi: 0,
            hasConqueredInnerDemon: true,
        },
        techniques: [],
        inventory: { items: [], weightCapacity: 10 },
        currencies: {},
        equipment: {},
        healthStatus: 'HEALTHY',
        activeEffects: [],
        tuoiTho: 300,
        faction: modNpc.faction,
    };
};

export const createNewGameState = async (
    gameStartData: GameStartData,
    activeMods: FullMod[],
    activeWorldId: string,
    setLoadingMessage: (message: string) => void
): Promise<GameState> => {
    const { identity, npcDensity, difficulty, initialBonuses, initialItems, spiritualRoot, danhVong } = gameStartData;

    const worldMapToUse = PT_WORLD_MAP;
    const initialNpcsFromData = PT_NPC_LIST;
    const majorEventsToUse = PT_MAJOR_EVENTS;
    const factionsToUse = PT_FACTIONS;
    const startingYear = 1;
    const eraName = 'Tiên Phong Thần';

    const modRealmSystem = activeMods.find(m => m.content.realmConfigs)?.content.realmConfigs;
    const realmSystemToUse = modRealmSystem && modRealmSystem.length > 0
        ? modRealmSystem.map(realm => ({...realm, id: realm.name.toLowerCase().replace(/\s+/g, '_')}))
        : REALM_SYSTEM;
        
    const modAttributeSystem = activeMods.find(m => m.content.attributeSystem)?.content.attributeSystem;
    const attributeSystemToUse = modAttributeSystem || {
        definitions: DEFAULT_ATTRIBUTE_DEFINITIONS,
        groups: DEFAULT_ATTRIBUTE_GROUPS
    };

    const initialAttributes: CharacterAttributes = {};
    const selectedDifficulty = DIFFICULTY_LEVELS.find(d => d.id === difficulty) || DIFFICULTY_LEVELS.find(d => d.id === 'medium')!;
    const baseStatValue = selectedDifficulty.baseStatValue;
    
    attributeSystemToUse.definitions.forEach(attrDef => {
        if (attrDef.type === 'PRIMARY') {
            initialAttributes[attrDef.id] = { value: baseStatValue };
        } else if (attrDef.type === 'VITAL' && attrDef.baseValue !== undefined) {
            initialAttributes[attrDef.id] = { value: attrDef.baseValue, maxValue: attrDef.baseValue };
        }
    });

    // Apply bonuses from character creation (race, background, spiritual root)
    [...initialBonuses].forEach(bonus => {
        const attrDef = attributeSystemToUse.definitions.find(d => d.name === bonus.attribute);
        if (attrDef && initialAttributes[attrDef.id]) {
            initialAttributes[attrDef.id].value += bonus.value;
        }
    });

    const canCotValue = initialAttributes['can_cot']?.value || baseStatValue;
    const initialWeightCapacity = 20 + (canCotValue - 10) * 2;
    
    const initialCurrencies: Currency = { 'Bạc': 50, 'Linh thạch hạ phẩm': 20 };

    const startingInventoryItems: InventoryItem[] = initialItems.map((item, index) => ({
        id: `start-item-${index}-${Date.now()}`,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        type: item.type,
        quality: item.quality,
        weight: 0.1,
        icon: item.icon
    }));

    const initialInventory: Inventory = { weightCapacity: initialWeightCapacity, items: startingInventoryItems };
    const initialCultivation: CultivationState = {
        currentRealmId: realmSystemToUse[0].id,
        currentStageId: realmSystemToUse[0].stages[0].id,
        spiritualQi: 0,
        hasConqueredInnerDemon: false,
    };
    const initialVitals: PlayerVitals = {
        hunger: 100, maxHunger: 100,
        thirst: 100, maxThirst: 100,
        temperature: 37,
    };
    const startingLocation = worldMapToUse[0];
    const initialCaveAbode: CaveAbode = {
        name: `${identity.name} Động Phủ`,
        level: 1,
        spiritGatheringArrayLevel: 0,
        spiritHerbFieldLevel: 0,
        alchemyRoomLevel: 0,
        storageUpgradeLevel: 0,
        locationId: 'dong_phu'
    };

    // Calculate derived stats for the first time
    const attributesWithDerived = calculateDerivedStats(initialAttributes, attributeSystemToUse.definitions);

    // FIX: Add a default `age` property to the character identity to resolve the type error.
    let playerCharacter: PlayerCharacter = {
        identity: {
            ...identity,
            age: (identity as PlayerCharacter['identity']).age || 18,
        },
        attributes: attributesWithDerived,
        spiritualRoot: spiritualRoot,
        inventory: initialInventory,
        currencies: initialCurrencies,
        cultivation: initialCultivation,
        currentLocationId: startingLocation.id,
        equipment: {},
        vitals: initialVitals,
        mainCultivationTechniqueInfo: null,
        techniques: [],
        relationships: [],
        danhVong: danhVong,
        reputation: factionsToUse.map(f => ({ factionName: f.name, value: 0, status: 'Trung Lập' })),
        chosenPathIds: [],
        knownRecipeIds: [],
        sect: null,
        caveAbode: initialCaveAbode,
        healthStatus: 'HEALTHY',
        activeEffects: [],
        techniqueCooldowns: {},
        activeQuests: [],
        completedQuestIds: [],
        inventoryActionLog: [],
        element: spiritualRoot.elements.length === 1 ? spiritualRoot.elements[0].type : 'Hỗn Độn',
    };
    
    setLoadingMessage('Đang tạo ra gia đình và chúng sinh trong thế giới...');
    const [familyResult, generatedNpcs] = await Promise.all([
        generateFamilyAndFriends(playerCharacter.identity, startingLocation.id),
        generateDynamicNpcs(npcDensity, initialNpcsFromData.map(n => n.identity.name)),
    ]);
    const { npcs: familyNpcs, relationships: familyRelationships } = familyResult;
    playerCharacter.relationships = familyRelationships;
    if (!generatedNpcs || generatedNpcs.length === 0) {
        throw new Error("AI không thể tạo ra chúng sinh. Vui lòng kiểm tra API Key.");
    }
    const allNpcs = [...initialNpcsFromData, ...familyNpcs, ...generatedNpcs];
    
    const tempGameStateForOpening = {
        ...({} as GameState),
        playerCharacter,
        activeNpcs: allNpcs,
        discoveredLocations: [startingLocation],
        attributeSystem: attributeSystemToUse,
        realmSystem: realmSystemToUse,
    };
    setLoadingMessage('Đang viết nên chương truyện mở đầu cho bạn...');
    const openingNarrative = await generateOpeningScene(tempGameStateForOpening, activeWorldId);
    setLoadingMessage('Đang sắp đặt lại dòng thời gian...');

    const initialStory = [ { id: 1, type: 'narrative' as const, content: openingNarrative } ];
    const initialGameDate: GameDate = {
        era: eraName,
        year: startingYear,
        season: 'Xuân',
        day: 1,
        timeOfDay: 'Buổi Sáng',
        shichen: 'Tỵ',
        weather: 'SUNNY',
        actionPoints: 4,
        maxActionPoints: 4,
    };
    const initialWorldState: WorldState = { rumors: [], dynamicEvents: [], foreshadowedEvents: [], triggeredDynamicEventIds: {} };
    const discoveredLocations: Location[] = [startingLocation, ...worldMapToUse.filter(l => l.neighbors.includes(startingLocation.id))];

    return {
        version: CURRENT_GAME_VERSION,
        playerCharacter,
        activeNpcs: allNpcs,
        gameDate: initialGameDate,
        discoveredLocations: discoveredLocations,
        worldState: initialWorldState,
        storyLog: initialStory,
        majorEvents: majorEventsToUse,
        encounteredNpcIds: [],
        activeMods: activeMods,
        realmSystem: realmSystemToUse,
        attributeSystem: attributeSystemToUse,
        activeStory: null,
        combatState: null,
        dialogueWithNpcId: null,
        dialogueChoices: null,
        worldSects: [],
        eventIllustrations: [],
        storySummary: '',
        difficulty: difficulty,
        shopStates: {},
        playerStall: null,
        playerSect: null,
    };
};