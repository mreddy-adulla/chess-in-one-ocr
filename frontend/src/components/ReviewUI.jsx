import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Chess } from 'chess.js';
import ScoreSheet from './ScoreSheet';
import BoardView from './BoardView';
import axios from 'axios';

const ReviewUI = ({ initialMoves = [], initialClusters = [], sessionId, onSessionComplete }) => {
  const [moves, setMoves] = useState(initialMoves);
  const [clusters, setClusters] = useState(initialClusters);
  const [currentPly, setCurrentPly] = useState(initialMoves.length);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPaused, setProcessingPaused] = useState(false);
  const [currentRow, setCurrentRow] = useState(0);

  // --- Game State Management ---
  const { fen, lastMove } = useMemo(() => {
    const tempGame = new Chess();
    let lastMoveInfo = null;
    
    for (let i = 0; i < currentPly; i++) {
        try {
            const moveResult = tempGame.move(moves[i].san);
            if (i === currentPly - 1) {
                lastMoveInfo = moveResult;
            }
        } catch (e) {
            console.warn(`Illegal move at ply ${i+1}: ${moves[i].san}`);
            break;
        }
    }
    
    return { 
        fen: tempGame.fen(), 
        lastMove: lastMoveInfo
    };
  }, [moves, currentPly]);

  // --- Interactive Processing Logic ---
  
  const processNextRow = async () => {
      if (isProcessing) return;
      setIsProcessing(true);
      
      try {
          // Use a ref-based check to prevent overlaps
          const response = await axios.post(`http://localhost:8000/api/v1/session/${sessionId}/process_next`, {
             current_fen: fen,
             last_move_ply: currentPly 
          });
          
          const result = response.data;
          
          if (result.is_complete) {
              setProcessingPaused(true); 
              onSessionComplete && onSessionComplete();
          } else {
              // Only update if these moves aren't already in the list
              setMoves(prevMoves => {
                  const existingPlys = new Set(prevMoves.map(m => m.ply));
                  const uniqueNewMoves = result.moves.filter(m => !existingPlys.has(m.ply));
                  
                  if (uniqueNewMoves.length === 0) return prevMoves;

                  const updatedMoves = [...prevMoves, ...uniqueNewMoves];
                  // Set ply to the latest move in the list
                  setCurrentPly(updatedMoves.length);
                  return updatedMoves;
              });
              
              setCurrentRow(result.row_index);
              
              if (result.needs_review) {
                  setProcessingPaused(true);
              } else {
                  // Chain next call
                  setTimeout(() => {
                      setIsProcessing(false); // Reset before calling again
                      processNextRow();
                  }, 800);
                  return; // Exit early as timeout handles the next loop
              }
          }
          
      } catch (error) {
          console.error("Processing failed", error);
          setProcessingPaused(true);
      } finally {
          setIsProcessing(false);
      }
  };

  const isInitialMount = useRef(true);

  // Trigger initial processing if we have a session but no moves
  useEffect(() => {
      if (isInitialMount.current) {
          isInitialMount.current = false;
          if (sessionId && moves.length === 0 && !processingPaused) {
              processNextRow();
          }
      }
  }, [sessionId]);


  const handleContinue = () => {
      setProcessingPaused(false);
      processNextRow();
  };

  const handleEditMove = (ply, newSan) => {
      const newMoves = [...moves];
      newMoves[ply - 1] = { 
          ...newMoves[ply - 1], 
          san: newSan, 
          confidence: 1.0 
      };
      setMoves(newMoves);
  };

  const handleMoveClick = (ply) => {
      setCurrentPly(ply);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
      
      {/* LEFT: Chess Board Focus */}
      <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8 relative overflow-hidden">
         {/* Active Processing Indicator Overlay */}
         {isProcessing && (
             <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-100 overflow-hidden z-20">
                 <div className="h-full bg-indigo-500 w-1/3 animate-[shimmer_1s_infinite_linear] origin-left-right"></div>
             </div>
         )}

         <div className="w-full max-w-[600px] relative z-10">
            <BoardView gameFen={fen} lastMove={lastMove} />
            
            <div className="mt-8 flex items-center justify-between gap-4">
                 <div className="flex gap-2">
                    <button onClick={() => setCurrentPly(Math.max(0, currentPly - 1))} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={() => setCurrentPly(Math.min(moves.length, currentPly + 1))} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </button>
                 </div>
                 
                 {processingPaused ? (
                     <div className="flex-1 flex gap-2">
                        <button 
                            onClick={handleContinue}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 animate-pulse"
                        >
                            <span>Continue Analysis</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </button>
                        <button 
                            onClick={() => { setProcessingPaused(true); onSessionComplete && onSessionComplete(); }}
                            className="px-4 bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl transition-all"
                            title="Stop Processing"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                     </div>
                 ) : (
                     <div className="flex-1 flex items-center justify-center gap-3 text-slate-400 font-medium py-3 border border-slate-100 rounded-xl bg-slate-50">
                        <svg className="w-5 h-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Processing Row {currentRow + 1}...
                     </div>
                 )}
            </div>
         </div>
      </div>

      {/* RIGHT: Move Tree & Analysis */}
      <div className="w-full lg:w-[450px] flex flex-col gap-6">
        {/* Lichess-style Move Tree */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden h-full">
           <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Live Analysis</span>
              <div className="flex items-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${processingPaused ? 'bg-orange-400' : 'bg-green-400 animate-pulse'}`}></span>
                 <span className="text-[10px] font-bold text-slate-500">{processingPaused ? 'Paused for Review' : 'Auto-Processing'}</span>
              </div>
           </div>
           <div className="flex-1 overflow-hidden relative">
              <ScoreSheet 
                moves={moves} 
                currentPly={currentPly} 
                onMoveClick={handleMoveClick}
                onEditMove={handleEditMove}
              />
              {/* Fade Overlay at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewUI;
