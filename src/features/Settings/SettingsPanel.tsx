import React, { useState, memo } from 'react';
import type { GameSettings } from '../../types';
import { FaArrowLeft, FaDesktop, FaRobot, FaShieldAlt, FaCog, FaGamepad, FaVolumeUp, FaSearchPlus, FaPenFancy } from 'react-icons/fa';
import { GiGears } from 'react-icons/gi';
import { useAppContext } from '../../contexts/AppContext';
import RagSourceManagerModal from './RagSourceManagerModal';
// Import tab components
import InterfaceSettings from './tabs/InterfaceSettings';
import SoundSettings from './tabs/SoundSettings';
import AiModelSettings from './tabs/AiModelSettings';
import RagSettings from './tabs/RagSettings';
import SafetySettings from './tabs/SafetySettings';
import AdvancedSettings from './tabs/AdvancedSettings';

type SettingsTab = 'interface' | 'sound' | 'ai_models' | 'rag' | 'safety' | 'advanced';

const TabButton: React.FC<{
  tabId: SettingsTab;
  activeTab: SettingsTab;
  onClick: (tab: SettingsTab) => void;
  icon: React.ElementType;
  label: string;
}> = memo(({ tabId, activeTab, onClick, icon: Icon, label }) => (
  <button
    onClick={() => onClick(tabId)}
    className={`flex-grow flex flex-col items-center justify-center p-3 text-[var(--text-muted-color)] rounded-lg transition-colors duration-200 hover:bg-gray-700/50 hover:text-[var(--text-color)] ${activeTab === tabId ? 'bg-gray-600 text-[var(--text-color)] shadow-inner' : ''}`}
  >
    <Icon className="text-2xl mb-1" />
    <span className="text-xs font-semibold">{label}</span>
  </button>
));

export const SettingsPanel: React.FC = () => {
    const { state, handleNavigate, handleSettingsSave, handleSettingChange } = useAppContext();
    const { settings } = state;
    const [activeTab, setActiveTab] = useState<SettingsTab>('interface');
    const [isRagManagerOpen, setIsRagManagerOpen] = useState(false);

    return (
        <div className="w-full animate-fade-in flex flex-col h-full min-h-0">
            {isRagManagerOpen && <RagSourceManagerModal onClose={() => setIsRagManagerOpen(false)} />}
            <div className="flex-shrink-0 flex justify-between items-center mb-6">
                <button onClick={() => handleNavigate('mainMenu')} className="p-2 rounded-full text-[var(--text-muted-color)] hover:text-[var(--text-color)] hover:bg-gray-700/50 transition-colors" title="Quay Lại Menu">
                    <FaArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-3xl font-bold font-title">Cài Đặt</h2>
                <div className="w-9 h-9"></div> {/* Spacer */}
            </div>

            <div className="flex-shrink-0 grid grid-cols-3 sm:grid-cols-5 lg:flex lg:items-center gap-2 p-2 bg-black/20 rounded-lg border border-gray-700/60 mb-6">
                <TabButton tabId="interface" activeTab={activeTab} onClick={setActiveTab} icon={FaDesktop} label="Giao Diện" />
                <TabButton tabId="sound" activeTab={activeTab} onClick={setActiveTab} icon={FaVolumeUp} label="Âm Thanh" />
                <TabButton tabId="ai_models" activeTab={activeTab} onClick={setActiveTab} icon={FaRobot} label="AI Models" />
                <TabButton tabId="rag" activeTab={activeTab} onClick={setActiveTab} icon={FaSearchPlus} label="RAG" />
                <TabButton tabId="safety" activeTab={activeTab} onClick={setActiveTab} icon={FaShieldAlt} label="An Toàn" />
                <TabButton tabId="advanced" activeTab={activeTab} onClick={setActiveTab} icon={FaCog} label="Nâng Cao" />
            </div>

            <div className="flex-grow min-h-0 overflow-y-auto pr-2">
                {activeTab === 'interface' && <InterfaceSettings settings={settings} handleSettingChange={handleSettingChange} />}
                {activeTab === 'sound' && <SoundSettings settings={settings} handleSettingChange={handleSettingChange} />}
                {activeTab === 'ai_models' && <AiModelSettings settings={settings} handleSettingChange={handleSettingChange} />}
                {activeTab === 'rag' && <RagSettings settings={settings} handleSettingChange={handleSettingChange} onOpenRagManager={() => setIsRagManagerOpen(true)} />}
                {activeTab === 'safety' && <SafetySettings settings={settings} handleSettingChange={handleSettingChange} />}
                {activeTab === 'advanced' && <AdvancedSettings settings={settings} handleSettingChange={handleSettingChange} />}
            </div>

            <div className="flex-shrink-0 mt-6 pt-4 border-t border-gray-700/60 flex justify-end">
                <button onClick={handleSettingsSave} className="px-6 py-2 bg-[var(--button-primary-bg)] text-[var(--primary-accent-text-color)] border border-[var(--button-primary-border)] rounded-md font-semibold transition-all duration-200 ease-in-out hover:bg-[var(--button-primary-hover-bg)] hover:-translate-y-0.5 shadow-md shadow-black/30">Lưu Cài Đặt</button>
            </div>
        </div>
    );
};