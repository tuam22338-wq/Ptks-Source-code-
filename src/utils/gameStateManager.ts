import { FaQuestionCircle } from 'react-icons/fa';
import { ATTRIBUTES_CONFIG, CURRENT_GAME_VERSION, DEFAULT_CAVE_ABODE, FACTIONS, INITIAL_TECHNIQUES, REALM_SYSTEM, SECTS, WORLD_MAP, MAIN_CULTIVATION_TECHNIQUES_DATABASE } from "../constants";
import type { GameState, AttributeGroup, Attribute, PlayerCharacter, NpcDensity, Inventory, Currency, CultivationState, GameDate, WorldState, Location, FullMod, NPC, Sect, MainCultivationTechnique } from "../types";
import { generateDynamicNpcs } from '../services/geminiService';

const initialStory = [
    { id: 1, type: 'narrative' as const, content: 'Màn sương mỏng dần, để lộ ra một con đường mòn phủ đầy lá rụng trong khu rừng tĩnh mịch. Không khí se lạnh mang theo mùi đất ẩm và cây cỏ. Xa xa, tiếng chim hót lảnh lót phá vỡ sự yên tĩnh. Đây là nơi câu chuyện của bạn bắt đầu.' },
    { id: 2, type: 'system' as const, content: 'Bạn có thể dùng ô "Nói" để giao tiếp, "Hành Động" để tương tác, hoặc nhập "tu luyện" để tĩnh tọa hấp thụ linh khí.' },
];

export const migrateGameState = (savedGame: any): GameState => {
    let dataToProcess = { ...savedGame };

    if (dataToProcess.version !== CURRENT_GAME_VERSION) {
        let version = dataToProcess.version || "1.0.0";

        if (version === "1.0.0") {
            console.log("Migrating save from v1.0.0 to v1.1.0...");
            
            dataToProcess.activeMods = dataToProcess.activeMods ?? [];
            dataToProcess.realmSystem = dataToProcess.realmSystem ?? REALM_SYSTEM;
            dataToProcess.encounteredNpcIds = dataToProcess.encounteredNpcIds ?? [];
            dataToProcess.activeStory = dataToProcess.activeStory ?? null;

            if (dataToProcess.playerCharacter) {
                // Other migrations
                dataToProcess.playerCharacter.relationships = dataToProcess.playerCharacter.relationships ?? [];
                dataToProcess.playerCharacter.reputation = dataToProcess.playerCharacter.reputation ?? FACTIONS.map(f => ({ factionName: f.name, value: 0, status: 'Trung Lập' }));
                dataToProcess.playerCharacter.chosenPathIds = dataToProcess.playerCharacter.chosenPathIds ?? [];
                dataToProcess.playerCharacter.knownRecipeIds = dataToProcess.playerCharacter.knownRecipeIds ?? [];
                dataToProcess.playerCharacter.sect = dataToProcess.playerCharacter.sect ?? null;
                dataToProcess.playerCharacter.caveAbode = dataToProcess.playerCharacter.caveAbode ?? DEFAULT_CAVE_ABODE;
                dataToProcess.playerCharacter.techniqueCooldowns = dataToProcess.playerCharacter.techniqueCooldowns ?? {};
                dataToProcess.playerCharacter.activeMissions = dataToProcess.playerCharacter.activeMissions ?? [];
                dataToProcess.playerCharacter.inventoryActionLog = dataToProcess.playerCharacter.inventoryActionLog ?? [];
            }
            
            dataToProcess.version = "1.1.0";
            version = "1.1.0";
        }
    
        if (version !== CURRENT_GAME_VERSION) {
            throw new Error(`Migration failed. Could not migrate from ${savedGame.version || 'unversioned'} to ${CURRENT_GAME_VERSION}.`);
        }
    }
    
    // Rework technique system for old saves or saves that missed the migration.
     if (dataToProcess.playerCharacter && (!dataToProcess.playerCharacter.mainCultivationTechnique || dataToProcess.playerCharacter.mainCultivationTechnique.id === 'main_tech_van_vat_quy_nguyen')) {
        const randomIndex = Math.floor(Math.random() * MAIN_CULTIVATION_TECHNIQUES_DATABASE.length);
        const newTechnique = JSON.parse(JSON.stringify(MAIN_CULTIVATION_TECHNIQUES_DATABASE[randomIndex]));
        
        if(newTechnique) {
            newTechnique.skillTreeNodes['root'].isUnlocked = true;
        }

        dataToProcess.playerCharacter.mainCultivationTechnique = newTechnique;
        dataToProcess.playerCharacter.auxiliaryTechniques = dataToProcess.playerCharacter.techniques || INITIAL_TECHNIQUES;
        delete dataToProcess.playerCharacter.techniques;
        dataToProcess.playerCharacter.techniquePoints = dataToProcess.playerCharacter.techniquePoints ?? 1;
        console.log(`Migrated to new main cultivation technique: ${newTechnique.name}`);
    }


    dataToProcess.worldSects = dataToProcess.worldSects ?? [];
    dataToProcess.eventIllustrations = dataToProcess.eventIllustrations ?? [];
    dataToProcess.dialogueChoices = dataToProcess.dialogueChoices ?? null;
    if (dataToProcess.playerCharacter) {
         dataToProcess.playerCharacter.inventoryActionLog = dataToProcess.playerCharacter.inventoryActionLog ?? [];
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

    const allLocationsConfig = new Map<string, Location>();
    WORLD_MAP.forEach(loc => allLocationsConfig.set(loc.id, loc));
    if (dataToProcess.discoveredLocations) {
        dataToProcess.discoveredLocations = dataToProcess.discoveredLocations.map((loc: Location) => {
            const config = allLocationsConfig.get(loc.id);
            if (config && config.contextualActions) {
                return { ...loc, contextualActions: config.contextualActions };
            }
            return loc;
        });
    }

    return dataToProcess as GameState;
};

export const createNewGameState = async (
    gameStartData: {
        characterData: Omit<PlayerCharacter, 'inventory' | 'currencies' | 'cultivation' | 'currentLocationId' | 'equipment' | 'auxiliaryTechniques' | 'mainCultivationTechnique' | 'techniquePoints' |'relationships' | 'chosenPathIds' | 'knownRecipeIds' | 'reputation' | 'sect' | 'caveAbode' | 'techniqueCooldowns' | 'activeMissions' | 'inventoryActionLog'>,
        npcDensity: NpcDensity
    },
    activeMods: FullMod[]
): Promise<GameState> => {
    const { characterData, npcDensity } = gameStartData;

    const modRealmSystem = activeMods.find(m => m.content.realmConfigs)?.content.realmConfigs;
    const realmSystemToUse = modRealmSystem && modRealmSystem.length > 0
        ? modRealmSystem.map(realm => ({...realm, id: realm.name.toLowerCase().replace(/\s+/g, '_')}))
        : REALM_SYSTEM;
        
    const generatedNpcs = await generateDynamicNpcs(npcDensity);
    if (!generatedNpcs || generatedNpcs.length === 0) {
        throw new Error("AI không thể tạo ra chúng sinh. Vui lòng kiểm tra API Key.");
    }

    const canCotAttr = characterData.attributes.flatMap(g => g.attributes).find(a => a.name === 'Căn Cốt');
    const canCotValue = (canCotAttr?.value as number) || 10;
    const initialWeightCapacity = 20 + (canCotValue - 10) * 2;

    const initialInventory: Inventory = {
        weightCapacity: initialWeightCapacity,
        items: [
            { id: 'item1', name: 'Bình Dược Liệu', description: 'Một bình sứ chứa thảo dược cơ bản để trị thương.', quantity: 5, type: 'Đan Dược', icon: '🏺', weight: 0.5, quality: 'Phàm Phẩm' },
            { id: 'item2', name: 'Trường Bào Đạo Sĩ', description: 'Một bộ y phục của người tu đạo, giúp tĩnh tâm凝神.', quantity: 1, type: 'Phòng Cụ', icon: '🥋', bonuses: [{ attribute: 'Nguyên Thần', value: 1 }], weight: 1.5, quality: 'Phàm Phẩm', slot: 'Thượng Y' },
            { id: 'item3', name: 'Đào Mộc Kiếm', description: 'Một thanh kiếm bằng gỗ đào, có khả năng khắc chế yêu ma tà mị.', quantity: 1, type: 'Vũ Khí', icon: '🗡️', bonuses: [{ attribute: 'Linh Lực Sát Thương', value: 2 }], weight: 2.0, quality: 'Phàm Phẩm', slot: 'Vũ Khí' },
            { id: 'item4', name: 'Lệnh Bài Thân Phận', description: 'Một lệnh bài bằng gỗ đào, khắc tên và xuất thân của bạn.', quantity: 1, type: 'Tạp Vật', icon: '🪪', weight: 0.1, quality: 'Phàm Phẩm' },
            { id: 'item5', name: 'Phá Cấm Phù', description: 'Một lá bùa đơn giản có thể phá giải các cấm chế cấp thấp.', quantity: 3, type: 'Pháp Bảo', rank: 'Phàm Giai', icon: '📜', bonuses: [{ attribute: 'Thần Thức', value: 1 }], weight: 0.1, quality: 'Linh Phẩm' },
            { id: 'item6', name: 'Sơ Cấp Tu Luyện Tâm Pháp', description: 'Ghi lại những khẩu quyết cơ bản để dẫn khí nhập thể, giúp tăng tốc độ tu luyện ban đầu.', quantity: 1, type: 'Tạp Vật', icon: '📖', bonuses: [{ attribute: 'Ngộ Tính', value: 2 }], weight: 0.5, quality: 'Phàm Phẩm' },
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

    const initialCoreLocations = WORLD_MAP.filter(l => l.type === 'Thành Thị' || l.type === 'Thôn Làng');
    const startingLocation = initialCoreLocations[Math.floor(Math.random() * initialCoreLocations.length)] || WORLD_MAP[0];
    const caveAbodeLocation = WORLD_MAP.find(l => l.id === DEFAULT_CAVE_ABODE.locationId);

    const randomIndex = Math.floor(Math.random() * MAIN_CULTIVATION_TECHNIQUES_DATABASE.length);
    const selectedTechnique = JSON.parse(JSON.stringify(MAIN_CULTIVATION_TECHNIQUES_DATABASE[randomIndex]));
    // Mark root as unlocked
    selectedTechnique.skillTreeNodes['root'].isUnlocked = true;

    const finalPlayerCharacter: PlayerCharacter = {
        identity: { ...characterData.identity, age: 18 },
        attributes: updatedAttributes,
        talents: characterData.talents,
        inventory: initialInventory,
        currencies: initialCurrencies,
        cultivation: initialCultivation,
        currentLocationId: startingLocation.id,
        equipment: {},
        mainCultivationTechnique: selectedTechnique,
        auxiliaryTechniques: INITIAL_TECHNIQUES,
        techniquePoints: 1,
        relationships: [],
        reputation: FACTIONS.map(f => ({ factionName: f.name, value: 0, status: 'Trung Lập' })),
        chosenPathIds: [],
        knownRecipeIds: [],
        sect: null,
        caveAbode: DEFAULT_CAVE_ABODE,
        healthStatus: 'HEALTHY',
        activeEffects: [],
        techniqueCooldowns: {},
        activeMissions: [],
        inventoryActionLog: [],
    };

    const initialGameDate: GameDate = {
        era: 'Tiên Phong Thần',
        year: 1,
        season: 'Xuân',
        day: 1,
        timeOfDay: 'Buổi Sáng',
        shichen: 'Tỵ',
        weather: 'SUNNY',
        actionPoints: 4,
        maxActionPoints: 4,
    };

    const initialWorldState: WorldState = { rumors: [] };

    const discoveredLocations: Location[] = [startingLocation, ...WORLD_MAP.filter(l => l.neighbors.includes(startingLocation.id))];
    if (caveAbodeLocation && !discoveredLocations.some(l => l.id === caveAbodeLocation.id)) {
        discoveredLocations.push(caveAbodeLocation);
    }

    return {
        version: CURRENT_GAME_VERSION,
        playerCharacter: finalPlayerCharacter,
        activeNpcs: generatedNpcs as NPC[],
        gameDate: initialGameDate,
        discoveredLocations: discoveredLocations,
        worldState: initialWorldState,
        storyLog: initialStory,
        encounteredNpcIds: [],
        activeMods: activeMods,
        realmSystem: realmSystemToUse,
        activeStory: null,
        combatState: null,
        dialogueWithNpcId: null,
        dialogueChoices: null,
        worldSects: [],
        eventIllustrations: [],
    };
};