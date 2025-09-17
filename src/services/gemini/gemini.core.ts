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

const executeApiCall = async <T>(apiFunction: (instance: GoogleGenAI) => Promise<T>): Promise<T> => {
    if (apiKeyManager.totalKeys === 0) {
        throw new Error("Không có API Key nào được cấu hình. Vui lòng thêm một key trong Cài đặt > AI & Models.");
    }

    // Get an initial key to try. Each concurrent call to executeApiCall will get a different key.
    const { index: initialIndex } = apiKeyManager.getNextInstanceAndRotate();

    if (initialIndex === -1) {
        throw new Error("Không thể khởi tạo AI instance. Vui lòng kiểm tra API keys.");
    }

    // Loop through all available keys, starting from the one we were assigned.
    for (let attempt = 0; attempt < apiKeyManager.totalKeys; attempt++) {
        const currentIndex = (initialIndex + attempt) % apiKeyManager.totalKeys;
        const currentInstance = apiKeyManager.getInstanceByIndex(currentIndex);
        
        if (!currentInstance) {
            continue; // Should not happen with the check above, but for safety.
        }

        try {
            // First retry layer: Handle transient 503 errors on the *same key* with exponential backoff.
            let delay = INITIAL_503_DELAY_MS;
            for (let retry503 = 0; retry503 < MAX_503_RETRIES; retry503++) {
                try {
                    const result = await apiFunction(currentInstance);
                    // SUCCESS! The request is complete.
                    return result;
                } catch (error: any) {
                    if (error.toString().includes('503') && retry503 < MAX_503_RETRIES - 1) {
                        const jitterDelay = delay + Math.random() * 500;
                        console.log(`Service unavailable (503) on key index ${currentIndex}. Retrying in ${Math.round(jitterDelay)}ms... (Attempt ${retry503 + 1}/${MAX_503_RETRIES})`);
                        await new Promise(res => setTimeout(res, jitterDelay));
                        delay *= 2;
                        continue; // Continue inner loop to retry on the same key
                    }
                    // Not a 503 error, or the last 503 retry failed. Throw to be caught by the outer catch block.
                    throw error;
                }
            }
        } catch (error: any) {
             // Second retry layer: Handle quota errors (429) or persistent 503s by trying the *next key*.
            console.warn(`API call failed with key index ${currentIndex}. Error:`, error.message);
            if (error.toString().includes('429') || error.message?.includes('quota') || error.toString().includes('503')) {
                // The outer loop will now proceed to the next key on the next iteration.
                continue;
            } else {
                // This is a different, non-retriable error (e.g., 400 Bad Request, 401 Unauthorized).
                // Throw it immediately to stop the process.
                throw error;
            }
        }
    }
    
    throw new Error("Tất cả các API key đều đã hết hạn ngạch (quota) hoặc dịch vụ không khả dụng sau khi thử lại trên toàn bộ key.");
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
