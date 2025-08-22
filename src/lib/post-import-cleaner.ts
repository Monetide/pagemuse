/**
 * Post-Import Cleaner
 * 
 * Applies quality fixes and normalization to imported documents:
 * - Remove line-end hyphens from PDF ingestion
 * - Collapse double spaces
 * - Normalize list bullets/numbering
 * - Detect heading + caption patterns for Figure proposals
 * - Add keep-with-next to headings
 * - Create cross-references for "See Figure X" patterns
 */

import { SemanticDocument, Section, Flow, Block } from './document-model'
import { IRDocument, IRSection, IRBlock } from './ir-types'

export interface CleanupOptions {
  removeHyphens: boolean
  collapseSpaces: boolean
  normalizeLists: boolean
  detectFigureCaptions: boolean
  addKeepWithNext: boolean
  createCrossReferences: boolean
}

export interface CleanupResult {
  applied: boolean
  changes: CleanupChange[]
  document: SemanticDocument
}

export interface CleanupChange {
  type: 'text-cleanup' | 'list-normalization' | 'figure-caption' | 'keep-with-next' | 'cross-reference'
  blockId: string
  description: string
  before?: string
  after?: string
}

export class PostImportCleaner {
  private options: CleanupOptions
  private changes: CleanupChange[] = []

  constructor(options: Partial<CleanupOptions> = {}) {
    this.options = {
      removeHyphens: true,
      collapseSpaces: true,
      normalizeLists: true,
      detectFigureCaptions: true,
      addKeepWithNext: true,
      createCrossReferences: true,
      ...options
    }
  }

  /**
   * Clean up a semantic document
   */
  cleanDocument(document: SemanticDocument): CleanupResult {
    this.changes = []
    const cleanedDocument = { ...document }

    // Apply cleanups section by section
    cleanedDocument.sections = cleanedDocument.sections.map(section => 
      this.cleanSection(section)
    )

    // Apply cross-document cleanups
    this.applyCrossReferences(cleanedDocument)

    return {
      applied: this.changes.length > 0,
      changes: this.changes,
      document: cleanedDocument
    }
  }

  /**
   * Clean up a section
   */
  private cleanSection(section: Section): Section {
    const cleanedSection = { ...section }
    
    cleanedSection.flows = cleanedSection.flows.map(flow => 
      this.cleanFlow(flow)
    )

    return cleanedSection
  }

  /**
   * Clean up a flow
   */
  private cleanFlow(flow: Flow): Flow {
    const cleanedFlow = { ...flow }
    const blocks = [...cleanedFlow.blocks]
    
    // Process blocks in sequence to detect patterns
    for (let i = 0; i < blocks.length; i++) {
      blocks[i] = this.cleanBlock(blocks[i])
      
      // Check for heading + caption patterns
      if (this.options.detectFigureCaptions && i < blocks.length - 1) {
        const headingCaptionPair = this.detectHeadingCaptionPattern(blocks[i], blocks[i + 1])
        if (headingCaptionPair) {
          this.changes.push({
            type: 'figure-caption',
            blockId: blocks[i].id,
            description: `Detected heading "${headingCaptionPair.heading}" followed by caption-like text. Consider converting to Figure with caption.`,
            before: headingCaptionPair.heading,
            after: `Figure: ${headingCaptionPair.caption}`
          })
        }
      }
    }

    cleanedFlow.blocks = blocks
    return cleanedFlow
  }

  /**
   * Clean up an individual block
   */
  private cleanBlock(block: Block): Block {
    const cleanedBlock = { ...block }

    switch (block.type) {
      case 'paragraph':
      case 'heading':
        cleanedBlock.content = this.cleanTextContent(block.content, block.id, block.type)
        break
      case 'ordered-list':
      case 'unordered-list':
        if (this.options.normalizeLists) {
          cleanedBlock.content = this.normalizeLists(block.content, block.id)
        }
        break
      case 'quote':
        if (block.content?.content) {
          const cleaned = this.cleanTextContent(block.content.content, block.id, 'quote')
          cleanedBlock.content = { ...block.content, content: cleaned }
        }
        break
      case 'callout':
        if (block.content?.content) {
          const cleaned = this.cleanTextContent(block.content.content, block.id, 'callout')
          cleanedBlock.content = { ...block.content, content: cleaned }
        }
        break
    }

    // Add keep-with-next to headings
    if (this.options.addKeepWithNext && block.type === 'heading') {
      if (!cleanedBlock.paginationRules) {
        cleanedBlock.paginationRules = {
          breakBefore: false,
          breakAfter: false,
          keepTogether: false,
          keepWithNext: false
        }
      }
      
      if (!cleanedBlock.paginationRules.keepWithNext) {
        cleanedBlock.paginationRules.keepWithNext = true
        this.changes.push({
          type: 'keep-with-next',
          blockId: block.id,
          description: 'Added keep-with-next to prevent heading from being stranded at page bottom'
        })
      }
    }

    return cleanedBlock
  }

  /**
   * Clean text content (remove hyphens, collapse spaces)
   */
  private cleanTextContent(content: any, blockId: string, blockType: string): any {
    if (typeof content === 'string') {
      let cleaned = content
      const original = content

      // Remove line-end hyphens (common in PDF extraction)
      if (this.options.removeHyphens) {
        const beforeHyphens = cleaned
        cleaned = cleaned.replace(/(\w)-\s*\n\s*(\w)/g, '$1$2')
        cleaned = cleaned.replace(/(\w)-\s+(\w)/g, '$1$2')
        
        if (beforeHyphens !== cleaned) {
          this.changes.push({
            type: 'text-cleanup',
            blockId,
            description: 'Removed line-end hyphens from PDF extraction artifacts',
            before: beforeHyphens.substring(0, 100) + (beforeHyphens.length > 100 ? '...' : ''),
            after: cleaned.substring(0, 100) + (cleaned.length > 100 ? '...' : '')
          })
        }
      }

      // Collapse multiple spaces
      if (this.options.collapseSpaces) {
        const beforeSpaces = cleaned
        cleaned = cleaned.replace(/\s{2,}/g, ' ')
        cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n') // Max 2 newlines
        
        if (beforeSpaces !== cleaned) {
          this.changes.push({
            type: 'text-cleanup',
            blockId,
            description: 'Collapsed multiple spaces and excessive line breaks'
          })
        }
      }

      return cleaned
    } else if (content && typeof content === 'object' && content.text) {
      // Handle complex content objects
      return {
        ...content,
        text: this.cleanTextContent(content.text, blockId, blockType)
      }
    }

    return content
  }

  /**
   * Normalize list formatting and structure
   */
  private normalizeLists(content: any, blockId: string): any {
    if (!content || !content.items) {
      return content
    }

    const items = content.items
    let hasChanges = false
    
    // Normalize bullet points and numbering
    const normalizedItems = items.map((item: string) => {
      let normalized = item.trim()
      
      // Remove inconsistent bullets at start of items (they're handled by list type)
      const bulletPattern = /^[•·▪▫◦‣⁃-]\s*/
      if (bulletPattern.test(normalized)) {
        normalized = normalized.replace(bulletPattern, '')
        hasChanges = true
      }
      
      // Remove manual numbering at start of items
      const numberPattern = /^\d+[\.)]\s*/
      if (numberPattern.test(normalized)) {
        normalized = normalized.replace(numberPattern, '')
        hasChanges = true
      }
      
      return normalized
    })

    if (hasChanges) {
      this.changes.push({
        type: 'list-normalization',
        blockId,
        description: 'Removed manual bullets/numbering from list items (handled by list formatting)'
      })
    }

    return {
      ...content,
      items: normalizedItems
    }
  }

  /**
   * Detect heading followed by caption-like text
   */
  private detectHeadingCaptionPattern(currentBlock: Block, nextBlock: Block): { heading: string, caption: string } | null {
    if (currentBlock.type !== 'heading' || nextBlock.type !== 'paragraph') {
      return null
    }

    const headingText = typeof currentBlock.content === 'string' 
      ? currentBlock.content 
      : currentBlock.content?.text || ''
    
    const paragraphText = typeof nextBlock.content === 'string'
      ? nextBlock.content
      : nextBlock.content?.text || ''

    // Check if heading looks like a figure reference
    const figureHeadingPattern = /^(figure|fig|image|chart|graph|diagram|table)\s*\d*:?\s*/i
    if (figureHeadingPattern.test(headingText)) {
      // Check if paragraph is short and descriptive (likely a caption)
      if (paragraphText.length < 200 && paragraphText.length > 10) {
        return {
          heading: headingText,
          caption: paragraphText
        }
      }
    }

    return null
  }

  /**
   * Apply cross-references for "See Figure X" patterns
   */
  private applyCrossReferences(document: SemanticDocument): void {
    if (!this.options.createCrossReferences) return

    // First, collect all figures and their numbers/titles
    const figures = this.collectFigures(document)
    
    // Then scan all text blocks for cross-reference patterns
    document.sections.forEach(section => {
      section.flows.forEach(flow => {
        flow.blocks.forEach(block => {
          this.detectAndCreateCrossReferences(block, figures)
        })
      })
    })
  }

  /**
   * Collect all figures in the document
   */
  private collectFigures(document: SemanticDocument): Array<{ id: string, number: number, title: string }> {
    const figures: Array<{ id: string, number: number, title: string }> = []
    let figureNumber = 1

    document.sections.forEach(section => {
      section.flows.forEach(flow => {
        flow.blocks.forEach(block => {
          if (block.type === 'figure') {
            figures.push({
              id: block.id,
              number: figureNumber++,
              title: block.content?.caption || `Figure ${figureNumber - 1}`
            })
          }
        })
      })
    })

    return figures
  }

  /**
   * Detect and create cross-references in text
   */
  private detectAndCreateCrossReferences(block: Block, figures: Array<{ id: string, number: number, title: string }>): void {
    if (!['paragraph', 'heading'].includes(block.type)) return

    let text = typeof block.content === 'string' 
      ? block.content 
      : block.content?.text || ''

    // Pattern for "See Figure X", "Figure X shows", etc.
    const crossRefPattern = /\b(see\s+)?(figure|fig|table|chart)\s+(\d+)\b/gi
    const matches = [...text.matchAll(crossRefPattern)]

    matches.forEach(match => {
      const fullMatch = match[0]
      const figureType = match[2].toLowerCase()
      const figureNumber = parseInt(match[3])

      // Find corresponding figure
      const targetFigure = figures.find(f => f.number === figureNumber)
      
      if (targetFigure) {
        this.changes.push({
          type: 'cross-reference',
          blockId: block.id,
          description: `Created cross-reference for "${fullMatch}" → Figure ${figureNumber}`,
          before: fullMatch,
          after: `[Cross-ref to Figure ${figureNumber}]`
        })

        // Note: In a real implementation, we would modify the block content
        // to include proper cross-reference markup. For now, we just record the change.
      }
    })
  }
}

/**
 * Default cleanup options for different import sources
 */
export const getDefaultCleanupOptions = (source: 'pdf' | 'docx' | 'markdown' | 'text'): CleanupOptions => {
  const base: CleanupOptions = {
    removeHyphens: false,
    collapseSpaces: true,
    normalizeLists: true,
    detectFigureCaptions: true,
    addKeepWithNext: true,
    createCrossReferences: true
  }

  switch (source) {
    case 'pdf':
      return { ...base, removeHyphens: true } // PDFs often have hyphenation artifacts
    case 'docx':
      return { ...base, removeHyphens: false } // DOCX usually preserves formatting well
    case 'markdown':
      return { ...base, normalizeLists: false } // Markdown lists are usually well-structured
    case 'text':
      return { ...base, detectFigureCaptions: false } // Plain text rarely has figure patterns
    default:
      return base
  }
}
