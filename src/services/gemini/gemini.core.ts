import { GoogleGenAI, HarmCategory, HarmBlockThreshold, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
import type { GameSettings } from '../../types';
import { DEFAULT_SETTINGS } from "../../constants";
import * as db from '../dbService';

// --- Settings Manager (Simplified: No longer handles API keys) ---
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

// Initialize the Gemini client once with the environment variable.
// This is a hard requirement for security and best practices.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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
    
    if (!process.env.API_KEY) {
        throw new Error("API Key không được cấu hình. Vui lòng liên hệ quản trị viên.");
    }
    
    return ai.models.generateContentStream(finalRequest);
};

export const generateWithRetry = async (generationRequest: any): Promise<GenerateContentResponse> => {
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
    
    if (!process.env.API_KEY) {
        throw new Error("API Key không được cấu hình. Vui lòng liên hệ quản trị viên.");
    }
    
    try {
        const response = await ai.models.generateContent(finalRequest);
        return response;
    } catch (error) {
        console.error("API call failed:", error);
        throw new Error(`Lỗi gọi API: ${error}`);
    }
};

export const generateImagesWithRetry = async (generationRequest: any): Promise<GenerateImagesResponse> => {
    await reloadSettings();
    const settings = getSettings();
    const finalRequest = { ...generationRequest, model: settings.imageGenerationModel };
    
    if (!process.env.API_KEY) {
        throw new Error("API Key không được cấu hình. Vui lòng liên hệ quản trị viên.");
    }

    try {
        const response = await ai.models.generateImages(finalRequest);
        return response;
    } catch (error) {
        console.error("Image generation failed:", error);
        throw new Error(`Lỗi tạo ảnh: ${error}`);
    }
};
