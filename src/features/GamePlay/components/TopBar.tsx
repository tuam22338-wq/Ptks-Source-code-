import React, { memo, useState, useEffect } from 'react';
import type { GameDate, MajorEvent, DynamicWorldEvent, ForeshadowedEvent } from '../../../types';
import { FaArrowLeft, FaSave, FaExpand } from 'react-icons/fa';
import Timeline from '../../../components/Timeline';

interface TopBarProps {
    onBack: () => void;
    onSave: () => void;
    gameDate: GameDate;
    currentLocationName: string;
    majorEvents: MajorEvent[];
    dynamicEvents?: DynamicWorldEvent[];
    foreshadowedEvents?: ForeshadowedEvent[];
}

const TopBar: React.FC<TopBarProps> = ({ onBack, onSave, gameDate, currentLocationName, majorEvents, dynamicEvents, foreshadowedEvents }) => {
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
        <header className="flex-shrink-0 flex items-center justify-between p-2 sm:p-3 bg-[var(--bg-color)]"
            style={{boxShadow: 'var(--shadow-raised)'}}
        >
            <div className="flex items-center gap-2 w-48">
                <button 
                    onClick={onBack} 
                    className="btn btn-neumorphic !p-2 !rounded-full"
                    title="Quay Lại Menu"
                >
                    <FaArrowLeft className="w-5 h-5" />
                </button>
                <button 
                    onClick={onSave} 
                    className="btn btn-neumorphic !p-2 !rounded-full"
                    title="Lưu Game"
                >
                    <FaSave className="w-5 h-5" />
                </button>
                {!isFullscreen && (
                    <button 
                        onClick={handleFullscreen} 
                        className="btn btn-neumorphic !p-2 !rounded-full"
                        title="Toàn Màn Hình"
                    >
                        <FaExpand className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="flex-grow flex justify-center">
                <Timeline gameDate={gameDate} majorEvents={majorEvents} dynamicEvents={dynamicEvents} foreshadowedEvents={foreshadowedEvents} currentLocationName={currentLocationName} />
            </div>

            <div className="w-48">
                {/* Spacer for centering Timeline */}
            </div>
        </header>
    );
};

export default memo(TopBar);