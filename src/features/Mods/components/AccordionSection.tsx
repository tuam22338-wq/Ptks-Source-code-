import React from 'react';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface AccordionSectionProps {
    title: string;
    secondaryText?: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, secondaryText, isOpen, onToggle, children }) => {
    return (
        <div className="bg-black/20 rounded-lg border border-gray-700/80 transition-all duration-300">
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center p-4 text-left text-xl font-semibold font-title text-gray-200 hover:bg-gray-800/20 rounded-t-lg"
                aria-expanded={isOpen}
            >
                <div className="flex items-baseline gap-3">
                    <span>{title}</span>
                    {secondaryText && <span className="text-sm font-normal text-gray-500">{secondaryText}</span>}
                </div>
                {isOpen ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {isOpen && (
                <div className="p-4 border-t border-gray-700/80 animate-fade-in" style={{animationDuration: '300ms'}}>
                    <div className="space-y-4">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccordionSection;
