import React, { useRef, useState } from 'react';
import { Upload, AlertCircle, Sparkles, FileCheck2 } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
  multiple?: boolean;
  title?: string;
  subtitle?: string;
  onDemoClick?: () => void;
  demoLabel?: string;
  isProcessing?: boolean;
  acceptType?: 'pdf' | 'image' | 'word' | 'any';
  accept?: string;
  buttonLabel?: string;
}

export const DropZone: React.FC<DropZoneProps> = ({
  onFilesSelected,
  multiple = false,
  title = 'Drag & drop your PDF here',
  subtitle = 'or choose a file from your computer or device',
  onDemoClick,
  demoLabel = 'Try with Sample Document',
  isProcessing = false,
  acceptType = 'pdf',
  accept,
  buttonLabel,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filterFiles = (fileList: FileList | File[]): File[] => {
    const valid: File[] = [];
    const files = Array.from(fileList);

    for (const f of files) {
      if (acceptType === 'image') {
        const isImg = f.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif)$/i.test(f.name);
        if (isImg) valid.push(f);
      } else if (acceptType === 'word') {
        const isWord = f.name.toLowerCase().endsWith('.docx') || f.name.toLowerCase().endsWith('.doc') ||
          f.type.includes('word') || f.type.includes('officedocument');
        if (isWord) valid.push(f);
      } else if (acceptType === 'any') {
        valid.push(f);
      } else {
        if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
          valid.push(f);
        }
      }
    }
    return valid;
  };

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;
    setErrorMsg(null);

    const validFiles = filterFiles(incomingFiles);

    if (validFiles.length === 0) {
      if (acceptType === 'image') {
        setErrorMsg('Please select valid image files (JPG, PNG, or WEBP).');
      } else if (acceptType === 'word') {
        setErrorMsg('Please select a valid Word document (.docx).');
      } else {
        setErrorMsg('Please select a valid PDF document (.pdf).');
      }
      return;
    }

    if (!multiple && validFiles.length > 1) {
      onFilesSelected([validFiles[0]]);
    } else {
      onFilesSelected(validFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isProcessing) return;
    handleFiles(e.dataTransfer.files);
  };

  const computedAccept = accept || (
    acceptType === 'image'
      ? 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp'
      : acceptType === 'word'
      ? '.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : '.pdf,application/pdf'
  );

  const defaultButtonText = buttonLabel || (
    acceptType === 'image'
      ? 'Choose Image Files'
      : acceptType === 'word'
      ? 'Choose Word Document'
      : multiple
      ? 'Choose PDF Files'
      : 'Choose PDF File'
  );

  return (
    <div className="w-full space-y-4">
      <div
        id="pdfx-dropzone-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-200 group ${
          isDragOver
            ? 'border-blue-600 bg-blue-50/70 scale-[1.01] shadow-lg ring-4 ring-blue-100'
            : 'border-slate-300 bg-white hover:border-blue-500 hover:bg-slate-50/80 shadow-sm'
        } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={computedAccept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto">
          {/* Upload Icon Badge */}
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
              isDragOver
                ? 'bg-blue-600 text-white shadow-md scale-110'
                : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100 group-hover:scale-105'
            }`}
          >
            <Upload className="w-8 h-8 stroke-[2.2]" />
          </div>

          {/* Heading & Subheading */}
          <div className="space-y-1.5 text-center">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              {title}
            </h3>
            <p className="text-sm font-medium text-slate-500">
              {subtitle}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              id="pdfx-choose-file-btn"
              type="button"
              className="px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98] min-h-[44px] flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              <Upload className="w-4 h-4" />
              <span>{defaultButtonText}</span>
            </button>

            {onDemoClick && (
              <button
                id="pdfx-demo-sample-btn"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDemoClick();
                }}
                className="px-4 py-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-xl transition-colors border border-slate-200 flex items-center gap-1.5 min-h-[44px]"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{demoLabel}</span>
              </button>
            )}
          </div>

          {/* Specs note */}
          <div className="flex items-center gap-2 pt-1 text-xs text-slate-400">
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Files processed securely in memory • Up to 50MB each</span>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
