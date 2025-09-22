import React, { memo } from 'react';
import type { ActiveQuest } from '../../../../../types';
import { FaCheck } from 'react-icons/fa';

interface QuestPanelProps {
    activeQuests: ActiveQuest[];
    completedQuestIds: string[];
}

const QuestPanel: React.FC<QuestPanelProps> = ({ activeQuests, completedQuestIds }) => {
    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div>
                <h3 className="text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">Nhiệm Vụ Hiện Tại</h3>
                <div className="space-y-3">
                    {activeQuests.length > 0 ? activeQuests.map(quest => (
                        <div key={quest.id} className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                            <h4 className="font-bold text-amber-300 font-title">{quest.title}</h4>
                            <p className="text-xs text-gray-500">{quest.type === 'MAIN' ? 'Chính Tuyến' : 'Phụ'}</p>
                            <p className="text-sm text-gray-400 mt-2 italic">"{quest.description}"</p>
                            <div className="mt-3 pt-2 border-t border-gray-700/50 space-y-1">
                                {quest.objectives.map((obj, i) => (
                                    <div key={i} className={`flex items-center gap-2 text-sm ${obj.isCompleted ? 'text-green-400' : 'text-gray-300'}`}>
                                        <FaCheck className={obj.isCompleted ? 'opacity-100' : 'opacity-20'} />
                                        <span>{obj.description} ({Math.min(obj.current, obj.required)}/{obj.required})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-sm text-gray-500">Không có nhiệm vụ nào đang hoạt động.</p>
                    )}
                </div>
            </div>
            
            {completedQuestIds.length > 0 && (
                <div>
                    <h3 className="text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">Nhiệm Vụ Đã Hoàn Thành</h3>
                     <p className="text-center text-sm text-gray-500">{completedQuestIds.length} nhiệm vụ đã hoàn thành.</p>
                </div>
            )}
        </div>
    );
};

export default memo(QuestPanel);
