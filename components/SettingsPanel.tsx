

import React, { useState } from 'react';
import { DEFAULT_SETTINGS, AI_MODELS, IMAGE_AI_MODELS, RAG_EMBEDDING_MODELS, SAFETY_LEVELS, SAFETY_CATEGORIES, LAYOUT_MODES, GAME_SPEEDS, NARRATIVE_STYLES, FONT_OPTIONS, THEME_OPTIONS } from '../constants';
import { testApiKeys } from '../services/geminiService';
import type { GameSettings, AIModel, ImageModel, SafetyLevel, LayoutMode, GameSpeed, NarrativeStyle, Theme } from '../types';
import { FaArrowLeft, FaDesktop, FaRobot, FaShieldAlt, FaCog, FaGamepad, FaKey, FaCheckCircle, FaTimesCircle, FaExpand } from 'react-icons/fa';
import LoadingSpinner from './LoadingSpinner';

interface SettingsPanelProps {
  onBack: () => void;
  onSave: () => void;
  settings: GameSettings;
  onChange: (key: keyof GameSettings, value: any) => void;
}

type SettingsTab = 'interface' | 'ai_models' | 'safety' | 'gameplay' | 'api' | 'advanced';

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-8">
    <h3 className="text-xl font-bold font-title mb-4 pb-2 border-b border-gray-600/50" style={{color: 'var(--text-muted-color)'}}>{title}</h3>
    <div className="space-y-4">{children}</div>
  </section>
);

const SettingsRow: React.FC<{ label: string; description?: string; children: React.ReactNode }> = ({ label, description, children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 items-center bg-black/20 p-3 rounded-md border border-gray-700/60">
    <div>
      <label className="block text-md" style={{color: 'var(--text-color)'}}>{label}</label>
      {description && <p className="text-xs mt-1" style={{color: 'var(--text-muted-color)'}}>{description}</p>}
    </div>
    <div className="flex items-center justify-start md:justify-end w-full">{children}</div>
  </div>
);

const Select: React.FC<{ value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; options: { value: string; label: string }[]; }> = ({ value, onChange, options }) => (
  <select value={value} onChange={onChange} className="w-full max-w-xs bg-gray-800/50 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 transition-all">
    {options.map(opt => <option key={opt.value} value={opt.value} className="bg-gray-800">{opt.label}</option>)}
  </select>
);

const NumberInput: React.FC<{ value: number; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; min?: number; max?: number; }> = ({ value, onChange, min, max }) => (
  <input type="number" value={value} onChange={onChange} min={min} max={max} className="w-full max-w-xs bg-gray-800/50 border border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2" />
);

const Toggle: React.FC<{ checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
    <div className="w-14 h-7 bg-gray-700 rounded-full border border-gray-600 peer peer-focus:ring-2 peer-focus:ring-gray-500/50 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-accent-color)]"></div>
  </label>
);

type KeyCheckResult = { key: string; status: 'valid' | 'invalid'; error?: string };

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onBack, onSave, settings, onChange }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('api');
  const [isCheckingKeys, setIsCheckingKeys] = useState(false);
  const [keyCheckResults, setKeyCheckResults] = useState<KeyCheckResult[] | null>(null);
  
  const handleSafetyLevelChange = (category: keyof GameSettings['safetyLevels'], value: SafetyLevel) => {
    onChange('safetyLevels', {
        ...settings.safetyLevels,
        [category]: value
    });
  };
  
  const handleSaveSettings = () => {
    onSave();
  };

  const handleCheckKeys = async () => {
    setIsCheckingKeys(true);
    setKeyCheckResults(null);
    try {
        // Temporarily save current settings to be used by the service
        localStorage.setItem('game-settings', JSON.stringify(settings));
        const results = await testApiKeys();
        setKeyCheckResults(results);
    } catch (e: any) {
        setKeyCheckResults([{ key: 'Error', status: 'invalid', error: e.message }]);
    } finally {
        setIsCheckingKeys(false);
    }
  };
  
  const handleFullScreen = () => {
    const elem = document.documentElement as any;
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) { /* Firefox */
        elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE/Edge */
        elem.msRequestFullscreen();
    }
  };

  const TabButton: React.FC<{ tabId: SettingsTab; label: string; icon: React.ElementType }> = ({ tabId, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 p-3 text-sm font-bold rounded-lg transition-colors duration-200 ${
        activeTab === tabId
          ? 'bg-[color:var(--primary-accent-color)]/20 text-[color:var(--primary-accent-color)]'
          : 'text-[color:var(--text-muted-color)] hover:bg-black/10'
      }`}
    >
      <Icon className="w-5 h-5 mb-1 sm:mb-0" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="w-full animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8">
        <h2 className="text-3xl text-center font-bold font-title mb-6">Cài Đặt Game</h2>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-black/20 rounded-lg border border-gray-700/60 mb-6">
            <TabButton tabId="api" label="API" icon={FaKey} />
            <TabButton tabId="interface" label="Giao Diện" icon={FaDesktop} />
            <TabButton tabId="ai_models" label="Model AI" icon={FaRobot} />
            <TabButton tabId="safety" label="An Toàn" icon={FaShieldAlt} />
            <TabButton tabId="gameplay" label="Gameplay" icon={FaGamepad} />
            <TabButton tabId="advanced" label="Nâng Cao" icon={FaCog} />
        </div>
        
        {/* Tab Content */}
        <div className="min-h-[350px]">
             {activeTab === 'api' && (
                <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                    <SettingsSection title="Cấu hình API Key Gemini">
                        <SettingsRow label="API Key Mặc định" description="Sử dụng key này nếu không bật chế độ xoay key.">
                             <input type="password" value={settings.apiKey} onChange={e => onChange('apiKey', e.target.value)} className="w-full max-w-xs bg-gray-800/50 border border-gray-600 rounded-md px-3 py-2" />
                        </SettingsRow>
                         <SettingsRow label="Bật chế độ xoay Key" description="Sử dụng danh sách các key bên dưới và tự động xoay vòng khi gặp lỗi.">
                            <Toggle checked={settings.useKeyRotation} onChange={e => onChange('useKeyRotation', e.target.checked)} />
                        </SettingsRow>
                         <SettingsRow label="Danh sách API Keys" description="Nhập mỗi key trên một dòng.">
                            <textarea 
                                value={settings.apiKeys.join('\n')}
                                onChange={e => onChange('apiKeys', e.target.value.split('\n'))}
                                rows={4}
                                placeholder="Nhập mỗi key một dòng..."
                                className="w-full max-w-xs bg-gray-800/50 border border-gray-600 rounded-md px-3 py-2 font-mono text-sm"
                            />
                        </SettingsRow>
                         <div className="flex justify-end pt-2">
                             <button onClick={handleCheckKeys} disabled={isCheckingKeys} className="px-4 py-2 bg-blue-700/80 text-white font-bold rounded-lg hover:bg-blue-600/80 disabled:bg-gray-600">
                                {isCheckingKeys ? <LoadingSpinner size="sm"/> : 'Kiểm tra Keys'}
                            </button>
                         </div>
                         {keyCheckResults && (
                            <div className="mt-4 space-y-2">
                                {keyCheckResults.map((result, index) => (
                                    <div key={index} className={`flex items-center gap-2 p-2 rounded-md text-sm ${result.status === 'valid' ? 'bg-green-500/10 text-green-300 border border-green-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/30'}`}>
                                        {result.status === 'valid' ? <FaCheckCircle/> : <FaTimesCircle/>}
                                        <span>Key kết thúc bằng {result.key}: <strong>{result.status === 'valid' ? 'Hợp lệ' : 'Không hợp lệ'}</strong></span>
                                        {result.error && <p className="text-xs">({result.error})</p>}
                                    </div>
                                ))}
                            </div>
                         )}
                    </SettingsSection>
                </div>
            )}
            {activeTab === 'interface' && (
                <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                    <SettingsSection title="Cài Đặt Giao Diện">
                        <SettingsRow label="Theme Giao Diện" description="Thay đổi bảng màu tổng thể của trò chơi.">
                             <Select value={settings.theme} onChange={e => onChange('theme', e.target.value as Theme)} options={THEME_OPTIONS} />
                        </SettingsRow>
                        <SettingsRow label="Bố cục" description="Chọn bố cục cho máy tính hoặc di động. 'Tự động' sẽ dựa trên kích thước màn hình.">
                             <Select value={settings.layoutMode} onChange={e => onChange('layoutMode', e.target.value as LayoutMode)} options={LAYOUT_MODES} />
                        </SettingsRow>
                        <SettingsRow label="Phông chữ" description="Chọn phông chữ cho toàn bộ trò chơi.">
                             <Select value={settings.fontFamily} onChange={e => onChange('fontFamily', e.target.value)} options={FONT_OPTIONS} />
                        </SettingsRow>
                         <SettingsRow label="Chế độ toàn màn hình" description="Bật chế độ toàn màn hình để có trải nghiệm tốt nhất.">
                             <button onClick={handleFullScreen} className="flex items-center gap-2 px-4 py-2 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80">
                                <FaExpand /> Bật Toàn Màn Hình
                            </button>
                        </SettingsRow>
                    </SettingsSection>
                </div>
            )}
            {activeTab === 'ai_models' && (
                <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                    <SettingsSection title="Model AI cho Tác Vụ Chính & Phức Tạp">
                        <SettingsRow label="Model AI cho Văn Bản" description="Model cho nội dung chính.">
                            <Select value={settings.mainTaskModel} onChange={e => onChange('mainTaskModel', e.target.value as AIModel)} options={AI_MODELS} />
                        </SettingsRow>
                        <SettingsRow label="Model AI Hỗ Trợ Nhanh" description="Model cho hỗ trợ thiết lập nhanh.">
                            <Select value={settings.quickSupportModel} onChange={e => onChange('quickSupportModel', e.target.value as AIModel)} options={AI_MODELS} />
                        </SettingsRow>
                    </SettingsSection>
                    <SettingsSection title="Model AI Chuyên Dụng">
                         <SettingsRow label="Model AI Mô Phỏng NPC" description="Model để tạo và mô phỏng hành vi của NPC.">
                            <Select value={settings.npcSimulationModel} onChange={e => onChange('npcSimulationModel', e.target.value as AIModel)} options={AI_MODELS} />
                        </SettingsRow>
                        <SettingsRow label="Model AI Tạo Ảnh" description="Model để tạo hình ảnh nhân vật, vật phẩm.">
                            <Select value={settings.imageGenerationModel} onChange={e => onChange('imageGenerationModel', e.target.value as ImageModel)} options={IMAGE_AI_MODELS} />
                        </SettingsRow>
                        <SettingsRow label="Model AI cho GameMaster" description="Model để phân tích yêu cầu tạo mod của bạn.">
                            <Select value={settings.gameMasterModel} onChange={e => onChange('gameMasterModel', e.target.value as AIModel)} options={AI_MODELS} />
                        </SettingsRow>
                    </SettingsSection>
                </div>
            )}
             {activeTab === 'safety' && (
                <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                    <SettingsSection title="Bật lọc an toàn Gemini API">
                        <SettingsRow label="Bật/Tắt tất cả bộ lọc" description="Ghi đè tất cả cài đặt an toàn bên dưới.">
                            <Toggle checked={!settings.masterSafetySwitch} onChange={e => onChange('masterSafetySwitch', !e.target.checked)} />
                        </SettingsRow>
                        {SAFETY_CATEGORIES.map(category => (
                            <SettingsRow key={category.id} label={category.name}>
                                <Select 
                                    value={settings.safetyLevels[category.id as keyof GameSettings['safetyLevels']]} 
                                    onChange={e => handleSafetyLevelChange(category.id as keyof GameSettings['safetyLevels'], e.target.value as SafetyLevel)} 
                                    options={SAFETY_LEVELS} 
                                />
                            </SettingsRow>
                        ))}
                    </SettingsSection>
                </div>
             )}
            {activeTab === 'gameplay' && (
                <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                    <SettingsSection title="Cài Đặt Gameplay">
                        <SettingsRow label="Tốc độ thời gian" description="Điều chỉnh tốc độ trôi qua của thời gian trong game. Yêu cầu tải lại game.">
                             <Select value={settings.gameSpeed} onChange={e => onChange('gameSpeed', e.target.value as GameSpeed)} options={GAME_SPEEDS} />
                        </SettingsRow>
                         <SettingsRow label="Văn phong kể chuyện của AI" description="Chọn phong cách văn bản mà AI sẽ sử dụng để kể chuyện.">
                             <Select value={settings.narrativeStyle} onChange={e => onChange('narrativeStyle', e.target.value as NarrativeStyle)} options={NARRATIVE_STYLES} />
                        </SettingsRow>
                    </SettingsSection>
                </div>
            )}
              {activeTab === 'advanced' && (
                <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                    <SettingsSection title="RAG & Tóm Tắt">
                        <SettingsRow label="Model cho RAG Embeddings" description="Model Gemini để tạo vector embeddings.">
                            <Select value={settings.ragEmbeddingModel} onChange={() => {}} options={RAG_EMBEDDING_MODELS} />
                        </SettingsRow>
                        <SettingsRow label="Tần suất Tóm tắt Tự động" description="AI tóm tắt bối cảnh sau mỗi X lượt.">
                            <NumberInput value={settings.autoSummaryFrequency} onChange={e => onChange('autoSummaryFrequency', parseInt(e.target.value))} min={1} />
                        </SettingsRow>
                    </SettingsSection>
                </div>
            )}
        </div>

        <div className="flex justify-center items-center gap-4 mt-10">
            <button 
                onClick={onBack} 
                className="px-5 py-3 bg-gray-800/80 text-white font-bold rounded-lg hover:bg-gray-700/80 transition-colors duration-300 transform hover:scale-105 shadow-lg shadow-black/30"
                title="Quay Lại"
            >
                <FaArrowLeft className="w-5 h-5" />
            </button>
            <button onClick={handleSaveSettings} className="px-8 py-3 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 transition-colors duration-300 transform hover:scale-105 shadow-lg shadow-black/30">
                Lưu Cài Đặt
            </button>
        </div>
    </div>
  );
};

export default SettingsPanel;