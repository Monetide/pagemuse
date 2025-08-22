import { Section, Block } from '@/lib/document-model'
import { generateLayout, PageBox } from '@/lib/layout-engine'
import { EditableBlockRenderer } from './EditableBlockRenderer'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Toggle } from '@/components/ui/toggle'
import { useState, useCallback } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Grid3x3, Columns, Square } from 'lucide-react'

interface EditorCanvasProps {
  section: Section
  onContentChange?: (blockId: string, newContent: any) => void
  onNewBlock?: (afterBlockId: string, type: Block['type']) => void
  onDeleteBlock?: (blockId: string) => void
  selectedBlockId?: string
  onBlockSelect?: (blockId: string) => void
}

interface OverlaySettings {
  showMargins: boolean
  showColumns: boolean
  showGrid: boolean
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
  onCreateFirstBlock,
  zoomLevel,
  overlaySettings
}: { 
  pageBox: PageBox
  onContentChange?: (blockId: string, newContent: any) => void
  onNewBlock?: (afterBlockId: string, type: Block['type']) => void
  onDeleteBlock?: (blockId: string) => void
  selectedBlockId?: string
  onSelectBlock?: (blockId: string) => void
  hasContent?: boolean
  onCreateFirstBlock?: () => void
  zoomLevel: number
  overlaySettings: OverlaySettings
}) => {
  const pageSize = PAGE_SIZES[pageBox.pageMaster.pageSize]
  
  // Base scale factor for canvas view, then apply zoom
  const baseMaxWidth = 600
  const baseScale = Math.min(baseMaxWidth / pageSize.width, 800 / pageSize.height)
  const scale = baseScale * zoomLevel
  
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
        {/* Margin Overlays */}
        {overlaySettings.showMargins && (
          <>
            {/* Top margin */}
            <div className="absolute bg-blue-500/10 border border-blue-500/30" style={{
              top: 0, left: 0, right: 0, height: margins.top
            }} />
            {/* Bottom margin */}
            <div className="absolute bg-blue-500/10 border border-blue-500/30" style={{
              bottom: 0, left: 0, right: 0, height: margins.bottom
            }} />
            {/* Left margin */}
            <div className="absolute bg-blue-500/10 border border-blue-500/30" style={{
              top: 0, bottom: 0, left: 0, width: margins.left
            }} />
            {/* Right margin */}
            <div className="absolute bg-blue-500/10 border border-blue-500/30" style={{
              top: 0, bottom: 0, right: 0, width: margins.right
            }} />
          </>
        )}

        {/* Baseline Grid Overlay */}
        {overlaySettings.showGrid && (
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: `linear-gradient(to bottom, transparent 23px, rgba(156, 163, 175, 0.2) 24px)`,
            backgroundSize: '24px 24px'
          }} />
        )}

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
                className="relative bg-background overflow-hidden"
                style={{ 
                  width: columnBox.width * scale,
                  height: '100%',
                  border: overlaySettings.showColumns ? '1px dashed rgb(34 197 94 / 0.5)' : '1px solid rgb(229 231 235 / 0.2)',
                  backgroundColor: overlaySettings.showColumns ? 'rgb(34 197 94 / 0.05)' : 'transparent'
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
  onDeleteBlock,
  selectedBlockId: externalSelectedBlockId,
  onBlockSelect
}: EditorCanvasProps) => {
  const [internalSelectedBlockId, setInternalSelectedBlockId] = useState<string>()
  const selectedBlockId = externalSelectedBlockId || internalSelectedBlockId
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>({
    showMargins: false,
    showColumns: false,
    showGrid: false
  })
  const layoutResult = generateLayout(section)

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5))
  }, [])

  const handleFitToWidth = useCallback(() => {
    const pageSize = PAGE_SIZES[layoutResult.pages[0]?.pageMaster?.pageSize || 'Letter']
    const containerWidth = 600 // Approximate container width
    const baseScale = containerWidth / (pageSize.width * 72) // Convert inches to pixels (72 DPI)
    setZoomLevel(baseScale)
  }, [layoutResult.pages])

  const handleFitToPage = useCallback(() => {
    setZoomLevel(1)
  }, [])

  const toggleOverlay = useCallback((overlay: keyof OverlaySettings) => {
    setOverlaySettings(prev => ({
      ...prev,
      [overlay]: !prev[overlay]
    }))
  }, [])

  const handleSelectBlock = useCallback((blockId: string) => {
    setInternalSelectedBlockId(blockId)
    onBlockSelect?.(blockId)
  }, [onBlockSelect])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // If clicking on the canvas background (not on a block), clear selection
    if (e.target === e.currentTarget) {
      setInternalSelectedBlockId(undefined)
      onBlockSelect?.('')
    }
  }, [onBlockSelect])

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
    <div className="h-full flex flex-col bg-background">
      {/* Canvas Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-1">
          <Toggle 
            pressed={overlaySettings.showMargins} 
            onPressedChange={() => toggleOverlay('showMargins')}
            size="sm"
            variant="outline"
          >
            <Square className="h-3 w-3" />
          </Toggle>
          <Toggle 
            pressed={overlaySettings.showColumns} 
            onPressedChange={() => toggleOverlay('showColumns')}
            size="sm"
            variant="outline"
          >
            <Columns className="h-3 w-3" />
          </Toggle>
          <Toggle 
            pressed={overlaySettings.showGrid} 
            onPressedChange={() => toggleOverlay('showGrid')}
            size="sm"
            variant="outline"
          >
            <Grid3x3 className="h-3 w-3" />
          </Toggle>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {layoutResult.totalPages} page{layoutResult.totalPages !== 1 ? 's' : ''}
          </Badge>
          {layoutResult.hasOverflow && (
            <Badge variant="destructive" className="text-xs">
              Overflow
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleZoomOut} 
            disabled={zoomLevel <= 0.5}
          >
            <ZoomOut className="h-3 w-3" />
          </Button>
          <span className="text-xs min-w-[40px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleZoomIn} 
            disabled={zoomLevel >= 2}
          >
            <ZoomIn className="h-3 w-3" />
          </Button>
          <Separator orientation="vertical" className="h-4 mx-1" />
          <Button variant="outline" size="sm" onClick={handleFitToWidth}>
            Fit Width
          </Button>
          <Button variant="outline" size="sm" onClick={handleFitToPage}>
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
        
      {/* Canvas Area */}
      <ScrollArea className="flex-1">
        <div 
          className="space-y-8 p-8 min-h-full cursor-text"
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
              zoomLevel={zoomLevel}
              overlaySettings={overlaySettings}
            />
          ))}
          
          {!hasContent && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center space-y-2">
                <p className="text-lg">Start writing your document</p>
                <button 
                  onClick={handleCreateFirstBlock}
                  className="text-primary hover:text-primary/80 underline"
                >
                  Click here to add your first paragraph
                </button>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}