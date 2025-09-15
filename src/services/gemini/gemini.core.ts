import { GoogleGenAI, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";
import * as db from '../dbService';

const PROXY_URL = '/.netlify/functions/gemini-proxy';

let userAiClient: GoogleGenAI | null = null;

// This function needs to be called when settings change.
export const reloadSettings = async () => {
    const settings = await db.getSettings();
    if (settings?.apiKey) {
        try {
            // Per Gemini guidelines, the API key is passed as a named parameter.
            userAiClient = new GoogleGenAI({ apiKey: settings.apiKey });
            console.log("Sử dụng API Key của người dùng.");
        } catch (error) {
            console.error("Lỗi khởi tạo Gemini client với API key của người dùng:", error);
            userAiClient = null;
        }
    } else {
        userAiClient = null;
        console.log("Sử dụng proxy mặc định.");
    }
};

// Call it once on module load to initialize
reloadSettings();

// Helper to handle API call errors
const handleApiError = async (response: Response) => {
    const errorBody = await response.json().catch(() => ({ error: 'Phản hồi không hợp lệ từ server' }));
    console.error("Lỗi từ Proxy:", errorBody);
    throw new Error(errorBody.error || `Lỗi không xác định từ server (status: ${response.status})`);
};

export async function* generateWithRetryStream(generationRequest: any): AsyncIterable<any> {
    if (userAiClient) {
        const streamResponse = await userAiClient.models.generateContentStream(generationRequest);
        for await (const chunk of streamResponse) {
            yield chunk;
        }
    } else {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                task: 'generateContentStream',
                ...generationRequest
            }),
        });

        if (!response.ok || !response.body) {
            await handleApiError(response);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n\n').filter(line => line.startsWith('data: '));

                for (const line of lines) {
                    try {
                        const jsonString = line.substring('data: '.length);
                        const parsedChunk = JSON.parse(jsonString);
                        yield parsedChunk;
                    } catch (e) {
                        console.error("Lỗi khi phân tích một chunk stream:", e, line);
                    }
                }
            }
        } catch (error) {
            console.error("Lỗi khi đọc stream:", error);
            throw error;
        } finally {
            reader.releaseLock();
        }
    }
}

export const generateWithRetry = async (generationRequest: any): Promise<GenerateContentResponse> => {
    if (userAiClient) {
        return userAiClient.models.generateContent(generationRequest);
    }

    const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            task: 'generateContent',
            ...generationRequest
        }),
    });

    if (!response.ok) {
        await handleApiError(response);
    }
    
    return response.json();
};

export const generateImagesWithRetry = async (generationRequest: any): Promise<GenerateImagesResponse> => {
    if (userAiClient) {
        return userAiClient.models.generateImages(generationRequest);
    }
    
    const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            task: 'generateImages',
            ...generationRequest
        }),
    });

    if (!response.ok) {
        await handleApiError(response);
    }
    
    return response.json();
};