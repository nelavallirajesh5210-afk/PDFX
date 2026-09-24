import React from 'react';

const STEPS = [
  {
    number: '01',
    title: 'Choose a tool',
    description: 'Pick the task you need from our toolkit.',
  },
  {
    number: '02',
    title: 'Upload your file',
    description: 'Add files directly from your computer or phone.',
  },
  {
    number: '03',
    title: 'Download your result',
    description: 'Save the finished PDF instantly with one click.',
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-16 sm:py-20 scroll-mt-14">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Simple 3-step flow</p>
        <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-foreground">How it works</h2>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground">
          No signups, software downloads, or confusing settings. Just simple PDF tools that get the job done.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:gap-6 md:grid-cols-3">
        {STEPS.map((step) => (
          <div
            key={step.number}
            className="rounded-3xl border border-line/10 bg-mist p-7 sm:p-8 shadow-2xs hover:border-primary/30 hover:shadow-xs transition-all"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft font-head text-sm font-bold text-primary">
              {step.number}
            </span>
            <h3 className="mt-5 text-xl font-bold text-foreground">{step.title}</h3>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-muted-foreground">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};
