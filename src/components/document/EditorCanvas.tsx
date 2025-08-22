import { Section, Block, SemanticDocument } from '@/lib/document-model'
import { generateLayout, PageBox } from '@/lib/layout-engine'
import { EditableBlockRenderer } from './EditableBlockRenderer'
import { EmptyCanvasState } from './EmptyCanvasState'
import { CanvasDropZone } from './CanvasDropZone'
import { ImportDialog, ImportMode } from '@/components/import/ImportDialog'
import { Rulers } from './Rulers'
import { SnapGuides } from './SnapGuides'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Toggle } from '@/components/ui/toggle'
import { useState, useCallback, useEffect, useRef } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Grid3x3, Columns, Square, Ruler, Eye, EyeOff } from 'lucide-react'
import { useAccessibility } from '@/components/accessibility/AccessibilityProvider'
import { useKeyboardNavigation, useFocusManagement } from '@/hooks/useKeyboardNavigation'
import { useDragDropContext } from '@/contexts/DragDropContext'
import { useDropZoneDetection } from '@/hooks/useDropZoneDetection'
import { getDefaultBlockContent } from '@/lib/dragDropUtils'
import { DragGhost } from './DragGhost'
import { DropLine } from './DropLine'
import { BlockInsertionHotspots } from './BlockInsertionHotspots'
import { toast } from '@/hooks/use-toast'

interface EditorCanvasProps {
  section: Section
  document?: SemanticDocument | null
  onContentChange?: (blockId: string, newContent: any) => void
  onNewBlock?: (afterBlockId: string, type: Block['type'], content?: any, metadata?: any) => void
  onDeleteBlock?: (blockId: string) => void
  onBlockTypeChange?: (blockId: string, type: Block['type'], metadata?: any) => void
  selectedBlockId?: string
  onBlockSelect?: (blockId: string) => void
  onFocusChange?: (blockId: string | null) => void
  onTitleChange?: (newTitle: string) => void
  onImport?: (files: File[], mode: ImportMode) => Promise<void>
  templateSnippets?: import('@/lib/template-model').TemplateSnippet[]
}

interface OverlaySettings {
  showMargins: boolean
  showColumns: boolean
  showGrid: boolean
  showRulers: boolean
  enableSnapping: boolean
  showInvisibles: boolean
}

const PAGE_SIZES = {
  Letter: { width: 8.5, height: 11 },
  A4: { width: 8.27, height: 11.69 },
  Legal: { width: 8.5, height: 14 },
  Tabloid: { width: 11, height: 17 }
}

const EditorPageBox = ({ 
  pageBox, 
  document,
  onContentChange, 
  onNewBlock, 
  onDeleteBlock,
  onBlockTypeChange,
  selectedBlockId,
  onSelectBlock,
  hasContent,
  onCreateFirstBlock,
  onTitleChange,
  zoomLevel,
  overlaySettings,
  section
}: { 
  pageBox: PageBox
  document?: SemanticDocument | null
  onContentChange?: (blockId: string, newContent: any) => void
  onNewBlock?: (afterBlockId: string, type: Block['type'], content?: any, metadata?: any) => void
  onDeleteBlock?: (blockId: string) => void
  onBlockTypeChange?: (blockId: string, type: Block['type'], metadata?: any) => void
  selectedBlockId?: string
  onSelectBlock?: (blockId: string) => void
  hasContent?: boolean
  onCreateFirstBlock?: () => void
  onTitleChange?: (newTitle: string) => void
  zoomLevel: number
  overlaySettings: OverlaySettings
  section: Section
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
          className="relative border border-border bg-white shadow-lg"
          style={{ 
            width: canvasWidth, 
            height: canvasHeight 
          }}
        >
        {/* Rulers */}
        <Rulers
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          scale={scale}
          visible={overlaySettings.showRulers}
        />

        {/* Snap Guides */}
        <SnapGuides
          visible={overlaySettings.enableSnapping}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          scale={scale}
          margins={margins}
        />

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
          className="absolute bg-transparent"
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
                className="relative bg-transparent overflow-hidden"
                style={{ 
                  width: columnBox.width * scale,
                  height: '100%',
                  border: overlaySettings.showColumns ? '1px dashed rgb(34 197 94 / 0.5)' : 'none',
                  backgroundColor: overlaySettings.showColumns ? 'rgb(34 197 94 / 0.05)' : 'transparent'
                }}
              >
                {/* Column content */}
                <div className="h-full p-4 overflow-y-auto" data-flow-id={section.flows[0]?.id || 'default-flow'} data-section-id={section.id}>
                  {columnBox.content.length === 0 && !hasContent ? (
                    <EmptyCanvasState 
                      onNewBlock={onNewBlock}
                      onMultipleBlocks={onNewBlock ? (blocks: Block[]) => {
                        // Insert multiple blocks sequentially
                        let currentAfterId = 'create-first'
                        blocks.forEach((block, index) => {
                          onNewBlock(currentAfterId, block.type, block.content, { sectionId: section.id, ...block.metadata })
                          // For subsequent blocks, update the afterId
                          currentAfterId = block.id || `block-${index}`
                        })
                      } : undefined}
                      sectionId={section.id}
                      documentTitle={document?.title}
                      onTitleChange={onTitleChange}
                    />
                  ) : (
                    <>
                      {columnBox.content.map((block, blockIndex) => {
                        const flowInfo = (() => {
                          for (const f of section.flows) {
                            const idx = f.blocks.findIndex(b => b.id === block.id)
                            if (idx !== -1) return { flowId: f.id, index: idx }
                          }
                          return { flowId: section.flows[0]?.id || 'default-flow', index: blockIndex }
                        })()
                        return (
                          <EditableBlockRenderer
                            key={`${block.id}-${blockIndex}`}
                            block={block}
                            document={document}
                            onContentChange={onContentChange}
                            onNewBlock={onNewBlock}
                            onMultipleBlocks={onNewBlock ? (afterBlockId: string, blocks: Block[]) => {
                              // Insert multiple blocks sequentially
                              let currentAfterId = afterBlockId
                              blocks.forEach((newBlock, index) => {
                                onNewBlock(currentAfterId, newBlock.type, newBlock.content, newBlock.metadata)
                                // For subsequent blocks, we'll need to find the newly created block ID
                                // This is a simplified approach - in a real implementation, we'd need proper ID tracking
                                if (index < blocks.length - 1) {
                                  currentAfterId = `${currentAfterId}-${index}`
                                }
                              })
                            } : undefined}
                            onDeleteBlock={onDeleteBlock}
                            onBlockTypeChange={onBlockTypeChange}
                            isSelected={selectedBlockId === block.id}
                            onSelect={onSelectBlock}
                            showInvisibles={overlaySettings.showInvisibles}
                            sectionId={section.id}
                            flowId={flowInfo.flowId}
                            index={flowInfo.index}
                          />
                        )
                      })}
                      {columnBox.content.length === 0 && hasContent && (
                        <div className="text-sm text-muted-foreground text-center italic mt-8">
                          Empty column
                        </div>
                      )}
                    </>
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
  document,
  onContentChange, 
  onNewBlock, 
  onDeleteBlock,
  onBlockTypeChange,
  selectedBlockId: externalSelectedBlockId,
  onBlockSelect,
  onFocusChange,
  onTitleChange,
  onImport
}: EditorCanvasProps) => {
  const [internalSelectedBlockId, setInternalSelectedBlockId] = useState<string>()
  const selectedBlockId = externalSelectedBlockId || internalSelectedBlockId
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [overlaySettings, setOverlaySettings] = useState<OverlaySettings>({
    showMargins: false,
    showColumns: false,
    showGrid: false,
    showRulers: false,
    enableSnapping: false,
    showInvisibles: false
  })
  
  // File drop zone state
  const [isFileDropZoneVisible, setIsFileDropZoneVisible] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [droppedFiles, setDroppedFiles] = useState<File[]>([])
  const dragCounterRef = useRef(0)
  
  const { focusedSection, setFocusedSection, announce } = useAccessibility()
  const canvasRef = useRef<HTMLDivElement>(null)
  const { updateFocusableElements, focusNext, focusPrevious } = useFocusManagement()
  const { dragState, updateDrag, endDrag, setContainer } = useDragDropContext()
  const { hitTestDropZone } = useDropZoneDetection()
  const layoutResult = generateLayout(section)
  const isFocused = focusedSection === 'canvas'

  // Get all blocks for keyboard navigation
  const allBlocks = section.flows.flatMap(flow => flow.blocks).sort((a, b) => a.order - b.order)
  const currentBlockIndex = allBlocks.findIndex(block => block.id === selectedBlockId)
  
  // Determine if document is empty or near-empty
  const hasContent = allBlocks.length > 0
  const isEmpty = allBlocks.length === 0
  const isNearEmpty = allBlocks.length <= 2 && allBlocks.every(block => 
    (!block.content || 
     (typeof block.content === 'string' && block.content.trim().length < 50) ||
     (typeof block.content === 'object' && 
      (!block.content.text || block.content.text.trim().length < 50)))
  )

  // File drag and drop handlers
  const handleFileDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Check if dragging files (not blocks)
    const hasFiles = e.dataTransfer.types.includes('Files')
    if (hasFiles) {
      dragCounterRef.current++
      if (dragCounterRef.current === 1) {
        setIsFileDropZoneVisible(true)
      }
    }
  }, [])

  const handleFileDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    dragCounterRef.current--
    if (dragCounterRef.current === 0) {
      setIsFileDropZoneVisible(false)
    }
  }, [])

  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleFileDrop = useCallback((files: File[]) => {
    setIsFileDropZoneVisible(false)
    dragCounterRef.current = 0
    
    if (files.length > 0) {
      setDroppedFiles(files)
      setImportDialogOpen(true)
    }
  }, [])

  const handleImportDialogImport = useCallback(async (files: File[], mode: ImportMode) => {
    try {
      if (onImport) {
        await onImport(files, mode)
        toast({
          title: 'Import successful',
          description: `Imported ${files.length} file${files.length !== 1 ? 's' : ''} successfully.`
        })
      }
    } catch (error) {
      console.error('Import failed:', error)
      toast({
        title: 'Import failed',
        description: 'There was an error importing your files. Please try again.',
        variant: 'destructive'
      })
    }
  }, [onImport])

  useEffect(() => {
    if (canvasRef.current) {
      updateFocusableElements(canvasRef.current)
      setContainer(canvasRef.current)
    }
  }, [updateFocusableElements, section, setContainer])

  // Keyboard navigation for blocks
  useKeyboardNavigation({
    onArrowDown: () => {
      if (isFocused && currentBlockIndex < allBlocks.length - 1) {
        const nextBlock = allBlocks[currentBlockIndex + 1]
        handleSelectBlock(nextBlock.id)
        announce(`Selected ${nextBlock.type} block`)
      }
    },
    onArrowUp: () => {
      if (isFocused && currentBlockIndex > 0) {
        const prevBlock = allBlocks[currentBlockIndex - 1]
        handleSelectBlock(prevBlock.id)
        announce(`Selected ${prevBlock.type} block`)
      }
    },
    onEnter: () => {
      if (isFocused && selectedBlockId) {
        // Start editing the selected block
        const blockElement = globalThis.document.getElementById(`block-${selectedBlockId}`)
        if (blockElement) {
          const editableElement = blockElement.querySelector('[contenteditable="true"]') as HTMLElement
          if (editableElement) {
            editableElement.focus()
          } else {
            blockElement.click()
          }
        }
      }
    },
    enabled: isFocused
  })

  const handleFocus = () => {
    setFocusedSection('canvas')
    announce('Navigating document canvas')
  }

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
    onFocusChange?.(blockId)
    
    // Scroll the block into view
    const blockElement = globalThis.document.getElementById(`block-${blockId}`)
    if (blockElement) {
      blockElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [onBlockSelect, onFocusChange])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // If clicking on the canvas background (not on a block), clear selection
    if (e.target === e.currentTarget) {
      setInternalSelectedBlockId(undefined)
      onBlockSelect?.('')
      onFocusChange?.(null)
    }
  }, [onBlockSelect, onFocusChange])

  const handleCreateFirstBlock = useCallback(() => {
    // Delegate creation to parent and pass current section context
    if (onNewBlock) {
      const dummyBlockId = 'create-first'
      onNewBlock(dummyBlockId, 'paragraph', undefined, { sectionId: section.id })
    }
  }, [onNewBlock, section.id])

  // Handle mouse move for drag operations
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging) return

    const clientX = e.clientX
    const clientY = e.clientY
    
    const result = hitTestDropZone(clientX, clientY, dragState.dragData?.blockType)
    
    updateDrag(
      { x: clientX, y: clientY },
      result.dropTarget,
      result.canDrop
    )
  }, [dragState.isDragging, dragState.dragData?.blockType, hitTestDropZone, updateDrag])

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!dragState.isDragging || !dragState.canDrop || !dragState.dropTarget) {
      endDrag()
      return
    }

    const { dropTarget, dragData } = dragState
    
    try {
      if (dragData?.type === 'block-type' && dragData.blockType && onNewBlock) {
        // Get default content for the block type
        const content = getDefaultBlockContent(dragData.blockType)
        
        // Find the target block using flow and index
        const flow = section.flows.find(f => f.id === dropTarget.flowId)
        let targetBlockId: string
        
        if (flow && flow.blocks.length > 0) {
          if (dropTarget.position === 'append') {
            // Insert at the end
            targetBlockId = flow.blocks[flow.blocks.length - 1].id
          } else {
            // Find block at the specified index
            const blockAtIndex = flow.blocks.find((_, idx) => idx === dropTarget.index)
            if (blockAtIndex) {
              targetBlockId = blockAtIndex.id
            } else {
              // Fallback to last block
              targetBlockId = flow.blocks[flow.blocks.length - 1].id
            }
          }
        } else {
          targetBlockId = 'create-first'
        }

        // Add metadata for insertion position
        const metadata: any = {}
        if (dropTarget.position === 'before') {
          metadata.insertBefore = true
        }

        // Create the new block
        onNewBlock(targetBlockId, dragData.blockType as Block['type'], content, metadata)
        
        // Focus the new block (will be handled by the parent component)
        announce(`Inserted ${dragData.blockType} block`)
      } else if (dragData?.type === 'snippet' && dragData.snippet && onNewBlock) {
        // Handle snippet insertion
        const snippet = dragData.snippet
        
        // Find target block
        const flow = section.flows.find(f => f.id === dropTarget.flowId)
        const targetBlockId = flow?.blocks.length ? flow.blocks[flow.blocks.length - 1].id : 'create-first'
        
        // Insert snippet blocks
        for (const block of snippet.content) {
          onNewBlock(targetBlockId, block.type, block.content, block.metadata)
        }
        
        announce(`Inserted ${snippet.name} snippet`)
      }
    } catch (error) {
      console.warn('Drop failed:', {
        dragSource: dragData,
        dropTarget,
        error
      })
      
      // Fallback: insert at end of active flow
      if (dragData?.blockType && onNewBlock) {
        const content = getDefaultBlockContent(dragData.blockType)
        const firstFlow = section.flows[0]
        if (firstFlow) {
          const lastBlock = firstFlow.blocks[firstFlow.blocks.length - 1]
          const targetBlockId = lastBlock ? lastBlock.id : 'create-first'
          onNewBlock(targetBlockId, dragData.blockType as Block['type'], content)
          
          toast({
            title: "Block inserted",
            description: "Dropped at end of section.",
          })
        }
      }
    }

    endDrag()
  }, [dragState, onNewBlock, section.flows, announce, endDrag])

  // Handle block-specific drop
  const handleBlockDrop = useCallback((blockId: string, position: 'before' | 'after') => {
    if (!dragState.isDragging || !dragState.canDrop || !dragState.dragData) {
      return
    }

    const { dragData } = dragState
    
    try {
      if (dragData?.type === 'block-type' && dragData.blockType && onNewBlock) {
        // Get default content for the block type
        const content = getDefaultBlockContent(dragData.blockType)
        
        // Add metadata for insertion position
        const metadata: any = {}
        if (position === 'before') {
          metadata.insertBefore = true
        }

        // Create the new block
        onNewBlock(blockId, dragData.blockType as Block['type'], content, metadata)
        
        announce(`Inserted ${dragData.blockType} block ${position} existing block`)
      }
    } catch (error) {
      console.warn('Block drop failed:', {
        dragSource: dragData,
        targetBlockId: blockId,
        position,
        error
      })
    }

    endDrag()
  }, [dragState, onNewBlock, announce, endDrag])

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (dragState.isDragging) {
      e.preventDefault()
      handleMouseMove(e as any)
    }
  }, [dragState.isDragging, handleMouseMove])

  // Handle drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear drop target if leaving the entire canvas
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      updateDrag({ x: 0, y: 0 }, null, false)
    }
  }, [updateDrag])

  // Render drop targets for blocks
  const renderBlockDropTargets = useCallback(() => {
    if (!dragState.isDragging) return null

    const dropLines: React.ReactElement[] = []
    const hotspots: React.ReactElement[] = []

    // Get all block elements and create drop targets
    section.flows.forEach(flow => {
      flow.blocks.forEach((block, index) => {
        const blockElement = globalThis.document?.getElementById(`block-${block.id}`) as HTMLElement
        if (!blockElement) return

        // Add insertion hotspots for this block
        hotspots.push(
          <BlockInsertionHotspots
            key={`hotspots-${block.id}`}
            blockId={block.id}
            sectionId={section.id}
            flowId={flow.id}
            index={index}
            element={blockElement}
            onDrop={(position) => handleBlockDrop(block.id, position)}
          />
        )

        // Add drop line if this is the active drop target
        if (dragState.dropTarget?.flowId === flow.id && dragState.dropTarget?.index === index) {
          dropLines.push(
            <DropLine
              key={`dropline-${block.id}`}
              sectionId={section.id}
              flowId={flow.id}
              index={index}
              position={dragState.dropTarget.position || 'after'}
              element={blockElement}
            />
          )
        }
      })
    })

    return (
      <>
        {hotspots}
        {dropLines}
      </>
    )
  }, [dragState.isDragging, dragState.dropTarget, section, handleBlockDrop])

  return (
    <div className="h-full flex flex-col bg-background" role="main" aria-label="Document editor">
      {/* Canvas Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30 shrink-0" role="toolbar" aria-label="Canvas controls">
        <div className="flex items-center gap-1">
          <Toggle 
            pressed={overlaySettings.showMargins} 
            onPressedChange={() => toggleOverlay('showMargins')}
            size="sm"
            variant="outline"
            title="Show Margins"
          >
            <Square className="h-3 w-3" />
          </Toggle>
          <Toggle 
            pressed={overlaySettings.showColumns} 
            onPressedChange={() => toggleOverlay('showColumns')}
            size="sm"
            variant="outline"
            title="Show Columns"
          >
            <Columns className="h-3 w-3" />
          </Toggle>
          <Toggle 
            pressed={overlaySettings.showGrid} 
            onPressedChange={() => toggleOverlay('showGrid')}
            size="sm"
            variant="outline"
            title="Show Baseline Grid"
          >
            <Grid3x3 className="h-3 w-3" />
          </Toggle>
          
          <Separator orientation="vertical" className="h-4 mx-1" />
          
          <Toggle 
            pressed={overlaySettings.showRulers} 
            onPressedChange={() => toggleOverlay('showRulers')}
            size="sm"
            variant="outline"
            title="Show Rulers"
          >
            <Ruler className="h-3 w-3" />
          </Toggle>
          <Toggle 
            pressed={overlaySettings.enableSnapping} 
            onPressedChange={() => toggleOverlay('enableSnapping')}
            size="sm"
            variant="outline"
            title="Enable Snapping"
          >
            <Grid3x3 className="h-3 w-3" />
          </Toggle>
          <Toggle 
            pressed={overlaySettings.showInvisibles} 
            onPressedChange={() => toggleOverlay('showInvisibles')}
            size="sm"
            variant="outline"
            title="Show Invisibles"
          >
            {overlaySettings.showInvisibles ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
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
          ref={canvasRef}
          className="space-y-8 p-8 min-h-full cursor-text"
          onClick={handleCanvasClick}
          onFocus={handleFocus}
          onDragEnter={handleFileDragEnter}
          onDragLeave={handleFileDragLeave}
          onDragOver={handleFileDragOver}
          onDrop={handleDrop}
          tabIndex={0}
          role="document"
          aria-label="Document content area"
          aria-describedby={selectedBlockId ? `block-${selectedBlockId}` : undefined}
          style={{ cursor: dragState.isDragging ? (dragState.canDrop ? 'copy' : 'no-drop') : 'text' }}
        >
          {layoutResult.pages.map(pageBox => (
            <EditorPageBox 
              key={pageBox.id} 
              pageBox={pageBox}
              document={document}
              onContentChange={onContentChange}
              onNewBlock={onNewBlock}
              onDeleteBlock={onDeleteBlock}
              onBlockTypeChange={onBlockTypeChange}
              selectedBlockId={selectedBlockId}
              onSelectBlock={handleSelectBlock}
              hasContent={hasContent}
              onCreateFirstBlock={handleCreateFirstBlock}
              onTitleChange={onTitleChange}
              zoomLevel={zoomLevel}
              overlaySettings={overlaySettings}
              section={section}
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

          {/* Drag and Drop Visual Feedback */}
          {renderBlockDropTargets()}
          <DragGhost />
        </div>
      </ScrollArea>

      {/* Canvas Drop Zone Overlay */}
      <CanvasDropZone
        isVisible={isFileDropZoneVisible}
        onFileDrop={handleFileDrop}
      />

      {/* Import Dialog */}
      <ImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImportDialogImport}
        defaultMode={isEmpty || isNearEmpty ? 'new-document' : 'insert-section'}
        canAppend={hasContent}
        canInsert={hasContent}
        canReplace={hasContent}
      />
    </div>
  )
}