import { Block, Section, PaginationRules } from '../document-model'

export interface FlowManager {
  addBlock(block: Block): void
  canPlaceBlock(block: Block, remainingHeight: number, columnWidth: number): boolean
  placeBlock(block: Block): boolean
  getCurrentHeight(): number
  getRemainingHeight(): number
  getBlocks(): Block[]
  isColumnFull(): boolean
  markColumnFull(reason: string): void
}

export interface ColumnState {
  id: string
  index: number
  width: number
  height: number
  currentHeight: number
  blocks: Block[]
  isFull: boolean
  endReason?: string
  footnotes: FootnoteEntry[]
  footnoteHeight: number
}

export interface FootnoteEntry {
  id: string
  number: number
  content: string
  sourceBlockId: string
}

export class StandardFlowManager implements FlowManager {
  private columnState: ColumnState
  private pageFootnotes: FootnoteEntry[]

  constructor(
    columnId: string,
    columnIndex: number,
    columnWidth: number,
    columnHeight: number,
    pageFootnotes: FootnoteEntry[] = []
  ) {
    this.columnState = {
      id: columnId,
      index: columnIndex,
      width: columnWidth,
      height: columnHeight,
      currentHeight: 0,
      blocks: [],
      isFull: false,
      footnotes: [],
      footnoteHeight: 0
    }
    this.pageFootnotes = pageFootnotes
  }

  addBlock(block: Block): void {
    if (this.columnState.isFull) {
      throw new Error('Cannot add block to full column')
    }

    this.columnState.blocks.push(block)
    this.columnState.currentHeight += this.estimateBlockHeight(block)

    // Handle footnotes if this block has any
    if (block.metadata?.footnotes) {
      this.handleBlockFootnotes(block)
    }

    // Check if column is now full
    if (this.getRemainingHeight() <= 0.1) { // 0.1 inch minimum remaining
      this.markColumnFull('height-exceeded')
    }
  }

  canPlaceBlock(block: Block, remainingHeight: number, columnWidth: number): boolean {
    const blockHeight = this.estimateBlockHeight(block)
    const footnoteHeight = this.estimateFootnoteHeightForBlock(block)
    const totalHeight = blockHeight + footnoteHeight

    // Check basic space requirements
    if (totalHeight > remainingHeight) {
      return false
    }

    // Check pagination rules
    const rules = block.paginationRules || {}
    
    // Atomic blocks must fit completely
    if (this.isAtomicBlock(block) && totalHeight > remainingHeight) {
      return false
    }

    // Check keep-with-next rules
    if (rules.keepWithNext && this.hasNextBlock(block)) {
      const nextBlockHeight = this.estimateNextBlockHeight(block)
      if (totalHeight + nextBlockHeight > remainingHeight) {
        return false
      }
    }

    // Check orphan/widow rules for text blocks
    if (this.isTextBlock(block)) {
      return this.checkOrphanWidowRules(block, remainingHeight)
    }

    return true
  }

  placeBlock(block: Block): boolean {
    if (!this.canPlaceBlock(block, this.getRemainingHeight(), this.columnState.width)) {
      return false
    }

    try {
      this.addBlock(block)
      return true
    } catch (error) {
      console.error('Failed to place block:', error)
      return false
    }
  }

  getCurrentHeight(): number {
    return this.columnState.currentHeight + this.columnState.footnoteHeight
  }

  getRemainingHeight(): number {
    return this.columnState.height - this.getCurrentHeight()
  }

  getBlocks(): Block[] {
    return [...this.columnState.blocks]
  }

  isColumnFull(): boolean {
    return this.columnState.isFull
  }

  markColumnFull(reason: string): void {
    this.columnState.isFull = true
    this.columnState.endReason = reason
  }

  getColumnState(): ColumnState {
    return { ...this.columnState }
  }

  private estimateBlockHeight(block: Block): number {
    switch (block.type) {
      case 'heading':
        const level = block.metadata?.level || 1
        return level === 1 ? 0.6 : level === 2 ? 0.5 : 0.4

      case 'paragraph':
        const text = block.content?.toString() || ''
        const wordCount = text.split(' ').length
        const avgWordsPerLine = Math.floor(this.columnState.width * 1.8)
        const linesNeeded = Math.ceil(wordCount / avgWordsPerLine)
        return linesNeeded * 0.167 // 6 lines per inch

      case 'figure':
        const imageHeight = block.metadata?.imageHeight || 2
        const captionHeight = block.content?.caption ? 0.3 : 0
        return imageHeight + captionHeight + 0.2

      case 'table':
        const tableData = block.content || { headers: [], rows: [] }
        const headerHeight = 0.3
        const rowHeight = 0.25
        const dataRowCount = Array.isArray(tableData.rows) ? tableData.rows.length : 0
        return headerHeight + (dataRowCount * rowHeight) + 0.2

      case 'callout':
        const calloutText = block.content?.content || block.content?.toString() || ''
        const calloutWords = calloutText.split(' ').length
        const calloutLines = Math.ceil(calloutWords / (this.columnState.width * 1.5))
        return (calloutLines * 0.167) + 0.4 // Extra padding for callout styling

      default:
        return 0.3
    }
  }

  private estimateFootnoteHeightForBlock(block: Block): number {
    if (!block.metadata?.footnotes) return 0
    
    const footnoteCount = block.metadata.footnotes.length
    return footnoteCount * 0.25 + 0.15 // Base spacing for footnote area
  }

  private handleBlockFootnotes(block: Block): void {
    if (!block.metadata?.footnotes) return

    block.metadata.footnotes.forEach((footnote: any) => {
      // Check if footnote can fit on current page
      const footnoteHeight = 0.25 // Estimated height per footnote
      
      if (this.getRemainingHeight() < footnoteHeight) {
        // Push the source block to next page/column
        this.markColumnFull('footnote-overflow')
        return
      }

      this.columnState.footnotes.push({
        id: footnote.id,
        number: footnote.number,
        content: footnote.content,
        sourceBlockId: block.id
      })

      this.columnState.footnoteHeight += footnoteHeight
    })
  }

  private isAtomicBlock(block: Block): boolean {
    return ['figure', 'callout'].includes(block.type)
  }

  private isTextBlock(block: Block): boolean {
    return ['paragraph', 'quote'].includes(block.type)
  }

  private hasNextBlock(block: Block): boolean {
    // This would need to be provided by the layout engine context
    // For now, return false as a safe default
    return false
  }

  private estimateNextBlockHeight(block: Block): number {
    // This would need context from the layout engine
    // Return a reasonable default
    return 0.3
  }

  private checkOrphanWidowRules(block: Block, remainingHeight: number): boolean {
    const rules = block.paginationRules || {}
    const lineHeight = 0.167
    const availableLines = Math.floor(remainingHeight / lineHeight)
    
    const minOrphans = rules.minOrphans || 2
    const minWidows = rules.minWidows || 2

    // If we can fit the whole block, it's fine
    const blockHeight = this.estimateBlockHeight(block)
    const totalLines = Math.ceil(blockHeight / lineHeight)
    
    if (totalLines <= availableLines) {
      return true
    }

    // Check if we have enough lines for minimum orphans
    if (availableLines < minOrphans) {
      return false
    }

    // Check if remaining lines would violate widow rules
    const remainingLines = totalLines - availableLines
    if (remainingLines > 0 && remainingLines < minWidows) {
      return false
    }

    return true
  }
}

export class SidebarFlowManager implements FlowManager {
  private mainFlow: StandardFlowManager
  private sidebarBlocks: Block[] = []

  constructor(mainFlow: StandardFlowManager) {
    this.mainFlow = mainFlow
  }

  addBlock(block: Block): void {
    // Route blocks based on type
    if (this.isSidebarBlock(block)) {
      this.sidebarBlocks.push(block)
    } else {
      this.mainFlow.addBlock(block)
    }
  }

  canPlaceBlock(block: Block, remainingHeight: number, columnWidth: number): boolean {
    if (this.isSidebarBlock(block)) {
      // Sidebar blocks are placed differently
      return true
    }
    return this.mainFlow.canPlaceBlock(block, remainingHeight, columnWidth)
  }

  placeBlock(block: Block): boolean {
    if (this.isSidebarBlock(block)) {
      this.sidebarBlocks.push(block)
      return true
    }
    return this.mainFlow.placeBlock(block)
  }

  getCurrentHeight(): number {
    return this.mainFlow.getCurrentHeight()
  }

  getRemainingHeight(): number {
    return this.mainFlow.getRemainingHeight()
  }

  getBlocks(): Block[] {
    return this.mainFlow.getBlocks()
  }

  getSidebarBlocks(): Block[] {
    return [...this.sidebarBlocks]
  }

  isColumnFull(): boolean {
    return this.mainFlow.isColumnFull()
  }

  markColumnFull(reason: string): void {
    this.mainFlow.markColumnFull(reason)
  }

  private isSidebarBlock(block: Block): boolean {
    return block.type === 'callout' && block.metadata?.placement === 'sidebar'
  }
}
