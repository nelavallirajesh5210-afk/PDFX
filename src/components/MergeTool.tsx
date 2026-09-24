import React, { useState } from 'react';
import { DropZone } from './DropZone';
import { LoadingProgressIndicator } from './LoadingProgressIndicator';
import {
  formatBytes,
  getPdfInfo,
  mergePdfs,
  triggerDownload,
  fetchSamplePdf,
} from '../services/api';
import { addRecentFile } from '../services/recentFilesService';
import {
  PdfFileInfo,
  ProcessResult,
  ProcessingState,
} from '../types/pdf';
import {
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Trash2,
  Check,
  AlertCircle,
  FileText,
  Loader2,
  Plus,
  Combine,
} from 'lucide-react';

interface MergeToolProps {
  onBack?: () => void;
  onNavigateToAllTools?: () => void;
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
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, status: 'ready' } : f
          )
        );
      }
    }
  };

  const handleLoadSamples = async () => {
    setSampleLoading(true);
    try {
      const f1 = await fetchSamplePdf('merge-1');
      const f2 = await fetchSamplePdf('merge-2');
      await handleFilesSelected([f1, f2]);
    } catch {
      // fallback mock
    } finally {
      setSampleLoading(false);
    }
  };

  const removeItem = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    setFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const handleMerge = async () => {
    if (files.length < 2) return;

    setProcessing({
      status: 'processing',
      progress: 25,
      stepMessage: 'Reading PDF documents...',
    });

    try {
      const rawFiles = files.map((f) => f.file);
      setProcessing({
        status: 'processing',
        progress: 35,
        stepMessage: 'Merging PDF pages and bookmarks...',
      });

      const res = await mergePdfs(rawFiles, (step, percent) => {
        setProcessing((p) => ({
          ...p,
          stepMessage: step,
          progress: Math.max(p.progress, percent),
        }));
      });

      setProcessing({
        status: 'success',
        progress: 100,
        stepMessage: 'Merged successfully!',
      });
      setResult(res);
      addRecentFile({
        toolType: 'merge',
        toolName: 'Merge PDF',
        fileName: res.filename,
        originalName: files.map((f) => f.name).join(', '),
        fileSize: res.fileSize,
        pageCount: res.pageCount,
        downloadUrl: res.downloadUrl,
      });
    } catch (err: any) {
      setProcessing({
        status: 'error',
        progress: 0,
        errorMessage: err.message || 'Failed to merge PDFs',
      });
    }
  };

  const resetAll = () => {
    setFiles([]);
    setResult(null);
    setProcessing({ status: 'idle', progress: 0, stepMessage: '' });
  };

  return (
    <main className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> All tools
        </button>
      )}

      {/* Tool Header */}
      <div className="mt-7 flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary shadow-xs">
          <Combine className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Merge PDF</h1>
          <p className="mt-1 text-base text-muted-foreground">
            Combine multiple PDFs into one.
          </p>
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
        ) : (
          <div className="rounded-3xl border border-line/5 bg-mist/75 p-4 shadow-xs ring-1 ring-line/5 backdrop-blur-xl sm:p-7">
            <DropZone
              onFilesSelected={handleFilesSelected}
              multiple={true}
              title="Drop your PDF files here"
              subtitle="PDF files only"
              buttonLabel="Choose PDF files"
              onDemoClick={handleLoadSamples}
              demoLabel={sampleLoading ? 'Loading demo...' : 'or try a sample PDF'}
              isProcessing={processing.status === 'processing'}
            />

            {files.length > 0 && (
              <div className="mt-4 space-y-2.5">
                {files.map((item, index) => (
                  <div
                    key={item.id}
                    className="animate-[drop_.25s_ease-out_both] grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-line/5 bg-mist p-3"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                      <FileText className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{formatBytes(item.size)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        className="h-8 w-8 grid place-items-center rounded-md hover:bg-accent text-foreground/75 disabled:opacity-30"
                        aria-label={`Move ${item.name} up`}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === files.length - 1}
                        className="h-8 w-8 grid place-items-center rounded-md hover:bg-accent text-foreground/75 disabled:opacity-30"
                        aria-label={`Move ${item.name} down`}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="h-8 w-8 grid place-items-center rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                        aria-label={`Remove ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {processing.status === 'processing' ? (
                  <div className="py-2">
                    <LoadingProgressIndicator
                      toolType="merge"
                      title="Merging PDF Documents"
                      stepMessage={processing.stepMessage}
                      progress={processing.progress}
                      fileCount={files.length}
                      fileSize={files.reduce((acc, f) => acc + f.size, 0)}
                      onCancel={resetAll}
                    />
                  </div>
                ) : (
                  <>
                    {processing.errorMessage && (
                      <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-xl flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{processing.errorMessage}</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                      <label className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-primary-soft px-4 py-2 text-sm font-medium text-primary hover:bg-primary-soft/70 cursor-pointer w-fit">
                        <Plus className="h-4 w-4" /> Add more files
                        <input
                          type="file"
                          multiple
                          accept="application/pdf,.pdf"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                            e.target.value = '';
                          }}
                        />
                      </label>

                      <button
                        onClick={handleMerge}
                        disabled={files.length < 2}
                        className="inline-flex h-12 w-full sm:w-auto items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        Merge PDF
                      </button>
                    </div>
                  </>
                )}
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
