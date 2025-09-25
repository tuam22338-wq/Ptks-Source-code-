import React, { useState } from 'react';
import { FaPaperPlane, FaComment, FaBolt, FaBrain, FaChevronUp, FaChevronDown, FaUser, FaMapMarkedAlt } from 'react-icons/fa';
import { GiSprout, GiSwapBag, GiStairsGoal, GiPerson } from 'react-icons/gi';
import type { Location, GameState } from '../../../types';
import { UI_ICONS } from '../../../constants';
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
    handleBreakthrough: () => void;
    onToggleSidebar: () => void;
}

const QuickActionButton: React.FC<{ onClick: () => void; disabled?: boolean; title?: string; className?: string; children: React.ReactNode }> = ({ onClick, disabled, title, className = '', children }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`flex items-center justify-center gap-2 px-3 py-2 bg-[var(--bg-interactive)] text-[var(--text-color)] text-sm font-semibold rounded-lg hover:bg-[var(--bg-interactive-hover)] disabled:opacity-50 transition-colors ${className}`}
    >
        {children}
    </button>
);


const ActionBar: React.FC<ActionBarProps> = ({ onInputSubmit, onContextualAction, disabled, currentLocation, activeTab, setActiveTab, gameState, handleBreakthrough, onToggleSidebar }) => {
    const [inputText, setInputText] = useState('');
    const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(true);
    
    const { openInventoryModal } = useGameUIContext();
    const { handlePlayerAction } = useAppContext();

    const { playerCharacter, realmSystem } = gameState;
    const currentRealm = realmSystem.find(r => r.id === playerCharacter.cultivation.currentRealmId);
    const currentStageIndex = currentRealm?.stages.findIndex(s => s.id === playerCharacter.cultivation.currentStageId) ?? -1;
    let canBreakthrough = false;
    
    if (currentRealm && currentStageIndex !== -1) {
        if (currentStageIndex < currentRealm.stages.length - 1) {
            const nextStage = currentRealm.stages[currentStageIndex + 1];
            if (playerCharacter.cultivation.spiritualQi >= nextStage.qiRequired) {
                canBreakthrough = true;
            }
        } else {
            const currentRealmIndex = realmSystem.findIndex(r => r.id === currentRealm.id);
            if (currentRealmIndex !== -1 && currentRealmIndex < realmSystem.length - 1) {
                 const nextRealm = realmSystem[currentRealmIndex + 1];
                 if (playerCharacter.cultivation.spiritualQi >= nextRealm.stages[0].qiRequired) {
                     canBreakthrough = true;
                 }
            }
        }
    }


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
        <div className="flex-shrink-0 p-3 bg-[var(--bg-subtle)] backdrop-blur-sm border-t border-[var(--border-subtle)]">
            <div className="bg-black/20 rounded-lg border border-gray-700/60 mb-3">
                 <button
                    onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
                    className="w-full flex justify-between items-center p-2 text-gray-300 hover:bg-gray-800/50 rounded-t-lg transition-colors"
                >
                    <span className="font-bold font-title">Hành Động Nhanh</span>
                    {isQuickActionsOpen ? <FaChevronUp /> : <FaChevronDown />}
                </button>
                {isQuickActionsOpen && (
                    <div className="p-3 border-t border-gray-700/60 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {currentLocation.contextualActions?.map(action => {
                            const Icon = UI_ICONS[action.iconName as keyof typeof UI_ICONS] || FaBolt;
                            return (
                                <QuickActionButton key={action.id} onClick={() => onContextualAction(action.id, action.label)} disabled={disabled} title={action.description}>
                                    <Icon /> {action.label}
                                </QuickActionButton>
                            );
                        })}
                        <QuickActionButton onClick={() => handlePlayerAction('tu luyện', 'act', 1, () => {})} disabled={disabled} title="Hấp thụ linh khí để tăng tu vi">
                            <GiSprout /> Tu Luyện
                        </QuickActionButton>
                        <QuickActionButton onClick={openInventoryModal} disabled={disabled} title="Mở túi đồ của bạn">
                            <GiSwapBag /> Túi Đồ
                        </QuickActionButton>
                        {canBreakthrough && (
                            <QuickActionButton onClick={handleBreakthrough} disabled={disabled} title="Đột phá cảnh giới tiếp theo!" className="animate-pulse bg-amber-600/50 border border-amber-400 col-span-2 sm:col-span-1">
                                <GiStairsGoal /> Đột Phá!
                            </QuickActionButton>
                        )}
                        <QuickActionButton onClick={onToggleSidebar} disabled={disabled} title="Mở Bảng Điều Khiển">
                            <FaUser /> Bảng Điều Khiển
                        </QuickActionButton>
                    </div>
                )}
            </div>

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
                    className="w-full bg-[var(--bg-interactive)] border border-[var(--border-subtle)] rounded-lg px-4 py-2 text-lg text-[var(--text-color)] focus:outline-none focus:ring-1 focus:ring-[var(--input-focus-ring-color)] transition-all disabled:opacity-50"
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
        className={`w-1/3 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-md transition-colors ${
            isActive ? 'bg-[var(--bg-interactive-hover)] text-[var(--text-color)]' : 'text-[var(--text-muted-color)] hover:bg-[var(--bg-interactive-hover)]'
        }`}
    >
        <Icon /> {label}
    </button>
);


export default ActionBar;