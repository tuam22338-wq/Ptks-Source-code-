import React, { memo } from 'react';
import { FaDatabase } from 'react-icons/fa';
import { useAppContext } from '../../contexts/AppContext';

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

const MainMenu: React.FC = () => {
  const { handleNavigate, storageUsage } = useAppContext();
  return (
    <div className="min-h-[calc(var(--vh,1vh)*100)] w-full flex flex-col items-center justify-center animate-fade-in-menu">
        <div className="relative text-center animate-menu-item" style={{ animationDelay: '100ms' }}>
            
            <h1 
                className="text-6xl sm:text-7xl font-bold font-title bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-[var(--primary-accent-color)] to-amber-500"
                style={{
                    textShadow: `
                        0px 0px 15px var(--primary-glow-color),
                        0px 2px 2px rgba(0,0,0,0.4)
                    `
                }}
            >
                Tam Thiên Thế Giới
            </h1>
            <h2 
                className="text-2xl sm:text-3xl mt-2 tracking-widest font-semibold font-title text-[var(--text-muted-color)] animate-menu-item"
                style={{ animationDelay: '300ms' }}
            >
                Khởi Nguyên
            </h2>
        </div>
        <div className="flex flex-col items-center space-y-6 mt-16">
            <MenuItem label="Hành Trình Mới" onClick={() => handleNavigate('saveSlots')} delay={500} />
            <MenuItem label="Thế Giới" onClick={() => handleNavigate('worldSelection')} delay={650} />
            <MenuItem label="Mods" onClick={() => handleNavigate('mods')} delay={800} />
            <MenuItem label="Thời Thế" onClick={() => handleNavigate('thoiThe')} delay={950} />
            <MenuItem label="Cài Đặt" onClick={() => handleNavigate('settings')} delay={1100} />
            <MenuItem label="Thông Tin" onClick={() => handleNavigate('info')} delay={1250} />
        </div>

        <div className="absolute bottom-4 left-4 text-xs w-64 animate-menu-item" style={{ animationDelay: '1200ms' }}>
            <div className="flex items-center justify-between gap-2 text-[var(--text-muted-color)] mb-1">
                <div className="flex items-center gap-1">
                    <FaDatabase />
                    <span>Dung lượng lưu trữ:</span>
                </div>
                <strong className="font-mono">{storageUsage.usageString}</strong>
            </div>
            <div className="w-full bg-[var(--bg-interactive)] rounded-full h-1.5 border border-[var(--border-subtle)]">
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