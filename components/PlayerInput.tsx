import React, { useState } from 'react';

interface PlayerInputProps {
  onAction: (type: 'speak' | 'action' | 'continue', text: string) => void;
  disabled: boolean;
}

const PlayerInput: React.FC<PlayerInputProps> = ({ onAction, disabled }) => {
  const [speakInput, setSpeakInput] = useState('');
  const [actionInput, setActionInput] = useState('');

  const handleSpeak = () => {
    if (speakInput.trim()) {
      onAction('speak', speakInput);
      setSpeakInput('');
    }
  };

  const handleAction = () => {
    if (actionInput.trim()) {
      onAction('action', actionInput);
      setActionInput('');
    }
  };

  return (
    <div className="flex-shrink-0 p-4 bg-black/40 backdrop-blur-sm border-t border-gray-700/50">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Speak Input */}
        <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-600 rounded-lg p-1">
          <input
            type="text"
            value={speakInput}
            onChange={(e) => setSpeakInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSpeak()}
            placeholder="Nói..."
            disabled={disabled}
            className="flex-grow bg-transparent focus:outline-none text-gray-200 placeholder-gray-500 px-2"
          />
          <button
            onClick={handleSpeak}
            disabled={disabled || !speakInput.trim()}
            className="px-4 py-2 bg-cyan-700/80 text-white font-bold rounded-md hover:bg-cyan-600/80 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Nói
          </button>
        </div>
        
        {/* Action Input */}
        <div className="flex items-center gap-2 bg-gray-900/50 border border-gray-600 rounded-lg p-1">
          <input
            type="text"
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAction()}
            placeholder="Hành động..."
            disabled={disabled}
            className="flex-grow bg-transparent focus:outline-none text-gray-200 placeholder-gray-500 px-2"
          />
          <button
            onClick={handleAction}
            disabled={disabled || !actionInput.trim()}
            className="px-4 py-2 bg-lime-700/80 text-white font-bold rounded-md hover:bg-lime-600/80 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            Làm
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerInput;
