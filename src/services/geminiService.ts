import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
import type { ElementType } from 'react';
import type { InnateTalent, CharacterIdentity, GameSettings, PlayerCharacter, StoryEntry, GameDate, Location, NPC, GameEvent, Gender, CultivationTechnique, Rumor, GameState, RealmConfig, RealmStage, ModTechnique, ModNpc, ModEvent, ModTalent, ModTalentRank, TalentSystemConfig, AttributeGroup, CommunityMod, AiGeneratedModData, AIAction, NpcDensity, Attribute, FullMod, PlayerNpcRelationship, InventoryItem } from '../types';
import { TALENT_RANK_NAMES, DEFAULT_SETTINGS, ALL_ATTRIBUTES, WORLD_MAP, NARRATIVE_STYLES, REALM_SYSTEM, COMMUNITY_MODS_URL, NPC_DENSITY_LEVELS, ATTRIBUTES_CONFIG, CURRENCY_ITEMS } from "../constants";
import * as db from './dbService';
import { FaQuestionCircle } from "react-icons/fa";

// --- Settings Manager ---
const SettingsManager = (() => {
    let settingsCache: GameSettings | null = null;

    const loadSettings = async () => {
        try {
            const settings = await db.getSettings() || DEFAULT_SETTINGS;
            settingsCache = settings;
        } catch (e) {
            console.error("Could not load settings from DB.", e);
            settingsCache = DEFAULT_SETTINGS;
        }
    };

    return {
        reload: loadSettings,
        get: (): GameSettings => settingsCache || DEFAULT_SETTINGS,
    };
})();

export const reloadSettings = SettingsManager.reload;

const getAiClient = () => {
    const settings = getSettings();
    const apiKey = settings.apiKey || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key của Gemini chưa được cấu hình trong Cài đặt hoặc biến môi trường.");
    }
    return new GoogleGenAI({ apiKey });
};


const getSettings = (): GameSettings => {
    return SettingsManager.get();
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
    await reloadSettings();
    
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
            const isOverloaded = errorMessage.includes('503') || errorMessage.includes('model is overloaded');

            if (isAuthError) {
                console.error(`API call failed with auth error: ${errorMessage}`);
                throw new Error(`Lỗi xác thực API: ${error.message}. Vui lòng kiểm tra API Key của bạn.`);
            }
            if (isQuotaError) {
                console.error(`API call failed with quota error: ${errorMessage}`);
                 throw new Error(`Hết dung lượng API. Vui lòng thử lại sau hoặc kiểm tra gói cước của bạn.`);
            }
            
            if (attempt >= maxRetries) {
                console.error(`API call failed after ${maxRetries} retries.`, error);
                if (isOverloaded) {
                    throw new Error("Máy chủ AI đang quá tải. Vui lòng thử lại sau ít phút.");
                }
                throw error;
            }

            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
            console.warn(`API call failed. Retrying in ${delay.toFixed(0)}ms... (Attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    
    throw new Error("API call failed after multiple retries.");
};


const generateWithRetryStream = async (generationRequest: any, maxRetries = 3): Promise<AsyncIterable<GenerateContentResponse>> => {
    const settings = getSettings();
    const safetySettings = getSafetySettingsForApi();
    
    const modelToUse = generationRequest.model || settings.mainTaskModel;

    const thinkingConfig = modelToUse.includes('flash') 
        ? { thinkingConfig: { thinkingBudget: settings.enableThinking ? settings.thinkingBudget : 0 } }
        : {};
    
    const finalRequest = {
        ...generationRequest,
        model: modelToUse,
        config: { 
            ...generationRequest.config, 
            safetySettings,
            temperature: settings.temperature,
            topK: settings.topK,
            topP: settings.topP,
            ...thinkingConfig,
        }
    };
    
    const ai = getAiClient();
    return ai.models.generateContentStream(finalRequest);
};

const generateWithRetry = (generationRequest: any, maxRetries = 3): Promise<GenerateContentResponse> => {
    const settings = getSettings();
    const safetySettings = getSafetySettingsForApi();
    
    const modelToUse = generationRequest.model || settings.mainTaskModel;

    const thinkingConfig = modelToUse.includes('flash') 
        ? { thinkingConfig: { thinkingBudget: settings.enableThinking ? settings.thinkingBudget : 0 } }
        : {};
    
    const finalRequest = {
        ...generationRequest,
        model: modelToUse,
        config: { 
            ...generationRequest.config, 
            safetySettings,
            temperature: settings.temperature,
            topK: settings.topK,
            topP: settings.topP,
            ...thinkingConfig,
        }
    };
    
    return performApiCall((ai, req) => ai.models.generateContent(req), finalRequest, maxRetries);
};

const generateImagesWithRetry = (generationRequest: any, maxRetries = 3): Promise<GenerateImagesResponse> => {
    const settings = getSettings();
    const finalRequest = { ...generationRequest, model: settings.imageGenerationModel };
    return performApiCall((ai, req) => ai.models.generateImages(req), finalRequest, maxRetries);
};

export const testApiKey = async (apiKey: string): Promise<{ status: 'valid' | 'invalid', error?: string }> => {
    if (!apiKey) {
        return { status: 'invalid', error: 'API key không được để trống.' };
    }

    try {
        const testAi = new GoogleGenAI({ apiKey });
        await testAi.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' });
        return { status: 'valid' as const };
    } catch (e: any) {
        let errorMessage = e.message;
        if (e.toString().includes('API key not valid')) {
            errorMessage = "API Key không hợp lệ. Vui lòng kiểm tra lại.";
        } else if (e.toString().includes('fetch failed')) {
            errorMessage = "Không thể kết nối đến máy chủ Gemini. Vui lòng kiểm tra kết nối mạng của bạn.";
        }
        return { status: 'invalid' as const, error: errorMessage };
    }
};

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
        return [{
            modInfo: {
                id: 'fallback-mod-example',
                name: 'Thần Binh Lợi Khí (Ví dụ)',
                author: 'Game Master',
                description: 'Không thể tải danh sách mod cộng đồng. Đây là một ví dụ mẫu có sẵn.',
                version: '1.0.0',
            },
            downloadUrl: 'https://gist.githubusercontent.com/world-class-dev/2c1b2c6e6152a5a5d852c0021c32c4e2/raw/phongthan-thanbinh-loikhi.json'
        }];
    }
};


interface ModTalentConfig {
    systemConfig: TalentSystemConfig;
    ranks: ModTalentRank[];
    availableTalents: ModTalent[];
}

export const generateCharacterIdentity = async (concept: string, gender: Gender): Promise<Omit<CharacterIdentity, 'gender' | 'age'>> => {
    const identitySchema = {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: 'Tên Hán Việt, phù hợp bối cảnh tiên hiệp. Ví dụ: "Lý Thanh Vân", "Hàn Lập".' },
            familyName: { type: Type.STRING, description: 'Họ của nhân vật, ví dụ: "Lý", "Trần".' },
            origin: { type: Type.STRING, description: 'Xuất thân, nguồn gốc của nhân vật, chi tiết và lôi cuốn.' },
            appearance: { type: Type.STRING, description: 'Mô tả ngoại hình chi tiết, độc đáo.' },
            personality: { type: Type.STRING, enum: ['Trung Lập', 'Chính Trực', 'Hỗn Loạn', 'Tà Ác'], description: 'Một trong các tính cách được liệt kê.' },
        },
        required: ['name', 'origin', 'appearance', 'personality', 'familyName'],
    };

    const prompt = `Dựa trên ý tưởng và bối cảnh game tu tiên Tam Thiên Thế Giới, hãy tạo ra Thân Phận (Identity) cho một nhân vật.
    - **Bối cảnh:** Tam Thiên Thế Giới, thế giới huyền huyễn, tiên hiệp.
    - **Giới tính nhân vật:** ${gender}
    - **Ý tưởng gốc từ người chơi:** "${concept}"
    
    Nhiệm vụ: Sáng tạo ra một cái tên, họ, xuất thân, ngoại hình, và tính cách độc đáo, sâu sắc và phù hợp với bối cảnh.
    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.
    `;
    
    const response = await generateWithRetry({
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: identitySchema,
        }
    });

    const json = JSON.parse(response.text);
    return json as Omit<CharacterIdentity, 'gender' | 'age'>;
};

export const generateTalentChoices = async (identity: CharacterIdentity, concept: string, modTalentConfig: ModTalentConfig): Promise<InnateTalent[]> => {
    const talentRanks = modTalentConfig.ranks.length > 0 ? modTalentConfig.ranks.map(r => r.name) : TALENT_RANK_NAMES;
    const choicesPerRoll = modTalentConfig.systemConfig.choicesPerRoll || 6;
    
    const talentsSchema = {
        type: Type.OBJECT,
        properties: {
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
        required: ['talents'],
    };

    const talentInstructions = modTalentConfig.systemConfig.allowAIGeneratedTalents !== false
    ? `Tạo ra ${choicesPerRoll} tiên tư độc đáo, có liên quan mật thiết đến thân phận và ý tưởng gốc của nhân vật. Phân bổ cấp bậc của chúng một cách ngẫu nhiên và hợp lý (sử dụng các cấp bậc: ${talentRanks.join(', ')}). Các tiên tư phải có chiều sâu, có thể có điều kiện kích hoạt hoặc tương tác đặc biệt.`
    : `CHỈ được chọn ${choicesPerRoll} tiên tư từ danh sách có sẵn sau: ${modTalentConfig.availableTalents.map(t => t.name).join(', ')}.`;

    const prompt = `Dựa trên thông tin về nhân vật, hãy tạo ra một bộ Tiên Tư (Innate Talents) cho họ.
    - **Bối cảnh:** Game tu tiên Tam Thiên Thế Giới.
    - **Ý tưởng gốc:** "${concept}"
    - **Thân phận nhân vật:**
        - Tên: ${identity.name}
        - Giới tính: ${identity.gender}
        - Xuất thân: ${identity.origin}
        - Ngoại hình: ${identity.appearance}
        - Tính cách: ${identity.personality}

    Nhiệm vụ:
    ${talentInstructions}

    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.
    `;

    const response = await generateWithRetry({
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: talentsSchema,
        }
    });

    const json = JSON.parse(response.text);
    return json.talents as InnateTalent[];
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

export const generateBackgroundImage = async (prompt: string): Promise<string> => {
    const fullPrompt = `${prompt}, beautiful fantasy landscape, digital painting, epic, cinematic lighting, wide angle, suitable for a game background.`;

    const response = await generateImagesWithRetry({
        prompt: fullPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const generateEventIllustration = async (prompt: string): Promise<string> => {
    const fullPrompt = `Epic moment, fantasy art painting, Chinese ink wash painting style (Shuǐmòhuà), cinematic lighting, detailed, beautiful. ${prompt}`;

    const response = await generateImagesWithRetry({
        prompt: fullPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const generateDynamicNpcs = async (npcDensity: NpcDensity): Promise<NPC[]> => {
    const count = NPC_DENSITY_LEVELS.find(d => d.id === npcDensity)?.count ?? 15;
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
                currency: {
                    type: Type.OBJECT,
                    description: 'Số tiền NPC sở hữu. Có thể để trống nếu là người thường.',
                    properties: {
                        linhThachHaPham: { type: Type.NUMBER, description: 'Số Linh thạch hạ phẩm.' },
                        bac: { type: Type.NUMBER, description: 'Số Bạc.' },
                    }
                },
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
            required: ['name', 'gender', 'status', 'description', 'origin', 'personality', 'realmName', 'talents', 'locationId', 'ChinhDao', 'MaDao', 'TienLuc', 'PhongNgu', 'SinhMenh', 'currency'],
        },
    };
    
    const prompt = `Tạo ra ${count} NPC (Non-Player Characters) độc đáo cho thế giới game tu tiên Tam Thiên Thế Giới.
    Các NPC này có thể là tu sĩ, yêu ma, dân thường, hoặc các sinh vật kỳ dị.
    Mỗi NPC cần có thông tin đầy đủ theo schema. Hãy sáng tạo và làm cho thế giới trở nên sống động.
    
    **Yêu cầu chi tiết:**
    1.  **Chỉ số:** Dựa vào tính cách và xuất thân, hãy gán cho họ các chỉ số Thiên Hướng (Chinh Đạo, Ma Đạo) và chỉ số chiến đấu (Tiên Lực, Phòng Ngự, Sinh Mệnh). Ví dụ, một 'ma đầu' sẽ có Ma Đạo cao, trong khi một 'đại hiệp' sẽ có Chính Đạo cao.
    2.  **Cảnh Giới:** Dựa trên mô tả sức mạnh và vai vế của NPC, hãy chọn một cảnh giới (realmName) phù hợp từ danh sách. Một lão nông bình thường sẽ là "Phàm Nhân", trong khi một trưởng lão tông môn có thể là "Kết Đan Kỳ" hoặc "Nguyên Anh Kỳ".
    3.  **Tiên Tư:** Tạo ra 1-2 tiên tư (talents) độc đáo và phù hợp cho mỗi NPC tu sĩ. Các tiên tư nên có cấp bậc (rank) và hiệu ứng (effect) rõ ràng, có thể cộng thêm chỉ số (bonuses).
    4.  **Tài Sản:** Gán cho họ một lượng tiền tệ (Linh thạch hạ phẩm, Bạc) phù hợp. Một trưởng lão có thể giàu có, trong khi một tán tu có thể nghèo khó.`;
    
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
    
    const attrConfigMap = new Map<string, { description: string, icon: ElementType }>();
    ATTRIBUTES_CONFIG.forEach(group => {
        group.attributes.forEach(attr => {
            attrConfigMap.set(attr.name, { description: attr.description, icon: attr.icon });
        });
    });

    return npcsData.map((npcData: any): NPC => {
        const { name, gender, description, origin, personality, talents, realmName, currency, ...stats } = npcData;
        
        const targetRealm = REALM_SYSTEM.find(r => r.name === realmName) || REALM_SYSTEM[0];
        const targetStage = targetRealm.stages[Math.floor(Math.random() * targetRealm.stages.length)];

        const cultivation: NPC['cultivation'] = {
            currentRealmId: targetRealm.id,
            currentStageId: targetStage.id,
            spiritualQi: Math.floor(Math.random() * targetStage.qiRequired),
            hasConqueredInnerDemon: false,
        };

        const baseAttributes: AttributeGroup[] = [
             {
                title: 'Chỉ số Chiến Đấu',
                attributes: [
                    { name: 'Tiên Lực', description: attrConfigMap.get('Tiên Lực')?.description ?? 'Sát thương phép thuật.', value: stats.TienLuc || 0, icon: attrConfigMap.get('Tiên Lực')?.icon ?? FaQuestionCircle },
                    { name: 'Phòng Ngự', description: attrConfigMap.get('Phòng Ngự')?.description ?? 'Khả năng chống đỡ.', value: stats.PhongNgu || 0, icon: attrConfigMap.get('Phòng Ngự')?.icon ?? FaQuestionCircle },
                ],
            },
            {
                title: 'Chỉ số Sinh Tồn',
                attributes: [
                     { name: 'Sinh Mệnh', description: attrConfigMap.get('Sinh Mệnh')?.description ?? 'Thể lực.', value: stats.SinhMenh || 100, maxValue: stats.SinhMenh || 100, icon: attrConfigMap.get('Sinh Mệnh')?.icon ?? FaQuestionCircle },
                ]
            },
            {
                title: 'Thiên Hướng',
                attributes: [
                    { name: 'Chính Đạo', description: attrConfigMap.get('Chính Đạo')?.description ?? 'Danh tiếng chính đạo.', value: stats.ChinhDao || 0, icon: attrConfigMap.get('Chính Đạo')?.icon ?? FaQuestionCircle },
                    { name: 'Ma Đạo', description: attrConfigMap.get('Ma Đạo')?.description ?? 'Uy danh ma đạo.', value: stats.MaDao || 0, icon: attrConfigMap.get('Ma Đạo')?.icon ?? FaQuestionCircle },
                ],
            },
        ];

        const currencyItems: InventoryItem[] = [];
        if (currency?.linhThachHaPham > 0) {
            const currencyItem = CURRENCY_ITEMS.find(c => c.name === 'Linh thạch hạ phẩm');
            if (currencyItem) {
                currencyItems.push({ ...currencyItem, quantity: currency.linhThachHaPham });
            }
        }
        if (currency?.bac > 0) {
            const currencyItem = CURRENCY_ITEMS.find(c => c.name === 'Bạc');
            if (currencyItem) {
                currencyItems.push({ ...currencyItem, quantity: currency.bac });
            }
        }


        return {
            ...stats,
            id: `dynamic-npc-${Math.random().toString(36).substring(2, 9)}`,
            identity: {
                name,
                gender,
                appearance: description,
                origin,
                personality,
                age: 20 + Math.floor(Math.random() * 200)
            },
            talents: talents || [],
            attributes: baseAttributes,
            cultivation,
            techniques: [],
            inventory: { items: currencyItems, weightCapacity: 15 },
            equipment: {},
            healthStatus: 'HEALTHY' as const,
            activeEffects: [],
            tuoiTho: 100 + Math.floor(Math.random() * 500)
        };
    });
};

export const generateModContentFromPrompt = async (prompt: string, modContext: any): Promise<AiGeneratedModData> => {
    const statBonusSchema = { type: Type.OBJECT, properties: { attribute: { type: Type.STRING, enum: ALL_ATTRIBUTES }, value: { type: Type.NUMBER } }, required: ['attribute', 'value'] };
    
    const modItemSchema = {
        type: Type.OBJECT,
        properties: {
            contentType: { type: Type.STRING, enum: ['item'] },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['Vũ Khí', 'Phòng Cụ', 'Đan Dược', 'Pháp Bảo', 'Tạp Vật', 'Đan Lô', 'Linh Dược', 'Đan Phương', 'Nguyên Liệu'] },
            quality: { type: Type.STRING, enum: ['Phàm Phẩm', 'Linh Phẩm', 'Pháp Phẩm', 'Bảo Phẩm', 'Tiên Phẩm', 'Tuyệt Phẩm'] },
            weight: { type: Type.NUMBER },
            bonuses: { type: Type.ARRAY, items: statBonusSchema },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['contentType', 'name', 'description', 'type', 'quality', 'weight']
    };

    const modTalentSchema = {
        type: Type.OBJECT,
        properties: {
            contentType: { type: Type.STRING, enum: ['talent'] },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            rank: { type: Type.STRING, enum: TALENT_RANK_NAMES },
            bonuses: { type: Type.ARRAY, items: statBonusSchema },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['contentType', 'name', 'description', 'rank']
    };

    const allSchemas = [modItemSchema, modTalentSchema];

    const finalSchema = {
        type: Type.OBJECT,
        properties: {
            content: {
                type: Type.ARRAY,
                description: "Danh sách các nội dung game được tạo ra (vật phẩm, tiên tư, etc.)",
                items: {
                    oneOf: allSchemas
                }
            },
            realmConfigs: {
                type: Type.ARRAY,
                description: "Một hệ thống cảnh giới tu luyện hoàn chỉnh.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        stages: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    qiRequired: { type: Type.NUMBER },
                                    bonuses: { type: Type.ARRAY, items: statBonusSchema }
                                },
                                required: ['name', 'qiRequired']
                            }
                        }
                    },
                    required: ['name', 'stages']
                }
            },
            talentSystemConfig: {
                type: Type.OBJECT,
                properties: {
                    systemName: { type: Type.STRING },
                    choicesPerRoll: { type: Type.NUMBER },
                    maxSelectable: { type: Type.NUMBER },
                    allowAIGeneratedTalents: { type: Type.BOOLEAN },
                }
            }
        }
    };

    const fullPrompt = `Bạn là một Game Master AI cho game tu tiên "Tam Thiên Thế Giới".
    Nhiệm vụ của bạn là tạo ra nội dung mới cho một bản mod dựa trên yêu cầu của người dùng.
    
    Bối cảnh mod hiện tại (nếu có):
    ${JSON.stringify(modContext, null, 2)}
    
    Yêu cầu của người dùng:
    "${prompt}"
    
    Dựa vào yêu cầu, hãy tạo ra các đối tượng nội dung game phù hợp và trả về dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.
    Hãy sáng tạo và đảm bảo nội dung phù hợp với bối cảnh tiên hiệp.
    `;

    const response = await generateWithRetry({
        model: getSettings().gameMasterModel,
        contents: fullPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: finalSchema,
        }
    });

    try {
        const json = JSON.parse(response.text.trim());
        return json as AiGeneratedModData;
    } catch (e) {
        console.error("Failed to parse AI response for mod content:", e);
        console.error("Raw AI response:", response.text);
        throw new Error("AI đã trả về dữ liệu JSON không hợp lệ.");
    }
};

export async function* generateStoryContinuationStream(gameState: GameState, userInput: string, inputType: 'say' | 'act'): AsyncIterable<string> {
    const { playerCharacter, gameDate, storyLog, discoveredLocations, activeNpcs, storySummary } = gameState;
    const currentLocation = discoveredLocations.find(l => l.id === playerCharacter.currentLocationId);
    const npcsHere = activeNpcs.filter(n => n.locationId === playerCharacter.currentLocationId);
    
    const settings = getSettings();
    const narrativeStyle = NARRATIVE_STYLES.find(s => s.value === settings.narrativeStyle)?.label || 'Cổ điển Tiên hiệp';

    const systemInstruction = `Bạn là một người kể chuyện (Game Master) cho một game nhập vai text-based có tên "Tam Thiên Thế Giới".
- Bối cảnh: Thế giới tiên hiệp huyền huyễn.
- **QUAN TRỌNG NHẤT: PHẢI LUÔN LUÔN trả lời bằng TIẾNG VIỆT.**
- Giọng văn: ${narrativeStyle}. Mô tả chi tiết, hấp dẫn và phù hợp với bối cảnh.
- Chỉ kể tiếp câu chuyện, không đưa ra lời khuyên hay bình luận ngoài vai trò người kể chuyện.
- Khi người chơi thực hiện một hành động, hãy mô tả kết quả của hành động đó.
- Đừng lặp lại những thông tin đã có trong ngữ cảnh.`;

    const historyContext = storySummary
      ? `**Lịch sử tóm tắt:**\n${storySummary}\n\n**Sự kiện gần đây nhất:**\n${storyLog.slice(-3).map(entry => `[${entry.type}] ${entry.content}`).join('\n')}`
      : `**Lịch sử gần đây (5 mục cuối):**\n${storyLog.slice(-5).map(entry => `[${entry.type}] ${entry.content}`).join('\n')}`;

    const contextSummary = [
        `**Nhân vật:** Tên: ${playerCharacter.identity.name}. Xuất thân: ${playerCharacter.identity.origin}. Tính cách: ${playerCharacter.identity.personality}. Danh vọng: ${playerCharacter.danhVong.status} (${playerCharacter.danhVong.value} điểm).`,
        `**Bối cảnh:** Hiện tại là giờ ${gameDate.shichen}, ngày ${gameDate.day} mùa ${gameDate.season} năm ${gameDate.era} ${gameDate.year}.`,
        `**Vị trí:** ${currentLocation?.name}. Mô tả: ${currentLocation?.description}.`,
        npcsHere.length > 0 ? `**Nhân vật khác tại đây:** ${npcsHere.map(n => `${n.identity.name} (${n.status})`).join(', ')}.` : "Không có ai khác ở đây.",
        historyContext
    ].join('\n');
    
    const userAction = inputType === 'say'
        ? `${playerCharacter.identity.name} nói: "${userInput}"`
        : `${playerCharacter.identity.name} quyết định: "${userInput}"`;

    const fullPrompt = `${contextSummary}\n\n${userAction}\n\n**Người kể chuyện:**`;

    const stream = await generateWithRetryStream({
        contents: fullPrompt,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    for await (const chunk of stream) {
        yield (chunk.text ?? '').replace(/\[thinking...\]/gi, '');
    }
}

export const summarizeStory = async (storyLog: StoryEntry[]): Promise<string> => {
    const settings = getSettings();
    const logText = storyLog
        .map(entry => `[${entry.type}] ${entry.content}`)
        .join('\n');

    const prompt = `Dưới đây là lịch sử các sự kiện trong một trò chơi nhập vai. Hãy tóm tắt nó thành một đoạn văn kể chuyện ngắn gọn, mạch lạc. 
    Tập trung vào các điểm chính: nhân vật chính đã làm gì, gặp ai, những thay đổi quan trọng trong cốt truyện và thế giới.
    Bản tóm tắt này sẽ được dùng làm "ký ức dài hạn" cho AI kể chuyện, vì vậy nó cần phải súc tích nhưng đầy đủ thông tin.
    
    Lịch sử sự kiện:
    ---
    ${logText}
    ---
    
    Bản tóm tắt:`;

    const response = await generateWithRetry({
        model: settings.quickSupportModel, // Use a fast model for summarization
        contents: prompt,
    });

    return response.text.trim();
};


export const generateGameEvent = async (gameState: GameState): Promise<{ type: string, narrative: string, data?: any }> => {
    const prompt = "Tạo một sự kiện ngẫu nhiên nhỏ cho người chơi.";
    const response = await generateWithRetry({
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING, enum: ['location', 'npc', 'item', 'narrative'] },
                    narrative: { type: Type.STRING },
                },
                required: ['type', 'narrative']
            }
        }
    });
    return JSON.parse(response.text);
};

export const generateDynamicLocation = async (gameState: GameState): Promise<Location> => {
    const prompt = "Tạo một địa điểm mới độc đáo gần vị trí hiện tại của người chơi.";
    const response = await generateWithRetry({
        contents: prompt,
        // In a real scenario, a schema matching the Location type would be here.
    });
    // This is a simplified return value.
    const data = JSON.parse(response.text);
    return {
        id: `dynamic-loc-${Date.now()}`,
        name: data.name || "Vùng Đất Vô Danh",
        description: data.description || "Một nơi bí ẩn vừa được phát hiện.",
        type: 'Bí Cảnh',
        neighbors: [gameState.playerCharacter.currentLocationId],
        coordinates: { x: 0, y: 0 },
        qiConcentration: 20,
    };
};

export const analyzeActionForTechnique = async (gameState: GameState, text: string): Promise<CultivationTechnique | null> => {
    // Placeholder implementation
    return null;
};

export const generateBreakthroughNarrative = async (gameState: GameState, realm: RealmConfig, stage: RealmStage, isSuccess: boolean): Promise<string> => {
    const prompt = `Viết một đoạn văn tường thuật cảnh người chơi ${isSuccess ? 'đột phá thành công' : 'đột phá thất bại'} cảnh giới ${realm.name} - ${stage.name}.`;
    const response = await generateWithRetry({ contents: prompt });
    return response.text;
};

export const generateWorldEvent = async (gameState: GameState): Promise<{ narrative: string, worldStateChanges?: any }> => {
    const prompt = "Tạo một sự kiện thế giới lớn ảnh hưởng đến các phe phái hoặc địa điểm.";
    const response = await generateWithRetry({ contents: prompt });
    return { narrative: response.text };
};

export const generateCombatNarrative = async (gameState: GameState, actionDescription: string): Promise<string> => {
    const prompt = `Bối cảnh: Một trận chiến đang diễn ra. Hành động: ${actionDescription}. Hãy viết một đoạn văn tường thuật hành động này một cách sống động và phù hợp với bối cảnh tiên hiệp.`;
    const response = await generateWithRetry({ contents: prompt });
    return response.text;
};

export const generateFamilyAndFriends = async (identity: CharacterIdentity, locationId: string): Promise<{ npcs: NPC[], relationships: PlayerNpcRelationship[] }> => {
    const familySchema = {
        type: Type.OBJECT,
        properties: {
            family_members: {
                type: Type.ARRAY,
                description: 'Một danh sách gồm 2 đến 4 thành viên gia đình hoặc bạn bè thân thiết (ví dụ: cha, mẹ, anh/chị/em, bạn thân).',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: `Tên của thành viên gia đình, nên có họ là '${identity.familyName || ''}'.` },
                        gender: { type: Type.STRING, enum: ['Nam', 'Nữ'] },
                        age: { type: Type.NUMBER, description: 'Tuổi của nhân vật, phải hợp lý so với người chơi (18 tuổi).' },
                        relationship_type: { type: Type.STRING, description: 'Mối quan hệ với người chơi (ví dụ: Phụ thân, Mẫu thân, Huynh đệ, Thanh mai trúc mã).' },
                        status: { type: Type.STRING, description: 'Mô tả ngắn gọn về tình trạng hoặc nghề nghiệp hiện tại (ví dụ: "Là một thợ rèn trong trấn", "Nội trợ trong gia đình", "Đang học tại trường làng").' },
                        description: { type: Type.STRING, description: 'Mô tả ngắn gọn ngoại hình.' },
                        personality: { type: Type.STRING, enum: ['Trung Lập', 'Chính Trực', 'Hỗn Loạn', 'Tà Ác'] },
                    },
                    required: ['name', 'gender', 'age', 'relationship_type', 'status', 'description', 'personality'],
                },
            }
        },
        required: ['family_members'],
    };

    const prompt = `Dựa trên thông tin về nhân vật chính, hãy tạo ra các thành viên gia đình và bạn bè thân thiết cho họ.
    - **Bối cảnh:** Game tu tiên Tam Thiên Thế Giới, một thế giới huyền huyễn.
    - **Nhân vật chính:**
        - Tên: ${identity.name} (${identity.gender}, 18 tuổi)
        - Họ: ${identity.familyName || '(Không có)'}
        - Xuất thân: ${identity.origin}
        - Tính cách: ${identity.personality}
    
    Nhiệm vụ: Tạo ra 2 đến 4 NPC là người thân hoặc bạn bè gần gũi của nhân vật chính. Họ đều là PHÀM NHÂN, không phải tu sĩ. Họ nên sống cùng một địa điểm với người chơi.
    Hãy trả về kết quả dưới dạng một đối tượng JSON duy nhất theo schema đã cung cấp.
    `;
    
    const settings = getSettings();
    const response = await generateWithRetry({
        model: settings.npcSimulationModel,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: familySchema,
        }
    });

    const data = JSON.parse(response.text);
    const generatedNpcs: NPC[] = [];
    const generatedRelationships: PlayerNpcRelationship[] = [];

    data.family_members.forEach((member: any) => {
        const npcId = `family-npc-${Math.random().toString(36).substring(2, 9)}`;
        const npc: NPC = {
            id: npcId,
            identity: {
                name: member.name,
                gender: member.gender,
                appearance: member.description,
                origin: `Người thân của ${identity.name} tại ${locationId}.`,
                personality: member.personality,
                age: member.age,
                familyName: identity.familyName,
            },
            status: member.status,
            attributes: [], // They are mortals, few attributes needed
            talents: [],
            locationId: locationId,
            cultivation: { currentRealmId: 'pham_nhan', currentStageId: 'pn_1', spiritualQi: 0, hasConqueredInnerDemon: true },
            techniques: [],
            inventory: { items: [], weightCapacity: 10 },
            equipment: {},
            healthStatus: 'HEALTHY',
            activeEffects: [],
            tuoiTho: 80, // Mortal lifespan
        };
        generatedNpcs.push(npc);

        const relationship: PlayerNpcRelationship = {
            npcId: npcId,
            type: member.relationship_type,
            value: 80 + Math.floor(Math.random() * 20), // Start with high affinity
            status: 'Tri kỷ',
        };
        generatedRelationships.push(relationship);
    });

    return { npcs: generatedNpcs, relationships: generatedRelationships };
};

export const generateOpeningScene = async (gameState: GameState): Promise<string> => {
    const { playerCharacter, discoveredLocations, activeNpcs } = gameState;
    const currentLocation = discoveredLocations.find(loc => loc.id === playerCharacter.currentLocationId);
    
    const familyInfo = playerCharacter.relationships
        .map(rel => {
            const npc = activeNpcs.find(n => n.id === rel.npcId);
            return npc ? `- ${rel.type}: ${npc.identity.name} (${npc.status})` : null;
        })
        .filter(Boolean)
        .join('\n');
    
    const settings = getSettings();
    const narrativeStyle = NARRATIVE_STYLES.find(s => s.value === settings.narrativeStyle)?.label || 'Cổ điển Tiên hiệp';

    const prompt = `Bạn là người kể chuyện cho game tu tiên "Tam Thiên Thế Giới". Hãy viết một đoạn văn mở đầu thật hấp dẫn cho người chơi.
    - **Giọng văn:** ${narrativeStyle}.
    - **Nhân vật chính:** ${playerCharacter.identity.name}, ${playerCharacter.identity.age} tuổi. Xuất thân: ${playerCharacter.identity.origin}.
    - **Địa điểm hiện tại:** ${currentLocation?.name}. Mô tả: ${currentLocation?.description}.
    - **Gia đình & Người thân:**
    ${familyInfo}

    Nhiệm vụ: Dựa vào thông tin trên, hãy viết một đoạn văn mở đầu khoảng 2-3 câu. Đoạn văn phải thiết lập bối cảnh ngay lập tức: người chơi đang ở đâu, đang làm gì, và có thể đề cập đến một người thân để tạo sự kết nối ban đầu.
    
    Ví dụ:
    "Ánh nắng ban mai xuyên qua khe cửa, rọi lên gương mặt của Lý Thanh Vân. Ngươi đang ngồi trong căn nhà gỗ đơn sơ ở Thanh Hà Trấn, tiếng phụ thân Lý Đại Ngưu đang rèn sắt từ ngoài sân vọng vào đều đặn. Hôm nay là một ngày trọng đại..."
    
    Hãy viết một đoạn văn độc đáo và phù hợp với nhân vật. Chỉ trả về đoạn văn tường thuật, không thêm bất kỳ lời dẫn hay bình luận nào khác.`;

    const response = await generateWithRetry({
        model: settings.mainTaskModel,
        contents: prompt,
    });

    return response.text.trim();
};
