import React, { useState } from 'react';
import { ServerConfig, UploadState, FileData } from './types';
import { Header } from './components/Header';
import { ServerConfiguration } from './components/ServerConfiguration';
import { UploadArea } from './components/UploadArea';
import { ResponseViewer } from './components/ResponseViewer';
import { ArrowRight, UploadCloud, RefreshCw } from 'lucide-react';

export default function App() {
  const [serverConfig, setServerConfig] = useState<ServerConfig>({
    url: 'http://localhost:5000/process-images',
    simulate: true,
  });

  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    message: '',
    responseData: null,
  });

  const [fileData, setFileData] = useState<FileData>({
    file: null,
    previewUrl: null,
  });

  const handleFileSelect = (file: File) => {
    // Create a preview URL if it's an image
    let previewUrl: string | null = null;
    if (file.type.startsWith('image/')) {
      previewUrl = URL.createObjectURL(file);
    }

    setFileData({ file, previewUrl });
    setUploadState({ status: 'idle', message: '', responseData: null });
  };

  const handleUpload = async () => {
    if (!fileData.file) return;

    setUploadState({ status: 'uploading', message: 'Uploading file...', responseData: null });

    try {
      let responseText = '';
      let statusMessage = 'Upload successful!';

      if (serverConfig.simulate) {
        // Simulation mode
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const mockResponse = {
          status: 'success',
          filename: fileData.file.name,
          size: fileData.file.size,
          mimetype: fileData.file.type,
          timestamp: new Date().toISOString(),
          serverMessage: 'File received and processed by simulated backend.',
        };
        responseText = JSON.stringify(mockResponse, null, 2);
      } else {
        // Real upload mode
        const formData = new FormData();
        formData.append('file', fileData.file);
        formData.append('user', "tim");

        const response = await fetch(serverConfig.url, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const json = await response.json();
          responseText = JSON.stringify(json, null, 2);
        } else {
          responseText = await response.text();
        }
      }

      setUploadState({
        status: 'success',
        message: statusMessage,
        responseData: responseText,
      });

    } catch (error: any) {
      setUploadState({
        status: 'error',
        message: error.message || 'An unexpected error occurred',
        responseData: null,
      });
    }
  };

  const handleClear = () => {
    setFileData({ file: null, previewUrl: null });
    setUploadState({ status: 'idle', message: '', responseData: null });
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto gap-8">
      <Header />
      
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Configuration and Input */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <ServerConfiguration config={serverConfig} onConfigChange={setServerConfig} />
          
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-brand-400" />
              File Selection
            </h2>
            <UploadArea 
              onFileSelect={handleFileSelect} 
              selectedFile={fileData.file} 
              previewUrl={fileData.previewUrl}
            />
            
            {fileData.file && (
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleUpload}
                  disabled={uploadState.status === 'uploading'}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${
                    uploadState.status === 'uploading'
                      ? 'bg-brand-900/50 text-brand-300 cursor-not-allowed'
                      : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg shadow-brand-900/20'
                  }`}
                >
                  {uploadState.status === 'uploading' ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      Send to Server <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <button
                  onClick={handleClear}
                  disabled={uploadState.status === 'uploading'}
                  className="px-4 py-2.5 rounded-lg font-medium text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <ResponseViewer state={uploadState} />
        </div>
      </div>
    </div>
  );
}