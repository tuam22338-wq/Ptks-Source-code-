import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FaArrowLeft, FaFileUpload, FaBrain, FaToggleOn, FaToggleOff, FaSave, FaPlus, FaTrash, FaEdit, FaBolt, FaChevronDown, FaChevronUp, FaDownload, FaUpload } from 'react-icons/fa';
import { GiGalaxy } from 'react-icons/gi';
import { useAppContext } from '../../contexts/useAppContext';
import { CURRENT_GAME_VERSION, ATTRIBUTE_TEMPLATES, UI_ICONS, NARRATIVE_STYLES, DEATH_PENALTY_LEVELS, WORLD_INTERRUPTION_LEVELS } from '../../constants';
import { REALM_TEMPLATES } from '../../data/realmTemplates';
import type { SaveSlot, FullMod, WorldCreationData, ModAttributeSystem, AttributeDefinition, AttributeGroupDefinition, NamedRealmSystem, GenerationMode, NarrativeStyle, DeathPenalty, WorldInterruptionFrequency, DataGenerationMode, ModNpc, ModLocation, Faction } from '../../types';
import LoadingScreen from '../../components/LoadingScreen';
import LoadingSpinner from '../../components/LoadingSpinner';
import AttributeEditorModal from '../../features/Mods/components/AttributeEditorModal';
import RealmEditorModal from '../../features/Mods/components/RealmEditorModal';
import NpcEditorModal from '../../features/Mods/components/NpcEditorModal';
import LocationEditorModal from '../../features/Mods/components/LocationEditorModal';
import FactionEditorModal from '../../features/Mods/components/FactionEditorModal';
import { streamWorldAnalysis } from '../../services/gemini/modding.service';

const GENRE_OPTIONS = [
    'Huyền Huyễn Tu Tiên',
    'Võ Hiệp Giang Hồ',
    'Khoa Huyễn Viễn Tưởng',
    'Kinh Dị Huyền Bí',
    'Đô Thị Dị Năng',
    'Hậu Tận Thế & Sinh Tồn',
    'Hệ Thống & Thăng Cấp (LitRPG)',
    'Cung Đấu & Gia Tộc',
    'Steampunk & Ma Thuật',
    'Thám Tử & Huyền Bí',
    'Triệu Hồi & Dưỡng Thú',
    'Lãng Mạn & Tình Duyên',
    'Hài Hước & Châm Biếm',
    'Lịch Sử & Dã Sử',
    'Phiêu Lưu & Khám Phá',
];

const GENRE_TO_ATTRIBUTE_TEMPLATE_MAP: Record<string, string> = {
    'Huyền Huyễn Tu Tiên': 'xianxia_default',
    'Võ Hiệp Giang Hồ': 'wuxia',
    'Khoa Huyễn Viễn Tưởng': 'cyberpunk',
    'Kinh Dị Huyền Bí': 'lovecraftian',
    'Đô Thị Dị Năng': 'cyberpunk',
    'Hậu Tận Thế & Sinh Tồn': 'post_apocalypse',
    'Hệ Thống & Thăng Cấp (LitRPG)': 'high_fantasy',
    'Cung Đấu & Gia Tộc': 'wuxia',
    'Steampunk & Ma Thuật': 'cyberpunk',
    'Thám Tử & Huyền Bí': 'lovecraftian',
    'Triệu Hồi & Dưỡng Thú': 'high_fantasy',
    'Lãng Mạn & Tình Duyên': 'wuxia',
    'Hài Hước & Châm Biếm': 'wuxia',
    'Lịch Sử & Dã Sử': 'high_fantasy',
    'Phiêu Lưu & Khám Phá': 'high_fantasy',
};

// --- Quick Create Modal ---
const QuickCreateModal: React.FC<{
    onClose: () => void;
    onGenerate: (description: string, characterName: string) => void;
}> = ({ onClose, onGenerate }) => {
    const [description, setDescription] = useState('');
    const [characterName, setCharacterName] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in" onClick={onClose}>
            <div className="p-6 rounded-xl w-full max-w-xl m-4" style={{backgroundColor: 'var(--bg-color)', boxShadow: 'var(--shadow-raised)'}} onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold font-title text-[var(--primary-accent-color)] mb-4">Tạo Nhanh Bằng AI</h3>
                <p className="text-sm text-[var(--text-muted-color)] mb-4">Chỉ cần mô tả ý tưởng cốt lõi và tên nhân vật. AI sẽ tự động tạo ra một thế giới hoàn chỉnh với thể loại, bối cảnh, hệ thống thuộc tính, hệ thống cảnh giới và chương mở đầu.</p>
                <input
                    value={characterName}
                    onChange={e => setCharacterName(e.target.value)}
                    className="input-neumorphic w-full mb-3"
                    placeholder="Nhập tên nhân vật chính của bạn..."
                />
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={5}
                    className="input-neumorphic w-full resize-y"
                    placeholder="VD: Một thế giới cyberpunk nơi tu sĩ cấy ghép linh hồn vào máy móc để trường sinh, các tập đoàn lớn là những tông môn mới, và 'linh khí' chính là dòng dữ liệu thuần khiết..."
                />
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="btn btn-neumorphic">Hủy</button>
                    <button onClick={() => onGenerate(description, characterName)} disabled={!characterName.trim() || !description.trim()} className="btn btn-primary">Bắt Đầu Sáng Tạo</button>
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
            <div className="p-6 rounded-xl w-full max-w-2xl m-4" style={{backgroundColor: 'var(--bg-color)', boxShadow: 'var(--shadow-raised)'}} onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold font-title text-[var(--primary-accent-color)] mb-4 text-center">Chọn Ô Lưu Trữ Trống</h3>
                {emptySlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                        {emptySlots.map(slot => (
                            <button
                                key={slot.id}
                                onClick={() => onSelect(slot.id)}
                                className="h-32 flex flex-col items-center justify-center text-center p-4 rounded-lg transition-colors btn-neumorphic"
                            >
                                <FaSave className="text-4xl text-[var(--text-muted-color)] mb-2"/>
                                <span className="font-bold">Ô {slot.id}</span>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-[var(--error-color)]">Không còn ô lưu trữ nào trống. Vui lòng xóa bớt một hành trình cũ để bắt đầu hành trình mới.</p>
                )}
            </div>
        </div>
    );
};

// --- Helper Components & Hooks for Interactive Creation ---
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const parsedContent = useMemo(() => {
        let html = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-2" style="color: var(--secondary-accent-color)">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-3" style="color: var(--primary-accent-color)">$1</h2>')
            .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
            .replace(/<\/li>\s*<li>/g, '</li><li>') // fix for multiple list items
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .replace(/\n/g, '<br />');
        return { __html: html };
    }, [content]);

    return <div className="prose prose-sm max-w-none prose-p:text-[var(--text-color)]" dangerouslySetInnerHTML={parsedContent} />;
};

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}


// --- Main World Creator Screen Component ---
const SaveSlotScreen: React.FC = () => {
  const { state, handleNavigate, handleCreateAndStartGame, handleQuickCreateAndStartGame } = useAppContext();
  const importInputRef = useRef<HTMLInputElement>(null);
  const scriptInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSlotModalOpen, setSlotModalOpen] = useState(false);
  const [isQuickCreateOpen, setQuickCreateOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustomGenreInput, setShowCustomGenreInput] = useState(false);

  // State for Interactive Creation
  const [mirrorContent, setMirrorContent] = useState('');
  const [isMirrorLoading, setIsMirrorLoading] = useState(false);


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
    dlcs: [],
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

  // --- Effect for Interactive Creation Mirror ---
  const debouncedSetting = useDebounce(formData.setting, 1000); // 1-second debounce

  useEffect(() => {
    if (!debouncedSetting || debouncedSetting.length < 50) {
        setMirrorContent('');
        return;
    }

    // Abort previous stream if a new one starts
    const abortController = new AbortController();
    
    const streamAnalysis = async () => {
        setIsMirrorLoading(true);
        setMirrorContent('');
        try {
            const stream = streamWorldAnalysis(debouncedSetting, state.settings);
            for await (const chunk of stream) {
                if (abortController.signal.aborted) break;
                setMirrorContent(prev => prev + chunk);
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                console.error("Error streaming world analysis:", error);
                setMirrorContent('Lỗi kết nối đến Thiên Cơ Kính. Vui lòng thử lại.');
            }
        } finally {
            setIsMirrorLoading(false);
        }
    };

    streamAnalysis();
    
    return () => {
        abortController.abort();
    };
}, [debouncedSetting, state.settings]);

  const handleAddDlc = () => {
    setFormData(p => ({ ...p, dlcs: [...(p.dlcs || []), { title: '', content: '' }] }));
  };

  const handleDlcChange = (index: number, field: 'title' | 'content', value: string) => {
    setFormData(p => {
        const newDlcs = [...(p.dlcs || [])];
        newDlcs[index] = { ...newDlcs[index], [field]: value };
        return { ...p, dlcs: newDlcs };
    });
  };

  const handleDeleteDlc = (index: number) => {
    if (window.confirm("Bạn có chắc muốn xóa DLC này?")) {
        setFormData(p => ({ ...p, dlcs: (p.dlcs || []).filter((_, i) => i !== index) }));
    }
  };

  const handleGenreSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    if (value === 'custom') {
        setShowCustomGenreInput(true);
        setFormData(p => ({
            ...p,
            genre: '', // Clear genre to be typed in
            attributeSystem: ATTRIBUTE_TEMPLATES.find(t => t.id === 'xianxia_default')!.system
        }));
    } else {
        setShowCustomGenreInput(false);
        const templateId = GENRE_TO_ATTRIBUTE_TEMPLATE_MAP[value] || 'xianxia_default';
        const template = ATTRIBUTE_TEMPLATES.find(t => t.id === templateId);
        setFormData(p => ({
            ...p,
            genre: value,
            attributeSystem: template ? template.system : p.attributeSystem
        }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name.startsWith('character.')) {
        const charField = name.split('.')[1];
        setFormData(p => ({ ...p, character: { ...p.character, [charField]: value } }));
    } else if (name === 'genre') { // This now only handles the custom genre text input
        setFormData(p => ({ ...p, genre: value }));
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
    if (!formData.genre.trim()) {
        setError("Vui lòng nhập thể loại cho thế giới của bạn.");
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

    const handleExportTemplate = () => {
        try {
            const templateData = { ...formData, importedMod: formData.importedMod ? { modInfo: formData.importedMod.modInfo } : null };
            const jsonString = JSON.stringify(templateData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            link.href = url;
            link.download = `tamthienthegioi_template_${timestamp}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            setError(`Lỗi khi xuất mẫu: ${err.message}`);
        }
    };
    
    const handleImportScript = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        alert(`Tính năng nhập script [${file.name}] sẽ được hỗ trợ trong tương lai!`);
        if (event.target) {
            event.target.value = "";
        }
    };


  if (isLoading) {
      // FIX: Use dynamic generationMode for LoadingScreen
      const mode = quickCreateInfo ? 'fast' : formData.generationMode;
      return <LoadingScreen message={loadingMessage} isGeneratingWorld={true} generationMode={mode}/>;
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
        
        <div className="p-4 bg-teal-900/30 border border-teal-500/50 rounded-lg mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button onClick={() => setQuickCreateOpen(true)} className="flex items-center justify-center gap-3 px-4 py-3 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 text-lg">
                    <FaBolt /> Tạo Nhanh Bằng AI
                </button>
                <button onClick={() => importInputRef.current?.click()} className="flex items-center justify-center gap-3 px-4 py-3 bg-sky-700/80 text-white font-bold rounded-lg hover:bg-sky-600/80 text-lg">
                    <FaFileUpload /> Nhập World Data (.json)
                </button>
                <button onClick={handleExportTemplate} className="flex items-center justify-center gap-3 px-4 py-3 bg-green-700/80 text-white font-bold rounded-lg hover:bg-green-600/80 text-lg">
                    <FaDownload /> Xuất Mẫu
                </button>
                <button onClick={() => scriptInputRef.current?.click()} className="flex items-center justify-center gap-3 px-4 py-3 bg-purple-700/80 text-white font-bold rounded-lg hover:bg-purple-600/80 text-lg">
                    <FaUpload /> Nhập Script
                </button>
            </div>
            <input
                type="file"
                ref={importInputRef}
                onChange={handleFileImport}
                className="hidden"
                accept=".json"
            />
            <input
                type="file"
                ref={scriptInputRef}
                onChange={handleImportScript}
                className="hidden"
                accept=".js,.json"
            />
        </div>
      
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-grow min-h-0">
            {/* Left Column: Form */}
            <div className="flex-grow min-h-0 overflow-y-auto pr-2 space-y-6">
                {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30">{error}</p>}
                
                <Section title="1. Hồn Của Thế Giới">
                    <Field label="Thể Loại" description="Quyết định văn phong và không khí chính của câu chuyện. Sẽ tự động chọn một mẫu thuộc tính phù hợp.">
                        <select name="genre-select" value={showCustomGenreInput ? 'custom' : formData.genre} onChange={handleGenreSelectChange} className="input-neumorphic">
                            {GENRE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            <option value="custom">Tự Định Nghĩa...</option>
                        </select>
                        {showCustomGenreInput && (
                            <input
                                name="genre"
                                value={formData.genre}
                                onChange={handleInputChange}
                                className="input-neumorphic mt-2"
                                placeholder="Nhập thể loại của bạn..."
                                autoFocus
                            />
                        )}
                    </Field>
                    <Field label="Ý Tưởng Cốt Lõi (Core Idea)" description="Mô tả ý tưởng chính về thế giới của bạn. Thiên Cơ Kính sẽ phân tích và đưa ra gợi ý dựa trên nội dung này.">
                        <textarea name="setting" value={formData.setting} onChange={handleInputChange} rows={8} className="input-neumorphic resize-y" placeholder="VD: Một thế giới cyberpunk nơi tu sĩ cấy ghép linh hồn vào máy móc để trường sinh, các tập đoàn lớn là những tông môn mới, và 'linh khí' chính là dòng dữ liệu thuần khiết..."/>
                    </Field>
                    <Field label="Chủ Đề (Cụ thể hơn)" description="Giúp AI tập trung vào một khía cạnh cụ thể trong thể loại bạn chọn.">
                        <input name="theme" value={formData.theme} onChange={handleInputChange} className="input-neumorphic" placeholder="VD: Ngôi nhà ma ám, Lời nguyền rồng, Tu tiên độ kiếp..."/>
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
                            <Field label="DLC (Mở Rộng AI)" description="Thêm các đoạn văn bản mở rộng để AI sử dụng làm lore hoặc quy tắc khi tạo thế giới và tường thuật.">
                                <div className="space-y-3">
                                    {(formData.dlcs || []).map((dlc, index) => (
                                        <div key={index} className="neumorphic-inset-box p-3 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    value={dlc.title}
                                                    onChange={(e) => handleDlcChange(index, 'title', e.target.value)}
                                                    className="input-neumorphic !py-1 flex-grow"
                                                    placeholder={`Tiêu đề DLC ${index + 1}`}
                                                />
                                                <button onClick={() => handleDeleteDlc(index)} className="p-2 text-[var(--text-muted-color)] hover:text-red-400">
                                                    <FaTrash />
                                                </button>
                                            </div>
                                            <textarea
                                                value={dlc.content}
                                                onChange={(e) => handleDlcChange(index, 'content', e.target.value)}
                                                rows={4}
                                                className="input-neumorphic w-full resize-y"
                                                placeholder="Dán nội dung lore, quy tắc, hoặc bối cảnh vào đây..."
                                            />
                                        </div>
                                    ))}
                                    <button onClick={handleAddDlc} className="w-full mt-2 text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-2 bg-cyan-900/30 rounded">
                                        <FaPlus /> Thêm DLC
                                    </button>
                                </div>
                            </Field>
                        </div>
                    )}
                </Section>

                <Section title="3. Hệ Thống Cảnh Giới & Thuộc Tính">
                    <Field label="Bật Hệ Thống Cảnh Giới" description="Bật hoặc tắt hệ thống tu luyện/cấp bậc cho thế giới.">
                        <button onClick={() => setFormData(p => ({ ...p, enableRealmSystem: !p.enableRealmSystem }))} className="flex items-center gap-2" style={{color: 'var(--text-color)'}}>
                            {formData.enableRealmSystem ? <FaToggleOn className="text-green-400 text-2xl"/> : <FaToggleOff className="text-2xl"/>}
                            <span>{formData.enableRealmSystem ? 'Đang Bật' : 'Đang Tắt'}</span>
                        </button>
                    </Field>
                    <Field label="Mẫu Hệ Thống Cảnh Giới" description="Chọn một mẫu có sẵn hoặc tùy chỉnh để định hình con đường sức mạnh." disabled={!formData.enableRealmSystem}>
                        <div className="flex gap-2">
                            <select name="realmTemplateId" value={formData.realmTemplateId} onChange={e => handleRealmTemplateChange(e.target.value)} className="input-neumorphic flex-grow" disabled={!formData.enableRealmSystem}>
                                {REALM_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                            <button onClick={() => setRealmEditorOpen(true)} className="btn btn-neumorphic" disabled={!formData.enableRealmSystem}><FaEdit /></button>
                        </div>
                    </Field>
                    <Field label="Hệ Thống Thuộc Tính" description="Chọn mẫu thuộc tính phù hợp với thể loại hoặc tạo hệ thống của riêng bạn.">
                        <div className="flex gap-2">
                            <select onChange={(e) => handleTemplateChange(e.target.value)} className="input-neumorphic flex-grow">
                                {ATTRIBUTE_TEMPLATES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="mt-4 p-2 rounded-lg" style={{boxShadow: 'var(--shadow-pressed)'}}>
                            <h4 className="text-sm font-bold mb-2 text-center" style={{color: 'var(--text-muted-color)'}}>Các Thuộc Tính Hiện Tại</h4>
                            <div className="max-h-48 overflow-y-auto pr-2 text-xs grid grid-cols-2 gap-x-4">
                                {formData.attributeSystem?.definitions.map(attr => (
                                    <div key={attr.id} className="flex items-center justify-between py-1 border-b" style={{borderColor: 'var(--shadow-dark)'}}>
                                        <span className="flex items-center gap-1">
                                            {React.createElement(UI_ICONS[attr.iconName] || FaBolt, { className: 'text-[var(--secondary-accent-color)]'})}
                                            <span style={{color: 'var(--text-color)'}}>{attr.name}</span>
                                        </span>
                                        <div className="flex items-center gap-2">
                                             <button onClick={() => { const group = formData.attributeSystem?.groups.find(g => g.id === attr.group); if(group) handleOpenAttributeModal(group, attr); }} className="p-1 opacity-50 hover:opacity-100"><FaEdit /></button>
                                             <button onClick={() => handleDeleteAttribute(attr.id)} className="p-1 opacity-50 hover:opacity-100 text-red-400"><FaTrash /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                             <button onClick={() => { const group = formData.attributeSystem?.groups[0]; if(group) handleOpenAttributeModal(group, null); }} className="w-full mt-2 text-xs text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded">
                                <FaPlus /> Thêm Thuộc Tính Mới
                            </button>
                        </div>
                    </Field>
                </Section>
                 <Section title="4. Tạo Nhân Vật Chính">
                    <Field label="Tên Nhân Vật Chính" description="Tên gọi sẽ đồng hành cùng bạn trong suốt hành trình.">
                        <input name="character.name" value={formData.character.name} onChange={handleInputChange} className="input-neumorphic" placeholder="Nhập tên nhân vật..."/>
                    </Field>
                    <Field label="Giới Tính" description="Chọn giới tính cho nhân vật hoặc để AI tự quyết định.">
                        <select name="character.gender" value={formData.character.gender} onChange={handleInputChange} className="input-neumorphic">
                            <option value="AI">Để AI quyết định</option>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                        </select>
                    </Field>
                    <Field label="Ý tưởng Ngoại hình/Tiểu sử" description="Mô tả sơ lược, AI sẽ dựa vào đây để tạo ra một câu chuyện nền có chiều sâu hơn.">
                        <textarea name="character.bio" value={formData.character.bio} onChange={handleInputChange} rows={3} className="input-neumorphic resize-y" placeholder="VD: Một thiếu niên có mái tóc bạch kim và đôi mắt màu hổ phách, mang trong mình một bí mật động trời..."/>
                    </Field>
                </Section>
                 <Section title="5. Dữ Liệu Thế Giới">
                    <Field label="Phe Phái (Factions)" description="Chọn cách tạo ra các phe phái trong thế giới.">
                        <select name="factionGenerationMode" value={formData.factionGenerationMode} onChange={handleDataGenModeChange} className="input-neumorphic">
                            <option value="AI">AI Tự Động Tạo</option>
                            <option value="CUSTOM">Tự Định Nghĩa</option>
                            <option value="NONE">Không có Phe Phái</option>
                        </select>
                        {formData.factionGenerationMode === 'CUSTOM' && (
                            <div className="mt-3 p-2 rounded-lg space-y-2" style={{boxShadow: 'var(--shadow-pressed)'}}>
                                {formData.customFactions.map((faction, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 rounded bg-black/20">
                                        <span className="font-semibold text-sm">{faction.name}</span>
                                        <div>
                                            <button onClick={() => { setEditingFaction(faction); setFactionModalOpen(true); }} className="p-1 text-[var(--text-muted-color)] hover:text-white"><FaEdit /></button>
                                            <button onClick={() => handleDeleteFaction(faction.name)} className="p-1 text-[var(--text-muted-color)] hover:text-red-400"><FaTrash /></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => { setEditingFaction(null); setFactionModalOpen(true); }} className="w-full text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-2 bg-cyan-900/30 rounded">
                                    <FaPlus /> Thêm Phe Phái
                                </button>
                            </div>
                        )}
                    </Field>
                    <Field label="Địa Điểm (Locations)" description="Chọn cách tạo ra các địa điểm khởi đầu trong thế giới.">
                        <select name="locationGenerationMode" value={formData.locationGenerationMode} onChange={handleDataGenModeChange} className="input-neumorphic">
                            <option value="AI">AI Tự Động Tạo</option>
                            <option value="CUSTOM">Tự Định Nghĩa</option>
                            <option value="NONE">Không có Địa Điểm</option>
                        </select>
                        {formData.locationGenerationMode === 'CUSTOM' && (
                            <div className="mt-3 p-2 rounded-lg space-y-2" style={{boxShadow: 'var(--shadow-pressed)'}}>
                                {formData.customLocations.map((loc, index) => (
                                    <div key={index} className="flex justify-between items-center p-2 rounded bg-black/20">
                                        <span className="font-semibold text-sm">{loc.name}</span>
                                        <div>
                                            <button onClick={() => { setEditingLocation(loc); setLocationModalOpen(true); }} className="p-1 text-[var(--text-muted-color)] hover:text-white"><FaEdit /></button>
                                            <button onClick={() => handleDeleteLocation(loc.id)} className="p-1 text-[var(--text-muted-color)] hover:text-red-400"><FaTrash /></button>
                                        </div>
                                    </div>
                                ))}
                                 <button onClick={() => { setEditingLocation(null); setLocationModalOpen(true); }} className="w-full text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-2 bg-cyan-900/30 rounded">
                                    <FaPlus /> Thêm Địa Điểm
                                </button>
                            </div>
                        )}
                    </Field>
                    <Field label="Nhân Vật (NPCs)" description="Chọn cách tạo ra các NPC khởi đầu trong thế giới.">
                        <select name="npcGenerationMode" value={formData.npcGenerationMode} onChange={handleDataGenModeChange} className="input-neumorphic">
                            <option value="AI">AI Tự Động Tạo</option>
                            <option value="CUSTOM">Tự Định Nghĩa</option>
                            <option value="NONE">Không có NPC</option>
                        </select>
                        {formData.npcGenerationMode === 'CUSTOM' && (
                            <div className="mt-3 p-2 rounded-lg space-y-2" style={{boxShadow: 'var(--shadow-pressed)'}}>
                                {formData.customNpcs.map((npc, index) => (
                                     <div key={index} className="flex justify-between items-center p-2 rounded bg-black/20">
                                        <span className="font-semibold text-sm">{npc.name}</span>
                                        <div>
                                            <button onClick={() => { setEditingNpc(npc); setNpcModalOpen(true); }} className="p-1 text-[var(--text-muted-color)] hover:text-white"><FaEdit /></button>
                                            <button onClick={() => handleDeleteNpc(npc.id)} className="p-1 text-[var(--text-muted-color)] hover:text-red-400"><FaTrash /></button>
                                        </div>
                                    </div>
                                ))}
                                <button onClick={() => { setEditingNpc(null); setNpcModalOpen(true); }} className="w-full text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-2 bg-cyan-900/30 rounded">
                                    <FaPlus /> Thêm NPC
                                </button>
                            </div>
                        )}
                    </Field>
                </Section>
            </div>
            
            {/* Right Column: Thien Co Kinh */}
            <div className="hidden lg:flex flex-col h-full">
                <div className="neumorphic-inset-box p-4 flex-grow flex flex-col min-h-0">
                    <h3 className="text-xl font-bold font-title text-center mb-4 flex items-center justify-center gap-2" style={{color: 'var(--primary-accent-color)'}}>
                        <GiGalaxy /> Thiên Cơ Kính
                    </h3>
                    <div className="overflow-y-auto pr-2 flex-grow">
                        {isMirrorLoading && mirrorContent === '' ? (
                            <div className="flex items-center justify-center h-full">
                                <LoadingSpinner message="Thiên Cơ đang suy diễn..." />
                            </div>
                        ) : mirrorContent ? (
                            <MarkdownRenderer content={mirrorContent} />
                        ) : (
                            <div className="text-center text-[var(--text-muted-color)] pt-16">
                                <p>Hãy mô tả ý tưởng thế giới của bạn vào ô "Ý Tưởng Cốt Lõi" bên trái (khoảng 50 ký tự trở lên).</p>
                                <p className="mt-2 text-sm">Thiên Cơ Kính sẽ phân tích và đưa ra gợi ý theo thời gian thực để giúp bạn xây dựng một thế giới có chiều sâu.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
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