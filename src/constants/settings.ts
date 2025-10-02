import type { GameSettings, AIModel, ImageModel, RagEmbeddingModel, SafetyLevel, LayoutMode, GameSpeed, NarrativeStyle, AiSyncMode, AiCreativityLevel, NarrativePacing, PlayerAgencyLevel, AiMemoryDepth, NpcComplexity, WorldEventFrequency, WorldReactivity, DeathPenalty, ValidationServiceCap, WorldInterruptionFrequency } from '../types';

export const AI_SYNC_MODES: { value: AiSyncMode; label: string, description: string }[] = [
    { value: 'classic', label: 'Cổ Điển', description: 'AI chỉ trả về văn bản, hệ thống sẽ phân tích để cập nhật trạng thái. Nhanh hơn, nhưng có thể thiếu chính xác.' },
    { value: 'intent_driven', label: 'Thiên Cơ', description: 'AI trả về cả văn bản và ý định cơ chế. Đảm bảo đồng bộ 100% nhưng có thể chậm hơn một chút. (Khuyến khích)' },
];

// New constants for detailed gameplay settings
export const AI_CREATIVITY_LEVELS: { value: AiCreativityLevel; label: string; description: string }[] = [
    { value: 'grounded', label: 'Bám Sát Hiện Thực', description: 'AI hạn chế sự kiện kỳ ảo, kết quả rất thực tế.' },
    { value: 'balanced', label: 'Cân Bằng', description: 'AI tạo kỳ ngộ, sự kiện bất ngờ nhưng vẫn logic.' },
    { value: 'free', label: 'Hoàn Toàn Tự Do', description: 'AI có thể tạo sự kiện phi thường, thậm chí vô lý để bất ngờ.' },
];
export const NARRATIVE_PACING_LEVELS: { value: NarrativePacing; label: string; description: string }[] = [
    { value: 'slow', label: 'Chậm rãi, Chi tiết', description: 'AI tập trung mô tả sâu về môi trường, nội tâm.' },
    { value: 'medium', label: 'Vừa phải', description: 'Cân bằng giữa mô tả và tiến triển câu chuyện.' },
    { value: 'fast', label: 'Nhanh, Tập trung vào Hành động', description: 'AI bỏ qua mô tả không cần thiết, đi thẳng vào kết quả.' },
];
export const PLAYER_AGENCY_LEVELS: { value: PlayerAgencyLevel; label: string; description: string }[] = [
    { value: 'max', label: 'Tối Đa', description: 'AI không bao giờ mô tả suy nghĩ hay hành động bạn không ra lệnh.' },
    { value: 'balanced', label: 'Cân Bằng', description: 'AI có thể mô tả phản ứng cảm xúc tự nhiên của bạn.' },
    { value: 'full', label: 'Tường Thuật Toàn Diện', description: 'AI có thể mô tả nội tâm và hành động nhỏ để câu chuyện liền mạch.' },
];
export const AI_MEMORY_DEPTH_LEVELS: { value: AiMemoryDepth; label: string; description: string }[] = [
    { value: 'short', label: 'Ngắn hạn', description: 'AI chủ yếu dựa vào 5-10 hành động gần nhất. (Hiệu suất cao)' },
    { value: 'balanced', label: 'Cân bằng', description: 'Kết hợp hành động gần đây và tóm tắt dài hạn.' },
    { value: 'full', label: 'Toàn cục', description: 'AI truy xuất toàn bộ lịch sử chơi. (Chất lượng cao nhất, có thể chậm)' },
];
export const NPC_COMPLEXITY_LEVELS: { value: NpcComplexity; label: string; description: string }[] = [
    { value: 'basic', label: 'Cơ bản', description: 'NPC chỉ có các hành vi đơn giản (di chuyển, đứng yên).' },
    { value: 'advanced', label: 'Nâng cao', description: 'NPC có mục tiêu và sẽ tự tạo kế hoạch để thực hiện.' },
    { value: 'full_simulation', label: 'Mô Phỏng Toàn Diện', description: 'NPC tự phát triển quan hệ, tạo nhiệm vụ, phe phái. (Tốn tài nguyên AI)' },
];
export const WORLD_EVENT_FREQUENCY_LEVELS: { value: WorldEventFrequency; label: string }[] = [
    { value: 'rare', label: 'Hiếm khi' },
    { value: 'occasional', label: 'Thỉnh thoảng' },
    { value: 'frequent', label: 'Thường xuyên' },
    { value: 'chaotic', label: 'Hỗn Loạn' },
];
export const WORLD_REACTIVITY_LEVELS: { value: WorldReactivity; label: string; description: string }[] = [
    { value: 'passive', label: 'Thụ động', description: 'Thế giới ít thay đổi, NPC chỉ phản ứng khi tương tác trực tiếp.' },
    { value: 'dynamic', label: 'Năng động', description: 'NPC bàn tán về bạn, danh tiếng ảnh hưởng đến thái độ, giá cả.' },
    { value: 'living', label: 'Sống', description: 'Hành động của bạn có thể gây hiệu ứng cánh bướm, thay đổi thế giới.' },
];
export const DEATH_PENALTY_LEVELS: { value: DeathPenalty; label: string; description: string }[] = [
    { value: 'none', label: 'Không có', description: 'Hồi sinh tại chỗ, phù hợp trải nghiệm cốt truyện.' },
    { value: 'resource_loss', label: 'Mất Tài nguyên', description: 'Mất một phần tiền và vật phẩm.' },
    { value: 'realm_loss', label: 'Suy Yếu Vĩnh Viễn', description: 'Nhân vật bị suy yếu vĩnh viễn sau khi hồi sinh, một số thuộc tính sẽ bị giảm.' },
    { value: 'permadeath', label: 'Xóa Vĩnh Viễn', description: 'File lưu sẽ bị xóa. Thử thách tối thượng.' },
];
export const VALIDATION_CAP_LEVELS: { value: ValidationServiceCap; label: string; description: string }[] = [
    { value: 'strict', label: 'Nghiêm ngặt', description: 'Giới hạn vật phẩm và chỉ số chặt chẽ theo cảnh giới.' },
    { value: 'relaxed', label: 'Nới lỏng', description: 'Cho phép nhận vật phẩm cao hơn 1-2 bậc so với cảnh giới.' },
    { value: 'disabled', label: 'Vô hiệu hóa', description: 'Tắt bộ lọc. Có thể nhận Thần khí từ cấp 1 (phá vỡ trải nghiệm).' },
];
export const WORLD_INTERRUPTION_LEVELS: { value: WorldInterruptionFrequency; label: string; description: string }[] = [
    { value: 'none', label: 'Tĩnh Lặng', description: 'Thế giới sẽ không bao giờ tự tạo ra sự kiện ngẫu nhiên để làm gián đoạn bạn.' },
    { value: 'rare', label: 'Hiếm Khi', description: 'Các sự kiện ngẫu nhiên xảy ra không thường xuyên, giữ cho câu chuyện tập trung vào bạn.' },
    { value: 'occasional', label: 'Thỉnh Thoảng (Mặc định)', description: 'Cân bằng giữa việc đi theo kế hoạch của bạn và những bất ngờ từ thế giới.' },
    { value: 'frequent', label: 'Thường Xuyên', description: 'Thế giới luôn biến động, kế hoạch của bạn thường xuyên bị thay đổi bởi các sự kiện bất ngờ.' },
    { value: 'chaotic', label: 'Hỗn Loạn', description: 'Hồng trần cuồn cuộn, nhân quả khó lường. Rất khó để làm theo kế hoạch.' },
];

export const DEFAULT_SETTINGS: GameSettings = {
    layoutMode: 'auto',
    gameSpeed: 'normal',
    fontFamily: "'Noto Serif', serif",
    // FIX: The type 'Theme' was missing 'theme-ink-wash-bamboo'. This is fixed in `src/types/settings.ts`, resolving the assignment error here.
    theme: 'theme-bich-du-cung',
    customThemeColors: {
        '--bg-color': '#2A3F3A',
        '--text-color': '#E0EFEA',
        '--text-muted-color': '#8AA39A',
        '--primary-accent-color': '#A0DEC4',
        '--primary-accent-text-color': '#1C2925',
        '--secondary-accent-color': '#82e9de',
        '--panel-border-color': '#38554F',
        '--input-focus-ring-color': '#A0DEC4',
        '--shadow-light': '#38554F',
        '--shadow-dark': '#1C2925',
    },
    dynamicBackground: 'mystic_violet',
    zoomLevel: 55,
    textColor: '#e0e0e0',
    mainTaskModel: 'gemini-2.5-flash',
    quickSupportModel: 'gemini-2.5-flash',
    itemAnalysisModel: 'gemini-2.5-flash',
    itemCraftingModel: 'gemini-2.5-flash',
    soundSystemModel: 'gemini-2.5-flash',
    actionAnalysisModel: 'gemini-2.5-flash',
    gameMasterModel: 'gemini-2.5-flash',
    npcSimulationModel: 'gemini-2.5-flash',
    dataParsingModel: 'gemini-2.5-flash',
    imageGenerationModel: 'imagen-4.0-generate-001',
    ragSummaryModel: 'gemini-2.5-flash',
    ragSourceIdModel: 'gemini-2.5-flash',
    ragEmbeddingModel: 'text-embedding-004',
    ragOrchestratorModel: 'gemini-2.5-flash',
    memorySynthesisModel: 'gemini-2.5-flash',
    narrativeHarmonizerModel: 'gemini-2.5-flash',
    novelistModel: 'gemini-2.5-flash',
    heuristicFixerModel: 'gemini-2.5-flash', // Add default model
    novelistWordCount: 3000,
    novelistNarrativeStyle: 'classic_wuxia',
    novelistTemperature: 1.0,
    novelistTopK: 40,
    novelistTopP: 0.95,
    novelistEnableThinking: true,
    novelistThinkingBudget: 500,
    gameMasterWordCount: 3000,
    enableGoogleGrounding: false,
    autoSummaryFrequency: 50,
    ragTopK: 5,
    ragChunkSize: 512,
    ragChunkOverlap: 50,
    historyTokenLimit: 8192,
    summarizeBeforePruning: true,
    itemsPerPage: 10,
    enableAiSoundSystem: false,
    masterSafetySwitch: true,
    enableNsfwMode: false,
    safetyLevels: {
        harassment: 'BLOCK_MEDIUM_AND_ABOVE',
        hateSpeech: 'BLOCK_MEDIUM_AND_ABOVE',
        sexuallyExplicit: 'BLOCK_MEDIUM_AND_ABOVE',
        dangerousContent: 'BLOCK_MEDIUM_AND_ABOVE',
    },
    enablePerformanceMode: false,
    temperature: 0.85,
    topK: 40,
    topP: 0.95,
    enableThinking: true,
    thinkingBudget: 250,
    apiKeys: [],
    modelApiKeyAssignments: {},
    enableDeveloperConsole: false,
    enableTestingMode: false,
    enableHeuristicFixerAI: false, // Add default value
    backgroundMusicUrl: 'https://files.catbox.moe/f86nal.mp3',
    backgroundMusicName: 'Nhạc Nền Mặc Định',
    backgroundMusicVolume: 0.5,
    enableTTS: false,
    ttsProvider: 'browser',
    elevenLabsApiKey: '',
    elevenLabsVoiceId: '',
    ttsVoiceURI: '',
    ttsRate: 1,
    ttsPitch: 1,
    ttsVolume: 1,
    aiSyncMode: 'intent_driven',
    isPremium: false,
    enableAutomaticModelRotation: true,
};

export const AI_MODELS: { value: AIModel; label: string }[] = [
    { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Premium)' },
    { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite' },
    { value: 'gemini-2.5-flash-lite-preview-06-17', label: 'Gemini 2.5 Flash Lite (Preview 06-17)' },
    { value: 'gemini-2.5-flash-preview-05-20', label: 'Gemini 2.5 Flash (Preview 05-20)' },
    { value: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash (Preview 04-17)' },
];
export const IMAGE_AI_MODELS: { value: ImageModel; label: string }[] = [
    { value: 'imagen-4.0-generate-001', label: 'Imagen 4.0 Generate' },
];
export const RAG_EMBEDDING_MODELS: { value: RagEmbeddingModel; label: string }[] = [
    { value: 'text-embedding-004', label: 'text-embedding-004' },
];
export const SAFETY_LEVELS: { value: SafetyLevel; label: string }[] = [
    { value: 'HARM_BLOCK_THRESHOLD_UNSPECIFIED', label: 'Không xác định' },
    { value: 'BLOCK_LOW_AND_ABOVE', label: 'Chặn Thấp và Cao hơn' },
    { value: 'BLOCK_MEDIUM_AND_ABOVE', label: 'Chặn Trung bình và Cao hơn' },
    { value: 'BLOCK_ONLY_HIGH', label: 'Chỉ chặn Mức cao' },
    { value: 'BLOCK_NONE', label: 'Không chặn' },
];

export const SAFETY_CATEGORIES = [
    { id: 'harassment', name: 'Quấy rối' },
    { id: 'hateSpeech', name: 'Ngôn từ kích động thù địch' },
    { id: 'sexuallyExplicit', name: 'Nội dung khiêu dâm' },
    { id: 'dangerousContent', name: 'Nội dung nguy hiểm' },
];