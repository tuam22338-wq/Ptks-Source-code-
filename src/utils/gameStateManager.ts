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
import type { GameState, CharacterAttributes, PlayerCharacter, NpcDensity, Inventory, Currency, CultivationState, GameDate, WorldState, Location, FullMod, NPC, Sect, DanhVong, ModNpc, ModLocation, RealmConfig, ModWorldData, DifficultyLevel, InventoryItem, CaveAbode, SystemInfo, SpiritualRoot, PlayerVitals, CultivationTechnique, ModAttributeSystem, StatBonus, GenerationMode } from "../types";
import { generateFamilyAndFriends, generateOpeningScene, generateDynamicNpcs } from '../services/geminiService';
import * as db from '../services/dbService';
import { calculateDerivedStats } from './statCalculator';
import type { GameStartData } from '../contexts/AppContext';
import { sanitizeGameState } from './gameStateSanitizer';

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
    'Độ No': 'hunger',
    'Độ Khát': 'thirst',
};


export const migrateGameState = async (savedGame: any): Promise<GameState> => {
    if (!savedGame || typeof savedGame !== 'object') {
        throw new Error("Invalid save data provided to migration function.");
    }
    let dataToProcess = JSON.parse(JSON.stringify(savedGame)); // Deep copy to prevent mutation issues

    // --- Versioned Migration Cascade ---
    let version = dataToProcess.version || "1.0.0";

    // ... [existing version migrations up to 1.0.8] ...

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
        version = "1.0.9";
    }

    if (version < "1.0.11") {
        console.log(`Migrating save from v${version} to v1.0.11 (Vitals to Attributes)...`);
        const pc = dataToProcess.playerCharacter;
        if (pc && pc.vitals && (pc.vitals as any).hunger !== undefined) {
            const oldVitals = pc.vitals as any;
            if (!pc.attributes) {
                pc.attributes = {};
            }
            pc.attributes.hunger = { value: oldVitals.hunger, maxValue: oldVitals.maxHunger || 100 };
            pc.attributes.thirst = { value: oldVitals.thirst, maxValue: oldVitals.maxThirst || 100 };
            delete oldVitals.hunger;
            delete oldVitals.maxHunger;
            delete oldVitals.thirst;
            delete oldVitals.maxThirst;
        }
        version = "1.0.11";
    }


    // --- Post-migration Default Values & Finalization ---
    // ... [existing finalization logic] ...
    if (!dataToProcess.activeWorldId) {
        dataToProcess.activeWorldId = DEFAULT_WORLD_ID;
    }
    if (!dataToProcess.playerCharacter.playerAiHooks) {
        dataToProcess.playerCharacter.playerAiHooks = {
            on_world_build: '',
            on_action_evaluate: '',
            on_narration: '',
            on_realm_rules: '',
            on_conditional_rules: '',
        };
    }
    if (typeof dataToProcess.playerCharacter.playerAiHooks.on_conditional_rules === 'undefined') {
        dataToProcess.playerCharacter.playerAiHooks.on_conditional_rules = '';
    }


    dataToProcess.version = CURRENT_GAME_VERSION;

    // --- Re-hydration ---
    let activeMods: FullMod[] = [];
    if (dataToProcess.activeModIds && dataToProcess.activeModIds.length > 0) {
        activeMods = (await Promise.all(
            dataToProcess.activeModIds.map((id: string) => db.getModContent(id))
        )).filter((mod): mod is FullMod => mod !== undefined);
    }
    dataToProcess.activeMods = activeMods;

    const modRealmSystemFromNamed = activeMods.find(m => m.content.namedRealmSystems && m.content.namedRealmSystems.length > 0)?.content.namedRealmSystems?.[0].realms;
    const modRealmSystemFromLegacy = activeMods.find(m => m.content.realmConfigs)?.content.realmConfigs;
    const modRealms = modRealmSystemFromNamed || modRealmSystemFromLegacy;
    const realmSystemToUse = modRealms && modRealms.length > 0
        ? modRealms.map(realm => ({...realm, id: realm.id || realm.name.toLowerCase().replace(/\s+/g, '_')}))
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

    return sanitizeGameState(dataToProcess as GameState);
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

export const hydrateWorldData = async (
    partialGameState: GameState,
): Promise<GameState> => {
    if (partialGameState.isHydrated || !partialGameState.creationData) {
        return partialGameState;
    }

    console.log("Starting background world hydration...");
    const { npcDensity, generationMode } = partialGameState.creationData;
    
    const existingNames = partialGameState.activeNpcs.map(n => n.identity.name);
    
    console.log(`Hydrating world with ${npcDensity} density...`);
    const generatedNpcs = await generateDynamicNpcs(npcDensity, existingNames, generationMode);
    
    // Create a copy to modify
    const hydratedGameState: GameState = JSON.parse(JSON.stringify(partialGameState));
    
    hydratedGameState.activeNpcs.push(...generatedNpcs);
    hydratedGameState.isHydrated = true;
    delete hydratedGameState.creationData; // Clean up after hydration
    
    console.log(`World hydration complete. Added ${generatedNpcs.length} dynamic NPCs.`);
    
    return sanitizeGameState(hydratedGameState);
};


export const createNewGameState = async (
    gameStartData: GameStartData,
    activeMods: FullMod[],
    activeWorldId: string,
    setLoadingMessage: (message: string) => void
): Promise<GameState> => {
    const { identity, npcDensity, difficulty, initialBonuses, initialItems, spiritualRoot, danhVong, initialCurrency, generationMode = 'fast' } = gameStartData;

    let worldMapToUse: Location[], initialNpcsFromData: NPC[], majorEventsToUse, factionsToUse, startingYear, eraName, startingLocationId;
    
    // --- DYNAMIC WORLD LOADING ---
    const activeModWorld = activeMods.find(m => m.content.worldData?.some(w => w.name === activeWorldId));
    let modWorldData: ModWorldData | undefined;
    if (activeModWorld) {
        const foundWorldData = activeModWorld.content.worldData?.find(w => w.name === activeWorldId);
        // FIX: Reconstruct the object to satisfy the ModWorldData type, which requires an 'id'.
        // The 'id' for a world is derived from its unique 'name'.
        if (foundWorldData) {
            modWorldData = {
                ...foundWorldData,
                id: foundWorldData.name
            };
        }
    }
    
    // Mod Data takes precedence
    const modRealmSystemFromNamed = activeMods.find(m => m.content.namedRealmSystems && m.content.namedRealmSystems.length > 0)?.content.namedRealmSystems?.[0].realms;
    const modRealmSystemFromLegacy = activeMods.find(m => m.content.realmConfigs)?.content.realmConfigs;
    const modRealms = modRealmSystemFromNamed || modRealmSystemFromLegacy;
    const realmSystemToUse = modRealms && modRealms.length > 0
        ? modRealms.map(realm => ({...realm, id: realm.id || realm.name.toLowerCase().replace(/\s+/g, '_')}))
        : REALM_SYSTEM;
        
    const modAttributeSystem = activeMods.find(m => m.content.attributeSystem)?.content.attributeSystem;
    const attributeSystemToUse = modAttributeSystem || {
        definitions: DEFAULT_ATTRIBUTE_DEFINITIONS,
        groups: DEFAULT_ATTRIBUTE_GROUPS
    };

    if (modWorldData) {
        console.log(`Loading world data from mod: ${modWorldData.name}`);
        // FIX: The 'initialLocations' from a mod might have an optional 'id'.
        // We process them here to ensure each location has a definite 'id' string,
        // making it conform to the 'Location[]' type. The ID is derived from the name if missing.
        worldMapToUse = modWorldData.initialLocations.map(loc => ({
            ...loc,
            id: loc.id || loc.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, ''),
        })) as Location[];
        initialNpcsFromData = modWorldData.initialNpcs.map(modNpc => convertModNpcToNpc(modNpc, realmSystemToUse, attributeSystemToUse));
        majorEventsToUse = modWorldData.majorEvents;
        factionsToUse = modWorldData.factions;
        startingYear = modWorldData.startingYear;
        eraName = modWorldData.eraName;
        startingLocationId = worldMapToUse[0].id; // Default to first location in mod
    } else if (activeWorldId === 'tay_du_ky') {
        // Fallback to default worlds
        worldMapToUse = JTTW_WORLD_MAP;
        initialNpcsFromData = JTTW_NPC_LIST;
        majorEventsToUse = JTTW_MAJOR_EVENTS;
        factionsToUse = JTTW_FACTIONS;
        startingYear = 627;
        eraName = 'Đường Trinh Quán';
        startingLocationId = 'jttw_truong_an';
    } else { // Default to Phong Than
        worldMapToUse = PT_WORLD_MAP;
        initialNpcsFromData = PT_NPC_LIST;
        majorEventsToUse = PT_MAJOR_EVENTS;
        factionsToUse = PT_FACTIONS;
        startingYear = 1;
        eraName = 'Tiên Phong Thần';
        startingLocationId = 'thanh_ha_tran';
    }

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
    
    const initialCurrencies: Currency = initialCurrency && Object.keys(initialCurrency).length > 0
        ? initialCurrency
        : { 'Bạc': 50, 'Linh thạch hạ phẩm': 20 }; // Fallback for safety

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
        temperature: 37,
    };
    const startingLocation = worldMapToUse.find(l => l.id === startingLocationId) || worldMapToUse[0];
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

    let playerCharacter: PlayerCharacter = {
        identity: identity,
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
        playerAiHooks: {
            on_world_build: '',
            on_action_evaluate: '',
            on_narration: '',
            on_realm_rules: '',
            on_conditional_rules: '',
        },
    };
    
    setLoadingMessage('AI đang kiến tạo người thân...');
    const familyResult = await generateFamilyAndFriends(playerCharacter.identity, startingLocation.id, generationMode);
    
    const { npcs: familyNpcs, relationships: familyRelationships } = familyResult;
    playerCharacter.relationships = familyRelationships;

    const allNpcs = [...initialNpcsFromData, ...familyNpcs];
    
    const tempGameStateForOpening = {
        ...({} as GameState),
        playerCharacter,
        activeNpcs: allNpcs,
        discoveredLocations: [startingLocation],
        attributeSystem: attributeSystemToUse,
        realmSystem: realmSystemToUse,
    };
    setLoadingMessage('AI đang viết nên chương truyện mở đầu cho bạn...');
    const openingNarrative = await generateOpeningScene(tempGameStateForOpening, activeWorldId, generationMode);
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

    const newGameState: GameState = {
        version: CURRENT_GAME_VERSION,
        activeWorldId: activeWorldId,
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
        isHydrated: false,
        creationData: { npcDensity, generationMode },
    };
    
    return sanitizeGameState(newGameState);
};