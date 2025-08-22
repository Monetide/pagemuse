import { useState, useRef, useEffect } from 'react'
import { useDragDropContext } from '@/contexts/DragDropContext'
import { cn } from '@/lib/utils'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface BlockInsertionHotspotsProps {
  blockId: string
  sectionId: string
  flowId: string
  index: number
  element: HTMLElement
  onDrop: (position: 'before' | 'after') => void
}

export const BlockInsertionHotspots = ({
  blockId,
  sectionId,
  flowId,
  index,
  element,
  onDrop
}: BlockInsertionHotspotsProps) => {
  const { dragState, updateDrag } = useDragDropContext()
  const [hoveredSpot, setHoveredSpot] = useState<'before' | 'after' | null>(null)
  const hotspotsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!dragState.isDragging) {
      setHoveredSpot(null)
    }
  }, [dragState.isDragging])

  if (!dragState.isDragging || !dragState.dragData) {
    return null
  }

  const rect = element.getBoundingClientRect()
  const hotspotHeight = 24

  const handleMouseEnter = (position: 'before' | 'after') => {
    setHoveredSpot(position)
    
    // Check if this block type can be dropped here
    const canDrop = canDropBlockType(dragState.dragData.blockType, element)
    
    updateDrag(
      dragState.ghostPosition || { x: 0, y: 0 },
      {
        sectionId,
        flowId,
        index,
        position,
        element
      },
      canDrop
    )
  }

  const handleMouseLeave = () => {
    setHoveredSpot(null)
  }

  const handleDrop = (e: React.DragEvent, position: 'before' | 'after') => {
    e.preventDefault()
    e.stopPropagation()
    
    if (dragState.canDrop) {
      onDrop(position)
    }
  }

  return (
    <div
      ref={hotspotsRef}
      className="absolute left-0 w-full z-30 pointer-events-none"
      style={{
        top: rect.top - hotspotHeight / 2,
        height: rect.height + hotspotHeight
      }}
    >
      {/* Before hotspot */}
      <div
        className={cn(
          'absolute left-0 w-full pointer-events-auto cursor-pointer',
          'flex items-center justify-center',
          'transition-all duration-150',
          hoveredSpot === 'before' 
            ? 'bg-primary/10 border-2 border-primary border-dashed' 
            : 'hover:bg-muted/50'
        )}
        style={{
          height: hotspotHeight,
          top: 0
        }}
        onMouseEnter={() => handleMouseEnter('before')}
        onMouseLeave={handleMouseLeave}
        onDrop={(e) => handleDrop(e, 'before')}
        onDragOver={(e) => e.preventDefault()}
      >
        {hoveredSpot === 'before' && (
          <div className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs font-medium flex items-center gap-1">
            <ChevronUp className="h-3 w-3" />
            Insert Above
          </div>
        )}
      </div>

      {/* After hotspot */}
      <div
        className={cn(
          'absolute left-0 w-full pointer-events-auto cursor-pointer',
          'flex items-center justify-center',
          'transition-all duration-150',
          hoveredSpot === 'after' 
            ? 'bg-primary/10 border-2 border-primary border-dashed' 
            : 'hover:bg-muted/50'
        )}
        style={{
          height: hotspotHeight,
          bottom: 0
        }}
        onMouseEnter={() => handleMouseEnter('after')}
        onMouseLeave={handleMouseLeave}
        onDrop={(e) => handleDrop(e, 'after')}
        onDragOver={(e) => e.preventDefault()}
      >
        {hoveredSpot === 'after' && (
          <div className="bg-primary text-primary-foreground rounded px-2 py-1 text-xs font-medium flex items-center gap-1">
            <ChevronDown className="h-3 w-3" />
            Insert Below
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to check if a block type can be dropped on a target
function canDropBlockType(blockType?: string, targetElement?: HTMLElement): boolean {
  if (!blockType || !targetElement) return false
  
  // Check if target is a table cell
  const isTableCell = targetElement.closest('[data-block-type="table"]')
  if (isTableCell) {
    // Only allow text blocks in table cells
    return ['heading', 'paragraph', 'quote', 'unordered-list', 'ordered-list'].includes(blockType)
  }
  
  // Check for other constraints
  const atomicBlocks = ['figure', 'table']
  if (atomicBlocks.includes(blockType)) {
    // Atomic blocks can't be nested inside other blocks
    const parentBlock = targetElement.closest('[data-block-type]')
    return !parentBlock || !atomicBlocks.includes(parentBlock.getAttribute('data-block-type') || '')
  }
  
  return true
}