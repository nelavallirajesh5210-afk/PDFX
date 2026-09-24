import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { PopularTools } from './components/PopularTools';
import { AllToolsSection } from './components/AllToolsSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { TrustSection } from './components/TrustSection';
import { PricingSection } from './components/PricingSection';
import { Footer } from './components/Footer';

// Tool Components
import { MergeTool } from './components/MergeTool';
import { SplitTool } from './components/SplitTool';
import { CompressTool } from './components/CompressTool';
import { PdfToWordTool } from './components/PdfToWordTool';
import { WordToPdfTool } from './components/WordToPdfTool';
import { JpgToPdfTool } from './components/JpgToPdfTool';
import { PdfToJpgTool } from './components/PdfToJpgTool';
import { RotateTool } from './components/RotateTool';
import { DeletePagesTool } from './components/DeletePagesTool';
import { ExtractPagesTool } from './components/ExtractPagesTool';
import { ProtectTool } from './components/ProtectTool';
import { UnlockTool } from './components/UnlockTool';

import { ToolType } from './types/pdf';
import { TOOLS, getToolBySlugOrId } from './data/tools';

const SLUG_TO_TOOL: Record<string, ToolType> = {
  merge: 'merge',
  'merge-pdf': 'merge',
  split: 'split',
  'split-pdf': 'split',
  compress: 'compress',
  'compress-pdf': 'compress',
  'jpg-to-pdf': 'jpg-to-pdf',
  'pdf-to-jpg': 'pdf-to-jpg',
  rotate: 'rotate',
  'rotate-pdf': 'rotate',
  'delete-pages': 'delete-pages',
  'extract-pages': 'extract-pages',
  'pdf-to-word': 'pdf-to-word',
  'word-to-pdf': 'word-to-pdf',
  protect: 'protect',
  'protect-pdf': 'protect',
  unlock: 'unlock',
  'unlock-pdf': 'unlock',
};

export function App() {
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);

  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace('#', '').replace(/^\/+/, '');
      if (rawHash && SLUG_TO_TOOL[rawHash]) {
        setActiveTool(SLUG_TO_TOOL[rawHash]);
      } else if (
        !rawHash ||
        rawHash === 'all-tools' ||
        rawHash === 'how-it-works' ||
        rawHash === 'pricing'
      ) {
        setActiveTool(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTool = (tool: ToolType | null) => {
    setActiveTool(tool);
    if (tool) {
      const toolDef = TOOLS.find((t) => t.toolId === tool);
      window.location.hash = toolDef ? toolDef.slug : tool;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.history.pushState(null, '', window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary selection:text-primary-foreground antialiased font-sans">
      {/* Sticky Header Navigation */}
      <Header
        activeTool={activeTool}
        onSelectTool={handleSelectTool}
      />

      {/* Main Body */}
      <main className="flex-1">
        {activeTool === null ? (
          /* Homepage Layout Matching Lovable PDFX */
          <div>
            <Hero />
            <PopularTools onSelectTool={handleSelectTool} />
            <AllToolsSection onSelectTool={handleSelectTool} />
            <HowItWorksSection />
            <TrustSection />
            <PricingSection onSelectTool={() => handleSelectTool(null)} />
          </div>
        ) : (
          /* Dedicated Tool Workspace */
          <div className="w-full">
            {/* Quick Switcher Ribbon */}
            <div className="border-b border-line/10 bg-mist/80 py-2.5 px-5">
              <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none max-w-full">
                  <button
                    onClick={() => handleSelectTool(null)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-full bg-mist hover:bg-primary-soft text-foreground/80 border border-line/10 transition-colors shrink-0 cursor-pointer mr-1"
                  >
                    <span>← All tools</span>
                  </button>
                  <span className="text-xs font-semibold text-muted-foreground shrink-0 hidden sm:inline mr-1">
                    Quick switch:
                  </span>
                  {TOOLS.map((t) => {
                    const isCurrent = activeTool === t.toolId;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.slug}
                        onClick={() => handleSelectTool(t.toolId)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full transition-all shrink-0 cursor-pointer ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                            : 'bg-mist hover:bg-primary-soft/60 text-foreground/80 border border-line/10'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tool Renderers */}
            {activeTool === 'merge' && (
              <MergeTool
                onBack={() => handleSelectTool(null)}
                onNavigateToAllTools={() => handleSelectTool(null)}
              />
            )}
            {activeTool === 'split' && (
              <SplitTool
                onBack={() => handleSelectTool(null)}
                onNavigateToAllTools={() => handleSelectTool(null)}
              />
            )}
            {activeTool === 'compress' && (
              <CompressTool
                onBack={() => handleSelectTool(null)}
                onNavigateToAllTools={() => handleSelectTool(null)}
              />
            )}
            {activeTool === 'pdf-to-word' && (
              <PdfToWordTool onBack={() => handleSelectTool(null)} />
            )}
            {activeTool === 'word-to-pdf' && (
              <WordToPdfTool onBack={() => handleSelectTool(null)} />
            )}
            {activeTool === 'jpg-to-pdf' && (
              <JpgToPdfTool
                onBack={() => handleSelectTool(null)}
                onNavigateToAllTools={() => handleSelectTool(null)}
              />
            )}
            {activeTool === 'pdf-to-jpg' && (
              <PdfToJpgTool
                onBack={() => handleSelectTool(null)}
                onNavigateToAllTools={() => handleSelectTool(null)}
              />
            )}
            {activeTool === 'rotate' && (
              <RotateTool
                onBack={() => handleSelectTool(null)}
                onNavigateToAllTools={() => handleSelectTool(null)}
              />
            )}
            {activeTool === 'delete-pages' && (
              <DeletePagesTool
                onBack={() => handleSelectTool(null)}
                onNavigateToAllTools={() => handleSelectTool(null)}
              />
            )}
            {activeTool === 'extract-pages' && (
              <ExtractPagesTool
                onBack={() => handleSelectTool(null)}
                onNavigateToAllTools={() => handleSelectTool(null)}
              />
            )}
            {activeTool === 'protect' && (
              <ProtectTool onBack={() => handleSelectTool(null)} />
            )}
            {activeTool === 'unlock' && (
              <UnlockTool onBack={() => handleSelectTool(null)} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer onSelectTool={handleSelectTool} />
    </div>
  );
}

export default App;
