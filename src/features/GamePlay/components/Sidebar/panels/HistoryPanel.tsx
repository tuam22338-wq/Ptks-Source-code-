import React, { memo } from 'react';
import type { MajorEvent } from '../../../../../types';

interface HistoryPanelProps {
    majorEvents: MajorEvent[];
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ majorEvents }) => {
  return (
    <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
        {majorEvents.length > 0 ? majorEvents.map((event, index) => (
          <div key={index} className="neumorphic-inset-box p-3 flex flex-col">
            <div className="pb-2 mb-2 text-center">
                <p className="text-md font-bold font-title tracking-wider" style={{color: 'var(--primary-accent-color)'}}>
                    Dự kiến: Năm {event.year}
                </p>
                <h3 className="mt-1 text-lg font-bold font-title" style={{color: 'var(--text-color)'}}>
                    {event.title}
                </h3>
            </div>
            
            <div className="space-y-2 text-sm flex-grow">
               <p className="text-xs text-justify" style={{color: 'var(--text-muted-color)'}}>{event.summary}</p>
            </div>

            <div className="mt-3 pt-2 border-t" style={{borderColor: 'var(--shadow-light)'}}>
                <p className="text-xs text-red-400/90 mt-1"><strong className="font-semibold text-red-400">Hệ quả:</strong> {event.consequences}</p>
            </div>
          </div>
        )) : (
            <div className="text-center p-8" style={{color: 'var(--text-muted-color)'}}>
                <p>Thế giới này không có dòng lịch sử được định sẵn.</p>
            </div>
        )}
    </div>
  );
};

export default memo(HistoryPanel);