

import React from 'react';
import type { InnerDemonTrial } from '../../../types';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface InnerDemonTrialModalProps {
    isOpen: boolean;
    trial: InnerDemonTrial | null;
    onChoice: (choice: { text: string; isCorrect: boolean }) => void;
}

const InnerDemonTrialModal: React.FC<InnerDemonTrialModalProps> = ({ isOpen, trial, onChoice }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div className="bg-stone-900/80 backdrop-blur-lg border border-[var(--panel-border-color)] rounded-xl shadow-2xl shadow-black/50 w-full max-w-2xl m-4 p-6 flex flex-col">
                <h2 className="text-3xl font-bold font-title text-center text-red-400">Thí Luyện Tâm Ma</h2>
                
                {trial ? (
                    <>
                        <p className="text-center text-gray-300 italic my-6 text-lg">"{trial.challenge}"</p>
                        <div className="space-y-3">
                            {trial.choices.map((choice, index) => (
                                <button
                                    key={index}
                                    onClick={() => onChoice(choice)}
                                    className="w-full text-center px-6 py-2 bg-[var(--button-primary-bg)] text-[var(--primary-accent-text-color)] border border-[var(--button-primary-border)] rounded-md font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--button-primary-hover-bg)] hover:-translate-y-0.5 shadow-md shadow-black/30 font-bold py-3 px-4 rounded-lg text-lg"
                                >
                                    {choice.text}
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="my-8">
                        <LoadingSpinner message="Tâm ma đang hình thành..." size="md" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default InnerDemonTrialModal;