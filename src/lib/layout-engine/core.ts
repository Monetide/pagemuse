import { Block, Section, PageMaster, PaginationRules } from '../document-model'
import { IRDocument } from '../ir-types'
import { StandardFlowManager, SidebarFlowManager, ColumnState, FootnoteEntry } from './flow-manager'
import { ContentHandlerFactory, PlacementResult } from './content-handlers'
import { AnchorTracker } from './anchor-tracker'

export interface LayoutPageBox {
  id: string
  pageNumber: number
  pageMaster: PageMaster
  columnBoxes: LayoutColumnBox[]
  hasOverflow: boolean
  footnotes: FootnoteEntry[]
  footnoteHeight: number
  sidebarBlocks?: Block[]
}

export interface LayoutColumnBox {
  id: string
  columnIndex: number
  width: number
  height: number
  content: Block[]
  isFull: boolean
  currentHeight: number
  metadata?: {
    endReason?: string
    blocksRemaining?: number
    splits?: number
  }
}

export interface PourLayoutResult {
  pages: LayoutPageBox[]
  totalPages: number
  hasOverflow: boolean
  anchorTracker: AnchorTracker
  statistics: {
    blocksProcessed: number
    pagesGenerated: number
    splits: number
    footnotes: number
  }
}

export interface LayoutConfig {
  enableSidebarFlow: boolean
  strictWidowOrphanControl: boolean
  maxPagesPerSection: number
  footnoteStrategy: 'per-page' | 'end-of-section'
  oversizedElementPolicy: 'scale' | 'landscape' | 'dedicated-page'
}

export class PourAndPaginateEngine {
  private anchorTracker = new AnchorTracker()
  private statistics = {
    blocksProcessed: 0,
    pagesGenerated: 0,
    splits: 0,
    footnotes: 0
  }

  async layoutDocument(
    irDocument: IRDocument,
    sections: Section[],
    config: LayoutConfig = this.getDefaultConfig()
  ): Promise<PourLayoutResult> {
    this.resetEngine()

    const allPages: LayoutPageBox[] = []
    let currentPageNumber = 1

    for (const section of sections) {
      const sectionResult = await this.layoutSection(section, currentPageNumber, config)
      allPages.push(...sectionResult.pages)
      currentPageNumber += sectionResult.pages.length
    }

    return {
      pages: allPages,
      totalPages: allPages.length,
      hasOverflow: allPages[allPages.length - 1]?.hasOverflow || false,
      anchorTracker: this.anchorTracker,
      statistics: this.statistics
    }
  }

  private async layoutSection(
    section: Section,
    startPageNumber: number,
    config: LayoutConfig
  ): Promise<PourLayoutResult> {
    const { pageMaster } = section
    const allPages: LayoutPageBox[] = []
    
    // Convert Section to simplified structure for layout
    const sectionBlocks = this.collectBlocks(section)

    
    // Calculate page dimensions
    const pageDimensions = this.calculatePageDimensions(pageMaster)
    const columnDimensions = this.calculateColumnDimensions(pageDimensions, pageMaster)

    // For now, return a simplified result for backward compatibility
    const processedBlocks = await this.preprocessBlocks(sectionBlocks, columnDimensions.width, config)

    const pageList: LayoutPageBox[] = []
    let currentPageNumber = startPageNumber

    // Simple page creation for compatibility
    const pageBox: LayoutPageBox = {
      id: `page-${currentPageNumber}`,
      pageNumber: currentPageNumber,
      pageMaster,
      columnBoxes: [{
        id: `page-${currentPageNumber}-col-0`,
        columnIndex: 0,
        width: columnDimensions.width,
        height: columnDimensions.height,
        content: processedBlocks.slice(0, 10), // Limit for demo
        isFull: processedBlocks.length > 10,
        currentHeight: 0
      }],
      hasOverflow: processedBlocks.length > 10,
      footnotes: [],
      footnoteHeight: 0
    }

    pageList.push(pageBox)

    return {
      pages: pageList,
      totalPages: pageList.length,
      hasOverflow: processedBlocks.length > 10,
      anchorTracker: this.anchorTracker,
      statistics: this.statistics
    }
  }

  private async createPage(
    blockQueue: Block[],
    pageNumber: number,
    pageMaster: PageMaster,
    pageDimensions: any,
    columnDimensions: any,
    config: LayoutConfig
  ): Promise<{
    page: LayoutPageBox | null
    remainingBlocks: Block[]
    blocksProcessed: number
  }> {
    const columnBoxes: LayoutColumnBox[] = []
    const pageFootnotes: FootnoteEntry[] = []
    const sidebarBlocks: Block[] = []
    let totalBlocksProcessed = 0

    for (let columnIndex = 0; columnIndex < pageMaster.columns; columnIndex++) {
      const flowManager = config.enableSidebarFlow && columnIndex === 0 
        ? new SidebarFlowManager(
            new StandardFlowManager(
              `page-${pageNumber}-col-${columnIndex}`,
              columnIndex,
              columnDimensions.width,
              columnDimensions.height,
              pageFootnotes
            )
          )
        : new StandardFlowManager(
            `page-${pageNumber}-col-${columnIndex}`,
            columnIndex,
            columnDimensions.width,
            columnDimensions.height,
            pageFootnotes
          )

      const columnResult = await this.fillColumn(
        flowManager,
        blockQueue,
        columnDimensions,
        config
      )

      const columnState = flowManager.getColumnState()
      const columnBox: LayoutColumnBox = {
        id: columnState.id,
        columnIndex: columnState.index,
        width: columnState.width,
        height: columnState.height,
        content: columnState.blocks,
        isFull: columnState.isFull,
        currentHeight: columnState.currentHeight,
        metadata: {
          endReason: columnState.endReason,
          blocksRemaining: blockQueue.length,
          splits: this.statistics.splits
        }
      }

      columnBoxes.push(columnBox)
      blockQueue = columnResult.remainingBlocks
      totalBlocksProcessed += columnResult.blocksProcessed

      // Collect sidebar blocks if using sidebar flow
      if (flowManager instanceof SidebarFlowManager) {
        sidebarBlocks.push(...flowManager.getSidebarBlocks())
      }

      // Stop processing columns if no blocks remain
      if (blockQueue.length === 0) {
        break
      }
    }

    const page: LayoutPageBox = {
      id: `page-${pageNumber}`,
      pageNumber,
      pageMaster,
      columnBoxes,
      hasOverflow: blockQueue.length > 0,
      footnotes: pageFootnotes,
      footnoteHeight: this.calculateFootnoteHeight(pageFootnotes),
      sidebarBlocks: sidebarBlocks.length > 0 ? sidebarBlocks : undefined
    }

    return {
      page,
      remainingBlocks: blockQueue,
      blocksProcessed: totalBlocksProcessed
    }
  }

  private async fillColumn(
    flowManager: StandardFlowManager | SidebarFlowManager,
    blockQueue: Block[],
    columnDimensions: any,
    config: LayoutConfig
  ): Promise<{
    remainingBlocks: Block[]
    blocksProcessed: number
  }> {
    let blocksProcessed = 0
    const remainingBlocks = [...blockQueue]

    while (remainingBlocks.length > 0 && !flowManager.isColumnFull()) {
      const currentBlock = remainingBlocks[0]
      const nextBlock = remainingBlocks.length > 1 ? remainingBlocks[1] : undefined

      const handler = ContentHandlerFactory.getHandler(currentBlock.type)
      const placementResult = handler.checkPlacementRules(
        currentBlock,
        flowManager.getRemainingHeight(),
        columnDimensions.width,
        nextBlock
      )

      if (placementResult.canPlace) {
        if (placementResult.mustSplit) {
          // Split the block
          const splitBlocks = handler.split(
            currentBlock,
            flowManager.getRemainingHeight(),
            columnDimensions.width
          )

          if (splitBlocks.length > 1) {
            // Remove original block and add split parts
            remainingBlocks.shift()
            remainingBlocks.unshift(...splitBlocks)
            this.statistics.splits++
            
            // Place first part
            const firstPart = remainingBlocks.shift()!
            if (flowManager.placeBlock(firstPart)) {
              blocksProcessed++
              this.statistics.blocksProcessed++
            } else {
              remainingBlocks.unshift(firstPart)
              flowManager.markColumnFull('placement-failed')
            }
          } else {
            // Splitting didn't work, try to place as-is or mark column full
            remainingBlocks.shift()
            if (flowManager.placeBlock(currentBlock)) {
              blocksProcessed++
              this.statistics.blocksProcessed++
            } else {
              remainingBlocks.unshift(currentBlock)
              flowManager.markColumnFull('placement-failed')
            }
          }
        } else {
          // Place block normally
          remainingBlocks.shift()
          if (flowManager.placeBlock(currentBlock)) {
            blocksProcessed++
            this.statistics.blocksProcessed++
          } else {
            remainingBlocks.unshift(currentBlock)
            flowManager.markColumnFull('placement-failed')
          }
        }
      } else {
        // Cannot place block, column is effectively full
        flowManager.markColumnFull(placementResult.reason || 'cannot-place')
        break
      }
    }

    return {
      remainingBlocks,
      blocksProcessed
    }
  }

  private collectBlocks(section: Section): Block[] {
    const allBlocks: Block[] = []
    
    section.flows.forEach(flow => {
      const sortedBlocks = flow.blocks.sort((a, b) => a.order - b.order)
      allBlocks.push(...sortedBlocks)
    })

    return allBlocks
  }

  private async preprocessBlocks(
    blocks: Block[],
    columnWidth: number,
    config: LayoutConfig
  ): Promise<Block[]> {
    const processedBlocks: Block[] = []

    for (const block of blocks) {
      // Apply default pagination rules if not set
      const processedBlock = {
        ...block,
        paginationRules: this.applyDefaultPaginationRules(block)
      }

      // Handle oversized elements
      if (this.isOversizedElement(processedBlock, columnWidth)) {
        const policy = await this.handleOversizedElement(processedBlock, columnWidth, config)
        processedBlocks.push(policy.processedBlock)
      } else {
        processedBlocks.push(processedBlock)
      }
    }

    return processedBlocks
  }

  private applyDefaultPaginationRules(block: Block): PaginationRules {
    const existingRules = block.paginationRules || {}
    
    switch (block.type) {
      case 'heading':
        return {
          keepWithNext: true,
          minOrphans: 1,
          ...existingRules
        }
      case 'paragraph':
        return {
          minOrphans: 2,
          minWidows: 2,
          ...existingRules
        }
      case 'figure':
      case 'callout':
        return {
          keepTogether: true,
          breakAvoid: true,
          ...existingRules
        }
      case 'table':
        return {
          breakAvoid: true,
          ...existingRules
        }
      default:
        return existingRules
    }
  }

  private isOversizedElement(block: Block, columnWidth: number): boolean {
    if (block.type === 'table') {
      const tableData = block.content || { headers: [] }
      const estimatedWidth = Array.isArray(tableData.headers) ? tableData.headers.length * 1.5 : columnWidth
      return estimatedWidth > columnWidth * 1.2
    }
    
    if (block.type === 'figure') {
      const figureWidth = block.metadata?.width || block.metadata?.naturalWidth / 72 || columnWidth
      return figureWidth > columnWidth * 1.2
    }

    return false
  }

  private async handleOversizedElement(
    block: Block,
    columnWidth: number,
    config: LayoutConfig
  ): Promise<{ processedBlock: Block }> {
    // For now, just mark for special handling
    return {
      processedBlock: {
        ...block,
        metadata: {
          ...block.metadata,
          isOversized: true,
          oversizedPolicy: config.oversizedElementPolicy
        }
      }
    }
  }

  private calculatePageDimensions(pageMaster: PageMaster) {
    const PAGE_SIZES = {
      Letter: { width: 8.5, height: 11 },
      A4: { width: 8.27, height: 11.69 },
      Legal: { width: 8.5, height: 14 },
      Tabloid: { width: 11, height: 17 }
    }

    const basePage = PAGE_SIZES[pageMaster.pageSize]
    const isLandscape = pageMaster.orientation === 'landscape'

    return {
      width: isLandscape ? basePage.height : basePage.width,
      height: isLandscape ? basePage.width : basePage.height,
      contentWidth: (isLandscape ? basePage.height : basePage.width) - 
        pageMaster.margins.left - pageMaster.margins.right,
      contentHeight: (isLandscape ? basePage.width : basePage.height) - 
        pageMaster.margins.top - pageMaster.margins.bottom
    }
  }

  private calculateColumnDimensions(pageDimensions: any, pageMaster: PageMaster) {
    const availableHeight = pageDimensions.contentHeight - 
      (pageMaster.hasHeader ? 0.5 : 0) - 
      (pageMaster.hasFooter ? 0.5 : 0)

    const totalGapWidth = (pageMaster.columns - 1) * pageMaster.columnGap
    const columnWidth = (pageDimensions.contentWidth - totalGapWidth) / pageMaster.columns

    return {
      width: columnWidth,
      height: availableHeight
    }
  }

  private calculateFootnoteHeight(footnotes: FootnoteEntry[]): number {
    if (footnotes.length === 0) return 0
    return 0.25 + (footnotes.length * 0.25) // Base + per-footnote height
  }

  private registerPageAnchors(page: LayoutPageBox, pageNumber: number): void {
    page.columnBoxes.forEach((column, columnIndex) => {
      column.content.forEach((block, blockIndex) => {
        // Register anchors for blocks that need them
        if (this.shouldCreateAnchor(block)) {
          const anchorId = this.generateAnchorId(block)
          const anchorType = this.getAnchorType(block)
          
          this.anchorTracker.registerAnchor(
            anchorId,
            anchorType,
            block.id,
            pageNumber,
            columnIndex,
            blockIndex,
            this.getBlockTitle(block)
          )
        }
      })
    })
  }

  private shouldCreateAnchor(block: Block): boolean {
    return ['heading', 'figure', 'table'].includes(block.type)
  }

  private generateAnchorId(block: Block): string {
    return block.metadata?.anchorId || `anchor-${block.id}`
  }

  private getAnchorType(block: Block): 'heading' | 'figure' | 'table' | 'callout' {
    return block.type as 'heading' | 'figure' | 'table' | 'callout'
  }

  private getBlockTitle(block: Block): string {
    switch (block.type) {
      case 'heading':
        return block.content?.text || block.content?.toString() || 'Untitled'
      case 'figure':
        return block.content?.caption || 'Untitled Figure'
      case 'table':
        return block.content?.caption || 'Untitled Table'
      default:
        return 'Untitled'
    }
  }

  private getDefaultConfig(): LayoutConfig {
    return {
      enableSidebarFlow: true,
      strictWidowOrphanControl: true,
      maxPagesPerSection: 500,
      footnoteStrategy: 'per-page',
      oversizedElementPolicy: 'scale'
    }
  }

  private resetEngine(): void {
    this.anchorTracker.clear()
    this.statistics = {
      blocksProcessed: 0,
      pagesGenerated: 0,
      splits: 0,
      footnotes: 0
    }
  }
}