import React, { useState, useRef } from 'react';
import { FaArrowLeft, FaFileUpload, FaCopy, FaDownload, FaBrain } from 'react-icons/fa';
import LoadingSpinner from '../../../components/LoadingSpinner';

// Declare pdf.js global object for TypeScript
declare const pdfjsLib: any;

interface PdfConverterScreenProps {
    onBack: () => void;
    onUseForGenesis: (text: string) => void;
}

const PdfConverterScreen: React.FC<PdfConverterScreenProps> = ({ onBack, onUseForGenesis }) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const [extractedText, setExtractedText] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !file.type.includes('pdf')) {
            setError('Vui lòng chọn một tệp PDF.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setFileName(file.name);
        setExtractedText('');

        try {
            if (typeof pdfjsLib === 'undefined') {
                throw new Error('Thư viện PDF chưa được tải. Vui lòng kiểm tra lại kết nối mạng và tải lại trang.');
            }
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const typedArray = new Uint8Array(e.target?.result as ArrayBuffer);
                    const pdf = await pdfjsLib.getDocument(typedArray).promise;
                    let fullText = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const textContent = await page.getTextContent();
                        const pageText = textContent.items.map((item: any) => item.str).join(' ');
                        fullText += pageText + '\n\n';
                    }
                    setExtractedText(fullText.trim());
                } catch (err: any) {
                    setError(`Lỗi xử lý PDF: ${err.message}`);
                } finally {
                    setIsLoading(false);
                }
            };
            reader.readAsArrayBuffer(file);
        } catch (err: any) {
            setError(`Lỗi đọc tệp: ${err.message}`);
            setIsLoading(false);
        }
    };
    
    const handleCopyToClipboard = () => {
        navigator.clipboard.writeText(extractedText);
        alert('Đã sao chép vào clipboard!');
    };

    const handleDownloadTxt = () => {
        const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName?.replace('.pdf', '') || 'converted'}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex-grow flex flex-col min-h-0 animate-fade-in">
            <div className="flex-shrink-0 mb-4">
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4">
                    <FaArrowLeft /> Quay Lại Menu Mod
                </button>
            </div>

            <div className="flex-grow flex flex-col gap-4">
                <div className="text-center">
                    <h3 className="text-3xl font-bold font-title text-amber-300">Chuyển Đổi PDF sang Văn Bản</h3>
                    <p className="text-gray-400 max-w-2xl mx-auto mt-2">
                        Công cụ này giúp bạn trích xuất nội dung văn bản từ một tệp PDF, sẵn sàng để sử dụng cho AI Sáng Thế Ký.
                    </p>
                </div>
                
                {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30">{error}</p>}

                <div className="flex-shrink-0">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full px-6 py-3 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 transition-colors flex items-center justify-center gap-3"
                    >
                        <FaFileUpload /> {fileName ? `Tải Lên Tệp Khác (${fileName})` : 'Chọn Tệp PDF...'}
                    </button>
                    <input type="file" accept=".pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                </div>

                <div className="flex-grow bg-black/30 border border-gray-600 rounded-lg p-2 flex flex-col min-h-[300px]">
                    {isLoading ? (
                        <div className="flex-grow flex items-center justify-center">
                            <LoadingSpinner message="Đang xử lý PDF..." />
                        </div>
                    ) : (
                        <textarea
                            readOnly
                            value={extractedText}
                            placeholder="Nội dung được trích xuất sẽ xuất hiện ở đây..."
                            className="w-full h-full bg-transparent border-0 rounded-md p-2 text-gray-300 focus:outline-none resize-none"
                        />
                    )}
                </div>

                {extractedText && !isLoading && (
                    <div className="flex-shrink-0 flex flex-col sm:flex-row gap-3">
                         <button onClick={handleCopyToClipboard} className="flex-1 px-4 py-2 bg-blue-700/80 text-white font-bold rounded-lg hover:bg-blue-600/80 transition-colors flex items-center justify-center gap-2"><FaCopy /> Sao Chép</button>
                         <button onClick={handleDownloadTxt} className="flex-1 px-4 py-2 bg-green-700/80 text-white font-bold rounded-lg hover:bg-green-600/80 transition-colors flex items-center justify-center gap-2"><FaDownload /> Tải File .txt</button>
                         <button onClick={() => onUseForGenesis(extractedText)} className="flex-1 px-4 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-colors flex items-center justify-center gap-2"><FaBrain /> Dùng cho Sáng Thế Ký</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PdfConverterScreen;
