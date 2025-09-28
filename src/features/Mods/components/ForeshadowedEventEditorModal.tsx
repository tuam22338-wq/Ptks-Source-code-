import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import type { ModForeshadowedEvent } from '../../../types';

interface ForeshadowedEventEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: ModForeshadowedEvent) => void;
    event: ModForeshadowedEvent | null;
}

const CHANCE_OPTIONS: ModForeshadowedEvent['chance'][] = ['Thấp', 'Vừa', 'Cao', 'Chắc chắn'];

const ForeshadowedEventEditorModal: React.FC<ForeshadowedEventEditorModalProps> = ({ isOpen, onClose, onSave, event }) => {
    const [formData, setFormData] = useState<ModForeshadowedEvent>({
        title: '',
        description: '',
        relativeTriggerDay: 30,
        chance: 'Vừa'
    });

    useEffect(() => {
        if (isOpen) {
            setFormData(event || {
                title: '',
                description: '',
                relativeTriggerDay: 30,
                chance: 'Vừa'
            });
        }
    }, [event, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'relativeTriggerDay' ? parseInt(value, 10) || 0 : value }));
    };

    const handleSave = () => {
        if (!formData.title.trim()) {
            alert("Tiêu đề sự kiện không được để trống.");
            return;
        }
        onSave(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-xl m-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold p-4 border-b border-gray-700 text-amber-300">{event ? 'Chỉnh Sửa Sự Kiện Tương Lai' : 'Thêm Sự Kiện Tương Lai'}</h3>
                <div className="p-4 overflow-y-auto space-y-4">
                    <div>
                         <label className="block text-sm font-medium text-gray-400 mb-1">Tiêu đề</label>
                        <input name="title" value={formData.title} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" disabled={!!event} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Mô tả (Gợi ý cho người chơi)</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 resize-y"/>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Ngày dự kiến (từ lúc bắt đầu)</label>
                            <input name="relativeTriggerDay" type="number" value={formData.relativeTriggerDay} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Xác suất xảy ra</label>
                            <select name="chance" value={formData.chance} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 pr-8 appearance-none">
                                {CHANCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"><FaTimes /> Hủy</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500"><FaSave /> Lưu</button>
                </div>
            </div>
        </div>
    );
};

export default ForeshadowedEventEditorModal;
