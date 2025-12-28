import React from 'react';
import { Chessboard } from 'react-chessboard';

const BoardView = ({ gameFen, lastMove }) => {
  return (
    <div className="w-full aspect-square bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <Chessboard 
        position={gameFen} 
        arePiecesDraggable={false}
        // Responsive container handles width
        customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        }}
        customDarkSquareStyle={{ backgroundColor: '#B58863' }}
        customLightSquareStyle={{ backgroundColor: '#F0D9B5' }}
        // Highlight last move
        customSquareStyles={
            lastMove ? {
                [lastMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
                [lastMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
            } : {}
        }
      />
    </div>
  );
};

export default BoardView;
