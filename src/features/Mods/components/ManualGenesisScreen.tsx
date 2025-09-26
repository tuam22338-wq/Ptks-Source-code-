import React, { useState } from 'react';
import { FaArrowLeft, FaBrain, FaPlus, FaTrash, FaEdit, FaSave, FaTimes, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import { generateWorldFromPrompts } from '../../../services/geminiService';
import type { FullMod, ModInfo, ModAttributeSystem, RealmConfig, AttributeDefinition, AttributeGroupDefinition, RealmStage, StatBonus } from '../../../types';
import LoadingScreen from '../../../components/LoadingScreen';
import { DEFAULT_ATTRIBUTE_DEFINITIONS, DEFAULT_ATTRIBUTE_GROUPS, REALM_SYSTEM, UI_ICONS, ALL_ATTRIBUTES } from '../../../constants';

interface ManualGenesisScreenProps {
    onBack: () => void;
    onInstall: (mod: FullMod) => Promise<boolean>;
}

// Reusable components
const Field: React.FC<{ label: string; description: string; children: React.ReactNode }> = ({ label, description, children }) => (
    <div>
        <label className="block text-lg font-semibold font-title text-gray-300">{label}</label>
        <p className="text-sm text-gray-500 mb-2">{description}</p>
        {children}
    </div>
);

const EditorModal: React.FC<{ title: string; onClose: () => void; onSave: () => void; children: React.ReactNode }> = ({ title, onClose, onSave, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }}>
        <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl m-4 max-h-[90vh] flex flex-col">
            <h3 className="text-xl font-bold p-4 border-b border-gray-700 text-amber-300">{title}</h3>
            <div className="p-4 overflow-y-auto space-y-4">{children}</div>
            <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"><FaTimes className="inline-block mr-2" />Hủy</button>
                <button onClick={onSave} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500"><FaSave className="inline-block mr-2" />Lưu</button>
            </div>
        </div>
    </div>
);

// --- MAIN COMPONENT ---
const ManualGenesisScreen: React.FC<ManualGenesisScreenProps> = ({ onBack, onInstall }) => {
    // Basic mod info
    const [modInfo, setModInfo] = useState({ name: '', id: '', author: '' });
    // AI prompts
    const [prompts, setPrompts] = useState({ setting: '', mainGoal: '', openingStory: '' });
    const [aiHooks, setAiHooks] = useState({ on_world_build: '', on_action_evaluate: '' });
    
    // User-defined systems
    const [attributeSystem, setAttributeSystem] = useState<ModAttributeSystem>({
        groups: JSON.parse(JSON.stringify(DEFAULT_ATTRIBUTE_GROUPS)),
        definitions: JSON.parse(JSON.stringify(DEFAULT_ATTRIBUTE_DEFINITIONS))
    });
    const [realmConfigs, setRealmConfigs] = useState<RealmConfig[]>(JSON.parse(JSON.stringify(REALM_SYSTEM)));
    const [isRealmSystemEnabled, setIsRealmSystemEnabled] = useState(true);

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateWorld = async () => {
        if (!modInfo.name.trim() || !modInfo.id.trim() || !prompts.setting.trim()) {
            setError("Tên Mod, ID Mod, và Bối Cảnh là bắt buộc.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const fullModInfo: Omit<ModInfo, 'description' | 'version'> = { ...modInfo };
            const generatedMod = await generateWorldFromPrompts({ 
                modInfo: fullModInfo, 
                prompts, 
                aiHooks,
                attributeSystem,
                realmConfigs: isRealmSystemEnabled ? realmConfigs : []
            });
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
                <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4"><FaArrowLeft /> Quay Lại Menu</button>
            </div>
            <div className="flex-grow flex flex-col items-center">
                <h3 className="text-4xl font-bold font-title text-amber-300">Công Cụ Sáng Thế</h3>
                <p className="text-gray-400 max-w-3xl mx-auto mt-2 mb-6 text-center">
                    Trở thành đấng sáng thế. Tự tay thiết kế các quy luật, thuộc tính, cảnh giới, sau đó cung cấp ý tưởng cốt lõi để AI kiến tạo nên một vũ trụ chi tiết cho bạn.
                </p>
                {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/30 mb-4 w-full max-w-3xl">{error}</p>}
                <div className="w-full max-w-4xl space-y-6 overflow-y-auto pr-2 pb-4">
                    {/* Basic Info */}
                    <div className="p-4 bg-black/20 rounded-lg border border-gray-700 space-y-4">
                        <h4 className="text-xl font-semibold font-title text-gray-300">1. Thông Tin Cơ Bản (Bắt buộc)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Tên Mod</label>
                                <input name="name" value={modInfo.name} onChange={e => setModInfo(p => ({...p, name: e.target.value}))} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50" placeholder="Vd: Thế Giới Cyber-Tu Chân"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">ID Mod (không dấu, không cách)</label>
                                <input name="id" value={modInfo.id} onChange={e => setModInfo(p => ({...p, id: e.target.value.toLowerCase().replace(/\s+/g, '_')}))} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50" placeholder="vd: cyber_tu_chan"/>
                            </div>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Tác Giả</label>
                            <input name="author" value={modInfo.author} onChange={e => setModInfo(p => ({...p, author: e.target.value}))} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50" placeholder="Tên của bạn"/>
                        </div>
                    </div>

                    {/* System Design */}
                    <div className="p-4 bg-black/20 rounded-lg border border-gray-700 space-y-4">
                        <h4 className="text-xl font-semibold font-title text-cyan-300">2. Thiết Kế Hệ Thống (Tùy chỉnh)</h4>
                        <p className="text-sm text-gray-500 -mt-2">Chỉnh sửa các quy luật cốt lõi của thế giới. Bạn có thể dùng hệ thống mặc định làm nền tảng.</p>
                        {/* Attribute System Editor Placeholder */}
                        <div className="p-3 bg-black/20 rounded-lg border border-gray-700/60">
                            <h5 className="font-bold text-gray-300 mb-2">Hệ Thống Thuộc Tính</h5>
                            <p className="text-xs text-gray-400">Định nghĩa các chỉ số cho nhân vật. (Sắp ra mắt)</p>
                        </div>
                        {/* Realm System Editor Placeholder */}
                        <div className="p-3 bg-black/20 rounded-lg border border-gray-700/60">
                            <div className="flex justify-between items-center">
                                <h5 className="font-bold text-gray-300">Hệ Thống Cảnh Giới</h5>
                                <button onClick={() => setIsRealmSystemEnabled(!isRealmSystemEnabled)} className="flex items-center gap-2 text-sm text-gray-300">
                                    {isRealmSystemEnabled ? <FaToggleOn className="text-green-400 text-xl" /> : <FaToggleOff className="text-gray-500 text-xl" />}
                                    {isRealmSystemEnabled ? 'Bật' : 'Tắt'}
                                </button>
                            </div>
                            <p className="text-xs text-gray-400">Định nghĩa các cấp bậc sức mạnh. Tắt đi nếu thế giới không có hệ thống cấp bậc. (Sắp ra mắt)</p>
                        </div>
                    </div>

                    {/* AI Content Prompts */}
                    <div className="p-4 bg-black/20 rounded-lg border border-gray-700 space-y-4">
                        <h4 className="text-xl font-semibold font-title text-amber-300">3. Gợi Ý Cho AI</h4>
                         <Field label="Bối Cảnh (Bắt buộc)" description="Mô tả tổng quan về thế giới, môi trường, không khí, và các đặc điểm chính.">
                            <textarea name="setting" value={prompts.setting} onChange={e => setPrompts(p => ({...p, setting: e.target.value}))} rows={3} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 resize-y" placeholder="Vd: Một vương quốc tu tiên lơ lửng trên những hòn đảo bay..."/>
                        </Field>
                        {/* Other prompt fields can be added here */}
                    </div>

                     {/* AI Hooks */}
                    <div className="p-4 bg-black/20 rounded-lg border border-gray-700 space-y-4">
                        <h4 className="text-xl font-semibold font-title text-cyan-300">4. Luật Lệ AI (Nâng cao)</h4>
                        <Field label="Luật Lệ Vĩnh Cửu (on_world_build)" description="Các quy tắc cốt lõi, không thay đổi của thế giới mà AI phải luôn tuân theo. Mỗi quy tắc một dòng.">
                            <textarea name="on_world_build" value={aiHooks.on_world_build} onChange={e => setAiHooks(p => ({...p, on_world_build: e.target.value}))} rows={3} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 resize-y font-mono text-sm" placeholder="Vd: Trong thế giới này, yêu tộc và nhân tộc có mối thù truyền kiếp."/>
                        </Field>
                        <Field label="Luật Lệ Tình Huống (on_action_evaluate)" description="Các quy tắc được AI xem xét và áp dụng cho kết quả của mỗi hành động người chơi. Mỗi quy tắc một dòng.">
                            <textarea name="on_action_evaluate" value={aiHooks.on_action_evaluate} onChange={e => setAiHooks(p => ({...p, on_action_evaluate: e.target.value}))} rows={3} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 resize-y font-mono text-sm" placeholder="Vd: Nếu người chơi ở nơi có âm khí nồng đậm, tốc độ tu luyện ma công tăng gấp đôi."/>
                        </Field>
                    </div>

                </div>
                <div className="pt-4 mt-auto flex-shrink-0">
                    <button onClick={handleGenerateWorld} disabled={!prompts.setting.trim() || !modInfo.name.trim() || !modInfo.id.trim()} className="px-8 py-4 text-xl font-bold rounded-lg bg-[var(--button-primary-bg)] text-[var(--primary-accent-text-color)] border border-[var(--button-primary-border)] font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--button-primary-hover-bg)] hover:-translate-y-0.5 shadow-md shadow-black/30 disabled:bg-gray-600 disabled:cursor-not-allowed">
                        <FaBrain className="inline-block mr-3"/>
                        Kiến Tạo Thế Giới
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualGenesisScreen;