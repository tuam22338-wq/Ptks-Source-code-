import React, { memo, useState, useMemo, useEffect } from 'react';
import type { GameState, NPC, Location, Faction, InventoryItem, MajorEvent, RagSource } from '../../../../../types';
import { useAppContext } from '../../../../../contexts/AppContext';
import { createAiHooksInstruction } from '../../../../../utils/modManager';
import { getAllSources } from '../../../../../services/ragService';
import { FaSearch, FaUserFriends, FaMapMarkedAlt, FaFlag, FaBoxOpen, FaScroll, FaSitemap } from 'react-icons/fa';
import { GiGears } from 'react-icons/gi';
import StoryGraphPanel from './StoryGraphPanel'; // Import the new graph panel

interface WikiPanelProps {
    gameState: GameState;
}

type Category = 'npcs' | 'locations' | 'factions' | 'items' | 'events' | 'rules' | 'graph';

const CATEGORIES: { id: Category; label: string; icon: React.ElementType }[] = [
    { id: 'npcs', label: 'Nhân Vật', icon: FaUserFriends },
    { id: 'locations', label: 'Địa Điểm', icon: FaMapMarkedAlt },
    { id: 'factions', label: 'Phe Phái', icon: FaFlag },
    { id: 'items', label: 'Vật Phẩm', icon: FaBoxOpen },
    { id: 'events', label: 'Sự Kiện', icon: FaScroll },
    { id: 'rules', label: 'Quy Luật', icon: GiGears },
    { id: 'graph', label: 'Đồ Thị', icon: FaSitemap },
];

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <span className="text-[10px] bg-sky-900/70 text-sky-200 rounded-full px-2 py-0.5">{children}</span>
);

const WikiPanel: React.FC<WikiPanelProps> = ({ gameState }) => {
    const { state } = useAppContext();
    const [activeCategory, setActiveCategory] = useState<Category>('npcs');
    const [searchTerm, setSearchTerm] = useState('');
    const [ragSources, setRagSources] = useState<RagSource[]>([]);

    useEffect(() => {
        const fetchRagSources = async () => {
            const sources = await getAllSources();
            setRagSources(sources.filter(s => s.isEnabled && s.status === 'INDEXED'));
        };
        fetchRagSources();
    }, []);

    const allItems = useMemo(() => {
        const itemMap = new Map<string, InventoryItem>();
        const processItem = (item: InventoryItem) => {
            if (!itemMap.has(item.name)) {
                itemMap.set(item.name, item);
            }
        };
        gameState.playerCharacter.inventory.items.forEach(processItem);
        gameState.activeNpcs.forEach(npc => npc.inventory?.items.forEach(processItem));
        return Array.from(itemMap.values());
    }, [gameState.playerCharacter.inventory.items, gameState.activeNpcs]);
    
    const filteredData = useMemo(() => {
        const lowerSearch = searchTerm.toLowerCase();
        if (!lowerSearch) return {
            npcs: gameState.activeNpcs,
            locations: gameState.discoveredLocations,
            factions: gameState.playerCharacter.reputation.map(r => ({ name: r.factionName, description: 'Chưa có thông tin chi tiết.', imageUrl: '' })),
            items: allItems,
            events: gameState.majorEvents,
        };
        
        const filter = (items: any[], fields: string[]) => 
            items.filter(item => 
                fields.some(field => {
                    const value = field.split('.').reduce((o, i) => o?.[i], item);
                    return typeof value === 'string' && value.toLowerCase().includes(lowerSearch);
                })
            );

        return {
            npcs: filter(gameState.activeNpcs, ['identity.name', 'status', 'identity.origin']),
            locations: filter(gameState.discoveredLocations, ['name', 'description']),
            factions: filter(gameState.playerCharacter.reputation, ['factionName']).map(r => ({ name: r.factionName, description: 'Chưa có thông tin chi tiết.', imageUrl: '' })),
            items: filter(allItems, ['name', 'description']),
            events: filter(gameState.majorEvents, ['title', 'summary']),
        };
    }, [searchTerm, gameState, allItems]);
    
    const renderContent = () => {
        switch (activeCategory) {
            case 'npcs':
                return filteredData.npcs.map(npc => (
                    <div key={npc.id} className="neumorphic-inset-box p-3">
                        <h5 className="font-bold text-[var(--text-color)]">{npc.identity.name}</h5>
                        <p className="text-xs text-[var(--text-muted-color)] italic">"{npc.status}"</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {npc.identity.personality && <Tag>{npc.identity.personality}</Tag>}
                            {npc.faction && <Tag>{npc.faction}</Tag>}
                            {npc.locationId && <Tag>{gameState.discoveredLocations.find(l => l.id === npc.locationId)?.name || 'Vô định'}</Tag>}
                        </div>
                    </div>
                ));
            case 'locations':
                return filteredData.locations.map(loc => (
                    <div key={loc.id} className="neumorphic-inset-box p-3">
                        <h5 className="font-bold text-[var(--text-color)]">{loc.name}</h5>
                        <p className="text-xs text-[var(--text-muted-color)]">{loc.description}</p>
                         <div className="flex flex-wrap gap-1 mt-2">
                            <Tag>{loc.type}</Tag>
                        </div>
                    </div>
                ));
            case 'factions':
                 return filteredData.factions.map(fac => (
                    <div key={fac.name} className="neumorphic-inset-box p-3">
                        <h5 className="font-bold text-[var(--text-color)]">{fac.name}</h5>
                        <p className="text-xs text-[var(--text-muted-color)]">{fac.description}</p>
                    </div>
                ));
            case 'items':
                return filteredData.items.map(item => (
                    <div key={item.id} className="neumorphic-inset-box p-3">
                        <h5 className="font-bold text-[var(--text-color)]">{item.name}</h5>
                        <p className="text-xs text-[var(--text-muted-color)]">{item.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                            <Tag>{item.type}</Tag>
                            <Tag>{item.quality}</Tag>
                        </div>
                    </div>
                ));
            case 'events':
                return filteredData.events.map(event => (
                    <div key={event.title} className="neumorphic-inset-box p-3">
                        <h5 className="font-bold text-[var(--text-color)]">{event.title} (Năm {event.year})</h5>
                        <p className="text-xs text-[var(--text-muted-color)]">{event.summary}</p>
                    </div>
                ));
            case 'rules':
                const modHooks = createAiHooksInstruction(gameState.activeMods);
                const playerHooks = gameState.playerCharacter.playerAiHooks;
                return (
                    <div className="space-y-4 text-sm">
                        <div className="neumorphic-inset-box p-3">
                            <h5 className="font-bold text-[var(--text-color)] mb-2">Quy Luật Tùy Chỉnh (Người Chơi)</h5>
                            <pre className="whitespace-pre-wrap font-mono text-xs bg-black/20 p-2 rounded">
                                {Object.values(playerHooks || {}).some(v => v) ? JSON.stringify(playerHooks, null, 2) : 'Chưa có quy luật nào được đặt.'}
                            </pre>
                        </div>
                         <div className="neumorphic-inset-box p-3">
                            <h5 className="font-bold text-[var(--text-color)] mb-2">Quy Luật Mod</h5>
                            <pre className="whitespace-pre-wrap font-mono text-xs bg-black/20 p-2 rounded">
                                {modHooks || 'Không có quy luật mod nào đang hoạt động.'}
                            </pre>
                        </div>
                         <div className="neumorphic-inset-box p-3">
                            <h5 className="font-bold text-[var(--text-color)] mb-2">Nguồn Tri Thức RAG Đang Hoạt Động</h5>
                            <ul className="list-disc list-inside text-xs space-y-1">
                                {ragSources.length > 0 ? ragSources.map(s => <li key={s.id}>{s.name} ({s.type})</li>) : <li>Không có nguồn RAG nào.</li>}
                            </ul>
                        </div>
                    </div>
                );
            case 'graph':
                return <StoryGraphPanel gameState={gameState} />;
            default:
                return <p>Không có dữ liệu.</p>;
        }
    };
    
    return (
        <div className="h-full flex flex-col animate-fade-in" style={{ animationDuration: '300ms' }}>
            {activeCategory !== 'graph' && (
                <div className="relative mb-2 flex-shrink-0">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted-color)]" />
                    <input 
                        type="text"
                        placeholder="Tìm kiếm trong bách khoa..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="input-neumorphic w-full !pl-9"
                    />
                </div>
            )}

            <div className="flex-shrink-0 flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                {CATEGORIES.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-3 py-2 flex items-center gap-2 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${activeCategory === cat.id ? 'bg-[var(--primary-accent-color)]/20 text-[var(--primary-accent-color)]' : 'bg-black/20 text-[var(--text-muted-color)] hover:bg-black/40'}`}
                    >
                        <cat.icon />
                        {cat.label}
                    </button>
                ))}
            </div>
            
            <div className={`mt-2 flex-grow min-h-0 ${activeCategory !== 'graph' ? 'overflow-y-auto pr-2 space-y-3' : ''}`}>
                 {renderContent()}
            </div>
        </div>
    );
};

export default memo(WikiPanel);