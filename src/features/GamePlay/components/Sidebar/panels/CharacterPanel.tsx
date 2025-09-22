import React, { memo } from 'react';
import type { PlayerCharacter, SpiritualRoot, AttributeDefinition, GameState } from '../../../../../types';
import { SPIRITUAL_ROOT_CONFIG, UI_ICONS } from '../../../../../constants';

const AttributeDisplay: React.FC<{
    definition: AttributeDefinition;
    value: number | undefined;
    maxValue: number | undefined;
}> = ({ definition, value, maxValue }) => {
    let displayValue: string;
    if (definition.type === 'INFORMATIONAL') {
        displayValue = '...'; 
    } else {
        displayValue = `${Math.floor(value || 0)}${maxValue ? ` / ${maxValue}` : ''}`;
    }
    
    const Icon = UI_ICONS[definition.iconName] || (() => <span />);

    return (
        <div className="flex justify-between items-baseline text-sm" title={definition.description}>
            <span className="text-gray-300 flex items-center gap-2">
                <Icon className='text-gray-500' />
                {definition.name}
            </span>
            <span className="font-bold text-gray-100">{displayValue}</span>
        </div>
    );
};


const SpiritualRootDisplay: React.FC<{ root: SpiritualRoot | null }> = ({ root }) => {
    if (!root) {
        return <InfoBlock title="Linh Căn">Chưa thức tỉnh</InfoBlock>;
    }
    return (
        <InfoBlock title="Linh Căn">
            <h4 className="font-bold text-lg text-cyan-300">{root.name}</h4>
            <p className="text-xs text-gray-400">{root.description}</p>
        </InfoBlock>
    );
};

const InfoBlock: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
        <h4 className="font-bold text-amber-300 font-title">{title}</h4>
        <div className="mt-2">{children}</div>
    </div>
);

interface CharacterPanelProps {
    playerCharacter: PlayerCharacter;
    gameState: GameState;
}

const CharacterPanel: React.FC<CharacterPanelProps> = ({ playerCharacter, gameState }) => {
    const { attributes, cultivation, spiritualRoot } = playerCharacter;
    const { attributeSystem } = gameState;

    if (!attributeSystem) {
        return <div>Lỗi: Không tìm thấy hệ thống thuộc tính.</div>;
    }

    return (
        <div className="space-y-4 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <SpiritualRootDisplay root={spiritualRoot} />

            {attributeSystem.groups.sort((a, b) => a.order - b.order).map(group => {
                const groupAttributes = attributeSystem.definitions.filter(def => def.group === group.id);
                if (groupAttributes.length === 0) return null;

                return (
                    <div key={group.id} className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
                        <h4 className="font-bold text-amber-300 font-title">{group.name}</h4>
                        <div className="mt-2 space-y-2">
                            {groupAttributes.map(def => {
                                const Icon = UI_ICONS[def.iconName] || (() => <span />);
                                 // Handle special informational cases
                                if (def.id === 'linh_can' && spiritualRoot) {
                                     return (
                                        <div key={def.id} className="flex justify-between items-baseline text-sm" title={def.description}>
                                            <span className="text-gray-300 flex items-center gap-2">
                                                <Icon className='text-gray-500' />
                                                {def.name}
                                            </span>
                                            <span className="font-bold text-gray-100">{spiritualRoot.name}</span>
                                        </div>
                                    );
                                }
                                if (def.id === 'canh_gioi') {
                                    const realm = gameState.realmSystem.find(r => r.id === cultivation.currentRealmId);
                                    const stage = realm?.stages.find(s => s.id === cultivation.currentStageId);
                                    const realmDisplay = `${realm?.name || ''} ${stage?.name || ''}`.trim();

                                    return (
                                         <div key={def.id} className="flex justify-between items-baseline text-sm" title={def.description}>
                                             <span className="text-gray-300 flex items-center gap-2">
                                                 <Icon className='text-gray-500' />
                                                 {def.name}
                                             </span>
                                             <span className="font-bold text-gray-100">{realmDisplay}</span>
                                         </div>
                                     );
                                }

                                const attrState = attributes[def.id];
                                if (!attrState) return null;

                                return (
                                    <AttributeDisplay
                                        key={def.id}
                                        definition={def}
                                        value={attrState.value}
                                        maxValue={attrState.maxValue}
                                    />
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default memo(CharacterPanel);
