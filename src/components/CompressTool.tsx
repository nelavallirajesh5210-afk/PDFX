import React, { useState, useEffect } from 'react';
import { DropZone } from './DropZone';
import {
  formatBytes,
  compressPdf,
  triggerDownload,
  fetchSamplePdf,
  getPdfInfo,
} from '../services/api';
import {
  CompressionLevel,
  ProcessResult,
  ProcessingState,
} from '../types/pdf';
import {
  Minimize2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  FileText,
  Loader2,
  Trash2,
  Shield,
  Gauge,
  Zap,
} from 'lucide-react';

interface CompressToolProps {
  onBack?: () => void;
  onNavigateToAllTools?: () => void;
}

export const CompressTool: React.FC<CompressToolProps> = ({ onBack, onNavigateToAllTools }) => {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [level, setLevel] = useState<CompressionLevel>('recommended');
  const [processing, setProcessing] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    stepMessage: '',
  });
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (result?.downloadUrl) {
        URL.revokeObjectURL(result.downloadUrl);
      }
    };
  }, [result]);

  const handleSelectFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setProcessing({ status: 'idle', progress: 0, stepMessage: '' });

    try {
      const info = await getPdfInfo(selectedFile);
      setPageCount(info.pageCount || null);
    } catch {
      setPageCount(null);
    }
  };

  const handleLoadSample = async () => {
    try {
      setSampleLoading(true);
      const sample = await fetchSamplePdf('compress');
      await handleSelectFile(sample);
    } catch (err: any) {
      alert('Failed to load demo document: ' + err.message);
    } finally {
      setSampleLoading(false);
    }
  };

  const resetAll = () => {
    if (result?.downloadUrl) {
      URL.revokeObjectURL(result.downloadUrl);
    }
    setFile(null);
    setPageCount(null);
    setResult(null);
    setProcessing({ status: 'idle', progress: 0, stepMessage: '' });
  };

  const handleCompress = async () => {
    if (!file) return;

    try {
      setProcessing({
        status: 'processing',
        progress: 20,
        stepMessage: 'Analyzing PDF elements...',
      });

      const res = await compressPdf(file, level, (step, percent) => {
        setProcessing((p) => ({
          ...p,
          stepMessage: step,
          progress: Math.max(p.progress, percent),
        }));
      });

      setResult(res);
      setProcessing({
        status: 'success',
        progress: 100,
        stepMessage: 'Optimization complete!',
      });
    } catch (err: any) {
      setProcessing({
        status: 'error',
        progress: 0,
        stepMessage: '',
        errorMessage: err.message || 'An error occurred while compressing your PDF.',
      });
    }
  };

  const handleBackClick = () => {
    if (onBack) onBack();
    else if (onNavigateToAllTools) onNavigateToAllTools();
    else window.location.hash = '';
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Back button */}
      <button
        id="compress-back-btn"
        onClick={handleBackClick}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to all tools</span>
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mb-3">
          <Minimize2 className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Compress PDF
        </h1>
        <p className="text-base font-medium text-slate-600 mt-1">
          Reduce PDF file size while keeping document text and images sharp
        </p>
      </div>

      {/* Success / Result View */}
      {result && processing.status === 'success' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">
              {result.isAlreadyOptimized || (result.savingsBytes || 0) <= 0
                ? 'PDF is already optimized!'
                : 'Your PDF is compressed!'}
            </h2>
            <p className="text-sm text-slate-600">
              {result.isAlreadyOptimized || (result.savingsBytes || 0) <= 0
                ? 'This file was already compact, so no quality was degraded.'
                : `Reduced file size by ${result.savingsPercent}% (saved ${formatBytes(result.savingsBytes || 0)}).`}
            </p>
          </div>

          {/* Stat Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Original Size
              </span>
              <span className="text-base font-bold text-slate-700 font-mono mt-0.5 block">
                {formatBytes(result.originalSize || 0)}
              </span>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-left">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                New Size
              </span>
              <span className="text-base font-extrabold text-emerald-900 font-mono mt-0.5 block">
                {formatBytes(result.fileSize)}
              </span>
            </div>

            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-left col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
                Savings
              </span>
              <span className="text-base font-extrabold text-blue-900 font-mono mt-0.5 block">
                {result.savingsPercent}%
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="compress-download-btn"
              onClick={() => triggerDownload(result.downloadUrl, result.filename)}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Download Compressed PDF</span>
            </button>

            <button
              onClick={resetAll}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Compress another PDF</span>
            </button>
          </div>
        </div>
      ) : !file ? (
        /* Upload Area */
        <DropZone
          onFilesSelected={(files) => files.length > 0 && handleSelectFile(files[0])}
          multiple={false}
          title="Drag & drop your PDF here"
          subtitle="Choose a PDF file to reduce its size"
          buttonLabel="Choose PDF File"
          onDemoClick={handleLoadSample}
          demoLabel={sampleLoading ? 'Loading demo...' : 'Try Demo PDF'}
        />
      ) : (
        /* Configuration & Action Area */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Selected File Card */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {formatBytes(file.size)}
                  {pageCount ? ` • ${pageCount} pages` : ''}
                </p>
              </div>
            </div>

            <button
              onClick={resetAll}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Remove file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Compression Level Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Choose Compression Level
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Basic */}
              <button
                type="button"
                onClick={() => setLevel('basic')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  level === 'basic'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-slate-600" />
                    Basic
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                    Lossless
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Fastest optimization with 100% untouched image detail.
                </p>
              </button>

              {/* Option 2: Recommended */}
              <button
                type="button"
                onClick={() => setLevel('recommended')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  level === 'recommended'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-blue-600" />
                    Recommended
                  </span>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                    Best Balance
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  High size reduction with crisp screen readability (150 DPI).
                </p>
              </button>

              {/* Option 3: Maximum */}
              <button
                type="button"
                onClick={() => setLevel('maximum')}
                className={`p-4 rounded-xl border text-left transition-all ${
                  level === 'maximum'
                    ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" />
                    Maximum
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    Smallest Size
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Maximum compression for strict email and portal limits.
                </p>
              </button>
            </div>
          </div>

          {/* In-Flight Processing Feedback */}
          {processing.status === 'processing' ? (
            <div className="space-y-3 py-2 text-center">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${processing.progress}%` }}
                />
              </div>
              <p className="text-sm font-medium text-slate-600 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>{processing.stepMessage || 'Compressing your PDF...'}</span>
              </p>
            </div>
          ) : (
            /* Action Button */
            <button
              id="compress-submit-btn"
              onClick={handleCompress}
              className="w-full py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Minimize2 className="w-5 h-5" />
              <span>Compress PDF</span>
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
