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
// Add helper function for table width estimation
const estimateTableWidth = (tableData: any, baseColumnWidth: number): number => {
  if (!tableData?.headers) return baseColumnWidth
  
  // Rough estimate: each column needs at least 1 inch, plus content
  const columnCount = Array.isArray(tableData.headers) ? tableData.headers.length : 1
  const minColumnWidth = 1 // inches
  const estimatedWidth = columnCount * minColumnWidth
  
  return estimatedWidth
}

// Add helper for figure width estimation
const estimateFigureWidth = (figureData: any, baseColumnWidth: number): number => {
  if (!figureData) return baseColumnWidth
  
  // Check if figure has explicit width
  if (figureData.width) {
    return figureData.width
  }
  
  // Default to natural image width or full column
  return figureData.naturalWidth ? figureData.naturalWidth / 72 : baseColumnWidth // Convert pixels to inches
}

// Oversized element policies - cascade through these approaches
const applyOversizedElementPolicies = (
  block: Block,
  availableWidth: number,
  contentWidth: number,
  pageMaster: PageMaster
): { 
  newPageMaster?: PageMaster,
  scaledBlock?: Block,
  requiresDedicatedPage?: boolean,
  policyApplied?: string 
} => {
  let elementWidth = 0
  
  // Determine element width
  if (block.type === 'table') {
    elementWidth = estimateTableWidth(block.content, availableWidth)
  } else if (block.type === 'figure') {
    elementWidth = estimateFigureWidth(block.content, availableWidth)
  } else {
    return {} // Not an oversized element type
  }
  
  // Policy 1: Scale above minimum legibility (if within 150% of available width)
  const MIN_LEGIBILITY_SCALE = 0.7 // Don't scale below 70%
  const SCALE_THRESHOLD = 1.5 // Scale if within 150% of available width
  
  if (elementWidth > availableWidth && elementWidth <= availableWidth * SCALE_THRESHOLD) {
    const scaleRatio = Math.max(MIN_LEGIBILITY_SCALE, availableWidth / elementWidth)
    
    const scaledBlock = {
      ...block,
      metadata: {
        ...block.metadata,
        oversizedPolicy: 'scaled',
        originalWidth: elementWidth,
        scaleRatio,
        scaledWidth: elementWidth * scaleRatio
      }
    }
    
    return { 
      scaledBlock, 
      policyApplied: `scaled-${Math.round(scaleRatio * 100)}%` 
    }
  }
  
  // Policy 2: Auto landscape page (if portrait and element fits in landscape)
  if (pageMaster.orientation === 'portrait') {
    // Calculate landscape dimensions
    const PAGE_SIZES = {
      Letter: { width: 8.5, height: 11 },
      A4: { width: 8.27, height: 11.69 },
      Legal: { width: 8.5, height: 14 },
      Tabloid: { width: 11, height: 17 }
    }
    
    const basePage = PAGE_SIZES[pageMaster.pageSize]
    const landscapeContentWidth = basePage.height - pageMaster.margins.left - pageMaster.margins.right
    const landscapeColumnWidth = (landscapeContentWidth - (pageMaster.columns - 1) * pageMaster.columnGap) / pageMaster.columns
    
    if (elementWidth <= landscapeColumnWidth) {
      const newPageMaster = {
        ...pageMaster,
        orientation: 'landscape' as const,
        allowTableRotation: true
      }
      
      return { 
        newPageMaster, 
        policyApplied: 'auto-landscape' 
      }
    }
  }
  
  // Policy 3: Dedicate full page (use full content width)
  const fullPageColumnWidth = contentWidth // Single column using full width
  
  if (elementWidth > availableWidth) {
    return { 
      requiresDedicatedPage: true, 
      policyApplied: 'dedicated-page' 
    }
  }
  
  return {}
}

// Global context holder (you may want to implement this differently)
let currentSectionContext: any = null
const getCurrentSection = () => currentSectionContext

// Set context function (call this from generateLayout)
const setCurrentSection = (section: any) => {
  currentSectionContext = section
}

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
      
      // Check if table rotation is enabled and table is wide
      const section = getCurrentSection() // You'll need to pass this context
      const isRotationEnabled = section?.pageMaster?.allowTableRotation || false
      const tableWidth = estimateTableWidth(tableData, columnWidth)
      
      if (isRotationEnabled && tableWidth > columnWidth * 1.2) {
        // Wide table, potentially rotated - different height calculation
        return headerHeight + (dataRowCount * rowHeight) + 0.4 // extra spacing for rotation
      }
      
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
  
  // Set context for table width calculations
  setCurrentSection(section)
  
  // Calculate page dimensions (in inches) with orientation support
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
  
  // Process blocks and apply oversized element policies
  const processedBlocks: Block[] = []
  let currentPageMaster = { ...pageMaster }
  
  // Pre-process blocks to apply oversized element policies
  for (const block of allBlocks) {
    if (block.type === 'table' || block.type === 'figure') {
      const policy = applyOversizedElementPolicies(block, columnWidth, contentWidth, currentPageMaster)
      
      if (policy.scaledBlock) {
        processedBlocks.push(policy.scaledBlock)
      } else if (policy.newPageMaster) {
        // Apply landscape orientation for this and subsequent blocks
        currentPageMaster = policy.newPageMaster
        processedBlocks.push({
          ...block,
          metadata: {
            ...block.metadata,
            oversizedPolicy: 'auto-landscape',
            policyApplied: policy.policyApplied
          }
        })
      } else if (policy.requiresDedicatedPage) {
        processedBlocks.push({
          ...block,
          metadata: {
            ...block.metadata,
            oversizedPolicy: 'dedicated-page',
            policyApplied: policy.policyApplied,
            requiresDedicatedPage: true
          }
        })
      } else {
        processedBlocks.push(block)
      }
    } else {
      processedBlocks.push(block)
    }
  }

  // Process blocks and split them as needed during layout
  const pages: PageBox[] = []
  let currentPageNumber = 1
  let blockQueue = [...processedBlocks] // Queue of blocks to be placed
  
  // Recalculate dimensions with potentially updated page master
  const updatedBasePage = PAGE_SIZES[currentPageMaster.pageSize]
  const updatedIsLandscape = currentPageMaster.orientation === 'landscape'
  
  const updatedPageSize = {
    width: updatedIsLandscape ? updatedBasePage.height : updatedBasePage.width,
    height: updatedIsLandscape ? updatedBasePage.width : updatedBasePage.height
  }
  
  const updatedContentWidth = updatedPageSize.width - currentPageMaster.margins.left - currentPageMaster.margins.right
  const updatedContentHeight = updatedPageSize.height - currentPageMaster.margins.top - currentPageMaster.margins.bottom
  
  const updatedAvailableHeight = updatedContentHeight - 
    (currentPageMaster.hasHeader ? 0.5 : 0) - 
    (currentPageMaster.hasFooter ? 0.5 : 0)
  
  const updatedTotalGapWidth = (currentPageMaster.columns - 1) * currentPageMaster.columnGap
  const updatedColumnWidth = (updatedContentWidth - updatedTotalGapWidth) / currentPageMaster.columns
  
  // Always create at least one page, even if empty
  do {
    const columnBoxes: ColumnBox[] = []
    let pageHasContent = false
    let currentPageMasterForPage = currentPageMaster
    let dedicatedPageCreated = false
    
    // Check if the next block needs a dedicated page
    if (blockQueue.length > 0 && blockQueue[0].metadata?.requiresDedicatedPage) {
      const block = blockQueue.shift()!
      
      // Create dedicated page with single column using full content width
      const dedicatedColumnBox: ColumnBox = {
        id: `page-${currentPageNumber}-dedicated`,
        columnIndex: 0,
        width: updatedContentWidth,
        height: updatedAvailableHeight,
        content: [block],
        isFull: true,
        metadata: {
          endReason: 'dedicated-page-complete',
          blocksRemaining: blockQueue.length
        }
      }
      
      const dedicatedPageBox: PageBox = {
        id: `page-${currentPageNumber}`,
        pageNumber: currentPageNumber,
        pageMaster: {
          ...currentPageMasterForPage,
          columns: 1 // Force single column for dedicated page
        },
        columnBoxes: [dedicatedColumnBox],
        hasOverflow: blockQueue.length > 0
      }
      
      pages.push(dedicatedPageBox)
      currentPageNumber++
      dedicatedPageCreated = true
      
      // Mark block placement
      if (block.metadata) {
        block.metadata.placementReason = 'dedicated-page'
      }
    }
    
    // If we created a dedicated page, continue to next iteration
    if (dedicatedPageCreated) {
      continue
    }
    
    // Create column boxes for this page (normal multi-column layout)
    for (let colIndex = 0; colIndex < currentPageMasterForPage.columns; colIndex++) {
      const columnBox: ColumnBox = {
        id: `page-${currentPageNumber}-col-${colIndex}`,
        columnIndex: colIndex,
        width: updatedColumnWidth,
        height: updatedAvailableHeight,
        content: [],
        isFull: false
      }
      
      // Fill column with blocks, applying pagination rules
      let currentColumnHeight = 0
      
      while (blockQueue.length > 0) {
        const nextBlock = blockQueue[0]
        const followingBlock = blockQueue.length > 1 ? blockQueue[1] : null
        const remainingHeight = updatedAvailableHeight - currentColumnHeight
        
        // Skip dedicated page blocks in normal columns (handled above)
        if (nextBlock.metadata?.requiresDedicatedPage) {
          columnBox.isFull = true
          columnBox.metadata = {
            endReason: 'dedicated-page-required',
            blocksRemaining: blockQueue.length
          }
          break
        }
        
        // Check pagination rules
        const ruleCheck = checkPaginationRules(
          nextBlock, 
          followingBlock, 
          remainingHeight, 
          updatedColumnWidth, 
          blockQueue
        )
        
        if (ruleCheck.canPlace) {
          // Block can be placed, add it
          const block = blockQueue.shift()!
          columnBox.content.push(block)
          currentColumnHeight += estimateBlockHeight(block, updatedColumnWidth)
          pageHasContent = true
          
          // Add debug info about rule application
          if (block.metadata) {
            block.metadata.placementReason = 'normal'
          }
        } else {
          // Block cannot be placed due to pagination rules
          if (ruleCheck.reason === 'insufficient-space' || ruleCheck.reason === 'break-avoid') {
            // Try splitting if possible
            const splitCheck = canSplitWithRules(nextBlock, remainingHeight, updatedColumnWidth)
            
            if (splitCheck.canSplit && ['paragraph', 'quote', 'table'].includes(nextBlock.type) && remainingHeight > 0.5) {
              let splitBlocks: Block[]
              
              if (nextBlock.type === 'table') {
                splitBlocks = splitTable(nextBlock, remainingHeight, updatedColumnWidth)
              } else {
                splitBlocks = splitBlock(nextBlock, remainingHeight, updatedColumnWidth)
              }
              
              if (splitBlocks.length > 1) {
                // Remove original and add split blocks
                blockQueue.shift()
                blockQueue.unshift(...splitBlocks)
                
                // Place first chunk
                const firstChunk = blockQueue.shift()!
                columnBox.content.push(firstChunk)
                currentColumnHeight += estimateBlockHeight(firstChunk, updatedColumnWidth)
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
    
    // Only create regular page if we didn't create a dedicated page
    if (!dedicatedPageCreated) {
      const pageBox: PageBox = {
        id: `page-${currentPageNumber}`,
        pageNumber: currentPageNumber,
        pageMaster: currentPageMasterForPage,
        columnBoxes,
        hasOverflow: blockQueue.length > 0
      }
      
      pages.push(pageBox)
      currentPageNumber++
    }
    
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