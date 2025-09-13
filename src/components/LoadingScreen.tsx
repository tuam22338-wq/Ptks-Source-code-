import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingScreenProps {
    message: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/90 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '500ms'}}>
            <LoadingSpinner message={message} size="lg" />
        </div>
    );
};

export default LoadingScreen;