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
            <div className="bg-[var(--bg-color)]/80 backdrop-blur-lg border border-[var(--panel-border-color)] rounded-xl shadow-2xl shadow-black/50 w-full max-w-3xl m-4 h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-[var(--shadow-light)] flex justify-between items-center">
                    <h2 className="text-2xl font-bold font-title flex items-center gap-2" style={{color: 'var(--primary-accent-color)'}}>
                        <FaShieldAlt /> Thiên Đạo Báo Cáo
                    </h2>
                    <button onClick={onClose} className="p-2 text-[var(--text-muted-color)] hover:text-[var(--text-color)]"><FaTimes /></button>
                </div>

                <div className="p-4 flex-grow overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center p-8"><LoadingSpinner message="Đang tải báo cáo..." /></div>
                    ) : logs.length === 0 ? (
                        <p className="text-center p-8" style={{color: 'var(--text-muted-color)'}}>Thiên Đạo chưa từng can thiệp. Trật tự thế giới vẫn được duy trì.</p>
                    ) : (
                        <div className="space-y-4">
                            {logs.map(log => (
                                <div key={log.id} className="neumorphic-inset-box p-4">
                                    <p className="text-xs font-mono" style={{color: 'var(--text-muted-color)'}}>{new Date(log.timestamp).toLocaleString('vi-VN')}</p>
                                    <p className="mt-2 font-semibold" style={{color: 'var(--error-color)'}}>
                                        <span className="font-bold">[Phát hiện]</span> {log.problem}
                                    </p>
                                    <p className="mt-1" style={{color: 'var(--success-color)'}}>
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