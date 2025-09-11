import React from 'react';
import type { Faction } from '../types';

interface FactionIntroProps {
  factions: Faction[];
}

const FactionCard: React.FC<{ faction: Faction }> = ({ faction }) => (
  <div className="group w-full sm:w-1/3 p-2">
    <div className="relative rounded-lg overflow-hidden transition-all duration-300 ease-in-out transform group-hover:scale-105 group-hover:shadow-xl border border-stone-300/50">
      <img src={faction.imageUrl} alt={faction.name} className="w-full h-80 object-cover transition-all duration-500 group-hover:brightness-90"/>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
      
      <div className="absolute bottom-0 left-0 p-4 w-full">
        <h4 className="text-2xl font-bold text-white font-title" style={{textShadow: '0 2px 4px #000'}}>{faction.name}</h4>
        <p className="mt-1 text-gray-200 text-sm leading-relaxed transition-all duration-300 max-h-0 opacity-0 group-hover:max-h-40 group-hover:opacity-100 overflow-hidden">
          {faction.description}
        </p>
      </div>
    </div>
  </div>
);

const FactionIntro: React.FC<FactionIntroProps> = ({ factions }) => {
  return (
    <div className="w-full my-8">
      <h3 className="text-2xl font-bold text-center text-stone-800 mb-6 font-title">Các Thế Lực Tranh Phong</h3>
      <div className="flex flex-col sm:flex-row items-center justify-around -m-2">
        {factions.map((faction) => (
            <FactionCard key={faction.name} faction={faction} />
        ))}
      </div>
    </div>
  );
};

export default FactionIntro;