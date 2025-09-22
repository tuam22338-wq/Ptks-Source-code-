import React, { memo } from 'react';
import type { PlayerCharacter, Attribute, AttributeGroup, SpiritualRoot } from '../../../../../types';
import { SPIRITUAL_ROOT_CONFIG } from '../../../../../constants';

const AttributeGroupDisplay: React.FC<{ group: AttributeGroup }> = ({ group }) => (
    <div className="bg-black/20 p-3 rounded-lg border border-gray-700/60">
        <h4 className="font-bold text-amber-300 font-title">{group.title}</h4>
        <div className="mt-2 space-y-2">
            {group.attributes.map(attr => (
                <div key={attr.name} className="flex justify-between items-baseline text-sm" title={attr.description}>
                    <span className="text-gray-300 flex items-center gap-2">
                        {attr.icon && React.createElement(attr.icon, { className: 'text-gray-500' })}
                        {attr.name}
                    </span>
                    <span className="font-bold text-gray-100">
                        {typeof attr.value === 'number' ? `${Math.floor(attr.value)}${attr.maxValue ? ` / ${attr.maxValue}` : ''}` : attr.value}
                    </span>
                </div>
            ))}
        </div>
    </div>
);

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
}

const CharacterPanel: React.FC<CharacterPanelProps> = ({ playerCharacter }) => {
    return (
        <div className="space-y-4 animate-fade-in" style={{ animationDuration: '300ms' }}>
            <SpiritualRootDisplay root={playerCharacter.spiritualRoot} />
            {playerCharacter.attributes.map(group => (
                <AttributeGroupDisplay key={group.title} group={group} />
            ))}
        </div>
    );
};

export default memo(CharacterPanel);
