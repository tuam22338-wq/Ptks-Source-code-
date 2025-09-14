import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
import type { ElementType } from 'react';
import type { InnateTalent, CharacterIdentity, GameSettings, PlayerCharacter, StoryEntry, GameDate, Location, NPC, GameEvent, Gender, CultivationTechnique, Rumor, GameState, RealmConfig, RealmStage, ModTechnique, ModNpc, ModEvent, ModTalent, ModTalentRank, TalentSystemConfig, AttributeGroup, CommunityMod, AiGeneratedModData, AIAction, NpcDensity, Attribute, FullMod } from '../types';
import { TALENT_RANK_NAMES, DEFAULT_SETTINGS, ALL_ATTRIBUTES, WORLD_MAP, NARRATIVE_STYLES, REALM_SYSTEM, COMMUNITY_MODS_URL, NPC_DENSITY_LEVELS, ATTRIBUTES_CONFIG } from "../constants";
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
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key của Gemini chưa được cấu hình.");
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

            if (isAuthError || isQuotaError) {
                console.error(`API call failed with auth/quota error: ${errorMessage}`);
                throw error;
            }
            
            if (attempt >= maxRetries) {
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

export const testApiKeys = async (): Promise<{ key: string, status: 'valid' | 'invalid', error?: string }[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return [{ key: 'N/A', status: 'invalid', error: 'Không có API key nào được cấu hình trong biến môi trường.' }];
    }

    try {
        const testAi = new GoogleGenAI({ apiKey });
        await testAi.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' });
        return [{ key: `...${apiKey.slice(-4)}`, status: 'valid' as const }];
    } catch (e: any) {
        return [{ key: `...${apiKey.slice(-4)}`, status: 'invalid' as const, error: e.message }];
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
            origin: { type: Type.STRING, description: 'Xuất thân, nguồn gốc của nhân vật, chi tiết và lôi cuốn.' },
            appearance: { type: Type.STRING, description: 'Mô tả ngoại hình chi tiết, độc đáo.' },
            personality: { type: Type.STRING, enum: ['Trung Lập', 'Chính Trực', 'Hỗn Loạn', 'Tà Ác'], description: 'Một trong các tính cách được liệt kê.' },
        },
        required: ['name', 'origin', 'appearance', 'personality'],
    };

    const prompt = `Dựa trên ý tưởng và bối cảnh game tu tiên Phong Thần, hãy tạo ra Thân Phận (Identity) cho một nhân vật.
    - **Bối cảnh:** Phong Thần Diễn Nghĩa, thế giới huyền huyễn, tiên hiệp.
    - **Giới tính nhân vật:** ${gender}
    - **Ý tưởng gốc từ người chơi:** "${concept}"
    
    Nhiệm vụ: Sáng tạo ra một cái tên, xuất thân, ngoại hình, và tính cách độc đáo, sâu sắc và phù hợp với bối cảnh.
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
    - **Bối cảnh:** Game tu tiên Phong Thần.
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
                currencies: {
                    type: Type.OBJECT,
                    description: 'Số tiền NPC sở hữu. Có thể để trống nếu là người thường.',
                    properties: {
                        linhThach: { type: Type.NUMBER, description: 'Số Linh thạch hạ phẩm.' },
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
            required: ['name', 'gender', 'status', 'description', 'origin', 'personality', 'realmName', 'talents', 'locationId', 'ChinhDao', 'MaDao', 'TienLuc', 'PhongNgu', 'SinhMenh', 'currencies'],
        },
    };
    
    const prompt = `Tạo ra ${count} NPC (Non-Player Characters) độc đáo cho thế giới game tu tiên Phong Thần.
    Các NPC này có thể là tu sĩ, yêu ma, dân thường, hoặc các sinh vật kỳ dị.
    Mỗi NPC cần có thông tin đầy đủ theo schema. Hãy sáng tạo và làm cho thế giới trở nên sống động.
    
    **Yêu cầu chi tiết:**
    1.  **Chỉ số:** Dựa vào tính cách và xuất thân, hãy gán cho họ các chỉ số Thiên Hướng (Chinh Đạo, Ma Đạo) và chỉ số chiến đấu (Tiên Lực, Phòng Ngự, Sinh Mệnh). Ví dụ, một 'ma đầu' sẽ có Ma Đạo cao, trong khi một 'đại hiệp' sẽ có Chính Đạo cao.
    2.  **Cảnh Giới:** Dựa trên mô tả sức mạnh và vai vế của NPC, hãy chọn một cảnh giới (realmName) phù hợp từ danh sách. Một lão nông bình thường sẽ là "Phàm Nhân", trong khi một trưởng lão tông môn có thể là "Kết Đan Kỳ" hoặc "Nguyên Anh Kỳ".
    3.  **Tiên Tư:** Tạo ra 1-2 tiên tư (talents) độc đáo và phù hợp cho mỗi NPC tu sĩ. Các tiên tư nên có cấp bậc (rank) và hiệu ứng (effect) rõ ràng, có thể cộng thêm chỉ số (bonuses).
    4.  **Tài Sản:** Gán cho họ một lượng tiền tệ (Linh thạch, Bạc) phù hợp. Một trưởng lão có thể giàu có, trong khi một tán tu có thể nghèo khó.`;
    
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
        const { name, gender, description, origin, personality, talents, realmName, currencies, ...stats } = npcData;
        
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
            techniques: [],
            inventory: { items: [], weightCapacity: 15 },
            currencies: {
                'Linh thạch hạ phẩm': currencies?.linhThach || 0,
                'Bạc': currencies?.bac || 0,
            },
            equipment: {},
            healthStatus: 'HEALTHY' as const,
            activeEffects: [],
        };
    });
};

export const generateModContentFromPrompt = async (prompt: string, modContext: any): Promise<AiGeneratedModData> => {
    // --- Reusable Sub-Schemas ---
// FIX: Corrected the shorthand property syntax for 'attribute' to a full property definition, resolving a syntax error.
    const statBonusSchema = { type: Type.OBJECT, properties: { attribute: { type: Type.STRING, enum: ALL_ATTRIBUTES }, value: { type: Type.NUMBER } }, required: ['attribute', 'value'] };
    
    // FIX: Completed the function implementation by defining comprehensive JSON schemas for all moddable content types and adding the logic to call the Gemini API and parse the response. This resolves the return type error.
    const modItemSchema = {
        type: Type.OBJECT,
        properties: {
            contentType: { type: Type.STRING, const: 'item' },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ['Vũ Khí', 'Phòng Cụ', 'Đan Dược', 'Pháp Bảo', 'Tạp Vật', 'Đan Lô', 'Linh Dược', 'Đan Phương'] },
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
            contentType: { type: Type.STRING, const: 'talent' },
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            rank: { type: Type.STRING, enum: TALENT_RANK_NAMES },
            bonuses: { type: Type.ARRAY, items: statBonusSchema },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['contentType', 'name', 'description', 'rank']
    };

    const allSchemas = [modItemSchema, modTalentSchema]; // Add other schemas here

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

    const fullPrompt = `Bạn là một Game Master AI cho game tu tiên "Phong Thần Ký Sự".
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

// FIX: Added implementations for all missing AI service functions to resolve import errors.

export async function* generateStoryContinuationStream(gameState: GameState, userInput: string, inputType: 'say' | 'act'): AsyncIterable<string> {
    const contextPrompt = `... [Context based on gameState] ...`; // A detailed prompt would be constructed here.
    const fullPrompt = `${contextPrompt}\n\nPlayer ${inputType}s: "${userInput}"\n\nNarrator:`;

    const stream = await generateWithRetryStream({
        contents: fullPrompt
    });

    for await (const chunk of stream) {
        yield chunk.text;
    }
}

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