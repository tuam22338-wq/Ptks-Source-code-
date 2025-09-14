

import React, { useState, useCallback, useEffect, memo } from 'react';
import type { AttributeGroup, InnateTalent, CharacterIdentity, PlayerCharacter, NpcDensity, Gender, GameDate, FullMod, ModTalent, ModTalentRank, TalentSystemConfig, StatBonus, ModCharacter } from '../../types';
import { FaArrowLeft, FaDice } from 'react-icons/fa';
import { GiGalaxy, GiPerson, GiScrollQuill } from "react-icons/gi";
import Timeline from '../../components/Timeline';
import { generateCharacterIdentity, generateTalentChoices } from '../../services/geminiService';
import LoadingSpinner from '../../components/LoadingSpinner';
import InnateTalentSelection from './components/InnateTalentSelection';
import CharacterIdentityDisplay from './components/CharacterIdentityDisplay';
import { ATTRIBUTES_CONFIG, SHICHEN_LIST, NPC_DENSITY_LEVELS, NPC_LIST } from '../../constants';
import * as db from '../../services/dbService';

interface CharacterCreationScreenProps {
  onBack: () => void;
  onGameStart: (gameStartData: {
      characterData: Omit<PlayerCharacter, 'inventory' | 'currencies' | 'cultivation' | 'currentLocationId' | 'equipment' | 'mainCultivationTechnique' | 'auxiliaryTechniques' | 'techniquePoints' | 'relationships' | 'chosenPathIds' | 'knownRecipeIds' | 'reputation' | 'sect' | 'caveAbode' | 'techniqueCooldowns' | 'activeMissions' | 'inventoryActionLog'>,
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

export const CharacterCreationScreen: React.FC<CharacterCreationScreenProps> = memo(({ onBack, onGameStart }) => {
  const [step, setStep] = useState<'modeSelection' | 'idea' | 'roleplay' | 'generating' | 'results'>('modeSelection');
  const [characterConcept, setCharacterConcept] = useState('');
  const [gender, setGender] = useState<Gender>('Nam');
  const [identity, setIdentity] = useState<CharacterIdentity | null>(null);
  const [talentChoices, setTalentChoices] = useState<InnateTalent[]>([]);
  const [selectedTalents, setSelectedTalents] = useState<InnateTalent[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationMessage, setGenerationMessage] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [npcDensity, setNpcDensity] = useState<NpcDensity>('medium');
  const [modTalentConfig, setModTalentConfig] = useState<{ systemConfig: TalentSystemConfig, ranks: ModTalentRank[], availableTalents: ModTalent[] }>({
    systemConfig: { systemName: 'Tiên Tư', choicesPerRoll: 6, maxSelectable: 3, allowAIGeneratedTalents: true },
    ranks: [],
    availableTalents: [],
  });
  const [playableCharacters, setPlayableCharacters] = useState<PlayableCharacterTemplate[]>([]);
  
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
      const activeMods: FullMod[] = [];
      const modLibrary = await db.getModLibrary();
      const enabledModsInfo = modLibrary.filter(m => m.isEnabled);

      for (const modInfo of enabledModsInfo) {
          const modContent = await db.getModContent(modInfo.modInfo.id);
          if (modContent) activeMods.push(modContent);
      }
      
      let finalTalentConfig = modTalentConfig;
      let finalPlayableChars: PlayableCharacterTemplate[] = [];

      // Add canon characters
      finalPlayableChars.push({
        id: 'canon_khuong_tu_nha',
        source: 'canon',
        identity: NPC_LIST.find(npc => npc.id === 'npc_khuong_tu_nha')!.identity,
        bonuses: [],
        talents: NPC_LIST.find(npc => npc.id === 'npc_khuong_tu_nha')!.talents,
      });

      activeMods.forEach(mod => {
        const talentSystem = mod.content.talentSystemConfig;
        if (talentSystem) {
          finalTalentConfig.systemConfig = { ...finalTalentConfig.systemConfig, ...talentSystem };
        }
        const ranks = mod.content.talentRanks;
        if (ranks) {
          finalTalentConfig.ranks.push(...ranks.map((r, i) => ({ ...r, id: `mod:${mod.modInfo.id}:rank:${i}` })));
        }
        const talents = mod.content.talents;
        if (talents) {
          finalTalentConfig.availableTalents.push(...talents.map(t => ({ ...t, id: t.name })));
        }
        const characters = mod.content.characters;
        if(characters) {
            finalPlayableChars.push(...characters.map(c => ({
                id: `mod_${mod.modInfo.id}_${c.name}`,
                source: 'mod' as const,
                identity: { name: c.name, gender: c.gender, origin: c.origin, appearance: c.appearance, personality: c.personality },
                bonuses: c.bonuses || [],
                talents: [], // Mod characters start with bonuses, not fixed talents
            })));
        }
      });

      setModTalentConfig(finalTalentConfig);
      setPlayableCharacters(finalPlayableChars);
    };

    loadModData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setIdentity({ ...newIdentity, gender, age: 18 });
      setStep('results');
    } catch (err: any) {
      setGenerationError(err.message || 'Lỗi không xác định.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateTalents = async () => {
    if (!identity) return;
    setGenerationError(null);
    setIsGenerating(true);
    try {
      const choices = await generateTalentChoices(identity, characterConcept, modTalentConfig);
      setTalentChoices(choices);
      setSelectedTalents([]);
    } catch (err: any) {
      setGenerationError(err.message || 'Lỗi không xác định.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleSelectTemplate = (template: PlayableCharacterTemplate) => {
      setIdentity({ ...template.identity, age: 18 });
      setSelectedTalents(template.talents);
      setTalentChoices(template.talents); // Show them as choices
      setStep('results');
  };

  useEffect(() => {
    if (step === 'results' && identity && talentChoices.length === 0) {
      handleGenerateTalents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, identity, talentChoices]);

  const handleFinalize = async () => {
      if (!identity || selectedTalents.length === 0) {
          alert("Vui lòng hoàn thành việc tạo nhân vật và chọn tiên tư.");
          return;
      }
      if (selectedTalents.length > modTalentConfig.systemConfig.maxSelectable) {
          alert(`Bạn chỉ có thể chọn tối đa ${modTalentConfig.systemConfig.maxSelectable} tiên tư.`);
          return;
      }

      const initialAttributes = JSON.parse(JSON.stringify(ATTRIBUTES_CONFIG)) as AttributeGroup[];
      const allBonuses = selectedTalents.flatMap(t => t.bonuses || []);
      
      allBonuses.forEach(bonus => {
          for (const group of initialAttributes) {
              const attr = group.attributes.find(a => a.name === bonus.attribute);
              if (attr && typeof attr.value === 'number') {
                  (attr.value as number) += bonus.value;
                  break;
              }
          }
      });
      
// FIX: Added the missing 'danhVong' property to align with the PlayerCharacter type.
      const characterData = {
          identity: identity,
          attributes: initialAttributes,
          talents: selectedTalents,
          danhVong: { value: 0, status: 'Vô Danh Tiểu Tốt' },
          healthStatus: 'HEALTHY' as const,
          activeEffects: [],
      };

      await onGameStart({ characterData, npcDensity });
  };
  
  const handleIdentityChange = useCallback((updatedIdentity: Partial<CharacterIdentity>) => {
    if (identity) {
      setIdentity(prev => ({ ...prev!, ...updatedIdentity }));
    }
  }, [identity]);

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
              <button onClick={() => setStep('idea')} className="group flex flex-col items-center p-6 bg-black/20 rounded-lg border-2 border-gray-700 hover:border-amber-400 hover:bg-amber-500/10 transition-all transform hover:-translate-y-1">
                <GiGalaxy className="text-6xl text-gray-400 group-hover:text-amber-300 transition-colors mb-4"/>
                <h3 className="text-2xl font-bold font-title text-gray-200">Sáng Tạo Tự Do</h3>
                <p className="text-sm text-gray-500 mt-2">Dùng AI để tạo ra một nhân vật độc nhất từ ý tưởng của bạn.</p>
              </button>
              <button onClick={() => setStep('roleplay')} className="group flex flex-col items-center p-6 bg-black/20 rounded-lg border-2 border-gray-700 hover:border-cyan-400 hover:bg-cyan-500/10 transition-all transform hover:-translate-y-1">
                <GiPerson className="text-6xl text-gray-400 group-hover:text-cyan-300 transition-colors mb-4"/>
                <h3 className="text-2xl font-bold font-title text-gray-200">Nhập Vai Nhân Vật</h3>
                <p className="text-sm text-gray-500 mt-2">Chọn một nhân vật có sẵn trong thế giới Phong Thần hoặc từ các mod đã cài đặt.</p>
              </button>
               <button disabled className="group flex flex-col items-center p-6 bg-black/30 rounded-lg border-2 border-gray-800 cursor-not-allowed opacity-60">
                <GiScrollQuill className="text-6xl text-gray-600 mb-4"/>
                <h3 className="text-2xl font-bold font-title text-gray-600">Trả Lời Câu Hỏi</h3>
                <p className="text-sm text-gray-700 mt-2">(Sắp ra mắt) AI sẽ hỏi bạn một loạt câu hỏi để xác định nhân vật của bạn.</p>
              </button>
            </div>
          </div>
        );
      
      case 'idea':
        return (
          <div className="text-center max-w-2xl mx-auto animate-fade-in">
            <h2 className="text-3xl font-bold font-title">Nêu Lên Ý Tưởng Của Bạn</h2>
            <p className="text-gray-400 mt-2 mb-6">Mô tả nhân vật mà bạn muốn tạo ra. AI sẽ dựa vào đây để tạo thân phận và tiên tư.</p>
            {generationError && <p className="text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30 mb-4">{generationError}</p>}
            <textarea
              value={characterConcept}
              onChange={(e) => setCharacterConcept(e.target.value)}
              rows={4}
              placeholder="Ví dụ: Một tán tu bí ẩn chuyên dùng độc, xuất thân từ một ngôi làng bị tàn sát, mang trong mình mối thù sâu đậm..."
              className="w-full bg-gray-900/50 border border-gray-600 rounded-md p-3 text-lg text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-400/50 transition-all"
            />
            <div className="flex justify-center items-center gap-4 mt-4">
              <p className="text-gray-400">Giới tính:</p>
              {GENDERS.map(g => (
                <button key={g} onClick={() => setGender(g)} className={`px-4 py-2 text-sm rounded-md border transition-all duration-200 ${gender === g ? 'bg-teal-500/20 border-teal-400 text-white' : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'}`}>
                  {g}
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-center gap-4">
              <button onClick={() => setStep('modeSelection')} className="px-6 py-3 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80">Quay Lại</button>
              <button onClick={handleGenerateIdentity} className="px-6 py-3 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80">Tiếp Tục</button>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto animate-fade-in">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold font-title text-center">Thân Phận & Tiên Tư</h2>
              <CharacterIdentityDisplay identity={identity} onIdentityChange={handleIdentityChange} />
              {generationError && <p className="text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30">{generationError}</p>}
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Chọn Tiên Tư (Tối đa {modTalentConfig.systemConfig.maxSelectable})</h3>
                <button onClick={handleGenerateTalents} className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/80 text-white text-xs font-bold rounded-lg hover:bg-gray-600/80 transition-colors">
                    <FaDice /> Tung Xúc Xắc Lại
                </button>
              </div>
              <InnateTalentSelection 
                  talents={talentChoices} 
                  selectedTalents={selectedTalents}
                  onSelectionChange={setSelectedTalents}
                  maxSelectable={modTalentConfig.systemConfig.maxSelectable}
              />
              <NpcDensitySelector value={npcDensity} onChange={setNpcDensity} />
               <button 
                onClick={handleFinalize} 
                disabled={selectedTalents.length === 0 || selectedTalents.length > modTalentConfig.systemConfig.maxSelectable}
                className="w-full py-4 bg-teal-700/80 text-white text-xl font-bold rounded-lg hover:bg-teal-600/80 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
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
          <Timeline gameDate={gameDate} />
        </div>
        <div className="w-9 h-9"></div>
      </div>
      <div className="max-h-[calc(100vh-18rem)] min-h-[50vh] overflow-y-auto pr-2 flex flex-col justify-center">
        {renderContent()}
      </div>
    </div>
  );
});
