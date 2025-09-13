import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes } from 'react-icons/fa';
import type { ModWorldBuilding } from '../../../types';
import TagEditor from '../../../components/TagEditor';

interface WorldBuildingEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (wb: ModWorldBuilding) => void;
    worldBuildingToEdit: ModWorldBuilding | null;
    suggestions?: string[];
}

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);

const WorldBuildingEditorModal: React.FC<WorldBuildingEditorModalProps> = ({ isOpen, onClose, onSave, worldBuildingToEdit, suggestions }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [jsonString, setJsonString] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [id, setId] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (worldBuildingToEdit) {
                setTitle(worldBuildingToEdit.title);
                setDescription(worldBuildingToEdit.description || '');
                try {
                    setJsonString(JSON.stringify(worldBuildingToEdit.data, null, 2));
                    setParseError(null);
                } catch (error: any) {
                    setJsonString(`{\n  "error": "Không thể hiển thị dữ liệu JSON.",\n  "message": "${error.message}"\n}`);
                    setParseError('Dữ liệu JSON không hợp lệ hoặc chứa cấu trúc không thể tuần tự hóa.');
                }
                setTags(worldBuildingToEdit.tags || []);
                setId(worldBuildingToEdit.id);
            } else {
                setTitle('');
                setDescription('');
                setJsonString('{\n  "key": "value"\n}');
                setTags([]);
                setId(Date.now().toString());
                setParseError(null);
            }
        }
    }, [isOpen, worldBuildingToEdit]);

    if (!isOpen) return null;

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setJsonString(e.target.value);
        try {
            JSON.parse(e.target.value);
            setParseError(null);
        } catch (error: any) {
            setParseError(error.message);
        }
    };
    
    const handleSaveChanges = () => {
        if (!title.trim()) {
            alert("Tiêu đề không được để trống.");
            return;
        }
        try {
            const data = JSON.parse(jsonString);
            onSave({
                id: id || Date.now().toString(),
                title,
                description,
                data,
                tags
            });
        } catch (error) {
            setParseError((error as Error).message);
            alert("Không thể lưu: JSON không hợp lệ.");
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }}>
            <div className="bg-gray-900/95 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl text-gray-200 font-bold font-title">{worldBuildingToEdit ? 'Chỉnh Sửa Dữ Liệu Thế Giới' : 'Tạo Dữ Liệu Thế Giới'}</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    <FieldWrapper label="Tiêu Đề">
                        <input 
                            type="text" 
                            value={title} 
                            onChange={e => setTitle(e.target.value)} 
                            placeholder="Ví dụ: Hệ Thống Kinh Tế Nhà Thương" 
                            className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50" 
                        />
                    </FieldWrapper>
                    <FieldWrapper label="Mô Tả">
                        <textarea 
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Mô tả ngắn gọn về khối dữ liệu này..."
                            className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-teal-400/50"
                        />
                    </FieldWrapper>
                     <FieldWrapper label="Tags (Thẻ)">
                        <TagEditor tags={tags} onTagsChange={setTags} suggestions={suggestions} />
                    </FieldWrapper>
                     <FieldWrapper label="Dữ Liệu (JSON)">
                        <textarea 
                            value={jsonString} 
                            onChange={handleJsonChange} 
                            rows={10}
                            className={`w-full bg-gray-900/80 border rounded-md p-4 text-gray-300 font-mono text-xs focus:outline-none focus:ring-1 transition-all ${parseError ? 'border-red-500/70 focus:ring-red-500/50' : 'border-gray-700 focus:ring-teal-400/50'}`}
                            spellCheck="false"
                        />
                        {parseError && <p className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded-md border border-red-500/30">Lỗi: {parseError}</p>}
                    </FieldWrapper>
                </div>

                <div className="p-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-700/80 text-white font-bold rounded-lg hover:bg-gray-600/80">Hủy</button>
                    <button onClick={handleSaveChanges} disabled={!!parseError} className="px-5 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 disabled:bg-gray-600 disabled:cursor-not-allowed">
                        <FaSave className="inline mr-2" /> Lưu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WorldBuildingEditorModal;