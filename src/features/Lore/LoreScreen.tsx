import React, { memo, useState, useEffect } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { PT_MAJOR_EVENTS, JTTW_MAJOR_EVENTS } from '../../constants';
import { useAppContext } from '../../contexts/AppContext';
import * as db from '../../services/dbService';
import type { MajorEvent } from '../../types';
import LoadingSpinner from '../../components/LoadingSpinner';

interface LoreData {
    events: MajorEvent[];
    title: string;
    description: string;
}

const ThoiTheScreen: React.FC = () => {
  const { handleNavigate, state } = useAppContext();
  const [loreData, setLoreData] = useState<LoreData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadLore = async () => {
        setIsLoading(true);
        let foundLore = false;

        // 1. Check active mods first, as they have priority
        const enabledMods = state.installedMods.filter(m => m.isEnabled);
        for (const modInLib of enabledMods) {
            try {
                const modContent = await db.getModContent(modInLib.modInfo.id);
                const worldData = modContent?.content?.worldData?.find(w => w.name === state.activeWorldId);

                if (worldData && worldData.majorEvents) {
                    setLoreData({
                        events: worldData.majorEvents,
                        title: `Niên Biểu: ${worldData.name}`,
                        description: worldData.description
                    });
                    foundLore = true;
                    break; 
                }
            } catch (error) {
                console.error(`Error loading mod content for ${modInLib.modInfo.id}:`, error);
            }
        }

        if (foundLore) {
            setIsLoading(false);
            return;
        }

        // 2. If no mod lore was found, check for default worlds
        if (state.activeWorldId === 'tay_du_ky') {
            setLoreData({
                events: JTTW_MAJOR_EVENTS,
                title: 'Tây Du Niên Biểu',
                description: 'Hành trình đến Tây Thiên thỉnh kinh đầy gian nan của bốn thầy trò Đường Tăng, vượt qua 81 kiếp nạn, đối đầu vô số yêu ma quỷ quái.'
            });
        } else {
            // 3. Fallback to Phong Than Dien Nghia as the ultimate default
            setLoreData({
                events: PT_MAJOR_EVENTS,
                title: 'Thời Thế Loạn Lạc',
                description: 'Thế giới đang trong cơn biến động. Thiên mệnh đã định, nhưng lựa chọn là của bạn. Hãy xem xét các sự kiện lớn đang diễn ra để quyết định con đường của mình.'
            });
        }

        setIsLoading(false);
    };

    loadLore();
  }, [state.activeWorldId, state.installedMods]);

  if (isLoading || !loreData) {
      return (
        <div className="w-full animate-fade-in flex flex-col h-full min-h-0 items-center justify-center">
            <LoadingSpinner message="Đang tải dòng thời gian..." />
        </div>
      );
  }

  const { events, title, description } = loreData;

  return (
    <div className="w-full animate-fade-in flex flex-col h-full min-h-0">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold font-title">{title}</h2>
        <button
          onClick={() => handleNavigate('mainMenu')}
          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
          title="Quay Lại Menu"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
      </div>
      <p className="text-center mb-10" style={{color: 'var(--text-muted-color)'}}>{description}</p>

      <div className="flex-grow min-h-0 overflow-y-auto pr-4 space-y-8">
        {events.length > 0 ? events.map((event, index) => (
          <div key={index} className="bg-black/20 p-5 rounded-xl border-y-2 border-amber-800/50 flex flex-col animate-fade-in" style={{animationDelay: `${index * 50}ms`}}>
            <div className="pb-3 mb-4 text-center">
                <p className="text-lg font-bold text-amber-400 font-title tracking-wider">
                    Dự kiến: Năm {event.year}
                </p>
                <h3 className="mt-1 text-2xl font-bold font-title" style={{color: 'var(--text-color)'}}>
                    {event.title}
                </h3>
            </div>
            
            <div className="space-y-4 text-base flex-grow">
               <div className="flex items-start gap-3">
                 <p><strong className="font-semibold" style={{color: 'var(--text-color)'}}>Địa điểm:</strong> {event.location}</p>
               </div>
               <div className="flex items-start gap-3">
                 <p><strong className="font-semibold" style={{color: 'var(--text-color)'}}>Liên quan:</strong> {event.involvedParties}</p>
               </div>
               <div className="flex items-start gap-3">
                 <p className="text-justify" style={{color: 'var(--text-muted-color)'}}>{event.summary}</p>
               </div>
            </div>

            <div className="mt-5 pt-4 border-t border-gray-700">
               <div className="flex items-start gap-3">
                  <div>
                    <strong className="font-semibold text-red-400">Hệ quả:</strong>
                    <p className="text-sm text-red-400/90 mt-1">{event.consequences}</p>
                  </div>
               </div>
            </div>
          </div>
        )) : (
            <div className="text-center text-gray-500 p-8">
                <p>Thế giới này không có dòng lịch sử được định sẵn.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default memo(ThoiTheScreen);