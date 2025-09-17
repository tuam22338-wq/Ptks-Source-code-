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

const MAX_503_RETRIES = 3;
const INITIAL_503_DELAY_MS = 1000;

const executeApiCall = async <T>(apiFunction: (instance: GoogleGenAI) => Promise<T>): Promise<T> => {
    if (apiKeyManager.totalKeys === 0) {
        throw new Error("Không có API Key nào được cấu hình. Vui lòng thêm một key trong Cài đặt > AI & Models.");
    }

    const initialIndex = apiKeyManager.a_currentIndex;
    let attempts = 0;

    while (attempts < apiKeyManager.totalKeys) {
        const instance = apiKeyManager.getInstance();
        if (!instance) {
            throw new Error("Không thể khởi tạo AI instance. Vui lòng kiểm tra API keys.");
        }
        
        try {
            const result = await apiFunction(instance);
            return result;
        } catch (error: any) {
            console.warn(`API call failed with key index ${apiKeyManager.a_currentIndex}. Error:`, error.message);

            // Specific handling for 503 with exponential backoff retries on the SAME key
            if (error.toString().includes('503')) {
                let delay = INITIAL_503_DELAY_MS;
                for (let i = 0; i < MAX_503_RETRIES; i++) {
                    console.log(`Service unavailable (503). Retrying in ${delay}ms... (Attempt ${i + 1}/${MAX_503_RETRIES})`);
                    await new Promise(res => setTimeout(res, delay + Math.random() * 500)); // Add jitter
                    try {
                        const result = await apiFunction(instance);
                        console.log(`Successfully recovered from 503 error on attempt ${i + 1}.`);
                        return result; // Success on retry
                    } catch (retryError: any) {
                        if (!retryError.toString().includes('503')) {
                            console.error("A non-503 error occurred during retry, aborting retries for this key.", retryError);
                            throw retryError; // Let the outer logic handle it (e.g., rethrow immediately)
                        }
                        delay *= 2; // Exponential backoff
                    }
                }
                console.error(`All ${MAX_503_RETRIES} retries for 503 failed on key index ${apiKeyManager.a_currentIndex}. Trying next key...`);
            }

            // Handle quota errors (429) OR fall through from failed 503 retries
            if (error.toString().includes('429') || error.message?.includes('quota') || error.toString().includes('503')) {
                attempts++;
                apiKeyManager.rotateKey();
                if (apiKeyManager.a_currentIndex === initialIndex) {
                    throw new Error("Tất cả các API key đều đã hết hạn ngạch (quota) hoặc dịch vụ không khả dụng. Vui lòng thử lại sau hoặc thêm key mới.");
                }
            } else {
                throw error; // Not a recognized transient error, rethrow it immediately.
            }
        }
    }
    
    throw new Error("Tất cả các API key đều đã hết hạn ngạch (quota) hoặc dịch vụ không khả dụng sau khi thử lại.");
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
