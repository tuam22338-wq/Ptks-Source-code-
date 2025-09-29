

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { FaArrowLeft, FaFileUpload, FaBrain, FaBolt, FaSearch, FaInfinity, FaDownload } from 'react-icons/fa';
import { generateWorldFromText, summarizeLargeTextForWorldGen } from '../../../services/geminiService';
import type { FullMod } from '../../../types';
import LoadingScreen from '../../../components/LoadingScreen';
import { useAppContext } from '../../../contexts/AppContext';

interface AiGenesisScreenProps {
    onBack: () => void;
    onInstall: (mod: FullMod) => Promise<boolean>;
}

type GenerationMode = 'fast' | 'deep' | 'super_deep';

const modeOptions: { id: GenerationMode; label: string; icon: React.ElementType; description: string; }[] = [
    { id: 'fast', label: 'Nhanh', icon: FaBolt, description: 'Trích xuất nhanh các thực thể chính. Phù hợp để tạo mẫu nhanh.' },
    { id: 'deep', label: 'Chuyên Sâu', icon: FaSearch, description: 'Phân tích sâu hơn về mối quan hệ, động cơ và quy luật. Mất nhiều thời gian hơn.' },
    { id: 'super_deep', label: 'Siêu Chuyên Sâu', icon: FaInfinity, description: 'AI sẽ sáng tạo và mở rộng dựa trên lore gốc để tạo ra một thế giới cực kỳ chi tiết. Mất nhiều thời gian nhất.' },
];

const AiGenesisScreen: React.FC<AiGenesisScreenProps> = ({ onBack, onInstall }) => {
    const { state, handleSettingChange, dispatch } = useAppContext();
    const { settings, pdfTextForGenesis } = state;

    const [fileContent, setFileContent] = useState<string>('');
    const [fileName, setFileName] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generationMode, setGenerationMode] = useState<GenerationMode>('fast');
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (pdfTextForGenesis) {
            setFileContent(pdfTextForGenesis);
            setFileName('Đã chuyển đổi từ PDF');
            dispatch({ type: 'SET_PDF_TEXT_FOR_GENESIS', payload: null });
        }
    }, [pdfTextForGenesis, dispatch]);

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

    const handleGenerate = async (install: boolean) => {
        if (!fileContent.trim()) {
            setError("Nội dung file không được để trống.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const summarizedContent = await summarizeLargeTextForWorldGen(fileContent);
            const generatedMod = await generateWorldFromText(summarizedContent, generationMode);
            
            if (install) {
                const success = await onInstall(generatedMod);
                if(success) {
                    alert(`Thế giới "${generatedMod.modInfo.name}" đã được tạo và cài đặt thành công! Bạn có thể kích hoạt nó trong Thư Viện Mod.`);
                    onBack();
                }
            } else {
                const jsonString = JSON.stringify(generatedMod, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${generatedMod.modInfo.id || 'generated_world'}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                alert(`Thế giới "${generatedMod.modInfo.name}" đã được tạo và xuất file thành công!`);
            }
        } catch (e: any) {
            setError(`Lỗi khi tạo thế giới: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (isLoading) {
        return <LoadingScreen message="AI đang sáng tạo thế giới..." isGeneratingWorld={true} generationMode={generationMode} />;
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
                    Hãy trở thành đấng sáng tạo. Tải lên một tệp văn bản (.txt) chứa lịch sử, địa lý, nhân vật, và quy luật của thế giới bạn mong muốn. AI sẽ phân tích và kiến tạo nên một vũ trụ hoàn chỉnh từ những con chữ của bạn.
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

                {/* --- SETTINGS SECTION --- */}
                <div className="w-full max-w-xl my-6 p-4 bg-black/20 rounded-lg border border-gray-700/60 space-y-4">
                    <h4 className="font-bold font-title text-gray-300 text-lg">Tùy Chọn Sáng Thế</h4>
                    <div>
                        <label className="block text-sm text-left font-semibold text-gray-400 mb-1">Chế Độ Phân Tích</label>
                         <div className="flex items-center p-1 bg-black/30 rounded-lg border border-gray-700/60 w-full">
                            {modeOptions.map(mode => (
                                 <button
                                    key={mode.id}
                                    onClick={() => setGenerationMode(mode.id)}
                                    title={mode.description}
                                    className={`w-1/3 text-center py-2 px-2 text-sm text-gray-400 rounded-md transition-colors duration-200 font-semibold hover:bg-gray-700/50 hover:text-white flex items-center justify-center gap-2 ${generationMode === mode.id ? 'bg-gray-600 text-white shadow-inner' : ''}`}
                                >
                                    <mode.icon /> {mode.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-left font-semibold text-gray-400 mb-1">Cài Đặt Chunk (Cho RAG)</label>
                        <p className="text-xs text-left text-gray-500 mb-2 italic">Lưu ý: Các cài đặt này ảnh hưởng đến việc lập chỉ mục RAG, không trực tiếp ảnh hưởng đến quá trình tạo thế giới này.</p>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-400">Kích thước Chunk: <span className="font-mono text-amber-300">{settings.ragChunkSize}</span></label>
                                <input type="range" min="128" max="1024" step="32" value={settings.ragChunkSize} onChange={(e) => handleSettingChange('ragChunkSize', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400">Độ chồng chéo: <span className="font-mono text-amber-300">{settings.ragChunkOverlap}</span></label>
                                <input type="range" min="0" max="128" step="8" value={settings.ragChunkOverlap} onChange={(e) => handleSettingChange('ragChunkOverlap', parseInt(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                            </div>
                        </div>
                    </div>
                </div>


                <div className="mt-2 flex flex-col sm:flex-row gap-4">
                    <button 
                        onClick={() => handleGenerate(false)}
                        disabled={!fileContent.trim()}
                        className="px-6 py-3 text-lg font-bold rounded-lg bg-[var(--bg-interactive)] text-[var(--text-color)] border border-[var(--border-subtle)] font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--bg-interactive-hover)] hover:-translate-y-0.5 shadow-md shadow-black/30 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:text-gray-500 flex items-center gap-2"
                    >
                        <FaDownload /> Kiến Tạo & Xuất File
                    </button>
                    <button 
                        onClick={() => handleGenerate(true)}
                        disabled={!fileContent.trim()}
                        className="px-8 py-4 text-xl font-bold rounded-lg bg-[var(--button-primary-bg)] text-[var(--primary-accent-text-color)] border border-[var(--button-primary-border)] font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--button-primary-hover-bg)] hover:-translate-y-0.5 shadow-md shadow-black/30 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:border-gray-700 disabled:text-gray-400"
                    >
                        Kiến Tạo & Cài Đặt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiGenesisScreen;