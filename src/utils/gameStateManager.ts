import { FaQuestionCircle } from 'react-icons/fa';
import {
    ATTRIBUTES_CONFIG, CURRENT_GAME_VERSION, REALM_SYSTEM, SECTS,
    MAIN_CULTIVATION_TECHNIQUES_DATABASE, DEFAULT_WORLD_ID, CURRENCY_ITEMS,
    PT_FACTIONS, PT_WORLD_MAP, PT_NPC_LIST, PT_MAJOR_EVENTS,
    JTTW_FACTIONS, JTTW_WORLD_MAP, JTTW_NPC_LIST, JTTW_MAJOR_EVENTS
} from "../constants";
import type { GameState, AttributeGroup, Attribute, PlayerCharacter, NpcDensity, Inventory, Currency, CultivationState, GameDate, WorldState, Location, FullMod, NPC, Sect, MainCultivationTechnique, DanhVong, ModNpc, ModLocation, RealmConfig, ModWorldData, DifficultyLevel, InventoryItem, CaveAbode, SystemInfo, SpiritualRoot, PlayerVitals } from "../types";
import { generateDynamicNpcs, generateFamilyAndFriends, generateOpeningScene } from '../services/geminiService';
import {
  GiCauldron,
  GiHealthNormal, GiMagicSwirl, GiStairsGoal, GiHourglass,
  GiSpinalCoil, GiMuscularTorso, GiRunningShoe, GiHeartTower,
  GiPentacle, GiBoltSpellCast, GiScrollQuill, GiSoulVessel,
  GiSparklingSabre, GiStoneTower, GiPerspectiveDiceSixFacesRandom,
  GiTalk, GiScales, GiMountainCave, GiBed, GiSprout, GiStoneBlock, GiHerbsBundle
} from 'react-icons/gi';
import { FaSun, FaMoon } from 'react-icons/fa';

export const migrateGameState = (savedGame: any): GameState => {
    if (!savedGame || typeof savedGame !== 'object') {
        throw new Error("Invalid save data provided to migration function.");
    }
    let dataToProcess = JSON.parse(JSON.stringify(savedGame)); // Deep copy to prevent mutation issues

    // --- Versioned Migration Cascade ---
    let version = dataToProcess.version || "1.0.0";

    // Migrate from 1.0.0 to 1.0.1 (Example: Add vitals system)
    if (version < "1.0.1") {
        console.log(`Migrating save from v${version} to v1.0.1...`);
        if (dataToProcess.playerCharacter && !dataToProcess.playerCharacter.vitals) {
            dataToProcess.playerCharacter.vitals = {
                hunger: 100,
                maxHunger: 100,
                thirst: 100,
                maxThirst: 100,
                temperature: 37,
            };
        }
        version = "1.0.1";
    }

    // Migrate from 1.0.1 to 1.0.2 (Example: Add Spiritual Root and remove Talents)
    if (version < "1.0.2") {
        console.log(`Migrating save from v${version} to v1.0.2...`);
        if (dataToProcess.playerCharacter) {
             if (dataToProcess.playerCharacter.talents && !dataToProcess.playerCharacter.spiritualRoot) {
                dataToProcess.playerCharacter.spiritualRoot = {
                    elements: [{ type: 'Vô', purity: 100 }],
                    quality: 'Phàm Căn',
                    name: 'Phàm Nhân (Cần kiểm tra lại)',
                    description: 'Linh căn được di trú từ hệ thống cũ.',
                    bonuses: [],
                };
                delete dataToProcess.playerCharacter.talents;
            }
        }
        version = "1.0.2";
    }
    
    // Migrate from 1.0.2 to 1.0.3 (Example: Add Main Cultivation Technique system)
    if (version < "1.0.3") {
        console.log(`Migrating save from v${version} to v1.0.3...`);
        if (dataToProcess.playerCharacter && dataToProcess.playerCharacter.techniques) {
             const randomIndex = Math.floor(Math.random() * MAIN_CULTIVATION_TECHNIQUES_DATABASE.length);
             const newTechnique = JSON.parse(JSON.stringify(MAIN_CULTIVATION_TECHNIQUES_DATABASE[randomIndex]));
             if(newTechnique) {
                newTechnique.skillTreeNodes['root'].isUnlocked = true;
             }
             dataToProcess.playerCharacter.mainCultivationTechnique = newTechnique;
             dataToProcess.playerCharacter.auxiliaryTechniques = dataToProcess.playerCharacter.techniques || [];
             delete dataToProcess.playerCharacter.techniques;
             dataToProcess.playerCharacter.techniquePoints = dataToProcess.playerCharacter.techniquePoints ?? 1;
        }
        version = "1.0.3";
    }

    // Migrate from 1.0.3 to 1.0.4 (Example: Add quest, reputation, and other systems)
    if (version < "1.0.4") {
        console.log(`Migrating save from v${version} to v1.0.4...`);
        dataToProcess.activeMods = dataToProcess.activeMods ?? [];
        dataToProcess.realmSystem = dataToProcess.realmSystem ?? REALM_SYSTEM;
        dataToProcess.majorEvents = dataToProcess.majorEvents ?? PT_MAJOR_EVENTS;
        dataToProcess.encounteredNpcIds = dataToProcess.encounteredNpcIds ?? [];
        dataToProcess.activeStory = dataToProcess.activeStory ?? null;
        dataToProcess.storySummary = dataToProcess.storySummary ?? '';

        if (dataToProcess.playerCharacter) {
            dataToProcess.playerCharacter.relationships = dataToProcess.playerCharacter.relationships ?? [];
            dataToProcess.playerCharacter.reputation = dataToProcess.playerCharacter.reputation ?? PT_FACTIONS.map(f => ({ factionName: f.name, value: 0, status: 'Trung Lập' }));
            dataToProcess.playerCharacter.chosenPathIds = dataToProcess.playerCharacter.chosenPathIds ?? [];
            dataToProcess.playerCharacter.knownRecipeIds = dataToProcess.playerCharacter.knownRecipeIds ?? [];
            dataToProcess.playerCharacter.sect = dataToProcess.playerCharacter.sect ?? null;
            dataToProcess.playerCharacter.caveAbode = dataToProcess.playerCharacter.caveAbode ?? {};
            dataToProcess.playerCharacter.techniqueCooldowns = dataToProcess.playerCharacter.techniqueCooldowns ?? {};
            dataToProcess.playerCharacter.inventoryActionLog = dataToProcess.playerCharacter.inventoryActionLog ?? [];
            dataToProcess.playerCharacter.danhVong = dataToProcess.playerCharacter.danhVong ?? { value: 0, status: 'Vô Danh Tiểu Tốt' };
            dataToProcess.playerCharacter.activeQuests = dataToProcess.playerCharacter.activeQuests ?? [];
            dataToProcess.playerCharacter.completedQuestIds = dataToProcess.playerCharacter.completedQuestIds ?? [];
            delete dataToProcess.playerCharacter.activeMissions;
        }
        version = "1.0.4";
    }
    
    // Migrate to 1.0.5
    if (version < "1.0.5") {
        console.log(`Migrating save from v${version} to v1.0.5...`);
        dataToProcess.playerSect = dataToProcess.playerSect ?? null;
        if (dataToProcess.playerCharacter && !dataToProcess.playerCharacter.systemInfo) {
            if (dataToProcess.gameMode === 'transmigrator') {
                dataToProcess.playerCharacter.systemInfo = { unlockedFeatures: ['status', 'quests', 'store'] };
            }
        }
        version = "1.0.5";
    }
    
    // Migrate to 1.0.6 (current version)
    if (version < "1.0.6") {
        console.log(`Migrating save from v${version} to v1.0.6...`);
        // No structural changes, just version bump
        version = "1.0.6";
    }


    // --- Post-migration Default Values & Finalization ---
    dataToProcess.difficulty = dataToProcess.difficulty ?? 'medium';
    dataToProcess.worldSects = dataToProcess.worldSects ?? [];
    dataToProcess.eventIllustrations = dataToProcess.eventIllustrations ?? [];
    dataToProcess.dialogueChoices = dataToProcess.dialogueChoices ?? null;
    dataToProcess.shopStates = dataToProcess.shopStates ?? {};
    dataToProcess.storySummary = dataToProcess.storySummary ?? '';
    dataToProcess.gameMode = dataToProcess.gameMode ?? 'classic';

    if (dataToProcess.playerCharacter) {
         dataToProcess.playerCharacter.inventoryActionLog = dataToProcess.playerCharacter.inventoryActionLog ?? [];
         dataToProcess.playerCharacter.activeQuests = dataToProcess.playerCharacter.activeQuests ?? [];
         dataToProcess.playerCharacter.completedQuestIds = dataToProcess.playerCharacter.completedQuestIds ?? [];
         if (!dataToProcess.playerCharacter.element && dataToProcess.playerCharacter.spiritualRoot) {
            dataToProcess.playerCharacter.element = dataToProcess.playerCharacter.spiritualRoot.elements[0]?.type || 'Vô';
         } else if (!dataToProcess.playerCharacter.element) {
            dataToProcess.playerCharacter.element = 'Vô';
         }
    }
    if(dataToProcess.worldState) {
        dataToProcess.worldState.rumors = dataToProcess.worldState.rumors ?? [];
        dataToProcess.worldState.dynamicEvents = dataToProcess.worldState.dynamicEvents ?? [];
    } else {
        dataToProcess.worldState = { rumors: [], dynamicEvents: [] };
    }

    // Stamp the migrated save with the current game version to prevent re-migration.
    dataToProcess.version = CURRENT_GAME_VERSION;


    // --- Re-hydration ---
    dataToProcess.realmSystem = dataToProcess.realmSystem ?? REALM_SYSTEM;
    dataToProcess.activeMods = dataToProcess.activeMods ?? [];

    const allAttributesConfig = new Map<string, any>();
    ATTRIBUTES_CONFIG.forEach(group => {
        group.attributes.forEach(attr => {
            allAttributesConfig.set(attr.name, attr);
        });
    });

    const rehydrateAttributes = (groups: any[]): AttributeGroup[] => {
        return groups.map((group: any) => ({
            ...group,
            attributes: group.attributes.map((attr: any) => {
                const config = allAttributesConfig.get(attr.name);
                return {
                    ...attr,
                    icon: config ? config.icon : FaQuestionCircle,
                    description: config ? config.description : attr.description,
                };
            }),
        }));
    };

    if (dataToProcess.playerCharacter?.attributes) {
        dataToProcess.playerCharacter.attributes = rehydrateAttributes(dataToProcess.playerCharacter.attributes);
    }

    if (dataToProcess.activeNpcs) {
        dataToProcess.activeNpcs = dataToProcess.activeNpcs.map((npc: any) => {
             if (npc.attributes) {
                npc.attributes = rehydrateAttributes(npc.attributes);
             }
             return npc;
        });
    }

    const allSectsConfig = new Map<string, Sect>();
    SECTS.forEach(sect => allSectsConfig.set(sect.id, sect));
    if (dataToProcess.worldSects) {
        dataToProcess.worldSects = dataToProcess.worldSects.map((sect: Sect) => {
            const config = allSectsConfig.get(sect.id);
            if (config && config.icon) {
                return { ...sect, icon: config.icon };
            }
            return sect;
        });
    }
    
    const CONTEXTUAL_ACTION_ICONS: Record<string, any> = { talk_villagers: GiTalk, rest_inn: GiBed, gather_herbs: GiHerbsBundle, mine_ore: GiStoneBlock, closed_door_cultivation: GiMountainCave, alchemy: GiCauldron };
    const getContextualAction = (actionId: string, label: string, description: string) => ({ id: actionId, label, description, icon: CONTEXTUAL_ACTION_ICONS[actionId] || FaQuestionCircle });

    if (dataToProcess.discoveredLocations) {
        dataToProcess.discoveredLocations = dataToProcess.discoveredLocations.map((loc: Location) => {
            const config = PT_WORLD_MAP.find(l => l.id === loc.id);
            if (config && config.contextualActions && (!loc.contextualActions || loc.contextualActions.some(a => !a.hasOwnProperty('icon')))) {
                 return { ...loc, contextualActions: config.contextualActions };
            }
            if (loc.contextualActions && loc.contextualActions.some(a => !a.hasOwnProperty('icon'))) {
                 return {
                    ...loc,
                    contextualActions: loc.contextualActions.map((action: any) => 
                         getContextualAction(action.id, action.label, action.description)
                    )
                };
            }
            return loc;
        });
    }

    return dataToProcess as GameState;
};

const convertModNpcToNpc = (modNpc: Omit<ModNpc, 'id'> & { id?: string }, realmSystem: RealmConfig[]): NPC => {
    // A simplified conversion, full conversion would be more complex
    const realm = realmSystem[1] || realmSystem[0]; // Default to Luyen Khi
    return {
        id: modNpc.id || `mod-npc-${Math.random().toString(36).substring(2, 9)}`,
        identity: {
            name: modNpc.name,
            gender: 'Nam', // Default
            appearance: modNpc.description,
            origin: modNpc.origin,
            personality: modNpc.personality,
            age: 50 + Math.floor(Math.random() * 200),
        },
        status: modNpc.status,
        attributes: [], // Will be generated dynamically if needed later
        talents: [], // TODO: Link talentNames to actual talents
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
    gameStartData: {
        characterData: Omit<PlayerCharacter, 'inventory' | 'currencies' | 'sect' | 'caveAbode' | 'cultivation' | 'currentLocationId' | 'equipment' | 'mainCultivationTechnique' | 'auxiliaryTechniques' | 'techniquePoints' |'relationships' | 'chosenPathIds' | 'knownRecipeIds' | 'reputation' | 'techniqueCooldowns' | 'activeQuests' | 'completedQuestIds' | 'inventoryActionLog' | 'danhVong' | 'element' | 'systemInfo' | 'spiritualRoot' | 'vitals'> & { danhVong: DanhVong, spiritualRoot: SpiritualRoot },
        npcDensity: NpcDensity,
        difficulty: DifficultyLevel,
        gameMode: 'classic' | 'transmigrator',
    },
    activeMods: FullMod[],
    activeWorldId: string,
    setLoadingMessage: (message: string) => void
): Promise<GameState> => {
    const { characterData, npcDensity, difficulty, gameMode } = gameStartData;
    const isTransmigratorMode = gameMode === 'transmigrator';

    // --- World Data Overhaul ---
    const isTayDuKy = activeWorldId === 'tay_du_ky';
    const isDefaultFrameworkWorld = activeWorldId === DEFAULT_WORLD_ID || isTayDuKy;

    let worldData: ModWorldData | null = null;
    if (!isDefaultFrameworkWorld) {
        for (const mod of activeMods) {
            const foundWorld = mod.content.worldData?.find(wd => wd.name === activeWorldId);
            if (foundWorld) {
                worldData = { ...foundWorld, id: activeWorldId };
                console.log(`Loading world data from mod: ${worldData.name}`);
                break;
            }
        }
        if (!worldData) {
            console.warn(`Active world ID "${activeWorldId}" not found in active mods. Falling back to default world.`);
        }
    }

    const worldMapToUse = worldData ? worldData.initialLocations.map(l => ({ ...l, id: l.id || l.name, contextualActions: [], } as Location)) : (isTayDuKy ? JTTW_WORLD_MAP : PT_WORLD_MAP);
    const initialNpcsFromData = worldData ? worldData.initialNpcs.map(n => convertModNpcToNpc(n, REALM_SYSTEM)) : (isTayDuKy ? JTTW_NPC_LIST : PT_NPC_LIST);
    const majorEventsToUse = worldData ? worldData.majorEvents : (isTayDuKy ? JTTW_MAJOR_EVENTS : PT_MAJOR_EVENTS);
    const factionsToUse = worldData ? worldData.factions : (isTayDuKy ? JTTW_FACTIONS : PT_FACTIONS);
    const startingYear = worldData ? worldData.startingYear : (isTayDuKy ? 627 : 1);
    const eraName = worldData ? worldData.eraName : (isTayDuKy ? 'Đại Đường' : 'Tiên Phong Thần');


    const modRealmSystem = activeMods.find(m => m.content.realmConfigs)?.content.realmConfigs;
    const realmSystemToUse = modRealmSystem && modRealmSystem.length > 0
        ? modRealmSystem.map(realm => ({...realm, id: realm.name.toLowerCase().replace(/\s+/g, '_')}))
        : REALM_SYSTEM;
        
    const canCotAttr = characterData.attributes.flatMap(g => g.attributes).find(a => a.name === 'Căn Cốt');
    const canCotValue = (canCotAttr?.value as number) || 10;
    const initialWeightCapacity = 20 + (canCotValue - 10) * 2;
    
    const initialCurrencies: Currency = {
        'Bạc': 50,
        'Linh thạch hạ phẩm': 20,
    };
    if (isTransmigratorMode) {
        initialCurrencies['Điểm Nguồn'] = 100;
    }

    const initialInventory: Inventory = {
        weightCapacity: initialWeightCapacity,
        items: [
            { id: 'item1', name: 'Bình Dược Liệu', description: 'Một bình sứ chứa thảo dược cơ bản để trị thương.', quantity: 5, type: 'Đan Dược', icon: '🏺', weight: 0.5, quality: 'Phàm Phẩm' },
            { id: 'item2', name: 'Trường Bào Vải Thô', description: 'Một bộ y phục vải thô của dân thường.', quantity: 1, type: 'Phòng Cụ', icon: '🥋', bonuses: [], weight: 1.5, quality: 'Phàm Phẩm', slot: 'Thượng Y' },
            { id: 'item3', name: 'Dao Găm Sắt', description: 'Một con dao găm bằng sắt, chỉ có thể dùng để phòng thân.', quantity: 1, type: 'Vũ Khí', icon: '🗡️', bonuses: [{ attribute: 'Lực Lượng', value: 1 }], weight: 1.0, quality: 'Phàm Phẩm', slot: 'Vũ Khí' },
            { id: 'item4', name: 'Lệnh Bài Thân Phận', description: 'Một lệnh bài bằng gỗ, khắc tên và xuất thân của bạn.', quantity: 1, type: 'Tạp Vật', icon: '🪪', weight: 0.1, quality: 'Phàm Phẩm' },
            { id: 'item7', name: 'Hồi Khí Đan - Đan Phương', description: 'Ghi lại phương pháp luyện chế Hồi Khí Đan Hạ Phẩm. Có thể học bằng cách sử dụng.', quantity: 1, type: 'Đan Phương', icon: '📜', weight: 0.1, quality: 'Phàm Phẩm', recipeId: 'recipe_hoi_khi_dan_ha_pham' },
        ]
    };

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

    const updatedAttributes = characterData.attributes.map(group => {
        if (group.title === 'Chỉ số Sinh Tồn') {
            return {
                ...group,
                attributes: group.attributes.map(attr => {
                    if (attr.name === 'Sinh Mệnh' || attr.name === 'Linh Lực') {
                        return { ...attr, maxValue: attr.value as number };
                    }
                    return attr;
                })
            };
        }
        return group;
    });

    const initialCoreLocations = worldMapToUse.filter(l => l.type === 'Thành Thị' || l.type === 'Thôn Làng');
    const startingLocation = initialCoreLocations[Math.floor(Math.random() * initialCoreLocations.length)] || worldMapToUse[0];
    
    const initialCaveAbode: CaveAbode = {
        name: `${characterData.identity.name} Động Phủ`,
        level: 1,
        spiritGatheringArrayLevel: 0,
        spiritHerbFieldLevel: 0,
        alchemyRoomLevel: 0,
        storageUpgradeLevel: 0,
        locationId: 'dong_phu'
    };
    
    const initialSystemInfo: SystemInfo | undefined = isTransmigratorMode
        ? { unlockedFeatures: ['status', 'quests', 'store'] }
        : undefined;

    let playerCharacter: PlayerCharacter = {
        identity: { ...characterData.identity, age: 18 },
        attributes: updatedAttributes,
        spiritualRoot: characterData.spiritualRoot,
        inventory: initialInventory,
        currencies: initialCurrencies,
        cultivation: initialCultivation,
        currentLocationId: startingLocation.id,
        equipment: {},
        vitals: initialVitals,
        mainCultivationTechnique: null,
        auxiliaryTechniques: [],
        techniquePoints: 0,
        relationships: [],
        danhVong: characterData.danhVong,
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
        element: characterData.spiritualRoot.elements[0]?.type || 'Vô',
        systemInfo: initialSystemInfo,
    };
    
    setLoadingMessage('Đang tạo ra gia đình và chúng sinh trong thế giới...');

    const familyPromise = isTransmigratorMode
        ? Promise.resolve({ npcs: [], relationships: [] }) // Transmigrators start alone
        : generateFamilyAndFriends(playerCharacter.identity, startingLocation.id);

    const [familyResult, generatedNpcs] = await Promise.all([
        familyPromise,
        generateDynamicNpcs(npcDensity, initialNpcsFromData.map(n => n.identity.name)),
    ]);
    
    const { npcs: familyNpcs, relationships: familyRelationships } = familyResult;
    playerCharacter.relationships = familyRelationships;

    if (!generatedNpcs || generatedNpcs.length === 0) {
        throw new Error("AI không thể tạo ra chúng sinh. Vui lòng kiểm tra API Key.");
    }

    const allNpcs = [...initialNpcsFromData, ...familyNpcs, ...generatedNpcs];
    
    const tempGameStateForOpening = {
        ...({} as GameState), // Cast to avoid full property list
        playerCharacter,
        activeNpcs: allNpcs,
        discoveredLocations: [startingLocation],
    };
    
    setLoadingMessage('Đang viết nên chương truyện mở đầu cho bạn...');
    const openingNarrative = await generateOpeningScene(tempGameStateForOpening, isTransmigratorMode ? 'xuyen_viet_gia_phong_than' : activeWorldId);
    
    setLoadingMessage('Đang sắp đặt lại dòng thời gian...');

    let initialStory;
    if (isTransmigratorMode) {
        initialStory = [
            { id: 1, type: 'system-notification' as const, content: openingNarrative },
        ];
    } else {
        initialStory = [
            { id: 1, type: 'narrative' as const, content: openingNarrative },
            { id: 2, type: 'system' as const, content: 'Hành trình của bạn bắt đầu. Hãy tìm kiếm một vị sư phụ để học cách tu tiên, hoặc khám phá thế giới rộng lớn này. Dùng ô "Hành Động" để tương tác.' },
        ];
    }

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

    const initialWorldState: WorldState = { rumors: [], dynamicEvents: [] };

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
        activeStory: null,
        combatState: null,
        dialogueWithNpcId: null,
        dialogueChoices: null,
        worldSects: [],
        eventIllustrations: [],
        storySummary: '',
        difficulty: difficulty,
        gameMode: isTransmigratorMode ? 'transmigrator' : 'classic',
        shopStates: {},
        playerStall: null,
        playerSect: null,
    };
};