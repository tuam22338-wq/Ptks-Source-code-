

import React, { useState, useCallback, useEffect } from 'react';
import type { AttributeGroup, InnateTalent, CharacterIdentity, PlayerCharacter, NpcDensity, Gender, GameDate, FullMod, ModTalent, ModTalentRank, TalentSystemConfig } from '../types';
import { FaArrowLeft, FaSyncAlt } from 'react-icons/fa';
import { GiGalaxy } from "react-icons/gi";
import Timeline from './Timeline';
import { generateCharacterFoundation } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import InnateTalentSelection from './InnateTalentSelection';
import CharacterIdentityDisplay from './CharacterIdentityDisplay';
import { ATTRIBUTES_CONFIG, SHICHEN_LIST, NPC_DENSITY_LEVELS } from '../constants';

interface CharacterCreationScreenProps {
  onBack: () => void;
  onGameStart: (gameStartData: {
      characterData: Omit<PlayerCharacter, 'inventory' | 'currencies' | 'cultivation' | 'currentLocationId' | 'equipment' | 'techniques' | 'relationships'>,
      npcDensity: NpcDensity
  }) => void;
}

const GENDERS: Gender[] = ['Nam', 'Nữ'];
const GENERATING_MESSAGES = [
    'Đang xem xét nhân quả...',
    'Thiên cơ đang hiển lộ...',
    'Định hình cốt cách...',
    'Truy tìm tiên tư phù hợp...',
    'Số mệnh sắp được an bài...'
];

const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = ({ onBack, onGameStart }) => {
  const [step, setStep] = useState<'idea' | 'generating' | 'review'>('idea');
  
  // Step 1: Idea
  const [characterConcept, setCharacterConcept] = useState('');
  const [gender, setGender] = useState<Gender>('Nam');
  const [npcDensity, setNpcDensity] = useState<NpcDensity>('medium');
  
  // Step 2: Generating
  const [loadingMessage, setLoadingMessage] = useState(GENERATING_MESSAGES[0]);
  const [error, setError] = useState<string | null>(null);

  // Step 3: Review
  const [baseAttributes, setBaseAttributes] = useState<AttributeGroup[]>(ATTRIBUTES_CONFIG);
  const [attributes, setAttributes] = useState<AttributeGroup[]>(ATTRIBUTES_CONFIG);
  const [identity, setIdentity] = useState<CharacterIdentity | null>(null);
  const [talentChoices, setTalentChoices] = useState<InnateTalent[]>([]);
  const [selectedTalents, setSelectedTalents] = useState<InnateTalent[]>([]);
  const [talentSystemConfig, setTalentSystemConfig] = useState<{maxSelectable: number}>({maxSelectable: 3});


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
  
  const handleGenerate = useCallback(async () => {
    if (!characterConcept.trim()) {
        alert("Vui lòng nhập ý niệm ban sơ cho nhân vật của bạn.");
        return;
    }
    
    setStep('generating');
    setSelectedTalents([]);
    setError(null);

    try {
        // Load mods
        const modLibrary: {modInfo: {id: string}, isEnabled: boolean}[] = JSON.parse(localStorage.getItem('mod-library') || '[]');
        const enabledModsInfo = modLibrary.filter(m => m.isEnabled);
        const activeMods: FullMod[] = [];
        for (const modInfo of enabledModsInfo) {
            const modContentRaw = localStorage.getItem(`mod-content-${modInfo.modInfo.id}`);
            if (modContentRaw) activeMods.push(JSON.parse(modContentRaw));
        }
        
        // Aggregate mod data for talents
        let finalTalentSystemConfig: TalentSystemConfig | null = null;
        const finalTalentRanks: ModTalentRank[] = [];
        const finalAvailableTalents: ModTalent[] = [];

        activeMods.forEach(mod => {
            if (mod.content.talentSystemConfig) {
                finalTalentSystemConfig = mod.content.talentSystemConfig;
            }
            if (mod.content.talentRanks) {
                finalTalentRanks.push(...mod.content.talentRanks.map((r, i) => ({...r, id: r.name + i})));
            }
            if (mod.content.talents) {
                finalAvailableTalents.push(...mod.content.talents.map((t, i) => ({...t, id: t.name + i})));
            }
        });
        
        setTalentSystemConfig({ maxSelectable: finalTalentSystemConfig?.maxSelectable ?? 3 });

        const modTalentConfig = {
            systemConfig: finalTalentSystemConfig || { systemName: 'default', choicesPerRoll: 6, maxSelectable: 3, allowAIGeneratedTalents: true },
            ranks: finalTalentRanks.length > 0 ? finalTalentRanks : [],
            availableTalents: finalAvailableTalents
        };

        const { identity: generatedIdentity, talents } = await generateCharacterFoundation(characterConcept, gender, modTalentConfig);
        setIdentity({ ...generatedIdentity, gender });
        setTalentChoices(talents);
        
        const rolledAttributes = ATTRIBUTES_CONFIG.map(group => ({
            ...group,
            attributes: group.attributes.map(attr => {
                const fixedAttributes = ['Sinh Mệnh', 'Linh Lực', 'Tuổi Thọ', 'Cảnh Giới', 'Nhân Quả', 'Đạo Tâm'];
                if (fixedAttributes.includes(attr.name) || typeof attr.value !== 'number') {
                    return attr;
                }
                return { ...attr, value: Math.floor(Math.random() * 11) + 5 }; // Roll 5-15
            })
        }));

        setBaseAttributes(rolledAttributes);
        setStep('review');
    } catch (err: any) {
        setError(err.message || "Không thể nhận được thiên mệnh. Vui lòng thử lại.");
        console.error(err);
        setStep('idea'); // Go back to idea step on error
    }
  }, [characterConcept, gender]);

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
                if (typeof attr.value === 'number') {
                    (attr.value as number) += bonus.value;
                }
            }
        });
    });

    setAttributes(newAttributes);
  }, [selectedTalents, baseAttributes, step]);


  const handleIdentityChange = useCallback((updatedIdentity: Partial<CharacterIdentity>) => {
    setIdentity(prev => prev ? { ...prev, ...updatedIdentity } : null);
  }, []);

  const handleConfirm = () => {
    if (!identity || selectedTalents.length === 0) {
        alert("Vui lòng chọn ít nhất một Tiên Tư.");
        return;
    }
    const characterData: Omit<PlayerCharacter, 'inventory' | 'currencies' | 'cultivation' | 'currentLocationId' | 'equipment' | 'techniques' | 'relationships'> = {
      identity,
      attributes,
      talents: selectedTalents,
    };
    onGameStart({ characterData, npcDensity });
  };
  
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
             <div>
                <p className="text-sm text-center mb-2" style={{color: 'var(--text-muted-color)'}}>Mật độ Chúng Sinh</p>
                <div className="grid grid-cols-3 gap-2">
                    {NPC_DENSITY_LEVELS.map(level => (
                        <button key={level.id} onClick={() => setNpcDensity(level.id)} title={level.description} className={`p-3 text-sm rounded-md border text-center transition-all duration-200 ${npcDensity === level.id ? 'bg-teal-500/20 border-teal-400 text-white' : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'}`}>
                            <span className="font-bold">{level.name}</span>
                            <span className="block text-xs text-gray-400 mt-1 hidden sm:block">{level.description}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
        
        <button
          onClick={handleGenerate}
          className="themed-button-primary flex items-center justify-center gap-3 w-64 h-16 text-xl font-bold font-title rounded-md shadow-lg shadow-black/20"
        >
          <GiGalaxy />
          <span>Luận Bàn Thiên Cơ</span>
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
            <button onClick={handleConfirm} className="themed-button-primary w-52 h-16 text-xl font-bold font-title rounded-md disabled:bg-gray-600/70 disabled:text-gray-400 disabled:cursor-not-allowed disabled:transform-none">
                Xác Nhận
            </button>
        </div>
    </div>
  );

  return (
    <div className="w-full animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-bold font-title">Kiến Tạo Thân Phận</h2>
        <button onClick={onBack} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors" title="Quay Lại">
          <FaArrowLeft className="w-5 h-5" />
        </button>
      </div>
      
      <Timeline gameDate={initialGameDate} />

      <div className="mt-6">
        {step === 'idea' && renderIdeaStep()}
        {step === 'generating' && renderGeneratingStep()}
        {step === 'review' && renderReviewStep()}
      </div>
    </div>
  );
};

export default CharacterCreationScreen;