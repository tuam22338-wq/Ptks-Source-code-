import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaFileUpload, FaTimesCircle, FaCheck, FaTimes } from 'react-icons/fa';
import { getGameMasterActionableResponse } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import type { AIAction } from '../types';

interface Message {
    role: 'user' | 'model';
    text: string;
}

interface GameMasterChatProps {
    onActionRequest: (action: AIAction) => void;
}

const GameMasterChat: React.FC<GameMasterChatProps> = ({ onActionRequest }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: 'Xin chào! Tôi là GameMaster AI. Bạn muốn xây dựng một thế giới như thế nào? Hãy mô tả ý tưởng của bạn hoặc tải lên một tệp ghi chú để bắt đầu.'}
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<{name: string, content: string} | null>(null);
    const [aiSuggestion, setAiSuggestion] = useState<AIAction | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, aiSuggestion]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                setUploadedFile({ name: file.name, content });
            };
            reader.readAsText(file);
        } else if (file) {
            alert("Vui lòng chỉ tải lên tệp tin .txt");
        }
        event.target.value = '';
    };

    const handleSendMessage = async () => {
        const trimmedInput = input.trim();
        if (!trimmedInput && !uploadedFile) return;

        setIsLoading(true);
        setAiSuggestion(null);
        const userMessage = trimmedInput + (uploadedFile ? `\n\n[Đã đính kèm tệp: ${uploadedFile.name}]` : '');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        
        try {
            const responseAction = await getGameMasterActionableResponse(trimmedInput, uploadedFile?.content);
            if (responseAction.action === 'CHAT') {
                setMessages(prev => [...prev, { role: 'model', text: responseAction.data.response }]);
            } else {
                setAiSuggestion(responseAction);
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'model', text: 'Đã có lỗi xảy ra. Vui lòng thử lại.' }]);
        } finally {
            setInput('');
            setUploadedFile(null);
            setIsLoading(false);
        }
    };

    const handleSuggestionResponse = (accept: boolean) => {
        if (accept && aiSuggestion) {
            onActionRequest(aiSuggestion);
        }
        setAiSuggestion(null);
    };

    const getSuggestionSummary = (suggestion: AIAction): string => {
        switch (suggestion.action) {
            case 'CREATE_ITEM':
                return `AI đề xuất tạo vật phẩm: "${suggestion.data.name}"`;
            case 'CREATE_MULTIPLE_ITEMS':
                return `AI đề xuất tạo ${suggestion.data.length} vật phẩm mới.`;
            case 'CREATE_TALENT':
                return `AI đề xuất tạo Tiên Tư: "${suggestion.data.name}"`;
             case 'CREATE_MULTIPLE_TALENTS':
                return `AI đề xuất tạo ${suggestion.data.length} Tiên Tư mới.`;
            case 'CREATE_SECT':
                return `AI đề xuất tạo tông môn: "${suggestion.data.name}"`;
            case 'CREATE_MULTIPLE_SECTS':
                return `AI đề xuất tạo ${suggestion.data.length} tông môn mới.`;
            case 'CREATE_REALM_SYSTEM':
                 return `AI đề xuất **thay thế** Hệ Thống Cảnh Giới hiện tại bằng một hệ thống mới gồm ${suggestion.data.length} cảnh giới.`;
            case 'CONFIGURE_TALENT_SYSTEM':
                 return `AI đề xuất **thay thế** cấu hình hệ thống "${suggestion.data.systemName}" hiện tại.`;
            case 'CREATE_CHARACTER':
                 return `AI đề xuất tạo nhân vật: "${suggestion.data.name}".`;
            case 'CREATE_MULTIPLE_CHARACTERS':
                return `AI đề xuất tạo ${suggestion.data.length} nhân vật mới.`;
            case 'DEFINE_WORLD_BUILDING':
                return `AI đề xuất tạo một khối dữ liệu xây dựng thế giới với tiêu đề: "${suggestion.data.title}".`;
            case 'BATCH_ACTIONS': {
                const counts: Record<string, number> = {};
                suggestion.data.forEach(subAction => {
                    // This is a type guard to help TypeScript understand the structure
                    if ('action' in subAction && 'data' in subAction) {
                        const key = 
                            subAction.action.includes('ITEM') ? 'vật phẩm' :
                            subAction.action.includes('TALENT') ? 'tiên tư' :
                            subAction.action.includes('CHARACTER') ? 'nhân vật' :
                            subAction.action.includes('SECT') ? 'tông môn' :
                            subAction.action.includes('REALM') ? 'hệ thống cảnh giới' :
                            subAction.action.includes('WORLD') ? 'dữ liệu thế giới' :
                            'nội dung';
                        
                        const data = subAction.data as any; // Cast to any to access length property
                        counts[key] = (counts[key] || 0) + (Array.isArray(data) ? data.length : 1);
                    }
                });
            
                const summaryParts = Object.entries(counts).map(([key, value]) => `${value} ${key}`);
                return `AI đề xuất tạo: ${summaryParts.join(', ')}.`;
            }
            default:
                return "AI có một đề xuất.";
        }
    };

    const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' && !isLoading) {
            handleSendMessage();
        }
    };

    return (
        <div className="bg-black/20 p-4 rounded-lg border border-gray-700/60 h-[70vh] flex flex-col">
            <h4 className="text-lg font-title text-gray-200 mb-3 text-center">Trò chuyện với GameMaster AI</h4>
            
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                       {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-teal-800/50 flex items-center justify-center flex-shrink-0 text-teal-300">GM</div>}
                       <div className={`max-w-xl p-3 rounded-xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-gray-700/80 text-gray-200 rounded-br-none' : 'bg-gray-800/60 text-gray-300 rounded-bl-none'}`}>
                           {msg.text}
                       </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start items-end gap-2">
                        <div className="w-8 h-8 rounded-full bg-teal-800/50 flex items-center justify-center flex-shrink-0 text-teal-300">GM</div>
                        <div className="p-3 rounded-xl bg-gray-800/60 rounded-bl-none">
                           <LoadingSpinner size="sm" />
                        </div>
                    </div>
                )}
                {aiSuggestion && (
                    <div className="flex justify-start items-end gap-2">
                         <div className="w-8 h-8 rounded-full bg-teal-800/50 flex items-center justify-center flex-shrink-0 text-teal-300">GM</div>
                         <div className="max-w-xl p-3 rounded-xl bg-gray-800/60 text-gray-300 rounded-bl-none space-y-3">
                            <p>{getSuggestionSummary(aiSuggestion)}</p>
                            <div className="flex gap-3">
                                <button onClick={() => handleSuggestionResponse(true)} className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-green-600/80 text-white font-bold rounded-lg hover:bg-green-500/80"><FaCheck /> Áp dụng</button>
                                <button onClick={() => handleSuggestionResponse(false)} className="flex-1 flex items-center justify-center gap-2 px-3 py-1.5 bg-red-700/80 text-white font-bold rounded-lg hover:bg-red-600/80"><FaTimes/> Hủy bỏ</button>
                            </div>
                         </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="mt-4 pt-4 border-t border-gray-700/60">
                {uploadedFile && (
                    <div className="bg-gray-700/50 p-2 rounded-md mb-2 flex justify-between items-center text-sm">
                        <span className="text-gray-300">Đã tải lên: <span className="font-semibold">{uploadedFile.name}</span></span>
                        <button onClick={() => setUploadedFile(null)} className="p-1 text-gray-400 hover:text-white"><FaTimesCircle /></button>
                    </div>
                )}
                <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-600 rounded-lg p-1">
                    <input type="file" accept=".txt" onChange={handleFileChange} ref={fileInputRef} className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-white transition-colors" title="Tải lên tệp .txt"><FaFileUpload /></button>
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={handleKeyPress} placeholder="Nhập yêu cầu của bạn..." disabled={isLoading} className="flex-grow bg-transparent focus:outline-none text-gray-200 placeholder-gray-500" />
                    <button onClick={handleSendMessage} disabled={isLoading || (!input.trim() && !uploadedFile)} className="p-3 bg-teal-700/80 text-white rounded-md hover:bg-teal-600/80 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"><FaPaperPlane /></button>
                </div>
            </div>
        </div>
    );
};

export default GameMasterChat;