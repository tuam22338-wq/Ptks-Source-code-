import React, { useState, useEffect, useRef } from 'react';
import { FaPlusSquare, FaUpload, FaArrowLeft, FaTrash, FaBook, FaBoxOpen, FaCheckCircle } from 'react-icons/fa';
import type { View, } from '../App';
import { PREMADE_MODS } from '../constants';
import type { FullMod, ModInfo } from '../types';


interface ModsScreenProps {
  onBack: () => void;
  onNavigate: (view: View) => void;
}

// Represents a mod in the user's library (localStorage)
interface ModInLibrary {
    modInfo: ModInfo;
    isEnabled: boolean;
}

type ModsTab = 'library' | 'import' | 'create';

const Toggle: React.FC<{ checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ checked, onChange }) => (
  <label className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
    <div className="w-14 h-7 bg-gray-700 rounded-full border border-gray-600 peer peer-focus:ring-2 peer-focus:ring-gray-500/50 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-accent-color)]"></div>
  </label>
);

const ModListItem: React.FC<{ mod: ModInLibrary, onToggle: (id: string) => void, onDelete: (id: string) => void }> = ({ mod, onToggle, onDelete }) => {
    return (
        <div className="bg-black/20 p-4 rounded-lg border border-gray-700/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in" style={{animationDuration: '300ms'}}>
            <div className="flex-grow">
                <h3 className="text-lg font-bold font-title">{mod.modInfo.name}</h3>
                {mod.modInfo.author && <p className="text-sm text-[color:var(--text-muted-color)]">bởi {mod.modInfo.author}</p>}
                {mod.modInfo.description && <p className="text-sm text-gray-500 mt-1">{mod.modInfo.description}</p>}
            </div>
            <div className="flex items-center gap-4 flex-shrink-0 w-full sm:w-auto justify-end">
                <Toggle checked={mod.isEnabled} onChange={() => onToggle(mod.modInfo.id)} />
                <button onClick={() => onDelete(mod.modInfo.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Xóa Mod">
                    <FaTrash />
                </button>
            </div>
        </div>
    );
};

const PremadeModCard: React.FC<{ mod: FullMod, isInstalled: boolean, onInstall: (mod: FullMod) => void }> = ({ mod, isInstalled, onInstall }) => {
    return (
        <div className="bg-black/20 p-4 rounded-lg border border-gray-700/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in" style={{animationDuration: '300ms'}}>
            <div className="flex-grow">
                <h3 className="text-lg font-bold font-title">{mod.modInfo.name}</h3>
                {mod.modInfo.author && <p className="text-sm text-[color:var(--text-muted-color)]">bởi {mod.modInfo.author}</p>}
                <p className="text-sm text-gray-500 mt-1">{mod.modInfo.description}</p>
            </div>
            <div className="flex-shrink-0 w-full sm:w-auto flex justify-end">
                {isInstalled ? (
                     <div className="flex items-center gap-2 px-4 py-2 text-green-400 font-semibold">
                        <FaCheckCircle /> Đã Cài Đặt
                    </div>
                ) : (
                    <button 
                        onClick={() => onInstall(mod)}
                        className="flex items-center gap-2 px-4 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 transition-colors"
                    >
                        Cài Đặt
                    </button>
                )}
            </div>
        </div>
    );
}


const ModsScreen: React.FC<ModsScreenProps> = ({ onBack, onNavigate }) => {
    const [mods, setMods] = useState<ModInLibrary[]>([]);
    const [activeTab, setActiveTab] = useState<ModsTab>('library');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        try {
            const savedMods = localStorage.getItem('mod-library');
            if (savedMods) {
                setMods(JSON.parse(savedMods));
            }
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

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const newModData: FullMod = JSON.parse(text);

                if (newModData.modInfo && newModData.modInfo.id && newModData.modInfo.name) {
                     if (mods.some(m => m.modInfo.id === newModData.modInfo.id)) {
                        alert(`Mod có ID "${newModData.modInfo.id}" đã tồn tại. Vui lòng xóa mod cũ trước khi nhập phiên bản mới.`);
                        return;
                    }
                    const newMod: ModInLibrary = {
                        modInfo: newModData.modInfo,
                        isEnabled: true,
                    };
                    setMods(prev => [...prev, newMod]);
                    localStorage.setItem(`mod-content-${newModData.modInfo.id}`, JSON.stringify(newModData));
                    alert(`Mod "${newMod.modInfo.name}" đã được nhập thành công!`);
                } else {
                    throw new Error("Tệp mod không hợp lệ. Thiếu thông tin 'modInfo'.");
                }
            } catch (error: any) {
                alert(`Lỗi khi nhập mod: ${error.message}`);
            }
        };
        reader.onerror = () => {
            alert('Không thể đọc tệp tin.');
        };
        reader.readAsText(file);
        
        event.target.value = '';
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
    
    const handleInstallPremadeMod = (modToInstall: FullMod) => {
        if (mods.some(m => m.modInfo.id === modToInstall.modInfo.id)) {
            alert('Mod này đã được cài đặt.');
            return;
        }
        const newModForLibrary: ModInLibrary = {
            modInfo: modToInstall.modInfo,
            isEnabled: true
        };
        setMods(prev => [...prev, newModForLibrary]);
        localStorage.setItem(`mod-content-${modToInstall.modInfo.id}`, JSON.stringify(modToInstall));
        alert(`Đã cài đặt thành công mod "${modToInstall.modInfo.name}"!`);
    }

    const TabButton: React.FC<{ tabId: ModsTab; label: string; icon: React.ElementType }> = ({ tabId, label, icon: Icon }) => (
        <button
          onClick={() => setActiveTab(tabId)}
          className={`w-full flex items-center justify-start gap-4 p-4 text-md font-bold rounded-lg transition-colors duration-200 ${
            activeTab === tabId
              ? 'bg-[color:var(--primary-accent-color)]/20 text-[color:var(--primary-accent-color)]'
              : 'text-[color:var(--text-muted-color)] hover:bg-black/10'
          }`}
        >
          <Icon className="w-6 h-6" />
          <span>{label}</span>
        </button>
    );

  return (
    <div className="w-full animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold font-title">Quản lý Mods</h2>
            <button onClick={onBack} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50" title="Quay Lại Menu">
                <FaArrowLeft className="w-5 h-5" />
            </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8">
            {/* Vertical Tab Navigation */}
            <nav className="w-full md:w-64 flex-shrink-0 flex md:flex-col gap-2">
                <TabButton tabId="library" label="Thư Viện Mod" icon={FaBook} />
                <TabButton tabId="import" label="Nhập Mod" icon={FaUpload} />
                <TabButton tabId="create" label="Tạo Mod" icon={FaPlusSquare} />
            </nav>
            
            {/* Tab Content */}
            <main className="flex-grow min-h-[400px]">
                {activeTab === 'library' && (
                    <div className="space-y-4 animate-fade-in" style={{animationDuration: '300ms'}}>
                        <h3 className="text-xl font-bold font-title">Thư Viện Mod</h3>
                        <p style={{color: 'var(--text-muted-color)'}}>Các gói nội dung tạo sẵn để làm phong phú thêm trải nghiệm của bạn.</p>
                        {PREMADE_MODS.map(mod => (
                            <PremadeModCard 
                                key={mod.modInfo.id}
                                mod={mod}
                                isInstalled={mods.some(m => m.modInfo.id === mod.modInfo.id)}
                                onInstall={handleInstallPremadeMod}
                            />
                        ))}
                    </div>
                )}
                {activeTab === 'import' && (
                    <div className="space-y-4 animate-fade-in" style={{animationDuration: '300ms'}}>
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold font-title">Mods Đã Cài Đặt</h3>
                            <button onClick={handleImportClick} className="flex items-center gap-2 px-4 py-2 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80 transition-colors">
                                <FaUpload /> Nhập từ File
                            </button>
                            <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileSelected} className="hidden" />
                        </div>
                        {mods.length > 0 ? (
                            mods.map(mod => (
                                <ModListItem key={mod.modInfo.id} mod={mod} onToggle={handleToggleMod} onDelete={handleDeleteMod} />
                            ))
                        ) : (
                            <div className="text-center text-gray-500 p-8 bg-black/20 rounded-lg border border-dashed border-gray-700">
                                <FaBoxOpen className="mx-auto text-4xl mb-4" />
                                <p>Bạn chưa có mod nào.</p>
                                <p className="text-sm mt-1">Hãy cài đặt từ "Thư Viện" hoặc "Nhập từ File".</p>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'create' && (
                    <div className="text-center p-8 bg-black/20 rounded-lg border border-dashed border-gray-700 h-full flex flex-col justify-center items-center animate-fade-in" style={{animationDuration: '300ms'}}>
                        <h3 className="text-2xl font-bold font-title">Trở thành người sáng tạo</h3>
                        <p className="mt-2 mb-6 max-w-2xl mx-auto" style={{color: 'var(--text-muted-color)'}}>Sử dụng trình chỉnh sửa mạnh mẽ với sự hỗ trợ của GameMaster AI để tạo ra các vật phẩm, nhân vật, và thậm chí cả hệ thống tu luyện của riêng bạn.</p>
                        <button onClick={() => onNavigate('createMod')} className="themed-button-primary flex items-center justify-center gap-3 w-64 h-16 mx-auto text-xl font-bold font-title rounded-md shadow-lg shadow-black/30">
                            <FaPlusSquare /> Bắt Đầu Sáng Tạo
                        </button>
                    </div>
                )}
            </main>
        </div>
    </div>
  );
};

export default ModsScreen;