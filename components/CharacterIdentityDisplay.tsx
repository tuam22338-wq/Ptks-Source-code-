import React, { useState, memo } from 'react';
import type { CharacterIdentity, Gender } from '../types';
import { PERSONALITY_TRAITS } from '../constants';
// FIX: Replaced non-existent icon 'GiMysteryMan' with 'GiHoodedFigure' to resolve import error.
import { GiHoodedFigure } from 'react-icons/gi';
import { generateCharacterAvatar } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';

interface CharacterIdentityDisplayProps {
    identity: CharacterIdentity;
    onIdentityChange: (updatedIdentity: Partial<CharacterIdentity>) => void;
}

const GENDERS: Gender[] = ['Nam', 'Nữ'];

const CharacterIdentityDisplay: React.FC<CharacterIdentityDisplayProps> = ({ identity, onIdentityChange }) => {
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isLoadingAvatar, setIsLoadingAvatar] = useState(false);
    const [avatarError, setAvatarError] = useState<string | null>(null);

    const handleGenerateAvatar = async () => {
        setIsLoadingAvatar(true);
        setAvatarError(null);
        try {
            const imageUrl = await generateCharacterAvatar(identity);
            setAvatarUrl(imageUrl);
        } catch (err: any) {
            setAvatarError(err.message || 'Lỗi không xác định.');
        } finally {
            setIsLoadingAvatar(false);
        }
    };

    const InputField = ({ label, id, value, onChange, placeholder }: { label: string; id: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder?: string; }) => (
        <div>
            <label htmlFor={id} className="block text-xs text-gray-400 mb-1">{label}</label>
            <input
                id={id}
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-1.5 text-amber-300 font-bold text-base font-title focus:outline-none focus:ring-1 focus:ring-amber-400/50 transition-all"
            />
        </div>
    );

    const TextAreaField = ({ label, id, value, onChange, placeholder, rows = 3 }: { label: string; id: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string; rows?: number; }) => (
         <div>
            <label htmlFor={id} className="block text-xs text-gray-400 mb-1">{label}</label>
            <textarea
                id={id}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={rows}
                className="w-full bg-gray-900/50 border border-gray-600 rounded-md px-3 py-1.5 text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/50 transition-all"
            />
        </div>
    );

    return (
        <div className="bg-black/20 p-4 rounded-lg border border-gray-700/60 animate-talent-reveal flex flex-col sm:flex-row gap-4 md:gap-6">
            {/* Avatar Panel - Left Side */}
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
            
            {/* Identity Fields - Right Side */}
            <div className="flex-grow space-y-3">
                <div className="flex flex-col gap-3">
                     <InputField 
                        label="Tên"
                        id="characterName"
                        value={identity.name}
                        onChange={(e) => onIdentityChange({ name: e.target.value })}
                        placeholder="Nhập tên nhân vật"
                    />
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Giới Tính</p>
                        <div className="flex items-center gap-2 h-full">
                            {GENDERS.map(gender => (
                                <button
                                    key={gender}
                                    onClick={() => onIdentityChange({ gender })}
                                    className={`px-3 py-1.5 text-sm rounded-md border transition-all duration-200 w-full ${
                                        identity.gender === gender 
                                        ? 'bg-teal-500/20 border-teal-400 text-white' 
                                        : 'bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50'
                                    }`}
                                >
                                    {gender}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <TextAreaField
                    label="Xuất Thân"
                    id="characterOrigin"
                    value={identity.origin}
                    onChange={(e) => onIdentityChange({ origin: e.target.value })}
                    placeholder="VD: Đệ tử ngoại môn của một sơn phái bí ẩn..."
                    rows={2}
                />
                <TextAreaField
                    label="Ngoại Hình"
                    id="characterAppearance"
                    value={identity.appearance}
                    onChange={(e) => onIdentityChange({ appearance: e.target.value })}
                    placeholder="VD: Thiếu nữ áo trắng, dung mạo thanh lệ, đôi mắt trong như nước hồ thu..."
                    rows={2}
                />
                 <div>
                    <p className="text-xs text-gray-400 mb-1">Tính Cách</p>
                    <div className="flex justify-start items-center gap-1 bg-gray-900/60 p-1 rounded-full border border-gray-700 max-w-full overflow-x-auto">
                        {PERSONALITY_TRAITS.map(trait => (
                            <button
                                key={trait.name}
                                onClick={() => onIdentityChange({ personality: trait.name })}
                                title={trait.description}
                                className={`flex-shrink-0 text-[11px] px-2 py-0.5 rounded-full transition-all duration-200 ${
                                    identity.personality === trait.name 
                                    ? 'bg-amber-400/80 text-black font-bold'
                                    : 'text-gray-300 hover:bg-gray-700/50'
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