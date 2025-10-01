import React, { memo } from 'react';
import type { SaveSlot } from '../../types';
import { REALM_SYSTEM, CURRENT_GAME_VERSION } from '../../constants';
import { FaArrowLeft, FaTrash, FaTools } from 'react-icons/fa';
import { useAppContext } from '../../contexts/AppContext';

interface SaveSlotCardProps {
    slot: SaveSlot;
    onSelect: () => void;
    onDelete: () => void;
    onVerify: () => void;
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

const SaveSlotCard: React.FC<SaveSlotCardProps> = memo(({ slot, onSelect, onDelete, onVerify }) => {
    const isOutdated = slot.data?.version !== CURRENT_GAME_VERSION;
    const character = slot.data?.playerCharacter;
    
    let realmDisplay = '...';
    if (character) {
        const realmSystem = slot.data?.realmSystem || REALM_SYSTEM;
        const realmData = realmSystem.find(r => r.id === character.cultivation.currentRealmId);
        const stageData = realmData?.stages.find(s => s.id === character.cultivation.currentStageId);
        realmDisplay = `${realmData?.name || ''} ${stageData?.name || ''}`;
    }

    const outdatedClass = isOutdated ? 'border-amber-500 ring-2 ring-amber-500/30' : '';

    return (
        <div className={`group relative h-64 rounded-lg border-2
                        transition-all duration-300 ease-in-out transform hover:-translate-y-1
                        focus:outline-none focus:ring-2 focus:ring-offset-2 ring-offset-[var(--bg-color)]
                        bg-amber-900/10 border-amber-600/50 hover:border-amber-500 hover:bg-amber-800/20 focus:ring-[var(--primary-accent-color)] ${outdatedClass}`}
        >
            <button
              onClick={onSelect}
              className="w-full h-full flex flex-col items-center justify-center text-center p-4"
            >
                 <div className="flex flex-col h-full justify-between w-full">
                    <div className="writing-vertical">
                        <h3 className="font-calligraphy text-4xl text-[var(--primary-accent-color)]">{character?.identity.name}</h3>
                        <p className="font-title text-lg text-cyan-300 mt-2">{realmDisplay}</p>
                    </div>
                    <div className="text-center">
                        {isOutdated && (
                            <div className="mb-1">
                                <span className="text-[10px] bg-amber-700/80 text-amber-200 rounded-full px-2 py-0.5 font-semibold animate-pulse">
                                    Cần cập nhật
                                </span>
                            </div>
                        )}
                        <p className="text-[10px] text-[var(--text-muted-color)]">Lần cuối lưu:</p>
                        <p className="text-xs text-[var(--text-color)]">{formatSaveDate(slot.data?.lastSaved)}</p>
                    </div>
                 </div>
            </button>
            <div className="absolute top-1.5 right-1.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => { e.stopPropagation(); onVerify(); }}
                className={`p-1.5 bg-[var(--bg-interactive)] rounded-full text-[var(--text-muted-color)] hover:bg-blue-600/80 hover:text-white transition-colors ${isOutdated ? 'text-amber-300 animate-pulse' : ''}`}
                title={isOutdated ? "Cập nhật save file lên phiên bản mới" : "Kiểm tra và sửa lỗi"}
              >
                <FaTools size={12} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 bg-[var(--bg-interactive)] rounded-full text-[var(--text-muted-color)] hover:bg-red-600/80 hover:text-white transition-colors"
                title="Xóa"
              >
                <FaTrash size={12} />
              </button>
            </div>
        </div>
    );
});


const LoadGameScreen: React.FC = () => {
  const { state, handleSlotSelection, handleNavigate, handleDeleteGame, handleVerifyAndRepairSlot } = useAppContext();
  const savedGames = state.saveSlots.filter(slot => slot.data !== null);

  return (
    <div className="w-full animate-fade-in flex flex-col h-full min-h-0">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-3xl font-bold font-title">Tải Hành Trình</h2>
         <button 
          onClick={() => handleNavigate('mainMenu')} 
          className="p-2 rounded-full text-[var(--text-muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--bg-interactive-hover)] transition-colors"
          title="Quay Lại Menu"
        >
          <FaArrowLeft className="w-5 h-5" />
        </button>
      </div>
      <p className="text-center mb-8" style={{color: 'var(--text-muted-color)'}}>Tiếp tục một hành trình dang dở.</p>
      
      {savedGames.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 max-w-2xl mx-auto">
            {savedGames.map((slot) => (
            <SaveSlotCard 
                key={slot.id} 
                slot={slot} 
                onSelect={() => handleSlotSelection(slot.id)}
                onDelete={() => handleDeleteGame(slot.id)}
                onVerify={() => handleVerifyAndRepairSlot(slot.id)}
            />
            ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-16">
            <p>Không tìm thấy hành trình nào đã lưu.</p>
            <button onClick={() => handleNavigate('saveSlots')} className="mt-4 px-4 py-2 bg-amber-600/80 text-white rounded-md">
                Tạo Thế Giới Mới
            </button>
        </div>
      )}
    </div>
  );
};

export default memo(LoadGameScreen);
