import type { CharacterIdentity } from '../../types';
import { generateImagesWithRetry } from './gemini.core';
import * as db from '../dbService';
import type { BackgroundSet } from '../../types';

export const generateCharacterAvatar = async (identity: CharacterIdentity): Promise<string> => {
    const prompt = `Tạo ảnh chân dung (portrait) cho một nhân vật trong game tu tiên.
    - **Ngoại hình:** ${identity.appearance}
    - **Giới tính:** ${identity.gender}
    - **Xuất thân:** ${identity.origin}
    - **Phong cách:** Tranh vẽ nghệ thuật, phong cách thủy mặc kết hợp fantasy, chi tiết, ánh sáng đẹp.
    - **Bối cảnh:** Nền đơn giản, tập trung vào nhân vật.
    - **Tỷ lệ:** Chân dung cận mặt hoặc bán thân.
    `;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.imageGenerationModel;
    const response = await generateImagesWithRetry({
        model: settings?.imageGenerationModel || 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        },
    }, specificApiKey);

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64ImageBytes) {
        throw new Error('Tạo ảnh thất bại: không nhận được dữ liệu ảnh từ API.');
    }
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};

const backgroundPrompts: Record<string, { base: string, l1: string, l2: string, l3: string, l4: string }> = {
    ink_wash: {
        base: 'chinese ink wash painting style, misty mountains, minimalist',
        l1: 'distant faded mountains and sky',
        l2: 'mid-ground mountain range with more detail',
        l3: 'closer hills with sparse, stylized pine trees',
        l4: 'foreground rocks and a single twisted pine tree branch',
    },
    sunset_peak: {
        base: 'sunset over fantasy mountains, vibrant orange and purple sky, digital painting',
        l1: 'glowing sun and distant clouds',
        l2: 'far mountain silhouette against the sunset',
        l3: 'closer, detailed mountain peaks with warm lighting',
        l4: 'foreground cliff edge with a few silhouetted trees',
    },
    mystic_violet: {
        base: 'mystical landscape with shades of violet and deep blue, glowing crystals, fantasy art',
        l1: 'starry night sky with a purple nebula',
        l2: 'distant, glowing purple mountain range',
        l3: 'mid-ground hills with floating, glowing crystals',
        l4: 'foreground of glowing flora and crystalline structures',
    },
    blood_moon: {
        base: 'dark fantasy landscape under a large blood moon, spooky, gnarled trees, gothic horror style',
        l1: 'large, detailed blood moon with ominous clouds',
        l2: 'silhouette of distant jagged mountains and dead trees',
        l3: 'a decaying, spooky forest in the mid-ground',
        l4: 'foreground with twisted roots and ancient tombstones',
    },
    jade_forest: {
        base: 'lush jade green bamboo forest, sunbeams filtering through, serene and mystical, chinese painting style',
        l1: 'dense canopy and distant, misty forest background',
        l2: 'mid-ground layer of dense bamboo stalks',
        l3: 'closer bamboo stalks and leaves with detailed light filtering through',
        l4: 'foreground with a stone path, fallen leaves, and a few bamboo shoots',
    }
};

const generateLayerImage = async (basePrompt: string, layerPrompt: string, layer: number): Promise<string> => {
    const fullPrompt = `${basePrompt}, ${layerPrompt}, layer ${layer} of 4 for a parallax background, wide angle, cinematic lighting.`;
    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.imageGenerationModel;
    const response = await generateImagesWithRetry({
        model: settings?.imageGenerationModel || 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
        },
    }, specificApiKey);

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64ImageBytes) {
        throw new Error(`Tạo ảnh lớp ${layer} thất bại.`);
    }
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};


export const generateAndCacheBackgroundSet = async (themeId: string): Promise<BackgroundSet> => {
    const cacheId = `bg_theme_${themeId}`;
    const cachedData = await db.getAsset(cacheId);
    if (cachedData) {
        console.log(`Loading background '${themeId}' from cache.`);
        return cachedData;
    }

    console.log(`Generating new background set for '${themeId}'...`);
    const prompts = backgroundPrompts[themeId];
    if (!prompts) throw new Error(`Không tìm thấy prompt cho chủ đề hình nền: ${themeId}`);

    const [layer1, layer2, layer3, layer4] = await Promise.all([
        generateLayerImage(prompts.base, prompts.l1, 1),
        generateLayerImage(prompts.base, prompts.l2, 2),
        generateLayerImage(prompts.base, prompts.l3, 3),
        generateLayerImage(prompts.base, prompts.l4, 4),
    ]);

    const backgroundSet: BackgroundSet = { layer1, layer2, layer3, layer4 };
    await db.saveAsset(cacheId, backgroundSet);
    console.log(`Saved new background set for '${themeId}' to cache.`);
    return backgroundSet;
};


export const generateEventIllustration = async (prompt: string): Promise<string> => {
    const fullPrompt = `Epic moment, fantasy art painting, Chinese ink wash painting style (Shuǐmòhuà), cinematic lighting, detailed, beautiful. ${prompt}`;

    const settings = await db.getSettings();
    const specificApiKey = settings?.modelApiKeyAssignments?.imageGenerationModel;
    const response = await generateImagesWithRetry({
        model: settings?.imageGenerationModel || 'imagen-4.0-generate-001',
        prompt: fullPrompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '16:9',
        },
    }, specificApiKey);

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64ImageBytes) {
        throw new Error('Tạo ảnh minh họa thất bại: không nhận được dữ liệu ảnh từ API.');
    }
    return `data:image/jpeg;base64,${base64ImageBytes}`;
};
