import React from 'react';
import type { Inventory, PhapBaoRank } from '../types';
import { PHAP_BAO_RANKS } from '../constants';

interface TreasuresPanelProps {
    inventory: Inventory;
}

const TreasuresPanel: React.FC<TreasuresPanelProps> = ({ inventory }) => {
    const treasures = inventory.items.filter(item => item.type === 'Pháp Bảo');

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div>
                <h3 className="text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">Pháp Bảo</h3>
                {treasures.length > 0 ? (
                    <div className="space-y-3">
                        {treasures.map(treasure => {
                            const rankStyle = treasure.rank ? PHAP_BAO_RANKS[treasure.rank as PhapBaoRank] : PHAP_BAO_RANKS['Phàm Giai'];
                            return (
                                <div key={treasure.id} className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                                    <div className="flex justify-between items-start">
                                        <h4 className={`font-bold font-title ${rankStyle.color}`}>{treasure.name}</h4>
                                        {treasure.rank && (
                                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full bg-black/30 ${rankStyle.color}`}>
                                                {treasure.rank}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">{treasure.description}</p>
                                    {treasure.bonuses && treasure.bonuses.length > 0 && (
                                        <div className="border-t border-gray-600/50 mt-2 pt-2 flex flex-wrap gap-x-3 gap-y-1">
                                            {treasure.bonuses.map((bonus, i) => (
                                                <p key={i} className="text-xs text-teal-300">
                                                    {bonus.attribute} <span className="font-semibold">{bonus.value > 0 ? `+${bonus.value}` : bonus.value}</span>
                                                </p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">Bạn chưa sở hữu pháp bảo nào.</p>
                )}
            </div>
             <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">Pháp bảo là những công cụ đắc lực trên con đường tu tiên.</p>
            </div>
        </div>
    );
};

export default TreasuresPanel;