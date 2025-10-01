import React, { useState, useRef, useEffect } from 'react';
import { FaArrowLeft, FaFileUpload, FaBrain, FaToggleOn, FaToggleOff, FaSave, FaPlus, FaTrash, FaEdit, FaBolt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useAppContext } from '../../contexts/AppContext';
import { CURRENT_GAME_VERSION, ATTRIBUTE_TEMPLATES, UI_ICONS, NARRATIVE_STYLES, DEATH_PENALTY_LEVELS, WORLD_INTERRUPTION_LEVELS } from '../../constants';
import { REALM_TEMPLATES } from '../../data/realmTemplates';
import type { SaveSlot, FullMod, WorldCreationData, ModAttributeSystem, AttributeDefinition, AttributeGroupDefinition, NamedRealmSystem, GenerationMode, NarrativeStyle, DeathPenalty, WorldInterruptionFrequency } from '../../types';
import LoadingScreen from '../../components/LoadingScreen';
import AttributeEditorModal from '../../features/Mods/components/AttributeEditorModal';
import RealmEditorModal from '../../features/Mods/components/RealmEditorModal';
import { generateWorldFromText } from '../../services/gemini/modding.service';

// --- Quick Create Modal ---
const QuickCreateModal: React.FC<{
    onClose: () => void;
    onGenerate: (description: string) => void;
}> = ({ onClose, onGenerate }) => {
    const [description, setDescription] = useState('');
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in" onClick={onClose}>
            <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-xl m-4 p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold font-title text-amber-300 mb-4">Tạo Nhanh Bằng AI</h3>
                <p className="text-sm text-gray-400 mb-4">Chỉ cần mô tả ý tưởng cốt lõi của bạn. AI sẽ tự động tạo ra một thế giới hoàn chỉnh với thể loại, bối cảnh, hệ thống thuộc tính, và hệ thống cảnh giới phù hợp.</p>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={5}
                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 resize-y"
                    placeholder="VD: Một thế giới cyberpunk nơi tu sĩ cấy ghép linh hồn vào máy móc để trường sinh, các tập đoàn lớn là những tông môn mới, và 'linh khí' chính là dòng dữ liệu thuần khiết..."
                />
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Hủy</button>
                    <button onClick={() => onGenerate(description)} className="px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500">Bắt Đầu Sáng Tạo</button>
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
  const { state, handleNavigate, handleCreateAndStartGame } = useAppContext();
  const importInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSlotModalOpen, setSlotModalOpen] = useState(false);
  const [isQuickCreateOpen, setQuickCreateOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<AttributeDefinition | null>(null);
  const [editingGroup, setEditingGroup] = useState<AttributeGroupDefinition | null>(null);
  
  const [isRealmEditorOpen, setRealmEditorOpen] = useState(false);

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
    // FIX: Add missing generationMode to satisfy the GameStartData type requirement in AppContext.
    generationMode: 'deep',
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
  };
  
  const handleStartCreation = () => {
    if (!formData.character.name.trim()) {
        setError("Vui lòng nhập tên nhân vật chính.");
        return;
    }
    setError(null);
    setSlotModalOpen(true);
  };

  const handleSlotSelected = async (slotId: number) => {
    setSlotModalOpen(false);
    setIsLoading(true);
    setLoadingMessage("Đấng Sáng Thế đang kiến tạo vũ trụ của bạn...");
    try {
        await handleCreateAndStartGame(formData, slotId);
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

    const handleQuickGenerate = async (description: string) => {
        setQuickCreateOpen(false);
        setIsLoading(true);
        setLoadingMessage("AI đang phân tích ý tưởng của bạn...");
        setError(null);
        try {
            // FIX: Call the correct function `generateWorldFromText` instead of `generateWorldFromPrompts`.
            const result: FullMod = await generateWorldFromText(description, 'deep');
            // FIX: Extract properties from the returned FullMod object structure.
            setFormData(prev => ({
                ...prev,
                genre: result.modInfo.tags?.[0] || prev.genre,
                theme: result.modInfo.name || '',
                setting: result.modInfo.description || result.content.worldData?.[0]?.description || '',
                attributeSystem: result.content.attributeSystem || prev.attributeSystem,
                namedRealmSystem: result.content.namedRealmSystems?.[0] || prev.namedRealmSystem,
                enableRealmSystem: !!(result.content.namedRealmSystems && result.content.namedRealmSystems.length > 0),
                realmTemplateId: 'custom',
            }));
        } catch (err: any) {
            setError(`Lỗi tạo nhanh: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };
  
  if (isLoading) {
      return <LoadingScreen message={loadingMessage} isGeneratingWorld={true} />;
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
        
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-3xl font-bold font-title">Kiến Tạo Thế Giới</h2>
            <button onClick={() => handleNavigate('mainMenu')} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50" title="Quay Lại Menu">
                <FaArrowLeft className="w-5 h-5" />
            </button>
        </div>
        
        <div className="p-4 bg-teal-900/30 border border-teal-500/50 rounded-lg mb-6 text-center">
            <button onClick={() => setQuickCreateOpen(true)} className="w-full flex items-center justify-center gap-3 px-4 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 text-lg">
                <FaBolt /> Tạo Nhanh Bằng AI (Chỉ cần mô tả)
            </button>
        </div>
      
        <div className="flex-grow min-h-0 overflow-y-auto pr-2 space-y-6">
            {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30">{error}</p>}
            
            <Section title="1. Hồn Của Thế Giới">
                <Field label="Thể Loại" description="Quyết định văn phong và không khí chính của câu chuyện. Sẽ tự động chọn một mẫu thuộc tính phù hợp.">
                    <select name="genre" value={formData.genre} onChange={handleInputChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2">
                        <option>Huyền Huyễn Tu Tiên</option>
                        <option>Võ Hiệp Giang Hồ</option>
                        <option>Khoa Huyễn Viễn Tưởng</option>
                        <option>Kinh Dị Huyền Bí</option>
                        <option>Đô Thị Dị Năng</option>
                    </select>
                </Field>
                <Field label="Chủ Đề (Cụ thể hơn)" description="Giúp AI tập trung vào một khía cạnh cụ thể trong thể loại bạn chọn.">
                    <input name="theme" value={formData.theme} onChange={handleInputChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2" placeholder="VD: Ngôi nhà ma ám, Lời nguyền rồng, Tu tiên độ kiếp..."/>
                </Field>
                <Field label="Bối Cảnh (Thế giới/Môi trường)" description="Mô tả nơi câu chuyện sẽ diễn ra.">
                    <textarea name="setting" value={formData.setting} onChange={handleInputChange} rows={3} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 resize-y" placeholder="VD: Thành phố bỏ hoang sau đại dịch, Vương quốc Eldoria huyền bí, Tam Giới hỗn loạn..."/>
                </Field>
            </Section>

             <Section title="2. Cài Đặt Sáng Thế Nâng Cao">
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex justify-between items-center px-4 py-3 bg-black/30 border border-gray-600 rounded-lg text-left text-gray-200 hover:bg-black/40">
                    <span className="font-semibold">Tùy Chỉnh Lối Chơi & AI</span>
                    {showAdvanced ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                 {showAdvanced && (
                    <div className="p-4 space-y-4 border-t border-gray-600/50 animate-fade-in">
                        <Field label="Phong Cách Tường Thuật" description="Chọn văn phong và giọng điệu cho AI kể chuyện.">
                             <select name="narrativeStyle" value={formData.narrativeStyle} onChange={e => setFormData(p => ({ ...p, narrativeStyle: e.target.value as NarrativeStyle }))} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2">
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
                            <select name="worldInterruptionFrequency" value={formData.worldInterruptionFrequency} onChange={e => setFormData(p => ({ ...p, worldInterruptionFrequency: e.target.value as WorldInterruptionFrequency }))} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2">
                                {WORLD_INTERRUPTION_LEVELS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </Field>
                         <Field label="Hình Phạt Khi Tử Vong" description="Chọn hình phạt sẽ xảy ra khi nhân vật của bạn chết.">
                             <select name="deathPenalty" value={formData.deathPenalty} onChange={e => setFormData(p => ({ ...p, deathPenalty: e.target.value as DeathPenalty }))} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2">
                                {DEATH_PENALTY_LEVELS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </Field>
                        <Field label="Bật Cơ Chế Sinh Tồn" description="Bật hoặc tắt nhu cầu về đói, khát.">
                             <button onClick={() => setFormData(p => ({ ...p, enableSurvivalMechanics: !p.enableSurvivalMechanics }))} className="flex items-center gap-2 text-gray-300">
                                {formData.enableSurvivalMechanics ? <FaToggleOn className="text-green-400 text-2xl"/> : <FaToggleOff className="text-2xl"/>}
                                <span>Bật đói và khát</span>
                            </button>
                        </Field>
                    </div>
                 )}
            </Section>

            <Section title="3. Hệ Thống Cảnh Giới & Thuộc Tính">
                 <Field label="Hệ thống Cảnh giới" description="Thế giới của bạn có hệ thống cấp bậc, tu luyện, hay sức mạnh không?">
                    <button onClick={() => setFormData(p => ({ ...p, enableRealmSystem: !p.enableRealmSystem }))} className="flex items-center gap-2 text-gray-300">
                        {formData.enableRealmSystem ? <FaToggleOn className="text-green-400 text-2xl"/> : <FaToggleOff className="text-2xl"/>}
                        <span>{formData.enableRealmSystem ? 'Đang Bật' : 'Đang Tắt'}</span>
                    </button>
                </Field>
                 {formData.enableRealmSystem && (
                     <Field label="Chọn Mẫu Cảnh Giới" description="Bắt đầu với một hệ thống có sẵn hoặc tự tạo.">
                        <div className="flex items-center gap-2">
                           <select value={formData.realmTemplateId} onChange={e => handleRealmTemplateChange(e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2">
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
                    <select onChange={e => handleTemplateChange(e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2">
                        {ATTRIBUTE_TEMPLATES.map(template => (
                            <option key={template.id} value={template.id}>{template.name} - {template.description}</option>
                        ))}
                    </select>
                </Field>
                {formData.attributeSystem?.groups.map(group => (
                    <div key={group.id} className="p-3 bg-black/30 rounded-lg border border-gray-800">
                        <h4 className="font-bold text-lg text-amber-300">{group.name}</h4>
                        <div className="mt-2 space-y-2">
                            {formData.attributeSystem.definitions.filter(def => def.group === group.id).map(def => (
                                <div key={def.id} className="flex justify-between items-center p-2 bg-black/20 rounded">
                                    <div className="flex items-center gap-2">
                                        {React.createElement(UI_ICONS[def.iconName] || 'span', { className: 'text-cyan-300' })}
                                        <span className="text-sm font-semibold text-gray-300">{def.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleOpenAttributeModal(group, def)} className="p-1 text-gray-400 hover:text-white"><FaEdit /></button>
                                        <button onClick={() => handleDeleteAttribute(def.id)} className="p-1 text-gray-400 hover:text-red-400"><FaTrash /></button>
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
                    <input name="character.name" value={formData.character.name} onChange={handleInputChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2"/>
                </Field>
                <Field label="Giới Tính" description="">
                     <select name="character.gender" value={formData.character.gender} onChange={handleInputChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2">
                        <option value="AI">Để AI quyết định</option>
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                    </select>
                </Field>
                <Field label="Sơ Lược Tiểu Sử/Đặc Điểm (2-3 câu)" description="Cung cấp cho AI một vài ý tưởng về nhân vật của bạn.">
                    <textarea name="character.bio" value={formData.character.bio} onChange={handleInputChange} rows={3} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 resize-y" placeholder="VD: Một thám tử tư nghiện cà phê với quá khứ bí ẩn, một đệ tử ngoại môn vô danh tình cờ nhặt được bí kíp..."/>
                </Field>
            </Section>
        </div>

        <div className="flex-shrink-0 mt-6 pt-4 border-t border-gray-700/60 flex justify-center">
            <button onClick={handleStartCreation} className="px-8 py-3 text-xl font-bold rounded-lg bg-[var(--button-primary-bg)] text-[var(--primary-accent-text-color)] border border-[var(--button-primary-border)] font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--button-primary-hover-bg)] hover:-translate-y-0.5 shadow-md shadow-black/30 flex items-center gap-3">
                <FaBrain /> Bắt Đầu Sáng Thế
            </button>
        </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-black/20 p-4 rounded-lg border border-gray-700/60">
        <h3 className="text-xl font-bold font-title text-amber-300 mb-4">{title}</h3>
        <div className="space-y-4">{children}</div>
    </div>
);

const Field: React.FC<{ label: string; description: string; children: React.ReactNode; disabled?: boolean }> = ({ label, description, children, disabled }) => (
    <div className={disabled ? 'opacity-50' : ''}>
        <label className="block font-semibold text-gray-300">{label}</label>
        <p className="text-sm text-gray-500 mb-2">{description}</p>
        {children}
    </div>
);


export default SaveSlotScreen;