import React from 'react';
import { UploadState } from '../types';
import { Terminal, Copy, Check, XCircle, AlertCircle } from 'lucide-react';

interface ResponseViewerProps {
  state: UploadState;
}

export const ResponseViewer: React.FC<ResponseViewerProps> = ({ state }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (state.responseData) {
      navigator.clipboard.writeText(state.responseData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden flex flex-col h-full min-h-[400px]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-purple-400" />
          Server Response
        </h2>
        
        {state.status === 'success' && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
            <Check className="w-3.5 h-3.5" />
            200 OK
          </span>
        )}
        
        {state.status === 'error' && (
           <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
             <XCircle className="w-3.5 h-3.5" />
             Error
           </span>
        )}
      </div>

      {/* Content Area */}
      <div className="relative flex-1 p-0 overflow-hidden group">
        {state.status === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 space-y-4">
            <div className="w-16 h-16 rounded-xl bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
               <Terminal className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm font-medium">Waiting for upload...</p>
          </div>
        )}

        {state.status === 'uploading' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 bg-slate-900/50 z-10 backdrop-blur-sm">
             <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-slate-700 border-t-brand-500 animate-spin"></div>
             </div>
             <p className="text-brand-400 animate-pulse font-medium">Transmitting data...</p>
          </div>
        )}

        {state.status === 'error' && (
           <div className="p-6">
              <div className="bg-red-500/5 border border-red-900/50 rounded-xl p-4 flex items-start gap-3">
                 <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                 <div>
                    <h3 className="text-red-400 font-medium mb-1">Upload Failed</h3>
                    <p className="text-red-300/80 text-sm leading-relaxed">{state.message}</p>
                 </div>
              </div>
           </div>
        )}

        {state.responseData && (
          <div className="h-full flex flex-col">
             <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={handleCopy}
                  className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg shadow-lg border border-slate-600 transition-colors"
                  title="Copy response"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
             </div>
             <div className="flex-1 overflow-auto p-5 custom-scrollbar">
                <pre className="font-mono text-sm text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                  {state.responseData}
                </pre>
             </div>
          </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="px-5 py-3 border-t border-slate-800 bg-slate-900 text-xs text-slate-500 flex justify-between items-center">
        <span>Format: Text / JSON</span>
        {state.responseData && <span>Length: {state.responseData.length} chars</span>}
      </div>
    </div>
  );
};