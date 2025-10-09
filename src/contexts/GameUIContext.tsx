import React, { useState, useCallback, createContext, useContext, FC, PropsWithChildren } from 'react';
// FIX: Changed CultivationPath import
import type { GameEvent, CultivationPath, InnerDemonTrial } from '../types';

interface Notification {
    id: number;
    message: string;
}

interface GameUIContextState {
    notifications: Notification[];
    activeEvent: GameEvent | null;
    availablePaths: CultivationPath[];
    isInventoryOpen: boolean;
    activeInnerDemonTrial: InnerDemonTrial | null;
    // @FIX: Add state to manage the active shop modal.
    activeShopId: string | null;
}

interface GameUIContextActions {
    showNotification: (message: string) => void;
    dismissNotification: (id: number) => void;
    openInventoryModal: () => void;
    closeInventoryModal: () => void;
    // @FIX: Add actions to open and close the shop modal.
    openShopModal: (shopId: string) => void;
    closeShopModal: () => void;
    openCultivationPathModal: (paths: CultivationPath[]) => void;
    closeCultivationPathModal: () => void;
    openInnerDemonTrial: (trial: InnerDemonTrial) => void;
    closeInnerDemonTrial: () => void;
    setActiveEvent: (event: GameEvent | null) => void;
}

type GameUIContextType = GameUIContextState & GameUIContextActions;

const GameUIContext = createContext<GameUIContextType | undefined>(undefined);

export const GameUIProvider: FC<PropsWithChildren<{}>> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null);
    const [availablePaths, setAvailablePaths] = useState<CultivationPath[]>([]);
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);
    const [activeInnerDemonTrial, setActiveInnerDemonTrial] = useState<InnerDemonTrial | null>(null);
    // @FIX: Implement state and handlers for the shop modal.
    const [activeShopId, setActiveShopId] = useState<string | null>(null);

    const showNotification = useCallback((message: string) => {
        const id = Date.now() + Math.random();
        setNotifications(prev => [...prev.slice(-4), { id, message }]); // Keep max 5 notifications
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    }, []);
    
    const dismissNotification = useCallback((id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);
    
    const openInventoryModal = useCallback(() => setIsInventoryOpen(true), []);
    const closeInventoryModal = useCallback(() => setIsInventoryOpen(false), []);

    // @FIX: Implement shop modal handlers.
    const openShopModal = useCallback((shopId: string) => setActiveShopId(shopId), []);
    const closeShopModal = useCallback(() => setActiveShopId(null), []);

    const openCultivationPathModal = useCallback((paths: CultivationPath[]) => setAvailablePaths(paths), []);
    const closeCultivationPathModal = useCallback(() => setAvailablePaths([]), []);

    const openInnerDemonTrial = useCallback((trial: InnerDemonTrial) => setActiveInnerDemonTrial(trial), []);
    const closeInnerDemonTrial = useCallback(() => setActiveInnerDemonTrial(null), []);
    
    const contextValue: GameUIContextType = {
        notifications,
        activeEvent,
        availablePaths,
        isInventoryOpen,
        activeInnerDemonTrial,
        activeShopId,
        showNotification,
        dismissNotification,
        openInventoryModal,
        closeInventoryModal,
        openShopModal,
        closeShopModal,
        openCultivationPathModal,
        closeCultivationPathModal,
        openInnerDemonTrial,
        closeInnerDemonTrial,
        setActiveEvent,
    };

    return (
        <GameUIContext.Provider value={contextValue}>
            {children}
        </GameUIContext.Provider>
    );
};

export const useGameUIContext = (): GameUIContextType => {
    const context = useContext(GameUIContext);
    if (!context) {
        throw new Error('useGameUIContext must be used within a GameUIProvider');
    }
    return context;
};