/**
 * IR Cleanup System
 * Processes IRDocument objects to improve structure and content quality
 */

import { 
  IRDocument, 
  IRSection, 
  IRBlock, 
  IRHeading, 
  IRList, 
  IRCallout,
  createIRBlock,
  createIRHeading,
  createIRCallout,
  createIRList
} from './ir-types';

export interface CleanupAuditEntry {
  type: 'merge-lines' | 'normalize-lists' | 'dehyphenate' | 'promote-heading' | 'demote-heading' | 'detect-callout' | 'fix-hierarchy';
  count: number;
  description: string;
  details?: string;
}

export interface CleanupResult {
  document: IRDocument;
  auditLog: CleanupAuditEntry[];
  summary: string;
}

export interface IRCleanupOptions {
  mergeLines?: boolean;
  normalizeLists?: boolean;
  dehyphenate?: boolean;
  adjustHeadings?: boolean;
  detectCallouts?: boolean;
  fixHierarchy?: boolean;
}

export const DEFAULT_IR_CLEANUP_OPTIONS: IRCleanupOptions = {
  mergeLines: true,
  normalizeLists: true,
  dehyphenate: true,
  adjustHeadings: true,
  detectCallouts: true,
  fixHierarchy: true
};

export class IRCleaner {
  private auditLog: CleanupAuditEntry[] = [];
  private options: IRCleanupOptions;

  constructor(options: IRCleanupOptions = DEFAULT_IR_CLEANUP_OPTIONS) {
    this.options = { ...DEFAULT_IR_CLEANUP_OPTIONS, ...options };
  }

  cleanDocument(document: IRDocument): CleanupResult {
    this.auditLog = [];
    
    const cleanedDocument: IRDocument = {
      ...document,
      sections: document.sections.map(section => this.cleanSection(section))
    };

    // Fix heading hierarchy after all other cleanups
    if (this.options.fixHierarchy) {
      this.fixHeadingHierarchy(cleanedDocument);
    }

    const summary = this.generateSummary();

    return {
      document: cleanedDocument,
      auditLog: [...this.auditLog],
      summary
    };
  }

  private cleanSection(section: IRSection): IRSection {
    let blocks = [...section.blocks];
    
    // Apply various cleanup operations
    if (this.options.mergeLines) {
      blocks = this.mergeConsecutiveParagraphs(blocks);
    }
    
    if (this.options.dehyphenate) {
      blocks = this.dehyphenateBlocks(blocks);
    }
    
    if (this.options.detectCallouts) {
      blocks = this.detectCallouts(blocks);
    }
    
    if (this.options.normalizeLists) {
      blocks = this.normalizeLists(blocks);
    }
    
    if (this.options.adjustHeadings) {
      blocks = this.adjustHeadings(blocks);
    }

    return {
      ...section,
      blocks
    };
  }

  private mergeConsecutiveParagraphs(blocks: IRBlock[]): IRBlock[] {
    const merged: IRBlock[] = [];
    let mergeCount = 0;

    for (let i = 0; i < blocks.length; i++) {
      const current = blocks[i];
      const next = blocks[i + 1];

      if (
        current.type === 'paragraph' && 
        next?.type === 'paragraph' &&
        typeof current.content === 'string' &&
        typeof next.content === 'string' &&
        this.shouldMergeLines(current.content, next.content)
      ) {
        // Merge the next paragraph into current
        const mergedContent = this.mergeLineContent(current.content, next.content);
        merged.push({
          ...current,
          content: mergedContent
        });
        i++; // Skip the next block as it's been merged
        mergeCount++;
      } else {
        merged.push(current);
      }
    }

    if (mergeCount > 0) {
      this.addAuditEntry('merge-lines', mergeCount, `Merged ${mergeCount} broken lines`);
    }

    return merged;
  }

  private shouldMergeLines(current: string, next: string): boolean {
    // Merge if current line ends mid-sentence (no punctuation) and next starts lowercase
    const currentTrimmed = current.trim();
    const nextTrimmed = next.trim();
    
    if (!currentTrimmed || !nextTrimmed) return false;
    
    // Don't merge if current ends with punctuation
    if (/[.!?:]$/.test(currentTrimmed)) return false;
    
    // Don't merge if next starts with capital (likely new sentence)
    if (/^[A-Z]/.test(nextTrimmed)) return false;
    
    // Don't merge very short lines (likely intentional formatting)
    if (currentTrimmed.length < 20) return false;
    
    return true;
  }

  private mergeLineContent(current: string, next: string): string {
    const currentTrimmed = current.trim();
    const nextTrimmed = next.trim();
    
    // Handle hyphenation at line end
    if (currentTrimmed.endsWith('-')) {
      return currentTrimmed.slice(0, -1) + nextTrimmed;
    }
    
    return currentTrimmed + ' ' + nextTrimmed;
  }

  private dehyphenateBlocks(blocks: IRBlock[]): IRBlock[] {
    let dehyphenateCount = 0;

    const processed = blocks.map(block => {
      if (block.type === 'paragraph' && typeof block.content === 'string') {
        const original = block.content;
        const dehyphenated = this.dehyphenateText(original);
        
        if (original !== dehyphenated) {
          dehyphenateCount++;
          return { ...block, content: dehyphenated };
        }
      }
      return block;
    });

    if (dehyphenateCount > 0) {
      this.addAuditEntry('dehyphenate', dehyphenateCount, `Fixed ${dehyphenateCount} hyphenations`);
    }

    return processed;
  }

  private dehyphenateText(text: string): string {
    // Remove hyphens at end of lines followed by continuation on next line
    return text.replace(/(\w+)-\s*\n\s*(\w+)/g, '$1$2')
               .replace(/(\w+)-\s+(\w+)/g, '$1$2');
  }

  private detectCallouts(blocks: IRBlock[]): IRBlock[] {
    let calloutCount = 0;
    const calloutPrefixes = [
      { prefix: /^(note|tip|warning|caution|important|info):\s*/i, type: 'note' as const },
      { prefix: /^(warning|caution|danger):\s*/i, type: 'warning' as const },
      { prefix: /^(error|alert):\s*/i, type: 'error' as const },
      { prefix: /^(success|check):\s*/i, type: 'success' as const }
    ];

    const processed = blocks.map(block => {
      if (block.type === 'paragraph' && typeof block.content === 'string') {
        for (const { prefix, type } of calloutPrefixes) {
          const match = block.content.match(prefix);
          if (match) {
            const content = block.content.replace(prefix, '').trim();
            const title = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
            
            calloutCount++;
            return createIRBlock('callout', createIRCallout(type, content, title), block.order);
          }
        }
      }
      return block;
    });

    if (calloutCount > 0) {
      this.addAuditEntry('detect-callout', calloutCount, `Detected ${calloutCount} callouts`);
    }

    return processed;
  }

  private normalizeLists(blocks: IRBlock[]): IRBlock[] {
    let normalizedCount = 0;

    const processed = blocks.map(block => {
      if (block.type === 'paragraph' && typeof block.content === 'string') {
        const normalized = this.normalizeListContent(block.content);
        if (normalized) {
          normalizedCount++;
          return createIRBlock('list', normalized, block.order);
        }
      }
      return block;
    });

    if (normalizedCount > 0) {
      this.addAuditEntry('normalize-lists', normalizedCount, `Normalized ${normalizedCount} lists`);
    }

    return processed;
  }

  private normalizeListContent(content: string): IRList | null {
    const lines = content.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Check for bullet points
    const bulletRegex = /^[•\-\*\+]\s+(.+)$/;
    const numberedRegex = /^\d+[\.\)]\s+(.+)$/;
    
    let listType: 'ordered' | 'unordered' | null = null;
    const items: string[] = [];
    
    for (const line of lines) {
      const bulletMatch = line.match(bulletRegex);
      const numberedMatch = line.match(numberedRegex);
      
      if (bulletMatch) {
        if (listType === null) listType = 'unordered';
        if (listType === 'unordered') items.push(bulletMatch[1]);
      } else if (numberedMatch) {
        if (listType === null) listType = 'ordered';
        if (listType === 'ordered') items.push(numberedMatch[1]);
      } else {
        // Not a consistent list
        return null;
      }
    }
    
    if (items.length >= 2 && listType) {
      return createIRList(listType, items);
    }
    
    return null;
  }

  private adjustHeadings(blocks: IRBlock[]): IRBlock[] {
    let adjustCount = 0;

    const processed = blocks.map(block => {
      if (block.type === 'paragraph' && typeof block.content === 'string') {
        const headingLevel = this.detectHeadingLevel(block.content);
        if (headingLevel) {
          adjustCount++;
          const text = this.cleanHeadingText(block.content);
          return createIRBlock('heading', createIRHeading(headingLevel, text), block.order);
        }
      }
      return block;
    });

    if (adjustCount > 0) {
      this.addAuditEntry('promote-heading', adjustCount, `Promoted ${adjustCount} headings`);
    }

    return processed;
  }

  private detectHeadingLevel(content: string): number | null {
    const text = content.trim();
    
    // Chapter patterns
    if (/^(chapter|part|section)\s+\d+/i.test(text)) return 1;
    
    // Numbered headings
    if (/^\d+\.\s/.test(text)) return 2;
    if (/^\d+\.\d+\.\s/.test(text)) return 3;
    if (/^\d+\.\d+\.\d+\.\s/.test(text)) return 4;
    
    // ALL CAPS (but not too long)
    if (text.length < 60 && text === text.toUpperCase() && /[A-Z]/.test(text)) return 2;
    
    // Title Case and short
    if (text.length < 80 && this.isTitleCase(text) && !text.endsWith('.')) return 3;
    
    return null;
  }

  private isTitleCase(text: string): boolean {
    const words = text.split(/\s+/);
    return words.length <= 8 && words.every(word => 
      word.length === 0 || 
      /^[A-Z]/.test(word) || 
      ['a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with'].includes(word.toLowerCase())
    );
  }

  private cleanHeadingText(content: string): string {
    return content.trim()
      .replace(/^\d+\.\s*/, '') // Remove leading numbers
      .replace(/^(chapter|part|section)\s+\d+:?\s*/i, ''); // Remove chapter prefixes
  }

  private fixHeadingHierarchy(document: IRDocument): void {
    let hierarchyFixes = 0;

    for (const section of document.sections) {
      let lastLevel = 0;

      for (const block of section.blocks) {
        if (block.type === 'heading' && block.content && typeof block.content === 'object') {
          const heading = block.content as IRHeading;
          
          // Ensure logical progression (don't skip levels)
          if (heading.level > lastLevel + 1) {
            heading.level = (lastLevel + 1) as 1 | 2 | 3 | 4 | 5 | 6;
            hierarchyFixes++;
          }
          
          lastLevel = heading.level;
        }
      }
    }

    if (hierarchyFixes > 0) {
      this.addAuditEntry('fix-hierarchy', hierarchyFixes, `Fixed ${hierarchyFixes} heading hierarchy issues`);
    }
  }

  private addAuditEntry(type: CleanupAuditEntry['type'], count: number, description: string, details?: string): void {
    this.auditLog.push({ type, count, description, details });
  }

  private generateSummary(): string {
    if (this.auditLog.length === 0) {
      return 'No cleanups needed - document structure looks good!';
    }

    const totalChanges = this.auditLog.reduce((sum, entry) => sum + entry.count, 0);
    const operations = this.auditLog.length;
    
    return `Applied ${totalChanges} fixes across ${operations} operations`;
  }
}

// Convenience function
export function cleanIRDocument(document: IRDocument, options?: IRCleanupOptions): CleanupResult {
  const cleaner = new IRCleaner(options);
  return cleaner.cleanDocument(document);
}