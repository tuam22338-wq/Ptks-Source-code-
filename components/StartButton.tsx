import React from 'react';

interface StartButtonProps {
  onClick: () => void;
}

const StartButton: React.FC<StartButtonProps> = ({ onClick }) => {
  return (
    <div className="flex justify-center my-6">
      <button
        onClick={onClick}
        className="w-48 h-20 bg-[#a03d35] text-white text-2xl font-bold font-title
                   rounded-md border-2 border-[#6e2a24]
                   transition-all duration-300 ease-in-out transform hover:scale-105 hover:bg-[#b5453d]
                   shadow-lg shadow-black/20"
        style={{
          textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)',
        }}
      >
        Khởi Hành
      </button>
    </div>
  );
};

export default StartButton;