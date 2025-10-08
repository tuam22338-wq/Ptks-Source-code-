import React, { useState, useRef, useEffect, useMemo } from 'react';
import { FaArrowLeft, FaFileUpload, FaBrain, FaToggleOn, FaToggleOff, FaSave, FaPlus, FaTrash, FaEdit, FaBolt, FaChevronDown, FaChevronUp, FaDownload, FaUpload } from 'react-icons/fa';
import { useAppContext } from '../../contexts/AppContext';
import { CURRENT_GAME_VERSION, ATTRIBUTE_TEMPLATES, UI_ICONS, NARRATIVE_STYLES, DEATH_PENALTY_LEVELS, WORLD_INTERRUPTION_LEVELS } from '../../constants';
// @google-genai-fix: Correctly import 'PROGRESSION_TEMPLATES' instead of the obsolete 'REALM_TEMPLATES'.
import { PROGRESSION_TEMPLATES as REALM_TEMPLATES } from '../../data/progressionTemplates';
import { STORY_TEMPLATES } from '../../data/storyTemplates';
// @google-genai-fix: Correctly import 'NamedProgressionSystem' instead of the obsolete 'NamedRealmSystem'.
import type { SaveSlot, FullMod, WorldCreationData, ModAttributeSystem, AttributeDefinition, AttributeGroupDefinition, NamedProgressionSystem, GenerationMode, NarrativeStyle, DeathPenalty, WorldInterruptionFrequency, DataGenerationMode, ModNpc, ModLocation, Faction } from '../../types';
import LoadingScreen from '../../components/LoadingScreen';
import AttributeEditorModal from '../../features/Mods/components/AttributeEditorModal';
import RealmEditorModal from '../../features/Mods/components/RealmEditorModal';
import NpcEditorModal from '../../features/Mods/components/NpcEditorModal';
import LocationEditorModal from '../../features/Mods/components/LocationEditorModal';
import FactionEditorModal from '../../features/Mods/components/FactionEditorModal';
import { generateWorldFromText, summarizeLargeTextForWorldGen, fixModStructure } from '../../services/gemini/modding.service';

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

const extractTextFromPdf = async (file: File): Promise<string> => {
    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) throw new Error("Thư viện PDF chưa được tải.");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map((item: any) => item.str).join(' ');
        textContent += '\n\n';
    }
    return textContent;
};


// --- Main World Creator Screen Component ---
const SaveSlotScreen: React.FC = () => {
  const { state, handleNavigate, handleCreateAndStartGame, handleQuickCreateAndStartGame } = useAppContext();
  const importInputRef = useRef<HTMLInputElement>(null);
  const textFileInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSlotModalOpen, setSlotModalOpen] = useState(false);
  const [isQuickCreateOpen, setQuickCreateOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showCustomGenreInput, setShowCustomGenreInput] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('sandbox');


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
    enableStorySystem: true,
    // @google-genai-fix: Rename 'realmTemplateId' to 'progressionTemplateId' to match the updated type definition.
    progressionTemplateId: 'xianxia_default',
    // @google-genai-fix: Rename 'namedRealmSystem' to 'namedProgressionSystem' to match the updated type definition.
    namedProgressionSystem: REALM_TEMPLATES.find(t => t.id === 'xianxia_default')!.system,
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

  const filteredTemplates = useMemo(() => {
    return STORY_TEMPLATES.filter(t => t.genre === formData.genre);
  }, [formData.genre]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const templateId = e.target.value;
      setSelectedTemplateId(templateId);

      if (templateId === 'sandbox') {
          setFormData(p => ({
              ...p,
              mainGoal: '',
              openingStory: '',
          }));
      } else {
          const template = STORY_TEMPLATES.find(t => t.id === templateId);
          if (template) {
              setFormData(p => ({
                  ...p,
                  mainGoal: template.mainGoal,
                  openingStory: template.openingStory,
              }));
          }
      }
  };

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
    setSelectedTemplateId('sandbox'); // Reset template selection on genre change
    setFormData(p => ({ ...p, mainGoal: '', openingStory: '' })); // Clear story fields
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
        setFormData(p => ({ ...p, character: { ...p