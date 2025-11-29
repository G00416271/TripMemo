import React from 'react';
import { Settings2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ServerConfig } from '../types';

interface ServerConfigurationProps {
  config: ServerConfig;
  onConfigChange: (config: ServerConfig) => void;
}

export const ServerConfiguration: React.FC<ServerConfigurationProps> = ({ config, onConfigChange }) => {
  return (
    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-brand-400" />
          Configuration
        </h2>
        <div className="flex items-center gap-2">
           <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
             Mode:
           </label>
           <span className={`px-2 py-0.5 rounded text-xs font-bold ${config.simulate ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
             {config.simulate ? 'SIMULATION' : 'LIVE'}
           </span>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="server-url" className="block text-sm font-medium text-slate-400 mb-1">
            Target Endpoint URL
          </label>
          <div className="relative group">
            <input
              id="server-url"
              type="text"
              value={config.url}
              onChange={(e) => onConfigChange({ ...config, url: e.target.value })}
              disabled={config.simulate}
              className={`w-full bg-slate-900 border ${config.simulate ? 'border-slate-800 text-slate-500' : 'border-slate-600 text-slate-200 focus:border-brand-500'} rounded-lg px-4 py-2.5 outline-none transition-all placeholder:text-slate-600`}
              placeholder="http://localhost:3000/upload"
            />
             {!config.simulate && (
                <div className="absolute right-3 top-2.5 text-xs text-brand-500 font-medium">
                  POST
                </div>
             )}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
          <div className="relative flex items-start">
            <div className="flex h-5 items-center">
              <input
                id="simulate-mode"
                type="checkbox"
                checked={config.simulate}
                onChange={(e) => onConfigChange({ ...config, simulate: e.target.checked })}
                className="h-4 w-4 rounded border-slate-600 text-brand-600 focus:ring-brand-500 bg-slate-800"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="simulate-mode" className="font-medium text-slate-300 cursor-pointer">
                Simulate Backend Response
              </label>
              <p className="text-slate-500 text-xs">
                Use a mock delay and response instead of a real network request.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};