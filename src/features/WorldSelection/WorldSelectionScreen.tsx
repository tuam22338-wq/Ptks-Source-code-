import React, { useState, useEffect, memo } from 'react';
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import type { FullMod, ModWorldData } from '../../types';
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
    const { handleNavigate, state, handleSetActiveWorldId } = useAppContext();
    const [worlds, setWorlds] = useState<WorldInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadWorlds = async () => {
            setIsLoading(true);
            const defaultWorlds: WorldInfo[] = Object.values(DEFAULT_WORLDS_INFO);

            const modWorlds: WorldInfo[] = [];
            try {
                const modLibrary = await db.getModLibrary();
                for (const modInLib of modLibrary) {
                    const modContent = await db.getModContent(modInLib.modInfo.id);
                    if (modContent?.content.worldData) {
                        for (const worldData of modContent.content.worldData) {
                            modWorlds.push({
                                ...worldData,
                                id: worldData.name,
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
    }, []);

    const handleSelectWorld = async (worldId: string) => {
        await handleSetActiveWorldId(worldId);
        alert(`Đã chọn thế giới: ${worlds.find(w => w.id === worldId)?.name}`);
    };

    return (
        <div className="w-full animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold font-title">Lựa Chọn Thế Giới</h2>
                <button onClick={() => handleNavigate('mainMenu')} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50" title="Quay Lại Menu">
                    <FaArrowLeft className="w-5 h-5" />
                </button>
            </div>
            <p className="text-center mb-10" style={{color: 'var(--text-muted-color)'}}>
                Mỗi thế giới mang đến một bối cảnh, nhân vật và dòng sự kiện khác nhau. Lựa chọn của bạn sẽ quyết định khởi đầu cho hành trình mới.
            </p>

            {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner message="Đang tải các thế giới..." />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-4">
                    {worlds.map(world => (
                        <WorldCard 
                            key={world.id}
                            world={world}
                            isActive={state.activeWorldId === world.id}
                            onSelect={() => handleSelectWorld(world.id)}
                        />
                    ))}
                    {worlds.length === 1 && (
                        <div className="md:col-span-2 lg:col-span-3 text-center text-gray-500 p-8">
                            <p>Bạn có thể thêm các thế giới khác bằng cách cài đặt mod có chứa "Dữ Liệu Thế Giới".</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default memo(WorldSelectionScreen);