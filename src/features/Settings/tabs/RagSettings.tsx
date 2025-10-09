import React, { memo } from 'react';
import type { GameSettings } from '../../../types';
import { FaSearchPlus } from 'react-icons/fa';

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
                   <input type="range" min="1" max="10" step="1" value={settings.ragTopK} onChange={(e) => handleSettingChange('ragTopK', parseInt(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer flex-grow" />
                   <span className="font-mono text-sm neumorphic-inset-box px-3 py-1 text-[var(--text-color)] w-20 text-center">{settings.ragTopK}</span>
                </div>
            </SettingsRow>
            <SettingsRow label="Kích thước Chunk" description="Kích thước (số ký tự) của mỗi đoạn văn bản khi lập chỉ mục. Giá trị nhỏ hơn giúp truy xuất chính xác hơn nhưng tốn nhiều tài nguyên hơn.">
                <div className="flex items-center gap-4">
                   <input type="range" min="128" max="1024" step="32" value={settings.ragChunkSize} onChange={(e) => handleSettingChange('ragChunkSize', parseInt(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer flex-grow" />
                   <span className="font-mono text-sm neumorphic-inset-box px-3 py-1 text-[var(--text-color)] w-20 text-center">{settings.ragChunkSize}</span>
                </div>
            </SettingsRow>
             <SettingsRow label="Độ chồng chéo Chunk" description="Số ký tự chồng chéo giữa các chunk. Giúp duy trì ngữ cảnh giữa các đoạn văn bản được cắt.">
                <div className="flex items-center gap-4">
                   <input type="range" min="0" max="128" step="8" value={settings.ragChunkOverlap} onChange={(e) => handleSettingChange('ragChunkOverlap', parseInt(e.target.value))} className="w-full h-2 rounded-lg appearance-none cursor-pointer flex-grow" />
                   <span className="font-mono text-sm neumorphic-inset-box px-3 py-1 text-[var(--text-color)] w-20 text-center">{settings.ragChunkOverlap}</span>
                </div>
            </SettingsRow>
            <SettingsRow label="Quản lý Nguồn Tri Thức" description="Thêm, xóa, và quản lý các nguồn tri thức cho AI, bao gồm lore mặc định, lore từ mod, và các ghi chép của riêng bạn.">
                 <button onClick={onOpenRagManager} className="btn btn-neumorphic flex items-center gap-2">
                    <FaSearchPlus /> Mở Bảng Quản Lý
                </button>
            </SettingsRow>
        </SettingsSection>
    );
};

export default memo(RagSettings);