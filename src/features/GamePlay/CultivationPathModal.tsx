import React from 'react';
import type { CultivationPath } from '../../types';

interface CultivationPathModalProps {
    isOpen: boolean;
    paths: CultivationPath[];
    onSelectPath: (path: CultivationPath) => void;
}

const CultivationPathModal: React.FC<CultivationPathModalProps> = ({ isOpen, paths, onSelectPath }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div className="themed-modal rounded-lg shadow-2xl shadow-black/50 w-full max-w-4xl m-4 p-6 max-h-[90vh] flex flex-col">
                <h2 className="text-3xl font-bold font-title text-center text-amber-300">Thiên Mệnh Rẽ Lối</h2>
                <p className="text-center text-gray-400 mt-2 mb-6">Bạn đã đột phá thành công, một con đường mới đã mở ra. Hãy lựa chọn hướng đi cho mình.</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto pr-2">
                    {paths.map(path => (
                        <div key={path.id} className="bg-black/20 p-5 rounded-xl border-2 border-gray-700/60 flex flex-col h-full transform transition-transform duration-300 hover:-translate-y-1 hover:border-[color:var(--primary-accent-color)]/80">
                            <h3 className="text-2xl font-bold font-title text-amber-400">{path.name}</h3>
                            <p className="text-sm text-gray-400 mt-2 mb-4 flex-grow">{path.description}</p>
                            <div className="space-y-1 mb-5">
                                <h4 className="font-semibold text-gray-300">Hiệu quả:</h4>
                                {path.bonuses.map((bonus, i) => (
                                    <p key={i} className="text-sm text-teal-300">
                                        {bonus.attribute} <span className="font-semibold">{bonus.value > 0 ? `+${bonus.value}` : bonus.value}</span>
                                    </p>
                                ))}
                            </div>
                            <button
                                onClick={() => onSelectPath(path)}
                                className="w-full mt-auto themed-button-primary font-bold py-3 px-4 rounded-lg text-lg"
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

export default CultivationPathModal;