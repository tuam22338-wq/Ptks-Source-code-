import React, { memo, useRef } from 'react';
// FIX: Import 'NarrativeStyle' to resolve TypeScript error.
import type { GameSettings, AiCreativityLevel, NarrativePacing, PlayerAgencyLevel, AiMemoryDepth, NpcComplexity, WorldEventFrequency, WorldReactivity, NarrativeStyle } from '../../../types';
import { FaDownload, FaUpload } from 'react-icons/fa';
import {
    AI_CREATIVITY_LEVELS, NARRATIVE_PACING_LEVELS, PLAYER_AGENCY_LEVELS, AI_MEMORY_DEPTH_LEVELS,
    NPC_COMPLEXITY_LEVELS, WORLD_EVENT_FREQUENCY_LEVELS, WORLD_REACTIVITY_LEVELS, NARRATIVE_STYLES
} from '../../../constants';

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

const LevelButtonGroup = <T extends string>({
  options,
  selectedValue,
  onSelect,
}: {
  options: { value: T; label: string; description: string }[];
  selectedValue: T;
  onSelect: (value: T) => void;
}) => (
    <div className="flex flex-col gap-3">
        {options.map(opt => (
            <button
                key={opt.value}
                onClick={() => onSelect(opt.value)}
                className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                    selectedValue === opt.value
                        ? 'border-teal-500 bg-teal-500/10'
                        : 'bg-black/20 border-gray-700 hover:border-gray-500'
                }`}
            >
                <div className="font-bold text-md text-white">{opt.label}</div>
                <p className="text-sm text-gray-400 mt-1">{opt.description}</p>
            </button>
        ))}
    </div>
);

interface AiCustomizationSettingsProps {
    settings: GameSettings;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
}

const AiCustomizationSettings: React.FC<AiCustomizationSettingsProps> = ({ settings, handleSettingChange }) => {
    return (
        <>
            <SettingsSection title="Phong Cách Tường Thuật">
                 <SettingsRow label="Phong Cách Tường Thuật" description="Chọn văn phong và giọng điệu cho AI kể chuyện, hỗ trợ nhiều thể loại từ tiên hiệp đến khoa-fi.">
                    <select 
                        className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 pr-8 appearance-none" 
                        value={settings.narrativeStyle} 
                        onChange={(e) => handleSettingChange('narrativeStyle', e.target.value as NarrativeStyle)}
                    >
                        {NARRATIVE_STYLES.map(style => (
                            <option key={style.value} value={style.value}>{style.label}</option>
                        ))}
                    </select>
                </SettingsRow>
                <SettingsRow label="Mức Độ Sáng Tạo của AI" description={AI_CREATIVITY_LEVELS.find(o => o.value === settings.aiCreativityLevel)?.description || ''}>
                    <LevelButtonGroup options={AI_CREATIVITY_LEVELS} selectedValue={settings.aiCreativityLevel} onSelect={(v) => handleSettingChange('aiCreativityLevel', v as AiCreativityLevel)} />
                </SettingsRow>
                <SettingsRow label="Nhịp Độ Tường Thuật" description={NARRATIVE_PACING_LEVELS.find(o => o.value === settings.narrativePacing)?.description || ''}>
                     <LevelButtonGroup options={NARRATIVE_PACING_LEVELS} selectedValue={settings.narrativePacing} onSelect={(v) => handleSettingChange('narrativePacing', v as NarrativePacing)} />
                </SettingsRow>
                <SettingsRow label="Độ dài Phản hồi AI (Số từ)" description="Đặt độ dài gần đúng cho mỗi phản hồi tường thuật của AI.">
                    <div className="flex items-center gap-4">
                        <input type="range" min="100" max="5000" step="100" value={settings.aiResponseWordCount} onChange={(e) => handleSettingChange('aiResponseWordCount', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                        <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.aiResponseWordCount}</span>
                    </div>
                </SettingsRow>
                <SettingsRow label="Độ dài Phản hồi Game Master" description="Đặt độ dài mong muốn cho mỗi phản hồi của Game Master AI khi trò chuyện để tạo thế giới (1,000 - 100,000 từ).">
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="1000"
                            max="100000"
                            step="1000"
                            value={settings.gameMasterWordCount}
                            onChange={(e) => handleSettingChange('gameMasterWordCount', parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow"
                        />
                        <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-24 text-center">{settings.gameMasterWordCount}</span>
                    </div>
                </SettingsRow>
                <SettingsRow label="Bật Google Grounding (Thử nghiệm)" description="Cho phép Game Master AI sử dụng Google Search để có thông tin mới và chính xác hơn. Có thể làm thay đổi văn phong của AI.">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.enableGoogleGrounding} onChange={e => handleSettingChange('enableGoogleGrounding', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                        <span className="ml-3 text-sm text-gray-300">Sử dụng Google Search để trả lời</span>
                    </label>
                </SettingsRow>
                 <SettingsRow label="Quyền Tự Quyết của Người Chơi" description={PLAYER_AGENCY_LEVELS.find(o => o.value === settings.playerAgencyLevel)?.description || ''}>
                     <LevelButtonGroup options={PLAYER_AGENCY_LEVELS} selectedValue={settings.playerAgencyLevel} onSelect={(v) => handleSettingChange('playerAgencyLevel', v as PlayerAgencyLevel)} />
                </SettingsRow>
                 <SettingsRow label="Độ Sâu Ký Ức AI" description={AI_MEMORY_DEPTH_LEVELS.find(o => o.value === settings.aiMemoryDepth)?.description || ''}>
                     <LevelButtonGroup options={AI_MEMORY_DEPTH_LEVELS} selectedValue={settings.aiMemoryDepth} onSelect={(v) => handleSettingChange('aiMemoryDepth', v as AiMemoryDepth)} />
                </SettingsRow>
                <SettingsRow label="AI Tường thuật Thay đổi Hệ thống" description="Khi bật, AI sẽ mô tả các thay đổi về chỉ số, vật phẩm nhận được... ngay trong lời kể để tăng tính nhập vai.">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.narrateSystemChanges} onChange={e => handleSettingChange('narrateSystemChanges', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                        <span className="ml-3 text-sm text-gray-300">Bật tường thuật cơ chế game</span>
                    </label>
                </SettingsRow>
            </SettingsSection>
            
            <SettingsSection title="Thông số Kỹ thuật Model">
                <SettingsRow label="Nhiệt độ (Temperature)" description="Kiểm soát mức độ sáng tạo/ngẫu nhiên của AI. Giá trị cao hơn (vd: 1.2) cho kết quả đa dạng, giá trị thấp hơn (vd: 0.7) cho kết quả nhất quán hơn.">
                    <div className="flex items-center gap-4">
                        <input type="range" min="0" max="2" step="0.1" value={settings.temperature} onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                        <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.temperature.toFixed(1)}</span>
                    </div>
                </SettingsRow>
                <SettingsRow label="Top-K" description="Giới hạn số lượng token có khả năng cao nhất mà AI xem xét ở mỗi bước. Giá trị thấp hơn làm cho AI bớt ngẫu nhiên.">
                    <div className="flex items-center gap-4">
                        <input type="range" min="1" max="128" step="1" value={settings.topK} onChange={(e) => handleSettingChange('topK', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                        <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.topK}</span>
                    </div>
                </SettingsRow>
                <SettingsRow label="Top-P" description="Chọn các token có xác suất tích lũy đạt đến một ngưỡng nhất định. Kiểm soát sự đa dạng của phản hồi.">
                    <div className="flex items-center gap-4">
                        <input type="range" min="0" max="1" step="0.05" value={settings.topP} onChange={(e) => handleSettingChange('topP', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                        <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.topP.toFixed(2)}</span>
                    </div>
                </SettingsRow>
                <SettingsRow label="Bật 'Suy Nghĩ' (Thinking)" description="Cho phép model suy nghĩ trước khi trả lời để có chất lượng cao hơn (chỉ cho gemini-2.5-flash). Tắt có thể giảm độ trễ.">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.enableThinking} onChange={e => handleSettingChange('enableThinking', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                        <span className="ml-3 text-sm text-gray-300">Bật Thinking</span>
                    </label>
                </SettingsRow>
                <SettingsRow label="Ngân sách 'Suy Nghĩ' (Thinking Budget)" description="Lượng token tối đa mà model có thể dùng để 'suy nghĩ'. Giá trị cao hơn có thể cải thiện chất lượng nhưng tăng độ trễ. Đặt là 0 để tắt." disabled={!settings.enableThinking}>
                    <div className="flex items-center gap-4">
                        <input type="range" min="0" max="2000" step="50" value={settings.thinkingBudget} onChange={(e) => handleSettingChange('thinkingBudget', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" disabled={!settings.enableThinking}/>
                        <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.thinkingBudget}</span>
                    </div>
                </SettingsRow>
            </SettingsSection>
            
            <SettingsSection title="Mô Phỏng Thế Giới">
                <SettingsRow label="Độ Phức Tạp của NPC" description={NPC_COMPLEXITY_LEVELS.find(o => o.value === settings.npcComplexity)?.description || ''}>
                    <LevelButtonGroup options={NPC_COMPLEXITY_LEVELS} selectedValue={settings.npcComplexity} onSelect={(v) => handleSettingChange('npcComplexity', v as NpcComplexity)} />
                </SettingsRow>
                <SettingsRow label="Tần Suất Sự Kiện Thế Giới" description="Điều chỉnh tần suất các sự kiện động ngẫu nhiên xảy ra.">
                    <div className="flex items-center p-1 bg-black/30 rounded-lg border border-gray-700/60 w-full">
                        {WORLD_EVENT_FREQUENCY_LEVELS.map(level => (
                            <button key={level.value} className={`w-full text-center py-1.5 px-2 text-sm text-gray-400 rounded-md transition-colors duration-200 font-semibold hover:bg-gray-700/50 hover:text-white ${settings.worldEventFrequency === level.value ? 'bg-gray-600 text-white shadow-inner' : ''}`} onClick={() => handleSettingChange('worldEventFrequency', level.value)}>{level.label}</button>
                        ))}
                    </div>
                </SettingsRow>
                <SettingsRow label="Mức Độ Phản Ứng của Thế Giới" description={WORLD_REACTIVITY_LEVELS.find(o => o.value === settings.worldReactivity)?.description || ''}>
                    <LevelButtonGroup options={WORLD_REACTIVITY_LEVELS} selectedValue={settings.worldReactivity} onSelect={(v) => handleSettingChange('worldReactivity', v as WorldReactivity)} />
                </SettingsRow>
            </SettingsSection>
        </>
    );
};

export default memo(AiCustomizationSettings);
