import React, { useState } from 'react';
import { FaArrowLeft, FaBrain, FaPlus, FaTrash, FaEdit, FaToggleOn, FaToggleOff, FaChevronDown, FaChevronUp, FaDownload } from 'react-icons/fa';
import { generateWorldFromPrompts } from '../../../services/geminiService';
import type { FullMod, ModInfo, ModAttributeSystem, RealmConfig, AttributeDefinition, AttributeGroupDefinition, QuickActionBarConfig, QuickActionButtonConfig } from '../../../types';
import LoadingScreen from '../../../components/LoadingScreen';
import { DEFAULT_ATTRIBUTE_DEFINITIONS, DEFAULT_ATTRIBUTE_GROUPS, REALM_SYSTEM, UI_ICONS } from '../../../constants';
import AttributeEditorModal from './AttributeEditorModal';
import RealmEditorModal from './RealmEditorModal';
import QuickActionButtonEditorModal from './QuickActionButtonEditorModal';

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
    const [quickActionBars, setQuickActionBars] = useState<QuickActionBarConfig[]>([]);

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAttributeModalOpen, setIsAttributeModalOpen] = useState(false);
    const [isRealmEditorOpen, setIsRealmEditorOpen] = useState(false);
    const [editingAttribute, setEditingAttribute] = useState<AttributeDefinition | null>(null);
    const [editingAttributeGroup, setEditingAttributeGroup] = useState<AttributeGroupDefinition | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ 'physical': true });
    const [isActionButtonModalOpen, setIsActionButtonModalOpen] = useState(false);
    const [editingButton, setEditingButton] = useState<{ button: QuickActionButtonConfig | null, barIndex: number }>({ button: null, barIndex: -1 });


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
                realmConfigs: isRealmSystemEnabled ? realmConfigs : [],
                quickActionBars
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

    const handleGenerateAndExport = async () => {
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
                realmConfigs: isRealmSystemEnabled ? realmConfigs : [],
                quickActionBars
            });

            const jsonString = JSON.stringify(generatedMod, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${generatedMod.modInfo.id}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            alert(`Thế giới "${generatedMod.modInfo.name}" đã được tạo và xuất file thành công!`);

        } catch (e: any) {
            setError(`Lỗi khi tạo thế giới: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- Attribute Modal Handlers ---
    const handleOpenAttributeModal = (attr: AttributeDefinition | null, group: AttributeGroupDefinition) => {
        setEditingAttribute(attr);
        setEditingAttributeGroup(group);
        setIsAttributeModalOpen(true);
    };

    const handleCloseAttributeModal = () => {
        setIsAttributeModalOpen(false);
        setEditingAttribute(null);
        setEditingAttributeGroup(null);
    };

    const handleSaveAttribute = (savedAttr: AttributeDefinition) => {
        setAttributeSystem(prev => {
            const newDefinitions = [...prev.definitions];
            const originalId = editingAttribute ? editingAttribute.id : savedAttr.id;
            const index = newDefinitions.findIndex(d => d.id === originalId);

            if (index > -1) {
                newDefinitions[index] = savedAttr;
            } else {
                newDefinitions.push(savedAttr);
            }
            return { ...prev, definitions: newDefinitions };
        });
        handleCloseAttributeModal();
    };

    const handleDeleteAttribute = (attrId: string) => {
        if (window.confirm("Bạn có chắc muốn xóa thuộc tính này? Hành động này không thể hoàn tác.")) {
            setAttributeSystem(prev => ({
                ...prev,
                definitions: prev.definitions.filter(d => d.id !== attrId)
            }));
        }
    };

    const handleSaveRealms = (updatedRealms: RealmConfig[]) => {
        setRealmConfigs(updatedRealms);
    };
    
    // --- Quick Action Bar Handlers ---
    const handleAddActionBar = () => {
        const newBar: QuickActionBarConfig = {
            id: `bar_${Date.now()}`,
            context: { type: 'DEFAULT', value: [] },
            buttons: []
        };
        setQuickActionBars(prev => [...prev, newBar]);
    };

    const handleDeleteActionBar = (barIndex: number) => {
        if (window.confirm("Bạn có chắc muốn xóa thanh hành động này?")) {
            setQuickActionBars(prev => prev.filter((_, i) => i !== barIndex));
        }
    };

    const handleBarChange = (barIndex: number, field: 'type' | 'value', value: any) => {
        const newBars = [...quickActionBars];
        if (field === 'type') {
            newBars[barIndex].context.type = value;
            newBars[barIndex].context.value = []; // Reset value when type changes
        } else if (field === 'value') {
            newBars[barIndex].context.value = value.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        setQuickActionBars(newBars);
    };

    const handleOpenButtonModal = (button: QuickActionButtonConfig | null, barIndex: number) => {
        setEditingButton({ button, barIndex });
        setIsActionButtonModalOpen(true);
    };

    const handleSaveButton = (button: QuickActionButtonConfig) => {
        const newBars = [...quickActionBars];
        const bar = newBars[editingButton.barIndex];
        const originalId = editingButton.button ? editingButton.button.id : button.id;
        const buttonIndex = bar.buttons.findIndex(b => b.id === originalId);
        
        if (buttonIndex > -1) {
            bar.buttons[buttonIndex] = button;
        } else {
            bar.buttons.push(button);
        }
        setQuickActionBars(newBars);
        setIsActionButtonModalOpen(false);
    };

    const handleDeleteButton = (barIndex: number, buttonIndex: number) => {
         if (window.confirm("Bạn có chắc muốn xóa nút này?")) {
            const newBars = [...quickActionBars];
            newBars[barIndex].buttons.splice(buttonIndex, 1);
            setQuickActionBars(newBars);
        }
    };

    if (isLoading) {
        return <LoadingScreen message="AI đang dệt nên thế giới của bạn..." isGeneratingWorld={true} />;
    }

    return (
        <div className="flex-grow flex flex-col min-h-0 animate-fade-in">
             {isAttributeModalOpen && editingAttributeGroup && (
                <AttributeEditorModal
                    isOpen={isAttributeModalOpen}
                    onClose={handleCloseAttributeModal}
                    onSave={handleSaveAttribute}
                    attribute={editingAttribute}
                    group={editingAttributeGroup}
                />
            )}
            <RealmEditorModal
                isOpen={isRealmEditorOpen}
                onClose={() => setIsRealmEditorOpen(false)}
                onSave={handleSaveRealms}
                initialRealms={realmConfigs}
                attributeSystem={attributeSystem}
            />
            <QuickActionButtonEditorModal
                isOpen={isActionButtonModalOpen}
                onClose={() => setIsActionButtonModalOpen(false)}
                onSave={handleSaveButton}
                button={editingButton.button}
            />
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
                        
                        <div className="p-3 bg-black/20 rounded-lg border border-gray-700/60">
                            <h5 className="font-bold text-gray-300 mb-2">Hệ Thống Thuộc Tính</h5>
                            <div className="space-y-2">
                                {attributeSystem.groups.map(group => (
                                    <div key={group.id} className="bg-black/25 rounded-md border border-gray-800/80">
                                        <button onClick={() => setExpandedGroups(p => ({...p, [group.id]: !p[group.id]}))} className="w-full flex justify-between items-center p-2 text-left hover:bg-gray-800/50">
                                            <span className="font-semibold text-gray-300">{group.name}</span>
                                            {expandedGroups[group.id] ? <FaChevronUp /> : <FaChevronDown />}
                                        </button>
                                        {expandedGroups[group.id] && (
                                            <div className="p-2 border-t border-gray-800/80 space-y-2">
                                                {attributeSystem.definitions.filter(d => d.group === group.id).map(attr => {
                                                    const Icon = UI_ICONS[attr.iconName] || (() => <span />);
                                                    return (
                                                        <div key={attr.id} className="flex justify-between items-center p-2 bg-black/30 rounded">
                                                            <div className="flex items-center gap-2">
                                                                <Icon className="text-lg text-cyan-300" />
                                                                <span className="text-sm font-semibold">{attr.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => handleOpenAttributeModal(attr, group)} className="p-1 text-gray-400 hover:text-white"><FaEdit /></button>
                                                                <button onClick={() => handleDeleteAttribute(attr.id)} className="p-1 text-gray-400 hover:text-red-400"><FaTrash /></button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                <button onClick={() => handleOpenAttributeModal(null, group)} className="w-full mt-2 text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded">
                                                    <FaPlus /> Thêm Thuộc Tính
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="p-3 bg-black/20 rounded-lg border border-gray-700/60">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h5 className="font-bold text-gray-300">Hệ Thống Cảnh Giới</h5>
                                    <p className="text-xs text-gray-400">Định nghĩa các cấp bậc sức mạnh. Tắt đi nếu thế giới không có hệ thống cấp bậc.</p>
                                </div>
                                <button onClick={() => setIsRealmSystemEnabled(!isRealmSystemEnabled)} className="flex items-center gap-2 text-sm text-gray-300">
                                    {isRealmSystemEnabled ? <FaToggleOn className="text-green-400 text-xl" /> : <FaToggleOff className="text-gray-500 text-xl" />}
                                    {isRealmSystemEnabled ? 'Đang Bật' : 'Đã Tắt'}
                                </button>
                            </div>
                             {isRealmSystemEnabled && (
                                <div className="mt-2 pt-2 border-t border-gray-600/50 text-center">
                                     <button onClick={() => setIsRealmEditorOpen(true)} className="px-3 py-1.5 bg-cyan-700/80 text-white text-xs font-bold rounded-lg hover:bg-cyan-600/80 flex items-center gap-2 mx-auto">
                                        <FaEdit /> Chỉnh sửa Hệ Thống Cảnh Giới
                                    </button>
                                </div>
                             )}
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
                    
                    {/* Quick Action Bars */}
                    <div className="p-4 bg-black/20 rounded-lg border border-gray-700 space-y-4">
                        <h4 className="text-xl font-semibold font-title text-cyan-300">5. Thiết Kế Hành Động Nhanh (Tùy chọn)</h4>
                        <p className="text-sm text-gray-500 -mt-2">Tạo các nút hành động nhanh cho người chơi trong các bối cảnh cụ thể.</p>
                        <div className="space-y-3">
                            {quickActionBars.map((bar, barIndex) => (
                                <div key={bar.id} className="bg-black/25 rounded-lg border border-gray-800/80 p-3">
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-semibold text-gray-300">Thanh Hành Động #{barIndex + 1}</h5>
                                        <button onClick={() => handleDeleteActionBar(barIndex)} className="p-1 text-gray-400 hover:text-red-400"><FaTrash /></button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs text-gray-400">Bối cảnh</label>
                                            <select value={bar.context.type} onChange={(e) => handleBarChange(barIndex, 'type', e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded-lg px-2 py-1 text-sm text-gray-200">
                                                <option value="DEFAULT">Mặc định</option>
                                                <option value="LOCATION">Địa điểm</option>
                                            </select>
                                        </div>
                                        {bar.context.type === 'LOCATION' && (
                                            <div>
                                                <label className="text-xs text-gray-400">ID Địa điểm (cách nhau bằng dấu phẩy)</label>
                                                <input value={bar.context.value.join(', ')} onChange={(e) => handleBarChange(barIndex, 'value', e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded-lg px-2 py-1 text-sm text-gray-200 font-mono"/>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-700/60">
                                        <h6 className="text-sm font-semibold text-gray-400 mb-2">Các Nút</h6>
                                        <div className="space-y-2">
                                            {bar.buttons.map((button, buttonIndex) => {
                                                const Icon = UI_ICONS[button.iconName] || (() => <span />);
                                                return (
                                                    <div key={button.id} className="flex justify-between items-center p-2 bg-black/30 rounded">
                                                        <div className="flex items-center gap-2">
                                                            <Icon className="text-lg text-cyan-300" />
                                                            <span className="text-sm font-semibold">{button.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => handleOpenButtonModal(button, barIndex)} className="p-1 text-gray-400 hover:text-white"><FaEdit /></button>
                                                            <button onClick={() => handleDeleteButton(barIndex, buttonIndex)} className="p-1 text-gray-400 hover:text-red-400"><FaTrash /></button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <button onClick={() => handleOpenButtonModal(null, barIndex)} className="w-full mt-2 text-sm text-cyan-300/80 hover:text-cyan-200 flex items-center justify-center gap-2 p-1 bg-cyan-900/30 rounded">
                                            <FaPlus /> Thêm Nút
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleAddActionBar} className="w-full mt-3 text-base text-amber-300/80 hover:text-amber-200 flex items-center justify-center gap-2 p-2 bg-amber-900/30 rounded border border-amber-500/30">
                            <FaPlus /> Thêm Thanh Hành Động
                        </button>
                    </div>

                </div>
                <div className="pt-4 mt-auto flex-shrink-0 flex flex-col sm:flex-row justify-center items-center gap-4">
                    <button onClick={handleGenerateAndExport} disabled={!prompts.setting.trim() || !modInfo.name.trim() || !modInfo.id.trim()} className="w-full sm:w-auto px-6 py-3 text-lg font-bold rounded-lg bg-[var(--bg-interactive)] text-[var(--text-color)] border border-[var(--border-subtle)] font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--bg-interactive-hover)] hover:-translate-y-0.5 shadow-md shadow-black/30 disabled:bg-gray-800 disabled:cursor-not-allowed disabled:text-gray-500">
                        <FaDownload className="inline-block mr-2"/>
                        Tạo & Xuất File
                    </button>
                    <button onClick={handleGenerateWorld} disabled={!prompts.setting.trim() || !modInfo.name.trim() || !modInfo.id.trim()} className="w-full sm:w-auto px-8 py-4 text-xl font-bold rounded-lg bg-[var(--button-primary-bg)] text-[var(--primary-accent-text-color)] border border-[var(--button-primary-border)] font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--button-primary-hover-bg)] hover:-translate-y-0.5 shadow-md shadow-black/30 disabled:bg-gray-600 disabled:cursor-not-allowed">
                        <FaBrain className="inline-block mr-3"/>
                        Kiến Tạo & Cài Đặt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManualGenesisScreen;