import { Section, Block } from '@/lib/document-model'
import { generateLayout, PageBox } from '@/lib/layout-engine'
import { EditableBlockRenderer } from './EditableBlockRenderer'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState, useCallback } from 'react'

interface EditorCanvasProps {
  section: Section
  onContentChange?: (blockId: string, newContent: any) => void
  onNewBlock?: (afterBlockId: string, type: Block['type']) => void
  onDeleteBlock?: (blockId: string) => void
}

const PAGE_SIZES = {
  Letter: { width: 8.5, height: 11 },
  A4: { width: 8.27, height: 11.69 },
  Legal: { width: 8.5, height: 14 },
  Tabloid: { width: 11, height: 17 }
}

const EditorPageBox = ({ 
  pageBox, 
  onContentChange, 
  onNewBlock, 
  onDeleteBlock,
  selectedBlockId,
  onSelectBlock,
  hasContent,
  onCreateFirstBlock
}: { 
  pageBox: PageBox
  onContentChange?: (blockId: string, newContent: any) => void
  onNewBlock?: (afterBlockId: string, type: Block['type']) => void
  onDeleteBlock?: (blockId: string) => void
  selectedBlockId?: string
  onSelectBlock?: (blockId: string) => void
  hasContent?: boolean
  onCreateFirstBlock?: () => void
}) => {
  const pageSize = PAGE_SIZES[pageBox.pageMaster.pageSize]
  
  // Scale factor for canvas view (larger than preview)
  const maxWidth = 600
  const scale = Math.min(maxWidth / pageSize.width, 800 / pageSize.height)
  
  const canvasWidth = pageSize.width * scale
  const canvasHeight = pageSize.height * scale
  
  // Convert margins to canvas scale
  const margins = {
    top: pageBox.pageMaster.margins.top * scale,
    right: pageBox.pageMaster.margins.right * scale,
    bottom: pageBox.pageMaster.margins.bottom * scale,
    left: pageBox.pageMaster.margins.left * scale
  }
  
  // Content area dimensions
  const contentWidth = canvasWidth - margins.left - margins.right
  const contentHeight = canvasHeight - margins.top - margins.bottom
  
  // Header/footer heights
  const headerHeight = pageBox.pageMaster.hasHeader ? 0.5 * scale : 0
  const footerHeight = pageBox.pageMaster.hasFooter ? 0.5 * scale : 0
  
  // Column calculations
  const columnGap = pageBox.pageMaster.columnGap * scale
  
  return (
    <div className="flex flex-col items-center space-y-4">
      <Badge variant="outline" className="text-sm">
        Page {pageBox.pageNumber}
        {pageBox.hasOverflow && " (overflow)"}
      </Badge>
      
      <div 
        className="relative border border-border bg-background shadow-lg"
        style={{ 
          width: canvasWidth, 
          height: canvasHeight 
        }}
      >
        {/* Page margins */}
        <div 
          className="absolute bg-background"
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
              className="absolute top-0 left-0 right-0 border-b border-muted bg-muted/20 flex items-center justify-center text-sm text-muted-foreground"
              style={{ height: headerHeight }}
            >
              Document Header
            </div>
          )}
          
          {/* Footer */}
          {pageBox.pageMaster.hasFooter && (
            <div 
              className="absolute bottom-0 left-0 right-0 border-t border-muted bg-muted/20 flex items-center justify-center text-sm text-muted-foreground"
              style={{ height: footerHeight }}
            >
              Page {pageBox.pageNumber}
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
                className="relative bg-background border-l border-r border-muted/20 first:border-l-0 last:border-r-0 overflow-hidden"
                style={{ 
                  width: columnBox.width * scale,
                  height: '100%'
                }}
              >
                {/* Column content */}
                <div className="h-full p-4 overflow-y-auto">
                  {columnBox.content.map((block, blockIndex) => (
                    <EditableBlockRenderer
                      key={`${block.id}-${blockIndex}`}
                      block={block}
                      onContentChange={onContentChange}
                      onNewBlock={onNewBlock}
                      onDeleteBlock={onDeleteBlock}
                      isSelected={selectedBlockId === block.id}
                      onSelect={onSelectBlock}
                    />
                  ))}
                  {columnBox.content.length === 0 && (
                    <div className="text-sm text-muted-foreground text-center italic mt-8">
                      {!hasContent ? (
                        <button 
                          onClick={onCreateFirstBlock}
                          className="text-primary hover:text-primary/80 underline"
                        >
                          Click to start typing...
                        </button>
                      ) : (
                        "Empty column"
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export const EditorCanvas = ({ 
  section, 
  onContentChange, 
  onNewBlock, 
  onDeleteBlock 
}: EditorCanvasProps) => {
  const [selectedBlockId, setSelectedBlockId] = useState<string>()
  const layoutResult = generateLayout(section)

  const handleSelectBlock = useCallback((blockId: string) => {
    setSelectedBlockId(blockId)
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // If clicking on the canvas background (not on a block), clear selection
    if (e.target === e.currentTarget) {
      setSelectedBlockId(undefined)
    }
  }, [])

  const handleCreateFirstBlock = useCallback(() => {
    // Find the first flow to add a block to
    const firstFlow = section.flows[0]
    if (firstFlow && onNewBlock) {
      // Create a dummy block ID to trigger addBlockAfter logic
      const dummyBlockId = 'create-first'
      onNewBlock(dummyBlockId, 'paragraph')
    }
  }, [section.flows, onNewBlock])

  const hasContent = section.flows.some(flow => flow.blocks.length > 0)

  return (
    <Card className="w-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Document Editor</h3>
          <div className="flex gap-2">
            <Badge variant="outline">
              {layoutResult.totalPages} page{layoutResult.totalPages !== 1 ? 's' : ''}
            </Badge>
            {layoutResult.hasOverflow && (
              <Badge variant="destructive">
                Overflow
              </Badge>
            )}
          </div>
        </div>
        
        <ScrollArea className="w-full h-[800px]">
          <div 
            className="space-y-8 pb-4 min-h-full cursor-text"
            onClick={handleCanvasClick}
          >
            {layoutResult.pages.map(pageBox => (
              <EditorPageBox 
                key={pageBox.id} 
                pageBox={pageBox}
                onContentChange={onContentChange}
                onNewBlock={onNewBlock}
                onDeleteBlock={onDeleteBlock}
                selectedBlockId={selectedBlockId}
                onSelectBlock={handleSelectBlock}
                hasContent={hasContent}
                onCreateFirstBlock={handleCreateFirstBlock}
              />
            ))}
          </div>
        </ScrollArea>
        
        {!hasContent && (
          <div className="flex items-center justify-center h-64 text-muted-foreground border-t">
            <div className="text-center space-y-2">
              <p>Your document is empty</p>
              <button 
                onClick={handleCreateFirstBlock}
                className="text-primary hover:text-primary/80 underline"
              >
                Click here to start writing
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-4 text-xs text-muted-foreground border-t pt-4">
          <p><strong>Editing:</strong> Click on text to edit • Press Enter to create new paragraph • Press Backspace on empty block to delete</p>
          <p><strong>Live pagination:</strong> Content automatically flows across columns and pages as you type</p>
        </div>
      </div>
    </Card>
  )
}