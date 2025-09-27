import React, { useState, useEffect, memo, useRef } from 'react';
import { FaArrowLeft, FaCheckCircle, FaUpload, FaDownload } from 'react-icons/fa';
import type { FullMod, ModWorldData, ModInLibrary } from '../../types';
import * as db from '../../services/dbService';
import { DEFAULT_WORLDS_INFO } from '../../constants';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAppContext } from '../../contexts/AppContext';

interface WorldInfo {
    id: string;
    name: string;
    description: string;
    source: 'default' | 'mod';
    author?: string;
}


const WorldCard: React.FC<{ world: WorldInfo; isActive: boolean; onSelect: () => void; }> = memo(({ world, isActive, onSelect }) => {
    return (
        <button 
            onClick={onSelect}
            className={`relative group text-left p-5 bg-black/20 rounded-xl border-2 flex flex-col h-full transform transition-all duration-300 hover:-translate-y-1 
                ${isActive 
                    ? 'border-amber-400/80 ring-2 ring-amber-400/30' 
                    : 'border-gray-700/60 hover:border-amber-400/50'
                }`}
        >
            {isActive && (
                <div className="absolute top-3 right-3 text-amber-300">
                    <FaCheckCircle size={20} title="Thế giới đang hoạt động" />
                </div>
            )}
            <h3 className="text-2xl font-bold font-title text-amber-400">{world.name}</h3>
            <p className="text-xs text-gray-500 uppercase">
                {world.source === 'default' ? 'Mặc Định' : `MOD CỦA ${world.author || 'VÔ DANH'}`}
            </p>
            <p className="text-sm text-gray-400 mt-2 mb-4 flex-grow">{world.description}</p>
        </button>
    );
});


const WorldSelectionScreen: React.FC = () => {
    const { handleNavigate, state, handleSetActiveWorldId, handleInstallMod } = useAppContext();
    const [worlds, setWorlds] = useState<WorldInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const importInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadWorlds = async () => {
            setIsLoading(true);
            const defaultWorlds: WorldInfo[] = Object.values(DEFAULT_WORLDS_INFO);

            const modWorlds: WorldInfo[] = [];
            try {
                // Use the globally managed installed mods from context
                for (const modInLib of state.installedMods) {
                    if (!modInLib.isEnabled) continue;
                    const modContent = await db.getModContent(modInLib.modInfo.id);
                    if (modContent?.content.worldData) {
                        for (const worldData of modContent.content.worldData) {
                            modWorlds.push({
                                ...worldData,
                                id: worldData.name, // Use name as ID for selection
                                source: 'mod',
                                author: modContent.modInfo.author,
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to load modded worlds:", error);
            }

            setWorlds([...defaultWorlds, ...modWorlds]);
            setIsLoading(false);
        };
        loadWorlds();
    }, [state.installedMods]);

    const handleSelectWorld = async (worldId: string) => {
        await handleSetActiveWorldId(worldId);
        alert(`Đã chọn thế giới: ${worlds.find(w => w.id === worldId)?.name}`);
    };

    const handleExportWorld = async () => {
        if (!state.activeWorldId) {
            alert('Vui lòng chọn một thế giới để xuất.');
            return;
        }
        const worldInfo = worlds.find(w => w.id === state.activeWorldId);
        if (!worldInfo || worldInfo.source !== 'mod') {
            alert('Chỉ có thể xuất các thế giới được tạo từ mod.');
            return;
        }

        let modToExport: FullMod | null = null;
        for (const installedMod of state.installedMods) {
            const modContent = await db.getModContent(installedMod.modInfo.id);
            if (modContent?.content.worldData?.some(w => w.name === state.activeWorldId)) {
                modToExport = modContent;
                break;
            }
        }

        if (modToExport) {
            try {
                const jsonString = JSON.stringify(modToExport, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${modToExport.modInfo.id}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch (error) {
                alert('Xuất file thế giới thất bại.');
                console.error("Failed to export world:", error);
            }
        } else {
            alert('Không tìm thấy dữ liệu mod cho thế giới đã chọn.');
        }
    };

    const handleImportFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const text = e.target?.result as string;
                const modData: FullMod = JSON.parse(text);
                const success = await handleInstallMod(modData);
                if (success) {
                    alert(`Mod/Thế giới "${modData.modInfo.name}" đã được nhập và cài đặt thành công!`);
                }
            } catch (error: any) {
                alert(`Lỗi khi nhập mod: ${error.message}`);
            }
        };
        reader.onerror = () => alert('Không thể đọc tệp tin.');
        reader.readAsText(file);
        if(importInputRef.current) importInputRef.current.value = "";
    };

    return (
        <div className="w-full animate-fade-in flex flex-col h-full min-h-0">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <button onClick={() => handleNavigate('mainMenu')} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50" title="Quay Lại Menu">
                        <FaArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-3xl font-bold font-title">Lựa Chọn Thế Giới</h2>
                </div>
                <div className="flex items-center gap-3">
                    <input type="file" accept=".json" ref={importInputRef} onChange={handleImportFileSelected} className="hidden" />
                    <button onClick={() => importInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-teal-700/80 text-white text-sm font-bold rounded-lg hover:bg-teal-600/80">
                        <FaUpload /> Nhập Thế Giới
                    </button>
                    <button onClick={handleExportWorld} className="flex items-center gap-2 px-4 py-2 bg-amber-700/80 text-white text-sm font-bold rounded-lg hover:bg-amber-600/80">
                        <FaDownload /> Xuất Thế Giới
                    </button>
                </div>
            </div>
            <p className="text-center mb-10" style={{color: 'var(--text-muted-color)'}}>
                Mỗi thế giới mang đến một bối cảnh, nhân vật và dòng sự kiện khác nhau. Lựa chọn của bạn sẽ quyết định khởi đầu cho hành trình mới.
            </p>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner message="Đang tải các thế giới..." />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow min-h-0 overflow-y-auto pr-4">
                    {worlds.map(world => (
                        <WorldCard 
                            key={world.id}
                            world={world}
                            isActive={state.activeWorldId === world.id}
                            onSelect={() => handleSelectWorld(world.id)}
                        />
                    ))}
                     {worlds.length === 0 && (
                        <div className="md:col-span-2 lg:col-span-3 text-center text-gray-500 p-8">
                            <p>Không tìm thấy thế giới nào.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default memo(WorldSelectionScreen);