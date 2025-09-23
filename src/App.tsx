import React, { useMemo } from 'react';
import Header from './components/Header';
import LoadingScreen from './components/LoadingScreen';
import { SettingsPanel } from './features/Settings/SettingsPanel';
import { CharacterCreationScreen } from './features/CharacterCreation/CharacterCreationScreen';
import SaveSlotScreen from './features/MainMenu/SaveSlotScreen';
import MainMenu from './features/MainMenu/MainMenu';
import ModsScreen from './features/Mods/ModsScreen';
import { GamePlayScreen } from './features/GamePlay/GamePlayScreen';
import ThoiTheScreen from './features/Lore/LoreScreen';
import InfoScreen from './features/Info/InfoScreen';
import DeveloperConsole from './components/DeveloperConsole';
import WorldSelectionScreen from './features/WorldSelection/WorldSelectionScreen';
import SpecialEffectsOverlay from './components/SpecialEffectsOverlay';
import { AppProvider, useAppContext } from './contexts/AppContext';

const BackgroundOverlay: React.FC = () => {
    const { state } = useAppContext();
    const { dynamicBackground } = state.settings;

    if (!dynamicBackground || dynamicBackground === 'none') {
        return null;
    }
    
    const backgroundClass = `dynamic-bg-${dynamicBackground}`;

    return (
        <div className={`dynamic-bg-container ${backgroundClass}`}>
            <div className="dynamic-bg-layer layer-1"></div>
            <div className="dynamic-bg-layer layer-2"></div>
            <div className="dynamic-bg-layer layer-3"></div>
            <div className="dynamic-bg-layer layer-4"></div>
        </div>
    );
};

const AmbientEffectsOverlay: React.FC = () => {
    const { state } = useAppContext();
    if (state.settings.enablePerformanceMode) {
        return null;
    }
    return (
        <div className="particle-container">
            {Array.from({ length: 25 }).map((_, i) => {
                const style: React.CSSProperties = {
                    left: `${Math.random() * 100}%`,
                    width: `${Math.random() * 2 + 1}px`,
                    height: `${Math.random() * 2 + 1}px`,
                    animationDuration: `${Math.random() * 8 + 7}s`,
                    animationDelay: `${Math.random() * 10}s`,
                };
                return <div className="particle" key={i} style={style}></div>;
            })}
        </div>
    );
};

const WeatherOverlay: React.FC = () => {
    const { state } = useAppContext();
    const weather = state.gameState?.gameDate?.weather;

    if (state.settings.enablePerformanceMode) {
        return null;
    }

    const weatherEffect = useMemo(() => {
        switch (weather) {
            case 'RAIN':
            case 'STORM':
                const isStorm = weather === 'STORM';
                const rainCount = isStorm ? 150 : 70;
                return (
                    <>
                        <div className="rain-container">
                            {Array.from({ length: rainCount }).map((_, i) => {
                                const style: React.CSSProperties = {
                                    left: `${Math.random() * 100}%`,
                                    animationDuration: `${Math.random() * 0.4 + 0.3}s`,
                                    animationDelay: `${Math.random() * 2}s`,
                                    height: `${Math.random() * 30 + 50}px`
                                };
                                return <div className="raindrop" key={i} style={style}></div>;
                            })}
                        </div>
                        {isStorm && <div className="storm-flash"></div>}
                    </>
                );
            case 'SNOW':
                return (
                    <div className="snow-container">
                        {Array.from({ length: 80 }).map((_, i) => {
                            const size = Math.random() * 3 + 2;
                            const style: React.CSSProperties = {
                                left: `${Math.random() * 100}%`,
                                width: `${size}px`,
                                height: `${size}px`,
                                opacity: Math.random() * 0.6 + 0.3,
                                animationDuration: `${Math.random() * 12 + 8}s`,
                                animationDelay: `${Math.random() * 10}s`,
                                '--sway-x': `${Math.random() * 40 - 20}px`
                            } as React.CSSProperties;
                            return <div className="snowflake" key={i} style={style}></div>;
                        })}
                    </div>
                );
            default:
                return null;
        }
    }, [weather]);

    return (
        <div className={`weather-overlay ${weatherEffect ? 'active' : ''}`}>
            {weatherEffect}
        </div>
    );
};

const AppContent: React.FC = () => {
    const { state } = useAppContext();
    const {
        view,
        isMigratingData,
        migrationMessage,
        isLoading,
        loadingMessage,
        settings,
        gameState,
    } = state;

    const renderContent = () => {
        if (isMigratingData) {
          return <LoadingScreen message={migrationMessage} />;
        }
        // Only show fullscreen loader if it's NOT a gameplay AI response
        if (isLoading && view !== 'gamePlay') {
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
    const hasDynamicBackground = settings.dynamicBackground && settings.dynamicBackground !== 'none';

    return (
        <div className="relative w-full min-h-[calc(var(--vh,1vh)*100)] bg-[var(--bg-color)]">
            <BackgroundOverlay />
            <AmbientEffectsOverlay />
            {gameState && <WeatherOverlay />}
            {gameState && <SpecialEffectsOverlay />}

            <div className={`relative z-10 w-full min-h-[calc(var(--vh,1vh)*100)] flex flex-col items-center justify-center transition-all duration-500 ${view === 'gamePlay' ? '' : 'p-4 sm:p-6 lg:p-8'} ${hasDynamicBackground ? 'backdrop-blur-lg bg-[var(--glass-bg-color)] rounded-2xl' : ''}`}>
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
