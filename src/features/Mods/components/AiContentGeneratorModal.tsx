import React, { useState } from 'react';
import { generateModContentFromPrompt } from '../../../services/geminiService';
import type { AiGeneratedModData } from '../../../types';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface AiContentGeneratorPanelProps {
    onGenerate: (data: AiGeneratedModData) => void;
    modContext: any;
}

const AiContentGeneratorPanel: React.FC<AiContentGeneratorPanelProps> = ({ onGenerate, modContext }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <div className="flex flex-col h-full p-2">
            <div className="flex-grow flex flex-col gap-4 min-h-0">
                <p className="text-gray-400 text-sm flex-shrink-0">
                    Nhập mô tả chi tiết về nội dung bạn muốn AI tạo ra. Hãy cung cấp các thông tin như <strong>tên, loại, phẩm chất, chỉ số, địa điểm, v.v.</strong> để AI có thể hiểu rõ yêu cầu của bạn.
                    <br/>
                    Bạn có thể yêu cầu tạo nhiều đối tượng cùng lúc (ví dụ: "Tạo 5 loại linh dược khác nhau").
                </p>
                <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    rows={12}
                    placeholder="Tạo 3 thanh phi kiếm tên là ... phẩm chất ... tăng chỉ số ...&#10;Tạo 1 NPC trưởng lão tà phái tên Hắc Ma Lão Tổ ở Hắc Long Đàm.&#10;Tạo một viên No Phúc Đan, giúp no bụng +50.&#10;Tạo 1 thần thông Hỏa hệ cấp Địa Giai tên Hỏa Long Thuật, tiêu hao 100 linh lực."
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-md p-3 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50 flex-grow"
                    disabled={isLoading}
                />
                {error && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-md border border-red-500/30 flex-shrink-0">{error}</p>}
            </div>
            <div className="pt-4 mt-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="px-6 py-3 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 disabled:bg-gray-600 w-36 flex justify-center items-center">
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Tạo Nội Dung'}
                </button>
            </div>
        </div>
    );
};

export default AiContentGeneratorPanel;