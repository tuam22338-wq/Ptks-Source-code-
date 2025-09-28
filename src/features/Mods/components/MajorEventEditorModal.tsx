import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import type { MajorEvent } from '../../../types';

interface MajorEventEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: MajorEvent) => void;
    event: MajorEvent | null;
}

const MajorEventEditorModal: React.FC<MajorEventEditorModalProps> = ({ isOpen, onClose, onSave, event }) => {
    const [formData, setFormData] = useState<MajorEvent>({
        year: 1,
        title: '',
        location: '',
        involvedParties: '',
        summary: '',
        consequences: ''
    });

    useEffect(() => {
        if (isOpen) {
            setFormData(event || {
                year: 1,
                title: '',
                location: '',
                involvedParties: '',
                summary: '',
                consequences: ''
            });
        }
    }, [event, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'year' ? parseInt(value, 10) || 0 : value }));
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
            <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-2xl m-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold p-4 border-b border-gray-700 text-amber-300">{event ? 'Chỉnh Sửa Sự Kiện Lớn' : 'Thêm Sự Kiện Lớn'}</h3>
                <div className="p-4 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-gray-400 mb-1">Tiêu đề</label>
                            <input name="title" value={formData.title} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" disabled={!!event} />
                        </div>
                        <div>
                             <label className="block text-sm font-medium text-gray-400 mb-1">Năm</label>
                            <input name="year" type="number" value={formData.year} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" />
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Địa điểm</label>
                        <input name="location" value={formData.location} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Các bên liên quan</label>
                        <input name="involvedParties" value={formData.involvedParties} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Tóm tắt</label>
                        <textarea name="summary" value={formData.summary} onChange={handleChange} rows={4} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 resize-y"/>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Hệ quả</label>
                        <textarea name="consequences" value={formData.consequences} onChange={handleChange} rows={3} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 resize-y"/>
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

export default MajorEventEditorModal;
