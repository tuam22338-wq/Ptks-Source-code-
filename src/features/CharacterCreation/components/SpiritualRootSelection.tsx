

import React, { useState, memo } from 'react';
import type { SpiritualRoot, CharacterCreationChoice } from '../../../types';
import { generatePowerSource } from '../../../services/geminiService';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { GiSparkles, GiScrollQuill } from 'react-icons/gi';

interface PowerSourceSelectionProps {
    race: CharacterCreationChoice;
    background: CharacterCreationChoice;
    onRootDetermined: (root: SpiritualRoot) => void;
}

const PowerSourceSelection: React.FC<PowerSourceSelectionProps> = ({ race, background, onRootDetermined }) => {
    const [mode, setMode] = useState<'choice' | 'playerInput' | 'aiResult'>('choice');
    const [playerInput, setPlayerInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async (isAiDriven: boolean) => {
        setIsLoading(true);
        setError(null);
        try {
            const context = {
                raceName: race.name,
                backgroundName: background.name,
                playerInput: isAiDriven ? undefined : playerInput,
            };
            const result = await generatePowerSource(context);
            onRootDetermined(result);
        } catch (err: any) {
            setError(err.message || 'Lỗi không xác định khi tạo nguồn gốc sức mạnh.');
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner message="AI đang tìm kiếm sức mạnh tiềm ẩn của bạn..." size="lg" />;
    }
    
    if (error) {
        return (
             <div className="max-w-2xl mx-auto text-center animate-fade-in">
                <p className="text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30 mb-4">{error}</p>
                <button onClick={() => { setError(null); setMode('choice'); }} className="themed-button-primary px-6 py-2">Thử Lại</button>
            </div>
        );
    }

    if (mode === 'playerInput') {
        return (
            <div className="max-w-2xl mx-auto text-center animate-fade-in">
                <h2 className="text-3xl font-bold font-title mb-4">Tự Viết Nên Định Mệnh</h2>
                <p className="text-gray-400 mb-4">Mô tả nguồn gốc sức mạnh độc nhất của bạn. AI sẽ phân tích và chuyển hóa nó thành các chỉ số trong game.</p>
                <textarea
                    value={playerInput}
                    onChange={(e) => setPlayerInput(e.target.value)}
                    rows={5}
                    className="w-full themed-textarea"
                    placeholder="Ví dụ: 'Là hậu duệ của một dòng dõi rồng cổ đại, trong người chảy dòng máu long tộc', 'Vô tình nuốt phải một dị bảo từ thượng cổ', 'Được cấy ghép các bộ phận máy móc tiên tiến'..."
                />
                <button onClick={() => handleGenerate(false)} disabled={!playerInput.trim()} className="mt-4 themed-button-primary px-8 py-3 text-xl font-bold rounded-lg disabled:bg-gray-600">
                    Xác nhận
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <h2 className="text-3xl font-bold font-title mb-2">Nguồn Gốc Sức Mạnh</h2>
            <p className="text-gray-400 mb-6">Mỗi sinh linh đều có một tia sáng sức mạnh tiềm ẩn. Nguồn gốc của nó là gì?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => handleGenerate(true)} className="creation-card group">
                    <GiSparkles className="creation-card-icon" />
                    <h3 className="creation-card-title">Để Thiên Mệnh An Bài</h3>
                    <p className="creation-card-desc">Để AI phân tích chủng tộc và xuất thân của bạn để tạo ra một nguồn gốc sức mạnh độc đáo và phù hợp.</p>
                </button>
                <button onClick={() => setMode('playerInput')} className="creation-card group">
                    <GiScrollQuill className="creation-card-icon" />
                    <h3 className="creation-card-title">Tự Viết Nên Định Mệnh</h3>
                    <p className="creation-card-desc">Bạn tự quyết định nguồn gốc sức mạnh của mình. Hãy mô tả nó, và AI sẽ biến nó thành hiện thực.</p>
                </button>
            </div>
        </div>
    );
};

export default memo(PowerSourceSelection);
