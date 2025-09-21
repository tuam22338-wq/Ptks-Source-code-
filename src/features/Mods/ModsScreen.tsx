
import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { 
    FaArrowLeft, FaTrash, FaCloudDownloadAlt, FaFileSignature, FaUpload, FaBookOpen, FaSearch, FaBrain
} from 'react-icons/fa';
import type { FullMod, ModInfo, CommunityMod } from '../../types';
import * as db from '../../services/dbService';
import { fetchCommunityMods } from '../../services/geminiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAppContext } from '../../contexts/AppContext';
import AiGenesisScreen from './components/AiGenesisScreen';

interface ModInLibrary {
    modInfo: ModInfo;
    isEnabled: boolean;
}

type LibraryView = 'main' | 'library' | 'genesis';
type ModFilter = 'all' | 'installed' | 'community';

type UnifiedMod =
    | {
        modInfo: ModInfo;
        source: 'installed';
        isEnabled: boolean;
    }
    | {
        modInfo: ModInfo;
        source: 'community';
        downloadUrl: string;
    };

const MenuButton: React.FC<{
    icon: React.ElementType;
    title: string;
    description: string;
    onClick: () => void;
}> = memo(({ icon: Icon, title, description, onClick }) => (
    <button 
        onClick={onClick}
        className="group flex flex-col items-center justify-center text-center p-6 bg-black/20 rounded-lg border-2 border-gray-700/80 hover:border-[var(--primary-accent-color)]/80 hover:bg-[var(--primary-accent-color)]/10 transition-all duration-300 transform hover:-translate-y-2"
    >
        <Icon className="text-6xl text-gray-400 group-hover:text-[var(--primary-accent-color)] transition-colors duration-300 mb-4" />
        <h3 className="text-2xl font-bold font-title text-gray-200 group-hover:text-white">{title}</h3>
        <p className="text-sm text-gray-500 group-hover:text-gray-400 mt-2">{description}</p>
    </button>
));

const ModLibrary: React.FC<{ onBack: () => void, installedMods: ModInLibrary[], setInstalledMods: React.Dispatch<React.SetStateAction<ModInLibrary[]>> }> = ({ onBack, installedMods, setInstalledMods }) => {
    const [communityMods, setCommunityMods] = useState<CommunityMod[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState<ModFilter>('all');

    useEffect(() => {
        setIsLoading(true);
        fetchCommunityMods()
            .then(setCommunityMods)
            .catch(err => setError(err.message || 'Không thể tải mod.'))
            .finally(() => setIsLoading(false));
    }, []);

    const handleImportOrInstallMod = async (newModData: FullMod) => {
        if (!newModData.modInfo?.id || !newModData.modInfo?.name) {
            alert("Tệp mod không hợp lệ. Thiếu thông tin 'modInfo' hoặc ID/tên.");
            return;
        }
        if (installedMods.some(m => m.modInfo.id === newModData.modInfo.id)) {
            alert(`Mod có ID "${newModData.modInfo.id}" đã tồn tại.`);
            return;
        }

        try {
            const newMod: ModInLibrary = {
                modInfo: newModData.modInfo,
                isEnabled: true,
            };
            await db.saveModToLibrary(newMod);
            await db.saveModContent(newModData.modInfo.id, newModData);
            setInstalledMods(prev => [...prev, newMod]);
            alert(`Mod "${newMod.modInfo.name}" đã được thêm thành công!`);
        } catch (error) {
            console.error("Error installing mod:", error);
            alert("Lỗi khi cài đặt mod.");
        }
    };

    const handleToggleMod = async (id: string) => {
        const updatedMods = installedMods.map(mod => mod.modInfo.id === id ? { ...mod, isEnabled: !mod.isEnabled } : mod);
        setInstalledMods(updatedMods);
        try {
            await db.saveModLibrary(updatedMods);
        } catch (error) {
             console.error("Error saving mod library:", error);
             alert("Không thể lưu thay đổi trạng thái mod.");
             setInstalledMods(installedMods);
        }
    };

    const handleDeleteMod = async (id: string) => {
        const modToDelete = installedMods.find(m => m.modInfo.id === id);
        if (window.confirm(`Bạn có chắc muốn xóa vĩnh viễn mod "${modToDelete?.modInfo.name}"?`)) {
            try {
                await db.deleteModFromLibrary(id);
                await db.deleteModContent(id);
                setInstalledMods(mods => mods.filter(mod => mod.modInfo.id !== id));
            } catch (error) {
                console.error("Error deleting mod:", error);
                alert("Không thể xóa mod.");
            }
        }
    };

    const handleInstallCommunityMod = async (modToInstall: CommunityMod) => {
        try {
            const response = await fetch(modToInstall.downloadUrl);
            if (!response.ok) throw new Error('Lỗi mạng khi tải tệp mod.');
            const modData: FullMod = await response.json();
            await handleImportOrInstallMod(modData);
        } catch (err) {
            alert(`Lỗi khi cài đặt mod "${modToInstall.modInfo.name}": ${(err as Error).message}`);
        }
    };

    const filteredAndUnifiedMods = useMemo((): UnifiedMod[] => {
        const unifiedList: UnifiedMod[] = [];
        
        if (activeFilter === 'all' || activeFilter === 'installed') {
            unifiedList.push(...installedMods.map(mod => ({
                modInfo: mod.modInfo,
                source: 'installed' as const,
                isEnabled: mod.isEnabled,
            })));
        }

        if (activeFilter === 'all' || activeFilter === 'community') {
            const installedIds = new Set(installedMods.map(m => m.modInfo.id));
            communityMods.forEach(mod => {
                if (!installedIds.has(mod.modInfo.id)) {
                    unifiedList.push({
                        modInfo: mod.modInfo,
                        source: 'community' as const,
                        downloadUrl: mod.downloadUrl,
                    });
                }
            });
        }
        
        if (!searchTerm) {
            return unifiedList;
        }

        const lowercasedSearch = searchTerm.toLowerCase();
        return unifiedList.filter(mod => 
            mod.modInfo.name.toLowerCase().includes(lowercasedSearch) ||
            mod.modInfo.author?.toLowerCase().includes(lowercasedSearch) ||
            mod.modInfo.description?.toLowerCase().includes(lowercasedSearch)
        );
    }, [installedMods, communityMods, activeFilter, searchTerm]);
    
    return (
        <div className="flex-grow flex flex-col min-h-0 animate-fade-in">
            <div className="flex-shrink-0 mb-4">
                 <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4">
                    <FaArrowLeft /> Quay Lại Menu
                </button>
                 <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-grow">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input 
                            type="text"
                            placeholder="Tìm kiếm mod..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-black/30 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary-accent-color)]/50"
                        />
                    </div>
                     <div className="flex-shrink-0 flex items-center gap-2 p-1 bg-black/30 rounded-lg border border-gray-600">
                        {(['all', 'installed', 'community'] as ModFilter[]).map(filter => (
                            <button 
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${activeFilter === filter ? 'bg-gray-600 text-white' : 'text-gray-400 hover:bg-gray-700/50'}`}
                            >
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                 {isLoading && <div className="flex justify-center pt-10"><LoadingSpinner message="Đang tải..." /></div>}
                 {error && <p className="text-center text-red-400">{error}</p>}
                 {!isLoading && !error && filteredAndUnifiedMods.map(mod => (
                    <div key={mod.modInfo.id} className="bg-black/20 p-3 rounded-lg border border-gray-700/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex-grow">
                            <h4 className="font-bold text-gray-200">{mod.modInfo.name}</h4>
                            <p className="text-xs text-gray-400">bởi {mod.modInfo.author || 'Vô danh'}</p>
                            <p className="text-sm text-gray-500 mt-1">{mod.modInfo.description}</p>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0 w-full sm:w-auto justify-end">
                            {mod.source === 'installed' ? (
                                <>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={mod.isEnabled} onChange={() => handleToggleMod(mod.modInfo.id)} className="sr-only peer" />
                                        <div className="w-14 h-7 bg-gray-700 rounded-full border border-gray-600 peer peer-focus:ring-2 peer-focus:ring-gray-500/50 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-accent-color)]"></div>
                                    </label>
                                    <button onClick={() => handleDeleteMod(mod.modInfo.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Xóa Mod">
                                        <FaTrash />
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => handleInstallCommunityMod(mod)} className="flex items-center gap-2 px-3 py-1.5 bg-teal-700/80 text-white text-xs font-bold rounded-lg hover:bg-teal-600/80">
                                    <FaCloudDownloadAlt /> Cài đặt
                                </button>
                            )}
                        </div>
                    </div>
                 ))}
                 {!isLoading && filteredAndUnifiedMods.length === 0 && (
                     <div className="text-center text-gray-500 p-8 h-full flex flex-col justify-center items-center">
                        <p>Không tìm thấy mod nào phù hợp.</p>
                    </div>
                 )}
            </div>
        </div>
    );
}


const ModsScreen: React.FC = () => {
    const { handleNavigate } = useAppContext();
    const [installedMods, setInstalledMods] = useState<ModInLibrary[]>([]);
    const [view, setView] = useState<LibraryView>('main');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadMods = async () => {
            try {
                const mods = await db.getModLibrary();
                setInstalledMods(mods);
            } catch (error) {
                console.error("Failed to load mods from DB", error);
            }
        };
        loadMods();
    }, []);
    
    const handleInstallMod = async (newModData: FullMod) => {
        if (!newModData.modInfo?.id || !newModData.modInfo?.name) {
            alert("Tệp mod không hợp lệ. Thiếu thông tin 'modInfo' hoặc ID/tên.");
            return false;
        }
        if (installedMods.some(m => m.modInfo.id === newModData.modInfo.id)) {
            alert(`Mod có ID "${newModData.modInfo.id}" đã tồn tại.`);
            return false;
        }

        try {
            const newMod: ModInLibrary = {
                modInfo: newModData.modInfo,
                isEnabled: true,
            };
            await db.saveModToLibrary(newMod);
            await db.saveModContent(newModData.modInfo.id, newModData);
            setInstalledMods(prev => [...prev, newMod]);
            alert(`Mod "${newMod.modInfo.name}" đã được thêm thành công!`);
            return true;
        } catch (error) {
            console.error("Error installing mod:", error);
            alert("Lỗi khi cài đặt mod.");
            return false;
        }
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const newModData: FullMod = JSON.parse(text);
                handleInstallMod(newModData);
            } catch (error: any) {
                alert(`Lỗi khi nhập mod: ${error.message}`);
            }
        };
        reader.onerror = () => alert('Không thể đọc tệp tin.');
        reader.readAsText(file);
        event.target.value = '';
    };

    const renderMainView = () => (
        <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in md:max-w-4xl mx-auto">
             <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileSelected} className="hidden" />
              <MenuButton 
                icon={FaBrain}
                title="AI Sáng Thế Ký"
                description="Tải lên file .txt chứa lore để AI tự động tạo ra một thế giới hoàn chỉnh."
                onClick={() => setView('genesis')}
            />
             <MenuButton 
                icon={FaUpload}
                title="Nhập Mod"
                description="Tải lên tệp mod (.json) từ máy tính của bạn để thêm vào thư viện."
                onClick={() => fileInputRef.current?.click()}
            />
             <MenuButton 
                icon={FaBookOpen}
                title="Thư Viện"
                description="Quản lý các mod đã cài đặt và khám phá các mod từ cộng đồng."
                onClick={() => setView('library')}
            />
        </div>
    );
    
    const renderContent = () => {
        switch(view) {
            case 'genesis':
                return <AiGenesisScreen onBack={() => setView('main')} onInstall={handleInstallMod} />;
            case 'library':
                return <ModLibrary onBack={() => setView('main')} installedMods={installedMods} setInstalledMods={setInstalledMods} />;
            case 'main':
            default:
                return renderMainView();
        }
    };

    return (
        <div className="w-full h-full max-h-[85vh] animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8 flex flex-col">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-3xl font-bold font-title">Quản lý Mods</h2>
                <button onClick={() => handleNavigate('mainMenu')} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50" title="Quay Lại Menu">
                    <FaArrowLeft className="w-5 h-5" />
                </button>
            </div>
           {renderContent()}
        </div>
    );
};

export default memo(ModsScreen);
