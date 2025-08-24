import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { FileText, Hash, MessageSquare, StickyNote } from 'lucide-react'
import { PourLayoutResult as LayoutResult, LayoutPageBox, LayoutColumnBox } from '@/lib/layout-engine/core'
import { Block } from '@/lib/document-model'
import { cn } from '@/lib/utils'

interface PaginatedRendererProps {
  layoutResult: LayoutResult
  showPageNumbers?: boolean
  showColumnBorders?: boolean
  showAnchors?: boolean
  showMetadata?: boolean
  className?: string
  scale?: number
}

export function PaginatedRenderer({
  layoutResult,
  showPageNumbers = true,
  showColumnBorders = false,
  showAnchors = false,
  showMetadata = false,
  className,
  scale = 0.5
}: PaginatedRendererProps) {
  const renderBlock = (block: Block, blockIndex: number, columnIndex: number, pageNumber: number) => {
    const baseClasses = "mb-2 transition-colors duration-200"
    const anchorId = block.metadata?.anchorId || `${block.type}-${block.id}`

    switch (block.type) {
      case 'heading':
        const level = block.metadata?.level || 1
        const HeadingTag = `h${Math.min(level, 6)}` as keyof JSX.IntrinsicElements
        const headingClasses = cn(
          baseClasses,
          level === 1 && "text-xl font-bold text-foreground mb-3",
          level === 2 && "text-lg font-semibold text-foreground mb-2",
          level >= 3 && "text-base font-medium text-foreground mb-2"
        )
        
        return (
          <HeadingTag key={block.id} id={anchorId} className={headingClasses}>
            {showAnchors && (
              <Hash className="inline w-3 h-3 mr-1 text-muted-foreground" />
            )}
            {block.content?.text || block.content?.toString() || 'Untitled Heading'}
            {block.metadata?.isChunk && (
              <Badge variant="outline" className="ml-2 text-xs">
                Chunk {block.metadata.chunkIndex + 1}
              </Badge>
            )}
          </HeadingTag>
        )

      case 'paragraph':
        return (
          <p key={block.id} className={cn(baseClasses, "text-sm text-foreground leading-relaxed")}>
            {block.content?.toString() || ''}
            {block.metadata?.isChunk && (
              <Badge variant="outline" className="ml-2 text-xs">
                Part {block.metadata.chunkIndex + 1}
              </Badge>
            )}
          </p>
        )

      case 'figure':
        return (
          <div key={block.id} id={anchorId} className={cn(baseClasses, "border border-dashed border-muted-foreground/30 rounded p-3 bg-muted/20")}>
            <div className="flex items-center justify-center h-16 bg-muted/50 rounded mb-2">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            {block.content?.caption && (
              <p className="text-xs text-muted-foreground text-center">
                {showAnchors && "Figure: "}
                {block.content.caption}
              </p>
            )}
            {block.metadata?.isOversized && (
              <Badge variant="outline" className="mt-1 text-xs">
                {block.metadata.oversizedPolicy}
              </Badge>
            )}
          </div>
        )

      case 'table':
        const tableData = block.content || { headers: [], rows: [] }
        return (
          <div key={block.id} id={anchorId} className={cn(baseClasses, "border rounded")}>
            <div className="overflow-hidden">
              <table className="w-full text-xs">
                {tableData.headers && tableData.headers.length > 0 && (
                  <thead className="bg-muted/50">
                    <tr>
                      {tableData.headers.map((header: string, index: number) => (
                        <th key={index} className="px-2 py-1 text-left border-r border-border last:border-r-0">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                {tableData.rows && tableData.rows.length > 0 && (
                  <tbody>
                    {tableData.rows.map((row: string[], rowIndex: number) => (
                      <tr key={rowIndex} className="border-t border-border">
                        {row.map((cell: string, cellIndex: number) => (
                          <td key={cellIndex} className="px-2 py-1 border-r border-border last:border-r-0">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
            {block.metadata?.isTableChunk && (
              <div className="p-2 bg-muted/30 border-t border-border">
                <Badge variant="outline" className="text-xs">
                  Table Part {block.metadata.chunkIndex + 1}
                  {block.metadata.hasHeaderRepeat && " (Header Repeated)"}
                </Badge>
              </div>
            )}
            {block.content?.caption && (
              <p className="text-xs text-muted-foreground text-center p-2 border-t border-border">
                {showAnchors && "Table: "}
                {block.content.caption}
              </p>
            )}
          </div>
        )

      case 'callout':
        return (
          <div key={block.id} className={cn(baseClasses, "border-l-4 border-primary bg-primary/5 p-3 rounded-r")}>
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                {block.content?.title && (
                  <h6 className="font-medium text-primary mb-1">{block.content.title}</h6>
                )}
                <p className="text-xs text-foreground">
                  {block.content?.content || block.content?.toString() || ''}
                </p>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div key={block.id} className={cn(baseClasses, "text-xs text-muted-foreground italic")}>
            {block.type}: {block.content?.toString()?.slice(0, 50) || 'No content'}...
          </div>
        )
    }
  }

  const renderColumn = (column: LayoutColumnBox, pageNumber: number) => {
    return (
      <div
        key={column.id}
        className={cn(
          "flex-1 min-h-0",
          showColumnBorders && "border border-dashed border-muted-foreground/20 rounded p-2"
        )}
        style={{ 
          maxHeight: `${column.height * scale * 72}px`, // Convert inches to pixels at scale
          width: `${column.width * scale * 72}px`
        }}
      >
        {/* Column content */}
        <div className="h-full overflow-hidden">
          {column.content.map((block, blockIndex) => 
            renderBlock(block, blockIndex, column.columnIndex, pageNumber)
          )}
        </div>

        {/* Column metadata */}
        {showMetadata && column.metadata && (
          <div className="mt-2 pt-2 border-t border-dashed border-muted-foreground/20">
            <div className="text-xs text-muted-foreground space-y-1">
              <div>Height: {column.currentHeight.toFixed(2)}"</div>
              <div>Blocks: {column.content.length}</div>
              {column.metadata.endReason && (
                <Badge variant="outline" className="text-xs">
                  {column.metadata.endReason}
                </Badge>
              )}
              {column.metadata.splits && column.metadata.splits > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {column.metadata.splits} splits
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderFootnotes = (page: LayoutPageBox) => {
    if (!page.footnotes || page.footnotes.length === 0) return null

    return (
      <div className="mt-2 pt-2 border-t border-foreground/20">
        <div className="space-y-1">
          {page.footnotes.map((footnote) => (
            <div key={footnote.id} className="flex gap-1 text-xs">
              <span className="text-muted-foreground">{footnote.number}.</span>
              <span className="text-muted-foreground">{footnote.content}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderSidebar = (page: LayoutPageBox) => {
    if (!page.sidebarBlocks || page.sidebarBlocks.length === 0) return null

    return (
      <div className="w-32 border-l border-dashed border-muted-foreground/20 pl-2 ml-2">
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <StickyNote className="w-3 h-3" />
            Sidebar
          </div>
          {page.sidebarBlocks.map((block, index) => (
            <div key={block.id} className="text-xs p-2 bg-muted/30 rounded">
              {block.content?.title && (
                <div className="font-medium mb-1">{block.content.title}</div>
              )}
              <div className="text-muted-foreground">
                {block.content?.content || block.content?.toString() || ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderPage = (page: LayoutPageBox) => {
    const aspectRatio = page.pageMaster.orientation === 'landscape' ? 11/8.5 : 8.5/11
    
    return (
      <Card key={page.id} className="p-4 bg-background border shadow-sm">
        {/* Page header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Page {page.pageNumber}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {page.pageMaster.columns} col
            </Badge>
            {page.pageMaster.orientation === 'landscape' && (
              <Badge variant="secondary" className="text-xs">Landscape</Badge>
            )}
          </div>
          
          {showMetadata && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Blocks: {page.columnBoxes.reduce((sum, col) => sum + col.content.length, 0)}</span>
              {page.footnotes.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {page.footnotes.length} footnotes
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Page content */}
        <div className="flex gap-2">
          {/* Main columns */}
          <div className="flex-1 flex gap-2">
            {page.columnBoxes.map(column => renderColumn(column, page.pageNumber))}
          </div>
          
          {/* Sidebar */}
          {renderSidebar(page)}
        </div>

        {/* Footnotes */}
        {renderFootnotes(page)}

        {/* Page overflow indicator */}
        {page.hasOverflow && (
          <div className="mt-2 pt-2 border-t border-dashed border-warning/50">
            <Badge variant="outline" className="text-xs text-warning border-warning">
              Content continues on next page
            </Badge>
          </div>
        )}
      </Card>
    )
  }

  if (!layoutResult || layoutResult.pages.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-muted-foreground">
          <FileText className="w-8 h-8 mx-auto mb-2" />
          <p>No content to display</p>
        </div>
      </Card>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Layout summary */}
      {showMetadata && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Layout Statistics</h3>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Pages: {layoutResult.totalPages}</span>
              <span>Blocks: {layoutResult.statistics.blocksProcessed}</span>
              <span>Splits: {layoutResult.statistics.splits}</span>
              <span>Anchors: {layoutResult.anchorTracker.getAllAnchors().length}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Pages */}
      <div className="space-y-6">
        {layoutResult.pages.map(page => renderPage(page))}
      </div>

      {/* Layout metadata */}
      {showMetadata && (
        <Card className="p-4">
          <h3 className="text-sm font-medium mb-3">Cross-References & Anchors</h3>
          <div className="space-y-2">
            {layoutResult.anchorTracker.getAllAnchors().map(anchor => (
              <div key={anchor.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">{anchor.type}</Badge>
                  <span>{anchor.title}</span>
                </div>
                <span className="text-muted-foreground">Page {anchor.pageNumber}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}