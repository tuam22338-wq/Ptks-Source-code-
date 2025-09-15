import React, { memo } from 'react';
import type { ModCustomPanel, FullMod, ModWorldData } from '../../../../../types';

interface CustomContentPanelProps {
    panelConfig: ModCustomPanel;
    activeMods: FullMod[];
}

const CustomContentPanel: React.FC<CustomContentPanelProps> = ({ panelConfig, activeMods }) => {
    
    const worldBuildingEntries = panelConfig.content.flatMap((wbName): (Omit<ModWorldData, 'id'> & { id: string })[] => {
        for (const mod of activeMods) {
            const entry = mod.content.worldData?.find(wb => wb.name === wbName);
            if (entry) {
                // Augment with an ID for React key purposes, using the name as it's the identifier.
                return [{ ...entry, id: wbName }];
            }
        }
        return [];
    });

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
             <div>
                <h3 className="text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                    {panelConfig.title}
                </h3>
                <div className="space-y-3">
                    {worldBuildingEntries.length > 0 ? worldBuildingEntries.map(entry => (
                        <div key={entry.id} className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                            <h4 className="font-bold text-amber-300 font-title">{entry.name}</h4>
                            {entry.description && <p className="text-sm text-gray-400 mt-1">{entry.description}</p>}
                        </div>
                    )) : (
                        <p className="text-center text-gray-500 py-4">Không có nội dung nào được định nghĩa cho bảng này.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(CustomContentPanel);
