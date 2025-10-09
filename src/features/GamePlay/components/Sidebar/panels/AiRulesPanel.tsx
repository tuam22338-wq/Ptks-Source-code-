import React, { useState, useEffect, useRef, memo } from 'react';
import type { GameState, PlayerAiHooks } from '../../../../../types';
import { useAppContext } from '../../../../../contexts/AppContext';
import { FaDownload, FaUpload } from 'react-icons/fa';

const Field: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div>
        <label className="block text-lg font-semibold font-title" style={{color: 'var(--text-color)'}}>{label}</label>
        <p className="text-sm text-[var(--text-muted-color)] mb-2">{description}</p>
        {children}
    </div>
);

const AiRulesPanel: React.FC<{ gameState: GameState }> = ({ gameState }) => {
    const { handleUpdatePlayerCharacter } = useAppContext();
    const [localHooks, setLocalHooks] = useState<PlayerAiHooks>(
        gameState.playerCharacter.playerAiHooks || {
            on_world_build: '',
            on_action_evaluate: '',
            on_narration: '',
            on_realm_rules: '',
            on_conditional_rules: '',
        }
    );
    const importInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalHooks(gameState.playerCharacter.playerAiHooks || {
            on_world_build: '',
            on_action_evaluate: '',
            on_narration: '',
            on_realm_rules: '',
            on_conditional_rules: '',
        });
    }, [gameState.playerCharacter.playerAiHooks]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLocalHooks(prev => ({ ...prev, [name]: value }));
    };

    const handleBlur = () => {
        handleUpdatePlayerCharacter(pc => ({
            ...pc,
            playerAiHooks: localHooks,
        }));
    };
    
    const handleExport = () => {
        try {
            const data = JSON.stringify(localHooks, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tamthienthegioi_ai_rules_save_${gameState.lastSaved || Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            alert('Lỗi khi xuất quy luật.');
            console.error(error);
        }
    };
    
    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                const newHooks: PlayerAiHooks = {
                    on_world_build: json.on_world_build || '',
                    on_action_evaluate: json.on_action_evaluate || '',
                    on_narration: json.on_narration || '',
                    on_realm_rules: json.on_realm_rules || '',
                    on_conditional_rules: json.on_conditional_rules || '',
                };
                setLocalHooks(newHooks);
                 handleUpdatePlayerCharacter(pc => ({
                    ...pc,
                    playerAiHooks: newHooks,
                }));
                alert('Đã nhập quy luật thành công!');
            } catch (err) {
                alert('Lỗi: Định dạng tệp không hợp lệ.');
            } finally {
                 if (importInputRef.current) importInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
    };


    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <p className="text-sm text-center italic" style={{color: 'var(--text-muted-color)'}}>
                Tùy chỉnh các quy luật cốt lõi để AI tuân theo. Những thay đổi này được lưu riêng cho hành trình này.
            </p>
            
            <div className="flex gap-2">
                <button onClick={handleExport} className="w-full px-4 py-2 bg-[var(--bg-interactive)] text-[var(--text-color)] border border-[var(--border-subtle)] rounded-lg font-semibold transition-colors duration-200 hover:bg-[var(--bg-interactive-hover)] hover:border-gray-500 flex items-center justify-center gap-2">
                    <FaDownload /> Xuất
                </button>
                <button onClick={() => importInputRef.current?.click()} className="w-full px-4 py-2 bg-[var(--bg-interactive)] text-[var(--text-color)] border border-[var(--border-subtle)] rounded-lg font-semibold transition-colors duration-200 hover:bg-[var(--bg-interactive-hover)] hover:border-gray-500 flex items-center justify-center gap-2">
                    <FaUpload /> Nhập
                </button>
                <input
                    type="file"
                    ref={importInputRef}
                    className="hidden"
                    accept=".json"
                    onChange={handleImport}
                />
            </div>

            <Field label="Luật Lệ Vĩnh Cửu (on_world_build)" description="Các quy tắc cốt lõi, không thay đổi của thế giới mà AI phải luôn tuân theo. Mỗi quy tắc viết trên một dòng.">
                <textarea
                    name="on_world_build"
                    value={localHooks.on_world_build}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows={5}
                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 resize-y font-mono text-sm"
                    placeholder="Ví dụ: Trong thế giới này, yêu tộc và nhân tộc có mối thù truyền kiếp."
                />
            </Field>
            <Field label="Luật Lệ Tình Huống (on_action_evaluate)" description="Các quy tắc được AI xem xét và áp dụng cho kết quả của mỗi hành động người chơi. Mỗi quy tắc viết trên một dòng.">
                <textarea
                    name="on_action_evaluate"
                    value={localHooks.on_action_evaluate}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows={5}
                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 resize-y font-mono text-sm"
                    placeholder="Ví dụ: Nếu người chơi ở nơi có âm khí nồng đậm, tốc độ tu luyện ma công tăng gấp đôi."
                />
            </Field>
             <Field label="Luật Lệ Tường Thuật (on_narration)" description="Các quy tắc về văn phong, giọng điệu, hoặc các yếu tố tường thuật mà AI cần tuân thủ.">
                <textarea
                    name="on_narration"
                    value={localHooks.on_narration}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows={4}
                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 resize-y font-mono text-sm"
                    placeholder="Ví dụ: Luôn mô tả nội tâm của nhân vật một cách chi tiết."
                />
            </Field>
             <Field label="Luật Lệ Cảnh Giới (on_realm_rules)" description="Các quy tắc đặc biệt về hệ thống tu luyện, đột phá, hoặc các cảnh giới.">
                <textarea
                    name="on_realm_rules"
                    value={localHooks.on_realm_rules}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows={4}
                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 resize-y font-mono text-sm"
                    placeholder="Ví dụ: Cảnh giới Kim Đan trong thế giới này được chia thành 9 phẩm, từ hạ phẩm đến cực phẩm."
                />
            </Field>
            <Field label="Luật Lệ Tùy Biến (on_conditional_rules)" description="Các quy tắc logic có điều kiện theo cú pháp NẾU...THÌ... mà Trọng Tài AI sẽ tuân theo.">
                <textarea
                    name="on_conditional_rules"
                    value={localHooks.on_conditional_rules}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows={5}
                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 resize-y font-mono text-sm"
                    placeholder="Ví dụ: NẾU vị trí == 'Bắc Hải' VÀ thời gian == 'Nửa Đêm' THÌ hiệu quả tu luyện Băng hệ công pháp TĂNG 20%."
                />
            </Field>
        </div>
    );
};

export default memo(AiRulesPanel);