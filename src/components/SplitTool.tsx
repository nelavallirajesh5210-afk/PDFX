import React, { useState } from 'react';
import { DropZone } from './DropZone';
import {
  formatBytes,
  getPdfInfo,
  splitPdf,
  triggerDownload,
  fetchSamplePdf,
} from '../services/api';
import {
  ProcessResult,
  ProcessingState,
  SplitMode,
} from '../types/pdf';
import {
  Scissors,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  FileText,
  Loader2,
  Trash2,
} from 'lucide-react';

interface SplitToolProps {
  onBack?: () => void;
}

export const SplitTool: React.FC<SplitToolProps> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [mode, setMode] = useState<SplitMode>('range');
  const [ranges, setRanges] = useState<string>('1');
  const [selectedPages, setSelectedPages] = useState<number[]>([1]);
  const [mergeOutput, setMergeOutput] = useState<boolean>(true);
  const [sampleLoading, setSampleLoading] = useState(false);

  const [processing, setProcessing] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    stepMessage: '',
  });
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const selectedFile = files[0];
    setFile(selectedFile);
    setResult(null);
    setAnalyzing(true);

    try {
      const info = await getPdfInfo(selectedFile);
      setTotalPages(info.pageCount);
      setRanges(`1-${Math.min(3, info.pageCount)}`);
      setSelectedPages(Array.from({ length: Math.min(3, info.pageCount) }, (_, i) => i + 1));
    } catch (err: any) {
      alert(err.message);
      setFile(null);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLoadSample = async () => {
    try {
      setSampleLoading(true);
      const sample = await fetchSamplePdf('multipage');
      await handleFileSelected([sample]);
    } catch (err: any) {
      alert('Failed to load demo document: ' + err.message);
    } finally {
      setSampleLoading(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setTotalPages(0);
    setResult(null);
    setProcessing({ status: 'idle', progress: 0, stepMessage: '' });
  };

  const togglePageSelection = (pageNum: number) => {
    setSelectedPages((prev) =>
      prev.includes(pageNum)
        ? prev.filter((p) => p !== pageNum)
        : [...prev, pageNum].sort((a, b) => a - b)
    );
  };

  const handleSplit = async () => {
    if (!file) return;

    try {
      setProcessing({
        status: 'processing',
        progress: 15,
        stepMessage: 'Analyzing document structure...',
      });

      const splitOptions = {
        ranges: mode === 'range' ? ranges : undefined,
        selectedPages: mode === 'visual' ? selectedPages : undefined,
        mergeOutput: mode === 'all' ? false : mergeOutput,
      };

      const res = await splitPdf(file, mode, splitOptions, (step, percent) => {
        setProcessing((p) => ({ ...p, stepMessage: step, progress: percent }));
      });

      setResult(res);
      setProcessing({
        status: 'success',
        progress: 100,
        stepMessage: 'Split complete!',
      });
    } catch (err: any) {
      setProcessing({
        status: 'error',
        progress: 0,
        stepMessage: '',
        errorMessage: err.message || 'Failed to split document.',
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Back button */}
      {onBack && (
        <button
          id="split-back-btn"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to all tools</span>
        </button>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mb-3">
          <Scissors className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Split PDF
        </h1>
        <p className="text-base font-medium text-slate-600 mt-1">
          Separate PDF pages or extract custom page ranges effortlessly
        </p>
      </div>

      {/* Success / Result View */}
      {result && processing.status === 'success' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Your PDF is ready!</h2>
            <p className="text-sm text-slate-600">
              Successfully extracted pages from your document.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-sm mx-auto text-left text-xs text-slate-700 space-y-1">
            <div className="font-semibold text-slate-900 truncate">{result.filename}</div>
            <div className="text-slate-500">{formatBytes(result.fileSize)}</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="split-download-btn"
              onClick={() => triggerDownload(result.downloadUrl, result.filename)}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Download {result.isZip ? 'ZIP Archive' : 'PDF'}</span>
            </button>

            <button
              onClick={resetAll}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Split another document</span>
            </button>
          </div>
        </div>
      ) : !file ? (
        /* Upload Area */
        <DropZone
          onFilesSelected={handleFileSelected}
          multiple={false}
          title="Drag & drop your PDF file here"
          subtitle="Upload any multi-page PDF document up to 50MB"
          buttonLabel="Choose PDF File"
          onDemoClick={handleLoadSample}
          demoLabel={sampleLoading ? 'Loading demo...' : 'Try Demo PDF'}
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
                <p className="text-xs text-slate-500">
                  {totalPages} pages • {formatBytes(file.size)}
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

          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('range')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'range' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Page Range
            </button>
            <button
              type="button"
              onClick={() => setMode('visual')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'visual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pick Pages
            </button>
            <button
              type="button"
              onClick={() => setMode('all')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Extract All
            </button>
          </div>

          {/* Range Configuration */}
          {mode === 'range' && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Enter Page Ranges (e.g. 1-3, 5, 7-10)
              </label>
              <input
                id="split-range-input"
                type="text"
                value={ranges}
                onChange={(e) => setRanges(e.target.value)}
                placeholder={`1-${totalPages}`}
                className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>Presets:</span>
                <button
                  type="button"
                  onClick={() => setRanges('1')}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
                >
                  First Page
                </button>
                <button
                  type="button"
                  onClick={() => setRanges(`1-${Math.ceil(totalPages / 2)}`)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
                >
                  First Half
                </button>
                <button
                  type="button"
                  onClick={() => setRanges(`1-${totalPages}`)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium"
                >
                  All ({totalPages})
                </button>
              </div>
            </div>
          )}

          {/* Visual Picker */}
          {mode === 'visual' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Select pages to keep ({selectedPages.length} selected):</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPages(Array.from({ length: totalPages }, (_, i) => i + 1))}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => setSelectedPages([])}
                    className="text-slate-500 hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const isSelected = selectedPages.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePageSelection(p)}
                      className={`p-3 rounded-lg border text-center font-bold text-xs transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400'
                      }`}
                    >
                      Page {p}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* All pages notice */}
          {mode === 'all' && (
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
              <p className="font-semibold">Split each page into a separate PDF</p>
              <p className="text-blue-700">All {totalPages} pages will be saved as individual files and downloaded as a clean ZIP package.</p>
            </div>
          )}

          {/* Output Mode (Merge or Individual) for range / visual */}
          {mode !== 'all' && (
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={mergeOutput}
                onChange={(e) => setMergeOutput(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">Merge into a single PDF document</span>
                <span className="text-slate-500">Uncheck to download separate individual files in a ZIP archive</span>
              </div>
            </label>
          )}

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
                <span>{processing.stepMessage || 'Splitting document...'}</span>
              </p>
            </div>
          ) : (
            /* Action Button */
            <button
              id="split-submit-btn"
              onClick={handleSplit}
              className="w-full py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Scissors className="w-5 h-5" />
              <span>Split PDF</span>
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
