import React, { useState } from 'react';
import { DropZone } from './DropZone';
import { LoadingProgressIndicator } from './LoadingProgressIndicator';
import {
  formatBytes,
  getPdfInfo,
  splitPdf,
  triggerDownload,
  fetchSamplePdf,
} from '../services/api';
import { addRecentFile } from '../services/recentFilesService';
import {
  ProcessResult,
  ProcessingState,
  SplitMode,
} from '../types/pdf';
import {
  Scissors,
  ArrowLeft,
  Check,
  AlertCircle,
  FileText,
  Loader2,
  Trash2,
} from 'lucide-react';

interface SplitToolProps {
  onBack?: () => void;
  onNavigateToAllTools?: () => void;
}

export const SplitTool: React.FC<SplitToolProps> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
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

    try {
      const info = await getPdfInfo(selectedFile);
      setTotalPages(info.pageCount);
      setRanges(`1-${Math.min(3, info.pageCount)}`);
      setSelectedPages(Array.from({ length: Math.min(3, info.pageCount) }, (_, i) => i + 1));
    } catch {
      setTotalPages(1);
    }
  };

  const handleLoadSample = async () => {
    setSampleLoading(true);
    try {
      const sample = await fetchSamplePdf('multipage');
      await handleFileSelected([sample]);
    } catch {
      // fallback
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

  const handleSplit = async () => {
    if (!file) return;

    setProcessing({
      status: 'processing',
      progress: 30,
      stepMessage: 'Parsing page ranges...',
    });

    try {
      const res = await splitPdf(
        file,
        mode,
        {
          ranges: mode === 'range' ? ranges : undefined,
          selectedPages: mode === 'visual' ? selectedPages : undefined,
          mergeOutput,
        },
        (step, percent) => {
          setProcessing((p) => ({ ...p, stepMessage: step, progress: percent }));
        }
      );

      setResult(res);
      addRecentFile({
        toolType: 'split',
        toolName: 'Split PDF',
        fileName: res.filename,
        originalName: file.name,
        fileSize: res.fileSize,
        pageCount: res.pageCount,
        isZip: res.isZip,
        downloadUrl: res.downloadUrl,
      });
      setProcessing({
        status: 'success',
        progress: 100,
        stepMessage: 'Split completed successfully!',
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

      {/* Header */}
      <div className="mt-7 flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary shadow-xs">
          <Scissors className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Split PDF</h1>
          <p className="mt-1 text-base text-muted-foreground">Separate PDF pages.</p>
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
        ) : !file ? (
          <div className="rounded-3xl border border-line/5 bg-mist/75 p-4 shadow-xs ring-1 ring-line/5 backdrop-blur-xl sm:p-7">
            <DropZone
              onFilesSelected={handleFileSelected}
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
            {/* File info */}
            <div className="flex items-center justify-between p-3.5 bg-mist rounded-xl border border-line/5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} • {totalPages} {totalPages === 1 ? 'page' : 'pages'}
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

            {/* Mode selector */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-mist rounded-xl border border-line/5">
              <button
                type="button"
                onClick={() => setMode('range')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'range'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Page Range
              </button>
              <button
                type="button"
                onClick={() => setMode('visual')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'visual'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Pick Pages
              </button>
              <button
                type="button"
                onClick={() => setMode('all')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  mode === 'all'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Extract All
              </button>
            </div>

            {/* Range input */}
            {mode === 'range' && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Page Ranges (e.g. 1-3, 5)
                </label>
                <input
                  type="text"
                  value={ranges}
                  onChange={(e) => setRanges(e.target.value)}
                  placeholder={`1-${totalPages}`}
                  className="h-11 w-full rounded-md border border-input bg-mist px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground py-1">Quick:</span>
                  <button
                    type="button"
                    onClick={() => setRanges('1')}
                    className="px-2.5 py-1 bg-mist hover:bg-primary-soft/50 rounded-md border border-line/5 font-medium cursor-pointer"
                  >
                    First Page
                  </button>
                  <button
                    type="button"
                    onClick={() => setRanges(`1-${Math.ceil(totalPages / 2)}`)}
                    className="px-2.5 py-1 bg-mist hover:bg-primary-soft/50 rounded-md border border-line/5 font-medium cursor-pointer"
                  >
                    First Half
                  </button>
                  <button
                    type="button"
                    onClick={() => setRanges(`1-${totalPages}`)}
                    className="px-2.5 py-1 bg-mist hover:bg-primary-soft/50 rounded-md border border-line/5 font-medium cursor-pointer"
                  >
                    All ({totalPages})
                  </button>
                </div>
              </div>
            )}

            {/* Pick pages */}
            {mode === 'visual' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Selected {selectedPages.length} of {totalPages} pages</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPages(
                        selectedPages.length === totalPages
                          ? []
                          : Array.from({ length: totalPages }, (_, i) => i + 1)
                      )
                    }
                    className="text-primary font-semibold hover:underline cursor-pointer"
                  >
                    {selectedPages.length === totalPages ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                    const isSel = selectedPages.includes(pg);
                    return (
                      <button
                        key={pg}
                        type="button"
                        onClick={() =>
                          setSelectedPages((prev) =>
                            prev.includes(pg) ? prev.filter((p) => p !== pg) : [...prev, pg]
                          )
                        }
                        className={`h-11 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSel
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'bg-mist border border-line/5 text-foreground hover:bg-primary-soft/40'
                        }`}
                      >
                        {pg}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Merge option */}
            <label className="flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={mergeOutput}
                onChange={(e) => setMergeOutput(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              <span>Merge extracted pages into a single PDF document</span>
            </label>

            {/* Processing / Button */}
            {processing.status === 'processing' ? (
              <div className="py-2">
                <LoadingProgressIndicator
                  toolType="split"
                  title="Splitting PDF Document"
                  stepMessage={processing.stepMessage}
                  progress={processing.progress}
                  fileName={file.name}
                  fileSize={file.size}
                  onCancel={resetAll}
                />
              </div>
            ) : (
              <button
                onClick={handleSplit}
                className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Split PDF
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
