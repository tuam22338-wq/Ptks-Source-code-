import React, { useMemo } from 'react';
import Header from './components/Header';
import LoadingScreen from './components/LoadingScreen';
import SettingsPanel from './features/Settings/SettingsPanel';
import { CharacterCreationScreen } from './features/CharacterCreation/CharacterCreationScreen';
import SaveSlotScreen from './features/MainMenu/SaveSlotScreen';
import MainMenu from './features/MainMenu/MainMenu';
import ModsScreen from './features/Mods/ModsScreen';
import CreateModScreen from './features/Mods/CreateModScreen';
import { GamePlayScreen } from './features/GamePlay/GamePlayScreen';
import ThoiTheScreen from './features/Lore/LoreScreen';
import InfoScreen from './features/Info/InfoScreen';
import DeveloperConsole from './components/DeveloperConsole';
import WorldSelectionScreen from './features/WorldSelection/WorldSelectionScreen';
import { AppProvider, useAppContext } from './contexts/AppContext';

const WeatherOverlay: React.FC = () => {
    const { gameState } = useAppContext();
    const weather = gameState?.gameDate?.weather;

    const weatherClass = useMemo(() => {
        switch (weather) {
            case 'RAIN':
            case 'STORM':
                return 'rain-effect';
            case 'SNOW':
                return 'snow-effect';
            default:
                return '';
        }
    }, [weather]);

    return (
        <div className={`weather-overlay ${weatherClass} ${weatherClass ? 'active' : ''}`}></div>
    );
};

const AppContent: React.FC = () => {
    const {
        view,
        isMigratingData,
        migrationMessage,
        isLoading,
        loadingMessage,
        settings,
        gameState,
    } = useAppContext();

    const renderContent = () => {
        if (isMigratingData) {
          return <LoadingScreen message={migrationMessage} />;
        }
        if (isLoading) {
          return <LoadingScreen message={loadingMessage} />;
        }

        switch (view) {
          case 'mainMenu':
            return <MainMenu />;
          case 'saveSlots':
            return <SaveSlotScreen />;
          case 'characterCreation':
            return <CharacterCreationScreen />;
          case 'settings':
            return <SettingsPanel />;
          case 'mods':
            return <ModsScreen />;
          case 'createMod':
            return <CreateModScreen />;
          case 'thoiThe':
            return <ThoiTheScreen />;
          case 'info':
            return <InfoScreen />;
          case 'worldSelection':
            return <WorldSelectionScreen />;
          case 'gamePlay':
            if (!gameState) {
                return <LoadingScreen message="Đang tải dữ liệu..." />;
            }
            return <GamePlayScreen />;
          default:
            return <MainMenu />;
        }
    };
    
    const showHeader = view !== 'mainMenu' && view !== 'gamePlay' && !isLoading && !isMigratingData;

    return (
        <div className="relative w-full min-h-[calc(var(--vh,1vh)*100)]">
            <div className="ink-background-container">
                <div className="ink-layer ink-layer-1"></div>
                <div className="ink-layer ink-layer-2"></div>
                <div className="ink-layer ink-layer-3"></div>
                <div className="ink-layer ink-layer-4"></div>
            </div>

            {gameState && <WeatherOverlay />}

            <div className={`relative z-10 w-full min-h-[calc(var(--vh,1vh)*100)] flex flex-col items-center justify-center transition-all duration-500 ${view === 'gamePlay' ? '' : 'p-4 sm:p-6 lg:p-8'}`}>
              <div className={`w-full max-w-7xl transition-opacity duration-700 ${!showHeader ? 'opacity-0 h-0 invisible' : 'opacity-100'}`}>
                {showHeader && <Header />}
              </div>
        
              <main className={`w-full ${view === 'gamePlay' ? 'h-[calc(var(--vh,1vh)*100)] max-w-full' : 'max-w-7xl'}`}>
                {renderContent()}
              </main>
              
              {settings.enableDeveloperConsole && <DeveloperConsole />}
            </div>
        </div>
    );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;