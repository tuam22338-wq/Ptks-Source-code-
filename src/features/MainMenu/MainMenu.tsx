import React, { memo } from 'react';
import type { View } from '../../App';
import { GiSeaDragon } from 'react-icons/gi';
import { FaDatabase } from 'react-icons/fa';

interface MainMenuProps {
  onNavigate: (view: View) => void;
  storageUsage: {
    usageString: string;
    percentage: number;
  };
}

const MenuItem: React.FC<{ label: string; onClick: () => void; delay: number }> = memo(({ label, onClick, delay }) => (
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
));

const MainMenu: React.FC<MainMenuProps> = ({ onNavigate, storageUsage }) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center animate-fade-in-menu">
        <div className="relative text-center animate-menu-item" style={{ animationDelay: '100ms' }}>
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
            <MenuItem label="Thông Tin" onClick={() => onNavigate('info')} delay={1100} />
        </div>

        <div className="absolute bottom-4 left-4 text-xs w-64 animate-menu-item" style={{ animationDelay: '1200ms' }}>
            <div className="flex items-center justify-between gap-2 text-[var(--text-muted-color)] mb-1">
                <div className="flex items-center gap-1">
                    <FaDatabase />
                    <span>Dung lượng lưu trữ:</span>
                </div>
                <strong className="font-mono">{storageUsage.usageString}</strong>
            </div>
            <div className="w-full bg-black/30 rounded-full h-1.5 border border-gray-700">
                <div 
                    className={`h-1 rounded-full transition-all duration-500 ${storageUsage.percentage > 85 ? 'bg-gradient-to-r from-amber-500 to-red-600' : 'bg-gradient-to-r from-teal-500 to-amber-500'}`}
                    style={{ width: `${storageUsage.percentage}%` }}
                ></div>
            </div>
        </div>
    </div>
  );
};

export default memo(MainMenu);