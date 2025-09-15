import React, { memo, useMemo } from 'react';
import type { PlayerCharacter, NPC, PlayerNpcRelationship } from '../../../../../types';
import { GiFamilyTree } from 'react-icons/gi';

interface GenealogyPanelProps {
    playerCharacter: PlayerCharacter;
    allNpcs: NPC[];
    onNpcSelect: (npc: NPC) => void;
}

const RelationshipCard: React.FC<{ npc: NPC, relationship: PlayerNpcRelationship, onSelect: () => void }> = memo(({ npc, relationship, onSelect }) => (
    <button onClick={onSelect} className="w-full text-left bg-black/20 p-3 rounded-lg border border-gray-700/60 hover:bg-gray-800/50 hover:border-cyan-400/50 transition-colors">
        <div className="flex justify-between items-start">
            <div>
                <h4 className="font-bold text-cyan-300 font-title">{npc.identity.name}</h4>
                <p className="text-sm text-gray-400">{relationship.type}</p>
            </div>
            <div className="text-right">
                <p className="font-semibold text-yellow-300">{relationship.status}</p>
                <p className="text-xs text-gray-500">({relationship.value})</p>
            </div>
        </div>
        <p className="text-xs text-gray-500 mt-2 italic">"{npc.status}"</p>
    </button>
));

const GenealogyPanel: React.FC<GenealogyPanelProps> = ({ playerCharacter, allNpcs, onNpcSelect }) => {
    const { relationships } = playerCharacter;

    const { family, friends, masters } = useMemo(() => {
        const familyKeywords = ['phụ thân', 'mẫu thân', 'huynh đệ', 'tỷ muội', 'gia'];
        const masterKeywords = ['sư phụ', 'sư tôn', 'sư nương'];
        const familyRels: { npc: NPC, relationship: PlayerNpcRelationship }[] = [];
        const friendRels: { npc: NPC, relationship: PlayerNpcRelationship }[] = [];
        const masterRels: { npc: NPC, relationship: PlayerNpcRelationship }[] = [];
        
        relationships.forEach(rel => {
            const npc = allNpcs.find(n => n.id === rel.npcId);
            if (!npc) return;
            
            const relTypeLower = rel.type.toLowerCase();
            if (masterKeywords.some(kw => relTypeLower.includes(kw))) {
                masterRels.push({ npc, relationship: rel });
            } else if (familyKeywords.some(kw => relTypeLower.includes(kw))) {
                familyRels.push({ npc, relationship: rel });
            } else {
                friendRels.push({ npc, relationship: rel });
            }
        });

        return { family: familyRels, friends: friendRels, masters: masterRels };
    }, [relationships, allNpcs]);

    return (
        <div className="space-y-6 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <div>
                <h3 className="flex items-center gap-2 text-lg text-gray-300 font-title font-semibold mb-3 text-center border-b border-gray-700 pb-2">
                    <GiFamilyTree className="text-amber-300" /> Thân Hữu
                </h3>
                
                <div className="space-y-4">
                     <section>
                        <h4 className="font-semibold text-gray-400 mb-2">Sư Môn</h4>
                        <div className="space-y-2">
                            {masters.length > 0 ? (
                                masters.map(item => <RelationshipCard key={item.npc.id} {...item} onSelect={() => onNpcSelect(item.npc)} />)
                            ) : (
                                <p className="text-center text-sm text-gray-500 py-2">Chưa bái sư. Hãy tìm một vị cao nhân và thể hiện thành ý.</p>
                            )}
                        </div>
                    </section>

                    <section>
                        <h4 className="font-semibold text-gray-400 mb-2">Gia Đình</h4>
                        <div className="space-y-2">
                            {family.length > 0 ? (
                                family.map(item => <RelationshipCard key={item.npc.id} {...item} onSelect={() => onNpcSelect(item.npc)} />)
                            ) : (
                                <p className="text-center text-sm text-gray-500 py-2">Mồ côi từ nhỏ, không nơi nương tựa.</p>
                            )}
                        </div>
                    </section>
                    
                    <section>
                        <h4 className="font-semibold text-gray-400 mb-2">Bằng Hữu</h4>
                        <div className="space-y-2">
                            {friends.length > 0 ? (
                                friends.map(item => <RelationshipCard key={item.npc.id} {...item} onSelect={() => onNpcSelect(item.npc)} />)
                            ) : (
                                <p className="text-center text-sm text-gray-500 py-2">Tạm thời chưa có bằng hữu nào.</p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default memo(GenealogyPanel);