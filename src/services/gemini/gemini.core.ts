import { GoogleGenAI, HarmCategory, HarmBlockThreshold, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
import type { GameSettings, CommunityMod, AIModel } from '../../types';
import { DEFAULT_SETTINGS, COMMUNITY_MODS_URL } from "../../constants";
import * as db from '../dbService';

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

// --- API Key Manager for Rotation and Load Balancing ---
const ApiKeyManager = (() => {
    let keys: string[] = [];
    let currentIndex = 0;

    return {
        initialize: (apiKeys: string[]) => {
            keys = apiKeys;
            currentIndex = 0;
        },
        getNextKey: (): string | null => {
            if (keys.length === 0) return null;
            const key = keys[currentIndex];
            currentIndex = (currentIndex + 1) % keys.length;
            return key;
        },
        getAvailableKeys: () => keys,
    };
})();


export const reloadSettings = SettingsManager.reload;

const getAiClient = (apiKey: string) => {
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
    baseRequest: any
): Promise<T> => {
    await reloadSettings();
    const settings = getSettings();
    ApiKeyManager.initialize(settings.apiKeys);
    const availableKeys = ApiKeyManager.getAvailableKeys();
    
    // Fallback to environment variable if no keys are in settings
    const keysToTry = availableKeys.length > 0 ? availableKeys : (process.env.API_KEY ? [process.env.API_KEY] : []);

    if (keysToTry.length === 0) {
        throw new Error("Không có API Key nào được cấu hình trong Cài đặt hoặc biến môi trường.");
    }

    let lastError: any = null;

    for (const apiKey of keysToTry) {
        if (!apiKey) continue;

        try {
            const ai = getAiClient(apiKey);
            const response = await apiFunction(ai, baseRequest);
            return response;
        } catch (error: any) {
            lastError = error;
            const errorMessage = error.toString().toLowerCase();
            const isAuthError = errorMessage.includes('400') || errorMessage.includes('permission') || errorMessage.includes('api key not valid');
            const isQuotaError = errorMessage.includes('429') || errorMessage.includes('resource_exhausted');

            if (isAuthError) {
                console.error(`API call failed with auth error on key ending with ...${apiKey.slice(-4)}: ${errorMessage}`);
                throw new Error(`Lỗi xác thực API: ${error.message}. Vui lòng kiểm tra lại các API Key của bạn.`);
            }
            
            if (isQuotaError) {
                console.warn(`API Key ending with ...${apiKey.slice(-4)} has reached its quota. Trying next key...`);
                // Silently continue to the next key
                continue;
            }

            // For other errors, fail fast
            console.error(`API call failed with an unexpected error on key ...${apiKey.slice(-4)}:`, error);
            throw error;
        }
    }
    
    console.error("All API keys failed.", lastError);
    throw new Error(`Tất cả các API Key đều không thành công. Lỗi cuối cùng: ${lastError.message}`);
};


export const generateWithRetryStream = async (generationRequest: any): Promise<AsyncIterable<GenerateContentResponse>> => {
    await reloadSettings();
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
    
    ApiKeyManager.initialize(settings.apiKeys);
    const apiKey = ApiKeyManager.getNextKey() || process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Không có API Key nào được cấu hình để thực hiện yêu cầu stream.");
    }
    const ai = getAiClient(apiKey);
    return ai.models.generateContentStream(finalRequest);
};

export const generateWithRetry = (generationRequest: any): Promise<GenerateContentResponse> => {
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
    
    return performApiCall((ai, req) => ai.models.generateContent(req), finalRequest);
};

export const generateImagesWithRetry = (generationRequest: any): Promise<GenerateImagesResponse> => {
    const settings = getSettings();
    const finalRequest = { ...generationRequest, model: settings.imageGenerationModel };
    return performApiCall((ai, req) => ai.models.generateImages(req), finalRequest);
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