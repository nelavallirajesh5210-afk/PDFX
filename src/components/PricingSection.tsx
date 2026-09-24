import React from 'react';
import { Check } from 'lucide-react';

interface PricingSectionProps {
  onSelectTool?: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = () => {
  return (
    <section id="pricing" className="mx-auto max-w-4xl px-5 py-16">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Simple plans</p>
        <h2 className="mt-2 text-3xl font-bold text-foreground">Pricing built for what’s next</h2>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 items-stretch">
        {/* Free Plan */}
        <div className="rounded-3xl border border-line/5 bg-mist/75 p-6 shadow-xs sm:p-8 flex flex-col justify-between">
          <div>
            <span className="font-head text-lg font-bold text-foreground">Free</span>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-head text-4xl font-bold text-foreground">$0</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Essential PDF tools for individuals and quick daily tasks.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-foreground/80">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>All 12 core PDF tools included</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Up to 50 MB per file</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Standard fast conversion speed</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Zero file storage • In-memory privacy</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <a
              href="#all-tools"
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-semibold shadow-xs hover:bg-accent transition-colors"
            >
              Use PDFX free
            </a>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="rounded-3xl border-2 border-primary/30 bg-primary-soft/30 p-6 shadow-sm sm:p-8 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-5 top-5">
            <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              Coming soon
            </span>
          </div>

          <div>
            <span className="font-head text-lg font-bold text-foreground">Pro</span>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="font-head text-4xl font-bold text-foreground">$12</span>
              <span className="text-sm text-muted-foreground">/ month</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Supercharged power tools for high-volume workflows and teams.
            </p>

            <ul className="mt-6 space-y-3 text-sm text-foreground/80">
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Unlimited file sizes & batch processing</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>OCR scanned document text recognition</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Priority dedicated processing queues</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>Direct cloud sync & batch download ZIP</span>
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <button
              disabled
              className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary/40 text-primary-foreground/80 px-4 py-2 text-sm font-semibold cursor-not-allowed"
            >
              Pro is coming soon
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
