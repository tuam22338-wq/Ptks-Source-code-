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

    const prevTierId = useRef<string | undefined>(gameState?.playerCharacter.progression.currentTierId);
    const prevInventory = useRef<Map<string, number>>(new Map());
    const isInitialMount = useRef(true);

    useEffect(() => {
        if (!gameState) return;

        const { playerCharacter } = gameState;
        const currentTierId = playerCharacter.progression.currentTierId;
        const currentItems = playerCharacter.inventory.items;

        if (isInitialMount.current) {
            isInitialMount.current = false;
            prevTierId.current = currentTierId;
            const initialMap = new Map<string, number>();
            currentItems.forEach(item => {
                initialMap.set(item.name, (initialMap.get(item.name) || 0) + item.quantity);
            });
            prevInventory.current = initialMap;
            return;
        }

        // Check for breakthrough
        if (currentTierId && prevTierId.current && currentTierId !== prevTierId.current) {
            setActiveEffect('breakthrough');
            const timer = setTimeout(() => setActiveEffect(null), 4000);
            // Update ref immediately after triggering effect
            prevTierId.current = currentTierId;
            return () => clearTimeout(timer);
        }
        
        // Check for new rare items
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
                    // Update inventory ref immediately after triggering effect
                    prevInventory.current = currentInventoryMap;
                    return () => clearTimeout(timer);
                }
            }
        }
        
        // Update refs if no effect was triggered
        prevTierId.current = currentTierId;
        prevInventory.current = currentInventoryMap;

    }, [gameState?.playerCharacter.progression.currentTierId, gameState?.playerCharacter.inventory.items, gameState]);


    if (!activeEffect || state.settings.enablePerformanceMode) return null;

    const renderBreakthrough = () => (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.9) 80%)', animation: 'fade-in-special 0.5s ease-out forwards' }}
        >
            <div 
                className="absolute w-96 h-96 rounded-full"
                style={{ background: 'radial-gradient(circle, rgba(253, 224, 71, 0) 0%, rgba(253, 224, 71, 0.5) 50%, rgba(253, 224, 71, 0) 70%)', animation: 'breakthrough-pulse 1.5s infinite' }}
            ></div>
            <div className="absolute inset-0">
                {Array.from({ length: 20 }).map((_, i) => {
                    const angle = Math.random() * 360;
                    const distance = 50 + Math.random() * 50;
                    const style: React.CSSProperties = {
                        '--start-x': `${Math.cos(angle * Math.PI / 180) * distance}vw`,
                        '--start-y': `${Math.sin(angle * Math.PI / 180) * distance}vh`,
                        '--angle': `${angle + 180}deg`,
                    } as React.CSSProperties;
                    return <div key={i} className="absolute w-1 h-20" style={{...style, background: 'linear-gradient(to bottom, transparent, #fef9c3)', animation: 'breakthrough-zoom 0.8s ease-out forwards', transform: 'rotate(var(--angle)) translateY(200px)'}}></div>;
                })}
            </div>
            <h1 
                className="relative text-6xl font-bold font-calligraphy text-yellow-200"
                style={{ textShadow: '0 0 15px #fef9c3, 0 0 30px #fde047', animation: 'text-glow-reveal 2s ease-in-out' }}
            >
                Đột Phá Thành Công
            </h1>
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
            <div 
                className="fixed inset-0 z-50 flex items-center justify-center" 
                style={{ ...style, background: 'radial-gradient(circle, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.9) 80%)', animation: 'fade-in-special 0.5s ease-out forwards' }}
            >
                <div className="absolute w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, var(--glow-color) 0%, transparent 70%)', animation: 'rare-item-pulse 2s infinite' }}></div>
                <div className="absolute w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle, var(--glow-color) 0%, transparent 70%)', animation: 'rare-item-pulse 2s infinite' }}></div>
                <div className="absolute w-full h-full" style={{ background: 'radial-gradient(circle, transparent 20%, var(--beam-color) 20.5%, transparent 21%), radial-gradient(circle, transparent 20%, var(--beam-color) 20.5%, transparent 21%)', backgroundSize: '2px 100%, 100% 2px', animation: 'rare-item-spin 10s linear infinite' }}></div>
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative w-56 h-72" style={{ perspective: '1000px', animation: 'card-intro-drop 1s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards' }}>
                        <div className="w-full h-full relative" style={{ transformStyle: 'preserve-3d', animation: 'card-flip 3s forwards', animationDelay: '1s' }}>
                            <div className="absolute w-full h-full flex flex-col items-center justify-center p-4 rounded-xl border-2" style={{ backfaceVisibility: 'hidden', background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))', backdropFilter: 'blur(10px)', transform: 'rotateY(0deg)', borderColor: 'var(--border-color)' }}>
                                <GiStarsStack className="text-8xl text-yellow-300" />
                            </div>
                            <div className="absolute w-full h-full flex flex-col items-center justify-center p-4 rounded-xl border-2" style={{ backfaceVisibility: 'hidden', background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))', backdropFilter: 'blur(10px)', transform: 'rotateY(180deg)', borderColor: 'var(--border-color)' }}>
                                <span className="text-8xl">{rareItemData.icon}</span>
                                <h3 className="mt-4 text-2xl font-bold text-center px-2">{rareItemData.name}</h3>
                            </div>
                        </div>
                    </div>
                    <div className="text-center opacity-0" style={{animation: 'text-fade-in-up 1s ease-out forwards', animationDelay: '3s' }}>
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
