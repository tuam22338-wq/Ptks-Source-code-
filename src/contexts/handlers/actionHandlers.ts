// FIX: Add React import for MutableRefObject type
import type React from 'react';
import type { Dispatch } from 'react';
import type { GameState, GameSettings, FullMod, StoryEntry, WorldCreationData, PlayerCharacter } from '../../types';
import type { Action } from '../gameReducer';
import type { GameStartData } from '../AppContext';
import * as db from '../../services/dbService';
import { createNewGameState, migrateGameState } from '../../utils/gameStateManager';
import { processPlayerAction } from '../../services/actionService';
import { 
    generateLoadingNarratives,
    generateWorldFromPrompts, 
    generateCompleteWorldFromText,
} from '../../services/gemini/modding.service';
// FIX: `generateCharacterFromPrompts` is exported from character.service, not modding.service
import { generateCharacterFromPrompts } from '../../services/gemini/character.service';
import { generateInitialWorldDetails } from '../../services/gemini/character.service';
import { DEFAULT_ATTRIBUTE_DEFINITIONS, DEFAULT_ATTRIBUTE_GROUPS } from '../../constants';

export async function createAndStartGame(
    worldCreationData: WorldCreationData, 
    slotId: number, 
    dispatch: Dispatch<Action>, 
    settings: GameSettings,
    loadSaveSlots: () => Promise<void>
) {
    dispatch({ type: 'SET_CURRENT_SLOT_ID', payload: slotId });
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Chuẩn bị Sáng Thế...' } });

    try {
        const narratives = await generateLoadingNarratives(worldCreationData, settings);
        dispatch({ type: 'SET_LOADING_NARRATIVES', payload: narratives });
    } catch (e) {
        console.warn("Không thể tạo thông điệp tải game, tiếp tục không có chúng.");
        dispatch({ type: 'SET_LOADING_NARRATIVES', payload: null });
    }

    let primaryWorldMod = worldCreationData.importedMod;
    const modLibrary = await db.getModLibrary();
    const enabledModsInfo = modLibrary.filter(m => m.isEnabled);
    const enabledMods = (await Promise.all(
        enabledModsInfo.map(modInfo => db.getModContent(modInfo.modInfo.id))
    )).filter((mod): mod is FullMod => mod !== undefined);

    if (!primaryWorldMod) {
        primaryWorldMod = enabledMods.find(m => m.content.worldData && m.content.worldData.length > 0) || null;
    }

    if (!primaryWorldMod) {
        dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'AI đang kiến tạo thế giới từ ý tưởng...' } });
        const promptsForGen = {
            modInfo: {
                id: (worldCreationData.theme || 'custom_world').toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, ''),
                name: worldCreationData.theme || 'Thế Giới Tùy Chỉnh',
                tags: [worldCreationData.genre],
                author: worldCreationData.character.name,
            },
            prompts: {
                setting: worldCreationData.setting,
                mainGoal: worldCreationData.mainGoal,
                openingStory: worldCreationData.openingStory,
            },
            attributeSystem: worldCreationData.attributeSystem,
            namedRealmSystems: worldCreationData.enableRealmSystem && worldCreationData.namedRealmSystem ? [worldCreationData.namedRealmSystem] : undefined,
            factions: worldCreationData.factionGenerationMode === 'CUSTOM' ? worldCreationData.customFactions : undefined,
            locations: worldCreationData.locationGenerationMode === 'CUSTOM' ? worldCreationData.customLocations : undefined,
            npcs: worldCreationData.npcGenerationMode === 'CUSTOM' ? worldCreationData.customNpcs : undefined,
        };
        primaryWorldMod = await generateWorldFromPrompts(promptsForGen);
    }

    const otherActiveMods = enabledMods.filter(m => m.modInfo.id !== primaryWorldMod!.modInfo.id);
    const activeMods: FullMod[] = [primaryWorldMod, ...otherActiveMods];

    dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'AI đang kiến tạo nhân vật...' } });

    let gender = worldCreationData.character.gender;
    if (gender === 'AI') {
        gender = Math.random() < 0.5 ? 'Nam' : 'Nữ';
    }
    
    const attributeSystemToUse = worldCreationData.attributeSystem || activeMods.find(m => m.content.attributeSystem)?.content.attributeSystem || { definitions: DEFAULT_ATTRIBUTE_DEFINITIONS, groups: DEFAULT_ATTRIBUTE_GROUPS };

    const { identity, spiritualRoot, initialBonuses, initialItems, initialCurrency } = await generateCharacterFromPrompts({
        draftIdentity: {
            name: worldCreationData.character.name,
            familyName: '',
            gender: gender,
            appearance: worldCreationData.character.bio,
            personality: 'Trung Lập',
        },
        raceInput: `${worldCreationData.genre}, ${worldCreationData.theme}`,
        backgroundInput: worldCreationData.setting,
    }, attributeSystemToUse);

    const gameStartData: GameStartData = {
        ...worldCreationData,
        identity,
        spiritualRoot,
        initialBonuses,
        initialItems,
        initialCurrency,
        npcDensity: 'medium',
        difficulty: worldCreationData.hardcoreMode ? 'hard' : 'medium',
        danhVong: { value: 0, status: 'Vô Danh Tiểu Tốt' },
        attributeSystem: attributeSystemToUse,
        namedRealmSystem: worldCreationData.enableRealmSystem ? worldCreationData.namedRealmSystem : null,
    };
    
    const setLoading = (msg: string) => dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: msg } });
    
    const newGameState = await createNewGameState(gameStartData, activeMods, setLoading);
    
    setLoading('Đang tạo dựng chúng sinh và viết nên chương mở đầu...');
    const generationMode = newGameState.creationData?.generationMode || 'deep';
    const { npcs, relationships, openingNarrative } = await generateInitialWorldDetails(newGameState, generationMode);

    if (newGameState.storyLog.length > 0) {
        newGameState.storyLog[0] = { ...newGameState.storyLog[0], content: openingNarrative };
    } else {
        newGameState.storyLog.push({ id: 1, type: 'narrative' as const, content: openingNarrative });
    }

    newGameState.playerCharacter.relationships.push(...relationships);
    newGameState.activeNpcs.push(...npcs);
    
    newGameState.isHydrated = true;
    delete newGameState.creationData;
    setLoading('Hoàn tất sáng thế!');

    await db.saveGameState(slotId, newGameState);
    await loadSaveSlots();

    const finalGameState = await migrateGameState(newGameState);
    dispatch({ type: 'LOAD_GAME', payload: { gameState: finalGameState, slotId: slotId } });
}


export async function quickCreateAndStartGame(
    description: string, 
    characterName: string, 
    slotId: number, 
    dispatch: Dispatch<Action>, 
    settings: GameSettings,
    loadSaveSlots: () => Promise<void>
) {
    dispatch({ type: 'SET_CURRENT_SLOT_ID', payload: slotId });
    dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'AI đang sáng thế, xin chờ...' } });

    const tempDataForNarrative: Partial<WorldCreationData> = {
        genre: 'AI Generated',
        theme: 'AI Generated',
        setting: description,
    };
    try {
        const narratives = await generateLoadingNarratives(tempDataForNarrative as WorldCreationData, settings);
        dispatch({ type: 'SET_LOADING_NARRATIVES', payload: narratives });
    } catch (e) {
        console.warn("Không thể tạo thông điệp tải game cho tạo nhanh, tiếp tục không có chúng.");
        dispatch({ type: 'SET_LOADING_NARRATIVES', payload: null });
    }

    const { mod, characterData, openingNarrative, familyNpcs, dynamicNpcs, relationships } = await generateCompleteWorldFromText(description, characterName, 'fast');

    const worldCreationData: WorldCreationData = {
        genre: mod.modInfo.tags?.[0] || 'Huyền Huyễn Tu Tiên',
        theme: mod.modInfo.name,
        setting: mod.modInfo.description || '',
        mainGoal: '',
        openingStory: '',
        importedMod: mod,
        fanficMode: false,
        hardcoreMode: false,
        character: { name: characterName, gender: characterData.identity.gender, bio: '' },
        attributeSystem: mod.content.attributeSystem,
        enableRealmSystem: !!(mod.content.namedRealmSystems && mod.content.namedRealmSystems.length > 0),
        realmTemplateId: 'custom',
        namedRealmSystem: mod.content.namedRealmSystems?.[0] || null,
        generationMode: 'fast',
        npcGenerationMode: 'NONE',
        locationGenerationMode: 'AI',
        factionGenerationMode: 'AI',
        customNpcs: [],
        customLocations: [],
        customFactions: [],
        ...settings,
    };
    
    const setLoading = (msg: string) => dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: msg } });
    
    const newGameState = await createNewGameState({
        ...worldCreationData,
        ...characterData,
        difficulty: 'medium',
        npcDensity: 'medium',
        danhVong: { value: 0, status: 'Vô Danh Tiểu Tốt' },
    }, [mod], setLoading);
    
    newGameState.storyLog = [{ id: 1, type: 'narrative' as const, content: openingNarrative }];
    newGameState.playerCharacter.relationships.push(...relationships);
    newGameState.activeNpcs.push(...familyNpcs, ...dynamicNpcs);
    newGameState.isHydrated = true;
    delete newGameState.creationData;

    await db.saveGameState(slotId, newGameState);
    await loadSaveSlots();

    const finalGameState = await migrateGameState(newGameState);
    dispatch({ type: 'LOAD_GAME', payload: { gameState: finalGameState, slotId: slotId } });
}

export async function playerAction(
    text: string, 
    type: 'say' | 'act', 
    apCost: number, 
    showNotification: (message: string) => void,
    state: { gameState: GameState | null; settings: GameSettings; currentSlotId: number | null },
    dispatch: Dispatch<Action>,
    cancelSpeech: () => void,
    abortControllerRef: React.MutableRefObject<AbortController | null>
) {
    if (!state.gameState || state.currentSlotId === null) return;
    
    dispatch({ type: 'UPDATE_GAME_STATE', payload: gs => gs ? { ...gs, dialogueChoices: null } : null });
    
    cancelSpeech();
    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Thiên Cơ đang suy diễn...' }});
    dispatch({ type: 'PLAYER_ACTION_PENDING', payload: { text, type } });

    const onStreamUpdate = (content: string) => {
        dispatch({ type: 'STREAMING_NARRATIVE_UPDATE', payload: content });
    };

    try {
        const finalState = await processPlayerAction(
            state.gameState, 
            text, 
            type, 
            apCost, 
            state.settings, 
            showNotification, 
            abortControllerRef.current.signal,
            state.currentSlotId,
            onStreamUpdate
        );
        dispatch({ type: 'PLAYER_ACTION_RESOLVED', payload: finalState });
    } catch (error: any) {
        console.error("AI story generation failed:", error);
        const errorMessage = `[Hệ Thống] Lỗi kết nối với Thiên Đạo: ${error.message}`;
        
        dispatch({
            type: 'UPDATE_GAME_STATE',
            payload: (currentState) => {
                if (!currentState) return null;
                const errorEntry: StoryEntry = { id: Date.now(), type: 'system', content: errorMessage };
                
                const finalLog = currentState.storyLog.map(entry => {
                    if (entry.isPending) return { ...entry, isPending: false };
                    if (entry.type === 'narrative' && entry.content === '') return null;
                    return entry;
                }).filter(Boolean) as StoryEntry[];
                
                return { ...currentState, storyLog: [...finalLog, errorEntry] };
            }
        });
    } finally {
        dispatch({ type: 'SET_LOADING', payload: { isLoading: false }});
    }
}

export function updatePlayerCharacter(
    updater: (pc: PlayerCharacter) => PlayerCharacter,
    dispatch: Dispatch<Action>
) {
    dispatch({
        type: 'UPDATE_GAME_STATE',
        payload: (gs) => {
            if (!gs) return null;
            return { ...gs, playerCharacter: updater(gs.playerCharacter) };
        }
    });
}