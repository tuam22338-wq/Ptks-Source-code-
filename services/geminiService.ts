// FIX: Import `GenerateContentResponse` and `GenerateImagesResponse` from `@google/genai` to correctly type the responses from the Gemini API.
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
// FIX: Import additional types required for mod-based character generation.
import type { InnateTalent, InnateTalentRank, CharacterIdentity, AIAction, GameSettings, PlayerCharacter, StoryEntry, InventoryItem, GameDate, Location, NPC, GameEvent, Gender, CultivationTechnique, Rumor, WorldState, GameState, RealmConfig, RealmStage, ModTechnique, ModNpc, ModEvent, PlayerNpcRelationship, ModTalent, ModTalentRank, TalentSystemConfig, AttributeGroup, CommunityMod } from '../types';
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

    return `Bạn là một GameMaster AI thông minh, giúp người dùng tạo mod cho game tu tiên Phong Thần Ký Sự.
    
    **HIỂU BIẾT VỀ CƠ CHẾ GAME & MOD HIỆN TẠI:**
    - **Thuộc tính:** Nhân vật có các thuộc tính có thể được tăng cường. Danh sách đầy đủ: ${ALL_ATTRIBUTES.join(', ')}.
    - **Hệ thống Tu Luyện:** Hệ thống cảnh giới hiện tại trong mod này là: ${customRealms}. Bạn có thể định nghĩa lại toàn bộ hệ thống này bằng \`CREATE_REALM_SYSTEM\`.
    - **Phẩm chất Tiên Tư:** Các phẩm chất tiên tư hiện tại trong mod này là: ${customTalentRanks}.
    - **Vật phẩm (Items):** Gồm 5 loại: Vũ Khí, Phòng Cụ, Đan Dược, Pháp Bảo, Tạp Vật. Chúng có phẩm chất, trọng lượng, và có thể cộng chỉ số.
    - **Tiên Tư (Talents):** Là các tài năng bẩm sinh, có cấp bậc, và cũng có thể cộng chỉ số.
    - **Công Pháp (Techniques):** Là các kỹ năng nhân vật có thể sử dụng, có tiêu hao, hồi chiêu, và cấp bậc.
    - **Sự kiện (Events):** Là các tình huống có kịch bản với các lựa chọn, có thể yêu cầu kiểm tra thuộc tính (skill check) và dẫn đến các kết quả khác nhau (outcomes).

    **NHIỆM VỤ CỦA BẠN:**
    Phân tích yêu cầu của người dùng và chuyển đổi nó thành một hành động có cấu trúc (action) tương thích với các cơ chế trên.
    - Nếu người dùng chỉ đang trò chuyện hoặc hỏi, hãy sử dụng hành động 'CHAT'.
    - Nếu người dùng yêu cầu tạo một hoặc nhiều vật phẩm, tiên tư, nhân vật, tông môn, công pháp, NPC, sự kiện v.v., hãy sử dụng các hành động 'CREATE' tương ứng.
    - Nếu người dùng yêu cầu nhiều thứ cùng lúc, hãy sử dụng 'BATCH_ACTIONS'.
    - Luôn trả lời ở định dạng JSON theo một trong các cấu trúc 'action' hợp lệ. Ví dụ: { "action": "CREATE_ITEM", "data": { ... } }.
    - Hãy sáng tạo dựa trên bối cảnh tu tiên và các yếu tố đã có trong mod.
    `;
};


export const getGameMasterActionableResponse = async (prompt: string, fileContent?: string, modContext?: ModContext): Promise<AIAction> => {
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
    // FIX: Access npc.identity.name instead of npc.name to match the NPC type.
    **Nhân vật khác tại đây:** ${npcs.length > 0 ? npcs.map(n => n.identity.name).join(', ') : 'Không có ai'}

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
    
    // FIX: Access npc.identity.name instead of npc.name.
    const relationshipsText = playerCharacter.relationships.map(rel => {
        const npc = activeNpcs.find(n => n.id === rel.npcId);
        return npc ? `${npc.identity.name}: ${rel.status} (${rel.value})` : '';
    }).filter(Boolean).join('; ');

    const worldBuildingMod = activeMods?.find(mod => mod.content.worldBuilding && mod.content.worldBuilding.length > 0);
    let gameContext = "**Bối cảnh:** Game tu tiên Phong Thần.";
    if (worldBuildingMod && worldBuildingMod.content.worldBuilding && worldBuildingMod.content.worldBuilding.length > 0) {
        const worldInfo = worldBuildingMod.content.worldBuilding[0];
        gameContext = `**Bối cảnh:** ${worldInfo.title}. ${worldInfo.description}`;
    }

    const knownLocations = discoveredLocations.map(l => l.name).join(', ');
    // FIX: Access npc.identity.name instead of npc.name.
    const knownNpcs = activeNpcs.filter(n => encounteredNpcIds.includes(n.id)).map(n => n.identity.name).join(', ');

    const currentRealmData = REALM_SYSTEM.find(r => r.id === playerCharacter.cultivation.currentRealmId);
    const currentStageData = currentRealmData?.stages.find(s => s.id === playerCharacter.cultivation.currentStageId);
    const cultivationProgress = `(${playerCharacter.cultivation.spiritualQi.toLocaleString()} / ${currentStageData?.qiRequired.toLocaleString() || '???'})`;
    const chinhDaoAttr = playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === 'Chính Đạo')?.value || 0;
    const maDaoAttr = playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === 'Ma Đạo')?.value || 0;
    
    const activeModsInfo = activeMods.length > 0
        ? `\n**Thông tin từ Mod đang kích hoạt:**\n${activeMods.map(mod => {
            let modDetails = `- ${mod.modInfo.name}:\n`;
            if (mod.content.worldBuilding?.length) {
                modDetails += `  - Lore: ${mod.content.worldBuilding.map(wb => wb.title).join(', ')}\n`;
            }
            if (mod.content.sects?.length) {
                modDetails += `  - Tông Môn: ${mod.content.sects.map(s => s.name).join(', ')}\n`;
            }
            if (mod.content.realmConfigs?.length) {
                modDetails += `  - Hệ Thống Cảnh Giới: ${mod.content.realmConfigs.map(r => r.name).join(', ')}\n`;
            }
            if (mod.content.items?.length) {
                 modDetails += `  - Vật phẩm mới: ${mod.content.items.slice(0, 3).map(i => i.name).join(', ')}...\n`;
            }
            return modDetails;
        }).join('')}`
        : '';

    const context = `
    ${gameContext}
    ${activeModsInfo}
    **Nhân vật chính:**
    - Tên: ${playerCharacter.identity.name}
    - Tuổi: ${playerCharacter.identity.age} (Tuổi thọ tối đa hiện tại dựa vào cảnh giới)
    - Cảnh giới: ${currentRealmData?.name || 'Vô danh'} - ${currentStageData?.name || 'Sơ kỳ'} ${cultivationProgress}
    - Thuộc tính: ${playerCharacter.attributes.flatMap(g => g.attributes).map(a => `${a.name}(${a.value})`).join(', ')}
    - Thiên Hướng: Chính Đạo(${chinhDaoAttr}), Ma Đạo(${maDaoAttr})
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
    // FIX: Access identity.name and other direct properties to build the context string.
    - Nhân vật khác tại đây: ${npcsAtLocation.map(n => `${n.identity.name} (Chính: ${n.ChinhDao || 0}, Ma: ${n.MaDao || 0}, Lực chiến: ${n.TienLuc || 10})`).join('; ') || 'Không có ai'}
    - Các tin đồn gần đây: ${worldState.rumors.slice(-3).map(r => `Tại ${r.locationId}: "${r.text}"`).join('; ') || 'Không có'}

    **Lịch sử gần đây:**
    ${history.slice(-5).map(entry => `${entry.type === 'narrative' ? 'Hệ thống:' : 'Người chơi:'} ${entry.content}`).join('\n')}

    ${actionDescription}
    `;

    const systemInstruction = `Bạn là một người kể chuyện (Game Master) cho một game nhập vai.
    Nhiệm vụ của bạn là tiếp nối câu chuyện dựa trên hành động của người chơi và bối cảnh hiện tại.
    - **Phong cách kể chuyện:** ${narrativeStyleDesc}. Hãy tuân thủ nghiêm ngặt phong cách này.
    - **Hệ thống Chính-Ma:** Thế giới giờ có hệ thống Chính Đạo và Ma Đạo. Hành động của người chơi sẽ ảnh hưởng đến các chỉ số này. Ví dụ: cứu người tăng Chính Đạo, giết người vô cớ tăng Ma Đạo. Các NPC cũng có chỉ số này và sẽ phản ứng tương ứng. NPC chính đạo sẽ ghét người chơi ma đạo cao và ngược lại, có thể dẫn đến xung đột.
    - **Hệ thống Chiến đấu (RẤT QUAN TRỌNG):** Khi người chơi thực hiện hành động tấn công/gây hấn với NPC, bạn PHẢI mô phỏng kết quả. So sánh sức mạnh của người chơi (dựa vào Cảnh giới, Tiên Lực) với NPC (dựa vào mô tả và chỉ số chiến đấu được cung cấp).
        - Nếu chênh lệch quá lớn (ví dụ: Luyện Khí Kỳ tấn công một đại năng Nguyên Anh), người yếu hơn sẽ thua ngay lập tức. Nếu người chơi thua, dùng tag [DEATH:{"reason": "Bị [Tên NPC] giết chết trong một chiêu."}].
        - Nếu người chơi mạnh hơn nhiều, hãy mô tả một chiến thắng dễ dàng và có thể thưởng vật phẩm bằng tag [ADD_ITEM] hoặc [ADD_CURRENCY].
        - Nếu sức mạnh tương đương, hãy mô tả một trận chiến kịch tính.
    - **KIỂM SOÁT LOGIC (CỰC KỲ QUAN TRỌNG):**
        - Duy trì sự nhất quán của thế giới. Nhân vật chỉ biết những gì họ đã trải nghiệm.
        - **Hành động phi logic:** Nếu người chơi thực hiện hành động dựa trên kiến thức mà nhân vật không thể có (ví dụ: "đi tìm gặp Tôn Ngộ Không"), bạn KHÔNG được thực hiện. Thay vào đó, hãy để nhân vật phản ứng một cách tự nhiên (ví dụ: "Trong đầu bạn chợt lóe lên một cái tên lạ lẫm...").
    - **Tương tác Đặc Biệt (Dùng tag TRONG câu chuyện):**
        - Hiển thị cửa hàng: [SHOW_SHOP:{"shopId": "thien_co_cac"}]
        - Thay đổi quan hệ: [UPDATE_RELATIONSHIP:{"npcName": "Tên NPC", "change": 10}] (số dương là tốt, số âm là xấu).
        - Thay đổi thuộc tính: [UPDATE_ATTRIBUTE:{"name": "Chính Đạo", "change": 10}] (dùng cho Chính Đạo, Ma Đạo, và các chỉ số khác).
        - Cái chết: [DEATH:{"reason": "Bị yêu thú cấp cao giết chết."}]
        - Thêm vật phẩm: [ADD_ITEM:{"name": "Tên", "description": "Mô tả", "quantity": 1, "type": "Tạp Vật", "icon": "❓", "weight": 0.1, "quality": "Phàm Phẩm"}]
        - Mất vật phẩm: [REMOVE_ITEM:{"name": "Tên Vật Phẩm", "quantity": 1}]
        - Thưởng tiền: [ADD_CURRENCY:{"name": "Bạc", "amount": 100}]
        - NPC mới xuất hiện: [CREATE_NPC:{"name": "Tên", "status": "Trạng thái", "description": "Ngoại hình", "origin": "Xuất thân", "personality": "Tính cách", "locationId": "${currentLocation.id}"}]
        - Khám phá địa điểm: [DISCOVER_LOCATION:{"id": "new_id", "name": "Tên", "description": "Mô tả", "type": "Hoang Dã", "neighbors": ["${currentLocation.id}"], "coordinates": {"x": ${currentLocation.coordinates.x + (Math.random() > 0.5 ? 1 : -1)}, "y": ${currentLocation.coordinates.y + (Math.random() > 0.5 ? 1 : -1)}}}]
        - Thêm tin đồn: [ADD_RUMOR:{"locationId": "${currentLocation.id}", "text": "Nội dung tin đồn"}]
        - Học công pháp: [ADD_TECHNIQUE:{"name": "Tên", "description": "Mô tả", "type": "Linh Kỹ", "cost": {"type": "Linh Lực", "value": 10}, "cooldown": 2, "effectDescription": "Hiệu ứng", "rank": "Phàm Giai", "icon": "🔥"}]
    - **Lưu ý:** KHÔNG lặp lại hành động của người chơi. Chỉ viết phần tiếp theo. Giữ cho câu chuyện hấp dẫn.
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