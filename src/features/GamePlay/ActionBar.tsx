import React, { useState } from 'react';
import { FaPaperPlane, FaComment, FaBolt, FaLightbulb, FaSync } from 'react-icons/fa';
import { GiSprout } from 'react-icons/gi';
import type { Location, GameState } from '../../types';
// FIX: Corrected import path as generateActionSuggestions is now in a specific service file.
import { generateActionSuggestions } from '../../services/gemini/gameplay.service';

type ActionType = 'say' | 'act';

interface ActionBarProps {
    onActionSubmit: (text: string, type: ActionType) => void;
    onContextualAction: (actionId: string, actionLabel: string) => void;
    disabled: boolean;
    currentLocation: Location;
    activeTab: ActionType;
    setActiveTab: (tab: ActionType) => void;
    gameState: GameState;
}

const ActionBar: React.FC<ActionBarProps> = ({ onActionSubmit, onContextualAction, disabled, currentLocation, activeTab, setActiveTab, gameState }) => {
    const [inputText, setInputText] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim() && !disabled) {
            onActionSubmit(inputText, activeTab);
            setInputText('');
            setSuggestions([]);
        }
    };

    const handleGetSuggestions = async () => {
        if (isLoadingSuggestions || disabled) return;
        setIsLoadingSuggestions(true);
        setSuggestions([]);
        try {
            const result = await generateActionSuggestions(gameState);
            setSuggestions(result);
        } catch (error) {
            console.error("Failed to get suggestions:", error);
            setSuggestions(['Lỗi khi lấy gợi ý.']);
        } finally {
            setIsLoadingSuggestions(false);
        }
    };
    
    const handleSuggestionClick = (suggestion: string) => {
        if (disabled) return;
        onActionSubmit(suggestion, 'act');
        setSuggestions([]);
    };


    const placeholder = activeTab === 'act'
        ? 'Bạn muốn làm gì? (ví dụ: tu luyện, khám phá xung quanh...)'
        : 'Bạn muốn nói gì?';

    return (
        <div className="flex-shrink-0 p-3 bg-[var(--bg-subtle)] backdrop-blur-sm border-t border-[var(--border-subtle)]">
            {currentLocation.contextualActions && currentLocation.contextualActions.length > 0 && (
                <div className="mb-2">
                    <p className="text-xs text-[var(--text-muted-color)] mb-1 text-center">Hành động đặc biệt tại {currentLocation.name}</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {currentLocation.contextualActions.map(action => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.id}
                                    onClick={() => onContextualAction(action.id, action.label)}
                                    disabled={disabled}
                                    title={action.description}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-interactive)] text-[var(--text-color)] text-sm font-semibold rounded-lg hover:bg-[var(--bg-interactive-hover)] disabled:opacity-50 transition-colors"
                                >
                                    {Icon && <Icon />}
                                    {action.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            
            <div className="flex items-center justify-center gap-2 text-sm text-cyan-400 mb-2" title="Nồng độ linh khí ảnh hưởng đến hiệu quả tu luyện">
                <GiSprout />
                <span>Nồng độ Linh khí: {currentLocation.qiConcentration}</span>
            </div>

            {(suggestions.length > 0 || isLoadingSuggestions) && (
                <div className="flex flex-wrap gap-2 mb-2 items-center justify-center min-h-[38px]">
                    {isLoadingSuggestions && <FaSync className="animate-spin text-[var(--primary-accent-color)]" />}
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            onClick={() => handleSuggestionClick(s)}
                            disabled={disabled}
                            className="px-3 py-1.5 bg-[var(--bg-interactive)] text-[var(--text-color)] text-sm font-semibold rounded-lg hover:bg-[var(--bg-interactive-hover)] disabled:opacity-50 transition-colors animate-fade-in"
                            style={{animationDuration: '300ms'}}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}

            <div className="flex gap-1 p-1 bg-[var(--bg-interactive)] rounded-lg border border-[var(--border-subtle)] mb-2">
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
                    className="w-full bg-[var(--bg-interactive)] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-lg text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--input-focus-ring-color)] transition-all disabled:opacity-50"
                />
                <button
                    type="button"
                    onClick={handleGetSuggestions}
                    disabled={disabled || isLoadingSuggestions}
                    className="flex-shrink-0 px-4 py-2 bg-[var(--bg-interactive)] text-[var(--text-color)] font-bold rounded-lg hover:bg-[var(--bg-interactive-hover)] disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    title="Gợi ý từ AI"
                >
                    <FaLightbulb />
                </button>
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
            isActive ? 'bg-[var(--bg-interactive-hover)] text-[var(--text-color)]' : 'text-[var(--text-muted-color)] hover:bg-[var(--bg-interactive-hover)]'
        }`}
    >
        <Icon /> {label}
    </button>
);


export default ActionBar;