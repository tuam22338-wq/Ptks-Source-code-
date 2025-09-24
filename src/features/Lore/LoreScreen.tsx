

import React, { memo, useMemo } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { PT_MAJOR_EVENTS, JTTW_MAJOR_EVENTS } from '../../constants';
import { useAppContext } from '../../contexts/AppContext';

const ThoiTheScreen: React.FC = () => {
  const { handleNavigate, state } = useAppContext();

  const { events, title, description } = useMemo(() => {
    if (state.activeWorldId === 'tay_du_ky') {
        return { 
            events: JTTW_MAJOR_EVENTS, 
            title: 'Tây Du Niên Biểu',
            description: 'Hành trình đến Tây Thiên thỉnh kinh đầy gian nan của bốn thầy trò Đường Tăng, vượt qua 81 kiếp nạn, đối đầu vô số yêu ma quỷ quái.'
        };
    }
    // Default to Phong Than
    return { 
        events: PT_MAJOR_EVENTS, 
        title: 'Thời Thế Loạn Lạc',
        description: 'Thế giới đang trong cơn biến động. Thiên mệnh đã định, nhưng lựa chọn là của bạn. Hãy xem xét các sự kiện lớn đang diễn ra để quyết định con đường của mình.'
    };
  }, [state.activeWorldId]);

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
        {events.map((event, index) => (
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
        ))}
      </div>
    </div>
  );
};

export default memo(ThoiTheScreen);