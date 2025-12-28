import React, { useRef, useState } from 'react';

const CompactUploader = ({ onFileSelect, ocrProvider, setOcrProvider, variant = 'full' }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current.click();
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <input 
          ref={inputRef}
          type="file" 
          className="hidden" 
          onChange={handleChange}
          accept=".pdf,.png,.jpg,.jpeg"
        />
        
        <div className="flex items-center bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm h-9">
          <button 
            onClick={onButtonClick}
            className="px-3 h-full text-xs font-semibold text-slate-700 hover:bg-slate-50 border-r border-slate-100 flex items-center gap-2 transition-colors"
          >
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Choose File
          </button>
          
          <select 
            value={ocrProvider}
            onChange={(e) => setOcrProvider(e.target.value)}
            className="px-2 h-full text-xs bg-transparent border-none focus:ring-0 text-slate-600 font-medium cursor-pointer"
          >
            <option value="tesseract">Tesseract</option>
            <option value="trocr">TrOCR (ONNX)</option>
            <option value="google_cloud">Google Cloud</option>
          </select>
        </div>
      </div>
    );
  }

  // Use a simpler, cleaner design instead of the massive border-dashed
  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 border border-slate-100">
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ease-out
          ${dragActive 
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' 
            : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-white'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={onButtonClick}
      >
        <input 
          ref={inputRef}
          type="file" 
          className="hidden" 
          onChange={handleChange}
          accept=".pdf,.png,.jpg,.jpeg"
        />
        
        <div className="flex flex-col items-center text-center p-6 space-y-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${dragActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-300' : 'bg-white text-indigo-600 shadow-md shadow-slate-200'}`}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
             <h3 className="text-lg font-bold text-slate-900">Upload Scoresheet</h3>
             <p className="text-sm text-slate-500 mt-1">Drag & drop or click to browse</p>
          </div>
          <div className="flex gap-2">
             <span className="px-2 py-1 bg-slate-200 rounded text-[10px] font-bold text-slate-600 uppercase">PDF</span>
             <span className="px-2 py-1 bg-slate-200 rounded text-[10px] font-bold text-slate-600 uppercase">PNG</span>
             <span className="px-2 py-1 bg-slate-200 rounded text-[10px] font-bold text-slate-600 uppercase">JPG</span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <label className="text-xs font-black text-slate-400 uppercase tracking-widest px-1 mb-3 block">Select OCR Engine</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {['tesseract', 'trocr', 'google_cloud'].map((provider) => (
            <button
              key={provider}
              onClick={(e) => {
                e.stopPropagation();
                setOcrProvider(provider);
              }}
              className={`relative px-4 py-3 text-left rounded-xl border transition-all duration-200 group ${
                ocrProvider === provider 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-600 ring-offset-2' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              <div className="text-xs font-black uppercase opacity-70 mb-0.5 tracking-wider">Provider</div>
              <div className="font-bold text-sm">
                 {provider === 'trocr' ? 'TrOCR (AI)' : provider.charAt(0).toUpperCase() + provider.slice(1).replace('_', ' ')}
              </div>
              {ocrProvider === provider && (
                <div className="absolute top-3 right-3">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompactUploader;
