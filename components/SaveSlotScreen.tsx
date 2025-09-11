import React from 'react';
import type { SaveSlot } from '../types';
import { FaArrowLeft } from 'react-icons/fa';
import { REALM_SYSTEM } from '../constants';

interface SaveSlotScreenProps {
  slots: SaveSlot[];
  onSelectSlot: (slotId: number) => void;
  onBack: () => void;
}

const formatSaveDate = (isoDate?: string) => {
    if (!isoDate) return 'Chưa lưu';
    try {
        const date = new Date(isoDate);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return 'Ngày không hợp lệ';
    }
}

const SaveSlotCard: React.FC<{ slot: SaveSlot; onSelect: () => void; }> = ({ slot, onSelect }) => {
    const isNew = slot.data === null;
    const character = slot.data?.playerCharacter;
    
    let realmDisplay = '...';
    if (character) {
        const realmData = REALM_SYSTEM.find(r => r.id === character.cultivation.currentRealmId);
        const stageData = realmData?.stages.find(s => s.id === character.cultivation.currentStageId);
        realmDisplay = `${realmData?.name || ''} ${stageData?.name || ''}`;
    }

    return (
        <button
          onClick={onSelect}
          className={`group aspect-[3/4] p-4 rounded-lg border-2
                     flex flex-col items-center justify-center text-center
                     transition-all duration-300 ease-in-out transform hover:scale-105
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
                     ${isNew ? 'bg-black/20 border-gray-700/80 hover:border-gray-400 hover:bg-black/30 focus:ring-gray-400' 
                             : 'bg-teal-900/20 border-teal-500/50 hover:border-teal-400 hover:bg-teal-900/30 focus:ring-teal-400'}`}
        >
          {isNew ? (
            <>
              <span className="text-5xl text-gray-500 group-hover:text-gray-300 transition-colors duration-300">
                ?
              </span>
              <h3 className="mt-4 font-title text-xl text-gray-400 group-hover:text-white transition-colors duration-300">
                Hành Trình Mới
              </h3>
              <p className="text-sm text-gray-500">Bắt đầu một định mệnh mới</p>
            </>
          ) : (
             <div className="flex flex-col h-full justify-between w-full">
                <div>
                    <h3 className="font-title text-xl text-amber-300">{character?.identity.name}</h3>
                    <p className="text-xs text-cyan-300">{realmDisplay}</p>
                </div>
                <div className="text-center">
                    <p className="text-[10px] text-gray-400">Lần cuối lưu:</p>
                    <p className="text-xs text-gray-300">{formatSaveDate(slot.data?.lastSaved)}</p>
                </div>
             </div>
          )}
        </button>
    );
};


const SaveSlotScreen: React.FC<SaveSlotScreenProps> = ({ slots, onSelectSlot, onBack }) => {
  return (
    <div className="w-full animate-fade-in bg-black/30 backdrop-blur-md rounded-lg shadow-2xl shadow-black/50 border border-gray-700/50 p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-3xl text-gray-200 font-bold font-title">Thiên Mệnh Thư</h2>
         <button 
          onClick={onBack} 
          className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
          title="Quay Lại Menu"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
      </div>
      <p className="text-center text-gray-400 mb-8">Hãy chọn một trang để viết nên câu chuyện của riêng bạn, hoặc tiếp tục một hành trình dang dở.</p>

      <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto">
        {slots.map((slot) => (
          <SaveSlotCard 
            key={slot.id} 
            slot={slot} 
            onSelect={() => onSelectSlot(slot.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default SaveSlotScreen;
