import React, { memo } from 'react';
import type { MajorEvent } from '../../../../../types';

interface HistoryPanelProps {
    majorEvents: MajorEvent[];
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ majorEvents }) => {
  return (
    <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
        {majorEvents.length > 0 ? majorEvents.map((event, index) => (
          <div key={index} className="bg-black/20 p-3 rounded-xl border-y border-amber-800/50 flex flex-col">
            <div className="pb-2 mb-2 text-center">
                <p className="text-md font-bold text-amber-400 font-title tracking-wider">
                    Dự kiến: Năm {event.year}
                </p>
                <h3 className="mt-1 text-lg font-bold font-title" style={{color: 'var(--text-color)'}}>
                    {event.title}
                </h3>
            </div>
            
            <div className="space-y-2 text-sm flex-grow">
               <p className="text-xs text-justify" style={{color: 'var(--text-muted-color)'}}>{event.summary}</p>
            </div>

            <div className="mt-3 pt-2 border-t border-gray-700">
                <p className="text-xs text-red-400/90 mt-1"><strong className="font-semibold text-red-400">Hệ quả:</strong> {event.consequences}</p>
            </div>
          </div>
        )) : (
            <div className="text-center text-gray-500 p-8">
                <p>Thế giới này không có dòng lịch sử được định sẵn.</p>
            </div>
        )}
    </div>
  );
};

export default memo(HistoryPanel);
