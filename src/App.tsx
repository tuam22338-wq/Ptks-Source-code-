import React, { useMemo, lazy, Suspense } from 'react';
import Header from './components/Header';
import LoadingScreen from './components/LoadingScreen';
import { SettingsPanel } from './features/Settings/SettingsPanel';
import SaveSlotScreen from './features/MainMenu/SaveSlotScreen';
import MainMenu from './features/MainMenu/MainMenu';
import { GamePlayScreen } from './features/GamePlay/GamePlayScreen';
import InfoScreen from './features/Info/InfoScreen';
import DeveloperConsole from './components/DeveloperConsole';
import SpecialEffectsOverlay from './components/SpecialEffectsOverlay';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { GameProvider } from './contexts/GameContext';
import NovelistScreen from './features/Novelist/NovelistScreen';
import LoadGameScreen from './features/MainMenu/LoadGameScreen';

// --- Lazy Loaded Components ---
const LazySettingsPanel = lazy(() => import('./features/Settings/SettingsPanel').then(module => ({ default: module.SettingsPanel })));
const LazySaveSlotScreen = lazy(() => import('./features/MainMenu/SaveSlotScreen'));
const LazyLoadGameScreen = lazy(() => import('./features/MainMenu/LoadGameScreen'));
const LazyGamePlayScreen = lazy(() => import('./features/GamePlay/GamePlayScreen').then(module => ({ default: module.GamePlayScreen })));
const LazyInfoScreen = lazy(() => import('./features/Info/InfoScreen'));
const LazyNovelistScreen = lazy(() => import('./features/Novelist/NovelistScreen'));
const LazyAiTrainingScreen = lazy(() => import('./features/AiTraining/AiTrainingScreen'));
const LazyScriptsScreen = lazy(() => import('./features/Scripts/ScriptsScreen'));
const LazyCreateScriptScreen = lazy(() => import('./features/Scripts/CreateScriptScreen'));
const LazyWikiScreen = lazy(() => import('./features/Wiki/WikiScreen'));


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

const InkSplatterOverlay: React.FC = () => {
    const { state } = useAppContext();
    const theme = state.settings.theme;

    if (state.settings.enablePerformanceMode || theme !== 'theme-ink-wash-bamboo') {
        return null;
    }
    return (
        <div className="ink-splatter-container">
            {Array.from({ length: 10 }).map((_, i) => {
                const size = Math.random() * 200 + 100; // 100px to 300px
                const style: React.CSSProperties = {
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    animationDuration: `${Math.random() * 5 + 5}s`,
                    animationDelay: `${Math.random() * 10}s`,
                };
                return <div className="ink-splatter" key={i} style={style}></div>;
            })}
        </div>
    );
};


const WeatherOverlay: React.FC = () => {
    const { state } = useAppContext();
    const weather = state.gameState?.gameDate?.weather;

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

    if (state.settings.enablePerformanceMode) {
        return null;
    }

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
        if (isLoading && view !== 'gamePlay') {
          return <LoadingScreen message={loadingMessage} />;
        }

        switch (view) {
          case 'mainMenu':
            return <MainMenu />;
          case 'saveSlots':
            return <LazySaveSlotScreen />;
          case 'loadGame':
            return <LazyLoadGameScreen />;
          case 'settings':
            return <LazySettingsPanel />;
          case 'info':
            return <LazyInfoScreen />;
          case 'novelist':
            return <LazyNovelistScreen />;
          case 'aiTraining':
            return <LazyAiTrainingScreen />;
          case 'scripts':
            return <LazyScriptsScreen />;
          case 'createScript':
            return <LazyCreateScriptScreen />;
          case 'wikiScreen':
            return <LazyWikiScreen />;
          case 'gamePlay':
            if (!gameState) {
                return <LoadingScreen message="Đang tải dữ liệu..." />;
            }
            return (
                <GameProvider initialGameState={gameState}>
                    <LazyGamePlayScreen />
                </GameProvider>
            );
          default:
            return <MainMenu />;
        }
    };
    
    // --- DYNAMIC LAYOUT LOGIC ---
    const forceFullScreenViews = ['mainMenu', 'gamePlay', 'novelist', 'aiTraining', 'scripts', 'createScript', 'wikiScreen'];
    const isPotentiallyPanelScreen = !forceFullScreenViews.includes(view);

    let mainClasses = 'w-full flex-1 flex flex-col min-h-0';
    if (isPotentiallyPanelScreen) {
        switch (settings.layoutMode) {
            case 'desktop':
                mainClasses += ' max-w-7xl mx-auto panel-container';
                break;
            case 'mobile':
                mainClasses += ' px-4 sm:px-6';
                break;
            case 'auto':
                mainClasses += ' panel-container-auto md:max-w-7xl md:mx-auto';
                break;
        }
    }
    
    const showHeader = isPotentiallyPanelScreen && !isLoading && !isMigratingData;

    return (
        <div className="relative w-full h-screen flex flex-col">
            <BackgroundOverlay />
            <AmbientEffectsOverlay />
            <InkSplatterOverlay />
            {gameState && <WeatherOverlay />}
            {gameState && <SpecialEffectsOverlay />}

            {showHeader && (
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-shrink-0">
                <Header />
              </div>
            )}
      
            <main className={mainClasses}>
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
