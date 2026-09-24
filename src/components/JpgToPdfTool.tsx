import React, { useState } from 'react';
import { DropZone } from './DropZone';
import { LoadingProgressIndicator } from './LoadingProgressIndicator';
import { formatBytes, convertJpgToPdf, triggerDownload, fetchSamplePdf } from '../services/api';
import { addRecentFile } from '../services/recentFilesService';
import { ImageItem, JpgToPdfOptions, ProcessingState, ProcessResult } from '../types/pdf';
import {
  Image,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Loader2,
  FileText,
} from 'lucide-react';

interface JpgToPdfToolProps {
  onBack?: () => void;
  onNavigateToAllTools?: () => void;
}

export const JpgToPdfTool: React.FC<JpgToPdfToolProps> = ({ onBack, onNavigateToAllTools }) => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [options, setOptions] = useState<JpgToPdfOptions>({
    pageSize: 'fit',
    orientation: 'auto',
    margin: 0,
  });

  const [processing, setProcessing] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    stepMessage: '',
  });
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [sampleLoading, setSampleLoading] = useState(false);

  const handleFilesSelected = (files: File[]) => {
    const newItems: ImageItem[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      previewUrl: URL.createObjectURL(file),
      rotation: 0,
    }));
    setImages((prev) => [...prev, ...newItems]);
    setResult(null);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    setImages((prev) => {
      const next = [...prev];
      const temp = next[index];
      next[index] = next[targetIndex];
      next[targetIndex] = temp;
      return next;
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const clearAll = () => {
    images.forEach((img) => {
      if (img.previewUrl) URL.revokeObjectURL(img.previewUrl);
    });
    setImages([]);
    setResult(null);
    setProcessing({ status: 'idle', progress: 0, stepMessage: '' });
  };

  const handleConvert = async () => {
    if (images.length === 0) return;

    try {
      setProcessing({
        status: 'processing',
        progress: 20,
        stepMessage: 'Optimizing and compiling images into PDF...',
      });

      const res = await convertJpgToPdf(
        images.map((img) => img.file),
        options,
        (step, percent) => {
          setProcessing((p) => ({ ...p, stepMessage: step, progress: percent }));
        }
      );

      setResult(res);
      addRecentFile({
        toolType: 'jpg-to-pdf',
        toolName: 'JPG to PDF',
        fileName: res.filename,
        originalName: images.map((i) => i.name).join(', '),
        fileSize: res.fileSize,
        pageCount: res.pageCount,
        downloadUrl: res.downloadUrl,
      });
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
        errorMessage: err.message || 'An error occurred during image conversion.',
      });
    }
  };

  const handleBackClick = () => {
    if (onBack) onBack();
    else if (onNavigateToAllTools) onNavigateToAllTools();
    else window.location.hash = '';
  };

  const totalImageSize = images.reduce((acc, img) => acc + img.size, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Back button */}
      <button
        id="jpg-to-pdf-back-btn"
        onClick={handleBackClick}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to all tools</span>
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 mb-3">
          <Image className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          JPG to PDF
        </h1>
        <p className="text-base font-medium text-slate-600 mt-1">
          Convert JPG, PNG, and WebP images into a single clean PDF document
        </p>
      </div>

      {/* Success View */}
      {result && processing.status === 'success' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Your PDF is ready!</h2>
            <p className="text-sm text-slate-600">
              Successfully converted {images.length} images into a unified PDF ({result.pageCount} pages).
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-sm mx-auto text-left text-xs text-slate-700 space-y-1">
            <div className="font-semibold text-slate-900 truncate">{result.filename}</div>
            <div className="text-slate-500">{formatBytes(result.fileSize)}</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="jpg-to-pdf-download-btn"
              onClick={() => triggerDownload(result.downloadUrl, result.filename)}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={clearAll}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Convert more images</span>
            </button>
          </div>
        </div>
      ) : images.length === 0 ? (
        /* Upload Area */
        <DropZone
          onFilesSelected={handleFilesSelected}
          multiple={true}
          acceptType="image"
          title="Drag & drop your images here"
          subtitle="Supports JPG, PNG, and WebP files up to 50MB"
          buttonLabel="Choose Image Files"
        />
      ) : (
        /* Images Selected Area */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Selected Images ({images.length})
              </h2>
              <p className="text-xs text-slate-500">
                {formatBytes(totalImageSize)} total
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label
                htmlFor="jpg-add-more-input"
                className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add More</span>
              </label>
              <input
                id="jpg-add-more-input"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                }}
              />
            </div>
          </div>

          {/* Image Cards List */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((item, index) => (
              <div
                key={item.id}
                className="relative group rounded-xl border border-slate-200 bg-slate-50 p-2 overflow-hidden flex flex-col justify-between"
              >
                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center relative mb-2">
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">
                    {index + 1}
                  </span>
                </div>

                <div className="truncate text-xs font-medium text-slate-800 mb-2 truncate">
                  {item.name}
                </div>

                <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => moveImage(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                      title="Move left/up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveImage(index, 'down')}
                      disabled={index === images.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded"
                      title="Move right/down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeImage(item.id)}
                    className="p-1 text-slate-400 hover:text-red-600 rounded"
                    title="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Page Size
              </label>
              <select
                value={options.pageSize}
                onChange={(e) => setOptions({ ...options, pageSize: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="fit">Fit Image Dimensions (Same size as photo)</option>
                <option value="a4">Standard A4 Document</option>
                <option value="letter">US Letter Document</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Orientation
              </label>
              <select
                value={options.orientation}
                onChange={(e) => setOptions({ ...options, orientation: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="auto">Auto (Match image orientation)</option>
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>

          {/* In-Flight Processing Feedback */}
          {processing.status === 'processing' ? (
            <div className="py-2">
              <LoadingProgressIndicator
                toolType="jpg-to-pdf"
                title="Converting Images to PDF"
                stepMessage={processing.stepMessage}
                progress={processing.progress}
                fileCount={images.length}
                fileSize={images.reduce((acc, img) => acc + img.file.size, 0)}
                onCancel={() => setImages([])}
              />
            </div>
          ) : (
            /* Action Button */
            <button
              id="jpg-to-pdf-submit-btn"
              onClick={handleConvert}
              className="w-full py-4 text-base font-bold text-primary-foreground bg-primary hover:bg-primary/90 active:bg-primary/80 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Image className="w-5 h-5" />
              <span>Convert to PDF</span>
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
