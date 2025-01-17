'use client';

import { useState } from 'react';
import FileUpload from './components/FileUpload';

interface AnalysisSummary {
  total: number;
  google: number;
  microsoft: number;
  yahoo: number;
  protonmail: number;
  zoho: number;
  aol: number;
  other: number;
  invalid: number;
}

interface AnalysisResult {
  success: boolean;
  summary: AnalysisSummary;
  csvContent: string;
  totalRecords: number;
  filename: string;
}

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

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

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error processing file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result) return;

    const blob = new Blob([result.csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
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
              Upload your CSV file to identify and categorize email service providers.
              We&apos;ll add an &quot;ESP Provider&quot; column next to your email addresses.
            </p>
          </div>

          <div className="bg-white p-8 rounded-lg shadow-md space-y-6">
            <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {result && (
              <div className="space-y-6 mt-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Analysis Complete!</h3>
                  <p className="text-sm text-gray-600">
                    Analyzed {result.totalRecords} email addresses
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {result.summary.google > 0 && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-600">Google Workspace</p>
                      <p className="text-2xl font-bold text-blue-900">{result.summary.google}</p>
                    </div>
                  )}
                  {result.summary.microsoft > 0 && (
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-sm text-indigo-600">Microsoft 365</p>
                      <p className="text-2xl font-bold text-indigo-900">{result.summary.microsoft}</p>
                    </div>
                  )}
                  {result.summary.yahoo > 0 && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-purple-600">Yahoo</p>
                      <p className="text-2xl font-bold text-purple-900">{result.summary.yahoo}</p>
                    </div>
                  )}
                  {result.summary.protonmail > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-600">ProtonMail</p>
                      <p className="text-2xl font-bold text-green-900">{result.summary.protonmail}</p>
                    </div>
                  )}
                  {result.summary.zoho > 0 && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-red-600">Zoho</p>
                      <p className="text-2xl font-bold text-red-900">{result.summary.zoho}</p>
                    </div>
                  )}
                  {result.summary.aol > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-yellow-600">AOL</p>
                      <p className="text-2xl font-bold text-yellow-900">{result.summary.aol}</p>
                    </div>
                  )}
                  {result.summary.other > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600">Other</p>
                      <p className="text-2xl font-bold text-gray-900">{result.summary.other}</p>
                    </div>
                  )}
                  {result.summary.invalid > 0 && (
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-red-600">Invalid</p>
                      <p className="text-2xl font-bold text-red-900">{result.summary.invalid}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Download Analyzed CSV
                </button>
              </div>
            )}

            <div className="mt-4 text-sm text-gray-500">
              <h3 className="font-medium text-gray-700 mb-2">How it works:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Upload your CSV file with email addresses</li>
                <li>We&apos;ll analyze each email to identify if it&apos;s using Google Workspace or Microsoft 365</li>
                <li>Review the analysis results</li>
                <li>Download the new CSV with the ESP column added</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
