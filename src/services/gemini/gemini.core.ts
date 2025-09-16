// Since we're no longer using the SDK on the client, these types are for reference.
// The actual JSON response from the proxy should match these shapes.
export declare type GenerateContentResponse = any;
export declare type GenerateImagesResponse = any;

const PROXY_URL = '/api/gemini-proxy';

async function postToProxy(type: string, params: any, isStream = false) {
    const response = await fetch(PROXY_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, params, isStream }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown proxy error' }));
        throw new Error(errorData.error || `Proxy request failed with status ${response.status}`);
    }
    
    return response;
}

export async function* generateWithRetryStream(generationRequest: any): AsyncIterable<any> {
    const response = await postToProxy('generateContentStream', generationRequest, true);
    
    if (!response.body) {
        throw new Error("Streaming response has no body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        buffer = lines.pop() || '';
        
        for (const line of lines) {
            if (line.trim()) {
                try {
                    yield JSON.parse(line);
                } catch (e) {
                    console.error("Failed to parse stream chunk:", line, e);
                }
            }
        }
    }

    if (buffer.trim()) {
        try {
            yield JSON.parse(buffer);
        } catch(e) {
            console.error("Failed to parse final stream chunk:", buffer, e);
        }
    }
}

export const generateWithRetry = async (generationRequest: any): Promise<GenerateContentResponse> => {
    const response = await postToProxy('generateContent', generationRequest);
    return response.json();
};

export const generateImagesWithRetry = async (generationRequest: any): Promise<GenerateImagesResponse> => {
    const response = await postToProxy('generateImages', generationRequest);
    return response.json();
};
