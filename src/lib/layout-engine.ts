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

// Enhanced content height estimation with text splitting capability
const estimateBlockHeight = (block: Block, columnWidth: number): number => {
  switch (block.type) {
    case 'heading':
      return 0.5 // inches - more realistic
    case 'paragraph':
      // More accurate estimate: 10-12 words per line, 6 lines per inch
      const text = block.content.toString()
      const wordCount = text.split(' ').length
      const avgWordsPerLine = Math.floor(columnWidth * 1.8) // rough estimation based on column width
      const linesNeeded = Math.ceil(wordCount / avgWordsPerLine)
      return linesNeeded * 0.167 // 6 lines per inch = 0.167 inches per line
    case 'image':
      return 2 // inches
    case 'list':
      const items = Array.isArray(block.content) ? block.content.length : 3
      return items * 0.25 // inches per item
    case 'quote':
      return 0.8 // inches
    case 'code':
      return 1.5 // inches
    default:
      return 0.3 // inches
  }
}

// Split a block if it's too large for remaining space
const splitBlock = (block: Block, maxHeight: number, columnWidth: number): Block[] => {
  const totalHeight = estimateBlockHeight(block, columnWidth)
  
  if (totalHeight <= maxHeight || block.type !== 'paragraph') {
    return [block] // Can't or don't need to split
  }
  
  const text = block.content.toString()
  const words = text.split(' ')
  const avgWordsPerLine = Math.floor(columnWidth * 1.8)
  const maxLines = Math.floor(maxHeight / 0.167)
  const maxWordsInChunk = maxLines * avgWordsPerLine
  
  const chunks: Block[] = []
  let wordIndex = 0
  let chunkIndex = 0
  
  while (wordIndex < words.length) {
    const chunkWords = words.slice(wordIndex, wordIndex + maxWordsInChunk)
    const chunkText = chunkWords.join(' ')
    
    chunks.push({
      ...block,
      id: `${block.id}-chunk-${chunkIndex}`,
      content: chunkText,
      metadata: {
        ...block.metadata,
        isChunk: true,
        chunkIndex,
        originalBlockId: block.id
      }
    })
    
    wordIndex += maxWordsInChunk
    chunkIndex++
  }
  
  return chunks
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
  
  // Collect all blocks from all flows and prepare for splitting
  const allBlocks: Block[] = []
  section.flows.forEach(flow => {
    allBlocks.push(...flow.blocks.sort((a, b) => a.order - b.order))
  })
  
  // Process blocks and split them as needed during layout
  const pages: PageBox[] = []
  let currentPageNumber = 1
  let blockQueue = [...allBlocks] // Queue of blocks to be placed
  
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
      
      // Fill column with blocks, splitting when necessary
      let currentColumnHeight = 0
      
      while (blockQueue.length > 0) {
        const nextBlock = blockQueue[0]
        const blockHeight = estimateBlockHeight(nextBlock, columnWidth)
        const remainingHeight = availableHeight - currentColumnHeight
        
        // If block fits completely, add it
        if (blockHeight <= remainingHeight) {
          columnBox.content.push(blockQueue.shift()!)
          currentColumnHeight += blockHeight
          pageHasContent = true
        }
        // If block doesn't fit but we can split it (paragraph only)
        else if (nextBlock.type === 'paragraph' && remainingHeight > 0.5) {
          const splitBlocks = splitBlock(nextBlock, remainingHeight, columnWidth)
          
          if (splitBlocks.length > 1) {
            // Remove original block and add split blocks to queue
            blockQueue.shift()
            blockQueue.unshift(...splitBlocks)
            
            // Add the first chunk that fits in remaining space
            const firstChunk = blockQueue.shift()!
            columnBox.content.push(firstChunk)
            currentColumnHeight += estimateBlockHeight(firstChunk, columnWidth)
            pageHasContent = true
          } else {
            // Can't split effectively, mark column as full
            columnBox.isFull = true
            break
          }
        }
        // Block doesn't fit and can't be split, mark column as full
        else {
          columnBox.isFull = true
          break
        }
      }
      
      columnBoxes.push(columnBox)
      
      // If no more blocks, don't fill remaining columns
      if (blockQueue.length === 0) break
    }
    
    const pageBox: PageBox = {
      id: `page-${currentPageNumber}`,
      pageNumber: currentPageNumber,
      pageMaster,
      columnBoxes,
      hasOverflow: blockQueue.length > 0
    }
    
    pages.push(pageBox)
    currentPageNumber++
    
    // Continue if there are remaining blocks or if this is the first page (always show at least one)
  } while (blockQueue.length > 0 || pages.length === 0)
  
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