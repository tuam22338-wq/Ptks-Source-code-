import React, { useState, useRef, useEffect } from 'react';
import { FaArrowLeft, FaFileUpload, FaBrain, FaToggleOn, FaToggleOff, FaSave, FaPlus, FaTrash, FaEdit, FaBolt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useAppContext } from '../../contexts/AppContext';
import { CURRENT_GAME_VERSION, ATTRIBUTE_TEMPLATES, UI_ICONS, NARRATIVE_STYLES, DEATH_PENALTY_LEVELS, WORLD_INTERRUPTION_LEVELS } from '../../constants';
import { REALM_TEMPLATES } from '../../data/realmTemplates';
import type { SaveSlot, FullMod, WorldCreationData, ModAttributeSystem, AttributeDefinition, AttributeGroupDefinition, NamedRealmSystem, GenerationMode, NarrativeStyle, DeathPenalty, WorldInterruptionFrequency, DataGenerationMode, ModNpc, ModLocation, Faction } from '../../types';
import LoadingScreen from '../../components/LoadingScreen';
import AttributeEditorModal from '../../features/Mods/components/AttributeEditorModal';
import RealmEditorModal from '../../features/Mods/components/RealmEditorModal';
import NpcEditorModal from '../../features/Mods/components/NpcEditorModal';
import LocationEditorModal from '../../features/Mods/components/LocationEditorModal';
import FactionEditorModal from '../../features/Mods/components/FactionEditorModal';
import { generateWorldFromText } from '../../services/gemini/modding.service';

// --- Quick Create Modal ---
const QuickCreateModal: React.FC<{
    onClose: () => void;
    onGenerate: (description: string, characterName: string) => void;
}> = ({ onClose, onGenerate }) => {
    const [description, setDescription] = useState('');
    const [characterName, setCharacterName] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in" onClick={onClose}>
            <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-xl m-4 p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold font-title text-amber-300 mb-4">Tạo Nhanh Bằng AI</h3>
                <p className="text-sm text-gray-400 mb-4">Chỉ cần mô tả ý tưởng cốt lõi và tên nhân vật. AI sẽ tự động tạo ra một thế giới hoàn chỉnh với thể loại, bối cảnh, hệ thống thuộc tính, hệ thống cảnh giới và chương mở đầu.</p>
                <input
                    value={characterName}
                    onChange={e => setCharacterName(e.target.value)}
                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 mb-3"
                    placeholder="Nhập tên nhân vật chính của bạn..."
                />
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={5}
                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 resize-y"
                    placeholder="VD: Một thế giới cyberpunk nơi tu sĩ cấy ghép linh hồn vào máy móc để trường sinh, các tập đoàn lớn là những tông môn mới, và 'linh khí' chính là dòng dữ liệu thuần khiết..."
                />
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Hủy</button>
                    <button onClick={() => onGenerate(description, characterName)} disabled={!characterName.trim() || !description.trim()} className="px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500 disabled:bg-gray-500">Bắt Đầu Sáng Tạo</button>
                </div>
            </div>
        </div>
    );
};


// --- Save Slot Selection Modal ---
const SlotSelectionModal: React.FC<{
    slots: SaveSlot[];
    onSelect: (slotId: number) => void;
    onClose: () => void;
}> = ({ slots, onSelect, onClose }) => {
    const emptySlots = slots.filter(s => s.data === null);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in" onClick={onClose}>
            <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl m-4 p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold font-title text-amber-300 mb-4 text-center">Chọn Ô Lưu Trữ Trống</h3>
                {emptySlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                        {emptySlots.map(slot => (
                            <button
                                key={slot.id}
                                onClick={() => onSelect(slot.id)}
                                className="h-32 flex flex-col items-center justify-center text-center p-4 bg-black/20 border border-gray-600 rounded-lg hover:border-amber-400 hover:bg-amber-500/10 transition-colors"
                            >
                                <FaSave className="text-4xl text-gray-400 mb-2"/>
                                <span className="font-bold">Ô {slot.id}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-red-400">Không còn ô lưu trữ nào trống. Vui lòng xóa bớt một hành trình cũ để bắt đầu hành trình mới.</p>
                )}
            </div>
        </div>
    );
};


// --- Main World Creator Screen Component ---
const SaveSlotScreen: React.FC = () => {
  const { state, handleNavigate, handleCreateAndStartGame, handleQuickCreateAndStartGame } = useAppContext();
  const importInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSlotModalOpen, setSlotModalOpen] = useState(false);
  const [isQuickCreateOpen, setQuickCreateOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [quickCreateInfo, setQuickCreateInfo] = useState<{description: string; characterName: string} | null>(null);


  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<AttributeDefinition | null>(null);
  const [editingGroup, setEditingGroup] = useState<AttributeGroupDefinition | null>(null);
  
  const [isRealmEditorOpen, setRealmEditorOpen] = useState(false);

  // Modals for custom data
  const [isNpcModalOpen, setNpcModalOpen] = useState(false);
  const [editingNpc, setEditingNpc] = useState<ModNpc | null>(null);
  const [isLocationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<ModLocation | null>(null);
  const [isFactionModalOpen, setFactionModalOpen] = useState(false);
  const [editingFaction, setEditingFaction] = useState<Faction | null>(null);

  const [formData, setFormData] = useState<WorldCreationData>({
    genre: 'Huyền Huyễn Tu Tiên',
    theme: '',
    setting: '',
    mainGoal: '',
    openingStory: '',
    importedMod: null,
    fanficMode: false,
    hardcoreMode: false,
    character: { name: '', gender: 'AI', bio: '' },
    attributeSystem: ATTRIBUTE_TEMPLATES.find(t => t.id === 'xianxia_default')!.system,
    enableRealmSystem: true,
    realmTemplateId: 'xianxia_default',
    namedRealmSystem: REALM_TEMPLATES.find(t => t.id === 'xianxia_default')!.system,
    generationMode: 'deep',
    // Data Generation Modes
    npcGenerationMode: 'AI',
    locationGenerationMode: 'AI',
    factionGenerationMode: 'AI',
    customNpcs: [],
    customLocations: [],
    customFactions: [],
    // Default Gameplay Settings
    narrativeStyle: 'classic_wuxia',
    aiResponseWordCount: 1500,
    aiCreativityLevel: 'balanced',
    narrativePacing: 'medium',
    playerAgencyLevel: 'balanced',
    aiMemoryDepth: 'balanced',
    npcComplexity: 'advanced',
    worldEventFrequency: 'occasional',
    worldReactivity: 'dynamic',
    cultivationRateMultiplier: 100,
    resourceRateMultiplier: 100,
    damageDealtMultiplier: 100,
    damageTakenMultiplier: 100,
    enableSurvivalMechanics: true,
    deathPenalty: 'resource_loss',
    validationServiceCap: 'strict',
    narrateSystemChanges: true,
    worldInterruptionFrequency: 'occasional',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name.startsWith('character.')) {
        const charField = name.split('.')[1];
        setFormData(p => ({ ...p, character: { ...p.character, [charField]: value } }));
    } else if (name === 'genre') {
        let templateId = 'xianxia_default';
        if (value === 'Võ Hiệp Giang Hồ') templateId = 'wuxia';
        if (value === 'Khoa Huyễn Viễn Tưởng') templateId = 'cyberpunk';
        if (value === 'Kinh Dị Huyền Bí' || value === 'Thám Tử & Huyền Bí') templateId = 'lovecraftian';
        if (value === 'Hậu Tận Thế & Sinh Tồn') templateId = 'post_apocalypse';
        if (value === 'Phiêu Lưu & Khám Phá' || value === 'Lịch Sử & Dã Sử') templateId = 'high_fantasy';
        if (value === 'Steampunk & Ma Thuật') templateId = 'cyberpunk';
        const template = ATTRIBUTE_TEMPLATES.find(t => t.id === templateId);
        setFormData(p => ({
            ...p,
            genre: value,
            attributeSystem: template ? template.system : p.attributeSystem
        }));
    } else {
        const isCheckbox = type === 'checkbox';
        const finalValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;
        setFormData(p => ({ ...p, [name]: finalValue }));
    }
  };

  const handleDataGenModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(p => ({ ...p, [name]: value as DataGenerationMode }));
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const mod = JSON.parse(e.target?.result as string) as FullMod;
        if (!mod.modInfo || !mod.content) {
            throw new Error("File mod không hợp lệ, thiếu modInfo hoặc content.");
        }
        
        setFormData(p => ({
            ...p,
            importedMod: mod,
            genre: mod.modInfo.tags?.[0] || p.genre,
            theme: mod.modInfo.name || p.theme,
            setting: mod.modInfo.description || mod.content.worldData?.[0]?.description || p.setting,
            attributeSystem: mod.content.attributeSystem || p.attributeSystem,
            namedRealmSystem: mod.content.namedRealmSystems?.[0] || p.namedRealmSystem,
            enableRealmSystem: !!(mod.content.namedRealmSystems && mod.content.namedRealmSystems.length > 0),
            character: p.character,
        }));

      } catch (err: any) {
        setError(`Lỗi khi nhập mod: ${err.message}`);
      }
    };
    reader.readAsText(file);
    if (event.target) {
        event.target.value = "";
    }
  };
  
  const handleStartCreation = () => {
    if (!formData.character.name.trim()) {
        setError("Vui lòng nhập tên nhân vật chính.");
        return;
    }
    setQuickCreateInfo(null); // Ensure we're in manual mode
    setError(null);
    setSlotModalOpen(true);
  };

  const handleSlotSelected = async (slotId: number) => {
    setSlotModalOpen(false);
    setIsLoading(true);
    setLoadingMessage("Đấng Sáng Thế đang kiến tạo vũ trụ của bạn...");
    try {
        if (quickCreateInfo) {
            // New, optimized Quick Create flow
            await handleQuickCreateAndStartGame(quickCreateInfo.description, quickCreateInfo.characterName, slotId);
        } else {
            // Original Manual Create flow
            await handleCreateAndStartGame(formData, slotId);
        }
        // On success, AppContext will handle navigation.
    } catch (err: any) {
        setError(`Lỗi tạo thế giới: ${err.message}`);
        setIsLoading(false);
    }
  };

    const handleOpenAttributeModal = (group: AttributeGroupDefinition, attribute: AttributeDefinition | null) => {
        setEditingGroup(group);
        setEditingAttribute(attribute);
        setIsAttributeModalOpen(true);
    };

    const handleSaveAttribute = (attribute: AttributeDefinition) => {
        setFormData(prev => {
            const newSystem = { ...prev.attributeSystem! };
            const index = newSystem.definitions.findIndex(def => def.id === attribute.id);
            if (index > -1) {
                newSystem.definitions[index] = attribute;
            } else {
                newSystem.definitions.push(attribute);
            }
            return { ...prev, attributeSystem: newSystem };
        });
        setIsAttributeModalOpen(false);
    };

    const handleDeleteAttribute = (attributeId: string) => {
        if (window.confirm("Bạn có chắc muốn xóa thuộc tính này?")) {
            setFormData(prev => {
                const newSystem = { ...prev.attributeSystem! };
                newSystem.definitions = newSystem.definitions.filter(def => def.id !== attributeId);
                return { ...prev, attributeSystem: newSystem };
            });
        }
    };

    const handleTemplateChange = (templateId: string) => {
        const template = ATTRIBUTE_TEMPLATES.find(t => t.id === templateId);
        if (template) {
            setFormData(p => ({ ...p, attributeSystem: template.system }));
        }
    };
    
    const handleRealmTemplateChange = (templateId: string) => {
        const template = REALM_TEMPLATES.find(t => t.id === templateId);
        setFormData(prev => ({
            ...prev,
            realmTemplateId: templateId,
            namedRealmSystem: template ? template.system : null
        }));
    };
    
    const handleSaveRealmSystem = (systems: NamedRealmSystem[]) => {
        setFormData(p => ({ ...p, namedRealmSystem: systems[0] || null }));
    };

    const handleQuickGenerate = (description: string, characterName: string) => {
        setQuickCreateOpen(false);
        setError(null);
        setQuickCreateInfo({ description, characterName });
        setSlotModalOpen(true); // Ask for slot first, then start the combined generation
    };
  
    // --- Custom Data Handlers ---
    const handleSaveNpc = (npc: ModNpc) => {
        setFormData(p => {
            const existingIndex = p.customNpcs.findIndex(n => n.id === npc.id);
            if (existingIndex > -1) {
                const updatedNpcs = [...p.customNpcs];
                updatedNpcs[existingIndex] = npc;
                return { ...p, customNpcs: updatedNpcs };
            }
            return { ...p, customNpcs: [...p.customNpcs, npc] };
        });
        setNpcModalOpen(false);
    };

    const handleDeleteNpc = (npcId: string) => {
        if (window.confirm("Bạn có chắc muốn xóa NPC này?")) {
            setFormData(p => ({ ...p, customNpcs: p.customNpcs.filter(n => n.id !== npcId)}));
        }
    };
    
    const handleSaveLocation = (loc: ModLocation) => {
        setFormData(p => {
            const existingIndex = p.customLocations.findIndex(l => l.id === loc.id);
            if (existingIndex > -1) {
                 const updated = [...p.customLocations];
                 updated[existingIndex] = loc;
                return { ...p, customLocations: updated };
            }
            return { ...p, customLocations: [...p.customLocations, loc] };
        });
        setLocationModalOpen(false);
    };

    const handleDeleteLocation = (locId: string) => {
        if (window.confirm("Bạn có chắc muốn xóa Địa Điểm này?")) {
            setFormData(p => ({ ...p, customLocations: p.customLocations.filter(l => l.id !== locId)}));
        }
    };

     const handleSaveFaction = (faction: Faction) => {
        setFormData(p => {
            const existingIndex = p.customFactions.findIndex(f => f.name === faction.name);
            if (existingIndex > -1) {
                const updated = [...p.customFactions];
                updated[existingIndex] = faction;
                return { ...p, customFactions: updated };
            }
            return { ...p, customFactions: [...p.customFactions, faction] };
        });
        setFactionModalOpen(false);
    };

    const handleDeleteFaction = (factionName: string) => {
         if (window.confirm("Bạn có chắc muốn xóa Phe Phái này?")) {
            setFormData(p => ({ ...p, customFactions: p.customFactions.filter(f => f.name !== factionName)}));
        }
    };


  if (isLoading) {
      return <LoadingScreen message={loadingMessage} isGeneratingWorld={true} generationMode={'fast'}/>;
  }

  return (
    <div className="w-full animate-fade-in flex flex-col h-full min-h-0">
        {isSlotModalOpen && <SlotSelectionModal slots={state.saveSlots} onClose={() => setSlotModalOpen(false)} onSelect={handleSlotSelected} />}
        {isQuickCreateOpen && <QuickCreateModal onClose={() => setQuickCreateOpen(false)} onGenerate={handleQuickGenerate} />}
        {editingGroup && (
            <AttributeEditorModal 
                isOpen={isAttributeModalOpen}
                onClose={() => setIsAttributeModalOpen(false)}
                onSave={handleSaveAttribute}
                attribute={editingAttribute}
                group={editingGroup}
            />
        )}
        {formData.attributeSystem && (
            <RealmEditorModal
                isOpen={isRealmEditorOpen}
                onClose={() => setRealmEditorOpen(false)}
                onSave={handleSaveRealmSystem}
                initialSystems={formData.namedRealmSystem ? [formData.namedRealmSystem] : []}
                attributeSystem={formData.attributeSystem}
            />
        )}
        <NpcEditorModal isOpen={isNpcModalOpen} onClose={() => setNpcModalOpen(false)} onSave={handleSaveNpc} npc={editingNpc} />
        <LocationEditorModal isOpen={isLocationModalOpen} onClose={() => setLocationModalOpen(false)} onSave={handleSaveLocation} location={editingLocation} />
        <FactionEditorModal isOpen={isFactionModalOpen} onClose={() => setFactionModalOpen(false)} onSave={handleSaveFaction} faction={editingFaction} />

        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-3xl font-bold font-title">Kiến Tạo Thế Giới</h2>
            <button onClick={() => handleNavigate('mainMenu')} className="p-2 rounded-full text-[var(--text-muted-color)] hover:text-[var(--text-color)] hover:bg-gray-700/50" title="Quay Lại Menu">
                <FaArrowLeft className="w-5 h-5" />
            </button>
        </div>
        
        <div className="p-4 bg-teal-900/30 border border-teal-500/50 rounded-lg mb-6 flex flex-col sm:flex-row gap-4">
            <button onClick={() => setQuickCreateOpen(true)} className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 text-lg">
                <FaBolt /> Tạo Nhanh Bằng AI
            </button>
            <input
                type="file"
                ref={importInputRef}
                onChange={handleFileImport}
                className="hidden"
                accept=".json"
            />
            <button onClick={() => importInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-3 px-4 py-3 bg-sky-700/80 text-white font-bold rounded-lg hover:bg-sky-600/80 text-lg">
                <FaFileUpload /> Nhập World Data (.json)
            </button>
        </div>
      
        <div className="flex-grow min-h-0 overflow-y-auto pr-2 space-y-6">
            {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30">{error}</p>}
            
            <Section title="1. Hồn Của Thế Giới">
                <Field label="Thể Loại" description="Quyết định văn phong và không khí chính của câu chuyện. Sẽ tự động chọn một mẫu thuộc tính phù hợp.">
                    <select name="genre" value={formData.genre} onChange={handleInputChange} className="input-neumorphic">
                        <option>Huyền Huyễn Tu Tiên</option>
                        <option>Võ Hiệp Giang Hồ</option>
                        <option>Khoa Huyễn Viễn Tưởng</option>
                        <option>Kinh Dị Huyền Bí</option>
                        <option>Đô Thị Dị Năng</option>
                        <option>Hậu Tận Thế & Sinh Tồn</option>
                        <option>Hệ Thống & Thăng Cấp (LitRPG)</option>
                        <option>Cung Đấu & Gia Tộc</option>
                        <option>Steampunk & Ma Thuật</option>
                        <option>Thám Tử & Huyền Bí</option>
                        <option>Triệu Hồi & Dưỡng Thú</option>
                        <option>Lãng Mạn & Tình Duyên</option>
                        <option>Hài Hước & Châm Biếm</option>
                        <option>Lịch Sử & Dã Sử</option>
                        <option>Phiêu Lưu & Khám Phá</option>
                    </select>
                </Field>
                <Field label="Chủ Đề (Cụ thể hơn)" description="Giúp AI tập trung vào một khía cạnh cụ thể trong thể loại bạn chọn.">
                    <input name="theme" value={formData.theme} onChange={handleInputChange} className="input-neumorphic" placeholder="VD: Ngôi nhà ma ám, Lời nguyền rồng, Tu tiên độ kiếp..."/>
                </Field>
                <Field label="Bối Cảnh (Thế giới/Môi trường)" description="Mô tả nơi câu chuyện sẽ diễn ra.">
                    <textarea name="setting" value={formData.setting} onChange={handleInputChange} rows={3} className="input-neumorphic resize-y" placeholder="VD: Thành phố bỏ hoang sau đại dịch, Vương quốc Eldoria huyền bí, Tam Giới hỗn loạn..."/>
                </Field>
            </Section>

             <Section title="2. Cài Đặt Sáng Thế Nâng Cao">
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex justify-between items-center px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-left text-[var(--text-color)] hover:bg-black/40">
                    <span className="font-semibold">Tùy Chỉnh Lối Chơi & AI</span>
                    {showAdvanced ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                 {showAdvanced && (
                    <div className="p-4 space-y-4 border-t border-gray-600/50 animate-fade-in">
                        <Field label="Phong Cách Tường Thuật" description="Chọn văn phong và giọng điệu cho AI kể chuyện.">
                             <select name="narrativeStyle" value={formData.narrativeStyle} onChange={e => setFormData(p => ({ ...p, narrativeStyle: e.target.value as NarrativeStyle }))} className="input-neumorphic">
                                {NARRATIVE_STYLES.map(style => <option key={style.value} value={style.value}>{style.label}</option>)}
                            </select>
                        </Field>
                        <Field label="Độ dài Phản hồi AI (Số từ)" description="Đặt độ dài gần đúng cho mỗi phản hồi tường thuật của AI.">
                            <div className="flex items-center gap-4">
                                <input type="range" min="100" max="5000" step="100" value={formData.aiResponseWordCount} onChange={(e) => setFormData(p => ({ ...p, aiResponseWordCount: parseInt(e.target.value) }))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                                <span className="font-mono text-sm w-20 text-center">{formData.aiResponseWordCount}</span>
                            </div>
                        </Field>
                        <Field label="Mức Độ Biến Hóa Của Thế Giới" description="Tần suất các sự kiện ngẫu nhiên xảy ra làm gián đoạn hành động của bạn.">
                            <select name="worldInterruptionFrequency" value={formData.worldInterruptionFrequency} onChange={e => setFormData(p => ({ ...p, worldInterruptionFrequency: e.target.value as WorldInterruptionFrequency }))} className="input-neumorphic">
                                {WORLD_INTERRUPTION_LEVELS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </Field>
                         <Field label="Hình Phạt Khi Tử Vong" description="Chọn hình phạt sẽ xảy ra khi nhân vật của bạn chết.">
                             <select name="deathPenalty" value={formData.deathPenalty} onChange={e => setFormData(p => ({ ...p, deathPenalty: e.target.value as DeathPenalty }))} className="input-neumorphic">
                                {DEATH_PENALTY_LEVELS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </Field>
                        <Field label="Bật Cơ Chế Sinh Tồn" description="Bật hoặc tắt nhu cầu về đói, khát.">
                             <button onClick={() => setFormData(p => ({ ...p, enableSurvivalMechanics: !p.enableSurvivalMechanics }))} className="flex items-center gap-2" style={{color: 'var(--text-color)'}}>
                                {formData.enableSurvivalMechanics ? <FaToggleOn className="text-green-400 text-2xl"/> : <FaToggleOff className="text-2xl"/>}
                                <span>Bật đói và khát</span>
                            </button>
                        </Field>
                    </div>
                 )}
            </Section>

            <Section title="3. Hệ Thống Cảnh Giới & Thuộc Tính">
                 <Field label="Hệ thống Cảnh giới" description="Thế giới của bạn có hệ thống cấp bậc, tu luyện, hay sức mạnh không?">
                    <button onClick={() => setFormData(p => ({ ...p, enableRealmSystem: !p.enableRealmSystem }))} className="flex items-center gap-2" style={{color: 'var(--text-color)'}}>
                        {formData.enableRealmSystem ? <FaToggleOn className="text-green-400 text-2xl"/> : <FaToggleOff className="text-2xl"/>}
                        <span>{formData.enableRealmSystem ? 'Đang Bật' : 'Đang Tắt'}</span>
                    </button>
                </Field>
                 {formData.enableRealmSystem && (
                     <Field label="Chọn Mẫu Cảnh Giới" description="Bắt đầu với một hệ thống có sẵn hoặc tự tạo.">
                        <div className="flex items-center gap-2">
                           <select value={formData.realmTemplateId} onChange={e => handleRealmTemplateChange(e.target.value)} className="input-neumorphic">
                                {REALM_TEMPLATES.map(template => (
                                    <option key={template.id} value={template.id}>{template.name} - {template.description}</option>
                                ))}
                                <option value="custom">Tùy Chỉnh</option>
                            </select>
                            <button onClick={() => setRealmEditorOpen(true)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 flex items-center gap-2"><FaEdit /> Sửa</button>
                        </div>
                    </Field>
                 )}
                <Field label="Hệ Thống Thuộc Tính" description="Bắt đầu với một hệ thống thuộc tính có sẵn.">
                    <select onChange={e => handleTemplateChange(e.target.value)} className="input-neumorphic">
                        {ATTRIBUTE_TEMPLATES.map(template => (
                            <option key={template.id} value={template.id}>{template.name} - {template.description}</option>
                        ))}
                    </select>
                </Field>
                {formData.attributeSystem?.groups.map(group => (
                    <div key={group.id} className="neumorphic-inset-box p-3">
                        <h4 className="font-bold text-lg" style={{color: 'var(--primary-accent-color)'}}>{group.name}</h4>
                        <div className="mt-2 space-y-2">
                            {formData.attributeSystem.definitions.filter(def => def.group === group.id).map(def => (
                                <div key={def.id} className="flex justify-between items-center p-2 bg-black/20 rounded">
                                    <div className="flex items-center gap-2">
                                        {React.createElement(UI_ICONS[def.iconName] || 'span', { className: 'text-cyan-300' })}
                                        <span className="text-sm font-semibold" style={{color: 'var(--text-color)'}}>{def.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleOpenAttributeModal(group, def)} className="p-1 text-[var(--text-muted-color)] hover:text-[var(--text-color)]"><FaEdit /></button>
                                        <button onClick={() => handleDeleteAttribute(def.id)} className="p-1 text-[var(--text-muted-color)] hover:text-red-400"><FaTrash /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => handleOpenAttributeModal(group, null)} className="w-full mt-3 text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded">
                            <FaPlus /> Thêm thuộc tính vào nhóm
                        </button>
                    </div>
                ))}
            </Section>

            <Section title="4. Tạo Nhân Vật Chính">
                <Field label="Tên Nhân Vật" description="Nhập tên cho nhân vật của bạn.">
                    <input name="character.name" value={formData.character.name} onChange={handleInputChange} className="input-neumorphic"/>
                </Field>
                <Field label="Giới Tính" description="">
                     <select name="character.gender" value={formData.character.gender} onChange={handleInputChange} className="input-neumorphic">
                        <option value="AI">Để AI quyết định</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                    </select>
                </Field>
                <Field label="Sơ Lược Tiểu Sử/Đặc Điểm (2-3 câu)" description="Cung cấp cho AI một vài ý tưởng về nhân vật của bạn.">
                    <textarea name="character.bio" value={formData.character.bio} onChange={handleInputChange} rows={3} className="input-neumorphic resize-y" placeholder="VD: Một thám tử tư nghiện cà phê với quá khứ bí ẩn, một đệ tử ngoại môn vô danh tình cờ nhặt được bí kíp..."/>
                </Field>
            </Section>

            <Section title="5. Dữ Liệu Thế Giới">
                <Field label="NPC Ban Đầu" description="Chọn cách tạo các NPC ban đầu trong thế giới.">
                    <div className="flex gap-2 items-start">
                        <select name="npcGenerationMode" value={formData.npcGenerationMode} onChange={handleDataGenModeChange} className="input-neumorphic flex-grow">
                            <option value="AI">Để AI Tự Tạo</option>
                            <option value="CUSTOM">Tự Định Nghĩa</option>
                            <option value="NONE">Không Tạo Ban Đầu</option>
                        </select>
                    </div>
                    {formData.npcGenerationMode === 'CUSTOM' && (
                        <div className="mt-2 p-2 border border-gray-700 rounded-lg space-y-2">
                            {formData.customNpcs.map(npc => (
                                <div key={npc.id} className="flex justify-between items-center p-2 bg-black/20 rounded">
                                    <span className="text-sm font-semibold">{npc.name}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setEditingNpc(npc); setNpcModalOpen(true); }} className="p-1 text-[var(--text-muted-color)] hover:text-white"><FaEdit /></button>
                                        <button onClick={() => handleDeleteNpc(npc.id)} className="p-1 text-[var(--text-muted-color)] hover:text-red-400"><FaTrash /></button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => { setEditingNpc(null); setNpcModalOpen(true); }} className="w-full mt-1 text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded"><FaPlus /> Thêm NPC</button>
                        </div>
                    )}
                </Field>
                 <Field label="Địa Điểm Ban Đầu" description="Chọn cách tạo các địa điểm ban đầu.">
                     <div className="flex gap-2 items-start">
                        <select name="locationGenerationMode" value={formData.locationGenerationMode} onChange={handleDataGenModeChange} className="input-neumorphic flex-grow">
                            <option value="AI">Sử dụng từ Thế giới Mặc định</option>
                            <option value="CUSTOM">Tự Định Nghĩa</option>
                            <option value="NONE">Không Tạo Ban Đầu</option>
                        </select>
                    </div>
                     {formData.locationGenerationMode === 'CUSTOM' && (
                        <div className="mt-2 p-2 border border-gray-700 rounded-lg space-y-2">
                            {formData.customLocations.map(loc => (
                                <div key={loc.id} className="flex justify-between items-center p-2 bg-black/20 rounded">
                                    <span className="text-sm font-semibold">{loc.name}</span>
                                     <div className="flex gap-2">
                                        <button onClick={() => { setEditingLocation(loc); setLocationModalOpen(true); }} className="p-1 text-[var(--text-muted-color)] hover:text-white"><FaEdit /></button>
                                        <button onClick={() => handleDeleteLocation(loc.id)} className="p-1 text-[var(--text-muted-color)] hover:text-red-400"><FaTrash /></button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => { setEditingLocation(null); setLocationModalOpen(true); }} className="w-full mt-1 text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded"><FaPlus /> Thêm Địa Điểm</button>
                        </div>
                    )}
                </Field>
                <Field label="Phe Phái Ban Đầu" description="Chọn cách tạo các phe phái ban đầu.">
                     <div className="flex gap-2 items-start">
                        <select name="factionGenerationMode" value={formData.factionGenerationMode} onChange={handleDataGenModeChange} className="input-neumorphic flex-grow">
                            <option value="AI">Sử dụng từ Thế giới Mặc định</option>
                            <option value="CUSTOM">Tự Định Nghĩa</option>
                            <option value="NONE">Không Tạo Ban Đầu</option>
                        </select>
                    </div>
                    {formData.factionGenerationMode === 'CUSTOM' && (
                        <div className="mt-2 p-2 border border-gray-700 rounded-lg space-y-2">
                            {formData.customFactions.map(faction => (
                                <div key={faction.name} className="flex justify-between items-center p-2 bg-black/20 rounded">
                                    <span className="text-sm font-semibold">{faction.name}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setEditingFaction(faction); setFactionModalOpen(true); }} className="p-1 text-[var(--text-muted-color)] hover:text-white"><FaEdit /></button>
                                        <button onClick={() => handleDeleteFaction(faction.name)} className="p-1 text-[var(--text-muted-color)] hover:text-red-400"><FaTrash /></button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => { setEditingFaction(null); setFactionModalOpen(true); }} className="w-full mt-1 text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded"><FaPlus /> Thêm Phe Phái</button>
                        </div>
                    )}
                </Field>
            </Section>

        </div>

        <div className="flex-shrink-0 mt-6 pt-4 border-t border-gray-700/60 flex justify-center">
            <button onClick={handleStartCreation} className="btn btn-primary px-8 py-3 text-xl font-bold flex items-center gap-3">
                <FaBrain /> Bắt Đầu Sáng Thế
            </button>
        </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="neumorphic-inset-box p-4">
        <h3 className="text-xl font-bold font-title text-[var(--primary-accent-color)] mb-4">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const Field: React.FC<{ label: string; description: string; children: React.ReactNode; disabled?: boolean }> = ({ label, description, children, disabled }) => (
    <div className={disabled ? 'opacity-50' : ''}>
        <label className="block font-semibold" style={{color: 'var(--text-color)'}}>{label}</label>
        <p className="text-sm mb-2" style={{color: 'var(--text-muted-color)'}}>{description}</p>
        {children}
    </div>
);


export default SaveSlotScreen;