import React from 'react';

const MoveList = ({ moves, currentPly, onMoveClick }) => {
  return (
    <div className="move-list grid grid-cols-2 gap-2 p-4 overflow-y-auto h-64 border rounded">
      {moves.map((move, index) => (
        <div 
          key={index} 
          className={`move-item cursor-pointer p-1 ${currentPly === index + 1 ? 'bg-blue-200' : ''}`}
          onClick={() => onMoveClick(index + 1)}
        >
          <span className="font-bold mr-2">{index + 1}.</span>
          <span className={`confidence-dot ${getConfidenceColor(move.confidence)}`} />
          <span className="ml-1">{move.san}</span>
        </div>
      ))}
    </div>
  );
};

const getConfidenceColor = (confidence) => {
  if (confidence > 0.8) return 'bg-green-500';
  if (confidence > 0.5) return 'bg-yellow-500';
  return 'bg-red-500';
};

export default MoveList;
