import { useDragDropContext } from '@/contexts/DragDropContext'
import { cn } from '@/lib/utils'

interface DropLineProps {
  sectionId: string
  flowId: string
  index: number
  position: 'before' | 'after' | 'append'
  element: HTMLElement
}

export const DropLine = ({ sectionId, flowId, index, position, element }: DropLineProps) => {
  const { dragState } = useDragDropContext()

  const isActiveDropTarget = dragState.isDragging && 
    dragState.dropTarget &&
    dragState.dropTarget.sectionId === sectionId &&
    dragState.dropTarget.flowId === flowId &&
    dragState.dropTarget.index === index &&
    dragState.dropTarget.position === position &&
    dragState.canDrop

  if (!isActiveDropTarget) {
    return null
  }

  const rect = element.getBoundingClientRect()
  let lineStyle: React.CSSProperties = {}

  switch (position) {
    case 'before':
      lineStyle = {
        left: rect.left,
        top: rect.top - 2,
        width: rect.width,
        height: 4
      }
      break
    case 'after':
      lineStyle = {
        left: rect.left,
        top: rect.bottom - 2,
        width: rect.width,
        height: 4
      }
      break
    case 'append':
      lineStyle = {
        left: rect.left,
        top: rect.bottom + 8,
        width: rect.width,
        height: 4
      }
      break
  }

  return (
    <div
      className={cn(
        'fixed z-40 pointer-events-none',
        'bg-primary rounded-full',
        'animate-pulse'
      )}
      style={lineStyle}
    />
  )
}