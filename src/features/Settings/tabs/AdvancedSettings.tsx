import React, { memo, useRef } from 'react';
import type { GameSettings } from '../../../types';
import { FaDownload, FaUpload, FaExclamationTriangle } from 'react-icons/fa';
import * as db from '../../../services/dbService';
import { AI_SYNC_MODES } from '../../../constants';

interface SettingsSectionProps {
    title: string;
    children: React.ReactNode;
}
const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <section className="mb-10">
    <h3 className="text-xl font-bold font-title mb-4 pb-2 border-b border-gray-600/50 text-gray-300">{title}</h3>
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
  <div className={`flex flex-col md:flex-row gap-4 ${disabled ? 'opacity-50' : ''}`}>
    <div className="md:w-1/3 flex-shrink-0">
      <label className='block font-semibold text-gray-200'>{label}</label>
      <p className='text-sm text-gray-500 mt-1'>{description}</p>
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
             <SettingsRow label="Độ dài Phản hồi AI (Số từ)" description="Đặt độ dài gần đúng cho mỗi phản hồi tường thuật của AI.">
                <div className="flex items-center gap-4">
                    <input type="range" min="50" max="800" step="50" value={settings.aiResponseWordCount} onChange={(e) => handleSettingChange('aiResponseWordCount', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                    <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.aiResponseWordCount}</span>
                </div>
            </SettingsRow>
            <SettingsRow label="Nhiệt độ (Temperature)" description="Kiểm soát mức độ sáng tạo/ngẫu nhiên của AI. Giá trị cao hơn (vd: 1.2) cho kết quả đa dạng, giá trị thấp hơn (vd: 0.7) cho kết quả nhất quán hơn.">
                <div className="flex items-center gap-4">
                    <input type="range" min="0" max="2" step="0.1" value={settings.temperature} onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                    <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.temperature.toFixed(1)}</span>
                </div>
            </SettingsRow>
            <SettingsRow label="Top-K" description="Giới hạn số lượng token có khả năng cao nhất mà AI xem xét ở mỗi bước. Giá trị thấp hơn làm cho AI bớt ngẫu nhiên.">
                <div className="flex items-center gap-4">
                    <input type="range" min="1" max="128" step="1" value={settings.topK} onChange={(e) => handleSettingChange('topK', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                    <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.topK}</span>
                </div>
            </SettingsRow>
            <SettingsRow label="Top-P" description="Chọn các token có xác suất tích lũy đạt đến một ngưỡng nhất định. Kiểm soát sự đa dạng của phản hồi.">
                <div className="flex items-center gap-4">
                    <input type="range" min="0" max="1" step="0.05" value={settings.topP} onChange={(e) => handleSettingChange('topP', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                    <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.topP.toFixed(2)}</span>
                </div>
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
            <SettingsRow label="Bật 'Suy Nghĩ' (Thinking)" description="Cho phép model suy nghĩ trước khi trả lời để có chất lượng cao hơn (chỉ cho gemini-2.5-flash). Tắt có thể giảm độ trễ.">
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.enableThinking} onChange={e => handleSettingChange('enableThinking', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2" />
                    <span className="ml-3 text-sm text-gray-300">Bật Thinking</span>
                </label>
            </SettingsRow>
            <SettingsRow label="Ngân sách 'Suy Nghĩ' (Thinking Budget)" description="Lượng token tối đa mà model có thể dùng để 'suy nghĩ'. Giá trị cao hơn có thể cải thiện chất lượng nhưng tăng độ trễ. Đặt là 0 để tắt." disabled={!settings.enableThinking}>
                <div className="flex items-center gap-4">
                    <input type="range" min="0" max="2000" step="50" value={settings.thinkingBudget} onChange={(e) => handleSettingChange('thinkingBudget', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" disabled={!settings.enableThinking}/>
                    <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.thinkingBudget}</span>
                </div>
            </SettingsRow>
            <SettingsRow label="Bảng điều khiển nhà phát triển" description="Hiển thị một console trong game để theo dõi log và các thông tin gỡ lỗi.">
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.enableDeveloperConsole} onChange={e => handleSettingChange('enableDeveloperConsole', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2" />
                    <span className="ml-3 text-sm text-gray-300">Bật Developer Console</span>
                </label>
            </SettingsRow>
            <SettingsRow label="Chế độ hiệu suất" description="Tắt các hiệu ứng hình ảnh và chuyển động để cải thiện hiệu suất trên các thiết bị yếu.">
                 <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.enablePerformanceMode} onChange={e => handleSettingChange('enablePerformanceMode', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2" />
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
