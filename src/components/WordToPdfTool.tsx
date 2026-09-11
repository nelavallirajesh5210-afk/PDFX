import React, { useState } from 'react';
import { DropZone } from './DropZone';
import { convertWordToPdf, triggerDownload, formatBytes } from '../services/api';
import { ProcessingState, ProcessResult } from '../types/pdf';
import {
  FileType,
  ArrowLeft,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
} from 'lucide-react';

interface WordToPdfToolProps {
  onBack: () => void;
}

export const WordToPdfTool: React.FC<WordToPdfToolProps> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    stepMessage: '',
  });
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResult(null);
    }
  };

  const handleConvert = async () => {
    if (!file) return;

    setProcessing({ status: 'uploading', progress: 25, stepMessage: 'Reading Word document...' });

    try {
      const res = await convertWordToPdf(file, (step, percent) => {
        setProcessing({ status: 'processing', progress: percent, stepMessage: step });
      });

      setResult(res);
      setProcessing({ status: 'success', progress: 100, stepMessage: 'Complete!' });
    } catch (err: any) {
      setProcessing({
        status: 'error',
        progress: 0,
        stepMessage: '',
        errorMessage: err.message || 'Failed to convert Word document to PDF.',
      });
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setProcessing({ status: 'idle', progress: 0, stepMessage: '' });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Back button */}
      <button
        id="word-to-pdf-back-btn"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to all tools</span>
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
          <FileType className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Word to PDF
        </h1>
        <p className="text-base font-medium text-slate-600 mt-1">
          Convert Microsoft Word documents (.docx) into universal PDF documents
        </p>
      </div>

      {/* Success View */}
      {result ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Your PDF is ready!</h2>
            <p className="text-sm text-slate-600">
              Your document is formatted into standard PDF pages ready to share or print.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-sm mx-auto text-left text-xs text-slate-700 space-y-1">
            <div className="font-semibold text-slate-900 truncate">{result.filename}</div>
            <div className="text-slate-500">{formatBytes(result.fileSize)}</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="word-to-pdf-download-btn"
              onClick={() => triggerDownload(result.downloadUrl, result.filename)}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Convert another document</span>
            </button>
          </div>
        </div>
      ) : !file ? (
        /* Upload Area */
        <DropZone
          onFilesSelected={handleFilesSelected}
          multiple={false}
          acceptType="word"
          title="Drag & drop your Word document here"
          subtitle="Supports .docx and .doc files up to 50MB"
          buttonLabel="Choose Word Document"
        />
      ) : (
        /* Configuration & Action Area */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* File Selected Card */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
              </div>
            </div>

            <button
              onClick={() => setFile(null)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Remove file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* In-Flight Processing Feedback */}
          {processing.status === 'processing' || processing.status === 'uploading' ? (
            <div className="space-y-3 py-2 text-center">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${processing.progress}%` }}
                />
              </div>
              <p className="text-sm font-medium text-slate-600 flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                {processing.stepMessage || 'Converting to PDF...'}
              </p>
            </div>
          ) : (
            /* Primary Action Button */
            <button
              id="word-to-pdf-submit-btn"
              onClick={handleConvert}
              className="w-full py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileType className="w-5 h-5" />
              <span>Convert to PDF</span>
            </button>
          )}

          {processing.errorMessage && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{processing.errorMessage}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
