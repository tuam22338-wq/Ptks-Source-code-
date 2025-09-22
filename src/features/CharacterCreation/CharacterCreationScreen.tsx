
import React, { useState, useCallback, useEffect, memo, useMemo } from 'react';
import type { CharacterIdentity, NpcDensity, Gender, GameDate, FullMod, StatBonus, DanhVong, DifficultyLevel, SpiritualRoot, GameMode, WorldlyBackground, TransmigratorLegacy, FormativeEvent, FormativeEventChoice } from '../../types';
import { FaArrowLeft, FaDesktop, FaDiceD20 } from 'react-icons/fa';
import { GiGalaxy, GiPerson, GiScrollQuill, GiStairsGoal, GiSparkles } from "react-icons/gi";
import Timeline from '../../components/Timeline';
import { generateCharacterIdentity, generateFormativeEvent } from '../../services/geminiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import CharacterIdentityDisplay from './components/CharacterIdentityDisplay';
import { SHICHEN_LIST, PT_MAJOR_EVENTS, JTTW_MAJOR_EVENTS, DIFFICULTY_LEVELS, NPC_DENSITY_LEVELS, WORLDLY_BACKGROUNDS, TRANSMIGRATOR_LEGACIES, PT_NPC_LIST } from '../../constants';
import * as db from '../../services/dbService';
import { useAppContext } from '../../contexts/AppContext';
import SpiritualRootSelection from './components/SpiritualRootSelection';

interface PlayableCharacterTemplate {
  id: string;
  source: 'canon' | 'mod';
  identity: Omit<CharacterIdentity, 'age'>;
  bonuses: StatBonus[];
  spiritualRoot: SpiritualRoot;
}

type CreationStep = 'origin' | 'details' | 'formativeEvent' | 'awakening' | 'summary' | 'generating';
type CreationGameMode = 'worldly' | 'transmigrator' | 'incarnation';

const GENDERS: Gender[] = ['Nam', 'Nữ'];

const NpcDensitySelector: React.FC<{ value: NpcDensity, onChange: (value: NpcDensity) => void }> = ({ value, onChange }) => (
    <div>
        <p className="text-lg font-bold font-title text-center mb-2" style={{color: 'var(--text-muted-color)'}}>Mật độ Chúng Sinh</p>
        <div className="themed-button-group">
            {NPC_DENSITY_LEVELS.map(level => (
                <button key={level.id} onClick={() => onChange(level.id)} title={level.description} className={`${value === level.id ? 'active' : ''}`}>
                    {level.name}
                </button>
            ))}
        </div>
    </div>
);

const DifficultySelector: React.FC<{ value: DifficultyLevel, onChange: (value: DifficultyLevel) => void }> = ({ value, onChange }) => (
    <div>
        <p className="text-lg font-bold font-title text-center mb-2" style={{color: 'var(--text-muted-color)'}}>Chọn Độ Khó</p>
        <div className="flex flex-col gap-3">
            {DIFFICULTY_LEVELS.map(level => (
                <button 
                    key={level.id} 
                    onClick={() => onChange(level.id)} 
                    className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${value === level.id ? `${level.color} bg-white/10` : 'bg-black/20 border-gray-700 hover:border-gray-500'}`}
                >
                    <div className="flex justify-between items-center">
                        <span className="font-bold text-md text-white">{level.name}</span>
                        <span className="text-xs font-mono text-gray-400">Chỉ số: {level.baseStatValue}</span>
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{level.description}</p>
                </button>
            ))}
        </div>
    </div>
);

export const CharacterCreationScreen: React.FC = memo(() => {
    const { state, handleNavigate, handleGameStart } = useAppContext();
    
    // State for the creation flow
    const [step, setStep] = useState<CreationStep>('origin');
    const [creationMode, setCreationMode] = useState<CreationGameMode>('worldly');
    
    // State for player choices
    const [selectedBackground, setSelectedBackground] = useState<WorldlyBackground | null>(null);
    const [selectedLegacy, setSelectedLegacy] = useState<TransmigratorLegacy | null>(null);
    const [selectedIncarnation, setSelectedIncarnation] = useState<PlayableCharacterTemplate | null>(null);
    const [formativeEvent, setFormativeEvent] = useState<FormativeEvent | null>(null);
    const [formativeEventResult, setFormativeEventResult] = useState<{ narrative: string; outcome: StatBonus } | null>(null);
    const [spiritualRoot, setSpiritualRoot] = useState<SpiritualRoot | null>(null);
    const [identity, setIdentity] = useState<CharacterIdentity | null>(null);
    
    // UI and other settings state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationMessage, setGenerationMessage] = useState('');
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [npcDensity, setNpcDensity] = useState<NpcDensity>('medium');
    const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
    const [playableCharacters, setPlayableCharacters] = useState<PlayableCharacterTemplate[]>([]);

    const [gameDate] = useState<GameDate>(() => ({ era: 'Tiên Phong Thần', year: 1, season: 'Xuân', day: 1, timeOfDay: 'Buổi Sáng', shichen: 'Tỵ', weather: 'SUNNY', actionPoints: 4, maxActionPoints: 4 }));
    
    const majorEventsForTimeline = useMemo(() => state.activeWorldId === 'tay_du_ky' ? JTTW_MAJOR_EVENTS : PT_MAJOR_EVENTS, [state.activeWorldId]);

    useEffect(() => {
        // Mock loading canon characters for 'incarnation' mode
        const canonChars: PlayableCharacterTemplate[] = [
            {
                id: 'canon_khuong_tu_nha', source: 'canon',
                identity: PT_NPC_LIST.find(npc => npc.id === 'npc_khuong_tu_nha')!.identity,
                bonuses: [],
                spiritualRoot: {
                    elements: [{ type: 'Kim', purity: 80 }, { type: 'Thủy', purity: 20 }], quality: 'Thiên Căn', name: 'Kim Thủy Thiên Căn',
                    description: 'Linh căn của thiên mệnh chi tử, ẩn chứa sức mạnh của thiên đạo.',
                    bonuses: [{ attribute: 'Ngộ Tính', value: 15 }, { attribute: 'Cơ Duyên', value: 10 }]
                },
            }
        ];
        setPlayableCharacters(canonChars);
    }, []);

    const handleOriginSelect = (mode: CreationGameMode) => {
        setCreationMode(mode);
        setStep('details');
    };

    const handleDetailSelect = (detail: WorldlyBackground | TransmigratorLegacy | PlayableCharacterTemplate) => {
        setGenerationError(null);
        if (creationMode === 'worldly') setSelectedBackground(detail as WorldlyBackground);
        if (creationMode === 'transmigrator') setSelectedLegacy(detail as TransmigratorLegacy);
        if (creationMode === 'incarnation') {
            const incarnation = detail as PlayableCharacterTemplate;
            setSelectedIncarnation(incarnation);
            setSpiritualRoot(incarnation.spiritualRoot);
            setStep('summary'); // Skip formative events for pre-defined characters
            return;
        }
        setStep('formativeEvent');
    };

    const handleFormativeEventChoice = (choice: FormativeEventChoice) => {
        setFormativeEventResult({ narrative: choice.narrative, outcome: choice.outcome });
        setStep('awakening');
    };
    
    const handleRootDetermined = (root: SpiritualRoot) => {
        setSpiritualRoot(root);
        setStep('summary');
    };

    const handleGenerateIdentity = async () => {
        if (!spiritualRoot || (!selectedBackground && !selectedLegacy)) return;
        setGenerationError(null);
        setIsGenerating(true);
        setGenerationMessage("Thiên cơ đang hiển lộ...");
        try {
            const context = {
                origin: (selectedBackground || selectedLegacy)!,
                formativeEventResult: formativeEventResult!,
                spiritualRoot: spiritualRoot,
                gender: identity?.gender || 'Nam',
            };
            const newIdentity = await generateCharacterIdentity(context);
            setIdentity(prev => ({ ...prev, ...newIdentity, age: 18, gender: prev?.gender || 'Nam' }));
        } catch (err: any) {
            setGenerationError(err.message || 'Lỗi không xác định.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleFinalize = async () => {
        if (!identity || !spiritualRoot) {
            alert("Vui lòng hoàn thành việc tạo nhân vật."); return;
        }
        
        let initialBonuses: StatBonus[] = [];
        let initialItems: WorldlyBackground['startingItems'] = [];
        let gameMode: GameMode = 'classic';

        if(creationMode === 'worldly' && selectedBackground) {
            initialBonuses = [...selectedBackground.bonuses];
            initialItems = [...selectedBackground.startingItems];
            identity.backgroundId = selectedBackground.id;
        } else if (creationMode === 'transmigrator' && selectedLegacy) {
            initialBonuses = [...selectedLegacy.bonuses];
            if(selectedLegacy.isSystemUser) gameMode = 'transmigrator';
            identity.legacyId = selectedLegacy.id;
        } else if (creationMode === 'incarnation' && selectedIncarnation) {
            initialBonuses = [...selectedIncarnation.bonuses];
            identity.incarnationId = selectedIncarnation.id;
        }
        if (formativeEventResult) initialBonuses.push(formativeEventResult.outcome);

        await handleGameStart({
            identity,
            spiritualRoot,
            initialBonuses,
            initialItems,
            npcDensity,
            difficulty,
            gameMode,
            danhVong: { value: 0, status: 'Vô Danh Tiểu Tốt' },
        });
    };
    
    const handleIdentityChange = useCallback((updatedIdentity: Partial<CharacterIdentity>) => {
        setIdentity(prev => ({ ...prev!, ...updatedIdentity }));
    }, []);

    const onBack = () => {
        setGenerationError(null);
        if (step === 'summary') { setIdentity(null); setStep(creationMode === 'incarnation' ? 'details' : 'awakening'); }
        else if (step === 'awakening') setStep('formativeEvent');
        else if (step === 'formativeEvent') setStep('details');
        else if (step === 'details') setStep('origin');
        else handleNavigate('saveSlots');
    };

    const renderHeader = () => (
        <div className="flex justify-between items-center mb-6">
            <button onClick={onBack} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors" title="Quay Lại"><FaArrowLeft className="w-5 h-5" /></button>
            <div className="text-center flex-grow"><Timeline gameDate={gameDate} majorEvents={majorEventsForTimeline} /></div>
            <div className="w-9 h-9"></div>
        </div>
    );

    const renderStepContent = () => {
        if (isGenerating) return <LoadingSpinner message={generationMessage} size="lg" />;
        
        switch (step) {
            case 'origin': return <OriginSelectionStep onSelect={handleOriginSelect} />;
            case 'details': return <DetailsSelectionStep mode={creationMode} onSelect={handleDetailSelect} playableCharacters={playableCharacters} />;
            case 'formativeEvent': return <FormativeEventStep origin={selectedBackground || selectedLegacy} onChoice={handleFormativeEventChoice} event={formativeEvent} setEvent={setFormativeEvent} />;
            case 'awakening': return <SpiritualRootSelection onRootDetermined={handleRootDetermined} />;
            case 'summary': return <SummaryStep 
                identity={identity} onIdentityChange={handleIdentityChange} onGenerateIdentity={handleGenerateIdentity}
                creation={{ mode: creationMode, background: selectedBackground, legacy: selectedLegacy, incarnation: selectedIncarnation, formativeResult: formativeEventResult, root: spiritualRoot }}
                difficulty={difficulty} onDifficultyChange={setDifficulty}
                npcDensity={npcDensity} onNpcDensityChange={setNpcDensity}
                onFinalize={handleFinalize}
            />;
            default: return null;
        }
    };
    
    return (
        <div className="w-full animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8">
            {renderHeader()}
            <div className="max-h-[calc(100vh-18rem)] min-h-[50vh] overflow-y-auto pr-2 flex flex-col justify-center">
                {generationError && <p className="text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30 mb-4">{generationError}</p>}
                {renderStepContent()}
            </div>
        </div>
    );
});

// Step Components
const OriginSelectionStep: React.FC<{ onSelect: (mode: CreationGameMode) => void }> = ({ onSelect }) => (
    <div className="text-center animate-fade-in space-y-8">
        <h2 className="text-3xl font-bold font-title">Chương 1: Hạt Giống Khởi Nguyên</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <button onClick={() => onSelect('worldly')} className="creation-card group"><GiGalaxy className="creation-card-icon" /> <h3 className="creation-card-title">Thế Tục Căn Nguyên</h3> <p className="creation-card-desc">Bạn là sinh linh của thế giới này. Bắt đầu với một lai lịch cụ thể và viết nên câu chuyện của riêng mình.</p></button>
            <button onClick={() => onSelect('transmigrator')} className="creation-card group"><FaDesktop className="creation-card-icon" /> <h3 className="creation-card-title">Dị Thế Chi Hồn</h3> <p className="creation-card-desc">Linh hồn bạn không thuộc về nơi đây. Bắt đầu với ký ức và di sản từ một kiếp sống khác.</p></button>
            <button onClick={() => onSelect('incarnation')} className="creation-card group"><GiPerson className="creation-card-icon" /> <h3 className="creation-card-title">Thiên Mệnh Chuyển Thế</h3> <p className="creation-card-desc">Bạn là sự chuyển thế của một nhân vật định mệnh. Bắt đầu với một phần di sản và nhân quả của họ.</p></button>
        </div>
    </div>
);

const DetailsSelectionStep: React.FC<{ mode: CreationGameMode; onSelect: (detail: any) => void; playableCharacters: PlayableCharacterTemplate[] }> = ({ mode, onSelect, playableCharacters }) => {
    let title = '';
    let items: any[] = [];
    if (mode === 'worldly') { title = 'Chọn Lai Lịch'; items = WORLDLY_BACKGROUNDS; }
    if (mode === 'transmigrator') { title = 'Chọn Di Trạch Tiền Thế'; items = TRANSMIGRATOR_LEGACIES; }
    if (mode === 'incarnation') { title = 'Chọn một Thiên Mệnh'; items = playableCharacters; }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold font-title text-center">{title}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 max-h-[60vh] overflow-y-auto pr-2">
                {items.map(item => (
                    <button key={item.id} onClick={() => onSelect(item)} className="group text-left p-4 bg-black/20 rounded-lg border-2 border-gray-700 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all h-full">
                        <h3 className="text-xl font-bold font-title text-cyan-300">{item.name || item.identity.name}</h3>
                        <p className="text-sm text-gray-400 mt-2">{item.description || item.identity.origin}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

const FormativeEventStep: React.FC<{ origin: any, onChoice: (choice: FormativeEventChoice) => void, event: FormativeEvent | null, setEvent: (event: FormativeEvent | null) => void }> = ({ origin, onChoice, event, setEvent }) => {
    const [isLoading, setIsLoading] = useState(false);
    
    useEffect(() => {
        if (!event && origin) {
            setIsLoading(true);
            generateFormativeEvent({ name: origin.name, description: origin.description })
                .then(setEvent)
                .catch(err => console.error(err))
                .finally(() => setIsLoading(false));
        }
    }, [event, origin, setEvent]);

    if (isLoading || !event) return <LoadingSpinner message="AI đang viết nên quá khứ của bạn..." size="lg" />;

    return (
        <div className="max-w-2xl mx-auto text-center animate-fade-in">
            <h2 className="text-3xl font-bold font-title mb-4">Chương 2: Năm Tháng Rèn Rũa</h2>
            <p className="text-lg text-gray-300 italic mb-6">"{event.scenario}"</p>
            <div className="space-y-3">
                {event.choices.map((choice, index) => (
                    <button key={index} onClick={() => onChoice(choice)} className="w-full text-center themed-button-primary font-bold py-3 px-4 rounded-lg text-lg">
                        {choice.text}
                    </button>
                ))}
            </div>
        </div>
    );
};

const SummaryStep: React.FC<any> = ({ identity, onIdentityChange, onGenerateIdentity, creation, difficulty, onDifficultyChange, npcDensity, onNpcDensityChange, onFinalize }) => {
    const { mode, background, legacy, incarnation, formativeResult, root } = creation;
    const originChoice = background || legacy || incarnation;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
            <h2 className="text-3xl font-bold font-title text-center">Chương 4: Định Hình Nhân Dạng</h2>
            <div className="p-4 bg-black/20 rounded-lg border border-gray-700/60 space-y-3">
                <h3 className="text-lg font-title text-amber-300">Vận Mệnh Chi Thư Của Bạn</h3>
                <p><strong className="text-gray-400">Khởi Nguyên:</strong> {originChoice.name}</p>
                {formativeResult && <p><strong className="text-gray-400">Rèn Rũa:</strong> {formativeResult.narrative} ({formativeResult.outcome.attribute} {formativeResult.outcome.value > 0 ? '+' : ''}{formativeResult.outcome.value})</p>}
                {root && <p><strong className="text-gray-400">Thức Tỉnh:</strong> {root.name}</p>}
            </div>
            {identity ? (
                <CharacterIdentityDisplay identity={identity} onIdentityChange={onIdentityChange} />
            ) : (
                <div className="text-center p-4">
                    <button onClick={onGenerateIdentity} className="px-6 py-3 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 text-xl flex items-center gap-3 mx-auto">
                        <GiSparkles /> AI Viết Nên Thân Phận
                    </button>
                </div>
            )}
            {identity && (
                 <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-black/20 rounded-lg border border-gray-700/60">
                        <DifficultySelector value={difficulty} onChange={onDifficultyChange} />
                        <NpcDensitySelector value={npcDensity} onChange={onNpcDensityChange} />
                    </div>
                    <button onClick={onFinalize} className="w-full py-4 text-xl font-bold rounded-lg themed-button-primary">Bắt Đầu Hành Trình</button>
                 </>
            )}
        </div>
    );
};
