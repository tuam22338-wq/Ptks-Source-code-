import React, { useState, useMemo, useEffect, memo } from 'react';
import type { Element, SpiritualRoot, SpiritualRootQuality, StatBonus } from '../../../types';
import { SPIRITUAL_ROOT_CONFIG, SPIRITUAL_ROOT_QUALITY_CONFIG } from '../../../constants';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface SpiritualRootSelectionProps {
    suggestedElement?: Element;
    onRootDetermined: (root: SpiritualRoot) => void;
}

const SpiritualRootSelection: React.FC<SpiritualRootSelectionProps> = ({ suggestedElement, onRootDetermined }) => {
    const [selectedElement, setSelectedElement] = useState<Element | null>(suggestedElement || 'Hỏa');
    const [isDetermining, setIsDetermining] = useState(false);
    const [determinedRoot, setDeterminedRoot] = useState<SpiritualRoot | null>(null);

    useEffect(() => {
        if (suggestedElement) {
            setSelectedElement(suggestedElement);
        }
    }, [suggestedElement]);

    const elementInfo = useMemo(() => {
        if (!selectedElement) return null;
        return SPIRITUAL_ROOT_CONFIG[selectedElement];
    }, [selectedElement]);

    const handleDetermineRoot = () => {
        if (!selectedElement) return;

        setIsDetermining(true);
        setTimeout(() => {
            const qualities = Object.entries(SPIRITUAL_ROOT_QUALITY_CONFIG);
            const totalWeight = qualities.reduce((sum, [, data]) => sum + data.weight, 0);
            let random = Math.random() * totalWeight;
            
            let finalQuality: SpiritualRootQuality = 'Phàm Căn';
            for (const [quality, data] of qualities) {
                if (random < data.weight) {
                    finalQuality = quality as SpiritualRootQuality;
                    break;
                }
                random -= data.weight;
            }

            const qualityData = SPIRITUAL_ROOT_QUALITY_CONFIG[finalQuality];
            const baseInfo = SPIRITUAL_ROOT_CONFIG[selectedElement];

            const finalBonuses = baseInfo.baseBonuses.map(bonus => ({
                ...bonus,
                value: Math.ceil(bonus.value * qualityData.multiplier)
            }));
            
            const rootName = `${baseInfo.name} ${finalQuality.replace(' Căn', '')} Linh Căn`;
            
            const newRoot: SpiritualRoot = {
                elements: [{ type: selectedElement, purity: 100 }],
                quality: finalQuality,
                name: rootName,
                description: `${baseInfo.description} Đạt đến phẩm chất ${finalQuality}, tư chất tu luyện hơn người.`,
                bonuses: finalBonuses
            };

            setDeterminedRoot(newRoot);
            setIsDetermining(false);
            onRootDetermined(newRoot);
        }, 1500);
    };

    if (isDetermining) {
        return (
            <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-black/20 rounded-lg p-4 border border-[var(--border-subtle)]">
                <LoadingSpinner message="Thiên Mệnh đang định đoạt..." size="lg" />
            </div>
        );
    }

    if (determinedRoot) {
        const qualityStyle = SPIRITUAL_ROOT_QUALITY_CONFIG[determinedRoot.quality];
        return (
             <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-black/20 rounded-lg p-6 border-2 border-amber-500/50 animate-fade-in">
                <h3 className={`text-3xl font-bold font-title ${qualityStyle.color} ${qualityStyle.glow || ''}`}>{determinedRoot.name}</h3>
                <p className="text-md text-[var(--text-muted-color)] mt-2 text-center">{determinedRoot.description}</p>
                <div className="mt-4 border-t border-[var(--border-subtle)] pt-4 w-full max-w-xs">
                    <h4 className="text-center text-[var(--text-color)] font-semibold mb-2">Thuộc tính cơ bản</h4>
                    <div className="space-y-1">
                        {determinedRoot.bonuses.map(bonus => (
                             <p key={bonus.attribute} className="flex justify-between text-teal-300">
                                <span>{bonus.attribute}</span>
                                <span className="font-bold">{bonus.value > 0 ? `+${bonus.value}`: bonus.value}</span>
                            </p>
                        ))}
                    </div>
                </div>
                <button onClick={() => { setDeterminedRoot(null); setSelectedElement(suggestedElement || 'Hỏa'); }} className="mt-6 px-4 py-2 bg-[var(--bg-interactive)] text-[var(--text-color)] font-bold rounded-lg hover:bg-[var(--bg-interactive-hover)] text-sm">Chọn Lại</button>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[300px] bg-black/20 rounded-lg p-4 border border-[var(--border-subtle)] flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-2/5 flex items-center justify-center">
                <div className="relative w-48 h-48">
                    {Object.entries(SPIRITUAL_ROOT_CONFIG).filter(([key]) => ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'].includes(key)).map(([key, config], index) => {
                         const angle = (index * 72) - 90; // 360/5 = 72, -90 to start at top
                         const x = 50 + 40 * Math.cos(angle * Math.PI / 180);
                         const y = 50 + 40 * Math.sin(angle * Math.PI / 180);
                         const isSelected = selectedElement === key;
                        return (
                             <button 
                                key={key} 
                                onClick={() => setSelectedElement(key as Element)}
                                className={`absolute w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-300 transform -translate-x-1/2 -translate-y-1/2
                                    ${isSelected ? 'bg-amber-500/20 border-amber-400 scale-125 z-10' : 'bg-[var(--bg-interactive)] border-[var(--border-subtle)] hover:border-amber-300'}`}
                                style={{ top: `${y}%`, left: `${x}%` }}
                                title={config.name}
                            >
                                <config.icon className={`text-3xl ${isSelected ? 'text-amber-300' : 'text-[var(--text-muted-color)]'}`} />
                            </button>
                        );
                    })}
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-24 h-24 rounded-full bg-[var(--bg-interactive)] border border-dashed border-[var(--border-subtle)]"></div>
                    </div>
                </div>
            </div>
             <div className="w-full md:w-3/5 flex flex-col justify-center text-center p-4 bg-[var(--bg-interactive)] rounded-md">
                {elementInfo ? (
                    <>
                        <h3 className="text-2xl font-bold font-title text-amber-300">{elementInfo.name} Linh Căn</h3>
                        <p className="text-md text-[var(--text-muted-color)] mt-2">{elementInfo.description}</p>
                        <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
                             <h4 className="text-[var(--text-color)] font-semibold mb-2">Thuộc tính cơ bản</h4>
                            {elementInfo.baseBonuses.map(bonus => (
                                <p key={bonus.attribute} className="text-teal-300">{bonus.attribute} {bonus.value > 0 ? `+${bonus.value}`: bonus.value}</p>
                            ))}
                        </div>
                    </>
                ) : (
                    <p>Hãy chọn một linh căn.</p>
                )}
                 <button onClick={handleDetermineRoot} disabled={!selectedElement || isDetermining} className="w-full mt-4 py-3 text-lg font-bold rounded-lg themed-button-primary disabled:bg-gray-600 disabled:cursor-not-allowed">
                    Đoán Mệnh
                </button>
            </div>
        </div>
    );
};

export default memo(SpiritualRootSelection);
