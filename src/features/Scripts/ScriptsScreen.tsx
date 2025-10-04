import React from 'react';
import { FaArrowLeft, FaPlus, FaUpload } from 'react-icons/fa';
import { useAppContext } from '../../contexts/AppContext';

const ScriptsScreen: React.FC = () => {
    const { handleNavigate } = useAppContext();

    return (
        <div className="w-full animate-fade-in flex flex-col h-full min-h-0">
            <div className="flex-shrink-0 flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold font-title">Quản Lý Scripts</h2>
                <button onClick={() => handleNavigate('mainMenu')} className="p-2 rounded-full text-[var(--text-muted-color)] hover:text-[var(--text-color)] hover:bg-gray-700/50" title="Quay Lại Menu">
                    <FaArrowLeft className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-grow flex flex-col items-center justify-center space-y-6">
                <p className="text-center max-w-2xl text-[var(--text-muted-color)]">
                    Scripts cho phép bạn thay đổi sâu vào luật lệ của thế giới bằng mã lệnh. Trò chuyện với "Code Master" để tạo ra các quy tắc độc đáo, hoặc nhập các script do cộng đồng chia sẻ.
                </p>
                <div className="flex gap-4">
                    <button onClick={() => alert('Tính năng trò chuyện với Code Master sắp ra mắt!')} className="btn btn-primary px-8 py-4 text-xl">
                        <FaPlus /> Tạo Script
                    </button>
                    <button onClick={() => alert('Tính năng nhập script sắp ra mắt!')} className="btn btn-neumorphic px-8 py-4 text-xl">
                        <FaUpload /> Nhập Script
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScriptsScreen;
