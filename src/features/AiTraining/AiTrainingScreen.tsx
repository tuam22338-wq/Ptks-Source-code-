


import React, { memo, useRef, useState, useEffect } from 'react';
import type { GameSettings, FullMod, GenerationMode, NovelContentEntry } from '../../types';
import { summarizeLargeTextForWorldGen, generateWorldFromText, chatWithGameMaster } from '../../services/gemini/modding.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import { FaFileUpload, FaDownload, FaBrain, FaArrowLeft, FaComments, FaDatabase, FaCog, FaTimes, FaPaperPlane, FaUserCircle, FaLightbulb, FaCopy } from 'react-icons/fa';
import { GiSparkles } from 'react-icons/gi';
import { useAppContext } from '../../contexts/AppContext';
import { PROMPT_TEMPLATES, PromptTemplate } from '../../data/promptTemplates';

type ActiveTab = 'data' | 'gm' | 'prompts';

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-10">
    <h3 className="text-xl font-bold font-title mb-4 pb-2 border-b border-gray-600/50 text-gray-300">{title}</h3>
    <div className="space-y-4">{children}</div>
  </section>
);

const SettingsRow: React.FC<{ label: string; description: string; children: React.ReactNode; disabled?: boolean }> = ({ label, description, children, disabled = false }) => (
  <div className={`bg-black/10 p-4 rounded-lg border border-gray-800/50 flex flex-col md:flex-row gap-4 items-start ${disabled ? 'opacity-50' : ''}`}>
    <div className="md:w-1/3 flex-shrink-0">
      <label className="block font-semibold text-gray-200">{label}</label>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
    <div className="md:w-2/3">{children}</div>
  </div>
);

// --- World Data Training Tab ---

const extractTextFromPdf = async (file: File): Promise<string> => {
    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) throw new Error("Thư viện PDF chưa được tải.");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map((item: any) => item.str).join(' ');
        textContent += '\n\n';
    }
    return textContent;
};

const WorldDataTrainingPanel: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [generatedMod, setGeneratedMod] = useState<FullMod | null>(null);
    const [generationMode, setGenerationMode] = useState<GenerationMode>('deep');

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        setLoadingMessage('Đang đọc và phân tích tệp...');
        setError(null);
        setFileName(file.name);
        setGeneratedMod(null);

        try {
            let text = '';
            if (file.type === 'application/pdf') text = await extractTextFromPdf(file);
            else text = await file.text();
            setFileContent(text);
        } catch (err: any) {
            setError(`Lỗi đọc file: ${err.message}`);
            setFileContent(null);
            setFileName(null);
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleGenerate = async () => {
        if (!fileContent) {
            setError('Vui lòng tải lên một tệp văn bản trước.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedMod(null);
        try {
            setLoadingMessage('AI đang tóm tắt nội dung (bước 1/2)...');
            const summarizedText = await summarizeLargeTextForWorldGen(fileContent);
            setLoadingMessage('AI đang kiến tạo thế giới từ tóm tắt (bước 2/2)...');
            const mod = await generateWorldFromText(summarizedText, generationMode);
            setGeneratedMod(mod);
        } catch (err: any) {
            setError(`Lỗi tạo dữ liệu thế giới: ${err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        if (!generatedMod) return;
        try {
            const jsonString = JSON.stringify(generatedMod, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${generatedMod.modInfo.id || 'generated_world'}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            setError(`Lỗi khi tải xuống file: ${err.message}`);
        }
    };

    return (
        <>
            <SettingsRow label="1. Tải lên Dữ liệu" description="Tải lên tệp .txt hoặc .pdf chứa lore, truyện, hoặc ghi chú. AI sẽ đọc và chuyển nó thành một file mod JSON.">
                <div>
                    <input type="file" accept=".txt,.pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-[var(--bg-interactive)] text-[var(--text-color)] border border-[var(--border-subtle)] rounded-lg font-semibold transition-colors duration-200 hover:bg-[var(--bg-interactive-hover)] hover:border-gray-500 flex items-center gap-2">
                        <FaFileUpload /> {fileName || 'Chọn Tệp...'}
                    </button>
                </div>
            </SettingsRow>
            <SettingsRow label="2. Chế độ Phân tích" description="Chọn độ sâu phân tích của AI. Chế độ sâu hơn cho kết quả chi tiết hơn nhưng mất nhiều thời gian hơn.">
                <select value={generationMode} onChange={(e) => setGenerationMode(e.target.value as GenerationMode)} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200">
                    <option value="fast">Nhanh (Trích xuất bề mặt)</option>
                    <option value="deep">Chuyên Sâu (Suy luận quan hệ)</option>
                    <option value="super_deep">Siêu Chuyên Sâu (Sáng tạo mở rộng)</option>
                </select>
            </SettingsRow>
            <SettingsRow label="3. Bắt đầu Huấn luyện" description="Bắt đầu quá trình để AI tạo ra file mod JSON từ dữ liệu bạn đã cung cấp.">
                <div className="w-full">
                    <button onClick={handleGenerate} disabled={!fileContent || isLoading} className="w-full px-6 py-3 bg-teal-700 text-white font-bold rounded-lg hover:bg-teal-600 disabled:bg-gray-600 flex items-center justify-center gap-2">
                        <FaBrain /> {isLoading ? 'Đang phân tích...' : 'Tạo Dữ Liệu Thế Giới'}
                    </button>
                    {isLoading && <div className="mt-4"><LoadingSpinner message={loadingMessage} /></div>}
                    {error && <p className="text-red-400 bg-red-900/20 p-2 rounded mt-2 text-sm">{error}</p>}
                    {generatedMod && (
                        <div className="mt-4 p-4 bg-green-900/20 border border-green-500/50 rounded-lg text-center">
                            <p className="text-green-300 font-semibold">Tạo thế giới thành công!</p>
                            <button onClick={handleDownload} className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 flex items-center gap-2 mx-auto">
                                <FaDownload /> Tải xuống file Mod JSON
                            </button>
                        </div>
                    )}
                </div>
            </SettingsRow>
        </>
    );
}


// --- Game Master Chat Tab ---

const parseContent = (text: string) => {
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    html = html.replace(/^\s*-\s(.*)/gim, '<li>$1</li>');
    html = html.replace(/<\/li>\s*<br \/>\s*<li>/g, '</li><li>');
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    html = html.replace(/\n/g, '<br />');
    return { __html: html };
};

const SettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    settings: GameSettings;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
}> = ({ isOpen, onClose, settings, handleSettingChange }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={onClose}>
            <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl m-4 h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-amber-300">Cài Đặt Game Master AI</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full"><FaTimes /></button>
                </div>
                <div className="p-4 overflow-y-auto">
                    <SettingsRow label="Độ lớn Phản hồi" description="Đặt độ dài mong muốn cho mỗi phản hồi của AI (1,000 - 100,000 từ). Càng dài, AI càng chi tiết.">
                        <div className="flex items-center gap-4">
                            <input type="range" min="1000" max="100000" step="1000" value={settings.gameMasterWordCount} onChange={(e) => handleSettingChange('gameMasterWordCount', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow"/>
                            <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-24 text-center">{settings.gameMasterWordCount}</span>
                        </div>
                    </SettingsRow>
                    <SettingsRow label="Bật Google Grounding" description="Cho phép AI sử dụng Google Search để có thông tin mới và chính xác hơn. Có thể làm thay đổi văn phong.">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={settings.enableGoogleGrounding} onChange={e => handleSettingChange('enableGoogleGrounding', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                            <span className="ml-3 text-sm text-gray-300">Sử dụng Google Search</span>
                        </label>
                    </SettingsRow>
                </div>
            </div>
        </div>
    );
};

const GameMasterChatPanel: React.FC<{
    userInput: string;
    setUserInput: (value: string) => void;
}> = ({ userInput, setUserInput }) => {
    const { state, handleSettingChange } = useAppContext();
    const [history, setHistory] = useState<{ role: 'user' | 'model', content: string }[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSettingsOpen, setSettingsOpen] = useState(false);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);
    
    const [isWorldGenLoading, setWorldGenLoading] = useState(false);
    const [worldGenMessage, setWorldGenMessage] = useState('');
    const [worldGenError, setWorldGenError] = useState<string | null>(null);
    const [generatedMod, setGeneratedMod] = useState<FullMod | null>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history]);

    const handleSendMessage = async () => {
        if (!userInput.trim() || isGenerating) return;
        const newHistory = [...history, { role: 'user' as const, content: userInput }];
        setHistory(newHistory);
        setUserInput('');
        setIsGenerating(true);

        try {
            const stream = chatWithGameMaster(newHistory);
            let fullResponse = '';
            setHistory(prev => [...prev, { role: 'model', content: '' }]); // Placeholder for AI response
            for await (const chunk of stream) {
                fullResponse += chunk;
                setHistory(prev => {
                    const latestHistory = [...prev];
                    latestHistory[latestHistory.length - 1].content = fullResponse;
                    return latestHistory;
                });
            }
        } catch (error: any) {
            setHistory(prev => [...prev, { role: 'model', content: `[Lỗi] Không thể kết nối đến AI: ${error.message}` }]);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleGenerateFromChat = async () => {
        if (history.length === 0) {
            setWorldGenError("Chưa có nội dung hội thoại để tạo thế giới.");
            return;
        }

        setWorldGenLoading(true);
        setWorldGenError(null);
        setGeneratedMod(null);

        try {
            setWorldGenMessage('Tổng hợp nội dung hội thoại...');
            const combinedText = history
                .filter(entry => entry.role === 'model')
                .map(entry => entry.content)
                .join('\n\n---\n\n');

            if (!combinedText.trim()) {
                throw new Error("Không có nội dung phản hồi từ AI để phân tích.");
            }

            setWorldGenMessage('AI đang tóm tắt nội dung (bước 1/2)...');
            const summarizedText = await summarizeLargeTextForWorldGen(combinedText);

            setWorldGenMessage('AI đang kiến tạo thế giới từ tóm tắt (bước 2/2)...');
            const mod = await generateWorldFromText(summarizedText, 'deep');
            setGeneratedMod(mod);

        } catch (err: any) {
            setWorldGenError(`Lỗi tạo dữ liệu thế giới: ${err.message}`);
        } finally {
            setWorldGenLoading(false);
        }
    };

    const handleDownloadGeneratedMod = () => {
        if (!generatedMod) return;
        try {
            const jsonString = JSON.stringify(generatedMod, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${generatedMod.modInfo.id || 'generated_world_from_chat'}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err: any) {
            setWorldGenError(`Lỗi khi tải xuống file: ${err.message}`);
        }
    };
    
    return (
        <div className="flex flex-col h-full w-full bg-gemini-surface-subtle gemini-theme rounded-b-xl">
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} settings={state.settings} handleSettingChange={handleSettingChange} />
            <div className="flex-grow overflow-y-auto p-4 md:p-6 min-h-0">
                <div className="max-w-4xl mx-auto">
                    {history.map((entry, index) => (
                        <div key={index} className="gemini-message-container py-4">
                            {entry.role === 'user' ? (
                                <div className="flex gap-4">
                                    <FaUserCircle className="text-3xl text-gemini-text-muted flex-shrink-0" />
                                    <p className="pt-1">{entry.content}</p>
                                </div>
                            ) : (
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gemini-accent/80 flex items-center justify-center flex-shrink-0 p-1.5"><GiSparkles className="w-full h-full" /></div>
                                    <div className="pt-1 prose prose-invert" dangerouslySetInnerHTML={parseContent(entry.content)} />
                                </div>
                            )}
                        </div>
                    ))}
                     {isGenerating && history.length > 0 && history[history.length - 1].role === 'model' && (
                        <div className="flex justify-start ml-12"><LoadingSpinner size="sm" /></div>
                    )}
                    <div ref={endOfMessagesRef} />
                </div>
            </div>
             <div className="gemini-input-container">
                <div className="flex items-center gap-2 mb-2">
                     <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-full hover:bg-gemini-surface text-gemini-text-muted"><FaCog /></button>
                     <button 
                        onClick={handleGenerateFromChat} 
                        disabled={isGenerating || isWorldGenLoading || history.length === 0}
                        className="flex-grow px-4 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        <FaBrain /> Kiến Tạo Thế Giới
                    </button>
                </div>

                {isWorldGenLoading && <div className="mt-2"><LoadingSpinner message={worldGenMessage} /></div>}
                {worldGenError && <p className="text-red-400 bg-red-900/20 p-2 rounded mt-2 text-sm">{worldGenError}</p>}
                {generatedMod && (
                    <div className="mt-2 p-4 bg-green-900/20 border border-green-500/50 rounded-lg text-center">
                        <p className="text-green-300 font-semibold">Tạo thế giới thành công!</p>
                        <button onClick={handleDownloadGeneratedMod} className="mt-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 flex items-center gap-2 mx-auto">
                            <FaDownload /> Tải xuống file Mod JSON
                        </button>
                    </div>
                )}

                <div className="gemini-input-bar">
                    <textarea value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} disabled={isGenerating} placeholder="Trò chuyện với Game Master AI để xây dựng thế giới..." rows={1} className="gemini-textarea" />
                    <button onClick={handleSendMessage} disabled={isGenerating || !userInput.trim()} className="gemini-send-button">{isGenerating ? <div className="gemini-loader"></div> : <FaPaperPlane />}</button>
                </div>
            </div>
        </div>
    );
};

// --- Prompt Engineering Tab ---
const PromptEngineeringPanel: React.FC<{
    setActiveTab: (tab: ActiveTab) => void;
    setUserInputForGM: (input: string) => void;
}> = ({ setActiveTab, setUserInputForGM }) => {
    
    const [copySuccess, setCopySuccess] = useState('');

    const groupedPrompts = React.useMemo(() => {
        // FIX: Explicitly typing the accumulator in the reduce function ensures correct type inference for `groupedPrompts`, resolving the 'unknown' type error on `prompts`.
        return PROMPT_TEMPLATES.reduce((acc: Record<string, PromptTemplate[]>, prompt) => {
            const category = prompt.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(prompt);
            return acc;
        }, {});
    }, []);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopySuccess(text);
            setTimeout(() => setCopySuccess(''), 2000);
        }, (err) => {
            console.error('Lỗi sao chép: ', err);
        });
    };

    const handleUseInChat = (promptText: string) => {
        setUserInputForGM(promptText);
        setActiveTab('gm');
    };

    return (
        <div className="p-4 space-y-6">
            <h3 className="text-xl font-bold font-title text-center text-amber-300">Thư Viện Prompt Mẫu</h3>
            <p className="text-sm text-center text-gray-400">Học hỏi các kỹ thuật prompt chuyên nghiệp để ra lệnh cho AI một cách hiệu quả nhất. Sử dụng các mẫu dưới đây làm nền tảng để sáng tạo thế giới của riêng bạn.</p>
            {Object.entries(groupedPrompts).map(([category, prompts]) => (
                <div key={category}>
                    <h4 className="text-lg font-bold font-title text-gray-300 mb-3 pb-2 border-b border-gray-700">{category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {prompts.map((p, index) => (
                            <div key={index} className="bg-black/20 p-4 rounded-lg border border-gray-700/60 flex flex-col">
                                <h5 className="font-bold text-amber-300">{p.title}</h5>
                                <p className="text-xs text-gray-500 italic mt-1 mb-2">{p.description}</p>
                                <pre className="text-sm bg-black/30 p-3 rounded whitespace-pre-wrap font-mono flex-grow text-gray-300">{p.prompt}</pre>
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => handleCopy(p.prompt)} className="flex-1 text-xs px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-500 flex items-center justify-center gap-2">
                                        <FaCopy /> {copySuccess === p.prompt ? 'Đã chép!' : 'Sao chép'}
                                    </button>
                                    <button onClick={() => handleUseInChat(p.prompt)} className="flex-1 text-xs px-3 py-1.5 bg-teal-700 text-white rounded hover:bg-teal-600 flex items-center justify-center gap-2">
                                        Sử dụng trong Chat
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};


// --- Main Screen ---

const AiTrainingScreen: React.FC = () => {
    const { handleNavigate, handleSettingsSave } = useAppContext();
    const [activeTab, setActiveTab] = useState<ActiveTab>('gm');
    const [userInputForGM, setUserInputForGM] = useState('');

    return (
        <div className="w-full animate-fade-in flex flex-col h-full min-h-0">
            <div className="flex-shrink-0 flex justify-between items-center mb-6">
                <button onClick={() => handleNavigate('mainMenu')} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors" title="Quay Lại Menu"><FaArrowLeft className="w-5 h-5" /></button>
                <h2 className="text-3xl font-bold font-title">Huấn Luyện AI</h2>
                <div className="w-9 h-9"></div> {/* Spacer */}
            </div>
            
            <div className="flex-shrink-0 flex items-center gap-2 p-1 bg-black/20 rounded-t-lg border-b border-gray-700/60">
                <button onClick={() => setActiveTab('gm')} className={`w-1/3 flex items-center justify-center gap-2 py-3 font-semibold rounded-t-md transition-colors ${activeTab === 'gm' ? 'bg-[var(--panel-bg-color)] text-amber-300' : 'text-gray-400 hover:bg-gray-700/30'}`}>
                    <FaComments /> Game Master AI
                </button>
                 <button onClick={() => setActiveTab('prompts')} className={`w-1/3 flex items-center justify-center gap-2 py-3 font-semibold rounded-t-md transition-colors ${activeTab === 'prompts' ? 'bg-[var(--panel-bg-color)] text-amber-300' : 'text-gray-400 hover:bg-gray-700/30'}`}>
                    <FaLightbulb /> Kỹ Thuật Prompt
                </button>
                <button onClick={() => setActiveTab('data')} className={`w-1/3 flex items-center justify-center gap-2 py-3 font-semibold rounded-t-md transition-colors ${activeTab === 'data' ? 'bg-[var(--panel-bg-color)] text-amber-300' : 'text-gray-400 hover:bg-gray-700/30'}`}>
                    <FaDatabase /> Huấn Luyện Dữ Liệu
                </button>
            </div>

            <div className="flex-grow min-h-0 overflow-y-auto rounded-b-xl" style={{backgroundColor: 'var(--panel-bg-color)'}}>
                {activeTab === 'data' && (
                    <div className="p-4">
                        <SettingsSection title="Tạo Dữ Liệu Thế Giới Từ Văn Bản">
                            <WorldDataTrainingPanel />
                        </SettingsSection>
                    </div>
                )}
                {activeTab === 'gm' && (
                    <GameMasterChatPanel userInput={userInputForGM} setUserInput={setUserInputForGM} />
                )}
                {activeTab === 'prompts' && (
                    <PromptEngineeringPanel setActiveTab={setActiveTab} setUserInputForGM={setUserInputForGM} />
                )}
            </div>
            
            <div className="flex-shrink-0 mt-6 pt-4 border-t border-gray-700/60 flex justify-end">
                <button onClick={handleSettingsSave} className="px-6 py-2 bg-[var(--button-primary-bg)] text-[var(--primary-accent-text-color)] border border-[var(--button-primary-border)] rounded-md font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--button-primary-hover-bg)] hover:-translate-y-0.5 shadow-md shadow-black/30">Lưu Cài Đặt</button>
            </div>
        </div>
    );
};

export default memo(AiTrainingScreen);