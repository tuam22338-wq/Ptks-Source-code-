import React, { useState, useCallback, useRef } from 'react';
import { FaArrowLeft, FaFileUpload, FaBrain } from 'react-icons/fa';
import { generateWorldFromText } from '../../../services/geminiService';
import type { FullMod } from '../../../types';
import LoadingScreen from '../../../components/LoadingScreen';

interface AiGenesisScreenProps {
    onBack: () => void;
    onInstall: (mod: FullMod) => Promise<boolean>;
}

const AiGenesisScreen: React.FC<AiGenesisScreenProps> = ({ onBack, onInstall }) => {
    const [fileContent, setFileContent] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFileContent(e.target?.result as string);
                setFileName(file.name);
                setError(null);
            };
            reader.readAsText(file);
        }
    };

    const handleGenerateWorld = async () => {
        if (!fileContent.trim()) {
            setError("Nội dung file không được để trống.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const generatedMod = await generateWorldFromText(fileContent);
            const success = await onInstall(generatedMod);
            if(success) {
                alert(`Thế giới "${generatedMod.modInfo.name}" đã được tạo và cài đặt thành công! Bạn có thể kích hoạt nó trong Thư Viện Mod.`);
                onBack();
            }
        } catch (e: any) {
            setError(`Lỗi khi tạo thế giới: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading) {
        return <LoadingScreen message="AI đang sáng tạo thế giới..." isGeneratingWorld={true} />;
    }

    return (
        <div className="flex-grow flex flex-col min-h-0 animate-fade-in">
            <div className="flex-shrink-0 mb-4">
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4">
                    <FaArrowLeft /> Quay Lại Menu
                </button>
            </div>

            <div className="flex-grow flex flex-col items-center justify-center text-center">
                <FaBrain className="text-8xl text-gray-700 mb-4" />
                <h3 className="text-4xl font-bold font-title text-amber-300">AI Sáng Thế Ký</h3>
                <p className="text-gray-400 max-w-2xl mx-auto mt-2 mb-6">
                    Hãy trở thành đấng sáng tạo. Tải lên một tệp văn bản (.txt) chứa lịch sử, địa lý, nhân vật, và quy luật của thế giới bạn mong muốn. Bạn cũng có thể mô tả một hệ thống tu luyện độc đáo (ví dụ: 'Một hệ thống dựa trên việc hấp thụ linh hồn quái vật với các cấp bậc như Hồn Đồ, Hồn Sư...'), và AI sẽ cố gắng tạo ra cơ chế game tương ứng. AI sẽ phân tích và kiến tạo nên một vũ trụ hoàn chỉnh từ những con chữ của bạn.
                </p>

                {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30 mb-4">{error}</p>}

                <div 
                    className="w-full max-w-xl p-8 border-2 border-dashed border-gray-600 rounded-lg bg-black/20 text-center cursor-pointer hover:border-amber-400/80 hover:bg-black/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input type="file" accept=".txt" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    <FaFileUpload className="text-5xl text-gray-500 mx-auto mb-3" />
                    {fileName ? (
                        <p className="font-semibold text-green-400">{fileName}</p>
                    ) : (
                        <p className="text-gray-400">Nhấn hoặc kéo file .txt vào đây</p>
                    )}
                </div>

                <button 
                    onClick={handleGenerateWorld}
                    disabled={!fileContent.trim()}
                    className="mt-6 px-8 py-4 text-xl font-bold rounded-lg px-6 py-2 bg-[var(--button-primary-bg)] text-[var(--primary-accent-text-color)] border border-[var(--button-primary-border)] rounded-md font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--button-primary-hover-bg)] hover:-translate-y-0.5 shadow-md shadow-black/30 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-gray-400"
                >
                    Kiến Tạo Thế Giới
                </button>
            </div>
        </div>
    );
};

export default AiGenesisScreen;