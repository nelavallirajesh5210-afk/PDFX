import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ToolCards } from './components/ToolCards';
import { TrustHowItWorksFaq } from './components/TrustHowItWorksFaq';
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
import {
  Layers,
  Scissors,
  Minimize2,
  FileText,
  FileType,
  Image,
  FileImage,
  RotateCw,
  Trash2,
  Lock,
  Unlock,
} from 'lucide-react';

const VALID_TOOLS: ToolType[] = [
  'merge',
  'split',
  'compress',
  'pdf-to-word',
  'word-to-pdf',
  'jpg-to-pdf',
  'pdf-to-jpg',
  'rotate',
  'delete-pages',
  'extract-pages',
  'protect',
  'unlock',
];

const TOOL_SWITCHER: { id: ToolType; label: string; icon: React.ReactNode }[] = [
  { id: 'merge', label: 'Merge', icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'split', label: 'Split', icon: <Scissors className="w-3.5 h-3.5" /> },
  { id: 'compress', label: 'Compress', icon: <Minimize2 className="w-3.5 h-3.5" /> },
  { id: 'pdf-to-word', label: 'PDF to Word', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'word-to-pdf', label: 'Word to PDF', icon: <FileType className="w-3.5 h-3.5" /> },
  { id: 'jpg-to-pdf', label: 'JPG to PDF', icon: <Image className="w-3.5 h-3.5" /> },
  { id: 'pdf-to-jpg', label: 'PDF to JPG', icon: <FileImage className="w-3.5 h-3.5" /> },
  { id: 'rotate', label: 'Rotate', icon: <RotateCw className="w-3.5 h-3.5" /> },
  { id: 'delete-pages', label: 'Delete Pages', icon: <Trash2 className="w-3.5 h-3.5" /> },
  { id: 'extract-pages', label: 'Extract', icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'protect', label: 'Protect', icon: <Lock className="w-3.5 h-3.5" /> },
  { id: 'unlock', label: 'Unlock', icon: <Unlock className="w-3.5 h-3.5" /> },
];

export function App() {
  const [activeTool, setActiveTool] = useState<ToolType | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace('#', '');
      if (VALID_TOOLS.includes(rawHash as ToolType)) {
        setActiveTool(rawHash as ToolType);
      } else if (!rawHash || rawHash === 'all-tools' || rawHash === 'trust' || rawHash === 'faq') {
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
      window.location.hash = tool;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.history.pushState(null, '', window.location.pathname);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white antialiased">
      {/* Top Bar Navigation */}
      <Header activeTool={activeTool} onSelectTool={handleSelectTool} />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTool === null ? (
          // Homepage View
          <div>
            <Hero
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSelectTool={handleSelectTool}
            />
            <ToolCards
              searchQuery={searchQuery}
              onSelectTool={handleSelectTool}
            />
            <TrustHowItWorksFaq />
          </div>
        ) : (
          // Dedicated Tool View
          <div className="py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
            {/* Quick Tool Switcher Ribbon */}
            <div className="max-w-3xl mx-auto mb-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none max-w-full">
                <span className="text-xs font-semibold text-slate-500 shrink-0 hidden sm:inline">
                  Switch tool:
                </span>
                {TOOL_SWITCHER.map((item) => {
                  const isCurrent = activeTool === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectTool(item.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl transition-colors shrink-0 cursor-pointer ${
                        isCurrent
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-200'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Render Active Tool */}
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
              <PdfToWordTool
                onBack={() => handleSelectTool(null)}
              />
            )}
            {activeTool === 'word-to-pdf' && (
              <WordToPdfTool
                onBack={() => handleSelectTool(null)}
              />
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
              <ProtectTool
                onBack={() => handleSelectTool(null)}
              />
            )}
            {activeTool === 'unlock' && (
              <UnlockTool
                onBack={() => handleSelectTool(null)}
              />
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
