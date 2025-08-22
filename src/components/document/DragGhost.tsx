import { useDragDropContext } from '@/contexts/DragDropContext'
import { Block } from '@/lib/document-model'
import { cn } from '@/lib/utils'
import { 
  Type, 
  AlignLeft, 
  Quote, 
  List, 
  ListOrdered, 
  Image, 
  Table, 
  Link, 
  Minus, 
  Move,
  FileText
} from 'lucide-react'

const getBlockIcon = (blockType: Block['type']) => {
  switch (blockType) {
    case 'heading': return Type
    case 'paragraph': return AlignLeft
    case 'quote': return Quote
    case 'unordered-list': return List
    case 'ordered-list': return ListOrdered
    case 'figure': return Image
    case 'table': return Table
    case 'cross-reference': return Link
    case 'divider': return Minus
    case 'spacer': return Move
    default: return FileText
  }
}

const getBlockLabel = (blockType: Block['type']) => {
  switch (blockType) {
    case 'heading': return 'Heading'
    case 'paragraph': return 'Paragraph'
    case 'quote': return 'Quote'
    case 'unordered-list': return 'Bullet List'
    case 'ordered-list': return 'Numbered List'
    case 'figure': return 'Figure'
    case 'table': return 'Table'
    case 'cross-reference': return 'Cross Reference'
    case 'divider': return 'Divider'
    case 'spacer': return 'Spacer'
    default: return 'Block'
  }
}

export const DragGhost = () => {
  const { dragState } = useDragDropContext()

  if (!dragState.isDragging || !dragState.ghostPosition || !dragState.dragData) {
    return null
  }

  const { ghostPosition, dragData, canDrop } = dragState
  
  // Get block type for icon and label
  const blockType = dragData.blockType || 'paragraph'
  const Icon = getBlockIcon(blockType)
  const label = getBlockLabel(blockType)

  return (
    <div
      className={cn(
        'fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-1/2',
        'bg-background border rounded-lg shadow-lg px-3 py-2 flex items-center gap-2',
        'transition-opacity duration-150',
        canDrop ? 'opacity-90' : 'opacity-50'
      )}
      style={{
        left: ghostPosition.x,
        top: ghostPosition.y
      }}
    >
      <Icon className={cn(
        'h-4 w-4',
        canDrop ? 'text-primary' : 'text-muted-foreground'
      )} />
      <span className={cn(
        'text-sm font-medium',
        canDrop ? 'text-foreground' : 'text-muted-foreground'
      )}>
        {label}
      </span>
    </div>
  )
}