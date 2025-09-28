import React, { useState, useEffect, memo, useRef } from 'react';
import { FaArrowLeft, FaCheckCircle, FaUpload, FaDownload, FaEdit } from 'react-icons/fa';
import type { FullMod, ModWorldData, ModInLibrary, NPC, Location, ModNpc, ModLocation, NpcRelationshipInput } from '../../types';
import * as db from '../../services/dbService';
import { 
    DEFAULT_WORLDS_INFO,
    PT_MAJOR_EVENTS, PT_WORLD_MAP, PT_NPC_LIST, PT_FACTIONS,
    JTTW_MAJOR_EVENTS, JTTW_WORLD_MAP, JTTW_NPC_LIST, JTTW_FACTIONS,
    REALM_SYSTEM, DEFAULT_ATTRIBUTE_DEFINITIONS, DEFAULT_ATTRIBUTE_GROUPS
} from '../../constants';
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
    const { state, handleNavigate, handleSetActiveWorldId, handleInstallMod, dispatch } = useAppContext();
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
    
    const handleEditWorld = async () => {
        if (!state.activeWorldId) {
            alert('Vui lòng chọn một thế giới để chỉnh sửa.');
            return;
        }
        dispatch({ type: 'SET_LOADING', payload: { isLoading: true, message: 'Đang chuẩn bị dữ liệu thế giới...' } });
        
        const worldInfo = worlds.find(w => w.id === state.activeWorldId);
        if (!worldInfo) {
            alert('Không tìm thấy thông tin thế giới đã chọn.');
            dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
            return;
        }

        let modDataToEdit: FullMod | null = null;
        
        try {
            if (worldInfo.source === 'mod') {
                for (const installedMod of state.installedMods) {
                    const modContent = await db.getModContent(installedMod.modInfo.id);
                    if (modContent?.content.worldData?.some(w => w.name === state.activeWorldId)) {
                        modDataToEdit = modContent;
                        break;
                    }
                }
            } else { // 'default' source
                 const defaultWorldInfo = DEFAULT_WORLDS_INFO[state.activeWorldId as keyof typeof DEFAULT_WORLDS_INFO];
                if (!defaultWorldInfo) throw new Error('Không tìm thấy dữ liệu cho thế giới mặc định này.');

                let events, npcs, locations, factions, year, era;
                if (state.activeWorldId === 'phong_than_dien_nghia') {
                    events = PT_MAJOR_EVENTS; npcs = PT_NPC_LIST; locations = PT_WORLD_MAP; factions = PT_FACTIONS; year = 1; era = 'Tiên Phong Thần';
                } else { // tay_du_ky
                    events = JTTW_MAJOR_EVENTS; npcs = JTTW_NPC_LIST; locations = JTTW_WORLD_MAP; factions = JTTW_FACTIONS; year = 627; era = 'Đường Trinh Quán';
                }

                const npcListForLookup = state.activeWorldId === 'phong_than_dien_nghia' ? PT_NPC_LIST : JTTW_NPC_LIST;
                const mappedNpcs = npcs.map(npc => ({
                    id: npc.id, name: npc.identity.name, status: npc.status, description: npc.identity.appearance, origin: npc.identity.origin,
                    personality: npc.identity.personality, locationId: npc.locationId, faction: npc.faction,
                    talentNames: npc.talents?.map(t => t.name),
                    relationships: npc.relationships?.map((r): NpcRelationshipInput => ({
                        targetNpcName: npcListForLookup.find(n => n.id === r.targetNpcId)?.identity.name || r.targetNpcId,
                        type: r.type, description: r.description
                    }))
                }));
                const mappedLocations = locations.map(loc => { const { contextualActions, shopIds, ...rest } = loc; return { ...rest, tags: [] }; });

                modDataToEdit = {
                    modInfo: {
                        id: state.activeWorldId, name: defaultWorldInfo.name, author: 'Chỉnh sửa từ bản gốc',
                        description: `Một phiên bản tùy chỉnh của thế giới mặc định '${defaultWorldInfo.name}'.`, version: '1.0.0',
                    },
                    content: {
                        worldData: [{
                            name: defaultWorldInfo.name, description: defaultWorldInfo.description, startingYear: year, eraName: era,
                            majorEvents: events, factions: factions, initialLocations: mappedLocations, initialNpcs: mappedNpcs,
                        }],
                        namedRealmSystems: [{
                            id: 'default_realm_system', name: 'Hệ Thống Tu Luyện Mặc Định',
                            description: 'Hệ thống tu luyện gốc của game.', realms: REALM_SYSTEM,
                        }],
                        attributeSystem: { definitions: DEFAULT_ATTRIBUTE_DEFINITIONS, groups: DEFAULT_ATTRIBUTE_GROUPS }
                    }
                };
            }

            if (modDataToEdit) {
                dispatch({ type: 'SET_MOD_FOR_EDITING', payload: modDataToEdit });
                handleNavigate('mods');
            } else {
                throw new Error('Không thể tải dữ liệu mod để chỉnh sửa.');
            }
        } catch(error: any) {
            alert(`Lỗi khi chuẩn bị dữ liệu thế giới: ${error.message}`);
        } finally {
            dispatch({ type: 'SET_LOADING', payload: { isLoading: false } });
        }
    };

    const handleExportWorld = async () => {
        if (!state.activeWorldId) {
            alert('Vui lòng chọn một thế giới để xuất.');
            return;
        }
        const worldInfo = worlds.find(w => w.id === state.activeWorldId);
        if (!worldInfo) {
            alert('Không tìm thấy thông tin thế giới đã chọn.');
            return;
        }

        let modToExport: FullMod | null = null;

        if (worldInfo.source === 'mod') {
            for (const installedMod of state.installedMods) {
                const modContent = await db.getModContent(installedMod.modInfo.id);
                if (modContent?.content.worldData?.some(w => w.name === state.activeWorldId)) {
                    modToExport = modContent;
                    break;
                }
            }
        } else { // 'default' source
            const defaultWorldInfo = DEFAULT_WORLDS_INFO[state.activeWorldId as keyof typeof DEFAULT_WORLDS_INFO];
            if (!defaultWorldInfo) {
                alert('Không tìm thấy dữ liệu cho thế giới mặc định này.');
                return;
            }

            let events, npcs, locations, factions, year, era;
            if (state.activeWorldId === 'phong_than_dien_nghia') {
                events = PT_MAJOR_EVENTS;
                npcs = PT_NPC_LIST;
                locations = PT_WORLD_MAP;
                factions = PT_FACTIONS;
                year = 1;
                era = 'Tiên Phong Thần';
            } else if (state.activeWorldId === 'tay_du_ky') {
                events = JTTW_MAJOR_EVENTS;
                npcs = JTTW_NPC_LIST;
                locations = JTTW_WORLD_MAP;
                factions = JTTW_FACTIONS;
                year = 627;
                era = 'Đường Trinh Quán';
            } else {
                alert('Thế giới mặc định không được hỗ trợ để xuất.');
                return;
            }

            const npcListForLookup = state.activeWorldId === 'phong_than_dien_nghia' ? PT_NPC_LIST : JTTW_NPC_LIST;

            const mappedNpcs = npcs.map(npc => ({
                id: npc.id,
                name: npc.identity.name,
                status: npc.status,
                description: npc.identity.appearance,
                origin: npc.identity.origin,
                personality: npc.identity.personality,
                locationId: npc.locationId,
                faction: npc.faction,
                talentNames: npc.talents?.map(t => t.name),
                relationships: npc.relationships?.map((r): NpcRelationshipInput => ({
                    targetNpcName: npcListForLookup.find(n => n.id === r.targetNpcId)?.identity.name || r.targetNpcId,
                    type: r.type,
                    description: r.description
                }))
            }));

            const mappedLocations = locations.map(loc => {
                const { contextualActions, shopIds, ...rest } = loc;
                return { ...rest, tags: [] };
            });

            modToExport = {
                modInfo: {
                    id: `${state.activeWorldId}_exported_${Date.now()}`,
                    name: `${defaultWorldInfo.name} (Exported)`,
                    author: 'Player Export',
                    description: `Một phiên bản xuất của thế giới mặc định '${defaultWorldInfo.name}'.`,
                    version: '1.0.0',
                },
                content: {
                    worldData: [{
                        name: defaultWorldInfo.name,
                        description: defaultWorldInfo.description,
                        startingYear: year,
                        eraName: era,
                        majorEvents: events,
                        factions: factions,
                        initialLocations: mappedLocations,
                        initialNpcs: mappedNpcs,
                    }],
                    namedRealmSystems: [{
                        id: 'default_realm_system',
                        name: 'Hệ Thống Tu Luyện Mặc Định',
                        description: 'Hệ thống tu luyện gốc của game.',
                        realms: REALM_SYSTEM,
                    }],
                    attributeSystem: {
                        definitions: DEFAULT_ATTRIBUTE_DEFINITIONS,
                        groups: DEFAULT_ATTRIBUTE_GROUPS,
                    }
                }
            };
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
                alert(`Đã xuất thế giới "${modToExport.modInfo.name}" thành công!`);
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
                        <FaUpload /> Nhập
                    </button>
                     <button onClick={handleEditWorld} disabled={!state.activeWorldId} className="flex items-center gap-2 px-4 py-2 bg-blue-700/80 text-white text-sm font-bold rounded-lg hover:bg-blue-600/80 disabled:opacity-50 disabled:cursor-not-allowed">
                        <FaEdit /> Chỉnh Sửa
                    </button>
                    <button onClick={handleExportWorld} className="flex items-center gap-2 px-4 py-2 bg-amber-700/80 text-white text-sm font-bold rounded-lg hover:bg-amber-600/80">
                        <FaDownload /> Xuất
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