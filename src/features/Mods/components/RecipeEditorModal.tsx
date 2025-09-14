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
                    requiredAttribute: { name: 'Ngự Khí Thuật', value: 10 },
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
                            <input type="text" value={recipe.name} onChange={e => handleChange('name', e.target.value)}