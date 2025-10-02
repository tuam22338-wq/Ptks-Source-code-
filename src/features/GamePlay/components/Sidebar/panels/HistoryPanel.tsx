import React, { memo } from 'react';
import type { WorldTurnEntry } from '../../../../../types';
import { FaClock } from 'react-icons/fa';

interface HistoryPanelProps {
    worldTurnLog: WorldTurnEntry[];
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ worldTurnLog }) => {
  // Display latest events first
  const reversedLog = [...worldTurnLog].reverse();

  return (
    <div className="space-y-4 animate-fade-in" style={{ animationDuration: '300ms' }}>
        {reversedLog.length > 0 ? reversedLog.map((entry) => (
          <div key={entry.id} className="neumorphic-inset-box p-3">
            <div className="flex justify-between items-baseline text-xs mb-2 pb-2 border-b" style={{borderColor: 'var(--shadow-light)'}}>
                <p className="font-semibold" style={{color: 'var(--primary-accent-color)'}}>
                    {entry.npcName}
                </p>
                <p className="flex items-center gap-1" style={{color: 'var(--text-muted-color)'}}>
                    <FaClock />
                    Năm {entry.gameDate.year}, {entry.gameDate.season}, ngày {entry.gameDate.day}
                </p>
            </div>
            <p className="text-sm italic" style={{color: 'var(--text-color)'}}>"{entry.narrative}"</p>
          </div>
        )) : (
            <div className="text-center p-8" style={{color: 'var(--text-muted-color)'}}>
                <p>Thế giới vẫn còn tĩnh lặng. Chưa có sự kiện nào được ghi lại.</p>
            </div>
        )}
    </div>
  );
};

export default memo(HistoryPanel);