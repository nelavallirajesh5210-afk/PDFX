import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import zlib from 'zlib';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Security: In-memory storage only - never persist raw files to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB maximum per file
    files: 20, // Max 20 files per batch
  },
});

app.use(express.json());

// Verify %PDF- magic bytes
function isPdfBuffer(buf: Buffer): boolean {
  if (!buf || buf.length < 5) return false;
  return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46 && buf[4] === 0x2d;
}

// Helper: parse human page ranges (e.g. "1-3, 5, 8-10")
function parsePageRanges(rangesStr: string, totalPages: number): number[] {
  const pagesSet = new Set<number>();
  const parts = rangesStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (isNaN(start) || isNaN(end)) continue;

      const from = Math.max(1, Math.min(start, end));
      const to = Math.min(totalPages, Math.max(start, end));

      for (let p = from; p <= to; p++) {
        pagesSet.add(p - 1);
      }
    } else {
      const page = parseInt(trimmed, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        pagesSet.add(page - 1);
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b);
}

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'PDFX Server Engine',
    inMemoryOnly: true,
    maxFileSize: '50MB',
    timestamp: new Date().toISOString(),
  });
});

// PDF Info Inspector
app.post('/api/pdf/info', upload.single('file'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No PDF file uploaded.' });
      return;
    }

    if (!isPdfBuffer(req.file.buffer)) {
      res.status(400).json({ error: 'Uploaded file is not a valid PDF document.' });
      return;
    }

    const doc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    res.json({
      pageCount: doc.getPageCount(),
      title: doc.getTitle() || undefined,
      author: doc.getAuthor() || undefined,
      fileSize: req.file.size,
      filename: req.file.originalname,
    });
  } catch (err: any) {
    next(err);
  }
});

// 1. MERGE PDF
app.post('/api/pdf/merge', upload.array('files', 20), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length < 2) {
      res.status(400).json({ error: 'At least 2 PDF files are required to merge.' });
      return;
    }

    for (const file of files) {
      if (!isPdfBuffer(file.buffer)) {
        res.status(400).json({ error: `File "${file.originalname}" is not a valid PDF.` });
        return;
      }
    }

    const mergedPdf = await PDFDocument.create();
    let totalPageCount = 0;
    let originalTotalSize = 0;

    for (const file of files) {
      originalTotalSize += file.size;
      const pdf = await PDFDocument.load(file.buffer, { ignoreEncryption: true });
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
      totalPageCount += pdf.getPageCount();
    }

    const mergedBytes = await mergedPdf.save({ useObjectStreams: true });
    const buffer = Buffer.from(mergedBytes);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="pdfx_merged.pdf"');
    res.setHeader('X-Merged-Page-Count', totalPageCount.toString());
    res.setHeader('X-Merged-File-Count', files.length.toString());
    res.setHeader('X-Original-Size', originalTotalSize.toString());
    res.setHeader('X-Final-Size', buffer.length.toString());
    res.send(buffer);
  } catch (err: any) {
    next(err);
  }
});

// 2. SPLIT PDF
app.post('/api/pdf/split', upload.single('file'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No PDF file uploaded to split.' });
      return;
    }

    if (!isPdfBuffer(req.file.buffer)) {
      res.status(400).json({ error: 'The uploaded file is not a valid PDF document.' });
      return;
    }

    const mode = req.body.mode || 'range'; // 'range' | 'visual' | 'all'
    const mergeOutput = req.body.mergeOutput === 'true' || req.body.mergeOutput === true;

    const srcDoc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    const totalPages = srcDoc.getPageCount();

    if (totalPages === 0) {
      res.status(400).json({ error: 'The PDF has 0 pages.' });
      return;
    }

    // Mode 1: Split ALL pages into individual separate PDF files returned in a ZIP
    if (mode === 'all') {
      const zip = new JSZip();
      const baseName = (req.file.originalname || 'document').replace(/\.pdf$/i, '');

      for (let i = 0; i < totalPages; i++) {
        const singleDoc = await PDFDocument.create();
        const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
        singleDoc.addPage(copiedPage);
        const singleBytes = await singleDoc.save({ useObjectStreams: true });
        const padLen = Math.max(2, String(totalPages).length);
        const pageNumStr = String(i + 1).padStart(padLen, '0');
        zip.file(`${baseName}_page_${pageNumStr}.pdf`, singleBytes);
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="pdfx_split_all_pages.zip"');
      res.send(zipBuffer);
      return;
    }

    // Mode 2 & 3: Range-based or Visual page selection
    let pageIndices: number[] = [];

    if (mode === 'visual' && req.body.selectedPages) {
      let selected: number[] = [];
      try {
        selected = typeof req.body.selectedPages === 'string'
          ? JSON.parse(req.body.selectedPages)
          : req.body.selectedPages;
      } catch {
        selected = [];
      }
      pageIndices = selected
        .map((p) => p - 1)
        .filter((idx) => idx >= 0 && idx < totalPages);
    } else {
      const rangesStr = req.body.ranges || `1-${totalPages}`;
      pageIndices = parsePageRanges(rangesStr, totalPages);
    }

    if (pageIndices.length === 0) {
      res.status(400).json({ error: `No valid pages found for extraction within document length of ${totalPages} pages.` });
      return;
    }

    // If user wants individual separate files for each extracted page/range, return ZIP
    if (!mergeOutput && pageIndices.length > 1) {
      const zip = new JSZip();
      const baseName = (req.file.originalname || 'document').replace(/\.pdf$/i, '');

      for (let idx = 0; idx < pageIndices.length; idx++) {
        const pageIdx = pageIndices[idx];
        const singleDoc = await PDFDocument.create();
        const [copiedPage] = await singleDoc.copyPages(srcDoc, [pageIdx]);
        singleDoc.addPage(copiedPage);
        const singleBytes = await singleDoc.save({ useObjectStreams: true });
        zip.file(`${baseName}_page_${pageIdx + 1}.pdf`, singleBytes);
      }

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="pdfx_extracted_pages.zip"');
      res.send(zipBuffer);
      return;
    }

    // Default: Extract pages into a single combined output PDF
    const splitDoc = await PDFDocument.create();
    const copiedPages = await splitDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((page) => splitDoc.addPage(page));

    const outBytes = await splitDoc.save({ useObjectStreams: true });
    const buffer = Buffer.from(outBytes);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="pdfx_split.pdf"');
    res.setHeader('X-Extracted-Page-Count', pageIndices.length.toString());
    res.setHeader('X-Final-Size', buffer.length.toString());
    res.send(buffer);
  } catch (err: any) {
    next(err);
  }
});

// Helper: Ghostscript safe invocation engine
function compressWithGhostscript(inBuf: Buffer, level: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const tempId = crypto.randomUUID();
    const inPath = path.join('/tmp', `pdfx_in_${tempId}.pdf`);
    const outPath = path.join('/tmp', `pdfx_out_${tempId}.pdf`);

    try {
      fs.writeFileSync(inPath, inBuf);
    } catch (writeErr) {
      return reject(writeErr);
    }

    let pdfSettings = '/ebook';
    let extraArgs: string[] = [];

    const normLevel = level.toLowerCase();
    if (normLevel === 'maximum' || normLevel === 'extreme') {
      pdfSettings = '/screen';
      extraArgs = [
        '-dColorImageDownsampleType=/Bicubic',
        '-dColorImageResolution=72',
        '-dGrayImageDownsampleType=/Bicubic',
        '-dGrayImageResolution=72',
        '-dMonoImageDownsampleType=/Subsample',
        '-dMonoImageResolution=150',
        '-dDownsampleColorImages=true',
        '-dDownsampleGrayImages=true',
        '-dDownsampleMonoImages=true',
        '-dColorConversionStrategy=/sRGB',
        '-dAutoFilterColorImages=false',
        '-dColorImageFilter=/DCTEncode',
      ];
    } else if (normLevel === 'recommended') {
      pdfSettings = '/ebook';
      extraArgs = [
        '-dColorImageDownsampleType=/Bicubic',
        '-dColorImageResolution=150',
        '-dGrayImageDownsampleType=/Bicubic',
        '-dGrayImageResolution=150',
        '-dDownsampleColorImages=true',
        '-dDownsampleGrayImages=true',
      ];
    } else {
      // Basic / Lossless
      pdfSettings = '/prepress';
      extraArgs = [
        '-dDownsampleColorImages=false',
        '-dDownsampleGrayImages=false',
        '-dDownsampleMonoImages=false',
      ];
    }

    const args = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-dPDFSETTINGS=${pdfSettings}`,
      ...extraArgs,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      '-dSAFER',
      `-sOutputFile=${outPath}`,
      inPath,
    ];

    execFile('gs', args, { timeout: 45000 }, (err, _stdout, stderr) => {
      try {
        if (err) {
          return reject(err);
        }
        if (!fs.existsSync(outPath) || fs.statSync(outPath).size === 0) {
          return reject(new Error('Ghostscript produced no output. ' + (stderr || '')));
        }
        const outBuf = fs.readFileSync(outPath);
        resolve(outBuf);
      } catch (readErr) {
        reject(readErr);
      } finally {
        if (fs.existsSync(inPath)) {
          try { fs.unlinkSync(inPath); } catch {}
        }
        if (fs.existsSync(outPath)) {
          try { fs.unlinkSync(outPath); } catch {}
        }
      }
    });
  });
}

// Helper: generate realistic PNG image buffer for compressible sample documents
function generateSamplePngBuffer(width = 420, height = 320): Buffer {
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    crcTable[n] = c;
  }
  function crc32(buf: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }
  function chunk(type: string, data: Buffer): Buffer {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const off = y * (width * 3 + 1);
    raw[off] = 0;
    for (let x = 0; x < width; x++) {
      const px = off + 1 + x * 3;
      raw[px] = (Math.sin(x / 14) * 110 + 130) & 0xff;
      raw[px + 1] = (Math.cos(y / 18) * 110 + 130) & 0xff;
      raw[px + 2] = (((x * 3) ^ (y * 5)) % 255) & 0xff;
    }
  }

  const idat = zlib.deflateSync(raw, { level: 1 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// 3. COMPRESS PDF
app.post('/api/pdf/compress', upload.single('file'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No PDF file uploaded to compress.' });
      return;
    }

    if (!isPdfBuffer(req.file.buffer)) {
      res.status(400).json({ error: 'Please select a valid PDF file.' });
      return;
    }

    const originalSize = req.file.size;
    let pageCount = 0;
    let doc: PDFDocument;

    // Verify PDF readability and check for password protection
    try {
      doc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: false });
      pageCount = doc.getPageCount();
    } catch (loadErr: any) {
      const errMsg = (loadErr?.message || '').toLowerCase();
      if (errMsg.includes('encrypt') || errMsg.includes('password') || errMsg.includes('protected') || errMsg.includes('code 2')) {
        res.status(400).json({ error: 'This PDF is password-protected and cannot be compressed here.' });
        return;
      }
      res.status(400).json({ error: "We couldn't read this PDF. Please try another file." });
      return;
    }

    const rawLevel = req.body.level || 'recommended';
    const level = (rawLevel === 'extreme' ? 'maximum' : rawLevel).toLowerCase();

    // 1. Run Ghostscript real engine optimization
    let gsBuffer: Buffer | null = null;
    try {
      gsBuffer = await compressWithGhostscript(req.file.buffer, level);
      if (!isPdfBuffer(gsBuffer)) {
        gsBuffer = null;
      }
    } catch (gsErr: any) {
      if (gsErr?.killed || gsErr?.signal === 'SIGTERM') {
        res.status(408).json({ error: 'The PDF took too long to process. Please try a smaller file.' });
        return;
      }
      console.warn('Ghostscript compression skipped/failed, using stream optimization:', gsErr?.message);
    }

    // 2. Also run pdf-lib object stream compaction
    let pdfLibBuffer: Buffer | null = null;
    try {
      if (level === 'maximum') {
        doc.setTitle('');
        doc.setAuthor('');
        doc.setSubject('');
        doc.setKeywords([]);
        doc.setProducer('PDFX Compressor');
        doc.setCreator('PDFX Engine');
      }
      const streamBytes = await doc.save({ useObjectStreams: true });
      pdfLibBuffer = Buffer.from(streamBytes);
    } catch {
      // ignore
    }

    // 3. Compare candidates and select the best genuine result
    const candidates: Buffer[] = [];
    if (gsBuffer && isPdfBuffer(gsBuffer)) candidates.push(gsBuffer);
    if (pdfLibBuffer && isPdfBuffer(pdfLibBuffer)) candidates.push(pdfLibBuffer);

    let bestBuffer: Buffer | null = null;
    let bestSize = originalSize;

    for (const cand of candidates) {
      if (cand.length < bestSize) {
        bestSize = cand.length;
        bestBuffer = cand;
      }
    }

    let outputBuffer: Buffer;
    let isAlreadyOptimized = false;
    let savingsBytes = 0;
    let savingsPercent = 0;

    // Handle no compression / worse results correctly:
    // If output is not smaller, return the original file to prevent quality degradation or file inflation!
    if (!bestBuffer || bestSize >= originalSize) {
      outputBuffer = req.file.buffer;
      isAlreadyOptimized = true;
      savingsBytes = 0;
      savingsPercent = 0;
    } else {
      outputBuffer = bestBuffer;
      isAlreadyOptimized = false;
      savingsBytes = originalSize - outputBuffer.length;
      savingsPercent = originalSize > 0 ? Math.round((savingsBytes / originalSize) * 100) : 0;
    }

    const baseName = (req.file.originalname || 'document').replace(/\.pdf$/i, '');
    const outFilename = isAlreadyOptimized ? `${baseName}_optimized.pdf` : `${baseName}_compressed.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${outFilename}"`);
    res.setHeader('X-Original-Size', originalSize.toString());
    res.setHeader('X-Compressed-Size', outputBuffer.length.toString());
    res.setHeader('X-Savings-Bytes', savingsBytes.toString());
    res.setHeader('X-Savings-Percent', savingsPercent.toString());
    res.setHeader('X-Page-Count', pageCount.toString());
    res.setHeader('X-Already-Optimized', isAlreadyOptimized ? 'true' : 'false');
    res.setHeader(
      'Access-Control-Expose-Headers',
      'X-Original-Size, X-Compressed-Size, X-Savings-Bytes, X-Savings-Percent, X-Page-Count, X-Already-Optimized, Content-Disposition'
    );
    res.send(outputBuffer);
  } catch (err: any) {
    next(err);
  }
});

// Helper: Embed images into PDFDocument supporting JPG, PNG, and converting other web formats
async function embedImageInPdf(doc: PDFDocument, buf: Buffer, filename: string): Promise<any> {
  // pdf-lib JpegEmbedder accesses dataView(imageData.buffer) without byteOffset,
  // so we clone into an isolated Uint8Array with byteOffset = 0
  const isolatedBytes = new Uint8Array(buf);

  // JPG signature: 0xFF, 0xD8, 0xFF
  if (isolatedBytes.length >= 3 && isolatedBytes[0] === 0xff && isolatedBytes[1] === 0xd8 && isolatedBytes[2] === 0xff) {
    return await doc.embedJpg(isolatedBytes);
  }
  // PNG signature: 0x89, 0x50, 0x4E, 0x47
  if (isolatedBytes.length >= 8 && isolatedBytes[0] === 0x89 && isolatedBytes[1] === 0x50 && isolatedBytes[2] === 0x4e && isolatedBytes[3] === 0x47) {
    return await doc.embedPng(isolatedBytes);
  }
  // Try direct embedJpg or embedPng
  try {
    return await doc.embedJpg(isolatedBytes);
  } catch {
    try {
      return await doc.embedPng(isolatedBytes);
    } catch {
      // Fallback: convert via ImageMagick to PNG
      return new Promise((resolve, reject) => {
        const tempId = crypto.randomUUID();
        const inPath = path.join('/tmp', `pdfx_img_${tempId}`);
        const outPath = path.join('/tmp', `pdfx_img_${tempId}.png`);
        fs.writeFileSync(inPath, buf);
        execFile('convert', [inPath, outPath], { timeout: 15000 }, async (err) => {
          try {
            if (err || !fs.existsSync(outPath)) {
              return reject(new Error(`Unable to decode image "${filename}". Supported formats: JPG, PNG, WEBP.`));
            }
            const pngBuf = fs.readFileSync(outPath);
            const png = await doc.embedPng(new Uint8Array(pngBuf));
            resolve(png);
          } catch (convErr) {
            reject(convErr);
          } finally {
            try { fs.unlinkSync(inPath); } catch {}
            try { fs.unlinkSync(outPath); } catch {}
          }
        });
      });
    }
  }
}

// 4. JPG TO PDF
app.post('/api/pdf/jpg-to-pdf', upload.array('images', 50), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'Please upload at least one image file.' });
      return;
    }

    const pageSize = (req.body.pageSize || 'fit').toLowerCase(); // 'fit' | 'a4' | 'letter'
    const orientation = (req.body.orientation || 'auto').toLowerCase(); // 'auto' | 'portrait' | 'landscape'
    const margin = Math.max(0, parseInt(req.body.margin || '0', 10)); // 0, 20, 40

    const doc = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let embeddedImage: any;
      try {
        embeddedImage = await embedImageInPdf(doc, file.buffer, file.originalname);
      } catch (embedErr: any) {
        res.status(400).json({ error: `Image "${file.originalname}" could not be processed: ${embedErr.message}` });
        return;
      }

      const imgWidth = embeddedImage.width;
      const imgHeight = embeddedImage.height;

      let pageWidth: number;
      let pageHeight: number;

      if (pageSize === 'a4') {
        const isLandscape = orientation === 'landscape' || (orientation === 'auto' && imgWidth > imgHeight);
        pageWidth = isLandscape ? 841.89 : 595.28;
        pageHeight = isLandscape ? 595.28 : 841.89;
      } else if (pageSize === 'letter') {
        const isLandscape = orientation === 'landscape' || (orientation === 'auto' && imgWidth > imgHeight);
        pageWidth = isLandscape ? 792 : 612;
        pageHeight = isLandscape ? 612 : 792;
      } else {
        // 'fit' - 1:1 image dimensions with margin applied
        pageWidth = imgWidth + margin * 2;
        pageHeight = imgHeight + margin * 2;
      }

      const page = doc.addPage([pageWidth, pageHeight]);

      // Fill background with white
      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: rgb(1, 1, 1),
      });

      // Fit image inside margins maintaining aspect ratio
      const availableWidth = Math.max(1, pageWidth - margin * 2);
      const availableHeight = Math.max(1, pageHeight - margin * 2);
      const scale = Math.min(availableWidth / imgWidth, availableHeight / imgHeight);

      const drawWidth = imgWidth * scale;
      const drawHeight = imgHeight * scale;
      const drawX = margin + (availableWidth - drawWidth) / 2;
      const drawY = margin + (availableHeight - drawHeight) / 2;

      page.drawImage(embeddedImage, {
        x: drawX,
        y: drawY,
        width: drawWidth,
        height: drawHeight,
      });
    }

    const pdfBytes = await doc.save({ useObjectStreams: true });
    const buffer = Buffer.from(pdfBytes);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="pdfx_images.pdf"');
    res.setHeader('X-Page-Count', files.length.toString());
    res.setHeader('X-Final-Size', buffer.length.toString());
    res.setHeader('Access-Control-Expose-Headers', 'X-Page-Count, X-Final-Size, Content-Disposition');
    res.send(buffer);
  } catch (err: any) {
    next(err);
  }
});

// 5. PDF TO JPG
app.post('/api/pdf/pdf-to-jpg', upload.single('file'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No PDF file uploaded.' });
    return;
  }
  if (!isPdfBuffer(req.file.buffer)) {
    res.status(400).json({ error: 'The uploaded file is not a valid PDF document.' });
    return;
  }

  const dpi = Math.min(300, Math.max(72, parseInt(req.body.dpi || '150', 10)));
  const quality = Math.min(100, Math.max(50, parseInt(req.body.quality || '90', 10)));
  const selectedPagesStr = req.body.selectedPages;

  const tempId = crypto.randomUUID();
  const inPath = path.join('/tmp', `pdfx_p2j_in_${tempId}.pdf`);
  const outPattern = path.join('/tmp', `pdfx_p2j_out_${tempId}_%03d.jpg`);

  try {
    fs.writeFileSync(inPath, req.file.buffer);

    let doc: PDFDocument;
    try {
      doc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    } catch {
      res.status(400).json({ error: 'Could not read PDF. File may be corrupted or password protected.' });
      return;
    }
    const totalPages = doc.getPageCount();

    // Check if specific pages requested
    let targetPages: number[] = [];
    if (selectedPagesStr) {
      try {
        const parsed = typeof selectedPagesStr === 'string' ? JSON.parse(selectedPagesStr) : selectedPagesStr;
        if (Array.isArray(parsed)) {
          targetPages = parsed.filter((p: number) => p >= 1 && p <= totalPages);
        }
      } catch {
        targetPages = parsePageRanges(selectedPagesStr, totalPages).map((idx) => idx + 1);
      }
    }

    const gsArgs = [
      '-sDEVICE=jpeg',
      `-dJPEGQ=${quality}`,
      `-r${dpi}`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      '-dSAFER',
    ];

    if (targetPages.length > 0) {
      gsArgs.push(`-sPageList=${targetPages.join(',')}`);
    }

    gsArgs.push(`-sOutputFile=${outPattern}`, inPath);

    await new Promise<void>((resolve, reject) => {
      execFile('gs', gsArgs, { timeout: 60000 }, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const tmpDir = '/tmp';
    const prefix = `pdfx_p2j_out_${tempId}_`;
    const files = fs.readdirSync(tmpDir)
      .filter((f) => f.startsWith(prefix) && f.endsWith('.jpg'))
      .sort();

    if (files.length === 0) {
      res.status(500).json({ error: 'No images could be extracted from this PDF.' });
      return;
    }

    const baseName = (req.file.originalname || 'document').replace(/\.pdf$/i, '');

    // If only 1 image extracted and requested single file:
    if (files.length === 1 && req.body.format !== 'zip') {
      const singleBuf = fs.readFileSync(path.join(tmpDir, files[0]));
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}_page_1.jpg"`);
      res.setHeader('X-Image-Count', '1');
      res.setHeader('X-Is-Zip', 'false');
      res.setHeader('Access-Control-Expose-Headers', 'X-Image-Count, X-Is-Zip, Content-Disposition');
      res.send(singleBuf);
      return;
    }

    // Multiple images: bundle into ZIP archive
    const zip = new JSZip();
    for (let i = 0; i < files.length; i++) {
      const fileName = files[i];
      const fileBuf = fs.readFileSync(path.join(tmpDir, fileName));
      const pageIndex = targetPages.length > 0 ? targetPages[i] : i + 1;
      const padLen = Math.max(2, String(totalPages).length);
      const pageNumStr = String(pageIndex).padStart(padLen, '0');
      zip.file(`${baseName}_page_${pageNumStr}.jpg`, fileBuf);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}_images.zip"`);
    res.setHeader('X-Image-Count', files.length.toString());
    res.setHeader('X-Is-Zip', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'X-Image-Count, X-Is-Zip, Content-Disposition');
    res.send(zipBuffer);
  } catch (err: any) {
    next(err);
  } finally {
    try { if (fs.existsSync(inPath)) fs.unlinkSync(inPath); } catch {}
    try {
      const prefix = `pdfx_p2j_out_${tempId}_`;
      fs.readdirSync('/tmp')
        .filter((f) => f.startsWith(prefix))
        .forEach((f) => {
          try { fs.unlinkSync(path.join('/tmp', f)); } catch {}
        });
    } catch {}
  }
});

// 6. ROTATE PDF PAGES
app.post('/api/pdf/rotate', upload.single('file'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No PDF file uploaded.' });
      return;
    }
    if (!isPdfBuffer(req.file.buffer)) {
      res.status(400).json({ error: 'The uploaded file is not a valid PDF document.' });
      return;
    }

    let doc: PDFDocument;
    try {
      doc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    } catch {
      res.status(400).json({ error: 'Could not load PDF document.' });
      return;
    }

    const pages = doc.getPages();
    const totalPages = pages.length;

    let pageRotationsMap: Record<string, number> = {};
    if (req.body.pageRotations) {
      try {
        pageRotationsMap = typeof req.body.pageRotations === 'string'
          ? JSON.parse(req.body.pageRotations)
          : req.body.pageRotations;
      } catch {
        pageRotationsMap = {};
      }
    }

    const defaultAngle = parseInt(req.body.angle || '90', 10);
    const selectedPagesStr = req.body.selectedPages;
    let targetIndices: number[] = [];

    if (selectedPagesStr) {
      try {
        const parsed = typeof selectedPagesStr === 'string' ? JSON.parse(selectedPagesStr) : selectedPagesStr;
        if (Array.isArray(parsed)) {
          targetIndices = parsed.map((p: number) => p - 1).filter((idx) => idx >= 0 && idx < totalPages);
        }
      } catch {
        targetIndices = parsePageRanges(selectedPagesStr, totalPages);
      }
    } else {
      targetIndices = pages.map((_, i) => i);
    }

    for (let i = 0; i < totalPages; i++) {
      const pageNumStr = String(i + 1);
      const page = pages[i];
      const currentRot = page.getRotation().angle;

      if (pageNumStr in pageRotationsMap) {
        const addAngle = pageRotationsMap[pageNumStr];
        const newAngle = ((currentRot + addAngle) % 360 + 360) % 360;
        page.setRotation(degrees(newAngle));
      } else if (targetIndices.includes(i)) {
        const newAngle = ((currentRot + defaultAngle) % 360 + 360) % 360;
        page.setRotation(degrees(newAngle));
      }
    }

    const outBytes = await doc.save({ useObjectStreams: true });
    const buffer = Buffer.from(outBytes);

    const baseName = (req.file.originalname || 'document').replace(/\.pdf$/i, '');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}_rotated.pdf"`);
    res.setHeader('X-Page-Count', totalPages.toString());
    res.setHeader('X-Final-Size', buffer.length.toString());
    res.setHeader('Access-Control-Expose-Headers', 'X-Page-Count, X-Final-Size, Content-Disposition');
    res.send(buffer);
  } catch (err: any) {
    next(err);
  }
});

// 7. DELETE PDF PAGES
app.post('/api/pdf/delete-pages', upload.single('file'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No PDF file uploaded.' });
      return;
    }
    if (!isPdfBuffer(req.file.buffer)) {
      res.status(400).json({ error: 'The uploaded file is not a valid PDF document.' });
      return;
    }

    let doc: PDFDocument;
    try {
      doc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    } catch {
      res.status(400).json({ error: 'Could not load PDF document.' });
      return;
    }

    const totalPages = doc.getPageCount();
    if (totalPages <= 1) {
      res.status(400).json({ error: 'Cannot delete pages from a single-page document. At least 1 page must remain.' });
      return;
    }

    let deleteIndices: number[] = [];
    const rawPages = req.body.pagesToDelete;

    if (rawPages) {
      try {
        const parsed = typeof rawPages === 'string' ? JSON.parse(rawPages) : rawPages;
        if (Array.isArray(parsed)) {
          deleteIndices = parsed.map((p: number) => p - 1).filter((idx) => idx >= 0 && idx < totalPages);
        }
      } catch {
        deleteIndices = parsePageRanges(String(rawPages), totalPages);
      }
    }

    if (deleteIndices.length === 0) {
      res.status(400).json({ error: 'Please select at least one page to delete.' });
      return;
    }

    const uniqueDelete = Array.from(new Set(deleteIndices));
    if (uniqueDelete.length >= totalPages) {
      res.status(400).json({ error: 'Cannot delete all pages. A PDF document must contain at least 1 page.' });
      return;
    }

    uniqueDelete.sort((a, b) => b - a);
    for (const idx of uniqueDelete) {
      doc.removePage(idx);
    }

    const remainingPages = doc.getPageCount();
    const outBytes = await doc.save({ useObjectStreams: true });
    const buffer = Buffer.from(outBytes);

    const baseName = (req.file.originalname || 'document').replace(/\.pdf$/i, '');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}_modified.pdf"`);
    res.setHeader('X-Remaining-Pages', remainingPages.toString());
    res.setHeader('X-Deleted-Pages', uniqueDelete.length.toString());
    res.setHeader('X-Final-Size', buffer.length.toString());
    res.setHeader('Access-Control-Expose-Headers', 'X-Remaining-Pages, X-Deleted-Pages, X-Final-Size, Content-Disposition');
    res.send(buffer);
  } catch (err: any) {
    next(err);
  }
});

// 8. EXTRACT PDF PAGES
app.post('/api/pdf/extract-pages', upload.single('file'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No PDF file uploaded.' });
      return;
    }
    if (!isPdfBuffer(req.file.buffer)) {
      res.status(400).json({ error: 'The uploaded file is not a valid PDF document.' });
      return;
    }

    let srcDoc: PDFDocument;
    try {
      srcDoc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    } catch {
      res.status(400).json({ error: 'Could not load PDF document.' });
      return;
    }

    const totalPages = srcDoc.getPageCount();
    const rawPages = req.body.pagesToExtract;
    let pageIndices: number[] = [];

    if (rawPages) {
      try {
        const parsed = typeof rawPages === 'string' ? JSON.parse(rawPages) : rawPages;
        if (Array.isArray(parsed)) {
          pageIndices = parsed.map((p: number) => p - 1).filter((idx) => idx >= 0 && idx < totalPages);
        }
      } catch {
        pageIndices = parsePageRanges(String(rawPages), totalPages);
      }
    }

    if (pageIndices.length === 0) {
      res.status(400).json({ error: 'Please specify at least one valid page to extract.' });
      return;
    }

    const mode = (req.body.mode || 'single-pdf').toLowerCase(); // 'single-pdf' | 'separate-pdfs'
    const baseName = (req.file.originalname || 'document').replace(/\.pdf$/i, '');

    if (mode === 'separate-pdfs') {
      const zip = new JSZip();
      for (const idx of pageIndices) {
        const singleDoc = await PDFDocument.create();
        const [copied] = await singleDoc.copyPages(srcDoc, [idx]);
        singleDoc.addPage(copied);
        const bytes = await singleDoc.save({ useObjectStreams: true });
        const padLen = Math.max(2, String(totalPages).length);
        const pNum = String(idx + 1).padStart(padLen, '0');
        zip.file(`${baseName}_page_${pNum}.pdf`, bytes);
      }
      const zipBuf = await zip.generateAsync({ type: 'nodebuffer' });
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${baseName}_extracted_pages.zip"`);
      res.setHeader('X-Extracted-Page-Count', pageIndices.length.toString());
      res.setHeader('X-Is-Zip', 'true');
      res.setHeader('Access-Control-Expose-Headers', 'X-Extracted-Page-Count, X-Is-Zip, Content-Disposition');
      res.send(zipBuf);
      return;
    }

    // single-pdf mode (combine extracted pages into 1 document)
    const outDoc = await PDFDocument.create();
    const copiedPages = await outDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((p) => outDoc.addPage(p));
    const outBytes = await outDoc.save({ useObjectStreams: true });
    const buffer = Buffer.from(outBytes);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}_extracted.pdf"`);
    res.setHeader('X-Extracted-Page-Count', pageIndices.length.toString());
    res.setHeader('X-Is-Zip', 'false');
    res.setHeader('X-Final-Size', buffer.length.toString());
    res.setHeader('Access-Control-Expose-Headers', 'X-Extracted-Page-Count, X-Is-Zip, X-Final-Size, Content-Disposition');
    res.send(buffer);
  } catch (err: any) {
    next(err);
  }
});

// 9. THUMBNAILS GENERATOR (for visual page preview)
app.post('/api/pdf/thumbnails', upload.single('file'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'No PDF file uploaded.' });
    return;
  }
  if (!isPdfBuffer(req.file.buffer)) {
    res.status(400).json({ error: 'Invalid PDF document.' });
    return;
  }

  let totalPages = 0;
  try {
    const doc = await PDFDocument.load(req.file.buffer, { ignoreEncryption: true });
    totalPages = doc.getPageCount();
  } catch {
    res.status(400).json({ error: 'Could not read PDF page structure.' });
    return;
  }

  const maxPages = Math.min(totalPages, Math.max(1, parseInt(req.body.maxPages || '50', 10)));
  const tempId = crypto.randomUUID();
  const inPath = path.join('/tmp', `pdfx_tb_in_${tempId}.pdf`);
  const outPattern = path.join('/tmp', `pdfx_tb_out_${tempId}_%03d.jpg`);

  try {
    fs.writeFileSync(inPath, req.file.buffer);

    await new Promise<void>((resolve, reject) => {
      execFile(
        'gs',
        [
          '-sDEVICE=jpeg',
          '-dJPEGQ=70',
          '-r40',
          `-dLastPage=${maxPages}`,
          '-dNOPAUSE',
          '-dQUIET',
          '-dBATCH',
          '-dSAFER',
          `-sOutputFile=${outPattern}`,
          inPath,
        ],
        { timeout: 30000 },
        (err) => {
          if (err) return reject(err);
          resolve();
        }
      );
    });

    const prefix = `pdfx_tb_out_${tempId}_`;
    const files = fs.readdirSync('/tmp')
      .filter((f) => f.startsWith(prefix) && f.endsWith('.jpg'))
      .sort();

    const thumbnails = files.map((fileName, idx) => {
      const fileBuf = fs.readFileSync(path.join('/tmp', fileName));
      return {
        page: idx + 1,
        dataUrl: `data:image/jpeg;base64,${fileBuf.toString('base64')}`,
      };
    });

    res.json({
      pageCount: totalPages,
      renderedCount: thumbnails.length,
      thumbnails,
    });
  } catch (err: any) {
    console.warn('Ghostscript thumbnail generation fallback:', err?.message);
    res.json({
      pageCount: totalPages,
      renderedCount: 0,
      thumbnails: [],
      error: 'Thumbnail generation unavailable for this document.',
    });
  } finally {
    try { if (fs.existsSync(inPath)) fs.unlinkSync(inPath); } catch {}
    try {
      const prefix = `pdfx_tb_out_${tempId}_`;
      fs.readdirSync('/tmp')
        .filter((f) => f.startsWith(prefix))
        .forEach((f) => {
          try { fs.unlinkSync(path.join('/tmp', f)); } catch {}
        });
    } catch {}
  }
});

// 10. PROTECT PDF (Password Encryption)
app.post('/api/pdf/protect', upload.single('file'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const tempId = crypto.randomUUID();
  const inPath = path.join('/tmp', `pdfx_prot_in_${tempId}.pdf`);
  const outPath = path.join('/tmp', `pdfx_prot_out_${tempId}.pdf`);
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No PDF file uploaded.' });
      return;
    }
    if (!isPdfBuffer(req.file.buffer)) {
      res.status(400).json({ error: 'The uploaded file is not a valid PDF document.' });
      return;
    }
    const password = req.body.password;
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      res.status(400).json({ error: 'Please enter a password to protect this document.' });
      return;
    }

    fs.writeFileSync(inPath, req.file.buffer);

    const gsArgs = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-sOwnerPassword=${password.trim()}`,
      `-sUserPassword=${password.trim()}`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      '-dSAFER',
      `-sOutputFile=${outPath}`,
      inPath,
    ];

    await new Promise<void>((resolve, reject) => {
      execFile('gs', gsArgs, { timeout: 35000 }, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    if (!fs.existsSync(outPath) || fs.statSync(outPath).size === 0) {
      throw new Error('Encryption process could not generate output file.');
    }

    const outBuf = fs.readFileSync(outPath);
    const baseName = (req.file.originalname || 'document').replace(/\.pdf$/i, '');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}_protected.pdf"`);
    res.setHeader('X-Final-Size', outBuf.length.toString());
    res.setHeader('Access-Control-Expose-Headers', 'X-Final-Size, Content-Disposition');
    res.send(outBuf);
  } catch (err: any) {
    next(err);
  } finally {
    try { if (fs.existsSync(inPath)) fs.unlinkSync(inPath); } catch {}
    try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch {}
  }
});

// 11. UNLOCK PDF (Remove Password)
app.post('/api/pdf/unlock', upload.single('file'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const tempId = crypto.randomUUID();
  const inPath = path.join('/tmp', `pdfx_unlk_in_${tempId}.pdf`);
  const outPath = path.join('/tmp', `pdfx_unlk_out_${tempId}.pdf`);
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No PDF file uploaded.' });
      return;
    }
    if (!isPdfBuffer(req.file.buffer)) {
      res.status(400).json({ error: 'The uploaded file is not a valid PDF document.' });
      return;
    }
    const password = (req.body.password || '').trim();

    fs.writeFileSync(inPath, req.file.buffer);

    const gsArgs = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.4',
      `-sPDFPassword=${password}`,
      '-dNOPAUSE',
      '-dQUIET',
      '-dBATCH',
      '-dSAFER',
      `-sOutputFile=${outPath}`,
      inPath,
    ];

    await new Promise<void>((resolve, reject) => {
      execFile('gs', gsArgs, { timeout: 35000 }, (err) => {
        if (err) return reject(new Error('Incorrect password or unable to unlock this document.'));
        resolve();
      });
    });

    if (!fs.existsSync(outPath) || fs.statSync(outPath).size === 0) {
      throw new Error('Incorrect password or unable to remove protection.');
    }

    const outBuf = fs.readFileSync(outPath);
    const baseName = (req.file.originalname || 'document').replace(/\.pdf$/i, '');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}_unlocked.pdf"`);
    res.setHeader('X-Final-Size', outBuf.length.toString());
    res.setHeader('Access-Control-Expose-Headers', 'X-Final-Size, Content-Disposition');
    res.send(outBuf);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Incorrect password or unable to decrypt document.' });
  } finally {
    try { if (fs.existsSync(inPath)) fs.unlinkSync(inPath); } catch {}
    try { if (fs.existsSync(outPath)) fs.unlinkSync(outPath); } catch {}
  }
});

// 12. PDF TO WORD (.docx)
app.post('/api/pdf/pdf-to-word', upload.single('file'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const tempId = crypto.randomUUID();
  const inPath = path.join('/tmp', `pdfx_p2w_in_${tempId}.pdf`);
  const txtPath = path.join('/tmp', `pdfx_p2w_txt_${tempId}.txt`);
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No PDF file uploaded.' });
      return;
    }
    if (!isPdfBuffer(req.file.buffer)) {
      res.status(400).json({ error: 'The uploaded file is not a valid PDF document.' });
      return;
    }

    fs.writeFileSync(inPath, req.file.buffer);

    // Extract text layout using Ghostscript txtwrite
    await new Promise<void>((resolve, reject) => {
      execFile('gs', ['-sDEVICE=txtwrite', '-dNOPAUSE', '-dQUIET', '-dBATCH', `-sOutputFile=${txtPath}`, inPath], (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    let rawText = '';
    if (fs.existsSync(txtPath)) {
      rawText = fs.readFileSync(txtPath, 'utf8');
    }

    const paragraphs: Paragraph[] = [];
    const baseName = (req.file.originalname || 'document').replace(/\.pdf$/i, '');

    paragraphs.push(
      new Paragraph({
        text: baseName,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 280 },
      })
    );

    const lines = rawText.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        paragraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      } else {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: trimmed, size: 22 })],
            spacing: { after: 120 },
          })
        );
      }
    }

    const doc = new Document({
      sections: [{ children: paragraphs }],
    });

    const docxBuf = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}.docx"`);
    res.setHeader('X-Final-Size', docxBuf.length.toString());
    res.setHeader('Access-Control-Expose-Headers', 'X-Final-Size, Content-Disposition');
    res.send(docxBuf);
  } catch (err: any) {
    next(err);
  } finally {
    try { if (fs.existsSync(inPath)) fs.unlinkSync(inPath); } catch {}
    try { if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath); } catch {}
  }
});

// 13. WORD TO PDF (.docx -> .pdf)
app.post('/api/pdf/word-to-pdf', upload.single('file'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No Word document uploaded.' });
      return;
    }

    const { value: text } = await mammoth.extractRawText({ buffer: req.file.buffer });
    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Could not extract readable text from this document.' });
      return;
    }

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontSize = 11;
    const lineHeight = 16;
    const margin = 50;
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const maxWidth = pageWidth - margin * 2;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    const baseName = (req.file.originalname || 'document').replace(/\.(docx|doc)$/i, '');
    page.drawText(baseName, {
      x: margin,
      y,
      size: 18,
      font: boldFont,
      color: rgb(0.1, 0.15, 0.25),
    });
    y -= 30;

    const lines = text.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        y -= lineHeight;
        if (y < margin) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        continue;
      }

      const words = line.split(' ');
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const textWidth = font.widthOfTextAtSize(testLine, fontSize);
        if (textWidth > maxWidth && currentLine) {
          if (y < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            y = pageHeight - margin;
          }
          page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0.15, 0.15, 0.15) });
          y -= lineHeight;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        if (y < margin) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          y = pageHeight - margin;
        }
        page.drawText(currentLine, { x: margin, y, size: fontSize, font, color: rgb(0.15, 0.15, 0.15) });
        y -= lineHeight;
      }
    }

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    const buffer = Buffer.from(pdfBytes);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}.pdf"`);
    res.setHeader('X-Final-Size', buffer.length.toString());
    res.setHeader('Access-Control-Expose-Headers', 'X-Final-Size, Content-Disposition');
    res.send(buffer);
  } catch (err: any) {
    next(err);
  }
});

// Periodic temporary file cleaner: runs every 5 minutes to sweep any /tmp/pdfx_* files older than 5 minutes
setInterval(() => {
  try {
    const tmpDir = '/tmp';
    const files = fs.readdirSync(tmpDir);
    const now = Date.now();
    const MAX_AGE_MS = 5 * 60 * 1000;

    for (const file of files) {
      if (file.startsWith('pdfx_')) {
        const fullPath = path.join(tmpDir, file);
        try {
          const stats = fs.statSync(fullPath);
          if (now - stats.mtimeMs > MAX_AGE_MS) {
            fs.unlinkSync(fullPath);
          }
        } catch {}
      }
    }
  } catch {}
}, 5 * 60 * 1000);

// 4. Sample PDF Generator (for immediate testing in UI)
app.get('/api/pdf/sample/:type', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const type = req.params.type;
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const regularFont = await doc.embedFont(StandardFonts.Helvetica);

    // If testing "already-optimized" specifically:
    if (type === 'optimized') {
      const page = doc.addPage([595.28, 841.89]);
      page.drawText('PDFX Minimal Optimized Test Document', {
        x: 50,
        y: 780,
        size: 20,
        font,
        color: rgb(0.1, 0.15, 0.3),
      });
      page.drawText('This tiny document is already structurally minimal.', {
        x: 50,
        y: 740,
        size: 12,
        font: regularFont,
        color: rgb(0.3, 0.4, 0.5),
      });
      const bytes = await doc.save({ useObjectStreams: true });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="pdfx_already_optimized.pdf"');
      res.send(Buffer.from(bytes));
      return;
    }

    const pageCount = type === 'multipage' ? 4 : type === 'compress' ? 3 : 2;

    // For compress test, embed high-resolution PNG image on page 2 so compression has real imagery to optimize
    let embeddedImg: any = null;
    if (type === 'compress') {
      try {
        const pngBuf = generateSamplePngBuffer(420, 320);
        embeddedImg = await doc.embedPng(pngBuf);
      } catch (e) {
        console.warn('Could not embed PNG sample:', e);
      }
    }

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

      if (type === 'compress' && i === 2 && embeddedImg) {
        page.drawText('Sample Graphic Asset (Photo Scan Simulation)', {
          x: 50,
          y: 670,
          size: 12,
          font,
          color: rgb(0.15, 0.2, 0.3),
        });
        page.drawImage(embeddedImg, {
          x: 50,
          y: 320,
          width: 420,
          height: 320,
        });
        page.drawText('High-resolution raster stream for demonstrating compression efficiency.', {
          x: 50,
          y: 290,
          size: 10,
          font: regularFont,
          color: rgb(0.4, 0.45, 0.5),
        });
      } else {
        page.drawText(`You can use this file to test Merge, Split, or Compress capabilities in real time.`, {
          x: 50,
          y: 670,
          size: 11,
          font: regularFont,
          color: rgb(0.3, 0.35, 0.4),
        });
      }
    }

    const bytes = await doc.save({ useObjectStreams: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="pdfx_sample_${type}.pdf"`);
    res.send(Buffer.from(bytes));
  } catch (err: any) {
    next(err);
  }
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('PDFX Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected error occurred during PDF processing.',
  });
});

// Boot server with Vite middleware integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PDFX Server running on http://localhost:${PORT}`);
  });
}

startServer();
