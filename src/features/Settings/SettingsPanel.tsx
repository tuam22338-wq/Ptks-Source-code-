import React, { useState, useEffect, memo } from 'react';
import { DEFAULT_SETTINGS, AI_MODELS, IMAGE_AI_MODELS, RAG_EMBEDDING_MODELS, SAFETY_LEVELS, SAFETY_CATEGORIES, LAYOUT_MODES, GAME_SPEEDS, NARRATIVE_STYLES, FONT_OPTIONS, THEME_OPTIONS } from '../../constants';
import { generateBackgroundImage, testApiKey } from '../../services/geminiService';
import type { GameSettings, AIModel, ImageModel, SafetyLevel, LayoutMode, GameSpeed, NarrativeStyle, Theme, RagEmbeddingModel } from '../../types';
import { FaArrowLeft, FaDesktop, FaRobot, FaShieldAlt, FaCog, FaGamepad, FaKey, FaCheckCircle, FaTimesCircle, FaExpand, FaBook, FaTrash, FaTerminal } from 'react-icons/fa';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as db from '../../services/dbService';
import { useAppContext } from '../../contexts/AppContext';

type SettingsTab = 'interface' | 'ai_models' | 'safety' | 'gameplay' | 'advanced';

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

const SettingsPanel: React.FC = () => {
    const { settings, handleNavigate, handleSettingsSave, handleSettingChange } = useAppContext();
    const [activeTab, setActiveTab] = useState<SettingsTab>('interface');
    const [bgPrompt, setBgPrompt] = useState('');
    const [isGeneratingBg, setIsGeneratingBg] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isTestingKey, setIsTestingKey] = useState(false);
    const [keyStatus, setKeyStatus] = useState<{ status: 'valid' | 'invalid'; error?: string } | null>(null);

    const handleTestApiKey = async () => {
        setIsTestingKey(true);
        setKeyStatus(null);
        const result = await testApiKey(settings.apiKey);
        setKeyStatus(result);
        setIsTestingKey(false);
    };

    const handleGenerateBg = async () => {
        if (!bgPrompt) return;
        setIsGeneratingBg(true);
        try {
            const imageUrl = await generateBackgroundImage(bgPrompt);
            handleSettingChange('backgroundImage', imageUrl);
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
                    keysToReset = ['layoutMode', 'fontFamily', 'theme', 'backgroundImage', 'itemsPerPage', 'storyLogItemsPerPage', 'zoomLevel', 'textColor'];
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
                    keysToReset = ['apiKey', 'historyTokenLimit', 'summarizeBeforePruning', 'ragSummaryModel', 'ragSourceIdModel', 'ragEmbeddingModel', 'autoSummaryFrequency', 'ragTopK', 'enableDeveloperConsole'];
                    break;
            }
            keysToReset.forEach(key => handleSettingChange(key, DEFAULT_SETTINGS[key]));
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
                  onClick={() => handleNavigate('mainMenu')} 
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
                <TabButton tabId="advanced" activeTab={activeTab} onClick={setActiveTab} icon={FaCog} label="Nâng Cao" />
            </div>

            <div className="max-h-[calc(100vh-28rem)] overflow-y-auto pr-2">
                {activeTab === 'interface' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                        <SettingsSection title="Giao Diện Chung">
                            <SettingsRow label="Bố Cục" description="Ép bố cục cho máy tính hoặc di động, hoặc để tự động phát hiện.">
                                <div className="flex gap-2">
                                    {LAYOUT_MODES.map(mode => (
                                        <button key={mode.value} onClick={() => handleSettingChange('layoutMode', mode.value)} className={`px-4 py-2 text-sm rounded-md border transition-all duration-200 ${settings.layoutMode === mode.value ? 'bg-teal-500/20 border-teal-400 text-white' : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'}`}>
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </SettingsRow>
                            <SettingsRow label="Font Chữ" description="Chọn font chữ chính cho toàn bộ trò chơi.">
                                <select value={settings.fontFamily} onChange={(e) => handleSettingChange('fontFamily', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {FONT_OPTIONS.map(font => <option key={font.value} value={font.value}>{font.label}</option>)}
                                </select>
                            </SettingsRow>
                             <SettingsRow label="Chủ Đề (Theme)" description="Thay đổi bảng màu của giao diện người dùng.">
                                <select value={settings.theme} onChange={(e) => handleSettingChange('theme', e.target.value as Theme)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {THEME_OPTIONS.map(theme => <option key={theme.value} value={theme.value}>{theme.label}</option>)}
                                </select>
                            </SettingsRow>
                            <SettingsRow label="Màu Chữ Chính" description="Thay đổi màu sắc của văn bản chính trong game.">
                                <input 
                                    type="color" 
                                    value={settings.textColor} 
                                    onChange={(e) => handleSettingChange('textColor', e.target.value)}
                                    className="w-full h-10 p-1 bg-gray-800/50 border border-gray-600 rounded cursor-pointer"
                                />
                            </SettingsRow>
                            <SettingsRow label="Mức Thu Phóng Giao Diện" description="Thay đổi kích thước tổng thể của tất cả các thành phần giao diện.">
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="75"
                                        max="150"
                                        step="5"
                                        value={settings.zoomLevel}
                                        onChange={e => handleSettingChange('zoomLevel', parseInt(e.target.value))}
                                        className="w-full"
                                    />
                                    <span className="font-mono text-lg w-20 text-center">{settings.zoomLevel}%</span>
                                </div>
                            </SettingsRow>
                            <SettingsRow label="Vật phẩm mỗi trang" description="Số lượng vật phẩm hiển thị trên mỗi trang trong túi đồ.">
                                <input type="number" value={settings.itemsPerPage} onChange={(e) => handleSettingChange('itemsPerPage', parseInt(e.target.value) || 10)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" />
                            </SettingsRow>
                             <SettingsRow label="Độ dài phản hồi của AI" description="Điều chỉnh độ dài phản hồi của AI kể chuyện. Số mục càng cao, AI sẽ viết càng dài và chi tiết hơn, giống như một trang tiểu thuyết.">
                                <input type="number" min="5" max="100" value={settings.storyLogItemsPerPage} onChange={(e) => handleSettingChange('storyLogItemsPerPage', parseInt(e.target.value) || 20)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" />
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
                                <button onClick={() => handleSettingChange('backgroundImage', '')} disabled={!settings.backgroundImage} className="px-4 py-2 bg-red-800/80 text-white font-bold rounded-lg hover:bg-red-700/80 disabled:bg-gray-600 disabled:cursor-not-allowed">
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
                                <select value={settings.mainTaskModel} onChange={(e) => handleSettingChange('mainTaskModel', e.target.value as AIModel)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                           <SettingsRow label="Model Game Master" description="Điều khiển cốt truyện, sự kiện và tạo mod bằng AI.">
                                <select value={settings.gameMasterModel} onChange={(e) => handleSettingChange('gameMasterModel', e.target.value as AIModel)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                           <SettingsRow label="Model Hỗ trợ Nhanh" description="Dùng cho các tác vụ nhỏ, phân tích nhanh (vd: phân tích hành động).">
                                <select value={settings.quickSupportModel} onChange={(e) => handleSettingChange('quickSupportModel', e.target.value as AIModel)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                            <SettingsRow label="Model Mô phỏng NPC" description="Điều khiển hành vi và sự phát triển của NPC trong thế giới.">
                                <select value={settings.npcSimulationModel} onChange={(e) => handleSettingChange('npcSimulationModel', e.target.value as AIModel)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                           <SettingsRow label="Model Tạo Ảnh" description="Model dùng để tạo ảnh đại diện và ảnh nền.">
                                <select value={settings.imageGenerationModel} onChange={(e) => handleSettingChange('imageGenerationModel', e.target.value as ImageModel)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {IMAGE_AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                        </SettingsSection>
                        <SettingsSection title="Tham Số AI">
                            <SettingsRow label="Thinking (Tư duy)" description="Cho phép các model 'flash' sử dụng một phần token để 'suy nghĩ' trước khi trả lời, giúp tăng chất lượng.">
                                <input type="checkbox" checked={settings.enableThinking} onChange={e => handleSettingChange('enableThinking', e.target.checked)} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500" />
                            </SettingsRow>
                             <SettingsRow label="Thinking Budget" description="Số lượng token tối đa mà AI được phép dùng để 'suy nghĩ'. Chỉ áp dụng khi Thinking được bật.">
                                <input type="number" value={settings.thinkingBudget} onChange={e => handleSettingChange('thinkingBudget', parseInt(e.target.value) || 0)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" />
                            </SettingsRow>
                            <SettingsRow label="Temperature" description="Kiểm soát độ 'sáng tạo' của AI. Giá trị cao hơn (ví dụ: 1.0) sẽ tạo ra các phản hồi đa dạng hơn, trong khi giá trị thấp hơn (ví dụ: 0.2) sẽ làm cho các phản hồi trở nên tập trung và xác định hơn.">
                                <div className="flex items-center gap-4">
                                    <input type="range" min="0" max="1" step="0.05" value={settings.temperature} onChange={e => handleSettingChange('temperature', parseFloat(e.target.value))} className="w-full" />
                                    <span className="font-mono text-lg">{settings.temperature.toFixed(2)}</span>
                                </div>
                            </SettingsRow>
                            <SettingsRow label="Top-K" description="Giới hạn việc lựa chọn token tiếp theo từ K token có xác suất cao nhất. Giá trị thấp hơn làm giảm sự ngẫu nhiên.">
                                <div className="flex items-center gap-4">
                                    <input type="range" min="1" max="100" step="1" value={settings.topK} onChange={e => handleSettingChange('topK', parseInt(e.target.value))} className="w-full" />
                                    <span className="font-mono text-lg w-12 text-center">{settings.topK}</span>
                                </div>
                            </SettingsRow>
                            <SettingsRow label="Top-P" description="Chọn token tiếp theo từ các token có tổng xác suất tích lũy là P. Giá trị thấp hơn làm giảm sự ngẫu nhiên.">
                                <div className="flex items-center gap-4">
                                    <input type="range" min="0" max="1" step="0.05" value={settings.topP} onChange={e => handleSettingChange('topP', parseFloat(e.target.value))} className="w-full" />
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
                                <input type="checkbox" checked={settings.masterSafetySwitch} onChange={e => handleSettingChange('masterSafetySwitch', e.target.checked)} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-red-500 focus:ring-red-500" />
                            </SettingsRow>
                            {SAFETY_CATEGORIES.map(category => (
                                <SettingsRow key={category.id} label={category.name} description={`Mức độ chặn cho nội dung ${category.name.toLowerCase()}.`}>
                                     <select
                                        value={settings.safetyLevels[category.id as keyof typeof settings.safetyLevels]}
                                        onChange={(e) => handleSettingChange('safetyLevels', { ...settings.safetyLevels, [category.id]: e.target.value as SafetyLevel })}
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
                                 <select value={settings.gameSpeed} onChange={(e) => handleSettingChange('gameSpeed', e.target.value as GameSpeed)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {GAME_SPEEDS.map(speed => <option key={speed.value} value={speed.value}>{speed.label}</option>)}
                                </select>
                            </SettingsRow>
                             <SettingsRow label="Văn Phong Tường Thuật" description="Chọn phong cách viết của AI khi kể chuyện.">
                                <select value={settings.narrativeStyle} onChange={(e) => handleSettingChange('narrativeStyle', e.target.value as NarrativeStyle)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {NARRATIVE_STYLES.map(style => <option key={style.value} value={style.value}>{style.label}</option>)}
                                </select>
                            </SettingsRow>
                             <SettingsRow label="Hệ thống Âm thanh AI" description="Cho phép AI tự động tạo ra các hiệu ứng âm thanh và nhạc nền (tính năng thử nghiệm).">
                                <input type="checkbox" checked={settings.enableAiSoundSystem} onChange={e => handleSettingChange('enableAiSoundSystem', e.target.checked)} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500" />
                            </SettingsRow>
                            <SettingsRow label="Chế độ Hiệu Năng" description="Tắt một số hiệu ứng hình ảnh để tăng hiệu năng trên các thiết bị yếu.">
                                <input type="checkbox" checked={settings.enablePerformanceMode} onChange={e => handleSettingChange('enablePerformanceMode', e.target.checked)} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500" />
                            </SettingsRow>
                             <button onClick={() => handleResetToDefault('Lối Chơi')} className="text-sm text-gray-400 hover:text-red-400 transition-colors">Đặt lại cài đặt Lối Chơi</button>
                        </SettingsSection>
                    </div>
                )}
                {activeTab === 'advanced' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                        <SettingsSection title="API Key">
                             <SettingsRow label="Gemini API Key" description="Nhập API Key của bạn để sử dụng các tính năng AI. Key được lưu trữ cục bộ trên trình duyệt của bạn.">
                                 <div className="flex gap-2">
                                     <input
                                         type="password"
                                         autoComplete="off"
                                         value={settings.apiKey}
                                         onChange={(e) => {
                                             handleSettingChange('apiKey', e.target.value);
                                             setKeyStatus(null);
                                         }}
                                         className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2"
                                         placeholder="Dán API Key của bạn vào đây"
                                     />
                                     <button
                                         onClick={handleTestApiKey}
                                         disabled={isTestingKey || !settings.apiKey}
                                         className="px-4 py-2 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80 w-32 flex justify-center items-center disabled:bg-gray-600 disabled:cursor-not-allowed"
                                     >
                                         {isTestingKey ? <LoadingSpinner size="sm" /> : 'Kiểm Tra'}
                                     </button>
                                 </div>
                                 {keyStatus && (
                                     <div className={`mt-2 flex items-center gap-2 text-sm ${keyStatus.status === 'valid' ? 'text-green-400' : 'text-red-400'}`}>
                                         {keyStatus.status === 'valid' ? <FaCheckCircle /> : <FaTimesCircle />}
                                         <span>
                                             {keyStatus.status === 'valid'
                                                 ? 'API Key hợp lệ!'
                                                 : `Lỗi: ${keyStatus.error}`
                                             }
                                         </span>
                                     </div>
                                 )}
                             </SettingsRow>
                        </SettingsSection>
                        <SettingsSection title="Quản lý Lịch sử Chat">
                            <SettingsRow label="Giới hạn Token Lịch sử" description="Số token tối đa giữ lại trong lịch sử chat để gửi cho AI. Giá trị cao hơn giúp AI nhớ ngữ cảnh tốt hơn nhưng tốn kém hơn.">
                                <input type="number" step="256" value={settings.historyTokenLimit} onChange={e => handleSettingChange('historyTokenLimit', parseInt(e.target.value) || 8192)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" />
                            </SettingsRow>
                            <SettingsRow label="Tóm tắt trước khi cắt" description="Khi lịch sử chat quá dài, AI sẽ tóm tắt phần cũ thay vì cắt bỏ hoàn toàn.">
                                <input type="checkbox" checked={settings.summarizeBeforePruning} onChange={e => handleSettingChange('summarizeBeforePruning', e.target.checked)} className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500" />
                            </SettingsRow>
                        </SettingsSection>
                        <SettingsSection title="Hệ thống RAG (Truy xuất Tăng cường - Thử nghiệm)">
                            <SettingsRow label="Model Tóm tắt RAG" description="Model dùng để tóm tắt các nguồn tài liệu được truy xuất.">
                                <select value={settings.ragSummaryModel} onChange={(e) => handleSettingChange('ragSummaryModel', e.target.value as AIModel)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                            </SettingsRow>
                            <SettingsRow label="Model Embedding RAG" description="Model dùng để tạo vector cho các tài liệu và truy vấn.">
                                <select value={settings.ragEmbeddingModel} onChange={(e) => handleSettingChange('ragEmbeddingModel', e.target.value as RagEmbeddingModel)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                                    {RAG_EMBEDDING_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                            </SettingsRow>
                             <SettingsRow label="Tần suất Tóm tắt Tự động" description="Số lượt tương tác trước khi AI tự động tóm tắt lịch sử (dùng cho RAG).">
                                <input type="number" value={settings.autoSummaryFrequency} onChange={e => handleSettingChange('autoSummaryFrequency', parseInt(e.target.value) || 5)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" />
                            </SettingsRow>
                            <SettingsRow label="RAG Top-K" description="Số lượng tài liệu liên quan nhất được truy xuất để cung cấp cho AI.">
                                <input type="number" value={settings.ragTopK} onChange={e => handleSettingChange('ragTopK', parseInt(e.target.value) || 5)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" />
                            </SettingsRow>
                             <button onClick={() => handleResetToDefault('Nâng Cao')} className="text-sm text-gray-400 hover:text-red-400 transition-colors">Đặt lại cài đặt Nâng cao</button>
                        </SettingsSection>
                        <SettingsSection title="Dữ Liệu Game & Gỡ Lỗi">
                            <SettingsRow label="Bảng Điều Khiển Gỡ Lỗi" description="Hiển thị console log trong game để gỡ lỗi và theo dõi trạng thái.">
                                <input 
                                    type="checkbox" 
                                    checked={settings.enableDeveloperConsole} 
                                    onChange={e => handleSettingChange('enableDeveloperConsole', e.target.checked)} 
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
                <button onClick={() => handleNavigate('mainMenu')} className="px-6 py-2 bg-gray-800/80 text-white font-bold rounded-lg hover:bg-gray-700/80 transition-colors">Hủy</button>
                <button onClick={handleSettingsSave} className="px-6 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 transition-colors">Lưu Cài Đặt</button>
            </div>
        </div>
    );
};

export default memo(SettingsPanel);
