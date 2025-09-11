import React from 'react';
// FIX: Changed import from 'Screen' to 'View' as 'Screen' is not an exported member of App.
import type { View } from '../App';

interface TopNavigationProps {
  // FIX: Renamed type from Screen to View.
  activeScreen: View;
  setActiveScreen: (screen: View) => void;
}

// FIX: Renamed type from Screen to View and updated 'play' to 'saveSlots' to match available views.
const NAV_ITEMS: { screen: View; label: string }[] = [
  { screen: 'saveSlots', label: 'Chơi Game' },
  { screen: 'settings', label: 'Cài Đặt' },
];

const NavButton: React.FC<{
  // FIX: Renamed type from Screen to View.
  item: { screen: View; label: string };
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-2 font-title text-lg transition-colors duration-300
                  ${isActive ? 'text-red-400' : 'text-gray-300 hover:text-white'}`}
    >
      <span>{item.label}</span>
      {isActive && (
        <span 
            className="absolute left-1/2 -translate-x-1/2 bottom-0 w-2 h-2 bg-red-500 rounded-full"
            style={{boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)'}}
        ></span>
      )}
    </button>
  );
};

const TopNavigation: React.FC<TopNavigationProps> = ({ activeScreen, setActiveScreen }) => {
  return (
    <nav className="w-full bg-black/20 rounded-lg flex items-center justify-center space-x-4 sm:space-x-8 p-1 border-y border-gray-700/60">
      {NAV_ITEMS.map(item => (
        <NavButton
          key={item.screen}
          item={item}
          isActive={activeScreen === item.screen}
          onClick={() => setActiveScreen(item.screen)}
        />
      ))}
    </nav>
  );
};

export default TopNavigation;
