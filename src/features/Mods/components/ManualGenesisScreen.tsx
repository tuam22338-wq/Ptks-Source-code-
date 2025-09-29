import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaBrain, FaPlus, FaTrash, FaEdit, FaDownload, FaBolt } from 'react-icons/fa';
import { generateWorldFromPrompts } from '../../../services/geminiService';
// FIX: Add QuickActionButtonConfig to type imports
import type { FullMod, ModInfo, ModAttributeSystem, NamedRealmSystem, QuickActionBarConfig, QuickActionButtonConfig, Faction, ModLocation, ModNpc, AttributeDefinition, AttributeGroupDefinition, RealmConfig, MajorEvent, ModForeshadowedEvent, ModTagDefinition } from '../../../types';
import LoadingScreen from '../../../components/LoadingScreen';
import { DEFAULT_ATTRIBUTE_DEFINITIONS, DEFAULT_ATTRIBUTE_GROUPS, REALM_SYSTEM, UI_ICONS, DEFAULT_BUTTONS, ATTRIBUTE_TEMPLATES } from '../../../constants';
import AttributeEditorModal from './AttributeEditorModal';
import RealmEditorModal from './RealmEditorModal';
import QuickActionButtonEditorModal from './QuickActionButtonEditorModal';
import AccordionSection from './AccordionSection';
import FactionEditorModal from './FactionEditorModal';
import LocationEditorModal from './LocationEditorModal';
import NpcEditorModal from './NpcEditorModal';
import { useAppContext } from '../../../contexts/AppContext';
import MajorEventEditorModal from './MajorEventEditorModal';
import ForeshadowedEventEditorModal from './ForeshadowedEventEditorModal';
import TagDefinitionEditorModal from './TagDefinitionEditorModal';

interface ManualGenesisScreenProps {
    onBack: () => void;
    onInstall: (mod: FullMod) => Promise<boolean>;
}

const Field: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div>
        <label className="block text-lg font-semibold font-title text-gray-300">{label}</label>
        <p className="text-sm text-gray-500 mb-2">{description}</p>
        {children}
    </div>
);

const TemplateSelectionModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (system: ModAttributeSystem) => void;
}> = ({ isOpen, onClose, onSelect }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl m-4 h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold p-4 border-b border-gray-700 text-amber-300">Chọn một Mẫu Hệ Thống Thuộc Tính</h3>
                <div className="p-4 overflow-y-auto space-y-3">
                    {ATTRIBUTE_TEMPLATES.map(template => (
                        <button
                            key={template.id}
                            onClick={() => onSelect(template.system)}
                            className="w-full text-left p-4 bg-black/20 rounded-lg border border-gray-700/60 hover:bg-gray-800/50 hover:border-cyan-400/50 transition-colors"
                        >
                            <h4 className="font-bold text-lg text-cyan-300">{template.name}</h4>
                            <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-gray-700 mt-auto">
                    <button onClick={onClose} className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Đóng</button>
                </div>
            </div>
        </div>
    );
};

const ManualGenesisScreen: React.FC<ManualGenesisScreenProps> = ({ onBack, onInstall }) => {
    const { state } = useAppContext();
    const initialModData = state.modBeingEdited;

    // State for all form fields
    const [modInfo, setModInfo] = useState({ name: '', id: '', author: '', tags: '' });
    const [prompts, setPrompts] = useState({ setting: '', mainGoal: '', openingStory: '' });
    const [aiHooks, setAiHooks] = useState({ on_world_build: '', on_action_evaluate: '' });
    const [attributeSystem, setAttributeSystem] = useState<ModAttributeSystem>({
        definitions: DEFAULT_ATTRIBUTE_DEFINITIONS,
        groups: DEFAULT_ATTRIBUTE_GROUPS,
    });
    const [namedRealmSystems, setNamedRealmSystems] = useState<NamedRealmSystem[]>([{
        id: 'main_system',
        name: 'Hệ Thống Tu Luyện Chính',
        description: 'Hệ thống tu luyện mặc định.',
        resourceName: 'Linh Khí',
        resourceUnit: 'điểm',
        realms: REALM_SYSTEM,
    }]);
    const [quickActionBars, setQuickActionBars] = useState<QuickActionBarConfig[]>([{
        id: 'default_bar',
        context: { type: 'DEFAULT', value: [] },
        buttons: DEFAULT_BUTTONS,
    }]);
    const [factions, setFactions] = useState<Faction[]>([]);
    const [locations, setLocations] = useState<ModLocation[]>([]);
    const [npcs, setNpcs] = useState<ModNpc[]>([]);
    const [majorEvents, setMajorEvents] = useState<MajorEvent[]>([]);
    const [foreshadowedEvents, setForeshadowedEvents] = useState<ModForeshadowedEvent[]>([]);
    const [tagDefinitions, setTagDefinitions] = useState<ModTagDefinition[]>([]);
    
    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        basicInfo: true,
        aiPrompts: true,
        manualDb: false,
        events: false,
        tagDefinitions: false,
        systems: false,
    });
    const [isFactionModalOpen, setFactionModalOpen] = useState(false);
    const [editingFaction, setEditingFaction] = useState<Faction | null>(null);
    const [isLocationModalOpen, setLocationModalOpen] = useState(false);
    const [editingLocation, setEditingLocation] = useState<ModLocation | null>(null);
    const [isNpcModalOpen, setNpcModalOpen] = useState(false);
    const [editingNpc, setEditingNpc] = useState<ModNpc | null>(null);
    const [isAttributeModalOpen, setAttributeModalOpen] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState<{ attribute: AttributeDefinition | null, group: AttributeGroupDefinition } | null>(null);
    const [isRealmModalOpen, setRealmModalOpen] = useState(false);
    const [isQuickActionModalOpen, setQuickActionModalOpen] = useState(false);
    const [editingQuickAction, setEditingQuickAction] = useState<QuickActionButtonConfig | null>(null);
    const [isMajorEventModalOpen, setMajorEventModalOpen] = useState(false);
    const [editingMajorEvent, setEditingMajorEvent] = useState<MajorEvent | null>(null);
    const [isForeshadowedEventModalOpen, setForeshadowedEventModalOpen] = useState(false);
    const [editingForeshadowedEvent, setEditingForeshadowedEvent] = useState<ModForeshadowedEvent | null>(null);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [isTagDefModalOpen, setTagDefModalOpen] = useState(false);
    const [editingTagDef, setEditingTagDef] = useState<ModTagDefinition | null>(null);


     useEffect(() => {
        if (initialModData) {
            const worldData = initialModData.content.worldData?.[0];
            setModInfo({
                name: initialModData.modInfo.name,
                id: initialModData.modInfo.id,
                author: initialModData.modInfo.author || '',
                tags: initialModData.modInfo.tags?.join(', ') || '',
            });
            // When editing, AI prompts are not directly available, they are inferred.
            setPrompts({
                setting: worldData?.description || '',
                mainGoal: '',
                openingStory: ''
            });

            const loadedHooks = initialModData.content.aiHooks;
            setAiHooks({
                on_world_build: loadedHooks?.on_world_build?.join('\n') || '',
                on_action_evaluate: loadedHooks?.on_action_evaluate?.join('\n') || '',
            });

            setAttributeSystem(initialModData.content.attributeSystem || { definitions: DEFAULT_ATTRIBUTE_DEFINITIONS, groups: DEFAULT_ATTRIBUTE_GROUPS });
            setNamedRealmSystems(initialModData.content.namedRealmSystems || []);
            setQuickActionBars(initialModData.content.quickActionBars || []);
            setTagDefinitions(initialModData.content.tagDefinitions || []);
            setFactions(worldData?.factions || []);
            setMajorEvents(worldData?.majorEvents || []);
            setForeshadowedEvents(worldData?.foreshadowedEvents || []);
            
            const initialLocationsData = worldData?.initialLocations || [];
            const sanitizedLocations = initialLocationsData.map((loc): ModLocation => ({
                ...loc,
                id: loc.id || (loc.name || `loc_${Date.now()}`).toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, ''),
                tags: (loc as any).tags || [],
            }));
            setLocations(sanitizedLocations as ModLocation[]);
            
            const initialNpcsData = worldData?.initialNpcs || [];
            const sanitizedNpcs = initialNpcsData.map((npc): ModNpc => ({
                ...npc,
                id: npc.id || (npc.name || `npc_${Date.now()}`).toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, ''),
                tags: (npc as any).tags || [],
            }));
            setNpcs(sanitizedNpcs as ModNpc[]);
            
            // Auto-expand sections that have data
            setOpenSections({
                basicInfo: true,
                aiPrompts: true,
                manualDb: (factions.length > 0 || locations.length > 0 || npcs.length > 0),
                events: (majorEvents.length > 0 || foreshadowedEvents.length > 0),
                tagDefinitions: (tagDefinitions.length > 0),
                systems: true,
            });
        }
    }, [initialModData]);

    const handleToggleSection = (sectionId: string) => {
        setOpenSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const handleGenerateWorld = async (install: boolean) => {
        if (!modInfo.name.trim() || !modInfo.id.trim() || !prompts.setting.trim()) {
            setError("Tên Mod, ID Mod, và Bối Cảnh là bắt buộc.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const generatedMod = await generateWorldFromPrompts({
                modInfo: {
                    name: modInfo.name,
                    id: modInfo.id,
                    author: modInfo.author,
                    tags: modInfo.tags.split(',').map(t => t.trim()).filter(Boolean),
                },
                prompts, factions, locations, npcs, majorEvents, foreshadowedEvents,
                attributeSystem, namedRealmSystems, quickActionBars, aiHooks, tagDefinitions
            });

            if (install) {
                const success = await onInstall(generatedMod);
                if (success) {
                    // Message is handled inside the onInstall function
                    onBack();
                }
            } else {
                 const jsonString = JSON.stringify(generatedMod, null, 2);
                 const blob = new Blob([jsonString], { type: 'application/json' });
                 const url = URL.createObjectURL(blob);
                 const link = document.createElement('a');
                 link.href = url;
                 link.download = `${generatedMod.modInfo.id}.json`;
                 document.body.appendChild(link);
                 link.click();
                 document.body.removeChild(link);
                 URL.revokeObjectURL(url);
                 alert(`Thế giới "${generatedMod.modInfo.name}" đã được tạo và xuất file thành công!`);
            }
        } catch (e: any) {
            setError(`Lỗi khi tạo thế giới: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    // Data Handlers
    const handleSaveFaction = (faction: Faction) => {
        const index = factions.findIndex(f => f.name === (editingFaction?.name || ''));
        if (index > -1) setFactions(factions.map((f, i) => i === index ? faction : f));
        else setFactions([...factions, faction]);
        setFactionModalOpen(false); setEditingFaction(null);
    };
    const handleDeleteFaction = (name: string) => setFactions(factions.filter(f => f.name !== name));

    const handleSaveLocation = (location: ModLocation) => {
        const index = locations.findIndex(l => l.id === editingLocation?.id);
        if (index > -1) setLocations(locations.map((l, i) => (i === index ? location : l)));
        else setLocations([...locations, { ...location, id: `loc_${Date.now()}` }]);
        setLocationModalOpen(false); setEditingLocation(null);
    };
    const handleDeleteLocation = (id: string) => setLocations(locations.filter(l => l.id !== id));

    const handleSaveNpc = (npc: ModNpc) => {
        const index = npcs.findIndex(n => n.id === editingNpc?.id);
        if (index > -1) setNpcs(npcs.map((n, i) => (i === index ? npc : n)));
        else setNpcs([...npcs, { ...npc, id: `npc_${Date.now()}` }]);
        setNpcModalOpen(false); setEditingNpc(null);
    };
    const handleDeleteNpc = (id: string) => setNpcs(npcs.filter(n => n.id !== id));
    
    const handleSaveMajorEvent = (event: MajorEvent) => {
        const index = majorEvents.findIndex(e => e.title === editingMajorEvent?.title);
        if (index > -1) setMajorEvents(majorEvents.map((e, i) => i === index ? event : e));
        else setMajorEvents([...majorEvents, event]);
        setMajorEventModalOpen(false); setEditingMajorEvent(null);
    };
    const handleDeleteMajorEvent = (title: string) => setMajorEvents(majorEvents.filter(e => e.title !== title));

    const handleSaveForeshadowedEvent = (event: ModForeshadowedEvent) => {
        const index = foreshadowedEvents.findIndex(e => e.title === editingForeshadowedEvent?.title);
        if (index > -1) setForeshadowedEvents(foreshadowedEvents.map((e, i) => i === index ? event : e));
        else setForeshadowedEvents([...foreshadowedEvents, event]);
        setForeshadowedEventModalOpen(false); setEditingForeshadowedEvent(null);
    };
    const handleDeleteForeshadowedEvent = (title: string) => setForeshadowedEvents(foreshadowedEvents.filter(e => e.title !== title));
    
    const handleSaveTagDef = (tagDef: ModTagDefinition) => {
        const index = tagDefinitions.findIndex(t => t.id === (editingTagDef?.id || ''));
        if (index > -1) {
            setTagDefinitions(tagDefinitions.map((t, i) => i === index ? tagDef : t));
        } else {
            setTagDefinitions([...tagDefinitions, tagDef]);
        }
        setTagDefModalOpen(false);
        setEditingTagDef(null);
    };

    const handleDeleteTagDef = (id: string) => {
        setTagDefinitions(tagDefinitions.filter(t => t.id !== id));
    };


    // Systems Handlers
    const handleSaveAttribute = (attribute: AttributeDefinition) => {
        setAttributeSystem(prev => {
            const newDefs = [...prev.definitions];
            const index = newDefs.findIndex(d => d.id === attribute.id);
            if (index > -1) newDefs[index] = attribute; else newDefs.push(attribute);
            return { ...prev, definitions: newDefs };
        });
        setAttributeModalOpen(false); setEditingAttribute(null);
    };
    
    const handleSaveRealms = (updatedSystems: NamedRealmSystem[]) => {
        setNamedRealmSystems(updatedSystems);
        setRealmModalOpen(false);
    };
    
    const handleSaveQuickAction = (button: QuickActionButtonConfig) => {
        setQuickActionBars(prevBars => {
            const newBars = JSON.parse(JSON.stringify(prevBars));
            if (newBars.length === 0) newBars.push({ id: 'default_bar', context: { type: 'DEFAULT', value: [] }, buttons: [] });
            const defaultBar = newBars[0];
            const buttonIndex = defaultBar.buttons.findIndex((b: QuickActionButtonConfig) => b.id === button.id);
            if (buttonIndex > -1) defaultBar.buttons[buttonIndex] = button;
            else defaultBar.buttons.push(button);
            return newBars;
        });
        setQuickActionModalOpen(false); setEditingQuickAction(null);
    };

    const handleSelectTemplate = (system: ModAttributeSystem) => {
        setAttributeSystem(system);
        setIsTemplateModalOpen(false);
    };

    if (isLoading) return <LoadingScreen message="AI đang dệt nên thế giới của bạn..." isGeneratingWorld={true} />;

    return (
        <div className="flex-grow flex flex-col min-h-0 animate-fade-in">
             {/* Modals */}
             <FactionEditorModal isOpen={isFactionModalOpen} onClose={() => setFactionModalOpen(false)} onSave={handleSaveFaction} faction={editingFaction} />
             <LocationEditorModal isOpen={isLocationModalOpen} onClose={() => setLocationModalOpen(false)} onSave={handleSaveLocation} location={editingLocation} />
             <NpcEditorModal isOpen={isNpcModalOpen} onClose={() => setNpcModalOpen(false)} onSave={handleSaveNpc} npc={editingNpc} />
             {editingAttribute && <AttributeEditorModal isOpen={isAttributeModalOpen} onClose={() => setAttributeModalOpen(false)} onSave={handleSaveAttribute} attribute={editingAttribute.attribute} group={editingAttribute.group} />}
             <RealmEditorModal isOpen={isRealmModalOpen} onClose={() => setRealmModalOpen(false)} onSave={handleSaveRealms} initialSystems={namedRealmSystems} attributeSystem={attributeSystem} />
             <QuickActionButtonEditorModal isOpen={isQuickActionModalOpen} onClose={() => setQuickActionModalOpen(false)} onSave={handleSaveQuickAction} button={editingQuickAction} />
             <MajorEventEditorModal isOpen={isMajorEventModalOpen} onClose={() => setMajorEventModalOpen(false)} onSave={handleSaveMajorEvent} event={editingMajorEvent} />
             <ForeshadowedEventEditorModal isOpen={isForeshadowedEventModalOpen} onClose={() => setForeshadowedEventModalOpen(false)} onSave={handleSaveForeshadowedEvent} event={editingForeshadowedEvent} />
             <TemplateSelectionModal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} onSelect={handleSelectTemplate} />
             <TagDefinitionEditorModal isOpen={isTagDefModalOpen} onClose={() => setTagDefModalOpen(false)} onSave={handleSaveTagDef} tagDef={editingTagDef} />


            <div className="flex-shrink-0 mb-4">
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4"><FaArrowLeft /> Quay Lại Menu</button>
            </div>
            <div className="flex-grow flex flex-col items-center">
                 <h3 className="text-4xl font-bold font-title text-amber-300">{initialModData ? 'Giám Sát Thiên Cơ' : 'Công Cụ Sáng Thế'}</h3>
                <p className="text-gray-400 max-w-3xl mx-auto mt-2 mb-6 text-center">
                    {initialModData ? 'Xem lại và tinh chỉnh thế giới do AI tạo ra. Bạn có toàn quyền quyết định cuối cùng.' : 'Tự tay thiết kế các nền tảng, sau đó cung cấp ý tưởng cốt lõi để AI kiến tạo nên một vũ trụ chi tiết cho bạn.'}
                </p>
                {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30 mb-4 w-full max-w-4xl">{error}</p>}
                
                <div className="w-full max-w-4xl space-y-4 overflow-y-auto pr-2 pb-4">
                    <AccordionSection title="1. Thông Tin Cơ Bản (Bắt buộc)" isOpen={openSections.basicInfo} onToggle={() => handleToggleSection('basicInfo')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Tên Mod</label>
                                <input name="name" value={modInfo.name} onChange={e => setModInfo(p => ({...p, name: e.target.value}))} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" placeholder="Vd: Thế Giới Cyber-Tu Chân"/>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">ID Mod (không dấu, không cách)</label>
                                <input name="id" value={modInfo.id} onChange={e => setModInfo(p => ({...p, id: e.target.value.toLowerCase().replace(/\s+/g, '_')}))} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" placeholder="vd: cyber_tu_chan" disabled={!!initialModData}/>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Tác Giả</label>
                                <input name="author" value={modInfo.author} onChange={e => setModInfo(p => ({...p, author: e.target.value}))} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" placeholder="Tên của bạn"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Thể Loại (Tags)</label>
                                <input name="tags" value={modInfo.tags} onChange={e => setModInfo(p => ({...p, tags: e.target.value}))} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" placeholder="Huyền Huyễn, Hắc Ám, Sinh Tồn..."/>
                            </div>
                        </div>
                    </AccordionSection>

                     <AccordionSection title="2. Gợi Ý Cho AI (Bắt buộc)" isOpen={openSections.aiPrompts} onToggle={() => handleToggleSection('aiPrompts')}>
                         <Field label="Bối Cảnh (Setting)" description="Mô tả tổng quan về thế giới, môi trường, không khí, và các đặc điểm chính.">
                            <textarea name="setting" value={prompts.setting} onChange={e => setPrompts(p => ({...p, setting: e.target.value}))} rows={3} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 resize-y" placeholder="Vd: Một vương quốc tu tiên lơ lửng trên những hòn đảo bay..."/>
                        </Field>
                    </AccordionSection>

                    <AccordionSection title="3. Thiết Kế Thế Giới (Thủ công)" secondaryText="Tạo nền tảng cho AI" isOpen={openSections.manualDb} onToggle={() => handleToggleSection('manualDb')}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Factions */}
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-300">Phe phái</h4>
                                {factions.map((faction, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-black/30 rounded">
                                        <span className="text-sm font-semibold truncate" title={faction.name}>{faction.name}</span>
                                        <div className='flex gap-2'>
                                            <button onClick={() => { setEditingFaction(faction); setFactionModalOpen(true); }}><FaEdit/></button>
                                            <button onClick={() => handleDeleteFaction(faction.name)}><FaTrash/></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => {setEditingFaction(null); setFactionModalOpen(true);}} className="w-full text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded"><FaPlus/> Thêm Phe phái</button>
                            </div>
                            {/* Locations */}
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-300">Địa điểm</h4>
                                {locations.map((loc, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-black/30 rounded">
                                        <span className="text-sm font-semibold truncate" title={loc.name}>{loc.name}</span>
                                        <div className='flex gap-2'>
                                            <button onClick={() => { setEditingLocation(loc); setLocationModalOpen(true); }}><FaEdit/></button>
                                            <button onClick={() => handleDeleteLocation(loc.id)}><FaTrash/></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => {setEditingLocation(null); setLocationModalOpen(true);}} className="w-full text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded"><FaPlus/> Thêm Địa điểm</button>
                            </div>
                            {/* NPCs */}
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-300">Nhân vật</h4>
                                {npcs.map((npc, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-black/30 rounded">
                                        <span className="text-sm font-semibold truncate" title={npc.name}>{npc.name}</span>
                                        <div className='flex gap-2'>
                                            <button onClick={() => { setEditingNpc(npc); setNpcModalOpen(true); }}><FaEdit/></button>
                                            <button onClick={() => handleDeleteNpc(npc.id)}><FaTrash/></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => {setEditingNpc(null); setNpcModalOpen(true);}} className="w-full text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded"><FaPlus/> Thêm Nhân vật</button>
                            </div>
                        </div>
                    </AccordionSection>
                    
                    <AccordionSection title="4. Dòng Thời Gian & Sự Kiện" secondaryText="Xây dựng lịch sử và tương lai" isOpen={openSections.events} onToggle={() => handleToggleSection('events')}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Major Events */}
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-300">Thiên Mệnh Bất Biến (Sự kiện Lớn)</h4>
                                {majorEvents.map((event, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-black/30 rounded">
                                        <span className="text-sm font-semibold truncate" title={event.title}>{event.title} (Năm {event.year})</span>
                                        <div className='flex gap-2'><button onClick={() => { setEditingMajorEvent(event); setMajorEventModalOpen(true); }}><FaEdit/></button><button onClick={() => handleDeleteMajorEvent(event.title)}><FaTrash/></button></div>
                                    </div>
                                ))}
                                <button onClick={() => {setEditingMajorEvent(null); setMajorEventModalOpen(true);}} className="w-full text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded"><FaPlus/> Thêm Sự Kiện Lớn</button>
                            </div>
                             {/* Foreshadowed Events */}
                            <div className="space-y-2">
                                <h4 className="font-semibold text-gray-300">Nhân Quả Tương Lai (Sự kiện có thể thay đổi)</h4>
                                {foreshadowedEvents.map((event, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 bg-black/30 rounded">
                                        <span className="text-sm font-semibold truncate" title={event.title}>{event.title} (~{event.relativeTriggerDay} ngày)</span>
                                        <div className='flex gap-2'><button onClick={() => { setEditingForeshadowedEvent(event); setForeshadowedEventModalOpen(true); }}><FaEdit/></button><button onClick={() => handleDeleteForeshadowedEvent(event.title)}><FaTrash/></button></div>
                                    </div>
                                ))}
                                <button onClick={() => {setEditingForeshadowedEvent(null); setForeshadowedEventModalOpen(true);}} className="w-full text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded"><FaPlus/> Thêm Sự Kiện Tương Lai</button>
                            </div>
                        </div>
                    </AccordionSection>

                    <AccordionSection title="5. Định Nghĩa Thể Loại (Tùy chọn)" secondaryText="Tạo thể loại riêng cho mod của bạn" isOpen={openSections.tagDefinitions} onToggle={() => handleToggleSection('tagDefinitions')}>
                        <div className="space-y-2">
                            {tagDefinitions.map((def, index) => (
                                <div key={index} className="flex justify-between items-center p-2 bg-black/30 rounded">
                                    <div className="truncate">
                                        <p className="text-sm font-semibold" title={def.name}>{def.name} ({def.id})</p>
                                        <p className="text-xs text-gray-400 truncate" title={def.description}>{def.description}</p>
                                    </div>
                                    <div className='flex gap-2'>
                                        <button onClick={() => { setEditingTagDef(def); setTagDefModalOpen(true); }}><FaEdit/></button>
                                        <button onClick={() => handleDeleteTagDef(def.id)}><FaTrash/></button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => {setEditingTagDef(null); setTagDefModalOpen(true);}} className="w-full text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded"><FaPlus/> Thêm Định Nghĩa</button>
                        </div>
                    </AccordionSection>
                    
                     <AccordionSection title="6. Quy Luật & Hệ Thống (Nâng cao)" secondaryText="Tùy chỉnh sâu cơ chế game" isOpen={openSections.systems} onToggle={() => handleToggleSection('systems')}>
                        <div className="space-y-6">
                            {/* AI Hooks */}
                            <div className="space-y-4">
                                <Field label="Luật Lệ Vĩnh Cửu (on_world_build)" description="Các quy tắc cốt lõi, không thay đổi của thế giới mà AI phải luôn tuân theo. Mỗi quy tắc viết trên một dòng.">
                                    <textarea name="on_world_build" value={aiHooks.on_world_build} onChange={e => setAiHooks(p => ({...p, on_world_build: e.target.value}))} rows={3} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 resize-y font-mono text-sm" placeholder="Vd: Trong thế giới này, yêu tộc và nhân tộc có mối thù truyền kiếp."/>
                                </Field>
                                <Field label="Luật Lệ Tình Huống (on_action_evaluate)" description="Các quy tắc được AI xem xét và áp dụng cho kết quả của mỗi hành động người chơi. Mỗi quy tắc viết trên một dòng.">
                                    <textarea name="on_action_evaluate" value={aiHooks.on_action_evaluate} onChange={e => setAiHooks(p => ({...p, on_action_evaluate: e.target.value}))} rows={3} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 resize-y font-mono text-sm" placeholder="Vd: Nếu người chơi ở nơi có âm khí nồng đậm, tốc độ tu luyện ma công tăng gấp đôi."/>
                                </Field>
                            </div>

                            {/* Attribute System */}
                            <div>
                                <h4 className="font-semibold text-gray-300 mb-2">Hệ Thống Thuộc Tính</h4>
                                <button onClick={() => setIsTemplateModalOpen(true)} className="w-full text-center p-2 mb-3 bg-blue-900/30 rounded border border-blue-500/30 text-blue-300 hover:bg-blue-900/50">
                                    Tải Mẫu Hệ Thống Thuộc Tính...
                                </button>
                                <div className="space-y-3">
                                    {attributeSystem.groups.map(group => (
                                        <div key={group.id} className="p-2 bg-black/30 rounded">
                                            <h5 className="font-bold text-sm text-amber-300">{group.name}</h5>
                                            <div className="pl-2 space-y-1 mt-1">
                                                {attributeSystem.definitions.filter(d => d.group === group.id).map(attr => (
                                                    <div key={attr.id} className="flex justify-between items-center text-sm">
                                                        <span>{attr.name} <span className="text-gray-500 text-xs">({attr.type})</span></span>
                                                        <button onClick={() => { setEditingAttribute({ attribute: attr, group }); setAttributeModalOpen(true); }} className="p-1 hover:text-white"><FaEdit /></button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={() => { setEditingAttribute({ attribute: null, group }); setAttributeModalOpen(true); }} className="w-full text-xs text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-1 p-1 bg-cyan-900/30 rounded mt-2"><FaPlus/> Thêm thuộc tính</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Realm System */}
                            <div>
                                <h4 className="font-semibold text-gray-300 mb-2">Hệ Thống Cảnh Giới</h4>
                                <button onClick={() => setRealmModalOpen(true)} className="w-full text-center p-3 bg-black/30 rounded-lg border border-gray-700 hover:bg-gray-800/50">
                                    Chỉnh Sửa Hệ Thống Cảnh Giới Chính
                                </button>
                            </div>

                            {/* Quick Action Buttons */}
                            <div>
                                <h4 className="font-semibold text-gray-300 mb-2">Hành Động Nhanh Mặc Định</h4>
                                <div className="space-y-2">
                                    {(quickActionBars[0]?.buttons || []).map(button => {
                                        const Icon = UI_ICONS[button.iconName] || FaBolt;
                                        return (
                                            <div key={button.id} className="flex justify-between items-center p-2 bg-black/30 rounded">
                                                <span className="flex items-center gap-2 text-sm"><Icon /> {button.label}</span>
                                                <div className="flex gap-2">
                                                    <button onClick={() => { setEditingQuickAction(button); setQuickActionModalOpen(true); }}><FaEdit/></button>
                                                    <button onClick={() => {
                                                        setQuickActionBars(prev => {
                                                            const newBars = [...prev];
                                                            if(newBars[0]) {
                                                                newBars[0].buttons = newBars[0].buttons.filter(b => b.id !== button.id);
                                                            }
                                                            return newBars;
                                                        });
                                                    }}><FaTrash/></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <button onClick={() => { setEditingQuickAction(null); setQuickActionModalOpen(true); }} className="w-full mt-2 text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded"><FaPlus/> Thêm Nút Hành Động</button>
                            </div>
                        </div>
                    </AccordionSection>
                </div>
                <div className="pt-4 mt-auto flex-shrink-0 flex flex-col sm:flex-row justify-center items-center gap-4">
                     <button onClick={() => handleGenerateWorld(false)} disabled={isLoading || (!initialModData && (!prompts.setting.trim() || !modInfo.name.trim() || !modInfo.id.trim()))} className="w-full sm:w-auto px-6 py-3 text-lg font-bold rounded-lg bg-[var(--bg-interactive)] text-[var(--text-color)] border border-[var(--border-subtle)] font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--bg-interactive-hover)] hover:-translate-y-0.5 shadow-md shadow-black/30 disabled:opacity-50">
                        <FaDownload className="inline-block mr-2"/>
                        {initialModData ? 'Lưu & Xuất File' : 'Tạo & Xuất File'}
                    </button>
                    <button onClick={() => handleGenerateWorld(true)} disabled={isLoading || (!initialModData && (!prompts.setting.trim() || !modInfo.name.trim() || !modInfo.id.trim()))} className="w-full sm:w-auto px-8 py-4 text-xl font-bold rounded-lg bg-[var(--button-primary-bg)] text-[var(--primary-accent-text-color)] border border-[var(--button-primary-border)] font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--button-primary-hover-bg)] hover:-translate-y-0.5 shadow-md shadow-black/30 disabled:opacity-50">
                        <FaBrain className="inline-block mr-3"/>
                        {initialModData ? 'Lưu & Cài Đặt' : 'Kiến Tạo & Cài Đặt'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualGenesisScreen;