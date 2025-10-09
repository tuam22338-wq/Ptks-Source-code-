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

const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({ settings, handleSettingChange }) => {
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
        <>
        {isFixerModalOpen && <HeuristicFixerModal isOpen={isFixerModalOpen} onClose={() => setFixerModalOpen(false)} />}
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
            <SettingsRow label="Thiên Đạo Trật Tự Giám" description="Bật hệ thống tự động phát hiện và sửa các lỗi dữ liệu đơn giản (ví dụ: chỉ số âm, máu cao hơn mức tối đa).">
                <div className="flex flex-col gap-2">
                    <label className="flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.enableHeuristicFixerAI} onChange={e => handleSettingChange('enableHeuristicFixerAI', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                        <span className="ml-3 text-sm font-bold text-teal-300 flex items-center gap-2"><FaShieldAlt /> Bật Thiên Đạo Giám</span>
                    </label>
                     <button onClick={() => setFixerModalOpen(true)} className="btn btn-neumorphic mt-2 text-left w-full max-w-xs text-sm">
                        Xem Báo Cáo Can Thiệp
                    </button>
                </div>
            </SettingsRow>
            <SettingsRow label="Chế độ Đồng bộ AI" description="Chọn cách AI đồng bộ hóa trạng thái game. 'Thiên Cơ' được khuyến khích để đảm bảo tính nhất quán.">
                <div className="flex items-center p-1 rounded-lg w-full" style={{boxShadow: 'var(--shadow-pressed)'}}>
                    {AI_SYNC_MODES.map(mode => (
                        <button 
                            key={mode.value} 
                            className={`w-full text-center py-1.5 px-2 text-sm font-semibold rounded-md transition-colors duration-200 hover:bg-[var(--shadow-light)]/50 hover:text-[var(--text-color)] ${settings.aiSyncMode === mode.value ? 'bg-[var(--shadow-light)] text-[var(--text-color)]' : 'text-[var(--text-muted-color)]'}`} 
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
                    <span className="ml-3 text-sm" style={{color: 'var(--text-color)'}}>Bật Developer Console</span>
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
                    <span className="ml-3 text-sm" style={{color: 'var(--text-color)'}}>Bật Performance Mode</span>
                </label>
            </SettingsRow>
            <SettingsRow label="Quản lý Dữ liệu" description="Sao lưu toàn bộ dữ liệu game (lưu game, cài đặt, mods) ra file hoặc khôi phục từ file sao lưu.">
                 <div className="flex gap-2">
                    <button onClick={handleExportData} className="btn btn-neumorphic">
                        <FaDownload /> Sao Lưu
                    </button>
                    <button onClick={() => importInputRef.current?.click()} className="btn btn-neumorphic">
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
                 <button onClick={handleResetData} className="btn flex items-center gap-2" style={{backgroundColor: 'var(--error-color)', color: 'white', boxShadow: 'var(--shadow-raised-interactive)'}}>
                    <FaExclamationTriangle /> Xóa Dữ Liệu
                </button>
            </SettingsRow>
        </SettingsSection>
        </>
    );
};

export default memo(AdvancedSettings);