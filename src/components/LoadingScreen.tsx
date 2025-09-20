import React, { memo, useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingScreenProps {
    message: string;
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
    const [timer, setTimer] = useState(0);
    const isGeneratingWorld = message.includes('khởi tạo thế giới mới');

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        if (isGeneratingWorld) {
            setTimer(0);
            interval = setInterval(() => {
                setTimer(t => t + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isGeneratingWorld]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-900/90 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '500ms'}}>
            <LoadingSpinner message={message} size="lg" />
            {isGeneratingWorld && (
                <div className="text-center mt-4">
                    <p className="text-2xl font-mono text-amber-300">{formatTime(timer)}</p>
                    <p className="text-sm text-gray-400 mt-1">Thời gian tạo thế giới có thể từ 3-5 phút, hãy kiên nhẫn.</p>
                </div>
            )}
        </div>
    );
};

export default memo(LoadingScreen);