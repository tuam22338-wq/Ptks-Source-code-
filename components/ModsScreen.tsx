import React, { useState, useEffect, useRef, useMemo } from 'react';
import { FaPlusSquare, FaUpload, FaArrowLeft, FaTrash, FaCheckCircle, FaCloudDownloadAlt, FaFileCode } from 'react-icons/fa';
import type { View } from '../App';
import type { FullMod, ModInfo, CommunityMod } from '../types';
import { fetchCommunityMods } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

// --- PROPS & TYPES ---
interface ModsScreenProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
}

interface ModInLibrary {
    modInfo: ModInfo;
    isEnabled: boolean;
}

// --- SUB-COMPONENTS ---

const CommunityModsPanel: React.FC<{
    installedModIds: Set<string>;
    onInstallMod: (mod: FullMod) => void;
}> = ({ installedModIds, onInstallMod }) => {
    const [communityMods, setCommunityMods] = useState<CommunityMod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCommunityMods()
            .then(setCommunityMods)
            .catch(err => setError(err.message || 'Không thể tải mod.'))
            .finally(() => setIsLoading(false));
    }, []);

    const handleInstall = async (modToInstall: CommunityMod) => {
        try {
            const response = await fetch(modToInstall.downloadUrl);
            if (!response.ok) throw new Error('Lỗi mạng khi tải tệp mod.');
            const modData: FullMod = await response.json();
            onInstallMod(modData);
        } catch (err) {
            alert(`Lỗi khi cài đặt mod "${modToInstall.modInfo.name}": ${(err as Error).message}`);
        }
    };
    
    return (
        <div className="bg-black/20 p-4 rounded-lg border border-gray-700/60 h-full flex flex-col">
            <h3 className="text-xl font-bold font-title mb-4 text-center">Thư Viện Cộng Đồng</h3>
            <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                {isLoading && <div className="flex justify-center pt-10"><LoadingSpinner message="Đang tải..." /></div>}
                {error && <p className="text-center text-red-400">{error}</p>}
                {!isLoading && !error && communityMods.map(mod => (
                    <div key={mod.modInfo.id} className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                        <h4 className="font-bold text-gray-200">{mod.modInfo.name}</h4>
                        <p className="text-xs text-gray-400">bởi {mod.modInfo.author || 'Vô danh'}</p>
                        <p className="text-sm text-gray-500 mt-1">{mod.modInfo.description}</p>
                        <div className="text-right mt-2">
                           {installedModIds.has(mod.modInfo.id) ? (
                                <div className="flex items-center justify-end gap-2 text-green-400 font-semibold text-sm">
                                    <FaCheckCircle /> Đã Cài Đặt
                                </div>
                            ) : (
                                <button onClick={() => handleInstall(mod)} className="flex items-center gap-2 px-3 py-1.5 bg-teal-700/80 text-white text-xs font-bold rounded-lg hover:bg-teal-600/80">
                                    <FaCloudDownloadAlt /> Cài đặt
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
             <p className="text-xs text-gray-600 text-center mt-2">Mod cộng đồng được cung cấp bởi người dùng. Netlify là một nền tảng tuyệt vời để lưu trữ tệp manifest.json cho thư viện này.</p>
        </div>
    );
};

const InstalledModsPanel: React.FC<{
    mods: ModInLibrary[];
    onToggleMod: (id: string) => void;
    onDeleteMod: (id: string) => void;
    onImportMod: (mod: FullMod) => void;
}> = ({ mods, onToggleMod, onDeleteMod, onImportMod }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const newModData: FullMod = JSON.parse(text);
                onImportMod(newModData);
            } catch (error: any) {
                alert(`Lỗi khi nhập mod: ${error.message}`);
            }
        };
        reader.onerror = () => alert('Không thể đọc tệp tin.');
        reader.readAsText(file);
        event.target.value = '';
    };

    const Toggle: React.FC<{ checked: boolean; onChange: () => void; }> = ({ checked, onChange }) => (
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-14 h-7 bg-gray-700 rounded-full border border-gray-600 peer peer-focus:ring-2 peer-focus:ring-gray-500/50 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-accent-color)]"></div>
      </label>
    );
    
    return (
        <div className="bg-black/20 p-4 rounded-lg border border-gray-700/60 h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold font-title">Mod Đã Cài Đặt</h3>
                 <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/80 text-white text-xs font-bold rounded-lg hover:bg-gray-600/80">
                     <FaUpload /> Nhập File
                 </button>
                 <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileSelected} className="hidden" />
            </div>
             <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                 {mods.length > 0 ? mods.map(mod => (
                    <div key={mod.modInfo.id} className="bg-black/20 p-3 rounded-lg border border-gray-700/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex-grow">
                            <h4 className="font-bold text-gray-200">{mod.modInfo.name}</h4>
                            <p className="text-xs text-gray-400">bởi {mod.modInfo.author || 'Vô danh'}</p>
                            <p className="text-sm text-gray-500 mt-1">{mod.modInfo.description}</p>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0 w-full sm:w-auto justify-end">
                            <Toggle checked={mod.isEnabled} onChange={() => onToggleMod(mod.modInfo.id)} />
                            <button onClick={() => onDeleteMod(mod.modInfo.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Xóa Mod">
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                 )) : (
                    <div className="text-center text-gray-500 p-8 h-full flex flex-col justify-center items-center">
                        <p>Chưa có mod nào được cài đặt.</p>
                        <p className="text-sm mt-1">Hãy cài từ Thư Viện hoặc Nhập từ File.</p>
                    </div>
                 )}
             </div>
        </div>
    );
};

const ModEditorPanel: React.FC<{ onNavigate: (view: View) => void }> = ({ onNavigate }) => {
    return (
        <div className="bg-black/20 p-4 rounded-lg border border-dashed border-gray-700/60 h-full flex flex-col justify-center items-center text-center">
            <FaFileCode className="text-5xl text-gray-600 mb-4" />
            <h3 className="text-2xl font-bold font-title">Trình Chỉnh Sửa</h3>
            <p className="mt-2 mb-6 max-w-xs mx-auto text-gray-400">Sử dụng GameMaster AI để tạo vật phẩm, nhân vật, và hệ thống tu luyện của riêng bạn.</p>
            <button onClick={() => onNavigate('createMod')} className="themed-button-primary flex items-center justify-center gap-3 w-full max-w-xs h-14 text-lg font-bold font-title rounded-md shadow-lg shadow-black/30">
                <FaPlusSquare /> Bắt Đầu Sáng Tạo
            </button>
        </div>
    );
};

// --- MAIN COMPONENT ---
const ModsScreen: React.FC<ModsScreenProps> = ({ onBack, onNavigate }) => {
    const [mods, setMods] = useState<ModInLibrary[]>([]);

    useEffect(() => {
        try {
            const savedMods = localStorage.getItem('mod-library');
            if (savedMods) setMods(JSON.parse(savedMods));
        } catch (error) {
            console.error("Failed to load mods from localStorage", error);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('mod-library', JSON.stringify(mods));
        } catch (error) {
            console.error("Failed to save mods to localStorage", error);
        }
    }, [mods]);

    const handleImportOrInstallMod = (newModData: FullMod) => {
        if (!newModData.modInfo?.id || !newModData.modInfo?.name) {
            alert("Tệp mod không hợp lệ. Thiếu thông tin 'modInfo' hoặc ID/tên.");
            return;
        }
        if (mods.some(m => m.modInfo.id === newModData.modInfo.id)) {
            alert(`Mod có ID "${newModData.modInfo.id}" đã tồn tại.`);
            return;
        }
        const newMod: ModInLibrary = {
            modInfo: newModData.modInfo,
            isEnabled: true,
        };
        setMods(prev => [...prev, newMod]);
        localStorage.setItem(`mod-content-${newModData.modInfo.id}`, JSON.stringify(newModData));
        alert(`Mod "${newMod.modInfo.name}" đã được thêm thành công!`);
    };

    const handleToggleMod = (id: string) => {
        setMods(mods.map(mod => mod.modInfo.id === id ? { ...mod, isEnabled: !mod.isEnabled } : mod));
    };

    const handleDeleteMod = (id: string) => {
        const modToDelete = mods.find(m => m.modInfo.id === id);
        if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn mod "${modToDelete?.modInfo.name}"?`)) {
            setMods(mods.filter(mod => mod.modInfo.id !== id));
            localStorage.removeItem(`mod-content-${id}`);
        }
    };

    const installedModIds = useMemo(() => new Set(mods.map(m => m.modInfo.id)), [mods]);

    return (
        <div className="w-full h-full max-h-[85vh] animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-3xl font-bold font-title">Quản lý Mods</h2>
                <button onClick={onBack} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50" title="Quay Lại Menu">
                    <FaArrowLeft className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
                <CommunityModsPanel installedModIds={installedModIds} onInstallMod={handleImportOrInstallMod} />
                <InstalledModsPanel mods={mods} onToggleMod={handleToggleMod} onDeleteMod={handleDeleteMod} onImportMod={handleImportOrInstallMod} />
                <ModEditorPanel onNavigate={onNavigate} />
            </div>
        </div>
    );
};

export default ModsScreen;