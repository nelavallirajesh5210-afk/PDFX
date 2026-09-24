import React, { useState } from 'react';
import { ToolType } from '../types/pdf';
import { X, ShieldCheck } from 'lucide-react';

interface FooterProps {
  onSelectTool: (tool: ToolType | null) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTool }) => {
  const [modalContent, setModalContent] = useState<{ title: string; body: string } | null>(null);

  const scrollTo = (hashId: string) => {
    onSelectTool(null);
    setTimeout(() => {
      const el = document.getElementById(hashId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  return (
    <>
      <footer className="border-t border-line/5 bg-mist/50">
        <div className="mx-auto grid max-w-6xl gap-7 px-5 py-9 sm:grid-cols-[1fr_auto]">
          <div>
            <button
              onClick={() => {
                onSelectTool(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              aria-label="PDFX home"
              className="flex shrink-0 items-center gap-2.5 cursor-pointer text-left border-none bg-transparent"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-head text-xs font-bold text-primary-foreground">
                PX
              </span>
              <span className="font-head text-base font-bold text-foreground">PDFX</span>
            </button>
            <p className="mt-3 text-sm text-muted-foreground">Simple PDF tools. Done.</p>
          </div>

          <nav className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm text-muted-foreground sm:grid-cols-6 items-center">
            <button
              onClick={() => scrollTo('all-tools')}
              className="hover:text-primary transition-colors text-left cursor-pointer"
            >
              All Tools
            </button>
            <button
              onClick={() => scrollTo('pricing')}
              className="hover:text-primary transition-colors text-left cursor-pointer"
            >
              Pricing
            </button>
            <button
              onClick={() =>
                setModalContent({
                  title: 'About PDFX',
                  body: 'PDFX was engineered to make common document tasks effortless, lightning fast, and privacy-respecting. All files are handled in-memory and deleted immediately upon download.',
                })
              }
              className="hover:text-primary transition-colors text-left cursor-pointer"
            >
              About
            </button>
            <button
              onClick={() =>
                setModalContent({
                  title: 'Contact Support',
                  body: 'Have feedback or need assistance? Reach out to support@pdfx-tools.io. We reply to all inquiries within 24 hours.',
                })
              }
              className="hover:text-primary transition-colors text-left cursor-pointer"
            >
              Contact
            </button>
            <button
              onClick={() =>
                setModalContent({
                  title: 'Privacy Policy',
                  body: 'Your privacy is guaranteed. We never store, read, index, or distribute your documents. Files uploaded to PDFX are processed in temporary RAM buffers and erased automatically after completion.',
                })
              }
              className="hover:text-primary transition-colors text-left cursor-pointer"
            >
              Privacy
            </button>
            <button
              onClick={() =>
                setModalContent({
                  title: 'Terms of Service',
                  body: 'PDFX is provided free for individual and commercial document tasks. By using our service, you agree not to submit unlawful material or abuse our automated infrastructure.',
                })
              }
              className="hover:text-primary transition-colors text-left cursor-pointer"
            >
              Terms
            </button>
          </nav>
        </div>
      </footer>

      {/* Info Dialog */}
      {modalContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl border border-line/10 bg-mist p-6 shadow-xl sm:p-8">
            <button
              onClick={() => setModalContent(null)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground p-1 rounded-md"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="font-head text-lg font-bold text-foreground">{modalContent.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{modalContent.body}</p>
            <button
              onClick={() => setModalContent(null)}
              className="mt-6 w-full inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
