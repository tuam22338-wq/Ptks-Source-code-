import React, { useState, useMemo } from 'react';
import { FaPaperPlane, FaComment, FaBolt, FaBrain, FaChevronUp, FaChevronDown, FaUser, FaMapMarkedAlt, FaBookOpen } from 'react-icons/fa';
import { GiSprout, GiSwapBag, GiStairsGoal, GiPerson } from 'react-icons/gi';
import type { Location, GameState, QuickActionButtonConfig } from '../../../types';
import { UI_ICONS, DEFAULT_BUTTONS } from '../../../constants';
import { useAppContext } from '../../../contexts/AppContext';
import { useGameUIContext } from '../../../contexts/GameUIContext';
// FIX: Import useGameContext to access game-specific actions.
import { useGameContext } from '../../../contexts/GameContext';

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
    // FIX: handleNavigate is from AppContext, but handlePlayerAction has moved to GameContext.
    const { handleNavigate } = useAppContext();
    const { handlePlayerAction } = useGameContext();

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
            <div className="rounded-lg mb-3" style={{boxShadow: 'var(--shadow-raised-interactive)'