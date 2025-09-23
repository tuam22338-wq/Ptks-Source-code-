
import React, { useState, memo, useEffect, useRef } from 'react';
import type { CharacterIdentity, Gender } from '../../../types';
import { PERSONALITY_TRAITS } from '../../../constants';
import { GiHoodedFigure } from 'react-icons/gi';

interface CharacterIdentityDisplayProps {
    identity: Omit<CharacterIdentity, 'origin' | 'age'>;
    onIdentityChange: (updatedIdentity: Partial<Omit<CharacterIdentity, 'origin' | 'age'>>) => void;
    isFinal?: boolean;
}

const GENDERS: Gender[] = ['Nam', 'Nữ'];

const getPersonalityFromValue = (value: number): CharacterIdentity['personality'] => {
    if (value < -50) return 'Tà Ác';
    if (value < -15) return 'Hỗn Loạn';
    if (value > 50) return 'Chính Trực';
    return 'Trung Lập';
};

const getValueFromPersonality = (personality: CharacterIdentity['personality']): number => {
    switch (personality) {
        case 'Tà Ác': return -85;
        case 'Hỗn Loạn': return -35;
        case 'Chính Trực': return 85;
        case 'Trung Lập':
        default: return 0;
    }
};

const CharacterIdentityDisplay: React.FC<CharacterIdentityDisplayProps> = ({ identity, onIdentityChange, isFinal = false }) => {
    const [name, setName] = useState(identity.name);
    const [familyName, setFamilyName] = useState(identity.familyName);
    const [appearance, setAppearance] = useState(identity.appearance);
    const [alignmentValue, setAlignmentValue] = useState(() => getValueFromPersonality(identity.personality));
    const isMounted = useRef(false);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    useEffect(() => {
        setName(identity.name);
        setFamilyName(identity.familyName);
        setAppearance(identity.appearance);
        setAlignmentValue(getValueFromPersonality(identity.personality));
    }, [identity]);

    const handleBlur = () => {
        if(isMounted.current) {
            onIdentityChange({ name, familyName, appearance });
        }
    };

    const handleAlignmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        setAlignmentValue(value);
        const newPersonality = getPersonalityFromValue(value);
        if (newPersonality !== identity.personality) {
            onIdentityChange({ personality: newPersonality });
        }
    };
    
    const alignmentColor = alignmentValue < -50 ? 'text-red-400' : alignmentValue > 50 ? 'text-sky-400' : 'text-gray-300';

    return (
        <div className="bg-black/20 p-4 rounded-lg flex flex-col sm:flex-row gap-4 md:gap-6">
            <div className="w-full sm:w-24 flex-shrink-0 flex flex-col items-center justify-center p-2 bg-black/20 rounded-lg border border-gray-700/40 aspect-square sm:aspect-[9/16]">
                <GiHoodedFigure className="text-8xl text-gray-600" />
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
                                    className="w-full themed-input"
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
                                    className="w-full themed-input"
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
                                className="w-full themed-textarea"
                            />
                        </div>
                         <div>
                            <label className="block text-xs text-gray-400 mb-1">Thiên Hướng</label>
                             <div className="flex items-center gap-3 bg-black/20 p-2 rounded-lg">
                                <span className="text-sm font-bold text-red-500">Tà Đạo</span>
                                <input
                                    type="range"
                                    min="-100"
                                    max="100"
                                    value={alignmentValue}
                                    onChange={handleAlignmentChange}
                                    className="themed-slider flex-grow"
                                />
                                <span className="text-sm font-bold text-sky-500">Chính Đạo</span>
                            </div>
                            <p className={`text-center text-sm font-bold mt-1 ${alignmentColor}`}>{identity.personality}</p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default memo(CharacterIdentityDisplay);