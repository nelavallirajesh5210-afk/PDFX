import React, { useState } from 'react';
import { DropZone } from './DropZone';
import {
  formatBytes,
  getPdfInfo,
  mergePdfs,
  triggerDownload,
  fetchSamplePdf,
} from '../services/api';
import {
  PdfFileInfo,
  ProcessResult,
  ProcessingState,
} from '../types/pdf';
import {
  Layers,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  FileText,
  Loader2,
  Plus,
  Sparkles,
} from 'lucide-react';

interface MergeToolProps {
  onBack?: () => void;
}

export const MergeTool: React.FC<MergeToolProps> = ({ onBack }) => {
  const [files, setFiles] = useState<PdfFileInfo[]>([]);
  const [processing, setProcessing] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    stepMessage: '',
  });
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);

  const handleFilesSelected = async (newFiles: File[]) => {
    const newItems: PdfFileInfo[] = newFiles.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      name: file.name,
      size: file.size,
      status: 'analyzing',
    }));

    setFiles((prev) => [...prev, ...newItems]);
    setResult(null);

    for (const item of newItems) {
      try {
        const info = await getPdfInfo(item.file);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, pageCount: info.pageCount, status: 'ready' }
              : f
          )
        );
      } catch (err: any) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: 'error', errorMessage: err.message }
              : f
          )
        );
      }
    }
  };

  const handleLoadSamples = async () => {
    try {
      setSampleLoading(true);
      const [f1, f2] = await Promise.all([
        fetchSamplePdf('merge-1'),
        fetchSamplePdf('merge-2'),
      ]);
      await handleFilesSelected([f1, f2]);
    } catch (err: any) {
      alert('Failed to load demo files: ' + err.message);
    } finally {
      setSampleLoading(false);
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    setFiles((prev) => {
      const next = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const removeItem = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const resetAll = () => {
    setFiles([]);
    setResult(null);
    setProcessing({ status: 'idle', progress: 0, stepMessage: '' });
  };

  const handleMerge = async () => {
    if (files.length < 2) return;

    try {
      setProcessing({
        status: 'processing',
        progress: 15,
        stepMessage: 'Uploading & analyzing documents...',
      });

      const rawFiles = files.map((f) => f.file);
      const res = await mergePdfs(rawFiles, (step, percent) => {
        setProcessing((p) => ({ ...p, stepMessage: step, progress: percent }));
      });

      setResult(res);
      setProcessing({
        status: 'success',
        progress: 100,
        stepMessage: 'Merge complete!',
      });
    } catch (err: any) {
      setProcessing({
        status: 'error',
        progress: 0,
        stepMessage: '',
        errorMessage: err.message || 'An error occurred while merging documents.',
      });
    }
  };

  const totalPages = files.reduce((acc, f) => acc + (f.pageCount || 0), 0);
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Back button */}
      {onBack && (
        <button
          id="merge-back-btn"
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
          <Layers className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Merge PDF
        </h1>
        <p className="text-base font-medium text-slate-600 mt-1">
          Combine multiple PDF files into one clean, unified document
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
              Successfully merged {files.length} documents ({result.pageCount ?? totalPages} total pages).
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-sm mx-auto text-left text-xs text-slate-700 space-y-1">
            <div className="font-semibold text-slate-900 truncate">{result.filename}</div>
            <div className="text-slate-500">{formatBytes(result.fileSize)}</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="merge-download-btn"
              onClick={() => triggerDownload(result.downloadUrl, result.filename)}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Download Merged PDF</span>
            </button>

            <button
              onClick={resetAll}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Merge more files</span>
            </button>
          </div>
        </div>
      ) : files.length === 0 ? (
        /* Upload Area */
        <div className="space-y-4">
          <DropZone
            onFilesSelected={handleFilesSelected}
            multiple={true}
            title="Drag & drop your PDF files here"
            subtitle="Select two or more PDF files to combine"
            buttonLabel="Choose PDF Files"
            onDemoClick={handleLoadSamples}
            demoLabel={sampleLoading ? 'Loading demo...' : 'Try Demo PDFs'}
          />
        </div>
      ) : (
        /* Files Selected & Merge Action */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Selected Files ({files.length})
              </h2>
              <p className="text-xs text-slate-500">
                Drag or use arrows to reorder pages • {formatBytes(totalSize)} total
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="merge-add-more-input"
                className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More Files</span>
              </label>
              <input
                id="merge-add-more-input"
                type="file"
                multiple
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                }}
              />
            </div>
          </div>

          {/* Files List */}
          <div className="space-y-2.5">
            {files.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {formatBytes(item.size)}
                      {item.pageCount ? ` • ${item.pageCount} ${item.pageCount === 1 ? 'page' : 'pages'}` : ''}
                    </p>
                  </div>
                </div>

                {/* Reorder and Delete Controls */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg"
                    title="Move up"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === files.length - 1}
                    className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg"
                    title="Move down"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg ml-1"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
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
                <span>{processing.stepMessage || 'Merging files...'}</span>
              </p>
            </div>
          ) : (
            /* Action Button */
            <div className="pt-2">
              <button
                id="merge-submit-btn"
                onClick={handleMerge}
                disabled={files.length < 2}
                className="w-full py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Layers className="w-5 h-5" />
                <span>{files.length < 2 ? 'Add at least 2 files to merge' : 'Merge PDF'}</span>
              </button>
            </div>
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
