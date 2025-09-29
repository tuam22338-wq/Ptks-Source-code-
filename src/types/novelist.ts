export interface NovelContentEntry {
    id: string;
    type: 'prompt' | 'ai_generation';
    content: string;
    timestamp: string;
}

export interface Novel {
    id: number; // Primary key in Dexie
    title: string;
    synopsis: string;
    content: NovelContentEntry[];
    lastModified: string;
    // Optional settings per novel
    aiSettings?: {
        temperature?: number;
        narrativeStyle?: string;
    }
}
