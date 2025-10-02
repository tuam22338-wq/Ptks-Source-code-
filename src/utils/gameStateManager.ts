
import {
    REALM_SYSTEM,
    DEFAULT_ATTRIBUTE_DEFINITIONS,
    DEFAULT_ATTRIBUTE_GROUPS,
    CURRENT_GAME_VERSION, DIFFICULTY_LEVELS,
    NARRATIVE_STYLES,
    AI_CREATIVITY_LEVELS,
    NARRATIVE_PACING_LEVELS,
    PLAYER_AGENCY_LEVELS,
    AI_MEMORY_DEPTH_LEVELS,
    NPC_COMPLEXITY_LEVELS,
    WORLD_EVENT_FREQUENCY_LEVELS,
    WORLD_REACTIVITY_LEVELS,
    DEATH_PENALTY_LEVELS,
    VALIDATION_CAP_LEVELS,
    WORLD_INTERRUPTION_LEVELS
} from "../constants";
import type { GameState, CharacterAttributes, PlayerCharacter, NpcDensity, Inventory, Currency, CultivationState, GameDate, WorldState, Location, FullMod, NPC, Sect, DanhVong, ModNpc, ModLocation, RealmConfig, ModWorldData, DifficultyLevel, InventoryItem, CaveAbode, SystemInfo, SpiritualRoot, PlayerVitals, CultivationTechnique, ModAttributeSystem, StatBonus, GenerationMode, ForeshadowedEvent, NamedRealmSystem, GameplaySettings, WorldCreationData, Faction } from "../types";
import { generateInitialWorldDetails } from '../services/geminiService';
import * as db from '../services/dbService';
import { calculateDerivedStats } from './statCalculator';
import type { GameStartData } from '../contexts/AppContext';
import { sanitizeGameState } from './gameStateSanitizer';
import { DEFAULT_WORLDS_DATA } from '../data/defaultWorlds';

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
        // Fallback for saves that predate the activeWorldId system
        dataToProcess.activeWorldId = 'khoi_nguyen_gioi';
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

    if (!dataToProcess.gameplaySettings) {
        console.log('Adding default gameplay settings to older save file.');
        dataToProcess.gameplaySettings = {
            narrativeStyle: 'classic_wuxia',
            aiResponseWordCount: 1500,
            aiCreativityLevel: 'balanced',
            narrativePacing: 'medium',
            playerAgencyLevel: 'balanced',
            aiMemoryDepth: 'balanced',
            npcComplexity: 'advanced',
            worldEventFrequency: 'occasional',
            worldReactivity: 'dynamic',
            cultivationRateMultiplier: 100,
            resourceRateMultiplier: 100,
            damageDealtMultiplier: 100,
            damageTakenMultiplier: 100,
            enableSurvivalMechanics: true,
            deathPenalty: 'resource_loss',
            validationServiceCap: 'strict',
            narrateSystemChanges: true,
            worldInterruptionFrequency: 'occasional',
        };
    }

    if (!dataToProcess.worldTurnLog) {
        dataToProcess.worldTurnLog = [];
    }
    
    if (!dataToProcess.dialogueHistory) {
        dataToProcess.dialogueHistory = [];
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
    
    // --- Realm System Hydration (with new flexible system) ---
    const modNamedSystems = activeMods.find(m => m.content.namedRealmSystems && m.content.namedRealmSystems.length > 0)?.content.namedRealmSystems;
    const modLegacyRealms = activeMods.find(m => m.content.realmConfigs)?.content.realmConfigs;

    if (modNamedSystems && modNamedSystems.length > 0) {
        const mainSystem = modNamedSystems[0];
        dataToProcess.realmSystem = mainSystem.realms.map(r => ({ ...r, id: r.id || r.name.toLowerCase().replace(/\s+/g, '_') }));
        dataToProcess.realmSystemInfo = {
            name: mainSystem.name,
            resourceName: mainSystem.resourceName || 'Linh Khí',
            resourceUnit: mainSystem.resourceUnit || 'điểm',
        };
    } else {
        dataToProcess.realmSystem = (modLegacyRealms && modLegacyRealms.length > 0 ? modLegacyRealms : REALM_SYSTEM).map(r => ({ ...r, id: r.id || r.name.toLowerCase().replace(/\s+/g, '_') }));
        dataToProcess.realmSystemInfo = {
            name: 'Hệ Thống Tu Luyện Mặc Định',
            resourceName: 'Linh Khí',
            resourceUnit: 'điểm',
        };
    }
     // Fallback for very old saves that don't have this field
    if (!dataToProcess.realmSystemInfo) {
        dataToProcess.realmSystemInfo = { name: 'Hệ Thống Tu Luyện Mặc Định', resourceName: 'Linh Khí', resourceUnit: 'điểm' };
    }


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
    const realm = realmSystem[0];
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
            currentRealmId: realm?.id || 'pham_nhan',
            currentStageId: realm?.stages?.[0]?.id || 'pn_1',
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
    setLoadingMessage: (message: string) => void
): Promise<GameState> => {
    if (partialGameState.isHydrated || !partialGameState.creationData) {
        return partialGameState;
    }

    const hydratedGameState: GameState = JSON.parse(JSON.stringify(partialGameState));

    try {
        setLoadingMessage('Đang tạo dựng thế giới, chúng sinh và viết nên chương mở đầu...');

        const { npcs, relationships, openingNarrative } = await generateInitialWorldDetails(
            hydratedGameState,
            hydratedGameState.creationData.generationMode
        );

        // Family members are part of the story, always add them and their relationships.
        const familyNpcs = npcs.filter(n => n.id.startsWith('family-npc-'));
        hydratedGameState.playerCharacter.relationships.push(...relationships);
        hydratedGameState.activeNpcs.push(...familyNpcs);

        // Only add randomly generated "dynamic" NPCs if the user selected 'AI' mode.
        if (hydratedGameState.creationData.npcGenerationMode === 'AI') {
            const dynamicNpcs = npcs.filter(n => n.id.startsWith('dynamic-npc-'));
            hydratedGameState.activeNpcs.push(...dynamicNpcs);
        }

        // Always use the AI opening narrative
        if (hydratedGameState.storyLog.length > 0) {
            hydratedGameState.storyLog[0] = { ...hydratedGameState.storyLog[0], content: openingNarrative };
        } else {
            hydratedGameState.storyLog.push({ id: 1, type: 'narrative' as const, content: openingNarrative });
        }

    } catch (error) {
        console.error("Hydration task [generateInitialWorldDetails] failed:", error);
        if (hydratedGameState.storyLog.length > 0) {
             hydratedGameState.storyLog[0].content += "\n\n(Lỗi khi tạo thế giới, một vài chi tiết có thể bị thiếu.)";
        }
    }

    // --- 4. Finalize ---
    hydratedGameState.isHydrated = true;
    delete hydratedGameState.creationData; // Clean up the creation data
    
    setLoadingMessage('Hoàn tất sáng thế!');
    
    return sanitizeGameState(hydratedGameState);
};


export const createNewGameState = async (
    gameStartData: GameStartData,
    activeMods: FullMod[],
    activeWorldId: string,
    setLoadingMessage: (message: string) => void
): Promise<GameState> => {
    const { 
        identity, npcDensity, difficulty, initialBonuses, initialItems, spiritualRoot, danhVong, initialCurrency, generationMode = 'fast', attributeSystem, namedRealmSystem, genre,
        npcGenerationMode, locationGenerationMode, factionGenerationMode,
        customNpcs, customLocations, customFactions,
        ...gameplaySettingsData
     } = gameStartData;

    // --- DYNAMIC WORLD LOADING ---
    let modWorldData: ModWorldData | undefined;
    
    const worldMod = activeMods.find(m => m.content.worldData && m.content.worldData.length > 0);
    if (worldMod) {
        modWorldData = worldMod.content.worldData[0];
        activeWorldId = modWorldData.id;
    } else {
        modWorldData = DEFAULT_WORLDS_DATA.find(w => w.id === activeWorldId);
    }
    
    if (!modWorldData) {
        modWorldData = DEFAULT_WORLDS_DATA[0];
        activeWorldId = modWorldData.id;
        console.warn(`Không tìm thấy thế giới cho ID "${activeWorldId}", đang tải thế giới mặc định "${modWorldData.id}".`);
    }

    console.log(`Đang tải dữ liệu thế giới từ: ${modWorldData.name}`);

    // --- OVERRIDE WORLD DATA BASED ON USER CHOICE ---
    let factionsToUse: Faction[];
    if (factionGenerationMode === 'CUSTOM' && customFactions) {
        factionsToUse = customFactions;
    } else if (factionGenerationMode === 'NONE') {
        factionsToUse = [];
    } else {
        factionsToUse = modWorldData.factions || [];
    }

    let worldMapToUse: Location[];
    if (locationGenerationMode === 'CUSTOM' && customLocations) {
        worldMapToUse = customLocations.map(loc => ({
            ...loc,
            id: loc.id || loc.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, ''),
        })) as Location[];
    } else if (locationGenerationMode === 'NONE') {
        worldMapToUse = [];
    } else {
        worldMapToUse = (modWorldData.initialLocations || []).map(loc => ({
            ...loc,
            id: loc.id || loc.name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, ''),
        })) as Location[];
    }

    const majorEventsToUse = modWorldData.majorEvents;
    const startingYear = modWorldData.startingYear;
    const eraName = modWorldData.eraName;

    const startingLocationId = worldMapToUse.length > 0 ? worldMapToUse[0].id : '';
    const startingLocation = worldMapToUse.find(l => l.id === startingLocationId) || (worldMapToUse.length > 0 ? worldMapToUse[0] : null);

    if (!startingLocation) {
        throw new Error("Không thể xác định địa điểm bắt đầu. Vui lòng cung cấp ít nhất một địa điểm nếu ở chế độ 'Tự Định Nghĩa'.");
    }
    
    // --- Realm System Loading (Data-driven) ---
    let realmSystemToUse: RealmConfig[] = [];
    let realmSystemInfoToUse: GameState['realmSystemInfo'] = {
        name: 'Hệ Thống Năng Lượng Cơ Bản',
        resourceName: 'Năng Lượng',
        resourceUnit: 'điểm'
    };

    const modNamedSystems = activeMods.find(m => m.content.namedRealmSystems && m.content.namedRealmSystems.length > 0)?.content.namedRealmSystems;
    const modLegacyRealms = activeMods.find(m => m.content.realmConfigs)?.content.realmConfigs;

    if (namedRealmSystem) {
        realmSystemToUse = namedRealmSystem.realms.map(r => ({...r, id: r.id || r.name.toLowerCase().replace(/\s+/g, '_')}));
        realmSystemInfoToUse = {
            name: namedRealmSystem.name,
            resourceName: namedRealmSystem.resourceName || 'Linh Khí',
            resourceUnit: namedRealmSystem.resourceUnit || 'điểm',
        };
    } else if (modNamedSystems && modNamedSystems.length > 0) {
        const mainSystem = modNamedSystems[0];
        realmSystemToUse = mainSystem.realms.map(r => ({...r, id: r.id || r.name.toLowerCase().replace(/\s+/g, '_')}));
        realmSystemInfoToUse = {
            name: mainSystem.name,
            resourceName: mainSystem.resourceName || 'Linh Khí',
            resourceUnit: mainSystem.resourceUnit || 'điểm',
        };
    } else if (modLegacyRealms && modLegacyRealms.length > 0) {
        realmSystemToUse = modLegacyRealms.map(r => ({...r, id: r.id || r.name.toLowerCase().replace(/\s+/g, '_')}));
        realmSystemInfoToUse = {
            name: 'Hệ Thống Tu Luyện Tùy Chỉnh',
            resourceName: 'Linh Khí',
            resourceUnit: 'điểm',
        };
    } else if (genre === 'Huyền Huyễn Tu Tiên') {
        realmSystemToUse = REALM_SYSTEM.map(r => ({...r, id: r.id || r.name.toLowerCase().replace(/\s+/g, '_')}));
        realmSystemInfoToUse = {
            name: 'Hệ Thống Tu Luyện Mặc Định',
            resourceName: 'Linh Khí',
            resourceUnit: 'điểm',
        };
    }
    
    const modAttributeSystem = activeMods.find(m => m.content.attributeSystem)?.content.attributeSystem;
    const attributeSystemToUse = attributeSystem || modAttributeSystem || {
        definitions: DEFAULT_ATTRIBUTE_DEFINITIONS,
        groups: DEFAULT_ATTRIBUTE_GROUPS
    };

    let initialNpcsFromData: NPC[];
    if (npcGenerationMode === 'CUSTOM' && customNpcs) {
        initialNpcsFromData = customNpcs.map(modNpc => convertModNpcToNpc(modNpc, realmSystemToUse, attributeSystemToUse));
    } else if (npcGenerationMode === 'NONE') {
        initialNpcsFromData = [];
    } else {
        initialNpcsFromData = (modWorldData.initialNpcs || []).map(modNpc => convertModNpcToNpc(modNpc, realmSystemToUse, attributeSystemToUse));
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
        : { 'Bạc': 50, 'Linh thạch hạ phẩm': 20 };

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
        currentRealmId: (realmSystemToUse[0]?.id) || 'pham_nhan',
        currentStageId: (realmSystemToUse[0]?.stages?.[0]?.id) || 'pn_1',
        spiritualQi: 0,
        hasConqueredInnerDemon: false,
    };
    const initialVitals: PlayerVitals = {
        temperature: 37,
    };
    
    const initialCaveAbode: CaveAbode = {
        name: `${identity.name} Động Phủ`,
        level: 1,
        spiritGatheringArrayLevel: 0,
        spiritHerbFieldLevel: 0,
        alchemyRoomLevel: 0,
        storageUpgradeLevel: 0,
        locationId: 'dong_phu'
    };

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
        element: (spiritualRoot.elements && spiritualRoot.elements.length === 1) ? spiritualRoot.elements[0].type : 'Hỗn Độn',
        playerAiHooks: {
            on_world_build: '',
            on_action_evaluate: '',
            on_narration: '',
            on_realm_rules: '',
            on_conditional_rules: '',
        },
    };
    
    const allNpcs = [...initialNpcsFromData];
    
    const initialStory = [ { id: 1, type: 'narrative' as const, content: `Bạn bắt đầu hành trình của mình tại ${startingLocation.name}. Thế giới xung quanh đang dần được kiến tạo...` } ];
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
    if (modWorldData?.foreshadowedEvents) {
        const totalStartDays = ((startingYear - 1) * 4 * 30) + 1;
        initialWorldState.foreshadowedEvents = modWorldData.foreshadowedEvents.map((fe, index): ForeshadowedEvent => ({
            id: `fe_${modWorldData.name}_${index}`,
            title: fe.title,
            description: fe.description,
            chance: fe.chance,
            turnStart: totalStartDays,
            potentialTriggerDay: totalStartDays + fe.relativeTriggerDay,
        }));
    }

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
        worldTurnLog: [],
        majorEvents: majorEventsToUse,
        encounteredNpcIds: [],
        activeMods: activeMods,
        realmSystem: realmSystemToUse,
        realmSystemInfo: realmSystemInfoToUse,
        namedRealmSystems: namedRealmSystem ? [namedRealmSystem] : undefined,
        attributeSystem: attributeSystemToUse,
        activeStory: null,
        combatState: null,
        dialogueWithNpcId: null,
        dialogueHistory: [],
        dialogueChoices: null,
        worldSects: [],
        eventIllustrations: [],
        storySummary: '',
        difficulty: difficulty,
        shopStates: {},
        playerStall: null,
        playerSect: null,
        isHydrated: false,
        creationData: { 
            npcDensity, 
            generationMode,
            npcGenerationMode,
            locationGenerationMode,
            factionGenerationMode,
        },
        gameplaySettings: {
            ...gameplaySettingsData,
            cultivationRateMultiplier: 100,
            resourceRateMultiplier: 100,
            damageDealtMultiplier: 100,
            damageTakenMultiplier: 100,
        },
    };
    
    return sanitizeGameState(newGameState);
};
