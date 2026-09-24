import React from 'react';
import { POPULAR_TOOLS, ToolItem } from '../data/tools';
import { ToolType } from '../types/pdf';
import { ArrowRight } from 'lucide-react';

interface PopularToolsProps {
  onSelectTool: (tool: ToolType) => void;
}

export const PopularTools: React.FC<PopularToolsProps> = ({ onSelectTool }) => {
  return (
    <section id="popular-tools" className="mx-auto max-w-6xl px-5 pt-4 pb-14 sm:pb-16">
      <h2 className="mb-6 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
        Popular PDF tools
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {POPULAR_TOOLS.map((tool: ToolItem) => {
          const IconComponent = tool.icon;
          return (
            <button
              key={tool.slug}
              onClick={() => onSelectTool(tool.toolId)}
              className="group relative rounded-3xl border border-line/10 bg-mist p-6 sm:p-7 shadow-xs ring-1 ring-line/5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md text-left cursor-pointer w-full flex flex-col justify-between"
            >
              <div>
                <span className="grid h-13 w-13 place-items-center rounded-2xl bg-primary-soft text-primary transition-all duration-200 group-hover:scale-105 group-hover:bg-primary group-hover:text-primary-foreground shadow-2xs">
                  <IconComponent className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {tool.name}
                </h3>
                <p className="mt-1.5 text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {tool.description}
                </p>
              </div>

              <div className="mt-5 flex items-center gap-1.5 text-xs font-semibold text-primary">
                <span>Try tool</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

