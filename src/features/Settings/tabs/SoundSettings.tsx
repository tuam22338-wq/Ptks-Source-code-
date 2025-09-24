import React, { memo, useRef, useState, useEffect } from 'react';
import type { GameSettings } from '../../../types';

interface SettingsSectionProps {
    title: string;
    children: React.ReactNode;
}
const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <section className="mb-10">
    <h3 className="text-xl font-bold font-title mb-4 pb-2 border-b border-gray-600/50 text-gray-300">{title}</h3>
    <div className="space-y-4">{children}</div>
  </section>
);

interface SettingsRowProps {
    label: string;
    description: string;
    children: React.ReactNode;
    disabled?: boolean;
}
const SettingsRow: React.FC<SettingsRowProps> = ({ label, description, children, disabled = false }) => (
  <div className={`bg-black/10 p-4 rounded-lg border border-gray-800/50 flex flex-col md:flex-row gap-4 items-start ${disabled ? 'opacity-50' : ''}`}>
    <div className="md:w-1/3 flex-shrink-0">
      <label className="block font-semibold text-gray-200">{label}</label>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
    <div className="md:w-2/3">{children}</div>
  </div>
);

interface SoundSettingsProps {
    settings: GameSettings;
    handleSettingChange: (key: keyof GameSettings, value: any) => void;
}

const SoundSettings: React.FC<SoundSettingsProps> = ({ settings, handleSettingChange }) => {
    const musicInputRef = useRef<HTMLInputElement>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    useEffect(() => {
        const loadVoices = () => {
            if (window.speechSynthesis) {
                setVoices(window.speechSynthesis.getVoices());
            }
        };
        if (window.speechSynthesis) {
            window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
            loadVoices();
        }
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
            }
        };
    }, []);

    const vietnameseVoices = voices.filter(v => v.lang.startsWith('vi'));

    const handleMusicFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            alert("Tệp nhạc quá lớn. Vui lòng chọn tệp nhỏ hơn 20MB.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            handleSettingChange('backgroundMusicUrl', dataUrl);
            handleSettingChange('backgroundMusicName', file.name);
        };
        reader.readAsDataURL(file);
    };

    return (
        <SettingsSection title="Âm thanh">
            <SettingsRow label="Nhạc nền" description="Tải lên tệp nhạc của bạn (dưới 20MB) hoặc để trống để tắt nhạc.">
                <input type="file" accept="audio/*" ref={musicInputRef} onChange={handleMusicFileChange} className="hidden" />
                 <div className="flex items-center gap-2">
                     <button onClick={() => musicInputRef.current?.click()} className="px-4 py-2 bg-[var(--bg-interactive)] text-[var(--text-color)] border border-[var(--border-subtle)] rounded-lg font-semibold transition-colors duration-200 hover:bg-[var(--bg-interactive-hover)] hover:border-gray-500">Chọn tệp...</button>
                     <span className="text-sm text-gray-400 truncate flex-grow">{settings.backgroundMusicName || "Chưa có nhạc nền"}</span>
                     {settings.backgroundMusicUrl && <button onClick={() => { handleSettingChange('backgroundMusicUrl', ''); handleSettingChange('backgroundMusicName', ''); }} className="text-xs text-red-400 hover:text-red-300">Xóa</button>}
                </div>
            </SettingsRow>
             <SettingsRow label="Âm lượng nhạc nền" description="Điều chỉnh âm lượng nhạc nền.">
                <div className="flex items-center gap-4">
                    <input type="range" min="0" max="1" step="0.05" value={settings.backgroundMusicVolume} onChange={(e) => handleSettingChange('backgroundMusicVolume', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                    <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{Math.round(settings.backgroundMusicVolume * 100)}%</span>
                </div>
            </SettingsRow>
            <SettingsRow label="Bật đọc văn bản (TTS)" description="Tự động đọc các đoạn tường thuật của AI.">
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.enableTTS} onChange={e => handleSettingChange('enableTTS', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                    <span className="ml-3 text-sm text-gray-300">Bật Text-to-Speech</span>
                </label>
            </SettingsRow>
            {settings.enableTTS && (
                 <>
                    <SettingsRow label="Giọng đọc" description="Chọn giọng đọc cho hệ thống.">
                         <select className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 pr-8 appearance-none" value={settings.ttsVoiceURI} onChange={(e) => handleSettingChange('ttsVoiceURI', e.target.value)}>
                            <option value="">Giọng mặc định của trình duyệt</option>
                            {vietnameseVoices.map(voice => (
                                <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>
                            ))}
                        </select>
                    </SettingsRow>
                    <SettingsRow label="Tốc độ đọc" description="Điều chỉnh tốc độ đọc.">
                        <div className="flex items-center gap-4">
                            <input type="range" min="0.5" max="2" step="0.1" value={settings.ttsRate} onChange={(e) => handleSettingChange('ttsRate', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                            <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.ttsRate.toFixed(1)}x</span>
                        </div>
                    </SettingsRow>
                    <SettingsRow label="Cao độ" description="Điều chỉnh cao độ của giọng đọc.">
                         <div className="flex items-center gap-4">
                            <input type="range" min="0" max="2" step="0.1" value={settings.ttsPitch} onChange={(e) => handleSettingChange('ttsPitch', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                            <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-gray-200 w-20 text-center">{settings.ttsPitch.toFixed(1)}</span>
                        </div>
                    </SettingsRow>
                 </>
            )}
        </SettingsSection>
    );
};

export default memo(SoundSettings);