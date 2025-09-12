import React, { useState, useMemo, memo } from 'react';
import type { NPC, Location, PlayerCharacter, PlayerNpcRelationship } from '../types';
import { INNATE_TALENT_RANKS, NPC_LIST, WORLD_MAP } from '../constants';
import { FaUsers, FaMapMarkedAlt, FaArrowLeft, FaEye } from 'react-icons/fa';

interface WikiPanelProps {
    playerCharacter: PlayerCharacter;
    allNpcs: NPC[];
    encounteredNpcIds: string[];
    discoveredLocations: Location[];
}

const NpcDetailView: React.FC<{ npc: NPC, allNpcs: NPC[], relationship?: PlayerNpcRelationship }> = ({ npc, allNpcs, relationship }) => (
    <div className="p-4 bg-black/20 rounded-lg border border-gray-700/60 animate-fade-in" style={{animationDuration: '300ms'}}>
        {/* FIX: Access npc.identity.name instead of npc.name. */}
        <h3 className="text-xl text-amber-300 font-bold font-title">{npc.identity.name}</h3>
        <div className="mt-4 space-y-4 text-sm">
            {relationship && (
                <p><strong className="text-gray-400">Quan hệ:</strong> <span className="text-yellow-300 font-semibold">{relationship.status} ({relationship.value})</span></p>
            )}
             {npc.faction && <p><strong className="text-gray-400">Phe phái:</strong> <span className="text-gray-300 font-semibold">{npc.faction}</span></p>}
            <p><strong className="text-gray-400">Trạng thái:</strong> <em className="text-gray-300">"{npc.status}"</em></p>
            {/* FIX: Access npc.identity.appearance instead of npc.description. */}
            <p><strong className="text-gray-400">Ngoại hình:</strong> <span className="text-gray-300">{npc.identity.appearance}</span></p>
            {/* FIX: Access npc.identity.origin instead of npc.origin. */}
            <p><strong className="text-gray-400">Xuất thân:</strong> <span className="text-gray-300">{npc.identity.origin}</span></p>
            {/* FIX: Access npc.identity.personality instead of npc.personality. */}
            <p><strong className="text-gray-400">Tính cách:</strong> <span className="text-gray-300">{npc.identity.personality}</span></p>
            
            {npc.relationships && npc.relationships.length > 0 && (
                <div>
                    <h4 className="font-semibold text-gray-300 mb-2">Mối quan hệ:</h4>
                    <div className="space-y-2">
                        {npc.relationships.map((rel, index) => {
                            const targetNpc = allNpcs.find(n => n.id === rel.targetNpcId);
                            if (!targetNpc) return null;
                            return (
                                <div key={index} className="text-sm text-gray-300 bg-black/20 px-3 py-2 rounded-md border border-gray-700/60">
                                    <p className="font-semibold text-purple-300">
                                        {/* FIX: Access targetNpc.identity.name instead of targetNpc.name. */}
                                        {rel.type} với <span className="text-amber-300">{targetNpc.identity.name}</span>
                                    </p>
                                    <p className="text-xs italic text-gray-400">{rel.description}</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div>
                <h4 className="font-semibold text-gray-300 mb-2">Tiên Tư:</h4>
                <div className="space-y-2">
                    {npc.talents.length > 0 ? npc.talents.map(talent => {
                        const rankStyle = INNATE_TALENT_RANKS[talent.rank] || INNATE_TALENT_RANKS['Phàm Tư'];
                        return (
                            <div key={talent.name} className="p-2 bg-black/20 rounded-lg border border-gray-700/60" title={talent.effect}>
                                <h5 className={`font-bold font-title text-sm ${rankStyle.color}`}>{talent.name} <span className="text-xs">[{talent.rank}]</span></h5>
                                <p className="text-xs text-gray-400">{talent.description}</p>
                            </div>
                        )
                    }) : <p className="text-sm text-gray-500">Không có tiên tư đặc biệt.</p>}
                </div>
            </div>
        </div>
    </div>
);

const LocationDetailView: React.FC<{ location: Location }> = ({ location }) => (
     <div className="p-4 bg-black/20 rounded-lg border border-gray-700/60 animate-fade-in" style={{animationDuration: '300ms'}}>
        <h3 className="text-xl text-amber-300 font-bold font-title">{location.name}</h3>
        <p className="text-xs text-gray-500">{location.type}</p>
        <div className="mt-4 space-y-4 text-sm">
             <p><strong className="text-gray-400">Mô tả:</strong> <span className="text-gray-300">{location.description}</span></p>
             <p><strong className="text-gray-400">Tọa độ:</strong> <span className="text-gray-300">({location.coordinates.x}, {location.coordinates.y})</span></p>
             {location.factionInfluence && location.factionInfluence.length > 0 && (
                 <p><strong className="text-gray-400">Thế lực:</strong> <span className="text-gray-300">{location.factionInfluence.map(f => `${f.name} (${f.level})`).join(', ')}</span></p>
             )}
        </div>
    </div>
);


const WikiPanel: React.FC<WikiPanelProps> = ({ playerCharacter, allNpcs, encounteredNpcIds, discoveredLocations }) => {
    const [view, setView] = useState<'list' | 'npc_detail' | 'location_detail'>('list');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const { relationships } = playerCharacter;

    const combinedNpcs = useMemo(() => {
        const npcMap = new Map<string, NPC>();
        // Add all NPCs from game state
        allNpcs.forEach(npc => npcMap.set(npc.id, npc));
        // Add lore NPCs, potentially overwriting if IDs match, but usually they are distinct
        NPC_LIST.forEach(npc => npcMap.set(npc.id, npc));
        // FIX: Access npc.identity.name for sorting.
        return Array.from(npcMap.values()).sort((a, b) => a.identity.name.localeCompare(b.identity.name));
    }, [allNpcs]);
    
    const combinedLocations = useMemo(() => {
        const locationMap = new Map<string, Location>();
        discoveredLocations.forEach(loc => locationMap.set(loc.id, loc));
        WORLD_MAP.forEach(loc => locationMap.set(loc.id, loc));
        return Array.from(locationMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    }, [discoveredLocations]);


    const handleSelectNpc = (npc: NPC) => {
        setSelectedId(npc.id);
        setView('npc_detail');
    };
    
    const handleSelectLocation = (location: Location) => {
        setSelectedId(location.id);
        setView('location_detail');
    };

    const handleBackToList = () => {
        setView('list');
        setSelectedId(null);
    };

    const selectedNpc = view === 'npc_detail' ? combinedNpcs.find(n => n.id === selectedId) : null;
    const selectedLocation = view === 'location_detail' ? combinedLocations.find(l => l.id === selectedId) : null;
    const selectedRelationship = selectedNpc ? relationships.find(r => r.npcId === selectedNpc.id) : undefined;

    if (view !== 'list') {
        return (
            <div className="animate-fade-in" style={{animationDuration: '300ms'}}>
                <button onClick={handleBackToList} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4">
                    <FaArrowLeft /> Quay lại danh sách
                </button>
                {selectedNpc && <NpcDetailView npc={selectedNpc} allNpcs={combinedNpcs} relationship={selectedRelationship} />}
                {selectedLocation && <LocationDetailView location={selectedLocation} />}
            </div>
        );
    }
    
    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div>
                <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                    <FaUsers className="text-cyan-300" /> Thiên Hạ Chúng Sinh
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {combinedNpcs.length > 0 ? (
                        combinedNpcs.map(npc => {
                            const isEncountered = encounteredNpcIds.includes(npc.id);
                            const rel = relationships.find(r => r.npcId === npc.id);
                            return (
                                <button key={npc.id} onClick={() => handleSelectNpc(npc)} className="w-full text-left bg-black/20 p-2 rounded-lg border border-gray-700/60 hover:bg-gray-800/50 hover:border-cyan-400/50 transition-colors">
                                    <div className="flex justify-between items-center">
                                        {/* FIX: Access npc.identity.name instead of npc.name. */}
                                        <h4 className={`font-bold font-title text-sm ${isEncountered ? 'text-cyan-300' : 'text-gray-400'}`}>{npc.identity.name}</h4>
                                        <div className="flex items-center gap-2">
                                            {rel && <span className="text-xs text-yellow-300">{rel.status}</span>}
                                            {isEncountered && <FaEye className="text-cyan-400" title="Đã gặp"/>}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <p className="text-center text-sm text-gray-500 py-2">Chưa có thông tin.</p>
                    )}
                </div>
            </div>

            <div>
                <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                    <FaMapMarkedAlt className="text-lime-300" /> Cửu Châu Địa Mạch
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {combinedLocations.length > 0 ? (
                        combinedLocations.map(loc => {
                            const isDiscovered = discoveredLocations.some(l => l.id === loc.id);
                            return (
                                <button key={loc.id} onClick={() => handleSelectLocation(loc)} className="w-full text-left p-2 bg-black/20 rounded-lg border border-gray-700/60 hover:bg-gray-800/50 hover:border-lime-400/50 transition-colors">
                                    <div className="flex justify-between items-center">
                                        <h4 className={`font-bold font-title text-sm ${isDiscovered ? 'text-lime-300' : 'text-gray-400'}`}>{loc.name}</h4>
                                        {isDiscovered && <FaEye className="text-lime-400" title="Đã khám phá"/>}
                                    </div>
                                    <p className="text-xs text-gray-500">{loc.type}</p>
                                </button>
                            );
                        })
                    ) : (
                        <p className="text-center text-sm text-gray-500 py-2">Chưa có thông tin.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(WikiPanel);