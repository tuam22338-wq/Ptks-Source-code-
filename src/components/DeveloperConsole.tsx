
import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaTrash, FaChevronDown } from 'react-icons/fa';

interface LogEntry {
    level: 'log' | 'warn' | 'error' | 'info';
    timestamp: string;
    message: any[];
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

const DeveloperConsole: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const originalConsole = { ...console };
        
        const logToState = (level: LogEntry['level']) => (...args: any[]) => {
            originalConsole[level](...args);
            setLogs(prevLogs => [
                ...prevLogs.slice(-200), // Keep max 200 logs
                {
                    level,
                    timestamp: new Date().toLocaleTimeString(),
                    message: args,
                },
            ]);
        };

        console.log = logToState('log');
        console.warn = logToState('warn');
        console.error = logToState('error');
        console.info = logToState('info');
        
        return () => {
            Object.assign(console, originalConsole);
        };
    }, []);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] font-mono text-xs shadow-2xl">
            <div className={`bg-gray-900/90 backdrop-blur-sm border-t-2 border-gray-700 transition-all duration-300 ${isCollapsed ? 'max-h-8' : 'max-h-64'}`}>
                <div className="flex justify-between items-center p-1 bg-gray-800/80 cursor-pointer" onClick={() => setIsCollapsed(!isCollapsed)}>
                    <span className="font-bold text-gray-300">Developer Console</span>
                    <div className="flex items-center gap-2">
                         <button onClick={(e) => { e.stopPropagation(); setLogs([]); }} className="p-1 text-gray-400 hover:text-white" title="Clear Console"><FaTrash /></button>
                         <button onClick={(e) => { e.stopPropagation(); setIsVisible(false); }} className="p-1 text-gray-400 hover:text-white" title="Close Console"><FaTimes /></button>
                         <FaChevronDown className={`transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : ''}`} />
                    </div>
                </div>
                {!isCollapsed && (
                    <div ref={logContainerRef} className="h-full max-h-[calc(256px-32px)] overflow-y-auto p-2">
                        {logs.map((log, index) => {
                            const styles = LOG_STYLES[log.level];
                            return (
                                <div key={index} className={`flex items-start gap-2 p-1 border-b border-gray-800/50 ${styles.bg}`}>
                                    <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
                                    <span className={`flex-shrink-0 font-bold uppercase ${styles.text}`}>{log.level}</span>
                                    <div className={`flex-grow ${styles.text}`}>
                                        {formatLogMessage(log.message)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeveloperConsole;
