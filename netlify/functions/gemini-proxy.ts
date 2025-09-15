import { GoogleGenAI, GenerateContentResponse, GenerateImagesResponse, Modality } from "@google/genai";

// Cấu hình CORS - cho phép truy cập từ mọi nguồn
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Khởi tạo một lần duy nhất
let ai: GoogleGenAI;
if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
} else {
    console.error("Biến môi trường API_KEY chưa được thiết lập trên Netlify!");
}

async function handler(req: Request) {
    // Xử lý yêu cầu OPTIONS cho CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers, status: 204 });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Chỉ chấp nhận phương thức POST' }), {
            headers: { ...headers, 'Content-Type': 'application/json' },
            status: 405,
        });
    }

    if (!ai) {
        return new Response(JSON.stringify({ error: 'Lỗi cấu hình server: API Key chưa được thiết lập.' }), {
            headers: { ...headers, 'Content-Type': 'application/json' },
            status: 500,
        });
    }

    try {
        const body = await req.json();
        const { task, stream, ...generationRequest } = body;

        // Xử lý các tác vụ khác nhau
        switch (task) {
            case 'generateImages':
                const imageResponse: GenerateImagesResponse = await ai.models.generateImages(generationRequest);
                return new Response(JSON.stringify(imageResponse), {
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    status: 200
                });

            case 'generateContentStream':
                const streamResponse = await ai.models.generateContentStream(generationRequest);
                const readableStream = new ReadableStream({
                    async start(controller) {
                        const encoder = new TextEncoder();
                        for await (const chunk of streamResponse) {
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                        }
                        controller.close();
                    },
                });
                return new Response(readableStream, {
                    headers: {
                        ...headers,
                        'Content-Type': 'text/event-stream',
                        'Cache-Control': 'no-cache',
                        'Connection': 'keep-alive',
                    }
                });

            case 'generateContent':
            default:
                const response: GenerateContentResponse = await ai.models.generateContent(generationRequest);
                return new Response(JSON.stringify(response), {
                    headers: { ...headers, 'Content-Type': 'application/json' },
                    status: 200
                });
        }

    } catch (error: any) {
        console.error("Lỗi trong proxy function:", error);
        return new Response(JSON.stringify({ error: `Lỗi phía server: ${error.message}` }), {
            headers: { ...headers, 'Content-Type': 'application/json' },
            status: 500
        });
    }
}

export default handler;
