import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FaArrowLeft, FaDownload, FaPaperPlane, FaBrain, FaBolt, FaSearch, FaInfinity } from 'react-icons/fa';
import { generateWorldFromText, chatWithGameMaster } from '../../../services/geminiService';
import type { FullMod } from '../../../types';
import LoadingScreen from '../../../components/LoadingScreen';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { useAppContext } from '../../../contexts/AppContext';

interface ChatEntry {
    role: 'user' | 'model';
    content: string;
}

interface GameMasterAiScreenProps {
    onBack: () => void;
    onInstall: (mod: FullMod) => Promise<boolean>;
}

type GenerationMode = 'fast' | 'deep' | 'super_deep';

const modeOptions: { id: GenerationMode; label: string; icon: React.ElementType; description: string; }[] = [
    { id: 'fast', label: 'Nhanh', icon: FaBolt, description: 'Trích xuất nhanh các thực thể chính. Phù hợp để tạo mẫu nhanh.' },
    { id: 'deep', label: 'Chuyên Sâu', icon: FaSearch, description: 'Phân tích sâu hơn về mối quan hệ, động cơ và quy luật. Mất nhiều thời gian hơn.' },
    { id: 'super_deep', label: 'Siêu Chuyên Sâu', icon: FaInfinity, description: 'AI sẽ sáng tạo và mở rộng dựa trên lore gốc để tạo ra một thế giới cực kỳ chi tiết. Mất nhiều thời gian nhất.' },
];

const GameMasterAiScreen: React.FC<GameMasterAiScreenProps> = ({ onBack, onInstall }) => {
    const { state } = useAppContext();
    const [chatHistory, setChatHistory] = useState<ChatEntry[]>([
        { role: 'model', content: 'Chào mừng đến với Game Master AI! Hãy bắt đầu mô tả thế giới trong mơ của bạn. Bạn muốn bắt đầu với bối cảnh, nhân vật chính, hay một hệ thống ma thuật độc đáo?' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generationMode, setGenerationMode] = useState<GenerationMode>('fast');
    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [userInput]);

    const handleSendMessage = async () => {
        if (!userInput.trim() || isGenerating) return;
        
        const newHistory: ChatEntry[] = [...chatHistory, { role: 'user', content: userInput }];
        setChatHistory(newHistory);
        setUserInput('');
        setIsGenerating(true);
        setError(null);

        try {
            const stream = chatWithGameMaster(newHistory);
            
            let fullResponse = '';
            setChatHistory(prev => [...prev, { role: 'model', content: '' }]);

            for await (const chunk of stream) {
                fullResponse += chunk;
                setChatHistory(prev => {
                    const latestHistory = [...prev];
                    latestHistory[latestHistory.length - 1].content = fullResponse;
                    return latestHistory;
                });
            }
        } catch (e: any) {
            setError(`Lỗi giao tiếp với AI: ${e.message}`);
            setChatHistory(prev => [...prev, { role: 'model', content: `[Lỗi] Tôi gặp sự cố khi xử lý yêu cầu. Vui lòng thử lại.` }]);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const getFullLoreText = useCallback(() => {
        return chatHistory
            .map(entry => `[${entry.role === 'user' ? 'Người Sáng Tạo' : 'Game Master'}]\n${entry.content}`)
            .join('\n\n---\n\n');
    }, [chatHistory]);

    const handleGenerateWorld = async () => {
        const loreText = getFullLoreText();
        if (chatHistory.length < 2) {
            setError("Cuộc trò chuyện chưa có nội dung để tạo thế giới.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const generatedMod = await generateWorldFromText(loreText, generationMode);
            const success = await onInstall(generatedMod);
            if(success) {
                alert(`Thế giới "${generatedMod.modInfo.name}" đã được tạo và cài đặt thành công!`);
                onBack();
            }
        } catch (e: any) {
            setError(`Lỗi khi tạo thế giới: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportTxt = () => {
        const loreText = getFullLoreText();
        const blob = new Blob([loreText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const novelTitle = chatHistory[1]?.content.substring(0, 20).replace(/\s/g, '_') || 'lore';
        link.download = `GameMasterAI_Lore_${novelTitle}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };
    
    if (isLoading) {
        return <LoadingScreen message="AI đang sáng tạo thế giới từ cuộc trò chuyện..." isGeneratingWorld={true} generationMode={generationMode} />;
    }

    return (
        <div className="flex-grow flex flex-col min-h-0 animate-fade-in">
            <div className="flex-shrink-0 mb-4">
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4">
                    <FaArrowLeft /> Quay Lại Menu
                </button>
            </div>
            
            <div className="flex-grow flex flex-col border border-gray-700/80 rounded-lg bg-black/20 min-h-0">
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {chatHistory.map((entry, index) => (
                        <div key={index} className={`flex gap-3 ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {entry.role === 'model' && <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0 p-1.5"><FaBrain className="w-full h-full" /></div>}
                            <div className={`max-w-xl p-3 rounded-lg ${entry.role === 'user' ? 'bg-blue-900/50' : 'bg-gray-800/60'}`}>
                                <p className="whitespace-pre-wrap">{entry.content}</p>
                            </div>
                        </div>
                    ))}
                    {isGenerating && <div className="flex justify-start"><LoadingSpinner size="sm" /></div>}
                    <div ref={chatEndRef} />
                </div>
                <div className="flex-shrink-0 p-3 border-t border-gray-700/80 bg-stone-900/50 rounded-b-lg">
                    {error && <p className="text-red-400 text-xs text-center mb-2">{error}</p>}
                    <div className="flex items-end gap-2">
                        <textarea
                            ref={textareaRef}
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                            disabled={isGenerating}
                            placeholder="Mô tả ý tưởng của bạn..."
                            rows={1}
                            className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 resize-none"
                        />
                        <button onClick={handleSendMessage} disabled={isGenerating || !userInput.trim()} className="p-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 disabled:bg-gray-500 transition-colors">
                            <FaPaperPlane />
                        </button>
                    </div>
                </div>
            </div>
            
             <div className="flex-shrink-0 mt-4 p-4 bg-black/20 rounded-lg border border-gray-700/80 space-y-4">
                <h4 className="font-bold font-title text-gray-300 text-lg text-center">Hoàn Tất Sáng Tạo</h4>
                <div>
                    <label className="block text-sm text-center font-semibold text-gray-400 mb-2">Chế Độ Phân Tích của AI</label>
                    <div className="flex items-center p-1 bg-black/30 rounded-lg border border-gray-700/60 w-full max-w-md mx-auto">
                        {modeOptions.map(mode => (
                             <button
                                key={mode.id}
                                onClick={() => setGenerationMode(mode.id)}
                                title={mode.description}
                                className={`w-1/3 text-center py-2 px-2 text-sm text-gray-400 rounded-md transition-colors duration-200 font-semibold hover:bg-gray-700/50 hover:text-white flex items-center justify-center gap-2 ${generationMode === mode.id ? 'bg-gray-600 text-white shadow-inner' : ''}`}
                            >
                                <mode.icon /> {mode.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={handleExportTxt} disabled={chatHistory.length < 2} className="w-full px-4 py-2 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        <FaDownload /> Xuất Lore (.txt)
                    </button>
                    <button onClick={handleGenerateWorld} disabled={chatHistory.length < 2 || isGenerating} className="w-full px-4 py-2 bg-[var(--button-primary-bg)] text-[var(--primary-accent-text-color)] border border-[var(--button-primary-border)] font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--button-primary-hover-bg)] hover:-translate-y-0.5 shadow-md shadow-black/30 disabled:opacity-50 flex items-center justify-center gap-2">
                        <FaBrain /> Kiến Tạo & Cài Đặt Thế Giới
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GameMasterAiScreen;
