import React, { useRef } from 'react';
import { FileUp, FileType, Check } from 'lucide-react';

interface UploadAreaProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  previewUrl: string | null;
}

export const UploadArea: React.FC<UploadAreaProps> = ({ onFileSelect, selectedFile, previewUrl }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group
        ${selectedFile 
          ? 'border-brand-500 bg-brand-500/5' 
          : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/20'}`}
    >
      <input
        type="file"
        ref={inputRef}
        onChange={handleInputChange}
        className="hidden"
      />

      {selectedFile ? (
        <div className="flex flex-col items-center w-full h-full p-4 relative z-10">
           {previewUrl ? (
             <div className="absolute inset-0 z-0">
               <img src={previewUrl} alt="Preview" className="w-full h-full object-cover opacity-20 blur-sm group-hover:blur-md transition-all" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
             </div>
           ) : null}

           <div className="z-10 flex flex-col items-center justify-center h-full gap-3 animate-fade-in">
             <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/30">
                <FileType className="w-8 h-8 text-white" />
             </div>
             <div className="text-center">
               <p className="text-lg font-semibold text-white break-all px-4 line-clamp-1">{selectedFile.name}</p>
               <p className="text-sm text-brand-200">{formatSize(selectedFile.size)}</p>
             </div>
             <div className="mt-2 px-3 py-1 bg-brand-500/20 border border-brand-500/30 rounded-full flex items-center gap-1.5">
               <Check className="w-3.5 h-3.5 text-brand-400" />
               <span className="text-xs font-medium text-brand-300">Ready to upload</span>
             </div>
           </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 text-slate-400 group-hover:text-slate-300 transition-colors">
          <div className="p-4 bg-slate-800 rounded-full ring-8 ring-slate-800/50 group-hover:ring-slate-700/50 transition-all">
            <FileUp className="w-8 h-8" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-lg font-medium">Click to select or drag file here</p>
            <p className="text-sm text-slate-500">Supports any file type</p>
          </div>
        </div>
      )}
    </div>
  );
};