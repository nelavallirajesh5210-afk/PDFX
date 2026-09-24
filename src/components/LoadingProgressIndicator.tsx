import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Loader2,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Sparkles,
  Combine,
  Scissors,
  FileArchive,
  RotateCw,
  Trash2,
  Copy,
  Lock,
  Unlock,
  FileType,
  FileImage,
  ArrowRight,
} from 'lucide-react';
import { formatBytes } from '../services/api';

export interface TaskStage {
  id: string;
  label: string;
  description?: string;
  minProgress: number;
}

export interface LoadingProgressIndicatorProps {
  title?: string;
  stepMessage?: string;
  progress: number; // 0 - 100
  toolType?: string;
  fileName?: string;
  fileCount?: number;
  fileSize?: number;
  stages?: TaskStage[];
  onCancel?: () => void;
  className?: string;
}

const TOOL_CONFIG: Record<
  string,
  {
    icon: React.ComponentType<{ className?: string }>;
    defaultTitle: string;
    stages: TaskStage[];
  }
> = {
  merge: {
    icon: Combine,
    defaultTitle: 'Merging PDF Files',
    stages: [
      { id: '1', label: 'Load & Index', description: 'Reading documents and bookmarks', minProgress: 0 },
      { id: '2', label: 'Merge Pages', description: 'Combining page trees and graphics', minProgress: 40 },
      { id: '3', label: 'Finalize PDF', description: 'Optimizing and building document', minProgress: 85 },
    ],
  },
  split: {
    icon: Scissors,
    defaultTitle: 'Splitting PDF Document',
    stages: [
      { id: '1', label: 'Analyze Ranges', description: 'Validating page split boundaries', minProgress: 0 },
      { id: '2', label: 'Extract Content', description: 'Separating target page streams', minProgress: 40 },
      { id: '3', label: 'Assemble Output', description: 'Generating finalized documents', minProgress: 85 },
    ],
  },
  compress: {
    icon: FileArchive,
    defaultTitle: 'Compressing PDF File',
    stages: [
      { id: '1', label: 'Analyze Streams', description: 'Auditing image & font objects', minProgress: 0 },
      { id: '2', label: 'Optimize Content', description: 'Downsampling and compressing', minProgress: 35 },
      { id: '3', label: 'Rebuild Bundle', description: 'Packaging compact PDF stream', minProgress: 85 },
    ],
  },
  rotate: {
    icon: RotateCw,
    defaultTitle: 'Rotating PDF Pages',
    stages: [
      { id: '1', label: 'Read Angles', description: 'Mapping rotation matrices', minProgress: 0 },
      { id: '2', label: 'Transform Canvas', description: 'Applying page orientation shifts', minProgress: 40 },
      { id: '3', label: 'Save Layout', description: 'Rebuilding orientation metadata', minProgress: 85 },
    ],
  },
  'delete-pages': {
    icon: Trash2,
    defaultTitle: 'Deleting PDF Pages',
    stages: [
      { id: '1', label: 'Map Removal', description: 'Auditing pages to eliminate', minProgress: 0 },
      { id: '2', label: 'Prune Structure', description: 'Removing objects & references', minProgress: 40 },
      { id: '3', label: 'Save Clean PDF', description: 'Compiling pruned document', minProgress: 85 },
    ],
  },
  'extract-pages': {
    icon: Copy,
    defaultTitle: 'Extracting Pages',
    stages: [
      { id: '1', label: 'Target Pages', description: 'Selecting extracted page frames', minProgress: 0 },
      { id: '2', label: 'Slice Content', description: 'Cloning vector & text streams', minProgress: 40 },
      { id: '3', label: 'Compile Output', description: 'Assembling new standalone PDF', minProgress: 85 },
    ],
  },
  'pdf-to-word': {
    icon: FileType,
    defaultTitle: 'Converting PDF to Word',
    stages: [
      { id: '1', label: 'Scan Content', description: 'Extracting text and formatting', minProgress: 0 },
      { id: '2', label: 'Structure Flow', description: 'Generating Word OpenXML structure', minProgress: 40 },
      { id: '3', label: 'Compile .docx', description: 'Packaging editable document', minProgress: 85 },
    ],
  },
  'word-to-pdf': {
    icon: FileType,
    defaultTitle: 'Converting Word to PDF',
    stages: [
      { id: '1', label: 'Parse Word', description: 'Reading paragraphs and styles', minProgress: 0 },
      { id: '2', label: 'Typeset Layout', description: 'Rendering typography to canvas', minProgress: 40 },
      { id: '3', label: 'Render PDF', description: 'Exporting finalized PDF document', minProgress: 85 },
    ],
  },
  'pdf-to-jpg': {
    icon: FileImage,
    defaultTitle: 'Converting PDF to Images',
    stages: [
      { id: '1', label: 'Rasterize Pages', description: 'Rendering at crisp resolution', minProgress: 0 },
      { id: '2', label: 'Encode Images', description: 'Generating high-quality frames', minProgress: 40 },
      { id: '3', label: 'Bundle Output', description: 'Preparing image package / ZIP', minProgress: 85 },
    ],
  },
  'jpg-to-pdf': {
    icon: FileImage,
    defaultTitle: 'Converting Images to PDF',
    stages: [
      { id: '1', label: 'Load Images', description: 'Reading image dimensions', minProgress: 0 },
      { id: '2', label: 'Fit to Pages', description: 'Scaling and orienting pages', minProgress: 40 },
      { id: '3', label: 'Compile PDF', description: 'Exporting multi-page PDF', minProgress: 85 },
    ],
  },
  protect: {
    icon: Lock,
    defaultTitle: 'Encrypting PDF Document',
    stages: [
      { id: '1', label: 'Validate File', description: 'Checking document structure', minProgress: 0 },
      { id: '2', label: 'Apply Cipher', description: 'Encrypting data with password', minProgress: 40 },
      { id: '3', label: 'Lock PDF', description: 'Exporting secured document', minProgress: 85 },
    ],
  },
  unlock: {
    icon: Unlock,
    defaultTitle: 'Unlocking PDF Document',
    stages: [
      { id: '1', label: 'Verify Key', description: 'Checking password permissions', minProgress: 0 },
      { id: '2', label: 'Decrypt Data', description: 'Stripping security restrictions', minProgress: 40 },
      { id: '3', label: 'Save Unlocked', description: 'Exporting unprotected document', minProgress: 85 },
    ],
  },
};

export const LoadingProgressIndicator: React.FC<LoadingProgressIndicatorProps> = ({
  title,
  stepMessage,
  progress,
  toolType = 'merge',
  fileName,
  fileCount,
  fileSize,
  stages: customStages,
  onCancel,
  className = '',
}) => {
  // Smoothly interpolated display progress so progress never appears stuck
  const [displayProgress, setDisplayProgress] = useState(Math.max(8, progress));

  useEffect(() => {
    // If progress is higher than display, smoothly interpolate towards it
    const target = Math.min(100, Math.max(8, progress));
    if (displayProgress < target) {
      const step = Math.max(1, Math.ceil((target - displayProgress) / 5));
      const timer = setTimeout(() => {
        setDisplayProgress((prev) => Math.min(target, prev + step));
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [progress, displayProgress]);

  // Micro-nudging while task is active to communicate ongoing background progress
  useEffect(() => {
    if (progress < 90 && displayProgress < 85) {
      const nudge = setInterval(() => {
        setDisplayProgress((prev) => {
          if (prev < 85 && prev < progress + 15) {
            return prev + 1;
          }
          return prev;
        });
      }, 400);
      return () => clearInterval(nudge);
    }
  }, [progress, displayProgress]);

  const config = TOOL_CONFIG[toolType] || TOOL_CONFIG.merge;
  const ToolIcon = config.icon;
  const stages = customStages || config.stages;
  const activeTitle = title || config.defaultTitle;

  // Determine current active stage index
  const currentStageIndex = useMemo(() => {
    let activeIdx = 0;
    for (let i = stages.length - 1; i >= 0; i--) {
      if (displayProgress >= stages[i].minProgress) {
        activeIdx = i;
        break;
      }
    }
    return activeIdx;
  }, [stages, displayProgress]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.99 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`rounded-3xl border border-primary/25 bg-mist p-6 sm:p-8 shadow-md relative overflow-hidden ${className}`}
      role="status"
      aria-live="polite"
      aria-label={`${activeTitle} - ${displayProgress}% complete`}
    >
      {/* Decorative background glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header Info */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-xs">
            <ToolIcon className="h-6 w-6" />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-mist"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                {activeTitle}
              </h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-bold text-primary">
                <Sparkles className="h-3 w-3" />
                Processing
              </span>
            </div>
            <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
              {stepMessage || stages[currentStageIndex]?.description || 'Working on your files...'}
            </p>
          </div>
        </div>

        {/* Big percentage display */}
        <div className="flex items-center sm:items-end sm:flex-col justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-line/10">
          <span className="font-head text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            {displayProgress}%
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Completed
          </span>
        </div>
      </div>

      {/* Primary Progress Bar with animated shimmer */}
      <div className="relative mt-6">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-mist border border-line/10">
          <motion.div
            className="h-full rounded-full bg-primary relative overflow-hidden shadow-xs"
            initial={{ width: '8%' }}
            animate={{ width: `${displayProgress}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {/* Shimmer animation highlight */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </motion.div>
        </div>
      </div>

      {/* 3-Stage Pipeline / Milestones Tracker */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
        {stages.map((stage, idx) => {
          const isDone = displayProgress >= (stages[idx + 1]?.minProgress ?? 100) || displayProgress === 100;
          const isCurrent = idx === currentStageIndex && !isDone;
          const isPending = !isDone && !isCurrent;

          return (
            <div
              key={stage.id}
              className={`rounded-2xl p-3 sm:p-3.5 border transition-all ${
                isDone
                  ? 'border-primary/25 bg-primary-soft/40 text-foreground'
                  : isCurrent
                  ? 'border-primary bg-primary-soft/60 shadow-xs ring-1 ring-primary/20 text-foreground'
                  : 'border-line/10 bg-mist/60 text-muted-foreground opacity-65'
              }`}
            >
              <div className="flex items-center gap-2">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                ) : (
                  <div className="h-4 w-4 rounded-full border border-line/20 shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-bold truncate">
                  {stage.label}
                </span>
              </div>
              {stage.description && (
                <p className="mt-1 text-[11px] text-muted-foreground line-clamp-1">
                  {stage.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Task Context Details Footer */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-line/10 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-3">
          {(fileName || fileCount !== undefined) && (
            <div className="flex items-center gap-1.5 font-medium text-foreground/80 bg-mist px-2.5 py-1 rounded-lg border border-line/10">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span className="truncate max-w-[200px]">
                {fileCount !== undefined && fileCount > 1
                  ? `${fileCount} documents`
                  : fileName || 'Document'}
              </span>
              {fileSize !== undefined && fileSize > 0 && (
                <span className="text-muted-foreground font-normal">
                  ({formatBytes(fileSize)})
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-1.5 text-foreground/70">
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>Secure In-Memory Execution</span>
          </div>
        </div>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-muted-foreground hover:text-destructive hover:underline cursor-pointer"
          >
            Cancel task
          </button>
        )}
      </div>
    </motion.div>
  );
};
