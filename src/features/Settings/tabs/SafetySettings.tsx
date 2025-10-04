

import React, { memo } from 'react';
import type { GameSettings, SafetyLevel } from '../../../types';
import { SAFETY_LEVELS, SAFETY_CATEGORIES } from '../../../constants';
import { FaFire } from 'react-icons/fa';

interface SettingsSectionProps {
    title: string;
    children: React.ReactNode;
}
const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <section className="mb-10">
    <h3 className="text-xl font-bold font-title mb-4 pb-2 border-b border-[var(--shadow-light)]" style={{color: 'var(--text-color)'}}>{title}</h3>
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
  <div className={`neumorphic-inset-box p-4 flex flex-col md:flex-row gap-4 items-start ${disabled ? 'opacity-50' : ''}`}>
    <div className="md:w-1/3 flex-shrink-0">
      <label className="block font-semibold" style={{color: 'var(--text-color)'}}>{label}</label>
      <p className="text-sm mt-1" style={{color: 'var(--text-muted-color)'}}>{description}</p>
    </div>
    <div className="md:w-2/3">{children}</div>
  </div>
);

interface SafetySettingsProps {
    settings: GameSettings;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
}

const SafetySettingsTab: React.FC<SafetySettingsProps> = ({ settings, handleSettingChange }) => {
    return (
        <SettingsSection title="Cài Đặt An Toàn AI">
            <SettingsRow label="Bật Chế Độ NSFW (18+)" description="Kích hoạt chế độ NSFW. Khi bật, AI sẽ tạo ra nội dung người lớn chi tiết, không che đậy và bỏ qua tất cả các bộ lọc an toàn khác.">
                <div className="flex flex-col">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.enableNsfwMode} onChange={e => handleSettingChange('enableNsfwMode', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                        <span className="ml-3 text-sm font-bold text-red-400 flex items-center gap-2"><FaFire /> Bật chế độ 18+</span>
                    </label>
                    {settings.enableNsfwMode && (
                         <div className="mt-2 text-xs p-2 rounded-md" style={{background: 'rgba(var(--error-color-rgb), 0.1)', border: '1px solid rgba(var(--error-color-rgb), 0.5)', color: 'var(--error-color)'}}>
                            <strong>CẢNH BÁO TUYỆT ĐỐI:</strong> Bạn đã bật chế độ 18+. Khi được kích hoạt, AI sẽ được chỉ thị để tạo ra các nội dung người lớn một cách cực kỳ chi tiết và không bị kiểm duyệt, bao gồm nhưng không giới hạn ở:
                            <ul className="list-disc list-inside pl-2 mt-1">
                                <li><strong>Bạo lực cực đoan:</strong> Mô tả chân thực máu me, nội tạng, tra tấn và cái chết tàn bạo.</li>
                                <li><strong>Nội dung tình dục chi tiết:</strong> Mô tả thẳng thắn và không che đậy các hành vi giao hợp, các bộ phận sinh dục, và các chủ đề tình dục cực đoan (bao gồm cả bạo lực tình dục nếu phù hợp với bối cảnh hắc ám).</li>
                                <li><strong>Kinh dị tâm lý & thể xác:</strong> Các chủ đề về sự điên loạn, biến đổi cơ thể ghê rợn và nỗi kinh hoàng vũ trụ.</li>
                            </ul>
                            Tất cả các bộ lọc an toàn khác sẽ bị vô hiệu hóa hoàn toàn. Hãy chắc chắn rằng bạn đã sẵn sàng cho một trải nghiệm không khoan nhượng.
                        </div>
                    )}
                </div>
            </SettingsRow>
            <SettingsRow label="Công tắc an toàn chính" description="Tắt tùy chọn này sẽ bỏ qua tất cả các bộ lọc an toàn. Chỉ nên tắt nếu bạn hiểu rõ rủi ro." disabled={settings.enableNsfwMode}>
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.masterSafetySwitch} onChange={e => handleSettingChange('masterSafetySwitch', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" disabled={settings.enableNsfwMode}/>
                    <span className="ml-3 text-sm" style={{color: 'var(--text-color)'}}>Bật bộ lọc an toàn</span>
                </label>
            </SettingsRow>
            {settings.masterSafetySwitch && SAFETY_CATEGORIES.map(category => (
                <SettingsRow key={category.id} label={category.name} description={`Chặn các nội dung liên quan đến ${category.name.toLowerCase()}.`} disabled={settings.enableNsfwMode}>
                     <select 
                        className="input-neumorphic w-full" 
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
    );
};

export default memo(SafetySettingsTab);