import React, { useState, useCallback, useEffect, memo } from 'react';
import type { AttributeGroup, CharacterIdentity, PlayerCharacter, NpcDensity, Gender, GameDate, FullMod, StatBonus, DanhVong, DifficultyLevel, SpiritualRoot } from '../../types';
import { FaArrowLeft, FaDesktop } from 'react-icons/fa';
import { GiGalaxy, GiPerson } from "react-icons/gi";
import Timeline from '../../components/Timeline';
import { generateCharacterIdentity } from '../../services/geminiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import SpiritualRootSelection from './components/SpiritualRootSelection';
import CharacterIdentityDisplay from './components/CharacterIdentityDisplay';
import { ATTRIBUTES_CONFIG, SHICHEN_LIST, NPC_DENSITY_LEVELS, PT_NPC_LIST, PT_MAJOR_EVENTS, DIFFICULTY_LEVELS, SPIRITUAL_ROOT_CONFIG } from '../../constants';
import * as db from '../../services/dbService';
import { useAppContext } from '../../contexts/AppContext';

interface PlayableCharacterTemplate {
  id: string;
  source: 'canon' | 'mod';
  identity: Omit<CharacterIdentity, 'age'>;
  bonuses: StatBonus[];
  spiritualRoot: SpiritualRoot;
}

const GENDERS: Gender[] = ['Nam', 'Nữ'];
const GENERATING_MESSAGES = [
    'Đang xem xét nhân quả...',
    'Thiên cơ đang hiển lộ...',
    'Định hình cốt cách...',
    'Truy tìm linh căn phù hợp...',
    'Số mệnh sắp được an bài...'
];

const NpcDensitySelector: React.FC<{ value: NpcDensity, onChange: (value: NpcDensity) => void }> = ({ value, onChange }) => (
    <div>
        <p className="text-sm text-center mb-2" style={{color: 'var(--text-muted-color)'}}>Mật độ Chúng Sinh</p>
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
        <p className="text-sm text-center mb-2" style={{color: 'var(--text-muted-color)'}}>Chọn Độ Khó</p>
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
  const { handleNavigate, handleGameStart } = useAppContext();
  const [step, setStep] = useState<'modeSelection' | 'idea' | 'roleplay' | 'generating' | 'results'>('modeSelection');
  const [characterConcept, setCharacterConcept] = useState('');
  const [gender, setGender] = useState<Gender>('Nam');
  const [identity, setIdentity] = useState<CharacterIdentity | null>(null);
  const [determinedRoot, setDeterminedRoot] = useState<SpiritualRoot | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [npcDensity, setNpcDensity] = useState<NpcDensity>('medium');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [playableCharacters, setPlayableCharacters] = useState<PlayableCharacterTemplate[]>([]);
  const [gameMode, setGameMode] = useState<'classic' | 'transmigrator'>('classic');
  
  const [gameDate] = useState<GameDate>(() => {
    const shichen = SHICHEN_LIST[Math.floor(Math.random() * SHICHEN_LIST.length)].name;
    return { era: 'Tiên Phong Thần', year: 1, season: 'Xuân', day: 1, timeOfDay: 'Buổi Sáng', shichen, weather: 'SUNNY', actionPoints: 4, maxActionPoints: 4 };
  });

  const updateGenerationMessage = useCallback(() => {
    const message = GENERATING_MESSAGES[Math.floor(Math.random() * GENERATING_MESSAGES.length)];
    setGenerationMessage(message);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isGenerating) {
      updateGenerationMessage();
      interval = setInterval(updateGenerationMessage, 2000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isGenerating, updateGenerationMessage]);
  
  useEffect(() => {
    const loadModData = async () => {
        const defaultRoot: SpiritualRoot = {
            elements: [{ type: 'Kim', purity: 80 }],
            quality: 'Linh Căn',
            name: 'Kim Linh Căn',
            description: 'Linh căn của Khương Tử Nha, ẩn chứa sức mạnh của thiên mệnh.',
            bonuses: [{ attribute: 'Ngộ Tính', value: 10 }]
        };

        const canonChars: PlayableCharacterTemplate[] = [
            {
                id: 'canon_khuong_tu_nha',
                source: 'canon',
                identity: PT_NPC_LIST.find(npc => npc.id === 'npc_khuong_tu_nha')!.identity,
                bonuses: [],
                spiritualRoot: defaultRoot,
            }
        ];
        
        setPlayableCharacters(canonChars);
    };
    loadModData();
  }, []);

  const handleGenerateIdentity = async () => {
    if (!characterConcept.trim()) {
      setGenerationError("Vui lòng nhập ý tưởng nhân vật.");
      return;
    }
    setGenerationError(null);
    setIsGenerating(true);
    try {
      const newIdentity = await generateCharacterIdentity(characterConcept, gender);
      const fullIdentity: CharacterIdentity = {
        name: newIdentity.name,
        origin: newIdentity.origin,
        appearance: newIdentity.appearance,
        personality: newIdentity.personality,
        familyName: newIdentity.familyName,
        gender: gender,
        age: 18,
        suggestedElement: newIdentity.suggestedElement
      };
      setIdentity(fullIdentity);
      setStep('results');
    } catch (err: any) {
      setGenerationError(err.message || 'Lỗi không xác định.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSelectTemplate = (template: PlayableCharacterTemplate) => {
      setIdentity({ ...template.identity, age: 18 });
      setDeterminedRoot(template.spiritualRoot);
      setStep('results');
  };

  const handleFinalize = async () => {
      if (!identity || !determinedRoot) {
          alert("Vui lòng hoàn thành việc tạo nhân vật và xác định linh căn.");
          return;
      }

      const initialAttributes = JSON.parse(JSON.stringify(ATTRIBUTES_CONFIG)) as AttributeGroup[];
      
      const selectedDifficulty = DIFFICULTY_LEVELS.find(d => d.id === difficulty) || DIFFICULTY_LEVELS.find(d => d.id === 'medium')!;
      const baseStatValue = selectedDifficulty.baseStatValue;

      initialAttributes.forEach(group => {
          if (['Tinh (精 - Nhục Thân)', 'Khí (气 - Chân Nguyên)', 'Thần (神 - Linh Hồn)', 'Ngoại Duyên (外缘 - Yếu Tố Bên Ngoài)'].includes(group.title)) {
              group.attributes.forEach(attr => {
                  if (typeof attr.value === 'number') {
                      attr.value = baseStatValue;
                  }
              });
          }
      });
      
      const allBonuses = determinedRoot.bonuses || [];
      
      allBonuses.forEach(bonus => {
          for (const group of initialAttributes) {
              const attr = group.attributes.find(a => a.name === bonus.attribute);
              if (attr && typeof attr.value === 'number') {
                  (attr.value as number) += bonus.value;
                  break;
              }
          }
      });
      
      const characterData = {
          identity: identity,
          attributes: initialAttributes,
          spiritualRoot: determinedRoot,
          danhVong: { value: 0, status: 'Vô Danh Tiểu Tốt' },
          // FIX: Added missing properties 'healthStatus' and 'activeEffects' to match the expected type for a new character.
          // FIX: The 'healthStatus' property was being inferred as a generic 'string', which is not assignable to the more specific 'CharacterStatus' type.
          // By adding 'as const', TypeScript infers the type as the literal 'HEALTHY', which is a valid CharacterStatus.
          healthStatus: 'HEALTHY' as const,
          activeEffects: [],
      };

      await handleGameStart({ characterData, npcDensity, difficulty, gameMode });
  };
  
  const handleIdentityChange = useCallback((updatedIdentity: Partial<CharacterIdentity>) => {
    if (identity) {
      setIdentity(prev => ({ ...prev!, ...updatedIdentity }));
    }
  }, [identity]);

  const onBack = () => handleNavigate('saveSlots');

  const renderContent = () => {
    if (isGenerating) {
      return <LoadingSpinner message={generationMessage} size="lg" />;
    }
    
    switch (step) {
      case 'modeSelection':
        return (
          <div className="text-center animate-fade-in space-y-8">
            <h2 className="text-3xl font-bold font-title">Chọn Con Đường Của Bạn</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <button onClick={() => { setGameMode('classic'); setStep('idea'); }} className="group flex flex-col items-center p-6 bg-black/20 rounded-lg border-2 border-gray-700 hover:border-amber-400 hover:bg-amber-500/10 transition-all transform hover:-translate-y-1">
                <GiGalaxy className="text-6xl text-gray-400 group-hover:text-amber-300 transition-colors mb-4"/>
                <h3 className="text-2xl font-bold font-title text-gray-200">Thân Phận Tự Do</h3>
                <p className="text-sm text-gray-500 mt-2">Dùng AI để tạo ra một nhân vật độc nhất từ ý tưởng của bạn trong bối cảnh gốc.</p>
              </button>
              <button onClick={() => { setGameMode('transmigrator'); setStep('idea'); }} className="group flex flex-col items-center p-6 bg-black/20 rounded-lg border-2 border-gray-700 hover:border-sky-400 hover:bg-sky-500/10 transition-all transform hover:-translate-y-1">
                <FaDesktop className="text-6xl text-gray-400 group-hover:text-sky-300 transition-colors mb-4"/>
                <h3 className="text-2xl font-bold font-title text-gray-200">Xuyên Việt Giả</h3>
                <p className="text-sm text-gray-500 mt-2">Bắt đầu với một 'Hệ Thống' bí ẩn và kiến thức từ thế giới khác.</p>
              </button>
              <button onClick={() => { setGameMode('classic'); setStep('roleplay'); }} className="group flex flex-col items-center p-6 bg-black/20 rounded-lg border-2 border-gray-700 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all transform hover:-translate-y-1">
                <GiPerson className="text-6xl text-gray-400 group-hover:text-cyan-300 transition-colors mb-4"/>
                <h3 className="text-2xl font-bold font-title text-gray-200">Nhập Vai Nhân Vật</h3>
                <p className="text-sm text-gray-500 mt-2">Chọn một nhân vật có sẵn trong thế giới Phong Thần hoặc từ các mod đã cài đặt.</p>
              </button>
            </div>
          </div>
        );
      
      case 'idea':
        return (
          <div className="text-center max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold font-title">Nêu Lên Ý Tưởng Của Bạn</h2>
            <p className="text-gray-400 mt-2 mb-6">Mô tả nhân vật mà bạn muốn tạo ra. AI sẽ dựa vào đây để tạo thân phận và gợi ý linh căn.</p>
            {generationError && <p className="text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30 mb-4">{generationError}</p>}
            <textarea
              value={characterConcept}
              onChange={(e) => setCharacterConcept(e.target.value)}
              rows={4}
              placeholder="Ví dụ: Một tán tu bí ẩn chuyên dùng độc, xuất thân từ một ngôi làng bị tàn sát, mang trong mình mối thù sâu đậm..."
              className="themed-input"
            />
            <div className="flex justify-center items-center gap-4 mt-4">
              <p className="text-gray-400">Giới tính:</p>
              <div className="themed-button-group">
                {GENDERS.map(g => (
                    <button key={g} onClick={() => setGender(g)} className={gender === g ? 'active' : ''}>
                    {g}
                    </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
                <DifficultySelector value={difficulty} onChange={setDifficulty} />
            </div>
            <div className="mt-8 flex justify-center gap-4">
              <button onClick={() => setStep('modeSelection')} className="px-6 py-3 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80">Quay Lại</button>
              <button onClick={handleGenerateIdentity} className="themed-button-primary px-6 py-3 font-bold rounded-lg">Tiếp Tục</button>
            </div>
          </div>
        );

      case 'roleplay':
          return (
              <div className="max-w-4xl mx-auto animate-fade-in">
                  <h2 className="text-3xl font-bold font-title text-center">Chọn một Nhân Vật</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 max-h-[60vh] overflow-y-auto pr-2">
                      {playableCharacters.map(char => (
                          <button key={char.id} onClick={() => handleSelectTemplate(char)} className="group text-left p-4 bg-black/20 rounded-lg border-2 border-gray-700 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all">
                              <h3 className="text-xl font-bold font-title text-cyan-300">{char.identity.name}</h3>
                              <p className="text-xs text-gray-500 uppercase">{char.source === 'canon' ? 'Nguyên Tác' : 'Mod'}</p>
                              <p className="text-sm text-gray-400 mt-2">{char.identity.origin}</p>
                          </button>
                      ))}
                  </div>
                   <div className="mt-8 flex justify-center">
                    <button onClick={() => setStep('modeSelection')} className="px-6 py-3 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80">Quay Lại</button>
                  </div>
              </div>
          );

      case 'results':
        if (!identity) return <LoadingSpinner message="Đang tải..." />;
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold font-title text-center">Thân Phận</h2>
              <CharacterIdentityDisplay identity={identity} onIdentityChange={handleIdentityChange} />
               <NpcDensitySelector value={npcDensity} onChange={setNpcDensity} />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold font-title text-center">Linh Căn</h2>
              <SpiritualRootSelection
                suggestedElement={identity.suggestedElement}
                onRootDetermined={setDeterminedRoot}
              />
              <button 
                onClick={handleFinalize} 
                disabled={!determinedRoot}
                className="w-full py-4 text-xl font-bold rounded-lg themed-button-primary disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Bắt Đầu Hành Trình
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={step === 'modeSelection' ? onBack : () => setStep('modeSelection')}
          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
          title="Quay Lại"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center flex-grow">
          <Timeline gameDate={gameDate} majorEvents={PT_MAJOR_EVENTS} />
        </div>
        <div className="w-9 h-9"></div>
      </div>
      <div className="max-h-[calc(100vh-18rem)] min-h-[50vh] overflow-y-auto pr-2 flex flex-col justify-center">
        {renderContent()}
      </div>
    </div>
  );
});
