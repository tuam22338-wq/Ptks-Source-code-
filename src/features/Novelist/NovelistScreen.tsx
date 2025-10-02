import React, { useState, useEffect, useRef } from 'react';
// FIX: Add FaTimes to the import list to resolve missing component error.
import { FaArrowLeft, FaPlus, FaDownload, FaUserCircle, FaPaperPlane, FaTrash, FaCog, FaBars, FaTimes } from 'react-icons/fa';
import { GiSparkles } from 'react-icons/gi';
import { useAppContext } from '../../contexts/AppContext';
import { db } from '../../services/dbService';
import type { Novel, NovelContentEntry, GameSettings } from '../../types';
import { generateNovelChapter } from '../../services/gemini/novel.service';
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

    // Bold: **text**
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italics: *text*
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Headings: #, ##, ###
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    // Unordered lists: - item
    html = html.replace(/^\s*-\s(.*)/gim, '<li>$1</li>');
    html = html.replace(/<\/li>\s*<br \/>\s*<li>/g, '</li><li>'); // Join list items
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');
    // Newlines
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
                    <h3 className="text-xl font-bold text-amber-300">Cài Đặt Tiểu Thuyết Gia AI</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-full">
                        <FaTimes/>
                    </button>
                </div>
                <div className="p-4 overflow-y-auto">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
            <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg m-4 p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-4 text-amber-300">Tạo Tiểu Thuyết Mới</h3>
                <div className="space-y-4">
                    <input value={newNovelData.title} onChange={e => setNewNovelData({...newNovelData, title: e.target.value})} placeholder="Tiêu đề tiểu thuyết..." className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" />
                    <textarea value={newNovelData.synopsis} onChange={e => setNewNovelData({...newNovelData, synopsis: e.target.value})} rows={4} placeholder="Tóm tắt, ý tưởng chính, hoặc prompt khởi đầu..." className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 resize-y"/>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Hủy</button>
                    <button onClick={handleCreate} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500">Tạo</button>
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
    const contentEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadNovels = async () => {
            const allNovels = await db.novels.orderBy('lastModified').reverse().toArray();
            setNovels(allNovels);
        };
        loadNovels();
    }, []);

    useEffect(() => {
        const container = chatContainerRef.current;
        if (container) {
            const isScrolledToBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 150;
            if (isScrolledToBottom) {
                contentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [activeNovel?.content]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [userInput]);

    const handleSelectNovel = (novel: Novel) => {
        setActiveNovel(novel);
    };

    const handleCreateNovel = async (data: { title: string; synopsis: string }) => {
        const newNovel: Novel = {
            id: Date.now(),
            title: data.title,
            synopsis: data.synopsis,
            content: [],
            lastModified: new Date().toISOString(),
        };
        
        await db.novels.add(newNovel);
        const allNovels = await db.novels.orderBy('lastModified').reverse().toArray();
        setNovels(allNovels);
        setActiveNovel(newNovel);
        setNewNovelModalOpen(false);
    };

    const handleUpdateNovelContent = async (updatedContent: NovelContentEntry[]) => {
        if (!activeNovel) return;
        const updatedNovel = {
            ...activeNovel,
            content: updatedContent,
            lastModified: new Date().toISOString(),
        };
        setActiveNovel(updatedNovel);
        await db.novels.put(updatedNovel);
    };

    // FIX: Completed the implementation of handleSubmitPrompt to resolve a syntax error causing the module export to fail.
    const handleSubmitPrompt = async () => {
        if (!userInput.trim() || isGenerating || !activeNovel) return;
        
        const userEntry: NovelContentEntry = {
            id: `prompt-${Date.now()}`,
            type: 'prompt',
            content: userInput,
            timestamp: new Date().toISOString(),
        };

        const aiPlaceholder: NovelContentEntry = {
            id: `ai-${Date.now()}`,
            type: 'ai_generation',
            content: '', // Placeholder for streaming
            timestamp: new Date().toISOString(),
        };

        const newContent = [...(activeNovel.content || []), userEntry, aiPlaceholder];
        await handleUpdateNovelContent(newContent);
        setUserInput('');
        setIsGenerating(true);

        try {
            const stream = generateNovelChapter(
                userInput,
                activeNovel.content,
                activeNovel.synopsis,
                state.settings
            );

            let fullResponse = '';
            for await (const chunk of stream) {
                fullResponse += chunk;
                // Update the placeholder in real-time
                const updatedContent = newContent.map(entry => 
                    entry.id === aiPlaceholder.id ? { ...entry, content: fullResponse } : entry
                );
                // This updates state frequently, might need optimization later, but for now it works
                setActiveNovel(prev => prev ? { ...prev, content: updatedContent } : null);
            }
            
            // Final update to DB after streaming is complete
            const finalContent = newContent.map(entry => 
                entry.id === aiPlaceholder.id ? { ...entry, content: fullResponse } : entry
            );
            await handleUpdateNovelContent(finalContent);

        } catch (error: any) {
            console.error("Lỗi khi tạo chương mới:", error);
            const errorEntry: NovelContentEntry = {
                id: `error-${Date.now()}`,
                type: 'ai_generation',
                content: `[Lỗi hệ thống: ${error.message}]`,
                timestamp: new Date().toISOString(),
            };
            const finalContent = [...newContent.slice(0, -1), errorEntry];
            await handleUpdateNovelContent(finalContent);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDeleteNovel = async (id: number) => {
        if (window.confirm("Bạn có chắc muốn xóa vĩnh viễn tiểu thuyết này?")) {
            // FIX: Corrected the call to delete a novel from `db.deleteNovel` to `db.novels.delete` to match Dexie's Table API.
            await db.novels.delete(id);
            if (activeNovel?.id === id) {
                setActiveNovel(null);
            }
            const allNovels = await db.novels.orderBy('lastModified').reverse().toArray();
            setNovels(allNovels);
        }
    };
    
    const handleDownload = () => {
        if (!activeNovel) return;
        const textContent = activeNovel.content.map(entry => {
            if (entry.type === 'prompt') {
                return `\n\n>>> ${entry.content}\n\n`;
            }
            return entry.content;
        }).join('');
        
        const blob = new Blob([`# ${activeNovel.title}\n\n**Tóm tắt:** ${activeNovel.synopsis}\n\n---\n\n${textContent}`], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeNovel.title.replace(/ /g, '_')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full animate-fade-in flex flex-col h-full min-h-0 bg-stone-900 text-gray-200 novelist-theme">
            <NewNovelModal isOpen={isNewNovelModalOpen} onClose={() => setNewNovelModalOpen(false)} onCreate={handleCreateNovel} />
            <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setSettingsModalOpen(false)} settings={state.settings} handleSettingChange={handleSettingChange} />

            <div className="flex-shrink-0 flex justify-between items-center p-3 border-b border-gray-700/60 bg-stone-800/50">
                <button onClick={() => handleNavigate('mainMenu')} className="p-2 rounded-full hover:bg-gray-700/50 text-gray-400" title="Quay Lại Menu">
                    <FaArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold font-title text-amber-300">Tiểu Thuyết Gia AI</h2>
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded-full hover:bg-gray-700/50 text-gray-400 md:hidden" title="Mở danh sách">
                    <FaBars />
                </button>
            </div>

            <div className="flex flex-grow min-h-0">
                {/* Sidebar */}
                <div className={`fixed md:relative top-0 left-0 h-full z-20 md:z-auto bg-stone-900/95 md:bg-stone-800/50 w-64 md:w-72 flex-shrink-0 border-r border-gray-700/60 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                     <div className="p-3">
                        <button onClick={() => setNewNovelModalOpen(true)} className="w-full px-4 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 flex items-center justify-center gap-2">
                            <FaPlus /> Tiểu Thuyết Mới
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {novels.map(novel => (
                            <button 
                                key={novel.id} 
                                onClick={() => handleSelectNovel(novel)}
                                className={`w-full text-left p-3 text-sm flex justify-between items-start transition-colors group ${activeNovel?.id === novel.id ? 'bg-amber-500/10 text-amber-200' : 'hover:bg-gray-700/50'}`}
                            >
                                <span className="font-semibold truncate">{novel.title}</span>
                                 <button onClick={(e) => { e.stopPropagation(); handleDeleteNovel(novel.id); }} className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100"><FaTrash /></button>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow flex flex-col min-w-0">
                    {activeNovel ? (
                        <>
                            <div className="flex-shrink-0 p-3 border-b border-gray-700/60 flex justify-between items-center">
                                <h3 className="text-xl font-bold text-gray-200">{activeNovel.title}</h3>
                                <div className="flex items-center gap-2">
                                    <button onClick={handleDownload} className="p-2 text-gray-400 hover:text-white" title="Tải xuống"><FaDownload /></button>
                                    <button onClick={() => setSettingsModalOpen(true)} className="p-2 text-gray-400 hover:text-white" title="Cài đặt"><FaCog /></button>
                                </div>
                            </div>

                            <div ref={chatContainerRef} className="flex-grow overflow-y-auto p-4 md:p-6 min-h-0">
                                <div className="max-w-4xl mx-auto">
                                    {activeNovel.content.map(entry => (
                                        <div key={entry.id} className="message-container py-4">
                                            {entry.type === 'prompt' ? (
                                                <div className="flex gap-4">
                                                    <FaUserCircle className="text-3xl text-gray-500 flex-shrink-0"/>
                                                    <p className="pt-1">{entry.content}</p>
                                                </div>
                                            ) : (
                                                <div className="flex gap-4">
                                                     <div className="w-8 h-8 rounded-full bg-amber-500/80 flex items-center justify-center flex-shrink-0 p-1.5"><GiSparkles className="w-full h-full text-white"/></div>
                                                    <div className="pt-1 prose prose-invert prose-p:text-gray-200 prose-strong:text-amber-200" dangerouslySetInnerHTML={parseContent(entry.content)} />
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
                            
                            <div className="flex-shrink-0 p-3 md:p-4 border-t border-gray-700/60">
                                <div className="max-w-4xl mx-auto">
                                    <div className="input-bar">
                                        <textarea 
                                            ref={textareaRef}
                                            value={userInput}
                                            onChange={e => setUserInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitPrompt(); } }}
                                            disabled={isGenerating}
                                            placeholder="Viết prompt của bạn ở đây... (vd: Viết tiếp, tập trung vào nhân vật A...)"
                                            rows={1}
                                            className="textarea"
                                        />
                                        <button onClick={handleSubmitPrompt} disabled={isGenerating || !userInput.trim()} className="send-button">
                                            {isGenerating ? <div className="loader"></div> : <FaPaperPlane />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                            <h3 className="text-2xl font-bold text-gray-300">Chọn hoặc tạo một tiểu thuyết</h3>
                            <p className="text-gray-500 mt-2">Bắt đầu hành trình sáng tác của bạn.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NovelistScreen;
