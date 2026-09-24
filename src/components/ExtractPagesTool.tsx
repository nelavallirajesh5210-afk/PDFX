import React, { useState, useEffect } from 'react';
import { DropZone } from './DropZone';
import { LoadingProgressIndicator } from './LoadingProgressIndicator';
import {
  formatBytes,
  getPdfInfo,
  extractPdfPages,
  triggerDownload,
  fetchSamplePdf,
  fetchPdfThumbnails,
} from '../services/api';
import { PdfFileInfo, ProcessingState, ProcessResult, PageThumbnail, ExtractPagesOptions } from '../types/pdf';
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Loader2,
  Trash2,
} from 'lucide-react';

interface ExtractPagesToolProps {
  onBack?: () => void;
  onNavigateToAllTools?: () => void;
}

export const ExtractPagesTool: React.FC<ExtractPagesToolProps> = ({ onBack, onNavigateToAllTools }) => {
  const [fileInfo, setFileInfo] = useState<PdfFileInfo | null>(null);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [thumbnailsLoading, setThumbnailsLoading] = useState(false);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [mode, setMode] = useState<'single-pdf' | 'separate-pdfs'>('single-pdf');

  const [processing, setProcessing] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    stepMessage: '',
  });
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);

  useEffect(() => {
    if (!fileInfo) {
      setThumbnails([]);
      setSelectedPages([]);
      return;
    }

    let isMounted = true;
    setThumbnailsLoading(true);

    fetchPdfThumbnails(fileInfo.file)
      .then((thumbs) => {
        if (isMounted) {
          setThumbnails(thumbs);
          setThumbnailsLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Thumbnails generation failed:', err);
        if (isMounted) setThumbnailsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fileInfo]);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const file = files[0];

    try {
      const info = await getPdfInfo(file);
      setFileInfo({
        id: crypto.randomUUID(),
        file,
        name: file.name,
        size: file.size,
        pageCount: info.pageCount,
        status: 'ready',
      });
      setResult(null);
      setSelectedPages([]);
    } catch (err: any) {
      alert('Failed to read PDF: ' + err.message);
    }
  };

  const handleLoadSample = async () => {
    try {
      setSampleLoading(true);
      const sample = await fetchSamplePdf('multipage');
      await handleFilesSelected([sample]);
    } catch (err: any) {
      alert('Failed to load demo document: ' + err.message);
    } finally {
      setSampleLoading(false);
    }
  };

  const togglePageSelection = (page: number) => {
    setSelectedPages((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page].sort((a, b) => a - b)
    );
  };

  const handleExtract = async () => {
    if (!fileInfo) return;

    if (selectedPages.length === 0) {
      alert('Please select at least one page to extract.');
      return;
    }

    try {
      setProcessing({
        status: 'processing',
        progress: 20,
        stepMessage: `Extracting ${selectedPages.length} pages...`,
      });

      const options: ExtractPagesOptions = {
        pagesToExtract: selectedPages,
        pages: selectedPages,
        mode,
      };

      const res = await extractPdfPages(fileInfo.file, options, (step, percent) => {
        setProcessing((p) => ({ ...p, stepMessage: step, progress: percent }));
      });

      setResult(res);
      setProcessing({
        status: 'success',
        progress: 100,
        stepMessage: 'Pages extracted successfully!',
      });
    } catch (err: any) {
      setProcessing({
        status: 'error',
        progress: 0,
        stepMessage: '',
        errorMessage: err.message || 'Failed to extract pages.',
      });
    }
  };

  const resetAll = () => {
    setFileInfo(null);
    setThumbnails([]);
    setSelectedPages([]);
    setResult(null);
    setProcessing({ status: 'idle', progress: 0, stepMessage: '' });
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
        id="extract-pages-back-btn"
        onClick={handleBackClick}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to all tools</span>
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
          <FileText className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Extract PDF Pages
        </h1>
        <p className="text-base font-medium text-slate-600 mt-1">
          Pick only the pages you want and export them into a new custom PDF or ZIP
        </p>
      </div>

      {/* Success View */}
      {result && processing.status === 'success' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Your extracted PDF is ready!</h2>
            <p className="text-sm text-slate-600">
              Successfully extracted {selectedPages.length} {selectedPages.length === 1 ? 'page' : 'pages'}.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-sm mx-auto text-left text-xs text-slate-700 space-y-1">
            <div className="font-semibold text-slate-900 truncate">{result.filename}</div>
            <div className="text-slate-500">{formatBytes(result.fileSize)}</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="extract-pages-download-btn"
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
              <span>Extract from another PDF</span>
            </button>
          </div>
        </div>
      ) : !fileInfo ? (
        /* Upload Area */
        <DropZone
          onFilesSelected={handleFilesSelected}
          multiple={false}
          title="Drag & drop your PDF here"
          subtitle="Upload any PDF to extract specific pages"
          buttonLabel="Choose PDF File"
          onDemoClick={handleLoadSample}
          demoLabel={sampleLoading ? 'Loading demo...' : 'Try Demo PDF'}
        />
      ) : (
        /* Configuration & Selection Area */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* File Selected Card */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-slate-900 truncate">{fileInfo.name}</p>
                <p className="text-xs text-slate-500">
                  {fileInfo.pageCount} pages • {selectedPages.length} selected
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

          {/* Quick Select Buttons */}
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Select pages to keep ({selectedPages.length} selected):</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedPages(Array.from({ length: fileInfo.pageCount || 1 }, (_, i) => i + 1))}
                className="text-blue-600 hover:underline font-semibold"
              >
                Select all
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

          {/* Page Preview Cards */}
          {thumbnailsLoading ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-600">Loading page previews...</p>
            </div>
          ) : thumbnails.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-72 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
              {thumbnails.map((t) => {
                const isSelected = selectedPages.includes(t.pageNumber);
                return (
                  <button
                    key={t.pageNumber}
                    type="button"
                    onClick={() => togglePageSelection(t.pageNumber)}
                    className={`relative rounded-lg overflow-hidden border-2 text-left transition-all ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm'
                        : 'border-slate-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={t.dataUrl}
                      alt={`Page ${t.pageNumber}`}
                      className="w-full aspect-[3/4] object-cover bg-white"
                    />

                    {isSelected ? (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    ) : null}

                    <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] font-bold text-center py-0.5">
                      Page {t.pageNumber}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
              {Array.from({ length: fileInfo.pageCount || 1 }, (_, i) => i + 1).map((p) => {
                const isSelected = selectedPages.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePageSelection(p)}
                    className={`py-3 rounded-lg border font-bold text-xs text-center transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    Page {p}
                  </button>
                );
              })}
            </div>
          )}

          {/* Export Format */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('single-pdf')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'single-pdf' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Combine into 1 PDF
            </button>
            <button
              type="button"
              onClick={() => setMode('separate-pdfs')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'separate-pdfs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Separate Files (ZIP)
            </button>
          </div>

          {/* In-Flight Processing Feedback */}
          {processing.status === 'processing' ? (
            <div className="py-2">
              <LoadingProgressIndicator
                toolType="extract-pages"
                title="Extracting Pages"
                stepMessage={processing.stepMessage}
                progress={processing.progress}
                fileName={fileInfo.name}
                fileSize={fileInfo.size}
                onCancel={resetAll}
              />
            </div>
          ) : (
            /* Action Button */
            <button
              id="extract-pages-submit-btn"
              onClick={handleExtract}
              disabled={selectedPages.length === 0}
              className="w-full py-4 text-base font-bold text-primary-foreground bg-primary hover:bg-primary/90 active:bg-primary/80 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-5 h-5" />
              <span>
                {selectedPages.length === 0
                  ? 'Select pages to extract'
                  : `Extract ${selectedPages.length} ${selectedPages.length === 1 ? 'Page' : 'Pages'}`}
              </span>
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
