

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
    FaArrowLeft, FaBoxOpen, FaUserShield, FaStar, FaPlus, FaEdit, FaTrash, FaCogs, FaGlobe, FaFilter,
    FaTimes, FaCode, FaList, FaExclamationTriangle, FaRobot, FaFileSignature, FaBoxes, FaScroll, FaUserFriends,
    FaMagic, FaColumns, FaCheckCircle, FaExclamationCircle, FaClone, FaSave, FaDiceD20
} from 'react-icons/fa';
import { GiCastle, GiScrollQuill } from 'react-icons/gi';
import { ALL_ATTRIBUTES, INNATE_TALENT_PROBABILITY, INNATE_TALENT_RANKS, WORLD_MAP, FACTION_NAMES, PHAP_BAO_RANKS } from '../../constants';
import * as db from '../../services/dbService';
// Fix: Add necessary imports for the new panel components and remove old dummy panel imports.
import type { 
    ModItem, ModTalent, TalentSystemConfig, RealmConfig, ModCharacter, ModWorldBuilding, ModTalentRank, ModSect, ModNpc, ModTechnique, ModEvent, ModCustomPanel, ContentType, AlchemyRecipe, AddedContentUnion, AiGeneratedModData,
    Gender, ItemType, InnateTalentRank, SectMember, SectMemberRank, NpcRelationshipInput, CultivationTechniqueType, TechniqueEffect, TechniqueEffectType, EventChoice, EventOutcome, EventOutcomeType, SkillCheck, ItemQuality
} from '../../types';
import StatBonusEditor from './components/StatBonusEditor';
import TagEditor from '../../components/TagEditor';
import AiContentGeneratorModal from './components/AiContentGeneratorModal';


interface CreateModScreenProps {
  onBack: () => void;
}

type ModCreationTab = 'info' | 'editor';

const CONTENT_TYPE_INFO: Record<Exclude<ContentType, 'realm' | 'realmSystem' | 'talentSystem'>, { label: string; icon: React.ElementType; color: string }> = {
    item: { label: 'Vật Phẩm', icon: FaBoxOpen, color: 'text-sky-400' },
    character: { label: 'Nhân Vật', icon: FaUserShield, color: 'text-emerald-400' },
    talent: { label: 'Tiên Tư', icon: FaStar, color: 'text-purple-400' },
    sect: { label: 'Tông Môn', icon: GiCastle, color: 'text-gray-400' },
    worldBuilding: { label: 'Thế Giới', icon: FaGlobe, color: 'text-rose-400' },
    npc: { label: 'NPC', icon: FaUserFriends, color: 'text-cyan-400' },
    technique: { label: 'Công Pháp', icon: FaMagic, color: 'text-amber-400' },
    event: { label: 'Sự Kiện', icon: FaScroll, color: 'text-orange-400' },
    customPanel: { label: 'Bảng UI', icon: FaColumns, color: 'text-indigo-400' },
    recipe: { label: 'Đan Phương', icon: GiScrollQuill, color: 'text-yellow-400' },
};
const SYSTEM_CONFIG_INFO = {
    talentSystem: { label: 'Hệ Thống Tiên Tư', icon: FaStar, color: 'text-purple-400' },
    realmSystem: { label: 'Hệ Thống Cảnh Giới', icon: FaCogs, color: 'text-gray-400' },
}

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

    const [modName, setModName] = useState('');
    const [modAuthor, setModAuthor] = useState('');
    const [modDescription, setModDescription] = useState('');
    
    const [realms, setRealms] = useState<RealmConfig[]>(DEFAULT_REALMS);
    const [talentSystemConfig, setTalentSystemConfig] = useState<TalentSystemConfig>(DEFAULT_TALENT_SYSTEM_CONFIG);
    const [talentRanks, setTalentRanks] = useState<ModTalentRank[]>(DEFAULT_TALENT_RANKS);
    const [addedContent, setAddedContent] = useState<AddedContentUnion[]>([]);
    
    // IDE Layout State
    const [selectedNavKey, setSelectedNavKey] = useState<ContentType>('item');
    // Fix: Change editingContent state to only hold valid AddedContentUnion objects, removing the problematic generic placeholder type.
    const [editingContent, setEditingContent] = useState<AddedContentUnion | null>(null);

    const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
    
    const [activeTypeFilters, setActiveTypeFilters] = useState<Set<ContentType>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    
    const [pendingSystemAction, setPendingSystemAction] = useState<AiGeneratedModData | null>(null);
    const [actionNotifications, setActionNotifications] = useState<{id: number, text: string, type: 'success' | 'error'}[]>([]);

    const showActionNotification = (text: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now();
        setActionNotifications(prev => [...prev.slice(-4), {id, text, type}]);
        setTimeout(() => {
            setActionNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    const timestamp = () => Date.now().toString() + Math.random().toString(36).substring(2, 7);
    
    useEffect(() => {
        const loadDraft = async () => {
            const savedDraft = await db.getModDraft();
            if (savedDraft) {
                if (window.confirm('Tìm thấy một bản nháp chưa lưu. Bạn có muốn tải nó không?')) {
                    try {
                        const parsedData = savedDraft;
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
                        await db.saveModDraft(null);
                    }
                }
            }
        };
        loadDraft();
    }, []);

    const modContextForAI = useMemo(() => {
        const contentByType: { [key: string]: any[] } = {};
        
        addedContent.forEach(c => {
            const { contentType, ...data } = c;
            const keyMap: Record<ContentType, string> = {
                item: 'items', talent: 'talents', character: 'characters', sect: 'sects',
                worldBuilding: 'worldBuilding', npc: 'npcs', technique: 'techniques',
                event: 'events', customPanel: 'customPanels', recipe: 'recipes',
                realm: 'realmConfigs', realmSystem: 'realmConfigs', talentSystem: 'talentSystemConfig',
            };
            const key = keyMap[contentType];
    
            if (key) {
                if (!contentByType[key]) contentByType[key] = [];
                contentByType[key].push(data);
            }
        });
    
        const finalContent: any = {};
        for (const key in contentByType) {
            if (contentByType[key].length > 0) {
                finalContent[key] = contentByType[key].map(item => { const { id, ...rest } = item; return rest; });
            }
        }
        
        return {
            modInfo: { name: modName, author: modAuthor, description: modDescription },
            content: finalContent,
            realmConfigs: realms,
            talentRanks: talentRanks,
            talentSystemConfig,
        }
    }, [modName, modAuthor, modDescription, addedContent, realms, talentRanks, talentSystemConfig]);

    const handleConfirmSystemReplacement = () => {
        if (!pendingSystemAction) return;
        if (pendingSystemAction.realmConfigs) {
            setRealms(pendingSystemAction.realmConfigs.map(realm => ({...realm, id: timestamp() })));
            showActionNotification('Hệ thống cảnh giới đã được thay thế.');
        }
        if (pendingSystemAction.talentSystemConfig) {
            setTalentSystemConfig(pendingSystemAction.talentSystemConfig);
            showActionNotification('Cấu hình hệ thống tiên tư đã được cập nhật.');
        }
        setPendingSystemAction(null);
    };

    const handleAiGeneratedContent = (data: AiGeneratedModData) => {
        if (data.realmConfigs || data.talentSystemConfig) setPendingSystemAction(data);
        if (data.content && data.content.length > 0) {
            const newContent = data.content.map(c => ({...c, id: timestamp()})) as AddedContentUnion[];
            setAddedContent(prev => [...prev, ...newContent]);
            showActionNotification(`AI đã tạo thành công ${newContent.length} mục nội dung mới.`);
        }
    };
    
    const handleSaveContent = (contentToSave: AddedContentUnion) => {
        const exists = addedContent.some(c => c.id === contentToSave.id);
        if (exists) {
            setAddedContent(prev => prev.map(c => (c.id === contentToSave.id ? contentToSave : c)));
        } else {
            setAddedContent(prev => [...prev, contentToSave]);
        }
        setEditingContent(null);
    };
    
    const handleDeleteContent = (id: string, name: string) => {
        if (window.confirm(`Bạn có chắc muốn xóa "${name}"?`)) {
            if (editingContent?.id === id) setEditingContent(null);
            setAddedContent(prev => prev.filter(c => c.id !== id));
        }
    };
    
    const handleDuplicateContent = (contentToDuplicate: AddedContentUnion) => {
        const newContent = {
            ...JSON.parse(JSON.stringify(contentToDuplicate)), // deep copy
            id: timestamp(),
            name: `${('name' in contentToDuplicate ? contentToDuplicate.name : 'Item')} (Copy)`,
            title: `${('title' in contentToDuplicate ? contentToDuplicate.title : 'Title')} (Copy)`,
        };
        setAddedContent(prev => [...prev, newContent]);
    };
    
    // Fix: Create a handler that generates a full default object for new content, ensuring type safety.
    const handleAddNewContent = (contentType: ContentType) => {
        const newId = timestamp();
        let newContent: AddedContentUnion;

        switch (contentType) {
            case 'item':
                newContent = { id: newId, contentType: 'item', name: '', description: '', type: 'Tạp Vật', bonuses: [], tags: [], quality: 'Phàm Phẩm', weight: 0 };
                break;
            case 'talent':
                const defaultRank = talentRanks.length > 0 ? talentRanks[0].name as InnateTalentRank : 'Phàm Giai';
                newContent = { id: newId, contentType: 'talent', name: '', description: '', rank: defaultRank, bonuses: [], tags: [] };
                break;
            case 'character':
                newContent = { id: newId, contentType: 'character', name: '', gender: 'Nam', origin: '', appearance: '', personality: '', bonuses: [], tags: [] };
                break;
            case 'sect':
                newContent = { id: newId, contentType: 'sect', name: '', description: '', location: '', members: [], tags: [] };
                break;
            case 'worldBuilding':
                newContent = { id: newId, contentType: 'worldBuilding', title: '', description: '', data: {}, tags: [] };
                break;
            case 'npc':
                newContent = { id: newId, contentType: 'npc', name: '', status: '', description: '', origin: '', personality: '', locationId: WORLD_MAP[0]?.id || '', talentNames: [], relationships: [], tags: [] };
                break;
            case 'technique':
                newContent = { id: newId, contentType: 'technique', name: '', description: '', type: 'Linh Kỹ', cost: { type: 'Linh Lực', value: 0 }, cooldown: 0, rank: 'Phàm Giai', icon: '💧', level: 1, maxLevel: 10, requirements: [], effects: [], tags: [] };
                break;
            case 'event':
                newContent = { id: newId, contentType: 'event', name: '', description: '', choices: [{ text: 'Lựa chọn 1', check: null, outcomes: [] }], tags: [] };
                break;
            case 'recipe':
                // Fix: Corrected attribute name from 'Đan Thuật' to 'Ngự Khí Thuật' to match the type definition.
                newContent = { id: newId, contentType: 'recipe', name: '', description: '', ingredients: [{ name: '', quantity: 1 }], result: { name: '', quantity: 1 }, requiredAttribute: { name: 'Ngự Khí Thuật', value: 10 }, icon: '📜', qualityCurve: [{ threshold: 50, quality: 'Linh Phẩm' }] };
                break;
            case 'customPanel':
                newContent = { id: newId, contentType: 'customPanel', title: '', iconName: 'FaBook', content: [], tags: [] };
                break;
            default:
                // This should not be reached with valid ContentType
                console.error("Invalid content type for creation:", contentType);
                return;
        }
        setEditingContent(newContent);
    };

    const packageModData = () => {
        const content: Record<string, any[]> = {
            items: [], talents: [], characters: [], worldBuilding: [], sects: [], npcs: [], techniques: [], events: [], recipes: [], customPanels: []
        };
        
        addedContent.forEach(c => {
            const { contentType, ...data } = c;
            const key = `${contentType}s`;
            if (key in content) {
                 content[key].push(data);
            } else if (contentType === 'worldBuilding') {
                 content.worldBuilding.push(data);
            } else if (contentType === 'customPanel') {
                content.customPanels.push(data);
            }
        });

        const finalContent: any = {};
        for(const key in content) {
            if(content[key].length > 0) {
                finalContent[key] = content[key].map(item => { const { id, ...rest } = item; return rest; });
            }
        }

        return {
            modInfo: {
                name: modName, author: modAuthor, description: modDescription, version: '1.0.0',
                id: modName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') || `mod-${Date.now()}`
            },
            content: { ...finalContent,
                realmConfigs: realms.map(({ id, ...rest }) => rest),
                talentSystemConfig,
                talentRanks: talentRanks.map(({ id, ...rest }) => rest),
            }
        };
    };

    const handleSaveDraft = async () => {
        try {
            const modData = packageModData();
            await db.saveModDraft(modData);
            alert('Bản nháp đã được lưu!');
        } catch (error) { console.error("Failed to save draft:", error); alert('Lỗi: Không thể lưu bản nháp.'); }
    };

    const handleExportMod = () => {
        if (!modName.trim()) { alert('Vui lòng nhập Tên Mod trước khi đóng gói.'); return; }
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
        } catch (error) { console.error("Failed to export mod:", error); alert('Lỗi: Không thể xuất mod.'); }
    };
    
    const filteredContent = useMemo(() => {
        return addedContent.filter(content => {
            const typeMatch = selectedNavKey === content.contentType;
            const searchMatch = !searchTerm || ('name' in content && content.name.toLowerCase().includes(searchTerm.toLowerCase())) || ('title' in content && content.title.toLowerCase().includes(searchTerm.toLowerCase()));
            return typeMatch && searchMatch;
        });
    }, [addedContent, selectedNavKey, searchTerm]);
    
    const TabButton: React.FC<{ tabId: ModCreationTab; label: string; icon: React.ElementType }> = ({ tabId, label, icon: Icon }) => (
        <button
          onClick={() => setActiveTab(tabId)}
          className={`flex-shrink-0 flex flex-col sm:flex-row items-center justify-center gap-2 p-3 text-sm font-bold rounded-lg transition-colors duration-200 whitespace-nowrap sm:flex-1 ${
            activeTab === tabId ? 'bg-[color:var(--primary-accent-color)]/20 text-[color:var(--primary-accent-color)]' : 'text-[color:var(--text-muted-color)] hover:bg-black/10'}`}>
          <Icon className="w-5 h-5 mb-1 sm:mb-0" />
          <span>{label}</span>
        </button>
    );

    const commonEditorProps = {
        onClose: () => setEditingContent(null),
        onSave: handleSaveContent,
        allAttributes: ALL_ATTRIBUTES,
        suggestions: useMemo(() => Array.from(new Set(addedContent.flatMap(c => ('tags' in c && c.tags) || []))), [addedContent])
    };

    const renderEditorPanel = () => {
        if (!editingContent) {
            return (
                <div className="flex-grow flex items-center justify-center text-center text-gray-500 p-8">
                    <div>
                        <FaEdit size={48} className="mx-auto mb-4" />
                        <h3 className="text-xl font-bold">Trình Chỉnh Sửa</h3>
                        <p>Chọn một mục từ danh sách bên trái để chỉnh sửa, hoặc tạo một mục mới.</p>
                    </div>
                </div>
            );
        }

        // Fix: Pass correctly typed props to the implemented panel components.
        switch (editingContent.contentType) {
            case 'item': return <ItemEditorPanel {...commonEditorProps} itemToEdit={editingContent} />;
            case 'talent': return <TalentEditorPanel {...commonEditorProps} talentToEdit={editingContent} talentRanks={talentRanks} />;
            case 'character': return <CharacterEditorPanel {...commonEditorProps} characterToEdit={editingContent} />;
            case 'sect': return <SectEditorPanel {...commonEditorProps} sectToEdit={editingContent} />;
            case 'worldBuilding': return <WorldBuildingEditorPanel {...commonEditorProps} worldBuildingToEdit={editingContent} />;
            case 'npc': return <NpcEditorPanel {...commonEditorProps} npcToEdit={editingContent} />;
            case 'technique': return <TechniqueEditorPanel {...commonEditorProps} techniqueToEdit={editingContent} />;
            case 'event': return <EventEditorPanel {...commonEditorProps} eventToEdit={editingContent} />;
            case 'recipe': return <RecipeEditorPanel {...commonEditorProps} recipeToEdit={editingContent} />;
            default: return <p>Loại nội dung không được hỗ trợ.</p>;
        }
    };
    
    return (
        <div className="w-full animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8 relative flex flex-col h-full max-h-[85vh]">
            {/* Action Notifications */}
            <div className="absolute top-4 right-4 z-30 w-full max-w-sm space-y-2">
                {actionNotifications.map(n => (
                    <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg shadow-lg text-sm font-semibold animate-fade-in ${n.type === 'success' ? 'bg-green-800/95 text-white border border-green-600' : 'bg-red-800/95 text-white border border-red-600'}`}>
                        {n.type === 'success' ? <FaCheckCircle className="w-5 h-5 mt-0.5 text-green-300 flex-shrink-0"/> : <FaExclamationCircle className="w-5 h-5 mt-0.5 text-red-300 flex-shrink-0"/>}
                        <span>{n.text}</span>
                    </div>
                ))}
            </div>

            <ConfirmationModal isOpen={!!pendingSystemAction} title="Xác Nhận Thay Thế Hệ Thống" message="Hành động này sẽ thay thế toàn bộ cấu hình hệ thống hiện tại bằng dữ liệu mới do AI tạo ra. Bạn có chắc chắn muốn tiếp tục?" onConfirm={handleConfirmSystemReplacement} onCancel={() => setPendingSystemAction(null)} />
            <AiContentGeneratorModal isOpen={isAiGeneratorOpen} onClose={() => setIsAiGeneratorOpen(false)} onGenerate={handleAiGeneratedContent} modContext={modContextForAI} />
            
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-3xl font-bold font-title">Trình Chỉnh Sửa Mod</h2>
                <button onClick={onBack} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50" title="Quay Lại"><FaArrowLeft className="w-5 h-5" /></button>
            </div>

            <div className="flex items-stretch gap-1 p-1 bg-black/20 rounded-lg border border-gray-700/60 mb-8 overflow-x-auto flex-shrink-0">
                <TabButton tabId="info" label="Thông Tin" icon={FaFileSignature} />
                <TabButton tabId="editor" label="Trình Chỉnh Sửa" icon={FaEdit} />
            </div>

            <div className="flex-grow min-h-0 overflow-y-auto">
                {activeTab === 'info' && (
                    <div className="animate-fade-in" style={{ animationDuration: '300ms' }}>
                        <Section title="Thông Tin Cơ Bản">
                            <InputRow label="Tên Mod"><input type="text" value={modName} onChange={(e) => setModName(e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" placeholder="Ví dụ: Thần Binh Lợi Khí" /></InputRow>
                            <InputRow label="Tác Giả"><input type="text" value={modAuthor} onChange={(e) => setModAuthor(e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" placeholder="Tên của bạn hoặc biệt danh" /></InputRow>
                            <InputRow label="Mô Tả Mod"><textarea value={modDescription} onChange={(e) => setModDescription(e.target.value)} rows={3} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" placeholder="Ví dụ: Mod này thêm vào 10 loại thần binh mới..." /></InputRow>
                        </Section>
                    </div>
                )}
                {activeTab === 'editor' && (
                    <div className="h-full flex gap-4 animate-fade-in" style={{ animationDuration: '300ms' }}>
                        {/* Column 1: Navigation */}
                        <div className="w-1/5 flex-shrink-0 h-full overflow-y-auto pr-2">
                            <h3 className="text-lg font-bold font-title mb-2 text-gray-400">Nội Dung</h3>
                            <div className="space-y-1">
                                {Object.entries(CONTENT_TYPE_INFO).map(([key, { label, icon: Icon, color }]) => (
                                    <button key={key} onClick={() => { setSelectedNavKey(key as ContentType); setEditingContent(null); }}
                                        className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${selectedNavKey === key ? 'bg-gray-700/80 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}>
                                        <Icon className={`${color}`} /> <span className="text-sm font-semibold">{label}</span>
                                    </button>
                                ))}
                            </div>
                            <h3 className="text-lg font-bold font-title mt-6 mb-2 text-gray-400">Hệ Thống</h3>
                             <div className="space-y-1">
                                {Object.entries(SYSTEM_CONFIG_INFO).map(([key, { label, icon: Icon, color }]) => (
                                    <button key={key} onClick={() => { /* Handle system editing */ }} disabled
                                        className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors text-gray-600 cursor-not-allowed`}>
                                        <Icon className={`${color}`} /> <span className="text-sm font-semibold">{label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Column 2: Content List */}
                        <div className="w-2/5 flex flex-col h-full bg-black/20 border border-gray-700/60 rounded-lg">
                            <div className="p-3 border-b border-gray-700/60 flex-shrink-0 flex gap-2">
                                <input type="text" placeholder="Tìm kiếm..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-1.5 text-sm" />
                                <button onClick={() => handleAddNewContent(selectedNavKey)} className="px-3 py-1.5 bg-teal-700/80 text-white text-sm font-bold rounded-lg hover:bg-teal-600/80 flex-shrink-0"><FaPlus /></button>
                                <button onClick={() => setIsAiGeneratorOpen(true)} className="px-3 py-1.5 bg-purple-700/80 text-white text-sm font-bold rounded-lg hover:bg-purple-600/80 flex-shrink-0" title="Tạo bằng AI"><FaRobot /></button>
                            </div>
                            <div className="overflow-y-auto p-2 space-y-2 flex-grow">
                                {filteredContent.map(content => {
                                    const info = CONTENT_TYPE_INFO[content.contentType as keyof typeof CONTENT_TYPE_INFO];
                                    const name = ('name' in content && content.name) || ('title' in content && content.title) || 'Không có tên';
                                    return (
                                        <div key={content.id} className={`p-2 rounded-md border-l-4 transition-colors ${editingContent?.id === content.id ? 'bg-gray-700/50 border-amber-400' : 'bg-gray-800/50 border-transparent hover:bg-gray-700/50'}`}>
                                            <div className="flex justify-between items-center">
                                                <button onClick={() => setEditingContent(content)} className="flex items-center gap-2 text-left flex-grow truncate">
                                                    <info.icon className={`${info.color}`} />
                                                    <span className="font-semibold truncate">{name}</span>
                                                </button>
                                                <div className="flex-shrink-0 flex items-center gap-1">
                                                    <button onClick={() => handleDuplicateContent(content)} className="p-1 text-gray-500 hover:text-cyan-400"><FaClone size={12}/></button>
                                                    <button onClick={() => handleDeleteContent(content.id, name)} className="p-1 text-gray-500 hover:text-red-400"><FaTrash size={12}/></button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Column 3: Editor Panel */}
                        <div className="w-2/5 flex flex-col h-full bg-black/20 border border-gray-700/60 rounded-lg">
                           {renderEditorPanel()}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end items-center gap-4 mt-6 border-t border-gray-700/50 pt-4 flex-shrink-0">
                <button onClick={handleSaveDraft} className="px-6 py-2 bg-gray-800/80 text-white font-bold rounded-lg hover:bg-gray-700/80 transition-colors">Lưu Bản Nháp</button>
                <button onClick={handleExportMod} className="px-6 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 transition-colors">Đóng Gói Mod</button>
            </div>
        </div>
    );
};

// Fix: Replace dummy components with full implementations adapted from modal files.

// Panel Wrapper Component for consistent header/footer/layout
const EditorPanelWrapper: React.FC<{ title: string; onClose: () => void; onSave: () => void; children: React.ReactNode; }> = ({ title, onClose, onSave, children }) => (
    <div className="h-full flex flex-col">
        <div className="p-3 border-b border-gray-700/60 flex justify-between items-center flex-shrink-0">
            <h4 className="text-lg text-gray-200 font-bold font-title truncate">{title}</h4>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white flex-shrink-0"><FaTimes /></button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto flex-grow">
            {children}
        </div>
        <div className="p-3 border-t border-gray-700/60 flex justify-end gap-3 flex-shrink-0">
            <button onClick={onClose} className="px-4 py-2 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80 text-sm">Hủy</button>
            <button onClick={onSave} className="px-4 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 text-sm flex items-center gap-2">
                <FaSave /> Lưu
            </button>
        </div>
    </div>
);

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);

// --- Item Editor Panel ---
interface ItemEditorPanelProps {
    onClose: () => void;
    onSave: (item: AddedContentUnion) => void;
    itemToEdit: ModItem & { contentType: 'item' };
    allAttributes: string[];
    suggestions?: string[];
}
const ItemEditorPanel: React.FC<ItemEditorPanelProps> = ({ onClose, onSave, itemToEdit, allAttributes, suggestions }) => {
    const [item, setItem] = useState<ModItem & { contentType: 'item' } | null>(null);
    const ITEM_TYPE_OPTIONS: ItemType[] = ['Vũ Khí', 'Phòng Cụ', 'Đan Dược', 'Pháp Bảo', 'Tạp Vật', 'Đan Lô', 'Linh Dược', 'Đan Phương'];


    useEffect(() => {
        setItem(JSON.parse(JSON.stringify(itemToEdit)));
    }, [itemToEdit]);

    if (!item) return null;

    const handleChange = (field: keyof ModItem, value: any) => {
        setItem({ ...item, [field]: value });
    };

    const handleSaveChanges = () => {
        if (!item.name.trim()) {
            alert("Tên Vật Phẩm không được để trống.");
            return;
        }
        onSave(item);
    };

    return (
        <EditorPanelWrapper title={itemToEdit.name ? 'Chỉnh Sửa Vật Phẩm' : 'Tạo Vật Phẩm Mới'} onClose={onClose} onSave={handleSaveChanges}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldWrapper label="Tên Vật Phẩm">
                    <input type="text" value={item.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: Tru Tiên Kiếm" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" />
                </FieldWrapper>
                 <FieldWrapper label="Loại Vật Phẩm">
                    <select value={item.type} onChange={e => handleChange('type', e.target.value as ItemType)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50">
                       {ITEM_TYPE_OPTIONS.map(type => (
                            <option key={type} value={type}>{type}</option>
                       ))}
                    </select>
                </FieldWrapper>
            </div>
            <FieldWrapper label="Mô Tả">
                <textarea value={item.description} onChange={e => handleChange('description', e.target.value)} rows={3} placeholder="Mô tả vật phẩm..." className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" />
            </FieldWrapper>
            <FieldWrapper label="Tags (Thẻ)">
                <TagEditor tags={item.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} />
            </FieldWrapper>
            <FieldWrapper label="Chỉ số thưởng">
                 <StatBonusEditor bonuses={item.bonuses} onChange={bonuses => handleChange('bonuses', bonuses)} allAttributes={allAttributes} />
            </FieldWrapper>
        </EditorPanelWrapper>
    );
};

// --- Talent Editor Panel ---
interface TalentEditorPanelProps {
    onClose: () => void;
    onSave: (talent: AddedContentUnion) => void;
    talentToEdit: ModTalent & { contentType: 'talent' };
    allAttributes: string[];
    talentRanks: ModTalentRank[];
    suggestions?: string[];
}
const TalentEditorPanel: React.FC<TalentEditorPanelProps> = ({ onClose, onSave, talentToEdit, allAttributes, talentRanks, suggestions }) => {
    const [talent, setTalent] = useState<(ModTalent & { contentType: 'talent' }) | null>(null);
    useEffect(() => {
        setTalent(JSON.parse(JSON.stringify(talentToEdit)));
    }, [talentToEdit]);
    if (!talent) return null;
    const handleChange = (field: keyof ModTalent, value: any) => setTalent({ ...talent, [field]: value });
    const handleSaveChanges = () => {
        if (!talent.name.trim()) return alert("Tên Tiên Tư không được để trống.");
        onSave(talent);
    };
    return (
        <EditorPanelWrapper title={talentToEdit.name ? 'Chỉnh Sửa Tiên Tư' : 'Tạo Tiên Tư Mới'} onClose={onClose} onSave={handleSaveChanges}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldWrapper label="Tên Tiên Tư"><input type="text" value={talent.name} onChange={e => handleChange('name', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" /></FieldWrapper>
                <FieldWrapper label="Cấp Bậc">
                    <select value={talent.rank} onChange={e => handleChange('rank', e.target.value as InnateTalentRank)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">
                       {talentRanks.map(rank => <option key={rank.id} value={rank.name}>{rank.name}</option>)}
                    </select>
                </FieldWrapper>
            </div>
            <FieldWrapper label="Mô Tả"><textarea value={talent.description} onChange={e => handleChange('description', e.target.value)} rows={3} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" /></FieldWrapper>
            <FieldWrapper label="Tags"><TagEditor tags={talent.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} /></FieldWrapper>
            <FieldWrapper label="Chỉ số thưởng"><StatBonusEditor bonuses={talent.bonuses} onChange={bonuses => handleChange('bonuses', bonuses)} allAttributes={allAttributes} /></FieldWrapper>
        </EditorPanelWrapper>
    );
};

// --- Character Editor Panel ---
interface CharacterEditorPanelProps { onClose: () => void; onSave: (char: AddedContentUnion) => void; characterToEdit: ModCharacter & { contentType: 'character' }; allAttributes: string[]; suggestions?: string[]; }
const CharacterEditorPanel: React.FC<CharacterEditorPanelProps> = ({ onClose, onSave, characterToEdit, allAttributes, suggestions }) => {
    const [character, setCharacter] = useState<(ModCharacter & { contentType: 'character' }) | null>(null);
    useEffect(() => {
        setCharacter(JSON.parse(JSON.stringify(characterToEdit)));
    }, [characterToEdit]);
    if (!character) return null;
    const handleChange = (field: keyof ModCharacter, value: any) => setCharacter({ ...character, [field]: value });
    const handleSaveChanges = () => {
        if (!character.name.trim()) return alert("Tên nhân vật không được để trống.");
        onSave(character);
    };
    return (
        <EditorPanelWrapper title={characterToEdit.name ? 'Chỉnh Sửa Nhân Vật' : 'Tạo Nhân Vật Mới'} onClose={onClose} onSave={handleSaveChanges}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FieldWrapper label="Tên Nhân Vật"><input type="text" value={character.name} onChange={e => handleChange('name', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" /></FieldWrapper>
                <FieldWrapper label="Giới Tính"><select value={character.gender} onChange={e => handleChange('gender', e.target.value as Gender)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2">{['Nam', 'Nữ'].map(g => <option key={g} value={g}>{g}</option>)}</select></FieldWrapper>
            </div>
            <FieldWrapper label="Tính Cách"><input type="text" value={character.personality} onChange={e => handleChange('personality', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" /></FieldWrapper>
            <FieldWrapper label="Xuất Thân"><textarea value={character.origin} onChange={e => handleChange('origin', e.target.value)} rows={2} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" /></FieldWrapper>
            <FieldWrapper label="Ngoại Hình"><textarea value={character.appearance} onChange={e => handleChange('appearance', e.target.value)} rows={2} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2" /></FieldWrapper>
            <FieldWrapper label="Tags"><TagEditor tags={character.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} /></FieldWrapper>
            <FieldWrapper label="Chỉ số cơ bản"><StatBonusEditor bonuses={character.bonuses} onChange={bonuses => handleChange('bonuses', bonuses)} allAttributes={allAttributes} /></FieldWrapper>
        </EditorPanelWrapper>
    );
};

// --- Sect Editor Panel ---
interface SectEditorPanelProps { onClose: () => void; onSave: (sect: AddedContentUnion) => void; sectToEdit: ModSect & { contentType: 'sect' }; suggestions?: string[]; }
const SECT_MEMBER_RANKS: SectMemberRank[] = ['Tông Chủ', 'Trưởng Lão', 'Đệ Tử Chân Truyền', 'Đệ Tử Nội Môn', 'Đệ Tử Ngoại Môn'];
const SectEditorPanel: React.FC<SectEditorPanelProps> = ({ onClose, onSave, sectToEdit, suggestions }) => {
    const [sect, setSect] = useState<(ModSect & { contentType: 'sect' }) | null>(null);
    useEffect(() => {
        setSect(JSON.parse(JSON.stringify(sectToEdit)));
    }, [sectToEdit]);
    if (!sect) return null;
    const handleChange = (field: keyof ModSect, value: any) => setSect({ ...sect, [field]: value });
    const handleMemberChange = (id: string, field: keyof SectMember, value: string) => {
        const updatedMembers = sect.members.map(m => m.id === id ? { ...m, [field]: value } : m);
        handleChange('members', updatedMembers);
    };
    const handleAddMember = () => {
        const newMember: SectMember = { id: Date.now().toString(), name: '', rank: 'Đệ Tử Ngoại Môn' };
        handleChange('members', [...sect.members, newMember]);
    };
    const handleRemoveMember = (id: string) => {
        handleChange('members', sect.members.filter(m => m.id !== id));
    };
    const handleSaveChanges = () => {
        if (!sect.name.trim()) return alert("Tên Tông Môn không được để trống.");
        onSave(sect);
    };
    return <EditorPanelWrapper title="Editor Tông Môn" onClose={onClose} onSave={handleSaveChanges}><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FieldWrapper label="Tên Tông Môn"><input type="text" value={sect.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: Thục Sơn Kiếm Phái" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" /></FieldWrapper><FieldWrapper label="Trụ Sở"><input type="text" value={sect.location} onChange={e => handleChange('location', e.target.value)} placeholder="Ví dụ: Côn Lôn Sơn" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" /></FieldWrapper></div><FieldWrapper label="Mô Tả"><textarea value={sect.description} onChange={e => handleChange('description', e.target.value)} rows={3} placeholder="Mô tả về lịch sử, tôn chỉ của tông môn..." className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" /></FieldWrapper><FieldWrapper label="Tags (Thẻ)"><TagEditor tags={sect.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} /></FieldWrapper><FieldWrapper label="Thành Viên"><div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2 custom-scrollbar bg-black/20 p-3 rounded-lg border border-gray-700/60">{sect.members.length > 0 ? sect.members.map((member) => (<div key={member.id} className="grid grid-cols-12 gap-2 items-center"><input type="text" value={member.name} onChange={e => handleMemberChange(member.id, 'name', e.target.value)} placeholder="Tên" className="col-span-5 bg-gray-800/70 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-300" /><select value={member.rank} onChange={e => handleMemberChange(member.id, 'rank', e.target.value)} className="col-span-6 bg-gray-800/70 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-300">{SECT_MEMBER_RANKS.map(r => <option key={r} value={r}>{r}</option>)}</select><button onClick={() => handleRemoveMember(member.id)} className="col-span-1 p-2 text-gray-500 hover:text-red-400"><FaTrash /></button></div>)) : <p className="text-sm text-gray-500 text-center py-2">Chưa có thành viên nào.</p>}</div><button onClick={handleAddMember} className="mt-2 flex items-center gap-2 w-full justify-center px-3 py-2 bg-gray-700/80 text-white text-sm font-bold rounded-lg hover:bg-gray-600/80 transition-colors"><FaPlus /> Thêm Thành Viên</button></FieldWrapper></EditorPanelWrapper>;
};

// --- WorldBuilding Editor Panel ---
interface WorldBuildingEditorPanelProps { onClose: () => void; onSave: (wb: AddedContentUnion) => void; worldBuildingToEdit: ModWorldBuilding & { contentType: 'worldBuilding' }; suggestions?: string[]; }
const WorldBuildingEditorPanel: React.FC<WorldBuildingEditorPanelProps> = ({ onClose, onSave, worldBuildingToEdit, suggestions }) => {
    const [wb, setWb] = useState<(ModWorldBuilding & { contentType: 'worldBuilding' }) | null>(null);
    const [jsonString, setJsonString] = useState('');
    const [parseError, setParseError] = useState<string|null>(null);
    useEffect(() => {
        setWb(JSON.parse(JSON.stringify(worldBuildingToEdit)));
        setJsonString(JSON.stringify(worldBuildingToEdit.data, null, 2));
        setParseError(null);
    }, [worldBuildingToEdit]);
    if (!wb) return null;
    const handleChange = (field: keyof ModWorldBuilding, value: any) => setWb({ ...wb, [field]: value });
    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setJsonString(e.target.value);
        try { JSON.parse(e.target.value); setParseError(null); } catch (e) { setParseError((e as Error).message); }
    };
    const handleSaveChanges = () => {
        if (!wb.title.trim()) return alert("Tiêu đề không được để trống.");
        if (parseError) return alert("Không thể lưu: JSON không hợp lệ.");
        onSave({ ...wb, data: JSON.parse(jsonString) });
    };
    return <EditorPanelWrapper title="Editor Dữ Liệu Thế Giới" onClose={onClose} onSave={handleSaveChanges}><FieldWrapper label="Tiêu Đề"><input type="text" value={wb.title} onChange={e => handleChange('title', e.target.value)} placeholder="Ví dụ: Hệ Thống Kinh Tế Nhà Thương" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" /></FieldWrapper><FieldWrapper label="Mô Tả"><textarea value={wb.description} onChange={e => handleChange('description', e.target.value)} rows={3} placeholder="Mô tả ngắn gọn về khối dữ liệu này..." className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" /></FieldWrapper><FieldWrapper label="Tags (Thẻ)"><TagEditor tags={wb.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} /></FieldWrapper><FieldWrapper label="Dữ Liệu (JSON)"><textarea value={jsonString} onChange={handleJsonChange} rows={10} className={`w-full bg-gray-900/80 border rounded-md p-4 text-gray-300 font-mono text-xs focus:outline-none focus:ring-1 transition-all ${parseError ? 'border-red-500/70 focus:ring-red-500/50' : 'border-gray-700 focus:ring-teal-400/50'}`} spellCheck="false" />{parseError && <p className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded-md border border-red-500/30">Lỗi: {parseError}</p>}</FieldWrapper></EditorPanelWrapper>;
};

// --- NPC Editor Panel ---
interface NpcEditorPanelProps { onClose: () => void; onSave: (npc: AddedContentUnion) => void; npcToEdit: ModNpc & { contentType: 'npc' }; suggestions?: string[]; }
const NpcEditorPanel: React.FC<NpcEditorPanelProps> = ({ onClose, onSave, npcToEdit, suggestions }) => {
    const [npc, setNpc] = useState<(ModNpc & { contentType: 'npc' }) | null>(null);
    useEffect(() => {
        setNpc(JSON.parse(JSON.stringify(npcToEdit)));
    }, [npcToEdit]);
    if (!npc) return null;
    const handleChange = (field: keyof ModNpc, value: any) => setNpc({ ...npc, [field]: value });
    const handleRelationshipChange = (index: number, field: keyof NpcRelationshipInput, value: string) => { const newRelationships = [...(npc.relationships || [])]; newRelationships[index] = { ...newRelationships[index], [field]: value }; handleChange('relationships', newRelationships); };
    const addRelationship = () => { const newRel: NpcRelationshipInput = { targetNpcName: '', type: 'Bằng hữu', description: '' }; handleChange('relationships', [...(npc.relationships || []), newRel]); };
    const removeRelationship = (index: number) => handleChange('relationships', (npc.relationships || []).filter((_, i) => i !== index));
    const handleSaveChanges = () => { if (!npc.name.trim()) return alert("Tên NPC không được để trống."); onSave(npc); };
    return <EditorPanelWrapper title="Editor NPC" onClose={onClose} onSave={handleSaveChanges}><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FieldWrapper label="Tên NPC"><input type="text" value={npc.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: Khương Tử Nha" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" /></FieldWrapper><FieldWrapper label="Vị Trí Ban Đầu"><select value={npc.locationId} onChange={e => handleChange('locationId', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200">{WORLD_MAP.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}</select></FieldWrapper></div><FieldWrapper label="Phe Phái"><select value={npc.faction || ''} onChange={e => handleChange('faction', e.target.value || undefined)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200"><option value="">Không có</option>{FACTION_NAMES.map(name => <option key={name} value={name}>{name}</option>)}</select></FieldWrapper><FieldWrapper label="Trạng Thái Hiện Tại"><input type="text" value={npc.status} onChange={e => handleChange('status', e.target.value)} placeholder="Ví dụ: Đang câu cá bên bờ sông Vị Thủy" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" /></FieldWrapper><FieldWrapper label="Mô Tả Ngoại Hình"><textarea value={npc.description} onChange={e => handleChange('description', e.target.value)} rows={2} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" /></FieldWrapper><FieldWrapper label="Xuất Thân"><textarea value={npc.origin} onChange={e => handleChange('origin', e.target.value)} rows={2} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" /></FieldWrapper><FieldWrapper label="Tính Cách"><input type="text" value={npc.personality} onChange={e => handleChange('personality', e.target.value)} placeholder="Ví dụ: Chính trực, thông tuệ" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" /></FieldWrapper><FieldWrapper label="Tên các Tiên Tư (phân cách bằng dấu phẩy)"><input type="text" value={(npc.talentNames || []).join(', ')} onChange={e => handleChange('talentNames', e.target.value.split(',').map(t => t.trim()))} placeholder="Thánh Thể Hoang Cổ, Kiếm Tâm Thông Minh" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" /></FieldWrapper><FieldWrapper label="Quan Hệ"><div className="space-y-2 max-h-40 overflow-y-auto pr-2">{(npc.relationships || []).map((rel, index) => (<div key={index} className="grid grid-cols-12 gap-2 items-center bg-black/20 p-2 rounded-md"><input type="text" value={rel.targetNpcName} onChange={e => handleRelationshipChange(index, 'targetNpcName', e.target.value)} placeholder="Tên NPC mục tiêu" className="col-span-4 bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-sm"/><input type="text" value={rel.type} onChange={e => handleRelationshipChange(index, 'type', e.target.value)} placeholder="Loại quan hệ (vd: Sư đồ)" className="col-span-3 bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-sm"/><input type="text" value={rel.description} onChange={e => handleRelationshipChange(index, 'description', e.target.value)} placeholder="Mô tả ngắn" className="col-span-4 bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-sm"/><button onClick={() => removeRelationship(index)} className="col-span-1 p-1 text-gray-500 hover:text-red-400"><FaTrash size={12}/></button></div>))}</div><button onClick={addRelationship} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 mt-2"><FaPlus size={10} /> Thêm quan hệ</button></FieldWrapper><FieldWrapper label="Tags"><TagEditor tags={npc.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} /></FieldWrapper></EditorPanelWrapper>;
};

// --- Technique Editor Panel ---
interface TechniqueEditorPanelProps { onClose: () => void; onSave: (tech: AddedContentUnion) => void; techniqueToEdit: ModTechnique & { contentType: 'technique' }; allAttributes: string[]; suggestions?: string[]; }
const TECHNIQUE_TYPES: CultivationTechniqueType[] = ['Linh Kỹ', 'Thần Thông', 'Độn Thuật', 'Tuyệt Kỹ']; const COST_TYPES = ['Linh Lực', 'Sinh Mệnh', 'Nguyên Thần']; const EFFECT_TYPES: TechniqueEffectType[] = ['DAMAGE', 'HEAL', 'BUFF', 'DEBUFF'];
const TechniqueEditorPanel: React.FC<TechniqueEditorPanelProps> = ({ onClose, onSave, techniqueToEdit, allAttributes, suggestions }) => {
    const [technique, setTechnique] = useState<(ModTechnique & { contentType: 'technique' }) | null>(null);
    useEffect(() => {
        setTechnique(JSON.parse(JSON.stringify(techniqueToEdit)));
    }, [techniqueToEdit]);
    if (!technique) return null;
    const handleChange = (field: keyof ModTechnique, value: any) => setTechnique({ ...technique, [field]: value });
    const handleCostChange = (field: 'type' | 'value', value: any) => handleChange('cost', { ...technique.cost, [field]: value });
    const handleEffectChange = (index: number, field: keyof TechniqueEffect, value: any) => { const newEffects = [...(technique.effects || [])]; const newEffect = { ...newEffects[index], [field]: value }; if (field === 'details' && typeof value === 'string') { try { newEffect.details = JSON.parse(value); } catch (e) { /* ignore */ } } newEffects[index] = newEffect; handleChange('effects', newEffects); };
    const addEffect = () => { const newEffect: TechniqueEffect = { type: 'DAMAGE', details: { "element": "fire", "base": 10 } }; handleChange('effects', [...(technique.effects || []), newEffect]); };
    const removeEffect = (index: number) => handleChange('effects', (technique.effects || []).filter((_, i) => i !== index));
    const handleSaveChanges = () => { if (!technique.name.trim()) return alert("Tên Công Pháp không được để trống."); onSave(technique); };
    return <EditorPanelWrapper title="Editor Công Pháp" onClose={onClose} onSave={handleSaveChanges}><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FieldWrapper label="Tên Công Pháp"><input type="text" value={technique.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: Hỏa Long Thuật" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" /></FieldWrapper><FieldWrapper label="Biểu Tượng (Emoji)"><input type="text" value={technique.icon} onChange={e => handleChange('icon', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" /></FieldWrapper></div><FieldWrapper label="Mô Tả"><textarea value={technique.description} onChange={e => handleChange('description', e.target.value)} rows={2} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" /></FieldWrapper><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FieldWrapper label="Loại"><select value={technique.type} onChange={e => handleChange('type', e.target.value as CultivationTechniqueType)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200">{TECHNIQUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></FieldWrapper><FieldWrapper label="Cấp Bậc"><select value={technique.rank} onChange={e => handleChange('rank', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200">{Object.keys(PHAP_BAO_RANKS).map(r => <option key={r} value={r}>{r}</option>)}</select></FieldWrapper></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><FieldWrapper label="Loại Tiêu Hao"><select value={technique.cost.type} onChange={e => handleCostChange('type', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200">{COST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></FieldWrapper><FieldWrapper label="Giá trị Tiêu Hao"><input type="number" value={technique.cost.value} onChange={e => handleCostChange('value', parseInt(e.target.value) || 0)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" /></FieldWrapper><FieldWrapper label="Hồi Chiêu (lượt)"><input type="number" value={technique.cooldown} onChange={e => handleChange('cooldown', parseInt(e.target.value) || 0)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" /></FieldWrapper></div><FieldWrapper label="Yêu Cầu (Chỉ số)"><StatBonusEditor bonuses={technique.requirements || []} onChange={bonuses => handleChange('requirements', bonuses)} allAttributes={allAttributes} /></FieldWrapper><FieldWrapper label="Hiệu Ứng"><div className="space-y-2 max-h-40 overflow-y-auto pr-2">{(technique.effects || []).map((effect, index) => (<div key={index} className="bg-black/20 p-2 rounded-md border border-gray-700/60"><div className="flex items-center gap-2"><select value={effect.type} onChange={e => handleEffectChange(index, 'type', e.target.value as TechniqueEffectType)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs">{EFFECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select><textarea value={typeof effect.details === 'string' ? effect.details : JSON.stringify(effect.details)} onChange={e => handleEffectChange(index, 'details', e.target.value)} rows={1} placeholder='Chi tiết (JSON), vd: {"base": 10}' className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs font-mono" /><button onClick={() => removeEffect(index)} className="p-1 text-gray-500 hover:text-red-400"><FaTrash size={12}/></button></div></div>))}</div><button onClick={addEffect} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 mt-2"><FaPlus size={10} /> Thêm hiệu ứng</button></FieldWrapper><FieldWrapper label="Tags"><TagEditor tags={technique.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} /></FieldWrapper></EditorPanelWrapper>;
};

// --- Event Editor Panel ---
interface EventEditorPanelProps { onClose: () => void; onSave: (event: AddedContentUnion) => void; eventToEdit: ModEvent & { contentType: 'event' }; allAttributes: string[]; suggestions?: string[]; }
type EditableChoice = Omit<EventChoice, 'id'> & { id: string, outcomes?: EventOutcome[] }; type EditableModEvent = Omit<ModEvent, 'choices'> & { choices: EditableChoice[] }; const OUTCOME_TYPES: EventOutcomeType[] = ['GIVE_ITEM', 'REMOVE_ITEM', 'CHANGE_STAT', 'ADD_RUMOR', 'START_EVENT', 'START_STORY', 'UPDATE_REPUTATION'];
const EventEditorPanel: React.FC<EventEditorPanelProps> = ({ onClose, onSave, eventToEdit, allAttributes, suggestions }) => {
    const [event, setEvent] = useState<EditableModEvent & { contentType: 'event' } | null>(null);
    useEffect(() => { const initialEvent = { ...JSON.parse(JSON.stringify(eventToEdit)), choices: (eventToEdit.choices || []).map((c, i) => ({ ...c, id: `${Date.now()}-${i}`})) }; setEvent(initialEvent); }, [eventToEdit]);
    if (!event) return null;
    const handleChange = (field: keyof ModEvent, value: any) => setEvent({ ...event, [field]: value });
    const handleChoiceChange = <T extends keyof EditableChoice>(choiceId: string, field: T, value: EditableChoice[T]) => { const newChoices = event.choices.map(c => c.id === choiceId ? { ...c, [field]: value } : c); handleChange('choices', newChoices); };
    const handleAddChoice = () => { const newChoices = [...event.choices, { id: Date.now().toString(), text: `Lựa chọn ${event.choices.length + 1}`, check: null, outcomes: [] }]; handleChange('choices', newChoices); };
    const handleRemoveChoice = (choiceId: string) => { const newChoices = event.choices.filter(c => c.id !== choiceId); handleChange('choices', newChoices); };
    const handleOutcomeChange = (choiceId: string, outcomeIndex: number, field: keyof EventOutcome, value: any) => { const newChoices = event.choices.map(c => { if (c.id === choiceId) { const newOutcomes = [...(c.outcomes || [])]; const newOutcome = { ...newOutcomes[outcomeIndex], [field]: value }; if (field === 'details' && typeof value === 'string') { try { newOutcome.details = JSON.parse(value); } catch (e) { /* keep as string */ } } newOutcomes[outcomeIndex] = newOutcome; return { ...c, outcomes: newOutcomes }; } return c; }); handleChange('choices', newChoices); };
    const handleAddOutcome = (choiceId: string) => { const newOutcome: EventOutcome = { type: 'CHANGE_STAT', details: { attribute: 'Chính Đạo', change: 1 } }; const newChoices = event.choices.map(c => c.id === choiceId ? { ...c, outcomes: [...(c.outcomes || []), newOutcome] } : c); handleChange('choices', newChoices); };
    const handleRemoveOutcome = (choiceId: string, outcomeIndex: number) => { const newChoices = event.choices.map(c => { if (c.id === choiceId) { return { ...c, outcomes: (c.outcomes || []).filter((_, i) => i !== outcomeIndex) }; } return c; }); handleChange('choices', newChoices); };
    const handleSaveChanges = () => { if (!event.name.trim()) return alert("Tên Sự Kiện không được để trống."); onSave({ ...event, choices: event.choices.map(({ id, ...rest }) => rest) }); };
    return <EditorPanelWrapper title="Editor Sự Kiện" onClose={onClose} onSave={handleSaveChanges}><FieldWrapper label="Tên Sự Kiện (Định danh)"><input type="text" value={event.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: gap_go_khuong_tu_nha" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" /></FieldWrapper><FieldWrapper label="Mô Tả Tình Huống"><textarea value={event.description} onChange={e => handleChange('description', e.target.value)} rows={3} placeholder="Mô tả bối cảnh và những gì đang xảy ra..." className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" /></FieldWrapper><FieldWrapper label="Tags"><TagEditor tags={event.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} /></FieldWrapper><FieldWrapper label="Các Lựa Chọn"><div className="space-y-3"> {event.choices.map((choice) => (<div key={choice.id} className="bg-black/20 p-3 rounded-lg border border-gray-700/60"><div className="flex justify-between items-center"><input type="text" value={choice.text} onChange={e => handleChoiceChange(choice.id, 'text', e.target.value)} placeholder="Mô tả lựa chọn" className="w-full bg-transparent font-semibold text-gray-300 focus:outline-none" /><button onClick={() => handleRemoveChoice(choice.id)} className="p-1 text-gray-500 hover:text-red-400"><FaTrash /></button></div><div className="pl-4 mt-2"><div className="flex items-center gap-2"><FaDiceD20 className="text-gray-400"/><span className="text-sm text-gray-400">Kiểm tra Thuộc tính:</span>{choice.check ? (<div className="flex items-center gap-2"><select value={choice.check.attribute} onChange={e => handleChoiceChange(choice.id, 'check', { ...choice.check!, attribute: e.target.value })} className="bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300">{allAttributes.map(attr => <option key={attr} value={attr}>{attr}</option>)}</select><input type="number" value={choice.check.difficulty} onChange={e => handleChoiceChange(choice.id, 'check', { ...choice.check!, difficulty: parseInt(e.target.value) || 10 })} className="w-20 bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300" placeholder="DC"/><button onClick={() => handleChoiceChange(choice.id, 'check', null)} className="p-1 text-gray-500 hover:text-white"><FaTimes/></button></div>) : (<button onClick={() => handleChoiceChange(choice.id, 'check', { attribute: allAttributes[0], difficulty: 10 })} className="text-xs text-teal-400 hover:text-teal-300">Thêm</button>)}</div></div><div className="pl-4 mt-2"><h5 className="text-sm text-gray-400 mb-1">Kết quả:</h5><div className="space-y-2">{(choice.outcomes || []).map((outcome, oIndex) => (<div key={oIndex} className="bg-gray-900/50 p-2 rounded-md border border-gray-700/50"><div className="flex items-center gap-2"><select value={outcome.type} onChange={e => handleOutcomeChange(choice.id, oIndex, 'type', e.target.value as EventOutcomeType)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300">{OUTCOME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select><textarea value={typeof outcome.details === 'string' ? outcome.details : JSON.stringify(outcome.details, null, 2)} onChange={e => handleOutcomeChange(choice.id, oIndex, 'details', e.target.value)} rows={2} placeholder="Chi tiết (JSON)" className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 font-mono" /><button onClick={() => handleRemoveOutcome(choice.id, oIndex)} className="p-1 text-gray-500 hover:text-red-400"><FaTrash size={12}/></button></div></div>))} <button onClick={() => handleAddOutcome(choice.id)} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 mt-2"><FaPlus size={10} /> Thêm kết quả</button></div></div></div>))} <button onClick={handleAddChoice} className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-gray-700/80 text-white text-sm font-bold rounded-lg hover:bg-gray-600/80"><FaPlus /> Thêm Lựa Chọn</button></div></FieldWrapper></EditorPanelWrapper>;
};

// --- Recipe Editor Panel ---
interface RecipeEditorPanelProps { onClose: () => void; onSave: (recipe: AddedContentUnion) => void; recipeToEdit: AlchemyRecipe & { contentType: 'recipe' }; }
const ITEM_QUALITIES: ItemQuality[] = ['Phàm Phẩm', 'Linh Phẩm', 'Pháp Phẩm', 'Bảo Phẩm', 'Tiên Phẩm', 'Tuyệt Phẩm'];
const RecipeEditorPanel: React.FC<RecipeEditorPanelProps> = ({ onClose, onSave, recipeToEdit }) => {
    const [recipe, setRecipe] = useState<(AlchemyRecipe & { contentType: 'recipe' }) | null>(null);
    useEffect(() => { setRecipe(JSON.parse(JSON.stringify(recipeToEdit))); }, [recipeToEdit]);
    if (!recipe) return null;
    const handleChange = (field: keyof AlchemyRecipe, value: any) => setRecipe({ ...recipe, [field]: value });
    const handleIngredientChange = (index: number, field: 'name' | 'quantity', value: string | number) => { const newIngredients = [...recipe.ingredients]; newIngredients[index] = { ...newIngredients[index], [field]: value }; handleChange('ingredients', newIngredients); };
    const addIngredient = () => handleChange('ingredients', [...recipe.ingredients, { name: '', quantity: 1 }]);
    const removeIngredient = (index: number) => handleChange('ingredients', recipe.ingredients.filter((_, i) => i !== index));
    const handleSaveChanges = () => { if (!recipe.name.trim()) return alert("Tên Đan Phương không được để trống."); onSave(recipe); };
    return <EditorPanelWrapper title="Editor Đan Phương" onClose={onClose} onSave={handleSaveChanges}><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><FieldWrapper label="Tên Đan Phương"><input type="text" value={recipe.name} onChange={e => handleChange('name', e.target.value)} placeholder="Hồi Khí Đan - Hạ Phẩm" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" /></FieldWrapper><FieldWrapper label="Biểu Tượng (Emoji)"><input type="text" value={recipe.icon} onChange={e => handleChange('icon', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" /></FieldWrapper></div><FieldWrapper label="Mô tả"><textarea value={recipe.description} onChange={e => handleChange('description', e.target.value)} rows={2} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" /></FieldWrapper><FieldWrapper label="Nguyên Liệu"><div className="space-y-2 max-h-40 overflow-y-auto pr-2">{recipe.ingredients.map((ing, index) => (<div key={index} className="flex items-center gap-2"><input type="text" value={ing.name} onChange={e => handleIngredientChange(index, 'name', e.target.value)} placeholder="Tên nguyên liệu" className="w-2/3 bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-sm"/><input type="number" value={ing.quantity} onChange={e => handleIngredientChange(index, 'quantity', parseInt(e.target.value) || 1)} className="w-1/3 bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-sm"/><button onClick={() => removeIngredient(index)} className="p-1 text-gray-500 hover:text-red-400"><FaTrash size={12}/></button></div>))}</div><button onClick={addIngredient} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 mt-2"><FaPlus size={10} /> Thêm nguyên liệu</button></FieldWrapper><FieldWrapper label="Thành Phẩm"><div className="flex items-center gap-2"><input type="text" value={recipe.result.name} onChange={e => handleChange('result', { ...recipe.result, name: e.target.value })} placeholder="Tên thành phẩm" className="w-2/3 bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200"/><input type="number" value={recipe.result.quantity} onChange={e => handleChange('result', { ...recipe.result, quantity: parseInt(e.target.value) || 1 })} className="w-1/3 bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200"/></div></FieldWrapper><FieldWrapper label="Yêu cầu Đan Thuật"><input type="number" value={recipe.requiredAttribute.value} onChange={e => handleChange('requiredAttribute', { ...recipe.requiredAttribute, value: parseInt(e.target.value) || 10 })} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200"/></FieldWrapper></EditorPanelWrapper>;
};

export default CreateModScreen;