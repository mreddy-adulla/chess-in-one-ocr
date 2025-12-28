import React, { useState } from 'react';

const PageSelector = ({ pages, onConfirm, onCancel }) => {
  const [selectedIndices, setSelectedIndices] = useState(pages.length > 0 ? [0] : []);
  const [zoomPage, setZoomPage] = useState(null);
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(Math.min(pages.length, 5));

  const applyRange = () => {
      const start = Math.max(1, rangeStart) - 1;
      const end = Math.min(pages.length, rangeEnd);
      const newIndices = [];
      for (let i = start; i < end; i++) newIndices.push(i);
      setSelectedIndices(newIndices);
  };

  const togglePage = (idx) => {
    if (selectedIndices.includes(idx)) {
      setSelectedIndices(selectedIndices.filter(i => i !== idx));
    } else {
      setSelectedIndices([...selectedIndices, idx].sort((a, b) => a - b));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-6">
      <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <div>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Review PDF Pages</h2>
              <p className="text-sm text-slate-500 font-medium">Found {pages.length} pages in document.</p>
           </div>
           
           <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 px-2">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Range:</span>
                 <input type="number" className="w-12 p-1 border rounded text-xs font-bold" value={rangeStart} onChange={e => setRangeStart(parseInt(e.target.value))} />
                 <span className="text-xs font-bold text-slate-400">to</span>
                 <input type="number" className="w-12 p-1 border rounded text-xs font-bold" value={rangeEnd} onChange={e => setRangeEnd(parseInt(e.target.value))} />
              </div>
              <button onClick={applyRange} className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl hover:bg-slate-800 transition-all shadow-md shadow-slate-200 active:scale-95">Apply</button>
           </div>

           <div className="flex gap-2">
              <button 
                onClick={() => setSelectedIndices(pages.map((_, i) => i))}
                className="px-4 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Select All
              </button>
              <button 
                onClick={() => setSelectedIndices([])}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Clear
              </button>
           </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {pages.map((base64, idx) => (
                <div 
                    key={idx}
                    onClick={() => togglePage(idx)}
                    className={`relative group cursor-pointer transition-all duration-300 rounded-2xl border-4 overflow-hidden
                        ${selectedIndices.includes(idx) ? 'border-indigo-600 ring-4 ring-indigo-100 scale-[1.02]' : 'border-white opacity-60 grayscale hover:opacity-100 hover:grayscale-0'}
                    `}
                >
                    <img 
                        src={`data:image/jpeg;base64,${base64}`} 
                        alt={`Page {idx + 1}`}
                        className="w-full h-56 object-cover object-top"
                    />
                    
                    {/* Page Label */}
                    <div className="absolute top-2 left-2 px-3 py-1 bg-white/90 backdrop-blur-md rounded-lg shadow-sm border border-slate-200">
                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Page {idx + 1}</span>
                    </div>

                    {/* Selection Indicator */}
                    <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all shadow-md
                        ${selectedIndices.includes(idx) ? 'bg-indigo-600 text-white scale-110' : 'bg-slate-200 text-slate-400'}
                    `}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    {/* Zoom Overlay */}
                    <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/10 transition-colors pointer-events-none" />
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); setZoomPage(base64); }}
                        className="absolute bottom-3 right-3 p-2.5 bg-white/90 backdrop-blur-md rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                    >
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                    </button>
                </div>
              ))}
           </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <span className="text-sm font-black text-slate-700 uppercase tracking-widest">
                    {selectedIndices.length} {selectedIndices.length === 1 ? 'Page' : 'Pages'} Ready
                </span>
            </div>
            <div className="flex gap-4">
                <button 
                    onClick={onCancel}
                    className="px-8 py-3 font-black text-xs uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    disabled={selectedIndices.length === 0}
                    onClick={() => onConfirm(selectedIndices)}
                    className="px-12 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
                >
                    Start Analysis
                </button>
            </div>
        </div>

        {/* Zoom Modal */}
        {zoomPage && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/95 p-8" onClick={() => setZoomPage(null)}>
                <img src={`data:image/jpeg;base64,${zoomPage}`} className="max-w-full max-h-full rounded-2xl shadow-2xl animate-fade-in-up" />
                <button className="absolute top-8 right-8 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-md transition-colors">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default PageSelector;
