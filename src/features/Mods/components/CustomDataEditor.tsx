import React, { useState, useEffect } from 'react';
import { FaSave } from 'react-icons/fa';
import type { ModCustomDataPack } from '../../../types';

interface CustomDataEditorProps {
    onSave: (dataPack: ModCustomDataPack) => void;
    dataPackToEdit: ModCustomDataPack;
}

const CustomDataEditor: React.FC<CustomDataEditorProps> = ({ onSave, dataPackToEdit }) => {
    const [pack, setPack] = useState<ModCustomDataPack>(dataPackToEdit);
    const [jsonError, setJsonError] = useState<string | null>(null);

    useEffect(() => {
        setPack(dataPackToEdit);
        // Validate JSON when component loads
        try {
            JSON.parse(dataPackToEdit.data);
            setJsonError(null);
        } catch (e) {
            setJsonError('JSON không hợp lệ.');
        }
    }, [dataPackToEdit]);

    const handleChange = (field: keyof ModCustomDataPack, value: string) => {
        if (field === 'data') {
            try {
                JSON.parse(value);
                setJsonError(null);
            } catch (e: any) {
                setJsonError(`Lỗi JSON: ${e.message}`);
            }
        }
        setPack(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveChanges = () => {
        if (!pack.name.trim()) {
            alert("Tên Gói Dữ Liệu không được để trống.");
            return;
        }
        if (jsonError) {
            alert("Không thể lưu: Nội dung JSON không hợp lệ.");
            return;
        }
        onSave(pack);
    };

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-xl text-purple-400 font-bold font-title mb-4 flex-shrink-0">
                Chỉnh sửa Gói Dữ Liệu: <span className="text-white">{pack.name || '(Chưa có tên)'}</span>
            </h3>
            <div className="flex-grow flex flex-col space-y-4 min-h-0">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tên Gói Dữ Liệu</label>
                    <input
                        type="text"
                        value={pack.name}
                        onChange={e => handleChange('name', e.target.value)}
                        className="themed-input"
                    />
                </div>
                <div className="flex-grow flex flex-col min-h-0">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Nội dung (JSON)</label>
                    <textarea
                        value={pack.data}
                        onChange={e => handleChange('data', e.target.value)}
                        placeholder='{ "items": [ ... ], "npcs": [ ... ] }'
                        className={`w-full flex-grow bg-gray-900/80 border rounded-md p-3 font-mono text-sm whitespace-pre-wrap ${jsonError ? 'border-red-500' : 'border-gray-700'}`}
                        spellCheck="false"
                    />
                    {jsonError && <p className="text-red-400 text-xs mt-1">{jsonError}</p>}
                </div>
            </div>
            <div className="pt-4 mt-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                <button
                    onClick={handleSaveChanges}
                    disabled={!!jsonError}
                    className="px-5 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80 disabled:bg-gray-600"
                >
                    <FaSave className="inline mr-2" /> Cập Nhật Gói Dữ Liệu
                </button>
            </div>
        </div>
    );
};

export default CustomDataEditor;
