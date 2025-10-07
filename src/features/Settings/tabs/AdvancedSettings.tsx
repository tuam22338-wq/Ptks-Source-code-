import React, { memo, useRef, useState } from 'react';
import type { GameSettings } from '../../../types';
import { FaDownload, FaUpload, FaExclamationTriangle, FaVial, FaTrophy, FaShieldAlt } from 'react-icons/fa';
import * as db from '../../../services/dbService';
import { AI_SYNC_MODES } from '../../../constants';
import HeuristicFixerModal from '../HeuristicFixerModal'; // Import the new modal

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

interface AdvancedSettingsProps {
    settings: GameSettings;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
}

const AdvancedSettingsComponent: React.FC<AdvancedSettingsProps> = ({ settings, handleSettingChange }) => {
    const importInputRef = useRef<HTMLInputElement>(null);
    const [isFixerModalOpen, setFixerModalOpen] = useState(false);

    const handleExportData = async () => {
        if (!window.confirm("Bạn có muốn sao lưu toàn bộ dữ liệu game (lưu game, cài đặt, mods) ra một tệp JSON không?")) {
            return;
        }
        try {
            const allData = await db.exportAllData();
            const jsonString = JSON.stringify(allData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.href = url;
            link.download = `tamthienthegioi_backup_${timestamp}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            alert('Đã xuất dữ liệu thành công!');
        } catch (error: any) {
            console.error("Failed to export data:", error);
            alert('Xuất dữ liệu thất bại.');
        }
    };

    const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm("CẢNH BÁO: Thao tác này sẽ XÓA TOÀN BỘ dữ liệu hiện tại của bạn và thay thế bằng dữ liệu từ tệp sao lưu. Bạn có chắc chắn muốn tiếp tục không?")) {
            if(importInputRef.current) importInputRef.current.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const data = JSON.parse(text);

                if (!data.saveSlots || !data.settings) {
                    throw new Error("Tệp sao lưu không hợp lệ hoặc bị hỏng.");
                }

                await db.importAllData(data);
                alert("Nhập dữ liệu thành công! Trò chơi sẽ được tải lại.");
                window.location.reload();
            } catch (error: any) {
                console.error("Failed to import data:", error);
                alert(`Nhập dữ liệu thất bại: ${error.message}`);
            } finally {
                if(importInputRef.current) importInputRef.current.value = "";
            }
        };
        reader.onerror = () => {
            alert('Không thể đọc tệp tin.');
            if(importInputRef.current) importInputRef.current.value = "";
        };
        reader.readAsText(file);
    };
    
    const handleResetData = async () => {
        if (window.confirm("BẠN CÓ CHẮC CHẮN MUỐN XÓA TẤT CẢ DỮ LIỆU GAME KHÔNG? HÀNH ĐỘNG NÀY SẼ XÓA TẤT CẢ CÁC FILE LƯU, CÀI ĐẶT VÀ MOD CỦA BẠN. KHÔNG THỂ HOÀN TÁC!")) {
            try {
                await db.deleteDb();
                alert("Đã xóa tất cả dữ liệu. Trang sẽ được tải lại.");
                window.location.reload();
            } catch (error: any) {
                console.error("Failed to delete database:", error);
                alert("Xóa dữ liệu thất bại.");
            }
        }
    };

    return (
        <>
        {isFixerModalOpen && <HeuristicFixerModal isOpen={isFixerModalOpen} onClose={() => setFixerModalOpen(false)} />}
        <SettingsSection title="Nâng Cao">
            <SettingsRow label="Gói Đạo Tôn (Premium)" description="Kích hoạt các tính năng cao cấp như model AI mạnh hơn và các tùy chỉnh giao diện độc quyền.">
                <div className="flex flex-col">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.isPremium} onChange={e => handleSettingChange('isPremium', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                        <span className="ml-3 text-sm font-bold flex items-center gap-2" style={{color: settings.isPremium ? 'var(--primary-accent-color)' : 'var(--text-muted-color)'}}>
                            <FaTrophy /> Kích hoạt Gói Đạo Tôn
                        </span>
                    </label>
                </div>
            </SettingsRow>
            <SettingsRow label="Chế độ Thử nghiệm (Testing)" description="Bật các tính năng đang trong giai đoạn thử nghiệm. Có thể không ổn định. Yêu cầu tải lại trang.">
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.enableTestingMode} onChange={e => handleSettingChange('enableTestingMode', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                    <span className="ml-3 text-sm flex items-center gap-2" style={{color: 'var(--text-color)'}}>
                        <FaVial /> Bật Chế độ Thử nghiệm
                    </span>
                </label>
            </SettingsRow>
             <SettingsRow label="Đồng bộ Trạng thái AI" description="Chọn cách AI đồng bộ hóa kết quả tường thuật với cơ chế game. 'Thiên Cơ' được khuyến khích.">
                <select className="input-neumorphic w-full" value={settings.aiSyncMode} onChange={e => handleSettingChange('aiSyncMode', e.target.value)}>
                    {AI_SYNC_MODES.map(mode => (
                        <option key={mode.value} value={mode.value}>{mode.label} - {mode.description}</option>
                    ))}
                </select>
            </SettingsRow>
             <SettingsRow label="Thiên Đạo Giám Sát (Heuristic Fixer AI)" description="Cho phép một AI giám sát chạy ngầm để tự động phát hiện và sửa các lỗi logic trong dữ liệu game (ví dụ: HP âm).">
                <div className="flex items-center gap-4">
                     <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.enableHeuristicFixerAI} onChange={e => handleSettingChange('enableHeuristicFixerAI', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                        <span className="ml-3 text-sm flex items-center gap-2" style={{color: 'var(--text-color)'}}>
                            <FaShieldAlt /> Bật Thiên Đạo Giám Sát
                        </span>
                    </label>
                    <button onClick={() => setFixerModalOpen(true)} className="btn btn-neumorphic !text-xs !px-3 !py-1">Xem Báo Cáo</button>
                </div>
            </SettingsRow>
        </SettingsSection>
        <SettingsSection title="Quản lý Dữ liệu">
             <SettingsRow label="Sao lưu & Phục hồi" description="Xuất toàn bộ dữ liệu game của bạn ra một tệp JSON, hoặc nhập từ một tệp sao lưu.">
                 <div className="flex flex-col sm:flex-row gap-2">
                    <button onClick={handleExportData} className="btn btn-neumorphic flex-grow"><FaDownload className="mr-2"/> Sao lưu Dữ liệu</button>
                    <input type="file" accept=".json" ref={importInputRef} onChange={handleImportData} className="hidden" />
                    <button onClick={() => importInputRef.current?.click()} className="btn btn-neumorphic flex-grow"><FaUpload className="mr-2"/> Phục hồi từ Tệp</button>
                </div>
            </SettingsRow>
            <SettingsRow label="Xóa Dữ liệu" description="Hành động này sẽ xóa tất cả dữ liệu game, bao gồm các file lưu, cài đặt và mod đã tải. KHÔNG THỂ HOÀN TÁC.">
                <button onClick={handleResetData} className="btn btn-neumorphic flex items-center gap-2" style={{backgroundColor: 'var(--error-color)', color: 'white', boxShadow: 'none'}}>
                    <FaExclamationTriangle /> Xóa Toàn Bộ Dữ liệu
                </button>
            </SettingsRow>
        </SettingsSection>
        </>
    );
};

export const AdvancedSettings = memo(AdvancedSettingsComponent);
