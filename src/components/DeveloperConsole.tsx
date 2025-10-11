import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
import { FaTimes, FaTrash, FaChevronUp, FaCode, FaBrain, FaTerminal, FaKey, FaSyncAlt, FaExclamationCircle, FaCheckCircle, FaRocket, FaBookmark, FaUndo } from 'react-icons/fa';
import { useAppContext } from '../contexts/useAppContext';

// Log entry types
interface LogEntry {
    level: 'log' | 'warn' | 'error' | 'info';
    timestamp: string;
    message: any[];
}

interface AiLogEntry {
    type: 'AI_MONITOR';
    timestamp: string;
    event: 'API_CALL' | 'KEY_ROTATION' | 'MODEL_FALLBACK';
    [key: string]: any;
}

const formatLogMessage = (args: any[]): React.ReactNode => {
    return args.map((arg, index) => {
        if (typeof arg === 'object' && arg !== null) {
            try {
                return <pre key={index} className="whitespace-pre-wrap">{JSON.stringify(arg, null, 2)}</pre>;
            } catch (e) {
                return <span key={index}>[Unserializable Object]</span>;
            }
        }
        return <span key={index}>{String(arg)} </span>;
    });
};

const LOG_STYLES = {
    log: { bg: 'bg-transparent', text: 'text-gray-300' },
    warn: { bg: 'bg-yellow-900/30', text: 'text-yellow-300' },
    error: { bg: 'bg-red-900/30', text: 'text-red-400' },
    info: { bg: 'bg-blue-900/30', text: 'text-blue-300' },
};

const DraggableIcon: React.FC<{ onClick: () => void }> = ({ onClick }) => {
    const [position, setPosition] = useState({ x: 20, y: window.innerHeight - 80 });
    const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, offset: { x: 0, y: 0 } });
    const nodeRef = useRef<HTMLButtonElement>(null);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (!nodeRef.current) return;
        const rect = nodeRef.current.getBoundingClientRect();
        dragInfo.current = {
            isDragging: true,
            startX: e.clientX,
            startY: e.clientY,
            offset: { x: e.clientX - rect.left, y: e.clientY - rect.top },
        };
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
    };

    // FIX: Import 'useCallback' from React to resolve 'Cannot find name' error.
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragInfo.current.isDragging) return;
        e.preventDefault();
        setPosition({
            x: e.clientX - dragInfo.current.offset.x,
            y: e.clientY - dragInfo.current.offset.y,
        });
    }, []);

    // FIX: Import 'useCallback' from React to resolve 'Cannot find name' error.
    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (!dragInfo.current.isDragging) return;

        const dx = e.clientX - dragInfo.current.startX;
        const dy = e.clientY - dragInfo.current.startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
            onClick();
        }

        dragInfo.current.isDragging = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
    }, [onClick]);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    return (
        <button
            ref={nodeRef}
            onMouseDown={handleMouseDown}
            className="fixed z-[100] w-14 h-14 rounded-full bg-amber-500/80 text-white flex items-center justify-center shadow-2xl backdrop-blur-sm cursor-grab active:cursor-grabbing transition-transform duration-200 hover:scale-110"
            style={{ left: position.x, top: position.y }}
            title="Open Developer Console"
        >
            <FaCode size={22} />
        </button>
    );
};


const DeveloperConsole: React.FC = () => {
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [generalLogs, setGeneralLogs] = useState<LogEntry[]>([]);
    const [aiLogs, setAiLogs] = useState<AiLogEntry[]>([]);
    const [activeTab, setActiveTab] = useState<'ai' | 'logs'>('ai');
    const logContainerRef = useRef<HTMLDivElement>(null);

    const { state, handleSaveHotmark, handleLoadHotmark } = useAppContext();
    const [hotmarkStatus, setHotmarkStatus] = useState('');

    useEffect(() => {
        const originalConsole = { ...console };
        const logToState = (level: LogEntry['level']) => (...args: any[]) => {
            originalConsole[level](...args);
            const firstArg = args[0];

            // Check for our custom structured AI logs
            if (typeof firstArg === 'object' && firstArg !== null && firstArg.type === 'AI_MONITOR') {
                setAiLogs(prev => [...prev.slice(-200), { ...firstArg, timestamp: new Date().toLocaleTimeString() }]);
            } else {
                 setGeneralLogs(prev => [...prev.slice(-200), { level, timestamp: new Date().toLocaleTimeString(), message: args }]);
            }
        };

        console.log = logToState('log');
        console.warn = logToState('warn');
        console.error = logToState('error');
        console.info = logToState('info');
        
        return () => { Object.assign(console, originalConsole); };
    }, []);

    useEffect(() => {
        if (isPanelOpen && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [generalLogs, aiLogs, isPanelOpen, activeTab]);

    const onSaveHotmark = async () => {
        setHotmarkStatus('Đang lưu...');
        try {
            await handleSaveHotmark();
            setHotmarkStatus('Đã lưu!');
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            setHotmarkStatus(`Lỗi: ${message}`);
        } finally {
            setTimeout(() => setHotmarkStatus(''), 2500);
        }
    };

    const onLoadHotmark = async () => {
        setHotmarkStatus('Đang tải...');
         try {
            await handleLoadHotmark();
            setHotmarkStatus('Đã tải!');
        } catch (e) {
            const message = e instanceof Error ? e.message : String(e);
            setHotmarkStatus(`Lỗi: ${message}`);
        } finally {
            setTimeout(() => setHotmarkStatus(''), 2500);
        }
    };
    
    const renderAiLog = (log: AiLogEntry, index: number) => {
        switch(log.event) {
            case 'API_CALL':
                const statusColor = log.status === 'SUCCESS' ? 'text-green-400' : log.status === 'FAIL' ? 'text-red-400' : 'text-blue-400';
                return (
                    <div key={index} className="flex items-start gap-2 p-1.5 border-b border-gray-800/50 bg-gray-900/30">
                        <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
                        <FaRocket className={`${statusColor} mt-1 flex-shrink-0`} />
                        <div className="flex-grow text-gray-300">
                            API Call <span className={`${statusColor} font-bold`}>{log.status}</span> on <span className="text-cyan-400 font-mono">{log.model}</span> (Key #{log.keyIndex})
                            {log.reason && <p className="text-xs text-red-400/80 mt-1">Reason: {log.reason}</p>}
                        </div>
                    </div>
                );
            case 'KEY_ROTATION':
                 return (
                    <div key={index} className="flex items-start gap-2 p-1.5 border-b border-gray-800/50 bg-yellow-900/20">
                        <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
                        <FaKey className="text-yellow-400 mt-1 flex-shrink-0" />
                        <div className="flex-grow text-yellow-300">
                            Rotating API Key due to <span className="font-bold">{log.reason}</span>.
                             <span className="font-mono">{`${log.fromIndex} -> ${log.toIndex}`}</span>
                        </div>
                    </div>
                );
            case 'MODEL_FALLBACK':
                 return (
                    <div key={index} className="flex items-start gap-2 p-1.5 border-b border-gray-800/50 bg-orange-900/30">
                        <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
                        <FaSyncAlt className="text-orange-400 mt-1 flex-shrink-0" />
                        <div className="flex-grow text-orange-300">
                            Model Fallback triggered due to <span className="font-bold">{log.reason}</span>.
                            <span className="font-mono">{`${log.fromModel} -> ${log.toModel}`}</span>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    if (!isPanelOpen) {
        return <DraggableIcon onClick={() => setIsPanelOpen(true)} />;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] font-mono text-xs shadow-2xl h-80">
            <div className="bg-gray-900/90 backdrop-blur-sm border-t-2 border-gray-700 h-full flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-1 bg-gray-800/80 flex-shrink-0">
                    <span className="font-bold text-gray-300">Developer Console</span>
                    <div className="flex items-center gap-2">
                        {hotmarkStatus && (
                            <span className={`text-xs px-2 py-0.5 rounded ${hotmarkStatus.includes('Lỗi') ? 'bg-red-500/50 text-red-300' : 'bg-green-500/50 text-green-300'}`}>
                                {hotmarkStatus}
                            </span>
                        )}
                        <button onClick={onSaveHotmark} disabled={!state.gameState} className="p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed" title="Lưu Hotmark (Snapshot Trạng thái Game)">
                            <FaBookmark />
                        </button>
                        <button onClick={onLoadHotmark} className="p-1 text-gray-400 hover:text-white" title="Tải Hotmark (Quay lại Snapshot)">
                            <FaUndo />
                        </button>
                        <div className="w-px h-4 bg-gray-600"></div>
                        <button onClick={() => { activeTab === 'ai' ? setAiLogs([]) : setGeneralLogs([]); }} className="p-1 text-gray-400 hover:text-white" title="Clear Current Tab"><FaTrash /></button>
                        <button onClick={() => setIsPanelOpen(false)} className="p-1 text-gray-400 hover:text-white" title="Minimize to Icon"><FaChevronUp /></button>
                    </div>
                </div>
                {/* Tabs */}
                <div className="flex-shrink-0 flex gap-1 p-1 bg-black/20">
                    <button onClick={() => setActiveTab('ai')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md ${activeTab === 'ai' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}><FaBrain/> AI Monitor</button>
                    <button onClick={() => setActiveTab('logs')} className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md ${activeTab === 'logs' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}><FaTerminal /> General Logs</button>
                </div>
                {/* Content */}
                <div ref={logContainerRef} className="flex-grow overflow-y-auto p-2">
                    {activeTab === 'ai' ? (
                        aiLogs.length > 0 ? aiLogs.map(renderAiLog) : <p className="text-gray-500 p-4 text-center">Awaiting AI activity...</p>
                    ) : (
                        generalLogs.map((log, index) => {
                            const styles = LOG_STYLES[log.level];
                            return (
                                <div key={index} className={`flex items-start gap-2 p-1 border-b border-gray-800/50 ${styles.bg}`}>
                                    <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
                                    <span className={`flex-shrink-0 font-bold uppercase ${styles.text}`}>{log.level}</span>
                                    <div className={`flex-grow ${styles.text}`}>{formatLogMessage(log.message)}</div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(DeveloperConsole);