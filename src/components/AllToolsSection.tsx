import React, { useState, useMemo } from 'react';
import { Search, ArrowRight, X, Sparkles } from 'lucide-react';
import { TOOLS, ToolItem } from '../data/tools';
import { ToolType } from '../types/pdf';

interface AllToolsSectionProps {
  onSelectTool: (tool: ToolType) => void;
}

type CategoryFilter = 'All' | ToolItem['category'];

const CATEGORY_TABS: CategoryFilter[] = [
  'All',
  'Organize',
  'Compress',
  'Convert',
  'Security',
];

export const AllToolsSection: React.FC<AllToolsSectionProps> = ({ onSelectTool }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');

  const filteredTools = useMemo(() => {
    let list = TOOLS;
    if (selectedCategory !== 'All') {
      list = list.filter((t) => t.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, selectedCategory]);

  return (
    <section id="all-tools" className="border-t border-line/10 bg-mist/40 scroll-mt-14">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:py-16">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Complete Toolkit</span>
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              All PDF Tools
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-muted-foreground">
              Select any tool to start working immediately with your files.
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-80">
            <label className="relative block">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tools (e.g. merge, compress)..."
                className="h-11 w-full rounded-2xl border border-line/10 bg-mist pl-10 pr-9 text-sm shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab;
            return (
              <button
                key={tab}
                onClick={() => setSelectedCategory(tab)}
                className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-mist text-foreground/75 border border-line/10 hover:border-primary/30 hover:bg-primary-soft/50'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Tools Grid */}
        <div className="mt-8">
          {filteredTools.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.slug}
                    onClick={() => onSelectTool(tool.toolId)}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-line/10 bg-mist p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-primary/40 hover:-translate-y-0.5 transition-all text-left cursor-pointer w-full"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground shadow-2xs">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold text-foreground group-hover:text-primary transition-colors truncate">
                            {tool.name}
                          </p>
                          <span className="hidden sm:inline-block text-[10px] uppercase font-bold text-muted-foreground/70 bg-mist/90 px-1.5 py-0.5 rounded border border-line/5">
                            {tool.category}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">
                          {tool.description}
                        </p>
                      </div>
                    </div>

                    <ArrowRight className="h-4 w-4 text-primary shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-mist/60 rounded-3xl border border-line/10">
              <p className="text-sm font-medium text-muted-foreground">
                No tools found matching "{search}".
              </p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedCategory('All');
                }}
                className="mt-3 text-xs font-semibold text-primary hover:underline"
              >
                Reset filters and view all tools
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
