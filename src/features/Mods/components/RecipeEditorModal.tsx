import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaPlus, FaTrash } from 'react-icons/fa';
import type { AlchemyRecipe, ItemQuality } from '../../../types';

interface RecipeEditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (recipe: AlchemyRecipe) => void;
    recipeToEdit: AlchemyRecipe | null;
}

const ITEM_QUALITIES: ItemQuality[] = ['Phàm Phẩm', 'Linh Phẩm', 'Pháp Phẩm', 'Bảo Phẩm', 'Tiên Phẩm', 'Tuyệt Phẩm'];

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);

const RecipeEditorModal: React.FC<RecipeEditorModalProps> = ({ isOpen, onClose, onSave, recipeToEdit }) => {
    const [recipe, setRecipe] = useState<AlchemyRecipe | null>(null);

    useEffect(() => {
        if (isOpen) {
            const initialRecipe = recipeToEdit 
                ? JSON.parse(JSON.stringify(recipeToEdit))
                : { 
                    id: Date.now().toString(), 
                    name: '', 
                    description: '', 
                    ingredients: [{ name: '', quantity: 1 }],
                    result: { name: '', quantity: 1 },
                    requiredAttribute: { name: 'Đan Thuật', value: 10 },
                    icon: '📜',
                    qualityCurve: [{ threshold: 50, quality: 'Linh Phẩm' }]
                  };
            setRecipe(initialRecipe);
        }
    }, [isOpen, recipeToEdit]);

    if (!isOpen || !recipe) return null;

    const handleChange = (field: keyof AlchemyRecipe, value: any) => {
        setRecipe({ ...recipe, [field]: value });
    };

    const handleIngredientChange = (index: number, field: 'name' | 'quantity', value: string | number) => {
        const newIngredients = [...recipe.ingredients];
        newIngredients[index] = { ...newIngredients[index], [field]: value };
        handleChange('ingredients', newIngredients);
    };

    const addIngredient = () => {
        handleChange('ingredients', [...recipe.ingredients, { name: '', quantity: 1 }]);
    };
    
    const removeIngredient = (index: number) => {
        handleChange('ingredients', recipe.ingredients.filter((_, i) => i !== index));
    };

    const handleSaveChanges = () => {
        if (!recipe.name.trim()) {
            alert("Tên Đan Phương không được để trống.");
            return;
        }
        onSave(recipe);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in" style={{ animationDuration: '200ms' }}>
            <div className="bg-gray-900/95 border border-gray-700 rounded-lg shadow-2xl shadow-black/50 w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
                    <h3 className="text-xl text-gray-200 font-bold font-title">{recipeToEdit ? 'Chỉnh Sửa Đan Phương' : 'Tạo Đan Phương Mới'}</h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FieldWrapper label="Tên Đan Phương">
                            <input type="text" value={recipe.name} onChange={e => handleChange('name', e.target.value)} placeholder="Hồi Khí Đan - Hạ Phẩm" className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" />
                        </FieldWrapper>
                         <FieldWrapper label="Biểu Tượng (Emoji)">
                            <input type="text" value={recipe.icon} onChange={e => handleChange('icon', e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" />
                        </FieldWrapper>
                    </div>
                     <FieldWrapper label="Mô tả">
                        <textarea value={recipe.description} onChange={e => handleChange('description', e.target.value)} rows={2} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200" />
                    </FieldWrapper>
                     <FieldWrapper label="Nguyên Liệu">
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {recipe.ingredients.map((ing, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <input type="text" value={ing.name} onChange={e => handleIngredientChange(index, 'name', e.target.value)} placeholder="Tên nguyên liệu" className="w-2/3 bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-sm"/>
                                    <input type="number" value={ing.quantity} onChange={e => handleIngredientChange(index, 'quantity', parseInt(e.target.value) || 1)} className="w-1/3 bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-sm"/>
                                    <button onClick={() => removeIngredient(index)} className="p-1 text-gray-500 hover:text-red-400"><FaTrash size={12}/></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={addIngredient} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 mt-2"><FaPlus size={10} /> Thêm nguyên liệu</button>
                    </FieldWrapper>
                     <FieldWrapper label="Thành Phẩm">
                         <div className="flex items-center gap-2">
                             <input type="text" value={recipe.result.name} onChange={e => handleChange('result', { ...recipe.result, name: e.target.value })} placeholder="Tên thành phẩm" className="w-2/3 bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200"/>
                             <input type="number" value={recipe.result.quantity} onChange={e => handleChange('result', { ...recipe.result, quantity: parseInt(e.target.value) || 1 })} className="w-1/3 bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200"/>
                        </div>
                    </FieldWrapper>
                     <FieldWrapper label="Yêu cầu Đan Thuật">
                         <input type="number" value={recipe.requiredAttribute.value} onChange={e => handleChange('requiredAttribute', { ...recipe.requiredAttribute, value: parseInt(e.target.value) || 10 })} className="w-full bg-gray-800/50 border border-gray-600 rounded px-3 py-2 text-gray-200"/>
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

export default RecipeEditorModal;
