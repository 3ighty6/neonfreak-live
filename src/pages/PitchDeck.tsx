import React, { useEffect } from 'react';

const PitchDeck: React.FC = () => {
  useEffect(() => {
    // Redirect to the public pitch deck HTML
    window.location.href = '/pitch-deck.html';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500 mb-4">
          Loading Pitch Deck...
        </h1>
        <p className="text-gray-300">Redirecting to investor presentation</p>
      </div>
    </div>
  );
};

export default PitchDeck;
