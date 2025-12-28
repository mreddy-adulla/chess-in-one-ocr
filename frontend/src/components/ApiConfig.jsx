import React from 'react';

const ApiConfig = () => {
  const [backendUrl, setBackendUrl] = React.useState('http://localhost:8000');

  const handleCloudflareChange = (e) => {
    setBackendUrl(e.target.value);
  };

  return (
    <div className="api-config p-4 border rounded bg-gray-50">
      <h3 className="font-bold">Backend Connection</h3>
      <input 
        type="text" 
        value={backendUrl} 
        onChange={handleCloudflareChange}
        className="w-full p-2 border rounded mt-2"
        placeholder="https://xxxx.trycloudflare.com"
      />
      <p className="text-xs text-gray-500 mt-1">
        Current Endpoint: {backendUrl}/api/v1
      </p>
    </div>
  );
};

export default ApiConfig;
