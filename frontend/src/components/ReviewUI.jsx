import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Chess } from 'chess.js';
import ScoreSheet from './ScoreSheet';
import BoardView from './BoardView';
import axios from 'axios';

const ReviewUI = ({ initialMoves = [], initialClusters = [], sessionId, initialPageImage, ocrProvider, onSessionComplete, onCancel }) => {
  const [moves, setMoves] = useState(initialMoves);
  const [clusters, setClusters] = useState(initialClusters);
  const [currentPly, setCurrentPly] = useState(initialMoves.length);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingPaused, setProcessingPaused] = useState(true);
  const [currentRow, setCurrentRow] = useState(0);
  const [currentPagePreview, setCurrentPagePreview] = useState(initialPageImage ? `data:image/jpeg;base64,${initialPageImage}` : null);
  const [currentPageIdx, setCurrentPageIdx] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageReviewApproved, setPageReviewApproved] = useState(false);
  const [currentRowImage, setCurrentRowImage] = useState(null);
  const [topMargin, setTopMargin] = useState(0.25);
  const [bottomMargin, setBottomMargin] = useState(0.88);
  const [rotation, setRotation] = useState(0);

  const resetAlignment = () => {
      setTopMargin(0.25);
      setBottomMargin(0.88);
      setRotation(0);
  };

  // --- Game State Management ---
  const { fen, lastMove } = useMemo(() => {
      const tempGame = new Chess();
      let lastMoveInfo = null;
      
      for (let i = 0; i < currentPly; i++) {
          try {
              if (moves[i] && moves[i].san) {
                  const moveResult = tempGame.move(moves[i].san);
                  if (i === currentPly - 1) {
                      lastMoveInfo = moveResult;
                  }
              }
          } catch (e) {
              console.warn(`Illegal move at ply ${i+1}: ${moves[i]?.san}`);
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
             last_move_ply: currentPly,
             top_margin: topMargin,
             bottom_margin: bottomMargin,
             rotation: rotation,
             ocr_provider: ocrProvider
          });
          
          const result = response.data;
          
          if (result.is_complete) {
              setProcessingPaused(true); 
              onSessionComplete && onSessionComplete();
          } else {
              // Only update if these moves aren't already in the list
              setMoves(prevMoves => {
                  const existingPlys = new Set(prevMoves.map(m => m.ply));
                  // Attach debug text to the moves for the UI to display
                  const uniqueNewMoves = result.moves.map(m => ({
                      ...m,
                      debug_raw_text: result.debug_raw_text
                  })).filter(m => !existingPlys.has(m.ply));
                  
                  if (uniqueNewMoves.length === 0) return prevMoves;

                  const updatedMoves = [...prevMoves, ...uniqueNewMoves];
                  // Set ply to the latest move in the list
                  setCurrentPly(updatedMoves.length);
                  return updatedMoves;
              });
              
              setCurrentRow(result.row_index);
              setCurrentPageIdx(result.page_index || 0);
              setTotalPages(result.total_pages || 1);
              setCurrentRowImage(result.row_image ? `data:image/jpeg;base64,${result.row_image}` : null);
              
              if (result.is_new_page && result.page_image) {
                  setCurrentPagePreview(`data:image/jpeg;base64,${result.page_image}`);
                  setPageReviewApproved(false);
              }
              
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
          // ONLY start processing if page is approved and no moves yet
          if (sessionId && moves.length === 0 && pageReviewApproved && !processingPaused) {
              processNextRow();
          }
      }
  }, [sessionId, pageReviewApproved, processingPaused]);


  const handleContinue = () => {
      setPageReviewApproved(true);
      setCurrentPagePreview(null); // Clear residual image
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

         <div className="w-full max-w-[600px] relative z-10 h-full flex flex-col justify-center items-center">
            {currentPagePreview && !pageReviewApproved ? (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-4 overflow-hidden relative">
                    <div className="flex items-center justify-between w-full mb-4 px-4">
                        <div>
                            <p className="text-sm font-black text-indigo-600 uppercase tracking-widest leading-none">Re-Align Scan Area</p>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">Page {currentPageIdx + 1} of {totalPages}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
                            <button 
                                onClick={resetAlignment}
                                className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all border border-transparent hover:border-red-100"
                                title="Reset Alignment"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            </button>
                            <div className="h-8 w-px bg-slate-100 mx-1" />
                            <div className="flex flex-col items-center">
                                <span className="text-[8px] font-black text-slate-400 uppercase mb-1 tracking-tighter italic">Tilt Correction</span>
                                <input type="range" min="-180" max="180" step="0.5" value={rotation} onChange={(e) => setRotation(parseFloat(e.target.value))} className="w-24 accent-indigo-500" />
                            </div>
                            <div className="h-8 w-px bg-slate-100 mx-1" />
                            <div className="flex flex-col items-center">
                                <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Scan Start</span>
                                <input type="range" min="0" max="0.5" step="0.01" value={topMargin} onChange={(e) => setTopMargin(parseFloat(e.target.value))} className="w-24 accent-indigo-500" />
                            </div>
                            <div className="flex flex-col items-center ml-2">
                                <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Scan End</span>
                                <input type="range" min="0.5" max="1.0" step="0.01" value={bottomMargin} onChange={(e) => setBottomMargin(parseFloat(e.target.value))} className="w-24 accent-red-500" />
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full relative bg-white rounded-lg shadow-inner overflow-hidden border border-slate-200">
                        {/* Image Container with fixed relative sizing */}
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            <div 
                                className="relative transition-transform duration-300 ease-out flex items-center justify-center"
                                style={{ 
                                    transform: `rotate(${rotation}deg)`,
                                    width: '100%',
                                    height: '100%'
                                }}
                            >
                                <img 
                                    src={currentPagePreview} 
                                    alt="Page Preview" 
                                    className="max-w-full max-h-full object-contain shadow-lg"
                                />
                                
                                {/* Visual Guides (Only show when rotation is minimal to avoid confusion) */}
                                {Math.abs(rotation % 180) < 1 && (
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute left-0 right-0 border-t-2 border-indigo-500/50 z-20" style={{ top: `${topMargin * 100}%` }}>
                                            <div className="absolute right-0 -top-4 bg-indigo-500 text-[8px] text-white px-1 font-bold rounded">START</div>
                                        </div>
                                        <div className="absolute left-0 right-0 border-t-2 border-red-500/50 z-20" style={{ top: `${bottomMargin * 100}%` }}>
                                            <div className="absolute right-0 top-1 bg-red-500 text-[8px] text-white px-1 font-bold rounded">END</div>
                                        </div>
                                        <div className="absolute top-0 left-0 right-0 bg-slate-900/30" style={{ height: `${topMargin * 100}%` }}></div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/30" style={{ top: `${bottomMargin * 100}%` }}></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-4 flex flex-col items-center">
                        <p className="text-[10px] text-slate-400 text-center max-w-sm font-medium">
                            Rotate the image if it's sideways. Adjust **Start** and **End** to frame the moves area.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col gap-4">
                    <div className="flex-1 min-h-0">
                        <BoardView gameFen={fen} lastMove={lastMove} />
                    </div>
                </div>
            )}
            
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
                     <div className="flex-1 flex flex-col gap-2">
                        <div className="flex gap-2">
                           <button 
                               onClick={handleContinue}
                               className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 animate-pulse"
                           >
                               <span>{currentPagePreview && !pageReviewApproved ? "Approve & Start OCR" : "Continue Analysis"}</span>
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           </button>
                           <button 
                               onClick={() => { setProcessingPaused(true); onCancel && onCancel(); }}
                               className="px-4 bg-white border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-xl transition-all"
                               title="Exit Review"
                           >
                               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                           </button>
                        </div>
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
        
        {/* OCR Debug Preview Panel */}
        <div className="bg-slate-900 rounded-2xl shadow-xl p-4 border border-slate-800 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">OCR Debug: Row {currentRow + 1}</span>
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${isProcessing ? 'bg-green-500/20 text-green-300' : 'bg-indigo-500/20 text-indigo-300'}`}>
                    {isProcessing ? 'Scanning...' : 'Last Scan'}
                </span>
            </div>
            <div className="bg-white rounded-lg p-2 mb-3 shadow-inner flex items-center justify-center min-h-[60px]">
                {currentRowImage ? (
                    <img src={currentRowImage} alt="Row Crop" className="w-full max-h-16 object-contain" />
                ) : (
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Waiting for scan area...</div>
                )}
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1">AI Output:</span>
                <p className="text-xs font-mono text-indigo-200 break-all leading-relaxed min-h-[1.5em]">
                    {moves[currentPly-1]?.debug_raw_text || (isProcessing ? "Processing..." : "No data yet")}
                </p>
            </div>
        </div>

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
