import React from 'react';
import {
  Combine,
  FileArchive,
  Scissors,
  Images,
  Image,
  RotateCw,
  FileMinus2,
  FileOutput,
  FileText,
  FileInput,
  Lock,
  Unlock,
} from 'lucide-react';
import { ToolType } from '../types/pdf';

export interface ToolItem {
  slug: string;
  toolId: ToolType;
  name: string;
  description: string;
  category: 'Organize' | 'Compress' | 'Convert' | 'Security';
  icon: React.ComponentType<{ className?: string }>;
  multiple?: boolean;
}

export const TOOLS: ToolItem[] = [
  {
    slug: 'merge-pdf',
    toolId: 'merge',
    name: 'Merge PDF',
    description: 'Combine multiple PDFs into one.',
    category: 'Organize',
    icon: Combine,
    multiple: true,
  },
  {
    slug: 'compress-pdf',
    toolId: 'compress',
    name: 'Compress PDF',
    description: 'Reduce PDF file size.',
    category: 'Compress',
    icon: FileArchive,
  },
  {
    slug: 'split-pdf',
    toolId: 'split',
    name: 'Split PDF',
    description: 'Separate PDF pages.',
    category: 'Organize',
    icon: Scissors,
  },
  {
    slug: 'jpg-to-pdf',
    toolId: 'jpg-to-pdf',
    name: 'JPG to PDF',
    description: 'Convert images into PDF.',
    category: 'Convert',
    icon: Images,
    multiple: true,
  },
  {
    slug: 'pdf-to-jpg',
    toolId: 'pdf-to-jpg',
    name: 'PDF to JPG',
    description: 'Convert PDF pages into images.',
    category: 'Convert',
    icon: Image,
  },
  {
    slug: 'rotate-pdf',
    toolId: 'rotate',
    name: 'Rotate PDF',
    description: 'Rotate PDF pages easily.',
    category: 'Organize',
    icon: RotateCw,
  },
  {
    slug: 'delete-pages',
    toolId: 'delete-pages',
    name: 'Delete Pages',
    description: "Remove pages you don't need.",
    category: 'Organize',
    icon: FileMinus2,
  },
  {
    slug: 'extract-pages',
    toolId: 'extract-pages',
    name: 'Extract Pages',
    description: 'Save selected pages separately.',
    category: 'Organize',
    icon: FileOutput,
  },
  {
    slug: 'pdf-to-word',
    toolId: 'pdf-to-word',
    name: 'PDF to Word',
    description: 'Turn PDFs into editable documents.',
    category: 'Convert',
    icon: FileText,
  },
  {
    slug: 'word-to-pdf',
    toolId: 'word-to-pdf',
    name: 'Word to PDF',
    description: 'Create a PDF from Word.',
    category: 'Convert',
    icon: FileInput,
  },
  {
    slug: 'protect-pdf',
    toolId: 'protect',
    name: 'Protect PDF',
    description: 'Add password protection.',
    category: 'Security',
    icon: Lock,
  },
  {
    slug: 'unlock-pdf',
    toolId: 'unlock',
    name: 'Unlock PDF',
    description: 'Remove a known PDF password.',
    category: 'Security',
    icon: Unlock,
  },
];

export const POPULAR_TOOLS = TOOLS.slice(0, 6);

export function getToolBySlugOrId(identifier: string): ToolItem | undefined {
  return TOOLS.find((t) => t.slug === identifier || t.toolId === identifier);
}
