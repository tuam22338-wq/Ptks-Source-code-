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

    /**
     * Gets the next available API instance in a concurrent-safe, round-robin fashion.
     * It immediately rotates the index for the next call.
     * @returns The instance and its index in the pool.
     */
    public getNextInstanceAndRotate(): { instance: GoogleGenAI | null, index: number } {
        if (this.instances.length === 0) {
            return { instance: null, index: -1 };
        }
        // This is a critical section, but in JS single-threaded event loop, it's atomic enough.
        const index = this.currentIndex;
        const instance = this.instances[index];
        this.currentIndex = (this.currentIndex + 1) % this.instances.length;
        // End critical section
        return { instance, index };
    }

    /**
     * Gets a specific instance by its index. Used for retrying on different keys.
     * @param index The index of the instance to retrieve.
     * @returns The GoogleGenAI instance or null if the index is out of bounds.
     */
    public getInstanceByIndex(index: number): GoogleGenAI | null {
        if (index >= 0 && index < this.instances.length) {
            return this.instances[index];
        }
        return null;
    }

    get totalKeys(): number {
        return this.instances.length;
    }
}

export const apiKeyManager = new ApiKeyManager();

const MAX_503_RETRIES = 3;
const INITIAL_503_DELAY_MS = 1000;

const executeApiCallWithPool = async <T>(apiFunction: (instance: GoogleGenAI) => Promise<T>): Promise<T> => {
    if (apiKeyManager.totalKeys === 0) {
        throw new Error("Không có API Key nào được cấu hình. Vui lòng thêm một key trong Cài đặt > AI & Models.");
    }

    const { index: initialIndex } = apiKeyManager.getNextInstanceAndRotate();

    if (initialIndex === -1) {
        throw new Error("Không thể khởi tạo AI instance. Vui lòng kiểm tra API keys.");
    }

    for (let attempt = 0; attempt < apiKeyManager.totalKeys; attempt++) {
        const currentIndex = (initialIndex + attempt) % apiKeyManager.totalKeys;
        const currentInstance = apiKeyManager.getInstanceByIndex(currentIndex);
        
        if (!currentInstance) {
            continue;
        }

        try {
            let delay = INITIAL_503_DELAY_MS;
            for (let retry503 = 0; retry503 < MAX_503_RETRIES; retry503++) {
                try {
                    const result = await apiFunction(currentInstance);
                    return result;
                } catch (error: any) {
                    if (error.toString().includes('503') && retry503 < MAX_503_RETRIES - 1) {
                        const jitterDelay = delay + Math.random() * 500;
                        console.log(`Service unavailable (503) on key index ${currentIndex}. Retrying in ${Math.round(jitterDelay)}ms... (Attempt ${retry503 + 1}/${MAX_503_RETRIES})`);
                        await new Promise(res => setTimeout(res, jitterDelay));
                        delay *= 2;
                        continue;
                    }
                    throw error;
                }
            }
        } catch (error: any) {
             console.warn(`API call failed with key index ${currentIndex}. Error:`, error.message);
            if (error.toString().includes('429') || error.message?.includes('quota') || error.toString().includes('503')) {
                continue;
            } else {
                throw error;
            }
        }
    }
    
    throw new Error("Tất cả các API key đều đã hết hạn ngạch (quota) hoặc dịch vụ không khả dụng sau khi thử lại trên toàn bộ key.");
};

const executeApiCallWithSingleKey = async <T>(apiFunction: (instance: GoogleGenAI) => Promise<T>, apiKey: string): Promise<T> => {
    const instance = new GoogleGenAI({ apiKey });
    let delay = INITIAL_503_DELAY_MS;
    for (let retry503 = 0; retry503 < MAX_503_RETRIES; retry503++) {
        try {
            return await apiFunction(instance);
        } catch (error: any) {
            if (error.toString().includes('503') && retry503 < MAX_503_RETRIES - 1) {
                const jitterDelay = delay + Math.random() * 500;
                console.log(`Service unavailable (503) on specific key. Retrying in ${Math.round(jitterDelay)}ms... (Attempt ${retry503 + 1}/${MAX_503_RETRIES})`);
                await new Promise(res => setTimeout(res, jitterDelay));
                delay *= 2;
            } else {
                throw error;
            }
        }
    }
    throw new Error(`Dịch vụ không khả dụng (503) cho API key được chỉ định sau ${MAX_503_RETRIES} lần thử.`);
};

export const generateWithRetry = (generationRequest: any, specificApiKey?: string | null): Promise<GenerateContentResponse> => {
    const apiFunc = (instance: GoogleGenAI) => instance.models.generateContent(generationRequest);
    if (specificApiKey) {
        return executeApiCallWithSingleKey(apiFunc, specificApiKey);
    }
    return executeApiCallWithPool(apiFunc);
};

export const generateWithRetryStream = (generationRequest: any, specificApiKey?: string | null): Promise<AsyncIterable<GenerateContentResponse>> => {
    const apiFunc = (instance: GoogleGenAI) => instance.models.generateContentStream(generationRequest);
    if (specificApiKey) {
        return executeApiCallWithSingleKey(apiFunc, specificApiKey);
    }
    return executeApiCallWithPool(apiFunc);
};

export const generateImagesWithRetry = (generationRequest: any, specificApiKey?: string | null): Promise<GenerateImagesResponse> => {
    const apiFunc = (instance: GoogleGenAI) => instance.models.generateImages(generationRequest) as unknown as Promise<GenerateImagesResponse>;
    if (specificApiKey) {
        return executeApiCallWithSingleKey(apiFunc, specificApiKey);
    }
    return executeApiCallWithPool(apiFunc);
};