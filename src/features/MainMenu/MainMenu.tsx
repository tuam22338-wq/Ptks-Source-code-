


import React, { memo, useState, useEffect } from 'react';
import { FaDatabase, FaGlobe, FaTools, FaCog, FaInfoCircle, FaBookOpen, FaDiscord, FaHeart, FaTrophy, FaPenFancy, FaSave, FaBrain, FaCode } from 'react-icons/fa';
import { GiScrollUnfurled, GiCircleClaws } from 'react-icons/gi';
import { useAppContext } from '../../contexts/AppContext';
import UpdateModal from './UpdateModal';
import * as db from '../../services/dbService';
import { CURRENT_GAME_VERSION } from '../../constants';

const topDonors = [
    { name: 'moondainhan', rank: 1, icon: FaTrophy, color: 'text-yellow-400', glow: 'shadow-[0_0_15px_rgba(250,204,21,0.7)]' },
    { name: 'Cừu đồng', rank: 2, icon: FaTrophy, color: 'text-gray-300', glow: 'shadow-[0_0_10px_rgba(209,213,219,0.6)]' },
    { name: 'túi mật đầy sỏi và mink', rank: 3, icon: FaTrophy, color: 'text-amber-600', glow: 'shadow-[0_0_8px_rgba(209,150,91,0.6)]' }
];

const DonateModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="modal-overlay">
            <div className="modal-content max-w-md">
                <div className="modal-body text-center">
                    <div className="mb-4">
                        <FaHeart className="text-4xl text-red-400 mx-auto mb-2" />
                        <h2 className="text-3xl font-bold font-title text-[var(--primary-accent-color)]">Ủng Hộ Tác Giả</h2>
                    </div>
                    <div className="my-4 space-y-2" style={{color: 'var(--text-color)'}}>
                        <p>Nếu vị đạo hữu có lòng donate thì stk đây nhé</p>
                        <div className="mt-4 text-xl font-bold p-4 rounded-lg input-neumorphic">
                            <p className="text-lg text-[var(--text-muted-color)]">MB BANK</p>
                            <p className="text-2xl font-mono tracking-wider my-2 text-[var(--primary-accent-color)]">0337892181</p>
                            <p>NGUYEN HOANG TRUONG</p>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[var(--shadow-light)]">
                        <h3 className="text-2xl font-bold font-title text-[var(--primary-accent-color)] mb-3">Phú Hào Bảng</h3>
                        <div className="space-y-3">
                            {topDonors.map((donor) => (
                                <div key={donor.rank} className="flex items-center gap-4 p-3 rounded-lg" style={{boxShadow: 'var(--shadow-pressed)'}}>
                                    <donor.icon className={`text-3xl ${donor.color} ${donor.glow} animate-pulse`} style={{ animationDuration: '2s' }} />
                                    <span className="text-lg font-semibold text-[var(--text-color)] text-left">{donor.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="btn btn-primary w-full">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

const menuItems = [
    { label: "Tạo Thế Giới Mới", icon: GiScrollUnfurled, view: 'saveSlots' as const, delay: 500 },
    { label: "Tải Game", icon: FaSave, view: 'loadGame' as const, delay: 650 },
    { label: "Scripts", icon: FaCode, view: 'scripts' as const, delay: 800 },
    { label: "Tiểu Thuyết Gia AI", icon: FaPenFancy, view: 'novelist' as const, delay: 950 },
    { label: "Huấn Luyện AI", icon: FaBrain, view: 'aiTraining' as const, delay: 1100 },
    { label: "Cài Đặt", icon: FaCog, view: 'settings' as const, delay: 1250 },
    { label: "Thông Tin", icon: FaInfoCircle, view: 'info' as const, delay: 1400 },
    { label: "Discord", icon: FaDiscord, href: 'https://discord.gg/sPq3Y37eR7', delay: 1550 },
    { label: "Ủng Hộ", icon: FaHeart, action: 'donate' as const, delay: 1700 },
];

const MainMenu: React.FC = () => {
  const { handleNavigate, state } = useAppContext();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      const lastDismissedVersion = await db.getLastDismissedUpdate();
      if (lastDismissedVersion !== CURRENT_GAME_VERSION) {
        setIsUpdateModalOpen(true);
      }
    };
    checkVersion();
  }, []);
  
  const handleCloseUpdateModal = () => {
    setIsUpdateModalOpen(false);
  };

  const handleDismissUpdatePermanently = () => {
    db.setLastDismissedUpdate(CURRENT_GAME_VERSION);
    setIsUpdateModalOpen(false);
  };

  const handleMenuItemClick = (item: (typeof menuItems)[0]) => {
      if ('view' in item && item.view) {
          handleNavigate(item.view);
      } else if ('href' in item && item.href) {
          window.open(item.href, '_blank');
      } else if ('action' in item && item.action === 'donate') {
          setIsDonateModalOpen(true);
      }
  };

  return (
    <div className="w-full flex flex-col items-center justify-center overflow-hidden h-full min-h-0">
        {isUpdateModalOpen && <UpdateModal onClose={handleCloseUpdateModal} onDismissPermanently={handleDismissUpdatePermanently} />}
        {isDonateModalOpen && <DonateModal onClose={() => setIsDonateModalOpen(false)} />}
        <div className="relative z-10 w-full max-w-7xl px-4 flex flex-col items-center justify-center space-y-8 md:space-y-12 animate-fade-in-menu">
            <div className="text-center p-8 relative animate-menu-item" style={{ animationDelay: '100ms' }}>
                <GiCircleClaws className="text-red-900/70 text-5xl sm:text-6xl absolute top-0 right-0 transform rotate-12 opacity-90 -translate-y-1/4 translate-x-1/4" />
                <h1 className="main-menu-title">
                    Tam Thiên<br/>Thế Giới
                </h1>
                <h2 
                    className="text-2xl sm:text-3xl mt-4 tracking-widest font-semibold font-title text-[var(--text-muted-color)] animate-menu-item"
                    style={{ animationDelay: '300ms' }}
                >
                    Khởi Nguyên
                </h2>
            </div>

            <div className="flex flex-col items-center space-y-3 md:space-y-4">
                {menuItems.map(item => (
                    <button 
                        key={item.label}
                        onClick={() => handleMenuItemClick(item)}
                        className="btn btn-neumorphic w-72 h-16 text-xl font-title animate-menu-item"
                        style={{ animationDelay: `${item.delay}ms` }}
                    >
                        <item.icon className="absolute left-4 text-2xl" />
                        <span className="transition-transform duration-300 group-hover:translate-x-3">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="absolute bottom-4 left-4 text-xs w-64 animate-menu-item" style={{ animationDelay: '2000ms' }}>
            <div className="flex items-center justify-between gap-2 text-[var(--text-muted-color)] mb-1">
                <div className="flex items-center gap-1">
                    <FaDatabase />
                    <span>Dung lượng lưu trữ:</span>
                </div>
                <strong className="font-mono">{state.storageUsage.usageString}</strong>
            </div>
            <div className="w-full h-2 rounded-full" style={{boxShadow: 'var(--shadow-pressed)'}}>
                <div 
                    className={`h-full rounded-full transition-all duration-500`}
                    style={{ 
                        width: `${state.storageUsage.percentage}%`,
                        background: state.storageUsage.percentage > 85 ? 'linear-gradient(to right, var(--primary-accent-color), var(--error-color))' : 'var(--primary-accent-color)'
                    }}
                ></div>
            </div>
        </div>
    </div>
  );
};

export default memo(MainMenu);