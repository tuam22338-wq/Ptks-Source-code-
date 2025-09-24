import React, { memo } from 'react';
import type { GameSettings, DeathPenalty, ValidationServiceCap } from '../../../types';
import { DEATH_PENALTY_LEVELS, VALIDATION_CAP_LEVELS } from '../../../constants';

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


interface GameplaySettingsProps {
    settings: GameSettings;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
}

const GameplaySettings: React.FC<GameplaySettingsProps> = ({ settings, handleSettingChange }) => {
    return (
        <>
            <SettingsSection title="Cơ Chế Game & Nhân Vật">
                <SettingsRow label="Tỷ Lệ Tu Vi Nhận Được" description="Điều chỉnh lượng tu vi nhận được từ mọi nguồn.">
                    <div className="flex items-center gap-4">
                        <input type="range" min="50" max="300" step="10" value={settings.cultivationRateMultiplier} onChange={(e) => handleSettingChange('cultivationRateMultiplier', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                        <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.cultivationRateMultiplier}%</span>
                    </div>
                </SettingsRow>
                <SettingsRow label="Tỷ Lệ Thu Thập Tài Nguyên" description="Điều chỉnh số lượng tài nguyên thu thập được.">
                    <div className="flex items-center gap-4">
                        <input type="range" min="50" max="300" step="10" value={settings.resourceRateMultiplier} onChange={(e) => handleSettingChange('resourceRateMultiplier', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                        <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.resourceRateMultiplier}%</span>
                    </div>
                </SettingsRow>
                 <SettingsRow label="Sát Thương Gây Ra" description="Điều chỉnh sát thương bạn gây ra cho kẻ địch.">
                    <div className="flex items-center gap-4">
                        <input type="range" min="50" max="200" step="10" value={settings.damageDealtMultiplier} onChange={(e) => handleSettingChange('damageDealtMultiplier', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                        <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.damageDealtMultiplier}%</span>
                    </div>
                </SettingsRow>
                 <SettingsRow label="Sát Thương Nhận Vào" description="Điều chỉnh sát thương bạn nhận vào từ kẻ địch.">
                    <div className="flex items-center gap-4">
                        <input type="range" min="50" max="200" step="10" value={settings.damageTakenMultiplier} onChange={(e) => handleSettingChange('damageTakenMultiplier', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                        <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.damageTakenMultiplier}%</span>
                    </div>
                </SettingsRow>
                 <SettingsRow label="Bật Cơ Chế Sinh Tồn" description="Bật hoặc tắt hoàn toàn nhu cầu về đói, khát.">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.enableSurvivalMechanics} onChange={e => handleSettingChange('enableSurvivalMechanics', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
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