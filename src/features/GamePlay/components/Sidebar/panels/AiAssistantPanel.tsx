import React, { useState, useRef, useEffect, memo } from 'react';
import type { GameState } from '../../../../../types';
import { FaBrain, FaPaperPlane } from 'react-icons/fa';
import LoadingSpinner from '../../../../../components/LoadingSpinner';
import { askAiAssistant } from '../../../../../services/geminiService';

interface AiAssistantPanelProps {
    gameState: GameState;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({ gameState }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: "Xin chào, ta là Thiên Cơ. Ngươi có điều gì muốn hỏi ta về thế giới này không?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await askAiAssistant(input, gameState);
            const assistantMessage: Message = { role: 'assistant', content: response };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            const errorMessage: Message = { role: 'assistant', content: `[Lỗi] Thiên cơ hỗn loạn, ta không thể trả lời câu hỏi này. (${error instanceof Error ? error.message : 'Unknown error'})` };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in" style={{ animationDuration: '300ms' }}>
            <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2 flex-shrink-0">
                <FaBrain className="text-purple-300" /> AI Trợ Lý
            </h3>
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-xl ${msg.role === 'user' ? 'bg-blue-800/50 rounded-br-none' : 'bg-gray-700/50 rounded-bl-none'}`}>
                            <p className="text-sm text-gray-200 whitespace-pre-wrap">{msg.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="max-w-[85%] p-3 rounded-xl bg-gray-700/50 rounded-bl-none">
                            <LoadingSpinner size="sm" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSubmit} className="mt-4 flex gap-2 flex-shrink-0">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Hỏi Thiên Cơ..."
                    disabled={isLoading}
                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-400/50"
                />
                <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="flex-shrink-0 px-4 py-2 bg-purple-700 text-white font-bold rounded-lg hover:bg-purple-600 disabled:bg-gray-600"
                >
                    <FaPaperPlane />
                </button>
            </form>
        </div>
    );
};

export default memo(AiAssistantPanel);
