
// FIX: Import `GenerateContentResponse` and `GenerateImagesResponse` from `@google/genai` to correctly type the responses from the Gemini API.
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
// FIX: Import additional types required for mod-based character generation.
import type { InnateTalent, InnateTalentRank, CharacterIdentity, AIAction, GameSettings, PlayerCharacter, StoryEntry, InventoryItem, GameDate, Location, NPC, GameEvent, Gender, CultivationTechnique, Rumor, WorldState, GameState, RealmConfig, RealmStage, ModTechnique, ModNpc, ModEvent, PlayerNpcRelationship, ModTalent, ModTalentRank, TalentSystemConfig } from '../types';
import { TALENT_RANK_NAMES, DEFAULT_SETTINGS, ALL_ATTRIBUTES, WORLD_MAP, NARRATIVE_STYLES, REALM_SYSTEM } from "../constants";

// --- Key Manager ---
const ApiKeyManager = (() => {
    let keys: string[] = [];
    let currentKeyIndex = 0;

    const loadKeys = () => {
        try {
            const settingsStr = localStorage.getItem('game-settings');
            const settings = settingsStr ? JSON.parse(settingsStr) : {};
            const keyList = settings.apiKeys?.filter((k: string) => k.trim()) || [];
            
            if (settings.useKeyRotation && keyList.length > 0) {
                keys = keyList;
            } else if (settings.apiKey) {
                keys = [settings.apiKey.trim()];
            } else {
                keys = [process.env.API_KEY as string].filter(Boolean);
            }
            currentKeyIndex = 0;
        } catch (e) {
            console.error("Could not load API keys from settings.", e);
            keys = [process.env.API_KEY as string].filter(Boolean);
        }
    };

    loadKeys();

    return {
        getKey: (): string | null => {
            if (keys.length === 0) return null;
            return keys[currentKeyIndex];
        },
        rotateKey: (): string | null => {
            if (keys.length <= 1) return null;
            currentKeyIndex = (currentKeyIndex + 1) % keys.length;
            console.warn(`Rotating to API key #${currentKeyIndex + 1}`);
            return keys[currentKeyIndex];
        },
        reload: loadKeys,
        getKeys: () => keys,
        getCurrentIndex: () => currentKeyIndex,
    };
})();

export const reloadApiKeys = ApiKeyManager.reload;

const getAiClient = () => {
    const apiKey = ApiKeyManager.getKey();
    if (!apiKey) {
        throw new Error("API Key của Gemini chưa được cấu hình. Vui lòng vào Cài Đặt và thêm API Key.");
    }
    return new GoogleGenAI({ apiKey });
};


const getSettings = (): GameSettings => {
    try {
        const savedSettings = localStorage.getItem('game-settings');
        const parsed = savedSettings ? JSON.parse(savedSettings) : {};
        return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
        return DEFAULT_SETTINGS;
    }
};

const getSafetySettingsForApi = () => {
    const settings = getSettings();
    if (settings.masterSafetySwitch) {
        return [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ];
    }
    return [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: settings.safetyLevels.harassment as HarmBlockThreshold },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: settings.safetyLevels.hateSpeech as HarmBlockThreshold },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: settings.safetyLevels.sexuallyExplicit as HarmBlockThreshold },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: settings.safetyLevels.dangerousContent as HarmBlockThreshold },
    ];
};

const performApiCall = async <T>(
    apiFunction: (client: GoogleGenAI, request: any) => Promise<T>,
    baseRequest: any,
    maxRetries = 3
): Promise<T> => {
    const keyCount = ApiKeyManager.getKeys().length;
    if (keyCount === 0) getAiClient(); // This will throw the user-friendly error

    const initialKeyIndex = ApiKeyManager.getCurrentIndex();

    for (let i = 0; i < keyCount; i++) {
        let attempt = 0;
        while (attempt < maxRetries) {
            try {
                const ai = getAiClient();
                const response = await apiFunction(ai, baseRequest);
                return response;
            } catch (error: any) {
                attempt++;
                const errorMessage = error.toString().toLowerCase();
                const isAuthError = errorMessage.includes('400') || errorMessage.includes('permission') || errorMessage.includes('api key not valid');
                const isQuotaError = errorMessage.includes('429') || errorMessage.includes('resource_exhausted');

                if (isAuthError || isQuotaError) {
                    console.warn(`Key ${ApiKeyManager.getCurrentIndex() + 1}/${keyCount} failed: ${errorMessage}`);
                    break; 
                }
                
                if (attempt >= maxRetries) {
                    throw error;
                }

                const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
                console.warn(`Gặp lỗi máy chủ. Thử lại sau ${delay.toFixed(0)}ms... (Lần thử ${attempt}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        ApiKeyManager.rotateKey();
        if (ApiKeyManager.getCurrentIndex() === initialKeyIndex && keyCount > 1) {
             break; // We've tried all keys
        }
    }
    
    throw new Error("Tất cả các API key đều không thành công.");
};


// FIX: Add an explicit return type `Promise<GenerateContentResponse>` to `generateWithRetry`.
// This resolves multiple downstream errors where the compiler could not infer the type of the awaited response,
// thus treating `response.text` as an access on an `unknown` type.
const generateWithRetry = (generationRequest: any, maxRetries = 3): Promise<GenerateContentResponse> => {
    const settings = getSettings();
    const safetySettings = getSafetySettingsForApi();
    const finalRequest = {
        ...generationRequest,
        model: settings.mainTaskModel,
        config: { ...generationRequest.config, safetySettings }
    };
    return performApiCall((ai, req) => ai.models.generateContent(req), finalRequest, maxRetries);
};

// FIX: Add an explicit return type `Promise<GenerateImagesResponse>` to `generateImagesWithRetry`.
// This fixes an error where `response.generatedImages` was accessed on an `unknown` type because the
// compiler could not infer the response type.
const generateImagesWithRetry = (generationRequest: any, maxRetries = 3): Promise<GenerateImagesResponse> => {
    const settings = getSettings();
    const finalRequest = { ...generationRequest, model: settings.imageGenerationModel };
    return performApiCall((ai, req) => ai.models.generateImages(req), finalRequest, maxRetries);
};

export const testApiKeys = async (): Promise<{ key: string, status: 'valid' | 'invalid', error?: string }[]> => {
    reloadApiKeys();
    const keys = ApiKeyManager.getKeys();
    if (keys.length === 0) {
        return [{ key: 'N/A', status: 'invalid', error: 'Không có key nào được cung cấp.' }];
    }

    const results = [];
    for (const key of keys) {
        try {
            const testAi = new GoogleGenAI({ apiKey: key });
            await testAi.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' });
            results.push({ key: `...${key.slice(-4)}`, status: 'valid' as const });
        } catch (e: any) {
            results.push({ key: `...${key.slice(-4)}`, status: 'invalid' as const, error: e.message });
        }
    }
    return results;
};

// FIX: Add interface for mod talent configuration to be used in character generation.
interface ModTalentConfig {
    systemConfig: TalentSystemConfig;
    ranks: ModTalentRank[];
    availableTalents: ModTalent[];
}

// FIX: Update function signature to accept `modTalentConfig` and use it to dynamically generate character talents based on active mods.
// This resolves the error in CharacterCreationScreen.tsx where a third argument was passed to a function that only accepted two.
export const generateCharacterFoundation = async (concept: string, gender: Gender, modTalentConfig: ModTalentConfig): Promise<{ identity: Omit<CharacterIdentity, 'gender'>, talents: InnateTalent[] }> => {
    const talentRanks = modTalentConfig.ranks.length > 0 ? modTalentConfig.ranks.map(r => r.name) : TALENT_RANK_NAMES;
    const choicesPerRoll = modTalentConfig.systemConfig.choicesPerRoll || 6;
    
    const characterFoundationSchema = {
        type: Type.OBJECT,
        properties: {
            identity: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: 'Tên Hán Việt, phù hợp bối cảnh tiên hiệp. Ví dụ: "Lý Thanh Vân", "Hàn Lập".' },
                    origin: { type: Type.STRING, description: 'Xuất thân, nguồn gốc của nhân vật, chi tiết và lôi cuốn.' },
                    appearance: { type: Type.STRING, description: 'Mô tả ngoại hình chi tiết, độc đáo.' },
                    personality: { type: Type.STRING, enum: ['Trung Lập', 'Chính Trực', 'Hỗn Loạn', 'Tà Ác'], description: 'Một trong các tính cách được liệt kê.' },
                },
                required: ['name', 'origin', 'appearance', 'personality'],
            },
            talents: {
                type: Type.ARRAY,
                description: `Một danh sách gồm chính xác ${choicesPerRoll} tiên tư độc đáo.`,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: 'Tên của tiên tư, ngắn gọn và độc đáo (ví dụ: "Thánh Thể Hoang Cổ", "Kiếm Tâm Thông Minh").' },
                        description: { type: Type.STRING, description: 'Mô tả ngắn gọn về bản chất của tiên tư.' },
                        rank: { type: Type.STRING, enum: talentRanks, description: 'Cấp bậc của tiên tư.' },
                        effect: { type: Type.STRING, description: 'Mô tả hiệu ứng trong game của tiên tư.' },
                        bonuses: {
                            type: Type.ARRAY,
                            description: 'Danh sách các chỉ số được cộng thêm. Có thể là một mảng rỗng.',
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    attribute: { type: Type.STRING, enum: ALL_ATTRIBUTES, description: 'Tên chỉ số được cộng.' },
                                    value: { type: Type.NUMBER, description: 'Giá trị cộng thêm.' },
                                },
                                required: ['attribute', 'value'],
                            },
                        },
                        triggerCondition: { type: Type.STRING, description: 'Điều kiện kích hoạt đặc biệt (nếu có). Ví dụ: "Khi sinh mệnh dưới 20%".' },
                        synergy: { type: Type.STRING, description: 'Tương tác đặc biệt với các yếu tố khác (nếu có). Ví dụ: "Mạnh hơn khi trang bị kiếm".' },
                    },
                    required: ['name', 'description', 'rank', 'effect'],
                },
            }
        },
        required: ['identity', 'talents'],
    };

    const talentInstructions = modTalentConfig.systemConfig.allowAIGeneratedTalents !== false
    ? `Tạo ra ${choicesPerRoll} tiên tư độc đáo, có liên quan mật thiết đến thân phận và ý tưởng gốc của nhân vật. Phân bổ cấp bậc của chúng một cách ngẫu nhiên và hợp lý (sử dụng các cấp bậc: ${talentRanks.join(', ')}). Các tiên tư phải có chiều sâu, có thể có điều kiện kích hoạt hoặc tương tác đặc biệt.`
    : `CHỈ được chọn ${choicesPerRoll} tiên tư từ danh sách có sẵn sau: ${modTalentConfig.availableTalents.map(t => t.name).join(', ')}.`;

    const prompt = `Dựa trên ý tưởng và bối cảnh game tu tiên Phong Thần, hãy tạo ra một nhân vật hoàn chỉnh.
    - **Bối cảnh:** Phong Thần Diễn Nghĩa, thế giới huyền huyễn, tiên hiệp.
    - **Giới tính nhân vật:** ${gender}
    - **Ý tưởng gốc từ người chơi:** "${concept}"

    Nhiệm vụ:
    1.  **Tạo Thân Phận (Identity):** Dựa vào ý tưởng gốc, hãy sáng tạo ra một cái tên, xuất thân, ngoại hình, và tính cách độc đáo, sâu sắc và phù hợp với bối cảnh.
    2.  **Tạo Tiên Tư (Innate Talents):** ${talentInstructions}

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.
    `;

    const response = await generateWithRetry({
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: characterFoundationSchema,
        }
    });

    const json = JSON.parse(response.text);
    return json as { identity: Omit<CharacterIdentity, 'gender'>, talents: InnateTalent[] };
};

export const generateCharacterAvatar = async (identity: CharacterIdentity): Promise<string> => {
    const prompt = `Tạo ảnh chân dung (portrait) cho một nhân vật trong game tu tiên.
    - **Ngoại hình:** ${identity.appearance}
    - **Giới tính:** ${identity.gender}
    - **Xuất thân:** ${identity.origin}
    - **Phong cách:** Tranh vẽ nghệ thuật, phong cách thủy mặc kết hợp fantasy, chi tiết, ánh sáng đẹp.
    - **Bối cảnh:** Nền đơn giản, tập trung vào nhân vật.
    - **Tỷ lệ:** Chân dung cận mặt hoặc bán thân.
    `;

    const response = await generateImagesWithRetry({
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const generateDynamicNpcs = async (count: number): Promise<NPC[]> => {
    const availableLocations = WORLD_MAP.map(l => l.id);
    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                status: { type: Type.STRING, description: 'Mô tả trạng thái hiện tại của NPC (ví dụ: "Đang ngồi thiền trong hang động", "Đang mua bán ở chợ").' },
                description: { type: Type.STRING, description: 'Mô tả ngoại hình của NPC.' },
                origin: { type: Type.STRING, description: 'Mô tả xuất thân, nguồn gốc của NPC.' },
                personality: { type: Type.STRING, description: 'Tính cách của NPC (ví dụ: Trung Lập, Tà Ác, Hỗn Loạn, Chính Trực).' },
                talents: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            rank: { type: Type.STRING, enum: TALENT_RANK_NAMES },
                            effect: { type: Type.STRING },
                        },
                        required: ['name', 'description', 'rank', 'effect'],
                    },
                },
                locationId: { type: Type.STRING, enum: availableLocations },
            },
            required: ['name', 'status', 'description', 'origin', 'personality', 'talents', 'locationId'],
        },
    };
    
    const prompt = `Tạo ra ${count} NPC (Non-Player Characters) độc đáo cho thế giới game tu tiên Phong Thần.
    Các NPC này có thể là tu sĩ, yêu ma, dân thường, hoặc các sinh vật kỳ dị.
    Mỗi NPC cần có thông tin đầy đủ theo schema. Hãy sáng tạo và làm cho thế giới trở nên sống động.
    `;
    
    const settings = getSettings();
    const response = await generateWithRetry({
        model: settings.npcSimulationModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
        }
    });

    const npcsData = JSON.parse(response.text);
    return npcsData.map((npcData: any) => ({ ...npcData, id: `dynamic-npc-${Math.random().toString(36).substring(2, 9)}` }));
};

export const getGameMasterActionableResponse = async (prompt: string, fileContent?: string): Promise<AIAction> => {
    const statBonusSchema = { type: Type.OBJECT, properties: { attribute: { type: Type.STRING, enum: ALL_ATTRIBUTES }, value: { type: Type.NUMBER } }, required: ['attribute', 'value'] };

    const itemSchema = { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, type: { type: Type.STRING, enum: ['Vũ Khí', 'Phòng Cụ', 'Đan Dược', 'Pháp Bảo', 'Tạp Vật'] }, quality: { type: Type.STRING, enum: ['Phàm Phẩm', 'Linh Phẩm', 'Pháp Phẩm', 'Bảo Phẩm', 'Tiên Phẩm', 'Tuyệt Phẩm'] }, weight: { type: Type.NUMBER }, slot: { type: Type.STRING, enum: ['Vũ Khí', 'Thượng Y', 'Hạ Y', 'Giày', 'Phụ Kiện 1', 'Phụ Kiện 2'] }, bonuses: { type: Type.ARRAY, items: statBonusSchema }, tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['name', 'description', 'type', 'quality', 'weight'] };
    const talentSchema = { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, rank: { type: Type.STRING, enum: TALENT_RANK_NAMES }, bonuses: { type: Type.ARRAY, items: statBonusSchema }, tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['name', 'description', 'rank'] };
    const characterSchema = { type: Type.OBJECT, properties: { name: { type: Type.STRING }, gender: { type: Type.STRING, enum: ['Nam', 'Nữ'] }, origin: { type: Type.STRING }, appearance: { type: Type.STRING }, personality: { type: Type.STRING }, bonuses: { type: Type.ARRAY, items: statBonusSchema }, tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['name', 'gender', 'origin'] };
    const sectSchema = { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, location: { type: Type.STRING }, members: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, rank: { type: Type.STRING, enum: ['Tông Chủ', 'Trưởng Lão', 'Đệ Tử Chân Truyền', 'Đệ Tử Nội Môn', 'Đệ Tử Ngoại Môn'] } } } }, tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['name', 'description', 'location'] };
    const worldBuildingSchema = { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, data: { type: Type.OBJECT, description: "Đối tượng JSON tự do" }, tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['title', 'data'] };
    const realmSystemSchema = { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, hasTribulation: { type: Type.BOOLEAN }, stages: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, qiRequired: { type: Type.NUMBER }, bonuses: { type: Type.ARRAY, items: statBonusSchema } } } } } } };
    const talentSystemConfigSchema = { type: Type.OBJECT, properties: { systemName: { type: Type.STRING }, choicesPerRoll: { type: Type.NUMBER }, maxSelectable: { type: Type.NUMBER } } };
    
    const techniqueSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['Linh Kỹ', 'Thần Thông', 'Độn Thuật', 'Tuyệt Kỹ'] },
            cost: { type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['Linh Lực', 'Sinh Mệnh', 'Nguyên Thần'] }, value: { type: Type.NUMBER } }, required: ['type', 'value'] },
            cooldown: { type: Type.NUMBER },
            rank: { type: Type.STRING, enum: ['Phàm Giai', 'Tiểu Giai', 'Trung Giai', 'Cao Giai', 'Siêu Giai', 'Địa Giai', 'Thiên Giai', 'Thánh Giai'] },
            icon: { type: Type.STRING, description: "Một emoji biểu tượng" },
            requirements: { type: Type.ARRAY, items: statBonusSchema },
            effects: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['DAMAGE', 'HEAL', 'BUFF', 'DEBUFF'] }, details: { type: Type.OBJECT, description: 'Đối tượng JSON chứa chi tiết hiệu ứng' } }, required: ['type', 'details'] } },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['name', 'description', 'type', 'cost', 'cooldown', 'rank', 'icon'],
    };

    const npcSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            status: { type: Type.STRING },
            description: { type: Type.STRING },
            origin: { type: Type.STRING },
            personality: { type: Type.STRING },
            talentNames: { type: Type.ARRAY, items: { type: Type.STRING } },
            locationId: { type: Type.STRING, enum: WORLD_MAP.map(l => l.id) },
            relationships: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { targetNpcName: { type: Type.STRING }, type: { type: Type.STRING }, description: { type: Type.STRING } }, required: ['targetNpcName', 'type'] } },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['name', 'status', 'description', 'origin', 'personality', 'locationId'],
    };

    const eventSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: 'Tên định danh cho sự kiện' },
            description: { type: Type.STRING },
            trigger: { type: Type.OBJECT, nullable: true, properties: { type: { type: Type.STRING, enum: ['ON_ENTER_LOCATION', 'ON_TALK_TO_NPC', 'ON_GAME_DATE'] }, details: { type: Type.OBJECT, description: 'Đối tượng JSON chứa chi tiết trigger' } }, required: ['type', 'details'] },
            choices: { type: Type.ARRAY, items: { 
                type: Type.OBJECT, 
                properties: { 
                    text: { type: Type.STRING },
                    check: { type: Type.OBJECT, nullable: true, properties: { attribute: { type: Type.STRING, enum: ALL_ATTRIBUTES }, difficulty: { type: Type.NUMBER } }, required: ['attribute', 'difficulty'] },
                    outcomes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING, enum: ['GIVE_ITEM', 'REMOVE_ITEM', 'CHANGE_STAT', 'ADD_RUMOR', 'START_EVENT'] }, details: { type: Type.OBJECT, description: 'Đối tượng JSON chứa chi tiết outcome' } }, required: ['type', 'details'] } }
                },
                required: ['text']
            }},
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['name', 'description', 'choices']
    };

    const responseSchema = {
        oneOf: [
            { properties: { action: { const: 'CHAT' }, data: { type: Type.OBJECT, properties: { response: { type: Type.STRING } } } } },
            { properties: { action: { const: 'CREATE_ITEM' }, data: itemSchema } },
            { properties: { action: { const: 'CREATE_MULTIPLE_ITEMS' }, data: { type: Type.ARRAY, items: itemSchema } } },
            { properties: { action: { const: 'CREATE_TALENT' }, data: talentSchema } },
            { properties: { action: { const: 'CREATE_MULTIPLE_TALENTS' }, data: { type: Type.ARRAY, items: talentSchema } } },
            { properties: { action: { const: 'CREATE_SECT' }, data: sectSchema } },
            { properties: { action: { const: 'CREATE_MULTIPLE_SECTS' }, data: { type: Type.ARRAY, items: sectSchema } } },
            { properties: { action: { const: 'CREATE_CHARACTER' }, data: characterSchema } },
            { properties: { action: { const: 'CREATE_MULTIPLE_CHARACTERS' }, data: { type: Type.ARRAY, items: characterSchema } } },
            { properties: { action: { const: 'DEFINE_WORLD_BUILDING' }, data: worldBuildingSchema } },
            { properties: { action: { const: 'CREATE_REALM_SYSTEM' }, data: realmSystemSchema } },
            { properties: { action: { const: 'CONFIGURE_TALENT_SYSTEM' }, data: talentSystemConfigSchema } },
            { properties: { action: { const: 'CREATE_TECHNIQUE' }, data: techniqueSchema } },
            { properties: { action: { const: 'CREATE_MULTIPLE_TECHNIQUES' }, data: { type: Type.ARRAY, items: techniqueSchema } } },
            { properties: { action: { const: 'CREATE_NPC' }, data: npcSchema } },
            { properties: { action: { const: 'CREATE_MULTIPLE_NPCS' }, data: { type: Type.ARRAY, items: npcSchema } } },
            { properties: { action: { const: 'CREATE_EVENT' }, data: eventSchema } },
            { properties: { action: { const: 'CREATE_MULTIPLE_EVENTS' }, data: { type: Type.ARRAY, items: eventSchema } } },
            { properties: { action: { const: 'BATCH_ACTIONS' }, data: { type: Type.ARRAY, items: {
                 oneOf: [
                    { properties: { action: { const: 'CREATE_ITEM' }, data: itemSchema } },
                    { properties: { action: { const: 'CREATE_TALENT' }, data: talentSchema } },
                    { properties: { action: { const: 'CREATE_SECT' }, data: sectSchema } },
                    { properties: { action: { const: 'CREATE_TECHNIQUE' }, data: techniqueSchema } },
                    { properties: { action: { const: 'CREATE_NPC' }, data: npcSchema } },
                    { properties: { action: { const: 'CREATE_EVENT' }, data: eventSchema } },
                 ]
            } } } }
        ],
    };

    const systemInstruction = `Bạn là một GameMaster AI thông minh, giúp người dùng tạo mod cho game tu tiên Phong Thần Ký Sự.
    
    **HIỂU BIẾT VỀ CƠ CHẾ GAME:**
    - **Thuộc tính:** Nhân vật có các thuộc tính có thể được tăng cường. Bạn có thể tạo vật phẩm/tiên tư cộng trực tiếp vào các thuộc tính này. Danh sách đầy đủ: ${ALL_ATTRIBUTES.join(', ')}.
    - **Hệ thống Tu Luyện:** Trò chơi có hệ thống cảnh giới (vd: Luyện Khí, Trúc Cơ). Bạn có thể định nghĩa lại toàn bộ hệ thống này bằng \`CREATE_REALM_SYSTEM\`. Mỗi cảnh giới có nhiều giai đoạn, yêu cầu điểm linh khí (qiRequired) và có thể cộng chỉ số (bonuses).
    - **Vật phẩm (Items):** Gồm 5 loại: Vũ Khí, Phòng Cụ, Đan Dược, Pháp Bảo, Tạp Vật. Chúng có phẩm chất, trọng lượng, và có thể cộng chỉ số.
    - **Tiên Tư (Talents):** Là các tài năng bẩm sinh, có cấp bậc, và cũng có thể cộng chỉ số.
    - **Công Pháp (Techniques):** Là các kỹ năng nhân vật có thể sử dụng, có tiêu hao, hồi chiêu, và cấp bậc.
    - **Sự kiện (Events):** Là các tình huống có kịch bản với các lựa chọn, có thể yêu cầu kiểm tra thuộc tính (skill check) và dẫn đến các kết quả khác nhau.

    **NHIỆM VỤ CỦA BẠN:**
    Phân tích yêu cầu của người dùng và chuyển đổi nó thành một hành động có cấu trúc (action) tương thích với các cơ chế trên.
    - Nếu người dùng chỉ đang trò chuyện hoặc hỏi, hãy sử dụng hành động 'CHAT'.
    - Nếu người dùng yêu cầu tạo một hoặc nhiều vật phẩm, tiên tư, nhân vật, tông môn, công pháp, NPC, sự kiện v.v., hãy sử dụng các hành động 'CREATE' tương ứng.
    - Nếu người dùng yêu cầu nhiều thứ cùng lúc, hãy sử dụng 'BATCH_ACTIONS'.
    - Luôn trả lời ở định dạng JSON theo một trong các cấu trúc 'action' hợp lệ. Ví dụ: { "action": "CREATE_ITEM", "data": { ... } }.
    `;
    
    const fullPrompt = fileContent 
        ? `${prompt}\n\nDựa trên tệp đính kèm sau:\n---\n${fileContent}\n---`
        : prompt;

    const settings = getSettings();
    const response = await generateWithRetry({
        model: settings.gameMasterModel,
        contents: fullPrompt,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema,
        }
    });
    
    try {
        const jsonText = response.text.trim();
        const action = JSON.parse(jsonText);
        if (action && action.action && action.data) {
            return action as AIAction;
        }
        throw new Error("Invalid action format received from AI.");
    } catch (e) {
        console.error("Failed to parse AI action response:", e);
        console.error("Raw AI response:", response.text);
        return { action: 'CHAT', data: { response: "Tôi không thể xử lý yêu cầu đó thành một hành động cụ thể. Bạn có thể diễn đạt lại không?" } };
    }
};

export const generateGameEvent = async (
    player: PlayerCharacter,
    date: GameDate,
    location: Location,
    npcs: NPC[]
): Promise<GameEvent> => {
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            description: { type: Type.STRING, description: 'Mô tả chi tiết về tình huống hoặc sự kiện đang xảy ra xung quanh người chơi.' },
            choices: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING, description: 'Mô tả hành động hoặc lựa chọn của người chơi.' },
                        check: {
                            type: Type.OBJECT,
                            nullable: true,
                            properties: {
                                attribute: { type: Type.STRING, enum: ALL_ATTRIBUTES, description: 'Thuộc tính cần kiểm tra.' },
                                difficulty: { type: Type.NUMBER, description: 'Độ khó của bài kiểm tra (DC), từ 5 (rất dễ) đến 25 (rất khó).' },
                            },
                            required: ['attribute', 'difficulty'],
                        },
                    },
                    required: ['text'],
                },
            },
        },
        required: ['description', 'choices'],
    };

    const context = `
    **Bối cảnh:** Game tu tiên Phong Thần.
    **Nhân vật chính:** ${player.identity.name} (${player.cultivation.currentRealmId})
    **Thời gian:** ${date.season}, ${date.timeOfDay}
    **Địa điểm:** ${location.name} (${location.description})
    **Loại địa điểm:** ${location.type}
    **Nhân vật khác tại đây:** ${npcs.length > 0 ? npcs.map(n => n.name).join(', ') : 'Không có ai'}

    Dựa vào bối cảnh trên, hãy tạo ra một tình tiết (event) nhỏ, bất ngờ và thú vị cho người chơi.
    - Tình tiết phải có mô tả rõ ràng và 2-3 lựa chọn.
    - QUAN TRỌNG: Nếu địa điểm là 'Bí Cảnh' hoặc 'Hoang Dã', hãy ưu tiên tạo ra các sự kiện nguy hiểm như gặp yêu thú, dính bẫy, hoặc bị tu sĩ khác tập kích.
    - Mỗi lựa chọn có thể yêu cầu một bài kiểm tra thuộc tính (skill check) với độ khó (difficulty) hợp lý, hoặc không cần (check: null).
    - Các lựa chọn nên đa dạng: có thể là đối thoại, hành động lén lút, sử dụng sức mạnh, hoặc bỏ qua.
    - Giữ cho tình huống phù hợp với không khí tu tiên, huyền huyễn.
    `;
    
    const settings = getSettings();
    const response = await generateWithRetry({
        model: settings.actionAnalysisModel,
        contents: context,
        config: {
            responseMimeType: "application/json",
            responseSchema,
        }
    });

    const eventData = JSON.parse(response.text);
    return {
        id: `event-${Date.now()}`,
        description: eventData.description,
        choices: eventData.choices.map((c: any, index: number) => ({ ...c, id: `choice-${index}` })),
    };
};

export const generateStoryContinuation = async (
    history: StoryEntry[],
    playerAction: StoryEntry,
    gameState: GameState,
    eventOutcome?: { choiceText: string; result: 'success' | 'failure' | 'no_check' },
    techniqueUsed?: CultivationTechnique
): Promise<string> => {
    
    const { playerCharacter, gameDate, activeNpcs, discoveredLocations, worldState, activeMods, encounteredNpcIds } = gameState;
    const currentLocation = discoveredLocations.find(l => l.id === playerCharacter.currentLocationId) || discoveredLocations[0];
    const npcsAtLocation = activeNpcs.filter(n => n.locationId === currentLocation.id);

    let actionDescription = `**Hành động của người chơi:**\n${playerAction.content}`;
    if (eventOutcome) {
        let resultText = '';
        if (eventOutcome.result === 'success') resultText = 'và đã thành công';
        if (eventOutcome.result === 'failure') resultText = 'nhưng đã thất bại';
        actionDescription = `**Trong một tình huống, người chơi đã chọn:** "${eventOutcome.choiceText}" ${resultText}.`;
    }
    if (techniqueUsed) {
        actionDescription += `\n**Người chơi đã thi triển công pháp:** ${techniqueUsed.name}.`;
    }
    
    const settings = getSettings();
    const narrativeStyleDesc = NARRATIVE_STYLES.find(s => s.value === settings.narrativeStyle)?.label || 'Cổ điển Tiên hiệp';
    
    const importantItems = playerCharacter.inventory.items
        .filter(i => ['Vũ Khí', 'Pháp Bảo'].includes(i.type) || ['Tiên Phẩm', 'Tuyệt Phẩm'].includes(i.quality))
        .map(i => `${i.name} (x${i.quantity})`)
        .join(', ');

    const relationshipsText = playerCharacter.relationships.map(rel => {
        const npc = activeNpcs.find(n => n.id === rel.npcId);
        return npc ? `${npc.name}: ${rel.status} (${rel.value})` : '';
    }).filter(Boolean).join('; ');

    const worldBuildingMod = activeMods?.find(mod => mod.content.worldBuilding && mod.content.worldBuilding.length > 0);
    let gameContext = "**Bối cảnh:** Game tu tiên Phong Thần.";
    if (worldBuildingMod && worldBuildingMod.content.worldBuilding && worldBuildingMod.content.worldBuilding.length > 0) {
        const worldInfo = worldBuildingMod.content.worldBuilding[0];
        gameContext = `**Bối cảnh:** ${worldInfo.title}. ${worldInfo.description}`;
    }

    const knownLocations = discoveredLocations.map(l => l.name).join(', ');
    const knownNpcs = activeNpcs.filter(n => encounteredNpcIds.includes(n.id)).map(n => n.name).join(', ');

    const currentRealmData = REALM_SYSTEM.find(r => r.id === playerCharacter.cultivation.currentRealmId);
    const currentStageData = currentRealmData?.stages.find(s => s.id === playerCharacter.cultivation.currentStageId);
    const cultivationProgress = `(${playerCharacter.cultivation.spiritualQi.toLocaleString()} / ${currentStageData?.qiRequired.toLocaleString() || '???'})`;

    const context = `
    ${gameContext}
    **Nhân vật chính:**
    - Tên: ${playerCharacter.identity.name}
    - Tuổi: ${playerCharacter.identity.age} (Tuổi thọ tối đa hiện tại dựa vào cảnh giới)
    - Cảnh giới: ${currentRealmData?.name || 'Vô danh'} - ${currentStageData?.name || 'Sơ kỳ'} ${cultivationProgress}
    - Thuộc tính: ${playerCharacter.attributes.flatMap(g => g.attributes).map(a => `${a.name}(${a.value})`).join(', ')}
    - Tiên tư: ${playerCharacter.talents.map(t => t.name).join(', ') || 'Không có'}
    - Trang bị: ${Object.values(playerCharacter.equipment).filter(Boolean).map(i => i!.name).join(', ') || 'Không có'}
    - Công pháp đã học: ${playerCharacter.techniques.map(t => t.name).join(', ') || 'Chưa học'}
    - Quan hệ: ${relationshipsText || 'Chưa có'}

    **Kiến Thức Của Nhân Vật (Known World):**
    - Các địa danh đã biết: ${knownLocations || 'Chỉ biết nơi mình đang đứng.'}
    - Các nhân vật đã gặp: ${knownNpcs || 'Chưa gặp ai đáng nhớ.'}

    **Thời gian & Không gian:**
    - Thời gian: ${gameDate.era} năm ${gameDate.year}, ${gameDate.season} ngày ${gameDate.day}, ${gameDate.timeOfDay} (giờ ${gameDate.shichen})
    - Địa điểm: ${currentLocation.name} (Loại: ${currentLocation.type}) (${currentLocation.description})
    - Nhân vật khác tại đây: ${npcsAtLocation.length > 0 ? npcsAtLocation.map(n => n.name).join(', ') : 'Không có ai'}
    - Các tin đồn gần đây: ${worldState.rumors.slice(-3).map(r => `Tại ${r.locationId}: "${r.text}"`).join('; ') || 'Không có'}

    **Lịch sử gần đây:**
    ${history.slice(-5).map(entry => `${entry.type === 'narrative' ? 'Hệ thống:' : 'Người chơi:'} ${entry.content}`).join('\n')}

    ${actionDescription}
    `;

    const systemInstruction = `Bạn là một người kể chuyện (Game Master) cho một game nhập vai.
    Nhiệm vụ của bạn là tiếp nối câu chuyện dựa trên hành động của người chơi và bối cảnh hiện tại.
    - **Phong cách kể chuyện:** ${narrativeStyleDesc}. Hãy tuân thủ nghiêm ngặt phong cách này.
    - **Bối cảnh:** Hãy bám sát vào bối cảnh đã được cung cấp. Nếu đó là thế giới Phong Thần, hãy dùng các yếu tố của nó. Nếu một bối cảnh tùy chỉnh được cung cấp, hãy ưu tiên và xây dựng câu chuyện xoay quanh nó.
    - **Tham chiếu trạng thái (RẤT QUAN TRỌNG):** Câu chuyện của bạn PHẢI thể hiện được các thuộc tính, tiên tư, vật phẩm, công pháp và mối quan hệ của nhân vật. Hãy chú ý đến thời gian, địa điểm, các NPC và tin đồn hiện có để câu chuyện liền mạch. Hãy nhớ đến tuổi tác, cảnh giới và giới hạn tuổi thọ của nhân vật.
    - **Mô tả kết quả:** Dựa trên hành động, kết quả (thành công/thất bại), và công pháp sử dụng, hãy mô tả kết quả một cách sống động và hợp lý. Nếu người chơi vừa "tu luyện", hãy mô tả cảm giác linh khí chảy trong cơ thể họ.
    - **KIỂM SOÁT LOGIC TUYỆT ĐỐI (CỰC KỲ QUAN TRỌNG):**
        - Bạn PHẢI duy trì sự logic và nhất quán của thế giới. Nhân vật chỉ biết những gì họ đã trải nghiệm, nghe thấy hoặc được kể trong game.
        - **Kiến thức của nhân vật:** Toàn bộ kiến thức của nhân vật về thế giới được cung cấp trong mục "Kiến Thức Của Nhân Vật". Họ không biết về bất kỳ địa danh hay nhân vật nào khác ngoài danh sách đó.
        - **Hành động phi logic:** Nếu người chơi thực hiện một hành động dựa trên kiến thức mà nhân vật không thể có (ví dụ: "đi đến Hoa Quả Sơn gặp Tôn Ngộ Không" khi nhân vật chưa bao giờ nghe về những cái tên này), bạn KHÔNG được thực hiện hành động đó.
        - **Phản hồi cho hành động phi logic:** Thay vào đó, hãy để nhân vật phản ứng một cách tự nhiên. Họ nên cảm thấy bối rối, tự hỏi tại sao mình lại có suy nghĩ đó. Ví dụ: "Trong đầu bạn chợt lóe lên hai cái tên lạ lẫm: 'Hoa Quả Sơn' và 'Tôn Ngộ Không'. Chúng từ đâu tới? Bạn lắc đầu, cố xua đi ý nghĩ kỳ quái. Nơi đó không hề tồn tại trong ký ức hay trên bất kỳ tấm bản đồ nào bạn từng thấy."
        - **Duy trì bối cảnh:** Không cho phép người chơi phá vỡ bối cảnh đã thiết lập bằng những hành động không phù hợp. Nếu bối cảnh là Phong Thần, đừng để các yếu tố từ Tây Du Ký hay các thế giới khác xen vào, trừ khi chúng được giới thiệu một cách hợp lý trong game (ví dụ qua một cuốn sách cổ, một tin đồn).
        - **Nguy hiểm:** Nếu người chơi ở một nơi nguy hiểm như "Bí Cảnh" hay "Hoang Dã", hãy tăng khả năng gặp nguy hiểm (bị tấn công, dính bẫy, bị cướp đồ).
    - **Tương tác Đặc Biệt:** Dùng các tag sau TRONG câu chuyện của bạn khi thích hợp:
        - Nếu người chơi đến một địa điểm có cửa hàng như "Thiên Cơ Các", hãy dùng tag: [SHOW_SHOP:{"shopId": "thien_co_cac"}]
        - Dựa vào hành động của người chơi (tặng quà, giúp đỡ, xúc phạm), hãy thay đổi mối quan hệ với NPC bằng tag: [UPDATE_RELATIONSHIP:{"npcName": "Tên NPC", "change": 10}] (số dương là tốt, số âm là xấu).
        - Nếu hành động của người chơi dẫn đến cái chết không thể tránh khỏi, hãy dùng tag: [DEATH:{"reason": "Bị yêu thú cấp cao giết chết."}]
        - Tạo vật phẩm: [ADD_ITEM:{"name": "Tên Vật Phẩm", "description": "Mô tả", "quantity": 1, "type": "Tạp Vật", "icon": "❓", "weight": 0.1, "quality": "Phàm Phẩm"}]
        - Học công pháp mới: [ADD_TECHNIQUE:{"name": "Tên Công Pháp", "description": "Mô tả", "type": "Linh Kỹ", "cost": {"type": "Linh Lực", "value": 10}, "cooldown": 2, "effectDescription": "Mô tả hiệu ứng", "rank": "Phàm Giai", "icon": "🔥"}]
        - Mất vật phẩm: [REMOVE_ITEM:{"name": "Tên Vật Phẩm", "quantity": 1}]
        - Thưởng tiền: [ADD_CURRENCY:{"name": "Bạc", "amount": 100}]
        - NPC mới xuất hiện: [CREATE_NPC:{"name": "Tên NPC", "status": "Mô tả trạng thái", "description": "Mô tả ngoại hình", "origin": "Xuất thân", "personality": "Tính cách", "locationId": "${currentLocation.id}"}]
        - Khám phá địa điểm mới: [DISCOVER_LOCATION:{"id": "new_id", "name": "Tên Địa Điểm", "description": "Mô tả", "type": "Hoang Dã", "neighbors": ["${currentLocation.id}"], "coordinates": {"x": ${currentLocation.coordinates.x + (Math.random() > 0.5 ? 1 : -1)}, "y": ${currentLocation.coordinates.y + (Math.random() > 0.5 ? 1 : -1)}}}]
        - Tạo tin đồn: [ADD_RUMOR:{"locationId": "${currentLocation.id}", "text": "Nội dung tin đồn"}]
    - **Lưu ý:** KHÔNG lặp lại hành động của người chơi. Chỉ viết phần tiếp theo của câu chuyện. Giữ cho câu chuyện hấp dẫn.
    `;
    
    const response = await generateWithRetry({
        contents: context,
        config: {
            systemInstruction,
        }
    });

    return response.text;
};

export const generateDynamicLocation = async (currentLocation: Location): Promise<{ name: string; description: string }> => {
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: 'Tên Hán Việt độc đáo cho địa điểm này (ví dụ: "Linh Tuyền Cốc", "Hắc Phong Động").' },
            description: { type: Type.STRING, description: 'Mô tả chi tiết, giàu hình ảnh về địa điểm, bầu không khí và những gì người chơi nhìn thấy.' },
        },
        required: ['name', 'description'],
    };

    const prompt = `Trong bối cảnh game tu tiên Phong Thần, người chơi đang khám phá khu vực hoang dã "${currentLocation.name}".
    Hãy tạo ra một địa điểm nhỏ, bí ẩn và độc đáo bên trong khu vực này.
    Địa điểm này có thể là một hang động, một khe núi, một ngôi miếu cổ, một hồ nước linh thiêng, v.v.
    Cung cấp một cái tên và mô tả hấp dẫn cho địa điểm này.
    `;

    const settings = getSettings();
    const response = await generateWithRetry({
        model: settings.mainTaskModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
        }
    });

    const locationData = JSON.parse(response.text);
    return locationData as { name: string; description: string };
};

export const analyzeActionForTechnique = async (actionText: string, techniques: CultivationTechnique[]): Promise<CultivationTechnique | null> => {
    if (techniques.length === 0) return null;

    const techniqueNames = techniques.map(t => t.name);

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            techniqueUsed: { 
                type: Type.STRING,
                enum: [...techniqueNames, 'None'],
                description: 'Tên của công pháp được sử dụng, hoặc "None" nếu không có công pháp nào được sử dụng.'
            },
        },
        required: ['techniqueUsed'],
    };

    const prompt = `Phân tích hành động của người chơi và xác định xem họ có sử dụng công pháp nào trong danh sách dưới đây không.
    **Hành động của người chơi:** "${actionText}"
    **Danh sách công pháp:** ${techniqueNames.join(', ')}
    
    Nếu hành động của người chơi mô tả rõ ràng hoặc ngụ ý việc sử dụng một công pháp, hãy trả về tên của công pháp đó. Nếu không, hãy trả về "None".
    `;
    
    const settings = getSettings();
    const response = await generateWithRetry({
        model: settings.actionAnalysisModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
        }
    });

    const result = JSON.parse(response.text);
    if (result.techniqueUsed && result.techniqueUsed !== 'None') {
        return techniques.find(t => t.name === result.techniqueUsed) || null;
    }
    return null;
};

export const generateBreakthroughNarrative = async (
    player: PlayerCharacter,
    oldRealmName: string,
    newRealm: RealmConfig,
    newStage: RealmStage
): Promise<string> => {
    const newRealmName = `${newRealm.name} - ${newStage.name}`;
    const bonusesText = newStage.bonuses.length > 0
        ? `Các chỉ số được tăng cường: ${newStage.bonuses.map(b => `${b.attribute} +${b.value}`).join(', ')}.`
        : "Nền tảng được củng cố.";

    const prompt = `Trong game tu tiên Phong Thần, nhân vật "${player.identity.name}" vừa có một cuộc đột phá lớn!
- Từ cảnh giới: ${oldRealmName}
- Đạt đến cảnh giới mới: **${newRealmName}**.
- Mô tả cảnh giới mới: ${newRealm.description || ''} ${newStage.description || ''}
- ${bonusesText}
- Các tiên tư đặc biệt của nhân vật có thể ảnh hưởng đến quá trình: ${player.talents.map(t => t.name).join(', ')}.

Nhiệm vụ: Hãy viết một đoạn văn (3-4 câu) mô tả lại quá trình đột phá này một cách SỐNG ĐỘNG, HOÀNH TRÁNG và CHI TIẾT.
- Mô tả sự thay đổi của trời đất xung quanh (linh khí, mây, sấm sét...).
- Mô tả sự biến đổi bên trong cơ thể và sức mạnh của nhân vật (ví dụ: kim đan, nguyên anh, đạo cơ...).
- Kết hợp các tiên tư của nhân vật vào mô tả để tạo sự độc đáo nếu có thể.
- Nhấn mạnh sự khác biệt về sức mạnh sau khi đột phá.
- Giữ văn phong tiên hiệp, hùng tráng.`;

    const response = await generateWithRetry({
        contents: prompt,
    });

    return response.text;
};


export const generateWorldEvent = async (gameState: GameState): Promise<Rumor> => {
    const { gameDate, discoveredLocations, worldState } = gameState;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            locationId: { type: Type.STRING, enum: discoveredLocations.map(l => l.id) },
            text: { type: Type.STRING, description: 'Nội dung của tin đồn hoặc sự kiện, viết một cách ngắn gọn, hấp dẫn.' },
        },
        required: ['locationId', 'text'],
    };

    const prompt = `Bối cảnh game tu tiên Phong Thần. Thời gian hiện tại là ${gameDate.era} năm ${gameDate.year}, mùa ${gameDate.season}.
    Các tin đồn cũ: ${worldState.rumors.slice(-5).map(r => r.text).join('; ') || 'Chưa có.'}
    
    Hãy tạo ra một sự kiện thế giới hoặc tin đồn MỚI, phù hợp với bối cảnh hỗn loạn của thời đại.
    Sự kiện có thể là:
    - Một giải đấu tu tiên được tổ chức.
    - Một yêu thú mạnh xuất hiện ở đâu đó.
    - Một bí cảnh mới được phát hiện.
    - Một tông môn lớn tuyển đệ tử.
    - Xung đột giữa các thế lực.
    
    Hãy trả về một tin đồn duy nhất theo JSON schema.
    `;
    
    const settings = getSettings();
    const response = await generateWithRetry({
        model: settings.quickSupportModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
        }
    });

    const rumorData = JSON.parse(response.text);
    return {
        id: `rumor-${Date.now()}`,
        locationId: rumorData.locationId,
        text: rumorData.text,
    };
};
