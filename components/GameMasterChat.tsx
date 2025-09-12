import React, { useState, useRef, useEffect } from 'react';
import { FaPaperPlane, FaFileUpload, FaTimesCircle, FaCheck, FaTimes } from 'react-icons/fa';
import { getGameMasterActionableResponse } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import type { AIAction, RealmConfig, ModTalentRank, TalentSystemConfig, ModItem, ModTalent, ModCharacter, ModSect, ModWorldBuilding, ModTechnique, ModNpc, ModEvent, ModCustomPanel } from '../types';

interface Message {
    role: 'user' | 'model';
    text: string;
}

interface GameMasterModContext {
    modInfo: {
        name: string;
        author: string;
        description: string;
    };
    content: {
        items?: Omit<ModItem, 'id'>[];
        talents?: Omit<ModTalent, 'id'>[];
        characters?: Omit<ModCharacter, 'id'>[];
        sects?: Omit<ModSect, 'id'>[];
        worldBuilding?: Omit<ModWorldBuilding, 'id'>[];
        techniques?: Omit<ModTechnique, 'id'>[];
        npcs?: Omit<ModNpc, 'id'>[];
        events?: Omit<ModEvent, 'id'>[];
        customPanels?: Omit<ModCustomPanel, 'id'>[];
    };
    realmConfigs: RealmConfig[];
    talentRanks: ModTalentRank[];
    talentSystemConfig: TalentSystemConfig;
}

interface GameMasterChatProps {
    onActionRequest: (action: AIAction) => void;
    modContext: GameMasterModContext;
}

const GameMasterChat: React.FC<GameMasterChatProps> = ({ onActionRequest, modContext }) => {
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
            const responseAction = await getGameMasterActionableResponse(trimmedInput, uploadedFile?.content, modContext);
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
        const data = suggestion.data as any;
        switch (suggestion.action) {
            // Create
            case 'CREATE_ITEM': return `AI đề xuất tạo vật phẩm: "${data.name}"`;
            case 'CREATE_MULTIPLE_ITEMS': return `AI đề xuất tạo ${data.length} vật phẩm mới.`;
            case 'CREATE_TALENT': return `AI đề xuất tạo Tiên Tư: "${data.name}"`;
            case 'CREATE_MULTIPLE_TALENTS': return `AI đề xuất tạo ${data.length} Tiên Tư mới.`;
            case 'CREATE_SECT': return `AI đề xuất tạo tông môn: "${data.name}"`;
            case 'CREATE_MULTIPLE_SECTS': return `AI đề xuất tạo ${data.length} tông môn mới.`;
            case 'CREATE_CHARACTER': return `AI đề xuất tạo nhân vật: "${data.name}".`;
            case 'CREATE_MULTIPLE_CHARACTERS': return `AI đề xuất tạo ${data.length} nhân vật mới.`;
            case 'DEFINE_WORLD_BUILDING': return `AI đề xuất tạo dữ liệu thế giới: "${data.title}".`;
            case 'CREATE_TECHNIQUE': return `AI đề xuất tạo công pháp: "${data.name}".`;
            case 'CREATE_NPC': return `AI đề xuất tạo NPC: "${data.name}".`;
            case 'CREATE_EVENT': return `AI đề xuất tạo sự kiện: "${data.name}".`;
            case 'CREATE_RECIPE': return `AI đề xuất tạo đan phương: "${data.name}".`;
            case 'CREATE_CUSTOM_PANEL': return `AI đề xuất tạo bảng UI: "${data.title}".`;
            
            // Update
            case 'UPDATE_ITEM': return `AI đề xuất cập nhật vật phẩm: "${data.name}"`;
            case 'UPDATE_TALENT': return `AI đề xuất cập nhật Tiên Tư: "${data.name}"`;
            case 'UPDATE_SECT': return `AI đề xuất cập nhật tông môn: "${data.name}"`;
            case 'UPDATE_CHARACTER': return `AI đề xuất cập nhật nhân vật: "${data.name}"`;
            case 'UPDATE_TECHNIQUE': return `AI đề xuất cập nhật công pháp: "${data.name}"`;
            case 'UPDATE_NPC': return `AI đề xuất cập nhật NPC: "${data.name}"`;
            case 'UPDATE_EVENT': return `AI đề xuất cập nhật sự kiện: "${data.name}"`;
            case 'UPDATE_RECIPE': return `AI đề xuất cập nhật đan phương: "${data.name}"`;
            case 'UPDATE_WORLD_BUILDING': return `AI đề xuất cập nhật dữ liệu thế giới: "${data.title}"`;
            case 'UPDATE_CUSTOM_PANEL': return `AI đề xuất cập nhật bảng UI: "${data.title}"`;
            
            // Delete
            case 'DELETE_ITEM': return `AI đề xuất XÓA vật phẩm: "${data.name}"`;
            case 'DELETE_TALENT': return `AI đề xuất XÓA Tiên Tư: "${data.name}"`;
            case 'DELETE_SECT': return `AI đề xuất XÓA tông môn: "${data.name}"`;
            case 'DELETE_CHARACTER': return `AI đề xuất XÓA nhân vật: "${data.name}"`;
            case 'DELETE_TECHNIQUE': return `AI đề xuất XÓA công pháp: "${data.name}"`;
            case 'DELETE_NPC': return `AI đề xuất XÓA NPC: "${data.name}"`;
            case 'DELETE_EVENT': return `AI đề xuất XÓA sự kiện: "${data.name}"`;
            case 'DELETE_RECIPE': return `AI đề xuất XÓA đan phương: "${data.name}"`;
            case 'DELETE_WORLD_BUILDING': return `AI đề xuất XÓA dữ liệu thế giới: "${data.title}"`;
            case 'DELETE_CUSTOM_PANEL': return `AI đề xuất XÓA bảng UI: "${data.title}"`;

            // System
            case 'CREATE_REALM_SYSTEM': return `AI đề xuất **thay thế** Hệ Thống Cảnh Giới hiện tại bằng một hệ thống mới gồm ${data.length} cảnh giới.`;
            case 'CONFIGURE_TALENT_SYSTEM': return `AI đề xuất **thay thế** cấu hình hệ thống "${data.systemName}" hiện tại.`;
            
            // Batch
            case 'BATCH_ACTIONS': {
                const counts: Record<string, number> = {};
                (suggestion.data as any[]).forEach(subAction => {
                    const actionType = subAction.action.split('_').map((word: string, i: number) => i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(''); // e.g., CREATE_ITEM -> createItem
                    const key = subAction.action.replace(/CREATE_|UPDATE_|DELETE_|MULTIPLE_/, '').toLowerCase();
                    counts[key] = (counts[key] || 0) + (Array.isArray(subAction.data) ? subAction.data.length : 1);
                });
                const summaryParts = Object.entries(counts).map(([key, value]) => `${value} ${key}`);
                return `AI đề xuất thực hiện nhiều hành động: ${summaryParts.join(', ')}.`;
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