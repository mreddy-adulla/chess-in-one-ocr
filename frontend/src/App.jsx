import React, { useState } from 'react';
import ReviewUI from './components/ReviewUI';
import ApiConfig from './components/ApiConfig';
import CompactUploader from './components/CompactUploader';
import ProcessingStatus from './components/ProcessingStatus';
import axios from 'axios';

function App() {
  const [appState, setAppState] = useState('idle'); // idle, uploading, processing, review
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [ocrProvider, setOcrProvider] = useState('trocr');
  const [moveLimit, setMoveLimit] = useState(40);

  const handleFileSelect = async (file) => {
    setAppState('uploading');
    setStatusMessage('Initializing Session...');
    
    // Fake upload progress for UX
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      if (progress <= 90) setUploadProgress(progress);
    }, 200);

    try {
        // Real Upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('move_limit', moveLimit.toString());
        
        const response = await axios.post('http://localhost:8000/api/v1/session/start', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        clearInterval(interval);
        setUploadProgress(100);
        setSessionId(response.data.session_id);
        
        // Short delay to show 100%
        setTimeout(() => {
            setAppState('review');
        }, 500);

    } catch (error) {
        clearInterval(interval);
        console.error("Upload failed", error);
        setAppState('idle');
        alert("Failed to upload file. Please ensure backend is running.");
    }
  };

  const handleDownloadPGN = () => {
    if (!sessionId) return;
    alert("Downloading PGN for session " + sessionId);
  };

  const handleSessionComplete = () => {
      setStatusMessage("Analysis Complete.");
  };

  const resetSession = () => {
      setAppState('idle');
      setSessionId(null);
      setUploadProgress(0);
      setStatusMessage('');
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Dynamic Header */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm h-16 flex items-center px-6">
        <div className="flex items-center gap-6 w-full max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3 mr-4 cursor-pointer" onClick={resetSession}>
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-100">
              ♟️
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 hidden sm:block">
              chess-in-one
            </h1>
          </div>

          {/* Contextual Tools */}
          {appState === 'review' && (
            <div className="flex items-center gap-3 animate-fade-in-up">
              <button 
                onClick={resetSession}
                className="px-4 h-9 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                New Game
              </button>
              <div className="h-6 w-px bg-slate-200 mx-2" />
              <button 
                onClick={handleDownloadPGN}
                className="px-4 h-9 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2 shadow-md shadow-slate-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download PGN
              </button>
            </div>
          )}

          <div className="ml-auto flex items-center gap-4">
             <span className="hidden md:block text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded">v8.1.0-alpha</span>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="max-w-[1800px] mx-auto p-6 min-h-[calc(100vh-64px)]">
        {appState === 'idle' && (
          <div className="flex flex-col items-center justify-center min-h-[70vh] animate-fade-in-up">
            <div className="text-center mb-12 max-w-xl">
              <h2 className="text-5xl font-black text-slate-900 tracking-tight mb-6">
                Chess OCR, <span className="text-indigo-600">Reimagined.</span>
              </h2>
              <p className="text-lg text-slate-500 font-medium">
                Interactive, human-in-the-loop digitizer. <br/> Upload, review move-by-move, and export perfectly.
              </p>
            </div>
            
            <div className="w-full max-w-lg space-y-6">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-600">Scan Limit (Moves)</label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="range" min="1" max="40" 
                            value={moveLimit} 
                            onChange={(e) => setMoveLimit(parseInt(e.target.value))}
                            className="w-32 accent-indigo-600"
                        />
                        <span className="w-8 text-center font-black text-indigo-600">{moveLimit}</span>
                    </div>
                </div>

                <CompactUploader 
                  onFileSelect={handleFileSelect} 
                  ocrProvider={ocrProvider} 
                  setOcrProvider={setOcrProvider} 
                />
            </div>
          </div>
        )}

        {(appState === 'uploading' || appState === 'processing') && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <ProcessingStatus 
                status={appState === 'uploading' ? 'Initializing Session...' : 'Preparing Board...'} 
                progress={uploadProgress}
                message={statusMessage}
              />
          </div>
        )}

        {appState === 'review' && sessionId && (
          <ReviewUI 
            sessionId={sessionId} 
            initialMoves={[]} 
            onSessionComplete={handleSessionComplete}
          />
        )}
      </main>
    </div>
  );
}

export default App;
