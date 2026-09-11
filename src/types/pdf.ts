export type ToolType =
  | 'merge'
  | 'split'
  | 'compress'
  | 'jpg-to-pdf'
  | 'pdf-to-jpg'
  | 'rotate'
  | 'delete-pages'
  | 'extract-pages'
  | 'protect'
  | 'unlock'
  | 'pdf-to-word'
  | 'word-to-pdf';

export type CompressionLevel = 'basic' | 'recommended' | 'maximum' | 'extreme';

export type SplitMode = 'range' | 'visual' | 'all';

export interface PageThumbnail {
  page: number;
  pageNumber?: number;
  dataUrl: string;
}

export interface ImageItem {
  id: string;
  file: File;
  name: string;
  size: number;
  previewUrl: string;
  rotation?: number; // 0, 90, 180, 270
}

export interface JpgToPdfOptions {
  pageSize: 'fit' | 'a4' | 'letter';
  orientation: 'auto' | 'portrait' | 'landscape';
  margin: 0 | 20 | 40;
}

export interface PdfToJpgOptions {
  dpi: 150 | 300;
  quality: number;
  selectedPages?: number[];
  format?: 'auto' | 'zip';
}

export interface RotateOptions {
  angle?: 90 | 180 | 270;
  selectedPages?: number[];
  pageRotations?: Record<string, number>;
}

export interface DeletePagesOptions {
  pagesToDelete: number[] | string;
}

export interface ExtractPagesOptions {
  pagesToExtract?: number[] | string;
  pages?: number[] | string;
  mode: 'single-pdf' | 'separate-pdfs';
}

export interface PdfFileInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount?: number;
  status: 'idle' | 'analyzing' | 'ready' | 'error';
  errorMessage?: string;
  previewUrl?: string;
}

export interface ProcessingState {
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progress: number;
  stepMessage: string;
  errorMessage?: string;
}

export interface ProcessResult {
  downloadUrl: string;
  filename: string;
  fileSize: number;
  pageCount?: number;
  originalSize?: number;
  compressedSize?: number;
  savingsBytes?: number;
  savingsPercent?: number;
  isAlreadyOptimized?: boolean;
  isZip?: boolean;
  imageCount?: number;
  remainingPages?: number;
  deletedPages?: number;
}

