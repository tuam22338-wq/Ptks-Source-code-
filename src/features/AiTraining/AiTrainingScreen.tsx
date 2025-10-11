import React, { memo, useRef, useState, useEffect } from 'react';
import type { GameSettings, FullMod, GenerationMode, NovelContentEntry } from '../../types';
import { summarizeLargeTextForWorldGen, generateWorldFromText, chatWithGameMaster } from '../../services/gemini/modding.service';
import LoadingSpinner from '../../components/LoadingSpinner';
// FIX: Import `FaTrash` from `react-icons/fa` to resolve 'Cannot find name' error.
import { FaFileUpload, FaDownload, FaBrain, FaArrowLeft, FaComments, FaDatabase, FaCog, FaTimes, FaPaperPlane, FaUserCircle, FaLightbulb, FaCopy, FaCheckCircle, FaTrash } from 'react-icons/fa';
import { GiSparkles } from 'react-icons/gi';
// FIX: Fix import path for `useAppContext` to point to the correct module.
import { useAppContext } from '../../contexts/useAppContext';
import { PROMPT_TEMPLATES, PromptTemplate } from '../../data/promptTemplates';

type ActiveTab = 'data' | 'gm' | 'prompts';

const SettingsSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-10">
    <h3 className="text-xl font-bold font-title mb-4 pb-2 border-b" style={{color: 'var(--text-color)', borderColor: 'var(--shadow-light)'}}>{title}</h3>
    <div className="space-y-4">{children}</div>
  </section>
);

const SettingsRow: React.FC<{ label: string; description: string; children: React.ReactNode; disabled?: boolean }> = ({ label, description, children, disabled = false }) => (
  <div className={`neumorphic-inset-box p-4 flex flex-col md:flex-row gap-4 items-start ${disabled ? 'opacity-50' : ''}`}>
    <div className="md:w-1/3 flex-shrink-0">
      <label className="block font-semibold" style={{color: 'var(--text-color)'}}>{label}</label>
      <p className="text-sm mt-1" style={{color: 'var(--text-muted-color)'}}>{description}</p>
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

const fixModStructure = (mod: any): FullMod => {
    if (mod && mod.modInfo && mod.content) {
        return mod as FullMod; // Already valid
    }
    console.warn("AI returned an incomplete mod structure. Attempting to fix.", mod);
    // Attempt to fix a common mistake where 'content' is at the top level
    if (mod && mod.worldData) {
        return {
            modInfo: mod.modInfo || { // Use modInfo if it exists, otherwise create one
                id: `generated_world_${Date.now()}`,
                name: mod.worldData[0]?.name || "Generated World (Fixed)",
                description: mod.worldData[0]?.description || "World generated from text, structure was fixed.",
                version: "1.0.0",
                tags: mod.worldData[0]?.tags || [],
            },
            content: {
                ...mod,
                // Remove modInfo from content if it was there
                ...(mod.modInfo && { modInfo: undefined })
            }
        };
    }
    throw new Error("AI đã trả về một cấu trúc mod không hợp lệ và không thể tự động sửa chữa. JSON phải có thuộc tính `modInfo` và `content` ở cấp cao nhất.");
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
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(`Lỗi đọc file: ${message}`);
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
            const rawMod = await generateWorldFromText(summarizedText, generationMode);
            const mod = fixModStructure(rawMod);
            setGeneratedMod(mod);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(`Lỗi tạo dữ liệu thế giới: ${message}`);
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
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setError(`Lỗi khi tải xuống file: ${message}`);
        }
    };

    return (
        <>
            <SettingsRow label="1. Tải lên Dữ liệu" description="Tải lên tệp .txt hoặc .pdf chứa lore, truyện, hoặc ghi chú. AI sẽ đọc và chuyển nó thành một file mod JSON.">
                <div>
                    <input type="file" accept=".txt,.pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="btn btn-neumorphic flex items-center gap-2">
                        <FaFileUpload /> {fileName || 'Chọn Tệp...'}
                    </button>
                </div>
            </SettingsRow>
            <SettingsRow label="2. Chế độ Phân tích" description="Chọn độ sâu phân tích của AI. Chế độ sâu hơn cho kết quả chi tiết hơn nhưng mất nhiều thời gian hơn.">
                <select value={generationMode} onChange={(e) => setGenerationMode(e.target.value as GenerationMode)} className="input-neumorphic w-full">
                    <option value="fast">Nhanh (Trích xuất bề mặt)</option>
                    <option value="deep">Chuyên Sâu (Suy luận quan hệ)</option>
                    <option value="super_deep">Siêu Chuyên Sâu (Sáng tạo mở rộng)</option>
                </select>
            </SettingsRow>
            <SettingsRow label="3. Bắt đầu Huấn luyện" description="Bắt đầu quá trình để AI tạo ra file mod JSON từ dữ liệu bạn đã cung cấp.">
                <div className="w-full">
                    <button onClick={handleGenerate} disabled={!fileContent || isLoading} className="btn btn-primary w-full px-6 py-3 text-lg flex items-center justify-center gap-2">
                        <FaBrain /> {isLoading ? 'Đang phân tích...' : 'Tạo Dữ Liệu Thế Giới'}
                    </button>
                    {isLoading && <div className="mt-4"><LoadingSpinner message={loadingMessage} /></div>}
                    {error && <p className="bg-red-900/20 p-2 rounded mt-2 text-sm text-[var(--error-color)]">{error}</p>}
                    {generatedMod && (
                        <div className="mt-4 p-4 bg-green-900/20 border border-green-500/50 rounded-lg text-center">
                            <p className="font-semibold text-[var(--success-color)]">Tạo thế giới thành công!</p>
                            <button onClick={handleDownload} className="btn btn-primary !bg-green-600 mt-2 flex items-center gap-2 mx-auto">
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
                    <h3 className="text-xl font-bold" style={{color: 'var(--primary-accent-color)'}}>Cài Đặt Game Master AI</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-800"><FaTimes /></button>
                </div>
                <div className="p-4 overflow-y-auto">
                    <SettingsRow label="Độ lớn Phản hồi" description="Đặt độ dài mong muốn cho mỗi phản hồi của AI (1,000 - 100,000 từ). Càng dài, AI càng chi tiết.">
                        <div className="flex items-center gap-4">
                            <input type="range" min="1000" max="100000" step="1000" value={settings.gameMasterWordCount} onChange={(e) => handleSettingChange('gameMasterWordCount', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow"/>
                            <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 w-24 text-center" style={{color: 'var(--text-color)'}}>{settings.gameMasterWordCount}</span>
                        </div>
                    </SettingsRow>
                    <SettingsRow label="Bật Google Grounding" description="Cho phép AI sử dụng Google Search để có thông tin mới và chính xác hơn. Có thể làm thay đổi văn phong.">
                        <label className="flex items-center cursor-pointer">
                            <input type="checkbox" checked={settings.enableGoogleGrounding} onChange={e => handleSettingChange('enableGoogleGrounding', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                            <span className="ml-3 text-sm" style={{color: 'var(--text-color)'}}>Sử dụng Google Search</span>
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
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            setHistory(prev => [...prev, { role: 'model', content: `[Lỗi] Không thể kết nối đến AI: ${message}` }]);
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
            const rawMod = await generateWorldFromText(summarizedText, 'deep');
            const mod = fixModStructure(rawMod);
            setGeneratedMod(mod);

        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setWorldGenError(`Lỗi tạo dữ liệu thế giới: ${message}`);
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
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            setWorldGenError(`Lỗi khi tải xuống file: ${message}`);
        }
    };
    
    return (
        <div className="flex flex-col h-full w-full rounded-b-xl" style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)'}}>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} settings={state.settings} handleSettingChange={handleSettingChange} />
            <div className="flex-grow overflow-y-auto p-4 md:p-6 min-h-0">
                <div className="max-w-4xl mx-auto">
                    {history.map((entry, index) => (
                        <div key={index} className="gemini-message-container py-4">
                            {entry.role === 'user' ? (
                                <div className="flex gap-4">
                                    <FaUserCircle className="text-3xl text-[var(--text-muted-color)] flex-shrink-0" />
                                    <p className="pt-1">{entry.content}</p>
                                </div>
                            ) : (
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 p-1.5" style={{ backgroundColor: 'rgba(var(--primary-accent-color-rgb), 0.8)'}}><GiSparkles className="w-full h-full" style={{ color: 'var(--primary-accent-text-color)'}}/></div>
                                    <div className="pt-1 prose prose-invert" style={{color: 'var(--text-color)'}} dangerouslySetInnerHTML={parseContent(entry.content)} />
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
                     <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-full hover:bg-[var(--shadow-light)] text-[var(--text-muted-color)]" title="Cài đặt"><FaCog /></button>
                     <button onClick={() => setHistory([])} className="p-2 rounded-full hover:bg-[var(--shadow-light)] text-[var(--text-muted-color)]" title="Xóa lịch sử"><FaTrash /></button>
                     <div className="flex-grow"></div>
                      <div className="relative">
                        <button onClick={handleGenerateFromChat} disabled={isWorldGenLoading || history.length === 0} className="btn btn-primary !bg-teal-600 !py-2 !px-4 text-sm flex items-center gap-2">
                            <FaBrain /> Tạo World Data
                        </button>
                        {(isWorldGenLoading || worldGenError || generatedMod) && (
                            <div className="absolute bottom-full right-0 mb-2 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 z-10">
                                {isWorldGenLoading && <LoadingSpinner message={worldGenMessage} size="sm" />}
                                {worldGenError && <p className="text-sm text-red-400">{worldGenError}</p>}
                                {generatedMod && (
                                    <div className="text-center">
                                        <p className="font-semibold text-green-400">Tạo thế giới thành công!</p>
                                        <button onClick={handleDownloadGeneratedMod} className="btn btn-primary !bg-green-600 mt-2 text-sm w-full">
                                            <FaDownload /> Tải xuống file
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <div className="gemini-input-bar">
                    <textarea 
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                        disabled={isGenerating}
                        placeholder="Trò chuyện với Game Master AI để xây dựng thế giới..."
                        rows={1}
                        className="gemini-textarea"
                    />
                    <button onClick={handleSendMessage} disabled={isGenerating || !userInput.trim()} className="gemini-send-button">
                        {isGenerating ? <div className="gemini-loader"/> : <FaPaperPlane />}
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Prompt Library Tab ---

const PromptLibraryPanel: React.FC<{
    onSelect: (prompt: string) => void;
}> = ({ onSelect }) => {
    const [selectedCategory, setSelectedCategory] = useState<string>('Kiến tạo Thế giới');
    const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

    const categories = [...new Set(PROMPT_TEMPLATES.map(p => p.category))];
    const filteredPrompts = PROMPT_TEMPLATES.filter(p => p.category === selectedCategory);

    const handleCopy = (promptText: string) => {
        navigator.clipboard.writeText(promptText).then(() => {
            setCopiedPrompt(promptText);
            setTimeout(() => setCopiedPrompt(null), 2000);
        });
    };
    
    return (
       <div className="flex h-full">
            <nav className="w-48 flex-shrink-0 bg-black/10 p-2 space-y-1">
                {categories.map(category => (
                    <button 
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`w-full text-left text-sm p-2 rounded-md font-semibold transition-colors ${selectedCategory === category ? 'bg-[var(--primary-accent-color)]/20 text-[var(--primary-accent-color)]' : 'text-gray-400 hover:bg-gray-800/50'}`}
                    >
                        {category}
                    </button>
                ))}
            </nav>
            <div className="flex-grow p-4 overflow-y-auto">
                <div className="space-y-3">
                    {filteredPrompts.map(template => (
                         <div key={template.title} className="neumorphic-inset-box p-3">
                            <h4 className="font-bold text-[var(--text-color)]">{template.title}</h4>
                            <p className="text-xs text-[var(--text-muted-color)] mt-1 mb-2">{template.description}</p>
                            <div className="flex gap-2">
                                <button onClick={() => onSelect(template.prompt)} className="btn btn-primary !text-xs !py-1 flex-1"><FaLightbulb /> Sử dụng</button>
                                <button onClick={() => handleCopy(template.prompt)} className="btn btn-neumorphic !text-xs !py-1 flex-1">
                                    {copiedPrompt === template.prompt ? <FaCheckCircle /> : <FaCopy />}
                                    {copiedPrompt === template.prompt ? 'Đã chép' : 'Sao chép'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
       </div>
    );
};


const AiTrainingScreen: React.FC = () => {
    const { handleNavigate } = useAppContext();
    const [activeTab, setActiveTab] = useState<ActiveTab>('data');
    const [gmUserInput, setGmUserInput] = useState('');

    return (
        <div className="w-full animate-fade-in flex flex-col h-full min-h-0 p-4 sm:p-6">
            <div className="flex-shrink-0 flex justify-between items-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold font-title">Huấn Luyện AI</h2>
                <button onClick={() => handleNavigate('mainMenu')} className="p-2 rounded-full text-[var(--text-muted-color)] hover:text-[var(--text-color)] hover:bg-gray-700/50" title="Quay Lại Menu">
                    <FaArrowLeft className="w-5 h-5" />
                </button>
            </div>
            
            <div className="flex-shrink-0 flex items-center gap-2 p-2 rounded-lg border mb-4 mx-4" style={{boxShadow: 'var(--shadow-pressed)', borderColor: 'var(--shadow-dark)'}}>
                 <TabButton id="data" activeTab={activeTab} onClick={setActiveTab} icon={FaDatabase} label="Dữ Liệu Thế Giới" />
                 <TabButton id="gm" activeTab={activeTab} onClick={setActiveTab} icon={FaComments} label="Trò chuyện GM" />
                 <TabButton id="prompts" activeTab={activeTab} onClick={setActiveTab} icon={FaLightbulb} label="Thư viện Prompt" />
            </div>

            <div className="flex-grow min-h-0 mx-4 mb-4 rounded-xl" style={{boxShadow: 'var(--shadow-raised)'}}>
                 {activeTab === 'data' && <div className="p-4 sm:p-6"><WorldDataTrainingPanel /></div>}
                 {activeTab === 'gm' && <GameMasterChatPanel userInput={gmUserInput} setUserInput={setGmUserInput} />}
                 {activeTab === 'prompts' && <PromptLibraryPanel onSelect={(prompt) => { setGmUserInput(prompt); setActiveTab('gm'); }} />}
            </div>
        </div>
    );
};

const TabButton: React.FC<{ id: ActiveTab, activeTab: ActiveTab, onClick: (id: ActiveTab) => void, icon: React.ElementType, label: string }> = ({ id, activeTab, onClick, icon: Icon, label }) => (
    <button
        onClick={() => onClick(id)}
        className={`flex-grow flex flex-col items-center justify-center p-2 text-[var(--text-muted-color)] rounded-lg transition-colors duration-200 hover:bg-[var(--shadow-light)]/50 hover:text-[var(--text-color)] ${activeTab === id ? 'bg-[var(--shadow-light)] text-[var(--text-color)]' : ''}`}
    >
        <Icon className="text-xl mb-1" />
        <span className="text-xs font-semibold text-center">{label}</span>
    </button>
);


export default memo(AiTrainingScreen);