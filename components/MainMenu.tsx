import React from 'react';
import type { View } from '../App';
// FIX: Replaced non-existent icon 'GiEasternDragon' with 'GiSeaDragon' to resolve the import error, as suggested by the compiler.
import { GiSeaDragon } from 'react-icons/gi';

interface MainMenuProps {
  onNavigate: (view: View) => void;
}

const MenuItem: React.FC<{ label: string; onClick: () => void; delay: number }> = ({ label, onClick, delay }) => (
    <button
        onClick={onClick}
        className="text-2xl font-title hover:scale-110 transition-all duration-300 ease-in-out animate-menu-item"
        style={{
            color: 'var(--text-color)',
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
        <div className="relative text-center animate-menu-item" style={{ animationDelay: '100ms' }}>
            {/* Dragon Icons */}
            <GiSeaDragon className="absolute -top-12 -left-20 text-9xl text-[var(--primary-accent-color)]/30 opacity-70 transform -scale-x-100" />
            <GiSeaDragon className="absolute -bottom-12 -right-20 text-9xl text-[var(--primary-accent-color)]/30 opacity-70" />
            
            <h1 
                className="text-6xl sm:text-7xl font-bold font-title bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-amber-400 to-red-400"
                style={{
                    WebkitTextStroke: '1px rgba(0,0,0,0.2)',
                    textShadow: `
                        0px 0px 15px var(--primary-glow-color),
                        0px 2px 2px rgba(0,0,0,0.4)
                    `
                }}
            >
                Phong Thần Ký Sự
            </h1>
            <h2 
                className="text-2xl sm:text-3xl mt-2 tracking-widest font-semibold font-title text-[var(--text-muted-color)] animate-menu-item"
                style={{ animationDelay: '300ms' }}
            >
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