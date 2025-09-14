import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { generateModContentFromPrompt } from '../../../services/geminiService';
import type { AiGeneratedModData } from '../../../types';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface AiContentGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (data: AiGeneratedModData) => void;
    modContext: any;
}

const AiContentGeneratorModal: React.FC<AiContentGeneratorModalProps> = ({ isOpen, onClose, onGenerate, modContext }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setError(null);
        try {
            const generatedData = await generateModContentFromPrompt(prompt, modContext);
            onGenerate(generatedData);
            onClose();
        } catch (e: any) {
            setError(`Lỗi khi tạo nội dung: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }}>
            <div className="bg-gray-900/95 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl text-gray-200 font-bold font-title">Tạo Nội Dung Bằng AI</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>
                <div className="p-6 flex-grow flex flex-col gap-4">
                    <p className="text-gray-400 text-sm">
                        Nhập mô tả chi tiết về nội dung bạn muốn AI tạo ra. Hãy cung cấp các thông tin như <strong>tên, loại, phẩm chất, chỉ số, địa điểm, v.v.</strong> để AI có thể hiểu rõ yêu cầu của bạn.
                        <br/>
                        Bạn có thể yêu cầu tạo nhiều đối tượng cùng lúc (ví dụ: "Tạo 5 loại linh dược khác nhau").
                    </p>
                    <textarea
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        rows={10}
                        placeholder="Tạo 3 thanh phi kiếm tên là ... phẩm chất ... tăng chỉ số ...&#10;Tạo 1 NPC trưởng lão tà phái tên Hắc Ma Lão Tổ ở Hắc Long Đàm.&#10;Tạo 1 tiên tư Thánh Giai tên Bất Diệt Thánh Thể, tăng 500 Căn Cốt.&#10;Tạo 1 thần thông cấp Địa Giai tên Hỏa Long Thuật, tiêu hao 100 linh lực."
                        className="w-full bg-gray-800/50 border border-gray-600 rounded-md p-3 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                        disabled={isLoading}
                    />
                    {error && <p className="text-red-400 text-sm bg-red-500/10 p-2 rounded-md border border-red-500/30">{error}</p>}
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} disabled={isLoading} className="px-5 py-2 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80">Hủy</button>
                    <button onClick={handleGenerate} disabled={isLoading || !prompt.trim()} className="px-5 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 disabled:bg-gray-600 w-32 flex justify-center items-center">
                        {isLoading ? <LoadingSpinner size="sm" /> : 'Tạo'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AiContentGeneratorModal;
