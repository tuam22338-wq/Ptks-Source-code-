import React, { useState, useMemo, useEffect } from 'react';
import {
    FaArrowLeft, FaBoxOpen, FaUserShield, FaStar, FaPlus, FaEdit, FaTrash, FaCogs, FaGlobe, FaFilter,
    FaTimes, FaCode, FaList, FaExclamationTriangle, FaRobot, FaFileSignature, FaBoxes, FaScroll, FaUserFriends, FaMagic, FaColumns
} from 'react-icons/fa';
import { GiCastle, GiScrollQuill } from 'react-icons/gi';
import { ALL_ATTRIBUTES, INNATE_TALENT_PROBABILITY, INNATE_TALENT_RANKS } from '../constants';
import GameMasterChat from './GameMasterChat';
import type { ModItem, ModTalent, TalentSystemConfig, RealmConfig, ModCharacter, AIAction, ModWorldBuilding, ModTalentRank, ModSect, ModNpc, ModTechnique, ModEvent, ModCustomPanel, ContentType, AlchemyRecipe } from '../types';
import TalentEditorModal from './TalentEditorModal';
import CharacterEditorModal from './CharacterEditorModal';
import ItemEditorModal from './ItemEditorModal';
import WorldBuildingEditorModal from './WorldBuildingEditorModal';
import SectEditorModal from './SectEditorModal';
import RealmEditorModal from './RealmEditorModal';
import NpcEditorModal from './NpcEditorModal';
import TechniqueEditorModal from './TechniqueEditorModal';
import EventEditorModal from './EventEditorModal';
import RecipeEditorModal from './RecipeEditorModal';


interface CreateModScreenProps {
  onBack: () => void;
}

type ModCreationTab = 'info' | 'content' | 'system' | 'ai';

const CONTENT_TYPE_INFO: Record<Exclude<ContentType, 'realm' | 'realmSystem' | 'talentSystem'>, { label: string; icon: React.ElementType; color: string }> = {
    item: { label: 'Vật Phẩm', icon: FaBoxOpen, color: 'bg-sky-500/80' },
    character: { label: 'Nhân Vật', icon: FaUserShield, color: 'bg-emerald-500/80' },
    talent: { label: 'Tiên Tư', icon: FaStar, color: 'bg-purple-500/80' },
    sect: { label: 'Tông Môn', icon: GiCastle, color: 'bg-gray-500/80' },
    worldBuilding: { label: 'Thế Giới', icon: FaGlobe, color: 'bg-rose-500/80' },
    npc: { label: 'NPC', icon: FaUserFriends, color: 'bg-cyan-500/80' },
    technique: { label: 'Công Pháp', icon: FaMagic, color: 'bg-amber-500/80' },
    event: { label: 'Sự Kiện', icon: FaScroll, color: 'bg-orange-500/80' },
    customPanel: { label: 'Bảng UI', icon: FaColumns, color: 'bg-indigo-500/80' },
    recipe: { label: 'Đan Phương', icon: GiScrollQuill, color: 'bg-yellow-500/80' },
};

const DEFAULT_REALMS: RealmConfig[] = [
    { id: '1', name: 'Luyện Khí Cảnh', stages: Array.from({ length: 9 }, (_, i) => ({ id: `s1-${i}`, name: `Tầng ${i + 1}`, qiRequired: 100 * (i + 1), bonuses: [{ attribute: 'Tuổi Thọ', value: 10 }, { attribute: 'Linh Lực', value: 20 }] })) },
    { id: '2', name: 'Hoá Thần Cảnh', stages: [{ id: 's2-1', name: 'Sơ Kỳ', qiRequired: 10000, bonuses: [] }, { id: 's2-2', name: 'Trung Kỳ', qiRequired: 20000, bonuses: [] }, { id: 's2-3', name: 'Hậu Kỳ', qiRequired: 30000, bonuses: [] }] },
];

const DEFAULT_TALENT_SYSTEM_CONFIG: TalentSystemConfig = {
    systemName: 'Tiên Tư',
    choicesPerRoll: 6,
    maxSelectable: 3,
    allowAIGeneratedTalents: true,
};

const DEFAULT_TALENT_RANKS: ModTalentRank[] = INNATE_TALENT_PROBABILITY.map((p, i) => ({
    id: `default-rank-${i}`,
    name: p.rank,
    color: INNATE_TALENT_RANKS[p.rank as keyof typeof INNATE_TALENT_RANKS]?.color || 'text-gray-400',
    weight: p.weight,
}));


type AddedContentUnion = 
    (ModItem & { contentType: 'item' }) |
    (ModTalent & { contentType: 'talent' }) |
    (ModCharacter & { contentType: 'character' }) |
    (ModSect & { contentType: 'sect' }) |
    (ModWorldBuilding & { contentType: 'worldBuilding' }) |
    (ModNpc & { contentType: 'npc' }) |
    (ModTechnique & { contentType: 'technique' }) |
    (ModEvent & { contentType: 'event' }) |
    (AlchemyRecipe & { contentType: 'recipe' }) |
    (ModCustomPanel & { contentType: 'customPanel' });



const ConfirmationModal: React.FC<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}> = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }}>
            <div className="themed-panel rounded-lg shadow-2xl shadow-black/50 w-full max-w-md m-4">
                <div className="p-6 text-center">
                    <div className="flex justify-center mb-4">
                        <FaExclamationTriangle className="text-[var(--primary-accent-color)] text-4xl" />
                    </div>
                    <h3 className="text-xl font-bold font-title">{title}</h3>
                    <p className="mt-2" style={{color: 'var(--text-muted-color)'}}>{message}</p>
                </div>
                <div className="p-4 bg-black/20 flex justify-center gap-4">
                    <button onClick={onCancel} className="px-6 py-2 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80 transition-colors">Hủy</button>
                    <button onClick={onConfirm} className="px-6 py-2 bg-amber-600/90 text-white font-bold rounded-lg hover:bg-amber-500/90 transition-colors">Xác Nhận</button>
                </div>
            </div>
        </div>
    );
};


const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-6 bg-black/20 p-4 rounded-lg border border-gray-700/60">
    <h3 className="text-xl font-bold font-title mb-4 pb-2 border-b border-gray-600/50" style={{color: 'var(--text-muted-color)'}}>{title}</h3>
    <div className="space-y-4">{children}</div>
  </section>
);

const InputRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row gap-2 sm:gap-8 items-start py-2">
    <label className="block text-md sm:w-1/4 flex-shrink-0 pt-1" style={{color: 'var(--text-color)'}}>{label}</label>
    <div className="w-full sm:w-3/4">{children}</div>
  </div>
);

const CreateModScreen: React.FC<CreateModScreenProps> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<ModCreationTab>('info');

    // Mod metadata state
    const [modName, setModName] = useState('');
    const [modAuthor, setModAuthor] = useState('');
    const [modDescription, setModDescription] = useState('');
    
    // Mod content state
    const [realms, setRealms] = useState<RealmConfig[]>(DEFAULT_REALMS);
    const [talentSystemConfig, setTalentSystemConfig] = useState<TalentSystemConfig>(DEFAULT_TALENT_SYSTEM_CONFIG);
    const [talentRanks, setTalentRanks] = useState<ModTalentRank[]>(DEFAULT_TALENT_RANKS);
    const [addedContent, setAddedContent] = useState<AddedContentUnion[]>([]);
    
    // UI State for modals
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ModItem | null>(null);
    const [isTalentModalOpen, setIsTalentModalOpen] = useState(false);
    const [editingTalent, setEditingTalent] = useState<ModTalent | null>(null);
    const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
    const [editingCharacter, setEditingCharacter] = useState<ModCharacter | null>(null);
    const [isWorldBuildingModalOpen, setIsWorldBuildingModalOpen] = useState(false);
    const [editingWorldBuilding, setEditingWorldBuilding] = useState<ModWorldBuilding | null>(null);
    const [isSectModalOpen, setIsSectModalOpen] = useState(false);
    const [editingSect, setEditingSect] = useState<ModSect | null>(null);
    const [isRealmModalOpen, setIsRealmModalOpen] = useState(false);
    const [editingRealm, setEditingRealm] = useState<RealmConfig | null>(null);
    const [isNpcModalOpen, setIsNpcModalOpen] = useState(false);
    const [editingNpc, setEditingNpc] = useState<ModNpc | null>(null);
    const [isTechniqueModalOpen, setIsTechniqueModalOpen] = useState(false);
    const [editingTechnique, setEditingTechnique] = useState<ModTechnique | null>(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState<ModEvent | null>(null);
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<AlchemyRecipe | null>(null);

    
    // UI State for view/filter
    const [activeTypeFilters, setActiveTypeFilters] = useState<Set<ContentType>>(new Set());
    const [activeTagFilters, setActiveTagFilters] = useState<Set<string>>(new Set());
    const [addedContentEditorView, setAddedContentEditorView] = useState<'list' | 'json'>('list');
    const [addedContentJsonText, setAddedContentJsonText] = useState('[]');
    const [addedContentJsonError, setAddedContentJsonError] = useState<string | null>(null);
    
    const [pendingSystemAction, setPendingSystemAction] = useState<AIAction | null>(null);

    const timestamp = () => Date.now().toString() + Math.random().toString(36).substring(2, 7);
    
    useEffect(() => {
        const savedDraft = localStorage.getItem('mod-draft');
        if (savedDraft) {
            if (window.confirm('Tìm thấy một bản nháp chưa lưu. Bạn có muốn tải nó không?')) {
                try {
                    const parsedData = JSON.parse(savedDraft);
                    setModName(parsedData.modInfo.name || '');
                    setModAuthor(parsedData.modInfo.author || '');
                    setModDescription(parsedData.modInfo.description || '');
                    
                    const newAddedContent: AddedContentUnion[] = [];
                    if(parsedData.content.items) newAddedContent.push(...parsedData.content.items.map((i: any) => ({...i, id: i.id || timestamp(), contentType: 'item' as const})));
                    if(parsedData.content.talents) newAddedContent.push(...parsedData.content.talents.map((t: any) => ({...t, id: t.id || timestamp(), contentType: 'talent' as const})));
                    if(parsedData.content.characters) newAddedContent.push(...parsedData.content.characters.map((c: any) => ({...c, id: c.id || timestamp(), contentType: 'character' as const})));
                    if(parsedData.content.worldBuilding) newAddedContent.push(...parsedData.content.worldBuilding.map((w: any) => ({...w, id: w.id || timestamp(), contentType: 'worldBuilding' as const})));
                    if(parsedData.content.sects) newAddedContent.push(...parsedData.content.sects.map((s: any) => ({...s, id: s.id || timestamp(), contentType: 'sect' as const})));
                    if(parsedData.content.npcs) newAddedContent.push(...parsedData.content.npcs.map((n: any) => ({...n, id: n.id || timestamp(), contentType: 'npc' as const})));
                    if(parsedData.content.techniques) newAddedContent.push(...parsedData.content.techniques.map((t: any) => ({...t, id: t.id || timestamp(), contentType: 'technique' as const})));
                    if(parsedData.content.events) newAddedContent.push(...parsedData.content.events.map((e: any) => ({...e, id: e.id || timestamp(), contentType: 'event' as const})));
                    if(parsedData.content.customPanels) newAddedContent.push(...parsedData.content.customPanels.map((p: any) => ({...p, id: p.id || timestamp(), contentType: 'customPanel' as const})));
                    if(parsedData.content.recipes) newAddedContent.push(...parsedData.content.recipes.map((r: any) => ({...r, id: r.id || timestamp(), contentType: 'recipe' as const})));
                    setAddedContent(newAddedContent);

                    setRealms(parsedData.content.realmConfigs || DEFAULT_REALMS);
                    setTalentSystemConfig(parsedData.content.talentSystemConfig || DEFAULT_TALENT_SYSTEM_CONFIG);
                    setTalentRanks(parsedData.content.talentRanks || DEFAULT_TALENT_RANKS);
                } catch (e) {
                    console.error("Failed to parse draft:", e);
                    alert("Lỗi khi tải bản nháp. Bản nháp có thể đã bị hỏng và sẽ được xóa.");
                    localStorage.removeItem('mod-draft');
                }
            }
        }
    }, []);

    const modContextForAI = useMemo(() => {
        const contentByType: { [key: string]: any[] } = {};
        
        addedContent.forEach(c => {
            const { contentType, ...data } = c;
            const key = contentType === 'worldBuilding' ? 'worldBuilding' 
                      : contentType === 'customPanel' ? 'customPanels'
                      : `${contentType}s`;
    
            if (!contentByType[key]) {
                contentByType[key] = [];
            }
            contentByType[key].push(data);
        });
    
        const finalContent: any = {};
        for (const key in contentByType) {
            if (contentByType[key].length > 0) {
                finalContent[key] = contentByType[key].map(item => {
                    const { id, ...rest } = item;
                    return rest;
                });
            }
        }
        
        return {
            modInfo: {
                name: modName,
                author: modAuthor,
                description: modDescription,
            },
            content: finalContent,
            realmConfigs: realms,
            talentRanks: talentRanks,
            talentSystemConfig,
        }
    }, [modName, modAuthor, modDescription, addedContent, realms, talentRanks, talentSystemConfig]);

    const handleConfirmSystemReplacement = () => {
        if (!pendingSystemAction) return;

        switch (pendingSystemAction.action) {
            case 'CREATE_REALM_SYSTEM':
                const newRealms = pendingSystemAction.data.map(realm => ({...realm, id: timestamp() }));
                setRealms(newRealms);
                break;
            case 'CONFIGURE_TALENT_SYSTEM':
                setTalentSystemConfig(pendingSystemAction.data);
                break;
        }
        setPendingSystemAction(null);
    };

    const handleAIAction = (action: AIAction) => {
        const isSystemAction = action.action === 'CREATE_REALM_SYSTEM' || action.action === 'CONFIGURE_TALENT_SYSTEM';
        if (isSystemAction) {
            setPendingSystemAction(action);
            return;
        }
    
        setAddedContent(prevContent => {
            let currentContent = [...prevContent];
            const actions: AIAction[] = action.action === 'BATCH_ACTIONS' ? (action.data as AIAction[]) : [action];
    
            actions.forEach(act => {
                if (!act || typeof act.action !== 'string' || act.data === undefined) {
                    console.warn('Skipping invalid action from AI:', act);
                    return; 
                }
                
                const data = act.data as any;
                switch (act.action) {
                    case 'CREATE_ITEM': currentContent.push({ ...data, id: timestamp(), contentType: 'item' }); break;
                    case 'CREATE_MULTIPLE_ITEMS': data.forEach((d: any) => currentContent.push({ ...d, id: timestamp(), contentType: 'item' })); break;
                    case 'CREATE_TALENT': currentContent.push({ ...data, id: timestamp(), contentType: 'talent' }); break;
                    case 'CREATE_MULTIPLE_TALENTS': data.forEach((d: any) => currentContent.push({ ...d, id: timestamp(), contentType: 'talent' })); break;
                    case 'CREATE_SECT': currentContent.push({ ...data, id: timestamp(), contentType: 'sect' }); break;
                    case 'CREATE_MULTIPLE_SECTS': data.forEach((d: any) => currentContent.push({ ...d, id: timestamp(), contentType: 'sect' })); break;
                    case 'CREATE_CHARACTER': currentContent.push({ ...data, id: timestamp(), contentType: 'character' }); break;
                    case 'CREATE_MULTIPLE_CHARACTERS': data.forEach((d: any) => currentContent.push({ ...d, id: timestamp(), contentType: 'character' })); break;
                    case 'CREATE_TECHNIQUE': currentContent.push({ ...data, id: timestamp(), contentType: 'technique' }); break;
                    case 'CREATE_MULTIPLE_TECHNIQUES': data.forEach((d: any) => currentContent.push({ ...d, id: timestamp(), contentType: 'technique' })); break;
                    case 'CREATE_NPC': currentContent.push({ ...data, id: timestamp(), contentType: 'npc' }); break;
                    case 'CREATE_MULTIPLE_NPCS': data.forEach((d: any) => currentContent.push({ ...d, id: timestamp(), contentType: 'npc' })); break;
                    case 'CREATE_EVENT': currentContent.push({ ...data, id: timestamp(), contentType: 'event' }); break;
                    case 'CREATE_MULTIPLE_EVENTS': data.forEach((d: any) => currentContent.push({ ...d, id: timestamp(), contentType: 'event' })); break;
                    case 'CREATE_RECIPE': currentContent.push({ ...data, id: timestamp(), contentType: 'recipe' }); break;
                    case 'CREATE_MULTIPLE_RECIPES': data.forEach((d: any) => currentContent.push({ ...d, id: timestamp(), contentType: 'recipe' })); break;
                    case 'DEFINE_WORLD_BUILDING': currentContent.push({ ...data, id: timestamp(), contentType: 'worldBuilding' }); break;
                    case 'CREATE_CUSTOM_PANEL': currentContent.push({ ...data, id: timestamp(), contentType: 'customPanel' }); break;
    
                    case 'UPDATE_ITEM': { const index = currentContent.findIndex(c => c.contentType === 'item' && c.name === data.name); if (index !== -1) currentContent[index] = { ...data, id: currentContent[index].id, contentType: 'item' }; break; }
                    case 'UPDATE_TALENT': { const index = currentContent.findIndex(c => c.contentType === 'talent' && c.name === data.name); if (index !== -1) currentContent[index] = { ...data, id: currentContent[index].id, contentType: 'talent' }; break; }
                    case 'UPDATE_SECT': { const index = currentContent.findIndex(c => c.contentType === 'sect' && c.name === data.name); if (index !== -1) currentContent[index] = { ...data, id: currentContent[index].id, contentType: 'sect' }; break; }
                    case 'UPDATE_CHARACTER': { const index = currentContent.findIndex(c => c.contentType === 'character' && c.name === data.name); if (index !== -1) currentContent[index] = { ...data, id: currentContent[index].id, contentType: 'character' }; break; }
                    case 'UPDATE_TECHNIQUE': { const index = currentContent.findIndex(c => c.contentType === 'technique' && c.name === data.name); if (index !== -1) currentContent[index] = { ...data, id: currentContent[index].id, contentType: 'technique' }; break; }
                    case 'UPDATE_NPC': { const index = currentContent.findIndex(c => c.contentType === 'npc' && c.name === data.name); if (index !== -1) currentContent[index] = { ...data, id: currentContent[index].id, contentType: 'npc' }; break; }
                    case 'UPDATE_EVENT': { const index = currentContent.findIndex(c => c.contentType === 'event' && c.name === data.name); if (index !== -1) currentContent[index] = { ...data, id: currentContent[index].id, contentType: 'event' }; break; }
                    case 'UPDATE_RECIPE': { const index = currentContent.findIndex(c => c.contentType === 'recipe' && c.name === data.name); if (index !== -1) currentContent[index] = { ...data, id: currentContent[index].id, contentType: 'recipe' }; break; }
                    case 'UPDATE_WORLD_BUILDING': { const index = currentContent.findIndex(c => c.contentType === 'worldBuilding' && c.title === data.title); if (index !== -1) currentContent[index] = { ...data, id: currentContent[index].id, contentType: 'worldBuilding' }; break; }
                    case 'UPDATE_CUSTOM_PANEL': { const index = currentContent.findIndex(c => c.contentType === 'customPanel' && c.title === data.title); if (index !== -1) currentContent[index] = { ...data, id: currentContent[index].id, contentType: 'customPanel' }; break; }
    
                    case 'DELETE_ITEM': currentContent = currentContent.filter(c => !(c.contentType === 'item' && c.name === data.name)); break;
                    case 'DELETE_TALENT': currentContent = currentContent.filter(c => !(c.contentType === 'talent' && c.name === data.name)); break;
                    case 'DELETE_SECT': currentContent = currentContent.filter(c => !(c.contentType === 'sect' && c.name === data.name)); break;
                    case 'DELETE_CHARACTER': currentContent = currentContent.filter(c => !(c.contentType === 'character' && c.name === data.name)); break;
                    case 'DELETE_TECHNIQUE': currentContent = currentContent.filter(c => !(c.contentType === 'technique' && c.name === data.name)); break;
                    case 'DELETE_NPC': currentContent = currentContent.filter(c => !(c.contentType === 'npc' && c.name === data.name)); break;
                    case 'DELETE_EVENT': currentContent = currentContent.filter(c => !(c.contentType === 'event' && c.name === data.name)); break;
                    case 'DELETE_RECIPE': currentContent = currentContent.filter(c => !(c.contentType === 'recipe' && c.name === data.name)); break;
                    case 'DELETE_WORLD_BUILDING': currentContent = currentContent.filter(c => !(c.contentType === 'worldBuilding' && c.title === data.title)); break;
                    case 'DELETE_CUSTOM_PANEL': currentContent = currentContent.filter(c => !(c.contentType === 'customPanel' && c.title === data.title)); break;
                }
            });
    
            return currentContent;
        });
    };
    
    const handleSaveContent = (contentToSave: AddedContentUnion) => {
        const exists = addedContent.some(c => c.id === contentToSave.id);
        if (exists) {
            setAddedContent(prev => prev.map(c => (c.id === contentToSave.id ? contentToSave : c)));
        } else {
            setAddedContent(prev => [...prev, { ...contentToSave, id: contentToSave.id || Date.now().toString() }]);
        }
    };
    
    // Unified delete handler
    const handleDeleteContent = (id: string, name: string) => {
        if (window.confirm(`Bạn có chắc muốn xóa "${name}"?`)) {
            setAddedContent(prev => prev.filter(c => c.id !== id));
        }
    };

    // Editor openers
    const handleOpenItemEditor = (item: ModItem | null) => { setEditingItem(item); setIsItemModalOpen(true); };
    const handleOpenTalentEditor = (talent: ModTalent | null) => { setEditingTalent(talent); setIsTalentModalOpen(true); };
    const handleOpenCharacterEditor = (character: ModCharacter | null) => { setEditingCharacter(character); setIsCharacterModalOpen(true); };
    const handleOpenWorldBuildingEditor = (wb: ModWorldBuilding | null) => { setEditingWorldBuilding(wb); setIsWorldBuildingModalOpen(true); };
    const handleOpenSectEditor = (sect: ModSect | null) => { setEditingSect(sect); setIsSectModalOpen(true); };
    const handleOpenRealmEditor = (realm: RealmConfig | null) => { setEditingRealm(realm); setIsRealmModalOpen(true); };
    const handleOpenNpcEditor = (npc: ModNpc | null) => { setEditingNpc(npc); setIsNpcModalOpen(true); };
    const handleOpenTechniqueEditor = (technique: ModTechnique | null) => { setEditingTechnique(technique); setIsTechniqueModalOpen(true); };
    const handleOpenEventEditor = (event: ModEvent | null) => { setEditingEvent(event); setIsEventModalOpen(true); };
    const handleOpenRecipeEditor = (recipe: AlchemyRecipe | null) => { setEditingRecipe(recipe); setIsRecipeModalOpen(true); };


    // Specific save handlers
    const handleSaveItem = (itemToSave: ModItem) => { handleSaveContent({ ...itemToSave, contentType: 'item' }); setIsItemModalOpen(false); };
    const handleSaveTalent = (talentToSave: ModTalent) => { handleSaveContent({ ...talentToSave, contentType: 'talent' }); setIsTalentModalOpen(false); };
    const handleSaveCharacter = (characterToSave: ModCharacter) => { handleSaveContent({ ...characterToSave, contentType: 'character' }); setIsCharacterModalOpen(false); };
    const handleSaveWorldBuilding = (wbToSave: ModWorldBuilding) => { handleSaveContent({ ...wbToSave, contentType: 'worldBuilding' }); setIsWorldBuildingModalOpen(false); };
    const handleSaveSect = (sectToSave: ModSect) => { handleSaveContent({ ...sectToSave, contentType: 'sect' }); setIsSectModalOpen(false); };
    const handleSaveNpc = (npcToSave: ModNpc) => { handleSaveContent({ ...npcToSave, contentType: 'npc' }); setIsNpcModalOpen(false); };
    const handleSaveTechnique = (techToSave: ModTechnique) => { handleSaveContent({ ...techToSave, contentType: 'technique' }); setIsTechniqueModalOpen(false); };
    const handleSaveEvent = (eventToSave: ModEvent) => { handleSaveContent({ ...eventToSave, contentType: 'event' }); setIsEventModalOpen(false); };
    const handleSaveRecipe = (recipeToSave: AlchemyRecipe) => { handleSaveContent({ ...recipeToSave, contentType: 'recipe' }); setIsRecipeModalOpen(false); };
    
    const handleSaveRealm = (realmToSave: RealmConfig) => {
        const exists = realms.some(r => r.id === realmToSave.id);
        if (exists) {
            setRealms(prev => prev.map(r => (r.id === realmToSave.id ? realmToSave : r)));
        } else {
            setRealms(prev => [...prev, realmToSave]);
        }
        setIsRealmModalOpen(false);
    };

    const handleDeleteRealm = (id: string, name: string) => {
        if (window.confirm(`Bạn có chắc muốn xóa cảnh giới "${name}"?`)) {
            setRealms(prev => prev.filter(r => r.id !== id));
        }
    };

    // Talent Rank Handlers
    const handleTalentRankChange = (index: number, field: keyof ModTalentRank, value: string | number) => {
        const newRanks = [...talentRanks];
        (newRanks[index] as any)[field] = value;
        setTalentRanks(newRanks);
    };

    const addTalentRank = () => {
        setTalentRanks([...talentRanks, { id: timestamp(), name: 'Phẩm chất mới', color: 'text-gray-400', weight: 10 }]);
    };

    const removeTalentRank = (index: number) => {
        setTalentRanks(talentRanks.filter((_, i) => i !== index));
    };


    const packageModData = () => {
        const content: Record<string, any[]> = {
            items: [], talents: [], characters: [], worldBuilding: [], sects: [], npcs: [], techniques: [], events: [], recipes: [], customPanels: []
        };
        
        addedContent.forEach(c => {
            const { contentType, ...data } = c;
            const key = `${contentType}s`; // e.g., 'items', 'talents'
            if (key in content) {
                 content[key].push(data);
            } else if (contentType === 'worldBuilding') {
                 content.worldBuilding.push(data);
            } else if (contentType === 'customPanel') {
                content.customPanels.push(data);
            }
        });

        // Filter out empty arrays
        const finalContent: any = {};
        for(const key in content) {
            if(content[key].length > 0) {
                 // Remove temporary client-side ID before packaging
                finalContent[key] = content[key].map(item => {
                    const { id, ...rest } = item;
                    return rest;
                });
            }
        }


        return {
            modInfo: {
                name: modName,
                author: modAuthor,
                description: modDescription,
                version: '1.0.0',
                id: modName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') || `mod-${Date.now()}`
            },
            content: {
                ...finalContent,
                realmConfigs: realms.map(({ id, ...rest }) => rest),
                talentSystemConfig,
                talentRanks: talentRanks.map(({ id, ...rest }) => rest),
            }
        };
    };

    const handleSaveDraft = () => {
        try {
            const modData = packageModData();
            localStorage.setItem('mod-draft', JSON.stringify(modData));
            alert('Bản nháp đã được lưu vào trình duyệt!');
        } catch (error) {
            console.error("Failed to save draft:", error);
            alert('Lỗi: Không thể lưu bản nháp.');
        }
    };

    const handleExportMod = () => {
        if (!modName.trim()) {
            alert('Vui lòng nhập Tên Mod trước khi đóng gói.');
            return;
        }
        try {
            const modData = packageModData();
            const jsonString = JSON.stringify(modData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const fileName = `${modData.modInfo.id}.json`;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            alert(`Mod "${modName}" đã được xuất thành công!`);
        } catch (error) {
            console.error("Failed to export mod:", error);
            alert('Lỗi: Không thể xuất mod.');
        }
    };

    const switchToJsonView = () => {
        try {
            setAddedContentJsonText(JSON.stringify(addedContent, null, 2));
            setAddedContentJsonError(null);
            setAddedContentEditorView('json');
        } catch (error) {
            setAddedContentJsonError('Không thể chuyển đổi dữ liệu hiện tại thành JSON.');
        }
    };

    const handleUpdateFromJson = () => {
        try {
            const parsedData = JSON.parse(addedContentJsonText);
            if (!Array.isArray(parsedData)) {
                 throw new Error("JSON phải là một mảng (array).");
            }
            
            const validContentTypes = Object.keys(CONTENT_TYPE_INFO);
            const processedData = parsedData.map((item: any) => {
                if (!item.contentType || !validContentTypes.includes(item.contentType)) {
                    throw new Error(`Mục ${JSON.stringify(item)} thiếu hoặc có 'contentType' không hợp lệ.`);
                }
                return { ...item, id: item.id || timestamp() };
            });

            setAddedContent(processedData as AddedContentUnion[]);
            setAddedContentJsonError(null);
            alert('Đã cập nhật thành công từ JSON!');
            setAddedContentEditorView('list');
        } catch (e: any) {
            console.error("Lỗi phân tích JSON:", e);
            setAddedContentJsonError(`Lỗi phân tích JSON: ${e.message}`);
        }
    };
    
    const allUniqueTags = useMemo(() => {
        const tags = new Set<string>();
        addedContent.forEach(content => {
            if ('tags' in content && Array.isArray(content.tags)) {
                content.tags.forEach(tag => tags.add(tag));
            }
        });
        return Array.from(tags).sort();
    }, [addedContent]);

    const filteredContent = useMemo(() => {
        const sortedContent = [...addedContent].sort((a,b) => b.id.localeCompare(a.id));
        
        return sortedContent.filter(content => {
            const typeMatch = activeTypeFilters.size === 0 || activeTypeFilters.has(content.contentType);
            const tagMatch = activeTagFilters.size === 0 || ('tags' in content && Array.isArray(content.tags) && content.tags.some(tag => activeTagFilters.has(tag)));
            return typeMatch && tagMatch;
        });

    }, [addedContent, activeTypeFilters, activeTagFilters]);

    const toggleTypeFilter = (filter: ContentType) => {
        setActiveTypeFilters(prev => {
            const newFilters = new Set(prev);
            if (newFilters.has(filter)) newFilters.delete(filter);
            else newFilters.add(filter);
            return newFilters;
        });
    };
    
    const toggleTagFilter = (tag: string) => {
        setActiveTagFilters(prev => {
            const newFilters = new Set(prev);
            if (newFilters.has(tag)) newFilters.delete(tag);
            else newFilters.add(tag);
            return newFilters;
        });
    };
    
    const TabButton: React.FC<{ tabId: ModCreationTab; label: string; icon: React.ElementType }> = ({ tabId, label, icon: Icon }) => (
        <button
          onClick={() => setActiveTab(tabId)}
          className={`flex-shrink-0 flex flex-col sm:flex-row items-center justify-center gap-2 p-3 text-sm font-bold rounded-lg transition-colors duration-200 whitespace-nowrap sm:flex-1 ${
            activeTab === tabId
              ? 'bg-[color:var(--primary-accent-color)]/20 text-[color:var(--primary-accent-color)]'
              : 'text-[color:var(--text-muted-color)] hover:bg-black/10'
          }`}
        >
          <Icon className="w-5 h-5 mb-1 sm:mb-0" />
          <span>{label}</span>
        </button>
    );

    const ContentCard = ({ content }: { content: AddedContentUnion }) => {
        const info = CONTENT_TYPE_INFO[content.contentType as keyof typeof CONTENT_TYPE_INFO];
        if (!info) return null;
    
        const handleEdit = () => {
             switch (content.contentType) {
                case 'item': return handleOpenItemEditor(content);
                case 'talent': return handleOpenTalentEditor(content);
                case 'character': return handleOpenCharacterEditor(content);
                case 'sect': return handleOpenSectEditor(content);
                case 'worldBuilding': return handleOpenWorldBuildingEditor(content);
                case 'npc': return handleOpenNpcEditor(content);
                case 'technique': return handleOpenTechniqueEditor(content);
                case 'event': return handleOpenEventEditor(content);
                case 'recipe': return handleOpenRecipeEditor(content);
                // Custom panels are not manually editable for now
                case 'customPanel': return alert("Bảng Tùy Chỉnh chỉ có thể được tạo bởi AI và chỉnh sửa qua JSON.");
            }
        };

        const nameOrTitle = ('name' in content && content.name)
            ? content.name
            : ('title' in content && content.title)
            ? content.title
            : ('description' in content && content.description)
            ? `${content.description.substring(0, 40)}...`
            : content.id;
        const handleDelete = () => { handleDeleteContent(content.id, nameOrTitle); };
        
        let description: string | undefined;
        switch(content.contentType) {
            case 'item': description = content.type; break;
            case 'talent': description = content.rank; break;
            case 'character': description = content.origin; break;
            case 'sect': description = content.location; break;
            case 'worldBuilding': description = content.description || `Dữ liệu JSON tùy chỉnh...`; break;
            case 'npc': description = content.status; break;
            case 'technique': description = content.type; break;
            case 'event': description = `${content.choices.length} lựa chọn`; break;
            case 'recipe': description = `${content.ingredients.length} nguyên liệu`; break;
            case 'customPanel': description = `${content.content.length} mục`; break;
        }


        return (
            <div className="bg-black/20 p-3 rounded-lg flex flex-col gap-2 border border-gray-700/60 animate-fade-in" style={{animationDuration: '300ms'}}>
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`${info.color} p-2 rounded-md`}><info.icon className="w-5 h-5 text-white/90" /></div>
                        <div className="truncate">
                            <p className="font-bold truncate" style={{color: 'var(--text-color)'}}>{nameOrTitle}</p>
                            {description && <p className="text-sm truncate" style={{color: 'var(--text-muted-color)'}}>{description}</p>}
                        </div>
                    </div>
                     <div className="flex gap-2 flex-shrink-0 ml-2">
                        <button onClick={handleEdit} className="p-2 text-gray-400 hover:text-white"><FaEdit /></button>
                        <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-400"><FaTrash /></button>
                    </div>
                </div>
                {'tags' in content && content.tags && content.tags.length > 0 && (
                     <div className="flex flex-wrap gap-1.5 pl-12">
                        {content.tags.map((tag: string) => (
                            <span key={tag} className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded-full">{tag}</span>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-full animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8">
            <ConfirmationModal isOpen={!!pendingSystemAction} title="Xác Nhận Thay Thế Hệ Thống" message="Hành động này sẽ thay thế toàn bộ cấu hình hệ thống hiện tại bằng dữ liệu mới do AI tạo ra. Bạn có chắc chắn muốn tiếp tục?" onConfirm={handleConfirmSystemReplacement} onCancel={() => setPendingSystemAction(null)} />
            <ItemEditorModal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} onSave={handleSaveItem} itemToEdit={editingItem} allAttributes={ALL_ATTRIBUTES} suggestions={allUniqueTags} />
            <TalentEditorModal isOpen={isTalentModalOpen} onClose={() => setIsTalentModalOpen(false)} onSave={handleSaveTalent} talentToEdit={editingTalent} allAttributes={ALL_ATTRIBUTES} talentRanks={talentRanks} suggestions={allUniqueTags} />
            <CharacterEditorModal isOpen={isCharacterModalOpen} onClose={() => setIsCharacterModalOpen(false)} onSave={handleSaveCharacter} characterToEdit={editingCharacter} allAttributes={ALL_ATTRIBUTES} suggestions={allUniqueTags} />
            <WorldBuildingEditorModal isOpen={isWorldBuildingModalOpen} onClose={() => setIsWorldBuildingModalOpen(false)} onSave={handleSaveWorldBuilding} worldBuildingToEdit={editingWorldBuilding} suggestions={allUniqueTags} />
            <SectEditorModal isOpen={isSectModalOpen} onClose={() => setIsSectModalOpen(false)} onSave={handleSaveSect} sectToEdit={editingSect} suggestions={allUniqueTags} />
            <RealmEditorModal isOpen={isRealmModalOpen} onClose={() => setIsRealmModalOpen(false)} onSave={handleSaveRealm} realmToEdit={editingRealm} allAttributes={ALL_ATTRIBUTES} />
            <NpcEditorModal isOpen={isNpcModalOpen} onClose={() => setIsNpcModalOpen(false)} onSave={handleSaveNpc} npcToEdit={editingNpc} suggestions={allUniqueTags} />
            <TechniqueEditorModal isOpen={isTechniqueModalOpen} onClose={() => setIsTechniqueModalOpen(false)} onSave={handleSaveTechnique} techniqueToEdit={editingTechnique} allAttributes={ALL_ATTRIBUTES} suggestions={allUniqueTags} />
            <EventEditorModal isOpen={isEventModalOpen} onClose={() => setIsEventModalOpen(false)} onSave={handleSaveEvent} eventToEdit={editingEvent} allAttributes={ALL_ATTRIBUTES} suggestions={allUniqueTags} />
            <RecipeEditorModal isOpen={isRecipeModalOpen} onClose={() => setIsRecipeModalOpen(false)} onSave={handleSaveRecipe} recipeToEdit={editingRecipe} />
            
            <div className="flex justify-between items-center mb-6"><h2 className="text-3xl font-bold font-title">Trình Chỉnh Sửa Mod</h2><button onClick={onBack} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50" title="Quay Lại"><FaArrowLeft className="w-5 h-5" /></button></div>

            <div className="flex items-stretch gap-1 p-1 bg-black/20 rounded-lg border border-gray-700/60 mb-8 overflow-x-auto">
                <TabButton tabId="info" label="Thông Tin" icon={FaFileSignature} />
                <TabButton tabId="content" label="Nội Dung" icon={FaBoxes} />
                <TabButton tabId="system" label="Hệ Thống" icon={FaCogs} />
                <TabButton tabId="ai" label="GameMaster AI" icon={FaRobot} />
            </div>

            <div className="min-h-[calc(100vh-28rem)] max-h-[calc(100vh-28rem)] overflow-y-auto pr-2">
                {activeTab === 'info' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                        <Section title="Thông Tin Cơ Bản">
                            <InputRow label="Tên Mod"><input type="text" value={modName} onChange={(e) => setModName(e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" placeholder="Ví dụ: Thần Binh Lợi Khí" /></InputRow>
                            <InputRow label="Tác Giả"><input type="text" value={modAuthor} onChange={(e) => setModAuthor(e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" placeholder="Tên của bạn hoặc biệt danh" /></InputRow>
                            <InputRow label="Mô Tả Mod"><textarea value={modDescription} onChange={(e) => setModDescription(e.target.value)} rows={3} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" placeholder="Ví dụ: Mod này thêm vào 10 loại thần binh mới..." /></InputRow>
                        </Section>
                    </div>
                )}
                {activeTab === 'content' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                        <Section title={addedContentEditorView === 'list' ? 'Nội Dung Thêm Mới' : 'Chỉnh Sửa JSON Hàng Loạt'}>
                             <button onClick={addedContentEditorView === 'list' ? switchToJsonView : () => setAddedContentEditorView('list')} className="float-right -mt-12 flex items-center gap-2 px-3 py-1.5 bg-gray-700/80 text-white text-sm font-bold rounded-lg hover:bg-gray-600/80" title={addedContentEditorView === 'list' ? "Chuyển sang chế độ JSON" : "Chuyển sang chế độ danh sách"}>
                                {addedContentEditorView === 'list' ? <FaCode/> : <FaList />}
                            </button>

                           {addedContentEditorView === 'list' ? (
                                <div className="space-y-4">
                                    <div className="space-y-3 p-3 bg-black/20 rounded-md border border-gray-700/40">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm text-gray-400 mr-2 flex-shrink-0"><FaFilter className="inline-block -mt-1"/> Lọc theo Loại:</p>
                                            {Object.entries(CONTENT_TYPE_INFO).map(([key, {label}]) => (
                                                <button key={key} onClick={() => toggleTypeFilter(key as ContentType)} className={`px-2 py-1 text-xs rounded-full border transition-colors ${activeTypeFilters.has(key as ContentType) ? 'bg-teal-400/20 border-teal-400 text-teal-300' : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50'}`}>{label}</button>
                                            ))}
                                            {activeTypeFilters.size > 0 && <button onClick={() => setActiveTypeFilters(new Set())} className="p-1 text-gray-500 hover:text-white"><FaTimes/></button>}
                                        </div>
                                        {allUniqueTags.length > 0 && (
                                             <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm text-gray-400 mr-2 flex-shrink-0"><FaFilter className="inline-block -mt-1"/> Lọc theo Tag:</p>
                                                {allUniqueTags.map(tag => (
                                                    <button key={tag} onClick={() => toggleTagFilter(tag)} className={`px-2 py-1 text-xs rounded-full border transition-colors ${activeTagFilters.has(tag) ? 'bg-purple-400/20 border-purple-400 text-purple-300' : 'bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50'}`}>{tag}</button>
                                                ))}
                                                {activeTagFilters.size > 0 && <button onClick={() => setActiveTagFilters(new Set())} className="p-1 text-gray-500 hover:text-white"><FaTimes/></button>}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-end">
                                         <div className="relative group flex-shrink-0">
                                            <button className="flex items-center gap-2 px-3 py-1.5 bg-teal-700/80 text-white text-sm font-bold rounded-lg hover:bg-teal-600/80"><FaPlus /> Thêm Thủ Công</button>
                                            <div className="absolute right-0 mt-2 w-48 bg-gray-800/95 border border-gray-700 rounded-md shadow-lg z-10 hidden group-hover:block backdrop-blur-sm">
                                                <a onClick={() => handleOpenItemEditor(null)} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/80 cursor-pointer">Vật Phẩm</a>
                                                <a onClick={() => handleOpenTalentEditor(null)} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/80 cursor-pointer">Tiên Tư</a>
                                                <a onClick={() => handleOpenCharacterEditor(null)} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/80 cursor-pointer">Nhân Vật</a>
                                                <a onClick={() => handleOpenSectEditor(null)} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/80 cursor-pointer">Tông Môn</a>
                                                <a onClick={() => handleOpenWorldBuildingEditor(null)} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/80 cursor-pointer">Thế Giới</a>
                                                <a onClick={() => handleOpenNpcEditor(null)} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/80 cursor-pointer">NPC</a>
                                                <a onClick={() => handleOpenTechniqueEditor(null)} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/80 cursor-pointer">Công Pháp</a>
                                                <a onClick={() => handleOpenEventEditor(null)} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/80 cursor-pointer">Sự Kiện</a>
                                                <a onClick={() => handleOpenRecipeEditor(null)} className="block px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/80 cursor-pointer">Đan Phương</a>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {filteredContent.length > 0 ? (
                                            filteredContent.map(content => <ContentCard key={`${content.contentType}-${content.id}`} content={content} />)
                                        ) : (
                                            <div className="text-center text-gray-500 p-8 bg-black/20 rounded-lg border border-dashed border-gray-700"><p>Chưa có nội dung nào.</p><p className="text-sm mt-1">Sử dụng GameMaster AI hoặc "Thêm Thủ Công" để bắt đầu!</p></div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <textarea value={addedContentJsonText} onChange={(e) => setAddedContentJsonText(e.target.value)} className="w-full h-[calc(100vh-45rem)] bg-gray-900/80 border border-gray-700 rounded-md p-4 text-gray-300 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-teal-400/50 transition-all" spellCheck="false" />
                                     {addedContentJsonError && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-md border border-red-500/30">{addedContentJsonError}</p>}
                                    <div className="flex justify-end gap-3">
                                        <button onClick={handleUpdateFromJson} className="px-5 py-2 bg-green-700/80 text-white font-bold rounded-lg hover:bg-green-600/80 transition-colors">Cập Nhật từ JSON</button>
                                    </div>
                                </div>
                           )}
                        </Section>
                    </div>
                )}
                {activeTab === 'system' && (
                    <div className="animate-fade-in space-y-6" style={{ animationDuration: '300ms' }}>
                        <Section title="Hệ Thống Cảnh Giới Tu Luyện">
                            <div className="space-y-2">
                                {realms.map(realm => (
                                    <div key={realm.id} className="bg-black/20 p-3 rounded-lg flex justify-between items-center border border-gray-700/60">
                                        <div>
                                            <p className="font-bold">{realm.name}</p>
                                            <p className="text-sm" style={{color: 'var(--text-muted-color)'}}>{realm.stages.length} giai đoạn</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleOpenRealmEditor(realm)} className="p-2 text-gray-400 hover:text-white"><FaEdit /></button>
                                            <button onClick={() => handleDeleteRealm(realm.id, realm.name)} className="p-2 text-gray-400 hover:text-red-400"><FaTrash /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                             <button onClick={() => handleOpenRealmEditor(null)} className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-gray-700/80 text-white text-sm font-bold rounded-lg hover:bg-gray-600/80">
                                <FaPlus /> Thêm Cảnh Giới
                            </button>
                        </Section>
                        <Section title="Hệ Thống Phẩm Chất Tiên Tư">
                            <p className="text-sm" style={{color: 'var(--text-muted-color)'}}>Tùy chỉnh các cấp bậc của Tiên Tư và xác suất xuất hiện của chúng.</p>
                             <InputRow label="Cho phép AI tạo Tiên Tư">
                                <div className="flex items-center gap-3">
                                    <input 
                                        type="checkbox" 
                                        id="allowAIGen" 
                                        checked={talentSystemConfig.allowAIGeneratedTalents ?? true} 
                                        onChange={e => setTalentSystemConfig(prev => ({ ...prev, allowAIGeneratedTalents: e.target.checked }))} 
                                        className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-teal-500 focus:ring-teal-500"
                                    />
                                    <label htmlFor="allowAIGen" className="text-sm" style={{color: 'var(--text-muted-color)'}}>
                                        Nếu bật, AI sẽ tự tạo Tiên Tư mới dựa trên ý niệm nhân vật. 
                                        <br/>Nếu tắt, AI sẽ chỉ chọn từ danh sách Tiên Tư bạn đã tạo trong tab "Nội Dung".
                                    </label>
                                </div>
                            </InputRow>
                            <div className="space-y-3">
                                {talentRanks.map((rank, index) => (
                                    <div key={rank.id} className="grid grid-cols-12 gap-2 items-center">
                                        <input type="text" value={rank.name} onChange={(e) => handleTalentRankChange(index, 'name', e.target.value)} className="col-span-5 bg-gray-800/50 border border-gray-600 rounded px-2 py-1 text-sm" placeholder="Tên phẩm chất" />
                                        <input type="text" value={rank.color} onChange={(e) => handleTalentRankChange(index, 'color', e.target.value)} className="col-span-4 bg-gray-800/50 border border-gray-600 rounded px-2 py-1 text-sm" placeholder="Màu CSS (vd: text-red-400)" />
                                        <input type="number" value={rank.weight} onChange={(e) => handleTalentRankChange(index, 'weight', parseInt(e.target.value) || 0)} className="col-span-2 bg-gray-800/50 border border-gray-600 rounded px-2 py-1 text-sm" placeholder="Trọng số" title="Trọng số xác suất" />
                                        <div className="col-span-1 flex justify-end">
                                            <button onClick={() => removeTalentRank(index)} className="p-2 text-gray-400 hover:text-red-400"><FaTrash /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={addTalentRank} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/80 text-white text-sm font-bold rounded-lg hover:bg-gray-600/80">
                                <FaPlus /> Thêm Phẩm Chất
                            </button>
                        </Section>
                    </div>
                )}
                {activeTab === 'ai' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                       <GameMasterChat onActionRequest={handleAIAction} modContext={modContextForAI} />
                    </div>
                )}
            </div>

            <div className="flex justify-end items-center gap-4 mt-10 border-t border-gray-700/50 pt-6 flex-shrink-0">
                <button onClick={handleSaveDraft} className="px-6 py-2 bg-gray-800/80 text-white font-bold rounded-lg hover:bg-gray-700/80 transition-colors">Lưu Bản Nháp</button>
                <button onClick={handleExportMod} className="px-6 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 transition-colors">Đóng Gói Mod</button>
            </div>
        </div>
    );
};

export default CreateModScreen;
