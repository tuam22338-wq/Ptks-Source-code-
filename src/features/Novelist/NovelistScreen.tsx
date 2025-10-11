import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaArrowLeft, FaPlus, FaDownload, FaUserCircle, FaPaperPlane, FaTrash, FaCog, FaBars, FaTimes, FaBook, FaFileUpload, FaSync } from 'react-icons/fa';
import { GiSparkles } from 'react-icons/gi';
// FIX: Fix import path for `useAppContext` to point to the correct module.
import { useAppContext } from '../../contexts/useAppContext';
import { db } from '../../services/dbService';
import type { Novel, NovelContentEntry, GameSettings, NarrativeStyle, AIModel, NovelAiSettings } from '../../types';
import { generateNovelChapter, extractLoreFromText } from '../../services/gemini/novel.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import { AI_MODELS, NARRATIVE_STYLES } from '../../constants';


// Simple Markdown-like parser
const parseContent = (text: string) => {
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
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

const NewNovelModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: { title: string; synopsis: string }) => void;
}> = ({ isOpen, onClose, onCreate }) => {
    const [newNovelData, setNewNovelData] = useState({ title: '', synopsis: '' });

    if (!isOpen) return null;

    const handleCreate = () => {
        if (!newNovelData.title.trim()) {
            alert('Tiêu đề không được để trống.');
            return;
        }
        onCreate(newNovelData);
        setNewNovelData({ title: '', synopsis: '' });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content max-w-lg">
                <div className="modal-body">
                    <h3 className="text-xl font-bold mb-4 font-title text-[var(--primary-accent-color)]">Tạo Tiểu Thuyết Mới</h3>
                    <div className="space-y-4">
                        <input value={newNovelData.title} onChange={e => setNewNovelData({...newNovelData, title: e.target.value})} placeholder="Tiêu đề tiểu thuyết..." className="input-neumorphic w-full" />
                        <textarea value={newNovelData.synopsis} onChange={e => setNewNovelData({...newNovelData, synopsis: e.target.value})} rows={4} placeholder="Tóm tắt, ý tưởng chính, hoặc prompt khởi đầu..." className="input-neumorphic w-full resize-y"/>
                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="btn btn-neumorphic">Hủy</button>
                    <button onClick={handleCreate} className="btn btn-primary">Tạo</button>
                </div>
            </div>
        </div>
    );
};

const RightSidebar: React.FC<{
    activeNovel: Novel;
    onUpdate: (updatedNovel: Novel) => void;
    onDownload: () => void;
    globalSettings: GameSettings;
}> = ({ activeNovel, onUpdate, onDownload, globalSettings }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadedText, setUploadedText] = useState<string | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);

    const handleFieldChange = (field: keyof Novel, value: any) => {
        onUpdate({ ...activeNovel, [field]: value });
    };

    const handleSettingChange = (field: keyof NovelAiSettings, value: any) => {
        const updatedSettings: NovelAiSettings = {
            ...(activeNovel.aiSettings || {}),
            [field]: value,
        };
        onUpdate({ ...activeNovel, aiSettings: updatedSettings });
    };
    
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.name.endsWith('.txt')) {
            alert('Vui lòng chọn một file .txt');
            return;
        }
        setIsExtracting(true);
        const text = await file.text();
        setUploadedText(text);
        setIsExtracting(false);
        alert('Đã tải tệp lên. Sẵn sàng để trích xuất vào Lorebook.');
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleExtractToLorebook = async () => {
        if (!uploadedText) return;
        setIsExtracting(true);
        try {
            const extractedLore = await extractLoreFromText(uploadedText, globalSettings);
            handleFieldChange('lorebook', activeNovel.lorebook ? `${activeNovel.lorebook}\n\n---\n\n${extractedLore}` : extractedLore);
            setUploadedText(null);
        } catch (error) {
            alert('Lỗi khi trích xuất Lorebook.');
            console.error(error);
        } finally {
            setIsExtracting(false);
        }
    };
    
    const effectiveSettings = {
        model: activeNovel.aiSettings?.model || globalSettings.novelistModel,
        narrativeStyle: activeNovel.aiSettings?.narrativeStyle || globalSettings.novelistNarrativeStyle,
        wordCount: activeNovel.aiSettings?.wordCount ?? globalSettings.novelistWordCount,
        temperature: activeNovel.aiSettings?.temperature ?? globalSettings.novelistTemperature,
        topK: activeNovel.aiSettings?.topK ?? globalSettings.novelistTopK,
        topP: activeNovel.aiSettings?.topP ?? globalSettings.novelistTopP,
        enableThinking: activeNovel.aiSettings?.enableThinking ?? globalSettings.novelistEnableThinking,
        thinkingBudget: activeNovel.aiSettings?.thinkingBudget ?? globalSettings.novelistThinkingBudget,
    };
    const novelistModels = AI_MODELS.filter(m => m.value === 'gemini-2.5-flash' || m.value === 'gemini-2.5-pro');

    return (
        <div className="p-3 flex-grow flex flex-col min-h-0 space-y-3">
            <h3 className="text-lg font-bold font-title text-[var(--primary-accent-color)] flex items-center gap-2"><FaBook /> Lõi Trí Nhớ & Bảng Điều Khiển</h3>
            
            {/* Synopsis */}
            <div>
                <label className="text-sm font-semibold text-[var(--text-color)]">Tóm tắt (Synopsis)</label>
                <textarea value={activeNovel.synopsis} onChange={e => handleFieldChange('synopsis', e.target.value)} rows={4} className="input-neumorphic w-full text-sm mt-1" placeholder="Định hướng chính của câu chuyện..."/>
            </div>

            {/* Lorebook */}
            <div className="flex-grow flex flex-col min-h-0">
                <label className="text-sm font-semibold text-[var(--text-color)]">Sổ tay (Lorebook)</label>
                <textarea value={activeNovel.lorebook} onChange={e => handleFieldChange('lorebook', e.target.value)} className="input-neumorphic w-full text-sm mt-1 flex-grow resize-y" placeholder="Quy tắc, nhân vật, địa điểm..."/>
                <div className="flex gap-2 mt-2">
                    <input type="file" accept=".txt" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} disabled={isExtracting} className="btn btn-neumorphic !text-xs flex-1"><FaFileUpload /> Tải lên .txt</button>
                    <button onClick={handleExtractToLorebook} disabled={!uploadedText || isExtracting} className="btn btn-primary !text-xs flex-1">
                        {isExtracting ? <LoadingSpinner size="sm" /> : <><FaSync /> Trích xuất</>}
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div className="space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-semibold text-[var(--text-color)]">Chế độ Đồng nhân (Fanfic)</span>
                    <input type="checkbox" checked={activeNovel.fanficMode} onChange={e => handleFieldChange('fanficMode', e.target.checked)} className="w-5 h-5 text-amber-500 rounded focus:ring-amber-600"/>
                </label>
                <button onClick={onDownload} className="btn btn-neumorphic w-full !text-sm"><FaDownload /> Tải Toàn Bộ Tiểu Thuyết</button>
            </div>

             {/* AI Settings */}
            <div className="p-3 bg-black/20 rounded-lg border border-gray-700/60 space-y-3">
                <h4 className="font-bold text-center text-amber-300">Cài Đặt AI (Riêng)</h4>
                <div>
                     <label className="text-xs text-gray-400">Model Sáng Tác</label>
                     <select value={effectiveSettings.model} onChange={e => handleSettingChange('model', e.target.value as AIModel)} className="input-neumorphic w-full !py-1 text-sm">
                        {novelistModels.map(model => (
                            <option key={model.value} value={model.value} disabled={model.value.includes('pro') && !globalSettings.isPremium}>
                                {model.label} {model.value.includes('pro') ? '👑' : ''}
                            </option>
                        ))}
                    </select>
                </div>
                 <div>
                     <label className="text-xs text-gray-400">Văn Phong Tường Thuật</label>
                     <select value={effectiveSettings.narrativeStyle} onChange={e => handleSettingChange('narrativeStyle', e.target.value as NarrativeStyle)} className="input-neumorphic w-full !py-1 text-sm">
                        {NARRATIVE_STYLES.map(style => <option key={style.value} value={style.value}>{style.label}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs text-gray-400">Độ dài Chương (~{effectiveSettings.wordCount} từ)</label>
                    <input type="range" min="100" max="7000" step="100" value={effectiveSettings.wordCount} onChange={e => handleSettingChange('wordCount', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-1" />
                </div>
            </div>
        </div>
    );
};


const NovelistScreen: React.FC = () => {
    const { state, handleNavigate } = useAppContext();
    const [activeNovel, setActiveNovel] = useState<Novel | null>(null);
    const [novels, setNovels] = useState<Novel[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isNewNovelModalOpen, setNewNovelModalOpen] = useState(false);
    const [isLeftSidebarOpen, setLeftSidebarOpen] = useState(window.innerWidth >= 768);
    const [isRightSidebarOpen, setRightSidebarOpen] = useState(window.innerWidth >= 768);

    const contentEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const updateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


    const loadNovels = useCallback(async () => {
        const allNovels = await db.novels.orderBy('lastModified').reverse().toArray();
        setNovels(allNovels);
    }, []);

    useEffect(() => {
        loadNovels();
    }, [loadNovels]);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (container) {
            const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 200;
            if (isScrolledToBottom) {
                contentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [activeNovel?.content, isGenerating]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [userInput]);

    const handleSelectNovel = (novel: Novel) => {
        setActiveNovel(novel);
        if (window.innerWidth < 768) {
            setLeftSidebarOpen(false);
        }
    };

    const handleCreateNovel = async (data: { title: string; synopsis: string }) => {
        const newNovel: Novel = {
            id: Date.now(),
            title: data.title,
            synopsis: data.synopsis,
            content: [],
            lastModified: new Date().toISOString(),
            lorebook: '',
            fanficMode: false,
        };
        await db.novels.add(newNovel);
        await loadNovels();
        setActiveNovel(newNovel);
        setNewNovelModalOpen(false);
    };

    const handleDebouncedUpdate = (updatedNovel: Novel) => {
        setActiveNovel(updatedNovel); // Update UI instantly
    
        if (updateTimeoutRef.current) {
            clearTimeout(updateTimeoutRef.current);
        }
    
        updateTimeoutRef.current = setTimeout(async () => {
            const novelToSave = { ...updatedNovel, lastModified: new Date().toISOString() };
            await db.novels.put(novelToSave);
            // Update the list to show the new "last modified" time
            const allNovels = await db.novels.orderBy('lastModified').reverse().toArray();
            setNovels(allNovels);
        }, 1500); // 1.5-second debounce
    };

    const handleSubmitPrompt = async () => {
        if (!userInput.trim() || isGenerating || !activeNovel) return;
        
        const userEntry: NovelContentEntry = { id: `prompt-${Date.now()}`, type: 'prompt', content: userInput, timestamp: new Date().toISOString() };
        const aiPlaceholder: NovelContentEntry = { id: `ai-${Date.now()}`, type: 'ai_generation', content: '', timestamp: new Date().toISOString() };

        let updatedNovel = { ...activeNovel, content: [...(activeNovel.content || []), userEntry, aiPlaceholder] };
        setActiveNovel(updatedNovel);
        await db.novels.put({ ...updatedNovel, lastModified: new Date().toISOString() });
        setUserInput('');
        setIsGenerating(true);

        try {
            const finalSettings: GameSettings = {
                ...state.settings,
                novelistModel: activeNovel.aiSettings?.model || state.settings.novelistModel,
                novelistNarrativeStyle: activeNovel.aiSettings?.narrativeStyle || state.settings.novelistNarrativeStyle,
                novelistWordCount: activeNovel.aiSettings?.wordCount ?? state.settings.novelistWordCount,
                novelistTemperature: activeNovel.aiSettings?.temperature ?? state.settings.novelistTemperature,
                novelistTopK: activeNovel.aiSettings?.topK ?? state.settings.novelistTopK,
                novelistTopP: activeNovel.aiSettings?.topP ?? state.settings.novelistTopP,
                novelistEnableThinking: activeNovel.aiSettings?.enableThinking ?? state.settings.novelistEnableThinking,
                novelistThinkingBudget: activeNovel.aiSettings?.thinkingBudget ?? state.settings.novelistThinkingBudget,
            };

            const stream = generateNovelChapter(userInput, updatedNovel.content, updatedNovel.synopsis, updatedNovel.lorebook, updatedNovel.fanficMode, finalSettings);

            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setActiveNovel(prev => {
                    if (!prev) return null;
                    const updatedContent = [...prev.content];
                    const aiEntryIndex = updatedContent.findIndex(e => e.id === aiPlaceholder.id);
                    if (aiEntryIndex !== -1) {
                        updatedContent[aiEntryIndex].content = fullResponse;
                    }
                    return { ...prev, content: updatedContent };
                });
            }
            
            const finalNovelState = { ...updatedNovel, content: updatedNovel.content.map(e => e.id === aiPlaceholder.id ? {...e, content: fullResponse} : e) };
            await db.novels.put({ ...finalNovelState, lastModified: new Date().toISOString() });

        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error("Lỗi khi tạo chương mới:", error);
            const errorContent = `[Lỗi hệ thống: ${message}]`;
            const finalNovelState = { ...updatedNovel, content: updatedNovel.content.map(e => e.id === aiPlaceholder.id ? {...e, content: errorContent} : e) };
            await db.novels.put({ ...finalNovelState, lastModified: new Date().toISOString() });
        } finally {
            setIsGenerating(false);
            await loadNovels();
        }
    };

    const handleDeleteNovel = async (id: number) => {
        if (window.confirm("Bạn có chắc muốn xóa vĩnh viễn tiểu thuyết này?")) {
            await db.novels.delete(id);
            if (activeNovel?.id === id) setActiveNovel(null);
            await loadNovels();
        }
    };
    
    const handleDownload = () => {
        if (!activeNovel) return;
        const textContent = activeNovel.content.map(entry => entry.type === 'prompt' ? `\n\n>>> ${entry.content}\n\n` : entry.content).join('');
        const blob = new Blob([`# ${activeNovel.title}\n\n**Tóm tắt:** ${activeNovel.synopsis}\n\n**Lorebook:**\n${activeNovel.lorebook}\n\n---\n\n${textContent}`], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeNovel.title.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };


    return (
        <div className="w-full animate-fade-in flex flex-col h-full min-h-0">
            <NewNovelModal isOpen={isNewNovelModalOpen} onClose={() => setNewNovelModalOpen(false)} onCreate={handleCreateNovel} />

            {/* Backdrop for mobile sidebars */}
            {(isLeftSidebarOpen || isRightSidebarOpen) && (
                <div 
                    className="fixed inset-0 bg-black/50 z-10 md:hidden"
                    onClick={() => {
                        setLeftSidebarOpen(false);
                        setRightSidebarOpen(false);
                    }}
                />
            )}

            <div className="flex-shrink-0 flex justify-between items-center p-3 border-b border-[var(--shadow-light)]">
                <button onClick={() => setLeftSidebarOpen(!isLeftSidebarOpen)} className="p-2 rounded-full hover:bg-[var(--shadow-light)] text-[var(--text-muted-color)] md:hidden" title="Mở danh sách">
                    <FaBars />
                </button>
                 <button onClick={() => handleNavigate('mainMenu')} className="p-2 rounded-full hover:bg-[var(--shadow-light)] text-[var(--text-muted-color)] hidden md:block" title="Quay Lại Menu">
                    <FaArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold font-title text-[var(--primary-accent-color)]">Tiểu Thuyết Gia AI</h2>
                 <div className="w-9 h-9"></div> {/* Spacer to balance title */}
            </div>

            <div className="flex flex-grow min-h-0">
                {/* Left Sidebar - Novel List */}
                <div className={`fixed md:relative top-0 left-0 h-full z-20 md:z-auto bg-[var(--bg-color)] w-64 md:w-72 flex-shrink-0 border-r border-[var(--shadow-light)] flex flex-col transition-transform duration-300 ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                    <div className="p-3 border-b border-[var(--shadow-light)] flex justify-between items-center">
                        <h3 className="font-bold text-lg">Tiểu Thuyết</h3>
                        <button onClick={() => setLeftSidebarOpen(false)} className="p-2 md:hidden">
                            <FaTimes />
                        </button>
                    </div>
                    <div className="p-3"><button onClick={() => setNewNovelModalOpen(true)} className="btn btn-primary w-full"><FaPlus /> Tiểu Thuyết Mới</button></div>
                    <div className="flex-grow overflow-y-auto">
                        {novels.map(novel => (
                            <button key={novel.id} onClick={() => handleSelectNovel(novel)} className={`w-full text-left p-3 text-sm flex justify-between items-start transition-colors group ${activeNovel?.id === novel.id ? 'bg-[var(--primary-accent-color)]/10 text-[var(--primary-accent-color)]' : 'hover:bg-[var(--shadow-light)]'}`}>
                                <div>
                                    <span className="font-semibold truncate block">{novel.title}</span>
                                    <span className="text-xs text-gray-500">{new Date(novel.lastModified).toLocaleString('vi-VN')}</span>
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteNovel(novel.id); }} className="p-1 text-[var(--text-muted-color)] hover:text-red-400 opacity-0 group-hover:opacity-100 flex-shrink-0"><FaTrash /></button>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content - Chat */}
                <div className="flex-grow flex flex-col min-w-0">
                    {activeNovel ? (
                        <>
                            <div className="flex-shrink-0 p-3 border-b border-[var(--shadow-light)] flex justify-between items-center">
                                <h3 className="text-xl font-bold text-[var(--text-color)] truncate">{activeNovel.title}</h3>
                                <button onClick={() => setRightSidebarOpen(!isRightSidebarOpen)} className="p-2 text-[var(--text-muted-color)] hover:text-[var(--text-color)] md:hidden" title="Lõi Trí Nhớ"><FaBook /></button>
                            </div>
                            <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 md:p-6 min-h-0">
                                <div className="max-w-4xl mx-auto space-y-6">
                                    {activeNovel.content.map(entry => (
                                        <div key={entry.id}>
                                            {entry.type === 'prompt' ? (
                                                <div className="flex gap-4 justify-end ml-10">
                                                    <div className="p-3 rounded-lg max-w-xl bg-blue-900/40">
                                                        <p className="text-[var(--text-color)] whitespace-pre-wrap">{entry.content}</p>
                                                    </div>
                                                    <FaUserCircle className="text-3xl text-[var(--text-muted-color)] flex-shrink-0"/>
                                                </div>
                                            ) : (
                                                <div className="flex gap-4 mr-10">
                                                    <GiSparkles className="text-3xl text-[var(--primary-accent-color)] flex-shrink-0"/>
                                                    <div className="p-3 rounded-lg max-w-xl bg-black/20">
                                                        <div className="prose prose-invert max-w-none prose-p:text-[var(--text-color)] prose-strong:text-[var(--primary-accent-color)]" dangerouslySetInnerHTML={parseContent(entry.content)} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isGenerating && activeNovel.content.length > 0 && activeNovel.content[activeNovel.content.length - 1].type === 'ai_generation' && (
                                        <div className="flex justify-start ml-12"><LoadingSpinner size="sm"/></div>
                                    )}
                                    <div ref={contentEndRef}/>
                                </div>
                            </div>
                            <div className="flex-shrink-0 p-3 md:p-4 border-t border-[var(--shadow-light)]">
                                <div className="max-w-4xl mx-auto">
                                    <div className="flex items-end gap-2 p-2 rounded-lg" style={{boxShadow: 'var(--shadow-pressed)'}}>
                                        <textarea ref={textareaRef} value={userInput} onChange={e => setUserInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitPrompt(); } }} disabled={isGenerating} placeholder="Viết prompt... (Shift+Enter để xuống dòng)" rows={1} className="input-neumorphic !shadow-none !bg-transparent flex-grow resize-none"/>
                                        <button onClick={handleSubmitPrompt} disabled={isGenerating || !userInput.trim()} className="btn btn-primary !rounded-full !p-3 h-12 w-12"><FaPaperPlane /></button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center p-8"><h3 className="text-2xl font-bold text-[var(--text-muted-color)]">Chọn hoặc tạo một tiểu thuyết</h3><p className="text-[var(--text-muted-color)]/70 mt-2">Bắt đầu hành trình sáng tác của bạn.</p></div>
                    )}
                </div>

                {/* Right Sidebar - Lorebook */}
                {activeNovel && (
                    <div className={`fixed md:relative top-0 right-0 h-full z-20 md:z-auto bg-[var(--bg-color)] w-72 md:w-80 flex-shrink-0 border-l border-[var(--shadow-light)] flex flex-col transition-transform duration-300 ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0`}>
                        <div className="p-3 border-b border-[var(--shadow-light)] flex justify-end items-center md:hidden">
                             <button onClick={() => setRightSidebarOpen(false)} className="p-2">
                                <FaTimes />
                            </button>
                        </div>
                        <RightSidebar 
                            activeNovel={activeNovel} 
                            onUpdate={handleDebouncedUpdate}
                            onDownload={handleDownload}
                            globalSettings={state.settings}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default NovelistScreen;