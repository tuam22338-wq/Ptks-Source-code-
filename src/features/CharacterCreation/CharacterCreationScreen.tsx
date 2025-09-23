

import React, { useState, useCallback, useEffect, memo, useMemo } from 'react';
import type { CharacterIdentity, NpcDensity, Gender, GameDate, StatBonus, DanhVong, DifficultyLevel, SpiritualRoot, CharacterCreationChoice } from '../../types';
import { FaArrowLeft, FaDiceD20, FaCheck } from 'react-icons/fa';
import { GiGalaxy, GiPerson, GiScrollQuill, GiStairsGoal, GiSparkles, GiFamilyTree, GiAges, GiSwapBag } from "react-icons/gi";
import Timeline from '../../components/Timeline';
import { generatePowerSource, generateCharacterDetails } from '../../services/geminiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import CharacterIdentityDisplay from './components/CharacterIdentityDisplay';
import { PT_MAJOR_EVENTS, JTTW_MAJOR_EVENTS, DIFFICULTY_LEVELS, NPC_DENSITY_LEVELS, RACES, BACKGROUNDS, PERSONALITY_TRAITS } from '../../constants';
import { useAppContext } from '../../contexts/AppContext';
import PowerSourceSelection from './components/SpiritualRootSelection';

type CreationStep = 'identity' | 'powerSource' | 'summary';

const StepIndicator: React.FC<{ currentStep: CreationStep }> = ({ currentStep }) => {
    const steps: { id: CreationStep; label: string; icon: React.ElementType; }[] = [
        { id: 'identity', label: 'Bản Sắc', icon: GiFamilyTree },
        { id: 'powerSource', label: 'Sức Mạnh', icon: GiSparkles },
        { id: 'summary', label: 'Hoàn Thiện', icon: GiScrollQuill },
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

export const CharacterCreationScreen: React.FC = memo(() => {
    const { state, handleNavigate, handleGameStart } = useAppContext();
    
    const [step, setStep] = useState<CreationStep>('identity');
    
    const [draftIdentity, setDraftIdentity] = useState<Omit<CharacterIdentity, 'origin' | 'age'>>({ name: '', familyName: '', gender: 'Nam', appearance: '', personality: 'Trung Lập' });
    const [race, setRace] = useState<CharacterCreationChoice | null>(null);
    const [background, setBackground] = useState<CharacterCreationChoice | null>(null);
    const [powerSource, setPowerSource] = useState<SpiritualRoot | null>(null);
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationMessage, setGenerationMessage] = useState('');
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [npcDensity, setNpcDensity] = useState<NpcDensity>('medium');
    const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
    const [finalIdentity, setFinalIdentity] = useState<CharacterIdentity | null>(null);

    const [gameDate] = useState<GameDate>(() => ({ era: 'Tiên Phong Thần', year: 1, season: 'Xuân', day: 1, timeOfDay: 'Buổi Sáng', shichen: 'Tỵ', weather: 'SUNNY', actionPoints: 4, maxActionPoints: 4 }));
    const majorEventsForTimeline = useMemo(() => state.activeWorldId === 'tay_du_ky' ? JTTW_MAJOR_EVENTS : PT_MAJOR_EVENTS, [state.activeWorldId]);

    const isStep1Complete = useMemo(() => !!(draftIdentity.name.trim() && race && background), [draftIdentity.name, race, background]);

    const onBack = () => {
        setGenerationError(null);
        if (step === 'summary') { setPowerSource(null); setFinalIdentity(null); setStep('powerSource'); }
        else if (step === 'powerSource') setStep('identity');
        else handleNavigate('saveSlots');
    };

    const handleFinalize = async () => {
        if (!finalIdentity || !powerSource || !race || !background) {
            alert("Vui lòng hoàn thành việc tạo nhân vật."); return;
        }
        
        const initialBonuses: StatBonus[] = [...race.bonuses, ...background.bonuses, ...powerSource.bonuses];
        const initialItems = background.startingItems || [];
        
        await handleGameStart({
            identity: finalIdentity,
            spiritualRoot: powerSource,
            initialBonuses,
            initialItems,
            npcDensity,
            difficulty,
            danhVong: { value: 0, status: 'Vô Danh Tiểu Tốt' },
        });
    };
    
    const handleIdentityChange = useCallback((updatedIdentity: Partial<CharacterIdentity>) => {
        setDraftIdentity(prev => ({ ...prev, ...updatedIdentity }));
        if (finalIdentity) {
             setFinalIdentity(prev => ({ ...prev!, ...updatedIdentity }));
        }
    }, [finalIdentity]);
    
    const handleGenerateBackstory = async () => {
        if (!race || !background || !powerSource) return;
        setGenerationError(null);
        setIsGenerating(true);
        setGenerationMessage("Thiên cơ đang hiển lộ, viết nên số mệnh của bạn...");
        try {
            const finalDetails = await generateCharacterDetails({ race, background, powerSource, draftIdentity });
            setFinalIdentity({ ...finalDetails, age: 18 });
        } catch (err: any) {
            setGenerationError(err.message || 'Lỗi không xác định.');
        } finally {
            setIsGenerating(false);
        }
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
            case 'identity': return <IdentityStep identity={draftIdentity} onIdentityChange={handleIdentityChange} race={race} setRace={setRace} background={background} setBackground={setBackground} onNext={() => setStep('powerSource')} isComplete={isStep1Complete} />;
            case 'powerSource': return <PowerSourceSelection onRootDetermined={(root) => { setPowerSource(root); setStep('summary'); }} race={race!} background={background!} />;
            case 'summary': return <SummaryStep 
                draftIdentity={draftIdentity} finalIdentity={finalIdentity} onIdentityChange={handleIdentityChange} onGenerateBackstory={handleGenerateBackstory}
                choices={{ race, background, powerSource }}
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
            <StepIndicator currentStep={step} />
            <div className="max-h-[calc(100vh-22rem)] min-h-[50vh] overflow-y-auto pr-2 flex flex-col justify-center">
                {generationError && <p className="text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30 mb-4">{generationError}</p>}
                {renderStepContent()}
            </div>
        </div>
    );
});

// --- Step Components ---

const ChoiceCard: React.FC<{ choice: CharacterCreationChoice; isSelected: boolean; onSelect: () => void; }> = ({ choice, isSelected, onSelect }) => (
    <button onClick={onSelect} className={`group text-left p-4 bg-black/20 rounded-lg border-2 h-full transition-all duration-200 ${isSelected ? 'border-cyan-400 bg-cyan-500/10' : 'border-gray-700 hover:border-cyan-400/50 hover:bg-cyan-500/5'}`}>
        <h3 className="text-xl font-bold font-title text-cyan-300">{choice.name}</h3>
        <p className="text-sm text-gray-400 mt-2">{choice.description}</p>
        <div className="mt-2 text-xs text-teal-300">{choice.bonuses.map(b => `${b.attribute} ${b.value > 0 ? '+' : ''}${b.value}`).join(', ')}</div>
    </button>
);

const IdentityStep: React.FC<any> = ({ identity, onIdentityChange, race, setRace, background, setBackground, onNext, isComplete }) => (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
        <div className="text-center">
            <h2 className="text-3xl font-bold font-title">Bản Sắc Cốt Lõi</h2>
            <p className="text-gray-400 mt-1">Hãy định hình những nét cơ bản nhất cho nhân vật của bạn.</p>
        </div>
        <div className="p-4 bg-black/20 rounded-lg border border-gray-700/60">
             <CharacterIdentityDisplay identity={identity} onIdentityChange={onIdentityChange} isDraft={true} />
        </div>
        <div className="p-4 bg-black/20 rounded-lg border border-gray-700/60">
            <h3 className="text-lg font-bold font-title text-center mb-4">Chọn Chủng Tộc</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {RACES.map(r => <ChoiceCard key={r.id} choice={r} isSelected={race?.id === r.id} onSelect={() => setRace(r)} />)}
            </div>
        </div>
         <div className="p-4 bg-black/20 rounded-lg border border-gray-700/60">
            <h3 className="text-lg font-bold font-title text-center mb-4">Chọn Xuất Thân</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {BACKGROUNDS.map(b => <ChoiceCard key={b.id} choice={b} isSelected={background?.id === b.id} onSelect={() => setBackground(b)} />)}
            </div>
        </div>
        <div className="text-center pt-4">
             <button onClick={onNext} disabled={!isComplete} className="themed-button-primary px-8 py-3 text-xl font-bold rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-gray-400">
                Tiếp Tục
            </button>
        </div>
    </div>
);

const SummaryStep: React.FC<any> = ({ draftIdentity, finalIdentity, onIdentityChange, onGenerateBackstory, choices, difficulty, onDifficultyChange, npcDensity, onNpcDensityChange, onFinalize }) => {
    const { race, background, powerSource } = choices;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold font-title">Định Mệnh Chi Thư</h2>
                <p className="text-gray-400 mt-1">Xem lại các lựa chọn và hoàn thiện nhân vật của bạn.</p>
            </div>
            <div className="p-4 bg-black/20 rounded-lg border border-gray-700/60 space-y-3">
                <h3 className="text-lg font-title text-amber-300">Tổng kết lựa chọn</h3>
                <p><strong className="text-gray-400 w-24 inline-block">Chủng Tộc:</strong> {race.name}</p>
                <p><strong className="text-gray-400 w-24 inline-block">Xuất Thân:</strong> {background.name}</p>
                <p><strong className="text-gray-400 w-24 inline-block">Sức Mạnh:</strong> {powerSource.name}</p>
            </div>
            
            {finalIdentity ? (
                <div className="p-4 bg-black/20 rounded-lg border border-gray-700/60">
                    <CharacterIdentityDisplay identity={finalIdentity} onIdentityChange={onIdentityChange} isDraft={false} />
                </div>
            ) : (
                <div className="text-center p-4">
                    <button onClick={onGenerateBackstory} className="px-6 py-3 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 text-xl flex items-center gap-3 mx-auto">
                        <GiSparkles /> AI Viết Nên Thân Phận
                    </button>
                </div>
            )}

            {finalIdentity && (
                 <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-black/20 rounded-lg border border-gray-700/60">
                        <div>
                            <p className="text-lg font-bold font-title text-center mb-2 text-gray-300">Chọn Độ Khó</p>
                            <div className="flex flex-col gap-3">
                                {DIFFICULTY_LEVELS.map(level => (
                                    <button key={level.id} onClick={() => onDifficultyChange(level.id)} className={`p-3 rounded-lg border-2 text-left transition-all duration-200 ${difficulty === level.id ? `${level.color} bg-white/10` : 'bg-black/20 border-gray-700 hover:border-gray-500'}`}>
                                        <div className="font-bold text-md text-white">{level.name}</div>
                                        <p className="text-sm text-gray-400 mt-1">{level.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                         <div>
                            <p className="text-lg font-bold font-title text-center mb-2 text-gray-300">Mật độ Chúng Sinh</p>
                            <div className="themed-button-group flex-col gap-2">
                                {NPC_DENSITY_LEVELS.map(level => (
                                    <button key={level.id} onClick={() => onNpcDensityChange(level.id)} title={level.description} className={`${npcDensity === level.id ? 'active' : ''} !border-0`}>
                                        {level.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="text-center pt-4">
                        <button onClick={onFinalize} className="themed-button-primary px-8 py-3 text-xl font-bold rounded-lg">Bắt Đầu Hành Trình</button>
                    </div>
                 </>
            )}
        </div>
    );
};
