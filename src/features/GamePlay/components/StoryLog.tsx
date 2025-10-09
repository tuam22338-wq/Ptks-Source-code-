import React, { useState, memo, useMemo, useRef, useEffect } from 'react';
import type { StoryEntry, NPC, GameState, MechanicalIntent, ActiveQuest, Location } from '../../../types';
import { FaVolumeUp, FaTimes, FaArrowUp, FaArrowDown, FaBook, FaMapPin, FaUser } from 'react-icons/fa';
import { UI_ICONS, ITEM_QUALITY_STYLES, CURRENCY_DEFINITIONS } from '../../../constants';
import { useAppContext } from '../../../contexts/AppContext';
import LoadingSpinner from '../../../components/LoadingSpinner';
import { GiStairsGoal } from 'react-icons/gi';

// --- NpcTooltip Component ---
const AttributeRow: React.FC<{ label: string; value: string | number; icon: React.ElementType; description?: string; }> = ({ label, value, icon: Icon, description }) => (
    <div className="flex justify-between items-center text-sm py-1" title={description}>
        <div className="flex items-center gap-2 text-gray-300"><Icon /><span>{label}</span></div>
        <span className="font-mono font-semibold text-amber-200">{value}</span>
    </div>
);

const NpcTooltip: React.FC<{ npc: NPC; gameState: GameState; onClose: () => void; }> = ({ npc, gameState, onClose }) => {
    const [activeTab, setActiveTab] = useState<'status' | 'inventory'>('status');
    const { attributeSystem, realmSystem } = gameState;

    const renderAttributeGroup = (group: any) => {
        const attributesInGroup = attributeSystem.definitions
            .filter(def => def.group === group.id && npc.attributes[def.id]);
        if (attributesInGroup.length === 0) return null;

        return (
            <div key={group.id} className="p-2 rounded-md" style={{boxShadow: 'var(--shadow-pressed)'}}>
                <h5 className="font-bold text-amber-300 text-sm mb-1">{group.name}</h5>
                {attributesInGroup.map(def => {
                    const attr = npc.attributes[def.id];
                    if (!attr) return null;
                    const Icon = UI_ICONS[def.iconName] || (() => <span />);
                    return <AttributeRow key={def.id} label={def.name} value={Math.floor(attr.value)} icon={Icon} description={def.description} />;
                })}
            </div>
        );
    };
    
    const realm = realmSystem.find(r => r.id === npc.cultivation.currentRealmId);
    const stage = realm?.stages.find(s => s.id === npc.cultivation.currentStageId);
    // FIX: Explicitly type 'amount' to resolve 'unknown' type error and handle potential 'undefined' values.
    const currencies = Object.entries(npc.currencies || {}).filter(([, amount]: [string, number | undefined]) => amount && amount > 0);

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
            style={{ animationDuration: '200ms' }}
            onClick={onClose}
        >
            <div
                className="w-96 max-w-[90vw] rounded-lg shadow-2xl text-white flex flex-col max-h-[80vh]"
                style={{ 
                    backgroundColor: 'var(--bg-color)',
                    boxShadow: 'var(--shadow-raised)',
                    border: '1px solid var(--shadow-light)'
                }}
                onClick={e => e.stopPropagation()}
            >
                <div className="p-3 border-b border-[var(--shadow-dark)] flex justify-between items-center flex-shrink-0">
                    <h4 className="text-xl font-bold font-title text-amber-300">{npc.identity.name}</h4>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-white"><FaTimes /></button>
                </div>
                
                <div className="flex border-b border-[var(--shadow-dark)] flex-shrink-0">
                    <button 
                        onClick={() => setActiveTab('status')} 
                        className={`w-1/2 py-2 text-sm font-semibold transition-colors ${activeTab === 'status' ? 'bg-[var(--shadow-light)] text-[var(--text-color)]' : 'text-[var(--text-muted-color)] hover:bg-[var(--shadow-dark)]'}`}
                    >
                        Trạng Thái
                    </button>
                    <button 
                        onClick={() => setActiveTab('inventory')} 
                        className={`w-1/2 py-2 text-sm font-semibold transition-colors ${activeTab === 'inventory' ? 'bg-[var(--shadow-light)] text-[var(--text-color)]' : 'text-[var(--text-muted-color)] hover:bg-[var(--shadow-dark)]'}`}
                    >
                        Túi Đồ
                    </button>
                </div>

                <div className="p-3 overflow-y-auto space-y-3">
                    {activeTab === 'status' && (
                        <>
                            <p className="text-xs italic text-gray-400">"{npc.identity.origin}"</p>
                            <div className="text-sm space-y-1">
                                <p><strong className="text-gray-300">Tuổi:</strong> {npc.identity.age}</p>
                                <p><strong className="text-gray-300">Tính cách:</strong> {npc.identity.personality}</p>
                                {realm && stage && <p><strong className="text-gray-300">Cảnh giới:</strong> {realm.name} - {stage.name}</p>}
                            </div>
                            <div className="space-y-2">
                                {attributeSystem.groups.map(renderAttributeGroup)}
                            </div>
                        </>
                    )}
                    {activeTab === 'inventory' && (
                        <div className="space-y-4">
                            <div>
                                <h5 className="font-bold text-amber-300 text-sm mb-2">Tài Sản</h5>
                                {currencies.length > 0 ? (
                                    currencies.map(([name, amount]) => (
                                        <div key={name} className="flex justify-between items-center text-sm py-1">
                                            <span className="text-gray-300">{name}</span>
                                            <span className="font-mono font-semibold text-amber-200">{Number(amount).toLocaleString()}</span>
                                        </div>
                                    ))
                                ) : <p className="text-xs text-gray-500 italic">Không có tài sản.</p>}
                            </div>
                            <div>
                                <h5 className="font-bold text-amber-300 text-sm mb-2">Vật Phẩm</h5>
                                {(npc.inventory?.items || []).length > 0 ? (
                                    <div className="space-y-2">
                                        {npc.inventory.items.map((item, index) => (
                                            <div key={index} className="flex items-center gap-3 p-2 rounded" style={{boxShadow: 'var(--shadow-pressed)'}}>
                                                <span className="text-2xl">{item.icon || '📜'}</span>
                                                <div>
                                                    <p className={`text-sm font-semibold ${ITEM_QUALITY_STYLES[item.quality]?.color || 'text-gray-300'}`}>{item.name} <span className="text-xs text-gray-400">x{item.quantity}</span></p>
                                                    <p className="text-xs text-gray-500">{item.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-xs text-gray-500 italic">Túi đồ trống.</p>}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- NEW QuickInfoTooltip Component ---
const QuickInfoTooltip: React.FC<{
    type: 'npc' | 'location';
    data: any;
    x: number;
    y: number;
    gameState: GameState;
}> = ({ type, data, x, y, gameState }) => {
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: y + 15, left: x });

    useEffect(() => {
        if (tooltipRef.current) {
            const rect = tooltipRef.current.getBoundingClientRect();
            let newLeft = x;
            if (x + rect.width > window.innerWidth) {
                newLeft = x - rect.width;
            }
            setPosition({ top: y + 15, left: newLeft });
        }
    }, [x, y]);

    let content;
    if (type === 'npc' && data) {
        const npc = data as NPC;
        const realm = gameState.realmSystem.find(r => r.id === npc.cultivation.currentRealmId);
        const stage = realm?.stages.find(s => s.id === npc.cultivation.currentStageId);
        content = (
            <>
                <h5 className="font-bold font-title text-amber-300 flex items-center gap-2"><FaUser /> {npc.identity.name}</h5>
                <p className="text-xs text-gray-400">{npc.status}</p>
                {realm && stage && <p className="text-sm text-cyan-300">{realm.name} - {stage.name}</p>}
            </>
        );
    } else if (type === 'location' && data) {
        const location = data as Location;
        content = (
            <>
                <h5 className="font-bold font-title text-sky-300 flex items-center gap-2"><FaMapPin /> {location.name}</h5>
                <p className="text-xs text-gray-400">{location.type}</p>
                <p className="text-sm text-gray-300 italic truncate">{location.description}</p>
            </>
        );
    }

    return (
        <div
            ref={tooltipRef}
            className="fixed z-[100] w-64 p-3 rounded-lg shadow-2xl pointer-events-none animate-fade-in"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                backgroundColor: 'var(--bg-color)',
                border: '1px solid var(--shadow-light)',
                animationDuration: '150ms'
            }}
        >
            {content}
        </div>
    );
};


// --- InteractiveText Component ---
const InteractiveText: React.FC<{
    text: string;
    gameState: GameState;
    onNpcClick: (npc: NPC, event: React.MouseEvent) => void;
    onEntityHover: (type: 'npc' | 'location', data: any, event: React.MouseEvent) => void;
    onEntityLeave: () => void;
}> = ({ text, gameState, onNpcClick, onEntityHover, onEntityLeave }) => {
    const content = useMemo(() => {
        if (!text || (!gameState.activeNpcs && !gameState.discoveredLocations)) return text;

        const allNpcNames = (gameState.activeNpcs || []).map(npc => npc.identity.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(Boolean);
        const allLocationNames = (gameState.discoveredLocations || []).map(loc => loc.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).filter(Boolean);
        
        const allNames = [...new Set([...allNpcNames, ...allLocationNames])];
        if (allNames.length === 0) return text;
        
        allNames.sort((a, b) => b.length - a.length);
        
        const regex = new RegExp(`\\b(${allNames.join('|')})\\b`, 'g');
        const parts = text.split(regex);

        return parts.map((part, i) => {
            const npc = (gameState.activeNpcs || []).find(n => n.identity.name === part);
            if (npc) {
                return (
                    <span
                        key={`npc-${i}`}
                        className="font-bold text-yellow-400 cursor-pointer hover:underline"
                        onClick={(e) => onNpcClick(npc, e)}
                        onMouseEnter={(e) => onEntityHover('npc', npc, e)}
                        onMouseLeave={onEntityLeave}
                    >
                        {part}
                    </span>
                );
            }
            const location = (gameState.discoveredLocations || []).find(l => l.name === part);
            if (location) {
                return (
                     <span
                        key={`loc-${i}`}
                        className="font-bold text-cyan-400 cursor-pointer hover:underline"
                        onMouseEnter={(e) => onEntityHover('location', location, e)}
                        onMouseLeave={onEntityLeave}
                    >
                        {part}
                    </span>
                );
            }
            return part;
        });
    }, [text, gameState.activeNpcs, gameState.discoveredLocations, onNpcClick, onEntityHover, onEntityLeave]);

    return <>{content}</>;
};


// --- EffectsRenderer Component ---
const EffectsRenderer: React.FC<{ effects: MechanicalIntent; gameState: GameState }> = ({ effects, gameState }) => {
    const hasVisibleEffect =
        (effects.itemsGained && effects.itemsGained.length > 0) ||
        (effects.itemsLost && effects.itemsLost.length > 0) ||
        (effects.currencyChanges && effects.currencyChanges.length > 0) ||
        (effects.statChanges && effects.statChanges.some(c => c.change !== 0)) ||
        (effects.newQuests && effects.newQuests.length > 0) ||
        effects.realmChange;

    if (!hasVisibleEffect) return null;
    
    const { attributeSystem } = gameState;

    return (
        <div className="mt-4 p-3 rounded-lg border-t-2 border-amber-800/30" style={{boxShadow: 'var(--shadow-pressed)'}}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {effects.realmChange && (
                     <div className="col-span-full p-2 text-center bg-yellow-500/10 border border-yellow-500/30 rounded-md">
                        <p className="text-lg font-bold font-title text-amber-300 flex items-center justify-center gap-2"><GiStairsGoal /> ĐỘT PHÁ CẢNH GIỚI!</p>
                    </div>
                )}
                {effects.itemsGained?.map((item, i) => (
                    <div key={`gain-${i}`} className="flex items-center gap-2 text-sm">
                        <span className="text-green-400 font-bold">+ {item.quantity}</span>
                        <span className="text-xl">{item.icon}</span>
                        <span className={`${ITEM_QUALITY_STYLES[item.quality]?.color || 'text-gray-300'} font-semibold`}>{item.name}</span>
                    </div>
                ))}
                {effects.itemsLost?.map((item, i) => (
                    <div key={`lost-${i}`} className="flex items-center gap-2 text-sm">
                        <span className="text-red-400 font-bold">- {item.quantity}</span>
                        <span className="text-gray-500 line-through">{item.name}</span>
                    </div>
                ))}
                {effects.statChanges?.filter(c => c.change !== 0).map((change, i) => {
                    const attrDef = attributeSystem.definitions.find(d => d.id === change.attribute);
                    const isPositive = (change.change || 0) > 0;
                    if (!attrDef) return null;
                    return (
                        <div key={`stat-${i}`} className="flex items-center gap-2 text-sm">
                            {isPositive ? <FaArrowUp className="text-green-500" /> : <FaArrowDown className="text-red-500" />}
                            <span className="text-gray-400">{attrDef.name}:</span>
                            <span className={`font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>{isPositive ? '+' : ''}{change.change}</span>
                        </div>
                    );
                })}
                {effects.currencyChanges?.map((change, i) => {
                    const isPositive = change.change > 0;
                    return (
                        <div key={`curr-${i}`} className="flex items-center gap-2 text-sm">
                            {isPositive ? <FaArrowUp className="text-green-500" /> : <FaArrowDown className="text-red-500" />}
                            <span className="text-gray-400">{change.currencyName}:</span>
                            <span className={`font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>{isPositive ? '+' : ''}{change.change.toLocaleString()}</span>
                        </div>
                    );
                })}
                {effects.newQuests?.map((quest, i) => (
                     <div key={`quest-${i}`} className="col-span-full p-2 bg-blue-500/10 border-l-4 border-blue-500/50 rounded-r-md">
                        <p className="text-sm font-bold text-blue-300 flex items-center gap-2"><FaBook /> Nhiệm vụ mới: {quest.title}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};


// --- Main StoryLog Component ---
const StoryLog: React.FC<{
    pageEntries: StoryEntry[];
    gameState: GameState;
    onSpeak: (text: string) => void;
}> = ({ pageEntries, gameState, onSpeak }) => {
    const [modalNpc, setModalNpc] = useState<NPC | null>(null);
    const [tooltip, setTooltip] = useState<{ type: 'npc' | 'location'; data: any; x: number; y: number } | null>(null);

    const handleSpeak = (content: string) => {
        const cleanText = content.replace(/\[.*?\]/g, '').replace(/<[^>]+>/g, '');
        onSpeak(cleanText);
    };
    
    const handleNpcClick = (npc: NPC, event: React.MouseEvent) => {
        event.stopPropagation();
        setTooltip(null); // Hide tooltip when modal opens
        setModalNpc(npc);
    };

    const handleEntityHover = (type: 'npc' | 'location', data: any, event: React.MouseEvent) => {
        setTooltip({ type, data, x: event.clientX, y: event.clientY });
    };

    const handleEntityLeave = () => {
        setTooltip(null);
    };

    const renderContent = (entry: StoryEntry) => (
        <InteractiveText
            text={entry.content}
            gameState={gameState}
            onNpcClick={handleNpcClick}
            onEntityHover={handleEntityHover}
            onEntityLeave={handleEntityLeave}
        />
    );

    const renderEntry = (entry: StoryEntry, children: React.ReactNode) => (
        <>
            {children}
            {entry.effects && <EffectsRenderer effects={entry.effects} gameState={gameState} />}
        </>
    );

    return (
        <div className="flex-grow p-4 sm:p-6 overflow-y-auto space-y-4">
            {modalNpc && <NpcTooltip npc={modalNpc} gameState={gameState} onClose={() => setModalNpc(null)} />}
            {tooltip && <QuickInfoTooltip type={tooltip.type} data={tooltip.data} x={tooltip.x} y={tooltip.y} gameState={gameState} />}

            {pageEntries.map((entry) => {
                const animationStyle = { animationDuration: '600ms' };
                const isSpeakable = ['narrative', 'dialogue', 'action-result', 'system-notification', 'player-dialogue', 'combat'].includes(entry.type);

                switch (entry.type) {
                    case 'narrative':
                        return (
                            <div key={entry.id} className="group relative animate-fade-in my-4" style={animationStyle}>
                                {renderEntry(entry,
                                    <p className="font-bold text-lg text-justify leading-relaxed whitespace-pre-wrap">{renderContent(entry)}</p>
                                )}
                                {isSpeakable && <button onClick={() => handleSpeak(entry.content)} className="absolute -left-10 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"><FaVolumeUp /></button>}
                            </div>
                        );
                    
                    case 'system':
                        return <p key={entry.id} style={animationStyle} className="text-center text-xs text-[var(--text-muted-color)]/70 tracking-widest my-4 uppercase animate-fade-in">{renderContent(entry)}</p>;
                    
                    case 'system-notification':
                        return (
                             <div key={entry.id} className="group relative my-4 p-3 border-l-4 border-[var(--secondary-accent-color)] rounded-r-lg animate-fade-in" style={{...animationStyle, boxShadow: 'var(--shadow-pressed)'}}>
                                {renderEntry(entry,
                                    <p className="font-mono text-[var(--secondary-accent-color)] whitespace-pre-wrap">{renderContent(entry)}</p>
                                )}
                                {isSpeakable && <button onClick={() => handleSpeak(entry.content)} className="absolute -right-8 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"><FaVolumeUp /></button>}
                            </div>
                        );

                    case 'player-action':
                    case 'player-dialogue':
                        const pendingClass = entry.isPending ? 'opacity-60' : '';
                        return (
                            <div key={entry.id} style={animationStyle} className={`group relative flex justify-end ml-10 sm:ml-20 animate-fade-in transition-opacity ${pendingClass}`}>
                                <div className="player-bubble flex items-center gap-2">
                                    <p className={`text-lg leading-relaxed ${entry.type === 'player-action' ? 'text-lime-300 italic' : 'text-cyan-200'}`}>
                                        {renderContent(entry)}
                                    </p>
                                    {entry.isPending && <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-gray-400"></div>}
                                </div>
                                 {isSpeakable && <button onClick={() => handleSpeak(entry.content)} className="absolute -left-8 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"><FaVolumeUp /></button>}
                            </div>
                        );
                    
                    case 'dialogue':
                    case 'action-result':
                    case 'combat':
                    default:
                        if (entry.content === '') {
                            return (
                                <div key={entry.id} className="flex justify-start mr-10 sm:mr-20">
                                    <div className="npc-bubble">
                                        <LoadingSpinner size="sm" />
                                    </div>
                                </div>
                            );
                        }
                        return (
                            <div key={entry.id} style={animationStyle} className="group relative flex justify-start mr-10 sm:mr-20 animate-fade-in">
                                <div className="npc-bubble">
                                    {renderEntry(entry,
                                        <p className="text-amber-200 text-lg leading-relaxed font-bold whitespace-pre-wrap">{renderContent(entry)}</p>
                                    )}
                                </div>
                                {isSpeakable && <button onClick={() => handleSpeak(entry.content)} className="absolute -right-8 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"><FaVolumeUp /></button>}
                            </div>
                        );
                }
            })}
        </div>
    );
};

export default memo(StoryLog);