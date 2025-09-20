import React from 'react';
import { GiDeathSkull } from 'react-icons/gi';
import { useAppContext } from '../../../../../contexts/AppContext';

const DeathPanel: React.FC = () => {
    const { quitGame, handleSlotSelection, currentSlotId } = useAppContext();

    const handleReload = () => {
        if (currentSlotId !== null) {
            // Re-selecting the current slot will trigger a reload from the last saved state.
            handleSlotSelection(currentSlotId);
        } else {
            // Fallback if there's no current slot, though this shouldn't happen.
            quitGame();
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-red-900/20 text-center animate-fade-in">
            <GiDeathSkull className="text-8xl text-red-400/80 mb-4" />
            <h2 className="text-4xl font-bold font-title text-red-300" style={{ textShadow: '0 0 10px #ef4444' }}>
                THÂN TỬ ĐẠO TIÊU
            </h2>
            <p className="text-gray-400 mt-2">
                Hành trình của bạn đã kết thúc. Linh hồn đã tiêu散, không còn trong tam giới.
            </p>
            <div className="mt-8 space-y-3 w-full max-w-xs">
                <button
                    onClick={handleReload}
                    className="w-full py-3 text-lg font-bold rounded-lg themed-button-primary"
                >
                    Tải Lại
                </button>
                <button
                    onClick={quitGame}
                    className="w-full py-2 text-md font-semibold bg-gray-700/80 text-white rounded-lg hover:bg-gray-600/80"
                >
                    Về Menu Chính
                </button>
            </div>
        </div>
    );
};

export default DeathPanel;
