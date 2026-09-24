import React, { useRef, useState } from 'react';
import { Upload, AlertCircle, Sparkles } from 'lucide-react';

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
  title = 'Drop your PDF files here',
  subtitle = 'PDF files only',
  onDemoClick,
  demoLabel = 'or try a sample PDF',
  isProcessing = false,
  acceptType = 'pdf',
  accept,
  buttonLabel = 'Choose PDF files',
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
        const isWord =
          f.name.toLowerCase().endsWith('.docx') ||
          f.name.toLowerCase().endsWith('.doc') ||
          f.type.includes('word') ||
          f.type.includes('officedocument');
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

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const MAX_FILE_COUNT = 20;

  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;
    setErrorMsg(null);

    const filesArray = Array.from(incomingFiles);

    // 1. File Count Check
    if (filesArray.length > MAX_FILE_COUNT) {
      setErrorMsg(`Too many files selected. Maximum allowed is ${MAX_FILE_COUNT} files per batch.`);
      return;
    }

    // 2. File Size Check
    for (const f of filesArray) {
      if (f.size > MAX_FILE_SIZE) {
        setErrorMsg(`File "${f.name}" exceeds the maximum upload limit of 50MB. Please choose a smaller file.`);
        return;
      }
    }

    const validFiles = filterFiles(incomingFiles);

    if (validFiles.length === 0) {
      setErrorMsg(
        acceptType === 'image'
          ? 'Please select valid image files (JPG, PNG, WebP).'
          : acceptType === 'word'
          ? 'Please select a valid Word document (.docx or .doc).'
          : 'Please select valid PDF documents (.pdf).'
      );
      return;
    }

    if (!multiple && validFiles.length > 1) {
      onFilesSelected([validFiles[0]]);
    } else {
      onFilesSelected(validFiles);
    }
  };

  const getAcceptAttribute = () => {
    if (accept) return accept;
    if (acceptType === 'image') return 'image/jpeg,image/png,image/webp,image/bmp';
    if (acceptType === 'word')
      return '.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword';
    if (acceptType === 'any') return undefined;
    return 'application/pdf,.pdf';
  };

  return (
    <div className="rounded-3xl border border-line/5 bg-mist/75 p-4 shadow-xs ring-1 ring-line/5 backdrop-blur-xl sm:p-7">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isProcessing) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
          if (!isProcessing) handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-2xl border-2 border-dashed transition-all duration-200 px-5 py-10 text-center sm:py-14 ${
          isDragOver
            ? 'border-primary bg-primary-soft/40 scale-[1.005]'
            : 'border-primary/30 bg-primary-soft/20 hover:border-primary/50'
        } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary shadow-xs">
          <Upload className="h-6 w-6" />
        </span>

        <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
        <p className="my-3 text-sm text-muted-foreground">or</p>

        <button
          type="button"
          disabled={isProcessing}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 text-base font-semibold text-primary-foreground shadow-xs hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50"
        >
          {buttonLabel}
        </button>

        <p className="mt-3 text-xs text-muted-foreground">{subtitle}</p>

        {onDemoClick && (
          <div className="mt-4">
            <button
              type="button"
              onClick={onDemoClick}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{demoLabel}</span>
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptAttribute()}
          multiple={multiple}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
          className="hidden"
        />
      </div>

      {errorMsg && (
        <div className="mt-3 flex items-center justify-center gap-2 p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
