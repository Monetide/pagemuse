import { Block, PaginationRules } from '../document-model'

export interface ContentHandler {
  canSplit(block: Block, remainingHeight: number, columnWidth: number): boolean
  split(block: Block, remainingHeight: number, columnWidth: number): Block[]
  estimateHeight(block: Block, columnWidth: number): number
  checkPlacementRules(block: Block, remainingHeight: number, columnWidth: number, nextBlock?: Block): PlacementResult
}

export interface PlacementResult {
  canPlace: boolean
  reason?: string
  requiresNextColumn?: boolean
  requiresNextPage?: boolean
  mustSplit?: boolean
}

export class HeadingHandler implements ContentHandler {
  canSplit(block: Block, remainingHeight: number, columnWidth: number): boolean {
    // Headings are atomic - never split
    return false
  }

  split(block: Block, remainingHeight: number, columnWidth: number): Block[] {
    return [block] // Headings don't split
  }

  estimateHeight(block: Block, columnWidth: number): number {
    const level = block.metadata?.level || 1
    return level === 1 ? 0.6 : level === 2 ? 0.5 : 0.4
  }

  checkPlacementRules(block: Block, remainingHeight: number, columnWidth: number, nextBlock?: Block): PlacementResult {
    const blockHeight = this.estimateHeight(block, columnWidth)
    
    // Check basic space
    if (blockHeight > remainingHeight) {
      return { canPlace: false, reason: 'insufficient-space', requiresNextColumn: true }
    }

    // Check keep-with-next rule (default for headings)
    const rules = block.paginationRules || { keepWithNext: true }
    if (rules.keepWithNext && nextBlock) {
      const nextHandler = ContentHandlerFactory.getHandler(nextBlock.type)
      const nextBlockMinHeight = Math.min(nextHandler.estimateHeight(nextBlock, columnWidth), 0.3)
      
      if (blockHeight + nextBlockMinHeight > remainingHeight) {
        return { canPlace: false, reason: 'keep-with-next', requiresNextColumn: true }
      }
    }

    return { canPlace: true }
  }
}

export class ParagraphHandler implements ContentHandler {
  canSplit(block: Block, remainingHeight: number, columnWidth: number): boolean {
    const rules = block.paginationRules || {}
    
    if (rules.keepTogether) {
      return false
    }

    const totalHeight = this.estimateHeight(block, columnWidth)
    if (totalHeight <= remainingHeight) {
      return false // No need to split
    }

    // Check widow/orphan constraints
    return this.checkWidowOrphanConstraints(block, remainingHeight, columnWidth)
  }

  split(block: Block, remainingHeight: number, columnWidth: number): Block[] {
    if (!this.canSplit(block, remainingHeight, columnWidth)) {
      return [block]
    }

    const text = block.content?.toString() || ''
    const words = text.split(' ')
    const avgWordsPerLine = Math.floor(columnWidth * 1.8)
    const lineHeight = 0.167
    const maxLines = Math.floor(remainingHeight / lineHeight)
    
    // Apply orphan/widow rules
    const rules = block.paginationRules || {}
    const minOrphans = rules.minOrphans || 2
    const minWidows = rules.minWidows || 2
    
    const adjustedMaxLines = Math.max(0, maxLines - minOrphans)
    const maxWordsInFirstChunk = adjustedMaxLines * avgWordsPerLine
    
    if (maxWordsInFirstChunk <= 0) {
      return [block] // Can't split meaningfully
    }

    const firstChunkWords = words.slice(0, maxWordsInFirstChunk)
    const remainingWords = words.slice(maxWordsInFirstChunk)
    
    // Check if remaining part violates widow rules
    const remainingLines = Math.ceil(remainingWords.length / avgWordsPerLine)
    if (remainingLines < minWidows && remainingLines > 0) {
      // Adjust split point to respect widow rules
      const adjustedFirstChunkWords = words.slice(0, Math.max(0, words.length - (minWidows * avgWordsPerLine)))
      const adjustedRemainingWords = words.slice(adjustedFirstChunkWords.length)
      
      if (adjustedFirstChunkWords.length === 0) {
        return [block] // Can't split without violating rules
      }

      return this.createSplitBlocks(block, adjustedFirstChunkWords, adjustedRemainingWords)
    }

    return this.createSplitBlocks(block, firstChunkWords, remainingWords)
  }

  estimateHeight(block: Block, columnWidth: number): number {
    const text = block.content?.toString() || ''
    const wordCount = text.split(' ').length
    const avgWordsPerLine = Math.floor(columnWidth * 1.8)
    const linesNeeded = Math.ceil(wordCount / avgWordsPerLine)
    return linesNeeded * 0.167
  }

  checkPlacementRules(block: Block, remainingHeight: number, columnWidth: number, nextBlock?: Block): PlacementResult {
    const blockHeight = this.estimateHeight(block, columnWidth)
    
    if (blockHeight <= remainingHeight) {
      return { canPlace: true }
    }

    // Check if we can split
    if (this.canSplit(block, remainingHeight, columnWidth)) {
      return { canPlace: true, mustSplit: true }
    }

    return { canPlace: false, reason: 'widow-orphan-protection', requiresNextColumn: true }
  }

  private checkWidowOrphanConstraints(block: Block, remainingHeight: number, columnWidth: number): boolean {
    const rules = block.paginationRules || {}
    const lineHeight = 0.167
    const availableLines = Math.floor(remainingHeight / lineHeight)
    const totalLines = Math.ceil(this.estimateHeight(block, columnWidth) / lineHeight)
    
    const minOrphans = rules.minOrphans || 2
    const minWidows = rules.minWidows || 2

    // Need at least minOrphans lines in first part
    if (availableLines < minOrphans) {
      return false
    }

    // Remaining lines after split must be at least minWidows
    const remainingLines = totalLines - availableLines
    if (remainingLines > 0 && remainingLines < minWidows) {
      return false
    }

    return true
  }

  private createSplitBlocks(originalBlock: Block, firstWords: string[], remainingWords: string[]): Block[] {
    if (remainingWords.length === 0) {
      return [originalBlock]
    }

    const firstChunk = {
      ...originalBlock,
      id: `${originalBlock.id}-chunk-0`,
      content: firstWords.join(' '),
      metadata: {
        ...originalBlock.metadata,
        isChunk: true,
        chunkIndex: 0,
        originalBlockId: originalBlock.id,
        totalChunks: 2
      }
    }

    const secondChunk = {
      ...originalBlock,
      id: `${originalBlock.id}-chunk-1`,
      content: remainingWords.join(' '),
      metadata: {
        ...originalBlock.metadata,
        isChunk: true,
        chunkIndex: 1,
        originalBlockId: originalBlock.id,
        totalChunks: 2
      }
    }

    return [firstChunk, secondChunk]
  }
}

export class FigureHandler implements ContentHandler {
  canSplit(block: Block, remainingHeight: number, columnWidth: number): boolean {
    // Figures are atomic - never split
    return false
  }

  split(block: Block, remainingHeight: number, columnWidth: number): Block[] {
    return [block]
  }

  estimateHeight(block: Block, columnWidth: number): number {
    const imageHeight = block.metadata?.imageHeight || 2
    const captionHeight = block.content?.caption ? 0.3 : 0
    return imageHeight + captionHeight + 0.2
  }

  checkPlacementRules(block: Block, remainingHeight: number, columnWidth: number): PlacementResult {
    const blockHeight = this.estimateHeight(block, columnWidth)
    
    if (blockHeight > remainingHeight) {
      return { canPlace: false, reason: 'atomic-block', requiresNextColumn: true }
    }

    // Check width constraints for figures
    const figureWidth = this.estimateFigureWidth(block, columnWidth)
    if (figureWidth > columnWidth * 1.2) {
      // Figure is too wide, may need special handling
      return { 
        canPlace: true, 
        reason: 'oversized-width',
        requiresNextPage: true // May need landscape or full-width treatment
      }
    }

    return { canPlace: true }
  }

  private estimateFigureWidth(block: Block, columnWidth: number): number {
    if (block.metadata?.width) {
      return block.metadata.width
    }
    
    // Use natural width if available, otherwise default to column width
    return block.metadata?.naturalWidth ? block.metadata.naturalWidth / 72 : columnWidth
  }
}

export class TableHandler implements ContentHandler {
  canSplit(block: Block, remainingHeight: number, columnWidth: number): boolean {
    const tableData = block.content || { headers: [], rows: [] }
    const headerHeight = 0.3
    const rowHeight = 0.25
    
    // Need space for header + at least one row
    const minTableHeight = headerHeight + rowHeight + 0.2
    
    if (remainingHeight < minTableHeight) {
      return false
    }

    // Can split if we have multiple rows
    return Array.isArray(tableData.rows) && tableData.rows.length > 1
  }

  split(block: Block, remainingHeight: number, columnWidth: number): Block[] {
    if (!this.canSplit(block, remainingHeight, columnWidth)) {
      return [block]
    }

    const tableData = block.content || { headers: [], rows: [] }
    const headerHeight = 0.3
    const rowHeight = 0.25
    
    const availableRowSpace = remainingHeight - headerHeight - 0.2
    const fittableRows = Math.floor(availableRowSpace / rowHeight)
    
    if (fittableRows <= 0) {
      return [block]
    }

    const firstPartRows = tableData.rows.slice(0, fittableRows)
    const remainingRows = tableData.rows.slice(fittableRows)
    
    const chunks: Block[] = []
    
    // First chunk
    chunks.push({
      ...block,
      id: `${block.id}-chunk-0`,
      content: {
        ...tableData,
        rows: firstPartRows
      },
      metadata: {
        ...block.metadata,
        isTableChunk: true,
        chunkIndex: 0,
        originalBlockId: block.id,
        hasHeaderRepeat: true
      }
    })

    // Process remaining rows
    let remainingRowsToProcess = remainingRows
    let chunkIndex = 1
    
    while (remainingRowsToProcess.length > 0) {
      // For subsequent chunks, assume full column height
      const fullColumnHeight = 8 // approximate
      const fullColumnRowSpace = fullColumnHeight - headerHeight - 0.2
      const fullColumnRows = Math.floor(fullColumnRowSpace / rowHeight)
      
      const chunkRows = remainingRowsToProcess.slice(0, fullColumnRows)
      remainingRowsToProcess = remainingRowsToProcess.slice(fullColumnRows)
      
      chunks.push({
        ...block,
        id: `${block.id}-chunk-${chunkIndex}`,
        content: {
          ...tableData,
          rows: chunkRows
        },
        metadata: {
          ...block.metadata,
          isTableChunk: true,
          chunkIndex,
          originalBlockId: block.id,
          hasHeaderRepeat: true
        }
      })
      
      chunkIndex++
    }

    return chunks
  }

  estimateHeight(block: Block, columnWidth: number): number {
    const tableData = block.content || { headers: [], rows: [] }
    const headerHeight = 0.3
    const rowHeight = 0.25
    const dataRowCount = Array.isArray(tableData.rows) ? tableData.rows.length : 0
    
    return headerHeight + (dataRowCount * rowHeight) + 0.2
  }

  checkPlacementRules(block: Block, remainingHeight: number, columnWidth: number): PlacementResult {
    const blockHeight = this.estimateHeight(block, columnWidth)
    
    if (blockHeight <= remainingHeight) {
      return { canPlace: true }
    }

    if (this.canSplit(block, remainingHeight, columnWidth)) {
      return { canPlace: true, mustSplit: true }
    }

    return { canPlace: false, reason: 'table-cannot-split', requiresNextColumn: true }
  }
}

export class CalloutHandler implements ContentHandler {
  canSplit(block: Block, remainingHeight: number, columnWidth: number): boolean {
    // Callouts are atomic - never split
    return false
  }

  split(block: Block, remainingHeight: number, columnWidth: number): Block[] {
    return [block]
  }

  estimateHeight(block: Block, columnWidth: number): number {
    const calloutText = block.content?.content || block.content?.toString() || ''
    const wordCount = calloutText.split(' ').length
    const avgWordsPerLine = Math.floor(columnWidth * 1.5) // Callouts have padding
    const linesNeeded = Math.ceil(wordCount / avgWordsPerLine)
    return (linesNeeded * 0.167) + 0.4 // Extra padding for callout styling
  }

  checkPlacementRules(block: Block, remainingHeight: number, columnWidth: number): PlacementResult {
    const blockHeight = this.estimateHeight(block, columnWidth)
    
    if (blockHeight > remainingHeight) {
      return { canPlace: false, reason: 'atomic-block', requiresNextColumn: true }
    }

    return { canPlace: true }
  }
}

export class ContentHandlerFactory {
  private static handlers: Map<string, ContentHandler> = new Map([
    ['heading', new HeadingHandler()],
    ['paragraph', new ParagraphHandler()],
    ['figure', new FigureHandler()],
    ['table', new TableHandler()],
    ['callout', new CalloutHandler()],
  ])

  static getHandler(blockType: string): ContentHandler {
    return this.handlers.get(blockType) || new ParagraphHandler() // Default fallback
  }

  static registerHandler(blockType: string, handler: ContentHandler): void {
    this.handlers.set(blockType, handler)
  }
}
