


import React, { memo, useState, useEffect, useMemo } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingScreenProps {
    message: string;
    isGeneratingWorld?: boolean;
    generationMode?: 'fast' | 'deep' | 'super_deep';
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const FAST_MESSAGES = [
    'AI đang đọc trang đầu tiên của Sáng Thế Ký...',
    'Đang phác họa bản đồ từ những dòng mô tả...',
    'Các ngọn núi đang được dựng lên, các dòng sông bắt đầu tuôn chảy...',
    'Đang nặn hình hài cho các vị anh hùng và ác nhân...',
    'Lịch sử vạn năm đang được khắc vào dòng thời gian...',
    'Rèn đúc thần binh từ những câu chữ huyền thoại...',
    'Thế giới đang dần thành hình...',
    'Gieo mầm nhân quả, an bài số mệnh...',
];

const DEEP_DIVE_MESSAGES = [
    'AI đang phân tích sâu các mối quan hệ ẩn giấu...',
    'Suy luận động cơ và mục tiêu cho từng sinh mệnh...',
    'Phát hiện và định hình các quy luật siêu hình của thế giới...',
    'Các phe phái đang hình thành âm mưu và liên minh...',
    'Khám phá những bí mật bị chôn vùi trong dòng lịch sử...',
    'Thế giới đang được dệt nên từ những sợi chỉ logic phức tạp...',
    'Sự kiện và nhân quả đang được liên kết chặt chẽ...',
];

const SUPER_DEEP_DIVE_MESSAGES = [
    'AI đang tiến vào trạng thái "Thiên Nhân Hợp Nhất" với lore...',
    'Mở rộng vũ trụ từ những gợi ý nhỏ nhất trong văn bản...',
    'Sáng tạo thêm các truyền thuyết và những câu chuyện bên lề...',
    'Thiết kế các sự kiện động phức tạp với nhiều hệ quả...',
    'Từng cành cây ngọn cỏ đang được thổi hồn...',
    'Đây không chỉ là sáng thế, đây là nghệ thuật...',
    'Quá trình này sẽ mất nhiều thời gian, nhưng kết quả sẽ xứng đáng...',
];


const LoadingScreen: React.FC<LoadingScreenProps> = ({ message, isGeneratingWorld = false, generationMode = 'fast' }) => {
    const [timer, setTimer] = useState(0);
    const [narrativeMessage, setNarrativeMessage] = useState(message);
    
    // FIX: Imported `useMemo` from React to resolve compilation error.
    const messageSet = useMemo(() => {
        switch (generationMode) {
            case 'deep': return DEEP_DIVE_MESSAGES;
            case 'super_deep': return SUPER_DEEP_DIVE_MESSAGES;
            case 'fast':
            default:
                return FAST_MESSAGES;
        }
    }, [generationMode]);


    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        let messageInterval: ReturnType<typeof setInterval> | undefined;

        if (isGeneratingWorld) {
            setTimer(0);
            setNarrativeMessage(messageSet[0]);

            interval = setInterval(() => {
                setTimer(t => t + 1);
            }, 1000);
            
            messageInterval = setInterval(() => {
                setNarrativeMessage(prev => {
                    const currentIndex = messageSet.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % messageSet.length;
                    return messageSet[nextIndex];
                });
            }, 5000); // Increased time for more complex messages
        } else {
            setNarrativeMessage(message);
        }

        return () => {
            if (interval) clearInterval(interval);
            if (messageInterval) clearInterval(messageInterval);
        };
    }, [isGeneratingWorld, message, messageSet]);

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