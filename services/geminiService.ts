// FIX: Import `GenerateContentResponse` and `GenerateImagesResponse` from `@google/genai` to correctly type the responses from the Gemini API.
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
// FIX: Import additional types required for mod-based character generation.
import type { InnateTalent, InnateTalentRank, CharacterIdentity, AIAction, GameSettings, PlayerCharacter, StoryEntry, InventoryItem, GameDate, Location, NPC, GameEvent, Gender, CultivationTechnique, Rumor, WorldState, GameState, RealmConfig, RealmStage, ModTechnique, ModNpc, ModEvent, PlayerNpcRelationship, ModTalent, ModTalentRank, TalentSystemConfig, AttributeGroup, CommunityMod, AlchemyRecipe, ModCustomPanel } from '../types';
import { TALENT_RANK_NAMES, DEFAULT_SETTINGS, ALL_ATTRIBUTES, WORLD_MAP, NARRATIVE_STYLES, REALM_SYSTEM, COMMUNITY_MODS_URL } from "../constants";
import {
  FaSun, FaMoon
} from 'react-icons/fa';
import {
  GiHealthNormal, GiHeartTower, GiBoltSpellCast
} from 'react-icons/gi';


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

// --- New Service for Community Mods ---
export const fetchCommunityMods = async (): Promise<CommunityMod[]> => {
    try {
        const response = await fetch(COMMUNITY_MODS_URL);
        if (!response.ok) {
            throw new Error(`Network response was not ok, status: ${response.status}`);
        }
        const data: CommunityMod[] = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch community mods:", error);
        // Return a default mod or an empty array on failure to avoid crashing the UI
        return [{
            modInfo: {
                id: 'fallback-mod-example',
                name: 'Thần Binh Lợi Khí (Ví dụ)',
                author: 'Game Master',
                description: 'Không thể tải danh sách mod cộng đồng. Đây là một ví dụ mẫu có sẵn.',
                version: '1.0.0',
            },
            downloadUrl: 'https://gist.githubusercontent.com/anonymous/a8238210332845a720f4cb1f1c73a213/raw/phongthan-thanbinh-loikhi.json'
        }];
    }
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
    const availableRealms = REALM_SYSTEM.map(r => r.name);

    const responseSchema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                gender: { type: Type.STRING, enum: ['Nam', 'Nữ'] },
                status: { type: Type.STRING, description: 'Mô tả trạng thái hiện tại của NPC (ví dụ: "Đang ngồi thiền trong hang động", "Đang mua bán ở chợ").' },
                description: { type: Type.STRING, description: 'Mô tả ngoại hình của NPC.' },
                origin: { type: Type.STRING, description: 'Mô tả xuất thân, nguồn gốc của NPC.' },
                personality: { type: Type.STRING, description: 'Tính cách của NPC (ví dụ: Trung Lập, Tà Ác, Hỗn Loạn, Chính Trực).' },
                realmName: { type: Type.STRING, enum: availableRealms, description: 'Cảnh giới tu luyện của NPC, dựa trên sức mạnh của họ. "Phàm Nhân" cho người thường.' },
                ChinhDao: { type: Type.NUMBER, description: 'Điểm Chính Đạo (0-100).' },
                MaDao: { type: Type.NUMBER, description: 'Điểm Ma Đạo (0-100).' },
                TienLuc: { type: Type.NUMBER, description: 'Chỉ số Tiên Lực chiến đấu.' },
                PhongNgu: { type: Type.NUMBER, description: 'Chỉ số Phòng Ngự chiến đấu.' },
                SinhMenh: { type: Type.NUMBER, description: 'Chỉ số Sinh Mệnh chiến đấu.' },
                talents: {
                    type: Type.ARRAY,
                    description: "Một danh sách từ 0 đến 3 tiên tư độc đáo.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            rank: { type: Type.STRING, enum: TALENT_RANK_NAMES },
                            effect: { type: Type.STRING },
                             bonuses: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        attribute: { type: Type.STRING, enum: ALL_ATTRIBUTES },
                                        value: { type: Type.NUMBER }
                                    },
                                    required: ['attribute', 'value']
                                }
                            }
                        },
                        required: ['name', 'description', 'rank', 'effect'],
                    },
                },
                locationId: { type: Type.STRING, enum: availableLocations },
            },
            required: ['name', 'gender', 'status', 'description', 'origin', 'personality', 'realmName', 'talents', 'locationId', 'ChinhDao', 'MaDao', 'TienLuc', 'PhongNgu', 'SinhMenh'],
        },
    };
    
    const prompt = `Tạo ra ${count} NPC (Non-Player Characters) độc đáo cho thế giới game tu tiên Phong Thần.
    Các NPC này có thể là tu sĩ, yêu ma, dân thường, hoặc các sinh vật kỳ dị.
    Mỗi NPC cần có thông tin đầy đủ theo schema. Hãy sáng tạo và làm cho thế giới trở nên sống động.
    
    **Yêu cầu chi tiết:**
    1.  **Chỉ số:** Dựa vào tính cách và xuất thân, hãy gán cho họ các chỉ số Thiên Hướng (Chinh Đạo, Ma Đạo) và chỉ số chiến đấu (Tiên Lực, Phòng Ngự, Sinh Mệnh). Ví dụ, một 'ma đầu' sẽ có Ma Đạo cao, trong khi một 'đại hiệp' sẽ có Chính Đạo cao.
    2.  **Cảnh Giới:** Dựa trên mô tả sức mạnh và vai vế của NPC, hãy chọn một cảnh giới (realmName) phù hợp từ danh sách. Một lão nông bình thường sẽ là "Phàm Nhân", trong khi một trưởng lão tông môn có thể là "Kết Đan Kỳ" hoặc "Nguyên Anh Kỳ".
    3.  **Tiên Tư:** Tạo ra 1-2 tiên tư (talents) độc đáo và phù hợp cho mỗi NPC tu sĩ. Các tiên tư nên có cấp bậc (rank) và hiệu ứng (effect) rõ ràng, có thể cộng thêm chỉ số (bonuses).
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

    return npcsData.map((npcData: any): NPC => {
        const { name, gender, description, origin, personality, talents, realmName, ...stats } = npcData;
        
        // Determine cultivation state
        const targetRealm = REALM_SYSTEM.find(r => r.name === realmName) || REALM_SYSTEM[0];
        const targetStage = targetRealm.stages[Math.floor(Math.random() * targetRealm.stages.length)];

        const cultivation: NPC['cultivation'] = {
            currentRealmId: targetRealm.id,
            currentStageId: targetStage.id,
            spiritualQi: Math.floor(Math.random() * targetStage.qiRequired),
            hasConqueredInnerDemon: false,
        };

        // Build attributes structure
        const baseAttributes: AttributeGroup[] = [
             {
                title: 'Chỉ số Chiến Đấu',
                attributes: [
                    { name: 'Tiên Lực', description: 'Sát thương phép thuật.', value: stats.TienLuc || 0, icon: GiBoltSpellCast },
                    { name: 'Phòng Ngự', description: 'Khả năng chống đỡ.', value: stats.PhongNgu || 0, icon: GiHeartTower },
                ],
            },
            {
                title: 'Chỉ số Sinh Tồn',
                attributes: [
                     { name: 'Sinh Mệnh', description: 'Thể lực.', value: stats.SinhMenh || 100, maxValue: stats.SinhMenh || 100, icon: GiHealthNormal },
                ]
            },
            {
                title: 'Thiên Hướng',
                attributes: [
                    { name: 'Chính Đạo', description: 'Danh tiếng chính đạo.', value: stats.ChinhDao || 0, icon: FaSun },
                    { name: 'Ma Đạo', description: 'Uy danh ma đạo.', value: stats.MaDao || 0, icon: FaMoon },
                ],
            },
        ];

        return {
            ...stats,
            id: `dynamic-npc-${Math.random().toString(36).substring(2, 9)}`,
            identity: {
                name,
                gender,
                appearance: description,
                origin,
                personality,
            },
            talents: talents || [],
            attributes: baseAttributes,
            cultivation,
            // Fill required properties with defaults
            techniques: [],
            inventory: { items: [], weightCapacity: 15 },
            currencies: {},
            equipment: {},
        };
    });
};

interface ModContext {
    realms: RealmConfig[];
    talentRanks: ModTalentRank[];
}

const getGameMasterSystemInstruction = (modContext?: ModContext): string => {
    const customRealms = modContext?.realms.map(r => r.name).join(', ') || 'Mặc định';
    const customTalentRanks = modContext?.talentRanks.map(r => r.name).join(', ') || 'Mặc định';

    return `Bạn là một GameMaster AI thông minh, sáng tạo, và là một chuyên gia về bối cảnh Phong Thần Diễn Nghĩa, giúp người dùng tạo mod cho game tu tiên Phong Thần Ký Sự.

**TƯ DUY CỦA BẠN:**
1.  **Phân tích từng bước:** Trước khi đưa ra JSON cuối cùng, hãy suy nghĩ từng bước để phân tích yêu cầu của người dùng.
2.  **Hiểu sâu bối cảnh:** Luôn bám sát không khí tu tiên, huyền huyễn của Phong Thần. Tên gọi, mô tả phải mang đậm văn phong Hán Việt cổ điển.
3.  **Nhất quán là trên hết:** Khi tạo nội dung mới, hãy tham khảo các hệ thống đã được định nghĩa (cảnh giới, tiên tư) để đảm bảo sự nhất quán.

**HIỂU BIẾT VỀ CƠ CHẾ GAME & MOD HIỆN TẠI:**
*   **Thuộc tính:** Danh sách đầy đủ: ${ALL_ATTRIBUTES.join(', ')}.
*   **Hệ thống Tu Luyện:** Hệ thống cảnh giới hiện tại trong mod này là: ${customRealms}. Bạn có thể định nghĩa lại toàn bộ hệ thống này bằng \`CREATE_REALM_SYSTEM\`.
*   **Phẩm chất Tiên Tư:** Các phẩm chất tiên tư hiện tại trong mod này là: ${customTalentRanks}.
*   **Vật phẩm (Items):** Gồm các loại: Vũ Khí, Phòng Cụ, Đan Dược, Pháp Bảo, Tạp Vật, Đan Lô, Linh Dược, Đan Phương. Chúng có phẩm chất, trọng lượng, và có thể cộng chỉ số.
*   **Công Pháp (Techniques):** Là các kỹ năng nhân vật có thể sử dụng, có tiêu hao, hồi chiêu, và cấp bậc.
*   **Sự kiện (Events):** Là các tình huống có kịch bản với các lựa chọn, có thể yêu cầu kiểm tra thuộc tính (skill check) và dẫn đến các kết quả khác nhau (outcomes).
*   **Bảng Tùy Chỉnh (Custom Panels):** Cho phép tạo các tab mới trong UI để hiển thị các mục 'WorldBuilding'.

**NHIỆM VỤ CỦA BẠN:**
Phân tích yêu cầu của người dùng và chuyển đổi nó thành một hoặc nhiều hành động có cấu trúc (\`action\`) tương thích với game. Luôn trả lời ở định dạng JSON. Nếu người dùng chỉ đang trò chuyện hoặc hỏi, hãy sử dụng hành động 'CHAT'. Nếu họ yêu cầu nhiều thứ, hãy dùng 'BATCH_ACTIONS'.

---

**HƯỚNG DẪN TẠO NỘI DUNG PHỨC TẠP:**

**1. Hướng dẫn tạo \`ModEvent\` có chiều sâu:**
Khi người dùng yêu cầu tạo một sự kiện, hãy ưu tiên tạo ra các chuỗi logic thú vị.
*   **Kiểm tra thuộc tính (\`check\`):** Sử dụng \`check\` để các lựa chọn trở nên thử thách hơn. Độ khó (difficulty) nên hợp lý: 10 (dễ), 15 (trung bình), 20 (khó).
*   **Nhiều kết quả (\`outcomes\`):** Một lựa chọn có thể dẫn đến nhiều kết quả. Ví dụ: nhận được vật phẩm VÀ tăng danh vọng.
*   **Sự kiện nối tiếp (\`START_EVENT\`):** Để tạo chuỗi nhiệm vụ, hãy dùng outcome \`START_EVENT\` và trỏ đến \`name\` của một sự kiện khác.

*   **Ví dụ về \`ModEvent\` phức tạp:**
    *   *Yêu cầu người dùng:* "Tạo một sự kiện nhỏ tại Thanh Hà Trấn, người chơi gặp một lão ăn mày bí ẩn."
    *   *Tư duy của bạn:* Lão ăn mày này có thể là một cao nhân đang thử lòng. Lựa chọn "cho tiền" có thể dẫn đến một kỳ ngộ. Lựa chọn "xua đuổi" có thể giảm Chính Đạo.
    *   *JSON mẫu bạn nên tạo:*
        \`\`\`json
        {
          "action": "CREATE_EVENT",
          "data": {
            "name": "su_kien_lao_an_may",
            "description": "Khi đang đi dạo trong Thanh Hà Trấn, bạn thấy một lão ăn mày quần áo rách rưới, ánh mắt lại sáng như sao, đang chìa chiếc bát vỡ về phía bạn.",
            "choices": [
              {
                "text": "Đưa cho ông lão một ít bạc lẻ.",
                "check": null,
                "outcomes": [
                  { "type": "REMOVE_ITEM", "details": { "name": "Bạc", "quantity": 10 } },
                  { "type": "CHANGE_STAT", "details": { "attribute": "Chính Đạo", "change": 2 } },
                  { "type": "START_EVENT", "details": { "eventName": "su_kien_an_may_cam_ta" } }
                ]
              },
              {
                "text": "Kiểm tra khí tức của ông ta. (Yêu cầu Cảm Ngộ)",
                "check": { "attribute": "Cảm Ngộ", "difficulty": 15 },
                "outcomes": [
                   { "type": "ADD_RUMOR", "details": { "locationId": "thanh_ha_tran", "text": "Nghe nói có một cao nhân đang ẩn mình tại Thanh Hà Trấn." } }
                ]
              },
              {
                "text": "Xua đuổi ông ta đi.",
                "check": null,
                "outcomes": [
                  { "type": "CHANGE_STAT", "details": { "attribute": "Chính Đạo", "change": -5 } }
                ]
              }
            ],
            "tags": ["Thanh Hà Trấn", "Kỳ Ngộ"]
          }
        }
        \`\`\`

**2. Hướng dẫn tạo \`worldBuilding\` có cấu trúc:**
Khi người dùng yêu cầu định nghĩa một khía cạnh của thế giới, **KHÔNG** tạo JSON tự do. Thay vào đó, hãy **TỰ SUY RA MỘT CẤU TRÚC** hợp lý dựa trên chủ đề và áp dụng nó.
*   **Chủ đề về sinh vật/yêu thú:** Cấu trúc nên có các trường như \`habitat\` (môi trường sống), \`abilities\` (khả năng), \`weaknesses\` (điểm yếu), \`lore\` (truyền thuyết).
*   **Chủ đề về lịch sử/địa danh:** Cấu trúc nên có các trường như \`era\` (thời đại), \`keyFigures\` (nhân vật chủ chốt), \`majorEvents\` (sự kiện lớn).
*   **Chủ đề về hệ thống (luyện đan, trận pháp):** Cấu trúc nên có các trường như \`principles\` (nguyên tắc), \`levels\` (cấp độ), \`materials\` (vật liệu).

*   **Ví dụ về \`worldBuilding\` có cấu trúc:**
    *   *Yêu cầu người dùng:* "Hãy viết về Hỏa Lân, một thần thú trong truyền thuyết."
    *   *Tư duy của bạn:* Đây là một sinh vật. Tôi sẽ tạo một cấu trúc dữ liệu cho yêu thú.
    *   *JSON mẫu bạn nên tạo:*
        \`\`\`json
        {
          "action": "DEFINE_WORLD_BUILDING",
          "data": {
            "title": "Thần Thú: Hỏa Lân",
            "description": "Hỏa Lân là một trong tứ đại thần thú, biểu tượng của điềm lành và lửa.",
            "data": {
              "type": "Thần Thú",
              "habitat": "Các ngọn núi lửa cổ xưa, nơi có địa hỏa dồi dào.",
              "appearance": "Hình dáng giống kỳ lân, toàn thân bao phủ bởi vảy màu đỏ rực, bốn vó đạp trên lửa, có khả năng phun ra tam muội chân hỏa.",
              "abilities": [
                "Tam Muội Chân Hỏa: Ngọn lửa có thể đốt cháy cả linh hồn.",
                "Điềm Lành Chi Quang: Sự xuất hiện của nó có thể mang lại may mắn."
              ],
              "lore": "Tương truyền, Hỏa Lân là thú cưỡi của Viêm Đế, sau này ẩn mình trong nhân gian. Máu của nó là một loại thần dược, có thể cải tử hoàn sinh và tăng công lực cực lớn."
            },
            "tags": ["Thần Thú", "Lửa"]
          }
        }
        \`\`\`
`;
};


export const getGameMasterActionableResponse = async (prompt: string, fileContent?: string, modContext?: ModContext): Promise<AIAction> => {
    const statBonusSchema = { type: Type.OBJECT, properties: { attribute: { type: Type.STRING, enum: ALL_ATTRIBUTES }, value: { type: Type.NUMBER } }, required: ['attribute', 'value'] };

    const itemSchema = { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, type: { type: Type.STRING, enum: ['Vũ Khí', 'Phòng Cụ', 'Đan Dược', 'Pháp Bảo', 'Tạp Vật', 'Đan Lô', 'Linh Dược', 'Đan Phương'] }, quality: { type: Type.STRING, enum: ['Phàm Phẩm', 'Linh Phẩm', 'Pháp Phẩm', 'Bảo Phẩm', 'Tiên Phẩm', 'Tuyệt Phẩm'] }, weight: { type: Type.NUMBER }, slot: { type: Type.STRING, enum: ['Vũ Khí', 'Thượng Y', 'Hạ Y', 'Giày', 'Phụ Kiện 1', 'Phụ Kiện 2'] }, bonuses: { type: Type.ARRAY, items: statBonusSchema }, tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ['name', 'description', 'type', 'quality', 'weight'] };
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

    const recipeSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            icon: { type: Type.STRING, description: "Một emoji" },
            ingredients: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, quantity: { type: Type.NUMBER } }, required: ['name', 'quantity'] } },
            result: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, quantity: { type: Type.NUMBER } }, required: ['name', 'quantity'] },
            requiredAttribute: { type: Type.OBJECT, properties: { name: { const: 'Đan Thuật' }, value: { type: Type.NUMBER } }, required: ['name', 'value'] },
            qualityCurve: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { threshold: { type: Type.NUMBER }, quality: { type: Type.STRING, enum: ['Phàm Phẩm', 'Linh Phẩm', 'Pháp Phẩm', 'Bảo Phẩm', 'Tiên Phẩm', 'Tuyệt Phẩm'] } }, required: ['threshold', 'quality'] } }
        },
        required: ['name', 'description', 'icon', 'ingredients', 'result', 'requiredAttribute', 'qualityCurve']
    };

    const customPanelSchema = {
        type: Type.OBJECT,
        properties: {
            title: { type: Type.STRING, description: 'Tên của tab sẽ hiển thị trong UI.' },
            iconName: { type: Type.STRING, enum: ['FaUser', 'FaBoxOpen', 'FaGlobe', 'FaBook', 'FaScroll', 'FaSun', 'FaGopuram', 'GiCauldron'], description: 'Tên của icon từ danh sách cho phép.'},
            content: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Danh sách các `title` của mục WorldBuilding để hiển thị trong bảng này.'},
            tags: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['title', 'iconName', 'content']
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
            { properties: { action: { const: 'CREATE_RECIPE' }, data: recipeSchema } },
            { properties: { action: { const: 'CREATE_MULTIPLE_RECIPES' }, data: { type: Type.ARRAY, items: recipeSchema } } },
            { properties: { action: { const: 'CREATE_CUSTOM_PANEL' }, data: customPanelSchema } },
            { properties: { action: { const: 'BATCH_ACTIONS' }, data: { type: Type.ARRAY, items: {
                 oneOf: [
                    { properties: { action: { const: 'CREATE_ITEM' }, data: itemSchema } },
                    { properties: { action: { const: 'CREATE_TALENT' }, data: talentSchema } },
                    { properties: { action: { const: 'CREATE_SECT' }, data: sectSchema } },
                    { properties: { action: { const: 'CREATE_TECHNIQUE' }, data: techniqueSchema } },
                    { properties: { action: { const: 'CREATE_NPC' }, data: npcSchema } },
                    { properties: { action: { const: 'CREATE_EVENT' }, data: eventSchema } },
                    { properties: { action: { const: 'CREATE_RECIPE' }, data: recipeSchema } },
                    { properties: { action: { const: 'CREATE_CUSTOM_PANEL' }, data: customPanelSchema } },
                 ]
            } } } }
        ],
    };

    const systemInstruction = getGameMasterSystemInstruction(modContext);
    
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

// FIX: Add generateGameEvent function and export it
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
    **Nhân vật chính:** ${player.identity.name} (Cảnh giới: ${REALM_SYSTEM.find(r => r.id === player.cultivation.currentRealmId)?.name || 'Unknown'})
    **Thời gian:** ${date.season}, ${date.timeOfDay}
    **Địa điểm:** ${location.name} (${location.description})
    **Loại địa điểm:** ${location.type}
    **Nhân vật khác tại đây:** ${npcs.length > 0 ? npcs.map(n => n.identity.name).join(', ') : 'Không có ai'}

    Dựa vào bối cảnh trên, hãy tạo ra một tình tiết (event) nhỏ, bất ngờ và thú vị cho người chơi.
    - Tình tiết phải có mô tả rõ ràng và 2-4 lựa chọn hành động.
    - QUAN TRỌNG: Nếu địa điểm là 'Bí Cảnh' hoặc 'Hoang Dã', hãy ưu tiên tạo ra các sự kiện nguy hiểm như gặp yêu thú, dính bẫy, hoặc bị tu sĩ khác tập kích.
    - Mỗi lựa chọn có thể yêu cầu một bài kiểm tra thuộc tính (skill check) với độ khó (difficulty) phù hợp.
    - Trả về kết quả dưới dạng JSON theo schema.
    `;
    
    const settings = getSettings();
    const response = await generateWithRetry({
        model: settings.mainTaskModel,
        contents: context,
        config: {
            responseMimeType: "application/json",
            responseSchema,
        }
    });

    const eventData = JSON.parse(response.text);
    return {
        id: `event-${Date.now()}`,
        ...eventData,
        choices: eventData.choices.map((choice: any, index: number) => ({
            ...choice,
            id: `choice-${Date.now()}-${index}`,
        })),
    };
};

export const generateStoryContinuationStream = async function* (
    storyLog: StoryEntry[],
    playerAction: StoryEntry,
    gameState: GameState,
    eventOutcome?: { choiceText: string; result: 'success' | 'failure' | 'no_check' },
    techniqueUsed?: CultivationTechnique
): AsyncGenerator<string, void, undefined> {
    const { playerCharacter, gameDate, discoveredLocations, activeNpcs } = gameState;
    const currentLocation = discoveredLocations.find(l => l.id === playerCharacter.currentLocationId)!;
    const npcsAtLocation = activeNpcs.filter(n => n.locationId === playerCharacter.currentLocationId);
    const narrativeStyle = NARRATIVE_STYLES.find(s => s.value === getSettings().narrativeStyle)?.label || 'Classic Wuxia';

    const history = storyLog.slice(-15).map(entry => {
        if (entry.type === 'player-action' || entry.type === 'player-dialogue') {
            return `Người chơi: ${entry.content}`;
        }
        return `Hệ thống: ${entry.content}`;
    }).join('\n');

    let actionContext = '';
    if (eventOutcome) {
        actionContext = `Người chơi vừa có lựa chọn "${eventOutcome.choiceText}" trong một sự kiện, và kết quả là: ${eventOutcome.result}.`;
    } else {
        actionContext = `Người chơi vừa thực hiện hành động: "${playerAction.content}".`;
    }
    
    if (techniqueUsed) {
        actionContext += ` Người chơi đã sử dụng công pháp [${techniqueUsed.name}].`;
    }

    const prompt = `Bạn là một người kể chuyện (Game Master) cho game tu tiên Phong Thần Ký Sự.
    **Văn phong:** ${narrativeStyle}. Hãy viết tiếp câu chuyện một cách hấp dẫn, giàu trí tưởng tượng.
    
    **Bối cảnh hiện tại:**
    - Nhân vật: ${playerCharacter.identity.name}, ${playerCharacter.identity.appearance}, ${playerCharacter.identity.personality}.
    - Cảnh giới: ${REALM_SYSTEM.find(r => r.id === playerCharacter.cultivation.currentRealmId)?.name || 'Unknown'}
    - Địa điểm: ${currentLocation.name} (${currentLocation.description})
    - NPC xung quanh: ${npcsAtLocation.length > 0 ? npcsAtLocation.map(n => n.identity.name).join(', ') : 'Không có ai.'}
    - Thời gian: ${gameDate.season}, ${gameDate.timeOfDay}
    
    **Lịch sử gần đây:**
    ${history}

    **Hành động của người chơi:**
    ${actionContext}

    **Nhiệm vụ của bạn:**
    1.  **Mô tả kết quả:** Dựa vào hành động của người chơi và bối cảnh, hãy mô tả những gì xảy ra tiếp theo. Hãy sáng tạo và giữ cho câu chuyện liền mạch.
    2.  **Sử dụng AI Tags (Quan trọng):** Nếu hành động của người chơi dẫn đến các thay đổi cụ thể trong game, hãy sử dụng các tag sau TRONG câu trả lời của bạn. AI sẽ chỉ trả về phần văn bản trần, các tag này sẽ được hệ thống xử lý riêng.
        -   \`[ADD_ITEM:{"name": "Tên Vật Phẩm", "description": "Mô tả", "quantity": 1, "type": "Loại", "quality": "Phẩm chất", "weight": 0.5}]\`
        -   \`[REMOVE_ITEM:{"name": "Tên Vật Phẩm", "quantity": 1}]\`
        -   \`[ADD_CURRENCY:{"name": "Linh thạch hạ phẩm", "amount": 10}]\`
        -   \`[UPDATE_RELATIONSHIP:{"npcName": "Tên NPC", "change": 10}]\` (change có thể là số âm)
        -   \`[ADD_TECHNIQUE:{"name": "Tên Công Pháp", "description": "Mô tả", ...}]\`
        -   \`[UPDATE_ATTRIBUTE:{"name": "Lực Lượng", "change": 1}]\`
        -   \`[ADD_RECIPE:{"id": "recipe_id"}]\`
        -   \`[DEATH:{"reason": "Lý do tử vong"}]\`
        -   \`[SHOW_SHOP:{"shopId": "thien_co_cac"}]\`
    
    **Ví dụ:**
    Người chơi: ta tìm trong bụi rậm xem có gì không
    AI trả về: Bạn vạch bụi cỏ ra và thấy một chiếc túi gấm cũ. Mở ra xem, bên trong có vài viên linh thạch. [ADD_CURRENCY:{"name": "Linh thạch hạ phẩm", "amount": 5}]

    Bây giờ, hãy viết tiếp câu chuyện.
    `;
    
    const settings = getSettings();
    const safetySettings = getSafetySettingsForApi();
    
    const finalRequest = {
        model: settings.mainTaskModel,
        contents: prompt,
        config: { 
            safetySettings,
            thinkingConfig: { thinkingBudget: 0 }
        }
    };
    
    let stream;
    try {
        const ai = getAiClient();
        stream = await ai.models.generateContentStream(finalRequest);
    } catch (e) {
        console.error("Stream initialization failed, trying once more.", e);
        await new Promise(res => setTimeout(res, 1000));
        const ai = getAiClient();
        stream = await ai.models.generateContentStream(finalRequest);
    }
    
    for await (const chunk of stream) {
        yield chunk.text;
    }
};


// FIX: Add generateDynamicLocation function and export it
export const generateDynamicLocation = async (parentLocation: Location): Promise<{ name: string; description: string }> => {
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: 'Tên Hán Việt độc đáo, hấp dẫn cho địa điểm mới.' },
            description: { type: Type.STRING, description: 'Mô tả chi tiết, sống động về địa điểm này.' },
        },
        required: ['name', 'description'],
    };

    const prompt = `Trong bối cảnh game tu tiên Phong Thần, người chơi đang khám phá khu vực xung quanh "${parentLocation.name}" (${parentLocation.description}).
    Hãy tạo ra một địa điểm nhỏ, cụ thể và thú vị mà họ có thể phát hiện ra.
    Ví dụ: một hang động bí ẩn, một thác nước ẩn, một ngôi miếu hoang, một cây cổ thụ phát sáng...
    Trả về kết quả dưới dạng JSON theo schema.`;

    const settings = getSettings();
    const response = await generateWithRetry({
        model: settings.mainTaskModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
        }
    });

    return JSON.parse(response.text);
};

// FIX: Add analyzeActionForTechnique function and export it
export const analyzeActionForTechnique = async (actionText: string, availableTechniques: CultivationTechnique[]): Promise<CultivationTechnique | null> => {
    if (availableTechniques.length === 0) return null;

    const techniqueNames = availableTechniques.map(t => t.name);
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            techniqueName: { type: Type.STRING, enum: [...techniqueNames, ''], description: 'Tên công pháp được sử dụng. Trả về chuỗi rỗng nếu không có công pháp nào được sử dụng.' },
        },
        required: ['techniqueName'],
    };

    const prompt = `Phân tích hành động sau của người chơi và xác định xem họ có đang cố gắng sử dụng một trong các công pháp có sẵn hay không.
    **Hành động của người chơi:** "${actionText}"
    **Danh sách công pháp có sẵn:** ${techniqueNames.join(', ')}

    Nếu hành động của người chơi khớp hoặc có ý định rõ ràng sử dụng một công pháp, hãy trả về tên của công pháp đó. Nếu không, trả về một chuỗi rỗng.
    Chỉ trả về JSON.`;
    
    const settings = getSettings();
    const response = await generateWithRetry({
        model: settings.actionAnalysisModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
        }
    });

    const { techniqueName } = JSON.parse(response.text);
    if (techniqueName) {
        return availableTechniques.find(t => t.name === techniqueName) || null;
    }
    return null;
};

// FIX: Add generateBreakthroughNarrative function and export it
export const generateBreakthroughNarrative = async (
    player: PlayerCharacter,
    oldRealmName: string,
    newRealm: RealmConfig,
    newStage: RealmStage
): Promise<string> => {
    const prompt = `Trong game tu tiên Phong Thần, người chơi "${player.identity.name}" vừa đột phá thành công từ cảnh giới ${oldRealmName} lên ${newRealm.name} - ${newStage.name}.
    Hãy viết một đoạn văn mô tả lại quá trình đột phá này một cách hào hùng, kịch tính và sống động.
    Mô tả những thay đổi trong cơ thể, linh lực, và nhận thức của nhân vật.
    Đoạn văn nên ngắn gọn, khoảng 2-4 câu.`;

    const settings = getSettings();
    const response = await generateWithRetry({
        model: settings.mainTaskModel,
        contents: prompt,
        config: {}
    });

    return response.text;
};

// FIX: Add generateWorldEvent function and export it
export const generateWorldEvent = async (gameState: GameState): Promise<Rumor> => {
    const { discoveredLocations, worldState } = gameState;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            text: { type: Type.STRING, description: 'Nội dung của tin đồn, ngắn gọn và bí ẩn.' },
            locationId: { type: Type.STRING, enum: discoveredLocations.map(l => l.id), description: 'ID của địa điểm mà tin đồn này xuất hiện.' },
        },
        required: ['text', 'locationId'],
    };

    const prompt = `Trong bối cảnh game tu tiên Phong Thần, hãy tạo ra một tin đồn (rumor) mới.
    Tin đồn có thể về một bảo vật xuất thế, một cao nhân xuất hiện, một tông môn tuyển đệ tử, hoặc một nơi nào đó có dị tượng...
    Tin đồn phải liên quan đến một trong những địa điểm đã được khám phá.
    Các tin đồn hiện có: ${worldState.rumors.map(r => r.text).join('; ')}
    
    Hãy tạo ra một tin đồn mới, không trùng lặp. Trả về dưới dạng JSON.`;
    
    const settings = getSettings();
    const response = await generateWithRetry({
        model: settings.mainTaskModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
        }
    });
    
    const rumorData = JSON.parse(response.text);
    return {
        id: `rumor-${Date.now()}`,
        ...rumorData,
    };
};