import React from 'react';
import type { InventoryItem, StatBonus, ItemEffect } from '../types';
import { ITEM_QUALITY_STYLES, UI_ICONS } from '../constants';

interface ItemTooltipProps {
    item: InventoryItem;
    compareItem?: InventoryItem | null;
}

const ItemIcon: React.FC<{ item: InventoryItem; className?: string }> = ({ item, className }) => {
    if (item.iconName && UI_ICONS[item.iconName]) {
        const Icon = UI_ICONS[item.iconName];
        return <Icon className={className || 'text-2xl'} />;
    }
    return <span className={className || 'text-2xl'} role="img" aria-label={item.name}>{item.icon || '📜'}</span>;
};

const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className }) => (
    <div className={`mt-2 pt-2 border-t border-[var(--shadow-light)]/50 ${className}`}>
        <h5 className="text-xs font-bold uppercase text-[var(--text-muted-color)] mb-1">{title}</h5>
        {children}
    </div>
);

const StatRow: React.FC<{ label: string; value: string | number; compareValue?: number | null; }> = ({ label, value, compareValue }) => {
    const diff = (compareValue !== null && compareValue !== undefined) ? Number(value) - compareValue : null;
    let diffColor = 'text-[var(--text-muted-color)]';
    if (diff !== null) {
        if (diff > 0) diffColor = 'text-green-400';
        if (diff < 0) diffColor = 'text-red-400';
    }

    return (
        <div className="flex justify-between items-center text-sm">
            <span style={{color: 'var(--text-color)'}}>{label}</span>
            <div className="flex items-center gap-2">
                <span className="font-mono font-semibold w-8 text-right" style={{color: 'var(--primary-accent-color)'}}>{value}</span>
                {diff !== null && (
                    <span className={`font-mono font-bold w-12 text-center ${diffColor}`}>
                        ({diff > 0 ? '+' : ''}{diff})
                    </span>
                )}
            </div>
        </div>
    );
};

const EffectRow: React.FC<{ effect: ItemEffect; trigger?: string }> = ({ effect, trigger }) => (
    <p className="text-xs text-cyan-300">
        {trigger && <span className="font-semibold">{trigger}: </span>}
        {effect.description}
    </p>
);

const ItemTooltip: React.FC<ItemTooltipProps> = ({ item, compareItem }) => {
    const itemBonuses = new Map((item.bonuses || []).map(b => [b.attribute, b.value]));
    const compareBonuses = new Map((compareItem?.bonuses || []).map(b => [b.attribute, b.value]));
    const allAttributes = new Set([...itemBonuses.keys(), ...compareBonuses.keys()]);

    const itemBaseStats = item.itemStats || {};
    const compareBaseStats = compareItem?.itemStats || {};
    const allBaseStatKeys = new Set([...Object.keys(itemBaseStats), ...Object.keys(compareBaseStats)]) as Set<keyof typeof itemBaseStats>;

    return (
        <div className="animate-fade-in text-left" style={{animationDuration: '200ms'}}>
            <div className="flex items-center gap-3">
                <ItemIcon item={item} className="text-3xl" />
                <div>
                    <h4 className={`font-bold font-title text-lg ${ITEM_QUALITY_STYLES[item.quality].color}`}>{item.name}</h4>
                    <p className="text-xs text-[var(--text-muted-color)] italic">{item.description}</p>
                </div>
            </div>
            
            {(item.isIdentified === false) ? (
                <Section title="Chưa Giám Định">
                    <p className="text-sm text-center text-yellow-300/80 italic py-4">
                        Vật phẩm này ẩn chứa sức mạnh chưa biết. Cần được giám định.
                    </p>
                </Section>
            ) : (
                <>
                    {allBaseStatKeys.size > 0 && (
                        <Section title="Chỉ số cơ bản">
                            {Array.from(allBaseStatKeys).map(key => {
                                const label = key === 'damage' ? 'Sát thương' : key === 'defense' ? 'Phòng ngự' : key;
                                return (
                                    <StatRow
                                        key={key}
                                        label={label}
                                        value={itemBaseStats[key] || 0}
                                        compareValue={compareBaseStats[key]}
                                    />
                                );
                            })}
                        </Section>
                    )}

                    {allAttributes.size > 0 && (
                        <Section title="Thuộc tính cộng thêm">
                            {Array.from(allAttributes).map(attr => (
                                <StatRow
                                    key={attr}
                                    label={attr}
                                    value={itemBonuses.get(attr) || 0}
                                    compareValue={compareBonuses.get(attr)}
                                />
                            ))}
                        </Section>
                    )}

                    {(item.passiveEffects || item.activeEffect || item.conditionalEffects) && (
                        <Section title="Hiệu ứng đặc biệt">
                            {item.passiveEffects?.map((eff, i) => <EffectRow key={`p-${i}`} effect={eff} trigger="Nội tại" />)}
                            {item.activeEffect && <EffectRow effect={item.activeEffect} trigger="Kích hoạt" />}
                            {item.conditionalEffects?.map((cond, i) => {
                                const triggerTextMap: Record<string, string> = {
                                    ON_HIT_DEALT: `Khi tấn công (${cond.chance}%)`,
                                    ON_HIT_TAKEN: `Khi bị tấn công (${cond.chance}%)`,
                                    ON_KILL: 'Khi hạ gục',
                                    ON_CRIT_DEALT: 'Khi chí mạng',
                                    ON_DODGE: 'Khi né tránh',
                                };
                                return <EffectRow key={`c-${i}`} effect={cond.effect} trigger={triggerTextMap[cond.trigger] || cond.trigger} />;
                            })}
                        </Section>
                    )}

                    {item.curseEffect && (
                        <Section title="Lời nguyền" className="!border-red-500/50">
                            <p className="text-xs text-red-400">{item.curseDescription}</p>
                            <EffectRow effect={item.curseEffect} />
                        </Section>
                    )}

                    {item.setInfo && (
                        <Section title={`Bộ: ${item.setInfo.setName}`}>
                            <p className="text-xs text-gray-400">({item.setInfo.part}/{item.setInfo.totalParts}) Mảnh</p>
                            {/* In the future, we can look up and display set bonuses here */}
                        </Section>
                    )}

                    {item.lore && (
                        <Section title="Cốt truyện">
                            <p className="text-xs italic text-gray-500">"{item.lore}"</p>
                        </Section>
                    )}
                </>
            )}
        </div>
    );
};

export default ItemTooltip;
