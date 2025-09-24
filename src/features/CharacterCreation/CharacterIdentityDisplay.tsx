
import React, { useState, memo, useEffect, useRef } from 'react';
import type { CharacterIdentity, Gender } from '../../types';
import { PERSONALITY_TRAITS } from '../../constants';
import { GiHoodedFigure } from 'react-icons/gi';
import { generateCharacterAvatar } from '../../services/geminiService';
import LoadingSpinner from '../../components/LoadingSpinner';

interface CharacterIdentityDisplayProps {
    identity: CharacterIdentity;
    onIdentityChange: (updatedIdentity: Partial<CharacterIdentity>) => void;
    isFinal?: boolean;
}

const GENDERS: Gender[] = ['Nam', 'Nữ'];

const CharacterIdentityDisplay: React.FC<CharacterIdentityDisplayProps> = ({ identity, onIdentityChange, isFinal = false }) => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);

    const [name, setName] = useState(identity.name);
    const [familyName, setFamilyName] = useState(identity.familyName);
    const [appearance, setAppearance] = useState(identity.appearance);
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        setName(identity.name);
        setFamilyName(identity.familyName);
        setAppearance(identity.appearance);
        // Reset avatar when identity changes back to draft step
        if (!isFinal) {
            setAvatarUrl(null);
            setAvatarError(null);
        }
    }, [identity, isFinal]);

    const handleGenerateAvatar = async () => {
        setIsLoadingAvatar(true);
        setAvatarError(null);
        try {
            // Use the most current state for avatar generation
            const currentIdentity: CharacterIdentity = { ...identity, name, familyName, appearance };
            const imageUrl = await generateCharacterAvatar(currentIdentity);
            setAvatarUrl(imageUrl);
        } catch (err: any) {
            setAvatarError(err.message || 'Lỗi không xác định.');
        } finally {
            setIsLoadingAvatar(false);
        }
    };

    const handleBlur = () => {
        if (isMounted.current) {
            onIdentityChange({ name, familyName, appearance });
        }
    };

    return (
        <div className="bg-black/20 p-4 rounded-lg border border-gray-700/60 flex flex-col sm:flex-row gap-4 md:gap-6">
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
                         {!isFinal && (
                            <button 
                                onClick={handleGenerateAvatar}
                                disabled={isLoadingAvatar}
                                className="px-3 py-1.5 bg-teal-700/80 text-white text-xs font-bold rounded-lg hover:bg-teal-600/80 transition-colors"
                            >
                                Tạo ảnh
                            </button>
                         )}
                    </div>
                )}
            </div>
            
            <div className="flex-grow space-y-3">
                 {isFinal ? (
                     <div>
                        <h3 className="text-2xl font-bold font-title text-amber-300">{identity.familyName} {identity.name}</h3>
                        <p className="text-sm text-gray-400 mt-2">{identity.appearance}</p>
                        <p className="text-sm text-gray-400 mt-2 italic">"{identity.origin}"</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-400 mb-1">Họ</label>
                                <input
                                    type="text"
                                    value={familyName}
                                    onChange={(e) => setFamilyName(e.target.value)}
                                    onBlur={handleBlur}
                                    placeholder="VD: Lý, Trần..."
                                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200"
                                />
                            </div>
                             <div className="flex-1">
                                <label className="block text-xs text-gray-400 mb-1">Tên</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    onBlur={handleBlur}
                                    placeholder="VD: Thanh Vân..."
                                    className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200"
                                />
                            </div>
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
                                            ? 'bg-cyan-500/20 border-cyan-500 text-white' 
                                            : 'bg-[var(--bg-interactive)] border-[var(--border-subtle)] text-[var(--text-muted-color)] hover:bg-[var(--bg-interactive-hover)]'
                                        }`}
                                    >
                                        {gender}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Mô tả ngoại hình</label>
                            <textarea
                                value={appearance}
                                onChange={(e) => setAppearance(e.target.value)}
                                onBlur={handleBlur}
                                placeholder="VD: Thiếu nữ áo trắng, dung mạo thanh lệ..."
                                rows={2}
                                className="w-full bg-black/30 border border-gray-600 rounded-lg px-4 py-2 text-gray-200 focus:outline-none focus:ring-1 focus:ring-[var(--input-focus-ring-color)]/50 transition-colors duration-200 resize-y"
                            />
                        </div>
                         <div>
                            <p className="text-xs text-gray-400 mb-1">Thiên Hướng</p>
                             <div className="flex items-center p-1 bg-black/30 rounded-lg border border-gray-700/60 w-full">
                                {PERSONALITY_TRAITS.map(trait => (
                                    <button
                                        key={trait.name}
                                        onClick={() => onIdentityChange({ personality: trait.name })}
                                        title={trait.description}
                                        className={`w-full text-center py-1.5 px-2 text-sm text-gray-400 rounded-md transition-colors duration-200 font-semibold hover:bg-gray-700/50 hover:text-white ${identity.personality === trait.name ? 'bg-gray-600 text-white shadow-inner' : ''}`}
                                    >
                                        {trait.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default memo(CharacterIdentityDisplay);
