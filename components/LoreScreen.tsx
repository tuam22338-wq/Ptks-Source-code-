import React from 'react';
import { FaArrowLeft, FaMapMarkerAlt, FaUsers, FaExclamation, FaFileSignature } from 'react-icons/fa';
import { MAJOR_EVENTS } from '../constants';

interface LoreScreenProps {
  onBack: () => void;
}

const LoreScreen: React.FC<LoreScreenProps> = ({ onBack }) => {
  return (
    <div className="w-full animate-fade-in themed-panel rounded-lg shadow-2xl shadow-black/50 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl text-gray-200 font-bold font-title">Phong Thần Niên Biểu Bảng</h2>
        <button
          onClick={onBack}
          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
          title="Quay Lại Menu"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
      </div>
      <p className="text-center text-gray-400 mb-10">Những sự kiện trọng đại đã định hình nên thời đại loạn lạc này.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-4">
        {MAJOR_EVENTS.map((event, index) => (
          <div key={index} className="bg-black/20 p-5 rounded-xl border border-gray-700/60 flex flex-col h-full transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-900/30 animate-fade-in" style={{animationDelay: `${index * 50}ms`}}>
            {/* Header */}
            <div className="border-b-2 border-amber-800/50 pb-3 mb-4 text-center">
                <p className="text-lg font-bold text-amber-400 font-title tracking-wider">
                    Năm {event.year}
                </p>
                <h3 className="mt-1 text-2xl font-bold text-gray-100 font-title">
                    {event.title}
                </h3>
            </div>
            
            {/* Body */}
            <div className="space-y-4 text-base flex-grow">
               <div className="flex items-start gap-3">
                 <FaMapMarkerAlt className="text-gray-500 mt-1 flex-shrink-0" />
                 <p className="text-gray-300"><strong className="font-semibold text-gray-200">Địa điểm:</strong> {event.location}</p>
               </div>
               <div className="flex items-start gap-3">
                 <FaUsers className="text-gray-500 mt-1 flex-shrink-0" />
                 <p className="text-gray-300"><strong className="font-semibold text-gray-200">Liên quan:</strong> {event.involvedParties}</p>
               </div>
               <div className="flex items-start gap-3">
                 <FaFileSignature className="text-gray-500 mt-1 flex-shrink-0" />
                 <p className="text-gray-400 text-justify">{event.summary}</p>
               </div>
            </div>

            {/* Footer */}
            <div className="mt-5 pt-4 border-t border-gray-700">
               <div className="flex items-start gap-3">
                  <FaExclamation className="text-red-500 mt-1 flex-shrink-0" />
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

export default LoreScreen;