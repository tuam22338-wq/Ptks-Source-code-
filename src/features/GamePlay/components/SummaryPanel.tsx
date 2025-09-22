import React, { useState, memo, useEffect, useRef } from 'react';
import type { PlayerCharacter, Attribute } from '../../../types';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

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

const AttributeDisplay: React.FC<{ attribute: Attribute }> = memo(({ attribute }) => (
    <div className="flex justify-between items-baseline text-sm">
        <span className="text-gray-400">{attribute.name}</span>
        <span className="font-bold text-gray-200">{String(Math.floor(attribute.value as number))}</span>
    </div>
));


const SummaryPanel: React.FC<{ playerCharacter: PlayerCharacter }> = ({ playerCharacter }) => {
    const [isAttributesExpanded, setIsAttributesExpanded] = useState(false);

    const { attributes, vitals } = playerCharacter;

    const sinhMenh = attributes.flatMap(g => g.attributes).find(a => a.name === 'Sinh Mệnh');
    const linhLuc = attributes.flatMap(g => g.attributes).find(a => a.name === 'Linh Lực');
    const coreAttributes = attributes.flatMap(g => g.attributes).filter(a => ['Lực Lượng', 'Thân Pháp', 'Căn Cốt', 'Nguyên Thần', 'Ngộ Tính', 'Cơ Duyên'].includes(a.name));

    return (
        <div className="summary-panel animate-fade-in" style={{animationDuration: '300ms'}}>
            <div className="summary-panel-vitals">
                {sinhMenh && sinhMenh.maxValue && <StatBar label="Sinh Mệnh" current={sinhMenh.value as number} max={sinhMenh.maxValue as number} colorClass="bg-red-500" icon={() => <span className="text-red-400">❤</span>} />}
                {linhLuc && linhLuc.maxValue && <StatBar label="Linh Lực" current={linhLuc.value as number} max={linhLuc.maxValue as number} colorClass="bg-blue-500" icon={() => <span className="text-blue-400">✧</span>} />}
                <StatBar label="No Bụng" current={vitals.hunger} max={vitals.maxHunger} colorClass="bg-yellow-600" icon={() => <span className="text-yellow-500">♨</span>} />
                <StatBar label="Nước Uống" current={vitals.thirst} max={vitals.maxThirst} colorClass="bg-sky-500" icon={() => <span className="text-sky-400">💧</span>} />
                 <div className="stat-bar-container" title="Nhiệt độ cơ thể">
                    <div className="stat-bar-icon">
                        <span className="text-orange-400">🔥</span>
                    </div>
                    <div className="flex-grow text-sm text-gray-400">Nhiệt độ</div>
                    <div className="stat-bar-text !w-auto font-bold text-gray-200">
                        {vitals.temperature.toFixed(1)}°C
                    </div>
                </div>
            </div>

            <button onClick={() => setIsAttributesExpanded(!isAttributesExpanded)} className="summary-panel-toggle">
                <span>Thuộc Tính Cốt Lõi</span>
                {isAttributesExpanded ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            
            {isAttributesExpanded && (
                <div className="summary-panel-attributes">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        {coreAttributes.map(attr => <AttributeDisplay key={attr.name} attribute={attr} />)}
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(SummaryPanel);
