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

// Enhanced content height estimation with text splitting capability
const estimateBlockHeight = (block: Block, columnWidth: number): number => {
  switch (block.type) {
    case 'heading':
      // H1 = 0.6", H2 = 0.5", H3 = 0.4"
      const level = block.metadata?.level || 1
      return level === 1 ? 0.6 : level === 2 ? 0.5 : 0.4
    case 'paragraph':
      // More accurate estimate: 10-12 words per line, 6 lines per inch
      const text = block.content.toString()
      const wordCount = text.split(' ').length
      const avgWordsPerLine = Math.floor(columnWidth * 1.8) // rough estimation based on column width
      const linesNeeded = Math.ceil(wordCount / avgWordsPerLine)
      return linesNeeded * 0.167 // 6 lines per inch = 0.167 inches per line
    case 'ordered-list':
    case 'unordered-list':
      const items = Array.isArray(block.content) ? block.content.length : 1
      return items * 0.25 + 0.2 // inches per item plus list padding
    case 'quote':
      const quoteText = block.content.toString()
      const quoteWords = quoteText.split(' ').length
      const quoteLines = Math.ceil(quoteWords / (columnWidth * 1.5)) // slightly fewer words per line due to indentation
      return quoteLines * 0.167 + 0.3 // plus quote padding
    case 'figure':
      // Figure = image height + caption + spacing
      const imageHeight = block.metadata?.imageHeight || 2 // default 2 inches
      const captionHeight = block.content?.caption ? 0.3 : 0 // caption height
      return imageHeight + captionHeight + 0.2 // spacing
    case 'table':
      // Table height = header + data rows + spacing
      const tableData = block.content || { headers: [], rows: [] }
      const headerHeight = 0.3 // inches for header row
      const rowHeight = 0.25 // inches per data row
      const dataRowCount = Array.isArray(tableData.rows) ? tableData.rows.length : 0
      return headerHeight + (dataRowCount * rowHeight) + 0.2 // plus spacing
    case 'divider':
      return 0.2 // inches
    case 'spacer':
      return block.metadata?.height || 0.5 // configurable spacer height
    default:
      return 0.3 // inches
  }
}

// Enhanced pagination rule checking
const checkPaginationRules = (
  block: Block, 
  nextBlock: Block | null,
  remainingHeight: number,
  columnWidth: number,
  blockQueue: Block[]
): { canPlace: boolean; reason?: string } => {
  const blockHeight = estimateBlockHeight(block, columnWidth)
  const rules = block.paginationRules || {}
  
  // Check if block fits at all
  if (blockHeight > remainingHeight) {
    return { canPlace: false, reason: 'insufficient-space' }
  }
  
  // Check keep-with-next rule
  if (rules.keepWithNext && nextBlock) {
    const nextBlockHeight = estimateBlockHeight(nextBlock, columnWidth)
    const minNextHeight = Math.min(nextBlockHeight, 0.3) // At least some of next block
    
    if (remainingHeight < blockHeight + minNextHeight) {
      return { canPlace: false, reason: 'keep-with-next' }
    }
  }
  
  // Check minimum orphans (lines at bottom)
  if (rules.minOrphans && rules.minOrphans > 0) {
    const lineHeight = 0.167 // inches per line
    const minOrphanHeight = rules.minOrphans * lineHeight
    
    if (block.type === 'paragraph' && blockHeight > minOrphanHeight) {
      const availableLines = Math.floor(remainingHeight / lineHeight)
      const blockLines = Math.ceil(blockHeight / lineHeight)
      
      if (availableLines > 0 && availableLines < rules.minOrphans && blockLines > availableLines) {
        return { canPlace: false, reason: 'orphan-protection' }
      }
    }
  }
  
  // Check break-avoid preference
  if (rules.breakAvoid && blockHeight > remainingHeight * 0.7) {
    // If block takes up most of remaining space, prefer to move to next column
    return { canPlace: false, reason: 'break-avoid' }
  }
  
  return { canPlace: true }
}

// Check if splitting a block would violate widow/orphan rules
const canSplitWithRules = (
  block: Block,
  remainingHeight: number,
  columnWidth: number
): { canSplit: boolean; reason?: string } => {
  const rules = block.paginationRules || {}
  
  // Atomic blocks (figures) can never be split
  if (block.type === 'figure') {
    return { canSplit: false, reason: 'atomic-block' }
  }
  
  // Tables can be split between rows but not within rows
  if (block.type === 'table') {
    return canSplitTable(block, remainingHeight, columnWidth)
  }
  
  if (rules.keepTogether) {
    return { canSplit: false, reason: 'keep-together' }
  }
  
  if (rules.breakAvoid && block.type !== 'paragraph') {
    return { canSplit: false, reason: 'break-avoid' }
  }
  
  // Check widow/orphan rules for splittable content
  if (block.type === 'paragraph' || block.type === 'quote') {
    const lineHeight = 0.167
    const availableLines = Math.floor(remainingHeight / lineHeight)
    const minOrphans = rules.minOrphans || 2
    const minWidows = rules.minWidows || 2
    
    if (availableLines < minOrphans) {
      return { canSplit: false, reason: 'orphan-protection' }
    }
    
    const totalLines = Math.ceil(estimateBlockHeight(block, columnWidth) / lineHeight)
    const remainingLines = totalLines - availableLines
    
    if (remainingLines > 0 && remainingLines < minWidows) {
      return { canSplit: false, reason: 'widow-protection' }
    }
  }
  
  return { canSplit: true }
}

// Special handling for table splitting
const canSplitTable = (
  block: Block,
  remainingHeight: number,
  columnWidth: number
): { canSplit: boolean; reason?: string } => {
  const tableData = block.content || { headers: [], rows: [] }
  const headerHeight = 0.3
  const rowHeight = 0.25
  
  // Need at least space for header + 1 data row
  const minTableHeight = headerHeight + rowHeight + 0.2
  
  if (remainingHeight < minTableHeight) {
    return { canSplit: false, reason: 'insufficient-space-for-header' }
  }
  
  // Calculate how many complete rows can fit
  const availableRowSpace = remainingHeight - headerHeight - 0.2
  const fittableRows = Math.floor(availableRowSpace / rowHeight)
  
  if (fittableRows >= 1) {
    return { canSplit: true }
  }
  
  return { canSplit: false, reason: 'no-complete-rows-fit' }
}

// Split table between rows with header repetition
const splitTable = (
  block: Block,
  remainingHeight: number,
  columnWidth: number
): Block[] => {
  const tableData = block.content || { headers: [], rows: [] }
  const headerHeight = 0.3
  const rowHeight = 0.25
  
  const availableRowSpace = remainingHeight - headerHeight - 0.2
  const fittableRows = Math.floor(availableRowSpace / rowHeight)
  
  if (fittableRows <= 0 || !Array.isArray(tableData.rows)) {
    return [block] // Can't split effectively
  }
  
  const firstPartRows = tableData.rows.slice(0, fittableRows)
  const remainingRows = tableData.rows.slice(fittableRows)
  
  const chunks: Block[] = []
  let chunkIndex = 0
  
  // First chunk (fits in current column)
  chunks.push({
    ...block,
    id: `${block.id}-chunk-${chunkIndex}`,
    content: {
      ...tableData,
      rows: firstPartRows
    },
    metadata: {
      ...block.metadata,
      isTableChunk: true,
      chunkIndex,
      originalBlockId: block.id,
      totalChunks: Math.ceil(tableData.rows.length / fittableRows)
    }
  })
  
  // Remaining chunks
  let remainingRowsToProcess = remainingRows
  while (remainingRowsToProcess.length > 0) {
    chunkIndex++
    
    // Calculate rows for next chunk (assuming full column height)
    const fullColumnHeight = 8 // approximate full column height in inches
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
        totalChunks: Math.ceil(tableData.rows.length / Math.max(fittableRows, fullColumnRows))
      }
    })
  }
  
  return chunks
}
const splitBlock = (block: Block, maxHeight: number, columnWidth: number): Block[] => {
  const totalHeight = estimateBlockHeight(block, columnWidth)
  
  if (totalHeight <= maxHeight || !['paragraph', 'quote'].includes(block.type)) {
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
      
      // Fill column with blocks, applying pagination rules
      let currentColumnHeight = 0
      
      while (blockQueue.length > 0) {
        const nextBlock = blockQueue[0]
        const followingBlock = blockQueue.length > 1 ? blockQueue[1] : null
        const remainingHeight = availableHeight - currentColumnHeight
        
        // Check pagination rules
        const ruleCheck = checkPaginationRules(
          nextBlock, 
          followingBlock, 
          remainingHeight, 
          columnWidth, 
          blockQueue
        )
        
        if (ruleCheck.canPlace) {
          // Block can be placed, add it
          const block = blockQueue.shift()!
          columnBox.content.push(block)
          currentColumnHeight += estimateBlockHeight(block, columnWidth)
          pageHasContent = true
          
          // Add debug info about rule application
          if (block.metadata) {
            block.metadata.placementReason = 'normal'
          }
        } else {
          // Block cannot be placed due to pagination rules
          if (ruleCheck.reason === 'insufficient-space' || ruleCheck.reason === 'break-avoid') {
            // Try splitting if possible
            const splitCheck = canSplitWithRules(nextBlock, remainingHeight, columnWidth)
            
            if (splitCheck.canSplit && ['paragraph', 'quote', 'table'].includes(nextBlock.type) && remainingHeight > 0.5) {
              let splitBlocks: Block[]
              
              if (nextBlock.type === 'table') {
                splitBlocks = splitTable(nextBlock, remainingHeight, columnWidth)
              } else {
                splitBlocks = splitBlock(nextBlock, remainingHeight, columnWidth)
              }
              
              if (splitBlocks.length > 1) {
                // Remove original and add split blocks
                blockQueue.shift()
                blockQueue.unshift(...splitBlocks)
                
                // Place first chunk
                const firstChunk = blockQueue.shift()!
                columnBox.content.push(firstChunk)
                currentColumnHeight += estimateBlockHeight(firstChunk, columnWidth)
                pageHasContent = true
                
                // Mark as split due to pagination rules
                if (firstChunk.metadata) {
                  firstChunk.metadata.placementReason = `split-${ruleCheck.reason}`
                }
                continue
              }
            }
          }
          
          // Cannot place or split - mark column as full
          columnBox.isFull = true
          
          // Add metadata about why column ended
          columnBox.metadata = {
            endReason: ruleCheck.reason,
            blocksRemaining: blockQueue.length
          }
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