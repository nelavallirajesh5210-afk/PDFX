import React from 'react';
import { ToolType } from '../types/pdf';
import { Search, Sparkles, Layers, Scissors, Minimize2, FileText, ArrowRight } from 'lucide-react';

interface HeroProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectTool: (tool: ToolType) => void;
}

export const Hero: React.FC<HeroProps> = ({ searchQuery, setSearchQuery, onSelectTool }) => {
  return (
    <section className="pt-12 pb-10 sm:pt-16 sm:pb-14 bg-gradient-to-b from-blue-50/50 via-white to-white border-b border-slate-150">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
        {/* Trust badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100/80 text-blue-700 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>100% Free & Secure Online PDF Suite</span>
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
          Every tool you need to work with PDFs in one place
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          Simple, fast, and secure PDF tools. 100% free and easy to use — no signup required.
        </p>

        {/* Search / Quick-Find Bar */}
        <div className="max-w-xl mx-auto pt-2">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              id="tool-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools (e.g., merge, compress, split, word...)"
              className="w-full pl-12 pr-4 py-3.5 text-sm sm:text-base bg-white border-2 border-slate-200 hover:border-blue-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 rounded-2xl shadow-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 px-2 py-1 text-xs font-semibold text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick action pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">🔥 Popular:</span>
            <button
              onClick={() => onSelectTool('merge')}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors font-medium cursor-pointer"
            >
              Merge PDF
            </button>
            <button
              onClick={() => onSelectTool('compress')}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors font-medium cursor-pointer"
            >
              Compress PDF
            </button>
            <button
              onClick={() => onSelectTool('pdf-to-word')}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors font-medium cursor-pointer"
            >
              PDF to Word
            </button>
            <button
              onClick={() => onSelectTool('split')}
              className="px-2.5 py-1 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-lg transition-colors font-medium cursor-pointer"
            >
              Split PDF
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
