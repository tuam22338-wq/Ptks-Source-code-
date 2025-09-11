import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaPlus, FaTrash, FaDiceD20 } from 'react-icons/fa';
import type { ModEvent, EventChoice, EventOutcome, EventOutcomeType, SkillCheck } from '../types';
import TagEditor from './TagEditor';

interface EventEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: ModEvent) => void;
    eventToEdit: ModEvent | null;
    allAttributes: string[];
    suggestions?: string[];
}

const OUTCOME_TYPES: EventOutcomeType[] = ['GIVE_ITEM', 'REMOVE_ITEM', 'CHANGE_STAT', 'ADD_RUMOR', 'START_EVENT'];

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);

// FIX: Define a local type for the component's state to include a temporary `id` for each choice, resolving type errors.
type EditableChoice = Omit<EventChoice, 'id'> & { id: string, outcomes?: EventOutcome[] };
type EditableModEvent = Omit<ModEvent, 'choices'> & { choices: EditableChoice[] };


const EventEditorModal: React.FC<EventEditorModalProps> = ({ isOpen, onClose, onSave, eventToEdit, allAttributes, suggestions }) => {
    const [event, setEvent] = useState<EditableModEvent | null>(null);

    useEffect(() => {
        if (isOpen) {
            // FIX: When initializing state, add a unique temporary `id` to each choice for UI management.
            const initialEvent = eventToEdit 
                ? {
                    ...JSON.parse(JSON.stringify(eventToEdit)),
                    choices: (eventToEdit.choices || []).map((c, i) => ({ ...c, id: `${Date.now()}-${i}`}))
                  }
                : { id: Date.now().toString(), name: '', description: '', choices: [{ id: Date.now().toString(), text: 'Lựa chọn 1', check: null, outcomes: [] }], tags: [] };
            setEvent(initialEvent);
        }
    }, [isOpen, eventToEdit]);

    if (!isOpen || !event) return null;

    const handleChange = (field: keyof ModEvent, value: any) => {
        setEvent({ ...event, [field]: value });
    };

    const handleChoiceChange = <T extends keyof EditableChoice>(choiceId: string, field: T, value: EditableChoice[T]) => {
        const newChoices = event.choices.map(c => c.id === choiceId ? { ...c, [field]: value } : c);
        handleChange('choices', newChoices);
    };

    const handleAddChoice = () => {
        const newChoices = [...event.choices, { id: Date.now().toString(), text: `Lựa chọn ${event.choices.length + 1}`, check: null, outcomes: [] }];
        handleChange('choices', newChoices);
    };

    const handleRemoveChoice = (choiceId: string) => {
        const newChoices = event.choices.filter(c => c.id !== choiceId);
        handleChange('choices', newChoices);
    };

    const handleOutcomeChange = (choiceId: string, outcomeIndex: number, field: keyof EventOutcome, value: any) => {
        const newChoices = event.choices.map(c => {
            if (c.id === choiceId) {
                const newOutcomes = [...(c.outcomes || [])];
                const newOutcome = { ...newOutcomes[outcomeIndex], [field]: value };
                
                // If the field is 'details', try to parse it as JSON
                if (field === 'details' && typeof value === 'string') {
                    try {
                        newOutcome.details = JSON.parse(value);
                    } catch (e) {
                        // Keep it as a string if parsing fails, maybe show an error in the UI
                    }
                }
                
                newOutcomes[outcomeIndex] = newOutcome;
                return { ...c, outcomes: newOutcomes };
            }
            return c;
        });
        handleChange('choices', newChoices);
    };
    
    const handleAddOutcome = (choiceId: string) => {
        const newOutcome: EventOutcome = { type: 'CHANGE_STAT', details: { attribute: 'Chính Đạo', change: 1 } };
        const newChoices = event.choices.map(c => 
            c.id === choiceId ? { ...c, outcomes: [...(c.outcomes || []), newOutcome] } : c
        );
        handleChange('choices', newChoices);
    };

    const handleRemoveOutcome = (choiceId: string, outcomeIndex: number) => {
        const newChoices = event.choices.map(c => {
            if (c.id === choiceId) {
                return { ...c, outcomes: (c.outcomes || []).filter((_, i) => i !== outcomeIndex) };
            }
            return c;
        });
        handleChange('choices', newChoices);
    };

    const handleSaveChanges = () => {
        if (!event.name.trim() || !event.description.trim()) {
            alert("Tên và Mô tả sự kiện không được để trống.");
            return;
        }
        // FIX: Strip the temporary `id` from choices before saving to conform to the `ModEvent` type.
        const eventToSave: ModEvent = {
            ...event,
            choices: event.choices.map(({ id, ...rest }) => rest)
        };
        onSave(eventToSave);
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
                            {event.choices.map((choice) => (
                                <div key={choice.id} className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                                    <div className="flex justify-between items-center">
                                        <input type="text" value={choice.text} onChange={e => handleChoiceChange(choice.id, 'text', e.target.value)} placeholder="Mô tả lựa chọn" className="w-full bg-transparent font-semibold text-gray-300 focus:outline-none" />
                                        <button onClick={() => handleRemoveChoice(choice.id)} className="p-1 text-gray-500 hover:text-red-400"><FaTrash /></button>
                                    </div>
                                    {/* Skill Check UI */}
                                    <div className="pl-4 mt-2">
                                        <div className="flex items-center gap-2">
                                            <FaDiceD20 className="text-gray-400"/>
                                            <span className="text-sm text-gray-400">Kiểm tra Thuộc tính:</span>
                                            {choice.check ? (
                                                <div className="flex items-center gap-2">
                                                    <select value={choice.check.attribute} onChange={e => handleChoiceChange(choice.id, 'check', { ...choice.check!, attribute: e.target.value })} className="bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300">
                                                        {allAttributes.map(attr => <option key={attr} value={attr}>{attr}</option>)}
                                                    </select>
                                                    <input type="number" value={choice.check.difficulty} onChange={e => handleChoiceChange(choice.id, 'check', { ...choice.check!, difficulty: parseInt(e.target.value) || 10 })} className="w-20 bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300" placeholder="DC"/>
                                                    <button onClick={() => handleChoiceChange(choice.id, 'check', null)} className="p-1 text-gray-500 hover:text-white"><FaTimes/></button>
                                                </div>
                                            ) : (
                                                <button onClick={() => handleChoiceChange(choice.id, 'check', { attribute: allAttributes[0], difficulty: 10 })} className="text-xs text-teal-400 hover:text-teal-300">Thêm</button>
                                            )}
                                        </div>
                                    </div>
                                    {/* Outcomes UI */}
                                     <div className="pl-4 mt-2">
                                        <h5 className="text-sm text-gray-400 mb-1">Kết quả:</h5>
                                        <div className="space-y-2">
                                            {(choice.outcomes || []).map((outcome, oIndex) => (
                                                <div key={oIndex} className="bg-gray-900/50 p-2 rounded-md border border-gray-700/50">
                                                    <div className="flex items-center gap-2">
                                                        <select value={outcome.type} onChange={e => handleOutcomeChange(choice.id, oIndex, 'type', e.target.value as EventOutcomeType)} className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300">
                                                            {OUTCOME_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                        </select>
                                                        <textarea 
                                                            value={typeof outcome.details === 'string' ? outcome.details : JSON.stringify(outcome.details, null, 2)} 
                                                            onChange={e => handleOutcomeChange(choice.id, oIndex, 'details', e.target.value)} 
                                                            rows={2} 
                                                            placeholder="Chi tiết (JSON)"
                                                            className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs text-gray-300 font-mono"
                                                        />
                                                        <button onClick={() => handleRemoveOutcome(choice.id, oIndex)} className="p-1 text-gray-500 hover:text-red-400"><FaTrash size={12}/></button>
                                                    </div>
                                                </div>
                                            ))}
                                            <button onClick={() => handleAddOutcome(choice.id)} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 mt-2">
                                                <FaPlus size={10} /> Thêm kết quả
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button onClick={handleAddChoice} className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-gray-700/80 text-white text-sm font-bold rounded-lg hover:bg-gray-600/80">
                                <FaPlus /> Thêm Lựa Chọn
                            </button>
                        </div>
                    </FieldWrapper>
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
