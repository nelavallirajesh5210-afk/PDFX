import React from 'react';
import { ShieldCheck, Zap, Clock } from 'lucide-react';

export const TrustSection: React.FC = () => {
  return (
    <section className="border-y border-line/5 bg-primary-soft/30">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-7 md:grid-cols-[1fr_2fr] md:items-center">
          <div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-foreground">Your files stay private.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              PDFX processes your files in secure, temporary memory and never shares or sells your
              documents.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-line/5 bg-mist/60 p-4 backdrop-blur-xs">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">Secure processing</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                In-memory buffer execution with zero long-term retention.
              </p>
            </div>

            <div className="rounded-2xl border border-line/5 bg-mist/60 p-4 backdrop-blur-xs">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">Fast PDF tools</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Instant conversion and high throughput batch operations.
              </p>
            </div>

            <div className="rounded-2xl border border-line/5 bg-mist/60 p-4 backdrop-blur-xs">
              <Clock className="h-5 w-5 text-primary" />
              <h3 className="mt-3 text-sm font-semibold text-foreground">
                Temporary file handling
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Processed artifacts are immediately removed upon completion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
