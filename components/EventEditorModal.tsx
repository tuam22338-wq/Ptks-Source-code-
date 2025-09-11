import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import type { ModEvent, EventTrigger, EventOutcome, SkillCheck } from '../types';
import TagEditor from './TagEditor';

interface EventEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: ModEvent) => void;
    eventToEdit: ModEvent | null;
    allAttributes: string[];
    suggestions?: string[];
}

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);

const EventEditorModal: React.FC<EventEditorModalProps> = ({ isOpen, onClose, onSave, eventToEdit, allAttributes, suggestions }) => {
    const [event, setEvent] = useState<ModEvent | null>(null);

    useEffect(() => {
        if (isOpen) {
            const initialEvent = eventToEdit 
                ? JSON.parse(JSON.stringify(eventToEdit))
                : { id: Date.now().toString(), name: '', description: '', choices: [{ text: 'Lựa chọn 1', check: null, outcomes: [] }], tags: [] };
            setEvent(initialEvent);
        }
    }, [isOpen, eventToEdit]);

    if (!isOpen || !event) return null;

    const handleChange = (field: keyof ModEvent, value: any) => {
        setEvent({ ...event, [field]: value });
    };
    
    const handleChoiceChange = (index: number, field: string, value: any) => {
        const newChoices = [...event.choices];
        (newChoices[index] as any)[field] = value;
        handleChange('choices', newChoices);
    };

    const handleAddChoice = () => {
        const newChoices = [...event.choices, { text: `Lựa chọn ${event.choices.length + 1}`, check: null, outcomes: [] }];
        handleChange('choices', newChoices);
    };

    const handleRemoveChoice = (index: number) => {
        const newChoices = event.choices.filter((_, i) => i !== index);
        handleChange('choices', newChoices);
    };

    const handleSaveChanges = () => {
        if (!event.name.trim() || !event.description.trim()) {
            alert("Tên và Mô tả sự kiện không được để trống.");
            return;
        }
        onSave(event);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }}>
            <div className="bg-gray-900/95 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl text-gray-200 font-bold font-title">{eventToEdit ? 'Chỉnh Sửa Sự Kiện' : 'Tạo Sự Kiện Mới'}</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    <FieldWrapper label="Tên Sự Kiện (Định danh)">
                        <input type="text" value={event.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ví dụ: gap_go_khuong_tu_nha" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" />
                    </FieldWrapper>

                    <FieldWrapper label="Mô Tả Tình Huống">
                        <textarea value={event.description} onChange={e => handleChange('description', e.target.value)} rows={3} placeholder="Mô tả bối cảnh và những gì đang xảy ra..." className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" />
                    </FieldWrapper>

                    <FieldWrapper label="Tags">
                        <TagEditor tags={event.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} />
                    </FieldWrapper>

                    <FieldWrapper label="Các Lựa Chọn">
                        <div className="space-y-3">
                            {event.choices.map((choice, index) => (
                                <div key={index} className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold text-gray-300">Lựa chọn #{index + 1}</p>
                                        <button onClick={() => handleRemoveChoice(index)} className="p-1 text-gray-500 hover:text-red-400"><FaTrash /></button>
                                    </div>
                                    <input type="text" value={choice.text} onChange={e => handleChoiceChange(index, 'text', e.target.value)} placeholder="Mô tả lựa chọn" className="w-full bg-gray-800/70 border border-gray-600 rounded px-2 py-1.5 text-sm text-gray-300 mt-1" />
                                    {/* TODO: Add UI for Skill Check and Outcomes */}
                                </div>
                            ))}
                            <button onClick={handleAddChoice} className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-gray-700/80 text-white text-sm font-bold rounded-lg hover:bg-gray-600/80">
                                <FaPlus /> Thêm Lựa Chọn
                            </button>
                        </div>
                    </FieldWrapper>
                     {/* TODO: Add UI for Trigger */}
                </div>

                <div className="p-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80">Hủy</button>
                    <button onClick={handleSaveChanges} className="px-5 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80">
                        <FaSave className="inline mr-2" /> Lưu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventEditorModal;
