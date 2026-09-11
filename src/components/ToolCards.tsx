import React from 'react';
import { ToolType } from '../types/pdf';
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
  ArrowRight,
  Sparkles,
  Star,
} from 'lucide-react';

interface ToolCardsProps {
  searchQuery?: string;
  onSelectTool: (tool: ToolType) => void;
}

interface ToolDefinition {
  id: ToolType;
  title: string;
  description: string;
  category: 'organize' | 'optimize' | 'from-pdf' | 'to-pdf' | 'security';
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  popular?: boolean;
}

const TOOLS: ToolDefinition[] = [
  // Organize & Manage
  {
    id: 'merge',
    title: 'Merge PDF',
    description: 'Combine multiple PDFs into one document',
    category: 'organize',
    icon: Layers,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    popular: true,
  },
  {
    id: 'split',
    title: 'Split PDF',
    description: 'Separate one PDF into multiple files or pages',
    category: 'organize',
    icon: Scissors,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    popular: true,
  },
  {
    id: 'rotate',
    title: 'Rotate PDF',
    description: 'Turn pages 90, 180, or 270 degrees',
    category: 'organize',
    icon: RotateCw,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  {
    id: 'delete-pages',
    title: 'Delete Pages',
    description: 'Remove unwanted pages from your document',
    category: 'organize',
    icon: Trash2,
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
  {
    id: 'extract-pages',
    title: 'Extract Pages',
    description: 'Save only the pages you want as a new PDF',
    category: 'organize',
    icon: FileText,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },

  // Optimize
  {
    id: 'compress',
    title: 'Compress PDF',
    description: 'Reduce PDF file size while keeping good quality',
    category: 'optimize',
    icon: Minimize2,
    iconBg: 'bg-violet-50',
    iconColor: 'text-violet-600',
    popular: true,
  },

  // Convert from PDF
  {
    id: 'pdf-to-word',
    title: 'PDF to Word',
    description: 'Convert your PDF into an editable DOCX document',
    category: 'from-pdf',
    icon: FileText,
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-600',
    popular: true,
  },
  {
    id: 'pdf-to-jpg',
    title: 'PDF to JPG',
    description: 'Save PDF pages as high-quality images',
    category: 'from-pdf',
    icon: FileImage,
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
  },

  // Convert to PDF
  {
    id: 'word-to-pdf',
    title: 'Word to PDF',
    description: 'Make DOCX files into easy-to-read PDFs',
    category: 'to-pdf',
    icon: FileType,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
  {
    id: 'jpg-to-pdf',
    title: 'JPG to PDF',
    description: 'Turn photos and screenshots into a PDF',
    category: 'to-pdf',
    icon: Image,
    iconBg: 'bg-cyan-50',
    iconColor: 'text-cyan-600',
  },

  // Security
  {
    id: 'protect',
    title: 'Protect PDF',
    description: 'Add password encryption to keep your PDF safe',
    category: 'security',
    icon: Lock,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    id: 'unlock',
    title: 'Unlock PDF',
    description: 'Remove password protection from your PDF',
    category: 'security',
    icon: Unlock,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
];

const CATEGORIES = [
  { id: 'organize', title: 'Organize & Manage', subtitle: 'Merge, split, rotate, and reorganize pages' },
  { id: 'optimize', title: 'Optimize PDF', subtitle: 'Reduce file sizes for email and web' },
  { id: 'from-pdf', title: 'Convert from PDF', subtitle: 'Export your PDF to editable Word or images' },
  { id: 'to-pdf', title: 'Convert to PDF', subtitle: 'Turn documents and pictures into standard PDFs' },
  { id: 'security', title: 'Security & Privacy', subtitle: 'Lock or remove password protection' },
];

export const ToolCards: React.FC<ToolCardsProps> = ({ searchQuery = '', onSelectTool }) => {
  const query = searchQuery.trim().toLowerCase();

  const filteredTools = query
    ? TOOLS.filter(
        (tool) =>
          tool.title.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          tool.id.toLowerCase().includes(query)
      )
    : TOOLS;

  const popularTools = TOOLS.filter((t) => t.popular);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-16">
      {/* If search query is active, show flat filtered results */}
      {query ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              Search Results for "{searchQuery}"
            </h2>
            <span className="text-sm text-slate-500 font-medium">
              {filteredTools.length} {filteredTools.length === 1 ? 'tool found' : 'tools found'}
            </span>
          </div>

          {filteredTools.length === 0 ? (
            <div className="py-16 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-base font-semibold text-slate-700">No tools found matching "{searchQuery}"</p>
              <p className="text-sm text-slate-500 mt-1">Try searching for merge, split, compress, word, or images.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredTools.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <div
                    key={tool.id}
                    id={`tool-card-${tool.id}`}
                    onClick={() => onSelectTool(tool.id)}
                    className="group relative bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className={`w-12 h-12 rounded-xl ${tool.iconBg} ${tool.iconColor} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                        <IconComponent className="w-6 h-6 stroke-[2.2]" />
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {tool.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-2 flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                      <span>Open tool</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* Section 1: Popular Tools Highlighted */}
          <section id="popular-tools" className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Most Popular Tools
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Frequently used tools to quickly handle common everyday PDF tasks
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {popularTools.map((tool) => {
                const IconComponent = tool.icon;
                return (
                  <div
                    key={tool.id}
                    id={`popular-card-${tool.id}`}
                    onClick={() => onSelectTool(tool.id)}
                    className="group relative bg-white border-2 border-slate-200 hover:border-blue-600 rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className={`w-14 h-14 rounded-2xl ${tool.iconBg} ${tool.iconColor} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                          <IconComponent className="w-7 h-7 stroke-[2.2]" />
                        </div>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                          Popular
                        </span>
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {tool.title}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-6">
                      <button
                        type="button"
                        className="w-full py-2.5 px-4 bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-none group-hover:shadow-sm"
                      >
                        <span>Start Now</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 2: All PDF Tools By Category */}
          <section id="all-tools" className="space-y-12 pt-4">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                All PDF Tools
              </h2>
              <p className="text-sm text-slate-600">
                Browse every feature categorized by workflow for instant, one-click access
              </p>
            </div>

            <div className="space-y-10">
              {CATEGORIES.map((category) => {
                const categoryTools = TOOLS.filter((t) => t.category === category.id);
                return (
                  <div key={category.id} className="space-y-4">
                    <div className="border-b border-slate-200 pb-2">
                      <h3 className="text-lg font-bold text-slate-900">{category.title}</h3>
                      <p className="text-xs text-slate-500">{category.subtitle}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {categoryTools.map((tool) => {
                        const IconComponent = tool.icon;
                        return (
                          <div
                            key={tool.id}
                            id={`all-tools-card-${tool.id}`}
                            onClick={() => onSelectTool(tool.id)}
                            className="group bg-white border border-slate-200 hover:border-blue-500 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className={`w-11 h-11 rounded-xl ${tool.iconBg} ${tool.iconColor} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                                <IconComponent className="w-5 h-5 stroke-[2.2]" />
                              </div>

                              <div>
                                <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {tool.title}
                                </h4>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                  {tool.description}
                                </p>
                              </div>
                            </div>

                            <div className="pt-4 mt-2 flex items-center text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform">
                              <span>Open</span>
                              <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
};
