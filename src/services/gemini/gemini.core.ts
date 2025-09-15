import { GoogleGenAI, GenerateContentResponse, GenerateImagesResponse } from "@google/genai";

// Per Gemini guidelines, the API key is passed as a named parameter from process.env.
// The proxy and user-provided key logic are removed.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// The reloadSettings function is removed as it's no longer needed.

// Helper to handle API call errors - no longer needed as we're not using fetch for a proxy.
// The SDK will throw its own errors.

export async function* generateWithRetryStream(generationRequest: any): AsyncIterable<any> {
    // Directly use the initialized AI client.
    const streamResponse = await ai.models.generateContentStream(generationRequest);
    for await (const chunk of streamResponse) {
        yield chunk;
    }
}

export const generateWithRetry = async (generationRequest: any): Promise<GenerateContentResponse> => {
    // Directly use the initialized AI client.
    return ai.models.generateContent(generationRequest);
};

export const generateImagesWithRetry = async (generationRequest: any): Promise<GenerateImagesResponse> => {
    // Directly use the initialized AI client.
    return ai.models.generateImages(generationRequest);
};