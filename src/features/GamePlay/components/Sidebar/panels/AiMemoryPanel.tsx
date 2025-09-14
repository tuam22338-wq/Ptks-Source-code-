import React, { memo } from 'react';
import type { GameState } from '../../../../../types';
import { FaBrain } from 'react-icons/fa';

interface AiMemoryPanelProps {
    gameState: GameState;
}

const MemorySection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
        <h4 className="font-bold text-amber-300 font-title">{title}</h4>
        <div className="mt-2 text-sm text-gray-300 space-y-2 border-t border-gray-600/50 pt-2">
            {children}
        </div>
    </div>
);


const AiMemoryPanel: React.FC<AiMemoryPanelProps> = ({ gameState }) => {
    const { playerCharacter, gameDate, discoveredLocations, activeNpcs, storyLog, storySummary } = gameState;
    const currentLocation = discoveredLocations.find(l => l.id === playerCharacter.currentLocationId);
    const npcsHere = activeNpcs.filter(n => n.locationId === playerCharacter.currentLocationId);

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div>
                <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-4 text-center border-b border-gray-700 pb-2">
                    <FaBrain className="text-amber-300" /> Thiên Cơ Ký Ức
                </h3>
                <div className="p-3 text-center bg-blue-900/20 border border-blue-600/50 rounded-lg text-blue-200 text-sm mb-4">
                    Đây là những thông tin mà AI đang sử dụng để kể tiếp câu chuyện của bạn.
                </div>
                <div className="space-y-4">
                    <MemorySection title="Ký Ức Dài Hạn (Tóm Tắt)">
                        <p className="text-xs text-gray-400 italic whitespace-pre-wrap">
                            {storySummary ? storySummary : "Chưa có tóm tắt nào được tạo."}
                        </p>
                    </MemorySection>
                    
                     <MemorySection title="Ký Ức Ngắn Hạn (Sự Kiện Gần Đây)">
                        <div className="max-h-40 overflow-y-auto pr-2 text-xs text-gray-400">
                           {storyLog.slice(-5).map(entry => (
                               <p key={entry.id} className="border-b border-gray-700/50 py-1">
                                   <span className="font-semibold text-gray-500 mr-2 uppercase">{entry.type}:</span> 
                                   {entry.content}
                                </p>
                           ))}
                        </div>
                    </MemorySection>

                    <MemorySection title="Bối Cảnh Hiện Tại">
                        <p><strong>Nhân vật:</strong> {playerCharacter.identity.name} ({playerCharacter.identity.personality})</p>
                        <p><strong>Thời gian:</strong> {gameDate.era} năm {gameDate.year}, ngày {gameDate.day} mùa {gameDate.season}, giờ {gameDate.shichen}</p>
                        <p><strong>Địa điểm:</strong> {currentLocation?.name}</p>
                        <p><strong>NPCs tại đây:</strong> {npcsHere.length > 0 ? npcsHere.map(n => n.identity.name).join(', ') : 'Không có ai.'}</p>
                    </MemorySection>
                </div>
            </div>
        </div>
    );
};

export default memo(AiMemoryPanel);