import React, { useState, memo } from 'react';
import type { GameSettings } from '../../types';
import { FaArrowLeft, FaDesktop, FaRobot, FaShieldAlt, FaCog, FaGamepad, FaVolumeUp, FaSearchPlus } from 'react-icons/fa';
import { useAppContext } from '../../contexts/AppContext';
import RagSourceManagerModal from './RagSourceManagerModal';
// Import tab components
import InterfaceSettings from './tabs/InterfaceSettings';
import SoundSettings from './tabs/SoundSettings';
import AiModelSettings from './tabs/AiModelSettings';
import RagSettings from './tabs/RagSettings';
import SafetySettings from './tabs/SafetySettings';
import GameplaySettings from './tabs/GameplaySettings';
import AdvancedSettings from './tabs/AdvancedSettings';

type SettingsTab = 'interface' | 'sound' | 'ai_models' | 'rag' | 'safety' | 'gameplay' | 'advanced';

const TabButton: React.FC<{
  tabId: SettingsTab;
  activeTab: SettingsTab;
  onClick: (tab: SettingsTab) => void;
  icon: React.ElementType;
  label: string;
}> = memo(({ tabId, activeTab, onClick, icon: Icon, label }) => (
  <button
    onClick={() => onClick(tabId)}
    className={`settings-tab-button ${activeTab === tabId ? 'active' : ''}`}
  >
    <Icon className="icon" />
    <span className="label">{label}</span>
  </button>
));

export const SettingsPanel: React.FC = () => {
    const { state, handleNavigate, handleSettingsSave, handleSettingChange } = useAppContext();
    const { settings } = state;
    const [activeTab, setActiveTab] = useState<SettingsTab>('interface');
    const [isRagManagerOpen, setIsRagManagerOpen] = useState(false);

    return (
        <div className="w-full animate-fade-in themed-panel p-4 sm:p-6 lg:p-8 flex flex-col h-full max-h-[85vh]">
            {isRagManagerOpen && <RagSourceManagerModal onClose={() => setIsRagManagerOpen(false)} />}
            <div className="settings-header">
                <button onClick={() => handleNavigate('mainMenu')} className="settings-back-button" title="Quay Lại Menu">
                    <FaArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="settings-main-title">Cài Đặt</h2>
                <div className="w-9 h-9"></div> {/* Spacer */}
            </div>

            <div className="settings-tab-nav">
                <TabButton tabId="interface" activeTab={activeTab} onClick={setActiveTab} icon={FaDesktop} label="Giao Diện" />
                <TabButton tabId="sound" activeTab={activeTab} onClick={setActiveTab} icon={FaVolumeUp} label="Âm Thanh" />
                <TabButton tabId="ai_models" activeTab={activeTab} onClick={setActiveTab} icon={FaRobot} label="AI" />
                <TabButton tabId="rag" activeTab={activeTab} onClick={setActiveTab} icon={FaSearchPlus} label="RAG" />
                <TabButton tabId="safety" activeTab={activeTab} onClick={setActiveTab} icon={FaShieldAlt} label="An Toàn" />
                <TabButton tabId="gameplay" activeTab={activeTab} onClick={setActiveTab} icon={FaGamepad} label="Lối Chơi" />
                <TabButton tabId="advanced" activeTab={activeTab} onClick={setActiveTab} icon={FaCog} label="Nâng Cao" />
            </div>

            <div className="settings-content">
                {activeTab === 'interface' && <InterfaceSettings settings={settings} handleSettingChange={handleSettingChange} />}
                {activeTab === 'sound' && <SoundSettings settings={settings} handleSettingChange={handleSettingChange} />}
                {activeTab === 'ai_models' && <AiModelSettings settings={settings} handleSettingChange={handleSettingChange} />}
                {activeTab === 'rag' && <RagSettings settings={settings} handleSettingChange={handleSettingChange} onOpenRagManager={() => setIsRagManagerOpen(true)} />}
                {activeTab === 'safety' && <SafetySettings settings={settings} handleSettingChange={handleSettingChange} />}
                {activeTab === 'gameplay' && <GameplaySettings settings={settings} handleSettingChange={handleSettingChange} />}
                {activeTab === 'advanced' && <AdvancedSettings settings={settings} handleSettingChange={handleSettingChange} />}
            </div>

            <div className="settings-footer">
                <button onClick={handleSettingsSave} className="settings-button-primary">Lưu Cài Đặt</button>
            </div>
        </div>
    );
};
