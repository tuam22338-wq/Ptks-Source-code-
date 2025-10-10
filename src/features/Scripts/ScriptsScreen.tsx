import React, { useState } from 'react';
import { FaArrowLeft, FaPlus, FaUpload, FaEdit, FaTrash, FaCodeBranch } from 'react-icons/fa';
// FIX: Fix import path for `useAppContext` to point to the correct module.
import { useAppContext } from '../../contexts/useAppContext';

const mockScripts = [
    { id: 'ui_enhancement_1', name: 'Giao Diện Nâng Cao', author: 'Community', version: '1.2', description: 'Bổ sung thêm một panel hiển thị thông tin thời tiết và các hiệu ứng đặc biệt của khu vực.', isEnabled: true },
    { id: 'fast_travel_button', name: 'Nút Dịch Chuyển Nhanh', author: 'Player', version: '1.0', description: 'Thêm một nút "Dịch Chuyển" vào thanh hành động, cho phép di chuyển nhanh giữa các thành phố lớn.', isEnabled: true },
    { id: 'combat_log_script', name: 'Nhật Ký Chiến Đấu', author: 'Community', version: '0.9', description: 'Tạo một cửa sổ mới trong sidebar để ghi lại chi tiết các đòn đánh và sát thương trong trận chiến.', isEnabled: false },
];

const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void }> = ({ checked, onChange }) => (
    <button onClick={onChange} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${checked ? 'bg-green-500' : 'bg-gray-600'}`}>
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
);

const ScriptItem: React.FC<{ script: typeof mockScripts[0] }> = ({ script }) => {
    const [isEnabled, setIsEnabled] = useState(script.isEnabled);
    return (
        <div className="neumorphic-inset-box p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-grow">
                <div className="flex items-center gap-3">
                    <FaCodeBranch className="text-xl text-[var(--secondary-accent-color)]" />
                    <div>
                        <h4 className="font-bold text-lg text-[var(--text-color)]">{script.name} <span className="text-xs font-mono text-[var(--text-muted-color)]">v{script.version}</span></h4>
                        <p className="text-xs text-[var(--text-muted-color)]">Tác giả: {script.author}</p>
                    </div>
                </div>
                <p className="text-sm mt-2 text-[var(--text-muted-color)]">{script.description}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                <ToggleSwitch checked={isEnabled} onChange={() => setIsEnabled(!isEnabled)} />
                <button className="p-2 text-[var(--text-muted-color)] hover:text-white"><FaEdit /></button>
                <button className="p-2 text-[var(--text-muted-color)] hover:text-red-400"><FaTrash /></button>
            </div>
        </div>
    );
};


const ScriptsScreen: React.FC = () => {
    const { handleNavigate } = useAppContext();

    return (
        <div className="w-full animate-fade-in flex flex-col h-full min-h-0 p-4 sm:p-6">
            <div className="flex-shrink-0 flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold font-title">Quản Lý Scripts</h2>
                <button onClick={() => handleNavigate('mainMenu')} className="p-2 rounded-full text-[var(--text-muted-color)] hover:text-[var(--text-color)] hover:bg-gray-700/50" title="Quay Lại Menu">
                    <FaArrowLeft className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button onClick={() => handleNavigate('createScript')} className="btn btn-primary flex-grow text-lg py-3">
                    <FaPlus /> Tạo Script Mới
                </button>
                <button onClick={() => alert('Tính năng nhập script sắp ra mắt!')} className="btn btn-neumorphic flex-grow text-lg py-3">
                    <FaUpload /> Nhập Script
                </button>
            </div>

            <div className="flex-grow min-h-0 overflow-y-auto pr-2 space-y-4">
                <h3 className="text-xl font-bold font-title text-[var(--primary-accent-color)]">Thư Viện Script</h3>
                {mockScripts.map(script => (
                    <ScriptItem key={script.id} script={script} />
                ))}
            </div>
        </div>
    );
};

export default ScriptsScreen;