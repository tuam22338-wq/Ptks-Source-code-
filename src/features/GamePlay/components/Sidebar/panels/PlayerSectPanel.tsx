import React, { useState, useMemo, useEffect, memo } from 'react';
import type { GameState, PlayerSect, Location } from '../../../../../types';
import { REALM_SYSTEM, WORLD_MAP } from '../../../../../constants';
import { GiCastle, GiScrollQuill, GiCoins, GiPerson } from 'react-icons/gi';
import { FaPlus } from 'react-icons/fa';

interface PlayerSectPanelProps {
    gameState: GameState;
    setGameState: React.Dispatch<React.SetStateAction<GameState | null>>;
    showNotification: (message: string) => void;
}

const PlayerSectPanel: React.FC<PlayerSectPanelProps> = ({ gameState, setGameState, showNotification }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [sectName, setSectName] = useState('');
    const [sectDesc, setSectDesc] = useState('');
    const [sectLocation, setSectLocation] = useState('');

    const { playerCharacter, playerSect } = gameState;

    const currentRealmIndex = useMemo(() => REALM_SYSTEM.findIndex(r => r.id === playerCharacter.cultivation.currentRealmId), [playerCharacter.cultivation.currentRealmId]);
    const kimDanRealmIndex = useMemo(() => REALM_SYSTEM.findIndex(r => r.id === 'ket_dan'), []);
    
    const meetsRealmRequirement = currentRealmIndex >= kimDanRealmIndex;
    const meetsReputationRequirement = playerCharacter.danhVong.value >= 5000;
    const canCreateSect = meetsRealmRequirement && meetsReputationRequirement && !playerSect;

    const suitableLocations = useMemo(() => {
        return gameState.discoveredLocations.filter(l => ['Bí Cảnh', 'Sơn Mạch'].includes(l.type));
    }, [gameState.discoveredLocations]);

    useEffect(() => {
        if (suitableLocations.length > 0 && !sectLocation) {
            setSectLocation(suitableLocations[0].id);
        }
    }, [suitableLocations, sectLocation]);

    const handleCreateSect = () => {
        if (!sectName.trim() || !sectDesc.trim() || !sectLocation) {
            showNotification("Vui lòng điền đầy đủ thông tin Tông Môn.");
            return;
        }

        const newSect: PlayerSect = {
            id: `player_sect_${playerCharacter.identity.name.replace(/\s+/g, '_')}`,
            name: sectName,
            description: sectDesc,
            locationId: sectLocation,
            reputation: 0,
            members: [],
            ranks: [
                { name: 'Tông Chủ', contributionRequired: Infinity },
                { name: 'Trưởng Lão', contributionRequired: 10000 },
                { name: 'Đệ Tử Nội Môn', contributionRequired: 1000 },
                { name: 'Đệ Tử Ngoại Môn', contributionRequired: 0 },
            ],
            treasury: { 'Bạc': 1000, 'Linh thạch hạ phẩm': 100 },
            buildings: [
                { id: 'main_hall', name: 'Chính Điện', level: 1, description: 'Nơi xử lý các công việc của Tông Môn.' }
            ]
        };
        
        setGameState(gs => {
            if (!gs) return null;
            return {
                ...gs,
                playerSect: newSect,
                playerCharacter: {
                    ...gs.playerCharacter,
                    danhVong: { ...gs.playerCharacter.danhVong, value: gs.playerCharacter.danhVong.value - 5000 }
                }
            };
        });

        showNotification(`Chúc mừng! ${sectName} đã được thành lập!`);
        setIsCreating(false);
    };

    if (playerSect) {
        return (
            <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
                <div>
                    <h3 className="flex items-center gap-2 text-lg text-amber-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                        <GiCastle /> {playerSect.name}
                    </h3>
                    <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60 space-y-3">
                        <p className="text-sm text-gray-400 italic">{playerSect.description}</p>
                         <div className="text-sm"><strong className="text-gray-300">Trụ sở:</strong> {WORLD_MAP.find(l => l.id === playerSect.locationId)?.name}</div>
                         <div className="text-sm"><strong className="text-gray-300">Danh Vọng:</strong> {playerSect.reputation}</div>
                         <div className="text-sm"><strong className="text-gray-300">Thành viên:</strong> {playerSect.members.length + 1} (Bạn là Tông Chủ)</div>
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold text-gray-400 text-center mb-2">Quản lý (Sắp ra mắt)</h4>
                    <div className="space-y-2 opacity-50">
                        <button disabled className="w-full p-2 bg-gray-700/50 rounded text-left">Quản lý thành viên</button>
                        <button disabled className="w-full p-2 bg-gray-700/50 rounded text-left">Ban hành nhiệm vụ</button>
                        <button disabled className="w-full p-2 bg-gray-700/50 rounded text-left">Xây dựng công trình</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div>
                <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                    <GiCastle /> Lập Tông Môn
                </h3>

                {isCreating ? (
                    <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60 space-y-4">
                        <h4 className="font-bold text-amber-300 text-center">Thông Tin Tông Môn</h4>
                        <div>
                            <label className="text-sm text-gray-400">Tên Tông Môn</label>
                            <input type="text" value={sectName} onChange={e => setSectName(e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Tôn chỉ / Mô tả</label>
                            <textarea value={sectDesc} onChange={e => setSectDesc(e.target.value)} rows={3} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm" />
                        </div>
                        <div>
                            <label className="text-sm text-gray-400">Chọn Trụ Sở</label>
                             <select value={sectLocation} onChange={e => setSectLocation(e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-sm">
                                {suitableLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => setIsCreating(false)} className="w-full p-2 bg-gray-700/80 rounded">Hủy</button>
                             <button onClick={handleCreateSect} className="w-full p-2 bg-teal-700/80 rounded">Xác nhận</button>
                        </div>
                    </div>
                ) : (
                     <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                        <p className="text-sm text-gray-300 text-center mb-4">Xây dựng một thế lực của riêng mình, chiêu mộ đệ tử, vang danh thiên hạ.</p>
                        <div className="p-2 border-t border-b border-gray-700/50 text-sm space-y-1">
                            <p className={meetsRealmRequirement ? 'text-green-400' : 'text-red-400'}>- Cảnh giới tối thiểu: Kim Đan Kỳ (Hiện tại: {REALM_SYSTEM[currentRealmIndex].name})</p>
                            <p className={meetsReputationRequirement ? 'text-green-400' : 'text-red-400'}>- Danh vọng tối thiểu: 5000 (Hiện tại: {playerCharacter.danhVong.value})</p>
                        </div>
                         <button onClick={() => setIsCreating(true)} disabled={!canCreateSect} className="w-full mt-4 flex items-center justify-center gap-2 font-bold py-2 px-4 rounded transition-colors bg-amber-600 hover:bg-amber-500 text-white disabled:bg-gray-600 disabled:cursor-not-allowed">
                            <FaPlus /> Lập Tông Môn
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(PlayerSectPanel);