// Legacy layout engine - maintained for backward compatibility
import { PageMaster, Section, Flow, Block } from './document-model'

// Use new engine internally but maintain legacy API
export { PourAndPaginateEngine as LayoutEngine } from './layout-engine/core'

// Legacy interfaces - keep these for backward compatibility
export interface PageBox {
  id: string
  pageNumber: number
  pageMaster: PageMaster
  columnBoxes: ColumnBox[]
  hasOverflow: boolean
  footnotes?: { id: string, number: number, content: string }[]
  footnoteHeight?: number
}

export interface ColumnBox {
  id: string
  columnIndex: number
  width: number
  height: number
  content: Block[]
  isFull: boolean
  metadata?: {
    endReason?: string
    blocksRemaining?: number
  }
}

export interface LayoutResult {
  pages: PageBox[]
  totalPages: number
  hasOverflow: boolean
}


// Restore synchronous generateLayout for backward compatibility
export const generateLayout = (section: Section, startPageNumber: number = 1): LayoutResult => {
  console.warn('generateLayout is deprecated. Use PourAndPaginateEngine for new implementations.')
  
  // Use simplified synchronous layout for backward compatibility
  const { pageMaster } = section
  
  // Calculate page dimensions
  const PAGE_SIZES = {
    Letter: { width: 8.5, height: 11 },
    A4: { width: 8.27, height: 11.69 },
    Legal: { width: 8.5, height: 14 },
    Tabloid: { width: 11, height: 17 }
  }
  
  const basePage = PAGE_SIZES[pageMaster.pageSize]
  const isLandscape = pageMaster.orientation === 'landscape'
  
  const pageSize = {
    width: isLandscape ? basePage.height : basePage.width,
    height: isLandscape ? basePage.width : basePage.height
  }
  
  const contentWidth = pageSize.width - pageMaster.margins.left - pageMaster.margins.right
  const contentHeight = pageSize.height - pageMaster.margins.top - pageMaster.margins.bottom
  const availableHeight = contentHeight - 
    (pageMaster.hasHeader ? 0.5 : 0) - 
    (pageMaster.hasFooter ? 0.5 : 0)
  
  const totalGapWidth = (pageMaster.columns - 1) * pageMaster.columnGap
  const columnWidth = (contentWidth - totalGapWidth) / pageMaster.columns
  
  // Collect all blocks
  const allBlocks: Block[] = []
  section.flows.forEach(flow => {
    allBlocks.push(...flow.blocks.sort((a, b) => a.order - b.order))
  })
  
  // Simple layout - distribute blocks across columns
  const pages: PageBox[] = []
  let blockIndex = 0
  let currentPageNumber = startPageNumber
  
  while (blockIndex < allBlocks.length || pages.length === 0) {
    const columnBoxes: ColumnBox[] = []
    let hasContent = false
    
    for (let colIndex = 0; colIndex < pageMaster.columns && blockIndex < allBlocks.length; colIndex++) {
      const columnBox: ColumnBox = {
        id: `page-${currentPageNumber}-col-${colIndex}`,
        columnIndex: colIndex,
        width: columnWidth,
        height: availableHeight,
        content: [],
        isFull: false
      }
      
      // Add blocks to column (simplified logic)
      const blocksPerColumn = Math.ceil((allBlocks.length - blockIndex) / (pageMaster.columns - colIndex))
      const columnBlocks = allBlocks.slice(blockIndex, blockIndex + Math.min(blocksPerColumn, 5))
      
      if (columnBlocks.length > 0) {
        columnBox.content = columnBlocks
        blockIndex += columnBlocks.length
        hasContent = true
      }
      
      columnBoxes.push(columnBox)
    }
    
    const pageBox: PageBox = {
      id: `page-${currentPageNumber}`,
      pageNumber: currentPageNumber,
      pageMaster,
      columnBoxes,
      hasOverflow: blockIndex < allBlocks.length
    }
    
    pages.push(pageBox)
    currentPageNumber++
    
    if (!hasContent) break
  }

  return {
    pages,
    totalPages: pages.length,
    hasOverflow: pages[pages.length - 1]?.hasOverflow || false
  }
}