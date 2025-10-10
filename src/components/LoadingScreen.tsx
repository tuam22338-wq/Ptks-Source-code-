import React, { memo, useState, useEffect, useMemo } from 'react';
import LoadingSpinner from './LoadingSpinner';
// FIX: useAppContext is in its own file
import { useAppContext } from '../contexts/useAppContext';

interface LoadingScreenProps {
    message: string;
    isGeneratingWorld?: boolean;
    // FIX: Add 'generationMode' to props to support different loading messages.
    generationMode?: 'fast' | 'deep' | 'super_deep';
}

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message, isGeneratingWorld = false, generationMode }) => {
    const { state } = useAppContext();
    const narratives = state.loadingNarratives;

    const [timer, setTimer] = useState(0);
    const [currentNarrative, setCurrentNarrative] = useState('');

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

    useEffect(() => {
        let narrativeInterval: ReturnType<typeof setInterval> | undefined;
        if (narratives && narratives.length > 0) {
            let index = 0;
            setCurrentNarrative(narratives[index]);
            narrativeInterval = setInterval(() => {
                index = (index + 1) % narratives.length;
                setCurrentNarrative(narratives[index]);
            }, 4000); // Change narrative every 4 seconds
        } else {
            setCurrentNarrative(''); // Clear if no narratives
        }
        return () => {
            if (narrativeInterval) clearInterval(narrativeInterval);
        };
    }, [narratives]);


    // FIX: Use memoized text based on generation mode.
    const generationModeText = useMemo(() => {
        if (!generationMode) return 'Quá trình Sáng Thế có thể mất vài phút, hãy kiên nhẫn.';
        switch(generationMode) {
            case 'fast': return 'Chế độ Nhanh. Quá trình Sáng Thế có thể mất vài phút.';
            case 'deep': return 'Chế độ Chuyên Sâu. Quá trình Sáng Thế sẽ mất nhiều thời gian hơn.';
            case 'super_deep': return 'Chế độ Siêu Chuyên Sâu. Đây là quá trình tốn nhiều thời gian nhất, hãy kiên nhẫn.';
            default: return 'Quá trình Sáng Thế có thể mất vài phút, hãy kiên nhẫn.';
        }
    }, [generationMode]);


    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-900/90 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '500ms'}}>
            <LoadingSpinner message={message} size="lg" />
            <div className="text-center mt-4 min-h-[8rem] flex flex-col justify-center">
                {currentNarrative && (
                    <p className="text-lg text-[var(--secondary-accent-color)] italic animate-fade-in" key={currentNarrative}>
                        "{currentNarrative}"
                    </p>
                )}

                {isGeneratingWorld && (
                    <div className="mt-4">
                        <p className="text-2xl font-mono text-amber-300">{formatTime(timer)}</p>
                        <p className="text-sm text-[var(--text-muted-color)] mt-1">{generationModeText}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(LoadingScreen);
