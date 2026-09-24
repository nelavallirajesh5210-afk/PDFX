import React, { useState, useEffect } from 'react';
import { DropZone } from './DropZone';
import { LoadingProgressIndicator } from './LoadingProgressIndicator';
import {
  formatBytes,
  getPdfInfo,
  deletePdfPages,
  triggerDownload,
  fetchSamplePdf,
  fetchPdfThumbnails,
} from '../services/api';
import { PdfFileInfo, ProcessingState, ProcessResult, PageThumbnail } from '../types/pdf';
import {
  Trash2,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader2,
  FileText,
} from 'lucide-react';

interface DeletePagesToolProps {
  onBack?: () => void;
  onNavigateToAllTools?: () => void;
}

export const DeletePagesTool: React.FC<DeletePagesToolProps> = ({
  onBack,
  onNavigateToAllTools,
}) => {
  const [fileInfo, setFileInfo] = useState<PdfFileInfo | null>(null);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [thumbnailsLoading, setThumbnailsLoading] = useState(false);
  const [pagesToDelete, setPagesToDelete] = useState<number[]>([]);

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
      setPagesToDelete([]);
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
      setPagesToDelete([]);
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

  const togglePageToDelete = (pageNumber: number) => {
    setPagesToDelete((prev) =>
      prev.includes(pageNumber)
        ? prev.filter((p) => p !== pageNumber)
        : [...prev, pageNumber]
    );
  };

  const handleDelete = async () => {
    if (!fileInfo || pagesToDelete.length === 0) return;

    setProcessing({
      status: 'processing',
      progress: 25,
      stepMessage: `Removing ${pagesToDelete.length} pages...`,
    });

    try {
      const res = await deletePdfPages(fileInfo.file, { pagesToDelete }, (step, percent) => {
        setProcessing((p) => ({ ...p, stepMessage: step, progress: percent }));
      });

      setResult(res);
      setProcessing({
        status: 'success',
        progress: 100,
        stepMessage: 'Pages deleted successfully!',
      });
    } catch (err: any) {
      setProcessing({
        status: 'error',
        progress: 0,
        errorMessage: err.message || 'Failed to delete pages.',
      });
    }
  };

  const resetAll = () => {
    setFileInfo(null);
    setThumbnails([]);
    setPagesToDelete([]);
    setResult(null);
    setProcessing({ status: 'idle', progress: 0, stepMessage: '' });
  };

  const handleBackClick = () => {
    if (onBack) onBack();
    else if (onNavigateToAllTools) onNavigateToAllTools();
    else window.location.hash = '';
  };

  const remainingPages = (fileInfo?.pageCount || 0) - pagesToDelete.length;

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
          <Trash2 className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Delete Pages</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Remove unwanted pages from your PDF.
          </p>
        </div>
      </div>

      {/* Workspace */}
      <div className="mt-8">
        {result && processing.status === 'success' ? (
          <div className="rounded-3xl border border-primary/15 bg-mist/80 p-8 text-center shadow-xs backdrop-blur-xl sm:p-12">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-primary shadow-xs">
              <Check className="h-7 w-7" />
            </span>
            <h2 className="mt-5 text-2xl font-bold text-foreground">Your PDF is ready</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Your finished file is ready to download.
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

            {/* Instruction & Status */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Click pages to mark them for deletion:
              </span>
              <span className="font-semibold text-foreground">
                {pagesToDelete.length} marked for removal ({remainingPages} will remain)
              </span>
            </div>

            {/* Page preview grid */}
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
                  const isMarked = pagesToDelete.includes(thumb.pageNumber);
                  return (
                    <button
                      key={thumb.pageNumber}
                      type="button"
                      onClick={() => togglePageToDelete(thumb.pageNumber)}
                      className={`relative rounded-xl border p-2.5 text-center flex flex-col items-center justify-between transition-all cursor-pointer ${
                        isMarked
                          ? 'border-destructive bg-destructive/10 ring-2 ring-destructive/30'
                          : 'border-line/5 bg-mist hover:border-primary/30'
                      }`}
                    >
                      <div className="h-28 w-full flex items-center justify-center overflow-hidden bg-background/50 rounded-lg p-1">
                        {thumb.dataUrl ? (
                          <img
                            src={thumb.dataUrl}
                            alt={`Page ${thumb.pageNumber}`}
                            className={`max-h-full max-w-full object-contain ${
                              isMarked ? 'opacity-40 grayscale' : ''
                            }`}
                          />
                        ) : (
                          <div
                            className={`h-20 w-14 border border-line/10 bg-background rounded flex items-center justify-center text-xs font-semibold ${
                              isMarked ? 'opacity-40 line-through' : ''
                            }`}
                          >
                            P.{thumb.pageNumber}
                          </div>
                        )}
                      </div>

                      <div className="mt-2 w-full flex items-center justify-between text-xs">
                        <span
                          className={`font-semibold ${
                            isMarked
                              ? 'text-destructive line-through'
                              : 'text-foreground'
                          }`}
                        >
                          Page {thumb.pageNumber}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isMarked
                              ? 'bg-destructive text-destructive-foreground'
                              : 'bg-primary-soft text-primary'
                          }`}
                        >
                          {isMarked ? 'Delete' : 'Keep'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* In-Flight Processing */}
            {processing.status === 'processing' ? (
              <div className="py-2">
                <LoadingProgressIndicator
                  toolType="delete-pages"
                  title="Deleting PDF Pages"
                  stepMessage={processing.stepMessage}
                  progress={processing.progress}
                  fileName={fileInfo.name}
                  fileSize={fileInfo.size}
                  onCancel={resetAll}
                />
              </div>
            ) : (
              <button
                onClick={handleDelete}
                disabled={pagesToDelete.length === 0 || remainingPages <= 0}
                className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {pagesToDelete.length === 0
                  ? 'Select pages to delete'
                  : remainingPages <= 0
                  ? 'Cannot delete all pages'
                  : `Delete ${pagesToDelete.length} ${
                      pagesToDelete.length === 1 ? 'Page' : 'Pages'
                    }`}
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
