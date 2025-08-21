import { Section } from '@/lib/document-model'
import { generateLayout, PageBox } from '@/lib/layout-engine'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface PaginatedLayoutPreviewProps {
  section: Section
}

const PAGE_SIZES = {
  Letter: { width: 8.5, height: 11 },
  A4: { width: 8.27, height: 11.69 },
  Legal: { width: 8.5, height: 14 },
  Tabloid: { width: 11, height: 17 }
}

const PageBoxPreview = ({ pageBox }: { pageBox: PageBox }) => {
  const pageSize = PAGE_SIZES[pageBox.pageMaster.pageSize]
  
  // Scale factor to fit preview (max 250px width)
  const maxWidth = 250
  const scale = Math.min(maxWidth / pageSize.width, 350 / pageSize.height)
  
  const previewWidth = pageSize.width * scale
  const previewHeight = pageSize.height * scale
  
  // Convert margins to preview scale
  const margins = {
    top: pageBox.pageMaster.margins.top * scale,
    right: pageBox.pageMaster.margins.right * scale,
    bottom: pageBox.pageMaster.margins.bottom * scale,
    left: pageBox.pageMaster.margins.left * scale
  }
  
  // Content area dimensions
  const contentWidth = previewWidth - margins.left - margins.right
  const contentHeight = previewHeight - margins.top - margins.bottom
  
  // Header/footer heights
  const headerHeight = pageBox.pageMaster.hasHeader ? 0.5 * scale : 0
  const footerHeight = pageBox.pageMaster.hasFooter ? 0.5 * scale : 0
  
  // Column calculations
  const columnGap = pageBox.pageMaster.columnGap * scale
  
  return (
    <div className="flex flex-col items-center space-y-2">
      <Badge variant="outline" className="text-xs">
        Page {pageBox.pageNumber}
        {pageBox.hasOverflow && " (overflow)"}
      </Badge>
      
      <div 
        className="relative border-2 border-border bg-background shadow-md"
        style={{ 
          width: previewWidth, 
          height: previewHeight 
        }}
      >
        {/* Page margins */}
        <div 
          className="absolute border border-dashed border-primary/30 bg-primary/5"
          style={{
            top: margins.top,
            left: margins.left,
            width: contentWidth,
            height: contentHeight
          }}
        >
          {/* Header */}
          {pageBox.pageMaster.hasHeader && (
            <div 
              className="absolute top-0 left-0 right-0 border-b border-muted bg-muted/50 flex items-center justify-center text-xs text-muted-foreground"
              style={{ height: headerHeight }}
            >
              Header
            </div>
          )}
          
          {/* Footer */}
          {pageBox.pageMaster.hasFooter && (
            <div 
              className="absolute bottom-0 left-0 right-0 border-t border-muted bg-muted/50 flex items-center justify-center text-xs text-muted-foreground"
              style={{ height: footerHeight }}
            >
              Footer
            </div>
          )}
          
          {/* Column boxes */}
          <div 
            className="absolute flex"
            style={{
              top: headerHeight,
              left: 0,
              right: 0,
              bottom: footerHeight,
              gap: columnGap
            }}
          >
            {pageBox.columnBoxes.map((columnBox, i) => (
              <div
                key={columnBox.id}
                className={`relative border-2 border-dashed flex flex-col ${
                  columnBox.isFull 
                    ? 'border-destructive/50 bg-destructive/10' 
                    : 'border-accent/50 bg-accent/10'
                }`}
                style={{ 
                  width: columnBox.width * scale,
                  height: '100%'
                }}
              >
                {/* Column header */}
                <div className="absolute top-1 left-1 right-1 text-xs text-muted-foreground text-center bg-background/80 rounded px-1">
                  Col {i + 1} {columnBox.content.length > 0 && `(${columnBox.content.length} blocks)`}
                </div>
                
                {/* Content blocks */}
                <div className="flex-1 p-2 pt-6 space-y-1">
                  {columnBox.content.map((block, blockIndex) => {
                    const isChunk = block.metadata?.isChunk
                    const chunkIndex = block.metadata?.chunkIndex
                    return (
                      <div
                        key={`${block.id}-${blockIndex}`}
                        className={`text-xs p-1 rounded border ${
                          block.type === 'heading' 
                            ? 'bg-primary/20 border-primary/30 font-semibold'
                            : 'bg-secondary/20 border-secondary/30'
                        } ${isChunk ? 'border-l-4 border-l-accent' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-xs">
                            {block.type}
                            {isChunk && (
                              <span className="ml-1 text-accent font-normal">
                                (cont. {chunkIndex! + 1})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="text-xs leading-tight overflow-hidden h-12">
                          {String(block.content)}
                        </div>
                      </div>
                    )
                  })}
                  {columnBox.content.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center italic mt-4">
                      Empty
                    </div>
                  )}
                </div>
                
                {columnBox.isFull && (
                  <div className="absolute bottom-1 left-1 right-1 text-xs text-destructive text-center bg-background/80 rounded px-1">
                    Full
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Page info */}
        <div className="absolute bottom-1 right-1 text-xs text-muted-foreground bg-background/80 px-1 rounded">
          {pageBox.pageMaster.pageSize}
        </div>
      </div>
    </div>
  )
}

export const PaginatedLayoutPreview = ({ section }: PaginatedLayoutPreviewProps) => {
  const layoutResult = generateLayout(section)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Layout Preview</Badge>
            {section.name}
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              {layoutResult.totalPages} page{layoutResult.totalPages !== 1 ? 's' : ''}
            </Badge>
            {layoutResult.hasOverflow && (
              <Badge variant="destructive" className="text-xs">
                Overflow
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="w-full">
          <div className="flex gap-6 pb-4">
            {layoutResult.pages.map(pageBox => (
              <PageBoxPreview key={pageBox.id} pageBox={pageBox} />
            ))}
          </div>
        </ScrollArea>
        
        {layoutResult.pages.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No pages generated
          </div>
        )}
        
        <div className="mt-4 text-xs text-muted-foreground space-y-1">
          <p>• Content flows automatically: Column 1 → Column 2 → Next Page</p>
          <p>• Long paragraphs split across columns/pages (shown with "cont." label)</p>
          <p>• Red borders indicate columns that are full and caused overflow</p>
          <p>• Blue left border indicates text continuation from previous column</p>
        </div>
      </CardContent>
    </Card>
  )
}