import React, { useState, useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';

interface TagEditorProps {
    tags: string[];
    onTagsChange: (tags: string[]) => void;
    suggestions?: string[];
}

const TagEditor: React.FC<TagEditorProps> = ({ tags, onTagsChange, suggestions = [] }) => {
    const [inputValue, setInputValue] = useState('');
    const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputValue.trim() && isFocused) {
            const lowercasedInput = inputValue.toLowerCase();
            setFilteredSuggestions(
                suggestions.filter(s => 
                    s.toLowerCase().includes(lowercasedInput) && !tags.includes(s)
                ).slice(0, 5)
            );
        } else {
            setFilteredSuggestions([]);
        }
    }, [inputValue, suggestions, tags, isFocused]);


    const addTag = (tagToAdd: string) => {
        const trimmedTag = tagToAdd.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            onTagsChange([...tags, trimmedTag]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
            e.preventDefault();
            addTag(inputValue);
            setInputValue('');
            setFilteredSuggestions([]);
        }
    };
    
    const handleBlur = () => {
        setTimeout(() => {
             if (inputValue.trim()) {
                addTag(inputValue);
                setInputValue('');
            }
            setIsFocused(false);
            setFilteredSuggestions([]);
        }, 150);
    };

    const handleSuggestionClick = (suggestion: string) => {
        addTag(suggestion);
        setInputValue('');
        setFilteredSuggestions([]);
        inputRef.current?.focus();
    };


    const removeTag = (tagToRemove: string) => {
        onTagsChange(tags.filter(tag => tag !== tagToRemove));
    };

    return (
        <div className="relative">
            <div className={`flex flex-wrap items-center gap-2 p-2 bg-gray-900/50 border border-gray-600 rounded-md transition-all ${isFocused ? 'ring-1 ring-teal-400/50' : ''}`}>
                {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1.5 px-2 py-1 bg-gray-700 text-gray-200 text-sm rounded-full animate-fade-in" style={{animationDuration: '200ms'}}>
                        {tag}
                        <button onClick={() => removeTag(tag)} className="text-gray-400 hover:text-white">
                            <FaTimes size={12} />
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsFocused(true)}
                    onBlur={handleBlur}
                    placeholder="Thêm tag..."
                    className="flex-grow bg-transparent focus:outline-none text-gray-200 text-sm p-1 min-w-[120px]"
                />
            </div>
            {filteredSuggestions.length > 0 && isFocused && (
                <ul className="absolute z-20 w-full bg-gray-800/95 backdrop-blur-sm border border-gray-700 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg animate-fade-in" style={{ animationDuration: '150ms' }}>
                    {filteredSuggestions.map(suggestion => (
                        <li 
                            key={suggestion} 
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleSuggestionClick(suggestion)} 
                            className="px-3 py-2 cursor-pointer hover:bg-gray-700/80 text-gray-300 text-sm"
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}
            <p className="text-xs text-gray-500 mt-1">Nhấn Enter, Tab, hoặc dấu phẩy để thêm tag.</p>
        </div>
    );
};

export default TagEditor;