import React, { memo, useState, useEffect } from 'react';
import type { GameDate, MajorEvent } from '../../../types';
import { FaArrowLeft, FaSave, FaExpand } from 'react-icons/fa';
import { GiPerson } from 'react-icons/gi';
import Timeline from '../../../components/Timeline';

interface TopBarProps {
    onBack: () => void;
    onSave: () => void;
    gameDate: GameDate;
    majorEvents: MajorEvent[];
    isSummaryPanelVisible: boolean;
    onToggleSummaryPanel: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onBack, onSave, gameDate, majorEvents, isSummaryPanelVisible, onToggleSummaryPanel }) => {
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                alert(`Lỗi khi bật chế độ toàn màn hình: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    return (
        <header className="flex-shrink-0 flex items-center justify-between p-2 sm:p-3 bg-[var(--bg-subtle)] backdrop-blur-sm border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
                <button 
                    onClick={onBack} 
                    className="p-2 rounded-full text-[var(--text-muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--bg-interactive-hover)] transition-colors"
                    title="Quay Lại Menu"
                >
                    <FaArrowLeft className="w-5 h-5" />
                </button>
                <button 
                    onClick={onSave} 
                    className="p-2 rounded-full text-[var(--text-muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--bg-interactive-hover)] transition-colors"
                    title="Lưu Game"
                >
                    <FaSave className="w-5 h-5" />
                </button>
                <button
                    onClick={onToggleSummaryPanel}
                    className={`p-2 rounded-full text-[var(--text-muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--bg-interactive-hover)] transition-colors ${isSummaryPanelVisible ? 'text-amber-300' : ''}`}
                    title="Bảng Trạng Thái"
                >
                    <GiPerson className="w-5 h-5" />
                </button>
                {!isFullscreen && (
                    <button 
                        onClick={handleFullscreen} 
                        className="p-2 rounded-full text-[var(--text-muted-color)] hover:text-[var(--text-color)] hover:bg-[var(--bg-interactive-hover)] transition-colors"
                        title="Toàn Màn Hình"
                    >
                        <FaExpand className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="flex-grow flex justify-center">
                <Timeline gameDate={gameDate} majorEvents={majorEvents} />
            </div>

            <div className="w-9 h-9">
                {/* Spacer for centering Timeline */}
            </div>
        </header>
    );
};

export default memo(TopBar);