import type { ElementType } from 'react';

// Cài đặt dành riêng cho từng màn chơi, sẽ được lưu cùng save game.
export interface GameplaySettings {
    narrativeStyle: NarrativeStyle;
    aiResponseWordCount: number;
    aiCreativityLevel: AiCreativityLevel;
    narrativePacing: NarrativePacing;
    playerAgencyLevel: PlayerAgencyLevel;
    aiMemoryDepth: AiMemoryDepth;
    npcComplexity: NpcComplexity;
    worldEventFrequency: WorldEventFrequency;
    worldReactivity: WorldReactivity;
    cultivationRateMultiplier: number;
    resourceRateMultiplier: number;
    damageDealtMultiplier: number;
    damageTakenMultiplier: number;
    enableSurvivalMechanics: boolean;
    deathPenalty: DeathPenalty;
    validationServiceCap: ValidationServiceCap;
    narrateSystemChanges: boolean;
    worldInterruptionFrequency: WorldInterruptionFrequency;
}


// --- Settings Types ---
// Per Gemini guidelines, only 'gemini-2.5-flash' is permitted for general text tasks.
export type AIModel = 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.5-flash-lite' | 'gemini-2.5-flash-lite-preview-06-17' | 'gemini-2.5-flash-preview-05-20' | 'gemini-2.5-flash-preview-04-17';
export type ImageModel = 'imagen-4.0-generate-001';
export type RagEmbeddingModel = 'text-embedding-004';
export type LayoutMode = 'auto' | 'desktop' | 'mobile';
export type GameSpeed = 'very_slow' | 'slow' | 'normal' | 'fast' | 'very_fast';
export type SafetyLevel = 'HARM_BLOCK_THRESHOLD_UNSPECIFIED' | 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
export type NpcDensity = 'low' | 'medium' | 'high';
export type NarrativeStyle = 'classic_wuxia' | 'dark_fantasy' | 'poetic' | 'concise' | 'er_gen_style' | 'fenghuo_style' | 'cyberpunk' | 'noir_detective' | 'epic_fantasy' | 'lovecraftian_horror' | 'comedic' | 'slice_of_life';
// FIX: Add 'theme-ink-wash-bamboo' to the Theme type to resolve type errors across the application.
export type Theme = 'theme-bamboo-forest' | 'theme-sunrise-peak' | 'theme-bich-du-cung' | 'theme-ngoc-hu-cung' | 'theme-huyet-sat-ma-dien' | 'theme-thuy-mac-hoa' | 'theme-dao-ton-premium' | 'theme-cyber-cultivation-city' | 'theme-thon-phe-tinh-ha' | 'theme-ink-wash-bamboo';
export type AiSyncMode = 'classic' | 'intent_driven';
export type TtsProvider = 'browser' | 'elevenlabs';

// New Detailed Gameplay Settings Types
export type AiCreativityLevel = 'grounded' | 'balanced' | 'free';
export type NarrativePacing = 'slow' | 'medium' | 'fast';
export type PlayerAgencyLevel = 'max' | 'balanced' | 'full';
export type AiMemoryDepth = 'short' | 'balanced' | 'full';

export type NpcComplexity = 'basic' | 'advanced' | 'full_simulation';
export type WorldEventFrequency = 'rare' | 'occasional' | 'frequent' | 'chaotic';
export type WorldReactivity = 'passive' | 'dynamic' | 'living';

export type DeathPenalty = 'none' | 'resource_loss' | 'realm_loss' | 'permadeath';
export type ValidationServiceCap = 'strict' | 'relaxed' | 'disabled';
export type WorldInterruptionFrequency = 'none' | 'rare' | 'occasional' | 'frequent' | 'chaotic';


export interface SafetySettings {
    harassment: SafetyLevel;
    hateSpeech: SafetyLevel;
    sexuallyExplicit: SafetyLevel;
    dangerousContent: SafetyLevel;
}

export type AssignableModel = 
    | 'mainTaskModel' | 'quickSupportModel' | 'itemAnalysisModel' | 'itemCraftingModel' 
    | 'soundSystemModel' | 'actionAnalysisModel' | 'gameMasterModel' | 'npcSimulationModel' 
    | 'dataParsingModel' | 'imageGenerationModel' | 'ragSummaryModel' | 'ragSourceIdModel'
    | 'ragEmbeddingModel' | 'ragOrchestratorModel'
    | 'memorySynthesisModel'
    | 'narrativeHarmonizerModel'
    | 'novelistModel'
    | 'heuristicFixerModel'; // Add new model assignment

export interface HeuristicFixReport {
    id?: number;
    timestamp: string;
    problem: string;
    solution: string;
}

export interface GameSettings {
    layoutMode: LayoutMode;
    gameSpeed: GameSpeed;
    fontFamily: string;
    theme: Theme;
    dynamicBackground: string;
    zoomLevel: number;
    textColor: string;
    mainTaskModel: AIModel;
    quickSupportModel: AIModel;
    itemAnalysisModel: AIModel;
    itemCraftingModel: AIModel;
    soundSystemModel: AIModel;
    actionAnalysisModel: AIModel;
    gameMasterModel: AIModel;
    npcSimulationModel: AIModel;
    dataParsingModel: AIModel;
    imageGenerationModel: ImageModel;
    ragSummaryModel: AIModel;
    ragSourceIdModel: AIModel;
    ragEmbeddingModel: RagEmbeddingModel;
    ragOrchestratorModel: AIModel;
    memorySynthesisModel: AIModel;
    narrativeHarmonizerModel: AIModel;
    novelistModel: AIModel;
    heuristicFixerModel: AIModel; // Add new model
    novelistWordCount: number;
    novelistNarrativeStyle: NarrativeStyle;
    novelistTemperature: number;
    novelistTopK: number;
    novelistTopP: number;
    novelistEnableThinking: boolean;
    novelistThinkingBudget: number;
    gameMasterWordCount: number;
    enableGoogleGrounding: boolean;
    autoSummaryFrequency: number;
    ragTopK: number;
    ragChunkSize: number;
    ragChunkOverlap: number;
    historyTokenLimit: number;
    summarizeBeforePruning: boolean;
    itemsPerPage: number;
    enableAiSoundSystem: boolean;
    masterSafetySwitch: boolean;
    enableNsfwMode: boolean;
    safetyLevels: SafetySettings;
    enablePerformanceMode: boolean;
    temperature: number;
    topK: number;
    topP: number;
    enableThinking: boolean;
    thinkingBudget: number;
    apiKeys: string[];
    modelApiKeyAssignments: Partial<Record<AssignableModel, string>>;
    enableDeveloperConsole: boolean;
    enableTestingMode: boolean;
    enableHeuristicFixerAI: boolean; // Add new setting
    backgroundMusicUrl: string;
    backgroundMusicName: string;
    backgroundMusicVolume: number;
    enableTTS: boolean;
    ttsProvider: TtsProvider;
    elevenLabsApiKey: string;
    elevenLabsVoiceId: string;
    ttsVoiceURI: string;
    ttsRate: number;
    ttsPitch: number;
    ttsVolume: number;
    aiSyncMode: AiSyncMode;
    isPremium: boolean;
    enableAutomaticModelRotation: boolean;
}

export type SystemFeature = 'status' | 'quests' | 'store' | 'analysis';

export interface SystemInfo {
    unlockedFeatures: SystemFeature[];
}