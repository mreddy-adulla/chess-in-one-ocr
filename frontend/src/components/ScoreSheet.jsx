import React, { useRef, useEffect, useState } from 'react';

const ScoreSheet = ({ moves, currentPly, onMoveClick, onEditMove }) => {
  const scrollRef = useRef(null);
  const [editingPly, setEditingPly] = useState(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    if (scrollRef.current) {
        const activeRow = scrollRef.current.querySelector(`[data-ply="${currentPly}"]`);
        if (activeRow) {
            activeRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
  }, [currentPly]);

  const movePairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1] || null
    });
  }

  const startEdit = (ply, san) => {
    setEditingPly(ply);
    setEditValue(san);
  };

  const submitEdit = (ply) => {
    onEditMove(ply, editValue);
    setEditingPly(null);
  };

  const renderCell = (move, ply) => {
    if (!move) return <div className="flex-1 px-4 py-2"></div>;
    
    const isActive = ply === currentPly;
    const isEditing = editingPly === ply;
    const confidenceColor = move.confidence > 0.9 ? 'bg-emerald-500' : move.confidence > 0.7 ? 'bg-amber-500' : 'bg-rose-500';

    if (isEditing) {
      return (
        <div className="flex-1 px-2 py-1">
          <input
            autoFocus
            className="w-full bg-indigo-50 border border-indigo-300 rounded px-2 py-1 text-sm font-bold text-indigo-900 focus:outline-none focus:ring-2 ring-indigo-200"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={() => submitEdit(ply)}
            onKeyDown={(e) => e.key === 'Enter' && submitEdit(ply)}
          />
        </div>
      );
    }

    return (
      <div 
        data-ply={ply}
        onClick={() => onMoveClick(ply)}
        className={`flex-1 px-4 py-2 cursor-pointer transition-all flex items-center justify-between group
          ${isActive ? 'bg-indigo-600 text-white font-black shadow-lg shadow-indigo-100 z-10' : 'hover:bg-slate-50 text-slate-700 font-bold'}
        `}
      >
        <span className="font-mono text-sm">{move.san}</span>
        <div className="flex items-center gap-2">
            <button 
                onClick={(e) => { e.stopPropagation(); startEdit(ply, move.san); }}
                className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 transition-opacity ${isActive ? 'text-indigo-200' : 'text-slate-400'}`}
            >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : confidenceColor}`} />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" ref={scrollRef}>
        <div className="overflow-y-auto flex-1 custom-scrollbar">
            {movePairs.map((pair) => (
                <div key={pair.num} className="flex border-b border-slate-50 items-stretch min-h-[40px]">
                    <div className="w-10 bg-slate-50/50 flex items-center justify-center text-[10px] font-black text-slate-400 border-r border-slate-50 select-none">
                        {pair.num}
                    </div>
                    {renderCell(pair.white, (pair.num * 2) - 1)}
                    {renderCell(pair.black, pair.num * 2)}
                </div>
            ))}
            <div className="h-32" />
        </div>
        
        {/* Quick Tools Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
            <button className="flex-1 py-2 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Re-analyze Move
            </button>
        </div>
    </div>
  );
};

export default ScoreSheet;
