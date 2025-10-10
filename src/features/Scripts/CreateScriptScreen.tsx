import React, { useState, useRef, useEffect } from 'react';
import { FaArrowLeft, FaPaperPlane, FaRobot } from 'react-icons/fa';
// FIX: Fix import path for `useAppContext` to point to the correct module.
import { useAppContext } from '../../contexts/useAppContext';

const placeholderScript = `{
  "scriptInfo": {
    "id": "example_meditation_button",
    "name": "Nút Thiền Định",
    "author": "Code Master AI",
    "version": "1.0",
    "description": "Thêm một nút 'Thiền Định' vào thanh hành động để giúp người chơi dễ dàng tu luyện."
  },
  "uiModifications": [
    {
      "type": "ADD_QUICK_ACTION_BUTTON",
      "target": "DEFAULT",
      "payload": {
        "id": "meditate_action",
        "label": "Thiền Định",
        "description": "Tập trung tinh thần, hấp thụ linh khí.",
        "iconName": "GiSprout",
        "actionText": "ta bắt đầu ngồi xuống thiền định"
      }
    }
  ],
  "logicHooks": []
}`;


const CreateScriptScreen: React.FC = () => {
    const { handleNavigate } = useAppContext();
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Chào mừng Sáng Tạo Giả! Ta là Code Master. Hãy mô tả ý tưởng của ngươi, ta sẽ biến nó thành quy luật cho thế giới của ngươi. Ngươi muốn tạo ra một nút bấm mới, một panel thông tin, hay một quy tắc logic nào đó?' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [generatedCode, setGeneratedCode] = useState(placeholderScript);
    const endOfMessagesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleSendMessage = () => {
        if (!userInput.trim()) return;
        setMessages(prev => [...prev, { role: 'user', text: userInput }]);
        setUserInput('');
        // TODO: Call actual AI service
    };

    return (
        <div className="w-full h-full flex flex-col bg-[var(--bg-color)] p-4 sm:p-6">
            <div className="flex-shrink-0 flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => handleNavigate('scripts')} className="p-2 rounded-full text-[var(--text-muted-color)] hover:text-[var(--text-color)] hover:bg-gray-700/50" title="Quay Lại Thư Viện">
                        <FaArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-2xl sm:text-3xl font-bold font-title">Tạo Script - Code Master AI</h2>
                </div>
            </div>
            
            <div className="flex-grow flex flex-col md:flex-row gap-4 min-h-0">
                {/* Chat Panel */}
                <div className="w-full md:w-1/2 flex flex-col neumorphic-inset-box">
                    <div className="p-4 flex-grow overflow-y-auto space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'ai' && <FaRobot className="text-2xl text-[var(--primary-accent-color)] flex-shrink-0 mt-1" />}
                                <div className={`p-3 rounded-lg max-w-sm ${msg.role === 'ai' ? 'bg-black/20' : 'bg-blue-900/40'}`}>
                                    <p className="text-sm">{msg.text}</p>
                                </div>
                            </div>
                        ))}
                        <div ref={endOfMessagesRef} />
                    </div>
                    <div className="p-3 border-t border-[var(--shadow-light)]">
                        <div className="flex items-center gap-2">
                             <textarea 
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                                placeholder="Mô tả ý tưởng của bạn..." 
                                rows={1}
                                className="input-neumorphic flex-grow resize-none"
                            />
                            <button onClick={handleSendMessage} className="btn btn-primary !rounded-full !p-3">
                                <FaPaperPlane />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Code Panel */}
                <div className="w-full md:w-1/2 flex flex-col neumorphic-inset-box">
                    <div className="p-3 border-b border-[var(--shadow-light)]">
                        <h3 className="text-lg font-bold font-title text-[var(--text-color)]">Bản Xem Trước Script (JSON)</h3>
                    </div>
                    <div className="p-4 flex-grow overflow-y-auto bg-black/30">
                        <pre className="text-xs text-cyan-200 whitespace-pre-wrap font-mono">
                            <code>{generatedCode}</code>
                        </pre>
                    </div>
                    <div className="p-3 border-t border-[var(--shadow-light)] flex justify-end gap-3">
                        <button className="btn btn-neumorphic">Lưu</button>
                        <button className="btn btn-primary">Xuất File</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateScriptScreen;