import React, { memo, useState } from 'react';
import type { GameSettings, AssignableModel } from '../../../types';
import { AI_MODELS, IMAGE_AI_MODELS, RAG_EMBEDDING_MODELS } from '../../../constants';
import { FaKey, FaPlus, FaTrash, FaCrown } from 'react-icons/fa';

interface SettingsSectionProps {
    title: string;
    children: React.ReactNode;
}
const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <section className="mb-10">
    <h3 className="text-xl font-bold font-title mb-4 pb-2 border-b border-gray-600/50 text-gray-300">{title}</h3>
    <div className="space-y-4">{children}</div>
  </section>
);

interface SettingsRowProps {
    label: string;
    description: string;
    children: React.ReactNode;
    disabled?: boolean;
}
const SettingsRow: React.FC<SettingsRowProps> = ({ label, description, children, disabled = false }) => (
  <div className={`bg-black/10 p-4 rounded-lg border border-gray-800/50 flex flex-col md:flex-row gap-4 items-start ${disabled ? 'opacity-50' : ''}`}>
    <div className="md:w-1/3 flex-shrink-0">
      <label className="block font-semibold text-gray-200">{label}</label>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
    <div className="md:w-2/3">{children}</div>
  </div>
);

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
    { id: 'ragEmbeddingModel', label: 'Model Embedding RAG', description: 'Model dùng để vector hóa văn bản cho RAG.', modelType: 'rag' },
    { id: 'ragOrchestratorModel', label: 'Model Điều Phối RAG', description: 'Model dùng để phân tích ý định và chọn nguồn tri thức.', modelType: 'text' },
    { id: 'memorySynthesisModel', label: 'Model Tổng Hợp Ký Ức', description: 'Model dùng để tổng hợp ký ức thành báo cáo ngắn gọn.', modelType: 'text' },
    { id: 'narrativeHarmonizerModel', label: 'Model Hài hòa Tường thuật', description: 'Model siêu nhanh, dùng để sửa lại văn bản cho khớp với cơ chế game.', modelType: 'text' },
];

interface AiModelSettingsProps {
    settings: GameSettings;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
}

const AiModelSettings: React.FC<AiModelSettingsProps> = ({ settings, handleSettingChange }) => {
    const [newApiKey, setNewApiKey] = useState('');

    const handleAddApiKey = () => {
        if (newApiKey.trim() && !settings.apiKeys.includes(newApiKey.trim())) {
            handleSettingChange('apiKeys', [...settings.apiKeys, newApiKey.trim()]);
            setNewApiKey('');
        }
    };

    const handleRemoveApiKey = (keyToRemove: string) => {
        handleSettingChange('apiKeys', settings.apiKeys.filter(key => key !== keyToRemove));
    };

    return (
        <SettingsSection title="AI & Models">
            <SettingsRow label="Tự động xoay vòng Model" description="Khi bật, nếu Model được chọn (vd: Flash) hết hạn ngạch, hệ thống sẽ tự động thử lại với model mạnh hơn (vd: Pro) để đảm bảo trò chơi không bị gián đoạn.">
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.enableAutomaticModelRotation} onChange={e => handleSettingChange('enableAutomaticModelRotation', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                    <span className="ml-3 text-sm text-gray-300">Bật tự động xoay vòng Model</span>
                </label>
            </SettingsRow>
            <SettingsRow label="Quản lý API Keys" description="Thêm một hoặc nhiều Google Gemini API Key. Hệ thống sẽ tự động xoay vòng và thử lại khi một key hết hạn ngạch hoặc gặp lỗi.">
                <div>
                    {settings.apiKeys.map(key => (
                        <div key={key} className="flex items-center gap-2 mb-2">
                            <FaKey className="text-gray-500" />
                            <input type="text" readOnly value={`••••••••${key.slice(-4)}`} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 flex-grow" />
                            <button onClick={() => handleRemoveApiKey(key)} className="p-2 text-gray-400 hover:text-red-400"><FaTrash /></button>
                        </div>
                    ))}
                    <div className="flex items-center gap-2 mt-2">
                        <input type="text" value={newApiKey} onChange={(e) => setNewApiKey(e.target.value)} placeholder="Dán API Key mới vào đây" className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 flex-grow" />
                        <button onClick={handleAddApiKey} className="p-2 text-gray-200 bg-gray-600 rounded-md hover:bg-gray-500"><FaPlus /></button>
                    </div>
                </div>
            </SettingsRow>
            <SettingsRow label="Phân công Model" description="Chọn Model và API Key cho từng tác vụ cụ thể để tối ưu hóa hiệu suất và quản lý hạn ngạch. 'Tự động' sẽ sử dụng cơ chế xoay vòng qua tất cả các key.">
                <div className="grid grid-cols-1 gap-4">
                    {modelConfigs.map(config => {
                        let modelsToShow = AI_MODELS;
                        if (config.modelType === 'text') {
                            modelsToShow = AI_MODELS.filter(m => settings.isPremium || m.value !== 'gemini-2.5-pro');
                        }

                        return (
                            <div key={config.id} className="p-3 bg-black/20 rounded-lg border border-gray-700/60">
                                <p className="font-semibold text-gray-300">{config.label}</p>
                                <p className="text-xs text-gray-500 mb-2">{config.description}</p>
                                <div className="flex items-center gap-2">
                                    <select 
                                        value={(settings as any)[config.id] || ''}
                                        onChange={e => handleSettingChange(config.id, e.target.value)}
                                        className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 pr-8 appearance-none flex-grow"
                                    >
                                        {config.modelType === 'image' ? IMAGE_AI_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>) :
                                         config.modelType === 'rag' ? RAG_EMBEDDING_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>) :
                                         modelsToShow.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                    <select 
                                        value={settings.modelApiKeyAssignments[config.id] || 'auto'}
                                        onChange={e => handleSettingChange('modelApiKeyAssignments', { ...settings.modelApiKeyAssignments, [config.id]: e.target.value })}
                                        className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 pr-8 appearance-none w-40"
                                    >
                                        <option value="auto">Tự động</option>
                                        {settings.apiKeys.map((key, index) => (
                                            <option key={key} value={key}>Key {index + 1} (...{key.slice(-4)})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </SettingsRow>
        </SettingsSection>
    );
};

export default memo(AiModelSettings);