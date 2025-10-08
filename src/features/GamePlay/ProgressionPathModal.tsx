import React from 'react';
// @google-genai-fix: Rename 'CultivationPath' to 'ProgressionPath' to match updated types.
import type { ProgressionPath } from '../../types';

interface ProgressionPathModalProps {
    isOpen: boolean;
    paths: ProgressionPath[];
    onSelectPath: (path: ProgressionPath) => void;
}

const ProgressionPathModal: React.FC<ProgressionPathModalProps> = ({ isOpen, paths, onSelectPath }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div className="bg-stone-900/80 backdrop-blur-lg border border-[var(--panel-border-color)] rounded-xl shadow-2xl shadow-black/50 w-full max-w-4xl m-4 p-6 max-h-[90vh] flex flex-col">
                <h2 className="text-3xl font-bold font-title text-center text-[var(--primary-accent-color)]">Con Đường Rẽ Lối</h2>
                <p className="text-center mt-2 mb-6" style={{color: 'var(--text-muted-color)'}}>Bạn đã đột phá thành công, một con đường mới đã mở ra. Hãy lựa chọn hướng đi cho mình.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pr-2">
                    {paths.map(path => (
                        <div key={path.id} className="bg-black/20 p-5 rounded-xl border-2 border-gray-700/60 flex flex-col h-full transform transition-transform duration-300 hover:-translate-y-1 hover:border-amber-400/80">
                            <h3 className="text-2xl font-bold font-title" style={{color: 'var(--primary-accent-color)'}}>{path.name}</h3>
                            <p className="text-sm mt-2 mb-4 flex-grow" style={{color: 'var(--text-muted-color)'}}>{path.description}</p>
                            <div className="space-y-1 mb-5">
                                <h4 className="font-semibold" style={{color: 'var(--text-color)'}}>Hiệu quả:</h4>
                                {path.bonuses.map((bonus, i) => (
                                    <p key={i} className="text-sm" style={{color: 'var(--secondary-accent-color)'}}>
                                        {bonus.attribute} <span className="font-semibold">{bonus.value > 0 ? `+${bonus.value}` : bonus.value}</span>
                                    </p>
                                ))}
                            </div>
                            <button
                                onClick={() => onSelectPath(path)}
                                className="w-full mt-auto px-6 py-2 bg-[var(--button-primary-bg)] text-[var(--primary-accent-text-color)] border border-[var(--button-primary-border)] rounded-md font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--button-primary-hover-bg)] hover:-translate-y-0.5 shadow-md shadow-black/30 font-bold py-3 px-4 rounded-lg text-lg"
                            >
                                Lựa chọn
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProgressionPathModal;
