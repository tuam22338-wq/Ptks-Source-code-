import React, { useState, useEffect } from 'react';
import { FaSave, FaPlus, FaTrash } from 'react-icons/fa';
import type { AlchemyRecipe, ItemQuality } from '../../../types';

interface RecipeEditorProps {
    onSave: (recipe: AlchemyRecipe) => void;
    recipeToEdit: AlchemyRecipe;
}

const FieldWrapper: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        {children}
    </div>
);

const RecipeEditor: React.FC<RecipeEditorProps> = ({ onSave, recipeToEdit }) => {
    const [recipe, setRecipe] = useState<AlchemyRecipe>(recipeToEdit);

    useEffect(() => {
        setRecipe(recipeToEdit);
    }, [recipeToEdit]);


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
        <div className="flex flex-col h-full">
             <h3 className="text-xl text-yellow-400 font-bold font-title mb-4 flex-shrink-0">
                Chỉnh sửa Đan Phương: <span className="text-white">{recipe.name || '(Chưa có tên)'}</span>
            </h3>
            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FieldWrapper label="Tên Đan Phương">
                        <input type="text" value={recipe.name} onChange={e => handleChange('name', e.target.value)} placeholder="Hồi Khí Đan - Hạ Phẩm" className="themed-input" />
                    </FieldWrapper><FieldWrapper label="Biểu Tượng (Emoji)"><input type="text" value={recipe.icon} onChange={e => handleChange('icon', e.target.value)} className="themed-input" />
                    </FieldWrapper>
                </div>
                <FieldWrapper label="Mô tả">
                    <textarea value={recipe.description} onChange={e => handleChange('description', e.target.value)} rows={2} className="themed-textarea" />
                </FieldWrapper>
                <FieldWrapper label="Nguyên Liệu">
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                        {recipe.ingredients.map((ing, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <input type="text" value={ing.name} onChange={e => handleIngredientChange(index, 'name', e.target.value)} placeholder="Tên nguyên liệu" className="w-2/3 bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-sm"/>
                                <input type="number" value={ing.quantity} onChange={e => handleIngredientChange(index, 'quantity', parseInt(e.target.value) || 1)} className="w-1/3 bg-gray-800/70 border border-gray-600 rounded px-2 py-1 text-sm"/>
                                <button onClick={() => removeIngredient(index)} className="p-1 text-gray-500 hover:text-red-400">
                                    <FaTrash size={12}/>
                                </button>
                            </div>
                        ))}
                    </div>
                    <button onClick={addIngredient} className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 mt-2">
                        <FaPlus size={10} /> Thêm nguyên liệu
                    </button>
                </FieldWrapper>
                <FieldWrapper label="Thành Phẩm">
                    <div className="flex items-center gap-2">
                        <input type="text" value={recipe.result.name} onChange={e => handleChange('result', { ...recipe.result, name: e.target.value })} placeholder="Tên thành phẩm" className="themed-input w-2/3"/>
                        <input type="number" value={recipe.result.quantity} onChange={e => handleChange('result', { ...recipe.result, quantity: parseInt(e.target.value) || 1 })} className="themed-input w-1/3"/>
                    </div>
                </FieldWrapper>
                <FieldWrapper label="Yêu cầu Đan Thuật">
                    <input type="number" value={recipe.requiredAttribute.value} onChange={e => handleChange('requiredAttribute', { ...recipe.requiredAttribute, value: parseInt(e.target.value) || 10 })} className="themed-input"/>
                </FieldWrapper>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-700 flex justify-end gap-3 flex-shrink-0">
                <button onClick={handleSaveChanges} className="px-5 py-2 bg-teal-700/80 text-white font-bold rounded-lg hover:bg-teal-600/80">
                    <FaSave className="inline mr-2" /> Cập Nhật Đan Phương
                </button>
            </div>
        </div>
    );
};

export default RecipeEditor;
