import React, { memo } from 'react';
import type { GameSettings } from '../../../types';
import { LAYOUT_MODES, THEME_OPTIONS, FONT_OPTIONS, DYNAMIC_BACKGROUND_OPTIONS } from '../../../constants';
// FIX: Fix import path for `useAppContext` to point to the correct module.
import { useAppContext } from '../../../contexts/useAppContext';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { FaCheckCircle, FaExclamationTriangle, FaCrown } from 'react-icons/fa';

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

interface InterfaceSettingsProps {
    settings: GameSettings;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
}

const customColorVariables = [
    { key: '--bg-color', label: 'Màu Nền Chính' },
    { key: '--text-color', label: 'Màu Chữ Chính' },
    { key: '--text-muted-color', label: 'Màu Chữ Phụ' },
    { key: '--primary-accent-color', label: 'Màu Nhấn Chính' },
    { key: '--primary-accent-text-color', label: 'Màu Chữ Trên Nền Nhấn' },
    { key: '--secondary-accent-color', label: 'Màu Nhấn Phụ' },
    { key: '--panel-border-color', label: 'Màu Viền Panel' },
    { key: '--input-focus-ring-color', label: 'Màu Viền Focus' },
    { key: '--shadow-light', label: 'Màu Đổ Bóng Sáng' },
    { key: '--shadow-dark', label: 'Màu Đổ Bóng Tối' },
];

const InterfaceSettings: React.FC<InterfaceSettingsProps> = ({ settings, handleSettingChange }) => {
    const { state, handleDynamicBackgroundChange } = useAppContext();
    const backgroundStatus = state.backgrounds.status;

    return (
        <>
            <SettingsSection title="Giao Diện & Hiển Thị">
                <SettingsRow label="Chế độ hiển thị" description="Tự động phát hiện hoặc ép hiển thị theo giao diện máy tính/di động.">
                    <div className="flex items-center p-1 rounded-lg w-full" style={{boxShadow: 'var(--shadow-pressed)'}}>
                        {LAYOUT_MODES.map(mode => (
                            <button key={mode.value} className={`w-full text-center py-1.5 px-2 text-sm rounded-md transition-colors duration-200 font-semibold hover:bg-[var(--shadow-light)]/50 hover:text-[var(--text-color)] ${settings.layoutMode === mode.value ? 'bg-[var(--shadow-light)] text-[var(--text-color)]' : 'text-[var(--text-muted-color)]'}`} onClick={() => handleSettingChange('layoutMode', mode.value)}>{mode.label}</button>
                        ))}
                    </div>
                </SettingsRow>
                 <SettingsRow label="Chủ đề (Theme)" description="Thay đổi giao diện sáng/tối và bảng màu tổng thể.">
                    <select className="input-neumorphic w-full" value={settings.theme} onChange={(e) => handleSettingChange('theme', e.target.value)}>
                        {THEME_OPTIONS.map(theme => {
                            const isPremium = theme.premium && !settings.isPremium;
                            return (
                                <option key={theme.value} value={theme.value} disabled={isPremium} className={isPremium ? 'text-gray-500' : ''}>
                                    {theme.label} {isPremium ? '👑' : ''}
                                </option>
                            );
                        })}
                    </select>
                </SettingsRow>
                 <SettingsRow label="Font chữ" description="Thay đổi font chữ chính của trò chơi.">
                     <select className="input-neumorphic w-full" value={settings.fontFamily} onChange={(e) => handleSettingChange('fontFamily', e.target.value)}>
                        {FONT_OPTIONS.map(font => (
                            <option key={font.value} value={font.value} style={{fontFamily: font.value}}>{font.label}</option>
                        ))}
                    </select>
                </SettingsRow>
                 <SettingsRow label="Cỡ chữ / Độ phóng to" description="Điều chỉnh kích thước chữ và giao diện tổng thể.">
                    <div className="flex items-center gap-4">
                       <input type="range" min="40" max="200" step="5" value={settings.zoomLevel} onChange={(e) => handleSettingChange('zoomLevel', parseInt(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer flex-grow" />
                       <span className="font-mono text-sm neumorphic-inset-box px-3 py-1 text-[var(--text-color)] w-20 text-center">{settings.zoomLevel}%</span>
                    </div>
                </SettingsRow>
                 <SettingsRow label="Màu chữ chính" description="Chọn màu sắc cho các đoạn văn tường thuật chính.">
                    <input type="color" value={settings.textColor} onChange={(e) => handleSettingChange('textColor', e.target.value)} className="input-neumorphic h-10 w-full p-1 cursor-pointer" />
                </SettingsRow>
            </SettingsSection>

            {settings.theme === 'theme-custom' && (
                <SettingsSection title="Tùy Chỉnh Theme">
                    <SettingsRow label="Bảng Màu" description="Chọn màu sắc cho các thành phần giao diện. Thay đổi sẽ được áp dụng ngay lập tức.">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {customColorVariables.map(({ key, label }) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium mb-1 text-gray-400">{label}</label>
                                    <input
                                      type="color"
                                      value={settings.customThemeColors[key] || '#000000'}
                                      onChange={e => {
                                        const newColors = { ...settings.customThemeColors, [key]: e.target.value };
                                        handleSettingChange('customThemeColors', newColors);
                                      }}
                                      className="input-neumorphic h-10 w-full p-1 cursor-pointer"
                                    />
                                </div>
                            ))}
                        </div>
                    </SettingsRow>
                </SettingsSection>
            )}

            <SettingsSection title="Hình Nền Động (AI Tạo)">
                <SettingsRow label="Chọn hình nền" description="Chọn một chủ đề, AI sẽ tạo hình nền độc nhất cho bạn và lưu lại. Quá trình này có thể mất một chút thời gian.">
                     <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {DYNAMIC_BACKGROUND_OPTIONS.map(bg => {
                            const status = backgroundStatus[bg.id];
                            return (
                                <button 
                                    key={bg.id} 
                                    onClick={() => handleDynamicBackgroundChange(bg.id)}
                                    className={`aspect-video rounded-md overflow-hidden border-2 transition-all duration-200 relative flex items-center justify-center
                                        ${settings.dynamicBackground === bg.id 
                                            ? 'border-[var(--primary-accent-color)] ring-2 ring-[var(--primary-accent-color)]/50' 
                                            : 'border-[var(--shadow-light)] hover:border-[var(--primary-accent-color)]/50'
                                        }`}
                                >
                                    <div className={`absolute inset-0 ${bg.thumbnailClass}`}></div>
                                    <div className="absolute inset-0 bg-black/40"></div>
                                    <span className="relative text-white font-bold text-sm bg-black/50 px-2 py-1 rounded-md z-10">{bg.name}</span>
                                    {status === 'loading' && (
                                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
                                            <LoadingSpinner size="sm"/>
                                        </div>
                                    )}
                                    {status === 'loaded' && bg.id !== 'none' && (
                                        <div className="absolute top-1 right-1 text-green-400 z-20">
                                            <FaCheckCircle />
                                        </div>
                                    )}
                                    {status === 'error' && (
                                        <div className="absolute top-1 right-1 text-red-400 z-20" title="Tạo ảnh thất bại">
                                            <FaExclamationTriangle />
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </SettingsRow>
            </SettingsSection>
        </>
    );
};

export default memo(InterfaceSettings);