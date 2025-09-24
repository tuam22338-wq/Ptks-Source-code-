import React, { memo } from 'react';
import type { GameSettings } from '../../../types';
import { FaSearchPlus } from 'react-icons/fa';

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
                   <input type="range" min="1" max="10" step="1" value={settings.ragTopK} onChange={(e) => handleSettingChange('ragTopK', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                   <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.ragTopK}</span>
                </div>
            </SettingsRow>
            <SettingsRow label="Quản lý Nguồn Tri Thức" description="Thêm, xóa, và quản lý các nguồn tri thức cho AI, bao gồm lore mặc định, lore từ mod, và các ghi chép của riêng bạn.">
                 <button onClick={onOpenRagManager} className="px-4 py-2 bg-[var(--bg-interactive)] text-[var(--text-color)] border border-[var(--border-subtle)] rounded-lg font-semibold transition-colors duration-200 hover:bg-[var(--bg-interactive-hover)] hover:border-gray-500 flex items-center gap-2">
                    <FaSearchPlus /> Mở Bảng Quản Lý
                </button>
            </SettingsRow>
        </SettingsSection>
    );
};

export default memo(RagSettings);