import React, { memo } from 'react';

interface LoadingSpinnerProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message, size = 'md' }) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-16 h-16',
        lg: 'w-24 h-24',
    };
    const textSizeClass = size === 'sm' ? 'text-xs' : 'text-lg';
  return (
    <div className="flex flex-col items-center justify-center space-y-2 p-2">
      <div className={`${sizeClasses[size]} border-4 border-dashed rounded-full animate-spin border-amber-400`}></div>
      {message && <p className={`text-amber-300 ${textSizeClass} font-title text-center`}>{message}</p>}
    </div>
  );
};

export default memo(LoadingSpinner);