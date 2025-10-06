import React, { useState, useMemo } from 'react';
import { FaPaperPlane, FaComment, FaBolt, FaBrain, FaChevronUp, FaChevronDown, FaUser, FaMapMarkedAlt, FaBookOpen } from 'react-icons/fa';
import { GiSprout, GiSwapBag, GiStairsGoal, GiPerson } from 'react-icons/gi';
import type { Location, GameState, QuickActionButtonConfig } from '../../../types';
import { UI_ICONS, DEFAULT_BUTTONS } from '../../../constants';
import { useAppContext } from '../../../contexts/AppContext';
import { useGameUIContext } from '../../../contexts/GameUIContext';

type ActionType = 'say' | 'act' | 'ask';

interface ActionBarProps {
    onInputSubmit: (text: string) => void;
    onContextualAction: (actionId: string, actionLabel: string) => void;
    disabled: boolean;
    currentLocation: Location;
    activeTab: ActionType;
    setActiveTab: (tab: ActionType) => void;
    gameState: GameState;
    onToggleSidebar: () => void;
}

const QuickActionButton: React.FC<{ 
    onClick: () => void; 
    disabled?: boolean; 
    title?: string; 
    children: React.ReactNode 
}> = ({ onClick, disabled, title, children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className="btn btn-neumorphic !text-sm !py-2 !px-3"
    >
        {children}
    </button>
);

const ActionBar: React.FC<ActionBarProps> = ({ onInputSubmit, onContextualAction, disabled, currentLocation, activeTab, setActiveTab, gameState, onToggleSidebar }) => {
    const [inputText, setInputText] = useState('');
    const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(true);
    
    const { openInventoryModal, showNotification } = useGameUIContext();
    const { handlePlayerAction, handleNavigate } = useAppContext();

    const { activeMods } = gameState;
   
    const buttonsToDisplay = useMemo((): QuickActionButtonConfig[] => {
        let locationSpecificBar = null;
        let modDefaultBar = null;

        for (const mod of activeMods) {
            if (!mod.content.quickActionBars) continue;

            const foundLocationBar = mod.content.quickActionBars.find(bar => 
                bar.context.type === 'LOCATION' && bar.context.value.includes(currentLocation.id)
            );
            if (foundLocationBar) {
                locationSpecificBar = foundLocationBar;
            }
            
            const foundDefaultBar = mod.content.quickActionBars.find(bar => bar.context.type === 'DEFAULT');
            if (foundDefaultBar) {
                modDefaultBar = foundDefaultBar;
            }
        }

        if (locationSpecificBar) return locationSpecificBar.buttons;
        if (modDefaultBar) return modDefaultBar.buttons;
        
        return DEFAULT_BUTTONS;
    }, [activeMods, currentLocation.id]);

    const handleQuickAction = (button: QuickActionButtonConfig) => {
        if (disabled) return;
        if (button.id === 'inventory') {
            openInventoryModal();
            return;
        }
        if (button.id === 'dashboard') {
            onToggleSidebar();
            return;
        }
        if (button.id === 'wiki') {
            handleNavigate('wikiScreen');
            return;
        }
        handlePlayerAction(button.actionText, 'act', 1, showNotification);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputText.trim() && !disabled) {
            onInputSubmit(inputText);
            setInputText('');
        }
    };

    const placeholder = activeTab === 'act'
        ? 'Bạn muốn làm gì? (ví dụ: tu luyện, khám phá xung quanh...)'
        : activeTab === 'say'
        ? 'Bạn muốn nói gì?'
        : 'Bạn muốn hỏi Thiên Cơ điều gì? (vd: Khương Tử Nha là ai?)';

    return (
        <div className="flex-shrink-0 p-3 bg-[var(--bg-color)] border-t border-[var(--shadow-light)]">
            <div className="rounded-lg mb-3" style={{boxShadow: 'var(--shadow-raised-interactive)'}}>
                 <button
                    onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
                    className="w-full flex justify-between items-center p-2 text-[var(--text-color)] hover:bg-[var(--shadow-light)]/20 rounded-t-lg transition-colors"
                >
                    <span className="font-bold font-title">Hành Động Nhanh</span>
                    {isQuickActionsOpen ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {isQuickActionsOpen && (
                    <div className="p-3 border-t border-[var(--shadow-dark)] grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {buttonsToDisplay.map(button => {
                            const Icon = UI_ICONS[button.iconName as keyof typeof UI_ICONS] || FaBolt;
                            return (
                                <QuickActionButton 
                                    key={button.id} 
                                    onClick={() => handleQuickAction(button)} 
                                    disabled={disabled} 
                                    title={button.description}
                                >
                                    <Icon /> {button.label}
                                </QuickActionButton>
                            );
                        })}
                        {currentLocation.contextualActions?.map(action => {
                            const Icon = UI_ICONS[action.iconName as keyof typeof UI_ICONS] || FaBolt;
                            return (
                                <QuickActionButton
                                    key={action.id}
                                    onClick={() => onContextualAction(action.id, action.label)}
                                    disabled={disabled}
                                    title={action.description}
                                >
                                    <Icon /> {action.label}
                                </QuickActionButton>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex gap-1 p-1 rounded-lg mb-2" style={{boxShadow: 'var(--shadow-pressed)'}}>
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
                <TabButton
                    label="Hỏi Thiên Cơ"
                    icon={FaBrain}
                    isActive={activeTab === 'ask'}
                    onClick={() => setActiveTab('ask')}
                />
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="input-neumorphic !text-lg flex-grow"
                />
                <button
                    type="submit"
                    disabled={disabled || !inputText.trim()}
                    className="btn btn-primary !rounded-full !p-3 h-14 w-14"
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
        className={`w-1/3 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-all duration-200 ${
            isActive ? 'text-[var(--primary-accent-color)] shadow-[var(--shadow-pressed)]' : 'text-[var(--text-muted-color)] hover:text-[var(--text-color)]'
        }`}
    >
        <Icon /> {label}
    </button>
);

export default ActionBar;