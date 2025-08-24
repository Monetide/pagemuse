import { 
  DocumentIR, 
  SectionIR, 
  BlockIR, 
  HeadingBlock, 
  ParagraphBlock, 
  ListBlock, 
  TableBlock, 
  FigureBlock,
  QuoteBlock,
  DividerBlock,
  ListItem
} from './ir-schema';

import { 
  IRDocument as LegacyIRDocument,
  IRSection as LegacyIRSection,
  IRBlock as LegacyIRBlock,
  IRHeading,
  IRList,
  IRTable,
  IRFigure,
  IRCallout,
  IRQuote,
  IRAssetRef
} from './ir-types'

/**
 * Ingest Pipeline: Convert various text formats to IR
 */
export interface IngestOptions {
  preserveFormatting?: boolean;
  extractImages?: boolean;
  extractTables?: boolean;
  coalesceConsecutiveParagraphs?: boolean;
  // Legacy alias accepted for backward compatibility
  mergeShortParagraphs?: boolean;
  generateAnchors?: boolean;
  extractAssets?: boolean;
}

export const DEFAULT_INGEST_OPTIONS: IngestOptions = {
  preserveFormatting: false,
  extractImages: true,
  extractTables: true,
  coalesceConsecutiveParagraphs: true,
  generateAnchors: false,
  extractAssets: false
};

// Main ingest function
export function ingestToIR(
  content: string, 
  format: 'paste' | 'txt' | 'markdown' | 'html',
  options: IngestOptions = DEFAULT_INGEST_OPTIONS
): DocumentIR {
  // Normalize options (support legacy alias)
  const effectiveOptions: IngestOptions = {
    ...DEFAULT_INGEST_OPTIONS,
    ...options
  }
  if (options && typeof options.mergeShortParagraphs === 'boolean') {
    effectiveOptions.coalesceConsecutiveParagraphs = options.mergeShortParagraphs
  }

  let blocks: BlockIR[] = [];

  switch (format) {
    case 'paste':
    case 'txt':
      blocks = parsePlainText(content, effectiveOptions);
      break;
    case 'markdown':
      blocks = parseMarkdown(content, effectiveOptions);
      break;
    case 'html':
      blocks = parseHTML(content, effectiveOptions);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }

  // Post-process blocks
  blocks = postProcessBlocks(blocks, effectiveOptions);

  // Organize into sections
  const sections = organizeSections(blocks);

  return {
    title: 'Imported Document',
    sections,
    metadata: {
      createdAt: new Date().toISOString(),
      wordCount: calculateWordCount(blocks)
    }
  };
}

// Plain text parser
function parsePlainText(content: string, options: IngestOptions): BlockIR[] {
  const lines = content.split('\n');
  const blocks: BlockIR[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === '') {
      continue; // Skip empty lines
    }
    
    // Check for simple heading patterns (lines with only # or = or -)
    if (isSimpleHeading(trimmed)) {
      blocks.push({
        type: 'heading',
        level: getHeadingLevel(trimmed),
        content: cleanText(trimmed.replace(/^#+\s*/, ''))
      } as HeadingBlock);
    } else {
      blocks.push({
        type: 'paragraph',
        content: cleanText(trimmed)
      } as ParagraphBlock);
    }
  }
  
  return blocks;
}

// Markdown parser
function parseMarkdown(content: string, options: IngestOptions): BlockIR[] {
  const lines = content.split('\n');
  const blocks: BlockIR[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (line === '') {
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('#')) {
      const level = Math.min(line.match(/^#+/)?.[0].length || 1, 6) as 1 | 2 | 3 | 4 | 5 | 6;
      const content = line.replace(/^#+\s*/, '').replace(/\s*#+\s*$/, ''); // Remove trailing #
      blocks.push({
        type: 'heading',
        level,
        content: cleanText(content)
      } as HeadingBlock);
      i++;
    }
    // Horizontal rules / dividers
    else if (/^[-*_]{3,}\s*$/.test(line)) {
      blocks.push({
        type: 'divider'
      } as DividerBlock);
      i++;
    }
    // Tables (GFM style)
    else if (line.includes('|') && options.extractTables) {
      const tableResult = parseMarkdownTable(lines, i);
      if (tableResult.table) {
        blocks.push(tableResult.table);
      }
      i = tableResult.nextIndex;
    }
    // Unordered lists
    else if (/^[-*+]\s/.test(line)) {
      const listResult = parseMarkdownList(lines, i, 'ul');
      blocks.push(listResult.list);
      i = listResult.nextIndex;
    }
    // Ordered lists
    else if (/^\d+\.\s/.test(line)) {
      const listResult = parseMarkdownList(lines, i, 'ol');
      blocks.push(listResult.list);
      i = listResult.nextIndex;
    }
    // Blockquotes
    else if (line.startsWith('>')) {
      const quoteResult = parseMarkdownQuote(lines, i);
      blocks.push(quoteResult.quote);
      i = quoteResult.nextIndex;
    }
    // Images
    else if (line.match(/!\[([^\]]*)\]\(([^)]+)\)/) && options.extractImages) {
      const match = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (match) {
        blocks.push({
          type: 'figure',
          src: match[2],
          alt: match[1] || undefined,
          caption: match[1] || undefined
        } as FigureBlock);
      }
      i++;
    }
    // Regular paragraphs
    else {
      // Handle inline images within paragraphs
      const processedContent = options.extractImages 
        ? extractInlineImages(line, blocks)
        : cleanText(line);
      
      if (processedContent.trim()) {
        blocks.push({
          type: 'paragraph',
          content: processedContent
        } as ParagraphBlock);
      }
      i++;
    }
  }

  return blocks;
}

// HTML parser
function parseHTML(content: string, options: IngestOptions): BlockIR[] {
  const blocks: BlockIR[] = [];
  
  // Create a temporary DOM element to parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  
  // Process each child node
  const processNode = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        blocks.push({
          type: 'paragraph',
          content: cleanText(text)
        } as ParagraphBlock);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      
      switch (tagName) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          blocks.push({
            type: 'heading',
            level: parseInt(tagName.charAt(1)) as 1 | 2 | 3 | 4 | 5 | 6,
            content: cleanText(element.textContent || '')
          } as HeadingBlock);
          break;
          
        case 'p':
          const pContent = extractLinksFromElement(element);
          if (pContent.trim()) {
            blocks.push({
              type: 'paragraph',
              content: pContent
            } as ParagraphBlock);
          }
          break;
          
        case 'ul':
        case 'ol':
          const items: ListItem[] = [];
          element.querySelectorAll('li').forEach(li => {
            items.push({
              content: cleanText(li.textContent || '')
            });
          });
          blocks.push({
            type: 'list',
            listType: tagName as 'ul' | 'ol',
            items
          } as ListBlock);
          break;
          
        case 'table':
          if (options.extractTables) {
            const table = parseHTMLTable(element);
            if (table) {
              blocks.push(table);
            }
          }
          break;
          
        case 'img':
          if (options.extractImages) {
            blocks.push({
              type: 'figure',
              src: element.getAttribute('src') || '',
              alt: element.getAttribute('alt') || undefined
            } as FigureBlock);
          }
          break;
          
        case 'blockquote':
          blocks.push({
            type: 'quote',
            content: cleanText(element.textContent || '')
          } as QuoteBlock);
          break;
          
        case 'hr':
          blocks.push({
            type: 'divider'
          } as DividerBlock);
          break;
          
        default:
          // Process child nodes for other elements
          Array.from(element.childNodes).forEach(processNode);
          break;
      }
    }
  };
  
  Array.from(doc.body.childNodes).forEach(processNode);
  return blocks;
}

// Helper functions
function isSimpleHeading(line: string): boolean {
  return /^#+\s/.test(line) || /^[=-]{3,}\s*$/.test(line);
}

function getHeadingLevel(line: string): 1 | 2 | 3 | 4 | 5 | 6 {
  if (line.startsWith('#')) {
    return Math.min(line.match(/^#+/)?.[0].length || 1, 6) as 1 | 2 | 3 | 4 | 5 | 6;
  }
  return 1; // Default for underline style headings
}

function cleanText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
    .replace(/\*(.*?)\*/g, '$1') // Remove italic
    .replace(/__(.*?)__/g, '$1') // Remove bold
    .replace(/_(.*?)_/g, '$1') // Remove italic
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/~~(.*?)~~/g, '$1') // Remove strikethrough
    .trim();
}

function extractLinksFromElement(element: Element): string {
  let text = '';
  for (const node of Array.from(element.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (el.tagName.toLowerCase() === 'a') {
        text += el.textContent; // Keep link text, strip href for now
      } else {
        text += el.textContent;
      }
    }
  }
  return cleanText(text);
}

function parseMarkdownTable(lines: string[], startIndex: number): { table: TableBlock | null; nextIndex: number } {
  const tableLines: string[] = [];
  let i = startIndex;
  
  // Collect table lines
  while (i < lines.length && lines[i].includes('|')) {
    tableLines.push(lines[i].trim());
    i++;
  }
  
  if (tableLines.length < 2) {
    return { table: null, nextIndex: i };
  }
  
  // Parse header
  const headerCells = tableLines[0].split('|').map(cell => cleanText(cell.trim())).filter(cell => cell);
  
  // Skip separator line (if exists)
  let dataStartIndex = 1;
  if (tableLines[1] && /^[\s\|:-]+$/.test(tableLines[1])) {
    dataStartIndex = 2;
  }
  
  // Parse rows
  const rows: string[][] = [];
  for (let j = dataStartIndex; j < tableLines.length; j++) {
    const cells = tableLines[j].split('|').map(cell => cleanText(cell.trim())).filter(cell => cell);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  
  return {
    table: {
      type: 'table',
      header: headerCells,
      rows
    } as TableBlock,
    nextIndex: i
  };
}

function parseMarkdownList(lines: string[], startIndex: number, listType: 'ul' | 'ol'): { list: ListBlock; nextIndex: number } {
  const items: ListItem[] = [];
  let i = startIndex;
  
  const listRegex = listType === 'ul' ? /^[-*+]\s/ : /^\d+\.\s/;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (line === '') {
      i++;
      continue;
    }
    
    if (listRegex.test(line)) {
      const content = line.replace(listRegex, '');
      items.push({
        content: cleanText(content)
      });
      i++;
    } else {
      break;
    }
  }
  
  return {
    list: {
      type: 'list',
      listType,
      items
    } as ListBlock,
    nextIndex: i
  };
}

function parseMarkdownQuote(lines: string[], startIndex: number): { quote: QuoteBlock; nextIndex: number } {
  const quoteLines: string[] = [];
  let i = startIndex;
  
  while (i < lines.length && lines[i].trim().startsWith('>')) {
    quoteLines.push(lines[i].trim().replace(/^>\s?/, ''));
    i++;
  }
  
  return {
    quote: {
      type: 'quote',
      content: cleanText(quoteLines.join(' '))
    } as QuoteBlock,
    nextIndex: i
  };
}

function parseHTMLTable(tableElement: Element): TableBlock | null {
  const thead = tableElement.querySelector('thead');
  const tbody = tableElement.querySelector('tbody') || tableElement;
  
  // Get headers
  const headerCells = Array.from(thead?.querySelectorAll('th') || tableElement.querySelectorAll('tr:first-child th, tr:first-child td'))
    .map(cell => cleanText(cell.textContent || ''));
  
  if (headerCells.length === 0) return null;
  
  // Get rows
  const rows: string[][] = [];
  const dataRows = Array.from(tbody.querySelectorAll('tr'));
  
  // Skip first row if it was used for headers
  const startRow = thead ? 0 : 1;
  
  for (let i = startRow; i < dataRows.length; i++) {
    const cells = Array.from(dataRows[i].querySelectorAll('td, th'))
      .map(cell => cleanText(cell.textContent || ''));
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  
  return {
    type: 'table',
    header: headerCells,
    rows
  };
}

function extractInlineImages(content: string, blocks: BlockIR[]): string {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let text = content;
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    blocks.push({
      type: 'figure',
      src: match[2],
      alt: match[1] || undefined,
      caption: match[1] || undefined
    } as FigureBlock);
    
    text = text.replace(match[0], ''); // Remove image from text
  }
  
  return cleanText(text);
}

function postProcessBlocks(blocks: BlockIR[], options: IngestOptions): BlockIR[] {
  if (!options.coalesceConsecutiveParagraphs) {
    return blocks;
  }
  
  const processedBlocks: BlockIR[] = [];
  let currentParagraph: string | null = null;
  
  for (const block of blocks) {
    if (block.type === 'paragraph') {
      if (currentParagraph) {
        currentParagraph += ' ' + block.content;
      } else {
        currentParagraph = block.content;
      }
    } else {
      // Flush current paragraph if exists
      if (currentParagraph) {
        processedBlocks.push({
          type: 'paragraph',
          content: currentParagraph
        } as ParagraphBlock);
        currentParagraph = null;
      }
      processedBlocks.push(block);
    }
  }
  
  // Flush final paragraph if exists
  if (currentParagraph) {
    processedBlocks.push({
      type: 'paragraph',
      content: currentParagraph
    } as ParagraphBlock);
  }
  
  return processedBlocks;
}

function organizeSections(blocks: BlockIR[]): SectionIR[] {
  const sections: SectionIR[] = [];
  let currentSection: SectionIR = { 
    id: 'section-0',
    blocks: [] 
  };
  let sectionCounter = 0;
  
  for (const block of blocks) {
    if (block.type === 'heading' && block.level === 1) {
      // Start a new section
      if (currentSection.blocks.length > 0) {
        sections.push(currentSection);
      }
      sectionCounter++;
      currentSection = {
        id: `section-${sectionCounter}`,
        title: block.content,
        blocks: [block],
        order: sectionCounter
      };
    } else {
      currentSection.blocks.push(block);
    }
  }
  
  // Add final section
  if (currentSection.blocks.length > 0) {
    sections.push(currentSection);
  }
  
  // If no sections were created (no h1), create a single section
  if (sections.length === 0 && blocks.length > 0) {
    sections.push({ 
      id: 'section-main',
      blocks,
      order: 0
    });
  }
  
  return sections;
}

function calculateWordCount(blocks: BlockIR[]): number {
  let wordCount = 0;
  
  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
      case 'paragraph':
      case 'quote':
        wordCount += block.content.split(/\s+/).filter(word => word.length > 0).length;
        break;
      case 'list':
        for (const item of block.items) {
          wordCount += item.content.split(/\s+/).filter(word => word.length > 0).length;
        }
        break;
      case 'table':
        // Count words in headers
        for (const header of block.header) {
          wordCount += header.split(/\s+/).filter(word => word.length > 0).length;
        }
        // Count words in rows
        for (const row of block.rows) {
          for (const cell of row) {
            wordCount += cell.split(/\s+/).filter(word => word.length > 0).length;
          }
        }
        break;
      case 'callout':
        wordCount += (block.title?.split(/\s+/).filter(word => word.length > 0).length || 0);
        wordCount += block.content.split(/\s+/).filter(word => word.length > 0).length;
        break;
      case 'footnote':
        wordCount += block.text.split(/\s+/).filter(word => word.length > 0).length;
        break;
    }
  }
  
  return wordCount;
}

// Example test data
export const MARKDOWN_WITH_TABLE_AND_IMAGE = `# Sample Document

This is a paragraph with some **bold** and *italic* text.

## Features Table

| Feature | Status | Description |
|---------|--------|-------------|
| Parsing | ✅ | Markdown to IR conversion |
| Tables | ✅ | GFM table support |
| Images | ✅ | Image extraction |

![Sample Image](https://example.com/image.jpg "A sample image")

### List Example

- Item 1
- Item 2
- Item 3

> This is a blockquote with some important information.

---

1. First ordered item
2. Second ordered item
3. Third ordered item`;

// Test the parser
export function testMarkdownParser(): DocumentIR {
  return ingestToIR(MARKDOWN_WITH_TABLE_AND_IMAGE, 'markdown');
}

// Backward compatibility exports
export class IngestPipeline {
  static async ingest(content: string, format: 'paste' | 'txt' | 'markdown' | 'html' = 'txt', options?: IngestOptions): Promise<DocumentIR> {
    return ingestToIR(content, format, options);
  }
  
  static async processFile(file: File, options?: IngestOptions): Promise<DocumentIR> {
    return ingestFile(file, options);
  }
}

export async function ingestFile(file: File, options?: IngestOptions): Promise<DocumentIR> {
  const text = await file.text();
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  let format: 'paste' | 'txt' | 'markdown' | 'html' = 'txt';
  if (extension === 'md') format = 'markdown';
  if (extension === 'html' || extension === 'htm') format = 'html';
  
  return ingestToIR(text, format, options);
}

// Legacy types for backward compatibility (IRDocument)
export interface IRDocument {
  title?: string;
  sections: IRSection[];
  [key: string]: any;
}

export interface IRSection {
  id: string;
  title?: string;
  blocks: IRBlock[];
  notes?: any[];
  order?: number;
  [key: string]: any;
}

export interface IRBlock {
  type: string;
  content?: string | null;
  attrs?: any;
  order?: number;
  [key: string]: any;
}

// Convert new IR to legacy format
export function convertToLegacyIR(documentIR: DocumentIR): IRDocument {
  return {
    title: documentIR.title || documentIR.metadata?.title || 'Untitled',
    sections: documentIR.sections.map((section, index) => ({
      id: section.id || `section-${index}`,
      title: section.title,
      order: section.order || index,
      blocks: section.blocks.map((block, blockIndex) => {
        const legacyBlock: IRBlock = {
          type: block.type,
          order: blockIndex
        };
        
        switch (block.type) {
          case 'heading':
            legacyBlock.content = block.content;
            legacyBlock.attrs = { level: block.level };
            break;
          case 'paragraph':
          case 'quote':
            legacyBlock.content = block.content;
            break;
          case 'list':
            legacyBlock.content = block.items.map(item => item.content).join('\n');
            legacyBlock.attrs = { listType: block.listType };
            break;
          case 'table':
            legacyBlock.content = block.header.join('|') + '\n' + 
              block.rows.map(row => row.join('|')).join('\n');
            break;
          case 'figure':
            legacyBlock.content = block.alt || '';
            legacyBlock.attrs = { src: block.src, alt: block.alt };
            break;
          case 'callout':
            legacyBlock.content = block.content;
            legacyBlock.attrs = { calloutType: block.calloutType, title: block.title };
            break;
          case 'footnote':
            legacyBlock.content = block.text;
            legacyBlock.attrs = { marker: block.marker };
            break;
          case 'divider':
            legacyBlock.content = '';
            break;
          default:
            legacyBlock.content = '';
        }
        
        return legacyBlock;
      }),
      notes: section.notes || []
    }))
  };
}