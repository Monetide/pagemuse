// Legacy layout engine - deprecated
// Use @/lib/layout-engine/core for new implementations

import { PageMaster, Section, Flow, Block } from './document-model'

// Re-export for backward compatibility
export { PourAndPaginateEngine as LayoutEngine } from './layout-engine/core'
export type { LayoutResult, LayoutPageBox as PageBox, LayoutColumnBox as ColumnBox } from './layout-engine/core'

// Legacy interface for backward compatibility
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

// Legacy interface for backward compatibility  
export interface LayoutResult {
  pages: PageBox[]
  totalPages: number
  hasOverflow: boolean
}

// Legacy function - use PourAndPaginateEngine.layoutSection instead
export const generateLayout = async (section: Section, startPageNumber: number = 1): Promise<LayoutResult> => {
  console.warn('generateLayout is deprecated. Use PourAndPaginateEngine.layoutSection instead.')
  
  const { PourAndPaginateEngine } = await import('./layout-engine/core')
  const engine = new PourAndPaginateEngine()
  
  const result = await engine.layoutDocument(
    { title: '', sections: [section] },
    [section],
    {
      enableSidebarFlow: true,
      strictWidowOrphanControl: true,
      maxPagesPerSection: 500,
      footnoteStrategy: 'per-page',
      oversizedElementPolicy: 'scale'
    }
  )

  // Convert to legacy format
  return {
    pages: result.pages.map(page => ({
      id: page.id,
      pageNumber: page.pageNumber,
      pageMaster: page.pageMaster,
      columnBoxes: page.columnBoxes.map(col => ({
        id: col.id,
        columnIndex: col.columnIndex,
        width: col.width,
        height: col.height,
        content: col.content,
        isFull: col.isFull,
        metadata: col.metadata
      })),
      hasOverflow: page.hasOverflow,
      footnotes: page.footnotes,
      footnoteHeight: page.footnoteHeight
    })),
    totalPages: result.totalPages,
    hasOverflow: result.hasOverflow
  }
}