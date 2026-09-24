import React, { useState } from 'react';
import { DropZone } from './DropZone';
import { LoadingProgressIndicator } from './LoadingProgressIndicator';
import {
  compressPdf,
  formatBytes,
  getPdfInfo,
  triggerDownload,
  fetchSamplePdf,
} from '../services/api';
import { addRecentFile } from '../services/recentFilesService';
import {
  CompressionLevel,
  ProcessResult,
  ProcessingState,
} from '../types/pdf';
import {
  FileArchive,
  ArrowLeft,
  Check,
  AlertCircle,
  FileText,
  Loader2,
  Trash2,
  Zap,
  Shield,
  Gauge,
} from 'lucide-react';

interface CompressToolProps {
  onBack?: () => void;
  onNavigateToAllTools?: () => void;
}

export const CompressTool: React.FC<CompressToolProps> = ({
  onBack,
  onNavigateToAllTools,
}) => {
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

  const handleSelectFile = async (f: File) => {
    setFile(f);
    setResult(null);
    setProcessing({ status: 'idle', progress: 0, stepMessage: '' });

    try {
      const info = await getPdfInfo(f);
      setPageCount(info.pageCount);
    } catch {
      setPageCount(null);
    }
  };

  const handleLoadSample = async () => {
    setSampleLoading(true);
    try {
      const sample = await fetchSamplePdf('compress');
      await handleSelectFile(sample);
    } catch {
      // fallback
    } finally {
      setSampleLoading(false);
    }
  };

  const resetAll = () => {
    setFile(null);
    setPageCount(null);
    setResult(null);
    setProcessing({ status: 'idle', progress: 0, stepMessage: '' });
  };

  const handleCompress = async () => {
    if (!file) return;

    setProcessing({
      status: 'processing',
      progress: 20,
      stepMessage: 'Analyzing document structure...',
    });

    try {
      const res = await compressPdf(file, level, (step, percent) => {
        setProcessing((p) => ({
          ...p,
          stepMessage: step,
          progress: Math.max(p.progress, percent),
        }));
      });

      setResult(res);
      addRecentFile({
        toolType: 'compress',
        toolName: 'Compress PDF',
        fileName: res.filename,
        originalName: file.name,
        fileSize: res.fileSize,
        originalSize: res.originalSize,
        pageCount: res.pageCount,
        savingsPercent: res.savingsPercent,
        downloadUrl: res.downloadUrl,
      });
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
    <main className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      {/* Back button */}
      <button
        onClick={handleBackClick}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" /> All tools
      </button>

      {/* Tool Header */}
      <div className="mt-7 flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary shadow-xs">
          <FileArchive className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Compress PDF</h1>
          <p className="mt-1 text-base text-muted-foreground">Reduce PDF file size.</p>
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
              {result.savingsPercent && result.savingsPercent > 0
                ? `Reduced file size by ${result.savingsPercent}% (saved ${formatBytes(result.savingsBytes || 0)}).`
                : 'Your optimized file is ready to download.'}
            </p>

            {/* Stats */}
            <div className="mt-6 grid grid-cols-2 gap-3 max-w-md mx-auto">
              <div className="rounded-xl border border-line/5 bg-mist p-3.5 text-center">
                <span className="text-xs text-muted-foreground">Original</span>
                <p className="text-base font-bold text-foreground">
                  {formatBytes(result.originalSize || file?.size || 0)}
                </p>
              </div>
              <div className="rounded-xl border border-line/5 bg-mist p-3.5 text-center">
                <span className="text-xs text-primary font-semibold">Compressed</span>
                <p className="text-base font-bold text-primary">
                  {formatBytes(result.fileSize)}
                </p>
              </div>
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
              onFilesSelected={(files) => files.length > 0 && handleSelectFile(files[0])}
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
            {/* Selected File Card */}
            <div className="flex items-center justify-between p-3.5 bg-mist rounded-xl border border-line/5">
              <div className="flex items-center gap-3 min-w-0">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)}
                    {pageCount ? ` • ${pageCount} pages` : ''}
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

            {/* Compression Level Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Compression Level
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setLevel('basic')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    level === 'basic'
                      ? 'border-primary bg-primary-soft/30 ring-1 ring-primary'
                      : 'border-line/5 bg-mist hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-muted-foreground" /> Basic
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground bg-mist/80 px-1.5 py-0.5 rounded">
                      Lossless
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fast optimization with pristine image quality.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setLevel('recommended')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    level === 'recommended'
                      ? 'border-primary bg-primary-soft/30 ring-1 ring-primary'
                      : 'border-line/5 bg-mist hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Gauge className="h-4 w-4 text-primary" /> Recommended
                    </span>
                    <span className="text-[10px] font-bold text-primary bg-primary-soft px-1.5 py-0.5 rounded">
                      Best Balance
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Substantial size reduction with clear readability.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setLevel('maximum')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    level === 'maximum'
                      ? 'border-primary bg-primary-soft/30 ring-1 ring-primary'
                      : 'border-line/5 bg-mist hover:border-primary/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-amber-500" /> Maximum
                    </span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      Smallest
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Smallest size for strict upload limits.
                  </p>
                </button>
              </div>
            </div>

            {/* In-Flight Processing */}
            {processing.status === 'processing' ? (
              <div className="py-2">
                <LoadingProgressIndicator
                  toolType="compress"
                  title="Compressing PDF File"
                  stepMessage={processing.stepMessage}
                  progress={processing.progress}
                  fileName={file.name}
                  fileSize={file.size}
                  onCancel={resetAll}
                />
              </div>
            ) : (
              <button
                onClick={handleCompress}
                className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer"
              >
                Compress PDF
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
