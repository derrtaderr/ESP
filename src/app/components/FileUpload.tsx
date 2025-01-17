'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export default function FileUpload({ onFileSelect, isProcessing }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'text/csv') {
      onFileSelect(file);
    }
  }, [onFileSelect]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: isProcessing
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed border-gray-300 rounded-lg p-12 transition-colors
        ${dragActive ? 'drag-active' : ''}
        ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-500'}`}
    >
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <div className="mt-4">
          <input {...getInputProps()} />
          <span className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
            {isProcessing ? 'Processing...' : 'Upload a file'}
          </span>
          <p className="text-sm text-gray-500 mt-1">or drag and drop</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">CSV up to 10MB (max 1000 email addresses)</p>
      </div>
    </div>
  );
} 