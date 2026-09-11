import React from 'react';
import { ShieldCheck, Cpu, HardDriveDownload, Lock } from 'lucide-react';

export const SecuritySection: React.FC = () => {
  return (
    <section id="security" className="py-16 border-t border-slate-900 bg-slate-950/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
            Privacy & Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Syne']">
            Engineered for Strict Document Security
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            PDFX is built from first principles for confidential documents. Your financial reports, legal contracts, and personal PDFs never persist on server storage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">100% In-Memory Execution</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Files are streamed into transient RAM buffers via native Node memory streams and released by the garbage collector immediately after delivery.
            </p>
          </div>

          <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <HardDriveDownload className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Zero Disk Persistence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Unlike typical file converters that leave temporary artifacts in disk directories, PDFX writes zero file fragments to persistent disk storage.
            </p>
          </div>

          <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Magic Byte Verification</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Every uploaded stream is cryptographically validated at byte level against the <code className="font-mono text-slate-300">%PDF-</code> specification to block malicious payloads.
            </p>
          </div>

          <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">No AI Training or Scraping</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Processing is carried out strictly by deterministic low-level PDF byte libraries. Document contents are never sent to external LLMs or stored for training.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
