import React, { useState, useEffect } from 'react';
import { FaArrowLeft, FaBrain, FaPlus, FaTrash, FaEdit, FaDownload } from 'react-icons/fa';
import { generateWorldFromPrompts } from '../../../services/geminiService';
// FIX: Add QuickActionButtonConfig to type imports
import type { FullMod, ModInfo, ModAttributeSystem, NamedRealmSystem, QuickActionBarConfig, QuickActionButtonConfig, Faction, ModLocation, ModNpc, AttributeDefinition, AttributeGroupDefinition, RealmConfig } from '../../../types';
import LoadingScreen from '../../../components/LoadingScreen';
import { DEFAULT_ATTRIBUTE_DEFINITIONS, DEFAULT_ATTRIBUTE_GROUPS, REALM_SYSTEM, UI_ICONS, DEFAULT_BUTTONS } from '../../../constants';
import AttributeEditorModal from './AttributeEditorModal';
import RealmEditorModal from './RealmEditorModal';
import QuickActionButtonEditorModal from './QuickActionButtonEditorModal';
import AccordionSection from './AccordionSection';
import FactionEditorModal from './FactionEditorModal';
import LocationEditorModal from './LocationEditorModal';
import NpcEditorModal from './NpcEditorModal';

interface ManualGenesisScreenProps {
    onBack: () => void;
    onInstall: (mod: FullMod) => Promise<boolean>;
    initialModData?: FullMod | null;
}

const Field: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div>
        <label className="block text-lg font-semibold font-title text-gray-300">{label}</label>
        <p className="text-sm text-gray-500 mb-2">{description}</p>
        {children}
    </div>
);

const ManualGenesisScreen: React.FC<ManualGenesisScreenProps> = ({ onBack, onInstall, initialModData }) => {
    // State for all form fields
    const [modInfo, setModInfo] = useState({ name: '', id: '', author: '' });
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
    
    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        basicInfo: true,
        aiPrompts: true,
        manualDb: false,
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


     useEffect(() => {
        if (initialModData) {
            setModInfo({
                name: initialModData.modInfo.name,
                id: initialModData.modInfo.id,
                author: initialModData.modInfo.author || '',
            });
            setFactions(initialModData.content.worldData?.[0]?.factions || []);
            const initialLocationsData = initialModData.content.worldData?.[0]?.initialLocations || [];
            const sanitizedLocations = initialLocationsData.map((loc): ModLocation => ({
                ...loc,
                id: loc.id || (loc.name || `loc_${Date.now()}`).toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, ''),
                tags: loc.tags || [],
            })) as ModLocation[];
            setLocations(sanitizedLocations);
            const initialNpcsData = initialModData.content.worldData?.[0]?.initialNpcs || [];
            const sanitizedNpcs = initialNpcsData.map((npc): ModNpc => ({
                ...npc,
                id: npc.id || (npc.name || `npc_${Date.now()}`).toLowerCase().replace(/\s+/g, '_').replace(/[^\w-]/g, ''),
                tags: npc.tags || [],
            })) as ModNpc[];
            setNpcs(sanitizedNpcs);
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
                modInfo, prompts, factions, locations, npcs,
                attributeSystem, namedRealmSystems, quickActionBars, aiHooks
            });

            if (install) {
                const success = await onInstall(generatedMod);
                if (success) {
                    alert(`Thế giới "${generatedMod.modInfo.name}" đã được tạo và cài đặt thành công!`);
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
    
    // Faction Handlers
    const handleSaveFaction = (faction: Faction) => {
        const index = factions.findIndex(f => f.name === (editingFaction?.name || ''));
        if (index > -1) {
            setFactions(factions.map((f, i) => i === index ? faction : f));
        } else {
            setFactions([...factions, faction]);
        }
        setFactionModalOpen(false);
        setEditingFaction(null);
    };
    const handleDeleteFaction = (name: string) => setFactions(factions.filter(f => f.name !== name));

    // Location Handlers
    const handleSaveLocation = (location: ModLocation) => {
        const index = locations.findIndex(l => l.id === editingLocation?.id);
        if (index > -1) {
            setLocations(locations.map((l, i) => (i === index ? location : l)));
        } else {
            setLocations([...locations, { ...location, id: `loc_${Date.now()}` }]);
        }
        setLocationModalOpen(false);
        setEditingLocation(null);
    };
    const handleDeleteLocation = (id: string) => setLocations(locations.filter(l => l.id !== id));

    // NPC Handlers
    const handleSaveNpc = (npc: ModNpc) => {
        const index = npcs.findIndex(n => n.id === editingNpc?.id);
        if (index > -1) {
            setNpcs(npcs.map((n, i) => (i === index ? npc : n)));
        } else {
            setNpcs([...npcs, { ...npc, id: `npc_${Date.now()}` }]);
        }
        setNpcModalOpen(false);
        setEditingNpc(null);
    };
    const handleDeleteNpc = (id: string) => setNpcs(npcs.filter(n => n.id !== id));

    // --- Systems Handlers ---
    const handleSaveAttribute = (attribute: AttributeDefinition) => {
        setAttributeSystem(prev => {
            const newDefs = [...prev.definitions];
            const index = newDefs.findIndex(d => d.id === attribute.id);
            if (index > -1) {
                newDefs[index] = attribute;
            } else {
                newDefs.push(attribute);
            }
            return { ...prev, definitions: newDefs };
        });
        setAttributeModalOpen(false);
        setEditingAttribute(null);
    };
    
    const handleSaveRealms = (updatedRealms: RealmConfig[]) => {
        setNamedRealmSystems(prev => {
            const newSystems = [...prev];
            if (newSystems.length > 0) {
                newSystems[0].realms = updatedRealms;
            } else {
                newSystems.push({
                    id: 'main_system', name: 'Hệ Thống Tu Luyện Chính',
                    description: 'Hệ thống tu luyện được tạo.', realms: updatedRealms
                });
            }
            return newSystems;
        });
        setRealmModalOpen(false);
    };
    
    const handleSaveQuickAction = (button: QuickActionButtonConfig) => {
        setQuickActionBars(prevBars => {
            const newBars = JSON.parse(JSON.stringify(prevBars));
            if (newBars.length === 0) {
                newBars.push({ id: 'default_bar', context: { type: 'DEFAULT', value: [] }, buttons: [] });
            }
            const defaultBar = newBars[0];
            const buttonIndex = defaultBar.buttons.findIndex((b: QuickActionButtonConfig) => b.id === button.id);
            if (buttonIndex > -1) {
                defaultBar.buttons[buttonIndex] = button;
            } else {
                defaultBar.buttons.push(button);
            }
            return newBars;
        });
        setQuickActionModalOpen(false);
        setEditingQuickAction(null);
    };

    if (isLoading) return <LoadingScreen message="AI đang dệt nên thế giới của bạn..." isGeneratingWorld={true} />;

    return (
        <div className="flex-grow flex flex-col min-h-0 animate-fade-in">
             <FactionEditorModal isOpen={isFactionModalOpen} onClose={() => setFactionModalOpen(false)} onSave={handleSaveFaction} faction={editingFaction} />
             <LocationEditorModal isOpen={isLocationModalOpen} onClose={() => setLocationModalOpen(false)} onSave={handleSaveLocation} location={editingLocation} />
             <NpcEditorModal isOpen={isNpcModalOpen} onClose={() => setNpcModalOpen(false)} onSave={handleSaveNpc} npc={editingNpc} />
             {editingAttribute && <AttributeEditorModal isOpen={isAttributeModalOpen} onClose={() => setAttributeModalOpen(false)} onSave={handleSaveAttribute} attribute={editingAttribute.attribute} group={editingAttribute.group} />}
             <RealmEditorModal isOpen={isRealmModalOpen} onClose={() => setRealmModalOpen(false)} onSave={handleSaveRealms} initialRealms={namedRealmSystems[0]?.realms || []} attributeSystem={attributeSystem} />
             <QuickActionButtonEditorModal isOpen={isQuickActionModalOpen} onClose={() => setQuickActionModalOpen(false)} onSave={handleSaveQuickAction} button={editingQuickAction} />

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
                                <input name="id" value={modInfo.id} onChange={e => setModInfo(p => ({...p, id: e.target.value.toLowerCase().replace(/\s+/g, '_')}))} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" placeholder="vd: cyber_tu_chan"/>
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Tác Giả</label>
                            <input name="author" value={modInfo.author} onChange={e => setModInfo(p => ({...p, author: e.target.value}))} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" placeholder="Tên của bạn"/>
                        </div>
                    </AccordionSection>

                     <AccordionSection title="2. Gợi Ý Cho AI (Bắt buộc)" isOpen={openSections.aiPrompts} onToggle={() => handleToggleSection('aiPrompts')}>
                         <Field label="Bối Cảnh (Setting)" description="Mô tả tổng quan về thế giới, môi trường, không khí, và các đặc điểm chính.">
                            <textarea name="setting" value={prompts.setting} onChange={e => setPrompts(p => ({...p, setting: e.target.value}))} rows={3} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 resize-y" placeholder="Vd: Một vương quốc tu tiên lơ lửng trên những hòn đảo bay..."/>
                        </Field>
                    </AccordionSection>

                    <AccordionSection title="3. Thiết Kế Thế Giới (Thủ công)" secondaryText="Tạo nền tảng cho AI" isOpen={openSections.manualDb} onToggle={() => handleToggleSection('manualDb')}>
                        {/* Factions */}
                        <div className="space-y-2">
                           <h4 className="font-semibold text-gray-300">Phe Phái</h4>
                            {factions.map(f => (
                                <div key={f.name} className="flex justify-between items-center p-2 bg-black/30 rounded">
                                    <span className="text-sm font-semibold">{f.name}</span>
                                    <div><button onClick={() => { setEditingFaction(f); setFactionModalOpen(true); }}><FaEdit/></button><button onClick={() => handleDeleteFaction(f.name)}><FaTrash/></button></div>
                                </div>
                            ))}
                            <button onClick={() => {setEditingFaction(null); setFactionModalOpen(true);}} className="w-full text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded"><FaPlus/> Thêm Phe Phái</button>
                        </div>
                         {/* Locations */}
                        <div className="space-y-2">
                           <h4 className="font-semibold text-gray-300">Địa Điểm</h4>
                            {locations.map(l => (
                                <div key={l.id} className="flex justify-between items-center p-2 bg-black/30 rounded">
                                    <span className="text-sm font-semibold">{l.name}</span>
                                    <div><button onClick={() => { setEditingLocation(l); setLocationModalOpen(true); }}><FaEdit/></button><button onClick={() => handleDeleteLocation(l.id)}><FaTrash/></button></div>
                                </div>
                            ))}
                            <button onClick={() => {setEditingLocation(null); setLocationModalOpen(true);}} className="w-full text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded"><FaPlus/> Thêm Địa Điểm</button>
                        </div>
                         {/* NPCs */}
                        <div className="space-y-2">
                           <h4 className="font-semibold text-gray-300">Nhân Vật</h4>
                            {npcs.map(n => (
                                <div key={n.id} className="flex justify-between items-center p-2 bg-black/30 rounded">
                                    <span className="text-sm font-semibold">{n.name}</span>
                                    <div><button onClick={() => { setEditingNpc(n); setNpcModalOpen(true); }}><FaEdit/></button><button onClick={() => handleDeleteNpc(n.id)}><FaTrash/></button></div>
                                </div>
                            ))}
                            <button onClick={() => {setEditingNpc(null); setNpcModalOpen(true);}} className="w-full text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded"><FaPlus/> Thêm Nhân Vật</button>
                        </div>
                    </AccordionSection>
                    
                     <AccordionSection title="4. Quy Luật & Hệ Thống (Nâng cao)" secondaryText="Tùy chỉnh sâu cơ chế game" isOpen={openSections.systems} onToggle={() => handleToggleSection('systems')}>
                        {/* Attribute System */}
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Hệ thống Thuộc tính</h4>
                            <div className="space-y-2 max-h-64 overflow-y-auto p-2 bg-black/30 rounded">
                                {attributeSystem.groups.map(group => (
                                    <div key={group.id}>
                                        <h5 className="font-bold text-sm text-cyan-300">{group.name}</h5>
                                        {attributeSystem.definitions.filter(d => d.group === group.id).map(attr => (
                                            <div key={attr.id} className="flex justify-between items-center pl-4 text-xs">
                                                <span className="text-gray-400">{attr.name}</span>
                                                <button onClick={() => { setEditingAttribute({ attribute: attr, group }); setAttributeModalOpen(true); }} className="p-1 text-gray-500 hover:text-white"><FaEdit/></button>
                                            </div>
                                        ))}
                                        <button onClick={() => { setEditingAttribute({ attribute: null, group }); setAttributeModalOpen(true); }} className="text-xs text-green-400/80 hover:text-green-300 w-full text-left pl-4 mt-1">+ Thêm thuộc tính vào nhóm</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Realm System */}
                        <div>
                            <h4 className="font-semibold text-gray-300 my-2">Hệ thống Cảnh giới</h4>
                            <button onClick={() => setRealmModalOpen(true)} className="w-full p-2 bg-cyan-900/30 rounded text-cyan-300/80 hover:text-cyan-200">
                                Chỉnh sửa Hệ thống Tu luyện
                            </button>
                        </div>

                        {/* Quick Actions */}
                        <div>
                            <h4 className="font-semibold text-gray-300 my-2">Thanh Hành Động Nhanh</h4>
                            <div className="space-y-1 max-h-48 overflow-y-auto p-2 bg-black/30 rounded">
                                {quickActionBars[0]?.buttons.map(button => (
                                    <div key={button.id} className="flex justify-between items-center text-xs">
                                        <span className="text-gray-400">{button.label}</span>
                                        <button onClick={() => { setEditingQuickAction(button); setQuickActionModalOpen(true); }} className="p-1 text-gray-500 hover:text-white"><FaEdit/></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => { setEditingQuickAction(null); setQuickActionModalOpen(true); }} className="w-full text-sm text-green-400/80 hover:text-green-300 flex items-center justify-center gap-2 p-1 bg-green-900/30 rounded mt-1">
                                <FaPlus/> Thêm Nút Hành Động
                            </button>
                        </div>
                        
                        {/* AI Hooks */}
                        <div>
                            <h4 className="font-semibold text-gray-300 my-2">Quy Luật AI (AI Hooks)</h4>
                             <Field label="Luật Lệ Vĩnh Cửu" description="Các quy tắc cốt lõi, không thay đổi của thế giới mà AI phải luôn tuân theo.">
                                <textarea name="on_world_build" value={aiHooks.on_world_build} onChange={e => setAiHooks(p => ({...p, on_world_build: e.target.value}))} rows={3} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 resize-y font-mono text-sm"/>
                            </Field>
                             <Field label="Luật Lệ Tình Huống" description="Các quy tắc được AI xem xét và áp dụng cho kết quả của mỗi hành động người chơi.">
                                <textarea name="on_action_evaluate" value={aiHooks.on_action_evaluate} onChange={e => setAiHooks(p => ({...p, on_action_evaluate: e.target.value}))} rows={3} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 resize-y font-mono text-sm"/>
                            </Field>
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