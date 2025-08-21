import { PageMaster, Section, Flow, Block } from './document-model'

export interface PageBox {
  id: string
  pageNumber: number
  pageMaster: PageMaster
  columnBoxes: ColumnBox[]
  hasOverflow: boolean
}

export interface ColumnBox {
  id: string
  columnIndex: number
  width: number
  height: number
  content: Block[]
  isFull: boolean
}

export interface LayoutResult {
  pages: PageBox[]
  totalPages: number
  hasOverflow: boolean
}

// Estimate content height (simplified for demo)
const estimateBlockHeight = (block: Block, columnWidth: number): number => {
  switch (block.type) {
    case 'heading':
      return 1.5 // inches
    case 'paragraph':
      // Rough estimate: 120 words per inch, 8 words per line
      const wordCount = block.content.toString().split(' ').length
      const linesNeeded = Math.ceil(wordCount / 8)
      return linesNeeded * 0.15 // 0.15 inches per line
    case 'image':
      return 3 // inches
    case 'list':
      const items = Array.isArray(block.content) ? block.content.length : 3
      return items * 0.2 // inches per item
    case 'quote':
      return 1 // inches
    case 'code':
      return 2 // inches
    default:
      return 0.5 // inches
  }
}

export const generateLayout = (section: Section): LayoutResult => {
  const { pageMaster } = section
  
  // Calculate page dimensions (in inches)
  const PAGE_SIZES = {
    Letter: { width: 8.5, height: 11 },
    A4: { width: 8.27, height: 11.69 },
    Legal: { width: 8.5, height: 14 },
    Tabloid: { width: 11, height: 17 }
  }
  
  const pageSize = PAGE_SIZES[pageMaster.pageSize]
  
  // Calculate content area
  const contentWidth = pageSize.width - pageMaster.margins.left - pageMaster.margins.right
  const contentHeight = pageSize.height - pageMaster.margins.top - pageMaster.margins.bottom
  
  // Subtract header/footer space
  const availableHeight = contentHeight - 
    (pageMaster.hasHeader ? 0.5 : 0) - 
    (pageMaster.hasFooter ? 0.5 : 0)
  
  // Calculate column dimensions
  const totalGapWidth = (pageMaster.columns - 1) * pageMaster.columnGap
  const columnWidth = (contentWidth - totalGapWidth) / pageMaster.columns
  
  // Collect all blocks from all flows
  const allBlocks: Block[] = []
  section.flows.forEach(flow => {
    allBlocks.push(...flow.blocks.sort((a, b) => a.order - b.order))
  })
  
  // Generate pages
  const pages: PageBox[] = []
  let currentPageNumber = 1
  let remainingBlocks = [...allBlocks]
  
  // Always create at least one page, even if empty
  do {
    const columnBoxes: ColumnBox[] = []
    let pageHasContent = false
    
    // Create column boxes for this page
    for (let colIndex = 0; colIndex < pageMaster.columns; colIndex++) {
      const columnBox: ColumnBox = {
        id: `page-${currentPageNumber}-col-${colIndex}`,
        columnIndex: colIndex,
        width: columnWidth,
        height: availableHeight,
        content: [],
        isFull: false
      }
      
      // Fill column with blocks
      let currentColumnHeight = 0
      
      while (remainingBlocks.length > 0) {
        const block = remainingBlocks[0]
        const blockHeight = estimateBlockHeight(block, columnWidth)
        
        // Check if block fits in current column
        if (currentColumnHeight + blockHeight <= availableHeight) {
          columnBox.content.push(remainingBlocks.shift()!)
          currentColumnHeight += blockHeight
          pageHasContent = true
        } else {
          columnBox.isFull = true
          break
        }
      }
      
      columnBoxes.push(columnBox)
      
      // If no more blocks, don't fill remaining columns
      if (remainingBlocks.length === 0) break
    }
    
    const pageBox: PageBox = {
      id: `page-${currentPageNumber}`,
      pageNumber: currentPageNumber,
      pageMaster,
      columnBoxes,
      hasOverflow: remainingBlocks.length > 0
    }
    
    pages.push(pageBox)
    currentPageNumber++
    
    // Continue if there are remaining blocks or if this is the first page (always show at least one)
  } while (remainingBlocks.length > 0 || pages.length === 0)
  
  // If no content was added to any page, ensure we show at least empty frames
  if (pages.length > 0 && !pages.some(page => page.columnBoxes.some(col => col.content.length > 0))) {
    // Add a second empty page to demonstrate pagination
    const emptyPageBox: PageBox = {
      id: `page-${currentPageNumber}`,
      pageNumber: currentPageNumber,
      pageMaster,
      columnBoxes: Array.from({ length: pageMaster.columns }, (_, colIndex) => ({
        id: `page-${currentPageNumber}-col-${colIndex}`,
        columnIndex: colIndex,
        width: columnWidth,
        height: availableHeight,
        content: [],
        isFull: false
      })),
      hasOverflow: false
    }
    pages.push(emptyPageBox)
  }
  
  return {
    pages,
    totalPages: pages.length,
    hasOverflow: pages[pages.length - 1]?.hasOverflow || false
  }
}