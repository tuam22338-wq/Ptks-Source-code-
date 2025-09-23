import React, { memo } from 'react';
import type { GameSettings } from '../../../types';
import { LAYOUT_MODES, THEME_OPTIONS, FONT_OPTIONS, DYNAMIC_BACKGROUND_OPTIONS } from '../../../constants';

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

interface InterfaceSettingsProps {
    settings: GameSettings;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
}

const InterfaceSettings: React.FC<InterfaceSettingsProps> = ({ settings, handleSettingChange }) => {
    return (
        <>
            <SettingsSection title="Giao Diện & Hiển Thị">
                <SettingsRow label="Chế độ hiển thị" description="Tự động phát hiện hoặc ép hiển thị theo giao diện máy tính/di động.">
                    <div className="themed-button-group">
                        {LAYOUT_MODES.map(mode => (
                            <button key={mode.value} className={settings.layoutMode === mode.value ? 'active' : ''} onClick={() => handleSettingChange('layoutMode', mode.value)}>{mode.label}</button>
                        ))}
                    </div>
                </SettingsRow>
                 <SettingsRow label="Chủ đề (Theme)" description="Thay đổi giao diện sáng/tối và bảng màu tổng thể.">
                    <select className="themed-select" value={settings.theme} onChange={(e) => handleSettingChange('theme', e.target.value)}>
                        {THEME_OPTIONS.map(theme => (
                            <option key={theme.value} value={theme.value}>{theme.label}</option>
                        ))}
                    </select>
                </SettingsRow>
                 <SettingsRow label="Font chữ" description="Thay đổi font chữ chính của trò chơi.">
                     <select className="themed-select" value={settings.fontFamily} onChange={(e) => handleSettingChange('fontFamily', e.target.value)}>
                        {FONT_OPTIONS.map(font => (
                            <option key={font.value} value={font.value} style={{fontFamily: font.value}}>{font.label}</option>
                        ))}
                    </select>
                </SettingsRow>
                 <SettingsRow label="Cỡ chữ / Độ phóng to" description="Điều chỉnh kích thước chữ và giao diện tổng thể.">
                    <div className="flex items-center gap-4">
                       <input type="range" min="40" max="200" step="5" value={settings.zoomLevel} onChange={(e) => handleSettingChange('zoomLevel', parseInt(e.target.value))} className="themed-slider flex-grow" />
                       <span className="themed-slider-value">{settings.zoomLevel}%</span>
                    </div>
                </SettingsRow>
                 <SettingsRow label="Màu chữ chính" description="Chọn màu sắc cho các đoạn văn tường thuật chính.">
                    <input type="color" value={settings.textColor} onChange={(e) => handleSettingChange('textColor', e.target.value)} className="themed-color-input" />
                </SettingsRow>
            </SettingsSection>
            <SettingsSection title="Hình Nền Động">
                <SettingsRow label="Chọn hình nền" description="Chọn một hình nền động cho toàn bộ trò chơi.">
                     <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {DYNAMIC_BACKGROUND_OPTIONS.map(bg => (
                            <button 
                                key={bg.id} 
                                onClick={() => handleSettingChange('dynamicBackground', bg.id)}
                                className={`aspect-video rounded-md overflow-hidden border-2 transition-all duration-200 relative flex items-center justify-center
                                    ${settings.dynamicBackground === bg.id 
                                        ? 'border-amber-400 ring-2 ring-amber-400/50' 
                                        : 'border-gray-700/60 hover:border-amber-400/50'
                                    }`}
                            >
                                <div className={`absolute inset-0 ${bg.thumbnailClass}`}></div>
                                <span className="relative text-white font-bold text-sm bg-black/50 px-2 py-1 rounded-md">{bg.name}</span>
                            </button>
                        ))}
                    </div>
                </SettingsRow>
            </SettingsSection>
        </>
    );
};

export default memo(InterfaceSettings);