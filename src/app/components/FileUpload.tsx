'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export default function FileUpload({ onFileSelect, isProcessing }: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.length > 0 && !isProcessing) {
      onFileSelect(acceptedFiles[0]);
    }
  }, [onFileSelect, isProcessing]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: false,
    disabled: isProcessing
  });

  return (
    <div
      {...getRootProps()}
      className="upload-area"
    >
      <div className={`flex flex-col items-center justify-center ${isDragActive ? 'drag-active' : ''}`}>
        <input {...getInputProps()} />
        <svg
          className="w-12 h-12 text-gray-500 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <button
          type="button"
          className="text-white font-medium mb-2"
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Upload a file'}
        </button>
        <p className="text-gray-400 text-sm">or drag and drop</p>
        <p className="text-gray-500 text-xs mt-2">CSV up to 50MB</p>
      </div>
    </div>
  );
} 