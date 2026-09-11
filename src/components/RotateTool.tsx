import React, { useState, useEffect } from 'react';
import { DropZone } from './DropZone';
import {
  formatBytes,
  getPdfInfo,
  rotatePdfPages,
  triggerDownload,
  fetchSamplePdf,
  fetchPdfThumbnails,
} from '../services/api';
import { PdfFileInfo, ProcessingState, ProcessResult, PageThumbnail } from '../types/pdf';
import {
  RotateCw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Loader2,
  FileText,
  Trash2,
} from 'lucide-react';

interface RotateToolProps {
  onBack?: () => void;
  onNavigateToAllTools?: () => void;
}

export const RotateTool: React.FC<RotateToolProps> = ({ onBack, onNavigateToAllTools }) => {
  const [fileInfo, setFileInfo] = useState<PdfFileInfo | null>(null);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [thumbnailsLoading, setThumbnailsLoading] = useState(false);
  const [rotations, setRotations] = useState<Record<number, number>>({});

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
      setRotations({});
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
      setRotations({});
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

  const rotateSinglePage = (page: number, direction: 'cw' | 'ccw') => {
    setRotations((prev) => {
      const current = prev[page] || 0;
      const change = direction === 'cw' ? 90 : -90;
      const next = (current + change + 360) % 360;
      return { ...prev, [page]: next };
    });
  };

  const rotateAllPages = (direction: 'cw' | 'ccw') => {
    if (!fileInfo?.pageCount) return;
    setRotations((prev) => {
      const nextMap: Record<number, number> = {};
      const count = fileInfo.pageCount || 1;
      const change = direction === 'cw' ? 90 : -90;
      for (let p = 1; p <= count; p++) {
        const cur = prev[p] || 0;
        nextMap[p] = (cur + change + 360) % 360;
      }
      return nextMap;
    });
  };

  const handleSaveRotations = async () => {
    if (!fileInfo) return;

    try {
      setProcessing({
        status: 'processing',
        progress: 25,
        stepMessage: 'Applying rotation coordinates...',
      });

      const res = await rotatePdfPages(fileInfo.file, rotations, (step, percent) => {
        setProcessing((p) => ({ ...p, stepMessage: step, progress: percent }));
      });

      setResult(res);
      setProcessing({
        status: 'success',
        progress: 100,
        stepMessage: 'Rotation complete!',
      });
    } catch (err: any) {
      setProcessing({
        status: 'error',
        progress: 0,
        stepMessage: '',
        errorMessage: err.message || 'Failed to rotate pages.',
      });
    }
  };

  const resetAll = () => {
    setFileInfo(null);
    setThumbnails([]);
    setRotations({});
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
        id="rotate-back-btn"
        onClick={handleBackClick}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to all tools</span>
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mb-3">
          <RotateCw className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Rotate PDF
        </h1>
        <p className="text-base font-medium text-slate-600 mt-1">
          Rotate individual pages or your entire document permanently
        </p>
      </div>

      {/* Success View */}
      {result && processing.status === 'success' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Your PDF is rotated!</h2>
            <p className="text-sm text-slate-600">
              Rotations have been permanently applied to the document.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-sm mx-auto text-left text-xs text-slate-700 space-y-1">
            <div className="font-semibold text-slate-900 truncate">{result.filename}</div>
            <div className="text-slate-500">{formatBytes(result.fileSize)}</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="rotate-download-btn"
              onClick={() => triggerDownload(result.downloadUrl, result.filename)}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Download Rotated PDF</span>
            </button>

            <button
              onClick={resetAll}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rotate another PDF</span>
            </button>
          </div>
        </div>
      ) : !fileInfo ? (
        /* Upload Area */
        <DropZone
          onFilesSelected={handleFilesSelected}
          multiple={false}
          title="Drag & drop your PDF here"
          subtitle="Select any PDF to adjust page orientations"
          buttonLabel="Choose PDF File"
          onDemoClick={handleLoadSample}
          demoLabel={sampleLoading ? 'Loading demo...' : 'Try Demo PDF'}
        />
      ) : (
        /* Configuration & Rotate Area */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* File Selected Card */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
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

          {/* Quick Rotate All Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700">Rotate all pages at once:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => rotateAllPages('ccw')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>90° Left</span>
              </button>
              <button
                type="button"
                onClick={() => rotateAllPages('cw')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>90° Right</span>
              </button>
            </div>
          </div>

          {/* Page Preview Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Or click rotate on individual pages:</span>
              {Object.values(rotations).some((r) => r !== 0) && (
                <button
                  type="button"
                  onClick={() => setRotations({})}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Reset all rotations
                </button>
              )}
            </div>

            {thumbnailsLoading ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-xs font-medium text-slate-600">Loading page previews...</p>
              </div>
            ) : thumbnails.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-72 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                {thumbnails.map((t) => {
                  const deg = rotations[t.pageNumber] || 0;
                  return (
                    <div
                      key={t.pageNumber}
                      className="bg-white rounded-xl border border-slate-200 p-2 flex flex-col items-center justify-between text-center"
                    >
                      <div className="w-full aspect-[3/4] bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center p-1 mb-2">
                        <img
                          src={t.dataUrl}
                          alt={`Page ${t.pageNumber}`}
                          className="max-h-full max-w-full object-contain transition-transform duration-200"
                          style={{ transform: `rotate(${deg}deg)` }}
                        />
                      </div>

                      <div className="flex items-center justify-between w-full px-1">
                        <span className="text-[11px] font-bold text-slate-700">
                          P.{t.pageNumber} {deg > 0 ? `(${deg}°)` : ''}
                        </span>

                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => rotateSinglePage(t.pageNumber, 'cw')}
                            className="p-1 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors"
                            title="Rotate 90° clockwise"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                {Array.from({ length: fileInfo.pageCount || 1 }, (_, i) => i + 1).map((p) => {
                  const deg = rotations[p] || 0;
                  return (
                    <div
                      key={p}
                      className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-slate-700">Page {p}</span>
                      <button
                        type="button"
                        onClick={() => rotateSinglePage(p, 'cw')}
                        className="p-1 text-slate-600 hover:text-blue-600 rounded"
                        title="Rotate clockwise"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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
                <span>{processing.stepMessage || 'Applying rotations...'}</span>
              </p>
            </div>
          ) : (
            /* Action Button */
            <button
              id="rotate-submit-btn"
              onClick={handleSaveRotations}
              className="w-full py-4 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCw className="w-5 h-5" />
              <span>Save Rotations</span>
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
