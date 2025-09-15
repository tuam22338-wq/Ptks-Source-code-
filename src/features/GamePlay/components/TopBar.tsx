import React, { memo } from 'react';
import type { GameDate, MajorEvent } from '../../../types';
import { FaArrowLeft, FaSave, FaBars } from 'react-icons/fa';
import Timeline from '../../../components/Timeline';
import { useGameUIContext } from '../../../contexts/GameUIContext';

interface TopBarProps {
    onBack: () => void;
    onSave: () => void;
    gameDate: GameDate;
    majorEvents: MajorEvent[];
}

const TopBar: React.FC<TopBarProps> = ({ onBack, onSave, gameDate, majorEvents }) => {
    const { toggleSidebar } = useGameUIContext();
    return (
        <header className="flex-shrink-0 flex items-center justify-between p-2 sm:p-3 bg-black/40 backdrop-blur-sm border-b border-gray-700/50">
            <div className="flex items-center gap-2">
                <button 
                    onClick={onBack} 
                    className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                    title="Quay Lại Menu"
                >
                    <FaArrowLeft className="w-5 h-5" />
                </button>
                <button 
                    onClick={onSave} 
                    className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                    title="Lưu Game"
                >
                    <FaSave className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-grow flex justify-center">
                <Timeline gameDate={gameDate} majorEvents={majorEvents} />
            </div>

            <div className="flex items-center gap-2">
                {/* This button is automatically hidden on desktop via CSS in index.html */}
                <button 
                    onClick={toggleSidebar} 
                    className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors top-bar-sidebar-toggle"
                    title="Mở/Đóng Bảng Điều Khiển"
                >
                    <FaBars className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
};

export default memo(TopBar);
