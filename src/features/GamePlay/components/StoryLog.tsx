import React, { useState, memo, useMemo, useRef, useEffect } from 'react';
import type { StoryEntry, NPC, GameState, MechanicalIntent, ActiveQuest, Location } from '../../../types';
import { FaVolumeUp, FaTimes, FaArrowUp, FaArrowDown, FaBook, FaMapPin, FaUser } from 'react-icons/fa';
import { UI_ICONS, ITEM_QUALITY_STYLES, CURRENCY_DEFINITIONS } from '../../../constants';
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
            <div key={group.id} className="neumorphic-inset-box p-3">
                <h4 className="font-bold font-title mb-2" style={{color: 'var(--primary-accent-color)'}}>{group.name}</h4>
                <div className="space-y-1">
                    {attributesInGroup.map(def => {
                        const attr = npc.attributes[def.id];
                        const Icon = UI_ICONS[def.iconName] || (() => <span />);
                        
                        // Handle special case for informational attributes like realm
                        if (def.type === 'INFORMATIONAL' && def.id === 'canh_gioi') {
                             const currentRealm = realmSystem.find(r => r.id === npc.cultivation.currentRealmId);
                             const currentStage = currentRealm?.stages.find(s => s.id === npc.cultivation.currentStageId);
                             return (
                                <AttributeRow
                                    key={def.id}
                                    label={def.name}
                                    value={`${currentRealm?.name || ''} - ${currentStage?.name || ''}`}
                                    icon={Icon}
                                    description={def.description}
                                />
                            )
                        }

                        return (
                            <AttributeRow
                                key={def.id}
                                label={def.name}
                                value={Math.floor(attr.value)}
                                maxValue={attr.maxValue !== undefined ? Math.floor(attr.maxValue) : undefined}
                                icon={Icon}
                                description={def.description}
                            />
                        )
                    })}
                </div>
            </div>
        )
    };
    const sortedGroups = [...attributeSystem.groups].sort((a,b) => a.order - b.order);

    return (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20 w-[400px] max-w-[90vw] bg-stone-900/80 backdrop-blur-md border border-gray-700 rounded-xl shadow-2xl animate-fade-in" style={{animationDuration: '200ms'}} onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b border-gray-700/60">
                <h3 className="font-bold text-lg font-title text-amber-300">{npc.identity.name}</h3>
                <p className="text-xs text-gray-400 italic">"{npc.status}"</p>
            </div>
            <div className="flex bg-black/20">
                <button onClick={() => setActiveTab('status')} className={`flex-1 py-2 text-sm font-semibold ${activeTab === 'status' ? 'bg-gray-700/80 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}>Trạng Thái</button>
                <button onClick={() => setActiveTab('inventory')} className={`flex-1 py-2 text-sm font-semibold ${activeTab === 'inventory' ? 'bg-gray-700/80 text-white' : 'text-gray-400 hover:bg-gray-800/50'}`}>Hành Trang</button>
            </div>
            <div className="p-3 max-h-80 overflow-y-auto space-y-3">
                {activeTab === 'status' ? (
                    sortedGroups.map(renderAttributeGroup)
                ) : (
                    <div className="space-y-2">
                        {npc.inventory.items.length > 0 ? npc.inventory.items.map(item => (
                            <div key={item.id} className="text-sm p-2 bg-black/20 rounded">
                                <p className={`font-semibold ${ITEM_QUALITY_STYLES[item.quality].color}`}>{item.name} x{item.quantity}</p>
                                <p className="text-xs text-gray-500">{item.description}</p>
                            </div>
                        )) : <p className="text-center text-sm text-gray-500">Trống rỗng.</p>}
                         <div className="mt-4 pt-2 border-t border-gray-700/60">
                            {Object.entries(npc.currencies).map(([name, amount]) => (
                                <p key={name} className="text-sm">{name}: {amount.toLocaleString()}</p>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- Main StoryLog Component ---
interface StoryLogProps {
    pageEntries: StoryEntry[];
    gameState: GameState;
    onSpeak: (text: string, force?: boolean) => void;
}

const StoryLog: React.FC<StoryLogProps> = ({ pageEntries, gameState }) => {
    const { onSpeak } = { onSpeak: (text: string) => console.log(text) }; // Placeholder
    const [speakingEntryId, setSpeakingEntryId] = useState<number | null>(null);
    const [hoveredNpc, setHoveredNpc] = useState<NPC | null>(null);
    const npcRefs = useRef<Record<string, HTMLSpanElement | null>>({});

    const handleSpeak = (entry: StoryEntry) => {
        // ... TTS logic
    };

    const handleNpcClick = (npc: NPC) => {
        setHoveredNpc(npc);
    };

    const renderContentWithEntities = (entry: StoryEntry) => {
        let content = entry.content;
        const allEntities = [
            ...gameState.activeNpcs.map(e => ({ name: e.identity.name, type: 'npc' as const, entity: e })),
            ...gameState.playerCharacter.inventory.items.map(e => ({ name: e.name, type: 'item' as const, entity: e })),
        ];
        allEntities.sort((a, b) => b.name.length - a.name.length);

        const parts: (string | React.ReactNode)[] = [content];

        allEntities.forEach((entity, entityIndex) => {
            const newParts: (string | React.ReactNode)[] = [];
            parts.forEach((part, partIndex) => {
                if (typeof part !== 'string') {
                    newParts.push(part);
                    return;
                }
                const regex = new RegExp(`(${entity.name})`, 'g');
                const splitParts = part.split(regex);
                
                splitParts.forEach((splitPart, i) => {
                    if (splitPart === entity.name) {
                        if (entity.type === 'npc') {
                             newParts.push(
                                <span key={`${partIndex}-${entityIndex}-${i}`} className="font-bold text-amber-300 cursor-pointer hover:underline relative" onClick={() => handleNpcClick(entity.entity as NPC)}>
                                    {entity.name}
                                    {hoveredNpc?.id === (entity.entity as NPC).id && (
                                        <NpcTooltip npc={hoveredNpc} gameState={gameState} onClose={() => setHoveredNpc(null)} />
                                    )}
                                </span>
                            );
                        } else {
                            newParts.push(<strong key={`${partIndex}-${entityIndex}-${i}`} className="text-cyan-300">{entity.name}</strong>);
                        }
                    } else {
                        newParts.push(splitPart);
                    }
                });
            });
            parts.splice(0, parts.length, ...newParts);
        });
        return parts;
    };


    return (
        <div className="flex-grow w-full overflow-y-auto p-4 md:p-6" onClick={() => setHoveredNpc(null)}>
            <div className="max-w-4xl mx-auto space-y-5">
                {pageEntries.map((entry) => (
                    <div key={entry.id}>
                        {entry.type === 'player-action' && (
                             <div className="text-right text-lg italic text-gray-400">
                                <p>{entry.content}</p>
                            </div>
                        )}
                        {entry.type === 'player-dialogue' && (
                           <div className="text-right text-lg text-sky-300">
                                <p>"{entry.content}"</p>
                            </div>
                        )}
                        {(entry.type === 'narrative' || entry.type === 'action-result' || entry.type === 'dialogue') && entry.content.trim() && (
                             <div className="flex items-start gap-2 text-lg">
                                 <button onClick={() => handleSpeak(entry)} className="mt-1 text-gray-500 hover:text-white transition-colors">
                                    <FaVolumeUp />
                                 </button>
                                 <p style={{color: 'var(--text-color)'}}>
                                     {renderContentWithEntities(entry)}
                                 </p>
                            </div>
                        )}
                        {entry.type === 'combat' && (
                            <div className="text-center text-sm italic text-red-400 my-2 py-1 border-y border-red-500/30">
                                {entry.content}
                            </div>
                        )}
                        {entry.type === 'system' && (
                             <div className="text-center text-sm italic text-gray-500">
                                {entry.content}
                            </div>
                        )}
                        {entry.type === 'system-notification' && (
                            <div className="my-2 p-3 bg-teal-900/40 border border-teal-500/50 rounded-lg text-teal-200 text-sm flex items-start gap-3">
                                <GiStairsGoal className="text-xl mt-1 flex-shrink-0" />
                                <div>{renderContentWithEntities(entry)}</div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default memo(StoryLog);