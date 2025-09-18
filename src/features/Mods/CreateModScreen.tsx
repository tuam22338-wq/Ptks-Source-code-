import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import {
    FaArrowLeft, FaBoxOpen, FaUserShield, FaStar, FaPlus, FaEdit, FaTrash,
    FaFileSignature, FaRobot, FaDownload, FaFileCode, FaClone, FaMapMarkedAlt, FaProjectDiagram, FaAngleRight, FaAngleDown
} from 'react-icons/fa';
import { GiCastle, GiScrollQuill, GiWorld, GiVial } from 'react-icons/gi';
import * as db from '../../services/dbService';
import type {
    ContentType, AddedContentUnion, AiGeneratedModData, ModInfo, FullMod, ModContent
} from '../../types';
import AiContentGeneratorPanel from './components/AiContentGeneratorModal';
import ItemEditor from './components/ItemEditorModal';
import CharacterEditor from './components/CharacterEditorModal';
import SectEditor from './components/SectEditorModal';
import WorldContentEditor from './components/WorldBuildingEditorModal';
import NpcEditor from './components/NpcEditorModal';
import AuxiliaryTechniqueEditor from './components/AuxiliaryTechniqueEditorModal';
import MainTechniqueEditor from './components/MainTechniqueEditorModal';
import EventEditor from './components/EventEditorModal';
import RecipeEditor from './components/RecipeEditorModal';
import { ALL_ATTRIBUTES } from '../../constants';
import { useAppContext } from '../../contexts/AppContext';

type EditorState = {
    type: ContentType;
    id: string;
} | null;


const CONTENT_TYPE_INFO: Record<Exclude<ContentType, 'realm' | 'realmSystem' | 'talentSystem' | 'customPanel' | 'talent'>, { label: string; icon: React.ElementType; color: string }> = {
    item: { label: 'Vật Phẩm', icon: FaBoxOpen, color: 'text-sky-400' },
    character: { label: 'Nhân Vật', icon: FaUserShield, color: 'text-emerald-400' },
    sect: { label: 'Tông Môn', icon: GiCastle, color: 'text-gray-400' },
    location: { label: 'Địa Điểm', icon: FaMapMarkedAlt, color: 'text-lime-400' },
    worldData: { label: 'Dữ Liệu TG', icon: GiWorld, color: 'text-rose-400' },
    npc: { label: 'NPC', icon: FaUserShield, color: 'text-cyan-400' },
    mainCultivationTechnique: { label: 'Công Pháp Chủ Đạo', icon: FaProjectDiagram, color: 'text-amber-400' },
    auxiliaryTechnique: { label: 'Công Pháp Phụ', icon: GiScrollQuill, color: 'text-yellow-400' },
    event: { label: 'Sự Kiện', icon: FaStar, color: 'text-orange-400' },
    recipe: { label: 'Đan Phương', icon: GiVial, color: 'text-yellow-400' },
};
const CONTENT_TYPES_ORDER = Object.keys(CONTENT_TYPE_INFO) as (keyof typeof CONTENT_TYPE_INFO)[];

const ModStudioNavigator: React.FC<{
    content: AddedContentUnion[];
    activeEditor: EditorState;
    onSelect: (type: ContentType, id: string) => void;
    onAdd: (type: ContentType) => void;
    onDelete: (id: string, type: ContentType) => void;
    onDuplicate: (content: AddedContentUnion) => void;
}> = ({ content, activeEditor, onSelect, onAdd, onDelete, onDuplicate }) => {
    const [expanded, setExpanded] = useState<Set<ContentType>>(new Set(CONTENT_TYPES_ORDER));

    const groupedContent = useMemo(() => {
        const groups: Partial<Record<ContentType, AddedContentUnion[]>> = {};
        for (const item of content) {
            if (!groups[item.contentType]) {
                groups[item.contentType] = [];
            }
            groups[item.contentType]!.push(item);
        }
        return groups;
    }, [content]);
    
    const toggleGroup = (type: ContentType) => {
        setExpanded(prev => {
            const newSet = new Set(prev);
            if (newSet.has(type)) newSet.delete(type);
            else newSet.add(type);
            return newSet;
        });
    };

    return (
        <div className="mod-navigator">
            <h3 className="text-lg font-bold font-title p-2">Thư mục Mod</h3>
            <div className="overflow-y-auto pr-1">
                {CONTENT_TYPES_ORDER.map(type => {
                    const info = CONTENT_TYPE_INFO[type];
                    const items = groupedContent[type] || [];
                    const isExpanded = expanded.has(type);
                    return (
                        <div key={type} className="mb-2">
                            <div className="flex items-center justify-between px-2 py-1 rounded bg-gray-800/50">
                                <button onClick={() => toggleGroup(type)} className="flex items-center gap-2 text-left flex-grow">
                                    {isExpanded ? <FaAngleDown/> : <FaAngleRight/>}
                                    <info.icon className={`w-4 h-4 ${info.color}`} />
                                    <span className="font-semibold text-sm text-gray-300">{info.label}</span>
                                </button>
                                <button onClick={() => onAdd(type)} className="p-1 text-gray-400 hover:text-white" title={`Thêm ${info.label} mới`}><FaPlus size={12} /></button>
                            </div>
                            {isExpanded && (
                                <div className="pl-4 mt-1 space-y-1">
                                    {items.map(item => {
                                        const name = 'name' in item ? item.name : ('title' in item ? item.title : 'Không tên');
                                        const isActive = activeEditor?.id === item.id;
                                        return (
                                            <div key={item.id} className={`group relative flex items-center rounded text-sm pr-1 ${isActive ? 'bg-amber-500/10' : 'hover:bg-gray-700/50'}`}>
                                                <button onClick={() => onSelect(item.contentType, item.id)} className={`flex-grow text-left px-2 py-1 rounded ${isActive ? 'text-amber-300' : 'text-gray-400'}`}>
                                                    {name || `(Chưa có tên - ${item.contentType})`}
                                                </button>
                                                <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => onDuplicate(item)} className="p-1 text-gray-500 hover:text-blue-400" title="Nhân bản"><FaClone size={10}/></button>
                                                    <button onClick={() => onDelete(item.id, item.contentType)} className="p-1 text-gray-500 hover:text-red-400" title="Xóa"><FaTrash size={10}/></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const CreateModScreen: React.FC = () => {
    const { handleNavigate } = useAppContext();
    const [modInfo, setModInfo] = useState<ModInfo>({ id: '', name: '', author: '', description: '', version: '1.0.0' });
    const [addedContent, setAddedContent] = useState<AddedContentUnion[]>([]);
    const [activeEditor, setActiveEditor] = useState<EditorState>(null);
    const [activeStudioTab, setActiveStudioTab] = useState<'editor' | 'ai'>('editor');

    useEffect(() => {
        const loadDraft = async () => {
            const draft = await db.getModDraft();
            if (draft) {
                setModInfo(draft.modInfo || { id: '', name: '', author: '', description: '', version: '1.0.0' });
                setAddedContent(draft.addedContent || []);
            }
        };
        loadDraft();
    }, []);

    const handleSaveDraft = useCallback(async () => {
        try {
            await db.saveModDraft({ modInfo, addedContent });
            alert('Đã lưu bản nháp thành công!');
        } catch (error) {
            console.error('Failed to save draft:', error);
            alert('Lỗi: Không thể lưu bản nháp.');
        }
    }, [modInfo, addedContent]);
    
    const handleAddContent = (type: ContentType) => {
        const newId = `${type}-${Date.now()}`;
        let newContent: AddedContentUnion | null = null;
        switch(type) {
            case 'item': newContent = { id: newId, contentType: 'item', name: '', description: '', type: 'Tạp Vật', quality: 'Phàm Phẩm', weight: 0.1, bonuses: [], tags: [], vitalEffects: [] }; break;
            case 'character': newContent = { id: newId, contentType: 'character', name: '', gender: 'Nam', origin: '', appearance: '', personality: '', bonuses: [], tags: [] }; break;
            case 'sect': newContent = { id: newId, contentType: 'sect', name: '', description: '', location: '', members: [], tags: [] }; break;
            case 'location': newContent = { id: newId, contentType: 'location', name: '', description: '', type: 'Hoang Dã', neighbors: [], coordinates: {x:0, y:0}, qiConcentration: 10, tags: [] }; break;
            case 'worldData': newContent = { id: newId, contentType: 'worldData', name: '', description: '', startingYear: 1, eraName: 'Kỷ Nguyên Mới', majorEvents: [], initialLocations: [], initialNpcs: [], factions: [], tags: [] }; break;
            case 'npc': newContent = { id: newId, contentType: 'npc', name: '', status: '', description: '', origin: '', personality: '', locationId: '', tags: [] }; break;
            case 'auxiliaryTechnique': newContent = { id: newId, contentType: 'auxiliaryTechnique', name: '', description: '', type: 'Thần Thông', cost: {type: 'Linh Lực', value: 10}, cooldown: 0, effects: [], rank: 'Phàm Giai', icon: '💫', level: 1, maxLevel: 10, tags: []}; break;
            case 'mainCultivationTechnique': newContent = { id: newId, contentType: 'mainCultivationTechnique', name: '', description: '', skillTreeNodes: [], compatibleElements: [] }; break;
            case 'event': newContent = { id: newId, contentType: 'event', name: '', description: '', choices: [], tags: [] }; break;
            case 'recipe': newContent = { id: newId, contentType: 'recipe', name: '', description: '', ingredients: [], result: {name: '', quantity: 1}, requiredAttribute: { name: 'Ngự Khí Thuật', value: 10}, icon: '📜', qualityCurve: []}; break;
        }
        if (newContent) {
            setAddedContent(prev => [...prev, newContent!]);
            setActiveEditor({ type, id: newId });
        }
    };

    const handleSaveContent = (content: AddedContentUnion) => {
        setAddedContent(prev => prev.map(c => c.id === content.id ? content : c));
    };
    
    const handleDeleteContent = (id: string, type: ContentType) => {
        if (window.confirm("Bạn có chắc muốn xóa mục này?")) {
            setAddedContent(prev => prev.filter(c => c.id !== id));
            if (activeEditor?.id === id) {
                setActiveEditor(null);
            }
        }
    };
    
    const handleDuplicateContent = (content: AddedContentUnion) => {
        const newContent = JSON.parse(JSON.stringify(content));
        const newId = `${content.contentType}-${Date.now()}`;
        newContent.id = newId;
        const nameField = 'name' in newContent ? 'name' : 'title';
        if (nameField in newContent) {
            newContent[nameField] = `${newContent[nameField]} (Copy)`;
        }
        setAddedContent(prev => [...prev, newContent]);
        setActiveEditor({type: content.contentType, id: newId});
    };

    const handleAiGeneratedContent = (data: AiGeneratedModData) => {
        if (!data.content || data.content.length === 0) return;
        const newContent: AddedContentUnion[] = data.content.map(c => ({
            ...c,
            id: `${c.contentType}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        } as AddedContentUnion));
        setAddedContent(prev => [...prev, ...newContent]);
        setActiveStudioTab('editor');
    };

    const handleExportMod = () => {
        if (!modInfo.id.trim() || !modInfo.name.trim()) {
            alert("Vui lòng nhập ID và Tên Mod trước khi xuất.");
            return;
        }
        const modContent: ModContent = addedContent.reduce((acc, content) => {
            const { contentType, id, ...contentData } = content;
            const keyMap: Partial<Record<ContentType, keyof ModContent>> = { item: 'items', talent: 'talents', character: 'characters', sect: 'sects', location: 'locations', worldData: 'worldData', npc: 'npcs', auxiliaryTechnique: 'auxiliaryTechniques', mainCultivationTechnique: 'mainCultivationTechniques', event: 'events', recipe: 'recipes', customPanel: 'customPanels' };
            const key = keyMap[contentType as keyof typeof keyMap];
            if (key) {
                if (!acc[key]) (acc as any)[key] = [];
                (acc[key] as any[]).push(contentData);
            }
            return acc;
        }, {} as ModContent);

        const fullMod: FullMod = { modInfo, content: modContent };
        const jsonString = JSON.stringify(fullMod, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${modInfo.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const renderEditor = () => {
        if (!activeEditor) {
            return <div className="flex items-center justify-center h-full text-center text-gray-500">
                <p>Chọn một mục từ bảng điều hướng để chỉnh sửa,<br/> hoặc tạo một mục mới.</p>
            </div>;
        }
        const content = addedContent.find(c => c.id === activeEditor.id);
        if (!content) return <p className="text-red-500 text-center">Lỗi: Không tìm thấy nội dung.</p>;
        
        switch(activeEditor.type) {
            case 'item': return <ItemEditor itemToEdit={content as any} onSave={handleSaveContent as any} allAttributes={ALL_ATTRIBUTES} />;
            case 'character': return <CharacterEditor characterToEdit={content as any} onSave={handleSaveContent as any} allAttributes={ALL_ATTRIBUTES} />;
            case 'sect': return <SectEditor sectToEdit={content as any} onSave={handleSaveContent as any} />;
            case 'location':
            case 'worldData': return <WorldContentEditor contentToEdit={content as any} onSave={handleSaveContent as any} contentType={activeEditor.type} />;
            case 'npc': return <NpcEditor npcToEdit={content as any} onSave={handleSaveContent as any} />;
            case 'auxiliaryTechnique': return <AuxiliaryTechniqueEditor techniqueToEdit={content as any} onSave={handleSaveContent as any} allAttributes={ALL_ATTRIBUTES}/>;
            case 'mainCultivationTechnique': return <MainTechniqueEditor techniqueToEdit={content as any} onSave={handleSaveContent as any} allAttributes={ALL_ATTRIBUTES}/>;
            case 'event': return <EventEditor eventToEdit={content as any} onSave={handleSaveContent as any} allAttributes={ALL_ATTRIBUTES}/>;
            case 'recipe': return <RecipeEditor recipeToEdit={content as any} onSave={handleSaveContent as any} />;
            default: return <p>Trình chỉnh sửa cho loại này chưa được hỗ trợ.</p>
        }
    };
    
    return (
        <div className="w-full animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8 flex flex-col h-[85vh]">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-3xl font-bold font-title">Mod Studio</h2>
                <button onClick={() => handleNavigate('mods')} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50" title="Quay Lại"><FaArrowLeft className="w-5 h-5" /></button>
            </div>

            <div className="mod-studio-container">
                <ModStudioNavigator 
                    content={addedContent}
                    activeEditor={activeEditor}
                    onSelect={(type, id) => setActiveEditor({ type, id })}
                    onAdd={handleAddContent}
                    onDelete={handleDeleteContent}
                    onDuplicate={handleDuplicateContent}
                />
                <div className="mod-workspace">
                    <div className="flex-shrink-0 flex border-b border-gray-700">
                        <button onClick={() => setActiveStudioTab('editor')} className={`px-4 py-2 text-sm ${activeStudioTab === 'editor' ? 'bg-gray-800/60 text-amber-300 border-b-2 border-amber-300' : 'text-gray-400 hover:bg-gray-800/30'}`}>
                           <FaEdit className="inline mr-2"/> Trình Chỉnh Sửa
                        </button>
                        <button onClick={() => setActiveStudioTab('ai')} className={`px-4 py-2 text-sm ${activeStudioTab === 'ai' ? 'bg-gray-800/60 text-amber-300 border-b-2 border-amber-300' : 'text-gray-400 hover:bg-gray-800/30'}`}>
                           <FaRobot className="inline mr-2"/> Trợ lý AI
                        </button>
                    </div>
                    <div className="flex-grow p-4 overflow-y-auto">
                        {activeStudioTab === 'editor' ? renderEditor() : <AiContentGeneratorPanel onGenerate={handleAiGeneratedContent} modContext={{modInfo, addedContent}} />}
                    </div>
                </div>
            </div>
            
             <div className="flex justify-between items-center gap-4 mt-4 border-t border-gray-700/50 pt-4 flex-shrink-0">
                <div className="flex gap-4">
                     <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-400">ID Mod:</label>
                        <input type="text" placeholder="my_cool_mod" value={modInfo.id} onChange={e => setModInfo(p => ({...p, id: e.target.value.replace(/\s+/g, '_').toLowerCase()}))} className="bg-gray-800/50 border border-gray-600 rounded px-2 py-1 text-sm w-32"/>
                    </div>
                     <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-400">Tên Mod:</label>
                        <input type="text" placeholder="Tên Mod" value={modInfo.name} onChange={e => setModInfo(p => ({...p, name: e.target.value}))} className="bg-gray-800/50 border border-gray-600 rounded px-2 py-1 text-sm w-48"/>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={handleSaveDraft} className="px-6 py-2 bg-gray-800/80 text-white font-bold rounded-lg hover:bg-gray-700/80 transition-colors flex items-center gap-2"><FaFileCode /> Lưu Nháp</button>
                    <button onClick={handleExportMod} className="px-6 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 transition-colors flex items-center gap-2"><FaDownload /> Đóng Gói Mod</button>
                </div>
            </div>
        </div>
    );
};

export default memo(CreateModScreen);