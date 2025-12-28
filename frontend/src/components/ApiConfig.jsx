import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ApiConfig = () => {
  const [config, setConfig] = useState({
    type: 'local',
    provider: 'google',
    api_key: '',
    model_path: 'models/trocr.onnx'
  });
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/v1/config/ocr');
      setConfig(response.data);
    } catch (error) {
      console.error('Error fetching config', error);
    }
  };

  const handleSave = async () => {
    try {
      setStatus('Saving...');
      await axios.post('http://localhost:8000/api/v1/config/ocr', config);
      setStatus('Saved successfully!');
      setTimeout(() => setStatus(''), 3000);
    } catch (error) {
      setStatus('Error saving config');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-xl font-bold">OCR Configuration</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Engine Type</label>
        <select 
          className="mt-1 block w-full border rounded-md p-2"
          value={config.type}
          onChange={(e) => setConfig({...config, type: e.target.value})}
        >
          <option value="local">Local (TrOCR)</option>
          <option value="online">Online API</option>
        </select>
      </div>

      {config.type === 'online' && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">Provider</label>
            <select 
              className="mt-1 block w-full border rounded-md p-2"
              value={config.provider}
              onChange={(e) => setConfig({...config, provider: e.target.value})}
            >
              <option value="google">Google Cloud Vision (Free Tier)</option>
              <option value="azure">Azure Computer Vision</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">API Key</label>
            <input 
              type="password"
              className="mt-1 block w-full border rounded-md p-2"
              value={config.api_key}
              onChange={(e) => setConfig({...config, api_key: e.target.value})}
              placeholder="Enter your API key"
            />
            <p className="text-xs text-gray-500 mt-1">
              {config.provider === 'google' 
                ? 'Get a free key from Google Cloud Console (1000 requests/mo free).' 
                : 'Get a free key from Azure Portal.'}
            </p>
          </div>
        </>
      )}

      {config.type === 'local' && (
        <div>
          <label className="block text-sm font-medium text-gray-700">Model Path</label>
          <input 
            type="text"
            className="mt-1 block w-full border rounded-md p-2"
            value={config.model_path}
            onChange={(e) => setConfig({...config, model_path: e.target.value})}
          />
        </div>
      )}

      <button 
        onClick={handleSave}
        className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition"
      >
        Save Configuration
      </button>

      {status && <p className="text-center text-sm font-medium">{status}</p>}
    </div>
  );
};

export default ApiConfig;
