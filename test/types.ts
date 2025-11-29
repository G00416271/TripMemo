export interface ServerConfig {
  url: string;
  simulate: boolean;
}

export interface UploadState {
  status: 'idle' | 'uploading' | 'success' | 'error';
  message: string;
  responseData: string | null;
}

export interface FileData {
  file: File | null;
  previewUrl: string | null;
}