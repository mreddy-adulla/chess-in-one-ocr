import React, { useState, useEffect } from 'react';

const ReviewUI = ({ initialMoves }) => {
  const [moves, setMoves] = useState(initialMoves);
  const [currentPly, setCurrentPly] = useState(1);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      setCurrentPly(prev => Math.min(moves.length, prev + 1));
    } else if (e.key === 'ArrowLeft') {
      setCurrentPly(prev => Math.max(1, prev - 1));
    } else if (e.key === 'e') {
      const newSan = prompt('Edit SAN:', moves[currentPly - 1].san);
      if (newSan) {
        const newMoves = [...moves];
        newMoves[currentPly - 1] = { ...newMoves[currentPly - 1], san: newSan, confidence: 1.0 };
        setMoves(newMoves);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPly, moves]);

  return (
    <div className="review-ui p-8">
      <h1 className="text-2xl font-bold mb-4">Chess Review (v8)</h1>
      <div className="status-bar mb-4">
        Ply: {currentPly} | Move: {moves[currentPly - 1]?.san} | Confidence: {(moves[currentPly - 1]?.confidence * 100).toFixed(0)}%
      </div>
      {/* MoveList and Board would go here */}
      <div className="shortcuts text-gray-500 mt-8 text-sm">
        Shortcuts: ←/→ Navigate | E Edit | Enter Accept
      </div>
    </div>
  );
};

export default ReviewUI;
