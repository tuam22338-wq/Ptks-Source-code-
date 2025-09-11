import React from 'react';
import type { View } from '../App';

interface MainMenuProps {
  onNavigate: (view: View) => void;
}

const MenuItem: React.FC<{ label: string; onClick: () => void; delay: number }> = ({ label, onClick, delay }) => (
    <button
        onClick={onClick}
        className="text-2xl font-title text-gray-300 hover:text-white hover:scale-110 transition-all duration-300 ease-in-out animate-menu-item"
        style={{
            textShadow: '0 1px 5px rgba(0,0,0,0.7)',
            animationDelay: `${delay}ms`
        }}
    >
        {label}
    </button>
);

const MainMenu: React.FC<MainMenuProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center animate-fade-in-menu">
        <div className="text-center">
            <h1 className="text-6xl sm:text-7xl font-bold text-gray-200 font-title animate-menu-item" style={{textShadow: '0 2px 5px rgba(0,0,0,0.5)', animationDelay: '100ms'}}>
                Phong Thần Ký Sự
            </h1>
            <h2 className="text-2xl sm:text-3xl text-gray-400 mt-2 tracking-widest font-semibold font-title animate-menu-item" style={{animationDelay: '300ms'}}>
                Khởi Nguyên
            </h2>
        </div>
        <div className="flex flex-col items-center space-y-6 mt-16">
            <MenuItem label="Hành Trình Mới" onClick={() => onNavigate('saveSlots')} delay={500} />
            <MenuItem label="Mods" onClick={() => onNavigate('mods')} delay={650} />
            <MenuItem label="Thiên Mệnh" onClick={() => onNavigate('lore')} delay={800} />
            <MenuItem label="Cài Đặt" onClick={() => onNavigate('settings')} delay={950} />
        </div>
    </div>
  );
};

export default MainMenu;
