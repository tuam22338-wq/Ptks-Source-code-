import React, { memo } from 'react';
import type { GameSettings } from '../../../types';
import { FaSearchPlus } from 'react-icons/fa';

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

interface RagSettingsProps {
    settings: GameSettings;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
    onOpenRagManager: () => void;
}

const RagSettings: React.FC<RagSettingsProps> = ({ settings, handleSettingChange, onOpenRagManager }) => {
    return (
        <SettingsSection title="Hệ Thống Tri Thức (RAG)">
            <SettingsRow label="Số Lượng Tri Thức (Top K)" description="Số lượng thông tin liên quan nhất được truy xuất từ cơ sở dữ liệu tri thức để cung cấp cho AI. Giá trị cao hơn tăng độ chính xác nhưng có thể làm tăng độ trễ.">
                <div className="flex items-center gap-4">
                   <input type="range" min="1" max="10" step="1" value={settings.ragTopK} onChange={(e) => handleSettingChange('ragTopK', parseInt(e.target.value))} className="themed-slider flex-grow" />
                   <span className="themed-slider-value">{settings.ragTopK}</span>
                </div>
            </SettingsRow>
            <SettingsRow label="Quản lý Nguồn Tri Thức" description="Thêm, xóa, và quản lý các nguồn tri thức cho AI, bao gồm lore mặc định, lore từ mod, và các ghi chép của riêng bạn.">
                 <button onClick={onOpenRagManager} className="settings-button flex items-center gap-2">
                    <FaSearchPlus /> Mở Bảng Quản Lý
                </button>
            </SettingsRow>
        </SettingsSection>
    );
};

export default memo(RagSettings);
