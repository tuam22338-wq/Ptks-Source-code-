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
    private modelRotationEnabled = true;

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

    public updateModelRotationSetting(isEnabled: boolean) {
        this.modelRotationEnabled = isEnabled;
    }

    public isModelRotationEnabled(): boolean {
        return this.modelRotationEnabled;
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
                } catch (error) {
                    if (String(error).includes('503') && retry503 < MAX_503_RETRIES - 1) {
                        const jitterDelay = delay + Math.random() * 500;
                        console.log(`Service unavailable (503) on key index ${currentIndex}. Retrying in ${Math.round(jitterDelay)}ms... (Attempt ${retry503 + 1}/${MAX_503_RETRIES})`);
                        await new Promise(res => setTimeout(res, jitterDelay));
                        delay *= 2;
                        continue;
                    }
                    throw error;
                }
            }
        } catch (error) {
             const message = error instanceof Error ? error.message : String(error);
             console.log({ type: 'AI_MONITOR', event: 'API_CALL', status: 'FAIL', keyIndex: currentIndex, reason: message });
             console.warn(`API call failed with key index ${currentIndex}. Error:`, message);
            if (String(error).includes('429') || message.includes('quota') || String(error).includes('503')) {
                 console.log({ type: 'AI_MONITOR', event: 'KEY_ROTATION', fromIndex: currentIndex, toIndex: (currentIndex + 1) % apiKeyManager.totalKeys, reason: 'Failure/Quota/503' });
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
        } catch (error) {
            if (String(error).includes('503') && retry503 < MAX_503_RETRIES - 1) {
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

const modelFallbackMap: Record<string, string | undefined> = {
    'gemini-2.5-flash': 'gemini-2.5-pro',
    'gemini-2.5-flash-lite': 'gemini-2.5-flash',
    'gemini-2.5-flash-lite-preview-06-17': 'gemini-2.5-flash',
    'gemini-2.5-flash-preview-05-20': 'gemini-2.5-flash',
    'gemini-2.5-flash-preview-04-17': 'gemini-2.5-flash',
};

const executeWithModelRotation = async <T>(
    baseRequest: any,
    createApiCall: (request: any) => (instance: GoogleGenAI) => Promise<T>,
    specificApiKey?: string | null
): Promise<T> => {
    let currentRequest = { ...baseRequest };
    let currentModel = currentRequest.model;

    while (currentModel) {
        console.log({ type: 'AI_MONITOR', event: 'API_CALL', status: 'INITIATED', model: currentModel });
        try {
            const apiFunc = createApiCall(currentRequest);
            let result: T;
            if (specificApiKey) {
                result = await executeApiCallWithSingleKey(apiFunc, specificApiKey);
            } else {
                result = await executeApiCallWithPool(apiFunc);
            }
            console.log({ type: 'AI_MONITOR', event: 'API_CALL', status: 'SUCCESS', model: currentModel });
            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            const isAllKeysFailedError = message.includes("Tất cả các API key đều đã hết hạn ngạch") || String(error).includes('503');
            const fallbackModel = apiKeyManager.isModelRotationEnabled() ? modelFallbackMap[currentModel] : undefined;

            if (isAllKeysFailedError && fallbackModel) {
                console.warn(`All keys failed for model '${currentModel}'. Rotating to fallback model '${fallbackModel}'.`);
                console.log({ type: 'AI_MONITOR', event: 'MODEL_FALLBACK', fromModel: currentModel, toModel: fallbackModel, reason: 'All keys failed' });
                currentModel = fallbackModel;
                currentRequest.model = fallbackModel;
                if (currentRequest.config?.thinkingConfig && (currentModel === 'gemini-2.5-pro')) {
                    console.log("Removing 'thinkingConfig' as it is not supported by gemini-2.5-pro.");
                    delete currentRequest.config.thinkingConfig;
                }
            } else {
                console.log({ type: 'AI_MONITOR', event: 'API_CALL', status: 'FAIL', model: currentModel, reason: message });
                throw error;
            }
        }
    }
    throw new Error("All models in the fallback chain failed.");
};


export const generateWithRetry = (generationRequest: any, specificApiKey?: string | null): Promise<GenerateContentResponse> => {
    const createApiCall = (request: any) => (instance: GoogleGenAI) => instance.models.generateContent(request);
    return executeWithModelRotation<GenerateContentResponse>(generationRequest, createApiCall, specificApiKey);
};

export const generateWithRetryStream = (generationRequest: any, specificApiKey?: string | null): Promise<AsyncIterable<GenerateContentResponse>> => {
    const createApiCall = (request: any) => (instance: GoogleGenAI) => instance.models.generateContentStream(request);
    return executeWithModelRotation<AsyncIterable<GenerateContentResponse>>(generationRequest, createApiCall, specificApiKey);
};

export const generateImagesWithRetry = (generationRequest: any, specificApiKey?: string | null): Promise<GenerateImagesResponse> => {
    const createApiCall = (request: any) => (instance: GoogleGenAI) => instance.models.generateImages(request) as unknown as Promise<GenerateImagesResponse>;
    return executeWithModelRotation<GenerateImagesResponse>(generationRequest, createApiCall, specificApiKey);
};