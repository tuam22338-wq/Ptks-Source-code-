import React, { memo } from 'react';
import type { ModCustomPanel, FullMod, ModWorldBuilding } from '../../../../../types';

interface CustomContentPanelProps {
    panelConfig: ModCustomPanel;
    activeMods: FullMod[];
}

const CustomContentPanel: React.FC<CustomContentPanelProps> = ({ panelConfig, activeMods }) => {
    
    const worldBuildingEntries = panelConfig.content.flatMap((wbTitle): (ModWorldBuilding & { id: string })[] => {
        for (const mod of activeMods) {
            const entry = mod.content.worldBuilding?.find(wb => wb.title === wbTitle);
            if (entry) {
                // Augment with an ID for React key purposes, using the title as it's the identifier.
                return [{ ...(entry as ModWorldBuilding), id: wbTitle }];
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
                            <h4 className="font-bold text-amber-300 font-title">{entry.title}</h4>
                            {entry.description && <p className="text-sm text-gray-400 mt-1">{entry.description}</p>}
                            <pre className="mt-2 text-xs bg-black/30 p-2 rounded text-gray-500 max-h-40 overflow-auto">
                                {JSON.stringify(entry.data, null, 2)}
                            </pre>
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