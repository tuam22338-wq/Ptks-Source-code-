import type { AIModel, NarrativeStyle } from './settings';

export interface NovelContentEntry {
    id: string;
    type: 'prompt' | 'ai_generation';
    content: string;
    timestamp: string;
}

export interface NovelAiSettings {
    model?: AIModel;
    narrativeStyle?: NarrativeStyle;
    wordCount?: number;
    temperature?: number;
    topK?: number;
    topP?: number;
    enableThinking?: boolean;
    thinkingBudget?: number;
}


export interface Novel {
    id: number; // Primary key in Dexie
    title: string;
    synopsis: string;
    content: NovelContentEntry[];
    lastModified: string;
    // New fields for enhanced AI memory and control
    lorebook: string;
    fanficMode: boolean;
    // Optional settings per novel
    aiSettings?: NovelAiSettings;
}
