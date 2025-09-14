
import React, { useState } from 'react';
import { FaPaperPlane, FaComment, FaBolt } from 'react-icons/fa';
import type { Location } from '../../types';

type ActionType = 'say' | 'act';

interface ActionBarProps {
    onActionSubmit: (text: string, type: ActionType) => void;
    disabled: boolean;
    currentLocation: Location;
    activeTab: ActionType;
    setActiveTab: (tab: ActionType) => void;
}

const ActionBar: React.FC<ActionBarProps> = ({ onActionSubmit, disabled, currentLocation, activeTab, setActiveTab }) => {
    const [inputText, setInputText] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim() && !disabled) {
            onActionSubmit(inputText, activeTab);
            setInputText('');
        }
    };
    
    const handleContextualAction = (label: string) => {
        if (!disabled) {
            onActionSubmit(label, 'act');
        }
    };

    const placeholder = activeTab === 'act'
        ? 'Bạn muốn làm gì? (ví dụ: tu luyện, khám phá xung quanh...)'
        : 'Bạn muốn nói gì?';

    return (
        <div className="flex-shrink-0 p-3 bg-black/40 backdrop-blur-sm border-t border-gray-700/50">
            {currentLocation.contextualActions && currentLocation.contextualActions.length > 0 && (
                <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1 text-center">Hành động đặc biệt tại {currentLocation.name}</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {currentLocation.contextualActions.map(action => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.id}
                                    onClick={() => handleContextualAction(action.label)}
                                    disabled={disabled}
                                    title={action.description}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 text-gray-200 text-sm font-semibold rounded-lg hover:bg-gray-600/70 disabled:opacity-50 transition-colors"
                                >
                                    {Icon && <Icon />}
                                    {action.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            <div className="flex gap-1 p-1 bg-black/20 rounded-lg border border-gray-700/60 mb-2">
                <TabButton
                    label="Hành Động"
                    icon={FaBolt}
                    isActive={activeTab === 'act'}
                    onClick={() => setActiveTab('act')}
                />
                <TabButton
                    label="Nói"
                    icon={FaComment}
                    isActive={activeTab === 'say'}
                    onClick={() => setActiveTab('say')}
                />
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full bg-gray-900/50 border border-gray-600 rounded-lg px-4 py-2 text-lg text-gray-200 focus:outline-none focus:ring-1 focus:ring-amber-400/50 transition-all disabled:opacity-50"
                />
                <button
                    type="submit"
                    disabled={disabled || !inputText.trim()}
                    className="flex-shrink-0 px-5 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    <FaPaperPlane />
                </button>
            </form>
        </div>
    );
};

const TabButton: React.FC<{label: string, icon: React.ElementType, isActive: boolean, onClick: () => void}> = ({ label, icon: Icon, isActive, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-1/2 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-colors ${
            isActive ? 'bg-gray-700/80 text-white' : 'text-gray-400 hover:bg-gray-800/50'
        }`}
    >
        <Icon /> {label}
    </button>
);


export default ActionBar;