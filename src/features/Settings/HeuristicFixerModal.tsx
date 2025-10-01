import React, { useState, useEffect, memo } from 'react';
import { FaTimes, FaShieldAlt } from 'react-icons/fa';
import type { HeuristicFixReport } from '../../types';
import * as db from '../../services/dbService';
import LoadingSpinner from '../../components/LoadingSpinner';

interface HeuristicFixerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const HeuristicFixerModal: React.FC<HeuristicFixerModalProps> = ({ isOpen, onClose }) => {
    const [logs, setLogs] = useState<HeuristicFixReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const fetchLogs = async () => {
                setIsLoading(true);
                const fetchedLogs = await db.getAllHeuristicFixLogs();
                setLogs(fetchedLogs);
                setIsLoading(false);
            };
            fetchLogs();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '300ms' }} onClick={onClose}>
            <div className="bg-stone-900/80 backdrop-blur-lg border border-[var(--panel-border-color)] rounded-xl shadow-2xl shadow-black/50 w-full max-w-3xl m-4 h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold font-title text-amber-300 flex items-center gap-2">
                        <FaShieldAlt /> Thiên Đạo Báo Cáo
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>

                <div className="p-4 flex-grow overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><LoadingSpinner message="Đang tải báo cáo..." /></div>
                    ) : logs.length === 0 ? (
                        <p className="text-center text-gray-500 p-8">Thiên Đạo chưa từng can thiệp. Trật tự thế giới vẫn được duy trì.</p>
                    ) : (
                        <div className="space-y-4">
                            {logs.map(log => (
                                <div key={log.id} className="bg-black/20 p-4 rounded-lg border border-gray-700/60">
                                    <p className="text-xs text-gray-500 font-mono">{new Date(log.timestamp).toLocaleString('vi-VN')}</p>
                                    <p className="mt-2 font-semibold text-red-400">
                                        <span className="font-bold">[Phát hiện]</span> {log.problem}
                                    </p>
                                    <p className="mt-1 text-teal-300">
                                        <span className="font-bold">[Điều chỉnh]</span> {log.solution}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(HeuristicFixerModal);
