
import React, { useState, useCallback, useEffect } from 'react';
import type { AttributeGroup, InnateTalent, CharacterIdentity, PlayerCharacter, NpcDensity, Gender, GameDate, FullMod, ModTalent, ModTalentRank, TalentSystemConfig, StatBonus, ModCharacter } from '../types';
import { FaArrowLeft, FaSyncAlt } from 'react-icons/fa';
import { GiGalaxy, GiPerson, GiScrollQuill } from "react-icons/gi";
import Timeline from './Timeline';
import { generateCharacterFoundation } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import InnateTalentSelection from './InnateTalentSelection';
import CharacterIdentityDisplay from './CharacterIdentityDisplay';
import { ATTRIBUTES_CONFIG, SHICHEN_LIST, NPC_DENSITY_LEVELS, NPC_LIST } from '../constants';

interface CharacterCreationScreenProps {
  onBack: () => void;
  onGameStart: (gameStartData: {
      characterData: Omit<PlayerCharacter, 'inventory' | 'currencies' | 'cultivation' | 'currentLocationId' | 'equipment' | 'techniques' | 'relationships' | 'chosenPathIds' | 'knownRecipeIds' | 'reputation'>,
      npcDensity: NpcDensity
  }) => Promise<void>;
}

interface PlayableCharacterTemplate {
  id: string;
  source: 'canon' | 'mod';
  identity: Omit<CharacterIdentity, 'age'>;
  bonuses: StatBonus[];
  talents: InnateTalent[];
}

const GENDERS: Gender[] = ['Nam', 'Nữ'];
const GENERATING_MESSAGES = [
    'Đang xem xét nhân quả...',
    'Thiên cơ đang hiển lộ...',
    'Định hình cốt cách...',
    'Truy tìm tiên tư phù hợp...',
    'Số mệnh sắp được an bài...'
];

const NpcDensitySelector: React.FC<{ value: NpcDensity, onChange: (value: NpcDensity) => void }> = ({ value, onChange }) => (
    <div>
        <p className="text-sm text-center mb-2" style={{color: 'var(--text-muted-color)'}}>Mật độ Chúng Sinh</p>
        <div className="grid grid-cols-3 gap-2">
            {NPC_DENSITY_LEVELS.map(level => (
                <button key={level.id} onClick={() => onChange(level.id)} title={level.description} className={`p-3 text-sm rounded-md border text-center transition-all duration-200 ${value === level.id ? 'bg-teal-500/20 border-teal-400 text-white' : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'}`}>
                    <span className="font-bold">{level.name}</span>
                    <span className="block text-xs text-gray-400 mt-1 hidden sm:block">{level.description}</span>
                </button>
            ))}
        </div>
    </div>
);

const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({ onBack, onGameStart }) => {
  const [step, setStep] = useState<'modeSelection' | 'idea' | 'roleplay' | 'generating' | 'review'>('modeSelection');
  
  // Shared
  const [npcDensity, setNpcDensity] = useState<NpcDensity>('medium');
  const [error, setError] = useState<string | null>(null);

  // Step 'idea'
  const [characterConcept, setCharacterConcept] = useState('');
  const [gender, setGender] = useState<Gender>('Nam');
  
  // Step 'generating'
  const [loadingMessage, setLoadingMessage] = useState(GENERATING_MESSAGES[0]);

  // Step 'review'
  const [baseAttributes, setBaseAttributes] = useState<AttributeGroup[]>(ATTRIBUTES_CONFIG);
  const [attributes, setAttributes] = useState<AttributeGroup[]>(ATTRIBUTES_CONFIG);
  const [identity, setIdentity] = useState<CharacterIdentity | null>(null);
  const [talentChoices, setTalentChoices] = useState<InnateTalent[]>([]);
  const [selectedTalents, setSelectedTalents] = useState<InnateTalent[]>([]);
  const [talentSystemConfig, setTalentSystemConfig] = useState<{maxSelectable: number}>({maxSelectable: 3});

  // Step 'roleplay'
  const [availableRoleplayChars, setAvailableRoleplayChars] = useState<PlayableCharacterTemplate[]>([]);
  const [selectedRoleplayChar, setSelectedRoleplayChar] = useState<PlayableCharacterTemplate | null>(null);


  const initialGameDate: GameDate = {
    era: 'Tiên Phong Thần' as const,
    year: 1,
    season: 'Xuân' as const,
    day: 1,
    timeOfDay: 'Buổi Sáng' as const,
    shichen: SHICHEN_LIST[5].name,
    weather: 'SUNNY' as const,
    actionPoints: 4,
    maxActionPoints: 4,
  };

  useEffect(() => {
    // Load characters for roleplay mode
    // Load canon characters
    const canonChars: PlayableCharacterTemplate[] = NPC_LIST.map(npc => ({
        id: npc.id,
        source: 'canon',
        identity: {
            name: npc.identity.name,
            origin: npc.identity.origin,
            appearance: npc.identity.appearance,
            gender: npc.identity.gender || 'Nam',
            personality: npc.identity.personality,
        },
        bonuses: [],
        talents: npc.talents,
    }));

    // Load modded characters
    const modLibrary: {modInfo: {id: string}, isEnabled: boolean}[] = JSON.parse(localStorage.getItem('mod-library') || '[]');
    const enabledModsInfo = modLibrary.filter(m => m.isEnabled);
    const modChars: PlayableCharacterTemplate[] = [];

    for (const modInfo of enabledModsInfo) {
        try {
            const modContentRaw = localStorage.getItem(`mod-content-${modInfo.modInfo.id}`);
            if (modContentRaw) {
                const mod: FullMod = JSON.parse(modContentRaw);
                if (mod.content.characters) {
                    mod.content.characters.forEach((char, index) => {
                        // FIX: Ensure the object spread includes all required properties from `char`.
                        modChars.push({
                            id: `${mod.modInfo.id}-char-${index}`,
                            source: 'mod',
                            identity: {
                                name: char.name,
                                gender: char.gender,
                                origin: char.origin,
                                appearance: char.appearance,
                                personality: char.personality
                            },
                            bonuses: char.bonuses || [],
                            talents: []
                        });
                    });
                }
            }
        } catch(e) { console.error(`Failed to load characters from mod ${modInfo.modInfo.id}`, e); }
    }

    setAvailableRoleplayChars([...canonChars, ...modChars]);

    // Setup interval for loading messages
    let messageIndex = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    if (step === 'generating') {
        setLoadingMessage(GENERATING_MESSAGES[0]);
        intervalId = setInterval(() => {
            messageIndex = (messageIndex + 1) % GENERATING_MESSAGES.length;
            setLoadingMessage(GENERATING_MESSAGES[messageIndex]);
        }, 2500);
    }
    return () => {
        if (intervalId) {
            clearInterval(intervalId);
        }
    };
  }, [step]);
  
  const handleGenerateFreeCharacter = useCallback(async () => {
    if (!characterConcept.trim()) {
        alert("Vui lòng nhập ý niệm ban sơ cho nhân vật của bạn.");
        return;
    }
    
    setStep('generating');
    setSelectedTalents([]);
    setError(null);

    try {
        const modLibrary: {modInfo: {id: string}, isEnabled: boolean}[] = JSON.parse(localStorage.getItem('mod-library') || '[]');
        const enabledModsInfo = modLibrary.filter(m => m.isEnabled);
        const activeMods: FullMod[] = [];
        for (const modInfo of enabledModsInfo) {
            const modContentRaw = localStorage.getItem(`mod-content-${modInfo.modInfo.id}`);
            if (modContentRaw) activeMods.push(JSON.parse(modContentRaw));
        }
        
        let finalTalentSystemConfig: TalentSystemConfig | null = null;
        const finalTalentRanks: ModTalentRank[] = [];
        const finalAvailableTalents: ModTalent[] = [];

        activeMods.forEach(mod => {
            if (mod.content.talentSystemConfig) finalTalentSystemConfig = mod.content.talentSystemConfig;
            if (mod.content.talentRanks) finalTalentRanks.push(...mod.content.talentRanks.map((r, i) => ({...r, id: r.name + i})));
            if (mod.content.talents) finalAvailableTalents.push(...mod.content.talents.map((t, i) => ({...t, id: t.name + i})));
        });
        
        setTalentSystemConfig({ maxSelectable: finalTalentSystemConfig?.maxSelectable ?? 3 });

        const modTalentConfig = {
            systemConfig: finalTalentSystemConfig || { systemName: 'default', choicesPerRoll: 6, maxSelectable: 3, allowAIGeneratedTalents: true },
            ranks: finalTalentRanks.length > 0 ? finalTalentRanks : [],
            availableTalents: finalAvailableTalents
        };

        const { identity: generatedIdentity, talents } = await generateCharacterFoundation(characterConcept, gender, modTalentConfig);
        setIdentity({ ...generatedIdentity, gender, age: 18 });
        setTalentChoices(talents);
        
        const rolledAttributes = ATTRIBUTES_CONFIG.map(group => ({
            ...group,
            attributes: group.attributes.map(attr => {
                const fixedAttributes = ['Sinh Mệnh', 'Linh Lực', 'Tuổi Thọ', 'Cảnh Giới', 'Nhân Quả', 'Đạo Tâm'];
                if (fixedAttributes.includes(attr.name) || typeof attr.value !== 'number') return attr;
                return { ...attr, value: Math.floor(Math.random() * 11) + 5 }; // Roll 5-15
            })
        }));

        setBaseAttributes(rolledAttributes);
        setStep('review');
    } catch (err: any) {
        setError(err.message || "Không thể nhận được thiên mệnh. Vui lòng thử lại.");
        console.error(err);
        setStep('idea');
    }
  }, [characterConcept, gender]);

    const handleStartAsRoleplayChar = async () => {
        if (!selectedRoleplayChar) return;

        setStep('generating');
        setLoadingMessage('Đang kiến tạo thế giới...');
        setError(null);

        try {
            const baseAttributes = ATTRIBUTES_CONFIG.map(group => ({
                ...group,
                attributes: group.attributes.map(attr => {
                    const fixedAttributes = ['Sinh Mệnh', 'Linh Lực', 'Tuổi Thọ', 'Cảnh Giới', 'Nhân Quả', 'Đạo Tâm'];
                    if (fixedAttributes.includes(attr.name) || typeof attr.value !== 'number') return attr;
                    return { ...attr, value: Math.floor(Math.random() * 11) + 5 };
                })
            }));

            const attributesWithBonuses = JSON.parse(JSON.stringify(baseAttributes));
            const attributeMap: Map<string, { groupIndex: number; attrIndex: number; }> = new Map();
            attributesWithBonuses.forEach((group: AttributeGroup, groupIndex: number) => {
                group.attributes.forEach((attr, attrIndex) => {
                    attributeMap.set(attr.name, { groupIndex, attrIndex });
                });
            });

            selectedRoleplayChar.bonuses.forEach(bonus => {
                const loc = attributeMap.get(bonus.attribute);
                if (loc) {
                    const attr = attributesWithBonuses[loc.groupIndex].attributes[loc.attrIndex];
                    if (typeof attr.value === 'number') (attr.value as number) += bonus.value;
                }
            });
            
            const characterData = {
              identity: { ...selectedRoleplayChar.identity, age: 18 },
              attributes: attributesWithBonuses,
              talents: selectedRoleplayChar.talents,
            };

            await new Promise(resolve => setTimeout(resolve, 50));
            await onGameStart({ characterData, npcDensity });

        } catch (err: any) {
             setError(err.message || "Không thể bắt đầu hành trình. Vui lòng thử lại.");
             console.error("Error starting roleplay game:", err);
             setStep('roleplay');
        }
    };

  useEffect(() => {
    if (step !== 'review') return;

    const newAttributes = baseAttributes.map(group => ({
        ...group,
        attributes: group.attributes.map(attr => ({ ...attr }))
    }));
    
    const attributeMap: Map<string, { groupIndex: number; attrIndex: number; }> = new Map();
    newAttributes.forEach((group, groupIndex) => {
        group.attributes.forEach((attr, attrIndex) => {
            attributeMap.set(attr.name, { groupIndex, attrIndex });
        });
    });

    selectedTalents.forEach(talent => {
        talent.bonuses?.forEach(bonus => {
            const loc = attributeMap.get(bonus.attribute);
            if (loc) {
                const attr = newAttributes[loc.groupIndex].attributes[loc.attrIndex];
                if (typeof attr.value === 'number') (attr.value as number) += bonus.value;
            }
        });
    });

    setAttributes(newAttributes);
  }, [selectedTalents, baseAttributes, step]);


  const handleIdentityChange = useCallback((updatedIdentity: Partial<CharacterIdentity>) => {
    setIdentity(prev => prev ? { ...prev, ...updatedIdentity } : null);
  }, []);

  const handleConfirmFreeCharacter = async () => {
    if (!identity || selectedTalents.length === 0) {
        alert("Vui lòng chọn ít nhất một Tiên Tư.");
        return;
    }
    const characterData: Omit<PlayerCharacter, 'inventory' | 'currencies' | 'cultivation' | 'currentLocationId' | 'equipment' | 'techniques' | 'relationships' | 'chosenPathIds' | 'knownRecipeIds' | 'reputation'> = {
      identity,
      attributes,
      talents: selectedTalents,
    };
    await onGameStart({ characterData, npcDensity });
  };
  
  const handleInternalBack = () => {
      if (step === 'idea' || step === 'roleplay') {
          setStep('modeSelection');
      } else if (step === 'review') {
          setStep('idea');
      } else {
          onBack();
      }
  };

  const renderModeSelectionStep = () => (
    <div className="flex flex-col items-center space-y-6 pt-8">
        <h3 className="text-2xl font-bold font-title text-center" style={{color: 'var(--text-color)'}}>Lựa Chọn Khởi Đầu</h3>
        <p className="text-center max-w-2xl" style={{color: 'var(--text-muted-color)'}}>Bạn muốn tự mình viết nên một câu chuyện mới, hay hóa thân thành một nhân vật đã có sẵn trong thế giới Phong Thần?</p>
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
            <button onClick={() => setStep('idea')} className="group flex-1 p-6 bg-black/20 rounded-lg border-2 border-gray-700 hover:border-teal-400/80 hover:bg-teal-900/20 transition-all text-center">
                <GiScrollQuill className="text-5xl text-gray-400 group-hover:text-teal-300 mx-auto mb-3 transition-colors" />
                <h4 className="text-xl font-bold font-title text-gray-200 group-hover:text-white">Tạo Nhân Vật Tự Do</h4>
                <p className="text-sm text-gray-500 group-hover:text-gray-400 mt-1">Kiến tạo một sinh linh độc nhất từ ý niệm của riêng bạn.</p>
            </button>
            <button onClick={() => setStep('roleplay')} className="group flex-1 p-6 bg-black/20 rounded-lg border-2 border-gray-700 hover:border-amber-400/80 hover:bg-amber-900/20 transition-all text-center">
                <GiPerson className="text-5xl text-gray-400 group-hover:text-amber-300 mx-auto mb-3 transition-colors" />
                <h4 className="text-xl font-bold font-title text-gray-200 group-hover:text-white">Nhập Vai Có Sẵn</h4>
                <p className="text-sm text-gray-500 group-hover:text-gray-400 mt-1">Hóa thân thành các nhân vật đã tồn tại trong thế giới.</p>
            </button>
        </div>
    </div>
  );

  const renderIdeaStep = () => (
    <div className="flex flex-col items-center space-y-6">
        <h3 className="text-2xl font-bold font-title text-center" style={{color: 'var(--text-color)'}}>Ý Niệm Ban Sơ</h3>
        <p className="text-center max-w-2xl" style={{color: 'var(--text-muted-color)'}}>Vạn vật khởi nguồn từ một ý niệm. Hãy cho ta biết, sinh linh mà ngươi muốn kiến tạo sẽ như thế nào? Cung cấp một vài từ khóa hoặc một đoạn mô tả ngắn gọn.</p>
        
        {error && <div className="bg-red-800/20 border border-red-500/50 text-red-200 p-4 rounded-lg text-center my-4">{error}</div>}

        <textarea
            value={characterConcept}
            onChange={(e) => setCharacterConcept(e.target.value)}
            rows={4}
            placeholder="Ví dụ: một kiếm khách lang thang tìm kiếm kẻ thù xưa, một thiếu nữ ma đạo lạnh lùng nhưng nội tâm lương thiện, một hậu duệ thần thú ẩn mình trong nhân gian..."
            className="w-full max-w-2xl bg-gray-900/50 border border-gray-600 rounded-md p-3 text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-400/50 transition-all"
        />
        
        <div className="w-full max-w-2xl space-y-4">
            <div>
                <p className="text-sm text-center mb-2" style={{color: 'var(--text-muted-color)'}}>Giới Tính</p>
                <div className="flex items-center gap-2">
                    {GENDERS.map(g => (
                        <button key={g} onClick={() => setGender(g)} className={`p-3 text-sm rounded-md border text-center transition-all duration-200 w-full ${gender === g ? 'bg-teal-500/20 border-teal-400 text-white' : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'}`}>
                            <span className="font-bold">{g}</span>
                        </button>
                    ))}
                </div>
            </div>
            <NpcDensitySelector value={npcDensity} onChange={setNpcDensity} />
        </div>
        
        <button
          onClick={handleGenerateFreeCharacter}
          className="themed-button-primary flex items-center justify-center gap-3 w-64 h-16 text-xl font-bold font-title rounded-md shadow-lg shadow-black/20"
        >
          <GiGalaxy />
          <span>Luận Bàn Thiên Cơ</span>
        </button>
    </div>
  );
  
  const renderRoleplaySelectionStep = () => (
      <div className="flex flex-col items-center space-y-6">
          <h3 className="text-2xl font-bold font-title text-center" style={{ color: 'var(--text-color)' }}>Lựa Chọn Nhân Vật</h3>
          <p className="text-center max-w-2xl" style={{ color: 'var(--text-muted-color)' }}>Chọn một định mệnh đã được an bài và viết tiếp câu chuyện của họ.</p>
          
          {error && <div className="bg-red-800/20 border border-red-500/50 text-red-200 p-4 rounded-lg text-center my-4">{error}</div>}

          <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[40vh] overflow-y-auto p-2">
              {availableRoleplayChars.map(char => (
                  <button 
                    key={char.id} 
                    onClick={() => setSelectedRoleplayChar(char)}
                    className={`p-4 text-left bg-black/20 rounded-lg border-2 transition-all duration-200 ${selectedRoleplayChar?.id === char.id ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-gray-700 hover:border-gray-500'}`}
                  >
                      <div className="flex justify-between items-baseline">
                        <h4 className="font-bold font-title text-lg text-gray-200">{char.identity.name}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${char.source === 'mod' ? 'bg-purple-500/20 text-purple-300' : 'bg-gray-600 text-gray-300'}`}>{char.source}</span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1 truncate">{char.identity.origin}</p>
                      {char.talents.length > 0 && <p className="text-xs text-cyan-300 mt-2">Tiên tư: {char.talents.map(t => t.name).join(', ')}</p>}
                      {char.bonuses.length > 0 && <p className="text-xs text-green-300 mt-2">Thưởng: {char.bonuses.map(b => `${b.attribute} +${b.value}`).join(', ')}</p>}
                  </button>
              ))}
          </div>
          
          <div className="w-full max-w-2xl space-y-4">
              <NpcDensitySelector value={npcDensity} onChange={setNpcDensity} />
          </div>

          <button
              onClick={handleStartAsRoleplayChar}
              disabled={!selectedRoleplayChar}
              className="themed-button-primary flex items-center justify-center gap-3 w-64 h-16 text-xl font-bold font-title rounded-md shadow-lg shadow-black/20 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed disabled:transform-none"
          >
              Bắt Đầu Hành Trình
          </button>
      </div>
  );

  const renderGeneratingStep = () => (
      <div className="h-full flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner message={loadingMessage} />
      </div>
  );
  
  const renderReviewStep = () => (
    <div className="space-y-6">
        {identity && <CharacterIdentityDisplay identity={identity} onIdentityChange={handleIdentityChange} />}
        
        <InnateTalentSelection 
          talents={talentChoices} 
          selectedTalents={selectedTalents}
          onSelectionChange={setSelectedTalents}
          maxSelectable={talentSystemConfig.maxSelectable}
        />

        <div className="bg-black/20 p-4 rounded-lg border border-gray-700/60">
          <h3 className="text-xl font-title font-semibold mb-4 text-center" style={{color: 'var(--text-muted-color)'}}>Bảng Thuộc Tính</h3>
          <div className="space-y-3">
            {attributes.map((group, groupIndex) => (
              <div key={group.title}>
                <h4 className="text-md font-title mb-2" style={{color: 'var(--text-muted-color)'}}>{group.title}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
                  {group.attributes.map((attr, attrIndex) => {
                    const baseAttr = baseAttributes[groupIndex]?.attributes[attrIndex];
                    const baseValue = baseAttr?.value;
                    const currentValue = attr.value;
                    const bonus = (typeof currentValue === 'number' && typeof baseValue === 'number') ? currentValue - baseValue : 0;
                    
                    let valueColor = 'text-gray-100';
                    if (bonus > 0) valueColor = 'text-green-400';
                    if (bonus < 0) valueColor = 'text-red-400';
                    
                    return (
                        <div key={attr.name} className="flex items-center" title={`${attr.description}${bonus !== 0 ? ` (Cơ bản: ${baseValue}, Thưởng: ${bonus > 0 ? '+' : ''}${bonus})` : ''}`}>
                          <attr.icon className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                          <div className="flex-grow flex justify-between items-baseline text-sm">
                            <span className="text-gray-300">{attr.name}:</span>
                            <span className={`font-bold text-md font-title transition-colors duration-300 ${valueColor}`}>{attr.value}</span>
                          </div>
                        </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
            <button onClick={() => setStep('idea')} className="flex items-center justify-center gap-3 w-52 h-16 bg-gray-700 text-white text-xl font-bold font-title rounded-md border-2 border-gray-600 transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-gray-600">
                <FaSyncAlt />
                <span>Gieo Quẻ Lại</span>
            </button>
            <button onClick={handleConfirmFreeCharacter} className="themed-button-primary w-52 h-16 text-xl font-bold font-title rounded-md disabled:bg-gray-600/70 disabled:text-gray-400 disabled:cursor-not-allowed disabled:transform-none">
                Xác Nhận
            </button>
        </div>
    </div>
  );

  return (
    <div className="w-full animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold font-title">Kiến Tạo Thân Phận</h2>
        <button onClick={handleInternalBack} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors" title="Quay Lại">
          <FaArrowLeft className="w-5 h-5" />
        </button>
      </div>
      
      <Timeline gameDate={initialGameDate} />

      <div className="mt-6">
        {step === 'modeSelection' && renderModeSelectionStep()}
        {step === 'idea' && renderIdeaStep()}
        {step === 'roleplay' && renderRoleplaySelectionStep()}
        {step === 'generating' && renderGeneratingStep()}
        {step === 'review' && renderReviewStep()}
      </div>
    </div>
  );
};

export default CharacterCreationScreen;
