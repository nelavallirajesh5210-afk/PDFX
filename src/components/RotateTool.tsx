import React, { useState, useEffect } from 'react';
import { DropZone } from './DropZone';
import { LoadingProgressIndicator } from './LoadingProgressIndicator';
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
  Check,
  AlertCircle,
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
      .catch(() => {
        if (isMounted) setThumbnailsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fileInfo]);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setResult(null);

    try {
      const info = await getPdfInfo(f);
      setFileInfo({
        id: `pdf-${Date.now()}`,
        file: f,
        name: f.name,
        size: f.size,
        pageCount: info.pageCount,
        status: 'ready',
      });
      setRotations({});
    } catch (err: any) {
      setProcessing({
        status: 'error',
        progress: 0,
        errorMessage: err.message || 'Failed to read PDF document.',
      });
    }
  };

  const handleLoadSample = async () => {
    try {
      setSampleLoading(true);
      const sample = await fetchSamplePdf('multipage');
      await handleFilesSelected([sample]);
    } catch {
      // fallback
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
    if (!fileInfo) return;
    const total = fileInfo.pageCount || thumbnails.length || 1;
    const change = direction === 'cw' ? 90 : -90;
    setRotations((prev) => {
      const updated: Record<number, number> = {};
      for (let i = 1; i <= total; i++) {
        const curr = prev[i] || 0;
        updated[i] = (curr + change + 360) % 360;
      }
      return updated;
    });
  };

  const handleApplyRotation = async () => {
    if (!fileInfo) return;

    setProcessing({
      status: 'processing',
      progress: 25,
      stepMessage: 'Applying rotation parameters...',
    });

    try {
      const activeRotations: Record<number, number> = {};
      Object.entries(rotations).forEach(([page, angle]) => {
        const deg = Number(angle);
        if (deg % 360 !== 0) {
          activeRotations[Number(page)] = deg % 360;
        }
      });

      const res = await rotatePdfPages(fileInfo.file, { pageRotations: activeRotations }, (step, percent) => {
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
    <main className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      {/* Back button */}
      <button
        onClick={handleBackClick}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> All tools
      </button>

      {/* Header */}
      <div className="mt-7 flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary shadow-xs">
          <RotateCw className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Rotate PDF</h1>
          <p className="mt-1 text-base text-muted-foreground">Rotate PDF pages 90°, 180°, or 270°.</p>
        </div>
      </div>

      {/* Workspace Area */}
      <div className="mt-8">
        {result && processing.status === 'success' ? (
          <div className="rounded-3xl border border-primary/15 bg-mist/80 p-8 text-center shadow-xs backdrop-blur-xl sm:p-12">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary shadow-xs">
              <Check className="h-7 w-7" />
            </span>
            <h2 className="mt-5 text-2xl font-bold text-foreground">Your PDF is ready</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Rotations have been permanently applied to your document.
            </p>

            <div className="mt-4 p-3 bg-mist/70 rounded-xl border border-line/5 max-w-sm mx-auto text-xs text-muted-foreground">
              <p className="font-semibold text-foreground truncate">{result.filename}</p>
              <p>{formatBytes(result.fileSize)}</p>
            </div>

            <button
              onClick={() => triggerDownload(result.downloadUrl, result.filename)}
              className="mt-6 inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Download PDF
            </button>
            <button
              onClick={resetAll}
              className="mt-5 block w-full text-sm font-semibold text-primary hover:underline cursor-pointer"
            >
              Process another PDF
            </button>
          </div>
        ) : !fileInfo ? (
          <div className="rounded-3xl border border-line/5 bg-mist/75 p-4 shadow-xs ring-1 ring-line/5 backdrop-blur-xl sm:p-7">
            <DropZone
              onFilesSelected={handleFilesSelected}
              multiple={false}
              title="Drop your PDF files here"
              subtitle="PDF files only"
              buttonLabel="Choose PDF files"
              onDemoClick={handleLoadSample}
              demoLabel={sampleLoading ? 'Loading demo...' : 'or try a sample PDF'}
              isProcessing={processing.status === 'processing'}
            />
          </div>
        ) : (
          <div className="rounded-3xl border border-line/5 bg-mist/75 p-6 shadow-xs ring-1 ring-line/5 backdrop-blur-xl space-y-6">
            {/* File info card */}
            <div className="flex items-center justify-between p-3.5 bg-mist rounded-xl border border-line/5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{fileInfo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fileInfo.pageCount} pages • {formatBytes(fileInfo.size)}
                  </p>
                </div>
              </div>

              <button
                onClick={resetAll}
                className="h-8 w-8 grid place-items-center rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive cursor-pointer"
                title="Remove file"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Rotate All Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-mist rounded-xl border border-line/5">
              <span className="text-xs font-semibold text-foreground">Rotate all pages:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => rotateAllPages('ccw')}
                  className="px-3 py-1.5 text-xs font-semibold text-foreground bg-mist hover:bg-primary-soft/50 rounded-lg border border-line/5 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>90° Left</span>
                </button>
                <button
                  type="button"
                  onClick={() => rotateAllPages('cw')}
                  className="px-3 py-1.5 text-xs font-semibold text-foreground bg-mist hover:bg-primary-soft/50 rounded-lg border border-line/5 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>90° Right</span>
                </button>
              </div>
            </div>

            {/* Page preview grid */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Individual pages:</span>
                {Object.values(rotations).some((r) => r !== 0) && (
                  <button
                    type="button"
                    onClick={() => setRotations({})}
                    className="text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Reset all rotations
                  </button>
                )}
              </div>

              {thumbnailsLoading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                  <p className="text-xs text-muted-foreground mt-2">Loading page previews...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-1">
                  {(thumbnails.length > 0
                    ? thumbnails
                    : Array.from({ length: fileInfo.pageCount || 1 }, (_, i) => ({
                        pageNumber: i + 1,
                        dataUrl: '',
                        width: 100,
                        height: 140,
                      }))
                  ).map((thumb) => {
                    const angle = rotations[thumb.pageNumber] || 0;
                    return (
                      <div
                        key={thumb.pageNumber}
                        className="rounded-xl border border-line/5 bg-mist p-2.5 text-center flex flex-col items-center justify-between"
                      >
                        <div className="h-28 w-full flex items-center justify-center overflow-hidden bg-background/50 rounded-lg p-1">
                          {thumb.dataUrl ? (
                            <img
                              src={thumb.dataUrl}
                              alt={`Page ${thumb.pageNumber}`}
                              className="max-h-full max-w-full object-contain transition-transform duration-200"
                              style={{ transform: `rotate(${angle}deg)` }}
                            />
                          ) : (
                            <div
                              className="h-20 w-14 border border-line/10 bg-background rounded flex items-center justify-center text-xs text-muted-foreground font-semibold transition-transform duration-200"
                              style={{ transform: `rotate(${angle}deg)` }}
                            >
                              P.{thumb.pageNumber}
                            </div>
                          )}
                        </div>

                        <div className="mt-2 w-full flex items-center justify-between">
                          <span className="text-xs font-semibold text-muted-foreground">
                            Page {thumb.pageNumber}
                            {angle !== 0 && (
                              <span className="ml-1 text-primary font-bold">+{angle}°</span>
                            )}
                          </span>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => rotateSinglePage(thumb.pageNumber, 'cw')}
                              className="h-6 w-6 grid place-items-center rounded bg-primary-soft text-primary hover:bg-primary-soft/80 cursor-pointer"
                              title="Rotate 90° Clockwise"
                            >
                              <RotateCw className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* In-Flight Processing */}
            {processing.status === 'processing' ? (
              <div className="py-2">
                <LoadingProgressIndicator
                  toolType="rotate"
                  title="Rotating PDF Pages"
                  stepMessage={processing.stepMessage}
                  progress={processing.progress}
                  fileName={fileInfo.name}
                  fileSize={fileInfo.size}
                  onCancel={resetAll}
                />
              </div>
            ) : (
              <button
                onClick={handleApplyRotation}
                className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Apply Rotations & Download
              </button>
            )}

            {processing.errorMessage && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{processing.errorMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Fast in-memory processing. Files are automatically removed after completion.
      </p>
    </main>
  );
};
