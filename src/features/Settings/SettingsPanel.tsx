import React, { useState, useEffect, memo } from 'react';
import { DEFAULT_SETTINGS, AI_MODELS, IMAGE_AI_MODELS, RAG_EMBEDDING_MODELS, SAFETY_LEVELS, SAFETY_CATEGORIES, LAYOUT_MODES, GAME_SPEEDS, NARRATIVE_STYLES, FONT_OPTIONS, THEME_OPTIONS } from '../../constants';
import { generateBackgroundImage, reloadApiKeys } from '../../services/geminiService';
import type { GameSettings, AIModel, ImageModel, SafetyLevel, LayoutMode, GameSpeed, NarrativeStyle, Theme, RagEmbeddingModel } from '../../types';
import { FaArrowLeft, FaDesktop, FaRobot, FaShieldAlt, FaCog, FaGamepad, FaKey, FaCheckCircle, FaTimesCircle, FaExpand, FaBook, FaTrash, FaTerminal } from 'react-icons/fa';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as db from '../../services/dbService';
import { GoogleGenAI } from '@google/genai';

interface SettingsPanelProps {
  onBack: () => void;
  onSave: () => void;
  settings: GameSettings;
  onChange: (key: keyof GameSettings, value: any) => void;
}

type SettingsTab = 'interface' | 'ai_models' | 'safety' | 'gameplay' | 'api' | 'advanced';

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = memo(({ title, children }) => (
  <section className="mb-8">
    <h3 className="text-xl font-bold font-title mb-4 pb-2 border-b border-gray-600/50" style={{color: 'var(--text-muted-color)'}}>{title}</h3>
    <div className="space-y-4">{children}</div>
  </section>
));

const SettingsRow: React.FC<{ label: string; description: string; children: React.ReactNode }> = memo(({ label, description, children }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start py-2">
    <div className="md:col-span-1">
      <label className="block text-md font-semibold" style={{color: 'var(--text-color)'}}>{label}</label>
      <p className="text-sm" style={{color: 'var(--text-muted-color)'}}>{description}</p>
    </div>
    <div className="md:col-span-2">{children}</div>
  </div>
));

const TabButton: React.FC<{
  tabId: SettingsTab;
  activeTab: SettingsTab;
  onClick: (tab: SettingsTab) => void;
  icon: React.ElementType;
  label: string;
}> = memo(({ tabId, activeTab, onClick, icon: Icon, label }) => (
  <button
    onClick={() => onClick(tabId)}
    className={`flex-shrink-0 flex flex-col sm:flex-row items-center justify-center gap-2 p-3 text-sm font-bold rounded-lg transition-colors duration-200 whitespace-nowrap sm:flex-1 ${
      activeTab === tabId
        ? 'bg-[color:var(--primary-accent-color)]/20 text-[color:var(--primary-accent-color)]'
        : 'text-[color:var(--text-muted-color)] hover:bg-black/10'
    }`}
  >
    <Icon className="w-5 h-5 mb-1 sm:mb-0" />
    <span>{label}</span>
  </button>
));

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onBack, onSave, settings, onChange }) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('interface');
    const [bgPrompt, setBgPrompt] = useState('');
    const [isGeneratingBg, setIsGeneratingBg] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const handleGenerateBg = async () => {
        if (!bgPrompt) return;
        setIsGeneratingBg(true);
        try {
            const imageUrl = await generateBackgroundImage(bgPrompt);
            onChange('backgroundImage', imageUrl);
        } catch (error) {
            console.error("Failed to generate background image:", error);
            alert('Lỗi: Không thể tạo ảnh nền.');
        } finally {
            setIsGeneratingBg(false);
        }
    };
    
    const handleResetToDefault = async (section: string) => {
        if (window.confirm(`Bạn có chắc muốn đặt lại tất cả cài đặt trong mục "${section}" về mặc định không?`)) {
            let keysToReset: (keyof GameSettings)[] = [];
            switch (section) {
                case 'Giao Diện':
                    keysToReset = ['layoutMode', 'fontFamily', 'theme', 'backgroundImage', 'itemsPerPage', 'storyLogItemsPerPage'];
                    break;
                case 'AI & Models':
                    keysToReset = ['mainTaskModel', 'quickSupportModel', 'itemAnalysisModel', 'itemCraftingModel', 'soundSystemModel', 'actionAnalysisModel', 'gameMasterModel', 'npcSimulationModel', 'imageGenerationModel', 'enableThinking', 'thinkingBudget', 'temperature', 'topP', 'topK'];
                    break;
                case 'An Toàn':
                    keysToReset = ['masterSafetySwitch', 'safetyLevels'];
                    break;
                 case 'Lối Chơi':
                    keysToReset = ['gameSpeed', 'narrativeStyle', 'enablePerformanceMode', 'enableAiSoundSystem'];
                    break;
                 case 'Nâng Cao':
                    keysToReset = ['historyTokenLimit', 'summarizeBeforePruning', 'ragSummaryModel', 'ragSourceIdModel', 'ragEmbeddingModel', 'autoSummaryFrequency', 'ragTopK', 'enableDeveloperConsole'];
                    break;
            }
            keysToReset.forEach(key => onChange(key, DEFAULT_SETTINGS[key]));
            alert(`Đã đặt lại cài đặt ${section}.`);
        }
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                alert(`Lỗi khi vào chế độ toàn màn hình: ${err.message}`);
            });
            setIsFullScreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        }
    };
    
    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullScreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
    }, []);


    return (
        <div className="w-full animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold font-title">Cài Đặt</h2>
                <button 
                  onClick={onBack} 
                  className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                  title="Quay Lại Menu"
                >
                  <FaArrowLeft className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex items-stretch gap-1 p-1 bg-black/20 rounded-lg border border-gray-700/60 mb-8 overflow-x-auto">
                <TabButton tabId="interface" activeTab={activeTab} onClick={setActiveTab} icon={FaDesktop} label="Giao Diện" />
                <TabButton tabId="ai_models" activeTab={activeTab} onClick={setActiveTab} icon={FaRobot} label="AI & Models" />
                <TabButton tabId="safety" activeTab={activeTab} onClick={setActiveTab} icon={FaShieldAlt} label="An Toàn" />
                <TabButton tabId="gameplay" activeTab={activeTab} onClick={setActiveTab} icon={FaGamepad} label="Lối Chơi" />
                <TabButton tabId="api" activeTab={activeTab} onClick={setActiveTab} icon={FaKey} label="API Keys" />
                <TabButton tabId="advanced" activeTab={activeTab} onClick={setActiveTab} icon={FaCog} label="Nâng Cao" />
            </div>

            <div className="max-h-[calc(100vh-28rem)] overflow-y-auto pr-2">
                {activeTab === 'interface' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                        <SettingsSection title="Giao Diện Chung">
                            <SettingsRow label="Bố Cục" description="Ép bố cục cho máy tính hoặc di động, hoặc để tự động phát hiện.">
                                <div className="flex gap-2">
                                    {LAYOUT_MODES.map(mode => (
                                        <button key={mode.value} onClick={() => onChange('layoutMode', mode.value)} className={`px-4 py-2 text-sm rounded-md border transition-all duration-200 ${settings.layoutMode === mode.value ? 'bg-teal-500/20 border-teal-400 text-white' : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'}`}>
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </SettingsRow>
                            <SettingsRow label="Font Chữ" description="Chọn font chữ chính cho toàn bộ trò chơi.">
                                <select value={settings.fontFamily} onChange={(e) => onChange('fontFamily', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {FONT_OPTIONS.map(font => <option key={font.value} value={font.value}>{font.label}</option>)}
                                </select>
                            </SettingsRow>
                             <SettingsRow label="Chủ Đề (Theme)" description="Thay đổi bảng màu của giao diện người dùng.">
                                <select value={settings.theme} onChange={(e) => onChange('theme', e.target.value as Theme)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {THEME_OPTIONS.map(theme => <option key={theme.value} value={theme.value}>{theme.label}</option>)}
                                </select>
                            </SettingsRow>
                            <SettingsRow label="Vật phẩm mỗi trang" description="Số lượng vật phẩm hiển thị trên mỗi trang trong túi đồ.">
                                <input type="number" value={settings.itemsPerPage} onChange={(e) => onChange('itemsPerPage', parseInt(e.target.value) || 10)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" />
                            </SettingsRow>
                             <SettingsRow label="Độ dài câu chuyện" description="Điều chỉnh độ dài phản hồi của AI kể chuyện. Số mục càng cao, AI sẽ viết càng dài và chi tiết hơn, giống như một trang tiểu thuyết.">
                                <input type="number" min="5" max="100" value={settings.storyLogItemsPerPage} onChange={(e) => onChange('storyLogItemsPerPage', parseInt(e.target.value) || 20)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" />
                            </SettingsRow>
                            <SettingsRow label="Toàn màn hình" description="Bật chế độ toàn màn hình để có trải nghiệm tốt nhất.">
                               <button onClick={toggleFullScreen} className="flex items-center gap-2 px-4 py-2 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80 transition-colors">
                                    <FaExpand /> {isFullScreen ? "Thoát Toàn màn hình" : "Vào Toàn màn hình"}
                                </button>
                            </SettingsRow>
                            <button onClick={() => handleResetToDefault('Giao Diện')} className="text-sm text-gray-400 hover:text-red-400 transition-colors">Đặt lại cài đặt Giao Diện</button>
                        </SettingsSection>

                        <SettingsSection title="Ảnh Nền">
                            <SettingsRow label="Tạo Ảnh Nền Bằng AI" description="Mô tả ảnh nền bạn muốn, AI sẽ tạo ra nó. (Yêu cầu API Key có model tạo ảnh)">
                                <div className="flex gap-2">
                                    <input type="text" value={bgPrompt} onChange={e => setBgPrompt(e.target.value)} placeholder="Ví dụ: một thung lũng tiên cảnh trong sương sớm" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" />
                                    <button onClick={handleGenerateBg} disabled={isGeneratingBg} className="px-4 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 w-32 flex justify-center items-center">
                                        {isGeneratingBg ? <LoadingSpinner size="sm" /> : 'Tạo'}
                                    </button>
                                </div>
                            </SettingsRow>
                            <SettingsRow label="Xóa Nền" description="Xóa ảnh nền hiện tại để sử dụng màu nền của chủ đề.">
                                <button onClick={() => onChange('backgroundImage', '')} disabled={!settings.backgroundImage} className="px-4 py-2 bg-red-800/80 text-white font-bold rounded-lg hover:bg-red-700/80 disabled:bg-gray-600 disabled:cursor-not-allowed">
                                    <FaTrash className="inline-block mr-2" /> Xóa Nền
                                </button>
                            </SettingsRow>
                        </SettingsSection>
                    </div>
                )}
                 {activeTab === 'ai_models' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                        <SettingsSection title="Phân Vai Model AI (Nâng cao)">
                           <SettingsRow label="Model Chính" description="Model mạnh nhất, dùng cho các tác vụ chính như kể chuyện, tạo sự kiện.">
                                <select value={settings.mainTaskModel} onChange={(e) => onChange('mainTaskModel', e.target.value as AIModel)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                           <SettingsRow label="Model Game Master" description="Điều khiển cốt truyện, sự kiện và tạo mod bằng AI.">
                                <select value={settings.gameMasterModel} onChange={(e) => onChange('gameMasterModel', e.target.value as AIModel)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                           <SettingsRow label="Model Hỗ trợ Nhanh" description="Dùng cho các tác vụ nhỏ, phân tích nhanh (vd: phân tích hành động).">
                                <select value={settings.quickSupportModel} onChange={(e) => onChange('quickSupportModel', e.target.value as AIModel)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                            <SettingsRow label="Model Mô phỏng NPC" description="Điều khiển hành vi và sự phát triển của NPC trong thế giới.">
                                <select value={settings.npcSimulationModel} onChange={(e) => onChange('npcSimulationModel', e.target.value as AIModel)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                           <SettingsRow label="Model Tạo Ảnh" description="Model dùng để tạo ảnh đại diện và ảnh nền.">
                                <select value={settings.imageGenerationModel} onChange={(e) => onChange('imageGenerationModel', e.target.value as ImageModel)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {IMAGE_AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                        </SettingsSection>
                        <SettingsSection title="Tham Số AI">
                            <SettingsRow label="Thinking (Tư duy)" description="Cho phép các model 'flash' sử dụng một phần token để 'suy nghĩ' trước khi trả lời, giúp tăng chất lượng.">
                                <input type="checkbox" checked={settings.enableThinking} onChange={e => onChange('enableThinking', e.target.checked)} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500" />
                            </SettingsRow>
                             <SettingsRow label="Thinking Budget" description="Số lượng token tối đa mà AI được phép dùng để 'suy nghĩ'. Chỉ áp dụng khi Thinking được bật.">
                                <input type="number" value={settings.thinkingBudget} onChange={e => onChange('thinkingBudget', parseInt(e.target.value) || 0)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" />
                            </SettingsRow>
                            <SettingsRow label="Temperature" description="Kiểm soát độ 'sáng tạo' của AI. Giá trị cao hơn (ví dụ: 1.0) sẽ tạo ra các phản hồi đa dạng hơn, trong khi giá trị thấp hơn (ví dụ: 0.2) sẽ làm cho các phản hồi trở nên tập trung và xác định hơn.">
                                <div className="flex items-center gap-4">
                                    <input type="range" min="0" max="1" step="0.05" value={settings.temperature} onChange={e => onChange('temperature', parseFloat(e.target.value))} className="w-full" />
                                    <span className="font-mono text-lg">{settings.temperature.toFixed(2)}</span>
                                </div>
                            </SettingsRow>
                            <SettingsRow label="Top-K" description="Giới hạn việc lựa chọn token tiếp theo từ K token có xác suất cao nhất. Giá trị thấp hơn làm giảm sự ngẫu nhiên.">
                                <div className="flex items-center gap-4">
                                    <input type="range" min="1" max="100" step="1" value={settings.topK} onChange={e => onChange('topK', parseInt(e.target.value))} className="w-full" />
                                    <span className="font-mono text-lg w-12 text-center">{settings.topK}</span>
                                </div>
                            </SettingsRow>
                            <SettingsRow label="Top-P" description="Chọn token tiếp theo từ các token có tổng xác suất tích lũy là P. Giá trị thấp hơn làm giảm sự ngẫu nhiên.">
                                <div className="flex items-center gap-4">
                                    <input type="range" min="0" max="1" step="0.05" value={settings.topP} onChange={e => onChange('topP', parseFloat(e.target.value))} className="w-full" />
                                    <span className="font-mono text-lg">{settings.topP.toFixed(2)}</span>
                                </div>
                            </SettingsRow>
                            <button onClick={() => handleResetToDefault('AI & Models')} className="text-sm text-gray-400 hover:text-red-400 transition-colors">Đặt lại cài đặt AI & Models</button>
                        </SettingsSection>
                    </div>
                )}
                 {activeTab === 'safety' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                        <SettingsSection title="Cài Đặt An Toàn">
                             <SettingsRow label="Tắt Toàn Bộ Lọc An Toàn" description="Tắt tất cả các bộ lọc nội dung của Gemini. CẢNH BÁO: Điều này có thể tạo ra nội dung không mong muốn. Chỉ bật khi bạn hiểu rõ rủi ro.">
                                <input type="checkbox" checked={settings.masterSafetySwitch} onChange={e => onChange('masterSafetySwitch', e.target.checked)} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-red-500 focus:ring-red-500" />
                            </SettingsRow>
                            {SAFETY_CATEGORIES.map(category => (
                                <SettingsRow key={category.id} label={category.name} description={`Mức độ chặn cho nội dung ${category.name.toLowerCase()}.`}>
                                     <select
                                        value={settings.safetyLevels[category.id as keyof typeof settings.safetyLevels]}
                                        onChange={(e) => onChange('safetyLevels', { ...settings.safetyLevels, [category.id]: e.target.value as SafetyLevel })}
                                        className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2"
                                        disabled={settings.masterSafetySwitch}
                                    >
                                        {SAFETY_LEVELS.map(level => <option key={level.value} value={level.value}>{level.label}</option>)}
                                    </select>
                                </SettingsRow>
                            ))}
                            <button onClick={() => handleResetToDefault('An Toàn')} className="text-sm text-gray-400 hover:text-red-400 transition-colors">Đặt lại cài đặt An Toàn</button>
                        </SettingsSection>
                    </div>
                )}
                 {activeTab === 'gameplay' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                        <SettingsSection title="Lối Chơi">
                            <SettingsRow label="Tốc Độ Game" description="Điều chỉnh tốc độ trôi qua của thời gian trong game.">
                                 <select value={settings.gameSpeed} onChange={(e) => onChange('gameSpeed', e.target.value as GameSpeed)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {GAME_SPEEDS.map(speed => <option key={speed.value} value={speed.value}>{speed.label}</option>)}
                                </select>
                            </SettingsRow>
                             <SettingsRow label="Văn Phong Tường Thuật" description="Chọn phong cách viết của AI khi kể chuyện.">
                                <select value={settings.narrativeStyle} onChange={(e) => onChange('narrativeStyle', e.target.value as NarrativeStyle)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {NARRATIVE_STYLES.map(style => <option key={style.value} value={style.value}>{style.label}</option>)}
                                </select>
                            </SettingsRow>
                             <SettingsRow label="Hệ thống Âm thanh AI" description="Cho phép AI tự động tạo ra các hiệu ứng âm thanh và nhạc nền (tính năng thử nghiệm).">
                                <input type="checkbox" checked={settings.enableAiSoundSystem} onChange={e => onChange('enableAiSoundSystem', e.target.checked)} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500" />
                            </SettingsRow>
                            <SettingsRow label="Chế độ Hiệu Năng" description="Tắt một số hiệu ứng hình ảnh để tăng hiệu năng trên các thiết bị yếu.">
                                <input type="checkbox" checked={settings.enablePerformanceMode} onChange={e => onChange('enablePerformanceMode', e.target.checked)} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500" />
                            </SettingsRow>
                             <button onClick={() => handleResetToDefault('Lối Chơi')} className="text-sm text-gray-400 hover:text-red-400 transition-colors">Đặt lại cài đặt Lối Chơi</button>
                        </SettingsSection>
                    </div>
                )}
                {activeTab === 'api' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                         <ApiKeyManager settings={settings} onChange={onChange} />
                    </div>
                )}
                {activeTab === 'advanced' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                        <SettingsSection title="Quản lý Lịch sử Chat">
                            <SettingsRow label="Giới hạn Token Lịch sử" description="Số token tối đa giữ lại trong lịch sử chat để gửi cho AI. Giá trị cao hơn giúp AI nhớ ngữ cảnh tốt hơn nhưng tốn kém hơn.">
                                <input type="number" step="256" value={settings.historyTokenLimit} onChange={e => onChange('historyTokenLimit', parseInt(e.target.value) || 8192)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" />
                            </SettingsRow>
                            <SettingsRow label="Tóm tắt trước khi cắt" description="Khi lịch sử chat quá dài, AI sẽ tóm tắt phần cũ thay vì cắt bỏ hoàn toàn.">
                                <input type="checkbox" checked={settings.summarizeBeforePruning} onChange={e => onChange('summarizeBeforePruning', e.target.checked)} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500" />
                            </SettingsRow>
                        </SettingsSection>
                        <SettingsSection title="Hệ thống RAG (Truy xuất Tăng cường - Thử nghiệm)">
                            <SettingsRow label="Model Tóm tắt RAG" description="Model dùng để tóm tắt các nguồn tài liệu được truy xuất.">
                                <select value={settings.ragSummaryModel} onChange={(e) => onChange('ragSummaryModel', e.target.value as AIModel)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                            </SettingsRow>
                            <SettingsRow label="Model Embedding RAG" description="Model dùng để tạo vector cho các tài liệu và truy vấn.">
                                <select value={settings.ragEmbeddingModel} onChange={(e) => onChange('ragEmbeddingModel', e.target.value as RagEmbeddingModel)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {RAG_EMBEDDING_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                            </SettingsRow>
                             <SettingsRow label="Tần suất Tóm tắt Tự động" description="Số lượt tương tác trước khi AI tự động tóm tắt lịch sử (dùng cho RAG).">
                                <input type="number" value={settings.autoSummaryFrequency} onChange={e => onChange('autoSummaryFrequency', parseInt(e.target.value) || 5)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" />
                            </SettingsRow>
                            <SettingsRow label="RAG Top-K" description="Số lượng tài liệu liên quan nhất được truy xuất để cung cấp cho AI.">
                                <input type="number" value={settings.ragTopK} onChange={e => onChange('ragTopK', parseInt(e.target.value) || 5)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" />
                            </SettingsRow>
                             <button onClick={() => handleResetToDefault('Nâng Cao')} className="text-sm text-gray-400 hover:text-red-400 transition-colors">Đặt lại cài đặt Nâng cao</button>
                        </SettingsSection>
                        <SettingsSection title="Dữ Liệu Game & Gỡ Lỗi">
                            <SettingsRow label="Bảng Điều Khiển Gỡ Lỗi" description="Hiển thị console log trong game để gỡ lỗi và theo dõi trạng thái.">
                                <input 
                                    type="checkbox" 
                                    checked={settings.enableDeveloperConsole} 
                                    onChange={e => onChange('enableDeveloperConsole', e.target.checked)} 
                                    className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500" 
                                />
                            </SettingsRow>
                             <SettingsRow label="Xóa Toàn Bộ Dữ Liệu" description="CẢNH BÁO: Hành động này sẽ xóa tất cả các ô lưu, cài đặt và mod đã cài. Không thể hoàn tác.">
                                <button
                                    onClick={async () => {
                                        if (window.confirm("BẠN CÓ CHẮC CHẮN MUỐN XÓA TẤT CẢ DỮ LIỆU GAME KHÔNG? HÀNH ĐỘNG NÀY KHÔNG THỂ HOÀN TÁC.")) {
                                            try {
                                                await db.deleteDb();
                                                alert("Đã xóa toàn bộ dữ liệu. Trang sẽ được tải lại.");
                                                window.location.reload();
                                            } catch (error) {
                                                alert("Không thể xóa cơ sở dữ liệu. Vui lòng thử xóa thủ công trong cài đặt trình duyệt.");
                                                console.error("Failed to delete database:", error);
                                            }
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-800/80 text-white font-bold rounded-lg hover:bg-red-700/80"
                                >
                                    <FaTrash className="inline-block mr-2" /> Xóa Dữ Liệu
                                </button>
                            </SettingsRow>
                        </SettingsSection>
                    </div>
                )}
            </div>

            <div className="flex justify-end items-center gap-4 mt-8 border-t border-gray-700/50 pt-6">
                <button onClick={onBack} className="px-6 py-2 bg-gray-800/80 text-white font-bold rounded-lg hover:bg-gray-700/80 transition-colors">Hủy</button>
                <button onClick={onSave} className="px-6 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 transition-colors">Lưu Cài Đặt</button>
            </div>
        </div>
    );
};

const ApiKeyManager: React.FC<{ settings: GameSettings, onChange: (key: keyof GameSettings, value: any) => void }> = memo(({ settings, onChange }) => {
    const [keys, setKeys] = useState<string[]>(() =>
        settings.apiKeys && settings.apiKeys.length > 0 ? settings.apiKeys : ['']
    );
    const [keyTestResults, setKeyTestResults] = useState<{ key: string, status: 'valid' | 'invalid', error?: string }[]>([]);
    const [isTesting, setIsTesting] = useState(false);

    const handleKeyChange = (index: number, value: string) => {
        const newKeys = [...keys];
        newKeys[index] = value;
        setKeys(newKeys);
        onChange('apiKeys', newKeys);
        onChange('apiKey', newKeys[0] || '');
    };

    const addKeyField = () => {
        const newKeys = [...keys, ''];
        setKeys(newKeys);
        onChange('apiKeys', newKeys);
    };
    
    const removeKeyField = (index: number) => {
        const newKeys = keys.filter((_, i) => i !== index);
        setKeys(newKeys);
        onChange('apiKeys', newKeys);
        onChange('apiKey', newKeys[0] || '');
    };
    
    const handleTestKeys = async () => {
        setIsTesting(true);
        setKeyTestResults([]);
        
        const keysToTest = keys.filter(k => k && k.trim());
        if (keysToTest.length === 0) {
            setKeyTestResults([{ key: 'N/A', status: 'invalid', error: 'Không có key nào được cung cấp.' }]);
            setIsTesting(false);
            return;
        }

        const results = [];
        for (const key of keysToTest) {
            try {
                const testAi = new GoogleGenAI({ apiKey: key });
                await testAi.models.generateContent({ model: 'gemini-2.5-flash', contents: 'test' });
                results.push({ key: `...${key.slice(-4)}`, status: 'valid' as const });
            } catch (e: any) {
                results.push({ key: `...${key.slice(-4)}`, status: 'invalid' as const, error: e.message });
            }
        }
        setKeyTestResults(results);
        setIsTesting(false);
    };

    const keysToShow = settings.useKeyRotation ? keys : [keys[0] || ''];

    return (
        <SettingsSection title="Quản lý API Keys">
            <SettingsRow label="Chế độ xoay vòng Key" description="Tự động chuyển sang key tiếp theo nếu key hiện tại hết hạn mức hoặc gặp lỗi.">
                <input type="checkbox" checked={settings.useKeyRotation} onChange={e => onChange('useKeyRotation', e.target.checked)} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500" />
            </SettingsRow>
            <SettingsRow label={settings.useKeyRotation ? "Danh sách API Keys" : "Gemini API Key"} description={settings.useKeyRotation ? "Thêm nhiều key để xoay vòng." : "Nhập API key của bạn."}>
                <div className="space-y-3">
                    {keysToShow.map((key, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="password"
                                value={key}
                                onChange={e => handleKeyChange(index, e.target.value)}
                                placeholder={`API Key ${settings.useKeyRotation ? `#${index + 1}` : ''}`}
                                className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2"
                            />
                            {settings.useKeyRotation && keys.length > 1 && (
                                <button onClick={() => removeKeyField(index)} className="p-2 text-gray-400 hover:text-red-400">
                                    <FaTimesCircle />
                                </button>
                            )}
                        </div>
                    ))}
                    {settings.useKeyRotation && (
                         <button onClick={addKeyField} className="text-sm text-teal-400 hover:text-teal-300">Thêm Key</button>
                    )}
                </div>
            </SettingsRow>
             <SettingsRow label="Kiểm tra" description="Kiểm tra các key đã nhập có hợp lệ không. Các thay đổi sẽ được lưu khi bạn nhấn 'Lưu cài đặt'.">
                 <div className="flex flex-col gap-4">
                    <button onClick={handleTestKeys} disabled={isTesting} className="px-4 py-2 bg-blue-700/80 text-white font-bold rounded-lg hover:bg-blue-600/80 w-40 flex justify-center items-center">
                        {isTesting ? <LoadingSpinner size="sm" /> : 'Kiểm Tra'}
                    </button>
                 </div>
                 {keyTestResults.length > 0 && (
                     <div className="mt-4 space-y-2">
                         {keyTestResults.map((result, index) => (
                            <div key={index} className={`flex items-start gap-2 p-2 rounded-md text-sm ${result.status === 'valid' ? 'bg-green-500/10 text-green-300' : 'bg-red-500/10 text-red-300'}`}>
                                {result.status === 'valid' ? <FaCheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <FaTimesCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                                <div>
                                    <span className="font-bold">Key {index + 1} ({result.key}): {result.status === 'valid' ? 'Hợp lệ' : 'Không hợp lệ'}</span>
                                    {result.error && <p className="text-xs">{result.error}</p>}
                                </div>
                            </div>
                         ))}
                     </div>
                 )}
            </SettingsRow>
        </SettingsSection>
    );
});

export default memo(SettingsPanel);