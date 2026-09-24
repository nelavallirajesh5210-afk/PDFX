import React, { useState } from 'react';
import { DropZone } from './DropZone';
import { LoadingProgressIndicator } from './LoadingProgressIndicator';
import { protectPdf, triggerDownload, formatBytes } from '../services/api';
import { addRecentFile } from '../services/recentFilesService';
import { ProcessingState, ProcessResult } from '../types/pdf';
import {
  Lock,
  ArrowLeft,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  KeyRound,
  FileText,
  Trash2,
} from 'lucide-react';

interface ProtectToolProps {
  onBack: () => void;
}

export const ProtectTool: React.FC<ProtectToolProps> = ({ onBack }) => {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [processing, setProcessing] = useState<ProcessingState>({
    status: 'idle',
    progress: 0,
    stepMessage: '',
  });
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setFormError(null);
      setResult(null);
    }
  };

  const handleProtect = async () => {
    if (!file) return;
    if (!password.trim()) {
      setFormError('Please enter a password to encrypt this document.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please re-enter.');
      return;
    }

    setFormError(null);
    setProcessing({ status: 'uploading', progress: 25, stepMessage: 'Uploading document...' });

    try {
      const res = await protectPdf(file, password.trim(), (step, percent) => {
        setProcessing({ status: 'processing', progress: percent, stepMessage: step });
      });

      setResult(res);
      addRecentFile({
        toolType: 'protect',
        toolName: 'Protect PDF',
        fileName: res.filename,
        originalName: file.name,
        fileSize: res.fileSize,
        pageCount: res.pageCount,
        downloadUrl: res.downloadUrl,
      });
      setProcessing({ status: 'success', progress: 100, stepMessage: 'Complete!' });
    } catch (err: any) {
      setProcessing({
        status: 'error',
        progress: 0,
        stepMessage: '',
        errorMessage: err.message || 'Failed to protect document.',
      });
    }
  };

  const handleReset = () => {
    setFile(null);
    setPassword('');
    setConfirmPassword('');
    setResult(null);
    setFormError(null);
    setProcessing({ status: 'idle', progress: 0, stepMessage: '' });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Back button */}
      <button
        id="protect-back-btn"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to all tools</span>
      </button>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mb-3">
          <Lock className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Protect PDF
        </h1>
        <p className="text-base font-medium text-slate-600 mt-1">
          Add password encryption to secure sensitive PDF documents
        </p>
      </div>

      {/* Success View */}
      {result ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">Your PDF is protected!</h2>
            <p className="text-sm text-slate-600">
              The file is now encrypted and requires your password to open.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 max-w-sm mx-auto text-left text-xs text-slate-700 space-y-1">
            <div className="font-semibold text-slate-900 truncate">{result.filename}</div>
            <div className="text-slate-500">{formatBytes(result.fileSize)}</div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              id="protect-download-btn"
              onClick={() => triggerDownload(result.downloadUrl, result.filename)}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-5 h-5" />
              <span>Download Protected PDF</span>
            </button>

            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Protect another file</span>
            </button>
          </div>
        </div>
      ) : !file ? (
        /* Upload Area */
        <DropZone
          onFilesSelected={handleFilesSelected}
          multiple={false}
          title="Drag & drop your PDF here"
          subtitle="or choose a PDF file from your computer or device"
          buttonLabel="Choose PDF File"
        />
      ) : (
        /* Configuration & Action Area */
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          {/* File Selected Card */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-slate-900 truncate">{file.name}</p>
                <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
              </div>
            </div>

            <button
              onClick={() => setFile(null)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Remove file"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Password Inputs */}
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Set Document Password
              </label>
              <div className="relative">
                <input
                  id="protect-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter strong password..."
                  className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <input
                id="protect-confirm-password-input"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password to confirm..."
                className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* In-Flight Processing Feedback */}
          {processing.status === 'processing' || processing.status === 'uploading' ? (
            <div className="py-2">
              <LoadingProgressIndicator
                toolType="protect"
                title="Encrypting PDF Document"
                stepMessage={processing.stepMessage}
                progress={processing.progress}
                fileName={file.name}
                fileSize={file.size}
                onCancel={() => setFile(null)}
              />
            </div>
          ) : (
            /* Primary Action Button */
            <button
              id="protect-submit-btn"
              onClick={handleProtect}
              className="w-full py-4 text-base font-bold text-primary-foreground bg-primary hover:bg-primary/90 active:bg-primary/80 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-5 h-5" />
              <span>Protect PDF</span>
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
