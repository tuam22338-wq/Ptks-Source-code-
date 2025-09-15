import React, { useState, memo, useCallback } from 'react';
import type { GameState, ActiveQuest, SystemShopItem } from '../../../../../types';
import { FiCpu, FiTarget, FiShoppingCart, FiHelpCircle } from 'react-icons/fi';
import { generateSystemQuest } from '../../../../../services/geminiService';
import { SYSTEM_SHOP_ITEMS } from '../../../../../constants';
import LoadingSpinner from '../../../../../components/LoadingSpinner';

interface SystemPanelProps {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    showNotification: (message: string) => void;
}

type SystemTab = 'status' | 'quests' | 'store' | 'analysis';

const SystemPanel: React.FC<SystemPanelProps> = ({ gameState, setGameState, showNotification }) => {
    const [activeTab, setActiveTab] = useState<SystemTab>('status');
    const { playerCharacter } = gameState;
    const systemInfo = playerCharacter.systemInfo;
    const systemPoints = playerCharacter.currencies['Điểm Nguồn'] || 0;
    const [isGeneratingQuest, setIsGeneratingQuest] = useState(false);

    const handleRequestQuest = useCallback(async () => {
        setIsGeneratingQuest(true);
        try {
            const questData = await generateSystemQuest(gameState);
            setGameState(gs => {
                if (!gs) return null;
                // FIX: Explicitly construct the ActiveQuest object to satisfy the type, as questData is partial.
                const newQuest: ActiveQuest = {
                    id: `quest_system_${Date.now()}`,
                    type: 'SYSTEM',
                    source: 'system',
                    title: questData.title || "Nhiệm vụ từ Hệ thống",
                    description: questData.description || "Hoàn thành mục tiêu được giao.",
                    objectives: (questData.objectives || []).map(obj => ({ ...obj, current: 0, isCompleted: false })),
                    rewards: questData.rewards || {},
                    timeLimit: questData.timeLimit,
                    onFailure: questData.onFailure,
                };
                return {
                    ...gs,
                    playerCharacter: {
                        ...gs.playerCharacter,
                        activeQuests: [...gs.playerCharacter.activeQuests, newQuest],
                    },
                };
            });
            showNotification(`Hệ thống đã ban hành nhiệm vụ mới: ${questData.title}`);
        } catch (error) {
            console.error("Failed to generate system quest:", error);
            showNotification("Hệ thống không thể tạo nhiệm vụ vào lúc này.");
        } finally {
            setIsGeneratingQuest(false);
        }
    }, [gameState, setGameState, showNotification]);

    const handleBuyItem = (item: SystemShopItem) => {
        if (systemPoints < item.cost) {
            showNotification("Không đủ Điểm Nguồn!");
            return;
        }

        setGameState(gs => {
            if (!gs) return null;
            let pc = { ...gs.playerCharacter };
            // Deduct points
            pc.currencies = { ...pc.currencies, 'Điểm Nguồn': systemPoints - item.cost };
            
            // Apply effect
            const { type, details } = item.effect;
            if (type === 'CHANGE_STAT') {
                if (details.attribute === 'all_base') {
                     pc.attributes = pc.attributes.map(group => ({
                        ...group,
                        attributes: group.attributes.map(attr => {
                            if (typeof attr.value === 'number') {
                                return { ...attr, value: attr.value + details.change, maxValue: (attr.maxValue || attr.value) + details.change };
                            }
                            return attr;
                        })
                    }));
                } else if (details.attribute === 'spiritualQi') {
                    pc.cultivation = {...pc.cultivation, spiritualQi: pc.cultivation.spiritualQi + details.change };
                }
            } else if (type === 'GIVE_ITEM') {
                // Simplified item giving logic
                const newItems = [...pc.inventory.items];
                const existing = newItems.find(i => i.name === details.name);
                if (existing) {
                    existing.quantity += details.quantity;
                } else {
                    newItems.push({ id: `sysitem_${Date.now()}`, name: details.name, quantity: details.quantity, description: 'Vật phẩm từ Hệ Thống.', type: 'Tạp Vật', quality: 'Bảo Phẩm', weight: 0.1 });
                }
                pc.inventory = { ...pc.inventory, items: newItems };
            }
             
            return { ...gs, playerCharacter: pc };
        });

        showNotification(`Đã mua [${item.name}]!`);
    };

    if (!systemInfo) return null;

    const renderContent = () => {
        switch (activeTab) {
            case 'status':
                return (
                    <div className="space-y-2 text-sm">
                        <p><strong>Ký Chủ:</strong> {playerCharacter.identity.name}</p>
                        <p><strong>Cảnh Giới:</strong> {gameState.realmSystem.find(r => r.id === playerCharacter.cultivation.currentRealmId)?.name}</p>
                        <p><strong>Trạng Thái:</strong> {playerCharacter.healthStatus}</p>
                    </div>
                );
            case 'quests':
                const systemQuests = playerCharacter.activeQuests.filter(q => q.type === 'SYSTEM');
                return (
                    <div className="space-y-3">
                        {systemQuests.length > 0 ? (
                            systemQuests.map(q => (
                                <div key={q.id} className="text-sm p-2 bg-black/30 rounded">
                                    <p className="font-semibold text-blue-300">{q.title}</p>
                                    <p className="text-xs text-gray-400">{q.description}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-center text-gray-500 py-4">Không có nhiệm vụ hệ thống nào.</p>
                        )}
                        <button onClick={handleRequestQuest} disabled={isGeneratingQuest} className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-700/80 text-white text-sm font-bold rounded-lg hover:bg-gray-600/80">
                            {isGeneratingQuest ? <LoadingSpinner size="sm" /> : "Yêu cầu nhiệm vụ mới"}
                        </button>
                    </div>
                );
            case 'store':
                return (
                    <div className="space-y-3">
                        {SYSTEM_SHOP_ITEMS.map(item => (
                            <div key={item.id} className="p-2 bg-black/30 rounded flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-blue-300">{item.name}</p>
                                    <p className="text-xs text-gray-400">{item.description}</p>
                                </div>
                                <button onClick={() => handleBuyItem(item)} disabled={systemPoints < item.cost} className="text-sm font-bold bg-teal-700/80 text-white px-3 py-1 rounded-md hover:bg-teal-600/80 disabled:bg-gray-600 disabled:cursor-not-allowed">
                                    {item.cost} ĐN
                                </button>
                            </div>
                        ))}
                    </div>
                );
            case 'analysis':
                return <p className="text-sm text-center text-gray-500 py-4">Chức năng Phân Tích sẽ sớm được mở khóa.</p>;
            default:
                return null;
        }
    };
    
    return (
        <div className="space-y-4 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div className="p-3 bg-blue-900/20 rounded-lg border border-blue-400/30 text-center">
                <h3 className="text-lg font-bold font-title text-blue-300">Hệ Thống Xuyên Việt Giả</h3>
                <p className="font-mono text-xl text-yellow-300">{systemPoints.toLocaleString()} <span className="text-sm text-yellow-400">Điểm Nguồn</span></p>
            </div>
             <div className="flex items-stretch gap-1 p-1 bg-black/30 rounded-lg border border-gray-700/60">
                <button onClick={() => setActiveTab('status')} className={`flex-1 flex flex-col items-center p-2 rounded ${activeTab === 'status' ? 'bg-gray-700' : 'hover:bg-gray-800/50'}`}><FiCpu className="text-blue-300 mb-1" /> <span className="text-xs">Trạng Thái</span></button>
                <button onClick={() => setActiveTab('quests')} className={`flex-1 flex flex-col items-center p-2 rounded ${activeTab === 'quests' ? 'bg-gray-700' : 'hover:bg-gray-800/50'}`}><FiTarget className="text-blue-300 mb-1" /> <span className="text-xs">Nhiệm Vụ</span></button>
                <button onClick={() => setActiveTab('store')} className={`flex-1 flex flex-col items-center p-2 rounded ${activeTab === 'store' ? 'bg-gray-700' : 'hover:bg-gray-800/50'}`}><FiShoppingCart className="text-blue-300 mb-1" /> <span className="text-xs">Cửa Hàng</span></button>
                <button onClick={() => setActiveTab('analysis')} className={`flex-1 flex flex-col items-center p-2 rounded ${activeTab === 'analysis' ? 'bg-gray-700' : 'hover:bg-gray-800/50'}`}><FiHelpCircle className="text-blue-300 mb-1" /> <span className="text-xs">Phân Tích</span></button>
            </div>
            <div className="min-h-[200px] bg-black/20 p-3 rounded-lg border border-gray-700/60">
                {renderContent()}
            </div>
        </div>
    );
};

export default memo(SystemPanel);