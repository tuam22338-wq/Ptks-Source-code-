import React, { memo, useRef, useState, useEffect, useCallback } from 'react';
import type { GameSettings, TtsProvider } from '../../../types';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface SettingsSectionProps {
    title: string;
    children: React.ReactNode;
}
const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <section className="mb-10">
    <h3 className="text-xl font-bold font-title mb-4 pb-2 border-b border-gray-600/50" style={{color: 'var(--text-color)'}}>{title}</h3>
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
      <label className="block font-semibold" style={{color: 'var(--text-color)'}}>{label}</label>
      <p className="text-sm mt-1" style={{color: 'var(--text-muted-color)'}}>{description}</p>
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
    const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [elevenLabsVoices, setElevenLabsVoices] = useState<any[]>([]);
    const [isLoadingVoices, setIsLoadingVoices] = useState(false);
    const [elevenLabsError, setElevenLabsError] = useState<string | null>(null);

    useEffect(() => {
        const loadVoices = () => {
            if (window.speechSynthesis) {
                setBrowserVoices(window.speechSynthesis.getVoices());
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

    const fetchElevenLabsVoices = useCallback(async (apiKey: string) => {
        if (!apiKey) {
            setElevenLabsVoices([]);
            setElevenLabsError(null);
            return;
        }
        setIsLoadingVoices(true);
        setElevenLabsError(null);
        try {
            const response = await fetch('https://api.elevenlabs.io/v1/voices', {
                headers: { 
                    'Accept': 'application/json',
                    'xi-api-key': apiKey 
                }
            });
            if (!response.ok) {
                let errorMsg = `Lỗi tải giọng đọc (Mã lỗi: ${response.status}).`;
                try {
                    const errorJson = await response.json();
                    if (errorJson.detail?.message) {
                        errorMsg = errorJson.detail.message; // Use API message directly
                    }
                    if (response.status === 401) {
                        errorMsg += ' Vui lòng kiểm tra lại API Key.';
                    }
                } catch (e) {
                    // Ignore if response body isn't json
                }
                throw new Error(errorMsg);
            }
            const data = await response.json();
            setElevenLabsVoices(data.voices || []);
        } catch (error: any) {
            console.error(error);
            setElevenLabsVoices([]);
            setElevenLabsError(error.message);
        } finally {
            setIsLoadingVoices(false);
        }
    }, []);

    useEffect(() => {
        if (settings.ttsProvider === 'elevenlabs') {
            fetchElevenLabsVoices(settings.elevenLabsApiKey);
        }
    }, [settings.elevenLabsApiKey, settings.ttsProvider, fetchElevenLabsVoices]);

    const vietnameseVoices = browserVoices.filter(v => v.lang.startsWith('vi'));

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
                     <span className="text-sm text-[var(--text-muted-color)] truncate flex-grow">{settings.backgroundMusicName || "Chưa có nhạc nền"}</span>
                     {settings.backgroundMusicUrl && <button onClick={() => { handleSettingChange('backgroundMusicUrl', ''); handleSettingChange('backgroundMusicName', ''); }} className="text-xs text-red-400 hover:text-red-300">Xóa</button>}
                </div>
            </SettingsRow>
             <SettingsRow label="Âm lượng nhạc nền" description="Điều chỉnh âm lượng nhạc nền.">
                <div className="flex items-center gap-4">
                    <input type="range" min="0" max="1" step="0.05" value={settings.backgroundMusicVolume} onChange={(e) => handleSettingChange('backgroundMusicVolume', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                    <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-[var(--text-color)] w-20 text-center">{Math.round(settings.backgroundMusicVolume * 100)}%</span>
                </div>
            </SettingsRow>
            <SettingsRow label="Bật đọc văn bản (TTS)" description="Tự động đọc các đoạn tường thuật của AI.">
                <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={settings.enableTTS} onChange={e => handleSettingChange('enableTTS', e.target.checked)} className="w-5 h-5 text-amber-500 bg-gray-700 border-gray-600 rounded focus:ring-amber-600 focus:ring-2 cursor-pointer" />
                    <span className="ml-3 text-sm" style={{color: 'var(--text-color)'}}>Bật Text-to-Speech</span>
                </label>
            </SettingsRow>
            {settings.enableTTS && (
                 <>
                    <SettingsRow label="Nhà cung cấp TTS" description="Chọn dịch vụ để đọc văn bản. ElevenLabs cho chất lượng cao hơn.">
                        <div className="flex items-center p-1 bg-black/30 rounded-lg border border-gray-700/60 w-full">
                            <button className={`w-1/2 text-center py-1.5 px-2 text-sm font-semibold rounded-md transition-colors ${settings.ttsProvider === 'browser' ? 'bg-gray-600 text-[var(--text-color)]' : 'text-[var(--text-muted-color)] hover:bg-gray-700/50'}`} onClick={() => handleSettingChange('ttsProvider', 'browser')}>Trình duyệt</button>
                            <button className={`w-1/2 text-center py-1.5 px-2 text-sm font-semibold rounded-md transition-colors ${settings.ttsProvider === 'elevenlabs' ? 'bg-gray-600 text-[var(--text-color)]' : 'text-[var(--text-muted-color)] hover:bg-gray-700/50'}`} onClick={() => handleSettingChange('ttsProvider', 'elevenlabs')}>ElevenLabs</button>
                        </div>
                    </SettingsRow>

                    {settings.ttsProvider === 'elevenlabs' && (
                        <>
                            <SettingsRow label="ElevenLabs API Key" description="Dán API key của bạn từ trang web ElevenLabs.">
                                <input type="password" value={settings.elevenLabsApiKey} onChange={(e) => handleSettingChange('elevenLabsApiKey', e.target.value)} className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50" />
                                {elevenLabsError && <p className="text-sm text-red-400 mt-2">{elevenLabsError}</p>}
                            </SettingsRow>
                            <SettingsRow label="Giọng đọc ElevenLabs" description="Chọn một trong các giọng đọc có sẵn của bạn.">
                                {isLoadingVoices ? <LoadingSpinner size="sm" /> : (
                                <select className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 pr-8 appearance-none" value={settings.elevenLabsVoiceId} onChange={(e) => handleSettingChange('elevenLabsVoiceId', e.target.value)} disabled={!settings.elevenLabsApiKey || elevenLabsVoices.length === 0}>
                                    <option value="">{elevenLabsVoices.length > 0 ? "Chọn giọng đọc" : (settings.elevenLabsApiKey ? "Không có giọng nào (kiểm tra API key)" : "Vui lòng nhập API Key")}</option>
                                    {elevenLabsVoices.map(voice => (
                                        <option key={voice.voice_id} value={voice.voice_id}>{voice.name}</option>
                                    ))}
                                </select>
                                )}
                            </SettingsRow>
                        </>
                    )}

                    {settings.ttsProvider === 'browser' && (
                        <SettingsRow label="Giọng đọc (Trình duyệt)" description="Chọn giọng đọc cho hệ thống.">
                             <select className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-[var(--text-color)] focus:outline-none focus:ring-2 focus:ring-[var(--input-focus-ring-color)]/50 pr-8 appearance-none" value={settings.ttsVoiceURI} onChange={(e) => handleSettingChange('ttsVoiceURI', e.target.value)}>
                                <option value="">Giọng mặc định</option>
                                {vietnameseVoices.map(voice => (
                                    <option key={voice.voiceURI} value={voice.voiceURI}>{voice.name} ({voice.lang})</option>
                                ))}
                            </select>
                        </SettingsRow>
                    )}
                    
                    <SettingsRow label="Âm lượng đọc" description="Điều chỉnh âm lượng giọng đọc.">
                         <div className="flex items-center gap-4">
                            <input type="range" min="0" max="1" step="0.1" value={settings.ttsVolume} onChange={(e) => handleSettingChange('ttsVolume', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                            <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-[var(--text-color)] w-20 text-center">{Math.round(settings.ttsVolume * 100)}%</span>
                        </div>
                    </SettingsRow>

                    {settings.ttsProvider === 'browser' && (
                        <>
                            <SettingsRow label="Tốc độ đọc" description="Điều chỉnh tốc độ đọc.">
                                <div className="flex items-center gap-4">
                                    <input type="range" min="0.5" max="2" step="0.1" value={settings.ttsRate} onChange={(e) => handleSettingChange('ttsRate', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                                    <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-[var(--text-color)] w-20 text-center">{settings.ttsRate.toFixed(1)}x</span>
                                </div>
                            </SettingsRow>
                            <SettingsRow label="Cao độ" description="Điều chỉnh cao độ của giọng đọc.">
                                 <div className="flex items-center gap-4">
                                    <input type="range" min="0" max="2" step="0.1" value={settings.ttsPitch} onChange={(e) => handleSettingChange('ttsPitch', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer flex-grow" />
                                    <span className="font-mono text-sm bg-black/30 border border-gray-600 rounded-md px-3 py-1 text-[var(--text-color)] w-20 text-center">{settings.ttsPitch.toFixed(1)}</span>
                                </div>
                            </SettingsRow>
                        </>
                     )}
                 </>
            )}
        </SettingsSection>
    );
};

export default memo(SoundSettings);