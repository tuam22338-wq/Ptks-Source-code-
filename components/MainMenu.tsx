
import React, { useState, useEffect } from 'react';
import type { View } from '../App';
import { GiSeaDragon } from 'react-icons/gi';
import { FaDatabase } from 'react-icons/fa';

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
  const [storageUsage, setStorageUsage] = useState('');

  const calculateLocalStorageUsage = (): string => {
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
            const value = localStorage.getItem(key);
            if (value) {
                totalBytes += (key.length + value.length) * 2; // Each char is 2 bytes (UTF-16)
            }
        }
    }
    
    if (totalBytes < 1024) {
        return `${totalBytes} B`;
    } else if (totalBytes < 1024 * 1024) {
        return `${(totalBytes / 1024).toFixed(2)} KB`;
    } else {
        return `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  };

  useEffect(() => {
    setStorageUsage(calculateLocalStorageUsage());
  }, []);


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

        <div className="absolute bottom-4 left-4 text-xs flex items-center gap-2 text-[var(--text-muted-color)] animate-menu-item" style={{ animationDelay: '1200ms' }}>
            <FaDatabase />
            <span>Dung lượng lưu trữ ước tính: <strong>{storageUsage}</strong></span>
        </div>
    </div>
  );
};

export default MainMenu;
