import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import type { ModLocation } from '../../../types';

const LOCATION_TYPES: ModLocation['type'][] = ['Thành Thị', 'Thôn Làng', 'Hoang Dã', 'Sơn Mạch', 'Thánh Địa', 'Bí Cảnh', 'Quan Ải'];

interface LocationEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (location: ModLocation) => void;
    location: ModLocation | null;
}

const LocationEditorModal: React.FC<LocationEditorModalProps> = ({ isOpen, onClose, onSave, location }) => {
    const [formData, setFormData] = useState<Omit<ModLocation, 'id' | 'tags'>>({ name: '', description: '', type: 'Thôn Làng', neighbors: [], coordinates: {x:0, y:0}, qiConcentration: 10 });
    const [neighborsStr, setNeighborsStr] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (location) {
                setFormData(location);
                setNeighborsStr(location.neighbors.join(', '));
            } else {
                setFormData({ name: '', description: '', type: 'Thôn Làng', neighbors: [], coordinates: {x:0, y:0}, qiConcentration: 10 });
                setNeighborsStr('');
            }
        }
    }, [location, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'qiConcentration' ? parseInt(value) : value }));
    };

    const handleSave = () => {
        if (!formData.name.trim()) {
            alert("Tên địa điểm không được để trống.");
            return;
        }
        const finalLocation: ModLocation = {
            ...formData,
            id: location?.id || `loc_${Date.now()}`,
            neighbors: neighborsStr.split(',').map(s => s.trim()).filter(Boolean),
            tags: [],
        };
        onSave(finalLocation);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={onClose}>
            <div className="bg-stone-900 border border-gray-700 rounded-lg shadow-2xl w-full max-w-lg m-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold p-4 border-b border-gray-700" style={{color: 'var(--primary-accent-color)'}}>{location ? 'Chỉnh Sửa Địa Điểm' : 'Thêm Địa Điểm'}</h3>
                <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Tên Địa Điểm" className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2" style={{color: 'var(--text-color)'}} />
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Mô Tả" className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 resize-y" style={{color: 'var(--text-color)'}}/>
                    <select name="type" value={formData.type} onChange={handleChange} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2" style={{color: 'var(--text-color)'}}>
                        {LOCATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <input value={neighborsStr} onChange={e => setNeighborsStr(e.target.value)} placeholder="Hàng xóm (cách nhau bởi dấu phẩy)" className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2" style={{color: 'var(--text-color)'}} />
                    <input name="qiConcentration" type="number" value={formData.qiConcentration} onChange={handleChange} placeholder="Nồng độ Linh khí" className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2" style={{color: 'var(--text-color)'}} />
                </div>
                <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"><FaTimes /> Hủy</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-500"><FaSave /> Lưu</button>
                </div>
            </div>
        </div>
    );
};

export default LocationEditorModal;