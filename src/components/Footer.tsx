import React from 'react';
import { ToolType } from '../types/pdf';
import { ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onSelectTool: (tool: ToolType | null) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTool }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-8">
          {/* Col 1: Brand */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-base">
                P
              </div>
              <span className="text-xl font-black tracking-tight text-white">PDFX</span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Every tool you need to work with PDFs in one place. 100% free, private, and secure in-memory processing.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero file retention • Automatic deletion</span>
            </div>
          </div>

          {/* Col 2: Organize */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Organize</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onSelectTool('merge')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Merge PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('split')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Split PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('rotate')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Rotate PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('delete-pages')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Delete Pages
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('extract-pages')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Extract Pages
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Convert */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Convert</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onSelectTool('pdf-to-word')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  PDF to Word
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('word-to-pdf')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Word to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('jpg-to-pdf')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  JPG to PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('pdf-to-jpg')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  PDF to JPG
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Security & Optimize */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Security & More</h4>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => onSelectTool('compress')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Compress PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('protect')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Protect PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('unlock')}
                  className="hover:text-white transition-colors cursor-pointer text-left"
                >
                  Unlock PDF
                </button>
              </li>
              <li>
                <a href="#faq" className="hover:text-white transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <p>© {new Date().getFullYear()} PDFX. All rights reserved. 100% Free & Open Document Utilities.</p>
          <div className="flex items-center gap-1">
            <span>Crafted for simple, private PDF workflows</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
