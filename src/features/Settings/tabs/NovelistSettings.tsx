import React, { memo } from 'react';
import type { GameSettings, NarrativeStyle } from '../../../types';
import { AI_MODELS, NARRATIVE_STYLES } from '../../../constants';
import { FaCrown } from 'react-icons/fa';

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

interface NovelistSettingsProps {
    settings: GameSettings;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
}

const NovelistSettings: React.FC<NovelistSettingsProps> = ({ settings, handleSettingChange }) => {
    const novelistModels = AI_MODELS.filter(m => m.value === 'gemini-2.5-flash' || m.value === 'gemini-2.5-pro');

    return (
        <SettingsSection title="Cài Đặt Tiểu Thuyết Gia AI">
            <SettingsRow label="Model Sáng Tác" description="Chọn model AI để sử dụng cho việc viết tiểu thuyết. Model Pro cho chất lượng cao hơn nhưng yêu cầu Gói Đạo Tôn.">
                <select 
                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 pr-8 appearance-none" 
                    value={settings.novelistModel} 
                    onChange={(e) => handleSettingChange('novelistModel', e.target.value)}
                >
                    {novelistModels.map(model => {
                        const isPremium = model.value.includes('pro');
                        const isDisabled = isPremium && !settings.isPremium;
                        return (
                            <option key={model.value} value={model.value} disabled={isDisabled} className={isDisabled ? 'text-gray-500' : ''}>
                                {model.label} {isPremium ? '👑' : ''}
                            </option>
                        );
                    })}
                </select>
            </SettingsRow>
            <SettingsRow label="Văn Phong Tường Thuật" description="Chọn văn phong và giọng điệu cho AI, ảnh hưởng lớn đến kết quả sáng tác.">
                <select 
                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 pr-8 appearance-none" 
                    value={settings.novelistNarrativeStyle} 
                    onChange={(e) => handleSettingChange('novelistNarrativeStyle', e.target.value as NarrativeStyle)}
                >
                    {NARRATIVE_STYLES.map(style => (
                        <option key={style.value} value={style.value}>{style.label}</option>
                    ))}
                </select>
            </SettingsRow>
            <SettingsRow label="Độ dài mỗi chương (Số từ)" description="Đặt độ dài mong muốn cho mỗi lần AI viết tiếp câu chuyện.">
                <div className="flex items-center gap-4">
                    <input 
                        type="range" 
                        min="100" 
                        max="7000" 
                        step="100" 
                        value={settings.novelistWordCount} 
                        onChange={(e) => handleSettingChange('novelistWordCount', parseInt(e.target.value))} 
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" 
                    />
                    <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-24 text-center">{settings.novelistWordCount}</span>
                </div>
            </SettingsRow>
             <SettingsRow label="Nhiệt độ (Temperature)" description="Kiểm soát mức độ sáng tạo/ngẫu nhiên của AI. Giá trị cao hơn cho kết quả đa dạng, giá trị thấp hơn cho kết quả nhất quán hơn.">
                <div className="flex items-center gap-4">
                    <input type="range" min="0" max="2" step="0.1" value={settings.novelistTemperature} onChange={(e) => handleSettingChange('novelistTemperature', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                    <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.novelistTemperature.toFixed(1)}</span>
                </div>
            </SettingsRow>
            <SettingsRow label="Top-K" description="Giới hạn số lượng token có khả năng cao nhất mà AI xem xét ở mỗi bước.">
                <div className="flex items-center gap-4">
                    <input type="range" min="1" max="128" step="1" value={settings.novelistTopK} onChange={(e) => handleSettingChange('novelistTopK', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                    <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.novelistTopK}</span>
                </div>
            </SettingsRow>
            <SettingsRow label="Top-P" description="Chọn các token có xác suất tích lũy đạt đến một ngưỡng nhất định.">
                <div className="flex items-center gap-4">
                    <input type="range" min="0" max="1" step="0.05" value={settings.novelistTopP} onChange={(e) => handleSettingChange('novelistTopP', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                    <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.novelistTopP.toFixed(2)}</span>
                </div>
            </SettingsRow>
            <SettingsRow label="Bật 'Suy Nghĩ' (Thinking)" description="Cho phép model suy nghĩ trước khi trả lời để có chất lượng cao hơn (chỉ cho gemini-2.5-flash).">
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.novelistEnableThinking} onChange={e => handleSettingChange('novelistEnableThinking', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                    <span className="ml-3 text-sm text-gray-300">Bật Thinking</span>
                </label>
            </SettingsRow>
            <SettingsRow label="Ngân sách 'Suy Nghĩ' (Thinking Budget)" description="Lượng token tối đa mà model có thể dùng để 'suy nghĩ'. Giá trị cao hơn có thể cải thiện chất lượng nhưng tăng độ trễ." disabled={!settings.novelistEnableThinking}>
                <div className="flex items-center gap-4">
                    <input type="range" min="0" max="2000" step="50" value={settings.novelistThinkingBudget} onChange={(e) => handleSettingChange('novelistThinkingBudget', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" disabled={!settings.novelistEnableThinking}/>
                    <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.novelistThinkingBudget}</span>
                </div>
            </SettingsRow>
        </SettingsSection>
    );
};

export default memo(NovelistSettings);