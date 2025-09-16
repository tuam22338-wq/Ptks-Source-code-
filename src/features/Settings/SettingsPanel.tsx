import React, { useState, useEffect, memo } from 'react';
import { DEFAULT_SETTINGS, AI_MODELS, IMAGE_AI_MODELS, RAG_EMBEDDING_MODELS, SAFETY_LEVELS, SAFETY_CATEGORIES, LAYOUT_MODES, GAME_SPEEDS, NARRATIVE_STYLES, FONT_OPTIONS } from '../../constants';
import { generateBackgroundImage } from '../../services/geminiService';
import type { GameSettings, AIModel, ImageModel, SafetyLevel, LayoutMode, GameSpeed, NarrativeStyle, RagEmbeddingModel } from '../../types';
import { FaArrowLeft, FaDesktop, FaRobot, FaShieldAlt, FaCog, FaGamepad, FaExpand, FaTrash, FaKey, FaPlus, FaExclamationTriangle } from 'react-icons/fa';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as db from '../../services/dbService';
import { useAppContext } from '../../contexts/AppContext';

type SettingsTab = 'interface' | 'ai_models' | 'safety' | 'gameplay' | 'advanced';

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = memo(({ title, children }) => (
  <section className="settings-section">
    <h3 className="settings-section-title">{title}</h3>
    <div className="space-y-6">{children}</div>
  </section>
));

const SettingsRow: React.FC<{ label: string; description: string; children: React.ReactNode }> = memo(({ label, description, children }) => (
  <div className="settings-row">
    <div className="settings-row-label">
      <label>{label}</label>
      <p>{description}</p>
    </div>
    <div className="settings-row-control">{children}</div>
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
    className={`settings-tab-button ${activeTab === tabId ? 'active' : ''}`}
  >
    <Icon className="icon" />
    <span className="label">{label}</span>
  </button>
));

const SettingsPanel: React.FC = () => {
    const { settings, handleNavigate, handleSettingsSave, handleSettingChange } = useAppContext();
    const [activeTab, setActiveTab] = useState<SettingsTab>('interface');
    const [bgPrompt, setBgPrompt] = useState('');
    const [isGeneratingBg, setIsGeneratingBg] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [newApiKey, setNewApiKey] = useState('');
    
    const handleGenerateBg = async () => {
        if (!bgPrompt) return;
        setIsGeneratingBg(true);
        try {
            const imageUrl = await generateBackgroundImage(bgPrompt);
            handleSettingChange('backgroundImage', imageUrl);
        } catch (error) {
            console.error("Failed to generate background image:", error);
            alert('Lỗi: Không thể tạo ảnh nền. Vui lòng kiểm tra API Key và model tạo ảnh trong cài đặt.');
        } finally {
            setIsGeneratingBg(false);
        }
    };
    
    const handleResetToDefault = async (section: string) => {
        if (window.confirm(`Bạn có chắc muốn đặt lại tất cả cài đặt trong mục "${section}" về mặc định không?`)) {
            let keysToReset: (keyof GameSettings)[] = [];
            switch (section) {
                case 'Giao Diện':
                    keysToReset = ['layoutMode', 'fontFamily', 'theme', 'backgroundImage', 'itemsPerPage', 'aiResponseWordCount', 'zoomLevel', 'textColor'];
                    break;
                case 'AI & Models':
                    keysToReset = ['mainTaskModel', 'quickSupportModel', 'dataParsingModel', 'itemAnalysisModel', 'itemCraftingModel', 'soundSystemModel', 'actionAnalysisModel', 'gameMasterModel', 'npcSimulationModel', 'imageGenerationModel', 'enableThinking', 'thinkingBudget', 'temperature', 'topP', 'topK', 'apiKeys'];
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

    const handleAddApiKey = () => {
        const key = newApiKey.trim();
        if (!key) return;
        if (settings.apiKeys.includes(key)) {
            alert("API key này đã tồn tại.");
            return;
        }
        handleSettingChange('apiKeys', [...settings.apiKeys, key]);
        setNewApiKey('');
    };

    const handleRemoveApiKey = (keyToRemove: string) => {
        handleSettingChange('apiKeys', settings.apiKeys.filter(k => k !== keyToRemove));
    };

    const maskApiKey = (key: string) => {
        if (key.length < 8) return '***';
        return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
    };

    return (
        <div className="w-full animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8 settings-panel-container">
            <div className="settings-header">
                <h2 className="settings-main-title">Cài Đặt</h2>
                <button 
                  onClick={() => handleNavigate('mainMenu')} 
                  className="settings-back-button"
                  title="Quay Lại Menu"
                >
                  <FaArrowLeft className="w-5 h-5" />
                </button>
            </div>
            
            <nav className="settings-tab-nav">
                <TabButton tabId="interface" activeTab={activeTab} onClick={setActiveTab} icon={FaDesktop} label="Giao Diện" />
                <TabButton tabId="ai_models" activeTab={activeTab} onClick={setActiveTab} icon={FaRobot} label="AI & Models" />
                <TabButton tabId="safety" activeTab={activeTab} onClick={setActiveTab} icon={FaShieldAlt} label="An Toàn" />
                <TabButton tabId="gameplay" activeTab={activeTab} onClick={setActiveTab} icon={FaGamepad} label="Lối Chơi" />
                <TabButton tabId="advanced" activeTab={activeTab} onClick={setActiveTab} icon={FaCog} label="Nâng Cao" />
            </nav>

            <div className="settings-content">
                {activeTab === 'interface' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                        <SettingsSection title="Giao Diện Chung">
                            <SettingsRow label="Bố Cục" description="Ép bố cục cho máy tính hoặc di động, hoặc để tự động phát hiện.">
                                <div className="themed-button-group">
                                    {LAYOUT_MODES.map(mode => (
                                        <button key={mode.value} onClick={() => handleSettingChange('layoutMode', mode.value)} className={settings.layoutMode === mode.value ? 'active' : ''}>
                                            {mode.label}
                                        </button>
                                    ))}
                                </div>
                            </SettingsRow>
                            <SettingsRow label="Font Chữ" description="Chọn font chữ chính cho toàn bộ trò chơi.">
                                <select value={settings.fontFamily} onChange={(e) => handleSettingChange('fontFamily', e.target.value)} className="themed-select">
                                    {FONT_OPTIONS.map(font => <option key={font.value} value={font.value}>{font.label}</option>)}
                                </select>
                            </SettingsRow>
                            <SettingsRow label="Màu Chữ Chính" description="Thay đổi màu sắc của văn bản chính trong game.">
                                <input 
                                    type="color" 
                                    value={settings.textColor} 
                                    onChange={(e) => handleSettingChange('textColor', e.target.value)}
                                    className="themed-color-input"
                                />
                            </SettingsRow>
                            <SettingsRow label="Mức Thu Phóng Giao Diện" description="Thay đổi kích thước tổng thể của tất cả các thành phần giao diện.">
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="50"
                                        max="200"
                                        step="5"
                                        value={settings.zoomLevel}
                                        onChange={e => handleSettingChange('zoomLevel', parseInt(e.target.value))}
                                        className="themed-slider"
                                    />
                                    <span className="themed-slider-value">{settings.zoomLevel}%</span>
                                </div>
                            </SettingsRow>
                            <SettingsRow label="Vật phẩm mỗi trang" description="Số lượng vật phẩm hiển thị trên mỗi trang trong túi đồ.">
                                <input type="number" value={settings.itemsPerPage} onChange={(e) => handleSettingChange('itemsPerPage', parseInt(e.target.value) || 10)} className="themed-input" />
                            </SettingsRow>
                             <SettingsRow label="Độ dài Phản hồi AI (Số từ)" description="Điều chỉnh số từ mục tiêu cho mỗi phản hồi của AI kể chuyện. Mặc định: 2000 từ.">
                                <input type="number" min="100" max="5000" step="100" value={settings.aiResponseWordCount} onChange={(e) => handleSettingChange('aiResponseWordCount', parseInt(e.target.value) || 2000)} className="themed-input" />
                            </SettingsRow>
                            <SettingsRow label="Toàn màn hình" description="Bật chế độ toàn màn hình để có trải nghiệm tốt nhất.">
                               <button onClick={toggleFullScreen} className="settings-button flex items-center gap-2">
                                    <FaExpand /> {isFullScreen ? "Thoát Toàn màn hình" : "Vào Toàn màn hình"}
                                </button>
                            </SettingsRow>
                            <button onClick={() => handleResetToDefault('Giao Diện')} className="text-sm text-gray-400 hover:text-red-400 transition-colors">Đặt lại cài đặt Giao Diện</button>
                        </SettingsSection>

                        <SettingsSection title="Ảnh Nền">
                            <SettingsRow label="Tạo Ảnh Nền Bằng AI" description="Mô tả ảnh nền bạn muốn, AI sẽ tạo ra nó. (Yêu cầu API Key có model tạo ảnh)">
                                <div className="flex gap-2">
                                    <input type="text" value={bgPrompt} onChange={e => setBgPrompt(e.target.value)} placeholder="Ví dụ: một thung lũng tiên cảnh trong sương sớm" className="themed-input" />
                                    <button onClick={handleGenerateBg} disabled={isGeneratingBg} className="settings-button-primary w-32 flex justify-center items-center">
                                        {isGeneratingBg ? <LoadingSpinner size="sm" /> : 'Tạo'}
                                    </button>
                                </div>
                            </SettingsRow>
                            <SettingsRow label="Xóa Nền" description="Xóa ảnh nền hiện tại để sử dụng màu nền của chủ đề.">
                                <button onClick={() => handleSettingChange('backgroundImage', '')} disabled={!settings.backgroundImage} className="settings-button-danger flex items-center gap-2">
                                    <FaTrash /> Xóa Nền
                                </button>
                            </SettingsRow>
                        </SettingsSection>
                    </div>
                )}
                 {activeTab === 'ai_models' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                        <SettingsSection title="Quản lý API Key">
                            <div className="p-4 bg-yellow-900/20 border-l-4 border-yellow-500 rounded-r-lg text-yellow-200">
                                <div className="flex items-center gap-2 font-bold"><FaExclamationTriangle /> Ghi Chú Quan Trọng</div>
                                <p className="text-sm mt-1">
                                    Game sẽ tự động xoay vòng các API key khi một key gặp lỗi hết hạn ngạch (quota). Để có trải nghiệm mượt mà nhất, bạn nên cung cấp ít nhất 3 API key.
                                </p>
                            </div>
                            <SettingsRow label="Thêm API Key Mới" description="Dán API key của bạn vào đây. Key sẽ được lưu trữ cục bộ trên trình duyệt của bạn.">
                                <div className="flex gap-2">
                                    <input type="password" value={newApiKey} onChange={e => setNewApiKey(e.target.value)} placeholder="Dán API key của bạn ở đây" className="themed-input" />
                                    <button onClick={handleAddApiKey} className="settings-button-primary flex items-center gap-2"><FaPlus/> Thêm</button>
                                </div>
                            </SettingsRow>
                             <SettingsRow label="Các Key Hiện Tại" description="Danh sách các API key đã được thêm.">
                                <div className="space-y-2">
                                    {(settings.apiKeys || []).length > 0 ? (settings.apiKeys.map(key => (
                                        <div key={key} className="flex justify-between items-center p-2 bg-black/20 rounded-md">
                                            <span className="font-mono text-gray-400 flex items-center gap-2"><FaKey/> {maskApiKey(key)}</span>
                                            <button onClick={() => handleRemoveApiKey(key)} className="p-2 text-gray-500 hover:text-red-400 transition-colors" title="Xóa Key"><FaTrash/></button>
                                        </div>
                                    ))) : (
                                        <div className="p-3 text-center bg-red-900/30 border border-red-600/50 rounded-lg text-red-300">
                                            Chưa có API key nào được thêm. Game sẽ không hoạt động nếu không có key.
                                        </div>
                                    )}
                                </div>
                            </SettingsRow>
                        </SettingsSection>

                        <SettingsSection title="Phân Vai Model AI (Nâng cao)">
                           <SettingsRow label="Model Chính" description="Model mạnh nhất, dùng cho các tác vụ chính như kể chuyện, tạo sự kiện.">
                                <select value={settings.mainTaskModel} onChange={(e) => handleSettingChange('mainTaskModel', e.target.value as AIModel)} className="themed-select">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                           <SettingsRow label="Model Game Master" description="Điều khiển cốt truyện, sự kiện và tạo mod bằng AI.">
                                <select value={settings.gameMasterModel} onChange={(e) => handleSettingChange('gameMasterModel', e.target.value as AIModel)} className="themed-select">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                           <SettingsRow label="Model Phân tích Dữ liệu (AI Trung gian)" description="Model dùng để phân tích nhanh kết quả từ AI kể chuyện, trích xuất vật phẩm, nhiệm vụ, etc.">
                                <select value={settings.dataParsingModel} onChange={(e) => handleSettingChange('dataParsingModel', e.target.value as AIModel)} className="themed-select">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                           <SettingsRow label="Model Hỗ trợ Nhanh" description="Dùng cho các tác vụ nhỏ, phân tích nhanh (vd: phân tích hành động).">
                                <select value={settings.quickSupportModel} onChange={(e) => handleSettingChange('quickSupportModel', e.target.value as AIModel)} className="themed-select">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                            <SettingsRow label="Model Mô phỏng NPC" description="Điều khiển hành vi và sự phát triển của NPC trong thế giới.">
                                <select value={settings.npcSimulationModel} onChange={(e) => handleSettingChange('npcSimulationModel', e.target.value as AIModel)} className="themed-select">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                           <SettingsRow label="Model Tạo Ảnh" description="Model dùng để tạo ảnh đại diện và ảnh nền.">
                                <select value={settings.imageGenerationModel} onChange={(e) => handleSettingChange('imageGenerationModel', e.target.value as ImageModel)} className="themed-select">
                                    {IMAGE_AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                            <SettingsRow label="Model Phân tích Vật phẩm" description="Chuyên dùng để phân tích mô tả và tạo ra chỉ số, thuộc tính cho vật phẩm.">
                                <select value={settings.itemAnalysisModel} onChange={(e) => handleSettingChange('itemAnalysisModel', e.target.value as AIModel)} className="themed-select">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                            <SettingsRow label="Model Phân tích Hành động" description="Phân tích hành động của người chơi và NPC để quyết định kết quả (vd: chiến đấu).">
                                <select value={settings.actionAnalysisModel} onChange={(e) => handleSettingChange('actionAnalysisModel', e.target.value as AIModel)} className="themed-select">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                            <SettingsRow label="Model Chế tạo Vật phẩm" description="Sử dụng khi người chơi chế tạo vật phẩm, quyết định sự thành công và phẩm chất.">
                                <select value={settings.itemCraftingModel} onChange={(e) => handleSettingChange('itemCraftingModel', e.target.value as AIModel)} className="themed-select">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                            <SettingsRow label="Model Hệ thống Âm thanh" description="Dùng để tạo ra các mô tả âm thanh và nhạc nền khi hệ thống âm thanh AI được bật.">
                                <select value={settings.soundSystemModel} onChange={(e) => handleSettingChange('soundSystemModel', e.target.value as AIModel)} className="themed-select">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                           </SettingsRow>
                        </SettingsSection>
                        <SettingsSection title="Tham Số AI">
                            <SettingsRow label="Thinking (Tư duy)" description="Cho phép các model 'flash' sử dụng một phần token để 'suy nghĩ' trước khi trả lời, giúp tăng chất lượng.">
                                <input type="checkbox" checked={settings.enableThinking} onChange={e => handleSettingChange('enableThinking', e.target.checked)} className="themed-checkbox" />
                            </SettingsRow>
                             <SettingsRow label="Thinking Budget" description="Số lượng token tối đa mà AI được phép dùng để 'suy nghĩ'. Chỉ áp dụng khi Thinking được bật.">
                                <input type="number" value={settings.thinkingBudget} onChange={e => handleSettingChange('thinkingBudget', parseInt(e.target.value) || 0)} className="themed-input" />
                            </SettingsRow>
                            <SettingsRow label="Temperature" description="Kiểm soát độ 'sáng tạo' của AI. Cao hơn = đa dạng hơn, thấp hơn = tập trung hơn.">
                                <div className="flex items-center gap-4">
                                    <input type="range" min="0" max="1" step="0.05" value={settings.temperature} onChange={e => handleSettingChange('temperature', parseFloat(e.target.value))} className="themed-slider" />
                                    <span className="themed-slider-value">{settings.temperature.toFixed(2)}</span>
                                </div>
                            </SettingsRow>
                            <SettingsRow label="Top-K" description="Giới hạn việc lựa chọn token tiếp theo từ K token có xác suất cao nhất.">
                                <div className="flex items-center gap-4">
                                    <input type="range" min="1" max="100" step="1" value={settings.topK} onChange={e => handleSettingChange('topK', parseInt(e.target.value))} className="themed-slider" />
                                    <span className="themed-slider-value">{settings.topK}</span>
                                </div>
                            </SettingsRow>
                            <SettingsRow label="Top-P" description="Chọn token tiếp theo từ các token có tổng xác suất tích lũy là P.">
                                <div className="flex items-center gap-4">
                                    <input type="range" min="0" max="1" step="0.05" value={settings.topP} onChange={e => handleSettingChange('topP', parseFloat(e.target.value))} className="themed-slider" />
                                    <span className="themed-slider-value">{settings.topP.toFixed(2)}</span>
                                </div>
                            </SettingsRow>
                            <button onClick={() => handleResetToDefault('AI & Models')} className="text-sm text-gray-400 hover:text-red-400 transition-colors">Đặt lại cài đặt AI & Models</button>
                        </SettingsSection>
                    </div>
                )}
                 {activeTab === 'safety' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                        <SettingsSection title="Cài Đặt An Toàn">
                             <SettingsRow label="Tắt Toàn Bộ Lọc An Toàn" description="CẢNH BÁO: Điều này có thể tạo ra nội dung không mong muốn. Chỉ bật khi bạn hiểu rõ rủi ro.">
                                <input type="checkbox" checked={settings.masterSafetySwitch} onChange={e => handleSettingChange('masterSafetySwitch', e.target.checked)} className="themed-checkbox" />
                            </SettingsRow>
                            {SAFETY_CATEGORIES.map(category => (
                                <SettingsRow key={category.id} label={category.name} description={`Mức độ chặn cho nội dung ${category.name.toLowerCase()}.`}>
                                     <select
                                        value={settings.safetyLevels[category.id as keyof typeof settings.safetyLevels]}
                                        onChange={(e) => handleSettingChange('safetyLevels', { ...settings.safetyLevels, [category.id]: e.target.value as SafetyLevel })}
                                        className="themed-select"
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
                                 <select value={settings.gameSpeed} onChange={(e) => handleSettingChange('gameSpeed', e.target.value as GameSpeed)} className="themed-select">
                                    {GAME_SPEEDS.map(speed => <option key={speed.value} value={speed.value}>{speed.label}</option>)}
                                </select>
                            </SettingsRow>
                             <SettingsRow label="Văn Phong Tường Thuật" description="Chọn phong cách viết của AI khi kể chuyện.">
                                <select value={settings.narrativeStyle} onChange={(e) => handleSettingChange('narrativeStyle', e.target.value as NarrativeStyle)} className="themed-select">
                                    {NARRATIVE_STYLES.map(style => <option key={style.value} value={style.value}>{style.label}</option>)}
                                </select>
                            </SettingsRow>
                             <SettingsRow label="Hệ thống Âm thanh AI" description="Cho phép AI tự động tạo ra các hiệu ứng âm thanh và nhạc nền (tính năng thử nghiệm).">
                                <input type="checkbox" checked={settings.enableAiSoundSystem} onChange={e => handleSettingChange('enableAiSoundSystem', e.target.checked)} className="themed-checkbox" />
                            </SettingsRow>
                            <SettingsRow label="Chế độ Hiệu Năng" description="Tắt một số hiệu ứng hình ảnh để tăng hiệu năng trên các thiết bị yếu.">
                                <input type="checkbox" checked={settings.enablePerformanceMode} onChange={e => handleSettingChange('enablePerformanceMode', e.target.checked)} className="themed-checkbox" />
                            </SettingsRow>
                             <button onClick={() => handleResetToDefault('Lối Chơi')} className="text-sm text-gray-400 hover:text-red-400 transition-colors">Đặt lại cài đặt Lối Chơi</button>
                        </SettingsSection>
                    </div>
                )}
                {activeTab === 'advanced' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                        <SettingsSection title="Quản lý Lịch sử Chat">
                            <SettingsRow label="Giới hạn Token Lịch sử" description="Số token tối đa giữ lại trong lịch sử chat để gửi cho AI.">
                                <input type="number" step="256" value={settings.historyTokenLimit} onChange={e => handleSettingChange('historyTokenLimit', parseInt(e.target.value) || 8192)} className="themed-input" />
                            </SettingsRow>
                            <SettingsRow label="Tóm tắt trước khi cắt" description="Khi lịch sử chat quá dài, AI sẽ tóm tắt phần cũ thay vì cắt bỏ hoàn toàn.">
                                <input type="checkbox" checked={settings.summarizeBeforePruning} onChange={e => handleSettingChange('summarizeBeforePruning', e.target.checked)} className="themed-checkbox" />
                            </SettingsRow>
                        </SettingsSection>
                        <SettingsSection title="Hệ thống RAG (Truy xuất Tăng cường - Thử nghiệm)">
                            <SettingsRow label="Model Tóm tắt RAG" description="Model dùng để tóm tắt các nguồn tài liệu được truy xuất.">
                                <select value={settings.ragSummaryModel} onChange={(e) => handleSettingChange('ragSummaryModel', e.target.value as AIModel)} className="themed-select">
                                    {AI_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                            </SettingsRow>
                            <SettingsRow label="Model Embedding RAG" description="Model dùng để tạo vector cho các tài liệu và truy vấn.">
                                <select value={settings.ragEmbeddingModel} onChange={(e) => handleSettingChange('ragEmbeddingModel', e.target.value as RagEmbeddingModel)} className="themed-select">
                                    {RAG_EMBEDDING_MODELS.map(model => <option key={model.value} value={model.value}>{model.label}</option>)}
                                </select>
                            </SettingsRow>
                             <SettingsRow label="Tần suất Tóm tắt Tự động" description="Số lượt tương tác trước khi AI tự động tóm tắt lịch sử (dùng cho RAG).">
                                <input type="number" value={settings.autoSummaryFrequency} onChange={e => handleSettingChange('autoSummaryFrequency', parseInt(e.target.value) || 5)} className="themed-input" />
                            </SettingsRow>
                            <SettingsRow label="RAG Top-K" description="Số lượng tài liệu liên quan nhất được truy xuất để cung cấp cho AI.">
                                <input type="number" value={settings.ragTopK} onChange={e => handleSettingChange('ragTopK', parseInt(e.target.value) || 5)} className="themed-input" />
                            </SettingsRow>
                             <button onClick={() => handleResetToDefault('Nâng Cao')} className="text-sm text-gray-400 hover:text-red-400 transition-colors">Đặt lại cài đặt Nâng Cao</button>
                        </SettingsSection>
                        <SettingsSection title="Dữ Liệu Game & Gỡ Lỗi">
                            <SettingsRow label="Bảng Điều Khiển Gỡ Lỗi" description="Hiển thị console log trong game để gỡ lỗi và theo dõi trạng thái.">
                                <input 
                                    type="checkbox" 
                                    checked={settings.enableDeveloperConsole} 
                                    onChange={e => handleSettingChange('enableDeveloperConsole', e.target.checked)} 
                                    className="themed-checkbox" 
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
                                    className="settings-button-danger flex items-center gap-2"
                                >
                                    <FaTrash /> Xóa Dữ Liệu
                                </button>
                            </SettingsRow>
                        </SettingsSection>
                    </div>
                )}
            </div>

            <div className="settings-footer">
                <button onClick={() => handleNavigate('mainMenu')} className="settings-button">Hủy</button>
                <button onClick={handleSettingsSave} className="settings-button-primary">Lưu Cài Đặt</button>
            </div>
        </div>
    );
};

export default memo(SettingsPanel);