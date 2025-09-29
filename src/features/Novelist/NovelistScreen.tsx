import React, { useState, useEffect, useRef } from 'react';
// FIX: Add FaPenFancy icon import
import { FaArrowLeft, FaPlus, FaSave, FaTrash, FaDownload, FaUser, FaRobot, FaPenFancy } from 'react-icons/fa';
import { useAppContext } from '../../contexts/AppContext';
import { db } from '../../services/dbService';
import type { Novel, NovelContentEntry } from '../../types';
import { generateNovelChapter } from '../../services/gemini/novel.service';
import LoadingSpinner from '../../components/LoadingSpinner';

const NovelistScreen: React.FC = () => {
    const { state, dispatch, handleNavigate } = useAppContext();
    const [activeNovel, setActiveNovel] = useState<Novel | null>(null);
    const [novels, setNovels] = useState<Novel[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isNewNovelModalOpen, setNewNovelModalOpen] = useState(false);
    const [newNovelData, setNewNovelData] = useState({ title: '', synopsis: '' });
    const contentEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadNovels = async () => {
            // FIX: Incorrect database access. Should be db.novels, not db.db.novels.
            const allNovels = await db.novels.toArray();
            setNovels(allNovels);
        };
        loadNovels();
    }, []);

    useEffect(() => {
        contentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activeNovel?.content]);

    const handleSelectNovel = (novel: Novel) => {
        setActiveNovel(novel);
    };

    const handleCreateNovel = async () => {
        if (!newNovelData.title.trim()) {
            alert('Tiêu đề không được để trống.');
            return;
        }
        const newNovel: Novel = {
            id: Date.now(),
            title: newNovelData.title,
            synopsis: newNovelData.synopsis,
            content: [],
            lastModified: new Date().toISOString(),
        };
        
        // FIX: Incorrect database access. Should be db.novels, not db.db.novels.
        await db.novels.add(newNovel);
        setNovels(prev => [...prev, newNovel]);
        setActiveNovel(newNovel);
        setNewNovelModalOpen(false);
        setNewNovelData({ title: '', synopsis: '' });
    };

    const handleUpdateNovelContent = async (updatedContent: NovelContentEntry[]) => {
        if (!activeNovel) return;
        const updatedNovel = {
            ...activeNovel,
            content: updatedContent,
            lastModified: new Date().toISOString(),
        };
        setActiveNovel(updatedNovel);
        // FIX: Incorrect database access. Should be db.novels, not db.db.novels.
        await db.novels.put(updatedNovel);
    };

    const handleSubmitPrompt = async () => {
        if (!userInput.trim() || isGenerating || !activeNovel) return;
        
        setIsGenerating(true);

        const promptEntry: NovelContentEntry = {
            id: `prompt-${Date.now()}`,
            type: 'prompt',
            content: userInput,
            timestamp: new Date().toISOString(),
        };
        
        const currentContent = [...(activeNovel.content || []), promptEntry];
        await handleUpdateNovelContent(currentContent);
        setUserInput('');
        
        try {
            const stream = generateNovelChapter(userInput, activeNovel.content || [], activeNovel.synopsis, state.settings);
            
            let fullAiResponse = '';
            const aiEntryId = `ai-${Date.now()}`;
            
            for await (const chunk of stream) {
                fullAiResponse += chunk;
                const updatedContentWithStream = [
                    ...currentContent,
                    { id: aiEntryId, type: 'ai_generation', content: fullAiResponse, timestamp: new Date().toISOString() }
                ];
                // Update state frequently for streaming effect, but don't hit DB every time
                setActiveNovel(prev => prev ? { ...prev, content: updatedContentWithStream } : null);
            }

            // Final update to DB
            await handleUpdateNovelContent([
                ...currentContent,
                { id: aiEntryId, type: 'ai_generation', content: fullAiResponse, timestamp: new Date().toISOString() }
            ]);
            
        } catch (error) {
            console.error("Lỗi khi tạo chương mới:", error);
            const errorEntry: NovelContentEntry = {
                id: `error-${Date.now()}`,
                type: 'ai_generation',
                content: `[Lỗi] Không thể kết nối với AI. Vui lòng thử lại.`,
                timestamp: new Date().toISOString(),
            };
            await handleUpdateNovelContent([...currentContent, errorEntry]);
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleDeleteNovel = async (id: number) => {
        if (window.confirm("Bạn có chắc muốn xóa vĩnh viễn dự án này không?")) {
            // FIX: Incorrect database access. Should be db.novels, not db.db.novels.
            await db.novels.delete(id);
            setNovels(novels.filter(n => n.id !== id));
            if (activeNovel?.id === id) {
                setActiveNovel(null);
            }
        }
    };
    
    const handleExportNovel = () => {
        if (!activeNovel) return;
        const textContent = activeNovel.content.map(entry => {
            if (entry.type === 'prompt') {
                return `\n\n>>> ${entry.content}\n\n`;
            }
            return entry.content;
        }).join('');
        
        const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeNovel.title}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="w-full h-full flex flex-col animate-fade-in">
            {/* New Novel Modal */}
            {isNewNovelModalOpen && (
                 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={() => setNewNovelModalOpen(false)}>
                    <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg m-4 p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4 text-amber-300">Tạo Tiểu Thuyết Mới</h3>
                        <div className="space-y-4">
                            <input value={newNovelData.title} onChange={e => setNewNovelData({...newNovelData, title: e.target.value})} placeholder="Tiêu đề tiểu thuyết..." className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" />
                            <textarea value={newNovelData.synopsis} onChange={e => setNewNovelData({...newNovelData, synopsis: e.target.value})} rows={4} placeholder="Tóm tắt, ý tưởng chính, hoặc prompt khởi đầu..." className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 resize-y"/>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button onClick={() => setNewNovelModalOpen(false)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Hủy</button>
                            <button onClick={handleCreateNovel} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500">Tạo</button>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="flex-shrink-0 flex justify-between items-center p-3 bg-stone-900/50 border-b border-gray-800">
                <button onClick={() => handleNavigate('settings')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white">
                    <FaArrowLeft /> Quay Lại Cài Đặt
                </button>
                <h1 className="text-2xl font-bold font-title text-purple-300">Tiểu Thuyết Gia AI</h1>
                <div className="w-24"></div>
            </div>

            <div className="flex-grow flex min-h-0">
                {/* Sidebar */}
                <aside className="w-64 flex-shrink-0 bg-black/20 border-r border-gray-800 flex flex-col">
                    <div className="p-3 border-b border-gray-800">
                        <button onClick={() => setNewNovelModalOpen(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-700/80 text-white font-bold rounded-lg hover:bg-purple-600/80">
                            <FaPlus /> Dự án mới
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {novels.map(novel => (
                            <button 
                                key={novel.id} 
                                onClick={() => handleSelectNovel(novel)}
                                className={`w-full text-left p-3 text-sm transition-colors ${activeNovel?.id === novel.id ? 'bg-purple-900/50 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}
                            >
                                <p className="font-semibold truncate">{novel.title}</p>
                                <p className="text-xs text-gray-500">{new Date(novel.lastModified).toLocaleString()}</p>
                            </button>
                        ))}
                    </div>
                </aside>
                
                {/* Main Content */}
                <main className="flex-grow flex flex-col bg-stone-900">
                    {activeNovel ? (
                        <>
                            <div className="flex-shrink-0 p-3 border-b border-gray-800 flex justify-between items-center">
                                <h2 className="text-lg font-bold truncate">{activeNovel.title}</h2>
                                <div className="flex gap-2">
                                    <button onClick={handleExportNovel} className="p-2 text-gray-400 hover:text-white" title="Xuất file .txt"><FaDownload /></button>
                                    <button onClick={() => handleDeleteNovel(activeNovel.id)} className="p-2 text-gray-400 hover:text-red-400" title="Xóa dự án"><FaTrash /></button>
                                </div>
                            </div>
                            <div className="flex-grow p-4 md:p-6 overflow-y-auto font-serif text-lg leading-relaxed">
                                {activeNovel.content.map(entry => (
                                    <div key={entry.id} className="my-4">
                                        {entry.type === 'prompt' ? (
                                            <div className="flex gap-3 items-start">
                                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0"><FaUser /></div>
                                                <p className="bg-gray-800/50 p-3 rounded-lg text-base italic">{entry.content}</p>
                                            </div>
                                        ) : (
                                            <div className="flex gap-3 items-start">
                                                <div className="w-8 h-8 rounded-full bg-purple-800 flex items-center justify-center flex-shrink-0"><FaRobot /></div>
                                                <p className="whitespace-pre-wrap">{entry.content}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={contentEndRef} />
                            </div>
                            <div className="flex-shrink-0 p-4 border-t border-gray-800 bg-stone-800/50">
                                <form onSubmit={(e) => { e.preventDefault(); handleSubmitPrompt(); }} className="relative">
                                    <textarea
                                        value={userInput}
                                        onChange={e => setUserInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmitPrompt(); } }}
                                        disabled={isGenerating}
                                        placeholder="Viết prompt của bạn ở đây..."
                                        rows={3}
                                        className="w-full bg-black/30 border border-gray-600 rounded-lg p-3 pr-24 text-base resize-y focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                    <button type="submit" disabled={isGenerating || !userInput.trim()} className="absolute bottom-3 right-3 px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-500 disabled:bg-gray-600">
                                        {isGenerating ? <LoadingSpinner size="sm" /> : 'Gửi'}
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center text-center text-gray-500">
                            <FaPenFancy className="text-6xl mb-4" />
                            <h2 className="text-2xl font-bold">Chào mừng đến với Tiểu Thuyết Gia AI</h2>
                            <p>Chọn một dự án hoặc tạo mới để bắt đầu hành trình sáng tác của bạn.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default NovelistScreen;