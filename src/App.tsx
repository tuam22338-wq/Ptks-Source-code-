import React, { useMemo, lazy, Suspense } from 'react';
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
import NovelistScreen from './features/Novelist/NovelistScreen'; // Import a tela mới

// --- Lazy Loaded Components ---
const LazySettingsPanel = lazy(() => import('./features/Settings/SettingsPanel').then(module => ({ default: module.SettingsPanel })));
const LazyCharacterCreationScreen = lazy(() => import('./features/CharacterCreation/CharacterCreationScreen').then(module => ({ default: module.CharacterCreationScreen })));
const LazySaveSlotScreen = lazy(() => import('./features/MainMenu/SaveSlotScreen'));
const LazyModsScreen = lazy(() => import('./features/Mods/ModsScreen'));
const LazyGamePlayScreen = lazy(() => import('./features/GamePlay/GamePlayScreen').then(module => ({ default: module.GamePlayScreen })));
const LazyThoiTheScreen = lazy(() => import('./features/Lore/LoreScreen'));
const LazyInfoScreen = lazy(() => import('./features/Info/InfoScreen'));
const LazyWorldSelectionScreen = lazy(() => import('./features/WorldSelection/WorldSelectionScreen'));
const LazyNovelistScreen = lazy(() => import('./features/Novelist/NovelistScreen'));


const BackgroundOverlay: React.FC = () => {
    const { state } = useAppContext();
    const { dynamicBackground } = state.settings;
    const backgroundSet = state.backgrounds.urls[`bg_theme_${dynamicBackground}`];

    if (!dynamicBackground || dynamicBackground === 'none' || !backgroundSet) {
        return <div className="fixed inset-0 -z-10 bg-[var(--bg-color)]" />;
    }

    return (
        <div className={`dynamic-bg-container`}>
            <div className="dynamic-bg-layer layer-1" style={{ backgroundImage: `url(${backgroundSet.layer1})` }}></div>
            <div className="dynamic-bg-layer layer-2" style={{ backgroundImage: `url(${backgroundSet.layer2})` }}></div>
            <div className="dynamic-bg-layer layer-3" style={{ backgroundImage: `url(${backgroundSet.layer3})` }}></div>
            <div className="dynamic-bg-layer layer-4" style={{ backgroundImage: `url(${backgroundSet.layer4})` }}></div>
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
            return <LazySaveSlotScreen />;
          case 'characterCreation':
            return <LazyCharacterCreationScreen />;
          case 'settings':
            return <LazySettingsPanel />;
          case 'mods':
            return <LazyModsScreen />;
          case 'thoiThe':
            return <LazyThoiTheScreen />;
          case 'info':
            return <LazyInfoScreen />;
          case 'worldSelection':
            return <LazyWorldSelectionScreen />;
          case 'novelist': // Thêm case mới
            return <LazyNovelistScreen />;
          case 'gamePlay':
            if (!gameState) {
                return <LoadingScreen message="Đang tải dữ liệu..." />;
            }
            return <LazyGamePlayScreen />;
          default:
            return <MainMenu />;
        }
    };
    
    const showHeader = !['mainMenu', 'gamePlay', 'novelist'].includes(view) && !isLoading && !isMigratingData;
    const isPanelScreen = !['mainMenu', 'gamePlay', 'novelist'].includes(view);
    const containerClasses = isPanelScreen 
        ? 'w-full max-w-7xl mx-auto flex-grow flex flex-col p-4 sm:p-6 lg:p-8'
        : 'w-full flex-grow flex flex-col';
    
    const panelClasses = 'panel-bg backdrop-blur-md rounded-xl shadow-2xl shadow-black/50';

    return (
        <div className="relative w-full h-full flex flex-col items-center">
            <BackgroundOverlay />
            <AmbientEffectsOverlay />
            {gameState && <WeatherOverlay />}
            {gameState && <SpecialEffectsOverlay />}

            {showHeader && (
              <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex-shrink-0">
                <Header />
              </div>
            )}
      
            <main className={`${containerClasses} min-h-0 ${isPanelScreen ? panelClasses : ''}`}>
                <Suspense fallback={<LoadingScreen message="Đang tải..." />}>
                    {renderContent()}
                </Suspense>
            </main>
            
            {settings.enableDeveloperConsole && <DeveloperConsole />}
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