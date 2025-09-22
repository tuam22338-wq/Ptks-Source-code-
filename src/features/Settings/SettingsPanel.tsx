import React, { useState, useEffect, memo, useRef } from 'react';
import { DEFAULT_SETTINGS, AI_MODELS, IMAGE_AI_MODELS, RAG_EMBEDDING_MODELS, SAFETY_LEVELS, SAFETY_CATEGORIES, LAYOUT_MODES, GAME_SPEEDS, NARRATIVE_STYLES, FONT_OPTIONS } from '../../constants';
import { generateBackgroundImage } from '../../services/geminiService';
import type { GameSettings, AIModel, ImageModel, SafetyLevel, LayoutMode, GameSpeed, NarrativeStyle, RagEmbeddingModel, AssignableModel } from '../../types';
import { FaArrowLeft, FaDesktop, FaRobot, FaShieldAlt, FaCog, FaGamepad, FaExpand, FaTrash, FaKey, FaPlus, FaExclamationTriangle, FaMusic, FaVolumeUp, FaFire, FaDownload, FaUpload } from 'react-icons/fa';
import LoadingSpinner from '../../components/LoadingSpinner';
import * as db from '../../services/dbService';
import { useAppContext } from '../../contexts/AppContext';

type SettingsTab = 'interface' | 'sound' | 'ai_models' | 'safety' | 'gameplay' | 'advanced';

const SettingsSection: React.FC<{ title: string; onReset?: () => void; children: React.ReactNode }> = memo(({ title, onReset, children }) => (
  <section className="settings-section">
    <div className="flex justify-between items-baseline">
        <h3 className="settings-section-title">{title}</h3>
        {onReset && <button onClick={onReset} className="text-xs text-gray-500 hover:text-red-400 transition-colors">Đặt lại</button>}
    </div>
    <div className="space-y-6">{children}</div>
  </section>
));

const SettingsRow: React.FC<{ label: string; description: string; children: React.ReactNode; disabled?: boolean }> = memo(({ label, description, children, disabled = false }) => (
  <div className={`settings-row ${disabled ? 'opacity-50' : ''}`}>
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

const modelConfigs: { id: AssignableModel; label: string; description: string; modelType: 'text' | 'image' | 'rag' }[] = [
    { id: 'mainTaskModel', label: 'Model Chính (Kể chuyện)', description: 'Model mạnh nhất, dùng cho các tác vụ chính như kể chuyện.', modelType: 'text' },
    { id: 'gameMasterModel', label: 'Model Game Master', description: 'Điều khiển cốt truyện, sự kiện và tạo mod bằng AI.', modelType: 'text' },
    { id: 'dataParsingModel', label: 'Model Phân tích Dữ liệu (AI Trung gian)', description: 'Phân tích nhanh kết quả từ AI, trích xuất vật phẩm, nhiệm vụ.', modelType: 'text' },
    { id: 'quickSupportModel', label: 'Model Hỗ trợ Nhanh', description: 'Dùng cho các tác vụ nhỏ, phân tích nhanh (gợi ý, tóm tắt).', modelType: 'text' },
    { id: 'npcSimulationModel', label: 'Model Mô phỏng NPC', description: 'Điều khiển hành vi và sự phát triển của NPC trong thế giới.', modelType: 'text' },
    { id: 'actionAnalysisModel', label: 'Model Phân tích Hành động', description: 'Phân tích và quyết định kết quả hành động (vd: chiến đấu).', modelType: 'text' },
    { id: 'itemAnalysisModel', label: 'Model Phân tích Vật phẩm', description: 'Chuyên dùng để phân tích mô tả và tạo ra chỉ số cho vật phẩm.', modelType: 'text' },
    { id: 'itemCraftingModel', label: 'Model Tạo Vật Phẩm/Công Pháp', description: 'Chuyên tạo chi tiết cho vật phẩm, công pháp mới.', modelType: 'text' },
    { id: 'soundSystemModel', label: 'Model Hệ thống Âm thanh', description: 'Dùng để tạo mô tả âm thanh và nhạc nền khi bật.', modelType: 'text' },
    { id: 'imageGenerationModel', label: 'Model Tạo Ảnh', description: 'Model dùng để tạo ảnh đại diện và ảnh nền.', modelType: 'image' },
    { id: 'ragSummaryModel', label: 'Model Tóm tắt RAG', description: 'Model dùng để tóm tắt các nguồn dữ liệu cho RAG.', modelType: 'text' },
    { id: 'ragSourceIdModel', label: 'Model Nhận dạng Nguồn RAG', description: 'Model dùng để xác định nguồn thông tin liên quan nhất.', modelType: 'text' },
];

export const SettingsPanel: React.FC = () => {
    const { state, handleNavigate, handleSettingsSave, handleSettingChange } = useAppContext();
    const { settings } = state;
    const [activeTab, setActiveTab] = useState<SettingsTab>('interface');
    const [bgPrompt, setBgPrompt] = useState('');
    const [isGeneratingBg, setIsGeneratingBg] = useState(false);
    const [newApiKey, setNewApiKey] = useState('');
    const musicInputRef = useRef<HTMLInputElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const loadVoices = () => {
            if (window.speechSynthesis) {
                setVoices(window.speechSynthesis.getVoices());
            }
        };
        if (window.speechSynthesis) {
            window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
            loadVoices();
        }
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
            }
        };
    }, []);

    const vietnameseVoices = voices.filter(v => v.lang.startsWith('vi'));
    
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

    const handleMusicFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            alert("Tệp nhạc quá lớn. Vui lòng chọn tệp nhỏ hơn 20MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            handleSettingChange('backgroundMusicUrl', dataUrl);
            handleSettingChange('backgroundMusicName', file.name);
        };
        reader.readAsDataURL(file);
    };

    const handleAddApiKey = () => {
        if (newApiKey.trim() && !settings.apiKeys.includes(newApiKey.trim())) {
            handleSettingChange('apiKeys', [...settings.apiKeys, newApiKey.trim()]);
            setNewApiKey('');
        }
    };

    const handleRemoveApiKey = (keyToRemove: string) => {
        handleSettingChange('apiKeys', settings.apiKeys.filter(key => key !== keyToRemove));
    };
    
    const handleExportData = async () => {
        if (!window.confirm("Bạn có muốn sao lưu toàn bộ dữ liệu game (lưu game, cài đặt, mods) ra một tệp JSON không?")) {
            return;
        }
        try {
            const allData = await db.exportAllData();
            const jsonString = JSON.stringify(allData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.href = url;
            link.download = `tamthienthegioi_backup_${timestamp}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            alert('Đã xuất dữ liệu thành công!');
        } catch (error) {
            console.error("Failed to export data:", error);
            alert('Xuất dữ liệu thất bại.');
        }
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm("CẢNH BÁO: Thao tác này sẽ XÓA TOÀN BỘ dữ liệu hiện tại của bạn và thay thế bằng dữ liệu từ tệp sao lưu. Bạn có chắc chắn muốn tiếp tục không?")) {
            if(importInputRef.current) importInputRef.current.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const data = JSON.parse(text);

                if (!data.saveSlots || !data.settings) {
                    throw new Error("Tệp sao lưu không hợp lệ hoặc bị hỏng.");
                }

                await db.importAllData(data);
                alert("Nhập dữ liệu thành công! Trò chơi sẽ được tải lại.");
                window.location.reload();
            } catch (error: any) {
                console.error("Failed to import data:", error);
                alert(`Nhập dữ liệu thất bại: ${error.message}`);
            } finally {
                if(importInputRef.current) importInputRef.current.value = "";
            }
        };
        reader.onerror = () => {
            alert('Không thể đọc tệp tin.');
            if(importInputRef.current) importInputRef.current.value = "";
        };
        reader.readAsText(file);
    };

    const handleResetData = async () => {
        if (window.confirm("BẠN CÓ CHẮC CHẮN MUỐN XÓA TẤT CẢ DỮ LIỆU GAME KHÔNG? HÀNH ĐỘNG NÀY SẼ XÓA TẤT CẢ CÁC FILE LƯU, CÀI ĐẶT VÀ MOD CỦA BẠN. KHÔNG THỂ HOÀN TÁC!")) {
            try {
                await db.deleteDb();
                alert("Đã xóa tất cả dữ liệu. Trang sẽ được tải lại.");
                window.location.reload();
            } catch (error) {
                console.error("Failed to delete database:", error);
                alert("Xóa dữ liệu thất bại.");
            }
        }
    };

    return (
        <div className="w-full animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8 flex flex-col h-full max-h-[85vh]">
            <div className="settings-header">
                <button onClick={() => handleNavigate('mainMenu')} className="settings-back-button" title="Quay Lại Menu">
                    <FaArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="settings-main-title">Cài Đặt</h2>
                <div className="w-9 h-9"></div> {/* Spacer */}
            </div>

            <div className="settings-tab-nav">
                <TabButton tabId="interface" activeTab={activeTab} onClick={setActiveTab} icon={FaDesktop} label="Giao Diện" />
                <TabButton tabId="sound" activeTab={activeTab} onClick={setActiveTab} icon={FaVolumeUp} label="Âm Thanh" />
                <TabButton tabId="ai_models" activeTab={activeTab} onClick={setActiveTab} icon={FaRobot} label="AI" />
                <TabButton tabId="safety" activeTab={activeTab} onClick={setActiveTab} icon={FaShieldAlt} label="An Toàn" />
                <TabButton tabId="gameplay" activeTab={activeTab} onClick={setActiveTab} icon={FaGamepad} label="Lối Chơi" />
                <TabButton tabId="advanced" activeTab={activeTab} onClick={setActiveTab} icon={FaCog} label="Nâng Cao" />
            </div>

            <div className="settings-content">
                {activeTab === 'interface' && (
                    <SettingsSection title="Giao Diện & Hiển Thị">
                        <SettingsRow label="Chế độ hiển thị" description="Tự động phát hiện hoặc ép hiển thị theo giao diện máy tính/di động.">
                            <div className="themed-button-group">
                                {LAYOUT_MODES.map(mode => (
                                    <button key={mode.value} className={settings.layoutMode === mode.value ? 'active' : ''} onClick={() => handleSettingChange('layoutMode', mode.value)}>{mode.label}</button>
                                ))}
                            </div>
                        </SettingsRow>
                         <SettingsRow label="Font chữ" description="Thay đổi font chữ chính của trò chơi.">
                             <select className="themed-select" value={settings.fontFamily} onChange={(e) => handleSettingChange('fontFamily', e.target.value)}>
                                {FONT_OPTIONS.map(font => (
                                    <option key={font.value} value={font.value} style={{fontFamily: font.value}}>{font.label}</option>
                                ))}
                            </select>
                        </SettingsRow>
                         <SettingsRow label="Độ phóng to" description="Điều chỉnh kích thước tổng thể của giao diện.">
                            <div className="flex items-center gap-4">
                               <input type="range" min="40" max="200" step="5" value={settings.zoomLevel} onChange={(e) => handleSettingChange('zoomLevel', parseInt(e.target.value))} className="themed-slider flex-grow" />
                               <span className="themed-slider-value">{settings.zoomLevel}%</span>
                            </div>
                        </SettingsRow>
                         <SettingsRow label="Màu chữ chính" description="Chọn màu sắc cho các đoạn văn tường thuật chính.">
                            <input type="color" value={settings.textColor} onChange={(e) => handleSettingChange('textColor', e.target.value)} className="themed-color-input" />
                        </SettingsRow>
                        <SettingsRow label="Ảnh nền tùy chỉnh (AI)" description="Dùng AI để tạo ảnh nền cho game. Yêu cầu API Key có quyền truy cập model tạo ảnh.">
                            <div className="flex gap-2">
                                <input type="text" value={bgPrompt} onChange={(e) => setBgPrompt(e.target.value)} placeholder="Mô tả ảnh nền..." className="themed-input flex-grow" disabled={isGeneratingBg}/>
                                <button onClick={handleGenerateBg} disabled={isGeneratingBg} className="settings-button-primary w-28 flex items-center justify-center">
                                    {isGeneratingBg ? <LoadingSpinner size="sm"/> : 'Tạo'}
                                </button>
                            </div>
                            {settings.backgroundImage && <button onClick={() => handleSettingChange('backgroundImage', '')} className="text-xs text-red-400 hover:text-red-300">Xóa ảnh nền hiện tại</button>}
                        </SettingsRow>
                    </SettingsSection>
                )}
                 {activeTab === 'sound' && (
                    <SettingsSection title="Âm thanh">
                        <SettingsRow label="Nhạc nền" description="Tải lên tệp nhạc của bạn (dưới 20MB) hoặc để trống để tắt nhạc.">
                            <input type="file" accept="audio/*" ref={musicInputRef} onChange={handleMusicFileChange} className="hidden" />
                             <div className="flex items-center gap-2">
                                 <button onClick={() => musicInputRef.current?.click()} className="settings-button">Chọn tệp...</button>
                                 <span className="text-sm text-gray-400 truncate flex-grow">{settings.backgroundMusicName || "Chưa có nhạc nền"}</span>
                                 {settings.backgroundMusicUrl && <button onClick={() => { handleSettingChange('backgroundMusicUrl', ''); handleSettingChange('backgroundMusicName', ''); }} className="text-xs text-red-400 hover:text-red-300">Xóa</button>}
                            </div>
                        </SettingsRow>
                         <SettingsRow label="Âm lượng nhạc nền" description="Điều chỉnh âm lượng nhạc nền.">
                            <div className="flex items-center gap-4">
                                <input type="range" min="0" max="1" step="0.05" value={settings.backgroundMusicVolume} onChange={(e) => handleSettingChange('backgroundMusicVolume', parseFloat(e.target.value))} className="themed-slider flex-grow" />
                                <span className="themed-slider-value">{Math.round(settings.backgroundMusicVolume * 100)}%</span>
                            </div>
                        </SettingsRow>
                        <SettingsRow label="Bật đọc văn bản (TTS)" description="Tự động đọc các đoạn tường thuật của AI.">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" checked={settings.enableTTS} onChange={e => handleSettingChange('enableTTS', e.target.checked)} className="themed-checkbox" />
                                <span className="ml-3 text-sm text-gray-300">Bật Text-to-Speech</span>
                            </label>
                        </SettingsRow>
                        {settings.enableTTS && (
                             <>
                                <SettingsRow label="Giọng đọc" description="Chọn giọng đọc cho hệ thống.">
                                     <select className="themed-select" value={settings.ttsVoiceURI} onChange={(e) => handleSettingChange('ttsVoiceURI', e.target.value)}>
                                        <option value="">Giọng mặc định của trình duyệt</option>
                                        {vietnameseVoices.map(voice => (
                                            <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>
                                        ))}
                                    </select>
                                </SettingsRow>
                                <SettingsRow label="Tốc độ đọc" description="Điều chỉnh tốc độ đọc.">
                                    <div className="flex items-center gap-4">
                                        <input type="range" min="0.5" max="2" step="0.1" value={settings.ttsRate} onChange={(e) => handleSettingChange('ttsRate', parseFloat(e.target.value))} className="themed-slider flex-grow" />
                                        <span className="themed-slider-value">{settings.ttsRate.toFixed(1)}x</span>
                                    </div>
                                </SettingsRow>
                                <SettingsRow label="Cao độ" description="Điều chỉnh cao độ của giọng đọc.">
                                     <div className="flex items-center gap-4">
                                        <input type="range" min="0" max="2" step="0.1" value={settings.ttsPitch} onChange={(e) => handleSettingChange('ttsPitch', parseFloat(e.target.value))} className="themed-slider flex-grow" />
                                        <span className="themed-slider-value">{settings.ttsPitch.toFixed(1)}</span>
                                    </div>
                                </SettingsRow>
                             </>
                        )}
                    </SettingsSection>
                 )}
                {activeTab === 'ai_models' && (
                    <SettingsSection title="AI & Models">
                        <SettingsRow label="Quản lý API Keys" description="Thêm một hoặc nhiều Google Gemini API Key. Hệ thống sẽ tự động xoay vòng và thử lại khi một key hết hạn ngạch hoặc gặp lỗi.">
                             <div>
                                {settings.apiKeys.map(key => (
                                    <div key={key} className="flex items-center gap-2 mb-2">
                                        <FaKey className="text-gray-500" />
                                        <input type="text" readOnly value={`••••••••${key.slice(-4)}`} className="themed-input flex-grow" />
                                        <button onClick={() => handleRemoveApiKey(key)} className="p-2 text-gray-400 hover:text-red-400"><FaTrash /></button>
                                    </div>
                                ))}
                                <div className="flex items-center gap-2 mt-2">
                                    <input type="text" value={newApiKey} onChange={(e) => setNewApiKey(e.target.value)} placeholder="Dán API Key mới vào đây" className="themed-input flex-grow" />
                                    <button onClick={handleAddApiKey} className="p-2 text-gray-200 bg-gray-600 rounded-md hover:bg-gray-500"><FaPlus /></button>
                                </div>
                            </div>
                        </SettingsRow>
                         <SettingsRow label="Phân công Model" description="Chọn Model và API Key cho từng tác vụ cụ thể để tối ưu hóa hiệu suất và quản lý hạn ngạch. 'Tự động' sẽ sử dụng cơ chế xoay vòng qua tất cả các key.">
                             <div className="grid grid-cols-1 gap-4">
                                {modelConfigs.map(config => (
                                    <div key={config.id} className="p-3 bg-black/20 rounded-lg border border-gray-700/60">
                                        <p className="font-semibold text-gray-300">{config.label}</p>
                                        <p className="text-xs text-gray-500 mb-2">{config.description}</p>
                                        <div className="flex items-center gap-2">
                                            <select 
                                                value={(settings as any)[config.id] || ''}
                                                onChange={e => handleSettingChange(config.id, e.target.value)}
                                                className="themed-select flex-grow"
                                            >
                                                {config.modelType === 'image' ? IMAGE_AI_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>) :
                                                 config.modelType === 'rag' ? RAG_EMBEDDING_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>) :
                                                 AI_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                            </select>
                                            <select 
                                                value={settings.modelApiKeyAssignments[config.id] || 'auto'}
                                                onChange={e => handleSettingChange('modelApiKeyAssignments', { ...settings.modelApiKeyAssignments, [config.id]: e.target.value })}
                                                className="themed-select w-40"
                                            >
                                                <option value="auto">Tự động</option>
                                                {settings.apiKeys.map((key, index) => (
                                                    <option key={key} value={key}>Key {index + 1} (...{key.slice(-4)})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SettingsRow>
                    </SettingsSection>
                )}
                {activeTab === 'safety' && (
                    <SettingsSection title="Cài Đặt An Toàn AI">
                         <SettingsRow label="Bật Chế Độ NSFW (18+)" description="Kích hoạt chế độ NSFW. Khi bật, AI sẽ tạo ra nội dung người lớn chi tiết, không che đậy và bỏ qua tất cả các bộ lọc an toàn khác.">
                             <div className="flex flex-col">
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" checked={settings.enableNsfwMode} onChange={e => handleSettingChange('enableNsfwMode', e.target.checked)} className="themed-checkbox" />
                                    <span className="ml-3 text-sm font-bold text-red-400 flex items-center gap-2"><FaFire /> Bật chế độ 18+</span>
                                </label>
                                {settings.enableNsfwMode && (
                                     <p className="mt-2 text-xs text-red-400 bg-red-900/30 border border-red-500/50 p-2 rounded-md">
                                        <strong>CẢNH BÁO:</strong> Bạn đã bật chế độ NSFW. AI sẽ tạo ra các nội dung người lớn, tình dục một cách chi tiết và trần trụi. Các bộ lọc an toàn khác đã bị vô hiệu hóa.
                                    </p>
                                )}
                            </div>
                        </SettingsRow>
                        <SettingsRow label="Công tắc an toàn chính" description="Tắt tùy chọn này sẽ bỏ qua tất cả các bộ lọc an toàn. Chỉ nên tắt nếu bạn hiểu rõ rủi ro." disabled={settings.enableNsfwMode}>
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" checked={settings.masterSafetySwitch} onChange={e => handleSettingChange('masterSafetySwitch', e.target.checked)} className="themed-checkbox" disabled={settings.enableNsfwMode}/>
                                <span className="ml-3 text-sm text-gray-300">Bật bộ lọc an toàn</span>
                            </label>
                        </SettingsRow>
                        {settings.masterSafetySwitch && SAFETY_CATEGORIES.map(category => (
                            <SettingsRow key={category.id} label={category.name} description={`Chặn các nội dung liên quan đến ${category.name.toLowerCase()}.`} disabled={settings.enableNsfwMode}>
                                 <select 
                                    className="themed-select" 
                                    value={settings.safetyLevels[category.id as keyof typeof settings.safetyLevels]}
                                    onChange={e => handleSettingChange('safetyLevels', { ...settings.safetyLevels, [category.id]: e.target.value as SafetyLevel })}
                                    disabled={settings.enableNsfwMode}
                                >
                                    {SAFETY_LEVELS.map(level => (
                                        <option key={level.value} value={level.value}>{level.label}</option>
                                    ))}
                                </select>
                            </SettingsRow>
                        ))}
                    </SettingsSection>
                )}
                {activeTab === 'gameplay' && (
                     <SettingsSection title="Lối Chơi">
                         <SettingsRow label="Tốc độ game" description="Ảnh hưởng đến tốc độ hồi phục điểm hành động và các sự kiện trong game.">
                             <div className="themed-button-group">
                                {GAME_SPEEDS.map(speed => (
                                    <button key={speed.value} className={settings.gameSpeed === speed.value ? 'active' : ''} onClick={() => handleSettingChange('gameSpeed', speed.value)}>{speed.label}</button>
                                ))}
                            </div>
                        </SettingsRow>
                         <SettingsRow label="Văn phong tường thuật" description="Chọn phong cách viết của AI kể chuyện.">
                             <div className="themed-button-group">
                                {NARRATIVE_STYLES.map(style => (
                                    <button key={style.value} className={settings.narrativeStyle === style.value ? 'active' : ''} onClick={() => handleSettingChange('narrativeStyle', style.value)}>{style.label}</button>
                                ))}
                            </div>
                        </SettingsRow>
                        <SettingsRow label="Độ dài phản hồi AI" description="Điều chỉnh độ dài mong muốn cho mỗi phản hồi của AI kể chuyện (tính bằng từ).">
                            <div className="flex items-center gap-4">
                               <input type="range" min="100" max="4000" step="50" value={settings.aiResponseWordCount} onChange={(e) => handleSettingChange('aiResponseWordCount', parseInt(e.target.value))} className="themed-slider flex-grow" />
                               <span className="themed-slider-value w-24 text-right">{settings.aiResponseWordCount} từ</span>
                            </div>
                        </SettingsRow>
                    </SettingsSection>
                )}
                 {activeTab === 'advanced' && (
                    <SettingsSection title="Nâng Cao">
                        <SettingsRow label="Nhiệt độ (Temperature)" description="Kiểm soát mức độ sáng tạo/ngẫu nhiên của AI. Giá trị cao hơn (vd: 1.2) cho kết quả đa dạng, giá trị thấp hơn (vd: 0.7) cho kết quả nhất quán hơn.">
                            <div className="flex items-center gap-4">
                                <input type="range" min="0" max="2" step="0.1" value={settings.temperature} onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))} className="themed-slider flex-grow" />
                                <span className="themed-slider-value">{settings.temperature.toFixed(1)}</span>
                            </div>
                        </SettingsRow>
                        <SettingsRow label="Top-K" description="Giới hạn số lượng token có khả năng cao nhất mà AI xem xét ở mỗi bước. Giá trị thấp hơn làm cho AI bớt ngẫu nhiên.">
                            <div className="flex items-center gap-4">
                                <input type="range" min="1" max="128" step="1" value={settings.topK} onChange={(e) => handleSettingChange('topK', parseInt(e.target.value))} className="themed-slider flex-grow" />
                                <span className="themed-slider-value">{settings.topK}</span>
                            </div>
                        </SettingsRow>
                        <SettingsRow label="Top-P" description="Chọn các token có xác suất tích lũy đạt đến một ngưỡng nhất định. Kiểm soát sự đa dạng của phản hồi.">
                            <div className="flex items-center gap-4">
                                <input type="range" min="0" max="1" step="0.05" value={settings.topP} onChange={(e) => handleSettingChange('topP', parseFloat(e.target.value))} className="themed-slider flex-grow" />
                                <span className="themed-slider-value">{settings.topP.toFixed(2)}</span>
                            </div>
                        </SettingsRow>
                        <SettingsRow label="Bật 'Suy Nghĩ' (Thinking)" description="Cho phép model suy nghĩ trước khi trả lời để có chất lượng cao hơn (chỉ cho gemini-2.5-flash). Tắt có thể giảm độ trễ.">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" checked={settings.enableThinking} onChange={e => handleSettingChange('enableThinking', e.target.checked)} className="themed-checkbox" />
                                <span className="ml-3 text-sm text-gray-300">Bật Thinking</span>
                            </label>
                        </SettingsRow>
                        <SettingsRow label="Ngân sách 'Suy Nghĩ' (Thinking Budget)" description="Lượng token tối đa mà model có thể dùng để 'suy nghĩ'. Giá trị cao hơn có thể cải thiện chất lượng nhưng tăng độ trễ. Đặt là 0 để tắt." disabled={!settings.enableThinking}>
                            <div className="flex items-center gap-4">
                                <input type="range" min="0" max="2000" step="50" value={settings.thinkingBudget} onChange={(e) => handleSettingChange('thinkingBudget', parseInt(e.target.value))} className="themed-slider flex-grow" disabled={!settings.enableThinking}/>
                                <span className="themed-slider-value">{settings.thinkingBudget}</span>
                            </div>
                        </SettingsRow>
                        <SettingsRow label="Bảng điều khiển nhà phát triển" description="Hiển thị một console trong game để theo dõi log và các thông tin gỡ lỗi.">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" checked={settings.enableDeveloperConsole} onChange={e => handleSettingChange('enableDeveloperConsole', e.target.checked)} className="themed-checkbox" />
                                <span className="ml-3 text-sm text-gray-300">Bật Developer Console</span>
                            </label>
                        </SettingsRow>
                        <SettingsRow label="Chế độ hiệu suất" description="Tắt các hiệu ứng hình ảnh và chuyển động để cải thiện hiệu suất trên các thiết bị yếu.">
                             <label className="flex items-center cursor-pointer">
                                <input type="checkbox" checked={settings.enablePerformanceMode} onChange={e => handleSettingChange('enablePerformanceMode', e.target.checked)} className="themed-checkbox" />
                                <span className="ml-3 text-sm text-gray-300">Bật Performance Mode</span>
                            </label>
                        </SettingsRow>
                        <SettingsRow label="Quản lý Dữ liệu" description="Sao lưu toàn bộ dữ liệu game (lưu game, cài đặt, mods) ra file hoặc khôi phục từ file sao lưu.">
                             <div className="flex gap-2">
                                <button onClick={handleExportData} className="settings-button flex items-center gap-2">
                                    <FaDownload /> Sao Lưu
                                </button>
                                <button onClick={() => importInputRef.current?.click()} className="settings-button flex items-center gap-2">
                                    <FaUpload /> Nhập Dữ liệu
                                </button>
                                <input
                                    type="file"
                                    ref={importInputRef}
                                    className="hidden"
                                    accept=".json"
                                    onChange={handleImportData}
                                />
                            </div>
                        </SettingsRow>
                        <SettingsRow label="Xóa toàn bộ dữ liệu" description="Hành động này sẽ xóa tất cả các file lưu, cài đặt và mod của bạn. Không thể hoàn tác.">
                             <button onClick={handleResetData} className="settings-button-danger flex items-center gap-2">
                                <FaExclamationTriangle /> Xóa Dữ Liệu
                            </button>
                        </SettingsRow>
                    </SettingsSection>
                )}
            </div>

            <div className="settings-footer">
                <button onClick={handleSettingsSave} className="settings-button-primary">Lưu Cài Đặt</button>
            </div>
        </div>
    );
};