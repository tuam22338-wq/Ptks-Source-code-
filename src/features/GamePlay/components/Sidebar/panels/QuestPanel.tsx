import React, { useState, memo } from 'react';
import type { ActiveQuest } from '../../../../../types';
import { FaTasks, FaChevronDown, FaCheckCircle, FaCircle } from 'react-icons/fa';

interface QuestPanelProps {
    quests: ActiveQuest[];
}

const QuestItem: React.FC<{ quest: ActiveQuest }> = memo(({ quest }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const isCompleted = quest.objectives.every(o => o.isCompleted);
    const questColor = quest.type === 'MAIN' ? 'text-amber-300' : 'text-cyan-300';

    return (
        <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center text-left">
                <h4 className={`font-bold font-title ${questColor}`}>{quest.title}</h4>
                <FaChevronDown className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                <div className="mt-2 pt-2 border-t border-gray-600/50 space-y-3 animate-fade-in" style={{animationDuration: '300ms'}}>
                    <p className="text-sm text-gray-400 italic">{quest.description}</p>
                    <div>
                        <h5 className="text-xs font-semibold text-gray-300 mb-1">Mục tiêu:</h5>
                        <ul className="space-y-1">
                            {quest.objectives.map((obj, index) => (
                                <li key={index} className={`flex items-center gap-2 text-sm ${obj.isCompleted ? 'text-green-400' : 'text-gray-300'}`}>
                                    {obj.isCompleted ? <FaCheckCircle /> : <FaCircle className="w-2 h-2" />}
                                    <span>{obj.description} ({obj.current}/{obj.required})</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                     <div>
                        <h5 className="text-xs font-semibold text-gray-300 mb-1">Phần thưởng:</h5>
                        <p className="text-sm text-teal-300">
                           {Object.entries(quest.rewards).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join(', ')}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
});

const QuestPanel: React.FC<QuestPanelProps> = ({ quests }) => {
    const mainQuests = quests.filter(q => q.type === 'MAIN');
    const sideQuests = quests.filter(q => q.type === 'SIDE');

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div>
                <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                    <FaTasks className="text-amber-300" /> Sổ Tay Nhiệm Vụ
                </h3>
                
                {quests.length === 0 ? (
                    <p className="text-center text-sm text-gray-500 py-4">Chưa có nhiệm vụ nào.</p>
                ) : (
                    <div className="space-y-4">
                        {mainQuests.length > 0 && (
                            <section>
                                <h4 className="font-semibold text-amber-400 mb-2">Chính Tuyến</h4>
                                <div className="space-y-2">
                                    {mainQuests.map(quest => <QuestItem key={quest.id} quest={quest} />)}
                                </div>
                            </section>
                        )}
                         {sideQuests.length > 0 && (
                            <section>
                                <h4 className="font-semibold text-cyan-400 mb-2">Phụ Tuyến</h4>
                                <div className="space-y-2">
                                    {sideQuests.map(quest => <QuestItem key={quest.id} quest={quest} />)}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(QuestPanel);