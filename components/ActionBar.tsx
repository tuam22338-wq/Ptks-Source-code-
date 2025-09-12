import React from 'react';
import { FaHandHoldingWater, FaSearchLocation } from 'react-icons/fa';
import { Location } from '../types';

interface ActionBarProps {
    onAction: (action: string, data?: any) => void;
    disabled: boolean;
    currentLocation: Location;
}

const ActionButton: React.FC<{ icon: React.ElementType, label: string, onClick: () => void, disabled: boolean }> = ({ icon: Icon, label, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className="flex-1 flex flex-col items-center justify-center p-2 bg-gray-800/60 rounded-lg border border-gray-700 hover:bg-gray-700/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
        <Icon className="w-6 h-6 text-amber-300 mb-1" />
        <span className="text-xs font-semibold text-gray-200">{label}</span>
    </button>
);

const ActionBar: React.FC<ActionBarProps> = ({ onAction, disabled, currentLocation }) => {
    return (
        <div className="flex-shrink-0 p-4 bg-black/40 backdrop-blur-sm border-t border-gray-700/50">
            <div className="flex gap-2">
                <ActionButton icon={FaHandHoldingWater} label="Tu Luyện" onClick={() => onAction('CULTIVATE')} disabled={disabled} />
                {currentLocation.isExplorable && (
                    <ActionButton icon={FaSearchLocation} label="Khám Phá" onClick={() => onAction('EXPLORE')} disabled={disabled} />
                )}
                {/* Future context-specific actions can be added here */}
            </div>
        </div>
    );
};

export default ActionBar;
