import React from 'react';
import { Sparkles } from 'lucide-react';

export const Hero: React.FC = () => {
  return (
    <section className="mx-auto max-w-6xl px-5 pt-8 pb-4 sm:pt-14 sm:pb-6">
      {/* Badge matching screenshot */}
      <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-primary shadow-2xs">
        <Sparkles className="h-3.5 w-3.5 shrink-0" />
        <span>Free online PDF tools</span>
      </div>

      {/* Main Headline matching screenshot */}
      <h1 className="mt-5 text-4xl sm:text-5xl lg:text-[3.35rem] font-bold tracking-tight text-foreground leading-[1.12]">
        Everything you need<br className="hidden sm:inline" /> to work with PDFs.
      </h1>

      {/* Subtitle matching screenshot */}
      <p className="mt-3.5 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
        Merge, compress, split, convert and organize your PDF files — quickly and easily.
      </p>
    </section>
  );
};
