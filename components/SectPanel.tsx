import React from 'react';

const SectPanel: React.FC = () => {
    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
             <div>
                <h3 className="text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                    Tông Môn
                </h3>
                <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60 text-center">
                    <p className="text-gray-500">Bạn chưa gia nhập tông môn nào.</p>
                </div>
            </div>
        </div>
    );
};

export default SectPanel;
