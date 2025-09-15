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


export const generateWithRetryStream = async (generationRequest: any, maxRetries = 3): Promise<AsyncIterable<GenerateContentResponse>> => {
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

export const generateWithRetry = (generationRequest: any, maxRetries = 3): Promise<GenerateContentResponse> => {
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

export const generateImagesWithRetry = (generationRequest: any, maxRetries = 3): Promise<GenerateImagesResponse> => {
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