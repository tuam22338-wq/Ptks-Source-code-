import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { 
    FaArrowLeft, FaFileSignature, FaBrain, FaFilePdf, FaFileUpload
} from 'react-icons/fa';
import type { FullMod } from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import AiGenesisScreen from './components/AiGenesisScreen';
import ManualGenesisScreen from './components/ManualGenesisScreen';
import PdfConverterScreen from './components/PdfConverterScreen';
import GameMasterAiScreen from './components/GameMasterAiScreen';

type ModView = 'main' | 'genesis' | 'manualGenesis' | 'pdfConverter' | 'gameMasterAi';

const MenuButton: React.FC<{
    icon: React.ElementType;
    title: string;
    description: string;
    onClick: () => void;
}> = memo(({ icon: Icon, title, description, onClick }) => (
    <button 
        onClick={onClick}
        className="group flex flex-col items-center justify-center text-center p-6 bg-black/20 rounded-lg border-2 border-gray-700/80 hover:border-[var(--primary-accent-color)]/80 hover:bg-[var(--primary-accent-color)]/10 transition-all duration-300 transform hover:-translate-y-2"
    >
        <Icon className="text-6xl text-gray-400 group-hover:text-[var(--primary-accent-color)] transition-colors duration-300 mb-4" />
        <h3 className="text-2xl font-bold font-title text-gray-200 group-hover:text-white">{title}</h3>
        <p className="text-sm text-gray-500 group-hover:text-gray-400 mt-2">{description}</p>
    </button>
));

const ModsScreen: React.FC = () => {
    const { state, handleNavigate, handleInstallMod, dispatch } = useAppContext();
    const [view, setView] = useState<ModView>('main');

    useEffect(() => {
        if (state.modBeingEdited) {
            setView('manualGenesis');
        }
    }, [state.modBeingEdited]);
    
    const handleUsePdfTextForGenesis = (text: string) => {
        dispatch({ type: 'SET_PDF_TEXT_FOR_GENESIS', payload: text });
        setView('genesis');
    };

    const handleBackFromGenesis = () => {
        setView('main');
        // Clean up the editing state when returning to the main mod menu
        dispatch({ type: 'SET_MOD_FOR_EDITING', payload: null });
    };

    const renderMainView = () => (
        <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in lg:max-w-4xl mx-auto">
              <MenuButton 
                icon={FaFileSignature}
                title="Sáng Tạo Dẫn Hướng"
                description="Điền vào biểu mẫu để AI tạo ra một thế giới dựa trên ý tưởng của bạn."
                onClick={() => setView('manualGenesis')}
            />
             <MenuButton 
                icon={FaBrain}
                title="Game Master AI"
                description="Trò chuyện với AI để cùng sáng tạo một thế giới mới từ ý tưởng của bạn."
                onClick={() => setView('gameMasterAi')}
            />
            <MenuButton 
                icon={FaFileUpload}
                title="Sáng Thế từ File TXT"
                description="Tải lên file .txt chứa lore để AI tự động tạo ra một thế giới hoàn chỉnh."
                onClick={() => setView('genesis')}
            />
            <MenuButton 
                icon={FaFilePdf}
                title="Chuyển Đổi PDF"
                description="Trích xuất văn bản từ file PDF để chuẩn bị cho Sáng Thế Ký."
                onClick={() => setView('pdfConverter')}
            />
        </div>
    );
    
    const renderContent = () => {
        switch(view) {
            case 'manualGenesis':
                return <ManualGenesisScreen onBack={handleBackFromGenesis} onInstall={handleInstallMod} />;
            case 'genesis':
                return <AiGenesisScreen onBack={() => setView('main')} onInstall={handleInstallMod} />;
            case 'gameMasterAi':
                return <GameMasterAiScreen onBack={() => setView('main')} onInstall={handleInstallMod} />;
            case 'pdfConverter':
                return <PdfConverterScreen onBack={() => setView('main')} onUseForGenesis={handleUsePdfTextForGenesis} />;
            case 'main':
            default:
                return renderMainView();
        }
    };

    return (
        <div className="w-full animate-fade-in flex flex-col h-full min-h-0">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <h2 className="text-3xl font-bold font-title">Công Cụ Sáng Tạo</h2>
                <button onClick={() => handleNavigate('mainMenu')} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-700/50" title="Quay Lại Menu">
                    <FaArrowLeft className="w-5 h-5" />
                </button>
            </div>
           {renderContent()}
        </div>
    );
};

export default memo(ModsScreen);
