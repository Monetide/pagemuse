/**
 * IR to PageMuse Mapper
 * Converts Intermediate Representation to PageMuse document model
 */

import { 
  IRDocument, 
  IRSection, 
  IRBlock, 
  IRHeading, 
  IRList, 
  IRTable, 
  IRFigure, 
  IRCallout, 
  IRQuote,
  IRCode
} from './ir-types'
import { 
  SemanticDocument, 
  Section, 
  Flow, 
  Block 
} from './document-model'

export class IRMapper {
  private blockCounter = 1
  private sectionCounter = 1
  private flowCounter = 1

  /**
   * Maps an IR document to a PageMuse SemanticDocument
   */
  mapDocument(irDoc: IRDocument): SemanticDocument {
    this.resetCounters()
    
    const sections = irDoc.sections.map(irSection => this.mapSection(irSection))
    
    return {
      id: `doc-${Date.now()}`,
      title: irDoc.title,
      description: irDoc.metadata?.description,
      sections,
      theme: undefined,
      metadata: {
        author: irDoc.metadata?.author,
        version: 1,
        tags: irDoc.metadata?.tags || []
      },
      created_at: (irDoc.metadata?.created || new Date()).toISOString(),
      updated_at: (irDoc.metadata?.modified || new Date()).toISOString()
    }
  }

  /**
   * Maps an IR section to a PageMuse Section
   */
  private mapSection(irSection: IRSection): Section {
    const blocks = irSection.blocks.map(irBlock => this.mapBlock(irBlock))
    
    // Group blocks into a single linear flow
    const flow: Flow = {
      id: `flow-${this.flowCounter++}`,
      name: 'Main Flow',
      type: 'linear',
      order: 1,
      blocks
    }

    return {
      id: irSection.id || `section-${this.sectionCounter++}`,
      name: irSection.title || `Section ${irSection.order}`,
      order: irSection.order,
      pageMaster: null,
      footnotes: irSection.notes?.map(note => ({
        id: note.id,
        number: note.number,
        content: note.content,
        sourceBlockId: note.backlinks?.[0] || 'unknown'
      })) || [],
      flows: [flow]
    }
  }

  /**
   * Maps an IR block to a PageMuse Block
   */
  private mapBlock(irBlock: IRBlock): Block {
    const baseBlock: Omit<Block, 'type' | 'content'> = {
      id: irBlock.id || `block-${this.blockCounter++}`,
      order: irBlock.order,
      metadata: {
        ...irBlock.attrs,
        marks: irBlock.marks || []
      }
    }

    switch (irBlock.type) {
      case 'heading':
        return {
          ...baseBlock,
          type: 'heading',
          content: this.mapHeadingContent(irBlock.content)
        }

      case 'paragraph':
        return {
          ...baseBlock,
          type: 'paragraph',
          content: typeof irBlock.content === 'string' ? irBlock.content : String(irBlock.content)
        }

      case 'list':
        return this.mapListBlock(baseBlock, irBlock.content as IRList)

      case 'table':
        return {
          ...baseBlock,
          type: 'table',
          content: this.mapTableContent(irBlock.content as IRTable)
        }

      case 'figure':
        return {
          ...baseBlock,
          type: 'figure',
          content: this.mapFigureContent(irBlock.content as IRFigure)
        }

      case 'callout':
        return {
          ...baseBlock,
          type: 'callout',
          content: this.mapCalloutContent(irBlock.content as IRCallout)
        }

      case 'quote':
        return {
          ...baseBlock,
          type: 'quote',
          content: this.mapQuoteContent(irBlock.content as IRQuote)
        }

      case 'code':
        return {
          ...baseBlock,
          type: 'paragraph', // Map code to paragraph for now
          content: this.mapCodeContent(irBlock.content as IRCode)
        }

      case 'horizontal-rule':
      case 'divider':
        return {
          ...baseBlock,
          type: 'divider',
          content: '---'
        }

      case 'spacer':
        return {
          ...baseBlock,
          type: 'spacer',
          content: '',
          metadata: {
            ...baseBlock.metadata,
            height: irBlock.attrs?.height || 0.5
          }
        }

      default:
        // Fallback to paragraph
        return {
          ...baseBlock,
          type: 'paragraph',
          content: String(irBlock.content)
        }
    }
  }

  /**
   * Maps heading content
   */
  private mapHeadingContent(content: IRHeading | string): string {
    if (typeof content === 'string') {
      return content
    }
    return content.text
  }

  /**
   * Maps list blocks (ordered/unordered)
   */
  private mapListBlock(baseBlock: Omit<Block, 'type' | 'content'>, list: IRList): Block {
    const items = list.items.map(item => {
      if (item.children) {
        // Nested lists not directly supported, flatten to text
        return `${item.content} (${item.children.items.map(child => child.content).join(', ')})`
      }
      return item.content
    })

    return {
      ...baseBlock,
      type: list.type === 'ordered' ? 'ordered-list' : 'unordered-list',
      content: items
    }
  }

  /**
   * Maps table content
   */
  private mapTableContent(table: IRTable) {
    return {
      headers: table.headers || [],
      rows: table.rows || [],
      caption: table.caption || '',
      number: 1, // Will be auto-assigned
      hasHeaderRow: table.headerRow !== false
    }
  }

  /**
   * Maps figure content
   */
  private mapFigureContent(figure: IRFigure) {
    return {
      imageUrl: figure.image.url || '',
      altText: figure.alt || figure.image.alt || '',
      caption: figure.caption || '',
      size: this.mapFigureSize(figure.size),
      aspectLock: true,
      number: 1 // Will be auto-assigned
    }
  }

  /**
   * Maps callout content
   */
  private mapCalloutContent(callout: IRCallout) {
    return {
      type: callout.type,
      title: callout.title || '',
      content: callout.content,
      icon: this.getCalloutIcon(callout.type)
    }
  }

  /**
   * Maps quote content
   */
  private mapQuoteContent(quote: IRQuote): string {
    let content = quote.content
    if (quote.citation) {
      content += ` — ${quote.citation}`
    }
    if (quote.author) {
      content += ` (${quote.author})`
    }
    return content
  }

  /**
   * Maps code content
   */
  private mapCodeContent(code: IRCode): string {
    if (code.inline) {
      return `\`${code.content}\``
    }
    return code.language 
      ? `\`\`\`${code.language}\n${code.content}\n\`\`\``
      : `\`\`\`\n${code.content}\n\`\`\``
  }

  /**
   * Maps figure size from IR to PageMuse format
   */
  private mapFigureSize(size?: string): 'small' | 'medium' | 'large' | 'column-width' | 'full-width' {
    switch (size) {
      case 'small': return 'small'
      case 'medium': return 'medium'
      case 'large': return 'large'
      case 'full-width': return 'full-width'
      default: return 'column-width'
    }
  }

  /**
   * Gets appropriate icon for callout type
   */
  private getCalloutIcon(type: IRCallout['type']): string {
    switch (type) {
      case 'info': return 'ℹ️'
      case 'warning': return '⚠️'
      case 'error': return '❌'
      case 'success': return '✅'
      case 'note': return '📝'
      default: return 'ℹ️'
    }
  }

  /**
   * Resets internal counters
   */
  private resetCounters() {
    this.blockCounter = 1
    this.sectionCounter = 1
    this.flowCounter = 1
  }
}

// Factory function for convenience
export const createIRMapper = () => new IRMapper()

// Helper function to map IR document to PageMuse
export const mapIRToPageMuse = (irDoc: IRDocument): SemanticDocument => {
  const mapper = createIRMapper()
  return mapper.mapDocument(irDoc)
}