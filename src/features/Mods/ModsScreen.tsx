import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { 
    FaArrowLeft, FaTrash, FaCloudDownloadAlt, FaFileSignature, FaUpload, FaBookOpen, FaSearch, FaBrain
} from 'react-icons/fa';
import type { FullMod, ModInfo, CommunityMod, ModInLibrary } from '../../types';
import * as db from '../../services/dbService';
import { fetchCommunityMods } from '../../services/geminiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAppContext } from '../../contexts/AppContext';
import AiGenesisScreen from './components/AiGenesisScreen';
import ManualGenesisScreen from './components/ManualGenesisScreen';

type LibraryView = 'main' | 'library' | 'genesis' | 'manualGenesis';
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

const ModLibrary: React.FC<{ 
    onBack: () => void;
}> = ({ onBack }) => {
    const { state, handleInstallMod, handleToggleMod, handleDeleteModFromLibrary } = useAppContext();
    const { installedMods } = state;
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
    
    const handleInstallCommunityMod = async (modToInstall: CommunityMod) => {
        try {
            const response = await fetch(modToInstall.downloadUrl);
            if (!response.ok) throw new Error('Lỗi mạng khi tải tệp mod.');
            const modData: FullMod = await response.json();
            const success = await handleInstallMod(modData);
            if (success) {
                alert(`Mod "${modToInstall.modInfo.name}" đã được cài đặt thành công!`);
            }
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
        <div className="h-full flex flex-col min-h-0 animate-fade-in">
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
                                    <button onClick={() => handleDeleteModFromLibrary(mod.modInfo.id)} className="p-2 text-gray-400 hover:text-red-400 transition-colors" title="Xóa Mod">
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
    const { handleNavigate, handleInstallMod } = useAppContext();
    const [view, setView] = useState<LibraryView>('main');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const newModData: FullMod = JSON.parse(text);
                const success = await handleInstallMod(newModData);
                if (success) {
                    alert(`Mod "${newModData.modInfo.name}" đã được thêm thành công!`);
                }
            } catch (error: any) {
                alert(`Lỗi khi nhập mod: ${error.message}`);
            }
        };
        reader.onerror = () => alert('Không thể đọc tệp tin.');
        reader.readAsText(file);
        event.target.value = '';
    };

    const renderMainView = () => (
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in lg:max-w-7xl mx-auto">
             <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileSelected} className="hidden" />
              <MenuButton 
                icon={FaFileSignature}
                title="Sáng Tạo Dẫn Hướng"
                description="Điền vào biểu mẫu để AI tạo ra một thế giới dựa trên ý tưởng của bạn."
                onClick={() => setView('manualGenesis')}
            />
             <MenuButton 
                icon={FaBrain}
                title="Sáng Thế từ File"
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
            case 'manualGenesis':
                return <ManualGenesisScreen onBack={() => setView('main')} onInstall={handleInstallMod} />;
            case 'genesis':
                return <AiGenesisScreen onBack={() => setView('main')} onInstall={handleInstallMod} />;
            case 'library':
                return <ModLibrary onBack={() => setView('main')} />;
            case 'main':
            default:
                return renderMainView();
        }
    };

    return (
        <div className="w-full animate-fade-in flex flex-col h-full min-h-0">
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