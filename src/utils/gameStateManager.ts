import { FaQuestionCircle } from 'react-icons/fa';
import { ATTRIBUTES_CONFIG, CURRENT_GAME_VERSION, DEFAULT_CAVE_ABODE, FACTIONS, REALM_SYSTEM, SECTS, WORLD_MAP, MAIN_CULTIVATION_TECHNIQUES_DATABASE, MAJOR_EVENTS, NPC_LIST, DEFAULT_WORLD_ID } from "../constants";
// FIX: Import RealmConfig type
import type { GameState, AttributeGroup, Attribute, PlayerCharacter, NpcDensity, Inventory, Currency, CultivationState, GameDate, WorldState, Location, FullMod, NPC, Sect, MainCultivationTechnique, DanhVong, ModNpc, ModLocation, RealmConfig, ModWorldData } from "../types";
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
    let dataToProcess = { ...savedGame };

    if (dataToProcess.version !== CURRENT_GAME_VERSION) {
        let version = dataToProcess.version || "1.0.0";

        if (version === "1.0.0") {
            console.log("Migrating save from v1.0.0 to v1.1.0...");
            
            dataToProcess.activeMods = dataToProcess.activeMods ?? [];
            dataToProcess.realmSystem = dataToProcess.realmSystem ?? REALM_SYSTEM;
            dataToProcess.majorEvents = dataToProcess.majorEvents ?? MAJOR_EVENTS;
            dataToProcess.encounteredNpcIds = dataToProcess.encounteredNpcIds ?? [];
            dataToProcess.activeStory = dataToProcess.activeStory ?? null;
            dataToProcess.storySummary = dataToProcess.storySummary ?? '';

            if (dataToProcess.playerCharacter) {
                // Other migrations
                dataToProcess.playerCharacter.relationships = dataToProcess.playerCharacter.relationships ?? [];
                dataToProcess.playerCharacter.reputation = dataToProcess.playerCharacter.reputation ?? FACTIONS.map(f => ({ factionName: f.name, value: 0, status: 'Trung Lập' }));
                dataToProcess.playerCharacter.chosenPathIds = dataToProcess.playerCharacter.chosenPathIds ?? [];
                dataToProcess.playerCharacter.knownRecipeIds = dataToProcess.playerCharacter.knownRecipeIds ?? [];
                dataToProcess.playerCharacter.sect = dataToProcess.playerCharacter.sect ?? null;
                dataToProcess.playerCharacter.caveAbode = dataToProcess.playerCharacter.caveAbode ?? DEFAULT_CAVE_ABODE;
                dataToProcess.playerCharacter.techniqueCooldowns = dataToProcess.playerCharacter.techniqueCooldowns ?? {};
                dataToProcess.playerCharacter.inventoryActionLog = dataToProcess.playerCharacter.inventoryActionLog ?? [];
                dataToProcess.playerCharacter.danhVong = dataToProcess.playerCharacter.danhVong ?? { value: 0, status: 'Vô Danh Tiểu Tốt' };
                
                // Quest system migration
                dataToProcess.playerCharacter.activeQuests = dataToProcess.playerCharacter.activeQuests ?? [];
                dataToProcess.playerCharacter.completedQuestIds = dataToProcess.playerCharacter.completedQuestIds ?? [];
                delete dataToProcess.playerCharacter.activeMissions;
            }
            
            dataToProcess.version = "1.1.0";
            version = "1.1.0";
        }
    
        if (version !== CURRENT_GAME_VERSION) {
            throw new Error(`Migration failed. Could not migrate from ${savedGame.version || 'unversioned'} to ${CURRENT_GAME_VERSION}.`);
        }
    }
    
    // This migration can be removed in future versions, but is kept for saves that might have missed the 1.1.0 technique system update
    if (dataToProcess.playerCharacter && dataToProcess.playerCharacter.techniques) {
        console.log("Applying late technique system migration...");
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


    dataToProcess.worldSects = dataToProcess.worldSects ?? [];
    dataToProcess.eventIllustrations = dataToProcess.eventIllustrations ?? [];
    dataToProcess.dialogueChoices = dataToProcess.dialogueChoices ?? null;
    if (dataToProcess.playerCharacter) {
         dataToProcess.playerCharacter.inventoryActionLog = dataToProcess.playerCharacter.inventoryActionLog ?? [];
         dataToProcess.playerCharacter.activeQuests = dataToProcess.playerCharacter.activeQuests ?? [];
         dataToProcess.playerCharacter.completedQuestIds = dataToProcess.playerCharacter.completedQuestIds ?? [];
// FIX: Add element to player character on migration for older saves.
         if (!dataToProcess.playerCharacter.element) {
            dataToProcess.playerCharacter.element = 'Vô';
         }
    }
    dataToProcess.storySummary = dataToProcess.storySummary ?? '';

    // Re-hydrate data that was stripped for saving
    if (!dataToProcess.realmSystem) {
        dataToProcess.realmSystem = REALM_SYSTEM; // TODO: Reconstruct from mods if necessary
    }
    if (!dataToProcess.activeMods) {
        dataToProcess.activeMods = []; // TODO: Reconstruct from DB on load
    }


    const allAttributesConfig = new Map<string, any>();
    ATTRIBUTES_CONFIG.forEach(group => {
        group.attributes.forEach(attr => {
            allAttributesConfig.set(attr.name, attr);
        });
    });

    const rehydrateAttributes = (groups: AttributeGroup[]): AttributeGroup[] => {
        return groups.map((group: AttributeGroup) => ({
            ...group,
            attributes: group.attributes.map((attr: Attribute) => {
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
    
    // Use a function to get contextual actions since WORLD_MAP is not exhaustive with mods
    const CONTEXTUAL_ACTION_ICONS: Record<string, any> = { talk_villagers: GiTalk, rest_inn: GiBed, gather_herbs: GiHerbsBundle, mine_ore: GiStoneBlock, closed_door_cultivation: GiMountainCave, alchemy: GiCauldron };
    const getContextualAction = (actionId: string, label: string, description: string) => ({ id: actionId, label, description, icon: CONTEXTUAL_ACTION_ICONS[actionId] || FaQuestionCircle });

    if (dataToProcess.discoveredLocations) {
        dataToProcess.discoveredLocations = dataToProcess.discoveredLocations.map((loc: Location) => {
            if (!loc.contextualActions) {
                 const config = WORLD_MAP.find(l => l.id === loc.id);
                 if (config && config.contextualActions) {
                     return { ...loc, contextualActions: config.contextualActions };
                 }
                 return loc;
            }
            return {
                ...loc,
                contextualActions: loc.contextualActions.map((action: any) => 
                     getContextualAction(action.id, action.label, action.description)
                )
            };
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
        equipment: {},
        healthStatus: 'HEALTHY',
        activeEffects: [],
        tuoiTho: 300,
        faction: modNpc.faction,
    };
};

export const createNewGameState = async (
    gameStartData: {
        characterData: Omit<PlayerCharacter, 'inventory' | 'currencies' | 'cultivation' | 'currentLocationId' | 'equipment' | 'mainCultivationTechnique' | 'auxiliaryTechniques' | 'techniquePoints' |'relationships' | 'chosenPathIds' | 'knownRecipeIds' | 'reputation' | 'sect' | 'caveAbode' | 'techniqueCooldowns' | 'activeQuests' | 'completedQuestIds' | 'inventoryActionLog' | 'danhVong' | 'element'> & { danhVong: DanhVong },
        npcDensity: NpcDensity
    },
    activeMods: FullMod[],
    activeWorldId: string
): Promise<GameState> => {
    const { characterData, npcDensity } = gameStartData;

    // --- World Data Overhaul ---
    let worldData: ModWorldData | null = null;
    if (activeWorldId !== DEFAULT_WORLD_ID) {
        for (const mod of activeMods) {
            // FIX: Find world by name, as `id` is omitted in mod content definition.
            const foundWorld = mod.content.worldData?.find(wd => wd.name === activeWorldId);
            if (foundWorld) {
                // FIX: Reconstruct ModWorldData with `id` from `activeWorldId` (which is the world's name/ID).
                worldData = { ...foundWorld, id: activeWorldId };
                console.log(`Loading world data from mod: ${worldData.name}`);
                break;
            }
        }
        if (!worldData) {
            console.warn(`Active world ID "${activeWorldId}" not found in active mods. Falling back to default world.`);
        }
    }

    // FIX: Ensure locations from mods have an ID to satisfy the Location type. Use name as ID if missing.
    const worldMapToUse: Location[] = worldData 
        ? worldData.initialLocations.map(l => ({
            ...l,
            id: l.id || l.name,
            contextualActions: [],
        } as Location))
        : WORLD_MAP;
    const initialNpcsFromData = worldData ? worldData.initialNpcs.map(n => convertModNpcToNpc(n, REALM_SYSTEM)) : NPC_LIST;
    const majorEventsToUse = worldData ? worldData.majorEvents : MAJOR_EVENTS;
    const factionsToUse = worldData ? worldData.factions : FACTIONS;
    const startingYear = worldData ? worldData.startingYear : 1;
    const eraName = worldData ? worldData.eraName : 'Tiên Phong Thần';

    const modRealmSystem = activeMods.find(m => m.content.realmConfigs)?.content.realmConfigs;
    const realmSystemToUse = modRealmSystem && modRealmSystem.length > 0
        ? modRealmSystem.map(realm => ({...realm, id: realm.name.toLowerCase().replace(/\s+/g, '_')}))
        : REALM_SYSTEM;
        
    const canCotAttr = characterData.attributes.flatMap(g => g.attributes).find(a => a.name === 'Căn Cốt');
    const canCotValue = (canCotAttr?.value as number) || 10;
    const initialWeightCapacity = 20 + (canCotValue - 10) * 2;

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
    const initialCurrencies: Currency = { 
        'Đồng': 1000, 
        'Bạc': 50,
        'Vàng': 0,
        'Linh thạch hạ phẩm': 20,
    };

    const initialCultivation: CultivationState = {
        currentRealmId: realmSystemToUse[0].id,
        currentStageId: realmSystemToUse[0].stages[0].id,
        spiritualQi: 0,
        hasConqueredInnerDemon: false,
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
    const caveAbodeLocation = worldMapToUse.find(l => l.id === DEFAULT_CAVE_ABODE.locationId);

    let playerCharacter: PlayerCharacter = {
        identity: { ...characterData.identity, age: 18 },
        attributes: updatedAttributes,
        talents: characterData.talents,
        inventory: initialInventory,
        currencies: initialCurrencies,
        cultivation: initialCultivation,
        currentLocationId: startingLocation.id,
        equipment: {},
        mainCultivationTechnique: null,
        auxiliaryTechniques: [],
        techniquePoints: 0,
        relationships: [],
        danhVong: characterData.danhVong,
        reputation: factionsToUse.map(f => ({ factionName: f.name, value: 0, status: 'Trung Lập' })),
        chosenPathIds: [],
        knownRecipeIds: [],
        sect: null,
        caveAbode: DEFAULT_CAVE_ABODE,
        healthStatus: 'HEALTHY',
        activeEffects: [],
        techniqueCooldowns: {},
        activeQuests: [],
        completedQuestIds: [],
        inventoryActionLog: [],
// FIX: Initialize the player's element property.
        element: 'Vô',
    };
    
    const { npcs: familyNpcs, relationships: familyRelationships } = await generateFamilyAndFriends(playerCharacter.identity, startingLocation.id);
    playerCharacter.relationships = familyRelationships;

    const generatedNpcs = await generateDynamicNpcs(npcDensity);
    if (!generatedNpcs || generatedNpcs.length === 0) {
        throw new Error("AI không thể tạo ra chúng sinh. Vui lòng kiểm tra API Key.");
    }

    const allNpcs = [...initialNpcsFromData, ...familyNpcs, ...generatedNpcs];
    
    const tempGameStateForOpening = {
        playerCharacter,
        activeNpcs: allNpcs,
        discoveredLocations: [startingLocation],
    } as GameState;

    const openingNarrative = await generateOpeningScene(tempGameStateForOpening);

    const initialStory = [
        { id: 1, type: 'narrative' as const, content: openingNarrative },
        { id: 2, type: 'system' as const, content: 'Bạn có thể dùng ô "Nói" để giao tiếp, "Hành Động" để tương tác, hoặc nhập "tu luyện" để tĩnh tọa hấp thụ linh khí.' },
    ];

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

    const initialWorldState: WorldState = { rumors: [] };

    const discoveredLocations: Location[] = [startingLocation, ...worldMapToUse.filter(l => l.neighbors.includes(startingLocation.id))];
    if (caveAbodeLocation && !discoveredLocations.some(l => l.id === caveAbodeLocation.id)) {
        discoveredLocations.push(caveAbodeLocation);
    }

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
    };
};