import React, { useState, memo } from 'react';
import type { Element, SpiritualRoot, SpiritualRootQuality, StatBonus } from '../../../types';
import { SPIRITUAL_ROOT_CONFIG, SPIRITUAL_ROOT_QUALITY_CONFIG } from '../../../constants';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface SpiritualRootSelectionProps {
    suggestedElement?: Element;
    onRootDetermined: (root: SpiritualRoot) => void;
}

const generateRootDetails = (elements: { type: Element; purity: number }[], quality: SpiritualRootQuality): Omit<SpiritualRoot, 'elements' | 'quality'> => {
    const qualityData = SPIRITUAL_ROOT_QUALITY_CONFIG[quality];
    let name = '';
    let description = '';
    const combinedBonuses: { [key: string]: number } = {};

    const elementOrder: Element[] = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];
    const sortedElements = [...elements].sort((a, b) => elementOrder.indexOf(a.type) - elementOrder.indexOf(b.type));

    const numElements = sortedElements.length;
    const qualityName = quality.replace(' Căn', '');
    if (numElements === 1) {
        name = `${sortedElements[0].type} ${qualityName} Linh Căn`;
    } else if (numElements === 2) {
        name = `${sortedElements.map(e => e.type).join('')} Song Linh Căn (${qualityName})`;
    } else if (numElements === 3) {
        name = `${sortedElements.map(e => e.type).join('')} Tam Linh Căn (${qualityName})`;
    } else {
        name = `Ngũ Hành Tạp Linh Căn (${qualityName})`;
    }

    sortedElements.forEach(element => {
        const baseInfo = SPIRITUAL_ROOT_CONFIG[element.type];
        if (baseInfo) {
            baseInfo.baseBonuses.forEach(bonus => {
                const scaledValue = bonus.value * (element.purity / 100);
                combinedBonuses[bonus.attribute] = (combinedBonuses[bonus.attribute] || 0) + scaledValue;
            });
        }
    });

    const finalBonuses: StatBonus[] = Object.entries(combinedBonuses).map(([attribute, value]) => ({
        attribute,
        value: Math.round(value * qualityData.multiplier),
    })).filter(b => b.value !== 0);

    description = `Phẩm chất: ${quality}. ${name} ẩn chứa sức mạnh của ${numElements} nguyên tố. `;
    const elementDescriptions = sortedElements.map(e => `${e.type} (độ tinh khiết ${e.purity}%)`).join(', ');
    description += `Bao gồm: ${elementDescriptions}. `;
    if (numElements === 1) {
        description += `Đây là Thiên Linh Căn vạn người có một, con đường tu luyện sẽ vô cùng thuận lợi.`;
    } else if (numElements <= 3) {
        description += `Đây là một loại linh căn khá hiếm, nếu tu luyện đúng cách sẽ có thành tựu.`;
    } else {
        description += `Linh căn nhiều thuộc tính, việc tu luyện sẽ gặp nhiều khó khăn do các luồng linh khí xung đột.`;
    }

    return { name, description, bonuses: finalBonuses };
};


const SpiritualRootSelection: React.FC<SpiritualRootSelectionProps> = ({ suggestedElement, onRootDetermined }) => {
    const [isDetermining, setIsDetermining] = useState(false);
    const [determinedRoot, setDeterminedRoot] = useState<SpiritualRoot | null>(null);

    const handleTestRoot = () => {
        setIsDetermining(true);
        setDeterminedRoot(null); // Clear previous result
        setTimeout(() => {
            // 1. Determine Quality
            const qualities = Object.entries(SPIRITUAL_ROOT_QUALITY_CONFIG);
            const totalQualityWeight = qualities.reduce((sum, [, data]) => sum + data.weight, 0);
            let randomQuality = Math.random() * totalQualityWeight;
            let finalQuality: SpiritualRootQuality = 'Phàm Căn';
            for (const [quality, data] of qualities) {
                if (randomQuality < data.weight) {
                    finalQuality = quality as SpiritualRootQuality;
                    break;
                }
                randomQuality -= data.weight;
            }

            // 2. Determine Number of Elements
            const numElementsWeights = [{ num: 1, weight: 8 }, { num: 2, weight: 22 }, { num: 3, weight: 35 }, { num: 4, weight: 25 }, { num: 5, weight: 10 }];
            const totalNumWeight = numElementsWeights.reduce((sum, item) => sum + item.weight, 0);
            let randomNum = Math.random() * totalNumWeight;
            let finalNumElements = 5;
            for (const item of numElementsWeights) {
                if (randomNum < item.weight) {
                    finalNumElements = item.num;
                    break;
                }
                randomNum -= item.weight;
            }
            
            // 3. Select Elements
            const baseElements: Element[] = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];
            let selectedElements: Element[] = [];
            const availableElements = [...baseElements];
            
            if (suggestedElement && baseElements.includes(suggestedElement) && Math.random() < 0.7) { // 70% chance to include suggested
                selectedElements.push(suggestedElement);
                availableElements.splice(availableElements.indexOf(suggestedElement), 1);
            }
            
            while (selectedElements.length < finalNumElements) {
                const randomIndex = Math.floor(Math.random() * availableElements.length);
                selectedElements.push(availableElements[randomIndex]);
                availableElements.splice(randomIndex, 1);
            }

            // 4. Distribute Purity
            let purities = Array.from({ length: finalNumElements }, () => Math.random());
            const sum = purities.reduce((a, b) => a + b, 0);
            purities = purities.map(p => Math.round((p / sum) * 100));

            let currentSum = purities.reduce((a, b) => a + b, 0);
            let diff = 100 - currentSum;
            while(diff !== 0) {
                const index = Math.floor(Math.random() * purities.length);
                if (diff > 0) {
                    purities[index]++;
                    diff--;
                } else {
                    if (purities[index] > 0) {
                        purities[index]--;
                        diff++;
                    }
                }
            }
            
            const finalElements = selectedElements.map((type, index) => ({
                type,
                purity: purities[index]
            })).filter(e => e.purity > 0); // Ensure no 0% purities if rounding causes issues

            // 5. Generate final object
            const { name, description, bonuses } = generateRootDetails(finalElements, finalQuality);
            const newRoot: SpiritualRoot = {
                elements: finalElements,
                quality: finalQuality,
                name,
                description,
                bonuses,
            };

            setDeterminedRoot(newRoot);
            setIsDetermining(false);
            onRootDetermined(newRoot);
        }, 2500);
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
             <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-black/20 rounded-lg p-6 border-2 border-amber-500/50 animate-talent-reveal">
                <h3 className={`text-3xl font-bold font-title text-center ${qualityStyle.color} ${qualityStyle.glow || ''}`}>{determinedRoot.name}</h3>
                <p className="text-md text-[var(--text-muted-color)] mt-2 text-center">{determinedRoot.description}</p>
                
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 w-full max-w-md">
                    {determinedRoot.elements.map(element => {
                        const config = SPIRITUAL_ROOT_CONFIG[element.type];
                        return (
                             <div key={element.type} className="flex flex-col">
                                <div className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                                    <config.icon/> {config.name} <span>({element.purity}%)</span>
                                </div>
                                <div className="w-full bg-gray-700/50 rounded-full h-1.5 mt-1">
                                    <div className="bg-amber-400 h-1.5 rounded-full" style={{width: `${element.purity}%`}}></div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {determinedRoot.bonuses.length > 0 && (
                    <div className="mt-4 border-t border-[var(--border-subtle)] pt-4 w-full max-w-xs">
                        <h4 className="text-center text-[var(--text-color)] font-semibold mb-2">Thuộc tính thưởng</h4>
                        <div className="space-y-1">
                            {determinedRoot.bonuses.map(bonus => (
                                 <p key={bonus.attribute} className="flex justify-between text-teal-300 text-sm">
                                    <span>{bonus.attribute}</span>
                                    <span className="font-bold">{bonus.value > 0 ? `+${bonus.value}`: bonus.value}</span>
                                </p>
                            ))}
                        </div>
                    </div>
                )}
                <button onClick={handleTestRoot} className="mt-6 px-4 py-2 bg-[var(--bg-interactive)] text-[var(--text-color)] font-bold rounded-lg hover:bg-[var(--bg-interactive-hover)] text-sm">Kiểm Tra Lại</button>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center bg-black/20 rounded-lg p-4 border border-dashed border-[var(--border-subtle)] text-center">
             <h3 className="text-2xl font-bold font-title text-amber-300">Đoán Mệnh Căn</h3>
             <p className="text-md text-[var(--text-muted-color)] mt-2 max-w-md">
                 Linh căn là nền tảng của con đường tu tiên. Vận mệnh của bạn sẽ được quyết định tại đây. AI có thể đã gợi ý một thuộc tính, nhưng tất cả vẫn là ẩn số.
             </p>
             {suggestedElement && (
                <p className="text-sm text-teal-300 mt-2">Gợi ý của Thiên Đạo: {suggestedElement}</p>
             )}
             <button onClick={handleTestRoot} className="w-full max-w-xs mt-6 py-3 text-lg font-bold rounded-lg themed-button-primary">
                Kiểm tra Linh Căn
            </button>
        </div>
    );
};

export default memo(SpiritualRootSelection);