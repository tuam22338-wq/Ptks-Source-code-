import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaArrowLeft, FaPlus, FaDownload, FaUserCircle, FaPaperPlane, FaTrash, FaCog, FaBars, FaTimes, FaBook, FaFileUpload, FaSync } from 'react-icons/fa';
import { GiSparkles } from 'react-icons/gi';
import { useAppContext } from '../../contexts/AppContext';
import { db } from '../../services/dbService';
import type { Novel, NovelContentEntry, GameSettings } from '../../types';
import { generateNovelChapter, extractLoreFromText } from '../../services/gemini/novel.service';
import LoadingSpinner from '../../components/LoadingSpinner';
import NovelistSettings from '../Settings/tabs/NovelistSettings';

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

const SettingsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    settings: GameSettings;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
}> = ({ isOpen, onClose, settings, handleSettingChange }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content max-w-2xl h-[80vh]">
                 <div className="p-4 border-b border-[var(--shadow-light)] flex justify-between items-center">
                    <h3 className="text-xl font-bold font-title text-[var(--primary-accent-color)]">Cài Đặt Tiểu Thuyết Gia AI</h3>
                    <button onClick={onClose} className="p-2 text-[var(--text-muted-color)] hover:text-[var(--text-color)] rounded-full">
                        <FaTimes/>
                    </button>
                </div>
                <div className="modal-body">
                    <NovelistSettings settings={settings} handleSettingChange={handleSettingChange} />
                </div>
            </div>
        </div>
    );
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


const NovelistScreen: React.FC = () => {
    const { state, handleNavigate, handleSettingChange } = useAppContext();
    const [activeNovel, setActiveNovel] = useState<Novel | null>(null);
    const [novels, setNovels] = useState<Novel[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isNewNovelModalOpen, setNewNovelModalOpen] = useState(false);
    const [isLeftSidebarOpen, setLeftSidebarOpen] = useState(true);
    const [isRightSidebarOpen, setRightSidebarOpen] = useState(true);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const [uploadedText, setUploadedText] = useState<string | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);

    const contentEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
    }, [activeNovel?.content?.length, isGenerating, activeNovel?.content?.[activeNovel.content.length-1]?.content.length]);

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

    const handleUpdateNovel = useCallback(async (updatedNovel: Novel | null) => {
        if (!updatedNovel) return;
        const novelWithTimestamp = { ...updatedNovel, lastModified: new Date().toISOString() };
        setActiveNovel(novelWithTimestamp);
        await db.novels.put(novelWithTimestamp);
    }, []);

    const handleSubmitPrompt = async () => {
        if (!userInput.trim() || isGenerating || !activeNovel) return;

        const userEntry: NovelContentEntry = { id: `prompt-${Date.now()}`, type: 'prompt', content: userInput, timestamp: new Date().toISOString() };
        const aiPlaceholder: NovelContentEntry = { id: `ai-${Date.now()}`, type: 'ai_generation', content: '', timestamp: new Date().toISOString() };

        const newContent = [...(activeNovel.content || []), userEntry, aiPlaceholder];
        await handleUpdateNovel({ ...activeNovel, content: newContent });
        setUserInput('');
        setIsGenerating(true);

        // This variable will be updated inside the functional state update
        // to hold the latest version of the novel state, preventing stale closures.
        let currentNovelState: Novel | null = activeNovel;

        try {
            const stream = generateNovelChapter(userInput, activeNovel.content, activeNovel.synopsis, activeNovel.lorebook, activeNovel.fanficMode, state.settings);

            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                setActiveNovel(prev => {
                    if (!prev) return null;
                    const updatedContent = [...prev.content];
                    const aiEntryIndex = updatedContent.findIndex(e => e.id === aiPlaceholder.id);
                    if (aiEntryIndex !== -1) {
                        updatedContent[aiEntryIndex] = { ...updatedContent[aiEntryIndex], content: fullResponse };
                    }
                    // Update our tracker variable with the newest state
                    currentNovelState = { ...prev, content: updatedContent };
                    return currentNovelState;
                });
            }
            
            // After streaming is complete, save the final, most up-to-date state.
            await handleUpdateNovel(currentNovelState);

        } catch (error: any) {
            console.error("Lỗi khi tạo chương mới:", error);
            const errorContent = `[Lỗi hệ thống: ${error.message}]`;
            
            // Use the last known good state from our tracker variable, or fall back to the stale closure
            const baseNovelForError = currentNovelState || activeNovel;
            const errorNovelState = {
                ...baseNovelForError,
                content: baseNovelForError.content.map(e => 
                    e.id === aiPlaceholder.id ? {...e, content: errorContent} : e
                ),
            };
            await handleUpdateNovel(errorNovelState);
        } finally {
            setIsGenerating(false);
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
        link.download = `${activeNovel.title.replace(/ /g, '_')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.name.endsWith('.txt')) {
            alert('Vui lòng chọn một file .txt');
            return;
        }
        setIsExtracting(true); // Show loading state
        const text = await file.text();
        setUploadedText(text);
        setIsExtracting(false); // Hide loading state
        alert('Đã tải tệp lên. Sẵn sàng để trích xuất vào Lorebook.');
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleExtractToLorebook = async () => {
        if (!uploadedText || !activeNovel) return;
        setIsExtracting(true);
        try {
            const extractedLore = await extractLoreFromText(uploadedText, state.settings);
            const updatedNovel = {
                ...activeNovel,
                lorebook: activeNovel.lorebook ? `${activeNovel.lorebook}\n\n---\n\n${extractedLore}` : extractedLore
            };
            await handleUpdateNovel(updatedNovel);
            setUploadedText(null);
        } catch (error) {
            alert('Lỗi khi trích xuất Lorebook.');
            console.error(error);
        } finally {
            setIsExtracting(false);
        }
    };


    return (
        <div className="w-full animate-fade-in flex flex-col h-full min-h-0">
            <NewNovelModal isOpen={isNewNovelModalOpen} onClose={() => setNewNovelModalOpen(false)} onCreate={handleCreateNovel} />
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} settings={state.settings} handleSettingChange={handleSettingChange} />

            <div className="flex-shrink-0 flex justify-between items-center p-3 border-b border-[var(--shadow-light)]">
                <button onClick={() => handleNavigate('mainMenu')} className="p-2 rounded-full hover:bg-[var(--shadow-light)] text-[var(--text-muted-color)]" title="Quay Lại Menu">
                    <FaArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold font-title text-[var(--primary-accent-color)]">Tiểu Thuyết Gia AI</h2>
                <button onClick={() => setLeftSidebarOpen(!isLeftSidebarOpen)} className="p-2 rounded-full hover:bg-[var(--shadow-light)] text-[var(--text-muted-color)] md:hidden" title="Mở danh sách">
                    <FaBars />
                </button>
            </div>

            <div className="flex flex-grow min-h-0">
                {/* Left Sidebar - Novel List */}
                <div className={`fixed md:relative top-0 left-0 h-full z-20 md:z-auto bg-[var(--bg-color)] w-64 md:w-72 flex-shrink-0 border-r border-[var(--shadow-light)] flex flex-col transition-transform duration-300 ${isLeftSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                    <div className="flex justify-between items-center p-3 border-b border-[var(--shadow-light)]">
                        <h3 className="text-lg font-bold font-title text-[var(--primary-accent-color)]">Tiểu Thuyết</h3>
                        <button onClick={() => setLeftSidebarOpen(false)} className="p-2 text-[var(--text-muted-color)] hover:text-[var(--text-color)] md:hidden">
                            <FaTimes />
                        </button>
                    </div>
                     <div className="p-3"><button onClick={() => setNewNovelModalOpen(true)} className="btn btn-primary w-full"><FaPlus /> Tiểu Thuyết Mới</button></div>
                    <div className="flex-grow overflow-y-auto">
                        {novels.map(novel => (
                            <button key={novel.id} onClick={() => handleSelectNovel(novel)} className={`w-full text-left p-3 text-sm flex justify-between items-start transition-colors group ${activeNovel?.id === novel.id ? 'bg-[var(--primary-accent-color)]/10 text-[var(--primary-accent-color)]' : 'hover:bg-[var(--shadow-light)]'}`}>
                                <span className="font-semibold truncate">{novel.title}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteNovel(novel.id); }} className="p-1 text-[var(--text-muted-color)] hover:text-red-400 opacity-0 group-hover:opacity-100"><FaTrash /></button>
                            </button>
                        ))}
                    </div>
                </div>
                {isLeftSidebarOpen && <div className="fixed inset-0 z-10 bg-black/50 md:hidden" onClick={() => setLeftSidebarOpen(false)}></div>}


                {/* Main Content - Chat */}
                <div className="flex-grow flex flex-col min-w-0">
                    {activeNovel ? (
                        <>
                            <div className="flex-shrink-0 p-3 border-b border-[var(--shadow-light)] flex justify-between items-center">
                                <h3 className="text-xl font-bold text-[var(--text-color)]">{activeNovel.title}</h3>
                                <div className="flex items-center gap-2">
                                    <button onClick={handleDownload} className="p-2 text-[var(--text-muted-color)] hover:text-[var(--text-color)]" title="Tải xuống"><FaDownload /></button>
                                    <button onClick={() => setSettingsModalOpen(true)} className="p-2 text-[var(--text-muted-color)] hover:text-[var(--text-color)]" title="Cài đặt"><FaCog /></button>
                                    <button onClick={() => setRightSidebarOpen(!isRightSidebarOpen)} className="p-2 text-[var(--text-muted-color)] hover:text-[var(--text-color)]" title="Lorebook"><FaBook /></button>
                                </div>
                            </div>
                            <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 md:p-6 min-h-0">
                                <div className="max-w-4xl mx-auto space-y-6">
                                    {activeNovel.content.map(entry => (
                                        <div key={entry.id}>
                                            {entry.type === 'prompt' ? (
                                                <div className="flex gap-4 justify-end"><div className="player-bubble flex items-center gap-2"><FaUserCircle className="text-2xl text-[var(--text-muted-color)] flex-shrink-0"/><p className="text-[var(--text-color)]">{entry.content}</p></div></div>
                                            ) : (
                                                <div className="flex gap-4"><div className="npc-bubble w-full"><div className="prose prose-invert max-w-none prose-p:text-[var(--text-color)] prose-strong:text-[var(--primary-accent-color)]" dangerouslySetInnerHTML={parseContent(entry.content)} /></div></div>
                                            )}
                                        </div>
                                    ))}
                                    {isGenerating && activeNovel.content.length > 0 && activeNovel.content[activeNovel.content.length - 1].type === 'ai_generation' && (
                                        <div className="flex justify-start ml-4"><LoadingSpinner size="sm"/></div>
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
                    <>
                        <div className={`fixed md:relative top-0 right-0 h-full z-20 md:z-auto bg-[var(--bg-color)] w-72 md:w-80 flex-shrink-0 border-l border-[var(--shadow-light)] flex flex-col transition-transform duration-300 ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0`}>
                            <div className="flex justify-between items-center p-3 border-b border-[var(--shadow-light)]">
                                <h3 className="text-lg font-bold font-title text-[var(--primary-accent-color)] flex items-center gap-2"><FaBook /> Lorebook</h3>
                                <button onClick={() => setRightSidebarOpen(false)} className="p-2 text-[var(--text-muted-color)] hover:text-[var(--text-color)] md:hidden">
                                    <FaTimes />
                                </button>
                            </div>
                            <div className="p-3 flex-grow flex flex-col min-h-0">
                                <textarea
                                    value={activeNovel.lorebook}
                                    onChange={e => handleUpdateNovel({ ...activeNovel, lorebook: e.target.value })}
                                    placeholder="Lưu trữ thông tin quan trọng về nhân vật, địa điểm, cốt truyện... AI sẽ luôn tham khảo thông tin này."
                                    className="input-neumorphic w-full flex-grow resize-y"
                                />
                            </div>
                            <div className="p-3 border-t border-[var(--shadow-light)] space-y-3">
                                <label className="flex items-center justify-between cursor-pointer">
                                    <span className="text-sm font-semibold">Chế độ Đồng Nhân</span>
                                    <input type="checkbox" checked={activeNovel.fanficMode} onChange={e => handleUpdateNovel({...activeNovel, fanficMode: e.target.checked})} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2"/>
                                </label>
                                <input type="file" accept=".txt" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                                <button onClick={() => fileInputRef.current?.click()} disabled={isExtracting} className="btn btn-neumorphic w-full !text-sm"><FaFileUpload /> Tải lên .txt</button>
                                <button onClick={handleExtractToLorebook} disabled={!uploadedText || isExtracting} className="btn btn-primary w-full !text-sm">
                                    {isExtracting ? <LoadingSpinner size="sm" /> : <><FaSync /> Trích xuất vào Lorebook</>}
                                </button>
                            </div>
                        </div>
                        {isRightSidebarOpen && <div className="fixed inset-0 z-10 bg-black/50 md:hidden" onClick={() => setRightSidebarOpen(false)}></div>}
                    </>
                )}
            </div>
        </div>
    );
};

export default NovelistScreen;