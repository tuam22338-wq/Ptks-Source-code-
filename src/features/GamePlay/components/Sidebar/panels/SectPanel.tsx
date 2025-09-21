import React, { memo } from 'react';
import type { PlayerCharacter, Sect, CultivationTechnique } from '../../../../../types';
import { SECTS } from '../../../../../constants';
import { FaUsers, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

interface SectPanelProps {
    playerCharacter: PlayerCharacter;
}

const SectPanel: React.FC<SectPanelProps> = ({ playerCharacter }) => {
    const { sect } = playerCharacter;

    if (sect) {
        const currentSectData = SECTS.find(s => s.id === sect.sectId);
        if (!currentSectData) {
            return <div>Lỗi: Không tìm thấy dữ liệu tông môn.</div>;
        }

        const currentRankIndex = currentSectData.ranks.findIndex(r => r.name === sect.rank);
        const nextRank = currentSectData.ranks[currentRankIndex + 1];

        return (
            <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
                 <div>
                    <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                        <currentSectData.icon className="text-amber-300" /> {currentSectData.name}
                    </h3>
                    <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60 text-center">
                        <p className="text-sm text-gray-400">Chức vị</p>
                        <p className="font-bold text-amber-300 text-lg">{sect.rank}</p>
                        <p className="text-sm text-gray-400 mt-2">Cống hiến</p>
                        <p className="font-bold text-teal-300">{sect.contribution.toLocaleString()}</p>

                        {nextRank && (
                             <div className="mt-3">
                                <p className="text-xs text-gray-500">
                                    Cần {nextRank.contributionRequired.toLocaleString()} cống hiến để thăng cấp
                                </p>
                                <div className="w-full bg-black/30 rounded-full h-2.5 mt-1 border border-gray-700">
                                    <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${(sect.contribution / nextRank.contributionRequired) * 100}%` }}></div>
                                </div>
                            </div>
                        )}
                        
                        <div className="mt-4 pt-3 border-t border-gray-700/50 space-y-2">
                             <div className="p-2 text-center bg-blue-900/20 border border-blue-600/50 rounded-lg text-blue-200 text-sm">
                                Sử dụng ô "Hành Động" để làm nhiệm vụ hoặc tương tác với tông môn.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
             <div>
                <h3 className="text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                    <FaUsers className="inline-block mr-2" /> Gia Nhập Tông Môn
                </h3>
                 <div className="p-3 text-center bg-blue-900/20 border border-blue-600/50 rounded-lg text-blue-200 text-sm mb-4">
                    Sử dụng lệnh "tìm một tông môn để gia nhập" hoặc "gia nhập [tên tông môn]".
                </div>
                <div className="space-y-3">
                    {SECTS.map(sectToJoin => {
                        return (
                            <div key={sectToJoin.id} className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                                <h4 className="font-bold text-amber-300 font-title">{sectToJoin.name} <span className="text-xs text-gray-400">({sectToJoin.alignment})</span></h4>
                                <p className="text-sm text-gray-400 mt-1">{sectToJoin.description}</p>
                                <div className="mt-3 pt-2 border-t border-gray-600/50">
                                    <p className="text-xs font-semibold text-gray-300 mb-1">Yêu cầu gia nhập:</p>
                                    <ul className="text-xs space-y-1">
                                    {sectToJoin.joinRequirements.map(req => {
                                        const attr = playerCharacter.attributes.flatMap(g => g.attributes).find(a => a.name === req.attribute);
                                        const hasReq = attr && (attr.value as number) >= req.value;
                                        return (
                                            <li key={req.attribute} className={`flex items-center gap-2 ${hasReq ? 'text-green-400' : 'text-red-400'}`}>
                                                {hasReq ? <FaCheckCircle/> : <FaTimesCircle/>}
                                                {`${req.attribute} >= ${req.value} (Hiện tại: ${attr?.value || 0})`}
                                            </li>
                                        );
                                    })}
                                    </ul>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default memo(SectPanel);