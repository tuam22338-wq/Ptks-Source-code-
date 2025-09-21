import React, { useState } from 'react';
import { FaArrowLeft, FaBrain } from 'react-icons/fa';
import { generateWorldFromPrompts } from '../../../services/geminiService';
import type { FullMod, ModInfo } from '../../../types';
import LoadingScreen from '../../../components/LoadingScreen';

interface ManualGenesisScreenProps {
    onBack: () => void;
    onInstall: (mod: FullMod) => Promise<boolean>;
}

const Field: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div>
        <label className="block text-lg font-semibold font-title text-gray-300">{label}</label>
        <p className="text-sm text-gray-500 mb-2">{description}</p>
        {children}
    </div>
);

const ManualGenesisScreen: React.FC<ManualGenesisScreenProps> = ({ onBack, onInstall }) => {
    const [modInfo, setModInfo] = useState({ name: '', id: '', author: '' });
    const [prompts, setPrompts] = useState({
        setting: '',
        mainGoal: '',
        openingStory: '',
        worldRules: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'id') {
            setModInfo(prev => ({ ...prev, [name]: value.replace(/\s+/g, '_').toLowerCase() }));
        } else {
            setModInfo(prev => ({ ...prev, [name]: value }));
        }
    };

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPrompts(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerateWorld = async () => {
        if (!modInfo.name.trim() || !modInfo.id.trim()) {
            setError("Tên Mod và ID Mod là bắt buộc.");
            return;
        }
        if (!prompts.setting.trim()) {
            setError("Bối Cảnh Thế Giới là bắt buộc.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const fullModInfo: Omit<ModInfo, 'description' | 'version'> & { description?: string, version?: string } = { ...modInfo, description: `Một thế giới được tạo bởi AI dựa trên bối cảnh: ${prompts.setting}`, version: '1.0.0' };
            const generatedMod = await generateWorldFromPrompts({ modInfo: fullModInfo, ...prompts });
            const success = await onInstall(generatedMod);
            if (success) {
                alert(`Thế giới "${generatedMod.modInfo.name}" đã được tạo và cài đặt thành công!`);
                onBack();
            }
        } catch (e: any) {
            setError(`Lỗi khi tạo thế giới: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <LoadingScreen message="AI đang dệt nên thế giới của bạn..." isGeneratingWorld={true} />;
    }

    return (
        <div className="flex-grow flex flex-col min-h-0 animate-fade-in">
            <div className="flex-shrink-0 mb-4">
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4">
                    <FaArrowLeft /> Quay Lại Menu
                </button>
            </div>

            <div className="flex-grow flex flex-col items-center">
                <h3 className="text-4xl font-bold font-title text-amber-300">Sáng Tạo Dẫn Hướng</h3>
                <p className="text-gray-400 max-w-2xl mx-auto mt-2 mb-6 text-center">
                    Cung cấp cho AI những ý tưởng cốt lõi, và để nó kiến tạo nên một vũ trụ chi tiết cho bạn.
                </p>
                
                {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30 mb-4 w-full max-w-3xl">{error}</p>}

                <div className="w-full max-w-3xl space-y-6 overflow-y-auto pr-2 pb-4">
                    <div className="p-4 bg-black/20 rounded-lg border border-gray-700 space-y-4">
                        <h4 className="text-xl font-semibold font-title text-gray-300">Thông Tin Cơ Bản (Bắt buộc)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Tên Mod</label>
                                <input name="name" value={modInfo.name} onChange={handleInfoChange} className="themed-input" placeholder="Vd: Vương Quốc Eldoria"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">ID Mod</label>
                                <input name="id" value={modInfo.id} onChange={handleInfoChange} className="themed-input" placeholder="vd: vuong_quoc_eldoria"/>
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Tác Giả</label>
                            <input name="author" value={modInfo.author} onChange={handleInfoChange} className="themed-input" placeholder="Tên của bạn"/>
                        </div>
                    </div>

                    <div className="p-4 bg-black/20 rounded-lg border border-gray-700 space-y-4">
                        <h4 className="text-xl font-semibold font-title text-gray-300">Nội Dung Sáng Tạo</h4>
                        <Field label="Bối Cảnh (Bắt buộc)" description="Mô tả tổng quan về thế giới, môi trường, không khí, và các đặc điểm chính.">
                            <textarea name="setting" value={prompts.setting} onChange={handlePromptChange} rows={3} className="themed-textarea" placeholder="Vd: Một vương quốc tu tiên lơ lửng trên những hòn đảo bay, nơi linh khí được khai thác từ những tinh thể khổng lồ..."/>
                        </Field>
                        <Field label="Mục Tiêu Chính (Tùy chọn)" description="Mô tả mục tiêu cuối cùng hoặc kết thúc mong muốn của câu chuyện.">
                            <textarea name="mainGoal" value={prompts.mainGoal} onChange={handlePromptChange} rows={2} className="themed-textarea" placeholder="Vd: Người chơi phải thu thập đủ 5 mảnh tinh thể để phục hồi lõi thế giới đang suy tàn..."/>
                        </Field>
                        <Field label="Quy Luật Thế Giới (Tùy chọn)" description="Thêm vào các quy tắc, cơ chế, hoặc hiện tượng độc đáo. Đặc biệt, bạn có thể định nghĩa một hệ thống tu luyện hoàn toàn mới tại đây.">
                            <textarea name="worldRules" value={prompts.worldRules} onChange={handlePromptChange} rows={2} className="themed-textarea" placeholder="Vd: Hệ thống tu luyện ở đây gọi là 'Thôn Phệ Hồn Lực', có các cấp bậc: Sơ Hồn, Luyện Hồn, Hồn Tướng, Hồn Vương..."/>
                        </Field>
                        <Field label="Cốt Truyện Khởi Đầu (Tùy chọn)" description="Viết phần mở đầu cho câu chuyện của bạn, hoặc để trống để AI tự tạo.">
                            <textarea name="openingStory" value={prompts.openingStory} onChange={handlePromptChange} rows={4} className="themed-textarea" placeholder="Vd: Bạn tỉnh dậy trên một con thuyền bay ọp ẹp, không một ký ức. Người lái thuyền già nua nhìn bạn và nói..."/>
                        </Field>
                    </div>
                </div>

                <div className="pt-4 mt-auto flex-shrink-0">
                    <button onClick={handleGenerateWorld} disabled={!prompts.setting.trim() || !modInfo.name.trim() || !modInfo.id.trim()} className="px-8 py-4 text-xl font-bold rounded-lg themed-button-primary disabled:bg-gray-600 disabled:cursor-not-allowed">
                        <FaBrain className="inline-block mr-3"/>
                        Kiến Tạo Thế Giới
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualGenesisScreen;
