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
                <h3 className="text-lg font-title font-semibold mb-3 text-center border-b pb-2" style={{color: 'var(--text-color)', borderColor: 'var(--shadow-light)'}}>Nhiệm Vụ Hiện Tại</h3>
                <div className="space-y-3">
                    {activeQuests.length > 0 ? activeQuests.map(quest => (
                        <div key={quest.id} className="neumorphic-inset-box p-3">
                            <h4 className="font-bold font-title" style={{color: 'var(--primary-accent-color)'}}>{quest.title}</h4>
                            <p className="text-xs" style={{color: 'var(--text-muted-color)'}}>{quest.type === 'MAIN' ? 'Chính Tuyến' : 'Phụ'}</p>
                            <p className="text-sm italic mt-2" style={{color: 'var(--text-muted-color)'}}>"{quest.description}"</p>
                            <div className="mt-3 pt-2 border-t space-y-1" style={{borderColor: 'var(--shadow-light)'}}>
                                {quest.objectives.map((obj, i) => (
                                    <div key={i} className={`flex items-center gap-2 text-sm ${obj.isCompleted ? 'text-green-400' : ''}`} style={{color: obj.isCompleted ? '' : 'var(--text-color)'}}>
                                        <FaCheck className={obj.isCompleted ? 'opacity-100' : 'opacity-20'} />
                                        <span>{obj.description} ({Math.min(obj.current, obj.required)}/{obj.required})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-sm" style={{color: 'var(--text-muted-color)'}}>Không có nhiệm vụ nào đang hoạt động.</p>
                    )}
                </div>
            </div>
            
            {completedQuestIds.length > 0 && (
                <div>
                    <h3 className="text-lg font-title font-semibold mb-3 text-center border-b pb-2" style={{color: 'var(--text-color)', borderColor: 'var(--shadow-light)'}}>Nhiệm Vụ Đã Hoàn Thành</h3>
                     <p className="text-center text-sm" style={{color: 'var(--text-muted-color)'}}>{completedQuestIds.length} nhiệm vụ đã hoàn thành.</p>
                </div>
            )}
        </div>
    );
};

export default memo(QuestPanel);