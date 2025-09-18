import React, { useState, useEffect } from 'react';
import { FaSave } from 'react-icons/fa';
import type { ModLocation, ModWorldData } from '../../../types';
import TagEditor from '../../../components/TagEditor';

interface WorldContentEditorProps {
    onSave: (content: ModLocation | ModWorldData) => void;
    contentToEdit: ModLocation | ModWorldData;
    contentType: 'location' | 'worldData';
    suggestions?: string[];
}

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode; description?: string }> = ({ label, children, description }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
);

const WorldContentEditor: React.FC<WorldContentEditorProps> = ({ onSave, contentToEdit, contentType, suggestions }) => {
    const [content, setContent] = useState<any>(contentToEdit);
    const [jsonError, setJsonError] = useState<string | null>(null);

    useEffect(() => {
         if (contentType === 'worldData') {
             const stringifiedData = {
                ...contentToEdit,
                majorEvents: JSON.stringify((contentToEdit as ModWorldData).majorEvents || [], null, 2),
                initialLocations: JSON.stringify((contentToEdit as ModWorldData).initialLocations || [], null, 2),
                initialNpcs: JSON.stringify((contentToEdit as ModWorldData).initialNpcs || [], null, 2),
                factions: JSON.stringify((contentToEdit as ModWorldData).factions || [], null, 2),
            };
            setContent(stringifiedData);
        } else {
             setContent(contentToEdit);
        }
    }, [contentToEdit, contentType]);

    const handleChange = (field: string, value: any) => {
        setContent((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleJsonChange = (field: string, value: string) => {
        handleChange(field, value);
        try {
            JSON.parse(value);
            setJsonError(null);
        } catch(e) {
            setJsonError(`Lỗi cú pháp JSON trong trường '${field}'`);
        }
    };

    const handleSaveChanges = () => {
        if (!content.name?.trim()) {
            alert("Tên không được để trống.");
            return;
        }

        if (contentType === 'worldData') {
            try {
                const parsedContent = {
                    ...content,
                    majorEvents: JSON.parse(content.majorEvents),
                    initialLocations: JSON.parse(content.initialLocations),
                    initialNpcs: JSON.parse(content.initialNpcs),
                    factions: JSON.parse(content.factions),
                };
                onSave(parsedContent);
            } catch (e) {
                alert(`Lưu thất bại: JSON không hợp lệ. ${jsonError}`);
            }
        } else {
            onSave(content);
        }
    };
    
    const renderLocationForm = () => (
        <>
            <FieldWrapper label="Tên Địa Điểm">
                <input type="text" value={content.name} onChange={e => handleChange('name', e.target.value)} className="themed-input" />
            </FieldWrapper>
            <FieldWrapper label="Mô tả">
                <textarea value={content.description} onChange={e => handleChange('description', e.target.value)} rows={3} className="themed-textarea" />
            </FieldWrapper>
            <FieldWrapper label="Loại Địa Điểm">
                <select value={content.type} onChange={e => handleChange('type', e.target.value)} className="themed-select">
                    {['Thành Thị', 'Thôn Làng', 'Hoang Dã', 'Sơn Mạch', 'Thánh Địa', 'Bí Cảnh', 'Quan Ải'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </FieldWrapper>
            <div className="grid grid-cols-3 gap-4">
                <FieldWrapper label="Tọa độ X">
                    <input type="number" value={content.coordinates.x} onChange={e => handleChange('coordinates', { ...content.coordinates, x: parseInt(e.target.value) || 0 })} className="themed-input" />
                </FieldWrapper>
                <FieldWrapper label="Tọa độ Y">
                    <input type="number" value={content.coordinates.y} onChange={e => handleChange('coordinates', { ...content.coordinates, y: parseInt(e.target.value) || 0 })} className="themed-input" />
                </FieldWrapper>
                 <FieldWrapper label="Nồng độ Linh Khí">
                    <input type="number" value={content.qiConcentration} onChange={e => handleChange('qiConcentration', parseInt(e.target.value) || 0 )} className="themed-input" />
                </FieldWrapper>
            </div>
             <FieldWrapper label="Hàng xóm (ID địa điểm, cách nhau bằng dấu phẩy)">
                <input type="text" value={(content.neighbors || []).join(', ')} onChange={e => handleChange('neighbors', e.target.value.split(',').map(t=>t.trim()))} className="themed-input" />
            </FieldWrapper>
            <FieldWrapper label="Tags"><TagEditor tags={content.tags || []} onTagsChange={tags => handleChange('tags', tags)} suggestions={suggestions} /></FieldWrapper>
        </>
    );

    const renderWorldDataForm = () => (
        <>
            <FieldWrapper label="Tên Thế Giới / Kịch Bản">
                <input type="text" value={content.name} onChange={e => handleChange('name', e.target.value)} className="themed-input" />
            </FieldWrapper>
            <div className="grid grid-cols-2 gap-4">
                 <FieldWrapper label="Tên Kỷ Nguyên">
                    <input type="text" value={content.eraName} onChange={e => handleChange('eraName', e.target.value)} className="themed-input" />
                </FieldWrapper>
                 <FieldWrapper label="Năm Bắt Đầu">
                    <input type="number" value={content.startingYear} onChange={e => handleChange('startingYear', parseInt(e.target.value) || 1)} className="themed-input" />
                </FieldWrapper>
            </div>
            <FieldWrapper label="Mô Tả Tổng Quan">
                <textarea value={content.description} onChange={e => handleChange('description', e.target.value)} rows={3} className="themed-textarea" />
            </FieldWrapper>
            <FieldWrapper label="Sự Kiện Trọng Đại (JSON)" description="Một mảng các đối tượng MajorEvent.">
                <textarea value={content.majorEvents} onChange={e => handleJsonChange('majorEvents', e.target.value)} rows={5} className="w-full bg-gray-900/80 border rounded-md p-2 font-mono text-xs border-gray-700"/>
            </FieldWrapper>
            <FieldWrapper label="Địa Điểm Ban Đầu (JSON)" description="Một mảng các đối tượng ModLocation.">
                <textarea value={content.initialLocations} onChange={e => handleJsonChange('initialLocations', e.target.value)} rows={5} className="w-full bg-gray-900/80 border rounded-md p-2 font-mono text-xs border-gray-700"/>
            </FieldWrapper>
             <FieldWrapper label="NPC Ban Đầu (JSON)" description="Một mảng các đối tượng ModNpc.">
                <textarea value={content.initialNpcs} onChange={e => handleJsonChange('initialNpcs', e.target.value)} rows={5} className="w-full bg-gray-900/80 border rounded-md p-2 font-mono text-xs border-gray-700"/>
            </FieldWrapper>
             <FieldWrapper label="Phe Phái (JSON)" description="Một mảng các đối tượng Faction.">
                <textarea value={content.factions} onChange={e => handleJsonChange('factions', e.target.value)} rows={5} className="w-full bg-gray-900/80 border rounded-md p-2 font-mono text-xs border-gray-700"/>
            </FieldWrapper>
            {jsonError && <p className="text-red-400 text-sm">{jsonError}</p>}
        </>
    );

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-xl text-rose-400 font-bold font-title mb-4 flex-shrink-0">
                Chỉnh sửa {contentType === 'location' ? 'Địa Điểm' : 'Dữ liệu TG'}: <span className="text-white">{content.name || '(Chưa có tên)'}</span>
            </h3>
            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                {contentType === 'location' ? renderLocationForm() : renderWorldDataForm()}
            </div>
            <div className="pt-4 mt-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                <button onClick={handleSaveChanges} disabled={!!jsonError} className="px-5 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 disabled:bg-gray-600">
                    <FaSave className="inline mr-2" /> Cập nhật
                </button>
            </div>
        </div>
    );
};

export default WorldContentEditor;
