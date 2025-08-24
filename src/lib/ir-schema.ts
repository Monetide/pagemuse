/**
 * Intermediate Representation (IR) Schema
 * Single source of truth for document structure
 */

// Core Document Structure
export interface DocumentIR {
  title: string;
  sections: SectionIR[];
  metadata?: DocumentMetadata;
}

export interface SectionIR {
  title?: string;
  blocks: BlockIR[];
  id?: string;
  notes?: any[];
}

// Document Metadata
export interface DocumentMetadata {
  title?: string;
  author?: string;
  createdAt?: string;
  modifiedAt?: string;
  language?: string;
  wordCount?: number;
}

// Block Types Union
export type BlockIR = 
  | HeadingBlock
  | ParagraphBlock
  | ListBlock
  | QuoteBlock
  | CalloutBlock
  | FigureBlock
  | TableBlock
  | DividerBlock
  | FootnoteBlock;

// Heading Block (h1-h6)
export interface HeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  content: string;
  id?: string;
  attrs?: any;
}

// Paragraph Block
export interface ParagraphBlock {
  type: 'paragraph';
  content: string;
  formatting?: TextFormatting[];
  attrs?: any;
}

// List Block (ordered/unordered)
export interface ListBlock {
  type: 'list';
  listType: 'ol' | 'ul';
  items: ListItem[];
  level?: number;
  content?: string;
  attrs?: any;
}

export interface ListItem {
  content: string;
  formatting?: TextFormatting[];
  nestedList?: ListBlock;
}

// Quote Block
export interface QuoteBlock {
  type: 'quote';
  content: string;
  author?: string;
  source?: string;
  attrs?: any;
}

// Callout Block
export interface CalloutBlock {
  type: 'callout';
  calloutType: 'info' | 'warning' | 'error' | 'success' | 'note' | 'tip';
  title?: string;
  content: string;
  attrs?: any;
}

// Figure Block (images, diagrams, etc.)
export interface FigureBlock {
  type: 'figure';
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  content?: string;
  attrs?: any;
}

// Table Block
export interface TableBlock {
  type: 'table';
  header: string[];
  rows: string[][];
  caption?: string;
  content?: string;
  attrs?: any;
}

// Divider Block
export interface DividerBlock {
  type: 'divider';
  style?: 'solid' | 'dashed' | 'dotted';
  content?: string;
  attrs?: any;
}

// Footnote Block
export interface FootnoteBlock {
  type: 'footnote';
  marker: string | number;
  text: string;
  id?: string;
  content?: string;
  attrs?: any;
}

// Text Formatting
export interface TextFormatting {
  start: number;
  end: number;
  type: 'bold' | 'italic' | 'underline' | 'strikethrough' | 'code' | 'link';
  value?: string; // For links, this would be the URL
}

// Utility Types
export type BlockType = BlockIR['type'];

export const BLOCK_TYPES: BlockType[] = [
  'heading',
  'paragraph', 
  'list',
  'quote',
  'callout',
  'figure',
  'table',
  'divider',
  'footnote'
] as const;

export const HEADING_LEVELS = [1, 2, 3, 4, 5, 6] as const;
export const LIST_TYPES = ['ol', 'ul'] as const;
export const CALLOUT_TYPES = ['info', 'warning', 'error', 'success', 'note', 'tip'] as const;
export const TEXT_FORMATTING_TYPES = ['bold', 'italic', 'underline', 'strikethrough', 'code', 'link'] as const;

// Type Guards
export const isHeadingBlock = (block: BlockIR): block is HeadingBlock => block.type === 'heading';
export const isParagraphBlock = (block: BlockIR): block is ParagraphBlock => block.type === 'paragraph';
export const isListBlock = (block: BlockIR): block is ListBlock => block.type === 'list';
export const isQuoteBlock = (block: BlockIR): block is QuoteBlock => block.type === 'quote';
export const isCalloutBlock = (block: BlockIR): block is CalloutBlock => block.type === 'callout';
export const isFigureBlock = (block: BlockIR): block is FigureBlock => block.type === 'figure';
export const isTableBlock = (block: BlockIR): block is TableBlock => block.type === 'table';
export const isDividerBlock = (block: BlockIR): block is DividerBlock => block.type === 'divider';
export const isFootnoteBlock = (block: BlockIR): block is FootnoteBlock => block.type === 'footnote';

// Schema Validation Helpers
export const validateDocumentIR = (doc: any): doc is DocumentIR => {
  return (
    typeof doc === 'object' &&
    doc !== null &&
    Array.isArray(doc.sections) &&
    doc.sections.every(validateSectionIR)
  );
};

export const validateSectionIR = (section: any): section is SectionIR => {
  return (
    typeof section === 'object' &&
    section !== null &&
    Array.isArray(section.blocks) &&
    section.blocks.every(validateBlockIR) &&
    (section.title === undefined || typeof section.title === 'string')
  );
};

export const validateBlockIR = (block: any): block is BlockIR => {
  if (typeof block !== 'object' || block === null || typeof block.type !== 'string') {
    return false;
  }

  switch (block.type) {
    case 'heading':
      return typeof block.content === 'string' && 
             typeof block.level === 'number' && 
             block.level >= 1 && block.level <= 6;
    case 'paragraph':
      return typeof block.content === 'string';
    case 'list':
      return (block.listType === 'ol' || block.listType === 'ul') &&
             Array.isArray(block.items);
    case 'quote':
      return typeof block.content === 'string';
    case 'callout':
      return typeof block.content === 'string' &&
             CALLOUT_TYPES.includes(block.calloutType);
    case 'figure':
      return typeof block.src === 'string';
    case 'table':
      return Array.isArray(block.header) && Array.isArray(block.rows);
    case 'divider':
      return true;
    case 'footnote':
      return typeof block.text === 'string' && 
             (typeof block.marker === 'string' || typeof block.marker === 'number');
    default:
      return false;
  }
};

// Example Document
export const EXAMPLE_DOCUMENT_IR: DocumentIR = {
  metadata: {
    title: "Sample Document",
    author: "System",
    createdAt: new Date().toISOString(),
    language: "en"
  },
  sections: [
    {
      title: "Introduction",
      blocks: [
        {
          type: 'heading',
          level: 1,
          content: "Welcome to the IR Schema"
        },
        {
          type: 'paragraph',
          content: "This document demonstrates the Intermediate Representation schema."
        },
        {
          type: 'callout',
          calloutType: 'info',
          title: "Important Note",
          content: "This is a callout block for important information."
        }
      ]
    },
    {
      title: "Content Examples",
      blocks: [
        {
          type: 'heading',
          level: 2,
          content: "Different Block Types"
        },
        {
          type: 'list',
          listType: 'ul',
          items: [
            { content: "Heading blocks (h1-h6)" },
            { content: "Paragraph blocks with text" },
            { content: "List blocks (ordered and unordered)" },
            { content: "Quote blocks for citations" },
            { content: "Callout blocks for emphasis" }
          ]
        },
        {
          type: 'quote',
          content: "The best way to predict the future is to create it.",
          author: "Peter Drucker"
        },
        {
          type: 'divider'
        },
        {
          type: 'table',
          header: ['Block Type', 'Purpose', 'Required Fields'],
          rows: [
            ['heading', 'Section titles', 'level, content'],
            ['paragraph', 'Body text', 'content'],
            ['list', 'Ordered/unordered items', 'listType, items']
          ]
        }
      ]
    }
  ]
};