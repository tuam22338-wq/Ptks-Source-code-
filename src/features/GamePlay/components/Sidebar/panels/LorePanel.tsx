import React, { memo } from 'react';
import { FaSun } from 'react-icons/fa';
import { MAJOR_EVENTS } from '../../../../../constants';

const LorePanel: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
      <div>
        <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
          <FaSun className="text-yellow-300" /> Phong Thần Niên Biểu
        </h3>
        <div className="space-y-3 max-h-[75vh] overflow-y-auto pr-2">
          {MAJOR_EVENTS.map((event) => (
            <div key={event.title} className="p-3 bg-black/20 rounded-lg border border-gray-700/60">
                <p className="text-xs font-bold text-amber-300">Năm {event.year}</p>
                <h4 className="mt-1 font-bold text-gray-200 font-title">{event.title}</h4>
                
                <div className="mt-2 pt-2 border-t border-gray-700/50 space-y-1 text-xs">
                    <p className="text-gray-400"><strong className="text-gray-300">Địa điểm:</strong> {event.location}</p>
                    <p className="text-gray-400"><strong className="text-gray-300">Liên quan:</strong> {event.involvedParties}</p>
                    <p className="mt-2 text-gray-300">{event.summary}</p>
                    <p className="mt-1 text-red-300/90"><strong className="text-red-300">Hệ quả:</strong> {event.consequences}</p>
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(LorePanel);