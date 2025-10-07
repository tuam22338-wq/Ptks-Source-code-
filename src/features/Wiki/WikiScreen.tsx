import React, { useState, useMemo, memo } from 'react';
import { FaArrowLeft, FaSearch, FaUserFriends, FaMapMarkedAlt, FaFlag, FaBoxOpen, FaScroll, FaGears, FaSitemap, FaBars } from 'react-icons/fa';
import { useAppContext } from '../../contexts/AppContext';
import type { GameState, NPC, Location, InventoryItem, MajorEvent } from '../../types';
import StoryGraphPanel from '../GamePlay/components/Sidebar/panels/StoryGraphPanel';

type Category = 'npcs' | 'locations' | 'factions' | 'items' | 'events' | 'graph';

const CATEGORIES: { id: Category; label: string; icon: React.ElementType }[] = [
    { id: 'npcs', label: 'Nhân Vật', icon: FaUserFriends },
    { id: 'locations', label: 'Địa Điểm', icon: FaMapMarkedAlt },
    { id: 'factions', label: 'Phe Phái', icon: FaFlag },
    { id: 'items', label: 'Vật Phẩm', icon: FaBoxOpen },
    { id: 'events', label: 'Sự Kiện', icon: FaScroll },
    { id: 'graph', label: 'Quan Hệ', icon: FaSitemap },
];

const WikiScreen: React.FC = () => {
    const { state, handleNavigate } = useAppContext();
    const { gameState } = state;

    const [activeCategory, setActiveCategory] = useState<Category>('npcs');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [isNavOpen, setIsNavOpen] = useState(false);

    const allItems = useMemo(() => {
        if (!gameState) return [];
        const itemMap = new Map<string, InventoryItem>();
        const processItem = (item: InventoryItem) => {
            if (!itemMap.has(item.name)) {
                itemMap.set(item.name, item);
            }
        };
        gameState.playerCharacter.inventory.items.forEach(processItem);
        gameState.activeNpcs.forEach(npc => npc.inventory?.items.forEach(processItem));
        return Array.from(itemMap.values());
    }, [gameState]);

    const filteredData = useMemo(() => {
        if (!gameState) return {};
        const lowerSearch = searchTerm.toLowerCase();
        
        const filter = (items: any[], fields: string[]) => 
            !items ? [] : items.filter(item => 
                fields.some(field => {
                    const value = field.split('.').reduce((o, i) => o?.[i], item);
                    return typeof value === 'string' && value.toLowerCase().includes(lowerSearch);
                })
            );

        return {
            npcs: filter(gameState.activeNpcs, ['identity.name', 'status', 'identity.origin']),
            locations: filter(gameState.discoveredLocations, ['name', 'description']),
            factions: filter(gameState.playerCharacter.reputation, ['factionName']).map(r => ({ name: r.factionName, description: `Danh vọng: ${r.status} (${r.value})` })),
            items: filter(allItems, ['name', 'description']),
            events: filter(gameState.majorEvents, ['title', 'summary']),
        };
    }, [searchTerm, gameState, allItems]);

    const renderItemList = () => {
        const data = (filteredData as any)[activeCategory];
        if (!data || data.length === 0) return <p className="text-center text-[var(--text-muted-color)] mt-8">Không có dữ liệu.</p>;

        return (
            <div className="space-y-2">
                {data.map((item: any, index: number) => (
                    <button key={item.id || item.name || index} onClick={() => setSelectedItem(item)} className="w-full text-left p-3 rounded-lg transition-colors hover:bg-[var(--shadow-light)]">
                        <h4 className="font-bold text-[var(--text-color)]">{item.name || item.identity?.name || item.title || item.factionName}</h4>
                        <p className="text-xs text-[var(--text-muted-color)] truncate">{item.description || item.summary || item.status}</p>
                    </button>
                ))}
            </div>
        )
    };
    
    const renderDetailView = () => {
        if (!selectedItem) return null;
        
        let content;
        let title = selectedItem.name || selectedItem.identity?.name || selectedItem.title || selectedItem.factionName;

        switch(activeCategory) {
            case 'npcs':
                const npc = selectedItem as NPC;
                content = (
                    <div className="space-y-2">
                        <p className="italic text-[var(--text-muted-color)]">"{npc.status}"</p>
                        <p><strong className="text-[var(--text-color)]">Xuất thân:</strong> {npc.identity.origin}</p>
                        <p><strong className="text-[var(--text-color)]">Tính cách:</strong> {npc.identity.personality}</p>
                        <p><strong className="text-[var(--text-color)]">Tuổi:</strong> {npc.identity.age}</p>
                        <p><strong className="text-[var(--text-color)]">Vị trí:</strong> {gameState?.discoveredLocations.find(l => l.id === npc.locationId)?.name || 'Không rõ'}</p>
                    </div>
                );
                break;
            case 'locations':
                const loc = selectedItem as Location;
                content = (
                     <div className="space-y-2">
                        <p><strong className="text-[var(--text-color)]">Loại:</strong> {loc.type}</p>
                        <p className="mt-2">{loc.description}</p>
                        <p className="mt-2"><strong className="text-[var(--text-color)]">Lối đi đến:</strong> {loc.neighbors.map(id => gameState?.discoveredLocations.find(l => l.id === id)?.name).filter(Boolean).join(', ')}</p>
                        <p><strong className="text-[var(--text-color)]">Nồng độ linh khí:</strong> {loc.qiConcentration}/100</p>
                    </div>
                );
                break;
            case 'factions':
                content = <p>{selectedItem.description}</p>;
                break;
            case 'items':
                const item = selectedItem as InventoryItem;
                content = (
                    <div className="space-y-2">
                        <p><strong className="text-[var(--text-color)]">Loại:</strong> {item.type}</p>
                        <p><strong className="text-[var(--text-color)]">Phẩm chất:</strong> {item.quality}</p>
                        <p className="mt-2">{item.description}</p>
                    </div>
                );
                break;
            case 'events':
                const event = selectedItem as MajorEvent;
                content = (
                     <div className="space-y-2">
                        <p><strong className="text-[var(--text-color)]">Năm:</strong> {event.year}</p>
                        <p><strong className="text-[var(--text-color)]">Tóm tắt:</strong> {event.summary}</p>
                        <p><strong className="text-[var(--text-color)]">Hệ quả:</strong> {event.consequences}</p>
                    </div>
                );
                break;
            default:
                content = <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(selectedItem, null, 2)}</pre>
                break;
        }

        return (
            <div className="animate-fade-in" style={{animationDuration: '300ms'}}>
                <button onClick={() => setSelectedItem(null)} className="mb-4 text-sm text-[var(--secondary-accent-color)] hover:underline">&larr; Quay lại danh sách</button>
                <h3 className="text-3xl font-bold font-title text-[var(--primary-accent-color)] mb-4">{title}</h3>
                {content}
            </div>
        );
    };

    if (!gameState) return (
        <div className="fixed inset-0 z-40 bg-[var(--bg-color)] flex items-center justify-center">
            <p className="text-xl text-[var(--text-muted-color)]">Đang tải dữ liệu Bách Khoa...</p>
        </div>
    );
    
    return (
        <div className="fixed inset-0 z-40 bg-[var(--bg-color)] animate-fade-in flex flex-col h-full">
            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-[var(--shadow-light)]">
                 <div className="flex items-center gap-2">
                    <button onClick={() => setIsNavOpen(true)} className="p-2 rounded-full sm:hidden text-[var(--text-muted-color)] hover:text-[var(--text-color)]">
                        <FaBars />
                    </button>
                    <h2 className="text-2xl sm:text-3xl font-bold font-title text-[var(--primary-accent-color)]">Bách Khoa Toàn Thư</h2>
                </div>
                <button onClick={() => handleNavigate('gamePlay')} className="btn btn-neumorphic !rounded-full !p-3" title="Quay Lại Game"><FaArrowLeft /></button>
            </header>
            <div className="flex flex-grow min-h-0">
                {isNavOpen && <div className="fixed inset-0 bg-black/50 z-20 sm:hidden" onClick={() => setIsNavOpen(false)}></div>}
                <nav className={`fixed sm:relative top-0 left-0 h-full z-30 w-64 flex-shrink-0 bg-[var(--bg-color)] border-r border-[var(--shadow-light)] p-4 space-y-2 overflow-y-auto transition-transform duration-300 ${isNavOpen ? 'translate-x-0' : '-translate-x-full'} sm:translate-x-0`}>
                    {CATEGORIES.map(cat => (
                        <button key={cat.id} onClick={() => { setActiveCategory(cat.id); setSelectedItem(null); setSearchTerm(''); setIsNavOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-lg text-left text-lg font-semibold transition-colors ${activeCategory === cat.id ? 'bg-[var(--primary-accent-color)]/20 text-[var(--primary-accent-color)]' : 'text-[var(--text-muted-color)] hover:bg-[var(--shadow-light)] hover:text-[var(--text-color)]'}`}>
                            <cat.icon />
                            <span>{cat.label}</span>
                        </button>
                    ))}
                </nav>
                <main className="flex-grow p-4 sm:p-6 flex flex-col min-h-0">
                    {activeCategory === 'graph' ? (
                        <div className="h-full w-full flex-grow">
                           <StoryGraphPanel gameState={gameState} />
                        </div>
                    ) : (
                        <>
                            {!selectedItem && (
                                <div className="relative mb-4 flex-shrink-0">
                                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted-color)]" />
                                    <input type="text" placeholder={`Tìm kiếm trong ${CATEGORIES.find(c => c.id === activeCategory)?.label}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-neumorphic w-full !pl-10 !py-3"/>
                                </div>
                            )}
                            <div className="flex-grow overflow-y-auto pr-2 sm:pr-4">
                                {selectedItem ? renderDetailView() : renderItemList()}
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
};

export default memo(WikiScreen);