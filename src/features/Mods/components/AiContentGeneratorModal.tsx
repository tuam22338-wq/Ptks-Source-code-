import React, { useState, useRef } from 'react';
import { generateModContentFromPrompt } from '../../../services/geminiService';
import type { AiGeneratedModData } from '../../../types';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { FaUpload } from 'react-icons/fa';

interface AiContentGeneratorPanelProps {
    onGenerate: (data: AiGeneratedModData) => void;
    modContext: any;
}

const AiContentGeneratorPanel: React.FC<AiContentGeneratorPanelProps> = ({ onGenerate, modContext }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const generatedData = await generateModContentFromPrompt(prompt, modContext);
            onGenerate(generatedData);
            setPrompt(''); // Clear prompt on success
        } catch (e: any) {
            setError(`Lỗi khi tạo nội dung: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                setPrompt(text);
            } catch (error: any) {
                setError(`Lỗi khi đọc tệp: ${error.message}`);
            }
        };
        reader.onerror = () => setError('Không thể đọc tệp tin.');
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };


    return (
        <div className="flex flex-col h-full p-2">
            <input
                type="file"
                accept=".txt"
                ref={fileInputRef}
                onChange={handleFileSelected}
                className="hidden"
            />
            <div className="flex-grow flex flex-col gap-4 min-h-0">
                <p className="text-gray-400 text-sm flex-shrink-0">
                    Nhập mô tả chi tiết về nội dung bạn muốn AI tạo ra, hoặc <strong>tải lên một file .txt</strong> chứa ý tưởng của bạn. Hãy cung cấp các thông tin như <strong>tên, loại, phẩm chất, chỉ số, địa điểm, v.v.</strong> để AI có thể hiểu rõ yêu cầu.
                    <br/>
                    Bạn có thể yêu cầu tạo nhiều đối tượng cùng lúc (ví dụ: "Tạo 5 loại linh dược khác nhau").
                </p>
                <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    rows={12}
                    placeholder="Tạo một gói dữ liệu về 'Hắc Thủy Trại', bao gồm 1 NPC trại chủ tên Hắc Phong, và 2 vật phẩm độc đáo (Hắc Phong Đao, Hắc Phong Giáp).&#10;Tạo 1 thần thông Hỏa hệ cấp Địa Giai tên Hỏa Long Thuật, tiêu hao 100 linh lực.&#10;Tạo một viên No Phúc Đan, giúp no bụng +50."
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-md p-3 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50 flex-grow"
                    disabled={isLoading}
                />
                {error && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-md border border-red-500/30 flex-shrink-0">{error}</p>}
            </div>
            <div className="pt-4 mt-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                <button onClick={handleUploadClick} disabled={isLoading} className="px-4 py-3 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80 disabled:bg-gray-600 flex justify-center items-center gap-2">
                    <FaUpload /> Tải Ý Tưởng (.txt)
                </button>
                <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="px-6 py-3 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 disabled:bg-gray-600 w-48 flex justify-center items-center">
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Tạo Nội Dung'}
                </button>
            </div>
        </div>
    );
};

export default AiContentGeneratorPanel;