import { GoogleGenAI, type GenerateContentResponse } from "@google/genai";

// This type is for the image generation response, as it's not directly exported.
export interface GenerateImagesResponse {
    generatedImages: {
        image: {
            imageBytes?: string;
        };
    }[];
}

class ApiKeyManager {
    private keys: string[] = [];
    private instances: GoogleGenAI[] = [];
    private currentIndex = 0;

    updateKeys(newKeys: string[]) {
        const sortedNew = [...(newKeys || [])].sort().join(',');
        const sortedOld = [...this.keys].sort().join(',');

        if (sortedNew === sortedOld) {
            return; // No change
        }

        console.log(`Updating API keys for Gemini service. Found ${newKeys?.length || 0} keys.`);
        this.keys = newKeys || [];
        this.instances = this.keys
            .filter(key => key && key.trim().length > 0)
            .map(key => new GoogleGenAI({ apiKey: key }));
        this.currentIndex = 0;
    }

    public getInstance(): GoogleGenAI | null {
        if (this.instances.length === 0) {
            return null;
        }
        return this.instances[this.currentIndex];
    }
    
    public rotateKey() {
        if (this.instances.length > 0) {
            const oldIndex = this.currentIndex;
            this.currentIndex = (this.currentIndex + 1) % this.instances.length;
            console.log(`Rotated from API key index ${oldIndex} to ${this.currentIndex}.`);
        }
    }

    get totalKeys(): number {
        return this.instances.length;
    }

    get a_currentIndex(): number {
        return this.currentIndex;
    }
}

export const apiKeyManager = new ApiKeyManager();

const executeApiCall = async <T>(apiFunction: (instance: GoogleGenAI) => Promise<T>): Promise<T> => {
    if (apiKeyManager.totalKeys === 0) {
        throw new Error("Không có API Key nào được cấu hình. Vui lòng thêm một key trong Cài đặt > AI & Models.");
    }

    const initialIndex = apiKeyManager.a_currentIndex;
    let attempts = 0;

    while (attempts < apiKeyManager.totalKeys) {
        const instance = apiKeyManager.getInstance();
        try {
            const result = await apiFunction(instance!);
            return result;
        } catch (error: any) {
            console.warn(`API call failed with key index ${apiKeyManager.a_currentIndex}. Error:`, error.message);
            // Check for quota-related errors
            if (error.toString().includes('429') || error.message?.includes('quota')) {
                attempts++;
                apiKeyManager.rotateKey();
                if (apiKeyManager.a_currentIndex === initialIndex) {
                    // We've cycled through all keys and they all failed.
                    throw new Error("Tất cả các API key đều đã hết hạn ngạch (quota). Vui lòng thử lại sau hoặc thêm key mới.");
                }
            } else {
                // Not a quota error, rethrow it immediately.
                throw error;
            }
        }
    }
    // This part is reached if all keys failed with quota errors.
    throw new Error("Tất cả các API key đều đã hết hạn ngạch (quota) sau khi thử lại.");
};

export const generateWithRetry = (generationRequest: any): Promise<GenerateContentResponse> => {
    return executeApiCall(instance => instance.models.generateContent(generationRequest));
};

export const generateWithRetryStream = (generationRequest: any): Promise<AsyncIterable<GenerateContentResponse>> => {
    return executeApiCall(instance => instance.models.generateContentStream(generationRequest));
};

export const generateImagesWithRetry = (generationRequest: any): Promise<GenerateImagesResponse> => {
    const apiCall = (instance: GoogleGenAI) => instance.models.generateImages(generationRequest) as unknown as Promise<GenerateImagesResponse>;
    return executeApiCall(apiCall);
};