import React, { useState } from 'react';
import { ToolType } from '../types/pdf';
import {
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Layers,
  Scissors,
  Minimize2,
  FileText,
  FileType,
  Image,
  FileImage,
  Lock,
  RotateCw,
  Check,
} from 'lucide-react';

interface HeaderProps {
  activeTool: ToolType | null;
  onSelectTool: (tool: ToolType | null) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTool, onSelectTool }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [convertDropdownOpen, setConvertDropdownOpen] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const handleToolClick = (tool: ToolType) => {
    setMobileMenuOpen(false);
    setConvertDropdownOpen(false);
    onSelectTool(tool);
  };

  const handleAllToolsClick = () => {
    setMobileMenuOpen(false);
    setConvertDropdownOpen(false);
    if (activeTool !== null) {
      onSelectTool(null);
      setTimeout(() => {
        const el = document.getElementById('all-tools');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById('all-tools');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <button
              id="pdfx-brand-logo"
              onClick={() => {
                onSelectTool(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 group text-left cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-sm group-hover:bg-blue-700 transition-colors">
                P
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl text-slate-900 tracking-tight leading-none">
                  PDF<span className="text-blue-600">X</span>
                </span>
                <span className="text-[11px] font-medium text-slate-500 tracking-wide">
                  Simple PDF Tools
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-1">
              <button
                onClick={() => handleToolClick('merge')}
                className={`px-3 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeTool === 'merge'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                Merge
              </button>

              <button
                onClick={() => handleToolClick('split')}
                className={`px-3 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeTool === 'split'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                Split
              </button>

              <button
                onClick={() => handleToolClick('compress')}
                className={`px-3 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                  activeTool === 'compress'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                Compress
              </button>

              {/* Convert Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setConvertDropdownOpen(!convertDropdownOpen)}
                  className={`px-3 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1 ${
                    activeTool === 'pdf-to-word' ||
                    activeTool === 'word-to-pdf' ||
                    activeTool === 'jpg-to-pdf' ||
                    activeTool === 'pdf-to-jpg'
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  <span>Convert</span>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {convertDropdownOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2"
                    onMouseLeave={() => setConvertDropdownOpen(false)}
                  >
                    <button
                      onClick={() => handleToolClick('pdf-to-word')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 text-sky-600" />
                      <span>PDF to Word</span>
                    </button>
                    <button
                      onClick={() => handleToolClick('word-to-pdf')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors text-left"
                    >
                      <FileType className="w-4 h-4 text-indigo-600" />
                      <span>Word to PDF</span>
                    </button>
                    <button
                      onClick={() => handleToolClick('jpg-to-pdf')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors text-left"
                    >
                      <Image className="w-4 h-4 text-cyan-600" />
                      <span>JPG to PDF</span>
                    </button>
                    <button
                      onClick={() => handleToolClick('pdf-to-jpg')}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors text-left"
                    >
                      <FileImage className="w-4 h-4 text-teal-600" />
                      <span>PDF to JPG</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleAllToolsClick}
                className="px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              >
                All Tools
              </button>
            </nav>
          </div>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setShowPricingModal(true)}
              className="px-3.5 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Pricing
            </button>

            <button
              id="header-cta-btn"
              onClick={() => handleToolClick('merge')}
              className="px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Get Started</span>
            </button>
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => handleToolClick('merge')}
              className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg"
            >
              Start Free
            </button>
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="p-2 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-2 gap-2 pb-2">
              <button
                onClick={() => handleToolClick('merge')}
                className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-left text-sm font-bold text-slate-900 hover:bg-blue-50 hover:text-blue-600"
              >
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Merge PDF</span>
              </button>
              <button
                onClick={() => handleToolClick('split')}
                className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-left text-sm font-bold text-slate-900 hover:bg-blue-50 hover:text-blue-600"
              >
                <Scissors className="w-4 h-4 text-emerald-600" />
                <span>Split PDF</span>
              </button>
              <button
                onClick={() => handleToolClick('compress')}
                className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-left text-sm font-bold text-slate-900 hover:bg-blue-50 hover:text-blue-600"
              >
                <Minimize2 className="w-4 h-4 text-violet-600" />
                <span>Compress</span>
              </button>
              <button
                onClick={() => handleToolClick('pdf-to-word')}
                className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-left text-sm font-bold text-slate-900 hover:bg-blue-50 hover:text-blue-600"
              >
                <FileText className="w-4 h-4 text-sky-600" />
                <span>PDF to Word</span>
              </button>
            </div>

            <button
              onClick={handleAllToolsClick}
              className="w-full text-left px-3 py-2.5 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl"
            >
              Browse All 12 PDF Tools →
            </button>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-1">
              <span>100% Free • No Signup</span>
              <button onClick={() => setShowPricingModal(true)} className="text-blue-600 font-semibold">
                Pricing details
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative space-y-6">
            <button
              onClick={() => setShowPricingModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900">100% Free Forever</h3>
              <p className="text-sm text-slate-600">
                PDFX is a community utility designed to provide fast, private document tools without fees or subscriptions.
              </p>
            </div>

            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-2 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Unlimited operations every day</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>No watermarks or hidden limitations</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Up to 50MB file size support</span>
              </div>
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Complete memory-only privacy</span>
              </div>
            </div>

            <button
              onClick={() => setShowPricingModal(false)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
