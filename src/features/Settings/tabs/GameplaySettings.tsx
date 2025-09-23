import React, { memo } from 'react';
import type { GameSettings, AiCreativityLevel, NarrativePacing, PlayerAgencyLevel, AiMemoryDepth, NpcComplexity, WorldEventFrequency, WorldReactivity, DeathPenalty, ValidationServiceCap } from '../../../types';
import {
    AI_CREATIVITY_LEVELS, NARRATIVE_PACING_LEVELS, PLAYER_AGENCY_LEVELS, AI_MEMORY_DEPTH_LEVELS,
    NPC_COMPLEXITY_LEVELS, WORLD_EVENT_FREQUENCY_LEVELS, WORLD_REACTIVITY_LEVELS,
    DEATH_PENALTY_LEVELS, VALIDATION_CAP_LEVELS
} from '../../../constants';

interface SettingsSectionProps {
    title: string;
    children: React.ReactNode;
}
const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <section className="settings-section">
    <h3 className="settings-section-title">{title}</h3>
    <div className="space-y-6">{children}</div>
  </section>
);

interface SettingsRowProps {
    label: string;
    description: string;
    children: React.ReactNode;
    disabled?: boolean;
}
const SettingsRow: React.FC<SettingsRowProps> = ({ label, description, children, disabled = false }) => (
  <div className={`settings-row ${disabled ? 'opacity-50' : ''}`}>
    <div className="settings-row-label">
      <label>{label}</label>
      <p>{description}</p>
    </div>
    <div className="settings-row-control">{children}</div>
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


interface GameplaySettingsProps {
    settings: GameSettings;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
}

const GameplaySettings: React.FC<GameplaySettingsProps> = ({ settings, handleSettingChange }) => {
    return (
        <>
            <SettingsSection title="AI & Tường Thuật">
                <SettingsRow label="Mức Độ Sáng Tạo của AI" description={AI_CREATIVITY_LEVELS.find(o => o.value === settings.aiCreativityLevel)?.description || ''}>
                    <LevelButtonGroup options={AI_CREATIVITY_LEVELS} selectedValue={settings.aiCreativityLevel} onSelect={(v) => handleSettingChange('aiCreativityLevel', v as AiCreativityLevel)} />
                </SettingsRow>
                <SettingsRow label="Nhịp Độ Tường Thuật" description={NARRATIVE_PACING_LEVELS.find(o => o.value === settings.narrativePacing)?.description || ''}>
                     <LevelButtonGroup options={NARRATIVE_PACING_LEVELS} selectedValue={settings.narrativePacing} onSelect={(v) => handleSettingChange('narrativePacing', v as NarrativePacing)} />
                </SettingsRow>
                 <SettingsRow label="Quyền Tự Quyết của Người Chơi" description={PLAYER_AGENCY_LEVELS.find(o => o.value === settings.playerAgencyLevel)?.description || ''}>
                     <LevelButtonGroup options={PLAYER_AGENCY_LEVELS} selectedValue={settings.playerAgencyLevel} onSelect={(v) => handleSettingChange('playerAgencyLevel', v as PlayerAgencyLevel)} />
                </SettingsRow>
                 <SettingsRow label="Độ Sâu Ký Ức AI" description={AI_MEMORY_DEPTH_LEVELS.find(o => o.value === settings.aiMemoryDepth)?.description || ''}>
                     <LevelButtonGroup options={AI_MEMORY_DEPTH_LEVELS} selectedValue={settings.aiMemoryDepth} onSelect={(v) => handleSettingChange('aiMemoryDepth', v as AiMemoryDepth)} />
                </SettingsRow>
            </SettingsSection>

            <SettingsSection title="Mô Phỏng Thế Giới">
                <SettingsRow label="Độ Phức Tạp của NPC" description={NPC_COMPLEXITY_LEVELS.find(o => o.value === settings.npcComplexity)?.description || ''}>
                    <LevelButtonGroup options={NPC_COMPLEXITY_LEVELS} selectedValue={settings.npcComplexity} onSelect={(v) => handleSettingChange('npcComplexity', v as NpcComplexity)} />
                </SettingsRow>
                <SettingsRow label="Tần Suất Sự Kiện Thế Giới" description="Điều chỉnh tần suất các sự kiện động ngẫu nhiên xảy ra.">
                    <div className="themed-button-group">
                        {WORLD_EVENT_FREQUENCY_LEVELS.map(level => (
                            <button key={level.value} className={settings.worldEventFrequency === level.value ? 'active' : ''} onClick={() => handleSettingChange('worldEventFrequency', level.value)}>{level.label}</button>
                        ))}
                    </div>
                </SettingsRow>
                <SettingsRow label="Mức Độ Phản Ứng của Thế Giới" description={WORLD_REACTIVITY_LEVELS.find(o => o.value === settings.worldReactivity)?.description || ''}>
                    <LevelButtonGroup options={WORLD_REACTIVITY_LEVELS} selectedValue={settings.worldReactivity} onSelect={(v) => handleSettingChange('worldReactivity', v as WorldReactivity)} />
                </SettingsRow>
            </SettingsSection>

            <SettingsSection title="Cơ Chế Game & Nhân Vật">
                <SettingsRow label="Tỷ Lệ Tu Vi Nhận Được" description="Điều chỉnh lượng tu vi nhận được từ mọi nguồn.">
                    <div className="flex items-center gap-4">
                        <input type="range" min="50" max="300" step="10" value={settings.cultivationRateMultiplier} onChange={(e) => handleSettingChange('cultivationRateMultiplier', parseInt(e.target.value))} className="themed-slider flex-grow" />
                        <span className="themed-slider-value">{settings.cultivationRateMultiplier}%</span>
                    </div>
                </SettingsRow>
                <SettingsRow label="Tỷ Lệ Thu Thập Tài Nguyên" description="Điều chỉnh số lượng tài nguyên thu thập được.">
                    <div className="flex items-center gap-4">
                        <input type="range" min="50" max="300" step="10" value={settings.resourceRateMultiplier} onChange={(e) => handleSettingChange('resourceRateMultiplier', parseInt(e.target.value))} className="themed-slider flex-grow" />
                        <span className="themed-slider-value">{settings.resourceRateMultiplier}%</span>
                    </div>
                </SettingsRow>
                 <SettingsRow label="Sát Thương Gây Ra" description="Điều chỉnh sát thương bạn gây ra cho kẻ địch.">
                    <div className="flex items-center gap-4">
                        <input type="range" min="50" max="200" step="10" value={settings.damageDealtMultiplier} onChange={(e) => handleSettingChange('damageDealtMultiplier', parseInt(e.target.value))} className="themed-slider flex-grow" />
                        <span className="themed-slider-value">{settings.damageDealtMultiplier}%</span>
                    </div>
                </SettingsRow>
                 <SettingsRow label="Sát Thương Nhận Vào" description="Điều chỉnh sát thương bạn nhận vào từ kẻ địch.">
                    <div className="flex items-center gap-4">
                        <input type="range" min="50" max="200" step="10" value={settings.damageTakenMultiplier} onChange={(e) => handleSettingChange('damageTakenMultiplier', parseInt(e.target.value))} className="themed-slider flex-grow" />
                        <span className="themed-slider-value">{settings.damageTakenMultiplier}%</span>
                    </div>
                </SettingsRow>
                 <SettingsRow label="Bật Cơ Chế Sinh Tồn" description="Bật hoặc tắt hoàn toàn nhu cầu về đói, khát.">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.enableSurvivalMechanics} onChange={e => handleSettingChange('enableSurvivalMechanics', e.target.checked)} className="themed-checkbox" />
                        <span className="ml-3 text-sm text-gray-300">Bật đói và khát</span>
                    </label>
                </SettingsRow>
                <SettingsRow label="Hình Phạt Khi Tử Vong" description={DEATH_PENALTY_LEVELS.find(o => o.value === settings.deathPenalty)?.description || ''}>
                     <LevelButtonGroup options={DEATH_PENALTY_LEVELS} selectedValue={settings.deathPenalty} onSelect={(v) => handleSettingChange('deathPenalty', v as DeathPenalty)} />
                </SettingsRow>
                 <SettingsRow label="Giới Hạn của 'Thiên Đạo Giám Sát'" description={VALIDATION_CAP_LEVELS.find(o => o.value === settings.validationServiceCap)?.description || ''}>
                     <LevelButtonGroup options={VALIDATION_CAP_LEVELS} selectedValue={settings.validationServiceCap} onSelect={(v) => handleSettingChange('validationServiceCap', v as ValidationServiceCap)} />
                </SettingsRow>
            </SettingsSection>
        </>
    );
};

export default memo(GameplaySettings);
