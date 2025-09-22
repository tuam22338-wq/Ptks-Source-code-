import React, { useState, memo, useEffect, useRef } from 'react';
import type { PlayerCharacter, GameState, AttributeDefinition } from '../../../types';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { UI_ICONS } from '../../../constants';

interface StatBarProps {
    label: string;
    current: number;
    max: number;
    colorClass: string;
    icon: React.ElementType;
}

const StatBar: React.FC<StatBarProps> = ({ label, current, max, colorClass, icon: Icon }) => {
    const [isChanged, setIsChanged] = useState(false);
    const prevCurrent = useRef(current);
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            prevCurrent.current = current;
            return;
        }

        if (prevCurrent.current !== current) {
            setIsChanged(true);
            const timer = setTimeout(() => setIsChanged(false), 700); // Corresponds to animation duration
            prevCurrent.current = current;
            return () => clearTimeout(timer);
        }
    }, [current]);

    const percentage = max > 0 ? (Math.max(0, current) / max) * 100 : 0;
    return (
        <div className={`stat-bar-container ${isChanged ? 'stat-changed-flash' : ''}`} title={`${label}: ${Math.floor(current)} / ${max}`}>
            <div className="stat-bar-icon">
                <Icon />
            </div>
            <div className="stat-bar-progress-wrapper">
                <div className={`stat-bar-progress ${colorClass}`} style={{ width: `${percentage}%` }}></div>
            </div>
            <div className="stat-bar-text">
                {Math.floor(current)}/{max}
            </div>
        </div>
    );
};

const AttributeDisplay: React.FC<{ definition: AttributeDefinition; value: number; }> = memo(({ definition, value }) => (
    <div className="flex justify-between items-baseline text-sm">
        <span className="text-gray-400">{definition.name}</span>
        <span className="font-bold text-gray-200">{String(Math.floor(value))}</span>
    </div>
));


const SummaryPanel: React.FC<{ gameState: GameState }> = ({ gameState }) => {
    const [isAttributesExpanded, setIsAttributesExpanded] = useState(false);

    const { playerCharacter, attributeSystem } = gameState;
    const { attributes } = playerCharacter;

    if (!attributeSystem) return null;

    const vitalAttributes = attributeSystem.definitions.filter(def => def.type === 'VITAL' && attributes[def.id]?.maxValue);
    const coreAttributeDefs = attributeSystem.definitions.filter(def => ['luc_luong', 'than_phap', 'can_cot', 'nguyen_than', 'ngo_tinh', 'co_duyen'].includes(def.id));
    
    const VITAL_COLORS: Record<string, string> = {
        'sinh_menh': 'bg-red-500',
        'linh_luc': 'bg-blue-500',
        'tuoi_tho': 'bg-purple-500',
        'hunger': 'bg-yellow-600',
        'thirst': 'bg-sky-500',
        'default': 'bg-gray-500'
    };
    const VITAL_ICON_COLORS: Record<string, string> = {
        'sinh_menh': 'text-red-400',
        'linh_luc': 'text-blue-400',
        'tuoi_tho': 'text-purple-400',
        'hunger': 'text-yellow-500',
        'thirst': 'text-sky-400',
        'default': 'text-gray-400'
    }

    return (
        <div className="summary-panel animate-fade-in" style={{animationDuration: '300ms'}}>
            <div className="summary-panel-vitals">
                {vitalAttributes.map(def => {
                    const attr = attributes[def.id];
                    const Icon = UI_ICONS[def.iconName];
                    const color = VITAL_COLORS[def.id] || VITAL_COLORS['default'];
                    const iconColor = VITAL_ICON_COLORS[def.id] || VITAL_ICON_COLORS['default'];
                    return (
                        <StatBar 
                            key={def.id}
                            label={def.name}
                            current={attr.value}
                            max={attr.maxValue!}
                            colorClass={color}
                            icon={() => <Icon className={iconColor} />}
                        />
                    );
                })}
            </div>

            <button onClick={() => setIsAttributesExpanded(!isAttributesExpanded)} className="summary-panel-toggle">
                <span>Thuộc Tính Cốt Lõi</span>
                {isAttributesExpanded ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            
            {isAttributesExpanded && (
                <div className="summary-panel-attributes">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {coreAttributeDefs.map(def => {
                            const attr = attributes[def.id];
                            return attr ? <AttributeDisplay key={def.id} definition={def} value={attr.value} /> : null;
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(SummaryPanel);
