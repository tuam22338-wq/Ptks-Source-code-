import type { CharacterIdentity } from '../../types';
import { generateImagesWithRetry } from './gemini.core';

export const generateCharacterAvatar = async (identity: CharacterIdentity): Promise<string> => {
    const prompt = `Tạo ảnh chân dung (portrait) cho một nhân vật trong game tu tiên.
    - **Ngoại hình:** ${identity.appearance}
    - **Giới tính:** ${identity.gender}
    - **Xuất thân:** ${identity.origin}
    - **Phong cách:** Tranh vẽ nghệ thuật, phong cách thủy mặc kết hợp fantasy, chi tiết, ánh sáng đẹp.
    - **Bối cảnh:** Nền đơn giản, tập trung vào nhân vật.
    - **Tỷ lệ:** Chân dung cận mặt hoặc bán thân.
    `;

    const response = await generateImagesWithRetry({
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const generateBackgroundImage = async (prompt: string): Promise<string> => {
    const fullPrompt = `${prompt}, beautiful fantasy landscape, digital painting, epic, cinematic lighting, wide angle, suitable for a game background.`;

    const response = await generateImagesWithRetry({
        prompt: fullPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

export const generateEventIllustration = async (prompt: string): Promise<string> => {
    const fullPrompt = `Epic moment, fantasy art painting, Chinese ink wash painting style (Shuǐmòhuà), cinematic lighting, detailed, beautiful. ${prompt}`;

    const response = await generateImagesWithRetry({
        prompt: fullPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
        },
    });

    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};