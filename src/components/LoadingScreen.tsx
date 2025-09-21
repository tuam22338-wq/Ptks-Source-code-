
import React, { memo, useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingScreenProps {
    message: string;
    isGeneratingWorld?: boolean;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const GENERATING_MESSAGES = [
    'AI đang đọc trang đầu tiên của Sáng Thế Ký...',
    'Đang phác họa bản đồ từ những dòng mô tả...',
    'Các ngọn núi đang được dựng lên, các dòng sông bắt đầu tuôn chảy...',
    'Đang nặn hình hài cho các vị anh hùng và ác nhân...',
    'Lịch sử vạn năm đang được khắc vào dòng thời gian...',
    'Rèn đúc thần binh từ những câu chữ huyền thoại...',
    'Thế giới đang dần thành hình...',
    'Gieo mầm nhân quả, an bài số mệnh...',
];


const LoadingScreen: React.FC<LoadingScreenProps> = ({ message, isGeneratingWorld = false }) => {
    const [timer, setTimer] = useState(0);
    const [narrativeMessage, setNarrativeMessage] = useState(message);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        let messageInterval: ReturnType<typeof setInterval> | undefined;

        if (isGeneratingWorld) {
            setTimer(0);
            setNarrativeMessage(GENERATING_MESSAGES[0]);

            interval = setInterval(() => {
                setTimer(t => t + 1);
            }, 1000);
            
            messageInterval = setInterval(() => {
                setNarrativeMessage(prev => {
                    const currentIndex = GENERATING_MESSAGES.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % GENERATING_MESSAGES.length;
                    return GENERATING_MESSAGES[nextIndex];
                });
            }, 4000);
        } else {
            setNarrativeMessage(message);
        }

        return () => {
            if (interval) clearInterval(interval);
            if (messageInterval) clearInterval(messageInterval);
        };
    }, [isGeneratingWorld, message]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-900/90 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '500ms'}}>
            <LoadingSpinner message={isGeneratingWorld ? narrativeMessage : message} size="lg" />
            {isGeneratingWorld && (
                <div className="text-center mt-4">
                    <p className="text-2xl font-mono text-amber-300">{formatTime(timer)}</p>
                    <p className="text-sm text-gray-400 mt-1">Quá trình Sáng Thế có thể mất vài phút, hãy kiên nhẫn.</p>
                </div>
            )}
        </div>
    );
};

export default memo(LoadingScreen);
