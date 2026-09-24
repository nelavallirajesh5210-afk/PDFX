import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import {
  CompressionLevel,
  ProcessResult,
  SplitMode,
  JpgToPdfOptions,
  PdfToJpgOptions,
  RotateOptions,
  DeletePagesOptions,
  ExtractPagesOptions,
  PageThumbnail,
} from '../types/pdf';

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Client-side PDF page count inspector
export async function getPdfInfo(file: File): Promise<{ pageCount: number; fileSize: number }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    return {
      pageCount: doc.getPageCount(),
      fileSize: file.size,
    };
  } catch (err: any) {
    throw new Error(`Failed to read PDF "${file.name}": ${err.message || 'Corrupted or unsupported format'}`);
  }
}

// Merge PDFs
export async function mergePdfs(
  files: File[],
  onProgress?: (step: string, percent: number) => void
): Promise<ProcessResult> {
  onProgress?.('Sending documents to server...', 20);

  try {
    // Attempt server-side merge first
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await fetch('/api/pdf/merge', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      onProgress?.('Finalizing merged document...', 90);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const pageCount = parseInt(response.headers.get('X-Merged-Page-Count') || '0', 10);
      const originalSize = parseInt(response.headers.get('X-Original-Size') || '0', 10);

      return {
        downloadUrl,
        filename: 'pdfx_merged.pdf',
        fileSize: blob.size,
        pageCount: pageCount || undefined,
        originalSize: originalSize || files.reduce((acc, f) => acc + f.size, 0),
        isZip: false,
      };
    }
  } catch (serverErr) {
    console.warn('Server processing unavailable, using client-side fallback:', serverErr);
  }

  // Resilient fallback: in-memory client-side merge
  onProgress?.('Executing secure in-memory merge...', 50);
  const mergedDoc = await PDFDocument.create();
  let totalPages = 0;

  for (let i = 0; i < files.length; i++) {
    onProgress?.(`Processing document ${i + 1} of ${files.length}...`, 50 + Math.floor((i / files.length) * 35));
    const arrayBuffer = await files[i].arrayBuffer();
    const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
    copiedPages.forEach((p) => mergedDoc.addPage(p));
    totalPages += doc.getPageCount();
  }

  onProgress?.('Optimizing document stream...', 92);
  const mergedBytes = await mergedDoc.save({ useObjectStreams: true });
  const blob = new Blob([mergedBytes], { type: 'application/pdf' });
  const downloadUrl = URL.createObjectURL(blob);

  return {
    downloadUrl,
    filename: 'pdfx_merged.pdf',
    fileSize: blob.size,
    pageCount: totalPages,
    originalSize: files.reduce((acc, f) => acc + f.size, 0),
    isZip: false,
  };
}

// Split PDF
export async function splitPdf(
  file: File,
  mode: SplitMode,
  options: { ranges?: string; selectedPages?: number[]; mergeOutput?: boolean },
  onProgress?: (step: string, percent: number) => void
): Promise<ProcessResult> {
  onProgress?.('Preparing document...', 20);

  try {
    // Attempt server-side split first
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);
    if (options.ranges) formData.append('ranges', options.ranges);
    if (options.selectedPages) formData.append('selectedPages', JSON.stringify(options.selectedPages));
    formData.append('mergeOutput', String(options.mergeOutput ?? true));

    const response = await fetch('/api/pdf/split', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      onProgress?.('Finalizing output...', 90);
      const isZip = response.headers.get('Content-Type')?.includes('zip') || false;
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      return {
        downloadUrl,
        filename: isZip ? 'pdfx_split_pages.zip' : 'pdfx_split.pdf',
        fileSize: blob.size,
        isZip,
      };
    }
  } catch (serverErr) {
    console.warn('Server split unavailable, using client fallback:', serverErr);
  }

  // Client fallback
  onProgress?.('Reading document pages...', 40);
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();

  let targetIndices: number[] = [];

  if (mode === 'all') {
    targetIndices = Array.from({ length: totalPages }, (_, i) => i);
    onProgress?.('Generating archive for all pages...', 60);
    const zip = new JSZip();
    const baseName = file.name.replace(/\.pdf$/i, '');

    for (let i = 0; i < totalPages; i++) {
      const singleDoc = await PDFDocument.create();
      const [copied] = await singleDoc.copyPages(srcDoc, [i]);
      singleDoc.addPage(copied);
      const bytes = await singleDoc.save({ useObjectStreams: true });
      const padLen = Math.max(2, String(totalPages).length);
      const pageStr = String(i + 1).padStart(padLen, '0');
      zip.file(`${baseName}_page_${pageStr}.pdf`, bytes);
    }

    const zipContent = await zip.generateAsync({ type: 'blob' });
    return {
      downloadUrl: URL.createObjectURL(zipContent),
      filename: `${baseName}_all_pages.zip`,
      fileSize: zipContent.size,
      pageCount: totalPages,
      isZip: true,
    };
  }

  if (mode === 'visual' && options.selectedPages) {
    targetIndices = options.selectedPages.map((p) => p - 1).filter((p) => p >= 0 && p < totalPages);
  } else if (mode === 'range' && options.ranges) {
    const parts = options.ranges.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, end));
          const to = Math.min(totalPages, Math.max(start, end));
          for (let p = from; p <= to; p++) targetIndices.push(p - 1);
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= totalPages) targetIndices.push(p - 1);
      }
    }
  }

  if (targetIndices.length === 0) {
    throw new Error('No valid pages were selected to extract.');
  }

  // Multi-file ZIP or single merged PDF
  const mergeOutput = options.mergeOutput !== false;
  if (!mergeOutput && targetIndices.length > 1) {
    const zip = new JSZip();
    const baseName = file.name.replace(/\.pdf$/i, '');
    for (let idx = 0; idx < targetIndices.length; idx++) {
      const pageIdx = targetIndices[idx];
      const singleDoc = await PDFDocument.create();
      const [copied] = await singleDoc.copyPages(srcDoc, [pageIdx]);
      singleDoc.addPage(copied);
      const bytes = await singleDoc.save({ useObjectStreams: true });
      zip.file(`${baseName}_page_${pageIdx + 1}.pdf`, bytes);
    }
    const zipContent = await zip.generateAsync({ type: 'blob' });
    return {
      downloadUrl: URL.createObjectURL(zipContent),
      filename: `${baseName}_extracted_pages.zip`,
      fileSize: zipContent.size,
      pageCount: targetIndices.length,
      isZip: true,
    };
  }

  const outDoc = await PDFDocument.create();
  const copied = await outDoc.copyPages(srcDoc, targetIndices);
  copied.forEach((p) => outDoc.addPage(p));
  const outBytes = await outDoc.save({ useObjectStreams: true });
  const blob = new Blob([outBytes], { type: 'application/pdf' });

  return {
    downloadUrl: URL.createObjectURL(blob),
    filename: `pdfx_split_${file.name}`,
    fileSize: blob.size,
    pageCount: targetIndices.length,
    isZip: false,
  };
}

// Compress PDF
export async function compressPdf(
  file: File,
  level: CompressionLevel,
  onProgress?: (step: string, percent: number) => void
): Promise<ProcessResult> {
  onProgress?.('Uploading to optimization engine...', 20);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('level', level);

  let response: globalThis.Response;
  try {
    response = await fetch('/api/pdf/compress', {
      method: 'POST',
      body: formData,
    });
  } catch {
    throw new Error('Could not connect to the PDF compression server. Please check your network and try again.');
  }

  if (!response.ok) {
    let errorMsg = 'Compression failed. Please try again.';
    try {
      const errData = await response.json();
      if (errData?.error) {
        errorMsg = errData.error;
      }
    } catch {
      if (response.status === 408 || response.status === 504) {
        errorMsg = 'The PDF took too long to process. Please try a smaller file.';
      } else if (response.status === 413) {
        errorMsg = 'This PDF is larger than the allowed file size of 50 MB.';
      }
    }
    throw new Error(errorMsg);
  }

  onProgress?.('Finalizing optimized document...', 90);
  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);

  // Parse exact response headers from Ghostscript / server engine
  const originalSize = parseInt(response.headers.get('X-Original-Size') || String(file.size), 10);
  const compressedSize = parseInt(response.headers.get('X-Compressed-Size') || String(blob.size), 10);
  const savingsBytes = parseInt(response.headers.get('X-Savings-Bytes') || '0', 10);
  const savingsPercent = parseInt(response.headers.get('X-Savings-Percent') || '0', 10);
  const isAlreadyOptimized = response.headers.get('X-Already-Optimized') === 'true' || savingsBytes <= 0;
  const pageCount = parseInt(response.headers.get('X-Page-Count') || '0', 10) || undefined;

  let filename = '';
  const disp = response.headers.get('Content-Disposition');
  if (disp && disp.includes('filename=')) {
    const match = disp.match(/filename="?([^";]+)"?/i);
    if (match && match[1]) {
      filename = match[1];
    }
  }
  if (!filename) {
    const base = file.name.replace(/\.pdf$/i, '');
    filename = isAlreadyOptimized ? `${base}_optimized.pdf` : `${base}_compressed.pdf`;
  }

  return {
    downloadUrl,
    filename,
    fileSize: blob.size,
    originalSize,
    compressedSize,
    savingsBytes,
    savingsPercent,
    isAlreadyOptimized,
    pageCount,
    isZip: false,
  };
}

// Demo Sample PDF Generator
export async function fetchSamplePdf(type: 'merge-1' | 'merge-2' | 'multipage' | 'compress' | 'optimized'): Promise<File> {
  try {
    const res = await fetch(`/api/pdf/sample/${type}`);
    if (res.ok) {
      const blob = await res.blob();
      const filename = type === 'optimized' ? 'sample_already_optimized.pdf' : `sample_${type}.pdf`;
      return new File([blob], filename, { type: 'application/pdf' });
    }
  } catch {
    // Fallback to client generator
  }

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);

  const pageCount = type === 'multipage' ? 4 : type.startsWith('merge') ? 2 : 3;

  for (let i = 1; i <= pageCount; i++) {
    const page = doc.addPage([595.28, 841.89]);
    page.drawRectangle({
      x: 0,
      y: 0,
      width: 595.28,
      height: 841.89,
      color: rgb(0.97, 0.98, 0.99),
    });

    page.drawText(`PDFX Sample Document`, {
      x: 50,
      y: 780,
      size: 24,
      font,
      color: rgb(0.1, 0.15, 0.3),
    });

    page.drawText(`Page ${i} of ${pageCount} · Document Type: ${type.toUpperCase()}`, {
      x: 50,
      y: 750,
      size: 12,
      font: regularFont,
      color: rgb(0.3, 0.4, 0.5),
    });

    page.drawRectangle({
      x: 50,
      y: 730,
      width: 495,
      height: 1,
      color: rgb(0.8, 0.85, 0.9),
    });

    page.drawText(`This is a verified test document generated automatically by PDFX.`, {
      x: 50,
      y: 700,
      size: 11,
      font: regularFont,
      color: rgb(0.2, 0.25, 0.3),
    });

    page.drawText(`You can use this file to test Merge, Split, or Compress capabilities in real time.`, {
      x: 50,
      y: 680,
      size: 11,
      font: regularFont,
      color: rgb(0.3, 0.35, 0.4),
    });
  }

  const bytes = await doc.save({ useObjectStreams: true });
  const blob = new Blob([bytes], { type: 'application/pdf' });
  return new File([blob], `pdfx_demo_${type}.pdf`, { type: 'application/pdf' });
}

// 5. Convert JPG / Images to PDF
export async function convertJpgToPdf(
  files: (File | { file: File })[],
  options: JpgToPdfOptions,
  onProgress?: (step: string, percent: number) => void
): Promise<ProcessResult> {
  onProgress?.('Uploading and processing images...', 30);

  const formData = new FormData();
  let totalOriginalSize = 0;

  files.forEach((item) => {
    // Defensively ensure that an actual File/Blob is appended
    const actualFile: File | null =
      item instanceof File
        ? item
        : item && typeof item === 'object' && 'file' in item && (item as any).file instanceof File
        ? (item as any).file
        : null;

    if (actualFile) {
      formData.append('images', actualFile);
      totalOriginalSize += actualFile.size || 0;
    }
  });

  formData.append('pageSize', options.pageSize || 'fit');
  formData.append('orientation', options.orientation || 'auto');
  formData.append('margin', (options.margin ?? 0).toString());

  const response = await fetch('/api/pdf/jpg-to-pdf', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to convert images to PDF.');
  }

  onProgress?.('Building final document...', 85);
  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const pageCount = parseInt(response.headers.get('X-Page-Count') || files.length.toString(), 10);

  return {
    downloadUrl,
    filename: 'pdfx_images.pdf',
    fileSize: blob.size,
    pageCount,
    originalSize: totalOriginalSize,
    isZip: false,
  };
}

// 6. Convert PDF to JPG
export async function convertPdfToJpg(
  file: File,
  options: PdfToJpgOptions,
  onProgress?: (step: string, percent: number) => void
): Promise<ProcessResult> {
  onProgress?.('Uploading PDF document to image rasterizer...', 25);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('dpi', options.dpi.toString());
  formData.append('quality', options.quality.toString());
  if (options.selectedPages && options.selectedPages.length > 0) {
    formData.append('selectedPages', JSON.stringify(options.selectedPages));
  }
  if (options.format) {
    formData.append('format', options.format);
  }

  onProgress?.('Rendering pages into high-definition JPEG frames...', 60);

  const response = await fetch('/api/pdf/pdf-to-jpg', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to convert PDF to JPG.');
  }

  onProgress?.('Packaging image output...', 90);
  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);

  const isZip = response.headers.get('X-Is-Zip') === 'true';
  const imgCount = parseInt(response.headers.get('X-Image-Count') || '1', 10);
  const baseName = file.name.replace(/\.pdf$/i, '');

  let filename = isZip ? `${baseName}_images.zip` : `${baseName}_page_1.jpg`;

  const disp = response.headers.get('Content-Disposition');
  if (disp && disp.includes('filename="')) {
    const match = disp.match(/filename="([^"]+)"/);
    if (match) filename = match[1];
  }

  return {
    downloadUrl,
    filename,
    fileSize: blob.size,
    originalSize: file.size,
    imageCount: imgCount,
    isZip,
  };
}

// 7. Rotate PDF Pages
export async function rotatePdfPages(
  file: File,
  options: RotateOptions | Record<string, number> | Record<number, number>,
  onProgress?: (step: string, percent: number) => void
): Promise<ProcessResult> {
  onProgress?.('Applying page rotation matrix...', 40);

  const formData = new FormData();
  formData.append('file', file);

  let angle: number | undefined;
  let selectedPages: number[] | string | undefined;
  let pageRotations: Record<string, number> | Record<number, number> | undefined;

  if (options && typeof options === 'object') {
    if ('pageRotations' in options || 'angle' in options || 'selectedPages' in options) {
      const opts = options as RotateOptions;
      angle = opts.angle;
      selectedPages = opts.selectedPages;
      pageRotations = opts.pageRotations;
    } else {
      pageRotations = options as Record<string, number>;
    }
  }

  if (angle !== undefined) formData.append('angle', angle.toString());
  if (selectedPages !== undefined) {
    formData.append('selectedPages', typeof selectedPages === 'string' ? selectedPages : JSON.stringify(selectedPages));
  }
  if (pageRotations !== undefined) {
    formData.append('pageRotations', JSON.stringify(pageRotations));
  }

  const response = await fetch('/api/pdf/rotate', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to rotate PDF document.');
  }

  onProgress?.('Saving rotated orientation...', 85);
  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const pageCount = parseInt(response.headers.get('X-Page-Count') || '0', 10);
  const baseName = file.name.replace(/\.pdf$/i, '');

  return {
    downloadUrl,
    filename: `${baseName}_rotated.pdf`,
    fileSize: blob.size,
    pageCount: pageCount || undefined,
    originalSize: file.size,
    isZip: false,
  };
}

// 8. Delete PDF Pages
export async function deletePdfPages(
  file: File,
  options: DeletePagesOptions | number[] | string,
  onProgress?: (step: string, percent: number) => void
): Promise<ProcessResult> {
  onProgress?.('Removing selected pages...', 40);

  const formData = new FormData();
  formData.append('file', file);

  // Normalize: defensive compatibility for DeletePagesOptions, number[], or string
  let targetPages: number[] | string = [];
  if (Array.isArray(options)) {
    targetPages = options;
  } else if (typeof options === 'string') {
    targetPages = options;
  } else if (options && typeof options === 'object' && 'pagesToDelete' in options) {
    targetPages = options.pagesToDelete;
  }

  formData.append(
    'pagesToDelete',
    Array.isArray(targetPages) ? JSON.stringify(targetPages) : (targetPages || '')
  );

  const response = await fetch('/api/pdf/delete-pages', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to remove selected pages.');
  }

  onProgress?.('Compacting modified document...', 85);
  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const remaining = parseInt(response.headers.get('X-Remaining-Pages') || '0', 10);
  const deleted = parseInt(response.headers.get('X-Deleted-Pages') || '0', 10);
  const baseName = file.name.replace(/\.pdf$/i, '');

  return {
    downloadUrl,
    filename: `${baseName}_modified.pdf`,
    fileSize: blob.size,
    originalSize: file.size,
    pageCount: remaining,
    remainingPages: remaining,
    deletedPages: deleted,
    isZip: false,
  };
}

// 9. Extract PDF Pages
export async function extractPdfPages(
  file: File,
  options: ExtractPagesOptions,
  onProgress?: (step: string, percent: number) => void
): Promise<ProcessResult> {
  onProgress?.('Extracting document pages...', 40);

  const formData = new FormData();
  formData.append('file', file);

  // Normalize: defensive compatibility supporting options.pagesToExtract and options.pages
  const targetPages = options.pagesToExtract ?? options.pages ?? [];
  formData.append(
    'pagesToExtract',
    Array.isArray(targetPages) ? JSON.stringify(targetPages) : targetPages.toString()
  );
  formData.append('mode', options.mode || 'single-pdf');

  const response = await fetch('/api/pdf/extract-pages', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to extract selected pages.');
  }

  onProgress?.('Generating extracted package...', 85);
  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const isZip = response.headers.get('X-Is-Zip') === 'true';
  const extractedCount = parseInt(response.headers.get('X-Extracted-Page-Count') || '0', 10);
  const baseName = file.name.replace(/\.pdf$/i, '');

  return {
    downloadUrl,
    filename: isZip ? `${baseName}_extracted_pages.zip` : `${baseName}_extracted.pdf`,
    fileSize: blob.size,
    originalSize: file.size,
    pageCount: extractedCount,
    isZip,
  };
}

// 10. Fetch PDF Page Thumbnails
export async function fetchPdfThumbnails(file: File, maxPages = 50): Promise<PageThumbnail[]> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('maxPages', maxPages.toString());

    const response = await fetch('/api/pdf/thumbnails', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.thumbnails)) {
        return data.thumbnails;
      }
    }
  } catch (err) {
    console.warn('Failed to load server thumbnails, using visual card fallback:', err);
  }
  return [];
}

// 11. Protect PDF with Password
export async function protectPdf(
  file: File,
  password: string,
  onProgress?: (step: string, percent: number) => void
): Promise<ProcessResult> {
  onProgress?.('Encrypting PDF document...', 40);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);

  const response = await fetch('/api/pdf/protect', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to protect document.');
  }

  onProgress?.('Finalizing protected file...', 85);
  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.pdf$/i, '');

  return {
    downloadUrl,
    filename: `${baseName}_protected.pdf`,
    fileSize: blob.size,
    originalSize: file.size,
    isZip: false,
  };
}

// 12. Unlock PDF (Remove Password)
export async function unlockPdf(
  file: File,
  password: string,
  onProgress?: (step: string, percent: number) => void
): Promise<ProcessResult> {
  onProgress?.('Decrypting PDF document...', 40);

  const formData = new FormData();
  formData.append('file', file);
  formData.append('password', password);

  const response = await fetch('/api/pdf/unlock', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Incorrect password or unable to unlock file.');
  }

  onProgress?.('Finalizing unlocked file...', 85);
  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.pdf$/i, '');

  return {
    downloadUrl,
    filename: `${baseName}_unlocked.pdf`,
    fileSize: blob.size,
    originalSize: file.size,
    isZip: false,
  };
}

// 13. Convert PDF to Word (.docx)
export async function convertPdfToWord(
  file: File,
  onProgress?: (step: string, percent: number) => void
): Promise<ProcessResult> {
  onProgress?.('Extracting document contents and layout...', 40);

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/pdf/pdf-to-word', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to convert PDF to Word document.');
  }

  onProgress?.('Compiling Word document (.docx)...', 85);
  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.pdf$/i, '');

  return {
    downloadUrl,
    filename: `${baseName}.docx`,
    fileSize: blob.size,
    originalSize: file.size,
    isZip: false,
  };
}

// 14. Convert Word to PDF (.docx -> .pdf)
export async function convertWordToPdf(
  file: File,
  onProgress?: (step: string, percent: number) => void
): Promise<ProcessResult> {
  onProgress?.('Analyzing Word document layout...', 40);

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/pdf/word-to-pdf', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to convert Word document to PDF.');
  }

  onProgress?.('Rendering standard PDF vector stream...', 85);
  const blob = await response.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const baseName = file.name.replace(/\.(docx|doc)$/i, '');

  return {
    downloadUrl,
    filename: `${baseName}.pdf`,
    fileSize: blob.size,
    originalSize: file.size,
    isZip: false,
  };
}


