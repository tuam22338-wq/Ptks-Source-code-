import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import type { CharacterIdentity, StatBonus, DifficultyLevel, SpiritualRoot, Currency, ModAttributeSystem, FullMod, GenerationMode } from '../../types';
import { FaArrowLeft, FaDiceD20, FaCheck, FaSyncAlt } from 'react-icons/fa';
import { GiGalaxy, GiPerson, GiScrollQuill, GiStairsGoal, GiSparkles, GiFamilyTree } from "react-icons/gi";
import Timeline from '../../components/Timeline';
import { generateCharacterFromPrompts } from '../../services/geminiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import CharacterIdentityDisplay from './CharacterIdentityDisplay';
import { PT_MAJOR_EVENTS, JTTW_MAJOR_EVENTS, DIFFICULTY_LEVELS, NPC_DENSITY_LEVELS, DEFAULT_ATTRIBUTE_DEFINITIONS, DEFAULT_ATTRIBUTE_GROUPS } from '../../constants';
import { useAppContext } from '../../contexts/AppContext';
import * as db from '../../services/dbService';
import LoadingScreen from '../../components/LoadingScreen';


type CreationStep = 'identity' | 'summary';

const StepIndicator: React.FC<{ currentStep: CreationStep }> = ({ currentStep }) => {
    const steps: { id: CreationStep; label: string; icon: React.ElementType; }[] = [
        { id: 'identity', label: 'Bản Sắc', icon: GiFamilyTree },
        { id: 'summary', label: 'Định Mệnh', icon: GiGalaxy },
    ];
    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
        <div className="flex justify-center items-center gap-4 sm:gap-8 mb-6">
            {steps.map((step, index) => {
                const isActive = index === currentIndex;
                const isCompleted = index < currentIndex;
                const Icon = step.icon;
                return (
                    <div key={step.id} className="flex flex-col items-center text-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? 'bg-amber-500/20 border-amber-400' : isCompleted ? 'bg-green-500/20 border-green-400' : 'bg-black/20 border-gray-600'}`}>
                            {isCompleted ? <FaCheck className="text-green-400 text-xl" /> : <Icon className={`text-2xl ${isActive ? 'text-amber-300' : 'text-gray-500'}`} />}
                        </div>
                        <p className={`mt-2 text-xs font-bold transition-colors ${isActive || isCompleted ? 'text-gray-200' : 'text-gray-500'}`}>{step.label}</p>
                    </div>
                );
            })}
        </div>
    );
};

const modeOptions: { id: GenerationMode; label: string; description: string; color: string }[] = [
    { id: 'fast', label: 'Nhanh', description: 'Tạo thế giới nhanh chóng, ít chi tiết phức tạp.', color: 'border-sky-500' },
    { id: 'deep', label: 'Chuyên Sâu', description: 'AI sẽ dành nhiều thời gian hơn để tạo ra NPC và cốt truyện có chiều sâu.', color: 'border-amber-500' },
    { id: 'super_deep', label: 'Siêu Chuyên Sâu', description: 'Tối đa hóa sự sáng tạo của AI, tạo ra một thế giới cực kỳ chi tiết. Mất nhiều thời gian nhất.', color: 'border-red-600' },
];

export const CharacterCreationScreen: React.FC = memo(() => {
    const { state, handleNavigate, handleGameStart, dispatch } = useAppContext();
    
    const [step, setStep] = useState<CreationStep>('identity');
    
    // State for user text inputs
    const [draftIdentity, setDraftIdentity] = useState<CharacterIdentity>({ name: '', familyName: '', gender: 'Nam', appearance: '', personality: 'Trung Lập', origin: '', age: 18 });
    const [raceInput, setRaceInput] = useState('');
    const [backgroundInput, setBackgroundInput] = useState('');
    
    // State for AI-generated results
    const [generatedResult, setGeneratedResult] = useState<{ identity: CharacterIdentity; spiritualRoot: SpiritualRoot; initialBonuses: StatBonus[]; initialItems: any[], initialCurrency: Currency; } | null>(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [npcDensity, setNpcDensity] = useState<'medium'>('medium');
    const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
    const [generationMode, setGenerationMode] = useState<GenerationMode>('fast');

    const [activeAttributeSystem, setActiveAttributeSystem] = useState<ModAttributeSystem | null>(null);

    useEffect(() => {
        const loadModSystems = async () => {
            try {
                const modLibrary = await db.getModLibrary();
                const enabledModsInfo = modLibrary.filter(m => m.isEnabled);
                const activeMods: FullMod[] = (await Promise.all(
                    enabledModsInfo.map(modInfo => db.getModContent(modInfo.modInfo.id))
                )).filter((mod): mod is FullMod => mod !== undefined);

                const modAttributeSystem = activeMods.find(m => m.content.attributeSystem)?.content.attributeSystem;
                
                if (modAttributeSystem) {
                    setActiveAttributeSystem(modAttributeSystem);
                } else {
                    setActiveAttributeSystem({
                        definitions: DEFAULT_ATTRIBUTE_DEFINITIONS,
                        groups: DEFAULT_ATTRIBUTE_GROUPS
                    });
                }
            } catch (error) {
                console.error("Failed to load mod attribute systems:", error);
                setActiveAttributeSystem({
                    definitions: DEFAULT_ATTRIBUTE_DEFINITIONS,
                    groups: DEFAULT_ATTRIBUTE_GROUPS
                });
            }
        };
        loadModSystems();
    }, []);

    const majorEventsForTimeline = useMemo(() => state.activeWorldId === 'tay_du_ky' ? JTTW_MAJOR_EVENTS : PT_MAJOR_EVENTS, [state.activeWorldId]);

    const isStep1Complete = useMemo(() => !!(draftIdentity.name.trim() && raceInput.trim() && backgroundInput.trim()), [draftIdentity.name, raceInput, backgroundInput]);

    const onBack = () => {
        setGenerationError(null);
        if (step === 'summary') { setGeneratedResult(null); setStep('identity'); }
        else handleNavigate('saveSlots');
    };

    const handleGenerateDetails = async () => {
        if (!isStep1Complete || !activeAttributeSystem) return;
        setIsGenerating(true);
        setGenerationError(null);
        try {
            const result = await generateCharacterFromPrompts({
                draftIdentity,
                raceInput,
                backgroundInput
            }, activeAttributeSystem);
            setGeneratedResult(result);
            setStep('summary');
        } catch (err: any) {
            setGenerationError(err.message || 'Thiên cơ hỗn loạn, không thể diễn giải số mệnh của bạn.');
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleFinalize = async () => {
        if (!generatedResult) return;
        
        try {
            await handleGameStart({
                identity: generatedResult.identity,
                spiritualRoot: generatedResult.spiritualRoot,
                initialBonuses: generatedResult.initialBonuses,
                initialItems: generatedResult.initialItems,
                initialCurrency: generatedResult.initialCurrency,
                npcDensity,
                difficulty,
                danhVong: { value: 0, status: 'Vô Danh Tiểu Tốt' },
                generationMode,
            });
        } catch (error: any) {
            console.error("World Creation Failed:", error);
            setGenerationError(`Lỗi tạo thế giới: ${error.message}. Vui lòng thử lại hoặc thay đổi thông tin đầu vào.`);
            setStep('identity'); // Go back to the identity step so user can retry
        }
    };
    
    const handleIdentityChange = useCallback((updatedIdentity: Partial<CharacterIdentity>) => {
        setDraftIdentity(prev => ({ ...prev, ...updatedIdentity }));
    }, []);
    
    const renderHeader = () => (
        <div className="flex justify-between items-center mb-6">
            <button onClick={onBack} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors" title="Quay Lại"><FaArrowLeft className="w-5 h-5" /></button>
            <div className="text-center flex-grow"><Timeline gameDate={{ era: 'Tiên Phong Thần', year: 1, season: 'Xuân', day: 1, timeOfDay: 'Buổi Sáng', shichen: 'Tỵ', weather: 'SUNNY', actionPoints: 4, maxActionPoints: 4 }} majorEvents={majorEventsForTimeline} currentLocationName={'...'} /></div>
            <div className="w-9 h-9"></div>
        </div>
    );

    const renderStepContent = () => {
        if (state.isLoading) return <LoadingScreen message={state.loadingMessage} isGeneratingWorld={true} generationMode={generationMode} />;
        if (isGenerating) return <LoadingSpinner message="Thiên cơ đang hiển lộ, diễn giải số mệnh của bạn..." size="lg" />;
        
        switch (step) {
            case 'identity': 
                return (
                    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold font-title">Phác Họa Bản Sắc</h2>
                            <p className="text-gray-400 mt-1">Hãy cho Thiên Cơ biết bạn là ai, bạn từ đâu tới.</p>
                        </div>
                         {generationError && <p className="text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30 mb-4">{generationError}</p>}
                        <div className="p-4 bg-black/20 rounded-lg border border-gray-700/60">
                             <CharacterIdentityDisplay identity={draftIdentity} onIdentityChange={handleIdentityChange} isFinal={false} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-black/20 rounded-lg border border-gray-700/60">
                           <div>
                                <label className="block text-lg font-title text-cyan-300 mb-2">Chủng Tộc / Huyết Mạch</label>
                                <textarea value={raceInput} onChange={e => setRaceInput(e.target.value)} rows={4} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 resize-y" placeholder="Ví dụ: Hậu duệ của Yêu Tộc, Người thường nhưng có tiên duyên, Một linh hồn từ thế giới khác, Nửa người nửa máy..."/>
                           </div>
                           <div>
                                <label className="block text-lg font-title text-cyan-300 mb-2">Xuất Thân / Trưởng Thành</label>
                                <textarea value={backgroundInput} onChange={e => setBackgroundInput(e.target.value)} rows={4} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 resize-y" placeholder="Ví dụ: Lớn lên trong một gia đình thương nhân giàu có, Là một nô lệ bỏ trốn, Được một vị ẩn sĩ bí ẩn nuôi dạy trong rừng sâu..."/>
                           </div>
                        </div>
                        <div className="text-center pt-4">
                            <button onClick={handleGenerateDetails} disabled={!isStep1Complete || !activeAttributeSystem} className="px-6 py-2 bg-[var(--button-primary-bg)] text-[var(--primary-accent-text-color)] border border-[var(--button-primary-border)] rounded-md font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--button-primary-hover-bg)] hover:-translate-y-0.5 shadow-md shadow-black/30 px-8 py-3 text-xl font-bold rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed">
                                <GiGalaxy className="inline-block mr-2" />
                                Diễn Giải Số Mệnh
                            </button>
                        </div>
                    </div>
                );
            case 'summary': 
                if (!generatedResult) return null;
                return (
                     <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
                        <div className="text-center">
                            <h2 className="text-3xl font-bold font-title">Định Mệnh Chi Thư</h2>
                            <p className="text-gray-400 mt-1">Đây là câu chuyện và sức mạnh mà Thiên Cơ đã diễn giải cho bạn. Bạn có thể quay lại hoặc thử lại nếu muốn.</p>
                        </div>

                        <div className="p-4 bg-black/20 rounded-lg border border-gray-700/60">
                           <CharacterIdentityDisplay identity={generatedResult.identity} onIdentityChange={() => {}} isFinal={true} />
                        </div>
                        
                        <div className="p-4 bg-black/20 rounded-lg border border-gray-700/60">
                            <h3 className="font-title text-xl text-amber-300">Nguồn Gốc Sức Mạnh</h3>
                            <h4 className="font-bold text-lg text-cyan-300 mt-1">{generatedResult.spiritualRoot.name}</h4>
                            <p className="text-sm text-gray-400 mt-1">{generatedResult.spiritualRoot.description}</p>
                            <div className="mt-2 text-xs text-teal-300">{generatedResult.spiritualRoot.bonuses.map(b => `${b.attribute} ${b.value > 0 ? '+' : ''}${b.value}`).join(', ')}</div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-black/20 rounded-lg border border-gray-700/60">
                            <div>
                                <p className="text-lg font-bold font-title text-center mb-2 text-gray-300">Chọn Độ Khó</p>
                                <div className="flex flex-col gap-3">
                                    {DIFFICULTY_LEVELS.map(level => (
                                        <button key={level.id} onClick={() => setDifficulty(level.id)} className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${difficulty === level.id ? `${level.color} bg-white/10` : 'bg-black/20 border-gray-700 hover:border-gray-500'}`}>
                                            <div className="font-bold text-md text-white">{level.name}</div>
                                            <p className="text-sm text-gray-400 mt-1">{level.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-lg font-bold font-title text-center mb-2 text-gray-300">Mật độ Chúng Sinh</p>
                                <div className="flex items-center p-1 bg-black/30 rounded-lg border border-gray-700/60 w-full flex-col gap-2">
                                    {NPC_DENSITY_LEVELS.map(level => (
                                        <button key={level.id} onClick={() => setNpcDensity(level.id as 'medium')} title={level.description} className={`w-full text-center py-1.5 px-2 text-sm text-gray-400 rounded-md transition-colors duration-200 font-semibold hover:bg-gray-700/50 hover:text-white !border-0 ${npcDensity === level.id ? 'bg-gray-600 text-white shadow-inner' : ''}`}>
                                            {level.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-black/20 rounded-lg border border-gray-700/60">
                            <p className="text-lg font-bold font-title text-center mb-2 text-gray-300">Chế Độ Sáng Thế</p>
                            <div className="flex flex-col gap-3">
                                {modeOptions.map(mode => (
                                    <button key={mode.id} onClick={() => setGenerationMode(mode.id)} className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${generationMode === mode.id ? `${mode.color} bg-white/10` : 'bg-black/20 border-gray-700 hover:border-gray-500'}`}>
                                        <div className="font-bold text-md text-white">{mode.label}</div>
                                        <p className="text-sm text-gray-400 mt-1">{mode.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="text-center pt-4 flex justify-center items-center gap-4">
                            <button onClick={handleGenerateDetails} className="px-4 py-2 bg-[var(--bg-interactive)] text-[var(--text-color)] border border-[var(--border-subtle)] rounded-lg font-semibold transition-colors duration-200 hover:bg-[var(--bg-interactive-hover)] hover:border-gray-500 flex items-center gap-2">
                                <FaSyncAlt /> Thử Lại
                            </button>
                            <button onClick={handleFinalize} className="px-6 py-2 bg-[var(--button-primary-bg)] text-[var(--primary-accent-text-color)] border border-[var(--button-primary-border)] rounded-md font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--button-primary-hover-bg)] hover:-translate-y-0.5 shadow-md shadow-black/30 px-8 py-3 text-xl font-bold rounded-lg">Bắt Đầu Hành Trình</button>
                        </div>
                     </div>
                );
            default: return null;
        }
    };
    
    return (
        <div className="w-full animate-fade-in flex flex-col h-full min-h-0">
            {renderHeader()}
            <StepIndicator currentStep={step} />
            <div className="flex-grow min-h-0 overflow-y-auto pr-2">
                {/* FIX: Renamed function call to match definition. */}
                {renderStepContent()}
            </div>
        </div>
    );
});