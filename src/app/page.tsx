'use client';

import { useState } from 'react';
import FileUpload from './components/FileUpload';

interface AnalysisResults {
  emails: Array<{ email: string; esp: string }>;
  summary: {
    total: number;
    microsoft: number;
    google: number;
    other: number;
    invalid: number;
  };
}

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error processing file');
      }

      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing file');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResults = () => {
    if (!results) return;

    const csvContent = [
      ['Email', 'ESP Provider'],
      ...results.emails.map(({ email, esp }) => [email, esp])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'esp_analysis_results.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <span className="text-xl font-bold text-gray-900">ESP Domain Analyzer</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl w-full space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Analyze Your Email Lists
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Upload your CSV file to identify and categorize email service providers
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
            <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {results && (
              <div className="space-y-6 mt-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600">Microsoft</p>
                    <p className="text-2xl font-bold text-blue-900">{results.summary.microsoft}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600">Google</p>
                    <p className="text-2xl font-bold text-red-900">{results.summary.google}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Other</p>
                    <p className="text-2xl font-bold text-gray-900">{results.summary.other}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-sm text-yellow-600">Invalid</p>
                    <p className="text-2xl font-bold text-yellow-900">{results.summary.invalid}</p>
                  </div>
                </div>

                <button
                  onClick={downloadResults}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Download Results
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
