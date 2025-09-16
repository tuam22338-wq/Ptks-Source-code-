import React, { useState, memo, useEffect, useRef } from 'react';
import type { CharacterIdentity, Gender } from '../../types';
import { PERSONALITY_TRAITS } from '../../constants';
import { GiHoodedFigure } from 'react-icons/gi';
import { generateCharacterAvatar } from '../../services/geminiService';
import LoadingSpinner from '../../components/LoadingSpinner';

interface CharacterIdentityDisplayProps {
    identity: CharacterIdentity;
    onIdentityChange: (updatedIdentity: Partial<CharacterIdentity>) => void;
}

const GENDERS: Gender[] = ['Nam', 'Nữ'];

const CharacterIdentityDisplay: React.FC<CharacterIdentityDisplayProps> = ({ identity, onIdentityChange }) => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);

    const [name, setName] = useState(identity.name);
    const [origin, setOrigin] = useState(identity.origin);
    const [appearance, setAppearance] = useState(identity.appearance);
    const isMounted = useRef(false);

    useEffect(() => {
        setName(identity.name);
        setOrigin(identity.origin);
        setAppearance(identity.appearance);
        isMounted.current = true;
    }, [identity]);

    const handleGenerateAvatar = async () => {
        setIsLoadingAvatar(true);
        setAvatarError(null);
        try {
            const currentIdentity: CharacterIdentity = { ...identity, name, origin, appearance };
            const imageUrl = await generateCharacterAvatar(currentIdentity);
            setAvatarUrl(imageUrl);
        } catch (err: any) {
            setAvatarError(err.message || 'Lỗi không xác định.');
        } finally {
            setIsLoadingAvatar(false);
        }
    };

    const handleBlur = () => {
        if(isMounted.current) {
            onIdentityChange({ name, origin, appearance });
        }
    };

    return (
        <div className="bg-black/20 p-4 rounded-lg border border-gray-700/60 animate-talent-reveal flex flex-col sm:flex-row gap-4 md:gap-6">
            <div className="w-full sm:w-24 flex-shrink-0 flex flex-col items-center justify-center p-2 bg-black/20 rounded-lg border border-gray-700/40 aspect-square sm:aspect-[9/16]">
                {isLoadingAvatar ? (
                    <LoadingSpinner size="sm" message="Đang tạo..." />
                ) : avatarError ? (
                    <div className="text-center text-red-400 text-sm p-1">
                        <p>{avatarError}</p>
                        <button onClick={handleGenerateAvatar} className="mt-2 text-xs bg-red-500/20 border border-red-500/50 px-2 py-1 rounded hover:bg-red-500/30">
                            Thử Lại
                        </button>
                    </div>
                ) : avatarUrl ? (
                    <img src={avatarUrl} alt="Character Avatar" className="w-full h-full object-cover rounded-md" />
                ) : (
                    <div className="text-center flex flex-col items-center justify-center h-full">
                        <GiHoodedFigure className="text-6xl text-gray-600 mb-3" />
                        <button 
                            onClick={handleGenerateAvatar}
                            disabled={isLoadingAvatar}
                            className="px-3 py-1.5 bg-teal-700/80 text-white text-xs font-bold rounded-lg hover:bg-teal-600/80 transition-colors"
                        >
                            Tạo ảnh
                        </button>
                    </div>
                )}
            </div>
            
            <div className="flex-grow space-y-3">
                <div className="flex flex-col gap-3">
                     <div>
                        <label htmlFor="characterName" className="block text-xs text-gray-400 mb-1">Tên</label>
                        <input
                            id="characterName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleBlur}
                            placeholder="Nhập tên nhân vật"
                            className="w-full bg-[var(--bg-interactive)] border border-[var(--border-subtle)] rounded-md px-3 py-1.5 text-[var(--primary-accent-color)] font-bold text-base font-title focus:outline-none focus:ring-1 focus:ring-[var(--input-focus-ring-color)]/50 transition-all"
                        />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Giới Tính</p>
                        <div className="flex items-center gap-2 h-full">
                            {GENDERS.map(gender => (
                                <button
                                    key={gender}
                                    onClick={() => onIdentityChange({ gender })}
                                    className={`px-3 py-1.5 text-sm rounded-md border transition-all duration-200 w-full ${
                                        identity.gender === gender 
                                        ? 'bg-[color:var(--secondary-accent-color)]/20 border-[var(--secondary-accent-color)] text-white' 
                                        : 'bg-[var(--bg-interactive)] border-[var(--border-subtle)] text-[var(--text-muted-color)] hover:bg-[var(--bg-interactive-hover)]'
                                    }`}
                                >
                                    {gender}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                 <div>
                    <label htmlFor="characterOrigin" className="block text-xs text-gray-400 mb-1">Xuất Thân</label>
                    <textarea
                        id="characterOrigin"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        onBlur={handleBlur}
                        placeholder="VD: Đệ tử ngoại môn của một sơn phái bí ẩn..."
                        rows={2}
                        className="w-full bg-[var(--bg-interactive)] border border-[var(--border-subtle)] rounded-md px-3 py-1.5 text-[var(--text-color)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--input-focus-ring-color)]/50 transition-all"
                    />
                </div>
                 <div>
                    <label htmlFor="characterAppearance" className="block text-xs text-gray-400 mb-1">Ngoại Hình</label>
                    <textarea
                        id="characterAppearance"
                        value={appearance}
                        onChange={(e) => setAppearance(e.target.value)}
                        onBlur={handleBlur}
                        placeholder="VD: Thiếu nữ áo trắng, dung mạo thanh lệ, đôi mắt trong như nước hồ thu..."
                        rows={2}
                        className="w-full bg-[var(--bg-interactive)] border border-[var(--border-subtle)] rounded-md px-3 py-1.5 text-[var(--text-color)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--input-focus-ring-color)]/50 transition-all"
                    />
                </div>
                 <div>
                    <p className="text-xs text-gray-400 mb-1">Tính Cách</p>
                    <div className="flex justify-start items-center gap-1 bg-[var(--bg-interactive)] p-1 rounded-full border border-[var(--border-subtle)] max-w-full overflow-x-auto">
                        {PERSONALITY_TRAITS.map(trait => (
                            <button
                                key={trait.name}
                                onClick={() => onIdentityChange({ personality: trait.name })}
                                title={trait.description}
                                className={`flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full transition-all duration-200 ${
                                    identity.personality === trait.name 
                                    ? 'bg-[var(--primary-accent-color)]/80 text-black font-bold'
                                    : 'text-[var(--text-muted-color)] hover:bg-[var(--bg-interactive-hover)]'
                                }`}
                            >
                                {trait.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default memo(CharacterIdentityDisplay);