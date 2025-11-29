import React from 'react';
import { Server, Activity } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <div className="text-center space-y-2 mb-4">
      <div className="inline-flex items-center justify-center p-3 bg-brand-500/10 rounded-2xl mb-2 ring-1 ring-brand-500/20">
        <Server className="w-8 h-8 text-brand-400" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
        Localhost <span className="text-brand-400">File Uplink</span>
      </h1>
      <p className="text-slate-400 max-w-lg mx-auto text-base">
        Seamlessly upload files to your local backend for processing and view the raw response instantly.
      </p>
    </div>
  );
};