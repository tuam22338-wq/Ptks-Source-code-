
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaTimes, FaFileUpload, FaSync, FaTrash, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import type { RagSource } from '../../types';
import * as ragService from '../../services/ragService';
import LoadingSpinner from '../../components/LoadingSpinner';

interface RagSourceManagerModalProps {
    onClose: () => void;
}

const RagSourceManagerModal: React.FC<RagSourceManagerModalProps> = ({ onClose }) => {
    const [sources, setSources] = useState<RagSource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadSources = useCallback(async () => {
        setIsLoading(true);
        try {
            const loadedSources = await ragService.getAllSources();
            setSources(loadedSources);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSources();
    }, [loadSources]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setError(null);
            try {
                await ragService.addPlayerJournalSource(file);
                // Refresh the list after adding
                await loadSources();
            } catch (err: any) {
                setError(`Lỗi khi thêm nguồn: ${err.message}`);
            }
        }
        // Reset file input to allow re-uploading the same file
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const handleReIndex = async (sourceId: string) => {
        setError(null);
        setSources(prev => prev.map(s => s.id === sourceId ? { ...s, status: 'INDEXING' } : s));
        try {
            await ragService.indexSource(sourceId);
        } catch (err: any) {
             setError(`Lỗi khi lập chỉ mục '${sourceId}': ${err.message}`);
        } finally {
            // Refresh the list to get the final status
            await loadSources();
        }
    };

    const handleDelete = async (sourceId: string) => {
        if(window.confirm(`Bạn có chắc muốn xóa nguồn tri thức "${sourceId}" không? Hành động này không thể hoàn tác.`)) {
             setError(null);
            try {
                await ragService.deleteSource(sourceId);
                await loadSources();
            } catch (err: any) {
                setError(`Lỗi khi xóa nguồn '${sourceId}': ${err.message}`);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div className="themed-modal rounded-lg shadow-2xl shadow-black/50 w-full max-w-3xl m-4 h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-2xl font-bold font-title text-amber-300">Quản lý Nguồn Tri Thức RAG</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>

                <div className="p-4 flex-grow overflow-y-auto">
                    {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30 mb-4">{error}</p>}
                    
                    <div className="space-y-3">
                         {isLoading ? (
                            <div className="flex justify-center p-8"><LoadingSpinner message="Đang tải nguồn..." /></div>
                        ) : sources.map(source => (
                            <div key={source.id} className="bg-black/20 p-3 rounded-lg border border-gray-700/60 flex justify-between items-center">
                                <div>
                                    <h4 className="font-bold text-gray-200">{source.name}</h4>
                                    <p className="text-xs text-gray-500">Loại: {source.type} | ID: {source.id}</p>
                                    <div className="flex items-center gap-2 mt-1 text-sm">
                                        {source.status === 'INDEXED' && <FaCheckCircle className="text-green-500" />}
                                        {source.status === 'INDEXING' && <FaSync className="text-blue-400 animate-spin" />}
                                        {source.status === 'UNINDEXED' && <FaExclamationCircle className="text-yellow-500" />}
                                        {source.status === 'ERROR' && <FaExclamationCircle className="text-red-500" />}
                                        <span className={`
                                            ${source.status === 'INDEXED' ? 'text-green-400' : ''}
                                            ${source.status === 'INDEXING' ? 'text-blue-300' : ''}
                                            ${source.status === 'UNINDEXED' ? 'text-yellow-400' : ''}
                                            ${source.status === 'ERROR' ? 'text-red-400' : ''}
                                        `}>{source.status}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                     <button 
                                        onClick={() => handleReIndex(source.id)}
                                        disabled={source.status === 'INDEXING'}
                                        className="settings-button text-xs px-3 py-1 flex items-center gap-2 disabled:opacity-50"
                                        title="Lập chỉ mục lại"
                                    >
                                        <FaSync />
                                    </button>
                                    {source.type === 'PLAYER_JOURNAL' && (
                                        <button 
                                            onClick={() => handleDelete(source.id)}
                                            className="settings-button-danger text-xs px-3 py-1"
                                            title="Xóa Nguồn"
                                        >
                                            <FaTrash />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="p-4 border-t border-gray-700 flex-shrink-0">
                    <input type="file" accept=".txt" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full settings-button-primary flex items-center justify-center gap-3 py-3"
                    >
                        <FaFileUpload /> Thêm "Tâm Kinh Ký" (Tải lên file .txt)
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">Tải lên các ghi chép, lore của riêng bạn để AI có thể học và tích hợp vào câu chuyện.</p>
                </div>
            </div>
        </div>
    );
};

export default RagSourceManagerModal;