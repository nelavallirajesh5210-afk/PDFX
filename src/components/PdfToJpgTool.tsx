import React, { useState, useEffect } from 'react';
import { DropZone } from './DropZone';
import {
  formatBytes,
  getPdfInfo,
  convertPdfToJpg,
  triggerDownload,
  fetchSamplePdf,
  fetchPdfThumbnails,
} from '../services/api';
import { PdfFileInfo, PdfToJpgOptions, ProcessingState, ProcessResult, PageThumbnail } from '../types/pdf';
import {
  FileImage,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Loader2,
  FileText,
  Trash2,
} from 'lucide-react';

interface PdfToJpgToolProps {
  onBack?: () => void;
  onNavigateToAllTools?: () => void;
}

export const PdfToJpgTool: React.FC<PdfToJpgToolProps> = ({ onBack, onNavigateToAllTools }) => {
  const [fileInfo, setFileInfo] = useState<PdfFileInfo | null>(null);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [thumbnailsLoading, setThumbnailsLoading] = useState(false);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [convertAll, setConvertAll] = useState(true);

  const [options, setOptions] = useState<PdfToJpgOptions>({
    dpi: 150,
    quality: 90,
    format: 'auto',
  });

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
          const allNums = thumbs.map((t) => t.pageNumber ?? t.page);
          setSelectedPages(allNums);
        }
      })
      .catch((err) => {
        console.warn('Thumbnails generation failed:', err);
        if (isMounted) {
          setThumbnailsLoading(false);
          if (fileInfo.pageCount) {
            const fallbackNums = Array.from({ length: fileInfo.pageCount }, (_, i) => i + 1);
            setSelectedPages(fallbackNums);
          }
        }
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
      alert('Failed to load demo file: ' + err.message);
    } finally {
      setSampleLoading(false);
    }
  };

  const togglePageSelection = (pageNum: number) => {
    if (convertAll) setConvertAll(false);
    setSelectedPages((prev) =>
      prev.includes(pageNum) ? prev.filter((p) => p !== pageNum) : [...prev, pageNum].sort((a, b) => a - b)
    );
  };

  const handleConvert = async () => {
    if (!fileInfo) return;

    const pagesToConvert = convertAll ? undefined : selectedPages;
    if (!convertAll && selectedPages.length === 0) {
      alert('Please select at least one page to convert.');
      return;
    }

    try {
      setProcessing({
        status: 'processing',
        progress: 20,
        stepMessage: 'Rendering PDF pages as high-resolution images...',
      });

      const res = await convertPdfToJpg(
        fileInfo.file,
        { ...options, selectedPages: pagesToConvert },
        (step, percent) => {
          setProcessing((p) => ({ ...p, stepMessage: step, progress: percent }));
        }
      );

      setResult(res);
      setProcessing({
        status: 'success',
        progress: 100,
        stepMessage: 'Conversion complete!',
      });
    } catch (err: any) {
      setProcessing({
        status: 'error',
        progress: 0,
        stepMessage: '',
        errorMessage: err.message || 'Failed to convert PDF to JPG.',
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
        id="pdf-to-jpg-back-btn"
        onClick={handleBackClick}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to all tools</span>
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 mb-3">
          <FileImage className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          PDF to JPG
        </h1>
        <p className="text-base font-medium text-slate-600 mt-1">
          Extract pages from your PDF into crisp, high-quality JPG or PNG images
        </p>
      </div>

      {/* Success View */}
      {result && processing.status === 'success' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Your images are ready!</h2>
            <p className="text-sm text-slate-600">
              {result.isZip
                ? 'All pages have been rendered and bundled into a ZIP archive.'
                : 'Your page has been rendered into a high-quality JPG.'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-sm mx-auto text-left text-xs text-slate-700 space-y-1">
            <div className="font-semibold text-slate-900 truncate">{result.filename}</div>
            <div className="text-slate-500">{formatBytes(result.fileSize)}</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="pdf-to-jpg-download-btn"
              onClick={() => triggerDownload(result.downloadUrl, result.filename)}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Download {result.isZip ? 'Images (ZIP)' : 'JPG Image'}</span>
            </button>

            <button
              onClick={resetAll}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Convert another PDF</span>
            </button>
          </div>
        </div>
      ) : !fileInfo ? (
        /* Upload Area */
        <DropZone
          onFilesSelected={handleFilesSelected}
          multiple={false}
          title="Drag & drop your PDF here"
          subtitle="Upload any PDF to extract its pages as images"
          buttonLabel="Choose PDF File"
          onDemoClick={handleLoadSample}
          demoLabel={sampleLoading ? 'Loading demo...' : 'Try Demo PDF'}
        />
      ) : (
        /* Configuration & Page Selection Area */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* File Selected Card */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-slate-900 truncate">{fileInfo.name}</p>
                <p className="text-xs text-slate-500">
                  {fileInfo.pageCount} pages • {formatBytes(fileInfo.size)}
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

          {/* Page Selection Mode */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Pages to Convert
              </label>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setConvertAll(true);
                    if (fileInfo.pageCount) {
                      setSelectedPages(Array.from({ length: fileInfo.pageCount }, (_, i) => i + 1));
                    }
                  }}
                  className={`font-semibold ${convertAll ? 'text-blue-600' : 'text-slate-500 hover:underline'}`}
                >
                  All Pages ({fileInfo.pageCount})
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setConvertAll(false);
                    setSelectedPages([]);
                  }}
                  className={`font-semibold ${!convertAll ? 'text-blue-600' : 'text-slate-500 hover:underline'}`}
                >
                  Custom Selection
                </button>
              </div>
            </div>

            {/* Thumbnails grid */}
            {thumbnailsLoading ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">Generating page previews...</p>
              </div>
            ) : thumbnails.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-64 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                {thumbnails.map((t) => {
                  const isSelected = convertAll || selectedPages.includes(t.pageNumber);
                  return (
                    <button
                      key={t.pageNumber}
                      type="button"
                      onClick={() => togglePageSelection(t.pageNumber)}
                      className={`relative rounded-lg overflow-hidden border-2 text-left transition-all group ${
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
                  const isSelected = convertAll || selectedPages.includes(p);
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
          </div>

          {/* Quality option */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Image Resolution</label>
              <select
                value={options.dpi}
                onChange={(e) => setOptions({ ...options, dpi: parseInt(e.target.value) as any })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value={150}>Medium (150 DPI) — Fast & Balanced</option>
                <option value={300}>High (300 DPI) — Print Quality</option>
                <option value={72}>Standard (72 DPI) — Web Display</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Image Format</label>
              <select
                value={options.format}
                onChange={(e) => setOptions({ ...options, format: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">JPG (Universal format)</option>
                <option value="png">PNG (Lossless graphic)</option>
              </select>
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
                <span>{processing.stepMessage || 'Converting pages to images...'}</span>
              </p>
            </div>
          ) : (
            /* Action Button */
            <button
              id="pdf-to-jpg-submit-btn"
              onClick={handleConvert}
              className="w-full py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileImage className="w-5 h-5" />
              <span>Convert to JPG</span>
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
