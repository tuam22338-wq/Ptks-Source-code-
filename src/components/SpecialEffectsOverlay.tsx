import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { ItemQuality } from '../types';
import { ITEM_QUALITY_STYLES } from '../constants';
import { GiStarsStack } from 'react-icons/gi';

const RARE_QUALITIES: ItemQuality[] = ['Tiên Phẩm', 'Tuyệt Phẩm'];

const SpecialEffectsOverlay: React.FC = () => {
    const { state } = useAppContext();
    const { gameState } = state;

    const [activeEffect, setActiveEffect] = useState<null | 'breakthrough' | 'rareItem'>(null);
    const [rareItemData, setRareItemData] = useState<{ name: string; icon: string; quality: ItemQuality } | null>(null);

    const prevRealmId = useRef<string | undefined>(gameState?.playerCharacter.cultivation.currentRealmId);
    const prevInventory = useRef<Map<string, number>>(new Map());
    const isInitialMount = useRef(true);

    useEffect(() => {
        const currentItems = gameState?.playerCharacter.inventory.items || [];
        const initialMap = new Map<string, number>();
        currentItems.forEach(item => {
            initialMap.set(item.name, (initialMap.get(item.name) || 0) + item.quantity);
        });
        prevInventory.current = initialMap;
    }, []);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const currentRealmId = gameState?.playerCharacter.cultivation.currentRealmId;
        if (currentRealmId && prevRealmId.current && currentRealmId !== prevRealmId.current) {
            setActiveEffect('breakthrough');
            const timer = setTimeout(() => setActiveEffect(null), 4000);
            prevRealmId.current = currentRealmId;
            return () => clearTimeout(timer);
        }
        if (currentRealmId) {
            prevRealmId.current = currentRealmId;
        }

        const currentItems = gameState?.playerCharacter.inventory.items || [];
        const currentInventoryMap = new Map<string, number>();
        currentItems.forEach(item => {
            currentInventoryMap.set(item.name, (currentInventoryMap.get(item.name) || 0) + item.quantity);
        });

        for (const [name, quantity] of currentInventoryMap.entries()) {
            const prevQuantity = prevInventory.current.get(name) || 0;
            if (quantity > prevQuantity) {
                const newItem = currentItems.find(item => item.name === name);
                if (newItem && RARE_QUALITIES.includes(newItem.quality)) {
                    setRareItemData({ name: newItem.name, icon: newItem.icon || '💎', quality: newItem.quality });
                    setActiveEffect('rareItem');
                    const timer = setTimeout(() => setActiveEffect(null), 5000);
                    prevInventory.current = currentInventoryMap;
                    return () => clearTimeout(timer);
                }
            }
        }
        prevInventory.current = currentInventoryMap;

    }, [gameState]);

    if (!activeEffect || state.settings.enablePerformanceMode) return null;

    const renderBreakthrough = () => (
        <div className="special-effects-overlay">
            <div className="breakthrough-effect"></div>
            <div className="absolute inset-0">
                {Array.from({ length: 20 }).map((_, i) => {
                    const angle = Math.random() * 360;
                    const distance = 50 + Math.random() * 50;
                    const style: React.CSSProperties = {
                        '--start-x': `${Math.cos(angle * Math.PI / 180) * distance}vw`,
                        '--start-y': `${Math.sin(angle * Math.PI / 180) * distance}vh`,
                        '--angle': `${angle + 180}deg`,
                    } as React.CSSProperties;
                    return <div key={i} className="breakthrough-particle" style={style}></div>;
                })}
            </div>
            <h1 className="breakthrough-text">Đột Phá Thành Công</h1>
        </div>
    );

    const renderRareItem = () => {
        if (!rareItemData) return null;
        const qualityStyle = ITEM_QUALITY_STYLES[rareItemData.quality];
        const colorMap: Record<string, any> = {
            'text-amber-400': { glow: 'rgba(252, 211, 77, 0.4)', border: '#facc15', beam: '#fef9c3' },
            'text-red-400': { glow: 'rgba(248, 113, 113, 0.4)', border: '#f87171', beam: '#fecaca' },
        };
        const colors = colorMap[qualityStyle.color] || colorMap['text-amber-400'];

        const style: React.CSSProperties = {
            '--glow-color': colors.glow,
            '--border-color': colors.border,
            '--beam-color': colors.beam,
        } as React.CSSProperties;

        return (
            <div className="special-effects-overlay" style={style}>
                <div className="rare-item-effect"></div>
                <div className="rare-item-glow"></div>
                <div className="rare-item-beams"></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="rare-item-card-container">
                        <div className="rare-item-card">
                            <div className="rare-item-card-face rare-item-card-back">
                                <GiStarsStack className="text-8xl text-yellow-300" />
                            </div>
                            <div className="rare-item-card-face rare-item-card-front">
                                <span className="text-8xl">{rareItemData.icon}</span>
                                <h3 className="mt-4 text-2xl font-bold text-center px-2">{rareItemData.name}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="rare-item-text text-center">
                        <p className={`text-4xl font-bold font-title ${qualityStyle.color}`} style={{ textShadow: `0 0 10px ${colors.glow}` }}>
                            {rareItemData.quality}
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    switch (activeEffect) {
        case 'breakthrough':
            return renderBreakthrough();
        case 'rareItem':
            return renderRareItem();
        default:
            return null;
    }
};

export default SpecialEffectsOverlay;
