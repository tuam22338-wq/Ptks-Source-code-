import React from 'react';

interface StoryPanelProps {
  title: string;
  paragraphs: string[];
}

const StoryPanel: React.FC<StoryPanelProps> = ({ title, paragraphs }) => {
  return (
    <div className="w-full mb-8">
      <h3 className="text-2xl sm:text-3xl font-bold text-center text-stone-800 mb-6 font-title" style={{textShadow: '0 1px 2px rgba(0,0,0,0.2)'}}>{title}</h3>
      <div className="space-y-4 text-stone-700 text-base sm:text-lg leading-relaxed text-justify">
        {paragraphs.map((p, index) => (
          <p key={index} className="first-line:tracking-widest first-letter:text-2xl first-letter:font-bold first-letter:text-red-800
                                   first-letter:mr-2 first-letter:float-left">{p}</p>
        ))}
      </div>
    </div>
  );
};

export default StoryPanel;