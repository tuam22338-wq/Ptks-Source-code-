import React, { memo, useRef } from 'react';
import type { GameSettings } from '../../../types';
import { FaDownload, FaUpload, FaExclamationTriangle, FaVial, FaTrophy, FaPenFancy } from 'react-icons/fa';
import * as db from '../../../services/dbService';
import { AI_SYNC_MODES } from '../../../constants';

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

interface AdvancedSettingsProps {
    settings: GameSettings;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
}

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ settings, handleSettingChange }) => {
    const importInputRef = useRef<HTMLInputElement>(null);

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
        } catch (error) {
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
            } catch (error) {
                console.error("Failed to delete database:", error);
                alert("Xóa dữ liệu thất bại.");
            }
        }
    };

    return (
        <SettingsSection title="Nâng Cao">
            <SettingsRow label="Gói Đạo Tôn (Premium)" description="Kích hoạt các tính năng cao cấp như model AI mạnh hơn và các tùy chỉnh giao diện độc quyền.">
                <div className="flex flex-col">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.isPremium} onChange={e => handleSettingChange('isPremium', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                        <span className="ml-3 text-sm font-bold text-amber-300 flex items-center gap-2"><FaTrophy /> Kích hoạt Gói Đạo Tôn</span>
                    </label>
                    <p className="mt-2 text-xs text-gray-500">
                        Đây là tính năng mô phỏng. Trong phiên bản thực tế, đây sẽ là gói trả phí để ủng hộ nhà phát triển.
                    </p>
                </div>
            </SettingsRow>
             <SettingsRow label="Công Cụ Sáng Tạo" description="Mở công cụ viết tiểu thuyết bằng AI, tách biệt hoàn toàn với trò chơi.">
                 <button onClick={() => (window as any).appContext.handleNavigate('novelist')} className="px-4 py-2 bg-purple-800 text-white border border-purple-600 rounded-lg font-semibold transition-colors duration-200 hover:bg-purple-700 flex items-center gap-2">
                    <FaPenFancy /> Mở Tiểu Thuyết Gia AI
                </button>
            </SettingsRow>
            <SettingsRow label="Chế độ Đồng bộ AI" description="Chọn cách AI đồng bộ hóa trạng thái game. 'Thiên Cơ' được khuyến khích để đảm bảo tính nhất quán.">
                <div className="flex items-center p-1 bg-black/30 rounded-lg border border-gray-700/60 w-full">
                    {AI_SYNC_MODES.map(mode => (
                        <button 
                            key={mode.value} 
                            className={`w-full text-center py-1.5 px-2 text-sm text-gray-400 rounded-md transition-colors duration-200 font-semibold hover:bg-gray-700/50 hover:text-white ${settings.aiSyncMode === mode.value ? 'bg-gray-600 text-white shadow-inner' : ''}`} 
                            onClick={() => handleSettingChange('aiSyncMode', mode.value)}
                            title={mode.description}
                        >
                            {mode.label}
                        </button>
                    ))}
                </div>
            </SettingsRow>
            <SettingsRow label="Bảng điều khiển nhà phát triển" description="Hiển thị một console trong game để theo dõi log và các thông tin gỡ lỗi.">
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.enableDeveloperConsole} onChange={e => handleSettingChange('enableDeveloperConsole', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                    <span className="ml-3 text-sm text-gray-300">Bật Developer Console</span>
                </label>
            </SettingsRow>
            <SettingsRow label="Chế độ Thử nghiệm (Live Editor)" description="Bật một bảng điều khiển đặc biệt trong game để chỉnh sửa trực tiếp chỉ số, NPC, và các dữ liệu khác. Cần tải lại game sau khi thay đổi.">
                <div className="flex flex-col">
                     <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.enableTestingMode} onChange={e => handleSettingChange('enableTestingMode', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                        <span className="ml-3 text-sm font-bold text-amber-300 flex items-center gap-2"><FaVial /> Bật Chế Độ Thử Nghiệm</span>
                    </label>
                    <p className="mt-2 text-xs text-yellow-400 bg-yellow-900/30 border border-yellow-500/50 p-2 rounded-md">
                        <strong>Cảnh báo:</strong> Chế độ này dành cho người dùng nâng cao và các nhà phát triển mod. Việc chỉnh sửa trực tiếp có thể gây ra lỗi không mong muốn hoặc phá vỡ trải nghiệm game.
                    </p>
                </div>
            </SettingsRow>
            <SettingsRow label="Chế độ hiệu suất" description="Tắt các hiệu ứng hình ảnh và chuyển động để cải thiện hiệu suất trên các thiết bị yếu.">
                 <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.enablePerformanceMode} onChange={e => handleSettingChange('enablePerformanceMode', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                    <span className="ml-3 text-sm text-gray-300">Bật Performance Mode</span>
                </label>
            </SettingsRow>
            <SettingsRow label="Quản lý Dữ liệu" description="Sao lưu toàn bộ dữ liệu game (lưu game, cài đặt, mods) ra file hoặc khôi phục từ file sao lưu.">
                 <div className="flex gap-2">
                    <button onClick={handleExportData} className="px-4 py-2 bg-[var(--bg-interactive)] text-[var(--text-color)] border border-[var(--border-subtle)] rounded-lg font-semibold transition-colors duration-200 hover:bg-[var(--bg-interactive-hover)] hover:border-gray-500 flex items-center gap-2">
                        <FaDownload /> Sao Lưu
                    </button>
                    <button onClick={() => importInputRef.current?.click()} className="px-4 py-2 bg-[var(--bg-interactive)] text-[var(--text-color)] border border-[var(--border-subtle)] rounded-lg font-semibold transition-colors duration-200 hover:bg-[var(--bg-interactive-hover)] hover:border-gray-500 flex items-center gap-2">
                        <FaUpload /> Nhập Dữ liệu
                    </button>
                    <input
                        type="file"
                        ref={importInputRef}
                        className="hidden"
                        accept=".json"
                        onChange={handleImportData}
                    />
                </div>
            </SettingsRow>
            <SettingsRow label="Xóa toàn bộ dữ liệu" description="Hành động này sẽ xóa tất cả các file lưu, cài đặt và mod của bạn. Không thể hoàn tác.">
                 <button onClick={handleResetData} className="px-4 py-2 bg-red-800 text-white border border-red-700 rounded-lg font-semibold transition-colors duration-200 hover:bg-red-700 flex items-center gap-2">
                    <FaExclamationTriangle /> Xóa Dữ Liệu
                </button>
            </SettingsRow>
        </SettingsSection>
    );
};

export default memo(AdvancedSettings);
