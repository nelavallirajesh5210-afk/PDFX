import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Clock,
  EyeOff,
  ChevronDown,
  ChevronUp,
  MousePointerClick,
  UploadCloud,
  DownloadCloud,
} from 'lucide-react';

export const TrustHowItWorksFaq: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      question: 'Is PDFX really 100% free?',
      answer:
        'Yes! All tools on PDFX — merging, splitting, compressing, converting, rotating, and encrypting — are completely free to use without hidden limits or watermarks.',
    },
    {
      question: 'Are my files safe and private?',
      answer:
        'Absolutely. Your files are processed securely in volatile memory. We never view, share, or store your documents, and all temporary processing buffers are permanently deleted within minutes.',
    },
    {
      question: 'What is the maximum file size limit?',
      answer:
        'PDFX supports files up to 50MB per document, which is more than enough for high-resolution presentations, books, legal records, and photo-heavy PDFs.',
    },
    {
      question: 'Do I need to create an account or provide an email?',
      answer:
        'No account, credit card, or email address is required. You can jump directly into any tool and start working immediately.',
    },
    {
      question: 'Can I use PDFX on mobile phones and tablets?',
      answer:
        'Yes! The PDFX interface is fully responsive and works smoothly across iPhone, Android, iPad, and desktop browsers without downloading any software or apps.',
    },
  ];

  return (
    <div className="space-y-16 py-12">
      {/* 5. Trust / Privacy Banner */}
      <section id="trust" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-8 sm:p-12 shadow-md">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-blue-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Enterprise-Grade Privacy</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Your files stay strictly private
            </h2>

            <p className="text-sm sm:text-base text-blue-150 text-slate-200 leading-relaxed">
              We know how important your documents are. When you upload a file to PDFX, it is processed securely in isolated memory and automatically deleted within minutes.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Auto-Deleted</h4>
                  <p className="text-xs text-blue-200 mt-0.5">Files deleted within minutes of processing</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Encrypted Transfer</h4>
                  <p className="text-xs text-blue-200 mt-0.5">TLS encryption safeguards your files in transit</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <EyeOff className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-white">Zero File Viewing</h4>
                  <p className="text-xs text-blue-200 mt-0.5">Automated server-side routines; no human eyes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. How It Works (Simple 3 Steps) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How it works
          </h2>
          <p className="text-sm text-slate-600 mt-1">
            Transforming your PDF documents takes just 3 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-extrabold text-lg">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900">Choose a tool</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Select what you want to do with your PDF from our clean homepage dashboard.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-lg">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900">Upload your file</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Drag and drop your file or choose it directly from your phone, tablet, or computer.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-lg">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900">Download result</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Our automated engine processes your file in seconds. Click download and you're done!
            </p>
          </div>
        </div>
      </section>

      {/* 7. FAQ Section */}
      <section id="faq" className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600">
            Got questions about using PDFX? Here are quick answers to the most common queries.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
