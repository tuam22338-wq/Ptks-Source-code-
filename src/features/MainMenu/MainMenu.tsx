
import React, { memo, useState, useEffect } from 'react';
import { FaDatabase, FaGlobe, FaTools, FaCog, FaInfoCircle, FaBookOpen, FaDiscord, FaHeart } from 'react-icons/fa';
import { GiScrollUnfurled, GiCircleClaws } from 'react-icons/gi';
import { useAppContext } from '../../contexts/AppContext';
import UpdateModal from './UpdateModal';
import * as db from '../../services/dbService';
import { CURRENT_GAME_VERSION } from '../../constants';

const DonateModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div className="themed-modal w-full max-w-md m-4 p-6 flex flex-col relative text-center">
                <div className="mb-4">
                    <FaHeart className="text-4xl text-red-400 mx-auto mb-2" />
                    <h2 className="text-3xl font-bold font-title text-red-300">Ủng Hộ Tác Giả</h2>
                </div>
                <div className="text-gray-300 my-4 space-y-2">
                    <p>Nếu vị đạo hữu có lòng donate thì stk đây nhé</p>
                    <div className="mt-4 text-xl font-bold bg-black/20 p-4 rounded-lg border border-gray-600 text-amber-300">
                        <p className="text-lg">MB BANK</p>
                        <p className="text-2xl font-mono tracking-wider my-2">0337892181</p>
                        <p>NGUYEN HOANG TRUONG</p>
                    </div>
                </div>
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-8 py-2 themed-button-primary font-bold rounded-lg"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

const menuItems = [
    { label: "Hành Trình Mới", icon: GiScrollUnfurled, view: 'saveSlots' as const, delay: 500 },
    { label: "Thế Giới", icon: FaGlobe, view: 'worldSelection' as const, delay: 650 },
    { label: "Mods", icon: FaTools, view: 'mods' as const, delay: 800 },
    { label: "Thời Thế", icon: FaBookOpen, view: 'thoiThe' as const, delay: 950 },
    { label: "Cài Đặt", icon: FaCog, view: 'settings' as const, delay: 1100 },
    { label: "Thông Tin", icon: FaInfoCircle, view: 'info' as const, delay: 1250 },
    { label: "Discord", icon: FaDiscord, href: 'https://discord.gg/5FEcnPwM', delay: 1400 },
    { label: "Ủng Hộ", icon: FaHeart, action: 'donate' as const, delay: 1550 },
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
    <div className="min-h-[calc(var(--vh,1vh)*100)] w-full flex items-center justify-center overflow-hidden">
        {isUpdateModalOpen && <UpdateModal onClose={handleCloseUpdateModal} onDismissPermanently={handleDismissUpdatePermanently} />}
        {isDonateModalOpen && <DonateModal onClose={() => setIsDonateModalOpen(false)} />}
        <div className="relative z-10 w-full max-w-7xl px-4 flex flex-col items-center justify-center space-y-8 md:space-y-12 animate-fade-in-menu">
            <div className="text-center p-8 relative animate-menu-item" style={{ animationDelay: '100ms' }}>
                <GiCircleClaws className="title-seal text-red-800/70 text-5xl sm:text-6xl absolute top-0 right-0 transform rotate-12 opacity-90 -translate-y-1/4 translate-x-1/4" />
                <h1 className="main-menu-title animated-gradient-text">
                    Tam Thiên<br/>Thế Giới
                </h1>
                <h2 
                    className="text-2xl sm:text-3xl mt-4 tracking-widest font-semibold font-title text-text-muted animate-menu-item"
                    style={{ animationDelay: '300ms' }}
                >
                    Khởi Nguyên
                </h2>
            </div>

            <div className="flex flex-col items-center space-y-2 md:space-y-4">
                {menuItems.map(item => (
                    <button 
                        key={item.label}
                        onClick={() => handleMenuItemClick(item)}
                        className="main-menu-item-new"
                        style={{ animationDelay: `${item.delay}ms` }}
                    >
                        <item.icon className="icon" />
                        <span className="text">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="absolute bottom-4 left-4 text-xs w-64 animate-menu-item" style={{ animationDelay: '1700ms' }}>
            <div className="flex items-center justify-between gap-2 text-text-muted mb-1">
                <div className="flex items-center gap-1">
                    <FaDatabase />
                    <span>Dung lượng lưu trữ:</span>
                </div>
                <strong className="font-mono">{state.storageUsage.usageString}</strong>
            </div>
            <div className="w-full bg-[var(--bg-interactive)] rounded-full h-1.5 border border-[var(--border-subtle)]">
                <div 
                    className={`h-1 rounded-full transition-all duration-500 ${state.storageUsage.percentage > 85 ? 'bg-gradient-to-r from-amber-500 to-red-600' : 'bg-gradient-to-r from-[var(--secondary-accent-color)] to-[var(--primary-accent-color)]'}`}
                    style={{ width: `${state.storageUsage.percentage}%` }}
                ></div>
            </div>
        </div>
    </div>
  );
};

export default memo(MainMenu);
