
import React, { memo } from 'react';
import type { GameState } from '../../../../../types';
import { createModContextSummary } from '../../../../../utils/modManager';

interface AiMemoryPanelProps {
  gameState: GameState;
}

const InfoBlock: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
        <h4 className="font-bold text-amber-300 font-title">{title}</h4>
        <div className="mt-2 text-sm text-gray-300 whitespace-pre-wrap">{children}</div>
    </div>
);

const AiMemoryPanel: React.FC<AiMemoryPanelProps> = ({ gameState }) => {
    const { storySummary, playerCharacter, activeMods } = gameState;
    const modContext = createModContextSummary(activeMods);
    const questSummary = playerCharacter.activeQuests.length > 0
        ? playerCharacter.activeQuests.map(q => `- ${q.title}: ${q.objectives.find(o => !o.isCompleted)?.description || 'Sắp hoàn thành'}`).join('\n')
        : 'Không có nhiệm vụ nào.';

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <p className="text-sm text-center text-gray-500 italic">Đây là những thông tin cốt lõi mà AI sử dụng để kể chuyện, đảm bảo tính nhất quán.</p>
            <InfoBlock title="Ký Ức Dài Hạn (Tóm Tắt Cốt Truyện)">
                {storySummary || 'Hành trình vừa bắt đầu. Ký ức sẽ được hình thành khi bạn phiêu lưu.'}
            </InfoBlock>
            
            <InfoBlock title="Bối Cảnh Mod (Nếu có)">
                {modContext ? modContext.replace(/### BỐI CẢNH MOD TÙY CHỈNH \(QUAN TRỌNG NHẤT\) ###|###/g, '').trim() : "Không có mod thế giới nào đang hoạt động."}
            </InfoBlock>
            
            <InfoBlock title="Trạng Thái Hiện Tại (Bối Cảnh Ngắn Hạn)">
                {`- Nhân vật: ${playerCharacter.identity.name}, Cảnh giới: ${gameState.realmSystem.find(r => r.id === playerCharacter.cultivation.currentRealmId)?.name || 'Không rõ'}\n- Vị trí: ${gameState.discoveredLocations.find(l => l.id === playerCharacter.currentLocationId)?.name}\n- Nhiệm vụ: \n${questSummary}`}
            </InfoBlock>
        </div>
    );
};

export default memo(AiMemoryPanel);
