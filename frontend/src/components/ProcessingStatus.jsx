import React from 'react';

const ProcessingStatus = ({ status, progress, message }) => {
  return (
    <div className="w-full max-w-xl mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-col items-center">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-100 rounded-full"></div>
        <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-600 rounded-full animate-spin border-t-transparent"></div>
      </div>
      
      <h3 className="text-xl font-bold text-slate-800 mb-2">{status}</h3>
      <p className="text-gray-500 text-center mb-6">{message}</p>
      
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div 
          className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-in-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-400 font-mono">{progress}% Complete</p>
    </div>
  );
};

export default ProcessingStatus;
