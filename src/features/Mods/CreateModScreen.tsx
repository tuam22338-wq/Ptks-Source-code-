import React, { useState, useEffect, useCallback, memo } from 'react';
import {
    FaArrowLeft, FaBoxOpen, FaUserShield, FaStar, FaPlus, FaEdit, FaTrash,
    FaFileSignature, FaRobot, FaDownload, FaFileCode, FaClone, FaMapMarkedAlt, FaProjectDiagram
} from 'react-icons/fa';
import { GiCastle, GiScrollQuill, GiWorld } from 'react-icons/gi';
import * as db from '../../services/dbService';
import type {
    ContentType, AddedContentUnion, AiGeneratedModData, ModInfo, FullMod, ModContent
} from '../../types';
import AiContentGeneratorModal from './components/AiContentGeneratorModal';
import ItemEditorModal from './components/ItemEditorModal';
import TalentEditorModal from './components/TalentEditorModal';
import CharacterEditorModal from './components/CharacterEditorModal';
import SectEditorModal from './components/SectEditorModal';
import WorldContentEditorModal from './components/WorldBuildingEditorModal';
import NpcEditorModal from './components/NpcEditorModal';
import AuxiliaryTechniqueEditorModal from './components/AuxiliaryTechniqueEditorModal';
import MainTechniqueEditorModal from './components/MainTechniqueEditorModal';
import EventEditorModal from './components/EventEditorModal';
import RecipeEditorModal from './components/RecipeEditorModal';
import { ALL_ATTRIBUTES } from '../../constants';

interface CreateModScreenProps {
    onBack: () => void;
}

const CONTENT_TYPE_INFO: Record<Exclude<ContentType, 'realm' | 'realmSystem' | 'talentSystem' | 'customPanel' | 'technique'>, { label: string; icon: React.ElementType; color: string }> = {
    item: { label: 'Vật Phẩm', icon: FaBoxOpen, color: 'text-sky-400' },
    character: { label: 'Nhân Vật', icon: FaUserShield, color: 'text-emerald-400' },
    talent: { label: 'Tiên Tư', icon: FaStar, color: 'text-purple-400' },
    sect: { label: 'Tông Môn', icon: GiCastle, color: 'text-gray-400' },
    location: { label: 'Địa Điểm', icon: FaMapMarkedAlt, color: 'text-lime-400' },
    worldData: { label: 'Dữ Liệu TG', icon: GiWorld, color: 'text-rose-400' },
    npc: { label: 'NPC', icon: FaUserShield, color: 'text-cyan-400' },
    mainCultivationTechnique: { label: 'Công Pháp Chủ Đạo', icon: FaProjectDiagram, color: 'text-amber-400' },
    auxiliaryTechnique: { label: 'Công Pháp Phụ', icon: GiScrollQuill, color: 'text-yellow-400' },
    event: { label: 'Sự Kiện', icon: FaStar, color: 'text-orange-400' },
    recipe: { label: 'Đan Phương', icon: GiScrollQuill, color: 'text-yellow-400' },
};


const CreateModScreen: React.FC<CreateModScreenProps> = ({ onBack }) => {
    const [modInfo, setModInfo] = useState<ModInfo>({ id: '', name: '', author: '', description: '', version: '1.0.0' });
    const [addedContent, setAddedContent] = useState<AddedContentUnion[]>([]);
    const [modal, setModal] = useState<{ type: ContentType | null, content: AddedContentUnion | null }>({ type: null, content: null });
    const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);

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

    const handleOpenModal = (type: ContentType, content: AddedContentUnion | null = null) => {
        setModal({ type, content });
    };

    const handleCloseModal = () => {
        setModal({ type: null, content: null });
    };

    const handleSaveContent = (content: AddedContentUnion) => {
        const contentIndex = addedContent.findIndex(c => c.id === content.id);
        if (contentIndex > -1) {
            const updatedContent = [...addedContent];
            updatedContent[contentIndex] = content;
            setAddedContent(updatedContent);
        } else {
            setAddedContent([...addedContent, content]);
        }
        handleCloseModal();
    };
    
     const handleDeleteContent = (id: string) => {
        if (window.confirm("Bạn có chắc muốn xóa mục này?")) {
            setAddedContent(addedContent.filter(c => c.id !== id));
        }
    };
    
    const handleDuplicateContent = (content: AddedContentUnion) => {
        const newContent = JSON.parse(JSON.stringify(content));
        newContent.id = Date.now().toString();
        const nameField = 'name' in newContent ? 'name' : 'title';
        if (nameField in newContent) {
            newContent[nameField] = `${newContent[nameField]} (Copy)`;
        }
        setAddedContent(prev => [...prev, newContent]);
    };

    const handleAiGeneratedContent = (data: AiGeneratedModData) => {
        if (!data.content || data.content.length === 0) return;

        const newContent: AddedContentUnion[] = data.content.map(c => ({
            ...c,
            id: Date.now().toString() + Math.random().toString(36).substring(2, 7)
        } as AddedContentUnion));

        setAddedContent(prev => [...prev, ...newContent]);
    };

    const handleExportMod = () => {
        if (!modInfo.id.trim() || !modInfo.name.trim()) {
            alert("Vui lòng nhập ID và Tên Mod trong phần 'Thông tin Mod' trước khi xuất.");
            return;
        }

        const modContent: ModContent = addedContent.reduce((acc, content) => {
            const { contentType, id, ...contentData } = content;
            
            const keyMap: Partial<Record<ContentType, keyof ModContent>> = {
                item: 'items',
                talent: 'talents',
                character: 'characters',
                sect: 'sects',
                location: 'locations',
                worldData: 'worldData',
                npc: 'npcs',
                auxiliaryTechnique: 'auxiliaryTechniques',
                mainCultivationTechnique: 'mainCultivationTechniques',
                event: 'events',
                recipe: 'recipes',
                customPanel: 'customPanels',
            };

            const key = keyMap[contentType as keyof typeof keyMap];
            if (key) {
                if (!acc[key]) {
                    (acc as any)[key] = [];
                }
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
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const renderModals = () => (
        <>
            {modal.type === 'item' && <ItemEditorModal isOpen={true} onClose={handleCloseModal} onSave={handleSaveContent as any} itemToEdit={modal.content as any} allAttributes={ALL_ATTRIBUTES} />}
            {modal.type === 'talent' && <TalentEditorModal isOpen={true} onClose={handleCloseModal} onSave={handleSaveContent as any} talentToEdit={modal.content as any} allAttributes={ALL_ATTRIBUTES} talentRanks={[]} />}
            {modal.type === 'character' && <CharacterEditorModal isOpen={true} onClose={handleCloseModal} onSave={handleSaveContent as any} characterToEdit={modal.content as any} allAttributes={ALL_ATTRIBUTES} />}
            {modal.type === 'sect' && <SectEditorModal isOpen={true} onClose={handleCloseModal} onSave={handleSaveContent as any} sectToEdit={modal.content as any} />}
            {(modal.type === 'location' || modal.type === 'worldData') && <WorldContentEditorModal isOpen={true} onClose={handleCloseModal} onSave={handleSaveContent as any} contentToEdit={modal.content as any} contentType={modal.type} />}
            {modal.type === 'npc' && <NpcEditorModal isOpen={true} onClose={handleCloseModal} onSave={handleSaveContent as any} npcToEdit={modal.content as any} />}
            {modal.type === 'auxiliaryTechnique' && <AuxiliaryTechniqueEditorModal isOpen={true} onClose={handleCloseModal} onSave={handleSaveContent as any} techniqueToEdit={modal.content as any} allAttributes={ALL_ATTRIBUTES} />}
            {modal.type === 'mainCultivationTechnique' && <MainTechniqueEditorModal isOpen={true} onClose={handleCloseModal} onSave={handleSaveContent as any} techniqueToEdit={modal.content as any} allAttributes={ALL_ATTRIBUTES} />}
            {modal.type === 'event' && <EventEditorModal isOpen={true} onClose={handleCloseModal} onSave={handleSaveContent as any} eventToEdit={modal.content as any} allAttributes={ALL_ATTRIBUTES} />}
            {modal.type === 'recipe' && <RecipeEditorModal isOpen={true} onClose={handleCloseModal} onSave={handleSaveContent as any} recipeToEdit={modal.content as any} />}
        </>
    );

    return (
        <div className="w-full animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8 flex flex-col h-full max-h-[85vh]">
            {renderModals()}
            <AiContentGeneratorModal isOpen={isAiGeneratorOpen} onClose={() => setIsAiGeneratorOpen(false)} onGenerate={handleAiGeneratedContent} modContext={{ modInfo, addedContent }} />
            
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-3xl font-bold font-title">Trình Chỉnh Sửa Mod</h2>
                <button onClick={onBack} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50" title="Quay Lại"><FaArrowLeft className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-shrink-0">
                <div className="md:col-span-1 bg-black/20 p-4 rounded-lg border border-gray-700/60">
                    <h3 className="text-lg font-bold font-title mb-3 flex items-center gap-2"><FaFileSignature /> Thông Tin Mod</h3>
                    <div className="space-y-3">
                        <input type="text" placeholder="ID Mod (vd: my_cool_mod)" value={modInfo.id} onChange={e => setModInfo(p => ({...p, id: e.target.value}))} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm" />
                        <input type="text" placeholder="Tên Mod" value={modInfo.name} onChange={e => setModInfo(p => ({...p, name: e.target.value}))} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm" />
                        <input type="text" placeholder="Tác giả" value={modInfo.author} onChange={e => setModInfo(p => ({...p, author: e.target.value}))} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm" />
                        <textarea placeholder="Mô tả mod..." value={modInfo.description} onChange={e => setModInfo(p => ({...p, description: e.target.value}))} rows={2} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm" />
                    </div>
                </div>
                 <div className="md:col-span-2 bg-black/20 p-4 rounded-lg border border-gray-700/60">
                    <h3 className="text-lg font-bold font-title mb-3 flex items-center gap-2"><FaPlus /> Thêm Nội Dung Mới</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                         {Object.entries(CONTENT_TYPE_INFO).map(([key, info]) => (
                             <button key={key} onClick={() => handleOpenModal(key as ContentType)} className="flex flex-col items-center p-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 rounded-lg transition-colors">
                                <info.icon className={`text-3xl ${info.color}`} />
                                <span className="mt-2 text-xs text-gray-300 text-center">{info.label}</span>
                             </button>
                         ))}
                         <button onClick={() => setIsAiGeneratorOpen(true)} className="flex flex-col items-center p-3 bg-teal-800/50 hover:bg-teal-700/50 border border-teal-700 rounded-lg transition-colors">
                            <FaRobot className="text-3xl text-teal-300" />
                            <span className="mt-2 text-xs text-teal-200">Dùng AI</span>
                         </button>
                    </div>
                </div>
            </div>

            <div className="flex-grow bg-black/20 p-4 rounded-lg border border-gray-700/60 mt-6 min-h-0 flex flex-col">
                <h3 className="text-lg font-bold font-title mb-3 flex-shrink-0">Nội Dung Đã Thêm ({addedContent.length})</h3>
                 <div className="flex-grow overflow-y-auto pr-2 space-y-2">
                    {addedContent.map(content => {
                        const info = CONTENT_TYPE_INFO[content.contentType as keyof typeof CONTENT_TYPE_INFO];
                        const name = 'name' in content ? content.name : ('title' in content ? content.title : 'Dữ liệu không tên');
                        return (
                            <div key={content.id} className="bg-gray-800/50 p-2 rounded-md flex items-center justify-between animate-fade-in" style={{animationDuration: '300ms'}}>
                                <div className="flex items-center gap-3">
                                    {info && <info.icon className={`w-5 h-5 ${info.color}`} />}
                                    <div>
                                        <p className="font-semibold text-gray-200">{name}</p>
                                        <p className="text-xs text-gray-500">{info?.label || content.contentType}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                     <button onClick={() => handleDuplicateContent(content)} className="p-2 text-gray-400 hover:text-blue-400" title="Nhân bản"><FaClone/></button>
                                     <button onClick={() => handleOpenModal(content.contentType, content)} className="p-2 text-gray-400 hover:text-amber-400" title="Chỉnh sửa"><FaEdit/></button>
                                     <button onClick={() => handleDeleteContent(content.id)} className="p-2 text-gray-400 hover:text-red-400" title="Xóa"><FaTrash/></button>
                                </div>
                            </div>
                        );
                    })}
                    {addedContent.length === 0 && (
                        <p className="text-center text-gray-500 pt-10">Chưa có nội dung nào được thêm.</p>
                    )}
                </div>
            </div>

            <div className="flex justify-end items-center gap-4 mt-4 border-t border-gray-700/50 pt-4 flex-shrink-0">
                <button onClick={handleSaveDraft} className="px-6 py-2 bg-gray-800/80 text-white font-bold rounded-lg hover:bg-gray-700/80 transition-colors flex items-center gap-2"><FaFileCode /> Lưu Nháp</button>
                <button onClick={handleExportMod} className="px-6 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 transition-colors flex items-center gap-2"><FaDownload /> Đóng Gói Mod</button>
            </div>
        </div>
    );
};

export default CreateModScreen;
